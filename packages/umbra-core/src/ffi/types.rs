//! # FFI Types
//!
//! C-compatible types for cross-platform FFI.

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

/// FFI-safe result type
///
/// Used to return results across the FFI boundary.
#[repr(C)]
pub struct FfiResult {
    /// Success flag (1 = success, 0 = error)
    pub success: i32,
    /// Error code (0 if success)
    pub error_code: i32,
    /// Error message (null if success)
    pub error_message: *mut c_char,
    /// Result data (null if error)
    pub data: *mut c_char,
}

impl FfiResult {
    /// Create a successful result with data
    pub fn ok(data: String) -> Self {
        Self {
            success: 1,
            error_code: 0,
            error_message: std::ptr::null_mut(),
            data: CString::new(data).unwrap().into_raw(),
        }
    }

    /// Create a successful result without data
    pub fn ok_empty() -> Self {
        Self {
            success: 1,
            error_code: 0,
            error_message: std::ptr::null_mut(),
            data: std::ptr::null_mut(),
        }
    }

    /// Create an error result
    pub fn err(code: i32, message: String) -> Self {
        Self {
            success: 0,
            error_code: code,
            error_message: CString::new(message).unwrap().into_raw(),
            data: std::ptr::null_mut(),
        }
    }

    /// Create from a Rust Result
    pub fn from_result<T: ToString>(result: crate::Result<T>) -> Self {
        match result {
            Ok(value) => Self::ok(value.to_string()),
            Err(e) => Self::err(e.code(), e.to_string()),
        }
    }
}

/// FFI-safe string that must be freed
#[repr(C)]
pub struct FfiString {
    /// Pointer to the string data
    pub ptr: *mut c_char,
    /// Length of the string (not including null terminator)
    pub len: usize,
}

impl FfiString {
    /// Create from a Rust string
    pub fn new(s: String) -> Self {
        let len = s.len();
        let ptr = CString::new(s).unwrap().into_raw();
        Self { ptr, len }
    }

    /// Create a null/empty string
    pub fn null() -> Self {
        Self {
            ptr: std::ptr::null_mut(),
            len: 0,
        }
    }
}

/// FFI-safe byte array
#[repr(C)]
pub struct FfiBytes {
    /// Pointer to the data
    pub ptr: *mut u8,
    /// Length of the data
    pub len: usize,
}

impl FfiBytes {
    /// Create from a Rust Vec<u8>
    pub fn new(data: Vec<u8>) -> Self {
        let len = data.len();
        let mut boxed = data.into_boxed_slice();
        let ptr = boxed.as_mut_ptr();
        std::mem::forget(boxed);
        Self { ptr, len }
    }

    /// Create a null/empty bytes
    pub fn null() -> Self {
        Self {
            ptr: std::ptr::null_mut(),
            len: 0,
        }
    }
}

/// FFI-safe identity info
#[repr(C)]
pub struct FfiIdentityInfo {
    /// DID string
    pub did: *mut c_char,
    /// Display name
    pub display_name: *mut c_char,
    /// Status message (can be null)
    pub status: *mut c_char,
    /// Avatar (can be null)
    pub avatar: *mut c_char,
    /// Recovery phrase (only available after creation)
    pub recovery_phrase: *mut c_char,
}

impl FfiIdentityInfo {
    /// Create from Identity
    pub fn from_identity(identity: &crate::Identity, recovery_phrase: Option<String>) -> Self {
        let profile = identity.profile();
        Self {
            did: CString::new(identity.did_string()).unwrap().into_raw(),
            display_name: CString::new(profile.display_name.clone()).unwrap().into_raw(),
            status: profile.status.as_ref()
                .map(|s: &String| CString::new(s.clone()).unwrap().into_raw())
                .unwrap_or(std::ptr::null_mut()),
            avatar: profile.avatar.as_ref()
                .map(|s: &String| CString::new(s.clone()).unwrap().into_raw())
                .unwrap_or(std::ptr::null_mut()),
            recovery_phrase: recovery_phrase
                .map(|s| CString::new(s).unwrap().into_raw())
                .unwrap_or(std::ptr::null_mut()),
        }
    }
}

