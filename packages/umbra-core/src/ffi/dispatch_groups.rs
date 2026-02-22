//! Groups dispatch handlers — CRUD, encryption, invitations, messaging.

use super::dispatcher::{emit_event, err, json_parse, ok_json, require_str, DResult};
use super::state::get_state;

// ── Helper: derive a key-wrapping key from the identity's encryption secret ──

fn derive_key_wrapping_key(identity: &crate::identity::Identity) -> [u8; 32] {
    use hkdf::Hkdf;
    use sha2::Sha256;
    let ikm = identity.keypair().encryption.secret_bytes();
    let hkdf = Hkdf::<Sha256>::new(None, &ikm);
    let mut key = [0u8; 32];
    hkdf.expand(b"umbra-group-key-wrapping-v1", &mut key)
        .expect("HKDF-SHA256 expansion should not fail for 32 bytes");
    key
}

// ── Helper: decrypt a stored group key using the wrapping key ─────────────────

fn decrypt_stored_group_key(
    identity: &crate::identity::Identity,
    key_record: &crate::storage::GroupKeyRecord,
    group_id: &str,
) -> Result<[u8; 32], (i32, String)> {
    let stored = &key_record.encrypted_key;
    if stored.len() < 12 {
        return Err(err(704, "Invalid stored key format"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&stored[..12]);
    let nonce = crate::crypto::Nonce(nonce_arr);
    let encrypted = &stored[12..];

    let wrapping_key = derive_key_wrapping_key(identity);
    let wrap_enc_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);

    let aad = format!("group-key:{}:{}", group_id, key_record.key_version);
    let raw = crate::crypto::decrypt(&wrap_enc_key, &nonce, encrypted, aad.as_bytes())
        .map_err(|e| err(704, format!("Failed to decrypt group key: {}", e)))?;
    if raw.len() != 32 {
        return Err(err(704, "Decrypted group key is not 32 bytes"));
    }
    let mut key = [0u8; 32];
    key.copy_from_slice(&raw);
    Ok(key)
}

// ── Helper: encrypt a group key for a member via ECDH ─────────────────────────

fn encrypt_group_key_for_member(
    identity: &crate::identity::Identity,
    database: &crate::storage::Database,
    group_id: &str,
    member_did: &str,
    raw_key: &[u8; 32],
    key_version: i32,
) -> Result<(String, String), (i32, String)> {
    let member = database
        .get_friend(member_did)
        .map_err(|e| err(704, format!("DB error: {}", e)))?
        .ok_or_else(|| err(704, format!("Member {} not found in friends", member_did)))?;

    let member_enc_bytes =
        hex::decode(&member.encryption_key).map_err(|e| err(704, format!("Invalid key: {}", e)))?;
    if member_enc_bytes.len() != 32 {
        return Err(err(704, "Member encryption key must be 32 bytes"));
    }
    let mut member_enc_key = [0u8; 32];
    member_enc_key.copy_from_slice(&member_enc_bytes);

    let aad = format!("group-key-transfer:{}:{}", group_id, key_version);
    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &member_enc_key,
        group_id.as_bytes(),
        raw_key,
        aad.as_bytes(),
    )
    .map_err(|e| err(704, format!("Encryption failed: {}", e)))?;

    Ok((hex::encode(&ciphertext), hex::encode(&nonce.0)))
}

// ── Helper: generate a new group key, wrap it, and store it ───────────────────

fn generate_and_store_group_key(
    identity: &crate::identity::Identity,
    database: &crate::storage::Database,
    group_id: &str,
    key_version: i32,
) -> Result<[u8; 32], (i32, String)> {
    use rand::RngCore;

    let mut raw_key = [0u8; 32];
    rand::rngs::OsRng.fill_bytes(&mut raw_key);

    let wrapping_key = derive_key_wrapping_key(identity);
    let wrap_enc_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);

    let aad = format!("group-key:{}:{}", group_id, key_version);
    let (nonce, ciphertext) = crate::crypto::encrypt(&wrap_enc_key, &raw_key, aad.as_bytes())
        .map_err(|e| err(704, format!("Key encryption failed: {}", e)))?;

    let mut stored = Vec::with_capacity(12 + ciphertext.len());
    stored.extend_from_slice(&nonce.0);
    stored.extend_from_slice(&ciphertext);

    let now = crate::time::now_timestamp_millis();
    database
        .store_group_key(group_id, key_version, &stored, now)
        .map_err(|e| err(400, format!("Failed to store group key: {}", e)))?;

    Ok(raw_key)
}

