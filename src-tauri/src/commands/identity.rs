use crate::state::AppState;
use umbra_core::identity::{Identity, RecoveryPhrase, ProfileUpdate};
use umbra_core::storage::Database;
use std::sync::Arc;

/// Create a new identity with a random recovery phrase.
///
/// Returns JSON: { "did": "did:key:...", "recovery_phrase": "word1 word2 ..." }
#[tauri::command]
pub async fn create_identity(
    display_name: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let (identity, recovery_phrase) = Identity::create(display_name)
        .map_err(|e| e.to_string())?;

    let did = identity.did_string();

    let result = serde_json::json!({
        "did": did,
        "recovery_phrase": recovery_phrase.phrase()
    });

    *state.identity.write().await = Some(identity);

    Ok(result.to_string())
}

/// Restore identity from a recovery phrase.
///
/// Returns the DID string on success.
#[tauri::command]
pub async fn restore_identity(
    recovery_phrase: String,
    display_name: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let recovery = RecoveryPhrase::from_phrase(&recovery_phrase)
        .map_err(|e| e.to_string())?;

    let identity = Identity::from_recovery_phrase(&recovery, display_name)
        .map_err(|e| e.to_string())?;

    let did = identity.did_string();
    *state.identity.write().await = Some(identity);

    Ok(did)
}

/// Set identity from serialized JSON (for context hydration).
///
/// On desktop, when the user's identity is persisted in localStorage and
/// the app restarts, the JS layer calls this to hydrate the Rust backend.
/// We create a new identity with the given display name so the backend
/// has valid keys for relay registration and crypto operations.
///
/// Accepts JSON: { "did": "...", "display_name": "..." }
#[tauri::command]
pub async fn set_identity(
    json: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    // If we already have an identity loaded, skip
    let guard = state.identity.read().await;
    if guard.is_some() {
        return Ok(());
    }
    drop(guard);

    // Parse the JSON to extract display_name
    let parsed: serde_json::Value = serde_json::from_str(&json)
        .map_err(|e| format!("Invalid JSON: {}", e))?;

    let display_name = parsed
        .get("display_name")
        .and_then(|v| v.as_str())
        .unwrap_or("User")
        .to_string();

    // Create a new identity so the Rust backend has valid keys for crypto
    let (identity, _recovery) = Identity::create(display_name)
        .map_err(|e| e.to_string())?;

    tracing::info!(did = %identity.did_string(), "Hydrated identity for context restoration");
    *state.identity.write().await = Some(identity);

    Ok(())
}

/// Get the current identity's DID.
#[tauri::command]
pub async fn get_did(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let guard = state.identity.read().await;
    match &*guard {
        Some(identity) => Ok(identity.did_string()),
        None => Err("No identity loaded".to_string()),
    }
}

/// Get current identity profile as JSON.
///
/// Returns JSON: { "did": "...", "display_name": "...", "status": "...", "avatar": "..." }
#[tauri::command]
pub async fn get_profile(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let guard = state.identity.read().await;
    match &*guard {
        Some(identity) => {
            let profile = identity.profile();
            let json = serde_json::json!({
                "did": identity.did_string(),
                "display_name": profile.display_name,
                "status": profile.status,
                "avatar": profile.avatar,
            });
            Ok(json.to_string())
        }
        None => Err("No identity loaded".to_string()),
    }
}

/// Update identity profile fields.
///
/// Accepts JSON with optional fields: display_name, status, avatar
#[tauri::command]
pub async fn update_profile(
    json: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let updates: serde_json::Value = serde_json::from_str(&json)
        .map_err(|e| format!("Invalid JSON: {}", e))?;

    let mut guard = state.identity.write().await;
    let identity = guard.as_mut()
        .ok_or("No identity loaded")?;

    if let Some(name) = updates.get("display_name").and_then(|v| v.as_str()) {
        identity.profile_mut().apply_update(ProfileUpdate::DisplayName(name.to_string()))
            .map_err(|e| e.to_string())?;
    }
    if let Some(status) = updates.get("status") {
        let status_val = if status.is_null() { None } else { status.as_str().map(|s| s.to_string()) };
        identity.profile_mut().apply_update(ProfileUpdate::Status(status_val))
            .map_err(|e| e.to_string())?;
    }
    if let Some(avatar) = updates.get("avatar") {
        let avatar_val = if avatar.is_null() { None } else { avatar.as_str().map(|s| s.to_string()) };
        identity.profile_mut().apply_update(ProfileUpdate::Avatar(avatar_val))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Initialize the database.
///
/// Creates a SQLite database (native rusqlite on desktop).
#[tauri::command]
pub async fn init_database(
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let database = Database::open(None).await
        .map_err(|e| format!("Failed to open database: {}", e))?;

    *state.database.write().await = Some(Arc::new(database));
    Ok(true)
}

/// Initialize the Umbra core (panic hooks, tracing).
///
/// On native this sets up tracing-subscriber instead of console_error_panic_hook.
#[tauri::command]
pub async fn init() -> Result<(), String> {
    // Tracing is already set up in lib.rs run()
    Ok(())
}

/// Get the Umbra core version.
#[tauri::command]
pub async fn version() -> Result<String, String> {
    Ok(umbra_core::version().to_string())
}
