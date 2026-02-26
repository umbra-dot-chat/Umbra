use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

use umbra_core::ffi::{dispatch, get_ffi_state, init_state, FfiState};

/// Whether the FFI dispatcher state has been initialized.
static FFI_INITIALIZED: AtomicBool = AtomicBool::new(false);

/// Initialize the FFI dispatcher state and database.
///
/// Must be called once before `umbra_call`. Creates the FFI state,
/// opens the database, and stores it in the dispatcher's global state.
/// Identity is then set via `umbra_call("identity_create", ...)` or
/// `umbra_call("identity_restore", ...)`.
#[tauri::command]
pub async fn init_ffi_state() -> Result<bool, String> {
    if !FFI_INITIALIZED.load(Ordering::Relaxed) {
        if init_state(FfiState::new(String::new())).is_ok() {
            FFI_INITIALIZED.store(true, Ordering::Relaxed);
            tracing::info!("[init_ffi_state] FFI dispatcher state initialized");
        }
    }

    // Open a database and store it in the FFI state
    let database = umbra_core::storage::Database::open(None)
        .await
        .map_err(|e| format!("Failed to open database: {}", e))?;

    let ffi_state = get_ffi_state()
        .map_err(|e| format!("FFI state not initialized: {}", e))?;
    {
        let mut st = ffi_state.write();
        st.database = Some(Arc::new(database));
    }

    tracing::info!("[init_ffi_state] Database initialized in FFI state");
    Ok(true)
}

/// Generic dispatcher command — routes all calls through the FFI dispatcher.
///
/// This single command replaces all dedicated Tauri commands. The dispatcher
/// lives in `umbra-core`, so its logic can be updated via frontend OTA without
/// rebuilding the native binary.
///
/// Returns JSON string on success, error string on failure.
#[tauri::command]
pub async fn umbra_call(
    method: String,
    args: String,
) -> Result<String, String> {
    dispatch(&method, &args).map_err(|(code, msg)| {
        format!("Error {}: {}", code, msg)
    })
}
