//! Stub dispatch handlers for features that don't yet have full service-layer
//! backing or require platform-specific implementations (WebRTC, P2P relay, etc.).
//!
//! Methods here return `Err((501, "..."))` with a descriptive message.
//! As each domain is implemented, move the handler into the appropriate
//! dispatch_*.rs module and remove it from here.

use super::dispatcher::{DResult, err};

// ── Network / Relay ─────────────────────────────────────────────────────────
// Network status is available via c_api.rs `umbra_network_status`, but the
// dispatcher-routed version needs the same JSON shape the JS expects.
// Relay operations need the relay client wired into FFI state.

pub fn network_status() -> DResult {
    use super::state::get_state;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    match &state.network {
        Some(network) => {
            let addrs: Vec<String> = network.listen_addrs().iter().map(|a| a.to_string()).collect();
            let peers: Vec<String> = network.connected_peers().iter().map(|p| p.peer_id.to_string()).collect();
            super::dispatcher::ok_json(serde_json::json!({
                "started": network.is_running(),
                "peer_id": network.peer_id().to_string(),
                "listen_addresses": addrs,
                "connected_peers": peers,
            }))
        }
        None => super::dispatcher::ok_json(serde_json::json!({
            "started": false, "peer_id": null,
            "listen_addresses": [], "connected_peers": [],
        })),
    }
}

pub fn relay_connect(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let relay_url = require_str(&data, "relay_url")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let did = identity.did_string();

    let register_msg = serde_json::json!({
        "type": "register",
        "did": did,
    });

    ok_json(serde_json::json!({
        "connected": true,
        "relay_url": relay_url,
        "did": did,
        "register_message": register_msg.to_string(),
    }))
}

pub fn relay_create_session(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let relay_url = require_str(&data, "relay_url")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let did = identity.did_string();

    // On native (non-wasm), create a mock offer for direct P2P
    let offer_json = serde_json::json!({
        "sdp": "native_direct_p2p",
        "sdp_type": "offer",
        "did": did,
    }).to_string();

    let create_session_msg = serde_json::json!({
        "type": "create_session",
        "offer_payload": offer_json,
    });

    ok_json(serde_json::json!({
        "relay_url": relay_url,
        "did": did,
        "offer_payload": offer_json,
        "create_session_message": create_session_msg.to_string(),
    }))
}

pub fn relay_accept_session(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let session_id = require_str(&data, "session_id")?;
    let _offer_payload = require_str(&data, "offer_payload")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let did = identity.did_string();

    // On native, create a mock answer for direct P2P
    let answer_json = serde_json::json!({
        "sdp": "native_direct_p2p_answer",
        "sdp_type": "answer",
        "did": did,
    }).to_string();

    let join_session_msg = serde_json::json!({
        "type": "join_session",
        "session_id": session_id,
        "answer_payload": answer_json,
    });

    ok_json(serde_json::json!({
        "session_id": session_id,
        "answer_payload": answer_json,
        "join_session_message": join_session_msg.to_string(),
        "did": did,
    }))
}

pub fn relay_send(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let to_did = require_str(&data, "to_did")?;
    let payload = require_str(&data, "payload")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let did = identity.did_string();

    let send_msg = serde_json::json!({
        "type": "send",
        "to_did": to_did,
        "payload": payload,
    });

    ok_json(serde_json::json!({
        "sent": true,
        "to_did": to_did,
        "from_did": did,
        "relay_message": send_msg.to_string(),
    }))
}

// ── Crypto ──────────────────────────────────────────────────────────────────
// Sign/verify/encrypt/decrypt operations — the crypto primitives exist in
// crate::crypto, but the dispatcher needs identity state access.

pub fn crypto_sign(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str};
    use super::state::get_state;
    let data = json_parse(args)?;
    let data_hex = require_str(&data, "data")?;
    let bytes = hex::decode(data_hex).map_err(|e| err(704, format!("Invalid hex: {}", e)))?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let signature = crate::crypto::sign(&identity.keypair().signing, &bytes);
    super::dispatcher::ok_json(serde_json::json!({
        "signature": hex::encode(signature.as_bytes()),
    }))
}