// ============================================================================
// 1. groups_create
// ============================================================================

pub fn groups_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let name = require_str(&data, "name")?;
    let description = data["description"].as_str();

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let our_did = identity.did_string();
    let display_name = identity.profile().display_name.clone();
    let group_id = uuid::Uuid::new_v4().to_string();
    let conv_id = format!("group-{}", group_id);
    let now = crate::time::now_timestamp_millis();

    database
        .create_group(&group_id, name, description, &our_did, now)
        .map_err(|e| err(400, format!("Failed to create group: {}", e)))?;

    database
        .add_group_member(&group_id, &our_did, Some(&display_name), "admin", now)
        .map_err(|e| err(400, format!("Failed to add self as admin: {}", e)))?;

    database
        .create_group_conversation(&conv_id, &group_id)
        .map_err(|e| err(400, format!("Failed to create conversation: {}", e)))?;

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "group_created",
            "group_id": group_id,
            "name": name,
        }),
    );

    ok_json(serde_json::json!({
        "group_id": group_id,
        "conversation_id": conv_id,
        "name": name,
        "created_by": our_did,
        "created_at": now,
    }))
}

// ============================================================================
// 2. groups_get
// ============================================================================

pub fn groups_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let group = database
        .get_group(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(404, format!("Group not found: {}", group_id)))?;

    ok_json(serde_json::json!({
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "avatar": group.avatar,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
    }))
}

// ============================================================================
// 3. groups_list
// ============================================================================

pub fn groups_list() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let groups = database
        .get_all_groups()
        .map_err(|e| err(400, format!("DB error: {}", e)))?;

    let arr: Vec<serde_json::Value> = groups
        .iter()
        .map(|g| {
            serde_json::json!({
                "id": g.id,
                "name": g.name,
                "description": g.description,
                "avatar": g.avatar,
                "created_by": g.created_by,
                "created_at": g.created_at,
                "updated_at": g.updated_at,
            })
        })
        .collect();

    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ============================================================================
// 4. groups_update
// ============================================================================

pub fn groups_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let name = require_str(&data, "name")?;
    let description = data["description"].as_str();
    let now = crate::time::now_timestamp_millis();

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    database
        .update_group(group_id, name, description, now)
        .map_err(|e| err(400, format!("Failed to update group: {}", e)))?;

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "group_updated",
            "group_id": group_id,
        }),
    );

    ok_json(serde_json::json!({
        "group_id": group_id,
        "updated_at": now,
    }))
}

// ============================================================================
// 5. groups_delete
// ============================================================================

pub fn groups_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    // Verify the caller is admin
    let our_did = identity.did_string();
    let members = database
        .get_group_members(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;
    let is_admin = members
        .iter()
        .any(|m| m.member_did == our_did && m.role == "admin");
    if !is_admin {
        return Err(err(403, "Only group admins can delete a group"));
    }

    database
        .delete_group(group_id)
        .map_err(|e| err(400, format!("Failed to delete group: {}", e)))?;

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "group_deleted",
            "group_id": group_id,
        }),
    );

    ok_json(serde_json::json!({ "group_id": group_id }))
}

// ============================================================================
// 6. groups_add_member
// ============================================================================

pub fn groups_add_member(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let did = require_str(&data, "did")?;
    let display_name = data["display_name"].as_str();
    let now = crate::time::now_timestamp_millis();

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    database
        .add_group_member(group_id, did, display_name, "member", now)
        .map_err(|e| err(400, format!("Failed to add member: {}", e)))?;

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "member_added",
            "group_id": group_id,
            "member_did": did,
        }),
    );

    ok_json(serde_json::json!({
        "group_id": group_id,
        "member_did": did,
    }))
}

