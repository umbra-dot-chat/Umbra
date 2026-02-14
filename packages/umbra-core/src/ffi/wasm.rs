//! # WASM Bindings
//!
//! WebAssembly bindings for browser/web platform.
//!
//! ## Available Functions
//!
//! - Identity: create, restore, get_did, get_profile, update_profile
//! - Discovery: get_connection_info, parse_connection_info
//! - Friends: send_request, accept_request, reject_request, list, pending_requests, remove, block, unblock
//! - Messaging: get_conversations, get_messages, send, mark_read
//! - Network: start, stop, status
//! - Events: subscribe
//! - Crypto: sign, verify

#![cfg(feature = "wasm")]

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;
use js_sys::Promise;
use std::sync::Arc;
use parking_lot::RwLock;
use once_cell::sync::OnceCell;

use base64::Engine as _;
use sha2::{Sha256, Digest};
use crate::identity::{Identity, RecoveryPhrase, ProfileUpdate};
use crate::network::NetworkService;
use crate::discovery::ConnectionInfo;
use crate::friends::FriendRequest;
use crate::storage::{Database, FriendRequestRecord, GroupInviteRecord};

/// Generate a deterministic conversation ID from two DIDs.
///
/// Both sides of a friendship will produce the same ID because the DIDs
/// are sorted before hashing. This ensures that when Alice accepts Bob's
/// friend request, both Alice and Bob create the same conversation ID.
fn deterministic_conversation_id(did_a: &str, did_b: &str) -> String {
    let mut dids = [did_a, did_b];
    dids.sort();
    let input = format!("{}|{}", dids[0], dids[1]);
    let hash = Sha256::digest(input.as_bytes());
    format!("{:x}", hash)
}

// ============================================================================
// STATE
// ============================================================================

static STATE: OnceCell<Arc<RwLock<WasmState>>> = OnceCell::new();

// Event callback stored for WASM→JS event push.
// Using thread_local! because js_sys::Function is !Send, and WASM is single-threaded.
thread_local! {
    static EVENT_CALLBACK: std::cell::RefCell<Option<js_sys::Function>> = std::cell::RefCell::new(None);
}

struct WasmState {
    identity: Option<Identity>,
    network: Option<Arc<NetworkService>>,
    database: Option<Arc<Database>>,
    /// Injector for pushing completed WebRTC connections into the libp2p swarm.
    /// Created when the network starts, used by signaling FFI functions.
    #[cfg(target_arch = "wasm32")]
    connection_injector: Option<crate::network::webrtc_transport::WebRtcConnectionInjector>,
}

impl WasmState {
    fn new() -> Self {
        Self {
            identity: None,
            network: None,
            database: None,
            #[cfg(target_arch = "wasm32")]
            connection_injector: None,
        }
    }
}

fn get_state() -> Result<Arc<RwLock<WasmState>>, JsValue> {
    STATE.get().cloned().ok_or_else(|| JsValue::from_str("Not initialized"))
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/// Initialize Umbra for web
///
/// Sets up panic hook and tracing. Must be called before any other function.
#[wasm_bindgen]
pub fn umbra_wasm_init() -> Result<(), JsValue> {
    // Set up panic hook for better error messages
    console_error_panic_hook::set_once();

    // Initialize tracing for wasm
    tracing_wasm::set_as_global_default();

    if STATE.set(Arc::new(RwLock::new(WasmState::new()))).is_err() {
        return Err(JsValue::from_str("Already initialized"));
    }

    Ok(())
}

/// Initialize the database
///
/// Creates an in-memory SQLite database (via sql.js on WASM).
/// Must be called after umbra_wasm_init() and before any data operations.
#[wasm_bindgen]
pub fn umbra_wasm_init_database() -> Promise {
    future_to_promise(async move {
        let state = get_state()?;
        let database = Database::open(None).await
            .map_err(|e| JsValue::from_str(&format!("Failed to open database: {}", e)))?;

        let db = Arc::new(database);
        state.write().database = Some(db);

        Ok(JsValue::TRUE)
    })
}

/// Get version
#[wasm_bindgen]
pub fn umbra_wasm_version() -> String {
    crate::version().to_string()
}

// ============================================================================
// IDENTITY
// ============================================================================

/// Create a new identity
///
/// Returns JSON: { "did": "did:key:...", "recovery_phrase": "word1 word2 ..." }
#[wasm_bindgen]
pub fn umbra_wasm_identity_create(display_name: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;

    match Identity::create(display_name.to_string()) {
        Ok((identity, recovery_phrase)) => {
            let did = identity.did_string();
            state.write().identity = Some(identity);

            let result = serde_json::json!({
                "did": did,
                "recovery_phrase": recovery_phrase.phrase()
            });

            Ok(JsValue::from_str(&result.to_string()))
        }
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}

/// Restore identity from recovery phrase
///
/// Returns the DID string on success.
#[wasm_bindgen]
pub fn umbra_wasm_identity_restore(
    recovery_phrase: &str,
    display_name: &str,
) -> Result<String, JsValue> {
    let state = get_state()?;

    let recovery = RecoveryPhrase::from_phrase(recovery_phrase)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    match Identity::from_recovery_phrase(&recovery, display_name.to_string()) {
        Ok(identity) => {
            let did = identity.did_string();
            state.write().identity = Some(identity);
            Ok(did)
        }
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}

/// Get current identity DID
#[wasm_bindgen]
pub fn umbra_wasm_identity_get_did() -> Result<String, JsValue> {
    let state = get_state()?;
    let state = state.read();

    match &state.identity {
        Some(identity) => Ok(identity.did_string()),
        None => Err(JsValue::from_str("No identity loaded")),
    }
}

/// Get current identity profile as JSON
///
/// Returns JSON: { "did": "...", "display_name": "...", "status": "...", "avatar": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_identity_get_profile() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    match &state.identity {
        Some(identity) => {
            let profile = identity.profile();
            let json = serde_json::json!({
                "did": identity.did_string(),
                "display_name": profile.display_name,
                "status": profile.status,
                "avatar": profile.avatar,
                "signing_key": hex::encode(&identity.keypair().signing.public_bytes()),
                "encryption_key": hex::encode(&identity.keypair().encryption.public_bytes()),
            });
            Ok(JsValue::from_str(&json.to_string()))
        }
        None => Err(JsValue::from_str("No identity loaded")),
    }
}

/// Update identity profile
///
/// Accepts JSON with optional fields: display_name, status, avatar
#[wasm_bindgen]
pub fn umbra_wasm_identity_update_profile(json: &str) -> Result<(), JsValue> {
    let updates: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let state = get_state()?;
    let mut state = state.write();

    let identity = state.identity.as_mut()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    // Apply each update individually via the enum variants
    if let Some(name) = updates.get("display_name").and_then(|v| v.as_str()) {
        identity.profile_mut().apply_update(ProfileUpdate::DisplayName(name.to_string()))
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    }
    if let Some(status) = updates.get("status") {
        let status_val = if status.is_null() { None } else { status.as_str().map(|s| s.to_string()) };
        identity.profile_mut().apply_update(ProfileUpdate::Status(status_val))
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    }
    if let Some(avatar) = updates.get("avatar") {
        let avatar_val = if avatar.is_null() { None } else { avatar.as_str().map(|s| s.to_string()) };
        identity.profile_mut().apply_update(ProfileUpdate::Avatar(avatar_val))
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    }

    Ok(())
}

// ============================================================================
// DISCOVERY
// ============================================================================

/// Generate connection info for sharing
///
/// Returns JSON with link, json, base64, did, peer_id, addresses, display_name
#[wasm_bindgen]
pub fn umbra_wasm_discovery_get_connection_info() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let network = state.network.as_ref()
        .ok_or_else(|| JsValue::from_str("Network not started"))?;

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

    Ok(JsValue::from_str(&json.to_string()))
}

/// Parse connection info from string (link, base64, or JSON)
///
/// Returns JSON with did, peer_id, addresses, display_name
#[wasm_bindgen]
pub fn umbra_wasm_discovery_parse_connection_info(info: &str) -> Result<JsValue, JsValue> {
    let connection_info = if info.starts_with("umbra://") {
        ConnectionInfo::from_link(info)
    } else if info.starts_with('{') {
        ConnectionInfo::from_json(info)
    } else {
        ConnectionInfo::from_base64(info)
    };

    let info = connection_info
        .map_err(|e| JsValue::from_str(&format!("Invalid connection info: {}", e)))?;

    let json = serde_json::json!({
        "did": info.did,
        "peer_id": info.peer_id,
        "addresses": info.addresses,
        "display_name": info.display_name,
    });

    Ok(JsValue::from_str(&json.to_string()))
}

// ============================================================================
// FRIENDS
// ============================================================================

/// Send a friend request
///
/// Creates a signed friend request, stores it in the database,
/// and sends it over the P2P network if connected.
/// Returns JSON: { "id": "...", "to_did": "...", "from_did": "...", "created_at": ... }
#[wasm_bindgen]
pub fn umbra_wasm_friends_send_request(
    did: &str,
    message: Option<String>,
) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // Create a signed friend request directly
    let request = FriendRequest::create(identity, did.to_string(), message)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Store in database as an outgoing request
    let record = FriendRequestRecord {
        id: request.id.clone(),
        from_did: request.from.did.clone(),
        to_did: request.to_did.clone(),
        direction: "outgoing".to_string(),
        message: request.message.clone(),
        from_signing_key: Some(hex::encode(&request.from.public_keys.signing)),
        from_encryption_key: Some(hex::encode(&request.from.public_keys.encryption)),
        from_display_name: Some(request.from.display_name.clone()),
        created_at: request.created_at,
        status: "pending".to_string(),
    };

    database.store_friend_request(&record)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Send over the network if connected
    if let Some(ref network) = state.network {
        let wire_request = crate::network::codec::UmbraRequest::Friend(
            crate::network::protocols::FriendRequest {
                request_type: crate::network::protocols::FriendRequestType::Request,
                from_did: request.from.did.clone(),
                from_display_name: request.from.display_name.clone(),
                from_signing_key: hex::encode(&request.from.public_keys.signing),
                from_encryption_key: hex::encode(&request.from.public_keys.encryption),
                to_did: request.to_did.clone(),
                message: request.message.clone(),
                timestamp: request.created_at,
                signature: hex::encode(&request.signature.0),
            }
        );

        if let Ok(wire_bytes) = bincode::serialize(&wire_request) {
            // Send to all connected peers (in WebRTC mode, we're 1:1 connected)
            let peers = network.connected_peers();
            for peer_info in &peers {
                let network_clone = network.clone();
                let bytes_clone = wire_bytes.clone();
                let peer_id = peer_info.peer_id;
                wasm_bindgen_futures::spawn_local(async move {
                    if let Err(e) = network_clone.send_message(peer_id, bytes_clone).await {
                        tracing::warn!("Failed to send friend request to peer {}: {}", peer_id, e);
                    }
                });
            }
        }
    }

    let json = serde_json::json!({
        "id": request.id,
        "to_did": request.to_did,
        "from_did": request.from.did,
        "from_signing_key": hex::encode(&request.from.public_keys.signing),
        "from_encryption_key": hex::encode(&request.from.public_keys.encryption),
        "from_display_name": request.from.display_name,
        "message": request.message,
        "created_at": request.created_at,
    });
    Ok(JsValue::from_str(&json.to_string()))
}

/// Store an incoming friend request received via relay.
/// Takes a JSON string with the request fields.
#[wasm_bindgen]
pub fn umbra_wasm_friends_store_incoming(json: &str) -> Result<(), JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let record = FriendRequestRecord {
        id: data["id"].as_str().unwrap_or(&uuid::Uuid::new_v4().to_string()).to_string(),
        from_did: data["from_did"].as_str().unwrap_or("").to_string(),
        to_did: data["to_did"].as_str().unwrap_or("").to_string(),
        direction: "incoming".to_string(),
        message: data["message"].as_str().map(|s| s.to_string()),
        from_signing_key: data["from_signing_key"].as_str().map(|s| s.to_string()),
        from_encryption_key: data["from_encryption_key"].as_str().map(|s| s.to_string()),
        from_display_name: data["from_display_name"].as_str().map(|s| s.to_string()),
        created_at: data["created_at"].as_i64().unwrap_or(0),
        status: "pending".to_string(),
    };

    database.store_friend_request(&record)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(())
}