pub fn crypto_verify(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str};
    let data = json_parse(args)?;
    let _did = data["did"].as_str();
    let signing_key_hex = require_str(&data, "signing_key")?;
    let data_hex = require_str(&data, "data")?;
    let signature_hex = require_str(&data, "signature")?;

    let key_bytes = hex::decode(signing_key_hex).map_err(|e| err(704, format!("Invalid key hex: {}", e)))?;
    let data_bytes = hex::decode(data_hex).map_err(|e| err(704, format!("Invalid data hex: {}", e)))?;
    let sig_bytes = hex::decode(signature_hex).map_err(|e| err(704, format!("Invalid sig hex: {}", e)))?;

    if key_bytes.len() != 32 { return Err(err(704, "Signing key must be 32 bytes")); }
    if sig_bytes.len() != 64 { return Err(err(704, "Signature must be 64 bytes")); }

    let mut pk = [0u8; 32];
    pk.copy_from_slice(&key_bytes);
    let mut sig_arr = [0u8; 64];
    sig_arr.copy_from_slice(&sig_bytes);
    let sig = crate::crypto::Signature::from_bytes(sig_arr);
    let valid = crate::crypto::verify(&pk, &data_bytes, &sig).is_ok();
    super::dispatcher::ok_json(serde_json::json!({ "valid": valid }))
}

pub fn crypto_encrypt_for_peer(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    use base64::Engine as _;

    let data = json_parse(args)?;
    let peer_did = require_str(&data, "peer_did")?;
    let plaintext_b64 = require_str(&data, "plaintext_b64")?;
    let context = data["context"].as_str().unwrap_or("");

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let friend_rec = db.get_friend(peer_did).map_err(|e| err(704, format!("DB error: {}", e)))?
        .ok_or_else(|| err(704, "Peer not found in friends"))?;

    let friend_enc_bytes = hex::decode(&friend_rec.encryption_key)
        .map_err(|e| err(704, format!("Invalid key hex: {}", e)))?;
    if friend_enc_bytes.len() != 32 { return Err(err(704, "Encryption key must be 32 bytes")); }
    let mut friend_enc_key = [0u8; 32];
    friend_enc_key.copy_from_slice(&friend_enc_bytes);

    let plaintext = base64::engine::general_purpose::STANDARD.decode(plaintext_b64)
        .map_err(|e| err(704, format!("Invalid base64 plaintext: {}", e)))?;

    let our_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();
    let aad = format!("{}{}{}", our_did, peer_did, timestamp);

    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption, &friend_enc_key,
        context.as_bytes(), &plaintext, aad.as_bytes(),
    ).map_err(|e| err(704, format!("Encryption failed: {}", e)))?;

    ok_json(serde_json::json!({
        "ciphertext_b64": base64::engine::general_purpose::STANDARD.encode(&ciphertext),
        "nonce_hex": hex::encode(nonce.0),
        "timestamp": timestamp,
    }))
}

pub fn crypto_decrypt_from_peer(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    use base64::Engine as _;

    let data = json_parse(args)?;
    let peer_did = require_str(&data, "peer_did")?;
    let ciphertext_b64 = require_str(&data, "ciphertext_b64")?;
    let nonce_hex = require_str(&data, "nonce_hex")?;
    let timestamp = data["timestamp"].as_i64().ok_or_else(|| err(2, "Missing timestamp"))?;
    let context = data["context"].as_str().unwrap_or("");

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let friend_rec = db.get_friend(peer_did).map_err(|e| err(704, format!("DB error: {}", e)))?
        .ok_or_else(|| err(704, "Peer not found in friends"))?;

    let friend_enc_bytes = hex::decode(&friend_rec.encryption_key)
        .map_err(|e| err(704, format!("Invalid key hex: {}", e)))?;
    if friend_enc_bytes.len() != 32 { return Err(err(704, "Encryption key must be 32 bytes")); }
    let mut friend_enc_key = [0u8; 32];
    friend_enc_key.copy_from_slice(&friend_enc_bytes);

    let ciphertext = base64::engine::general_purpose::STANDARD.decode(ciphertext_b64)
        .map_err(|e| err(704, format!("Invalid base64 ciphertext: {}", e)))?;

    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| err(704, format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 { return Err(err(704, "Nonce must be 12 bytes")); }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce::from_bytes(nonce_arr);

    let our_did = identity.did_string();
    let aad = format!("{}{}{}", peer_did, our_did, timestamp);

    let plaintext = crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption, &friend_enc_key,
        context.as_bytes(), &nonce, &ciphertext, aad.as_bytes(),
    ).map_err(|e| err(704, format!("Decryption failed: {}", e)))?;

    ok_json(serde_json::json!({
        "plaintext_b64": base64::engine::general_purpose::STANDARD.encode(&plaintext),
    }))
}

// ── Calls ───────────────────────────────────────────────────────────────────
// Call records need a dedicated DB table. Stubbed until the call storage
// schema is added.

pub fn calls_store(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let call_type = require_str(&data, "call_type")?;
    let direction = require_str(&data, "direction")?;
    let participants = data["participants"].as_str().unwrap_or("[]");

    let started_at = crate::time::now_timestamp_millis();

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    db.store_call_record(id, conversation_id, call_type, direction, "active", participants, started_at)
        .map_err(|e| err(e.code(), e))?;

    ok_json(serde_json::json!({
        "id": id,
        "started_at": started_at,
    }))
}