/// FFI-safe friend info
#[repr(C)]
pub struct FfiFriendInfo {
    /// Friend's DID
    pub did: *mut c_char,
    /// Display name
    pub display_name: *mut c_char,
    /// Nickname (can be null)
    pub nickname: *mut c_char,
    /// Is currently online
    pub is_online: i32,
    /// Friend added timestamp (Unix seconds)
    pub added_at: i64,
}

/// FFI-safe friend list
#[repr(C)]
pub struct FfiFriendList {
    /// Array of friends
    pub friends: *mut FfiFriendInfo,
    /// Number of friends
    pub count: usize,
}

/// FFI-safe message
#[repr(C)]
pub struct FfiMessage {
    /// Message ID (UUID)
    pub id: *mut c_char,
    /// Conversation ID
    pub conversation_id: *mut c_char,
    /// Sender DID
    pub sender_did: *mut c_char,
    /// Message content (JSON-encoded)
    pub content: *mut c_char,
    /// Timestamp (Unix milliseconds)
    pub timestamp: i64,
    /// Message status (0=pending, 1=sent, 2=delivered, 3=read)
    pub status: i32,
}

/// FFI-safe message list
#[repr(C)]
pub struct FfiMessageList {
    /// Array of messages
    pub messages: *mut FfiMessage,
    /// Number of messages
    pub count: usize,
}

/// FFI-safe conversation
#[repr(C)]
pub struct FfiConversation {
    /// Conversation ID
    pub id: *mut c_char,
    /// Participant DIDs (JSON array)
    pub participants: *mut c_char,
    /// Last message preview
    pub last_message: *mut c_char,
    /// Last message timestamp
    pub last_message_at: i64,
    /// Unread message count
    pub unread_count: i32,
}

/// FFI-safe conversation list
#[repr(C)]
pub struct FfiConversationList {
    /// Array of conversations
    pub conversations: *mut FfiConversation,
    /// Number of conversations
    pub count: usize,
}

/// FFI-safe connection info for QR code/link sharing
#[repr(C)]
pub struct FfiConnectionInfo {
    /// The connection info as a shareable link
    pub link: *mut c_char,
    /// The connection info as JSON
    pub json: *mut c_char,
    /// The connection info as base64 (for QR codes)
    pub base64: *mut c_char,
}

/// Network status
#[repr(C)]
pub struct FfiNetworkStatus {
    /// Is connected to the network
    pub is_connected: i32,
    /// Number of connected peers
    pub peer_count: i32,
    /// Our peer ID
    pub peer_id: *mut c_char,
    /// Our listen addresses (JSON array)
    pub listen_addresses: *mut c_char,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Convert a C string to a Rust String
///
/// # Safety
/// The caller must ensure the pointer is valid and null-terminated.
pub unsafe fn cstr_to_string(ptr: *const c_char) -> Option<String> {
    if ptr.is_null() {
        return None;
    }
    CStr::from_ptr(ptr).to_str().ok().map(String::from)
}

/// Free a C string allocated by Rust
///
/// # Safety
/// The pointer must have been allocated by Rust using CString::into_raw().
#[no_mangle]
pub unsafe extern "C" fn umbra_free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        drop(CString::from_raw(ptr));
    }
}

/// Free an FfiResult
///
/// # Safety
/// The FfiResult must have been created by Rust FFI functions.
#[no_mangle]
pub unsafe extern "C" fn umbra_free_result(result: FfiResult) {
    if !result.error_message.is_null() {
        drop(CString::from_raw(result.error_message));
    }
    if !result.data.is_null() {
        drop(CString::from_raw(result.data));
    }
}

/// Free FfiBytes
///
/// # Safety
/// The FfiBytes must have been created by Rust FFI functions.
#[no_mangle]
pub unsafe extern "C" fn umbra_free_bytes(bytes: FfiBytes) {
    if !bytes.ptr.is_null() {
        let _ = Vec::from_raw_parts(bytes.ptr, bytes.len, bytes.len);
    }
}
