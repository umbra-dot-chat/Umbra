//! # JNI Bindings
//!
//! Java Native Interface bindings for Android platform.
//!
//! ## Kotlin Usage
//!
//! ```kotlin
//! class UmbraCore {
//!     companion object {
//!         init {
//!             System.loadLibrary("umbra_core")
//!         }
//!     }
//!
//!     external fun init(storagePath: String): String?
//!     external fun createIdentity(displayName: String): String
//!     external fun getIdentityDid(): String?
//!     // ... etc
//! }
//! ```

#![cfg(all(feature = "ffi", target_os = "android"))]

use jni::JNIEnv;
use jni::objects::{JClass, JString, JObject};
use jni::sys::{jstring, jboolean, jint, jlong};
use std::sync::Arc;
use parking_lot::RwLock;
use once_cell::sync::OnceCell;

use crate::identity::Identity;
use crate::network::{NetworkService, NetworkConfig};
use crate::discovery::{DiscoveryService, DiscoveryConfig, ConnectionInfo};
use crate::friends::FriendService;
use crate::messaging::MessagingService;
use crate::storage::Database;

// ============================================================================
// STATE
// ============================================================================

static STATE: OnceCell<Arc<RwLock<JniState>>> = OnceCell::new();
static RUNTIME: OnceCell<tokio::runtime::Runtime> = OnceCell::new();

struct JniState {
    identity: Option<Identity>,
    network: Option<Arc<NetworkService>>,
    database: Option<Database>,
    storage_path: String,
}

impl JniState {
    fn new(storage_path: String) -> Self {
        Self {
            identity: None,
            network: None,
            database: None,
            storage_path,
        }
    }
}

fn get_runtime() -> &'static tokio::runtime::Runtime {
    RUNTIME.get_or_init(|| {
        tokio::runtime::Runtime::new().expect("Failed to create runtime")
    })
}

fn get_state() -> Option<Arc<RwLock<JniState>>> {
    STATE.get().cloned()
}

// Helper to convert JString to Rust String
fn jstring_to_string(env: &mut JNIEnv, s: &JString) -> Option<String> {
    env.get_string(s).ok().map(|s| s.into())
}

// Helper to create a Java string from Rust
fn string_to_jstring(env: &mut JNIEnv, s: &str) -> jstring {
    env.new_string(s)
        .map(|js| js.into_raw())
        .unwrap_or(std::ptr::null_mut())
}

// Helper to throw an exception
fn throw_exception(env: &mut JNIEnv, message: &str) {
    let _ = env.throw_new("java/lang/RuntimeException", message);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/// Initialize Umbra Core
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeInit(
    mut env: JNIEnv,
    _class: JClass,
    storage_path: JString,
) -> jstring {
    let path = match jstring_to_string(&mut env, &storage_path) {
        Some(p) => p,
        None => {
            throw_exception(&mut env, "Invalid storage path");
            return std::ptr::null_mut();
        }
    };

    // Initialize runtime
    let _ = get_runtime();

    // Initialize state
    if STATE.set(Arc::new(RwLock::new(JniState::new(path)))).is_err() {
        throw_exception(&mut env, "Already initialized");
        return std::ptr::null_mut();
    }

    string_to_jstring(&mut env, "OK")
}

/// Shutdown Umbra Core
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeShutdown(
    mut env: JNIEnv,
    _class: JClass,
) {
    let rt = get_runtime();

    rt.block_on(async {
        if let Some(state) = get_state() {
            let mut state = state.write();
            if let Some(ref network) = state.network {
                let _ = network.stop().await;
            }
            state.identity = None;
            state.network = None;
        }
    });
}

/// Get version
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetVersion(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    string_to_jstring(&mut env, crate::version())
}

// ============================================================================
// IDENTITY
// ============================================================================

/// Create a new identity
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeCreateIdentity(
    mut env: JNIEnv,
    _class: JClass,
    display_name: JString,
) -> jstring {
    let name = match jstring_to_string(&mut env, &display_name) {
        Some(n) => n,
        None => {
            throw_exception(&mut env, "Invalid display name");
            return std::ptr::null_mut();
        }
    };

    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    match Identity::create(name) {
        Ok((identity, recovery_phrase)) => {
            let did = identity.did_string();
            state.write().identity = Some(identity);

            let json = serde_json::json!({
                "did": did,
                "recovery_phrase": recovery_phrase
            });
            string_to_jstring(&mut env, &json.to_string())
        }
        Err(e) => {
            throw_exception(&mut env, &e.to_string());
            std::ptr::null_mut()
        }
    }
}

/// Restore identity from recovery phrase
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeRestoreIdentity(
    mut env: JNIEnv,
    _class: JClass,
    recovery_phrase: JString,
    display_name: JString,
) -> jstring {
    let phrase = match jstring_to_string(&mut env, &recovery_phrase) {
        Some(p) => p,
        None => {
            throw_exception(&mut env, "Invalid recovery phrase");
            return std::ptr::null_mut();
        }
    };

    let name = match jstring_to_string(&mut env, &display_name) {
        Some(n) => n,
        None => {
            throw_exception(&mut env, "Invalid display name");
            return std::ptr::null_mut();
        }
    };

    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    match Identity::restore(&phrase, name) {
        Ok(identity) => {
            let did = identity.did_string();
            state.write().identity = Some(identity);
            string_to_jstring(&mut env, &did)
        }
        Err(e) => {
            throw_exception(&mut env, &e.to_string());
            std::ptr::null_mut()
        }
    }
}

/// Get current identity DID
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetIdentityDid(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    let state = state.read();
    match &state.identity {
        Some(identity) => string_to_jstring(&mut env, &identity.did_string()),
        None => std::ptr::null_mut(),
    }
}

/// Get identity profile as JSON
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetIdentityProfile(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
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
            string_to_jstring(&mut env, &json.to_string())
        }
        None => std::ptr::null_mut(),
    }
}