pub fn calls_end(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let status = require_str(&data, "status")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let calls = db.get_all_call_history(1000, 0)
        .map_err(|e| err(e.code(), e))?;
    let call = calls.iter().find(|c| c.id == id)
        .ok_or_else(|| err(404, "Call record not found"))?;

    let ended_at = crate::time::now_timestamp_millis();
    let duration_ms = ended_at - call.started_at;

    db.end_call_record(id, status, ended_at, duration_ms)
        .map_err(|e| err(e.code(), e))?;

    ok_json(serde_json::json!({
        "id": id,
        "ended_at": ended_at,
        "duration_ms": duration_ms,
    }))
}

pub fn calls_get_history(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str};
    use super::state::get_state;

    let data = json_parse(args)?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let records = db.get_call_history(conversation_id, limit, offset)
        .map_err(|e| err(e.code(), e))?;

    let arr: Vec<serde_json::Value> = records.iter().map(|c| serde_json::json!({
        "id": c.id,
        "conversation_id": c.conversation_id,
        "call_type": c.call_type,
        "direction": c.direction,
        "status": c.status,
        "participants": c.participants,
        "started_at": c.started_at,
        "ended_at": c.ended_at,
        "duration_ms": c.duration_ms,
        "created_at": c.created_at,
    })).collect();

    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn calls_get_all_history(args: &str) -> DResult {
    use super::state::get_state;

    let data: serde_json::Value = serde_json::from_str(args)
        .map_err(|e| err(700, format!("Invalid JSON: {}", e)))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let records = db.get_all_call_history(limit, offset)
        .map_err(|e| err(e.code(), e))?;

    let arr: Vec<serde_json::Value> = records.iter().map(|c| serde_json::json!({
        "id": c.id,
        "conversation_id": c.conversation_id,
        "call_type": c.call_type,
        "direction": c.direction,
        "status": c.status,
        "participants": c.participants,
        "started_at": c.started_at,
        "ended_at": c.ended_at,
        "duration_ms": c.duration_ms,
        "created_at": c.created_at,
    })).collect();

    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Plugin Storage ──────────────────────────────────────────────────────────
// Plugin KV store and bundle storage backed by the SQLite database.

pub fn plugin_kv_get(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    let data = json_parse(args)?;
    let plugin_id = require_str(&data, "plugin_id")?;
    let key = require_str(&data, "key")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let value = db.plugin_kv_get(plugin_id, key).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "value": value }))
}

pub fn plugin_kv_set(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    let data = json_parse(args)?;
    let plugin_id = require_str(&data, "plugin_id")?;
    let key = require_str(&data, "key")?;
    let value = require_str(&data, "value")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    db.plugin_kv_set(plugin_id, key, value).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({"ok": true}))
}

pub fn plugin_kv_delete(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    let data = json_parse(args)?;
    let plugin_id = require_str(&data, "plugin_id")?;
    let key = require_str(&data, "key")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let deleted = db.plugin_kv_delete(plugin_id, key).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "deleted": deleted }))
}

pub fn plugin_kv_list(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    let data = json_parse(args)?;
    let plugin_id = require_str(&data, "plugin_id")?;
    let prefix = data["prefix"].as_str().unwrap_or("");
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let keys = db.plugin_kv_list(plugin_id, prefix).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "keys": keys }))
}

pub fn plugin_bundle_save(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    let data = json_parse(args)?;
    let plugin_id = require_str(&data, "plugin_id")?;
    let manifest = require_str(&data, "manifest")?;
    let bundle = require_str(&data, "bundle")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    db.plugin_bundle_save(plugin_id, manifest, bundle).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({"ok": true}))
}

