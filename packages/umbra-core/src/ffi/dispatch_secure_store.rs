//! Dispatch handlers for SecureStore operations.
//!
//! Exposes the Rust SecureStore (iOS Keychain, Android Keystore) through the
//! generic dispatcher so that TypeScript can persist sensitive data (identity,
//! recovery phrase, PIN) without needing additional Swift/Kotlin code.

use super::dispatcher::{err, json_parse, ok_json, require_str, DResult};
use super::state::get_state;

/// Store a UTF-8 string value in secure storage.
///
/// Args: `{ "key": "...", "value": "..." }`
pub fn secure_store(args: &str) -> DResult {
    let data = json_parse(args)?;
    let key = require_str(&data, "key")?;
    let value = require_str(&data, "value")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let store = state
        .secure_store
        .as_ref()
        .ok_or_else(|| err(400, "SecureStore not initialized"))?;

    store
        .store(key, value.as_bytes())
        .map_err(|e| err(500, format!("SecureStore write failed: {}", e)))?;

    ok_json(serde_json::json!({ "success": true }))
}

/// Retrieve a UTF-8 string value from secure storage.
///
/// Args: `{ "key": "..." }`
/// Returns: `{ "value": "..." }` or `{ "value": null }` if not found.
pub fn secure_retrieve(args: &str) -> DResult {
    let data = json_parse(args)?;
    let key = require_str(&data, "key")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let store = state
        .secure_store
        .as_ref()
        .ok_or_else(|| err(400, "SecureStore not initialized"))?;

    match store.retrieve(key) {
        Ok(Some(bytes)) => {
            let value = String::from_utf8(bytes.to_vec())
                .map_err(|e| err(500, format!("SecureStore value is not valid UTF-8: {}", e)))?;
            ok_json(serde_json::json!({ "value": value }))
        }
        Ok(None) => ok_json(serde_json::json!({ "value": null })),
        Err(e) => Err(err(500, format!("SecureStore read failed: {}", e))),
    }
}

/// Delete a key from secure storage.
///
/// Args: `{ "key": "..." }`
/// Returns: `{ "deleted": true/false }`
pub fn secure_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let key = require_str(&data, "key")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let store = state
        .secure_store
        .as_ref()
        .ok_or_else(|| err(400, "SecureStore not initialized"))?;

    let deleted = store
        .delete(key)
        .map_err(|e| err(500, format!("SecureStore delete failed: {}", e)))?;

    ok_json(serde_json::json!({ "deleted": deleted }))
}

/// Check if a key exists in secure storage.
///
/// Args: `{ "key": "..." }`
/// Returns: `{ "exists": true/false }`
pub fn secure_exists(args: &str) -> DResult {
    let data = json_parse(args)?;
    let key = require_str(&data, "key")?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let store = state
        .secure_store
        .as_ref()
        .ok_or_else(|| err(400, "SecureStore not initialized"))?;

    let exists = store
        .exists(key)
        .map_err(|e| err(500, format!("SecureStore exists check failed: {}", e)))?;

    ok_json(serde_json::json!({ "exists": exists }))
}