/// Process a friend request acceptance received via relay.
///
/// When the remote peer accepted our friend request, we need to:
/// 1. Add them as a friend using their public keys
/// 2. Create a conversation for this friendship
/// 3. Update the outgoing request status to "accepted"
///
/// This mirrors the logic in `handle_inbound_friend_request` for `FriendRequestType::Accept`.
/// Takes JSON: { "from_did", "from_display_name", "from_signing_key", "from_encryption_key" }
/// Returns JSON: { "friend_did", "conversation_id" }
#[wasm_bindgen]
pub fn umbra_wasm_friends_accept_from_relay(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let our_did = identity.did_string();

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let from_did = data["from_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing from_did"))?;
    let display_name = data["from_display_name"].as_str().unwrap_or("Unknown");
    let signing_key_hex = data["from_signing_key"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing from_signing_key"))?;
    let encryption_key_hex = data["from_encryption_key"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing from_encryption_key"))?;

    let signing_key_bytes = hex::decode(signing_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid signing key hex: {}", e)))?;
    let encryption_key_bytes = hex::decode(encryption_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid encryption key hex: {}", e)))?;

    if signing_key_bytes.len() != 32 || encryption_key_bytes.len() != 32 {
        return Err(JsValue::from_str("Keys must be 32 bytes"));
    }

    let mut signing_key = [0u8; 32];
    signing_key.copy_from_slice(&signing_key_bytes);
    let mut encryption_key = [0u8; 32];
    encryption_key.copy_from_slice(&encryption_key_bytes);

    // Add as friend
    database.add_friend(from_did, display_name, &signing_key, &encryption_key, None)
        .map_err(|e| JsValue::from_str(&format!("Failed to add friend: {}", e)))?;

    // Create conversation with deterministic ID (both sides produce the same ID)
    let conversation_id = deterministic_conversation_id(&our_did, from_did);
    // Use INSERT OR IGNORE in case conversation already exists (e.g. both sides accepted)
    let _ = database.create_conversation(&conversation_id, from_did);

    // Try to update outgoing request status to "accepted"
    // (best-effort — the request might not exist if it was a P2P-initiated friendship)
    if let Ok(outgoing) = database.get_pending_requests("outgoing") {
        for req in &outgoing {
            if req.to_did == from_did {
                let _ = database.update_request_status(&req.id, "accepted");
                break;
            }
        }
    }

    // Emit event
    emit_event("friend", &serde_json::json!({
        "type": "friendRequestAccepted",
        "friend": {
            "did": from_did,
            "display_name": display_name,
            "conversation_id": conversation_id,
        }
    }));

    let result = serde_json::json!({
        "friend_did": from_did,
        "conversation_id": conversation_id,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Accept a friend request
///
/// Accepts the request by:
/// 1. Looking up the request record (must have sender's keys)
/// 2. Adding the sender as a friend in the database
/// 3. Creating a conversation for this friendship
/// 4. Sending an acceptance response over the network
///
/// Returns JSON: { "request_id", "status", "conversation_id", "friend_did" }
#[wasm_bindgen]
pub fn umbra_wasm_friends_accept_request(request_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // 1. Look up the incoming request to get the sender's keys
    let request_record = database.get_friend_request(request_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to look up request: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend request not found"))?;

    // Update request status to accepted
    database.update_request_status(request_id, "accepted")
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // 2. Add the sender as a friend using their keys from the request
    let signing_key_hex = request_record.from_signing_key
        .as_ref()
        .ok_or_else(|| JsValue::from_str("Request missing sender's signing key"))?;
    let encryption_key_hex = request_record.from_encryption_key
        .as_ref()
        .ok_or_else(|| JsValue::from_str("Request missing sender's encryption key"))?;
    let display_name = request_record.from_display_name
        .as_deref()
        .unwrap_or("Unknown");

    let signing_key_bytes = hex::decode(signing_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid signing key hex: {}", e)))?;
    let encryption_key_bytes = hex::decode(encryption_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid encryption key hex: {}", e)))?;

    if signing_key_bytes.len() != 32 || encryption_key_bytes.len() != 32 {
        return Err(JsValue::from_str("Keys must be 32 bytes"));
    }

    let mut signing_key = [0u8; 32];
    signing_key.copy_from_slice(&signing_key_bytes);
    let mut encryption_key = [0u8; 32];
    encryption_key.copy_from_slice(&encryption_key_bytes);

    let friend_did = &request_record.from_did;

    database.add_friend(friend_did, display_name, &signing_key, &encryption_key, None)
        .map_err(|e| JsValue::from_str(&format!("Failed to add friend: {}", e)))?;

    // 3. Create a conversation for this friendship (deterministic ID)
    let our_did = identity.did_string();
    let conversation_id = deterministic_conversation_id(&our_did, friend_did);
    let _ = database.create_conversation(&conversation_id, friend_did);

    // 4. Send acceptance response over the network if connected
    if let Some(ref network) = state.network {
        let our_signing_key = hex::encode(&identity.keypair().signing.public_bytes());
        let our_encryption_key = hex::encode(&identity.keypair().encryption.public_bytes());

        let wire_request = crate::network::codec::UmbraRequest::Friend(
            crate::network::protocols::FriendRequest {
                request_type: crate::network::protocols::FriendRequestType::Accept,
                from_did: identity.did_string(),
                from_display_name: identity.profile().display_name.clone(),
                from_signing_key: our_signing_key,
                from_encryption_key: our_encryption_key,
                to_did: friend_did.clone(),
                message: None,
                timestamp: crate::time::now_timestamp_millis(),
                signature: String::new(), // Acceptance doesn't need full signature verification
            }
        );

        if let Ok(wire_bytes) = bincode::serialize(&wire_request) {
            let peers = network.connected_peers();
            for peer_info in &peers {
                let network_clone = network.clone();
                let bytes_clone = wire_bytes.clone();
                let peer_id = peer_info.peer_id;
                wasm_bindgen_futures::spawn_local(async move {
                    if let Err(e) = network_clone.send_message(peer_id, bytes_clone).await {
                        tracing::warn!("Failed to send acceptance to peer {}: {}", peer_id, e);
                    }
                });
            }
        }
    }

    // Emit events for real-time UI updates
    emit_event("friend", &serde_json::json!({
        "type": "friendAdded",
        "friend": {
            "did": friend_did,
            "display_name": display_name,
            "conversation_id": conversation_id,
        }
    }));

    let json = serde_json::json!({
        "request_id": request_id,
        "status": "accepted",
        "conversation_id": conversation_id,
        "friend_did": friend_did,
    });
    Ok(JsValue::from_str(&json.to_string()))
}

/// Reject a friend request
///
/// Updates the request status to "rejected" in the database.
#[wasm_bindgen]
pub fn umbra_wasm_friends_reject_request(request_id: &str) -> Result<(), JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.update_request_status(request_id, "rejected")
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(())
}

/// Get list of friends as JSON array
///
/// Each friend: { "did": "...", "display_name": "...", "status": "...", "signing_key": "...",
///                "encryption_key": "...", "created_at": ..., "updated_at": ... }
#[wasm_bindgen]
pub fn umbra_wasm_friends_list() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    match database.get_all_friends() {
        Ok(friends) => {
            let friends_json: Vec<serde_json::Value> = friends.iter().map(|f| {
                serde_json::json!({
                    "did": f.did,
                    "display_name": f.display_name,
                    "status": f.status,
                    "signing_key": f.signing_key,
                    "encryption_key": f.encryption_key,
                    "created_at": f.created_at,
                    "updated_at": f.updated_at,
                })
            }).collect();

            Ok(JsValue::from_str(&serde_json::to_string(&friends_json).unwrap_or_default()))
        }
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}

/// Get pending incoming friend requests as JSON array
///
/// Each request: { "id": "...", "from_did": "...", "to_did": "...", "direction": "...",
///                 "message": "...", "from_display_name": "...", "created_at": ..., "status": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_friends_pending_requests(direction: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // direction should be "incoming" or "outgoing"
    match database.get_pending_requests(direction) {
        Ok(requests) => {
            let requests_json: Vec<serde_json::Value> = requests.iter().map(|r| {
                serde_json::json!({
                    "id": r.id,
                    "from_did": r.from_did,
                    "to_did": r.to_did,
                    "direction": r.direction,
                    "message": r.message,
                    "from_signing_key": r.from_signing_key,
                    "from_encryption_key": r.from_encryption_key,
                    "from_display_name": r.from_display_name,
                    "created_at": r.created_at,
                    "status": r.status,
                })
            }).collect();

            Ok(JsValue::from_str(&serde_json::to_string(&requests_json).unwrap_or_default()))
        }
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}

/// Remove a friend by DID
#[wasm_bindgen]
pub fn umbra_wasm_friends_remove(did: &str) -> Result<bool, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.remove_friend(did)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Block a user by DID
#[wasm_bindgen]
pub fn umbra_wasm_friends_block(did: &str, reason: Option<String>) -> Result<(), JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.block_user(did, reason.as_deref())
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Unblock a user by DID
#[wasm_bindgen]
pub fn umbra_wasm_friends_unblock(did: &str) -> Result<bool, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.unblock_user(did)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

// ============================================================================
// MESSAGING
// ============================================================================

/// Get conversations list as JSON array
///
/// Each conversation: { "id": "...", "friend_did": "...", "created_at": ...,
///                      "last_message_at": ..., "unread_count": ... }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_get_conversations() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    match database.get_all_conversations() {
        Ok(conversations) => {
            let conv_json: Vec<serde_json::Value> = conversations.iter().map(|c| {
                serde_json::json!({
                    "id": c.id,
                    "friend_did": c.friend_did,
                    "type": c.conv_type,
                    "group_id": c.group_id,
                    "created_at": c.created_at,
                    "last_message_at": c.last_message_at,
                    "unread_count": c.unread_count,
                })
            }).collect();

            Ok(JsValue::from_str(&serde_json::to_string(&conv_json).unwrap_or_default()))
        }
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}

/// Create (or get) a DM conversation for a given friend DID.
///
/// Uses a deterministic conversation ID derived from both DIDs so that both
/// sides always produce the same ID.  If the conversation already exists this
/// is a no-op and the existing ID is returned.
///
/// Returns JSON: `{ "conversation_id": "..." }`
#[wasm_bindgen]
pub fn umbra_wasm_messaging_create_dm_conversation(
    friend_did: &str,
) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let our_did = identity.did_string();
    let conv_id = deterministic_conversation_id(&our_did, friend_did);

    // INSERT OR IGNORE — idempotent
    let _ = database.create_conversation(&conv_id, friend_did);

    let result = serde_json::json!({ "conversation_id": conv_id });
    Ok(JsValue::from_str(&serde_json::to_string(&result).unwrap_or_default()))
}

/// Get messages for a conversation as JSON array
///
/// Each message: { "id": "...", "conversation_id": "...", "sender_did": "...",
///                 "content_encrypted": "...", "nonce": "...", "timestamp": ...,
///                 "delivered": bool, "read": bool }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_get_messages(
    conversation_id: &str,
    limit: i32,
    offset: i32,
) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let limit = if limit <= 0 { 50 } else { limit as usize };
    let offset = if offset < 0 { 0 } else { offset as usize };

    match database.get_messages(conversation_id, limit, offset) {
        Ok(messages) => {
            // Get thread reply counts for all messages in one batch
            let message_ids: Vec<String> = messages.iter().map(|m| m.id.clone()).collect();
            let thread_counts = database.get_thread_reply_counts(&message_ids).unwrap_or_default();

            let messages_json: Vec<serde_json::Value> = messages.iter().map(|m| {
                let reply_count = thread_counts.get(&m.id).copied().unwrap_or(0);
                serde_json::json!({
                    "id": m.id,
                    "conversation_id": m.conversation_id,
                    "sender_did": m.sender_did,
                    "content_encrypted": m.content_encrypted,
                    "nonce": m.nonce,
                    "timestamp": m.timestamp,
                    "delivered": m.delivered,
                    "read": m.read,
                    "threadReplyCount": reply_count,
                })
            }).collect();

            Ok(JsValue::from_str(&serde_json::to_string(&messages_json).unwrap_or_default()))
        }
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}

/// Send a message in a conversation
///
/// Encrypts the message with the friend's X25519 key (AES-256-GCM),
/// stores it locally, and sends it over the P2P network if connected.
/// Returns JSON: { "id", "conversation_id", "sender_did", "timestamp", "delivered", "read" }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_send(
    conversation_id: &str,
    content: &str,
) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let message_id = uuid::Uuid::new_v4().to_string();
    let sender_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();

    // Look up the conversation to find the friend's DID
    let conversation = database.get_conversation(conversation_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to get conversation: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Conversation not found"))?;

    let friend_did = conversation.friend_did.as_deref()
        .ok_or_else(|| JsValue::from_str("Cannot send message: conversation has no friend_did (group?)"))?;

    // Look up the friend's encryption key
    let friend_record = database.get_friend(friend_did)
        .map_err(|e| JsValue::from_str(&format!("Failed to get friend: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found — cannot encrypt message"))?;

    let friend_encryption_key_bytes = hex::decode(&friend_record.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid friend encryption key: {}", e)))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_encryption_key_bytes.len() != 32 {
        return Err(JsValue::from_str("Friend encryption key must be 32 bytes"));
    }
    friend_enc_key.copy_from_slice(&friend_encryption_key_bytes);

    // Encrypt the content using X25519 ECDH + AES-256-GCM
    let aad = format!("{}{}{}", sender_did, friend_did, timestamp);
    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &friend_enc_key,
        conversation_id.as_bytes(),
        content.as_bytes(),
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

    // Store encrypted message locally
    database.store_message(
        &message_id,
        conversation_id,
        &sender_did,
        &ciphertext,
        &nonce.0,
        timestamp,
    ).map_err(|e| JsValue::from_str(&format!("Failed to store message: {}", e)))?;

    // Send over the network if connected
    if let Some(ref network) = state.network {
        let wire_request = crate::network::codec::UmbraRequest::Message(
            crate::network::protocols::MessageRequest {
                message_id: message_id.clone(),
                encrypted_content: ciphertext.clone(),
                nonce: nonce.0.to_vec(),
                timestamp,
            }
        );

        if let Ok(wire_bytes) = bincode::serialize(&wire_request) {
            // Try to find the friend's PeerId from connected peers
            // For now, broadcast to all connected peers (1:1 connections via WebRTC)
            let peers = network.connected_peers();
            for peer_info in &peers {
                let network_clone = network.clone();
                let bytes_clone = wire_bytes.clone();
                let peer_id = peer_info.peer_id;
                wasm_bindgen_futures::spawn_local(async move {
                    if let Err(e) = network_clone.send_message(peer_id, bytes_clone).await {
                        tracing::warn!("Failed to send message to peer {}: {}", peer_id, e);
                    }
                });
            }
        }
    }

    // Emit event for real-time updates
    emit_event("message", &serde_json::json!({
        "type": "messageSent",
        "message": {
            "id": message_id,
            "conversation_id": conversation_id,
            "sender_did": sender_did,
            "content": content,
            "timestamp": timestamp,
            "delivered": false,
            "read": false,
        }
    }));

    // Encode ciphertext and nonce for relay forwarding
    let ciphertext_b64 = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
    let nonce_hex = hex::encode(&nonce.0);

    let json = serde_json::json!({
        "id": message_id,
        "conversation_id": conversation_id,
        "sender_did": sender_did,
        "friend_did": friend_did,
        "timestamp": timestamp,
        "delivered": false,
        "read": false,
        "content_encrypted": ciphertext_b64,
        "nonce": nonce_hex,
    });

    Ok(JsValue::from_str(&json.to_string()))
}

/// Mark all messages in a conversation as read
///
/// Returns the number of messages marked as read.
#[wasm_bindgen]
pub fn umbra_wasm_messaging_mark_read(conversation_id: &str) -> Result<i32, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.mark_messages_read(conversation_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Decrypt a stored message.
///
/// Messages are stored encrypted in the database. This function decrypts
/// a single message using the shared secret with the friend.
///
/// Parameters:
/// - conversation_id: The conversation this message belongs to
/// - content_encrypted_b64: Base64-encoded ciphertext
/// - nonce_hex: Hex-encoded 12-byte nonce
/// - sender_did: DID of the message sender
/// - timestamp: Message timestamp (used in AAD)
///
/// Returns the decrypted plaintext string.
#[wasm_bindgen]
pub fn umbra_wasm_messaging_decrypt(
    conversation_id: &str,
    content_encrypted_b64: &str,
    nonce_hex: &str,
    sender_did: &str,
    timestamp: i64,
) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // Look up the conversation to find the friend's DID
    let conversation = database.get_conversation(conversation_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to get conversation: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Conversation not found"))?;

    let friend_did = conversation.friend_did.as_deref()
        .ok_or_else(|| JsValue::from_str("Cannot decrypt: conversation has no friend_did (group?)"))?;
    let our_did = identity.did_string();

    // Look up the friend's encryption key
    let friend_record = database.get_friend(friend_did)
        .map_err(|e| JsValue::from_str(&format!("Failed to get friend: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found"))?;

    let friend_encryption_key_bytes = hex::decode(&friend_record.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid friend encryption key: {}", e)))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_encryption_key_bytes.len() != 32 {
        return Err(JsValue::from_str("Friend encryption key must be 32 bytes"));
    }
    friend_enc_key.copy_from_slice(&friend_encryption_key_bytes);

    // Decode ciphertext and nonce
    let ciphertext = base64::engine::general_purpose::STANDARD.decode(content_encrypted_b64)
        .map_err(|e| JsValue::from_str(&format!("Invalid base64 ciphertext: {}", e)))?;

    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(JsValue::from_str("Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    // Build AAD — must match what was used during encryption
    // Sender encrypts with: {sender_did}{friend_did}{timestamp}
    // So we need to figure out who sent it:
    //   - If we sent it: AAD = {our_did}{friend_did}{timestamp}
    //   - If friend sent it: AAD = {friend_did}{our_did}{timestamp}
    let aad = format!("{}{}{}", sender_did, if sender_did == our_did { friend_did } else { &our_did }, timestamp);

    // Decrypt
    match crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption,
        &friend_enc_key,
        conversation_id.as_bytes(),
        &nonce,
        &ciphertext,
        aad.as_bytes(),
    ) {
        Ok(plaintext) => {
            let text = String::from_utf8_lossy(&plaintext).to_string();
            let json = serde_json::json!(text);
            Ok(JsValue::from_str(&json.to_string()))
        }
        Err(e) => Err(JsValue::from_str(&format!("Decryption failed: {}", e))),
    }
}

/// Store an incoming chat message received via relay.
///
/// Takes JSON with message fields and stores them in the messages table.
/// Validates sender is a known friend, ensures conversation exists (creating
/// one with a deterministic ID if needed), and emits a messageReceived event.
#[wasm_bindgen]
pub fn umbra_wasm_messaging_store_incoming(json: &str) -> Result<(), JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;
    let sender_did = data["sender_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing sender_did"))?;
    let content_encrypted_b64 = data["content_encrypted"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing content_encrypted"))?;
    let nonce_hex = data["nonce"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing nonce"))?;
    let timestamp = data["timestamp"].as_i64().unwrap_or(0);

    // Validate sender is a known friend
    let _friend = database.get_friend(sender_did)
        .map_err(|e| JsValue::from_str(&format!("DB error looking up friend: {}", e)))?
        .ok_or_else(|| JsValue::from_str(&format!("Sender {} is not a known friend", sender_did)))?;

    // Ensure conversation exists — if not, create one with deterministic ID
    let actual_conversation_id = match database.get_conversation(conversation_id) {
        Ok(Some(_)) => conversation_id.to_string(),
        _ => {
            // Conversation doesn't exist — compute deterministic ID from DIDs
            let our_did = identity.did_string();
            let det_id = deterministic_conversation_id(&our_did, sender_did);
            // Create if it doesn't exist yet
            let _ = database.create_conversation(&det_id, sender_did);
            det_id
        }
    };

    // Decode the encrypted content and nonce
    let ciphertext = base64::engine::general_purpose::STANDARD.decode(content_encrypted_b64)
        .map_err(|e| JsValue::from_str(&format!("Invalid base64 ciphertext: {}", e)))?;
    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid nonce hex: {}", e)))?;

    // Check for optional thread_id (thread replies)
    let thread_id = data["thread_id"].as_str();

    // Store in database (use actual_conversation_id which may differ from incoming)
    if let Some(tid) = thread_id {
        // Thread reply — store with thread_id and reply_to_id set
        database.store_message_extended(
            message_id,
            &actual_conversation_id,
            sender_did,
            &ciphertext,
            &nonce_bytes,
            timestamp,
            Some(tid),  // reply_to_id
            Some(tid),  // thread_id
            None,       // forwarded_from
        ).map_err(|e| JsValue::from_str(&format!("Failed to store thread reply: {}", e)))?;
    } else {
        database.store_message(
            message_id,
            &actual_conversation_id,
            sender_did,
            &ciphertext,
            &nonce_bytes,
            timestamp,
        ).map_err(|e| JsValue::from_str(&format!("Failed to store message: {}", e)))?;
    }

    // Emit event for real-time UI updates (use actual_conversation_id)
    let mut event_json = serde_json::json!({
        "type": "messageReceived",
        "message": {
            "id": message_id,
            "conversation_id": actual_conversation_id,
            "sender_did": sender_did,
            "timestamp": timestamp,
        }
    });
    if let Some(tid) = thread_id {
        event_json["message"]["thread_id"] = serde_json::json!(tid);
    }
    emit_event("message", &event_json);

    Ok(())
}

// ============================================================================
// MESSAGING FEATURES (edit, delete, pin, react, thread, forward)
// ============================================================================

/// Edit a message's content.
///
/// Re-encrypts the new text and updates the message in the database.
/// Only the original sender can edit their own messages.
///
/// Takes JSON: { "message_id": "...", "new_text": "..." }
/// Returns JSON: { "message_id", "edited_at", "content_encrypted", "nonce" }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_edit(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let new_text = data["new_text"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing new_text"))?;

    // Look up the message to verify ownership
    let message = database.get_message(message_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Message not found"))?;

    let our_did = identity.did_string();
    if message.sender_did != our_did {
        return Err(JsValue::from_str("Cannot edit: you are not the sender"));
    }

    // Look up friend encryption key for re-encryption
    let conversation = database.get_conversation(&message.conversation_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Conversation not found"))?;

    let friend_did = conversation.friend_did.as_deref()
        .ok_or_else(|| JsValue::from_str("Cannot edit in group conversation yet"))?;

    let friend_record = database.get_friend(friend_did)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found"))?;

    let friend_enc_bytes = hex::decode(&friend_record.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid key: {}", e)))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_enc_bytes.len() != 32 { return Err(JsValue::from_str("Key must be 32 bytes")); }
    friend_enc_key.copy_from_slice(&friend_enc_bytes);

    let edited_at = crate::time::now_timestamp_millis();
    let aad = format!("{}{}{}", our_did, friend_did, edited_at);

    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &friend_enc_key,
        message.conversation_id.as_bytes(),
        new_text.as_bytes(),
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

    database.edit_message(message_id, &ciphertext, &nonce.0, edited_at)
        .map_err(|e| JsValue::from_str(&format!("Failed to edit: {}", e)))?;

    emit_event("message", &serde_json::json!({
        "type": "messageEdited",
        "messageId": message_id,
        "newText": new_text,
        "editedAt": edited_at,
    }));

    let result = serde_json::json!({
        "message_id": message_id,
        "edited_at": edited_at,
        "content_encrypted": base64::engine::general_purpose::STANDARD.encode(&ciphertext),
        "nonce": hex::encode(&nonce.0),
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Soft-delete a message.
///
/// Only the original sender can delete their own messages.
///
/// Takes JSON: { "message_id": "..." }
/// Returns JSON: { "message_id", "deleted_at" }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_delete(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;

    let message = database.get_message(message_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Message not found"))?;

    let our_did = identity.did_string();
    if message.sender_did != our_did {
        return Err(JsValue::from_str("Cannot delete: you are not the sender"));
    }

    let deleted_at = crate::time::now_timestamp_millis();
    database.delete_message(message_id, deleted_at)
        .map_err(|e| JsValue::from_str(&format!("Failed to delete: {}", e)))?;

    emit_event("message", &serde_json::json!({
        "type": "messageDeleted",
        "messageId": message_id,
        "deletedAt": deleted_at,
    }));

    let result = serde_json::json!({
        "message_id": message_id,
        "deleted_at": deleted_at,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Pin a message in a conversation.
///
/// Takes JSON: { "message_id": "..." }
/// Returns JSON: { "message_id", "pinned_by", "pinned_at" }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_pin(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;

    let our_did = identity.did_string();
    let pinned_at = crate::time::now_timestamp_millis();

    database.pin_message(message_id, &our_did, pinned_at)
        .map_err(|e| JsValue::from_str(&format!("Failed to pin: {}", e)))?;

    emit_event("message", &serde_json::json!({
        "type": "messagePinned",
        "messageId": message_id,
        "pinnedBy": our_did,
        "pinnedAt": pinned_at,
    }));

    let result = serde_json::json!({
        "message_id": message_id,
        "pinned_by": our_did,
        "pinned_at": pinned_at,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Unpin a message.
///
/// Takes JSON: { "message_id": "..." }
/// Returns JSON: { "message_id" }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_unpin(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let _identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;

    database.unpin_message(message_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to unpin: {}", e)))?;

    emit_event("message", &serde_json::json!({
        "type": "messageUnpinned",
        "messageId": message_id,
    }));

    let result = serde_json::json!({ "message_id": message_id });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Add a reaction (emoji) to a message.
///
/// Takes JSON: { "message_id": "...", "emoji": "..." }
/// Returns JSON: { "reactions": [...] } — all reactions for the message
#[wasm_bindgen]
pub fn umbra_wasm_messaging_add_reaction(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let emoji = data["emoji"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing emoji"))?;

    let our_did = identity.did_string();
    let reaction_id = uuid::Uuid::new_v4().to_string();
    let now = crate::time::now_timestamp_millis();

    database.add_reaction(&reaction_id, message_id, &our_did, emoji, now)
        .map_err(|e| JsValue::from_str(&format!("Failed to add reaction: {}", e)))?;

    // Return all reactions for the message
    let reactions = database.get_reactions(message_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to get reactions: {}", e)))?;

    let reactions_json: Vec<serde_json::Value> = reactions.iter().map(|r| {
        serde_json::json!({
            "id": r.id,
            "message_id": r.message_id,
            "user_did": r.user_did,
            "emoji": r.emoji,
            "created_at": r.created_at,
        })
    }).collect();

    emit_event("message", &serde_json::json!({
        "type": "reactionAdded",
        "messageId": message_id,
        "emoji": emoji,
        "userDid": our_did,
    }));

    let result = serde_json::json!({ "reactions": reactions_json });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Remove a reaction from a message.
///
/// Takes JSON: { "message_id": "...", "emoji": "..." }
/// Returns JSON: { "reactions": [...] } — remaining reactions
#[wasm_bindgen]
pub fn umbra_wasm_messaging_remove_reaction(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let emoji = data["emoji"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing emoji"))?;

    let our_did = identity.did_string();

    database.remove_reaction(message_id, &our_did, emoji)
        .map_err(|e| JsValue::from_str(&format!("Failed to remove reaction: {}", e)))?;

    let reactions = database.get_reactions(message_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to get reactions: {}", e)))?;

    let reactions_json: Vec<serde_json::Value> = reactions.iter().map(|r| {
        serde_json::json!({
            "id": r.id,
            "message_id": r.message_id,
            "user_did": r.user_did,
            "emoji": r.emoji,
            "created_at": r.created_at,
        })
    }).collect();

    emit_event("message", &serde_json::json!({
        "type": "reactionRemoved",
        "messageId": message_id,
        "emoji": emoji,
        "userDid": our_did,
    }));

    let result = serde_json::json!({ "reactions": reactions_json });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Forward a message to another conversation.
///
/// Copies the message content (re-encrypted) to the target conversation.
///
/// Takes JSON: { "message_id": "...", "target_conversation_id": "..." }
/// Returns JSON: { "new_message_id", "target_conversation_id" }
#[wasm_bindgen]
pub fn umbra_wasm_messaging_forward(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let target_conversation_id = data["target_conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing target_conversation_id"))?;

    // Look up original message to get its content
    let original = database.get_message(message_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Original message not found"))?;

    // Decrypt the original message first
    let original_conv = database.get_conversation(&original.conversation_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Original conversation not found"))?;

    let orig_friend_did = original_conv.friend_did.as_deref()
        .ok_or_else(|| JsValue::from_str("Cannot forward from group conversation yet"))?;

    let orig_friend = database.get_friend(orig_friend_did)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found for original conversation"))?;

    let orig_enc_bytes = hex::decode(&orig_friend.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid key: {}", e)))?;
    let mut orig_enc_key = [0u8; 32];
    if orig_enc_bytes.len() != 32 { return Err(JsValue::from_str("Key must be 32 bytes")); }
    orig_enc_key.copy_from_slice(&orig_enc_bytes);

    let orig_ct = hex::decode(&original.content_encrypted)
        .map_err(|e| JsValue::from_str(&format!("Invalid ciphertext hex: {}", e)))?;
    let orig_nonce_bytes = hex::decode(&original.nonce)
        .map_err(|e| JsValue::from_str(&format!("Invalid nonce hex: {}", e)))?;
    if orig_nonce_bytes.len() != 12 {
        return Err(JsValue::from_str("Original nonce must be 12 bytes"));
    }
    let mut orig_nonce_arr = [0u8; 12];
    orig_nonce_arr.copy_from_slice(&orig_nonce_bytes);
    let orig_nonce = crate::crypto::Nonce(orig_nonce_arr);

    let our_did = identity.did_string();
    let orig_sender = &original.sender_did;
    let orig_aad = format!("{}{}{}", orig_sender,
        if orig_sender == &our_did { orig_friend_did } else { &our_did },
        original.timestamp);

    let plaintext = crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption,
        &orig_enc_key,
        original.conversation_id.as_bytes(),
        &orig_nonce,
        &orig_ct,
        orig_aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Failed to decrypt original: {}", e)))?;

    // Re-encrypt for target conversation
    let target_conv = database.get_conversation(target_conversation_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Target conversation not found"))?;

    let target_friend_did = target_conv.friend_did.as_deref()
        .ok_or_else(|| JsValue::from_str("Cannot forward to group conversation yet"))?;

    let target_friend = database.get_friend(target_friend_did)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found for target conversation"))?;

    let target_enc_bytes = hex::decode(&target_friend.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid key: {}", e)))?;
    let mut target_enc_key = [0u8; 32];
    if target_enc_bytes.len() != 32 { return Err(JsValue::from_str("Key must be 32 bytes")); }
    target_enc_key.copy_from_slice(&target_enc_bytes);

    let new_msg_id = uuid::Uuid::new_v4().to_string();
    let timestamp = crate::time::now_timestamp_millis();
    let aad = format!("{}{}{}", our_did, target_friend_did, timestamp);

    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &target_enc_key,
        target_conversation_id.as_bytes(),
        &plaintext,
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

    database.store_message_extended(
        &new_msg_id, target_conversation_id, &our_did,
        &ciphertext, &nonce.0, timestamp,
        None, None, Some(message_id),
    ).map_err(|e| JsValue::from_str(&format!("Failed to store forwarded: {}", e)))?;

    emit_event("message", &serde_json::json!({
        "type": "messageSent",
        "message": {
            "id": new_msg_id,
            "conversation_id": target_conversation_id,
            "sender_did": our_did,
            "timestamp": timestamp,
            "forwarded_from": message_id,
        }
    }));

    let result = serde_json::json!({
        "new_message_id": new_msg_id,
        "target_conversation_id": target_conversation_id,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Get thread replies for a message.
///
/// Returns all messages in the thread (parent + replies).
///
/// Takes JSON: { "parent_id": "..." }
/// Returns JSON: [message, message, ...]
#[wasm_bindgen]
pub fn umbra_wasm_messaging_get_thread(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let parent_id = data["parent_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing parent_id"))?;

    let messages = database.get_thread_messages(parent_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to get thread: {}", e)))?;

    let messages_json: Vec<serde_json::Value> = messages.iter().map(|m| {
        serde_json::json!({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_did": m.sender_did,
            "content_encrypted": m.content_encrypted,
            "nonce": m.nonce,
            "timestamp": m.timestamp,
            "delivered": m.delivered,
            "read": m.read,
            "edited": m.edited,
            "edited_at": m.edited_at,
            "deleted": m.deleted,
            "deleted_at": m.deleted_at,
            "pinned": m.pinned,
            "reply_to_id": m.reply_to_id,
            "thread_id": m.thread_id,
            "forwarded_from": m.forwarded_from,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&messages_json).unwrap_or_default()))
}

/// Send a reply in a thread.
///
/// Creates a new message with thread_id pointing to the parent.
///
/// Takes JSON: { "parent_id": "...", "text": "..." }
/// Returns JSON: same as send_message, with thread_id set
#[wasm_bindgen]
pub fn umbra_wasm_messaging_reply_thread(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let parent_id = data["parent_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing parent_id"))?;
    let text = data["text"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing text"))?;

    // Look up parent message to get conversation_id
    let parent = database.get_message(parent_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Parent message not found"))?;

    let conversation_id = &parent.conversation_id;

    // Look up conversation + friend for encryption
    let conversation = database.get_conversation(conversation_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Conversation not found"))?;

    let friend_did = conversation.friend_did.as_deref()
        .ok_or_else(|| JsValue::from_str("Cannot thread in group conversation yet"))?;

    let friend_record = database.get_friend(friend_did)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found"))?;

    let friend_enc_bytes = hex::decode(&friend_record.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid key: {}", e)))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_enc_bytes.len() != 32 { return Err(JsValue::from_str("Key must be 32 bytes")); }
    friend_enc_key.copy_from_slice(&friend_enc_bytes);

    let our_did = identity.did_string();
    let message_id = uuid::Uuid::new_v4().to_string();
    let timestamp = crate::time::now_timestamp_millis();
    let aad = format!("{}{}{}", our_did, friend_did, timestamp);

    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &friend_enc_key,
        conversation_id.as_bytes(),
        text.as_bytes(),
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

    database.store_message_extended(
        &message_id, conversation_id, &our_did,
        &ciphertext, &nonce.0, timestamp,
        Some(parent_id), Some(parent_id), None,
    ).map_err(|e| JsValue::from_str(&format!("Failed to store reply: {}", e)))?;

    emit_event("message", &serde_json::json!({
        "type": "messageSent",
        "message": {
            "id": message_id,
            "conversation_id": conversation_id,
            "sender_did": our_did,
            "content": text,
            "timestamp": timestamp,
            "thread_id": parent_id,
            "reply_to_id": parent_id,
        }
    }));

    let ct_b64 = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
    let nonce_hex = hex::encode(&nonce.0);

    let result = serde_json::json!({
        "id": message_id,
        "conversation_id": conversation_id,
        "sender_did": our_did,
        "friend_did": friend_did,
        "timestamp": timestamp,
        "thread_id": parent_id,
        "content_encrypted": ct_b64,
        "nonce": nonce_hex,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Get all pinned messages in a conversation.
///
/// Takes JSON: { "conversation_id": "..." }
/// Returns JSON: [message, ...]
#[wasm_bindgen]
pub fn umbra_wasm_messaging_get_pinned(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;

    let messages = database.get_pinned_messages(conversation_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to get pinned: {}", e)))?;

    let messages_json: Vec<serde_json::Value> = messages.iter().map(|m| {
        serde_json::json!({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_did": m.sender_did,
            "content_encrypted": m.content_encrypted,
            "nonce": m.nonce,
            "timestamp": m.timestamp,
            "pinned": true,
            "pinned_by": m.pinned_by,
            "pinned_at": m.pinned_at,
            "edited": m.edited,
            "deleted": m.deleted,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&messages_json).unwrap_or_default()))
}

// ============================================================================
// GROUP OPERATIONS
// ============================================================================

/// Create a new group.
///
/// Takes JSON: { "name": "...", "description": "..." (optional) }
/// Returns JSON: { "group_id", "conversation_id", "name" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_create(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let description = data["description"].as_str();

    let our_did = identity.did_string();
    let group_id = uuid::Uuid::new_v4().to_string();
    let conv_id = format!("group-{}", group_id);
    let now = crate::time::now_timestamp_millis();

    // Create the group
    database.create_group(&group_id, name, description, &our_did, now)
        .map_err(|e| JsValue::from_str(&format!("Failed to create group: {}", e)))?;

    // Add self as admin
    let display_name = identity.profile().display_name.clone();
    database.add_group_member(&group_id, &our_did, Some(&display_name), "admin", now)
        .map_err(|e| JsValue::from_str(&format!("Failed to add self to group: {}", e)))?;

    // Create group conversation
    database.create_group_conversation(&conv_id, &group_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to create group conversation: {}", e)))?;

    let result = serde_json::json!({
        "group_id": group_id,
        "conversation_id": conv_id,
        "name": name,
        "created_by": our_did,
        "created_at": now,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Get group info by ID.
///
/// Takes: group_id as string
/// Returns JSON: { group fields }
#[wasm_bindgen]
pub fn umbra_wasm_groups_get(group_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let group = database.get_group(group_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Group not found"))?;

    let result = serde_json::json!({
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "avatar": group.avatar,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "updated_at": group.updated_at,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// List all groups.
///
/// Returns JSON: [group, ...]
#[wasm_bindgen]
pub fn umbra_wasm_groups_list() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let groups = database.get_all_groups()
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?;

    let groups_json: Vec<serde_json::Value> = groups.iter().map(|g| {
        serde_json::json!({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "avatar": g.avatar,
            "created_by": g.created_by,
            "created_at": g.created_at,
            "updated_at": g.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&groups_json).unwrap_or_default()))
}

/// Update a group's name/description.
///
/// Takes JSON: { "group_id": "...", "name": "...", "description": "..." }
/// Returns JSON: { "group_id", "updated_at" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_update(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let group_id = data["group_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing group_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let description = data["description"].as_str();
    let now = crate::time::now_timestamp_millis();

    database.update_group(group_id, name, description, now)
        .map_err(|e| JsValue::from_str(&format!("Failed to update group: {}", e)))?;

    let result = serde_json::json!({
        "group_id": group_id,
        "updated_at": now,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Delete a group (admin only).
///
/// Takes: group_id as string
/// Returns JSON: { "group_id" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_delete(group_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // Verify admin
    let our_did = identity.did_string();
    let members = database.get_group_members(group_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?;

    let is_admin = members.iter().any(|m| m.member_did == our_did && m.role == "admin");
    if !is_admin {
        return Err(JsValue::from_str("Only admins can delete groups"));
    }

    database.delete_group(group_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to delete group: {}", e)))?;

    let result = serde_json::json!({ "group_id": group_id });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Add a member to a group.
///
/// Takes JSON: { "group_id": "...", "did": "...", "display_name": "..." (optional) }
/// Returns JSON: { "group_id", "member_did" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_add_member(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let group_id = data["group_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing group_id"))?;
    let did = data["did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing did"))?;
    let display_name = data["display_name"].as_str();
    let now = crate::time::now_timestamp_millis();

    database.add_group_member(group_id, did, display_name, "member", now)
        .map_err(|e| JsValue::from_str(&format!("Failed to add member: {}", e)))?;

    let result = serde_json::json!({
        "group_id": group_id,
        "member_did": did,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Remove a member from a group.
///
/// Takes JSON: { "group_id": "...", "did": "..." }
/// Returns JSON: { "group_id", "member_did" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_remove_member(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let group_id = data["group_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing group_id"))?;
    let did = data["did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing did"))?;

    database.remove_group_member(group_id, did)
        .map_err(|e| JsValue::from_str(&format!("Failed to remove member: {}", e)))?;

    let result = serde_json::json!({
        "group_id": group_id,
        "member_did": did,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Get all members of a group.
///
/// Takes: group_id as string
/// Returns JSON: [member, ...]
#[wasm_bindgen]
pub fn umbra_wasm_groups_get_members(group_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let members = database.get_group_members(group_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?;

    let members_json: Vec<serde_json::Value> = members.iter().map(|m| {
        serde_json::json!({
            "group_id": m.group_id,
            "member_did": m.member_did,
            "display_name": m.display_name,
            "role": m.role,
            "joined_at": m.joined_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&members_json).unwrap_or_default()))
}

// ============================================================================
// GROUP ENCRYPTION
// ============================================================================

/// Generate a shared group key for a newly created group.
///
/// Creates a random 256-bit AES key, encrypts it with the creator's
/// key-wrapping key (derived from identity via HKDF), and stores it
/// in the group_keys table.
///
/// Takes: group_id as string
/// Returns JSON: { "group_id", "key_version", "raw_key_hex" }
///
/// The raw_key_hex is returned so it can be encrypted per-member
/// for relay distribution (ECDH with each invitee).
#[wasm_bindgen]
pub fn umbra_wasm_groups_generate_key(group_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // Generate random 256-bit key
    let mut raw_key = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::rngs::OsRng, &mut raw_key);

    // Encrypt with own key-wrapping key (HKDF from identity)
    let wrapping_key = derive_key_wrapping_key(identity);
    let encryption_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);
    let aad = format!("group-key:{}", group_id);
    let (nonce, encrypted) = crate::crypto::encrypt(&encryption_key, &raw_key, aad.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("Failed to encrypt group key: {}", e)))?;

    // Store: nonce (12 bytes) + encrypted key
    let mut stored = Vec::with_capacity(12 + encrypted.len());
    stored.extend_from_slice(&nonce.0);
    stored.extend_from_slice(&encrypted);

    let now = crate::time::now_timestamp_millis();
    database.store_group_key(group_id, 1, &stored, now)
        .map_err(|e| JsValue::from_str(&format!("Failed to store group key: {}", e)))?;

    let result = serde_json::json!({
        "group_id": group_id,
        "key_version": 1,
        "raw_key_hex": hex::encode(&raw_key),
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Rotate the group key (e.g., after removing a member).
///
/// Generates a new AES-256 key, increments the key version, stores it.
///
/// Takes: group_id as string
/// Returns JSON: { "group_id", "key_version", "raw_key_hex" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_rotate_key(group_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // Get current key version
    let current = database.get_latest_group_key(group_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?;
    let new_version = current.map(|k| k.key_version + 1).unwrap_or(1);

    // Generate new random key
    let mut raw_key = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::rngs::OsRng, &mut raw_key);

    // Encrypt with own wrapping key
    let wrapping_key = derive_key_wrapping_key(identity);
    let encryption_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);
    let aad = format!("group-key:{}:{}", group_id, new_version);
    let (nonce, encrypted) = crate::crypto::encrypt(&encryption_key, &raw_key, aad.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("Failed to encrypt group key: {}", e)))?;

    let mut stored = Vec::with_capacity(12 + encrypted.len());
    stored.extend_from_slice(&nonce.0);
    stored.extend_from_slice(&encrypted);

    let now = crate::time::now_timestamp_millis();
    database.store_group_key(group_id, new_version, &stored, now)
        .map_err(|e| JsValue::from_str(&format!("Failed to store group key: {}", e)))?;

    let result = serde_json::json!({
        "group_id": group_id,
        "key_version": new_version,
        "raw_key_hex": hex::encode(&raw_key),
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Import a group key received from another member (via invite or key rotation).
///
/// The key arrives encrypted via ECDH with the sender.
/// We decrypt it using our X25519 key, then re-encrypt with our wrapping key.
///
/// Takes JSON: { "group_id", "key_version", "encrypted_key_hex", "nonce_hex", "sender_did" }
/// Returns JSON: { "group_id", "key_version" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_import_key(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let group_id = data["group_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing group_id"))?;
    let key_version = data["key_version"].as_i64().unwrap_or(1) as i32;
    let encrypted_key_hex = data["encrypted_key_hex"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing encrypted_key_hex"))?;
    let nonce_hex = data["nonce_hex"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing nonce_hex"))?;
    let sender_did = data["sender_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing sender_did"))?;

    // Look up sender's encryption key
    let sender = database.get_friend(sender_did)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Sender not found in friends"))?;

    let sender_enc_bytes = hex::decode(&sender.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid key: {}", e)))?;
    let mut sender_enc_key = [0u8; 32];
    if sender_enc_bytes.len() != 32 { return Err(JsValue::from_str("Key must be 32 bytes")); }
    sender_enc_key.copy_from_slice(&sender_enc_bytes);

    // Decrypt the group key using ECDH
    let ciphertext = hex::decode(encrypted_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid hex: {}", e)))?;
    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid nonce: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(JsValue::from_str("Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    let aad = format!("group-key-transfer:{}:{}", group_id, key_version);
    let raw_key = crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption,
        &sender_enc_key,
        group_id.as_bytes(),
        &nonce,
        &ciphertext,
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Failed to decrypt group key: {}", e)))?;

    // Re-encrypt with our own wrapping key
    let wrapping_key = derive_key_wrapping_key(identity);
    let wrap_enc_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);
    let wrap_aad = format!("group-key:{}:{}", group_id, key_version);
    let (wrap_nonce, wrap_ct) = crate::crypto::encrypt(&wrap_enc_key, &raw_key, wrap_aad.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("Failed to re-encrypt group key: {}", e)))?;

    let mut stored = Vec::with_capacity(12 + wrap_ct.len());
    stored.extend_from_slice(&wrap_nonce.0);
    stored.extend_from_slice(&wrap_ct);

    let now = crate::time::now_timestamp_millis();
    database.store_group_key(group_id, key_version, &stored, now)
        .map_err(|e| JsValue::from_str(&format!("Failed to store group key: {}", e)))?;

    let result = serde_json::json!({
        "group_id": group_id,
        "key_version": key_version,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Encrypt a message with the group's shared key.
///
/// Takes JSON: { "group_id", "plaintext" }
/// Returns JSON: { "ciphertext_hex", "nonce_hex", "key_version" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_encrypt_message(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let group_id = data["group_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing group_id"))?;
    let plaintext = data["plaintext"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing plaintext"))?;

    // Get latest group key
    let key_record = database.get_latest_group_key(group_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("No group key found"))?;

    // Decrypt the stored key with our wrapping key
    let raw_key = decrypt_stored_group_key(identity, &key_record, group_id)?;

    // Encrypt the message
    let enc_key = crate::crypto::EncryptionKey::from_bytes(raw_key);
    let sender_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();
    let aad = format!("group-msg:{}:{}:{}", group_id, sender_did, timestamp);
    let (nonce, ciphertext) = crate::crypto::encrypt(&enc_key, plaintext.as_bytes(), aad.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

    let result = serde_json::json!({
        "ciphertext_hex": hex::encode(&ciphertext),
        "nonce_hex": hex::encode(&nonce.0),
        "key_version": key_record.key_version,
        "timestamp": timestamp,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Decrypt a group message with the specified key version.
///
/// Takes JSON: { "group_id", "ciphertext_hex", "nonce_hex", "key_version", "sender_did", "timestamp" }
/// Returns JSON: the decrypted plaintext string
#[wasm_bindgen]
pub fn umbra_wasm_groups_decrypt_message(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let group_id = data["group_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing group_id"))?;
    let ciphertext_hex = data["ciphertext_hex"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing ciphertext_hex"))?;
    let nonce_hex = data["nonce_hex"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing nonce_hex"))?;
    let key_version = data["key_version"].as_i64().unwrap_or(1) as i32;
    let sender_did = data["sender_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing sender_did"))?;
    let timestamp = data["timestamp"].as_i64().unwrap_or(0);

    // Get the specified key version
    let key_record = database.get_group_key(group_id, key_version)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str(&format!("Group key version {} not found", key_version)))?;

    // Decrypt the stored key
    let raw_key = decrypt_stored_group_key(identity, &key_record, group_id)?;

    // Decrypt the message
    let ciphertext = hex::decode(ciphertext_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid hex: {}", e)))?;
    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid nonce: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(JsValue::from_str("Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    let enc_key = crate::crypto::EncryptionKey::from_bytes(raw_key);
    let aad = format!("group-msg:{}:{}:{}", group_id, sender_did, timestamp);
    let plaintext = crate::crypto::decrypt(&enc_key, &nonce, &ciphertext, aad.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("Decryption failed: {}", e)))?;

    let text = String::from_utf8_lossy(&plaintext).to_string();
    Ok(JsValue::from_str(&serde_json::json!(text).to_string()))
}

/// Encrypt a group key for a specific member (for invite or key rotation).
///
/// Uses ECDH with the member's public key to encrypt the raw group key.
///
/// Takes JSON: { "group_id", "raw_key_hex", "key_version", "member_did" }
/// Returns JSON: { "encrypted_key_hex", "nonce_hex" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_encrypt_key_for_member(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let group_id = data["group_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing group_id"))?;
    let raw_key_hex = data["raw_key_hex"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing raw_key_hex"))?;
    let key_version = data["key_version"].as_i64().unwrap_or(1) as i32;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;

    let raw_key = hex::decode(raw_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid key hex: {}", e)))?;

    // Look up member's encryption key
    let member = database.get_friend(member_did)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Member not found in friends"))?;

    let member_enc_bytes = hex::decode(&member.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid key: {}", e)))?;
    let mut member_enc_key = [0u8; 32];
    if member_enc_bytes.len() != 32 { return Err(JsValue::from_str("Key must be 32 bytes")); }
    member_enc_key.copy_from_slice(&member_enc_bytes);

    // Encrypt group key using ECDH with member
    let aad = format!("group-key-transfer:{}:{}", group_id, key_version);
    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &member_enc_key,
        group_id.as_bytes(),
        &raw_key,
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

    let result = serde_json::json!({
        "encrypted_key_hex": hex::encode(&ciphertext),
        "nonce_hex": hex::encode(&nonce.0),
    });
    Ok(JsValue::from_str(&result.to_string()))
}

// ============================================================================
// GROUP INVITATIONS
// ============================================================================

/// Store a received group invite.
///
/// Takes JSON: { "id", "group_id", "group_name", "description", "inviter_did",
///               "inviter_name", "encrypted_group_key", "nonce", "members_json" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_store_invite(json: &str) -> Result<(), JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let invite = crate::storage::GroupInviteRecord {
        id: data["id"].as_str().unwrap_or(&uuid::Uuid::new_v4().to_string()).to_string(),
        group_id: data["group_id"].as_str().unwrap_or("").to_string(),
        group_name: data["group_name"].as_str().unwrap_or("").to_string(),
        description: data["description"].as_str().map(|s| s.to_string()),
        inviter_did: data["inviter_did"].as_str().unwrap_or("").to_string(),
        inviter_name: data["inviter_name"].as_str().unwrap_or("").to_string(),
        encrypted_group_key: data["encrypted_group_key"].as_str().unwrap_or("").to_string(),
        nonce: data["nonce"].as_str().unwrap_or("").to_string(),
        members_json: data["members_json"].as_str().unwrap_or("[]").to_string(),
        status: "pending".to_string(),
        created_at: data["created_at"].as_i64().unwrap_or_else(|| crate::time::now_timestamp_millis()),
    };

    database.store_group_invite(&invite)
        .map_err(|e| JsValue::from_str(&format!("Failed to store invite: {}", e)))?;

    emit_event("group", &serde_json::json!({
        "type": "groupInviteReceived",
        "invite": {
            "id": invite.id,
            "group_id": invite.group_id,
            "group_name": invite.group_name,
            "inviter_did": invite.inviter_did,
            "inviter_name": invite.inviter_name,
        }
    }));

    Ok(())
}

/// Get pending group invites.
///
/// Returns JSON: [invite, ...]
#[wasm_bindgen]
pub fn umbra_wasm_groups_get_pending_invites() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let invites = database.get_pending_group_invites()
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?;

    let invites_json: Vec<serde_json::Value> = invites.iter().map(|i| {
        serde_json::json!({
            "id": i.id,
            "group_id": i.group_id,
            "group_name": i.group_name,
            "description": i.description,
            "inviter_did": i.inviter_did,
            "inviter_name": i.inviter_name,
            "encrypted_group_key": i.encrypted_group_key,
            "nonce": i.nonce,
            "members_json": i.members_json,
            "status": i.status,
            "created_at": i.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&invites_json).unwrap_or_default()))
}

/// Accept a group invite.
///
/// Imports the group key, creates local group + conversation, adds self as member.
///
/// Takes: invite_id as string
/// Returns JSON: { "group_id", "conversation_id" }
#[wasm_bindgen]
pub fn umbra_wasm_groups_accept_invite(invite_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let invite = database.get_group_invite(invite_id)
        .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Invite not found"))?;

    let our_did = identity.did_string();
    let now = crate::time::now_timestamp_millis();

    // Import the group key (decrypt ECDH → re-encrypt with wrapping key)
    let import_json = serde_json::json!({
        "group_id": invite.group_id,
        "key_version": 1,
        "encrypted_key_hex": invite.encrypted_group_key,
        "nonce_hex": invite.nonce,
        "sender_did": invite.inviter_did,
    });
    umbra_wasm_groups_import_key(&import_json.to_string())?;

    // Create the group locally
    database.create_group(&invite.group_id, &invite.group_name, invite.description.as_deref(), &invite.inviter_did, now)
        .map_err(|e| JsValue::from_str(&format!("Failed to create group: {}", e)))?;

    // Add self as member
    let display_name = identity.profile().display_name.clone();
    database.add_group_member(&invite.group_id, &our_did, Some(&display_name), "member", now)
        .map_err(|e| JsValue::from_str(&format!("Failed to add self: {}", e)))?;

    // Add existing members from the invite
    if let Ok(members) = serde_json::from_str::<Vec<serde_json::Value>>(&invite.members_json) {
        for m in &members {
            let did = m["did"].as_str().unwrap_or("");
            let name = m["display_name"].as_str();
            let role = m["role"].as_str().unwrap_or("member");
            if !did.is_empty() {
                let _ = database.add_group_member(&invite.group_id, did, name, role, now);
            }
        }
    }

    // Create group conversation
    let conv_id = format!("group-{}", invite.group_id);
    database.create_group_conversation(&conv_id, &invite.group_id)
        .map_err(|e| JsValue::from_str(&format!("Failed to create conversation: {}", e)))?;

    // Update invite status
    database.update_group_invite_status(invite_id, "accepted")
        .map_err(|e| JsValue::from_str(&format!("Failed to update invite: {}", e)))?;

    emit_event("group", &serde_json::json!({
        "type": "groupInviteAccepted",
        "group_id": invite.group_id,
        "conversation_id": conv_id,
    }));

    let result = serde_json::json!({
        "group_id": invite.group_id,
        "conversation_id": conv_id,
    });
    Ok(JsValue::from_str(&result.to_string()))
}

/// Decline a group invite.
///
/// Takes: invite_id as string
#[wasm_bindgen]
pub fn umbra_wasm_groups_decline_invite(invite_id: &str) -> Result<(), JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.update_group_invite_status(invite_id, "declined")
        .map_err(|e| JsValue::from_str(&format!("Failed to update invite: {}", e)))?;

    Ok(())
}

// ============================================================================
// MESSAGE DELIVERY STATUS
// ============================================================================

/// Update a specific message's delivery status.
///
/// Takes JSON: { "message_id", "status" } where status is "delivered" or "read"
#[wasm_bindgen]
pub fn umbra_wasm_messaging_update_status(json: &str) -> Result<(), JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let status = data["status"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing status"))?;

    match status {
        "delivered" => {
            database.mark_message_delivered(message_id)
                .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?;
        }
        "read" => {
            database.mark_message_read(message_id)
                .map_err(|e| JsValue::from_str(&format!("DB error: {}", e)))?;
        }
        _ => {
            return Err(JsValue::from_str(&format!("Invalid status: {}", status)));
        }
    }

    emit_event("message", &serde_json::json!({
        "type": "messageStatusUpdated",
        "messageId": message_id,
        "status": status,
    }));

    Ok(())
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Derive a key-wrapping key from the identity.
///
/// Uses HKDF-SHA256 with the identity's master seed to derive a 256-bit
/// key specifically for encrypting/wrapping group keys at rest.
fn derive_key_wrapping_key(identity: &crate::identity::Identity) -> [u8; 32] {
    use hkdf::Hkdf;
    use sha2::Sha256;

    // Use the encryption private key as input keying material
    let ikm = identity.keypair().encryption.secret_bytes();
    let hkdf = Hkdf::<Sha256>::new(None, &ikm);
    let mut key = [0u8; 32];
    hkdf.expand(b"umbra-group-key-wrapping-v1", &mut key)
        .expect("HKDF-SHA256 expansion should not fail for 32 bytes");
    key
}

/// Decrypt a stored group key using the identity's wrapping key.
fn decrypt_stored_group_key(
    identity: &crate::identity::Identity,
    key_record: &crate::storage::GroupKeyRecord,
    group_id: &str,
) -> std::result::Result<[u8; 32], JsValue> {
    let stored = &key_record.encrypted_key;
    if stored.len() < 12 {
        return Err(JsValue::from_str("Invalid stored key format"));
    }

    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&stored[..12]);
    let nonce = crate::crypto::Nonce(nonce_arr);
    let encrypted = &stored[12..];

    let wrapping_key = derive_key_wrapping_key(identity);
    let wrap_enc_key = crate::crypto::EncryptionKey::from_bytes(wrapping_key);
    let aad = format!("group-key:{}:{}", group_id, key_record.key_version);
    let raw = crate::crypto::decrypt(&wrap_enc_key, &nonce, encrypted, aad.as_bytes())
        .map_err(|e| JsValue::from_str(&format!("Failed to decrypt group key: {}", e)))?;

    if raw.len() != 32 {
        return Err(JsValue::from_str("Decrypted group key is not 32 bytes"));
    }
    let mut key = [0u8; 32];
    key.copy_from_slice(&raw);
    Ok(key)
}

// ============================================================================
// NETWORK
// ============================================================================

/// Get network status as JSON
///
/// Returns JSON: { "is_running": bool, "peer_count": number, "listen_addresses": [...] }
#[wasm_bindgen]
pub fn umbra_wasm_network_status() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let json = match &state.network {
        Some(network) => {
            serde_json::json!({
                "is_running": true,
                "peer_count": network.connected_peers().len(),
                "listen_addresses": network.listen_addrs()
                    .iter()
                    .map(|a| a.to_string())
                    .collect::<Vec<_>>(),
            })
        }
        None => {
            serde_json::json!({
                "is_running": false,
                "peer_count": 0,
                "listen_addresses": [],
            })
        }
    };

    Ok(JsValue::from_str(&json.to_string()))
}

/// Start the network service
///
/// Initializes the libp2p swarm with WebRTC transport and begins
/// processing network events. Must be called after identity creation.
///
/// Also starts a background task that listens for inbound network events
/// (messages, friend requests) and processes them (decrypt, store, emit JS events).
#[wasm_bindgen]
pub fn umbra_wasm_network_start() -> Promise {
    future_to_promise(async move {
        let state = get_state()?;

        let config = crate::network::NetworkConfig {
            // No TCP listen addresses for WASM — WebRTC only
            listen_addrs: vec![],
            bootstrap_peers: vec![],
            enable_dht: false, // No bootstrap peers yet
            enable_relay: false,
            relay_url: None,
        };

        // Create network service while holding the read lock for identity access
        let network = {
            let s = state.read();
            let identity = s.identity.as_ref()
                .ok_or_else(|| JsValue::from_str("No identity loaded — create or restore identity first"))?;
            NetworkService::new(identity.keypair(), config).await
                .map_err(|e| JsValue::from_str(&format!("Failed to create network service: {}", e)))?
        };

        let network = Arc::new(network);

        // Start returns the connection injector (for pushing WebRTC connections into the swarm)
        let injector = network.start().await
            .map_err(|e| JsValue::from_str(&format!("Failed to start network: {}", e)))?;

        // Subscribe to network events and spawn a handler for inbound messages
        let mut event_rx = network.subscribe();
        let state_for_handler = state.clone();
        wasm_bindgen_futures::spawn_local(async move {
            loop {
                match event_rx.recv().await {
                    Ok(event) => handle_network_event(event, &state_for_handler),
                    Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
                    Err(tokio::sync::broadcast::error::RecvError::Lagged(n)) => {
                        tracing::warn!("Network event handler lagged by {} events", n);
                    }
                }
            }
        });

        {
            let mut s = state.write();
            s.network = Some(network);
            s.connection_injector = Some(injector);
        }

        Ok(JsValue::TRUE)
    })
}

/// Handle an inbound network event (runs in a spawn_local task).
///
/// Processes MessageReceived events by:
/// - Deserializing the wire protocol message
/// - For messages: decrypting with our key + storing in DB + emitting JS event
/// - For friend requests: storing in DB + emitting JS event
fn handle_network_event(
    event: crate::network::NetworkEvent,
    state: &Arc<RwLock<WasmState>>,
) {
    use crate::network::NetworkEvent;
    use crate::network::codec::UmbraRequest;

    match event {
        NetworkEvent::MessageReceived { peer_id: _, message } => {
            // The event loop serializes the full UmbraRequest for messages,
            // or just the MessageRequest for direct messages
            if let Ok(request) = bincode::deserialize::<crate::network::protocols::MessageRequest>(&message) {
                handle_inbound_message(request, state);
            } else if let Ok(umbrella) = bincode::deserialize::<UmbraRequest>(&message) {
                match umbrella {
                    UmbraRequest::Message(msg) => handle_inbound_message(msg, state),
                    UmbraRequest::Friend(fr) => handle_inbound_friend_request(fr, state),
                    UmbraRequest::Presence(_) => {} // Handled elsewhere
                }
            }
        }
        NetworkEvent::MessageDelivered { peer_id: _, message_id } => {
            emit_event("message", &serde_json::json!({
                "type": "messageDelivered",
                "message_id": message_id,
            }));
        }
        NetworkEvent::MessageFailed { peer_id: _, message_id, error } => {
            emit_event("message", &serde_json::json!({
                "type": "messageFailed",
                "message_id": message_id,
                "error": error,
            }));
        }
        NetworkEvent::PeerConnected { peer_id, .. } => {
            emit_event("network", &serde_json::json!({
                "type": "peerConnected",
                "peer_id": peer_id.to_string(),
            }));
        }
        NetworkEvent::PeerDisconnected { peer_id, .. } => {
            emit_event("network", &serde_json::json!({
                "type": "peerDisconnected",
                "peer_id": peer_id.to_string(),
            }));
        }
        _ => {} // Other events handled elsewhere
    }
}

/// Handle an inbound encrypted message from a peer.
///
/// Decrypts the message using X25519 ECDH + AES-256-GCM,
/// stores it in the database, and emits a JS event.
fn handle_inbound_message(
    msg: crate::network::protocols::MessageRequest,
    state: &Arc<RwLock<WasmState>>,
) {
    let s = state.read();
    let identity = match s.identity.as_ref() {
        Some(id) => id,
        None => return,
    };
    let database = match s.database.as_ref() {
        Some(db) => db,
        None => return,
    };

    // Since we're in a 1:1 WebRTC connection, try to decrypt with each
    // friend's key. With only one connected peer, this is efficient.
    let friends = database.get_all_friends().unwrap_or_default();

    for friend_record in &friends {
        let encryption_key_bytes = match hex::decode(&friend_record.encryption_key) {
            Ok(b) if b.len() == 32 => b,
            _ => continue,
        };
        let mut friend_enc_key = [0u8; 32];
        friend_enc_key.copy_from_slice(&encryption_key_bytes);

        // Find the conversation with this friend
        let conversation = match database.get_conversation_by_friend(&friend_record.did) {
            Ok(Some(c)) => c,
            _ => continue,
        };

        let our_did = identity.did_string();
        let aad = format!("{}{}{}", friend_record.did, our_did, msg.timestamp);

        let mut nonce_arr = [0u8; 12];
        if msg.nonce.len() == 12 {
            nonce_arr.copy_from_slice(&msg.nonce);
        } else {
            continue;
        }
        let nonce = crate::crypto::Nonce(nonce_arr);

        match crate::crypto::decrypt_from_sender(
            &identity.keypair().encryption,
            &friend_enc_key,
            conversation.id.as_bytes(),
            &nonce,
            &msg.encrypted_content,
            aad.as_bytes(),
        ) {
            Ok(plaintext) => {
                let content = String::from_utf8_lossy(&plaintext).to_string();

                // Store message in DB (encrypted form)
                let _ = database.store_message(
                    &msg.message_id,
                    &conversation.id,
                    &friend_record.did,
                    &msg.encrypted_content,
                    &nonce_arr,
                    msg.timestamp,
                );

                // Emit JS event for real-time UI update
                emit_event("message", &serde_json::json!({
                    "type": "messageReceived",
                    "message": {
                        "id": msg.message_id,
                        "conversation_id": conversation.id,
                        "sender_did": friend_record.did,
                        "content": content,
                        "timestamp": msg.timestamp,
                        "delivered": true,
                        "read": false,
                    }
                }));

                return; // Successfully decrypted
            }
            Err(_) => continue, // Wrong friend, try next
        }
    }

    tracing::warn!("Could not decrypt message {} from any known friend", msg.message_id);
}

/// Handle an inbound friend request from a peer.
///
/// Stores the request in the database and emits a JS event.
fn handle_inbound_friend_request(
    fr: crate::network::protocols::FriendRequest,
    state: &Arc<RwLock<WasmState>>,
) {
    let s = state.read();
    let database = match s.database.as_ref() {
        Some(db) => db,
        None => return,
    };

    match fr.request_type {
        crate::network::protocols::FriendRequestType::Request => {
            // Store as incoming friend request
            let record = FriendRequestRecord {
                id: uuid::Uuid::new_v4().to_string(),
                from_did: fr.from_did.clone(),
                to_did: fr.to_did.clone(),
                direction: "incoming".to_string(),
                message: fr.message.clone(),
                from_signing_key: Some(fr.from_signing_key.clone()),
                from_encryption_key: Some(fr.from_encryption_key.clone()),
                from_display_name: Some(fr.from_display_name.clone()),
                created_at: fr.timestamp,
                status: "pending".to_string(),
            };

            if let Err(e) = database.store_friend_request(&record) {
                tracing::error!("Failed to store incoming friend request: {}", e);
                return;
            }

            emit_event("friend", &serde_json::json!({
                "type": "friendRequestReceived",
                "request": {
                    "id": record.id,
                    "from_did": fr.from_did,
                    "from_display_name": fr.from_display_name,
                    "message": fr.message,
                    "timestamp": fr.timestamp,
                }
            }));
        }
        crate::network::protocols::FriendRequestType::Accept => {
            // The remote peer accepted our friend request — add them as a friend
            let signing_key_bytes = match hex::decode(&fr.from_signing_key) {
                Ok(b) if b.len() == 32 => b,
                _ => return,
            };
            let encryption_key_bytes = match hex::decode(&fr.from_encryption_key) {
                Ok(b) if b.len() == 32 => b,
                _ => return,
            };

            let mut signing_key = [0u8; 32];
            signing_key.copy_from_slice(&signing_key_bytes);
            let mut encryption_key = [0u8; 32];
            encryption_key.copy_from_slice(&encryption_key_bytes);

            let _ = database.add_friend(
                &fr.from_did,
                &fr.from_display_name,
                &signing_key,
                &encryption_key,
                None,
            );

            let conversation_id = uuid::Uuid::new_v4().to_string();
            let _ = database.create_conversation(&conversation_id, &fr.from_did);

            emit_event("friend", &serde_json::json!({
                "type": "friendRequestAccepted",
                "friend": {
                    "did": fr.from_did,
                    "display_name": fr.from_display_name,
                    "conversation_id": conversation_id,
                }
            }));
        }
        _ => {} // Reject/Cancel handled elsewhere
    }
}

/// Stop the network service
#[wasm_bindgen]
pub fn umbra_wasm_network_stop() -> Promise {
    future_to_promise(async move {
        let state = get_state()?;
        let network = {
            let s = state.read();
            s.network.clone()
        };

        if let Some(network) = network {
            network.stop().await
                .map_err(|e| JsValue::from_str(&format!("Failed to stop network: {}", e)))?;
        }

        {
            let mut s = state.write();
            s.network = None;
            s.connection_injector = None;
        }
        Ok(JsValue::TRUE)
    })
}

/// Create a WebRTC offer for signaling (step 1 of connection)
///
/// Returns JSON string with SDP offer, ICE candidates, and our DID + PeerId.
/// Share this with the other peer via QR code or connection link.
#[wasm_bindgen]
pub fn umbra_wasm_network_create_offer() -> Promise {
    future_to_promise(async move {
        let state = get_state()?;

        // Get our identity info to embed in the offer
        let (did, peer_id_str) = {
            let s = state.read();
            let identity = s.identity.as_ref()
                .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
            let network = s.network.as_ref()
                .ok_or_else(|| JsValue::from_str("Network not started"))?;
            (identity.did_string(), network.peer_id().to_string())
        };

        let offer = crate::network::webrtc_transport::create_offer(
            Some(did),
            Some(peer_id_str),
        ).await
            .map_err(|e| JsValue::from_str(&format!("Failed to create offer: {}", e)))?;

        let json = serde_json::to_string(&offer)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize offer: {}", e)))?;

        Ok(JsValue::from_str(&json))
    })
}

/// Accept a WebRTC offer and create an answer (step 2 of connection)
///
/// Takes the offer JSON string from the other peer.
/// Returns JSON string with SDP answer, ICE candidates, and our DID + PeerId.
/// Share this answer back with the offerer.
#[wasm_bindgen]
pub fn umbra_wasm_network_accept_offer(offer_json: &str) -> Promise {
    let offer_json = offer_json.to_string();
    future_to_promise(async move {
        let state = get_state()?;

        let offer: crate::network::webrtc_transport::SignalingData = serde_json::from_str(&offer_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid offer JSON: {}", e)))?;

        // Get our identity info to embed in the answer
        let (did, peer_id_str) = {
            let s = state.read();
            let identity = s.identity.as_ref()
                .ok_or_else(|| JsValue::from_str("No identity loaded"))?;
            let network = s.network.as_ref()
                .ok_or_else(|| JsValue::from_str("Network not started"))?;
            (identity.did_string(), network.peer_id().to_string())
        };

        let answer = crate::network::webrtc_transport::accept_offer(
            &offer,
            Some(did),
            Some(peer_id_str),
        ).await
            .map_err(|e| JsValue::from_str(&format!("Failed to accept offer: {}", e)))?;

        let json = serde_json::to_string(&answer)
            .map_err(|e| JsValue::from_str(&format!("Failed to serialize answer: {}", e)))?;

        Ok(JsValue::from_str(&json))
    })
}

/// Complete the WebRTC handshake (step 3 of connection - offerer side)
///
/// Takes the answer JSON string from the other peer.
/// After this, the WebRTC connection is injected into the libp2p swarm,
/// triggering Noise handshake → Yamux multiplexing → protocol negotiation.
/// The peer will appear in `connected_peers()` and messages can flow.
#[wasm_bindgen]
pub fn umbra_wasm_network_complete_handshake(answer_json: &str) -> Promise {
    let answer_json = answer_json.to_string();
    future_to_promise(async move {
        let answer: crate::network::webrtc_transport::SignalingData = serde_json::from_str(&answer_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid answer JSON: {}", e)))?;

        // Derive the remote peer's PeerId from the embedded identity
        let remote_peer_id = if let Some(ref did) = answer.did {
            crate::network::did_to_peer_id(did)
                .map_err(|e| JsValue::from_str(&format!("Failed to derive PeerId from DID: {}", e)))?
        } else if let Some(ref pid_str) = answer.peer_id {
            pid_str.parse::<libp2p::PeerId>()
                .map_err(|e| JsValue::from_str(&format!("Invalid PeerId in answer: {}", e)))?
        } else {
            return Err(JsValue::from_str("Answer missing peer identity (did or peer_id field)"));
        };

        let connection = crate::network::webrtc_transport::complete_handshake(&answer).await
            .map_err(|e| JsValue::from_str(&format!("Failed to complete handshake: {}", e)))?;

        // Inject the connection into the libp2p swarm
        let state = get_state()?;
        {
            let s = state.read();
            if let Some(ref injector) = s.connection_injector {
                injector.inject(remote_peer_id, connection)
                    .map_err(|e| JsValue::from_str(&format!("Failed to inject connection: {}", e)))?;
                tracing::info!("WebRTC connection injected into swarm for peer {}", remote_peer_id);
            } else {
                return Err(JsValue::from_str("No connection injector — network not started"));
            }
        }

        // Emit connection established event
        emit_event("network", &serde_json::json!({
            "type": "connectionEstablished",
            "role": "offerer",
            "peer_id": remote_peer_id.to_string(),
        }));

        Ok(JsValue::TRUE)
    })
}

/// Complete the answerer side of the WebRTC connection (step 3 - answerer side)
///
/// Called after accept_offer(). Gets the connection on the answerer's side
/// and injects it into the libp2p swarm. The remote peer's identity is
/// extracted from the offer that was passed to accept_offer().
///
/// `offerer_did` is the DID from the original offer (used to derive PeerId).
#[wasm_bindgen]
pub fn umbra_wasm_network_complete_answerer(offerer_did: Option<String>, offerer_peer_id: Option<String>) -> Promise {
    future_to_promise(async move {
        // Derive the remote peer's PeerId from the offerer's identity
        let remote_peer_id = if let Some(ref did) = offerer_did {
            crate::network::did_to_peer_id(did)
                .map_err(|e| JsValue::from_str(&format!("Failed to derive PeerId from DID: {}", e)))?
        } else if let Some(ref pid_str) = offerer_peer_id {
            pid_str.parse::<libp2p::PeerId>()
                .map_err(|e| JsValue::from_str(&format!("Invalid PeerId: {}", e)))?
        } else {
            return Err(JsValue::from_str("Must provide offerer_did or offerer_peer_id"));
        };

        let connection = crate::network::webrtc_transport::get_answerer_connection().await
            .map_err(|e| JsValue::from_str(&format!("Failed to complete answerer connection: {}", e)))?;

        // Inject the connection into the libp2p swarm
        let state = get_state()?;
        {
            let s = state.read();
            if let Some(ref injector) = s.connection_injector {
                injector.inject(remote_peer_id, connection)
                    .map_err(|e| JsValue::from_str(&format!("Failed to inject connection: {}", e)))?;
                tracing::info!("WebRTC answerer connection injected into swarm for peer {}", remote_peer_id);
            } else {
                return Err(JsValue::from_str("No connection injector — network not started"));
            }
        }

        // Emit connection established event
        emit_event("network", &serde_json::json!({
            "type": "connectionEstablished",
            "role": "answerer",
            "peer_id": remote_peer_id.to_string(),
        }));

        Ok(JsValue::TRUE)
    })
}

// ============================================================================
// EVENTS
// ============================================================================

/// Subscribe to events from the Rust backend
///
/// The callback receives JSON strings with event data:
/// { "domain": "message"|"friend"|"discovery", "type": "...", "data": {...} }
#[wasm_bindgen]
pub fn umbra_wasm_subscribe_events(callback: js_sys::Function) {
    EVENT_CALLBACK.with(|cb| {
        *cb.borrow_mut() = Some(callback);
    });
}

/// Internal: emit an event to the JavaScript callback
fn emit_event(domain: &str, data: &serde_json::Value) {
    EVENT_CALLBACK.with(|cb| {
        if let Some(ref callback) = *cb.borrow() {
            let event = serde_json::json!({
                "domain": domain,
                "data": data,
            });
            let event_str = event.to_string();
            let _ = callback.call1(&JsValue::NULL, &JsValue::from_str(&event_str));
        }
    });
}

// ============================================================================
// RELAY
// ============================================================================

/// Connect to a relay server
///
/// Returns JSON with connection info for the JS layer to establish
/// the WebSocket connection and register the DID.
///
/// Returns JSON: { "connected": true, "relay_url": "...", "did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_relay_connect(relay_url: &str) -> Promise {
    let relay_url = relay_url.to_string();
    future_to_promise(async move {
        let state = get_state()?;
        let state_r = state.read();

        let identity = state_r.identity.as_ref()
            .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

        let did = identity.did_string();
        drop(state_r);

        // Build the register message for the JS layer to send via WebSocket
        let register_msg = serde_json::json!({
            "type": "register",
            "did": did,
        });

        let result = serde_json::json!({
            "connected": true,
            "relay_url": relay_url,
            "did": did,
            "register_message": register_msg.to_string(),
        });

        emit_event("relay", &serde_json::json!({
            "type": "connecting",
            "relay_url": relay_url,
        }));

        Ok(JsValue::from_str(&result.to_string()))
    })
}

/// Disconnect from the relay server
///
/// Signals the JS layer to close the WebSocket connection.
#[wasm_bindgen]
pub fn umbra_wasm_relay_disconnect() -> Promise {
    future_to_promise(async move {
        let _state = get_state()?;

        emit_event("relay", &serde_json::json!({
            "type": "disconnected",
        }));

        Ok(JsValue::TRUE)
    })
}

/// Create a signaling session on the relay for single-scan friend adding.
///
/// Generates an SDP offer and returns the data needed for the JS layer to:
/// 1. Send a create_session message to the relay via WebSocket
/// 2. Generate a QR code/link with the session ID
///
/// Returns JSON: { "relay_url": "...", "did": "...", "offer_payload": "...", "create_session_message": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_relay_create_session(relay_url: &str) -> Promise {
    let relay_url = relay_url.to_string();
    future_to_promise(async move {
        let state = get_state()?;
        let state_r = state.read();

        let identity = state_r.identity.as_ref()
            .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

        let did = identity.did_string();

        let network = state_r.network.as_ref()
            .ok_or_else(|| JsValue::from_str("Network not started"))?;

        let peer_id = network.peer_id().to_string();
        drop(state_r);

        // Create the SDP offer with embedded identity
        #[cfg(target_arch = "wasm32")]
        let offer_json = {
            use crate::network::webrtc_transport;
            let offer = webrtc_transport::create_offer(Some(did.clone()), Some(peer_id.clone())).await
                .map_err(|e| JsValue::from_str(&format!("Failed to create offer: {}", e)))?;
            serde_json::to_string(&offer)
                .map_err(|e| JsValue::from_str(&format!("Failed to serialize offer: {}", e)))?
        };

        #[cfg(not(target_arch = "wasm32"))]
        let offer_json = {
            serde_json::json!({
                "sdp": "mock_sdp_for_native_testing",
                "sdp_type": "offer",
                "ice_candidates": [],
                "did": did,
                "peer_id": peer_id,
            }).to_string()
        };

        // The relay client message to create the session
        let create_session_msg = serde_json::json!({
            "type": "create_session",
            "offer_payload": offer_json,
        });

        let result = serde_json::json!({
            "relay_url": relay_url,
            "did": did,
            "peer_id": peer_id,
            "offer_payload": offer_json,
            "create_session_message": create_session_msg.to_string(),
        });

        Ok(JsValue::from_str(&result.to_string()))
    })
}

/// Join a relay session for single-scan friend adding (the "scanner" side).
///
/// Takes a session ID and the offer payload received from the relay,
/// generates an SDP answer, and returns the data for the JS layer to
/// send back to the relay.
///
/// Returns JSON: { "session_id": "...", "answer_payload": "...", "join_session_message": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_relay_accept_session(session_id: &str, offer_payload: &str) -> Promise {
    let session_id = session_id.to_string();
    let offer_payload = offer_payload.to_string();
    future_to_promise(async move {
        let state = get_state()?;
        let state_r = state.read();

        let identity = state_r.identity.as_ref()
            .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

        let did = identity.did_string();

        let network = state_r.network.as_ref()
            .ok_or_else(|| JsValue::from_str("Network not started"))?;

        let peer_id = network.peer_id().to_string();
        drop(state_r);

        // Parse the offer and generate an answer
        #[cfg(target_arch = "wasm32")]
        let answer_json = {
            use crate::network::webrtc_transport;
            let offer: webrtc_transport::SignalingData = serde_json::from_str(&offer_payload)
                .map_err(|e| JsValue::from_str(&format!("Failed to parse offer: {}", e)))?;
            let answer = webrtc_transport::accept_offer(&offer, Some(did.clone()), Some(peer_id.clone())).await
                .map_err(|e| JsValue::from_str(&format!("Failed to accept offer: {}", e)))?;
            serde_json::to_string(&answer)
                .map_err(|e| JsValue::from_str(&format!("Failed to serialize answer: {}", e)))?
        };

        #[cfg(not(target_arch = "wasm32"))]
        let answer_json = {
            serde_json::json!({
                "sdp": "mock_sdp_answer_for_native_testing",
                "sdp_type": "answer",
                "ice_candidates": [],
                "did": did,
                "peer_id": peer_id,
            }).to_string()
        };

        // Build the join_session message for the JS layer to send via WebSocket
        let join_session_msg = serde_json::json!({
            "type": "join_session",
            "session_id": session_id,
            "answer_payload": answer_json,
        });

        let result = serde_json::json!({
            "session_id": session_id,
            "answer_payload": answer_json,
            "join_session_message": join_session_msg.to_string(),
            "did": did,
            "peer_id": peer_id,
        });

        Ok(JsValue::from_str(&result.to_string()))
    })
}

/// Send a message through the relay (for offline delivery).
///
/// Returns the relay message for the JS layer to send via WebSocket.
#[wasm_bindgen]
pub fn umbra_wasm_relay_send(to_did: &str, payload: &str) -> Promise {
    let to_did = to_did.to_string();
    let payload = payload.to_string();
    future_to_promise(async move {
        let state = get_state()?;
        let state_r = state.read();

        let identity = state_r.identity.as_ref()
            .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

        let did = identity.did_string();
        drop(state_r);

        let send_msg = serde_json::json!({
            "type": "send",
            "to_did": to_did,
            "payload": payload,
        });

        let result = serde_json::json!({
            "sent": true,
            "to_did": to_did,
            "from_did": did,
            "relay_message": send_msg.to_string(),
        });

        Ok(JsValue::from_str(&result.to_string()))
    })
}

/// Fetch offline messages from the relay.
///
/// Returns the fetch_offline message for the JS layer to send via WebSocket.
#[wasm_bindgen]
pub fn umbra_wasm_relay_fetch_offline() -> Promise {
    future_to_promise(async move {
        let _state = get_state()?;

        let msg = serde_json::json!({
            "type": "fetch_offline",
        });

        Ok(JsValue::from_str(&msg.to_string()))
    })
}

// ============================================================================
// CRYPTO UTILITIES (for web)
// ============================================================================

/// Sign data with the current identity's Ed25519 key
///
/// Returns the 64-byte signature.
#[wasm_bindgen]
pub fn umbra_wasm_crypto_sign(data: &[u8]) -> Result<Vec<u8>, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let signature = crate::crypto::sign(&identity.keypair().signing, data);
    Ok(signature.0.to_vec())
}

/// Verify a signature against a public key
///
/// Returns true if valid, false otherwise.
#[wasm_bindgen]
pub fn umbra_wasm_crypto_verify(
    public_key_hex: &str,
    data: &[u8],
    signature: &[u8],
) -> Result<bool, JsValue> {
    let public_key_bytes = hex::decode(public_key_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid hex: {}", e)))?;

    if public_key_bytes.len() != 32 {
        return Err(JsValue::from_str("Public key must be 32 bytes"));
    }

    let mut key_array = [0u8; 32];
    key_array.copy_from_slice(&public_key_bytes);

    if signature.len() != 64 {
        return Err(JsValue::from_str("Signature must be 64 bytes"));
    }

    let mut sig_array = [0u8; 64];
    sig_array.copy_from_slice(signature);
    let sig = crate::crypto::Signature(sig_array);

    crate::crypto::verify(&key_array, data, &sig)
        .map(|_| true)
        .or(Ok(false))
}

// ============================================================================
// PLUGIN STORAGE — KV & Bundles
// ============================================================================

/// Get a value from the plugin KV store
#[wasm_bindgen]
pub fn umbra_wasm_plugin_kv_get(plugin_id: &str, key: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    match database.plugin_kv_get(plugin_id, key)
        .map_err(|e| JsValue::from_str(&e.to_string()))? {
        Some(value) => {
            let json = serde_json::json!({ "value": value });
            Ok(JsValue::from_str(&json.to_string()))
        }
        None => {
            let json = serde_json::json!({ "value": null });
            Ok(JsValue::from_str(&json.to_string()))
        }
    }
}

/// Set a value in the plugin KV store
#[wasm_bindgen]
pub fn umbra_wasm_plugin_kv_set(plugin_id: &str, key: &str, value: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.plugin_kv_set(plugin_id, key, value)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(r#"{"ok":true}"#))
}

/// Delete a value from the plugin KV store
#[wasm_bindgen]
pub fn umbra_wasm_plugin_kv_delete(plugin_id: &str, key: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let deleted = database.plugin_kv_delete(plugin_id, key)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json = serde_json::json!({ "deleted": deleted });
    Ok(JsValue::from_str(&json.to_string()))
}

/// List keys in the plugin KV store (optionally filtered by prefix)
#[wasm_bindgen]
pub fn umbra_wasm_plugin_kv_list(plugin_id: &str, prefix: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let keys = database.plugin_kv_list(plugin_id, prefix)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json = serde_json::json!({ "keys": keys });
    Ok(JsValue::from_str(&json.to_string()))
}

/// Save a plugin bundle to local storage
#[wasm_bindgen]
pub fn umbra_wasm_plugin_bundle_save(plugin_id: &str, manifest: &str, bundle: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    database.plugin_bundle_save(plugin_id, manifest, bundle)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json = serde_json::json!({ "ok": true, "plugin_id": plugin_id });
    Ok(JsValue::from_str(&json.to_string()))
}

/// Load a plugin bundle from local storage
#[wasm_bindgen]
pub fn umbra_wasm_plugin_bundle_load(plugin_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    match database.plugin_bundle_load(plugin_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))? {
        Some(record) => {
            let json = serde_json::json!({
                "plugin_id": record.plugin_id,
                "manifest": record.manifest,
                "bundle": record.bundle,
                "installed_at": record.installed_at,
            });
            Ok(JsValue::from_str(&json.to_string()))
        }
        None => {
            let json = serde_json::json!({ "error": "not_found" });
            Ok(JsValue::from_str(&json.to_string()))
        }
    }
}

/// Delete a plugin bundle from local storage
#[wasm_bindgen]
pub fn umbra_wasm_plugin_bundle_delete(plugin_id: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let deleted = database.plugin_bundle_delete(plugin_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json = serde_json::json!({ "deleted": deleted });
    Ok(JsValue::from_str(&json.to_string()))
}

/// List all installed plugin bundles (manifests only)
#[wasm_bindgen]
pub fn umbra_wasm_plugin_bundle_list() -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let bundles = database.plugin_bundle_list()
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let plugins: Vec<serde_json::Value> = bundles.iter().map(|b| {
        serde_json::json!({
            "plugin_id": b.plugin_id,
            "manifest": b.manifest,
            "installed_at": b.installed_at,
        })
    }).collect();

    let json = serde_json::json!({ "plugins": plugins });
    Ok(JsValue::from_str(&json.to_string()))
}

// ============================================================================
// CALL HISTORY
// ============================================================================

/// Store a new call record.
///
/// Takes JSON: { "id": "...", "conversation_id": "...", "call_type": "voice|video",
///               "direction": "incoming|outgoing", "participants": "[\"did1\",\"did2\"]" }
///
/// Creates a record with started_at = now (ms), status = "active".
/// Returns JSON: { "id": "...", "started_at": ... }
#[wasm_bindgen]
pub fn umbra_wasm_calls_store(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;
    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;
    let call_type = data["call_type"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing call_type"))?;
    let direction = data["direction"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing direction"))?;
    let participants = data["participants"].as_str().unwrap_or("[]");

    let started_at = crate::time::now_timestamp_millis();

    database.store_call_record(id, conversation_id, call_type, direction, "active", participants, started_at)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = serde_json::json!({
        "id": id,
        "started_at": started_at,
    });
    Ok(JsValue::from_str(&serde_json::to_string(&result).unwrap_or_default()))
}

/// End a call record.
///
/// Takes JSON: { "id": "...", "status": "completed|missed|declined|cancelled" }
///
/// Calculates duration_ms from started_at to now.
/// Returns JSON: { "id": "...", "ended_at": ..., "duration_ms": ... }
#[wasm_bindgen]
pub fn umbra_wasm_calls_end(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;
    let status = data["status"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing status"))?;

    // Get the call record to compute duration
    let calls = database.get_all_call_history(1000, 0)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let call = calls.iter().find(|c| c.id == id)
        .ok_or_else(|| JsValue::from_str("Call record not found"))?;

    let ended_at = crate::time::now_timestamp_millis();
    let duration_ms = ended_at - call.started_at;

    database.end_call_record(id, status, ended_at, duration_ms)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = serde_json::json!({
        "id": id,
        "ended_at": ended_at,
        "duration_ms": duration_ms,
    });
    Ok(JsValue::from_str(&serde_json::to_string(&result).unwrap_or_default()))
}

/// Get call history for a specific conversation.
///
/// Takes JSON: { "conversation_id": "...", "limit": 50, "offset": 0 }
/// Returns JSON array of call records.
#[wasm_bindgen]
pub fn umbra_wasm_calls_get_history(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;

    let records = database.get_call_history(conversation_id, limit, offset)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let calls_json: Vec<serde_json::Value> = records.iter().map(|c| {
        serde_json::json!({
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
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&calls_json).unwrap_or_default()))
}

/// Get all call history across all conversations.
///
/// Takes JSON: { "limit": 50, "offset": 0 }
/// Returns JSON array of all call records.
#[wasm_bindgen]
pub fn umbra_wasm_calls_get_all_history(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;

    let records = database.get_all_call_history(limit, offset)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let calls_json: Vec<serde_json::Value> = records.iter().map(|c| {
        serde_json::json!({
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
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&calls_json).unwrap_or_default()))
}