pub fn plugin_bundle_load(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    let data = json_parse(args)?;
    let plugin_id = require_str(&data, "plugin_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let record = db.plugin_bundle_load(plugin_id).map_err(|e| err(e.code(), e))?;
    match record {
        Some(r) => ok_json(serde_json::json!({
            "plugin_id": r.plugin_id,
            "manifest": r.manifest,
            "bundle": r.bundle,
            "installed_at": r.installed_at,
        })),
        None => ok_json(serde_json::json!({ "found": false })),
    }
}

pub fn plugin_bundle_delete(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;
    let data = json_parse(args)?;
    let plugin_id = require_str(&data, "plugin_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let deleted = db.plugin_bundle_delete(plugin_id).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "deleted": deleted }))
}

pub fn plugin_bundle_list() -> DResult {
    use super::state::get_state;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let bundles = db.plugin_bundle_list().map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = bundles.iter().map(|b| serde_json::json!({
        "plugin_id": b.plugin_id,
        "manifest": b.manifest,
        "installed_at": b.installed_at,
    })).collect();
    Ok(serde_json::Value::Array(arr).to_string())
}

// ── File Encryption ─────────────────────────────────────────────────────────
// File encryption uses streaming AES-GCM which needs buffer management.
// The primitives exist in crate::crypto but need FFI-safe wrappers.

pub fn file_derive_key(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let peer_did = require_str(&data, "peer_did")?;
    let file_id = require_str(&data, "file_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let friend = database.get_friend(peer_did)
        .map_err(|e| err(400, format!("DB error: {}", e)))?
        .ok_or_else(|| err(400, format!("Friend not found: {}", peer_did)))?;

    let friend_enc_bytes = hex::decode(&friend.encryption_key)
        .map_err(|e| err(704, format!("Invalid friend encryption key hex: {}", e)))?;
    if friend_enc_bytes.len() != 32 {
        return Err(err(704, "Friend encryption key must be 32 bytes"));
    }
    let mut friend_enc_key = [0u8; 32];
    friend_enc_key.copy_from_slice(&friend_enc_bytes);

    let dh_output = identity.keypair().encryption.diffie_hellman(&friend_enc_key);
    let key = crate::crypto::derive_file_key(&dh_output, file_id.as_bytes())
        .map_err(|e| err(704, format!("Key derivation failed: {}", e)))?;

    ok_json(serde_json::json!({ "key_hex": hex::encode(&key) }))
}

pub fn file_encrypt_chunk(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use base64::Engine as _;

    let data = json_parse(args)?;
    let key_hex = require_str(&data, "key_hex")?;
    let chunk_data_b64 = require_str(&data, "chunk_data_b64")?;
    let file_id = require_str(&data, "file_id")?;
    let chunk_index = data["chunk_index"].as_u64()
        .ok_or_else(|| err(2, "Missing chunk_index"))? as u32;

    let key_bytes = hex::decode(key_hex)
        .map_err(|e| err(704, format!("Invalid key hex: {}", e)))?;
    if key_bytes.len() != 32 {
        return Err(err(704, "Key must be 32 bytes"));
    }
    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&key_bytes);
    let encryption_key = crate::crypto::EncryptionKey::from_bytes(key_arr);

    let chunk_data = base64::engine::general_purpose::STANDARD.decode(chunk_data_b64)
        .map_err(|e| err(704, format!("Invalid base64: {}", e)))?;

    let (nonce, ciphertext) = crate::crypto::encrypt_chunk(&encryption_key, &chunk_data, file_id, chunk_index)
        .map_err(|e| err(704, format!("Encryption failed: {}", e)))?;

    ok_json(serde_json::json!({
        "nonce_hex": hex::encode(&nonce.0),
        "encrypted_data_b64": base64::engine::general_purpose::STANDARD.encode(&ciphertext),
    }))
}

pub fn file_decrypt_chunk(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use base64::Engine as _;

    let data = json_parse(args)?;
    let key_hex = require_str(&data, "key_hex")?;
    let nonce_hex = require_str(&data, "nonce_hex")?;
    let encrypted_data_b64 = require_str(&data, "encrypted_data_b64")?;
    let file_id = require_str(&data, "file_id")?;
    let chunk_index = data["chunk_index"].as_u64()
        .ok_or_else(|| err(2, "Missing chunk_index"))? as u32;

    let key_bytes = hex::decode(key_hex)
        .map_err(|e| err(704, format!("Invalid key hex: {}", e)))?;
    if key_bytes.len() != 32 {
        return Err(err(704, "Key must be 32 bytes"));
    }
    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&key_bytes);
    let encryption_key = crate::crypto::EncryptionKey::from_bytes(key_arr);

    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| err(704, format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(err(704, "Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce::from_bytes(nonce_arr);

    let encrypted_data = base64::engine::general_purpose::STANDARD.decode(encrypted_data_b64)
        .map_err(|e| err(704, format!("Invalid base64: {}", e)))?;

    let decrypted = crate::crypto::decrypt_chunk(&encryption_key, &nonce, &encrypted_data, file_id, chunk_index)
        .map_err(|e| err(704, format!("Decryption failed: {}", e)))?;

    ok_json(serde_json::json!({
        "chunk_data_b64": base64::engine::general_purpose::STANDARD.encode(&decrypted),
    }))
}

pub fn channel_file_derive_key(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let channel_key_hex = require_str(&data, "channel_key_hex")?;
    let file_id = require_str(&data, "file_id")?;
    let key_version = data["key_version"].as_u64()
        .ok_or_else(|| err(2, "Missing key_version"))? as u32;

    let channel_key_bytes = hex::decode(channel_key_hex)
        .map_err(|e| err(704, format!("Invalid channel key hex: {}", e)))?;
    if channel_key_bytes.len() != 32 {
        return Err(err(704, "Channel key must be 32 bytes"));
    }
    let mut channel_key = [0u8; 32];
    channel_key.copy_from_slice(&channel_key_bytes);

    let key = crate::crypto::derive_channel_file_key(&channel_key, file_id.as_bytes(), key_version)
        .map_err(|e| err(704, format!("Key derivation failed: {}", e)))?;

    ok_json(serde_json::json!({ "key_hex": hex::encode(&key) }))
}

pub fn compute_key_fingerprint(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let key_hex = require_str(&data, "key_hex")?;

    let key_bytes = hex::decode(key_hex)
        .map_err(|e| err(704, format!("Invalid key hex: {}", e)))?;
    if key_bytes.len() != 32 {
        return Err(err(704, "Key must be 32 bytes"));
    }
    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&key_bytes);

    let fingerprint = crate::crypto::compute_key_fingerprint(&key_arr)
        .map_err(|e| err(704, format!("Fingerprint computation failed: {}", e)))?;

    ok_json(serde_json::json!({ "fingerprint": fingerprint }))
}

pub fn verify_key_fingerprint(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let key_hex = require_str(&data, "key_hex")?;
    let expected = require_str(&data, "expected_fingerprint")?;

    let key_bytes = hex::decode(key_hex)
        .map_err(|e| err(704, format!("Invalid key hex: {}", e)))?;
    if key_bytes.len() != 32 {
        return Err(err(704, "Key must be 32 bytes"));
    }
    let mut key_arr = [0u8; 32];
    key_arr.copy_from_slice(&key_bytes);

    let valid = crate::crypto::verify_key_fingerprint(&key_arr, expected)
        .map_err(|e| err(704, format!("Fingerprint verification failed: {}", e)))?;

    ok_json(serde_json::json!({ "valid": valid }))
}

// ── File Chunking ───────────────────────────────────────────────────────────

pub fn chunk_file(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, err};
    use super::state::get_state;
    use base64::Engine as _;

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;
    let filename = require_str(&data, "filename")?;
    let data_b64 = require_str(&data, "data_b64")?;
    let chunk_size = data["chunk_size"]
        .as_u64()
        .map(|v| v as usize)
        .unwrap_or(crate::storage::chunking::DEFAULT_CHUNK_SIZE);

    let file_bytes = base64::engine::general_purpose::STANDARD
        .decode(data_b64)
        .map_err(|e| err(2, format!("Invalid base64: {}", e)))?;

    let (manifest, chunks) =
        crate::storage::chunking::chunk_file(file_id, filename, &file_bytes, chunk_size)
            .map_err(|e| err(500, format!("Chunking failed: {}", e)))?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let now = crate::time::now_timestamp();

    for chunk in &chunks {
        database
            .store_chunk(
                &chunk.chunk_id,
                &chunk.file_id,
                chunk.chunk_index as i32,
                &chunk.data,
                chunk.data.len() as i64,
                now,
            )
            .map_err(|e| err(400, format!("Failed to store chunk: {}", e)))?;
    }

    let chunks_json = serde_json::to_string(&manifest.chunks)
        .map_err(|e| err(500, format!("Failed to serialize chunks: {}", e)))?;

    database
        .store_manifest(
            file_id,
            filename,
            manifest.total_size as i64,
            manifest.chunk_size as i64,
            manifest.total_chunks as i32,
            &chunks_json,
            &manifest.file_hash,
            false,
            None,
            now,
        )
        .map_err(|e| err(400, format!("Failed to store manifest: {}", e)))?;

    let result = serde_json::to_string(&manifest)
        .map_err(|e| err(500, format!("Failed to serialize manifest: {}", e)))?;
    Ok(result)
}

pub fn reassemble_file(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json, err};
    use super::state::get_state;
    use base64::Engine as _;

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let manifest_record = database
        .get_manifest(file_id)
        .map_err(|e| err(400, format!("Failed to get manifest: {}", e)))?
        .ok_or_else(|| err(404, format!("Manifest not found for file_id: {}", file_id)))?;

    let chunk_refs: Vec<crate::storage::chunking::ChunkRef> =
        serde_json::from_str(&manifest_record.chunks_json)
            .map_err(|e| err(500, format!("Failed to parse chunks_json: {}", e)))?;

    let manifest = crate::storage::chunking::ChunkManifest {
        file_id: manifest_record.file_id.clone(),
        filename: manifest_record.filename.clone(),
        total_size: manifest_record.total_size as u64,
        chunk_size: manifest_record.chunk_size as usize,
        total_chunks: manifest_record.total_chunks as u32,
        chunks: chunk_refs,
        file_hash: manifest_record.file_hash.clone(),
    };

    let chunk_records = database
        .get_chunks_for_file(file_id)
        .map_err(|e| err(400, format!("Failed to get chunks: {}", e)))?;

    let file_chunks: Vec<crate::storage::chunking::FileChunk> = chunk_records
        .into_iter()
        .map(|r| crate::storage::chunking::FileChunk {
            chunk_id: r.chunk_id,
            chunk_index: r.chunk_index as u32,
            total_chunks: manifest.total_chunks,
            data: r.data,
            file_id: r.file_id,
        })
        .collect();

    let reassembled = crate::storage::chunking::reassemble_file(&manifest, &file_chunks)
        .map_err(|e| err(500, format!("Reassembly failed: {}", e)))?;

    let data_b64 = base64::engine::general_purpose::STANDARD.encode(&reassembled);

    ok_json(serde_json::json!({
        "data_b64": data_b64,
        "filename": manifest.filename,
        "file_hash": manifest.file_hash,
        "total_size": manifest.total_size,
    }))
}

pub fn get_file_manifest(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json, err};
    use super::state::get_state;

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let manifest_record = database
        .get_manifest(file_id)
        .map_err(|e| err(400, format!("Failed to get manifest: {}", e)))?;

    match manifest_record {
        Some(r) => ok_json(serde_json::json!({
            "id": r.file_id,
            "filename": r.filename,
            "total_size": r.total_size,
            "chunk_size": r.chunk_size,
            "total_chunks": r.total_chunks,
            "chunks_json": r.chunks_json,
            "file_hash": r.file_hash,
            "encrypted": r.encrypted,
            "created_at": r.created_at,
        })),
        None => ok_json(serde_json::json!({ "found": false })),
    }
}