/// Update identity profile
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeUpdateIdentityProfile(
    mut env: JNIEnv,
    _class: JClass,
    json: JString,
) -> jboolean {
    let json_str = match jstring_to_string(&mut env, &json) {
        Some(j) => j,
        None => {
            throw_exception(&mut env, "Invalid JSON");
            return 0;
        }
    };

    let updates: serde_json::Value = match serde_json::from_str(&json_str) {
        Ok(v) => v,
        Err(e) => {
            throw_exception(&mut env, &format!("Invalid JSON: {}", e));
            return 0;
        }
    };

    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return 0;
        }
    };

    let mut state = state.write();
    let identity = match state.identity.as_mut() {
        Some(i) => i,
        None => {
            throw_exception(&mut env, "No identity loaded");
            return 0;
        }
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
        Ok(_) => 1,
        Err(e) => {
            throw_exception(&mut env, &e.to_string());
            0
        }
    }
}

// ============================================================================
// DISCOVERY
// ============================================================================

/// Get connection info for sharing
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetConnectionInfo(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    let state = state.read();

    let identity = match &state.identity {
        Some(i) => i,
        None => {
            throw_exception(&mut env, "No identity loaded");
            return std::ptr::null_mut();
        }
    };

    let network = match &state.network {
        Some(n) => n,
        None => {
            throw_exception(&mut env, "Network not started");
            return std::ptr::null_mut();
        }
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

    string_to_jstring(&mut env, &json.to_string())
}

/// Parse connection info
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeParseConnectionInfo(
    mut env: JNIEnv,
    _class: JClass,
    info: JString,
) -> jstring {
    let info_str = match jstring_to_string(&mut env, &info) {
        Some(i) => i,
        None => {
            throw_exception(&mut env, "Invalid connection info");
            return std::ptr::null_mut();
        }
    };

    let connection_info = if info_str.starts_with("umbra://") {
        ConnectionInfo::from_link(&info_str)
    } else if info_str.starts_with("{") {
        ConnectionInfo::from_json(&info_str)
    } else {
        ConnectionInfo::from_base64(&info_str)
    };

    match connection_info {
        Ok(info) => {
            let json = serde_json::json!({
                "did": info.did,
                "peer_id": info.peer_id,
                "addresses": info.addresses,
                "display_name": info.display_name,
            });
            string_to_jstring(&mut env, &json.to_string())
        }
        Err(e) => {
            throw_exception(&mut env, &format!("Invalid connection info: {}", e));
            std::ptr::null_mut()
        }
    }
}

// ============================================================================
// FRIENDS
// ============================================================================

/// Get friends list as JSON
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetFriends(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    let state = state.read();
    let database = match &state.database {
        Some(d) => d,
        None => {
            throw_exception(&mut env, "Database not initialized");
            return std::ptr::null_mut();
        }
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

            string_to_jstring(&mut env, &serde_json::to_string(&friends_json).unwrap_or_default())
        }
        Err(e) => {
            throw_exception(&mut env, &e.to_string());
            std::ptr::null_mut()
        }
    }
}

/// Get pending friend requests as JSON
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetPendingFriendRequests(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    let state = state.read();
    let database = match &state.database {
        Some(d) => d,
        None => {
            throw_exception(&mut env, "Database not initialized");
            return std::ptr::null_mut();
        }
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

            string_to_jstring(&mut env, &serde_json::to_string(&requests_json).unwrap_or_default())
        }
        Err(e) => {
            throw_exception(&mut env, &e.to_string());
            std::ptr::null_mut()
        }
    }
}

// ============================================================================
// MESSAGING
// ============================================================================

/// Get conversations as JSON
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetConversations(
    mut env: JNIEnv,
    _class: JClass,
) -> jstring {
    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    let state = state.read();
    let database = match &state.database {
        Some(d) => d,
        None => {
            throw_exception(&mut env, "Database not initialized");
            return std::ptr::null_mut();
        }
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

            string_to_jstring(&mut env, &serde_json::to_string(&conv_json).unwrap_or_default())
        }
        Err(e) => {
            throw_exception(&mut env, &e.to_string());
            std::ptr::null_mut()
        }
    }
}

/// Get messages for a conversation as JSON
#[no_mangle]
pub extern "system" fn Java_com_umbra_core_UmbraCore_nativeGetMessages(
    mut env: JNIEnv,
    _class: JClass,
    conversation_id: JString,
    limit: jint,
    before_id: JString,
) -> jstring {
    let conv_id = match jstring_to_string(&mut env, &conversation_id) {
        Some(c) => c,
        None => {
            throw_exception(&mut env, "Invalid conversation ID");
            return std::ptr::null_mut();
        }
    };

    let before = jstring_to_string(&mut env, &before_id);

    let state = match get_state() {
        Some(s) => s,
        None => {
            throw_exception(&mut env, "Not initialized");
            return std::ptr::null_mut();
        }
    };

    let state = state.read();
    let database = match &state.database {
        Some(d) => d,
        None => {
            throw_exception(&mut env, "Database not initialized");
            return std::ptr::null_mut();
        }
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
                    "content": m.content_encrypted,
                    "timestamp": m.timestamp,
                    "status": m.status,
                })
            }).collect();

            string_to_jstring(&mut env, &serde_json::to_string(&messages_json).unwrap_or_default())
        }
        Err(e) => {
            throw_exception(&mut env, &e.to_string());
            std::ptr::null_mut()
        }
    }
}
