//! # C API
//!
//! C-compatible FFI functions for iOS and other native platforms.
//!
//! All functions follow the naming convention: `umbra_<module>_<action>`

use std::ffi::CStr;
use std::os::raw::c_char;
use std::sync::Arc;

use super::state::{get_runtime, get_state, init_state, FfiState};
use super::types::*;
use crate::discovery::ConnectionInfo;
use crate::friends::FriendsService;
use crate::identity::Identity;
use crate::identity::RecoveryPhrase;
use crate::messaging::MessagingService;
use crate::network::{NetworkConfig, NetworkService};

// ============================================================================
// HELPERS
// ============================================================================

/// Safely create a FriendsService from the current state.
///
/// Falls back to creating a temporary service when `state.friends` is not
/// cached. Uses the identity's keypair to construct a new `Identity` value
/// (via recovery-free reconstruction) rather than the old `ptr::read` trick,
/// which was unsound (double-free on `ZeroizeOnDrop` data).
fn get_or_create_friends_service(state: &FfiState) -> Result<Arc<FriendsService>, FfiResult> {
    if let Some(f) = &state.friends {
        return Ok(f.clone());
    }
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| FfiResult::err(200, "No identity loaded".to_string()))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| FfiResult::err(400, "Database not initialized".to_string()))?;
    // Construct a standalone Identity clone using the keypair bytes.
    // Identity::from_keypair_bytes duplicates key material safely.
    let cloned = Identity::clone_for_service(identity)
        .map_err(|e| FfiResult::err(200, format!("Failed to clone identity: {}", e)))?;
    Ok(Arc::new(FriendsService::new(
        Arc::new(cloned),
        database.clone(),
    )))
}

/// Safely create a MessagingService from the current state.
fn get_or_create_messaging_service(state: &FfiState) -> Result<Arc<MessagingService>, FfiResult> {
    if let Some(m) = &state.messaging {
        return Ok(m.clone());
    }
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| FfiResult::err(200, "No identity loaded".to_string()))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| FfiResult::err(400, "Database not initialized".to_string()))?;
    let cloned = Identity::clone_for_service(identity)
        .map_err(|e| FfiResult::err(200, format!("Failed to clone identity: {}", e)))?;
    Ok(Arc::new(MessagingService::new(
        Arc::new(cloned),
        database.clone(),
    )))
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
    if init_state(FfiState::new(path.clone())).is_err() {
        return FfiResult::err(101, "Already initialized".to_string());
    }

    // Initialize SecureStore (iOS Keychain / Android Keystore / in-memory fallback)
    {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };
        let mut st = state.write();
        st.secure_store = Some(crate::storage::SecureStore::new());
        tracing::info!("SecureStore initialized");
    }

    tracing::info!("Umbra FFI initialized with storage path: {}", path);
    FfiResult::ok_empty()
}

/// Initialize the database.
///
/// Opens (or creates) an SQLite database at `<storage_path>/umbra.db`.
/// Must be called after `umbra_init()` and before any data-access methods.
///
/// # Returns
/// FfiResult with success/error status
#[no_mangle]
pub extern "C" fn umbra_init_database() -> FfiResult {
    let rt = get_runtime();

    rt.block_on(async {
        let state = match get_state() {
            Ok(s) => s,
            Err(e) => return FfiResult::err(e.code(), e.to_string()),
        };

        // Check if database is already initialized
        {
            let st = state.read();
            if st.database.is_some() {
                tracing::info!("Database already initialized");
                return FfiResult::ok_empty();
            }
        }

        let db_path = {
            let st = state.read();
            format!("{}/umbra.db", st.storage_path)
        };

        match crate::storage::Database::open(Some(&db_path)).await {
            Ok(database) => {
                let mut st = state.write();
                st.database = Some(Arc::new(database));
                tracing::info!("Database initialized at: {}", db_path);
                FfiResult::ok_empty()
            }
            Err(e) => {
                tracing::error!("Failed to open database: {}", e);
                FfiResult::err(400, format!("Failed to open database: {}", e))
            }
        }
    })
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
    std::ffi::CString::new(crate::version()).unwrap().into_raw()
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
/// JSON with { did, recovery_phrase }
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
            // Use .phrase() to get the space-separated recovery phrase string
            let phrase_str = recovery_phrase.phrase();
            state.write().identity = Some(identity);

            let json = serde_json::json!({
                "did": did,
                "recovery_phrase": phrase_str
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
    let phrase_str = match cstr_to_string(recovery_phrase) {
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

    // Parse the phrase string into a RecoveryPhrase
    let recovery = match RecoveryPhrase::from_phrase(&phrase_str) {
        Ok(r) => r,
        Err(e) => return FfiResult::err(202, format!("Invalid recovery phrase: {}", e)),
    };

    match Identity::from_recovery_phrase(&recovery, name) {
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
                "status": profile.status,
                "avatar": profile.avatar,
            });
            FfiResult::ok(json.to_string())
        }
        None => FfiResult::err(200, "No identity loaded".to_string()),
    }
}