// ── Relay Envelope Builders ─────────────────────────────────────────────────

pub fn community_build_event_relay_batch(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str};
    use super::state::get_state;

    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let event = &data["event"];
    let sender_did = require_str(&data, "sender_did")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let database = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let timestamp = crate::time::now_timestamp_millis();

    let envelope = serde_json::json!({
        "envelope": "community_event",
        "version": 1,
        "payload": {
            "communityId": community_id,
            "event": event,
            "senderDid": sender_did,
            "timestamp": timestamp,
        }
    });
    let envelope_str = envelope.to_string();

    let members = database.get_community_members(community_id)
        .map_err(|e| err(400, format!("DB error: {}", e)))?;

    let relay_messages: Vec<serde_json::Value> = members.iter()
        .filter(|m| m.member_did != sender_did)
        .map(|m| serde_json::json!({
            "to_did": m.member_did,
            "payload": envelope_str,
        }))
        .collect();

    Ok(serde_json::to_string(&relay_messages).unwrap_or_default())
}

pub fn build_dm_file_event_envelope(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let sender_did = require_str(&data, "sender_did")?;
    let event = &data["event"];

    let timestamp = crate::time::now_timestamp_millis();

    let envelope = serde_json::json!({
        "envelope": "dm_file_event",
        "version": 1,
        "payload": {
            "conversationId": conversation_id,
            "senderDid": sender_did,
            "timestamp": timestamp,
            "event": event,
        }
    });

    ok_json(serde_json::json!({
        "payload": envelope.to_string(),
    }))
}