// ============================================================================
// 7. groups_remove_member
// ============================================================================

pub fn groups_remove_member(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let did = require_str(&data, "did")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    database
        .remove_group_member(group_id, did)
        .map_err(|e| err(400, format!("Failed to remove member: {}", e)))?;

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "member_removed",
            "group_id": group_id,
            "member_did": did,
        }),
    );

    ok_json(serde_json::json!({
        "group_id": group_id,
        "member_did": did,
    }))
}

// ============================================================================
// 8. groups_get_members
// ============================================================================

pub fn groups_get_members(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let members = database
        .get_group_members(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;

    let arr: Vec<serde_json::Value> = members
        .iter()
        .map(|m| {
            serde_json::json!({
                "group_id": m.group_id,
                "member_did": m.member_did,
                "display_name": m.display_name,
                "role": m.role,
                "joined_at": m.joined_at,
            })
        })
        .collect();

    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ============================================================================
// 9. groups_generate_key
// ============================================================================

pub fn groups_generate_key(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let raw_key = generate_and_store_group_key(identity, database, group_id, 1)?;

    ok_json(serde_json::json!({
        "group_id": group_id,
        "key_version": 1,
        "raw_key_hex": hex::encode(&raw_key),
    }))
}

// ============================================================================
// 10. groups_rotate_key
// ============================================================================

pub fn groups_rotate_key(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let current = database
        .get_latest_group_key(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;
    let new_version = current.map(|k| k.key_version + 1).unwrap_or(1);

    let raw_key = generate_and_store_group_key(identity, database, group_id, new_version)?;

    ok_json(serde_json::json!({
        "group_id": group_id,
        "key_version": new_version,
        "raw_key_hex": hex::encode(&raw_key),
    }))
}

// ============================================================================
// 11. groups_import_key
// ============================================================================

pub fn groups_import_key(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let key_version = data["key_version"].as_i64().unwrap_or(1) as i32;
    let encrypted_key_hex = require_str(&data, "encrypted_key_hex")?;
    let nonce_hex = require_str(&data, "nonce_hex")?;
    let sender_did = require_str(&data, "sender_did")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    // Look up sender's encryption key
    let sender = database
        .get_friend(sender_did)
        .map_err(|e| err(704, format!("DB error: {}", e)))?
        .ok_or_else(|| err(704, format!("Sender {} not found in friends", sender_did)))?;

    let sender_enc_bytes = hex::decode(&sender.encryption_key)
        .map_err(|e| err(704, format!("Invalid sender key hex: {}", e)))?;
    if sender_enc_bytes.len() != 32 {
        return Err(err(704, "Sender encryption key must be 32 bytes"));
    }
    let mut sender_enc_key = [0u8; 32];
    sender_enc_key.copy_from_slice(&sender_enc_bytes);

    let encrypted_key = hex::decode(encrypted_key_hex)
        .map_err(|e| err(704, format!("Invalid encrypted_key hex: {}", e)))?;
    let nonce_bytes =
        hex::decode(nonce_hex).map_err(|e| err(704, format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(err(704, "Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    let aad = format!("group-key-transfer:{}:{}", group_id, key_version);
    let raw_key_vec = crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption,
        &sender_enc_key,
        group_id.as_bytes(),
        &nonce,
        &encrypted_key,
        aad.as_bytes(),
    )
    .map_err(|e| err(704, format!("Failed to decrypt group key: {}", e)))?;

    if raw_key_vec.len() != 32 {
        return Err(err(704, "Decrypted group key is not 32 bytes"));
    }
    let mut raw_key = [0u8; 32];
    raw_key.copy_from_slice(&raw_key_vec);

    // Re-encrypt with our own wrapping key and store
    let wrapping_key = derive_key_wrapping_key(identity);
    let wrap_enc_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);
    let wrap_aad = format!("group-key:{}:{}", group_id, key_version);
    let (wrap_nonce, ciphertext) =
        crate::crypto::encrypt(&wrap_enc_key, &raw_key, wrap_aad.as_bytes())
            .map_err(|e| err(704, format!("Re-encryption failed: {}", e)))?;

    let mut stored = Vec::with_capacity(12 + ciphertext.len());
    stored.extend_from_slice(&wrap_nonce.0);
    stored.extend_from_slice(&ciphertext);

    let now = crate::time::now_timestamp_millis();
    database
        .store_group_key(group_id, key_version, &stored, now)
        .map_err(|e| err(400, format!("Failed to store imported key: {}", e)))?;

    ok_json(serde_json::json!({
        "group_id": group_id,
        "key_version": key_version,
    }))
}

// ============================================================================
// 12. groups_encrypt_message
// ============================================================================

pub fn groups_encrypt_message(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let plaintext = require_str(&data, "plaintext")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let our_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();

    let key_record = database
        .get_latest_group_key(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(704, "No group key found"))?;

    let raw_key = decrypt_stored_group_key(identity, &key_record, group_id)?;
    let enc_key = crate::crypto::EncryptionKey::from_bytes(raw_key);

    let aad = format!("group-msg:{}:{}:{}", group_id, our_did, timestamp);
    let (nonce, ciphertext) =
        crate::crypto::encrypt(&enc_key, plaintext.as_bytes(), aad.as_bytes())
            .map_err(|e| err(704, format!("Encryption failed: {}", e)))?;

    ok_json(serde_json::json!({
        "ciphertext_hex": hex::encode(&ciphertext),
        "nonce_hex": hex::encode(&nonce.0),
        "key_version": key_record.key_version,
        "timestamp": timestamp,
    }))
}

// ============================================================================
// 13. groups_decrypt_message
// ============================================================================

pub fn groups_decrypt_message(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let ciphertext_hex = require_str(&data, "ciphertext_hex")?;
    let nonce_hex = require_str(&data, "nonce_hex")?;
    let sender_did = require_str(&data, "sender_did")?;
    let timestamp = data["timestamp"]
        .as_i64()
        .ok_or_else(|| err(2, "Missing timestamp"))?;
    let key_version = data["key_version"].as_i64();

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let key_record = if let Some(ver) = key_version {
        database
            .get_group_key(group_id, ver as i32)
            .map_err(|e| err(400, format!("DB error: {}", e)))?
            .ok_or_else(|| err(704, format!("Group key version {} not found", ver)))?
    } else {
        database
            .get_latest_group_key(group_id)
            .map_err(|e| err(400, format!("DB error: {}", e)))?
            .ok_or_else(|| err(704, "No group key found"))?
    };

    let raw_key = decrypt_stored_group_key(identity, &key_record, group_id)?;
    let enc_key = crate::crypto::EncryptionKey::from_bytes(raw_key);

    let ciphertext = hex::decode(ciphertext_hex)
        .map_err(|e| err(704, format!("Invalid ciphertext hex: {}", e)))?;
    let nonce_bytes =
        hex::decode(nonce_hex).map_err(|e| err(704, format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(err(704, "Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    let aad = format!("group-msg:{}:{}:{}", group_id, sender_did, timestamp);
    let plaintext = crate::crypto::decrypt(&enc_key, &nonce, &ciphertext, aad.as_bytes())
        .map_err(|e| err(704, format!("Decryption failed: {}", e)))?;

    let text =
        String::from_utf8(plaintext).map_err(|e| err(704, format!("Invalid UTF-8: {}", e)))?;

    ok_json(serde_json::json!(text))
}

// ============================================================================
// 14. groups_encrypt_key_for_member
// ============================================================================

pub fn groups_encrypt_key_for_member_handler(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let raw_key_hex = require_str(&data, "raw_key_hex")?;
    let key_version = data["key_version"].as_i64().unwrap_or(1) as i32;
    let member_did = require_str(&data, "member_did")?;

    let raw_key_bytes =
        hex::decode(raw_key_hex).map_err(|e| err(704, format!("Invalid raw_key hex: {}", e)))?;
    if raw_key_bytes.len() != 32 {
        return Err(err(704, "Raw key must be 32 bytes"));
    }
    let mut raw_key = [0u8; 32];
    raw_key.copy_from_slice(&raw_key_bytes);

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let (encrypted_key_hex, nonce_hex) = encrypt_group_key_for_member(
        identity,
        database,
        group_id,
        member_did,
        &raw_key,
        key_version,
    )?;

    ok_json(serde_json::json!({
        "encrypted_key_hex": encrypted_key_hex,
        "nonce_hex": nonce_hex,
    }))
}

// ============================================================================
// 15. groups_store_invite
// ============================================================================

pub fn groups_store_invite(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let group_id = require_str(&data, "group_id")?;
    let group_name = require_str(&data, "group_name")?;
    let description = data["description"].as_str().map(|s| s.to_string());
    let inviter_did = require_str(&data, "inviter_did")?;
    let inviter_name = require_str(&data, "inviter_name")?;
    let encrypted_group_key = require_str(&data, "encrypted_group_key")?;
    let nonce = require_str(&data, "nonce")?;
    let members_json = data["members_json"].as_str().unwrap_or("[]");
    let status = data["status"].as_str().unwrap_or("pending");
    let created_at = data["created_at"]
        .as_i64()
        .unwrap_or_else(crate::time::now_timestamp_millis);

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let invite = crate::storage::GroupInviteRecord {
        id: id.to_string(),
        group_id: group_id.to_string(),
        group_name: group_name.to_string(),
        description,
        inviter_did: inviter_did.to_string(),
        inviter_name: inviter_name.to_string(),
        encrypted_group_key: encrypted_group_key.to_string(),
        nonce: nonce.to_string(),
        members_json: members_json.to_string(),
        status: status.to_string(),
        created_at,
    };

    database
        .store_group_invite(&invite)
        .map_err(|e| err(400, format!("Failed to store invite: {}", e)))?;

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "invite_received",
            "invite_id": id,
            "group_id": group_id,
        }),
    );

    ok_json(serde_json::json!({"ok": true}))
}

// ============================================================================
// 16. groups_get_pending_invites
// ============================================================================

pub fn groups_get_pending_invites() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let invites = database
        .get_pending_group_invites()
        .map_err(|e| err(400, format!("DB error: {}", e)))?;

    let arr: Vec<serde_json::Value> = invites
        .iter()
        .map(|inv| {
            serde_json::json!({
                "id": inv.id,
                "group_id": inv.group_id,
                "group_name": inv.group_name,
                "description": inv.description,
                "inviter_did": inv.inviter_did,
                "inviter_name": inv.inviter_name,
                "encrypted_group_key": inv.encrypted_group_key,
                "nonce": inv.nonce,
                "members_json": inv.members_json,
                "status": inv.status,
                "created_at": inv.created_at,
            })
        })
        .collect();

    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ============================================================================
// 17. groups_accept_invite
// ============================================================================

pub fn groups_accept_invite(args: &str) -> DResult {
    let data = json_parse(args)?;
    let invite_id = require_str(&data, "invite_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let invite = database
        .get_group_invite(invite_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(404, format!("Invite not found: {}", invite_id)))?;

    let our_did = identity.did_string();
    let display_name = identity.profile().display_name.clone();
    let now = crate::time::now_timestamp_millis();
    let group_id = &invite.group_id;
    let conv_id = format!("group-{}", group_id);

    // Import the group key from the invite
    let sender = database
        .get_friend(&invite.inviter_did)
        .map_err(|e| err(704, format!("DB error: {}", e)))?
        .ok_or_else(|| {
            err(
                704,
                format!("Inviter {} not found in friends", invite.inviter_did),
            )
        })?;

    let sender_enc_bytes = hex::decode(&sender.encryption_key)
        .map_err(|e| err(704, format!("Invalid inviter key hex: {}", e)))?;
    if sender_enc_bytes.len() != 32 {
        return Err(err(704, "Inviter encryption key must be 32 bytes"));
    }
    let mut sender_enc_key = [0u8; 32];
    sender_enc_key.copy_from_slice(&sender_enc_bytes);

    let encrypted_key = hex::decode(&invite.encrypted_group_key)
        .map_err(|e| err(704, format!("Invalid encrypted_group_key hex: {}", e)))?;
    let nonce_bytes =
        hex::decode(&invite.nonce).map_err(|e| err(704, format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(err(704, "Invite nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    let aad = format!("group-key-transfer:{}:1", group_id);
    let raw_key_vec = crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption,
        &sender_enc_key,
        group_id.as_bytes(),
        &nonce,
        &encrypted_key,
        aad.as_bytes(),
    )
    .map_err(|e| err(704, format!("Failed to decrypt invite key: {}", e)))?;

    if raw_key_vec.len() != 32 {
        return Err(err(704, "Decrypted group key is not 32 bytes"));
    }
    let mut raw_key = [0u8; 32];
    raw_key.copy_from_slice(&raw_key_vec);

    // Re-encrypt with own wrapping key and store
    let wrapping_key = derive_key_wrapping_key(identity);
    let wrap_enc_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);
    let wrap_aad = format!("group-key:{}:1", group_id);
    let (wrap_nonce, ciphertext) =
        crate::crypto::encrypt(&wrap_enc_key, &raw_key, wrap_aad.as_bytes())
            .map_err(|e| err(704, format!("Re-encryption failed: {}", e)))?;

    let mut stored = Vec::with_capacity(12 + ciphertext.len());
    stored.extend_from_slice(&wrap_nonce.0);
    stored.extend_from_slice(&ciphertext);

    database
        .store_group_key(group_id, 1, &stored, now)
        .map_err(|e| err(400, format!("Failed to store imported key: {}", e)))?;

    // Create the group locally
    database
        .create_group(
            group_id,
            &invite.group_name,
            invite.description.as_deref(),
            &invite.inviter_did,
            now,
        )
        .map_err(|e| err(400, format!("Failed to create group: {}", e)))?;

    // Add self as member
    database
        .add_group_member(group_id, &our_did, Some(&display_name), "member", now)
        .map_err(|e| err(400, format!("Failed to add self: {}", e)))?;

    // Add existing members from invite
    let members: Vec<serde_json::Value> =
        serde_json::from_str(&invite.members_json).unwrap_or_default();
    for member in &members {
        if let Some(did) = member["did"].as_str() {
            if did != our_did {
                let mname = member["display_name"].as_str();
                let mrole = member["role"].as_str().unwrap_or("member");
                let _ = database.add_group_member(group_id, did, mname, mrole, now);
            }
        }
    }

    // Create conversation
    database
        .create_group_conversation(&conv_id, group_id)
        .map_err(|e| err(400, format!("Failed to create conversation: {}", e)))?;

    // Update invite status
    database
        .update_group_invite_status(invite_id, "accepted")
        .map_err(|e| err(400, format!("Failed to update invite: {}", e)))?;

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "invite_accepted",
            "invite_id": invite_id,
            "group_id": group_id,
        }),
    );

    ok_json(serde_json::json!({
        "group_id": group_id,
        "conversation_id": conv_id,
    }))
}

// ============================================================================
// 18. groups_decline_invite
// ============================================================================

pub fn groups_decline_invite(args: &str) -> DResult {
    let data = json_parse(args)?;
    let invite_id = require_str(&data, "invite_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    database
        .update_group_invite_status(invite_id, "declined")
        .map_err(|e| err(400, format!("Failed to decline invite: {}", e)))?;

    ok_json(serde_json::json!({"ok": true}))
}

// ============================================================================
// 19. groups_send_invite
// ============================================================================

pub fn groups_send_invite(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let member_did = require_str(&data, "member_did")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let our_did = identity.did_string();
    let display_name = identity.profile().display_name.clone();

    // Get group info
    let group = database
        .get_group(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(404, format!("Group not found: {}", group_id)))?;

    // Get and decrypt the latest group key
    let key_record = database
        .get_latest_group_key(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(704, "No group key found"))?;

    let raw_key = decrypt_stored_group_key(identity, &key_record, group_id)?;

    // Encrypt the key for the member
    let (encrypted_key_hex, nonce_hex) = encrypt_group_key_for_member(
        identity,
        database,
        group_id,
        member_did,
        &raw_key,
        key_record.key_version,
    )?;

    // Get current members
    let members = database
        .get_group_members(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;

    let members_arr: Vec<serde_json::Value> = members
        .iter()
        .map(|m| {
            serde_json::json!({
                "did": m.member_did,
                "display_name": m.display_name,
                "role": m.role,
            })
        })
        .collect();

    let invite_id = uuid::Uuid::new_v4().to_string();
    let timestamp = crate::time::now_timestamp_millis();

    let envelope = serde_json::json!({
        "envelope": "group_invite",
        "version": 1,
        "payload": {
            "invite_id": invite_id,
            "group_id": group_id,
            "group_name": group.name,
            "description": group.description,
            "inviter_did": our_did,
            "inviter_name": display_name,
            "encrypted_group_key": encrypted_key_hex,
            "nonce": nonce_hex,
            "key_version": key_record.key_version,
            "members": members_arr,
            "timestamp": timestamp,
        }
    });

    let relay_messages = vec![serde_json::json!({
        "to_did": member_did,
        "payload": envelope.to_string(),
    })];

    ok_json(serde_json::json!({
        "invite_id": invite_id,
        "relay_messages": relay_messages,
    }))
}

// ============================================================================
// 20. groups_build_invite_accept_envelope
// ============================================================================

pub fn groups_build_invite_accept_envelope(args: &str) -> DResult {
    let data = json_parse(args)?;
    let invite_id = require_str(&data, "invite_id")?;
    let group_id = require_str(&data, "group_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let invite = database
        .get_group_invite(invite_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(404, format!("Invite not found: {}", invite_id)))?;

    let our_did = identity.did_string();
    let display_name = identity.profile().display_name.clone();
    let timestamp = crate::time::now_timestamp_millis();

    let envelope = serde_json::json!({
        "envelope": "group_invite_accept",
        "version": 1,
        "payload": {
            "invite_id": invite_id,
            "group_id": group_id,
            "accepter_did": our_did,
            "accepter_name": display_name,
            "timestamp": timestamp,
        }
    });

    let relay_messages = vec![serde_json::json!({
        "to_did": invite.inviter_did,
        "payload": envelope.to_string(),
    })];

    ok_json(serde_json::json!({
        "relay_messages": relay_messages,
    }))
}

// ============================================================================
// 21. groups_build_invite_decline_envelope
// ============================================================================

pub fn groups_build_invite_decline_envelope(args: &str) -> DResult {
    let data = json_parse(args)?;
    let invite_id = require_str(&data, "invite_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let invite = database
        .get_group_invite(invite_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(404, format!("Invite not found: {}", invite_id)))?;

    let our_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();

    let envelope = serde_json::json!({
        "envelope": "group_invite_decline",
        "version": 1,
        "payload": {
            "invite_id": invite_id,
            "group_id": invite.group_id,
            "decliner_did": our_did,
            "timestamp": timestamp,
        }
    });

    let relay_messages = vec![serde_json::json!({
        "to_did": invite.inviter_did,
        "payload": envelope.to_string(),
    })];

    ok_json(serde_json::json!({
        "relay_messages": relay_messages,
    }))
}

// ============================================================================
// 22. groups_send_message
// ============================================================================

pub fn groups_send_message(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let text = require_str(&data, "text")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let our_did = identity.did_string();
    let msg_id = uuid::Uuid::new_v4().to_string();
    let timestamp = crate::time::now_timestamp_millis();

    // Encrypt with group key
    let key_record = database
        .get_latest_group_key(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(704, "No group key found"))?;

    let raw_key = decrypt_stored_group_key(identity, &key_record, group_id)?;
    let enc_key = crate::crypto::EncryptionKey::from_bytes(raw_key);

    let aad = format!("group-msg:{}:{}:{}", group_id, our_did, timestamp);
    let (nonce, ciphertext) = crate::crypto::encrypt(&enc_key, text.as_bytes(), aad.as_bytes())
        .map_err(|e| err(704, format!("Encryption failed: {}", e)))?;

    // Store locally
    database
        .store_message(
            &msg_id,
            conversation_id,
            &our_did,
            &ciphertext,
            &nonce.0,
            timestamp,
        )
        .map_err(|e| err(400, format!("Failed to store message: {}", e)))?;

    // Build relay envelopes for all members except self
    let members = database
        .get_group_members(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;

    let envelope = serde_json::json!({
        "envelope": "group_message",
        "version": 1,
        "payload": {
            "message_id": msg_id,
            "group_id": group_id,
            "conversation_id": conversation_id,
            "sender_did": our_did,
            "ciphertext_hex": hex::encode(&ciphertext),
            "nonce_hex": hex::encode(&nonce.0),
            "key_version": key_record.key_version,
            "timestamp": timestamp,
        }
    });
    let envelope_str = envelope.to_string();

    let relay_messages: Vec<serde_json::Value> = members
        .iter()
        .filter(|m| m.member_did != our_did)
        .map(|m| {
            serde_json::json!({
                "to_did": m.member_did,
                "payload": envelope_str,
            })
        })
        .collect();

    emit_event(
        "messaging",
        &serde_json::json!({
            "type": "messageSent",
            "message_id": msg_id,
            "conversation_id": conversation_id,
            "group_id": group_id,
        }),
    );

    ok_json(serde_json::json!({
        "message": {
            "id": msg_id,
            "conversationId": conversation_id,
            "senderDid": our_did,
            "timestamp": timestamp,
        },
        "relay_messages": relay_messages,
    }))
}

// ============================================================================
// 23. groups_remove_member_with_rotation
// ============================================================================

pub fn groups_remove_member_with_rotation(args: &str) -> DResult {
    let data = json_parse(args)?;
    let group_id = require_str(&data, "group_id")?;
    let member_did = require_str(&data, "member_did")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let our_did = identity.did_string();

    // Remove the member from DB
    database
        .remove_group_member(group_id, member_did)
        .map_err(|e| err(400, format!("Failed to remove member: {}", e)))?;

    // Generate a new key (rotation)
    let current = database
        .get_latest_group_key(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;
    let new_version = current.map(|k| k.key_version + 1).unwrap_or(1);

    let raw_key = generate_and_store_group_key(identity, database, group_id, new_version)?;

    // Get remaining members (after removal)
    let remaining_members = database
        .get_group_members(group_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;

    let mut relay_messages: Vec<serde_json::Value> = Vec::new();

    for member in &remaining_members {
        if member.member_did == our_did {
            continue;
        }

        // Encrypt new key for this member; skip if it fails (e.g. not in friends)
        let enc_result = encrypt_group_key_for_member(
            identity,
            database,
            group_id,
            &member.member_did,
            &raw_key,
            new_version,
        );

        match enc_result {
            Ok((encrypted_key_hex, nonce_hex)) => {
                // Key rotation envelope
                let key_envelope = serde_json::json!({
                    "envelope": "group_key_rotation",
                    "version": 1,
                    "payload": {
                        "group_id": group_id,
                        "key_version": new_version,
                        "encrypted_key": encrypted_key_hex,
                        "nonce": nonce_hex,
                        "sender_did": our_did,
                        "timestamp": crate::time::now_timestamp_millis(),
                    }
                });
                relay_messages.push(serde_json::json!({
                    "to_did": member.member_did,
                    "payload": key_envelope.to_string(),
                }));

                // Member removed notification envelope
                let removed_envelope = serde_json::json!({
                    "envelope": "group_member_removed",
                    "version": 1,
                    "payload": {
                        "group_id": group_id,
                        "removed_did": member_did,
                        "removed_by": our_did,
                        "timestamp": crate::time::now_timestamp_millis(),
                    }
                });
                relay_messages.push(serde_json::json!({
                    "to_did": member.member_did,
                    "payload": removed_envelope.to_string(),
                }));
            }
            Err(_) => {
                // Skip members we can't encrypt for (not in friends list, etc.)
                continue;
            }
        }
    }

    emit_event(
        "groups",
        &serde_json::json!({
            "type": "member_removed_with_rotation",
            "group_id": group_id,
            "removed_did": member_did,
            "new_key_version": new_version,
        }),
    );

    ok_json(serde_json::json!({
        "key_version": new_version,
        "relay_messages": relay_messages,
    }))
}
