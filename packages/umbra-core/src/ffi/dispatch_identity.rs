//! Identity dispatch handlers.

use super::dispatcher::{err, json_parse, ok_json, ok_success, require_str, DResult};
use super::state::get_state;
use base64::Engine as _;
use crate::identity::{Identity, ProfileUpdate, RecoveryPhrase};
use sha2::Digest;

pub fn identity_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let name = require_str(&data, "display_name")?;
    let state = get_state().map_err(|e| err(100, e))?;

    match Identity::create(name.to_string()) {
        Ok((identity, recovery_phrase)) => {
            let did = identity.did_string();
            let phrase = recovery_phrase.phrase();

            // Retain seed for backup key derivation
            let seed = recovery_phrase
                .to_seed()
                .map_err(|e| err(203, format!("Seed derivation failed: {}", e)))?;

            let mut s = state.write();
            s.identity = Some(identity);
            s.backup_seed = Some(seed);

            ok_json(serde_json::json!({ "did": did, "recovery_phrase": phrase }))
        }
        Err(e) => Err(err(e.code(), e)),
    }
}

pub fn identity_restore(args: &str) -> DResult {
    let data = json_parse(args)?;
    let phrase_str = require_str(&data, "recovery_phrase")?;
    let name = require_str(&data, "display_name")?;
    let state = get_state().map_err(|e| err(100, e))?;

    let recovery = RecoveryPhrase::from_phrase(phrase_str)
        .map_err(|e| err(202, format!("Invalid recovery phrase: {}", e)))?;

    // Retain seed for backup key derivation
    let seed = recovery
        .to_seed()
        .map_err(|e| err(203, format!("Seed derivation failed: {}", e)))?;

    match Identity::from_recovery_phrase(&recovery, name.to_string()) {
        Ok(identity) => {
            let did = identity.did_string();
            let mut s = state.write();
            s.identity = Some(identity);
            s.backup_seed = Some(seed);
            Ok(did)
        }
        Err(e) => Err(err(e.code(), e)),
    }
}

pub fn identity_get_did() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    match &state.identity {
        Some(id) => Ok(id.did_string()),
        None => Err(err(200, "No identity loaded")),
    }
}

pub fn identity_get_profile() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let id = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let p = id.profile();
    ok_json(serde_json::json!({
        "did": id.did_string(), "display_name": p.display_name,
        "status": p.status, "avatar": p.avatar,
        "signing_key": hex::encode(&id.keypair().signing.public_bytes()),
        "encryption_key": hex::encode(&id.keypair().encryption.public_bytes()),
    }))
}

pub fn identity_update_profile(args: &str) -> DResult {
    let updates = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let mut state = state.write();
    let id = state
        .identity
        .as_mut()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let profile = id.profile_mut();

    if let Some(n) = updates.get("display_name").and_then(|v| v.as_str()) {
        profile
            .apply_update(ProfileUpdate::DisplayName(n.to_string()))
            .map_err(|e| err(205, e))?;
    }
    if let Some(s) = updates.get("status") {
        let sv = if s.is_null() {
            None
        } else {
            s.as_str().map(|x| x.to_string())
        };
        profile
            .apply_update(ProfileUpdate::Status(sv))
            .map_err(|e| err(205, e))?;
    }
    if let Some(a) = updates.get("avatar") {
        let av = if a.is_null() {
            None
        } else {
            a.as_str().map(|x| x.to_string())
        };
        profile
            .apply_update(ProfileUpdate::Avatar(av))
            .map_err(|e| err(205, e))?;
    }
    ok_success()
}

pub fn identity_rotate_encryption_key() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let mut state = state.write();

    // Clone the database Arc before taking a mutable borrow on identity
    let database = state
        .database
        .clone()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let identity = state
        .identity
        .as_mut()
        .ok_or_else(|| err(200, "No identity loaded"))?;

    let our_did = identity.did_string();

    // Generate new encryption key (random, not mnemonic-derived)
    let new_pub_key = identity
        .rotate_encryption_key()
        .map_err(|e| err(300, format!("Key rotation failed: {}", e)))?;
    let new_pub_hex = hex::encode(new_pub_key);

    // Sign the new public key so recipients can verify authenticity
    let signature = crate::crypto::sign(&identity.keypair().signing, &new_pub_key);
    let signature_hex = hex::encode(signature.as_bytes());

    // Build relay envelopes for all friends
    let friends = database
        .get_all_friends()
        .map_err(|e| err(e.code(), format!("Failed to get friends: {}", e)))?;

    let timestamp = crate::time::now_timestamp();
    let mut relay_messages = Vec::new();

    for friend in &friends {
        let envelope = serde_json::json!({
            "envelope": "key_rotation",
            "version": 1,
            "payload": {
                "fromDid": our_did,
                "newEncryptionKey": new_pub_hex,
                "signature": signature_hex,
                "timestamp": timestamp,
            }
        });
        relay_messages.push(serde_json::json!({
            "toDid": friend.did,
            "payload": envelope.to_string(),
        }));
    }

    super::dispatcher::emit_event(
        "identity",
        &serde_json::json!({
            "type": "encryptionKeyRotated",
            "newEncryptionKey": new_pub_hex,
            "timestamp": timestamp,
        }),
    );

    ok_json(serde_json::json!({
        "newEncryptionKey": new_pub_hex,
        "relayMessages": relay_messages,
        "friendCount": friends.len(),
    }))
}