pub fn build_metadata_envelope(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let sender_did = require_str(&data, "sender_did")?;
    let key = require_str(&data, "key")?;
    let value = require_str(&data, "value")?;

    let timestamp = crate::time::now_timestamp_millis();

    let envelope = serde_json::json!({
        "envelope": "account_metadata",
        "version": 1,
        "payload": {
            "senderDid": sender_did,
            "key": key,
            "value": value,
            "timestamp": timestamp,
        }
    });

    ok_json(serde_json::json!({
        "to_did": sender_did,
        "payload": envelope.to_string(),
    }))
}

// ── DHT ─────────────────────────────────────────────────────────────────────

pub fn dht_start_providing(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::{get_state, get_runtime};

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let network = state.network.as_ref()
        .ok_or_else(|| err(300, "Network not started"))?;

    get_runtime().block_on(network.start_providing(file_id.to_string()))
        .map_err(|e| err(500, format!("DHT start_providing failed: {}", e)))?;

    ok_json(serde_json::json!({"ok": true}))
}

pub fn dht_get_providers(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::{get_state, get_runtime};

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let network = state.network.as_ref()
        .ok_or_else(|| err(300, "Network not started"))?;

    get_runtime().block_on(network.get_providers(file_id.to_string()))
        .map_err(|e| err(500, format!("DHT get_providers failed: {}", e)))?;

    ok_json(serde_json::json!({"ok": true}))
}