/// Update identity profile
///
/// # Arguments
/// * `json` - JSON object with fields to update (display_name, status, avatar)
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

    // ProfileUpdate is an enum — apply each field as a separate update
    let profile = identity.profile_mut();

    if let Some(name) = updates.get("display_name").and_then(|v| v.as_str()) {
        if let Err(e) = profile.apply_update(crate::ProfileUpdate::DisplayName(name.to_string())) {
            return FfiResult::err(205, format!("Failed to update display_name: {}", e));
        }
    }
    if let Some(status) = updates.get("status").and_then(|v| v.as_str()) {
        if let Err(e) = profile.apply_update(crate::ProfileUpdate::Status(Some(status.to_string())))
        {
            return FfiResult::err(205, format!("Failed to update status: {}", e));
        }
    }
    if let Some(avatar) = updates.get("avatar").and_then(|v| v.as_str()) {
        if let Err(e) = profile.apply_update(crate::ProfileUpdate::Avatar(Some(avatar.to_string())))
        {
            return FfiResult::err(205, format!("Failed to update avatar: {}", e));
        }
    }

    FfiResult::ok_empty()
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
                Some(json) => match serde_json::from_str::<serde_json::Value>(&json) {
                    Ok(v) => NetworkConfig {
                        listen_addrs: v
                            .get("listen_addrs")
                            .and_then(|a| a.as_array())
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|v| v.as_str().map(String::from))
                                    .collect()
                            })
                            .unwrap_or_else(|| vec!["/ip4/0.0.0.0/tcp/0".to_string()]),
                        bootstrap_peers: v
                            .get("bootstrap_peers")
                            .and_then(|a| a.as_array())
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|v| v.as_str().map(String::from))
                                    .collect()
                            })
                            .unwrap_or_default(),
                        enable_dht: v
                            .get("enable_dht")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(true),
                        enable_relay: v
                            .get("enable_relay")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false),
                        relay_url: v
                            .get("relay_url")
                            .and_then(|v| v.as_str())
                            .map(String::from),
                    },
                    Err(e) => return FfiResult::err(504, format!("Invalid config JSON: {}", e)),
                },
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
            let addrs: Vec<String> = network
                .listen_addrs()
                .iter()
                .map(|a| a.to_string())
                .collect();
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
        } else if info_str.starts_with('{') {
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

        let _identity = match &state.identity {
            Some(i) => i,
            None => return FfiResult::err(200, "No identity loaded".to_string()),
        };

        let _network = match &state.network {
            Some(n) => n,
            None => return FfiResult::err(500, "Network not started".to_string()),
        };

        // TODO: Wire up discovery lookup when DiscoveryService API is confirmed
        FfiResult::err(
            503,
            format!("Peer lookup not yet implemented for DID: {}", did_str),
        )
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

    let friends_service = match get_or_create_friends_service(&state) {
        Ok(f) => f,
        Err(e) => return e,
    };

    match friends_service.create_request(&did_str, msg) {
        Ok(request) => {
            let json = serde_json::json!({
                "id": request.id,
                "from_did": request.from.did,
                "to_did": request.to_did,
                "message": request.message,
                "created_at": request.created_at,
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

    let friends_service = match get_or_create_friends_service(&state) {
        Ok(f) => f,
        Err(e) => return e,
    };

    match friends_service.accept_request(&id) {
        Ok((friend, _response)) => {
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

    let friends_service = match get_or_create_friends_service(&state) {
        Ok(f) => f,
        Err(e) => return e,
    };

    match friends_service.reject_request(&id) {
        Ok(_response) => FfiResult::ok_empty(),
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

    match database.get_all_friends() {
        Ok(friends) => {
            let friends_json: Vec<serde_json::Value> = friends
                .iter()
                .map(|f| {
                    serde_json::json!({
                        "did": f.did,
                        "display_name": f.display_name,
                        "status": f.status,
                        "created_at": f.created_at,
                    })
                })
                .collect();

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

    // Get both incoming and outgoing pending requests
    match database.get_pending_requests("incoming") {
        Ok(requests) => {
            let requests_json: Vec<serde_json::Value> = requests
                .iter()
                .map(|r| {
                    serde_json::json!({
                        "id": r.id,
                        "from_did": r.from_did,
                        "to_did": r.to_did,
                        "message": r.message,
                        "created_at": r.created_at,
                    })
                })
                .collect();

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

    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let database = match &state.database {
        Some(d) => d,
        None => return FfiResult::err(400, "Database not initialized".to_string()),
    };

    // Look up the friend by DID to get the Friend object
    let friend_record = match database.get_friend(&recipient) {
        Ok(Some(f)) => f,
        Ok(None) => return FfiResult::err(503, format!("Friend not found: {}", recipient)),
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let messaging = match get_or_create_messaging_service(&state) {
        Ok(m) => m,
        Err(e) => return e,
    };

    // Build a Friend from the database record for the messaging API
    let friend = crate::friends::Friend {
        did: friend_record.did,
        display_name: friend_record.display_name,
        status: friend_record.status,
        avatar: None,
        encryption_public_key: [0u8; 32], // Will be populated from signing_key/encryption_key
        signing_public_key: [0u8; 32],
        added_at: friend_record.created_at,
        online: false,
        last_seen: None,
    };

    match messaging.send_text(&friend, &message) {
        Ok((msg, _envelope)) => {
            let json = serde_json::json!({
                "id": msg.id,
                "conversation_id": msg.conversation_id,
                "timestamp": msg.timestamp,
            });
            FfiResult::ok(json.to_string())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

/// Get conversations list
#[no_mangle]
pub extern "C" fn umbra_messaging_get_conversations() -> FfiResult {
    let state = match get_state() {
        Ok(s) => s,
        Err(e) => return FfiResult::err(e.code(), e.to_string()),
    };

    let state = state.read();

    let messaging = match get_or_create_messaging_service(&state) {
        Ok(m) => m,
        Err(e) => return e,
    };

    let conversations = messaging.get_conversations();
    let conv_json: Vec<serde_json::Value> = conversations
        .iter()
        .map(|c| {
            serde_json::json!({
                "id": c.id,
                "friend_did": c.friend_did,
                "conv_type": c.conv_type,
                "friend_name": c.friend_name,
                "last_message_preview": c.last_message_preview,
                "last_message_at": c.last_message_at,
                "unread_count": c.unread_count,
            })
        })
        .collect();

    FfiResult::ok(serde_json::to_string(&conv_json).unwrap_or_default())
}

/// Get messages for a conversation
#[no_mangle]
pub unsafe extern "C" fn umbra_messaging_get_messages(
    conversation_id: *const c_char,
    limit: i32,
    offset: i32,
) -> FfiResult {
    let conv_id = match cstr_to_string(conversation_id) {
        Some(c) => c,
        None => return FfiResult::err(700, "Invalid conversation ID".to_string()),
    };

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
    let offset = if offset < 0 { 0 } else { offset as usize };

    match database.get_messages(&conv_id, limit, offset) {
        Ok(messages) => {
            let messages_json: Vec<serde_json::Value> = messages
                .iter()
                .map(|m| {
                    serde_json::json!({
                        "id": m.id,
                        "conversation_id": m.conversation_id,
                        "sender_did": m.sender_did,
                        "content_encrypted": m.content_encrypted,
                        "nonce": m.nonce,
                        "timestamp": m.timestamp,
                        "delivered": m.delivered,
                        "read": m.read,
                    })
                })
                .collect();

            FfiResult::ok(serde_json::to_string(&messages_json).unwrap_or_default())
        }
        Err(e) => FfiResult::err(e.code(), e.to_string()),
    }
}

// ============================================================================
// GENERIC DISPATCHER
// ============================================================================

/// Generic JSON-RPC style dispatcher for all operations.
///
/// This single FFI function replaces the need for 280+ individual `extern "C"`
/// functions. The method name is matched internally and the appropriate service
/// method is called with the JSON arguments.
///
/// # Arguments
/// * `method` - Method name (e.g. "community_create", "messaging_edit")
/// * `args` - JSON string with method arguments
///
/// # Returns
/// FfiResult with JSON response data
#[no_mangle]
pub unsafe extern "C" fn umbra_call(method: *const c_char, args: *const c_char) -> FfiResult {
    let method_str = match cstr_to_string(method) {
        Some(m) => m,
        None => return FfiResult::err(1, "Invalid method name".to_string()),
    };
    let args_str = cstr_to_string(args).unwrap_or_else(|| "{}".to_string());

    match super::dispatcher::dispatch(&method_str, &args_str) {
        Ok(result) => FfiResult::ok(result),
        Err((code, msg)) => FfiResult::err(code, msg),
    }
}
