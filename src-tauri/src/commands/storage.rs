use crate::state::AppState;

/// Get a plugin KV value.
///
/// Returns JSON: { "value": "..." } or { "value": null }
#[tauri::command]
pub async fn plugin_kv_get(
    plugin_id: String,
    key: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let value = database.plugin_kv_get(&plugin_id, &key)
        .map_err(|e| e.to_string())?;

    let json = serde_json::json!({ "value": value });
    Ok(json.to_string())
}

/// Set a plugin KV value (upsert).
///
/// Returns JSON: { "ok": true }
#[tauri::command]
pub async fn plugin_kv_set(
    plugin_id: String,
    key: String,
    value: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    database.plugin_kv_set(&plugin_id, &key, &value)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "ok": true }).to_string())
}

/// Delete a plugin KV entry.
///
/// Returns JSON: { "deleted": true/false }
#[tauri::command]
pub async fn plugin_kv_delete(
    plugin_id: String,
    key: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let deleted = database.plugin_kv_delete(&plugin_id, &key)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "deleted": deleted }).to_string())
}

/// List plugin KV keys, optionally filtered by prefix.
///
/// Returns JSON: { "keys": ["key1", "key2", ...] }
#[tauri::command]
pub async fn plugin_kv_list(
    plugin_id: String,
    prefix: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let keys = database.plugin_kv_list(&plugin_id, &prefix)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "keys": keys }).to_string())
}