pub fn dht_stop_providing(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::{get_state, get_runtime};

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let network = state.network.as_ref()
        .ok_or_else(|| err(300, "Network not started"))?;

    get_runtime().block_on(network.stop_providing(file_id.to_string()))
        .map_err(|e| err(500, format!("DHT stop_providing failed: {}", e)))?;

    ok_json(serde_json::json!({"ok": true}))
}

// ── Network — WebRTC (N/A on native — direct P2P used) ─────────────────────
pub fn network_create_offer() -> DResult { Err(err(501, "network_create_offer: Not applicable on native — direct P2P used")) }
pub fn network_accept_offer(_args: &str) -> DResult { Err(err(501, "network_accept_offer: Not applicable on native — direct P2P used")) }
pub fn network_complete_handshake(_args: &str) -> DResult { Err(err(501, "network_complete_handshake: Not applicable on native — direct P2P used")) }
pub fn network_complete_answerer() -> DResult { Err(err(501, "network_complete_answerer: Not applicable on native — direct P2P used")) }

// ── File Transfer Control ───────────────────────────────────────────────────

use once_cell::sync::Lazy;
use parking_lot::Mutex;

static TRANSFER_MGR: Lazy<Mutex<crate::network::TransferManager>> =
    Lazy::new(|| Mutex::new(crate::network::TransferManager::new()));

/// Drain pending transfer events and emit them via the FFI event system.
fn drain_transfer_events(mgr: &mut crate::network::TransferManager) {
    for event in mgr.drain_events() {
        super::dispatcher::emit_event(
            "file_transfer",
            &serde_json::to_value(&event).unwrap_or_default(),
        );
    }
}

pub fn transfer_initiate(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;
    let peer_did = require_str(&data, "peer_did")?;
    let manifest_json = require_str(&data, "manifest_json")?;

    let manifest: crate::storage::chunking::ChunkManifest =
        serde_json::from_str(manifest_json)
            .map_err(|e| err(2, format!("Invalid manifest JSON: {}", e)))?;

    let now = crate::time::now_timestamp_millis();
    let mut mgr = TRANSFER_MGR.lock();
    let (transfer_id, msg) = mgr.initiate_transfer(
        file_id.to_string(),
        peer_did.to_string(),
        manifest,
        now,
    ).map_err(|e| err(500, e))?;

    drain_transfer_events(&mut mgr);

    let msg_json = serde_json::to_value(&msg).unwrap_or_default();
    ok_json(serde_json::json!({
        "transfer_id": transfer_id,
        "message": msg_json,
    }))
}

pub fn transfer_accept(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let transfer_id = require_str(&data, "transfer_id")?;
    let existing_chunks: Vec<u32> = data["existing_chunks"]
        .as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_u64().map(|n| n as u32)).collect())
        .unwrap_or_default();

    let now = crate::time::now_timestamp_millis();
    let mut mgr = TRANSFER_MGR.lock();
    let msg = mgr.accept_transfer(transfer_id, existing_chunks, now)
        .map_err(|e| err(500, e))?;

    drain_transfer_events(&mut mgr);

    let msg_json = serde_json::to_value(&msg).unwrap_or_default();
    ok_json(serde_json::json!({
        "message": msg_json,
    }))
}

pub fn transfer_pause(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let transfer_id = require_str(&data, "transfer_id")?;

    let now = crate::time::now_timestamp_millis();
    let mut mgr = TRANSFER_MGR.lock();
    let msg = mgr.pause_transfer(transfer_id, now)
        .map_err(|e| err(500, e))?;

    drain_transfer_events(&mut mgr);

    let msg_json = serde_json::to_value(&msg).unwrap_or_default();
    ok_json(serde_json::json!({
        "message": msg_json,
    }))
}

pub fn transfer_resume(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let transfer_id = require_str(&data, "transfer_id")?;

    let now = crate::time::now_timestamp_millis();
    let mut mgr = TRANSFER_MGR.lock();
    let msg = mgr.resume_transfer(transfer_id, now)
        .map_err(|e| err(500, e))?;

    drain_transfer_events(&mut mgr);

    let msg_json = serde_json::to_value(&msg).unwrap_or_default();
    ok_json(serde_json::json!({
        "message": msg_json,
    }))
}

pub fn transfer_cancel(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let transfer_id = require_str(&data, "transfer_id")?;
    let reason = data["reason"].as_str().map(|s| s.to_string());

    let now = crate::time::now_timestamp_millis();
    let mut mgr = TRANSFER_MGR.lock();
    let msg = mgr.cancel_transfer(transfer_id, reason, now)
        .map_err(|e| err(500, e))?;

    drain_transfer_events(&mut mgr);

    let msg_json = serde_json::to_value(&msg).unwrap_or_default();
    ok_json(serde_json::json!({
        "message": msg_json,
    }))
}

