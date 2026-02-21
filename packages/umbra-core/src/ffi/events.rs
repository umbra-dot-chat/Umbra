//! # FFI Event System
//!
//! Pushes real-time events from Rust to Swift/Kotlin via a registered C callback.
//! Events: new messages, friend requests, typing indicators, network status, etc.

use std::ffi::CString;
use std::os::raw::c_char;
use std::sync::OnceLock;

use super::state::EventCallback;

// ============================================================================
// GLOBAL CALLBACK
// ============================================================================

static EVENT_CB: OnceLock<EventCallback> = OnceLock::new();

/// Register the event callback from the native side (Swift/Kotlin).
/// Should be called once during app initialization.
#[no_mangle]
pub unsafe extern "C" fn umbra_register_event_callback(
    cb: extern "C" fn(event_type: *const c_char, data: *const c_char),
) {
    let _ = EVENT_CB.set(cb);
}

// ============================================================================
// EVENT EMISSION
// ============================================================================

/// Emit an event to the native layer.
/// `event_type` — e.g. "message_received", "friend_request", "typing_indicator"
/// `data` — JSON string with event payload
pub(crate) fn emit_event(event_type: &str, data: &str) {
    if let Some(cb) = EVENT_CB.get() {
        if let (Ok(etype), Ok(edata)) = (CString::new(event_type), CString::new(data)) {
            cb(etype.as_ptr(), edata.as_ptr());
        }
    }
}

/// Check if an event callback has been registered.
pub(crate) fn has_event_callback() -> bool {
    EVENT_CB.get().is_some()
}