pub fn account_create_backup(args: &str) -> DResult {
    let _data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state_r = state.read();

    let identity = state_r
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state_r
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let seed = state_r
        .backup_seed
        .as_ref()
        .ok_or_else(|| err(200, "Backup seed not available"))?;

    // 1. Derive backup key
    let backup_key = crate::crypto::derive_backup_key(seed)
        .map_err(|e| err(300, format!("Key derivation failed: {}", e)))?;

    // 2. Export database
    let export_bytes = database
        .export_database()
        .map_err(|e| err(400, format!("Database export failed: {}", e)))?;

    // 3. Compress
    let compressed = miniz_oxide::deflate::compress_to_vec(&export_bytes, 6);

    // 4. Encrypt
    let enc_key = crate::crypto::EncryptionKey::from_bytes(backup_key);
    let (nonce, encrypted) = crate::crypto::encrypt(&enc_key, &compressed, b"umbra-backup")
        .map_err(|e| err(300, format!("Encryption failed: {}", e)))?;

    let total_size = encrypted.len();

    // 5. Chunk
    const CHUNK_SIZE: usize = 64 * 1024;
    let chunks: Vec<&[u8]> = encrypted.chunks(CHUNK_SIZE).collect();
    let total_chunks = chunks.len();
    let own_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();
    let backup_id = format!("backup-{}", timestamp);

    // 6. Build relay envelopes
    let mut relay_messages = Vec::new();

    let manifest_envelope = serde_json::json!({
        "envelope": "account_backup_manifest",
        "version": 1,
        "payload": {
            "backupId": backup_id,
            "senderDid": own_did,
            "totalChunks": total_chunks,
            "totalSize": total_size,
            "nonce": hex::encode(nonce.as_bytes()),
            "timestamp": timestamp,
        }
    });
    relay_messages.push(serde_json::json!({
        "to_did": own_did,
        "payload": manifest_envelope.to_string(),
    }));

    for (i, chunk) in chunks.iter().enumerate() {
        let chunk_hash = hex::encode(sha2::Sha256::digest(chunk));
        let chunk_envelope = serde_json::json!({
            "envelope": "account_backup_chunk",
            "version": 1,
            "payload": {
                "backupId": backup_id,
                "chunkIndex": i,
                "totalChunks": total_chunks,
                "data": base64::engine::general_purpose::STANDARD.encode(chunk),
                "hash": chunk_hash,
            }
        });
        relay_messages.push(serde_json::json!({
            "to_did": own_did,
            "payload": chunk_envelope.to_string(),
        }));
    }

    ok_json(serde_json::json!({
        "relayMessages": relay_messages,
        "chunkCount": total_chunks,
        "totalSize": total_size,
    }))
}

pub fn account_restore_backup(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state_r = state.read();

    let database = state_r
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let seed = state_r
        .backup_seed
        .as_ref()
        .ok_or_else(|| err(200, "Backup seed not available"))?;

    let chunks = data["chunks"]
        .as_array()
        .ok_or_else(|| err(902, "Missing chunks array"))?;
    let nonce_hex = data["nonce"]
        .as_str()
        .ok_or_else(|| err(902, "Missing nonce"))?;

    // 1. Derive backup key
    let backup_key = crate::crypto::derive_backup_key(seed)
        .map_err(|e| err(300, format!("Key derivation failed: {}", e)))?;

    // 2. Reassemble chunks
    let mut encrypted = Vec::new();
    for chunk_val in chunks {
        let chunk_b64 = chunk_val
            .as_str()
            .ok_or_else(|| err(902, "Chunk must be a string"))?;
        let chunk_bytes = base64::engine::general_purpose::STANDARD
            .decode(chunk_b64)
            .map_err(|e| err(902, format!("Invalid base64: {}", e)))?;
        encrypted.extend_from_slice(&chunk_bytes);
    }

    // 3. Decrypt
    let enc_key = crate::crypto::EncryptionKey::from_bytes(backup_key);
    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| err(902, format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(err(902, "Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce::from_bytes(nonce_arr);
    let compressed = crate::crypto::decrypt(&enc_key, &nonce, &encrypted, b"umbra-backup")
        .map_err(|e| err(301, format!("Decryption failed: {}", e)))?;

    // 4. Decompress
    let decompressed = miniz_oxide::inflate::decompress_to_vec(&compressed)
        .map_err(|e| err(903, format!("Decompression failed: {:?}", e)))?;

    // 5. Import
    let stats = database
        .import_database(&decompressed)
        .map_err(|e| err(400, format!("Import failed: {}", e)))?;

    ok_json(serde_json::json!({
        "imported": {
            "settings": stats.settings,
            "friends": stats.friends,
            "conversations": stats.conversations,
            "groups": stats.groups,
            "blocked_users": stats.blocked_users,
        }
    }))
}
