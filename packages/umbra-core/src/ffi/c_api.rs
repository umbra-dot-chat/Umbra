//! # C API
//!
//! C-compatible FFI functions for iOS and other native platforms.
//!
//! All functions follow the naming convention: `umbra_<module>_<action>`

use std::ffi::CStr;
use std::os::raw::c_char;
use std::sync::Arc;
use parking_lot::RwLock;
use once_cell::sync::OnceCell;
use tokio::runtime::Runtime;

use super::types::*;
use crate::error::Result;
use crate::identity::Identity;
use crate::friends::FriendService;
use crate::messaging::MessagingService;
use crate::network::{NetworkService, NetworkConfig};
use crate::discovery::{DiscoveryService, DiscoveryConfig, ConnectionInfo};
use crate::storage::Database;

// ============================================================================
// RUNTIME
// ============================================================================

/// Global async runtime for FFI calls
static RUNTIME: OnceCell<Runtime> = OnceCell::new();

/// Global state
static STATE: OnceCell<Arc<RwLock<FfiState>>> = OnceCell::new();

/// FFI state holding all services
struct FfiState {
    identity: Option<Identity>,
    network: Option<Arc<NetworkService>>,
    discovery: Option<Arc<DiscoveryService>>,
    friends: Option<Arc<FriendService>>,
    messaging: Option<Arc<MessagingService>>,
    database: Option<Database>,
    storage_path: String,
}

impl FfiState {
    fn new(storage_path: String) -> Self {
        Self {
            identity: None,
            network: None,
            discovery: None,
            friends: None,
            messaging: None,
            database: None,
            storage_path,
        }
    }
}

fn get_runtime() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        Runtime::new().expect("Failed to create Tokio runtime")
    })
}

