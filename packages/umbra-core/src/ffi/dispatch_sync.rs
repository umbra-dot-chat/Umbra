//! Sync dispatch handlers.
//!
//! Mirrors the four `umbra_wasm_sync_*` functions for non-WASM platforms
//! (iOS via C FFI, Android via JNI, Tauri via `umbra_call`).

use base64::Engine as _;

use super::dispatcher::{err, json_parse, ok_json, DResult};
use super::state::get_state;

/// Create an encrypted sync blob from the local database.
///
/// Expects JSON: `{ "section_versions": { "friends": N, ... } }` (optional)
/// Returns JSON: `{ "blob": "base64...", "sections": {...}, "size": N }`
pub fn sync_create_blob(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state_r = state.read();

    let database = state_r
        .database
        .as_ref()
        .ok_or_else(|| err(200, "Database not initialized"))?;
    let seed = state_r
        .backup_seed
        .as_ref()
        .ok_or_else(|| err(201, "Seed not available"))?;

    let section_versions: Option<std::collections::HashMap<String, u64>> = data
        .get("section_versions")
        .and_then(|sv| serde_json::from_value(sv.clone()).ok());

    let payload = crate::sync::create_sync_blob(database, section_versions.as_ref())
        .map_err(|e| err(500, format!("Sync blob creation failed: {}", e)))?;

    let sections: serde_json::Value = payload
        .sections
        .iter()
        .map(|(name, section)| (name.clone(), serde_json::json!(section.v)))
        .collect::<serde_json::Map<String, serde_json::Value>>()
        .into();

    let blob = crate::sync::encrypt_sync_blob(&payload, seed)
        .map_err(|e| err(500, format!("Sync blob encryption failed: {}", e)))?;

    let b64 = base64::engine::general_purpose::STANDARD;
    ok_json(serde_json::json!({
        "blob": b64.encode(&blob),
        "sections": sections,
        "size": blob.len(),
    }))
}

/// Parse a sync blob and return a summary without applying it.
///
/// Expects JSON: `{ "blob": "base64..." }`
/// Returns JSON: `{ "v": 1, "updated_at": N, "sections": { ... } }`
pub fn sync_parse_blob(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state_r = state.read();

    let seed = state_r
        .backup_seed
        .as_ref()
        .ok_or_else(|| err(201, "Seed not available"))?;

    let blob_b64 = data["blob"]
        .as_str()
        .ok_or_else(|| err(2, "Missing blob field"))?;

    let blob = base64::engine::general_purpose::STANDARD
        .decode(blob_b64)
        .map_err(|e| err(400, format!("Invalid base64: {}", e)))?;

    let summary = crate::sync::parse_sync_blob_summary(&blob, seed)
        .map_err(|e| err(500, format!("Sync blob parse failed: {}", e)))?;

    let result = serde_json::to_value(&summary)
        .map_err(|e| err(500, format!("Serialization failed: {}", e)))?;

    ok_json(result)
}

/// Apply a sync blob — decrypt and import its contents into the database.
///
/// Expects JSON: `{ "blob": "base64..." }`
/// Returns JSON: `{ "imported": { "settings": N, "friends": N, "groups": N, "blocked_users": N } }`
pub fn sync_apply_blob(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state_r = state.read();

    let database = state_r
        .database
        .as_ref()
        .ok_or_else(|| err(200, "Database not initialized"))?;
    let seed = state_r
        .backup_seed
        .as_ref()
        .ok_or_else(|| err(201, "Seed not available"))?;

    let blob_b64 = data["blob"]
        .as_str()
        .ok_or_else(|| err(2, "Missing blob field"))?;

    let blob = base64::engine::general_purpose::STANDARD
        .decode(blob_b64)
        .map_err(|e| err(400, format!("Invalid base64: {}", e)))?;

    // Decrypt
    let payload = crate::sync::decrypt_sync_blob(&blob, seed)
        .map_err(|e| err(500, format!("Sync blob decryption failed: {}", e)))?;

    // Reconstruct a backup-compatible JSON for import_database()
    let prefs_data = payload.sections.get("preferences").map(|s| &s.data);
    let (legacy_settings, plugin_kv) = match prefs_data {
        Some(data) if data.is_object() => {
            let settings = data.get("settings").cloned().unwrap_or(serde_json::json!([]));
            let kv = data.get("plugin_kv").cloned().unwrap_or(serde_json::json!([]));
            (settings, kv)
        }
        Some(data) if data.is_array() => (data.clone(), serde_json::json!([])),
        _ => (serde_json::json!([]), serde_json::json!([])),
    };

    let import_json = serde_json::json!({
        "version": 1,
        "exported_at": payload.updated_at,
        "settings": legacy_settings,
        "plugin_kv": plugin_kv,
        "friends": payload.sections.get("friends").map(|s| &s.data).unwrap_or(&serde_json::json!([])),
        "groups": payload.sections.get("groups").map(|s| &s.data).unwrap_or(&serde_json::json!([])),
        "blocked_users": payload.sections.get("blocked").map(|s| &s.data).unwrap_or(&serde_json::json!([])),
        "conversations": [],
    });

    let import_bytes = serde_json::to_vec(&import_json)
        .map_err(|e| err(500, format!("Serialization failed: {}", e)))?;

    let stats = database
        .import_database(&import_bytes)
        .map_err(|e| err(500, format!("Database import failed: {}", e)))?;

    ok_json(serde_json::json!({
        "imported": {
            "settings": stats.settings,
            "friends": stats.friends,
            "groups": stats.groups,
            "blocked_users": stats.blocked_users,
        }
    }))
}

/// Sign a sync auth challenge nonce with the identity's Ed25519 key.
///
/// Expects JSON: `{ "nonce": "uuid-string" }`
/// Returns JSON: `{ "signature": "base64...", "public_key": "base64..." }`
pub fn sync_sign_challenge(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state_r = state.read();

    let identity = state_r
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;

    let nonce = data["nonce"]
        .as_str()
        .ok_or_else(|| err(2, "Missing nonce field"))?;

    let signature = crate::crypto::sign(&identity.keypair().signing, nonce.as_bytes());
    let public_key = identity.keypair().signing.public_bytes();

    let b64 = base64::engine::general_purpose::STANDARD;

    ok_json(serde_json::json!({
        "signature": b64.encode(signature.as_bytes()),
        "public_key": b64.encode(&public_key),
    }))
}
