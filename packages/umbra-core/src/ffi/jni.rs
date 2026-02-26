//! # JNI Bindings (Placeholder)
//!
//! Android uses the C FFI dispatcher pattern (`c_api.rs` → `dispatcher.rs`)
//! rather than direct JNI bindings. This module is retained as a placeholder
//! for any future direct-JNI needs but contains no active bindings.

#![cfg(all(feature = "ffi", target_os = "android"))]
