use std::sync::Arc;
use tokio::sync::RwLock;
use umbra_core::identity::Identity;
use umbra_core::storage::Database;

/// Shared application state managed by Tauri.
///
/// Mirrors the WASM `WasmState` but lives in the native Tauri backend.
/// All fields are behind `RwLock` for safe concurrent access from
/// multiple Tauri command invocations.
pub struct AppState {
    pub identity: RwLock<Option<Identity>>,
    pub database: RwLock<Option<Arc<Database>>>,
    /// Whether the network is "running" (stub for now — full TCP networking
    /// will be added in a follow-up once the desktop build is working).
    pub network_running: RwLock<bool>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            identity: RwLock::new(None),
            database: RwLock::new(None),
            network_running: RwLock::new(false),
        }
    }
}
