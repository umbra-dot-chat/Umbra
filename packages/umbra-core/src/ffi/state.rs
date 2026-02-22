//! # Shared FFI State
//!
//! Global state and runtime shared between `c_api.rs` and `dispatcher.rs`.

use once_cell::sync::OnceCell;
use parking_lot::RwLock;
use std::sync::Arc;
use tokio::runtime::Runtime;

use crate::community::CommunityService;
use crate::discovery::DiscoveryService;
use crate::friends::FriendsService;
use crate::identity::Identity;
use crate::messaging::files::DmFileService;
use crate::messaging::MessagingService;
use crate::network::NetworkService;
use crate::storage::Database;
use crate::storage::SecureStore;

// ============================================================================
// RUNTIME
// ============================================================================

/// Global async runtime for FFI calls
static RUNTIME: OnceCell<Runtime> = OnceCell::new();

/// Global state
static STATE: OnceCell<Arc<RwLock<FfiState>>> = OnceCell::new();

/// C callback type for pushing events to Swift/Kotlin
pub type EventCallback =
    extern "C" fn(event_type: *const std::os::raw::c_char, data: *const std::os::raw::c_char);

/// FFI state holding all services
pub(crate) struct FfiState {
    pub identity: Option<Identity>,
    pub network: Option<Arc<NetworkService>>,
    pub discovery: Option<Arc<DiscoveryService>>,
    pub friends: Option<Arc<FriendsService>>,
    pub messaging: Option<Arc<MessagingService>>,
    pub database: Option<Arc<Database>>,
    pub community: Option<Arc<CommunityService>>,
    pub file_service: Option<Arc<DmFileService>>,
    pub secure_store: Option<SecureStore>,
    pub event_callback: Option<EventCallback>,
    pub storage_path: String,
}

impl FfiState {
    pub fn new(storage_path: String) -> Self {
        Self {
            identity: None,
            network: None,
            discovery: None,
            friends: None,
            messaging: None,
            database: None,
            community: None,
            file_service: None,
            secure_store: None,
            event_callback: None,
            storage_path,
        }
    }
}

pub(crate) fn get_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| Runtime::new().expect("Failed to create Tokio runtime"))
}

pub(crate) fn get_state() -> crate::Result<Arc<RwLock<FfiState>>> {
    STATE.get().cloned().ok_or(crate::Error::NotInitialized)
}

pub(crate) fn init_state(state: FfiState) -> Result<(), ()> {
    STATE.set(Arc::new(RwLock::new(state))).map_err(|_| ())
}
