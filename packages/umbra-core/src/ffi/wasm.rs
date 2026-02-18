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
//! - Community: create, get, get_mine, update, delete, transfer_ownership
//! - Community Spaces: create, list, update, reorder, delete
//! - Community Channels: create, list, list_all, get, update, set_slow_mode, set_e2ee, delete, reorder
//! - Community Members: join, leave, kick, ban, unban, list, get, update_profile, ban_list
//! - Community Roles: list, member_roles, assign, unassign, create_custom, update, update_permissions, delete
//! - Community Invites: create, use, list, delete, set_vanity
//! - Community Audit Log: get
//! - Community Messages: send, send_encrypted, list, get, edit, delete, delete_for_me
//! - Community Reactions: add, remove, list
//! - Community Read Receipts: mark_read, list
//! - Community Pins: pin, unpin, list
//! - Community Channel Keys: store, get_latest
//! - Community Threads: create, get, list, messages
//! - Community Search: channel, community-wide
//! - Community Moderation: warn, warnings, member_warnings, active_count, delete_warning, check_escalation, check_keyword_filter, check_ban_evasion
//! - Community Files: upload, list, get, download, delete
//! - Community Folders: create, list, delete
//! - Community Branding: update_branding, set_vanity_url
//! - Community Emoji: create, list, delete
//! - Community Stickers: create, list, delete
//! - Community Webhooks: create, list, get, update, delete
//! - Community Channel Overrides: set, list, remove
//! - Community Boost Nodes: register, list, get, update, heartbeat, delete

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
use crate::community::CommunityService;

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