fn get_state() -> Result<Arc<RwLock<FfiState>>> {
    STATE.get().cloned().ok_or(crate::Error::NotInitialized)
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/// Initialize Umbra Core
///
/// Must be called before any other functions.
///
/// # Arguments
/// * `storage_path` - Path to store data (null for default)
///
/// # Returns
/// FfiResult with success/error status
#[no_mangle]
pub unsafe extern "C" fn umbra_init(storage_path: *const c_char) -> FfiResult {
    let path = if storage_path.is_null() {
        "./umbra_data".to_string()
    } else {
        match CStr::from_ptr(storage_path).to_str() {
            Ok(s) => s.to_string(),
            Err(_) => return FfiResult::err(1, "Invalid storage path".to_string()),
        }
    };

    // Initialize the runtime
    let _ = get_runtime();

    // Initialize state
    if STATE.set(Arc::new(RwLock::new(FfiState::new(path.clone())))).is_err() {
        return FfiResult::err(101, "Already initialized".to_string());
    }

    tracing::info!("Umbra FFI initialized with storage path: {}", path);
    FfiResult::ok_empty()
}

/// Shutdown Umbra Core
///
/// Cleans up all resources and stops network connections.
#[no_mangle]
pub extern "C" fn umbra_shutdown() -> FfiResult {
    let rt = get_runtime();

    rt.block_on(async {
        if let Ok(state) = get_state() {
            let mut state = state.write();

            // Stop network
            if let Some(ref network) = state.network {
                let _ = network.stop().await;
            }

            // Clear state
            state.identity = None;
            state.network = None;
            state.discovery = None;
            state.friends = None;
            state.messaging = None;
        }

        FfiResult::ok_empty()
    })
}

/// Get Umbra Core version
#[no_mangle]
pub extern "C" fn umbra_version() -> *mut c_char {
    std::ffi::CString::new(crate::version())
        .unwrap()
        .into_raw()
}

// ============================================================================
// IDENTITY
// ============================================================================

/// Create a new identity
///
/// # Arguments
/// * `display_name` - User's display name
///
/// # Returns
/// FfiIdentityInfo with identity details including recovery phrase
#[no_mangle]
pub unsafe extern "C" fn umbra_identity_create(display_name: *const c_char) -> FfiResult {
    let name = match cstr_to_string(display_name) {
        Some(n) => n,
        None => return FfiResult::err(200, "Invalid display name".to_string()),
    };

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    match Identity::create(name) {
        Ok((identity, recovery_phrase)) => {
            let did = identity.did_string();
            state.write().identity = Some(identity);

            // Return JSON with identity info
            let json = serde_json::json!({
                "did": did,
                "recovery_phrase": recovery_phrase
            });
            FfiResult::ok(json.to_string())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Restore identity from recovery phrase
///
/// # Arguments
/// * `recovery_phrase` - 24-word BIP39 mnemonic
/// * `display_name` - User's display name
#[no_mangle]
pub unsafe extern "C" fn umbra_identity_restore(
    recovery_phrase: *const c_char,
    display_name: *const c_char,
) -> FfiResult {
    let phrase = match cstr_to_string(recovery_phrase) {
        Some(p) => p,
        None => return FfiResult::err(202, "Invalid recovery phrase".to_string()),
    };

    let name = match cstr_to_string(display_name) {
        Some(n) => n,
        None => return FfiResult::err(200, "Invalid display name".to_string()),
    };

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    match Identity::restore(&phrase, name) {
        Ok(identity) => {
            let did = identity.did_string();
            state.write().identity = Some(identity);
            FfiResult::ok(did)
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Get current identity DID
#[no_mangle]
pub extern "C" fn umbra_identity_get_did() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();
    match &state.identity {
        Some(identity) => FfiResult::ok(identity.did_string()),
        None => FfiResult::err(200, "No identity loaded".to_string()),
    }
}

/// Get current identity profile as JSON
#[no_mangle]
pub extern "C" fn umbra_identity_get_profile() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();
    match &state.identity {
        Some(identity) => {
            let profile = identity.profile();
            let json = serde_json::json!({
                "did": identity.did_string(),
                "display_name": profile.display_name,
                "bio": profile.bio,
                "avatar_url": profile.avatar_url,
            });
            FfiResult::ok(json.to_string())
        }
        None => FfiResult::err(200, "No identity loaded".to_string()),
    }
}

/// Update identity profile
///
/// # Arguments
/// * `json` - JSON object with fields to update (display_name, bio, avatar_url)
#[no_mangle]
pub unsafe extern "C" fn umbra_identity_update_profile(json: *const c_char) -> FfiResult {
    let json_str = match cstr_to_string(json) {
        Some(j) => j,
        None => return FfiResult::err(205, "Invalid JSON".to_string()),
    };

    let updates: serde_json::Value = match serde_json::from_str(&json_str) {
        Ok(v) => v,
        Err(e) => return FfiResult::err(205, format!("Invalid JSON: {}", e)),
    };

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let mut state = state.write();
    let identity = match state.identity.as_mut() {
        Some(i) => i,
        None => return FfiResult::err(200, "No identity loaded".to_string()),
    };

    let mut update = crate::ProfileUpdate::default();

    if let Some(name) = updates.get("display_name").and_then(|v| v.as_str()) {
        update.display_name = Some(name.to_string());
    }
    if let Some(bio) = updates.get("bio").and_then(|v| v.as_str()) {
        update.bio = Some(Some(bio.to_string()));
    }
    if let Some(avatar) = updates.get("avatar_url").and_then(|v| v.as_str()) {
        update.avatar_url = Some(Some(avatar.to_string()));
    }

    match identity.update_profile(update) {
        Ok(_) => FfiResult::ok_empty(),
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

// ============================================================================
// NETWORK
// ============================================================================

/// Start the network service
///
/// # Arguments
/// * `config_json` - Optional JSON config (null for defaults)
#[no_mangle]
pub unsafe extern "C" fn umbra_network_start(config_json: *const c_char) -> FfiResult {
    let rt = get_runtime();

    rt.block_on(async {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        let mut state_guard = state.write();

        let identity = match &state_guard.identity {
            Some(i) => i,
            None => return FfiResult::err(200, "No identity loaded".to_string()),
        };

        let config = if config_json.is_null() {
            NetworkConfig::default()
        } else {
            match cstr_to_string(config_json) {
                Some(json) => {
                    match serde_json::from_str::<serde_json::Value>(&json) {
                        Ok(v) => NetworkConfig {
                            listen_addrs: v.get("listen_addrs")
                                .and_then(|a| a.as_array())
                                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                                .unwrap_or_else(|| vec!["/ip4/0.0.0.0/tcp/0".to_string()]),
                            bootstrap_peers: v.get("bootstrap_peers")
                                .and_then(|a| a.as_array())
                                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                                .unwrap_or_default(),
                            enable_dht: v.get("enable_dht").and_then(|v| v.as_bool()).unwrap_or(true),
                            enable_relay: v.get("enable_relay").and_then(|v| v.as_bool()).unwrap_or(false),
                            relay_url: v.get("relay_url").and_then(|v| v.as_str()).map(String::from),
                        },
                        Err(e) => return FfiResult::err(504, format!("Invalid config JSON: {}", e)),
                    }
                }
                None => NetworkConfig::default(),
            }
        };

        match NetworkService::new(identity.keypair(), config).await {
            Ok(network) => {
                let network = Arc::new(network);

                if let Err(e) = network.start().await {
                    return FfiResult::err(e.code(), e.to_string());
                }

                let peer_id = network.peer_id().to_string();
                state_guard.network = Some(network);

                FfiResult::ok(peer_id)
            }
            Err(e) => FfiResult::err(e.code(), e.to_string()),
        }
    })
}

/// Stop the network service
#[no_mangle]
pub extern "C" fn umbra_network_stop() -> FfiResult {
    let rt = get_runtime();

    rt.block_on(async {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        let mut state = state.write();
        if let Some(ref network) = state.network {
            if let Err(e) = network.stop().await {
                return FfiResult::err(e.code(), e.to_string());
            }
        }
        state.network = None;

        FfiResult::ok_empty()
    })
}

/// Get network status
#[no_mangle]
pub extern "C" fn umbra_network_status() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();
    match &state.network {
        Some(network) => {
            let addrs: Vec<String> = network.listen_addrs().iter().map(|a| a.to_string()).collect();
            let json = serde_json::json!({
                "is_running": network.is_running(),
                "peer_id": network.peer_id().to_string(),
                "listen_addresses": addrs,
                "connected_peers": network.connected_peers().len(),
            });
            FfiResult::ok(json.to_string())
        }
        None => FfiResult::err(500, "Network not started".to_string()),
    }
}

/// Connect to a peer by multiaddr
#[no_mangle]
pub unsafe extern "C" fn umbra_network_connect(addr: *const c_char) -> FfiResult {
    let addr_str = match cstr_to_string(addr) {
        Some(a) => a,
        None => return FfiResult::err(504, "Invalid address".to_string()),
    };

    let rt = get_runtime();

    rt.block_on(async {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        let state = state.read();
        let network = match &state.network {
            Some(n) => n,
            None => return FfiResult::err(500, "Network not started".to_string()),
        };

        let multiaddr = match addr_str.parse() {
            Ok(a) => a,
            Err(e) => return FfiResult::err(504, format!("Invalid multiaddr: {}", e)),
        };

        match network.connect(multiaddr).await {
            Ok(_) => FfiResult::ok_empty(),
            Err(e) => FfiResult::err(e.code(), e.to_string()),
        }
    })
}

// ============================================================================
// DISCOVERY
// ============================================================================

/// Generate connection info for sharing (QR code / link)
#[no_mangle]
pub extern "C" fn umbra_discovery_get_connection_info() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let identity = match &state.identity {
        Some(i) => i,
        None => return FfiResult::err(200, "No identity loaded".to_string()),
    };

    let network = match &state.network {
        Some(n) => n,
        None => return FfiResult::err(500, "Network not started".to_string()),
    };

    let info = ConnectionInfo::from_identity(identity, network);

    let json = serde_json::json!({
        "link": info.to_link().unwrap_or_default(),
        "json": info.to_json().unwrap_or_default(),
        "base64": info.to_base64().unwrap_or_default(),
        "did": info.did,
        "peer_id": info.peer_id,
        "addresses": info.addresses,
        "display_name": info.display_name,
    });

    FfiResult::ok(json.to_string())
}

/// Connect to a peer using connection info (from QR code / link)
#[no_mangle]
pub unsafe extern "C" fn umbra_discovery_connect_with_info(info: *const c_char) -> FfiResult {
    let info_str = match cstr_to_string(info) {
        Some(i) => i,
        None => return FfiResult::err(504, "Invalid connection info".to_string()),
    };

    let rt = get_runtime();

    rt.block_on(async {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        let state = state.read();
        let network = match &state.network {
            Some(n) => n,
            None => return FfiResult::err(500, "Network not started".to_string()),
        };

        // Try parsing as link first, then base64, then JSON
        let connection_info = if info_str.starts_with("umbra://") {
            ConnectionInfo::from_link(&info_str)
        } else if info_str.starts_with("{") {
            ConnectionInfo::from_json(&info_str)
        } else {
            ConnectionInfo::from_base64(&info_str)
        };

        let info = match connection_info {
            Ok(i) => i,
            Err(e) => return FfiResult::err(504, format!("Invalid connection info: {}", e)),
        };

        // Connect to each address
        for addr_str in &info.addresses {
            if let Ok(addr) = addr_str.parse() {
                let _ = network.connect(addr).await;
            }
        }

        FfiResult::ok(info.peer_id)
    })
}

/// Lookup a peer by DID
#[no_mangle]
pub unsafe extern "C" fn umbra_discovery_lookup_peer(did: *const c_char) -> FfiResult {
    let did_str = match cstr_to_string(did) {
        Some(d) => d,
        None => return FfiResult::err(204, "Invalid DID".to_string()),
    };

    let rt = get_runtime();

    rt.block_on(async {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        let state = state.read();

        let identity = match &state.identity {
            Some(i) => i,
            None => return FfiResult::err(200, "No identity loaded".to_string()),
        };

        let network = match &state.network {
            Some(n) => n,
            None => return FfiResult::err(500, "Network not started".to_string()),
        };

        let discovery = DiscoveryService::new(
            Arc::new(identity.clone()),
            network.clone(),
            DiscoveryConfig::default(),
        );

        match discovery.lookup_peer(&did_str).await {
            Ok(Some(peer)) => {
                let addrs: Vec<String> = peer.addresses.iter().map(|a| a.to_string()).collect();
                let json = serde_json::json!({
                    "did": peer.did,
                    "peer_id": peer.peer_id.to_string(),
                    "addresses": addrs,
                    "display_name": peer.display_name,
                });
                FfiResult::ok(json.to_string())
            }
            Ok(None) => FfiResult::err(503, "Peer not found".to_string()),
            Err(e) => FfiResult::err(e.code(), e.to_string()),
        }
    })
}

// ============================================================================
// FRIENDS
// ============================================================================

/// Send a friend request
#[no_mangle]
pub unsafe extern "C" fn umbra_friends_send_request(
    did: *const c_char,
    message: *const c_char,
) -> FfiResult {
    let did_str = match cstr_to_string(did) {
        Some(d) => d,
        None => return FfiResult::err(204, "Invalid DID".to_string()),
    };

    let msg = cstr_to_string(message);

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let identity = match &state.identity {
        Some(i) => i,
        None => return FfiResult::err(200, "No identity loaded".to_string()),
    };

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    let friend_service = FriendService::new(identity.clone(), database.clone());

    match friend_service.send_request(&did_str, msg) {
        Ok(request) => {
            let json = serde_json::json!({
                "id": request.id,
                "to_did": request.to_did,
                "status": format!("{:?}", request.status),
            });
            FfiResult::ok(json.to_string())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Accept a friend request
#[no_mangle]
pub unsafe extern "C" fn umbra_friends_accept_request(request_id: *const c_char) -> FfiResult {
    let id = match cstr_to_string(request_id) {
        Some(i) => i,
        None => return FfiResult::err(603, "Invalid request ID".to_string()),
    };

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let identity = match &state.identity {
        Some(i) => i,
        None => return FfiResult::err(200, "No identity loaded".to_string()),
    };

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    let friend_service = FriendService::new(identity.clone(), database.clone());

    match friend_service.accept_request(&id) {
        Ok(friend) => {
            let json = serde_json::json!({
                "did": friend.did,
                "display_name": friend.display_name,
            });
            FfiResult::ok(json.to_string())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Reject a friend request
#[no_mangle]
pub unsafe extern "C" fn umbra_friends_reject_request(request_id: *const c_char) -> FfiResult {
    let id = match cstr_to_string(request_id) {
        Some(i) => i,
        None => return FfiResult::err(603, "Invalid request ID".to_string()),
    };

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let identity = match &state.identity {
        Some(i) => i,
        None => return FfiResult::err(200, "No identity loaded".to_string()),
    };

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    let friend_service = FriendService::new(identity.clone(), database.clone());

    match friend_service.reject_request(&id) {
        Ok(_) => FfiResult::ok_empty(),
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Get list of friends
#[no_mangle]
pub extern "C" fn umbra_friends_list() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    match database.get_friends() {
        Ok(friends) => {
            let friends_json: Vec<serde_json::Value> = friends.iter().map(|f| {
                serde_json::json!({
                    "did": f.did,
                    "display_name": f.display_name,
                    "nickname": f.nickname,
                    "added_at": f.added_at,
                })
            }).collect();

            FfiResult::ok(serde_json::to_string(&friends_json).unwrap_or_default())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Get pending friend requests
#[no_mangle]
pub extern "C" fn umbra_friends_pending_requests() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    match database.get_pending_friend_requests() {
        Ok(requests) => {
            let requests_json: Vec<serde_json::Value> = requests.iter().map(|r| {
                serde_json::json!({
                    "id": r.id,
                    "from_did": r.from_did,
                    "message": r.message,
                    "created_at": r.created_at,
                })
            }).collect();

            FfiResult::ok(serde_json::to_string(&requests_json).unwrap_or_default())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

// ============================================================================
// MESSAGING
// ============================================================================

/// Send a text message
#[no_mangle]
pub unsafe extern "C" fn umbra_messaging_send_text(
    recipient_did: *const c_char,
    text: *const c_char,
) -> FfiResult {
    let recipient = match cstr_to_string(recipient_did) {
        Some(r) => r,
        None => return FfiResult::err(204, "Invalid recipient DID".to_string()),
    };

    let message = match cstr_to_string(text) {
        Some(t) => t,
        None => return FfiResult::err(704, "Invalid message".to_string()),
    };

    let rt = get_runtime();

    rt.block_on(async {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        let state = state.read();

        let identity = match &state.identity {
            Some(i) => i,
            None => return FfiResult::err(200, "No identity loaded".to_string()),
        };

        let database = match &state.database {
            Some(d) => d,
            None => return FfiResult::err(400, "Database not initialized".to_string()),
        };

        let messaging = MessagingService::new(identity.clone(), database.clone());

        // Get or create conversation
        let conversation = match messaging.get_or_create_conversation(&recipient).await {
            Ok(c) => c,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        match messaging.send_text(&conversation.id, &message).await {
            Ok(msg) => {
                let json = serde_json::json!({
                    "id": msg.id,
                    "conversation_id": msg.conversation_id,
                    "timestamp": msg.timestamp,
                });
                FfiResult::ok(json.to_string())
            }
            Err(e) => FfiResult::err(e.code(), e.to_string()),
        }
    })
}

/// Get conversations list
#[no_mangle]
pub extern "C" fn umbra_messaging_get_conversations() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    match database.get_conversations() {
        Ok(conversations) => {
            let conv_json: Vec<serde_json::Value> = conversations.iter().map(|c| {
                serde_json::json!({
                    "id": c.id,
                    "participant_did": c.participant_did,
                    "created_at": c.created_at,
                    "updated_at": c.updated_at,
                })
            }).collect();

            FfiResult::ok(serde_json::to_string(&conv_json).unwrap_or_default())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Get messages for a conversation
#[no_mangle]
pub unsafe extern "C" fn umbra_messaging_get_messages(
    conversation_id: *const c_char,
    limit: i32,
    before_id: *const c_char,
) -> FfiResult {
    let conv_id = match cstr_to_string(conversation_id) {
        Some(c) => c,
        None => return FfiResult::err(700, "Invalid conversation ID".to_string()),
    };

    let before = cstr_to_string(before_id);

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    let limit = if limit <= 0 { 50 } else { limit as usize };

    match database.get_messages(&conv_id, limit, before.as_deref()) {
        Ok(messages) => {
            let messages_json: Vec<serde_json::Value> = messages.iter().map(|m| {
                serde_json::json!({
                    "id": m.id,
                    "conversation_id": m.conversation_id,
                    "sender_did": m.sender_did,
                    "content_type": m.content_type,
                    "content": m.content_encrypted, // Note: encrypted, needs decryption
                    "timestamp": m.timestamp,
                    "status": m.status,
                })
            }).collect();

            FfiResult::ok(serde_json::to_string(&messages_json).unwrap_or_default())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}