pub fn transfer_on_message(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let from_did = require_str(&data, "from_did")?;
    let message_val = require_str(&data, "message")?;

    let message: crate::network::FileTransferMessage =
        serde_json::from_str(message_val)
            .map_err(|e| err(2, format!("Invalid message JSON: {}", e)))?;

    let now = crate::time::now_timestamp_millis();
    let mut mgr = TRANSFER_MGR.lock();
    let response = mgr.on_message(from_did, message, now)
        .map_err(|e| err(500, e))?;

    drain_transfer_events(&mut mgr);

    match response {
        Some(msg) => {
            let msg_json = serde_json::to_value(&msg).unwrap_or_default();
            ok_json(serde_json::json!({
                "response_message": msg_json,
            }))
        }
        None => ok_json(serde_json::json!({})),
    }
}

pub fn transfer_list() -> DResult {
    let mgr = TRANSFER_MGR.lock();
    let sessions = mgr.all_sessions();
    let arr: Vec<serde_json::Value> = sessions.iter()
        .map(|s| serde_json::to_value(s).unwrap_or_default())
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_else(|_| "[]".to_string()))
}

pub fn transfer_get(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str};

    let data = json_parse(args)?;
    let transfer_id = require_str(&data, "transfer_id")?;

    let mgr = TRANSFER_MGR.lock();
    match mgr.get_session(transfer_id) {
        Some(session) => Ok(serde_json::to_string(session).unwrap_or_else(|_| "null".to_string())),
        None => Ok("null".to_string()),
    }
}

pub fn transfer_get_incomplete() -> DResult {
    let mgr = TRANSFER_MGR.lock();
    let sessions = mgr.active_sessions();
    let arr: Vec<serde_json::Value> = sessions.iter()
        .map(|s| serde_json::to_value(s).unwrap_or_default())
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_else(|_| "[]".to_string()))
}

pub fn transfer_chunks_to_send(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let transfer_id = require_str(&data, "transfer_id")?;

    let mgr = TRANSFER_MGR.lock();
    let chunks = mgr.chunks_to_send(transfer_id);

    ok_json(serde_json::json!({
        "transfer_id": transfer_id,
        "chunks": chunks,
    }))
}

pub fn transfer_mark_chunk_sent(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};

    let data = json_parse(args)?;
    let transfer_id = require_str(&data, "transfer_id")?;
    let chunk_index = data["chunk_index"].as_u64()
        .ok_or_else(|| err(2, "Missing chunk_index"))? as u32;

    let now = crate::time::now_timestamp_millis();
    let mut mgr = TRANSFER_MGR.lock();
    mgr.mark_chunk_sent(transfer_id, chunk_index, now);

    drain_transfer_events(&mut mgr);

    ok_json(serde_json::json!({"ok": true}))
}

// ── File Reencryption ───────────────────────────────────────────────────────

pub fn mark_files_for_reencryption(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let new_key_version = data["new_key_version"].as_i64().unwrap_or(1) as i32;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let count = db.mark_channel_files_for_reencryption(channel_id, new_key_version)
        .map_err(|e| err(400, format!("Failed to mark files for reencryption: {}", e)))?;

    ok_json(serde_json::json!({"ok": true, "count": count}))
}

pub fn get_files_needing_reencryption(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str};
    use super::state::get_state;

    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let limit = data["limit"].as_u64().unwrap_or(100) as usize;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let files = db.get_files_needing_reencryption(channel_id, limit)
        .map_err(|e| err(400, format!("Failed to get files needing reencryption: {}", e)))?;

    let arr: Vec<serde_json::Value> = files.iter().map(|f| serde_json::json!({
        "id": f.id,
        "channel_id": f.channel_id,
        "folder_id": f.folder_id,
        "filename": f.filename,
        "description": f.description,
        "file_size": f.file_size,
        "mime_type": f.mime_type,
        "storage_chunks_json": f.storage_chunks_json,
        "uploaded_by": f.uploaded_by,
        "version": f.version,
        "previous_version_id": f.previous_version_id,
        "download_count": f.download_count,
        "created_at": f.created_at,
    })).collect();

    Ok(serde_json::to_string(&arr).unwrap_or_else(|_| "[]".to_string()))
}

pub fn clear_reencryption_flag(args: &str) -> DResult {
    use super::dispatcher::{json_parse, require_str, ok_json};
    use super::state::get_state;

    let data = json_parse(args)?;
    let file_id = require_str(&data, "file_id")?;
    let new_fingerprint = data["new_fingerprint"].as_str();

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    db.clear_reencryption_flag(file_id, new_fingerprint)
        .map_err(|e| err(400, format!("Failed to clear reencryption flag: {}", e)))?;

    ok_json(serde_json::json!({"ok": true}))
}