/// Encrypt arbitrary data for a peer (friend) identified by DID.
///
/// Input JSON: { "peer_did": "did:key:...", "plaintext_b64": "base64-encoded-data", "context": "optional-context-string" }
/// Returns JSON: { "ciphertext_b64": "...", "nonce_hex": "...", "timestamp": unix_ms }
///
/// Uses X25519 ECDH + AES-256-GCM, same as message encryption but for generic data.
#[wasm_bindgen]
pub fn umbra_wasm_crypto_encrypt_for_peer(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let input: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let peer_did = input["peer_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing 'peer_did' field"))?;

    let plaintext_b64 = input["plaintext_b64"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing 'plaintext_b64' field"))?;

    let context = input["context"].as_str().unwrap_or("");

    // Decode plaintext from base64
    let plaintext = base64::engine::general_purpose::STANDARD.decode(plaintext_b64)
        .map_err(|e| JsValue::from_str(&format!("Invalid base64 plaintext: {}", e)))?;

    // Look up the peer's encryption key from friends table
    let friend_record = database.get_friend(peer_did)
        .map_err(|e| JsValue::from_str(&format!("Failed to get friend: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found — cannot encrypt for peer"))?;

    let friend_encryption_key_bytes = hex::decode(&friend_record.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid friend encryption key: {}", e)))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_encryption_key_bytes.len() != 32 {
        return Err(JsValue::from_str("Friend encryption key must be 32 bytes"));
    }
    friend_enc_key.copy_from_slice(&friend_encryption_key_bytes);

    let our_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();
    let aad = format!("{}{}{}", our_did, peer_did, timestamp);

    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &friend_enc_key,
        context.as_bytes(),
        &plaintext,
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Encryption failed: {}", e)))?;

    let ciphertext_b64 = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
    let nonce_hex = hex::encode(&nonce.0);

    let result = serde_json::json!({
        "ciphertext_b64": ciphertext_b64,
        "nonce_hex": nonce_hex,
        "timestamp": timestamp,
    });

    Ok(JsValue::from_str(&result.to_string()))
}

/// Decrypt arbitrary data received from a peer (friend) identified by DID.
///
/// Input JSON: { "peer_did": "did:key:...", "ciphertext_b64": "...", "nonce_hex": "...", "timestamp": unix_ms, "context": "optional" }
/// Returns JSON: { "plaintext_b64": "..." }
///
/// Uses X25519 ECDH + AES-256-GCM, same as message decryption but for generic data.
#[wasm_bindgen]
pub fn umbra_wasm_crypto_decrypt_from_peer(json: &str) -> Result<JsValue, JsValue> {
    let state = get_state()?;
    let state = state.read();

    let identity = state.identity.as_ref()
        .ok_or_else(|| JsValue::from_str("No identity loaded"))?;

    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let input: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let peer_did = input["peer_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing 'peer_did' field"))?;

    let ciphertext_b64 = input["ciphertext_b64"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing 'ciphertext_b64' field"))?;

    let nonce_hex = input["nonce_hex"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing 'nonce_hex' field"))?;

    let timestamp = input["timestamp"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing or invalid 'timestamp' field"))?;

    let context = input["context"].as_str().unwrap_or("");

    // Decode ciphertext from base64
    let ciphertext = base64::engine::general_purpose::STANDARD.decode(ciphertext_b64)
        .map_err(|e| JsValue::from_str(&format!("Invalid base64 ciphertext: {}", e)))?;

    // Decode nonce from hex
    let nonce_bytes = hex::decode(nonce_hex)
        .map_err(|e| JsValue::from_str(&format!("Invalid nonce hex: {}", e)))?;
    if nonce_bytes.len() != 12 {
        return Err(JsValue::from_str("Nonce must be 12 bytes"));
    }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    // Look up the peer's encryption key from friends table
    let friend_record = database.get_friend(peer_did)
        .map_err(|e| JsValue::from_str(&format!("Failed to get friend: {}", e)))?
        .ok_or_else(|| JsValue::from_str("Friend not found — cannot decrypt from peer"))?;

    let friend_encryption_key_bytes = hex::decode(&friend_record.encryption_key)
        .map_err(|e| JsValue::from_str(&format!("Invalid friend encryption key: {}", e)))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_encryption_key_bytes.len() != 32 {
        return Err(JsValue::from_str("Friend encryption key must be 32 bytes"));
    }
    friend_enc_key.copy_from_slice(&friend_encryption_key_bytes);

    let our_did = identity.did_string();
    // AAD uses sender/recipient order: peer sent to us, so peer_did first, then our_did
    let aad = format!("{}{}{}", peer_did, our_did, timestamp);

    let plaintext = crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption,
        &friend_enc_key,
        context.as_bytes(),
        &nonce,
        &ciphertext,
        aad.as_bytes(),
    ).map_err(|e| JsValue::from_str(&format!("Decryption failed: {}", e)))?;

    let plaintext_b64 = base64::engine::general_purpose::STANDARD.encode(&plaintext);

    let result = serde_json::json!({
        "plaintext_b64": plaintext_b64,
    });

    Ok(JsValue::from_str(&result.to_string()))
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

// ============================================================================
// COMMUNITIES
// ============================================================================

/// Helper: create a CommunityService from the current state.
fn community_service() -> Result<CommunityService, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;
    Ok(CommunityService::new(database.clone()))
}

/// Create a new community.
///
/// Takes JSON: { "name": "...", "description"?: "...", "owner_did": "...", "owner_nickname"?: "..." }
/// Returns JSON: { "community_id", "space_id", "welcome_channel_id", "general_channel_id", "role_ids": { ... } }
#[wasm_bindgen]
pub fn umbra_wasm_community_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let description = data["description"].as_str();
    let owner_did = data["owner_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing owner_did"))?;
    let owner_nickname = data["owner_nickname"].as_str();

    let svc = community_service()?;
    let result = svc.create_community(name, description, owner_did, owner_nickname)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "community_id": result.community_id,
        "space_id": result.space_id,
        "welcome_channel_id": result.welcome_channel_id,
        "general_channel_id": result.general_channel_id,
        "role_ids": {
            "owner": result.role_ids.owner,
            "admin": result.role_ids.admin,
            "moderator": result.role_ids.moderator,
            "member": result.role_ids.member,
        },
    });

    emit_event("community", &serde_json::json!({
        "type": "communityCreated",
        "community_id": result.community_id,
        "name": name,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get a community by ID.
///
/// Returns JSON: Community object
#[wasm_bindgen]
pub fn umbra_wasm_community_get(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let c = svc.get_community(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json = serde_json::json!({
        "id": c.id,
        "name": c.name,
        "description": c.description,
        "icon_url": c.icon_url,
        "banner_url": c.banner_url,
        "splash_url": c.splash_url,
        "accent_color": c.accent_color,
        "custom_css": c.custom_css,
        "owner_did": c.owner_did,
        "vanity_url": c.vanity_url,
        "created_at": c.created_at,
        "updated_at": c.updated_at,
    });
    Ok(JsValue::from_str(&json.to_string()))
}

/// Get all communities the user is a member of.
///
/// Returns JSON: Community[]
#[wasm_bindgen]
pub fn umbra_wasm_community_get_mine(member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let communities = svc.get_my_communities(member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = communities.iter().map(|c| {
        serde_json::json!({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "icon_url": c.icon_url,
            "banner_url": c.banner_url,
            "splash_url": c.splash_url,
            "accent_color": c.accent_color,
            "custom_css": c.custom_css,
            "owner_did": c.owner_did,
            "vanity_url": c.vanity_url,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Update a community's name and/or description.
///
/// Takes JSON: { "id": "...", "name": "...", "description": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_update(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;
    let name = data["name"].as_str();
    let description = data["description"].as_str();
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.update_community(id, name, description, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityUpdated",
        "community_id": id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Delete a community (owner only).
///
/// Takes JSON: { "id": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_community(id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityDeleted",
        "community_id": id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Transfer community ownership.
///
/// Takes JSON: { "community_id": "...", "current_owner_did": "...", "new_owner_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_transfer_ownership(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let current_owner_did = data["current_owner_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing current_owner_did"))?;
    let new_owner_did = data["new_owner_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing new_owner_did"))?;

    let svc = community_service()?;
    svc.transfer_ownership(community_id, current_owner_did, new_owner_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "ownershipTransferred",
        "community_id": community_id,
        "new_owner_did": new_owner_did,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

// ============================================================================
// COMMUNITY — SPACES
// ============================================================================

/// Create a new space in a community.
///
/// Takes JSON: { "community_id": "...", "name": "...", "position": 0, "actor_did": "..." }
/// Returns JSON: CommunitySpace object
#[wasm_bindgen]
pub fn umbra_wasm_community_space_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let position = data["position"].as_i64().unwrap_or(0) as i32;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    let space = svc.create_space(community_id, name, position, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": space.id,
        "community_id": space.community_id,
        "name": space.name,
        "position": space.position,
        "created_at": space.created_at,
        "updated_at": space.updated_at,
    });

    emit_event("community", &serde_json::json!({
        "type": "spaceCreated",
        "community_id": community_id,
        "space_id": space.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get all spaces in a community.
///
/// Returns JSON: CommunitySpace[]
#[wasm_bindgen]
pub fn umbra_wasm_community_space_list(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let spaces = svc.get_spaces(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = spaces.iter().map(|s| {
        serde_json::json!({
            "id": s.id,
            "community_id": s.community_id,
            "name": s.name,
            "position": s.position,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Update a space's name.
///
/// Takes JSON: { "space_id": "...", "name": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_space_update(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let space_id = data["space_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing space_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.update_space(space_id, name, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "spaceUpdated",
        "space_id": space_id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Reorder spaces in a community.
///
/// Takes JSON: { "community_id": "...", "space_ids": ["id1", "id2", ...] }
#[wasm_bindgen]
pub fn umbra_wasm_community_space_reorder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let space_ids: Vec<String> = data["space_ids"].as_array()
        .ok_or_else(|| JsValue::from_str("Missing space_ids array"))?
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();

    let svc = community_service()?;
    svc.reorder_spaces(community_id, &space_ids, "system")
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Delete a space and all its channels.
///
/// Takes JSON: { "space_id": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_space_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let space_id = data["space_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing space_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_space(space_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "spaceDeleted",
        "space_id": space_id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

// ============================================================================
// COMMUNITY — CHANNELS
// ============================================================================

/// Create a new channel in a space.
///
/// Takes JSON: { "community_id", "space_id", "name", "channel_type", "topic"?, "position", "actor_did" }
/// Returns JSON: CommunityChannel object
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let space_id = data["space_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing space_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let channel_type = data["channel_type"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_type"))?;
    let topic = data["topic"].as_str();
    let position = data["position"].as_i64().unwrap_or(0) as i32;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;
    let category_id = data["category_id"].as_str();

    let svc = community_service()?;
    let ch = svc.create_channel(community_id, space_id, name, channel_type, topic, position, actor_did, category_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": ch.id,
        "community_id": ch.community_id,
        "space_id": ch.space_id,
        "category_id": ch.category_id,
        "name": ch.name,
        "channel_type": ch.channel_type,
        "topic": ch.topic,
        "position": ch.position,
        "slow_mode_seconds": ch.slow_mode_seconds,
        "e2ee_enabled": ch.e2ee_enabled,
        "pin_limit": ch.pin_limit,
        "created_at": ch.created_at,
        "updated_at": ch.updated_at,
    });

    emit_event("community", &serde_json::json!({
        "type": "channelCreated",
        "community_id": community_id,
        "channel_id": ch.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get all channels in a space.
///
/// Returns JSON: CommunityChannel[]
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_list(space_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let channels = svc.get_channels(space_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = channels.iter().map(|ch| {
        serde_json::json!({
            "id": ch.id,
            "community_id": ch.community_id,
            "space_id": ch.space_id,
            "category_id": ch.category_id,
            "name": ch.name,
            "channel_type": ch.channel_type,
            "topic": ch.topic,
            "position": ch.position,
            "slow_mode_seconds": ch.slow_mode_seconds,
            "e2ee_enabled": ch.e2ee_enabled,
            "pin_limit": ch.pin_limit,
            "created_at": ch.created_at,
            "updated_at": ch.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get all channels in a community (across all spaces).
///
/// Returns JSON: CommunityChannel[]
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_list_all(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let channels = svc.get_all_channels(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = channels.iter().map(|ch| {
        serde_json::json!({
            "id": ch.id,
            "community_id": ch.community_id,
            "space_id": ch.space_id,
            "category_id": ch.category_id,
            "name": ch.name,
            "channel_type": ch.channel_type,
            "topic": ch.topic,
            "position": ch.position,
            "slow_mode_seconds": ch.slow_mode_seconds,
            "e2ee_enabled": ch.e2ee_enabled,
            "pin_limit": ch.pin_limit,
            "created_at": ch.created_at,
            "updated_at": ch.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a single channel by ID.
///
/// Returns JSON: CommunityChannel object
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_get(channel_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let ch = svc.get_channel(channel_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json = serde_json::json!({
        "id": ch.id,
        "community_id": ch.community_id,
        "space_id": ch.space_id,
        "category_id": ch.category_id,
        "name": ch.name,
        "channel_type": ch.channel_type,
        "topic": ch.topic,
        "position": ch.position,
        "slow_mode_seconds": ch.slow_mode_seconds,
        "e2ee_enabled": ch.e2ee_enabled,
        "pin_limit": ch.pin_limit,
        "created_at": ch.created_at,
        "updated_at": ch.updated_at,
    });
    Ok(JsValue::from_str(&json.to_string()))
}

/// Update a channel's name and/or topic.
///
/// Takes JSON: { "channel_id": "...", "name"?: "...", "topic"?: "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_update(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let name = data["name"].as_str();
    let topic = data["topic"].as_str();
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.update_channel(channel_id, name, topic, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "channelUpdated",
        "channel_id": channel_id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Set slow mode for a channel.
///
/// Takes JSON: { "channel_id": "...", "seconds": 0, "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_set_slow_mode(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let seconds = data["seconds"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing seconds"))? as i32;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.set_slow_mode(channel_id, seconds, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Toggle E2EE for a channel.
///
/// Takes JSON: { "channel_id": "...", "enabled": true, "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_set_e2ee(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let enabled = data["enabled"].as_bool()
        .ok_or_else(|| JsValue::from_str("Missing enabled"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.set_channel_e2ee(channel_id, enabled, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Delete a channel.
///
/// Takes JSON: { "channel_id": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_channel(channel_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "channelDeleted",
        "channel_id": channel_id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Reorder channels within a space.
///
/// Takes JSON: { "space_id": "...", "channel_ids": ["id1", "id2", ...] }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_reorder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let space_id = data["space_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing space_id"))?;
    let channel_ids: Vec<String> = data["channel_ids"].as_array()
        .ok_or_else(|| JsValue::from_str("Missing channel_ids array"))?
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();

    let svc = community_service()?;
    svc.reorder_channels(space_id, &channel_ids)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

// ============================================================================
// COMMUNITY — MEMBERS
// ============================================================================

/// Join a community.
///
/// Takes JSON: { "community_id": "...", "member_did": "...", "nickname"?: "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_join(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let nickname = data["nickname"].as_str();

    let svc = community_service()?;
    svc.join_community(community_id, member_did, nickname)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberJoined",
        "community_id": community_id,
        "member_did": member_did,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Leave a community.
///
/// Takes JSON: { "community_id": "...", "member_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_leave(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;

    let svc = community_service()?;
    svc.leave_community(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberLeft",
        "community_id": community_id,
        "member_did": member_did,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Kick a member from a community.
///
/// Takes JSON: { "community_id": "...", "target_did": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_kick(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let target_did = data["target_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing target_did"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.kick_member(community_id, target_did, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberKicked",
        "community_id": community_id,
        "target_did": target_did,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Ban a member from a community.
///
/// Takes JSON: { "community_id", "target_did", "reason"?, "expires_at"?, "device_fingerprint"?, "actor_did" }
#[wasm_bindgen]
pub fn umbra_wasm_community_ban(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let target_did = data["target_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing target_did"))?;
    let reason = data["reason"].as_str();
    let expires_at = data["expires_at"].as_i64();
    let device_fingerprint = data["device_fingerprint"].as_str();
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.ban_member(community_id, target_did, reason, expires_at, device_fingerprint, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberBanned",
        "community_id": community_id,
        "target_did": target_did,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Unban a member.
///
/// Takes JSON: { "community_id": "...", "target_did": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_unban(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let target_did = data["target_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing target_did"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.unban_member(community_id, target_did, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberUnbanned",
        "community_id": community_id,
        "target_did": target_did,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Get all members of a community.
///
/// Returns JSON: CommunityMember[]
#[wasm_bindgen]
pub fn umbra_wasm_community_member_list(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let members = svc.get_members(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = members.iter().map(|m| {
        serde_json::json!({
            "community_id": m.community_id,
            "member_did": m.member_did,
            "nickname": m.nickname,
            "avatar_url": m.avatar_url,
            "bio": m.bio,
            "joined_at": m.joined_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a single member record.
///
/// Returns JSON: CommunityMember object
#[wasm_bindgen]
pub fn umbra_wasm_community_member_get(community_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let m = svc.get_member(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json = serde_json::json!({
        "community_id": m.community_id,
        "member_did": m.member_did,
        "nickname": m.nickname,
        "avatar_url": m.avatar_url,
        "bio": m.bio,
        "joined_at": m.joined_at,
    });
    Ok(JsValue::from_str(&json.to_string()))
}

/// Update a member's community profile.
///
/// Takes JSON: { "community_id", "member_did", "nickname"?, "avatar_url"?, "bio"? }
#[wasm_bindgen]
pub fn umbra_wasm_community_member_update_profile(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let nickname = data["nickname"].as_str();
    let avatar_url = data["avatar_url"].as_str();
    let bio = data["bio"].as_str();

    let svc = community_service()?;
    svc.update_member_profile(community_id, member_did, nickname, avatar_url, bio)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Get all bans for a community.
///
/// Returns JSON: CommunityBan[]
#[wasm_bindgen]
pub fn umbra_wasm_community_ban_list(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let bans = svc.get_bans(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = bans.iter().map(|b| {
        serde_json::json!({
            "community_id": b.community_id,
            "banned_did": b.banned_did,
            "reason": b.reason,
            "banned_by": b.banned_by,
            "device_fingerprint": b.device_fingerprint,
            "expires_at": b.expires_at,
            "created_at": b.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — ROLES
// ============================================================================

/// Get all roles for a community.
///
/// Returns JSON: CommunityRole[]
#[wasm_bindgen]
pub fn umbra_wasm_community_role_list(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let roles = svc.get_roles(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = roles.iter().map(|r| {
        serde_json::json!({
            "id": r.id,
            "community_id": r.community_id,
            "name": r.name,
            "color": r.color,
            "icon": r.icon,
            "badge": r.badge,
            "position": r.position,
            "hoisted": r.hoisted,
            "mentionable": r.mentionable,
            "is_preset": r.is_preset,
            "permissions_bitfield": r.permissions_bitfield,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get roles assigned to a specific member.
///
/// Returns JSON: CommunityRole[]
#[wasm_bindgen]
pub fn umbra_wasm_community_member_roles(community_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let roles = svc.get_member_roles(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = roles.iter().map(|r| {
        serde_json::json!({
            "id": r.id,
            "community_id": r.community_id,
            "name": r.name,
            "color": r.color,
            "icon": r.icon,
            "badge": r.badge,
            "position": r.position,
            "hoisted": r.hoisted,
            "mentionable": r.mentionable,
            "is_preset": r.is_preset,
            "permissions_bitfield": r.permissions_bitfield,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Assign a role to a member.
///
/// Takes JSON: { "community_id", "member_did", "role_id", "actor_did" }
#[wasm_bindgen]
pub fn umbra_wasm_community_role_assign(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let role_id = data["role_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing role_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.assign_role(community_id, member_did, role_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "roleAssigned",
        "community_id": community_id,
        "member_did": member_did,
        "role_id": role_id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Unassign a role from a member.
///
/// Takes JSON: { "community_id", "member_did", "role_id", "actor_did" }
#[wasm_bindgen]
pub fn umbra_wasm_community_role_unassign(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let role_id = data["role_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing role_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.unassign_role(community_id, member_did, role_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "roleUnassigned",
        "community_id": community_id,
        "member_did": member_did,
        "role_id": role_id,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

// ============================================================================
// COMMUNITY — INVITES
// ============================================================================

/// Create an invite link for a community.
///
/// Takes JSON: { "community_id", "creator_did", "max_uses"?, "expires_at"? }
/// Returns JSON: CommunityInvite object
#[wasm_bindgen]
pub fn umbra_wasm_community_invite_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let creator_did = data["creator_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing creator_did"))?;
    let max_uses = data["max_uses"].as_i64().map(|v| v as i32);
    let expires_at = data["expires_at"].as_i64();

    let svc = community_service()?;
    let invite = svc.create_invite(community_id, creator_did, max_uses, expires_at)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": invite.id,
        "community_id": invite.community_id,
        "code": invite.code,
        "vanity": invite.vanity,
        "creator_did": invite.creator_did,
        "max_uses": invite.max_uses,
        "use_count": invite.use_count,
        "expires_at": invite.expires_at,
        "created_at": invite.created_at,
    });
    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Use an invite code to join a community.
///
/// Takes JSON: { "code": "...", "member_did": "..." }
/// Returns JSON: { "community_id": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_invite_use(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let code = data["code"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing code"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let nickname = data["nickname"].as_str();

    let svc = community_service()?;
    let community_id = svc.use_invite(code, member_did, nickname)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberJoined",
        "community_id": community_id,
        "member_did": member_did,
    }));

    let json_result = serde_json::json!({
        "community_id": community_id,
    });
    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get all invites for a community.
///
/// Returns JSON: CommunityInvite[]
#[wasm_bindgen]
pub fn umbra_wasm_community_invite_list(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let invites = svc.get_invites(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = invites.iter().map(|i| {
        serde_json::json!({
            "id": i.id,
            "community_id": i.community_id,
            "code": i.code,
            "vanity": i.vanity,
            "creator_did": i.creator_did,
            "max_uses": i.max_uses,
            "use_count": i.use_count,
            "expires_at": i.expires_at,
            "created_at": i.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Delete an invite.
///
/// Takes JSON: { "invite_id": "...", "actor_did": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_invite_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let invite_id = data["invite_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing invite_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_invite(invite_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"success": true}).to_string()))
}

/// Set a vanity invite code for a community.
///
/// Takes JSON: { "community_id": "...", "vanity_code": "...", "creator_did": "..." }
/// Returns JSON: CommunityInvite object
#[wasm_bindgen]
pub fn umbra_wasm_community_invite_set_vanity(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let vanity_code = data["vanity_code"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing vanity_code"))?;
    let creator_did = data["creator_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing creator_did"))?;

    let svc = community_service()?;
    let invite = svc.set_vanity_invite(community_id, vanity_code, creator_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": invite.id,
        "community_id": invite.community_id,
        "code": invite.code,
        "vanity": invite.vanity,
        "creator_did": invite.creator_did,
        "max_uses": invite.max_uses,
        "use_count": invite.use_count,
        "expires_at": invite.expires_at,
        "created_at": invite.created_at,
    });
    Ok(JsValue::from_str(&json_result.to_string()))
}

// ============================================================================
// COMMUNITY — AUDIT LOG
// ============================================================================

/// Get audit log entries for a community.
///
/// Takes JSON: { "community_id": "...", "limit": 50, "offset": 0 }
/// Returns JSON: AuditLogEntry[]
#[wasm_bindgen]
pub fn umbra_wasm_community_audit_log(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;

    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let entries = database.get_audit_log(community_id, limit, offset)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = entries.iter().map(|e| {
        serde_json::json!({
            "id": e.id,
            "community_id": e.community_id,
            "actor_did": e.actor_did,
            "action_type": e.action_type,
            "target_type": e.target_type,
            "target_id": e.target_id,
            "metadata_json": e.metadata_json,
            "content_detail": e.content_detail,
            "created_at": e.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — MESSAGING (Phase 2)
// ============================================================================

/// Send a plaintext message to a community channel.
///
/// Takes JSON: { "channel_id": "...", "sender_did": "...", "content": "...",
///               "reply_to_id": null, "thread_id": null, "content_warning": null }
/// Returns JSON: CommunityMessage object
#[wasm_bindgen]
pub fn umbra_wasm_community_message_send(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let sender_did = data["sender_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing sender_did"))?;
    let content = data["content"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing content"))?;
    let reply_to_id = data["reply_to_id"].as_str();
    let thread_id = data["thread_id"].as_str();
    let content_warning = data["content_warning"].as_str();

    let svc = community_service()?;
    let msg = svc.send_message(channel_id, sender_did, content, reply_to_id, thread_id, content_warning)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = message_to_json(&msg);

    emit_event("community", &serde_json::json!({
        "type": "communityMessageSent",
        "channel_id": channel_id,
        "message_id": msg.id,
        "sender_did": sender_did,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Send an encrypted message to a community channel (E2EE).
///
/// Takes JSON: { "channel_id": "...", "sender_did": "...", "content_encrypted_b64": "...",
///               "nonce": "...", "key_version": 1, "reply_to_id": null, "thread_id": null }
/// Returns JSON: { "message_id": "..." }
#[wasm_bindgen]
pub fn umbra_wasm_community_message_send_encrypted(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let sender_did = data["sender_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing sender_did"))?;
    let content_b64 = data["content_encrypted_b64"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing content_encrypted_b64"))?;
    let nonce = data["nonce"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing nonce"))?;
    let key_version = data["key_version"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing key_version"))? as i32;
    let reply_to_id = data["reply_to_id"].as_str();
    let thread_id = data["thread_id"].as_str();

    let encrypted_bytes = base64::engine::general_purpose::STANDARD.decode(content_b64)
        .map_err(|e| JsValue::from_str(&format!("Invalid base64: {}", e)))?;

    let svc = community_service()?;
    let id = svc.send_encrypted_message(
        channel_id, sender_did, &encrypted_bytes, nonce, key_version, reply_to_id, thread_id,
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityMessageSent",
        "channel_id": channel_id,
        "message_id": id,
        "sender_did": sender_did,
        "is_e2ee": true,
    }));

    Ok(JsValue::from_str(&serde_json::json!({"message_id": id}).to_string()))
}

/// Get messages for a community channel (paginated).
///
/// Takes JSON: { "channel_id": "...", "limit": 50, "before_timestamp": null }
/// Returns JSON: CommunityMessage[]
#[wasm_bindgen]
pub fn umbra_wasm_community_message_list(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let before_timestamp = data["before_timestamp"].as_i64();

    let svc = community_service()?;
    let msgs = svc.get_messages(channel_id, limit, before_timestamp)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = msgs.iter().map(|m| message_to_json(m)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a single message by ID.
///
/// Returns JSON: CommunityMessage object
#[wasm_bindgen]
pub fn umbra_wasm_community_message_get(message_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let msg = svc.get_message(message_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str(&message_to_json(&msg).to_string()))
}

/// Edit a message.
///
/// Takes JSON: { "message_id": "...", "new_content": "...", "editor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_message_edit(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let new_content = data["new_content"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing new_content"))?;
    let editor_did = data["editor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing editor_did"))?;

    let svc = community_service()?;
    svc.edit_message(message_id, new_content, editor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityMessageEdited",
        "message_id": message_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Delete a message for everyone.
///
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_message_delete(message_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.delete_message_for_everyone(message_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityMessageDeleted",
        "message_id": message_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Delete a message for the current user only.
///
/// Takes JSON: { "message_id": "...", "member_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_message_delete_for_me(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;

    let svc = community_service()?;
    svc.delete_message_for_me(message_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — REACTIONS (Phase 2)
// ============================================================================

/// Add a reaction to a message.
///
/// Takes JSON: { "message_id": "...", "member_did": "...", "emoji": "...", "is_custom": false }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_reaction_add(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let emoji = data["emoji"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing emoji"))?;
    let is_custom = data["is_custom"].as_bool().unwrap_or(false);

    let svc = community_service()?;
    svc.add_reaction(message_id, member_did, emoji, is_custom)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityReactionAdded",
        "message_id": message_id,
        "emoji": emoji,
        "member_did": member_did,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Remove a reaction from a message.
///
/// Takes JSON: { "message_id": "...", "member_did": "...", "emoji": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_reaction_remove(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let emoji = data["emoji"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing emoji"))?;

    let svc = community_service()?;
    svc.remove_reaction(message_id, member_did, emoji)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityReactionRemoved",
        "message_id": message_id,
        "emoji": emoji,
        "member_did": member_did,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Get reactions for a message.
///
/// Returns JSON: CommunityReaction[]
#[wasm_bindgen]
pub fn umbra_wasm_community_reaction_list(message_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let reactions = svc.get_reactions(message_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = reactions.iter().map(|r| {
        serde_json::json!({
            "id": format!("{}_{}_{}", r.message_id, r.member_did, r.emoji),
            "message_id": r.message_id,
            "member_did": r.member_did,
            "emoji": r.emoji,
            "is_custom": r.is_custom,
            "created_at": r.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — READ RECEIPTS (Phase 2)
// ============================================================================

/// Mark a channel as read up to a specific message.
///
/// Takes JSON: { "channel_id": "...", "member_did": "...", "last_read_message_id": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_mark_read(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let last_read_message_id = data["last_read_message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing last_read_message_id"))?;

    let svc = community_service()?;
    svc.mark_read(channel_id, member_did, last_read_message_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Get read receipts for a channel.
///
/// Returns JSON: ReadReceipt[]
#[wasm_bindgen]
pub fn umbra_wasm_community_read_receipts(channel_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let receipts = svc.get_read_receipts(channel_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = receipts.iter().map(|r| {
        serde_json::json!({
            "channel_id": r.channel_id,
            "member_did": r.member_did,
            "last_read_message_id": r.last_read_message_id,
            "read_at": r.read_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — PINS (Phase 2)
// ============================================================================

/// Pin a message in a channel.
///
/// Takes JSON: { "channel_id": "...", "message_id": "...", "pinned_by": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_pin_message(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;
    let pinned_by = data["pinned_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing pinned_by"))?;

    let svc = community_service()?;
    svc.pin_message(channel_id, message_id, pinned_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityMessagePinned",
        "channel_id": channel_id,
        "message_id": message_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Unpin a message.
///
/// Takes JSON: { "channel_id": "...", "message_id": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_unpin_message(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let message_id = data["message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing message_id"))?;

    let svc = community_service()?;
    svc.unpin_message(channel_id, message_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityMessageUnpinned",
        "channel_id": channel_id,
        "message_id": message_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Get pinned messages for a channel.
///
/// Returns JSON: CommunityPin[]
#[wasm_bindgen]
pub fn umbra_wasm_community_pin_list(channel_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let pins = svc.get_pins(channel_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = pins.iter().map(|p| {
        serde_json::json!({
            "channel_id": p.channel_id,
            "message_id": p.message_id,
            "pinned_by": p.pinned_by,
            "pinned_at": p.pinned_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — CHANNEL KEYS / E2EE (Phase 2)
// ============================================================================

/// Store a channel encryption key.
///
/// Takes JSON: { "channel_id": "...", "key_version": 1, "encrypted_key_b64": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_key_store(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let key_version = data["key_version"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing key_version"))? as i32;
    let encrypted_key_b64 = data["encrypted_key_b64"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing encrypted_key_b64"))?;

    let key_bytes = base64::engine::general_purpose::STANDARD.decode(encrypted_key_b64)
        .map_err(|e| JsValue::from_str(&format!("Invalid base64: {}", e)))?;

    let svc = community_service()?;
    svc.store_channel_key(channel_id, key_version, &key_bytes)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Get the latest channel encryption key.
///
/// Returns JSON: ChannelKey object or null
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_key_latest(channel_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let key = svc.get_latest_channel_key(channel_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    match key {
        Some(k) => {
            let b64 = base64::engine::general_purpose::STANDARD.encode(&k.encrypted_key);
            let json = serde_json::json!({
                "channel_id": k.channel_id,
                "key_version": k.key_version,
                "encrypted_key_b64": b64,
                "created_at": k.created_at,
            });
            Ok(JsValue::from_str(&json.to_string()))
        }
        None => Ok(JsValue::from_str("null")),
    }
}

// ============================================================================
// COMMUNITY — THREADS (Phase 3)
// ============================================================================

/// Create a thread from a parent message.
///
/// Takes JSON: { "channel_id": "...", "parent_message_id": "...", "name": null, "created_by": "..." }
/// Returns JSON: CommunityThread object
#[wasm_bindgen]
pub fn umbra_wasm_community_thread_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let parent_message_id = data["parent_message_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing parent_message_id"))?;
    let name = data["name"].as_str();
    let created_by = data["created_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing created_by"))?;

    let svc = community_service()?;
    let thread = svc.create_thread(channel_id, parent_message_id, name, created_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = thread_to_json(&thread);

    emit_event("community", &serde_json::json!({
        "type": "communityThreadCreated",
        "channel_id": channel_id,
        "thread_id": thread.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get a thread by ID.
///
/// Returns JSON: CommunityThread object
#[wasm_bindgen]
pub fn umbra_wasm_community_thread_get(thread_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let thread = svc.get_thread(thread_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str(&thread_to_json(&thread).to_string()))
}

/// Get all threads in a channel.
///
/// Returns JSON: CommunityThread[]
#[wasm_bindgen]
pub fn umbra_wasm_community_thread_list(channel_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let threads = svc.get_threads(channel_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = threads.iter().map(|t| thread_to_json(t)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get messages in a thread.
///
/// Takes JSON: { "thread_id": "...", "limit": 50, "before_timestamp": null }
/// Returns JSON: CommunityMessage[]
#[wasm_bindgen]
pub fn umbra_wasm_community_thread_messages(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let thread_id = data["thread_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing thread_id"))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let before_timestamp = data["before_timestamp"].as_i64();

    let svc = community_service()?;
    let msgs = svc.get_thread_messages(thread_id, limit, before_timestamp)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = msgs.iter().map(|m| message_to_json(m)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — SEARCH (Phase 3)
// ============================================================================

/// Search messages in a channel.
///
/// Takes JSON: { "channel_id": "...", "query": "...", "limit": 50 }
/// Returns JSON: CommunityMessage[]
#[wasm_bindgen]
pub fn umbra_wasm_community_search_channel(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let query = data["query"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing query"))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;

    let svc = community_service()?;
    let msgs = svc.search_messages(channel_id, query, limit)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = msgs.iter().map(|m| message_to_json(m)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Search messages across all channels in a community.
///
/// Takes JSON: { "community_id": "...", "query": "...", "limit": 50 }
/// Returns JSON: CommunityMessage[]
#[wasm_bindgen]
pub fn umbra_wasm_community_search(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let query = data["query"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing query"))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;

    let svc = community_service()?;
    let msgs = svc.search_community_messages(community_id, query, limit)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = msgs.iter().map(|m| message_to_json(m)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — MODERATION (Phase 5)
// ============================================================================

/// Issue a warning to a member.
///
/// Takes JSON: { "community_id": "...", "member_did": "...", "reason": "...",
///               "warned_by": "...", "expires_at": null }
/// Returns JSON: CommunityWarning object
#[wasm_bindgen]
pub fn umbra_wasm_community_warn_member(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let reason = data["reason"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing reason"))?;
    let warned_by = data["warned_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing warned_by"))?;
    let expires_at = data["expires_at"].as_i64();

    let svc = community_service()?;
    let warning = svc.warn_member(community_id, member_did, reason, warned_by, expires_at)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = warning_to_json(&warning);

    emit_event("community", &serde_json::json!({
        "type": "communityMemberWarned",
        "community_id": community_id,
        "member_did": member_did,
        "warning_id": warning.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get warnings for a specific member.
///
/// Takes JSON: { "community_id": "...", "member_did": "..." }
/// Returns JSON: CommunityWarning[]
#[wasm_bindgen]
pub fn umbra_wasm_community_member_warnings(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;

    let svc = community_service()?;
    let warnings = svc.get_member_warnings(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = warnings.iter().map(|w| warning_to_json(w)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get all warnings for a community (paginated).
///
/// Takes JSON: { "community_id": "...", "limit": 50, "offset": 0 }
/// Returns JSON: CommunityWarning[]
#[wasm_bindgen]
pub fn umbra_wasm_community_warnings(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;

    let svc = community_service()?;
    let warnings = svc.get_all_warnings(community_id, limit, offset)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = warnings.iter().map(|w| warning_to_json(w)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get the active warning count for a member.
///
/// Takes JSON: { "community_id": "...", "member_did": "..." }
/// Returns JSON: { "count": N }
#[wasm_bindgen]
pub fn umbra_wasm_community_active_warning_count(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;

    let svc = community_service()?;
    let count = svc.get_active_warning_count(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"count": count}).to_string()))
}

/// Delete a warning.
///
/// Takes JSON: { "warning_id": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_warning_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let warning_id = data["warning_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing warning_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_warning(warning_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Check warning escalation for a member.
///
/// Takes JSON: { "community_id": "...", "member_did": "...", "timeout_threshold": null, "ban_threshold": null }
/// Returns JSON: { "action": "timeout" | "ban" | null }
#[wasm_bindgen]
pub fn umbra_wasm_community_check_escalation(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let member_did = data["member_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing member_did"))?;
    let timeout_threshold = data["timeout_threshold"].as_i64().map(|v| v as i32);
    let ban_threshold = data["ban_threshold"].as_i64().map(|v| v as i32);

    let svc = community_service()?;
    let action = svc.check_warning_escalation(community_id, member_did, timeout_threshold, ban_threshold)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"action": action}).to_string()))
}

/// Check if a message matches keyword filters.
///
/// Takes JSON: { "content": "...", "filters": [{"pattern": "...", "action": "delete"}] }
/// Returns JSON: { "action": "delete" | "warn" | "timeout" | null }
#[wasm_bindgen]
pub fn umbra_wasm_community_check_keyword_filter(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let content = data["content"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing content"))?;
    let filters_arr = data["filters"].as_array()
        .ok_or_else(|| JsValue::from_str("Missing filters array"))?;

    let filters: Vec<(String, String)> = filters_arr.iter().map(|f| {
        let pattern = f["pattern"].as_str().unwrap_or("").to_string();
        let action = f["action"].as_str().unwrap_or("delete").to_string();
        (pattern, action)
    }).collect();

    let filter_refs: Vec<(&str, &str)> = filters.iter()
        .map(|(p, a)| (p.as_str(), a.as_str()))
        .collect();

    let svc = community_service()?;
    let action = svc.check_keyword_filter(content, &filter_refs);

    Ok(JsValue::from_str(&serde_json::json!({"action": action}).to_string()))
}

/// Check for ban evasion by device fingerprint.
///
/// Takes JSON: { "community_id": "...", "device_fingerprint": "..." }
/// Returns JSON: { "banned_did": "..." | null }
#[wasm_bindgen]
pub fn umbra_wasm_community_check_ban_evasion(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let device_fingerprint = data["device_fingerprint"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing device_fingerprint"))?;

    let svc = community_service()?;
    let result = svc.check_ban_evasion(community_id, device_fingerprint)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"banned_did": result}).to_string()))
}

// ============================================================================
// COMMUNITY — FILES (Phase 7)
// ============================================================================

/// Upload a file record to a channel.
///
/// Takes JSON: { "channel_id": "...", "folder_id": null, "filename": "...",
///               "description": null, "file_size": 1024, "mime_type": null,
///               "storage_chunks_json": "...", "uploaded_by": "..." }
/// Returns JSON: CommunityFile object
#[wasm_bindgen]
pub fn umbra_wasm_community_file_upload(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let folder_id = data["folder_id"].as_str();
    let filename = data["filename"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing filename"))?;
    let description = data["description"].as_str();
    let file_size = data["file_size"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing file_size"))?;
    let mime_type = data["mime_type"].as_str();
    let storage_chunks_json = data["storage_chunks_json"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing storage_chunks_json"))?;
    let uploaded_by = data["uploaded_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing uploaded_by"))?;

    let svc = community_service()?;
    let file = svc.upload_file(
        channel_id, folder_id, filename, description,
        file_size, mime_type, storage_chunks_json, uploaded_by,
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = file_to_json(&file);

    emit_event("community", &serde_json::json!({
        "type": "communityFileUploaded",
        "channel_id": channel_id,
        "file_id": file.id,
        "filename": filename,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get files in a channel.
///
/// Takes JSON: { "channel_id": "...", "folder_id": null, "limit": 50, "offset": 0 }
/// Returns JSON: CommunityFile[]
#[wasm_bindgen]
pub fn umbra_wasm_community_file_list(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let folder_id = data["folder_id"].as_str();
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;

    let svc = community_service()?;
    let files = svc.get_files(channel_id, folder_id, limit, offset)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = files.iter().map(|f| file_to_json(f)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a file by ID.
///
/// Returns JSON: CommunityFile object
#[wasm_bindgen]
pub fn umbra_wasm_community_file_get(file_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let file = svc.get_file(file_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str(&file_to_json(&file).to_string()))
}

/// Record a file download (increment count).
///
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_file_download(file_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.record_file_download(file_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Delete a file.
///
/// Takes JSON: { "file_id": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_file_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let file_id = data["file_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing file_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_file(file_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityFileDeleted",
        "file_id": file_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — FOLDERS (Phase 7)
// ============================================================================

/// Create a folder in a file channel.
///
/// Takes JSON: { "channel_id": "...", "parent_folder_id": null, "name": "...", "created_by": "..." }
/// Returns JSON: CommunityFileFolder object
#[wasm_bindgen]
pub fn umbra_wasm_community_folder_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let created_by = data["created_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing created_by"))?;

    let svc = community_service()?;
    let folder = svc.create_folder(channel_id, parent_folder_id, name, created_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": folder.id,
        "channel_id": folder.channel_id,
        "parent_folder_id": folder.parent_folder_id,
        "name": folder.name,
        "created_by": folder.created_by,
        "created_at": folder.created_at,
    });

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get folders in a channel (optionally within a parent folder).
///
/// Takes JSON: { "channel_id": "...", "parent_folder_id": null }
/// Returns JSON: CommunityFileFolder[]
#[wasm_bindgen]
pub fn umbra_wasm_community_folder_list(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let parent_folder_id = data["parent_folder_id"].as_str();

    let svc = community_service()?;
    let folders = svc.get_folders(channel_id, parent_folder_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = folders.iter().map(|f| {
        serde_json::json!({
            "id": f.id,
            "channel_id": f.channel_id,
            "parent_folder_id": f.parent_folder_id,
            "name": f.name,
            "created_by": f.created_by,
            "created_at": f.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Delete a folder.
///
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_folder_delete(folder_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.delete_folder(folder_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — CUSTOMIZATION / BRANDING (Phase 9)
// ============================================================================

/// Update community branding.
///
/// Takes JSON: { "community_id": "...", "icon_url": null, "banner_url": null,
///               "splash_url": null, "accent_color": null, "custom_css": null, "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_update_branding(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let icon_url = data["icon_url"].as_str();
    let banner_url = data["banner_url"].as_str();
    let splash_url = data["splash_url"].as_str();
    let accent_color = data["accent_color"].as_str();
    let custom_css = data["custom_css"].as_str();
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.update_branding(community_id, icon_url, banner_url, splash_url, accent_color, custom_css, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityBrandingUpdated",
        "community_id": community_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Set a vanity URL for a community.
///
/// Takes JSON: { "community_id": "...", "vanity_url": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_set_vanity_url(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let vanity_url = data["vanity_url"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing vanity_url"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.set_vanity_url(community_id, vanity_url, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — CUSTOM EMOJI (Phase 9)
// ============================================================================

/// Create a custom emoji.
///
/// Takes JSON: { "community_id": "...", "name": "...", "image_url": "...",
///               "animated": false, "uploaded_by": "..." }
/// Returns JSON: CommunityEmoji object
#[wasm_bindgen]
pub fn umbra_wasm_community_emoji_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let image_url = data["image_url"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing image_url"))?;
    let animated = data["animated"].as_bool().unwrap_or(false);
    let uploaded_by = data["uploaded_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing uploaded_by"))?;

    let svc = community_service()?;
    let emoji = svc.create_emoji(community_id, name, image_url, animated, uploaded_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": emoji.id,
        "community_id": emoji.community_id,
        "name": emoji.name,
        "image_url": emoji.image_url,
        "animated": emoji.animated,
        "uploaded_by": emoji.uploaded_by,
        "created_at": emoji.created_at,
    });

    emit_event("community", &serde_json::json!({
        "type": "communityEmojiCreated",
        "community_id": community_id,
        "emoji_id": emoji.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get all custom emoji for a community.
///
/// Returns JSON: CommunityEmoji[]
#[wasm_bindgen]
pub fn umbra_wasm_community_emoji_list(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let emoji = svc.get_emoji(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = emoji.iter().map(|e| {
        serde_json::json!({
            "id": e.id,
            "community_id": e.community_id,
            "name": e.name,
            "image_url": e.image_url,
            "animated": e.animated,
            "uploaded_by": e.uploaded_by,
            "created_at": e.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Delete a custom emoji.
///
/// Takes JSON: { "emoji_id": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_emoji_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let emoji_id = data["emoji_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing emoji_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_emoji(emoji_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — STICKERS (Phase 9)
// ============================================================================

/// Create a custom sticker.
///
/// Takes JSON: { "community_id": "...", "pack_id": null, "name": "...",
///               "image_url": "...", "animated": false, "uploaded_by": "..." }
/// Returns JSON: CommunitySticker object
#[wasm_bindgen]
pub fn umbra_wasm_community_sticker_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let pack_id = data["pack_id"].as_str();
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let image_url = data["image_url"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing image_url"))?;
    let animated = data["animated"].as_bool().unwrap_or(false);
    let uploaded_by = data["uploaded_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing uploaded_by"))?;

    let svc = community_service()?;
    let sticker = svc.create_sticker(community_id, pack_id, name, image_url, animated, uploaded_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": sticker.id,
        "community_id": sticker.community_id,
        "pack_id": sticker.pack_id,
        "name": sticker.name,
        "image_url": sticker.image_url,
        "animated": sticker.animated,
        "uploaded_by": sticker.uploaded_by,
        "created_at": sticker.created_at,
    });

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get all stickers for a community.
///
/// Returns JSON: CommunitySticker[]
#[wasm_bindgen]
pub fn umbra_wasm_community_sticker_list(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let stickers = svc.get_stickers(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = stickers.iter().map(|s| {
        serde_json::json!({
            "id": s.id,
            "community_id": s.community_id,
            "pack_id": s.pack_id,
            "name": s.name,
            "image_url": s.image_url,
            "animated": s.animated,
            "uploaded_by": s.uploaded_by,
            "created_at": s.created_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Delete a custom sticker.
///
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_sticker_delete(sticker_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.delete_sticker(sticker_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — WEBHOOKS (Phase 10)
// ============================================================================

/// Create a webhook for a channel.
///
/// Takes JSON: { "channel_id": "...", "name": "...", "avatar_url": null, "creator_did": "..." }
/// Returns JSON: CommunityWebhook object
#[wasm_bindgen]
pub fn umbra_wasm_community_webhook_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let avatar_url = data["avatar_url"].as_str();
    let creator_did = data["creator_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing creator_did"))?;

    let svc = community_service()?;
    let webhook = svc.create_webhook(channel_id, name, avatar_url, creator_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = webhook_to_json(&webhook);

    emit_event("community", &serde_json::json!({
        "type": "communityWebhookCreated",
        "channel_id": channel_id,
        "webhook_id": webhook.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get webhooks for a channel.
///
/// Returns JSON: CommunityWebhook[]
#[wasm_bindgen]
pub fn umbra_wasm_community_webhook_list(channel_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let webhooks = svc.get_webhooks(channel_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = webhooks.iter().map(|w| webhook_to_json(w)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a webhook by ID.
///
/// Returns JSON: CommunityWebhook object
#[wasm_bindgen]
pub fn umbra_wasm_community_webhook_get(webhook_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let webhook = svc.get_webhook(webhook_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str(&webhook_to_json(&webhook).to_string()))
}

/// Update a webhook.
///
/// Takes JSON: { "webhook_id": "...", "name": null, "avatar_url": null }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_webhook_update(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let webhook_id = data["webhook_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing webhook_id"))?;
    let name = data["name"].as_str();
    let avatar_url = data["avatar_url"].as_str();

    let svc = community_service()?;
    svc.update_webhook(webhook_id, name, avatar_url)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Delete a webhook.
///
/// Takes JSON: { "webhook_id": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_webhook_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let webhook_id = data["webhook_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing webhook_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_webhook(webhook_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityWebhookDeleted",
        "webhook_id": webhook_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — CHANNEL PERMISSION OVERRIDES (Phase 4)
// ============================================================================

/// Set a permission override for a role or member on a channel.
///
/// Takes JSON: { "channel_id": "...", "target_type": "role"|"member",
///               "target_id": "...", "allow_bitfield": "...", "deny_bitfield": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_override_set(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let target_type = data["target_type"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing target_type"))?;
    let target_id = data["target_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing target_id"))?;
    let allow_bitfield = data["allow_bitfield"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing allow_bitfield"))?;
    let deny_bitfield = data["deny_bitfield"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing deny_bitfield"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.set_channel_override(channel_id, target_type, target_id, allow_bitfield, deny_bitfield, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Get all permission overrides for a channel.
///
/// Returns JSON: ChannelPermissionOverride[]
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_override_list(channel_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let overrides = svc.get_channel_overrides(channel_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = overrides.iter().map(|o| {
        serde_json::json!({
            "id": o.id,
            "channel_id": o.channel_id,
            "target_type": o.target_type,
            "target_id": o.target_id,
            "allow_bitfield": o.allow_bitfield,
            "deny_bitfield": o.deny_bitfield,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Remove a permission override.
///
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_override_remove(override_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.remove_channel_override(override_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — CUSTOM ROLES (Phase 4)
// ============================================================================

/// Create a custom role.
///
/// Takes JSON: { "community_id": "...", "name": "...", "color": null,
///               "position": 10, "hoisted": false, "mentionable": false,
///               "permissions_bitfield": "...", "actor_did": "..." }
/// Returns JSON: CommunityRole object
#[wasm_bindgen]
pub fn umbra_wasm_community_custom_role_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let color = data["color"].as_str();
    let position = data["position"].as_i64().unwrap_or(10) as i32;
    let hoisted = data["hoisted"].as_bool().unwrap_or(false);
    let mentionable = data["mentionable"].as_bool().unwrap_or(false);
    let permissions_bitfield = data["permissions_bitfield"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing permissions_bitfield"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    let role = svc.create_custom_role(
        community_id, name, color, position, hoisted, mentionable, permissions_bitfield, actor_did,
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": role.id,
        "community_id": role.community_id,
        "name": role.name,
        "color": role.color,
        "icon": role.icon,
        "badge": role.badge,
        "position": role.position,
        "hoisted": role.hoisted,
        "mentionable": role.mentionable,
        "is_preset": role.is_preset,
        "permissions_bitfield": role.permissions_bitfield,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
    });

    emit_event("community", &serde_json::json!({
        "type": "communityRoleCreated",
        "community_id": community_id,
        "role_id": role.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Update a role's properties.
///
/// Takes JSON: { "role_id": "...", "name": null, "color": null,
///               "hoisted": null, "mentionable": null, "position": null, "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_role_update(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let role_id = data["role_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing role_id"))?;
    let name = data["name"].as_str();
    let color = data["color"].as_str();
    let hoisted = data["hoisted"].as_bool();
    let mentionable = data["mentionable"].as_bool();
    let position = data["position"].as_i64().map(|v| v as i32);
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.update_role(role_id, name, color, hoisted, mentionable, position, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityRoleUpdated",
        "role_id": role_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Update a role's permission bitfield.
///
/// Takes JSON: { "role_id": "...", "permissions_bitfield": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_role_update_permissions(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let role_id = data["role_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing role_id"))?;
    let permissions_bitfield = data["permissions_bitfield"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing permissions_bitfield"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.update_role_permissions(role_id, permissions_bitfield, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityRolePermissionsUpdated",
        "role_id": role_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Delete a custom role.
///
/// Takes JSON: { "role_id": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_role_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let role_id = data["role_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing role_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_role(role_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "communityRoleDeleted",
        "role_id": role_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — CATEGORIES
// ============================================================================

/// Create a new category in a space.
///
/// Takes JSON: { "community_id": "...", "space_id": "...", "name": "...", "position": 0, "actor_did": "..." }
/// Returns JSON: CommunityCategory object
#[wasm_bindgen]
pub fn umbra_wasm_community_category_create(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let community_id = data["community_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing community_id"))?;
    let space_id = data["space_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing space_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let position = data["position"].as_i64().unwrap_or(0) as i32;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    let cat = svc.create_category(community_id, space_id, name, position, actor_did)
        .map_err(|e: crate::error::Error| JsValue::from_str(&e.to_string()))?;

    let json_result = serde_json::json!({
        "id": cat.id,
        "community_id": cat.community_id,
        "space_id": cat.space_id,
        "name": cat.name,
        "position": cat.position,
        "created_at": cat.created_at,
        "updated_at": cat.updated_at,
    });

    emit_event("community", &serde_json::json!({
        "type": "categoryCreated",
        "community_id": community_id,
        "category_id": cat.id,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get all categories in a space.
///
/// Returns JSON: CommunityCategory[]
#[wasm_bindgen]
pub fn umbra_wasm_community_category_list(space_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let categories = svc.get_categories(space_id)
        .map_err(|e: crate::error::Error| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = categories.iter().map(|c| {
        serde_json::json!({
            "id": c.id,
            "community_id": c.community_id,
            "space_id": c.space_id,
            "name": c.name,
            "position": c.position,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get all categories in a community (across all spaces).
///
/// Returns JSON: CommunityCategory[]
#[wasm_bindgen]
pub fn umbra_wasm_community_category_list_all(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let categories = svc.get_all_categories(community_id)
        .map_err(|e: crate::error::Error| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = categories.iter().map(|c| {
        serde_json::json!({
            "id": c.id,
            "community_id": c.community_id,
            "space_id": c.space_id,
            "name": c.name,
            "position": c.position,
            "created_at": c.created_at,
            "updated_at": c.updated_at,
        })
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Update a category's name.
///
/// Takes JSON: { "category_id": "...", "name": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_category_update(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let category_id = data["category_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing category_id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.update_category(category_id, name, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "categoryUpdated",
        "category_id": category_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Reorder categories in a space.
///
/// Takes JSON: { "space_id": "...", "category_ids": ["...", "..."] }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_category_reorder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let space_id = data["space_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing space_id"))?;
    let category_ids: Vec<String> = data["category_ids"].as_array()
        .ok_or_else(|| JsValue::from_str("Missing category_ids"))?
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();

    let svc = community_service()?;
    svc.reorder_categories(space_id, &category_ids)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Delete a category. Channels in this category become uncategorized.
///
/// Takes JSON: { "category_id": "...", "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_category_delete(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let category_id = data["category_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing category_id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_category(category_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "categoryDeleted",
        "category_id": category_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Move a channel to a different category (or uncategorize it).
///
/// Takes JSON: { "channel_id": "...", "category_id": "..." or null, "actor_did": "..." }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_channel_move_category(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let category_id = data["category_id"].as_str();
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.move_channel_to_category(channel_id, category_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "channelUpdated",
        "channel_id": channel_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — BOOST NODES (Phase 11)
// ============================================================================

/// Register a new boost node.
///
/// Takes JSON: { "owner_did": "...", "node_type": "local"|"remote",
///               "node_public_key": "...", "name": "...",
///               "max_storage_bytes": 1073741824, "max_bandwidth_mbps": 100,
///               "auto_start": true, "prioritized_communities": null,
///               "pairing_token": null, "remote_address": null }
/// Returns JSON: BoostNode object
#[wasm_bindgen]
pub fn umbra_wasm_community_boost_node_register(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let owner_did = data["owner_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing owner_did"))?;
    let node_type = data["node_type"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing node_type"))?;
    let node_public_key = data["node_public_key"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing node_public_key"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let max_storage_bytes = data["max_storage_bytes"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing max_storage_bytes"))?;
    let max_bandwidth_mbps = data["max_bandwidth_mbps"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing max_bandwidth_mbps"))? as i32;
    let auto_start = data["auto_start"].as_bool().unwrap_or(true);
    let prioritized_communities = data["prioritized_communities"].as_str();
    let pairing_token = data["pairing_token"].as_str();
    let remote_address = data["remote_address"].as_str();

    let svc = community_service()?;
    let node = svc.register_boost_node(
        owner_did, node_type, node_public_key, name,
        max_storage_bytes, max_bandwidth_mbps, auto_start,
        prioritized_communities, pairing_token, remote_address,
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let json_result = boost_node_to_json(&node);

    emit_event("community", &serde_json::json!({
        "type": "boostNodeRegistered",
        "node_id": node.id,
        "owner_did": owner_did,
    }));

    Ok(JsValue::from_str(&json_result.to_string()))
}

/// Get all boost nodes for a user.
///
/// Returns JSON: BoostNode[]
#[wasm_bindgen]
pub fn umbra_wasm_community_boost_node_list(owner_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let nodes = svc.get_boost_nodes(owner_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = nodes.iter().map(|n| boost_node_to_json(n)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a specific boost node.
///
/// Returns JSON: BoostNode object
#[wasm_bindgen]
pub fn umbra_wasm_community_boost_node_get(node_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let node = svc.get_boost_node(node_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str(&boost_node_to_json(&node).to_string()))
}

/// Update boost node configuration.
///
/// Takes JSON: { "node_id": "...", "name": null, "enabled": null,
///               "max_storage_bytes": null, "max_bandwidth_mbps": null,
///               "auto_start": null, "prioritized_communities": null }
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_boost_node_update(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let node_id = data["node_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing node_id"))?;
    let name = data["name"].as_str();
    let enabled = data["enabled"].as_bool();
    let max_storage_bytes = data["max_storage_bytes"].as_i64();
    let max_bandwidth_mbps = data["max_bandwidth_mbps"].as_i64().map(|v| v as i32);
    let auto_start = data["auto_start"].as_bool();
    let prioritized_communities = data["prioritized_communities"].as_str();

    let svc = community_service()?;
    svc.update_boost_node(node_id, name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "boostNodeUpdated",
        "node_id": node_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Update boost node heartbeat (last seen).
///
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_boost_node_heartbeat(node_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.update_boost_node_heartbeat(node_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Delete a boost node.
///
/// Returns JSON: { "success": true }
#[wasm_bindgen]
pub fn umbra_wasm_community_boost_node_delete(node_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.delete_boost_node(node_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "boostNodeDeleted",
        "node_id": node_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — GAP FILL: TIMEOUTS
// ============================================================================

/// Timeout a member (mute or restrict).
#[wasm_bindgen]
pub fn umbra_wasm_community_timeout_member(json: &str) -> Result<JsValue, JsValue> {
    let v: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let svc = community_service()?;
    let record = svc.timeout_member(
        v["community_id"].as_str().unwrap_or(""),
        v["member_did"].as_str().unwrap_or(""),
        v["reason"].as_str(),
        v["timeout_type"].as_str().unwrap_or("mute"),
        v["duration_seconds"].as_i64().unwrap_or(3600),
        v["issued_by"].as_str().unwrap_or(""),
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberTimedOut",
        "community_id": record.community_id,
        "member_did": record.member_did,
        "timeout_type": record.timeout_type,
        "expires_at": record.expires_at,
    }));

    Ok(JsValue::from_str(&serde_json::json!({
        "id": record.id,
        "community_id": record.community_id,
        "member_did": record.member_did,
        "reason": record.reason,
        "timeout_type": record.timeout_type,
        "issued_by": record.issued_by,
        "expires_at": record.expires_at,
        "created_at": record.created_at,
    }).to_string()))
}

/// Remove a timeout early.
#[wasm_bindgen]
pub fn umbra_wasm_community_remove_timeout(timeout_id: &str, actor_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.remove_timeout(timeout_id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "timeoutRemoved",
        "timeout_id": timeout_id,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Get active timeouts for a member.
#[wasm_bindgen]
pub fn umbra_wasm_community_get_active_timeouts(community_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let timeouts = svc.get_active_timeouts(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = timeouts.iter().map(|t| timeout_to_json(t)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get all timeouts for a community.
#[wasm_bindgen]
pub fn umbra_wasm_community_get_timeouts(community_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let timeouts = svc.get_community_timeouts(community_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = timeouts.iter().map(|t| timeout_to_json(t)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Check if a member is muted.
#[wasm_bindgen]
pub fn umbra_wasm_community_is_member_muted(community_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let muted = svc.is_member_muted(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"muted": muted}).to_string()))
}

// ============================================================================
// COMMUNITY — GAP FILL: THREAD FOLLOW/UNFOLLOW
// ============================================================================

/// Follow a thread.
#[wasm_bindgen]
pub fn umbra_wasm_community_follow_thread(thread_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.follow_thread(thread_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "threadFollowed",
        "thread_id": thread_id,
        "member_did": member_did,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Unfollow a thread.
#[wasm_bindgen]
pub fn umbra_wasm_community_unfollow_thread(thread_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.unfollow_thread(thread_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "threadUnfollowed",
        "thread_id": thread_id,
        "member_did": member_did,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

/// Get thread followers.
#[wasm_bindgen]
pub fn umbra_wasm_community_get_thread_followers(thread_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let followers = svc.get_thread_followers(thread_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = followers.iter().map(|f| serde_json::json!({
        "thread_id": f.thread_id,
        "member_did": f.member_did,
        "followed_at": f.followed_at,
    })).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Check if following a thread.
#[wasm_bindgen]
pub fn umbra_wasm_community_is_following_thread(thread_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let following = svc.is_following_thread(thread_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&serde_json::json!({"following": following}).to_string()))
}

// ============================================================================
// COMMUNITY — GAP FILL: ADVANCED SEARCH
// ============================================================================

/// Advanced search with filters.
#[wasm_bindgen]
pub fn umbra_wasm_community_search_advanced(json: &str) -> Result<JsValue, JsValue> {
    let v: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let svc = community_service()?;
    let results = svc.search_advanced(
        v["community_id"].as_str().unwrap_or(""),
        v["query"].as_str(),
        v["from_did"].as_str(),
        v["channel_id"].as_str(),
        v["before"].as_i64(),
        v["after"].as_i64(),
        v["has_file"].as_bool(),
        v["has_reaction"].as_bool(),
        v["is_pinned"].as_bool(),
        v["limit"].as_u64().unwrap_or(50) as usize,
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = results.iter().map(|m| message_to_json(m)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

// ============================================================================
// COMMUNITY — GAP FILL: MEMBER STATUS
// ============================================================================

/// Set a custom member status.
#[wasm_bindgen]
pub fn umbra_wasm_community_set_member_status(json: &str) -> Result<JsValue, JsValue> {
    let v: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let svc = community_service()?;
    let record = svc.set_member_status(
        v["community_id"].as_str().unwrap_or(""),
        v["member_did"].as_str().unwrap_or(""),
        v["status_text"].as_str(),
        v["status_emoji"].as_str(),
        v["expires_at"].as_i64(),
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberStatusChanged",
        "community_id": record.community_id,
        "member_did": record.member_did,
    }));

    Ok(JsValue::from_str(&member_status_to_json(&record).to_string()))
}

/// Get a member's custom status.
#[wasm_bindgen]
pub fn umbra_wasm_community_get_member_status(community_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let status = svc.get_member_status(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    match status {
        Some(s) => Ok(JsValue::from_str(&member_status_to_json(&s).to_string())),
        None => Ok(JsValue::from_str("null")),
    }
}

/// Clear a member's custom status.
#[wasm_bindgen]
pub fn umbra_wasm_community_clear_member_status(community_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.clear_member_status(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "memberStatusCleared",
        "community_id": community_id,
        "member_did": member_did,
    }));

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — GAP FILL: NOTIFICATION SETTINGS
// ============================================================================

/// Set notification settings.
#[wasm_bindgen]
pub fn umbra_wasm_community_set_notification_settings(json: &str) -> Result<JsValue, JsValue> {
    let v: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let svc = community_service()?;
    let record = svc.set_notification_settings(
        v["community_id"].as_str().unwrap_or(""),
        v["member_did"].as_str().unwrap_or(""),
        v["target_type"].as_str().unwrap_or("community"),
        v["target_id"].as_str().unwrap_or(""),
        v["mute_until"].as_i64(),
        v["suppress_everyone"].as_bool().unwrap_or(false),
        v["suppress_roles"].as_bool().unwrap_or(false),
        v["level"].as_str().unwrap_or("all"),
    ).map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&notification_setting_to_json(&record).to_string()))
}

/// Get notification settings for a member.
#[wasm_bindgen]
pub fn umbra_wasm_community_get_notification_settings(community_id: &str, member_did: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let settings = svc.get_notification_settings(community_id, member_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = settings.iter().map(|s| notification_setting_to_json(s)).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Delete a notification setting.
#[wasm_bindgen]
pub fn umbra_wasm_community_delete_notification_setting(setting_id: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    svc.delete_notification_setting(setting_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("{\"success\":true}"))
}

// ============================================================================
// COMMUNITY — GAP FILL: MENTION PARSING
// ============================================================================

/// Parse mentions from message content.
#[wasm_bindgen]
pub fn umbra_wasm_community_parse_mentions(content: &str) -> Result<JsValue, JsValue> {
    let mentions = crate::community::parse_mentions(content);
    let arr: Vec<serde_json::Value> = mentions.iter().map(|m| match m {
        crate::community::MentionType::Everyone => serde_json::json!({"type": "everyone"}),
        crate::community::MentionType::Here => serde_json::json!({"type": "here"}),
        crate::community::MentionType::Role(id) => serde_json::json!({"type": "role", "id": id}),
        crate::community::MentionType::User(did) => serde_json::json!({"type": "user", "did": did}),
    }).collect();

    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Send a system message to a channel.
#[wasm_bindgen]
pub fn umbra_wasm_community_send_system_message(channel_id: &str, content: &str) -> Result<JsValue, JsValue> {
    let svc = community_service()?;
    let msg = svc.send_system_message(channel_id, content)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "systemMessage",
        "channel_id": channel_id,
        "message_id": msg.id,
    }));

    Ok(JsValue::from_str(&message_to_json(&msg).to_string()))
}

// ============================================================================
// COMMUNITY — FILE OPERATIONS
// ============================================================================

/// Upload a file record to a community file channel.
///
/// Takes JSON: { channel_id, folder_id?, filename, description?, file_size, mime_type?, storage_chunks_json, uploaded_by }
/// Returns JSON: CommunityFileRecord
#[wasm_bindgen]
pub fn umbra_wasm_community_upload_file(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let folder_id = data["folder_id"].as_str();
    let filename = data["filename"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing filename"))?;
    let description = data["description"].as_str();
    let file_size = data["file_size"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing file_size"))?;
    let mime_type = data["mime_type"].as_str();
    let storage_chunks_json = data["storage_chunks_json"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing storage_chunks_json"))?;
    let uploaded_by = data["uploaded_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing uploaded_by"))?;

    let svc = community_service()?;
    let record = svc.upload_file(channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = community_file_to_json(&record);

    emit_event("community", &serde_json::json!({
        "type": "fileUploaded",
        "channelId": channel_id,
        "fileId": record.id,
    }));

    Ok(JsValue::from_str(&result.to_string()))
}

/// List files in a community channel/folder.
///
/// Takes JSON: { channel_id, folder_id?, limit, offset }
/// Returns JSON: CommunityFileRecord[]
#[wasm_bindgen]
pub fn umbra_wasm_community_get_files(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let folder_id = data["folder_id"].as_str();
    let limit = data["limit"].as_u64().unwrap_or(100) as usize;
    let offset = data["offset"].as_u64().unwrap_or(0) as usize;

    let svc = community_service()?;
    let files = svc.get_files(channel_id, folder_id, limit, offset)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = files.iter().map(community_file_to_json).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a single community file by ID.
///
/// Takes JSON: { id }
/// Returns JSON: CommunityFileRecord
#[wasm_bindgen]
pub fn umbra_wasm_community_get_file(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;

    let svc = community_service()?;
    let file = svc.get_file(id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&community_file_to_json(&file).to_string()))
}

/// Delete a community file.
///
/// Takes JSON: { id, actor_did }
#[wasm_bindgen]
pub fn umbra_wasm_community_delete_file(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;
    let actor_did = data["actor_did"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing actor_did"))?;

    let svc = community_service()?;
    svc.delete_file(id, actor_did)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "fileDeleted",
        "fileId": id,
    }));

    Ok(JsValue::from_str("true"))
}

/// Record a file download (increments download count).
///
/// Takes JSON: { id }
#[wasm_bindgen]
pub fn umbra_wasm_community_record_file_download(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;

    let svc = community_service()?;
    svc.record_file_download(id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("true"))
}

/// Create a folder in a community file channel.
///
/// Takes JSON: { channel_id, parent_folder_id?, name, created_by }
/// Returns JSON: CommunityFileFolderRecord
#[wasm_bindgen]
pub fn umbra_wasm_community_create_folder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let created_by = data["created_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing created_by"))?;

    let svc = community_service()?;
    let folder = svc.create_folder(channel_id, parent_folder_id, name, created_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = community_folder_to_json(&folder);

    emit_event("community", &serde_json::json!({
        "type": "folderCreated",
        "channelId": channel_id,
        "folderId": folder.id,
    }));

    Ok(JsValue::from_str(&result.to_string()))
}

/// List folders in a community channel.
///
/// Takes JSON: { channel_id, parent_folder_id? }
/// Returns JSON: CommunityFileFolderRecord[]
#[wasm_bindgen]
pub fn umbra_wasm_community_get_folders(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let channel_id = data["channel_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing channel_id"))?;
    let parent_folder_id = data["parent_folder_id"].as_str();

    let svc = community_service()?;
    let folders = svc.get_folders(channel_id, parent_folder_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = folders.iter().map(community_folder_to_json).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Delete a community folder.
///
/// Takes JSON: { id }
#[wasm_bindgen]
pub fn umbra_wasm_community_delete_folder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;

    let svc = community_service()?;
    svc.delete_folder(id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    emit_event("community", &serde_json::json!({
        "type": "folderDeleted",
        "folderId": id,
    }));

    Ok(JsValue::from_str("true"))
}

// ============================================================================
// DM FILE OPERATIONS
// ============================================================================

fn dm_file_service() -> Result<crate::messaging::files::DmFileService, JsValue> {
    let state = get_state()?;
    let state = state.read();
    let database = state.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;
    Ok(crate::messaging::files::DmFileService::new(database.clone()))
}

/// Upload a DM shared file.
///
/// Takes JSON: { conversation_id, folder_id?, filename, description?, file_size, mime_type?, storage_chunks_json, uploaded_by, encrypted_metadata?, encryption_nonce? }
/// Returns JSON: DmSharedFileRecord
#[wasm_bindgen]
pub fn umbra_wasm_dm_upload_file(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;
    let folder_id = data["folder_id"].as_str();
    let filename = data["filename"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing filename"))?;
    let description = data["description"].as_str();
    let file_size = data["file_size"].as_i64()
        .ok_or_else(|| JsValue::from_str("Missing file_size"))?;
    let mime_type = data["mime_type"].as_str();
    let storage_chunks_json = data["storage_chunks_json"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing storage_chunks_json"))?;
    let uploaded_by = data["uploaded_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing uploaded_by"))?;
    let encrypted_metadata = data["encrypted_metadata"].as_str();
    let encryption_nonce = data["encryption_nonce"].as_str();

    let svc = dm_file_service()?;
    let record = svc.upload_file(conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, encrypted_metadata, encryption_nonce)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = dm_file_to_json(&record);
    Ok(JsValue::from_str(&result.to_string()))
}

/// List DM shared files.
///
/// Takes JSON: { conversation_id, folder_id?, limit, offset }
/// Returns JSON: DmSharedFileRecord[]
#[wasm_bindgen]
pub fn umbra_wasm_dm_get_files(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;
    let folder_id = data["folder_id"].as_str();
    let limit = data["limit"].as_u64().unwrap_or(100) as usize;
    let offset = data["offset"].as_u64().unwrap_or(0) as usize;

    let svc = dm_file_service()?;
    let files = svc.get_files(conversation_id, folder_id, limit, offset)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = files.iter().map(dm_file_to_json).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Get a single DM shared file by ID.
///
/// Takes JSON: { id }
/// Returns JSON: DmSharedFileRecord
#[wasm_bindgen]
pub fn umbra_wasm_dm_get_file(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;

    let svc = dm_file_service()?;
    let file = svc.get_file(id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str(&dm_file_to_json(&file).to_string()))
}

/// Delete a DM shared file.
///
/// Takes JSON: { id }
#[wasm_bindgen]
pub fn umbra_wasm_dm_delete_file(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;

    let svc = dm_file_service()?;
    svc.delete_file(id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("true"))
}

/// Record a DM file download.
///
/// Takes JSON: { id }
#[wasm_bindgen]
pub fn umbra_wasm_dm_record_file_download(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;

    let svc = dm_file_service()?;
    svc.record_download(id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("true"))
}

/// Move a DM file to a different folder.
///
/// Takes JSON: { id, target_folder_id? }
#[wasm_bindgen]
pub fn umbra_wasm_dm_move_file(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;
    let target_folder_id = data["target_folder_id"].as_str();

    let svc = dm_file_service()?;
    svc.move_file(id, target_folder_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("true"))
}

/// Create a DM shared folder.
///
/// Takes JSON: { conversation_id, parent_folder_id?, name, created_by }
/// Returns JSON: DmSharedFolderRecord
#[wasm_bindgen]
pub fn umbra_wasm_dm_create_folder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;
    let created_by = data["created_by"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing created_by"))?;

    let svc = dm_file_service()?;
    let folder = svc.create_folder(conversation_id, parent_folder_id, name, created_by)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let result = dm_folder_to_json(&folder);
    Ok(JsValue::from_str(&result.to_string()))
}

/// List DM shared folders.
///
/// Takes JSON: { conversation_id, parent_folder_id? }
/// Returns JSON: DmSharedFolderRecord[]
#[wasm_bindgen]
pub fn umbra_wasm_dm_get_folders(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let conversation_id = data["conversation_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing conversation_id"))?;
    let parent_folder_id = data["parent_folder_id"].as_str();

    let svc = dm_file_service()?;
    let folders = svc.get_folders(conversation_id, parent_folder_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let arr: Vec<serde_json::Value> = folders.iter().map(dm_folder_to_json).collect();
    Ok(JsValue::from_str(&serde_json::to_string(&arr).unwrap_or_default()))
}

/// Delete a DM shared folder.
///
/// Takes JSON: { id }
#[wasm_bindgen]
pub fn umbra_wasm_dm_delete_folder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;

    let svc = dm_file_service()?;
    svc.delete_folder(id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("true"))
}

/// Rename a DM shared folder.
///
/// Takes JSON: { id, name }
#[wasm_bindgen]
pub fn umbra_wasm_dm_rename_folder(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let id = data["id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing id"))?;
    let name = data["name"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing name"))?;

    let svc = dm_file_service()?;
    svc.rename_folder(id, name)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(JsValue::from_str("true"))
}

// ============================================================================
// FILE CHUNKING OPERATIONS
// ============================================================================

/// Chunk a file and store chunks locally.
///
/// Takes JSON: { file_id, filename, data_b64, chunk_size? }
/// Returns JSON: ChunkManifest
#[wasm_bindgen]
pub fn umbra_wasm_chunk_file(json: &str) -> Result<JsValue, JsValue> {
    use base64::Engine as _;
    use crate::storage::chunking;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let file_id = data["file_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing file_id"))?;
    let filename = data["filename"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing filename"))?;
    let data_b64 = data["data_b64"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing data_b64"))?;
    let chunk_size = data["chunk_size"].as_u64()
        .map(|v| v as usize)
        .unwrap_or(chunking::DEFAULT_CHUNK_SIZE);

    let file_bytes = base64::engine::general_purpose::STANDARD.decode(data_b64)
        .map_err(|e| JsValue::from_str(&format!("Invalid base64: {}", e)))?;

    let (manifest, chunks) = chunking::chunk_file(file_id, filename, &file_bytes, chunk_size)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Store chunks in database
    let state = get_state()?;
    let state_read = state.read();
    let database = state_read.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let now = crate::time::now_timestamp();
    for chunk in &chunks {
        database.store_chunk(&chunk.chunk_id, &chunk.file_id, chunk.chunk_index as i32, &chunk.data, chunk.data.len() as i64, now)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
    }

    // Store manifest
    let chunks_json = serde_json::to_string(&manifest.chunks)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize chunks: {}", e)))?;
    database.store_manifest(file_id, filename, manifest.total_size as i64, manifest.chunk_size as i64, manifest.total_chunks as i32, &chunks_json, &manifest.file_hash, false, None, now)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Return manifest as JSON
    let result = serde_json::to_string(&manifest)
        .map_err(|e| JsValue::from_str(&format!("Failed to serialize manifest: {}", e)))?;

    Ok(JsValue::from_str(&result))
}

/// Reassemble a file from stored chunks.
///
/// Takes JSON: { file_id } (manifest must be stored)
/// Returns JSON: { data_b64: string }
#[wasm_bindgen]
pub fn umbra_wasm_reassemble_file(json: &str) -> Result<JsValue, JsValue> {
    use base64::Engine as _;
    use crate::storage::chunking;

    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let file_id = data["file_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing file_id"))?;

    let state = get_state()?;
    let state_read = state.read();
    let database = state_read.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    // Get manifest
    let manifest_record = database.get_manifest(file_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?
        .ok_or_else(|| JsValue::from_str("Manifest not found"))?;

    // Rebuild ChunkManifest from record
    let chunk_refs: Vec<chunking::ChunkRef> = serde_json::from_str(&manifest_record.chunks_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid chunks JSON: {}", e)))?;

    let manifest = chunking::ChunkManifest {
        file_id: manifest_record.file_id.clone(),
        filename: manifest_record.filename.clone(),
        total_size: manifest_record.total_size as u64,
        chunk_size: manifest_record.chunk_size as usize,
        total_chunks: manifest_record.total_chunks as u32,
        chunks: chunk_refs,
        file_hash: manifest_record.file_hash.clone(),
    };

    // Get all chunks
    let chunk_records = database.get_chunks_for_file(file_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let file_chunks: Vec<chunking::FileChunk> = chunk_records.iter().map(|r| {
        chunking::FileChunk {
            chunk_id: r.chunk_id.clone(),
            chunk_index: r.chunk_index as u32,
            total_chunks: manifest.total_chunks,
            data: r.data.clone(),
            file_id: r.file_id.clone(),
        }
    }).collect();

    // Reassemble
    let file_bytes = chunking::reassemble_file(&manifest, &file_chunks)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let data_b64 = base64::engine::general_purpose::STANDARD.encode(&file_bytes);
    let result = serde_json::json!({
        "data_b64": data_b64,
        "filename": manifest.filename,
        "file_hash": manifest.file_hash,
        "total_size": manifest.total_size,
    });

    Ok(JsValue::from_str(&result.to_string()))
}

/// Get a stored file manifest.
///
/// Takes JSON: { file_id }
/// Returns JSON: FileManifestRecord or null
#[wasm_bindgen]
pub fn umbra_wasm_get_file_manifest(json: &str) -> Result<JsValue, JsValue> {
    let data: serde_json::Value = serde_json::from_str(json)
        .map_err(|e| JsValue::from_str(&format!("Invalid JSON: {}", e)))?;

    let file_id = data["file_id"].as_str()
        .ok_or_else(|| JsValue::from_str("Missing file_id"))?;

    let state = get_state()?;
    let state_read = state.read();
    let database = state_read.database.as_ref()
        .ok_or_else(|| JsValue::from_str("Database not initialized"))?;

    let manifest = database.get_manifest(file_id)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    match manifest {
        Some(m) => {
            let result = serde_json::json!({
                "file_id": m.file_id,
                "filename": m.filename,
                "total_size": m.total_size,
                "chunk_size": m.chunk_size,
                "total_chunks": m.total_chunks,
                "chunks_json": m.chunks_json,
                "file_hash": m.file_hash,
                "encrypted": m.encrypted,
                "encryption_key_id": m.encryption_key_id,
                "created_at": m.created_at,
            });
            Ok(JsValue::from_str(&result.to_string()))
        }
        None => Ok(JsValue::from_str("null")),
    }
}

// ============================================================================
// COMMUNITY — JSON HELPERS (Phase 2-11)
// ============================================================================

/// Convert a CommunityTimeoutRecord to JSON.
fn timeout_to_json(t: &crate::storage::CommunityTimeoutRecord) -> serde_json::Value {
    serde_json::json!({
        "id": t.id,
        "community_id": t.community_id,
        "member_did": t.member_did,
        "reason": t.reason,
        "timeout_type": t.timeout_type,
        "issued_by": t.issued_by,
        "expires_at": t.expires_at,
        "created_at": t.created_at,
    })
}

/// Convert a CommunityMemberStatusRecord to JSON.
fn member_status_to_json(s: &crate::storage::CommunityMemberStatusRecord) -> serde_json::Value {
    serde_json::json!({
        "community_id": s.community_id,
        "member_did": s.member_did,
        "status_text": s.status_text,
        "status_emoji": s.status_emoji,
        "expires_at": s.expires_at,
        "updated_at": s.updated_at,
    })
}

/// Convert a CommunityNotificationSettingRecord to JSON.
fn notification_setting_to_json(s: &crate::storage::CommunityNotificationSettingRecord) -> serde_json::Value {
    serde_json::json!({
        "id": s.id,
        "community_id": s.community_id,
        "member_did": s.member_did,
        "target_type": s.target_type,
        "target_id": s.target_id,
        "mute_until": s.mute_until,
        "suppress_everyone": s.suppress_everyone,
        "suppress_roles": s.suppress_roles,
        "level": s.level,
        "updated_at": s.updated_at,
    })
}

/// Convert a CommunityMessageRecord to JSON.
///
/// The TS `CommunityMessage` type expects `content` (mapped from snake_case `content`).
fn message_to_json(m: &crate::storage::CommunityMessageRecord) -> serde_json::Value {
    let content_encrypted_b64 = m.content_encrypted.as_ref().map(|bytes| {
        base64::engine::general_purpose::STANDARD.encode(bytes)
    });
    serde_json::json!({
        "id": m.id,
        "channel_id": m.channel_id,
        "sender_did": m.sender_did,
        "content_encrypted_b64": content_encrypted_b64,
        "content": m.content_plaintext,
        "nonce": m.nonce,
        "key_version": m.key_version,
        "is_e2ee": m.is_e2ee,
        "reply_to_id": m.reply_to_id,
        "thread_id": m.thread_id,
        "has_embed": m.has_embed,
        "has_attachment": m.has_attachment,
        "content_warning": m.content_warning,
        "edited": m.edited_at.is_some(),
        "edited_at": m.edited_at,
        "pinned": false,
        "deleted_for_everyone": m.deleted_for_everyone,
        "created_at": m.created_at,
        "thread_reply_count": 0,
    })
}

/// Convert a CommunityThreadRecord to JSON.
fn thread_to_json(t: &crate::storage::CommunityThreadRecord) -> serde_json::Value {
    serde_json::json!({
        "id": t.id,
        "channel_id": t.channel_id,
        "parent_message_id": t.parent_message_id,
        "name": t.name,
        "created_by": t.created_by,
        "message_count": t.message_count,
        "last_message_at": t.last_message_at,
        "created_at": t.created_at,
    })
}

/// Convert a CommunityWarningRecord to JSON.
fn warning_to_json(w: &crate::storage::CommunityWarningRecord) -> serde_json::Value {
    serde_json::json!({
        "id": w.id,
        "community_id": w.community_id,
        "member_did": w.member_did,
        "reason": w.reason,
        "warned_by": w.warned_by,
        "expires_at": w.expires_at,
        "created_at": w.created_at,
    })
}

/// Convert a CommunityFileRecord to JSON.
fn file_to_json(f: &crate::storage::CommunityFileRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id,
        "channel_id": f.channel_id,
        "folder_id": f.folder_id,
        "filename": f.filename,
        "description": f.description,
        "file_size": f.file_size,
        "mime_type": f.mime_type,
        "storage_chunks_json": f.storage_chunks_json,
        "uploaded_by": f.uploaded_by,
        "version": f.version,
        "previous_version_id": f.previous_version_id,
        "download_count": f.download_count,
        "created_at": f.created_at,
    })
}

/// Convert a CommunityFileRecord to JSON (aliased for new file WASM exports).
fn community_file_to_json(f: &crate::storage::CommunityFileRecord) -> serde_json::Value {
    file_to_json(f)
}

/// Convert a CommunityFileFolderRecord to JSON.
fn community_folder_to_json(f: &crate::storage::CommunityFileFolderRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id,
        "channel_id": f.channel_id,
        "parent_folder_id": f.parent_folder_id,
        "name": f.name,
        "created_by": f.created_by,
        "created_at": f.created_at,
    })
}

/// Convert a DmSharedFileRecord to JSON.
fn dm_file_to_json(f: &crate::storage::DmSharedFileRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id,
        "conversation_id": f.conversation_id,
        "folder_id": f.folder_id,
        "filename": f.filename,
        "description": f.description,
        "file_size": f.file_size,
        "mime_type": f.mime_type,
        "storage_chunks_json": f.storage_chunks_json,
        "uploaded_by": f.uploaded_by,
        "version": f.version,
        "download_count": f.download_count,
        "encrypted_metadata": f.encrypted_metadata,
        "encryption_nonce": f.encryption_nonce,
        "created_at": f.created_at,
    })
}

/// Convert a DmSharedFolderRecord to JSON.
fn dm_folder_to_json(f: &crate::storage::DmSharedFolderRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id,
        "conversation_id": f.conversation_id,
        "parent_folder_id": f.parent_folder_id,
        "name": f.name,
        "created_by": f.created_by,
        "created_at": f.created_at,
    })
}

/// Convert a CommunityWebhookRecord to JSON.
fn webhook_to_json(w: &crate::storage::CommunityWebhookRecord) -> serde_json::Value {
    serde_json::json!({
        "id": w.id,
        "channel_id": w.channel_id,
        "name": w.name,
        "avatar_url": w.avatar_url,
        "token": w.token,
        "creator_did": w.creator_did,
        "created_at": w.created_at,
    })
}

/// Convert a BoostNodeRecord to JSON.
fn boost_node_to_json(n: &crate::storage::BoostNodeRecord) -> serde_json::Value {
    serde_json::json!({
        "id": n.id,
        "owner_did": n.owner_did,
        "node_type": n.node_type,
        "node_public_key": n.node_public_key,
        "name": n.name,
        "enabled": n.enabled,
        "max_storage_bytes": n.max_storage_bytes,
        "max_bandwidth_mbps": n.max_bandwidth_mbps,
        "auto_start": n.auto_start,
        "prioritized_communities": n.prioritized_communities,
        "pairing_token": n.pairing_token,
        "remote_address": n.remote_address,
        "last_seen_at": n.last_seen_at,
        "created_at": n.created_at,
        "updated_at": n.updated_at,
    })
}
