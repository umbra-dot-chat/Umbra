//! # FFI Bindings
//!
//! Foreign Function Interface bindings for iOS, Android, and Web platforms.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         FFI ARCHITECTURE                                │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Swift/Kotlin/TypeScript                                                │
//! │         │                                                               │
//! │         ▼                                                               │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    Platform Bindings                            │   │
//! │  │                                                                 │   │
//! │  │  iOS:      C FFI → Swift wrapper                               │   │
//! │  │  Android:  JNI → Kotlin wrapper                                │   │
//! │  │  Web:      wasm-bindgen → TypeScript                           │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │         │                                                               │
//! │         ▼                                                               │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                      Umbra Core                                 │   │
//! │  │                                                                 │   │
//! │  │  Identity │ Friends │ Messaging │ Network │ Storage            │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Error Handling
//!
//! All FFI functions return results through:
//! - C FFI: `FfiResult` struct with error code and message
//! - JNI: Exceptions thrown on error
//! - WASM: JavaScript Promise rejection

mod types;

#[cfg(feature = "ffi")]
mod state;

#[cfg(feature = "ffi")]
mod events;

#[cfg(feature = "ffi")]
mod dispatcher;

#[cfg(feature = "ffi")]
mod dispatch_identity;

#[cfg(feature = "ffi")]
mod dispatch_friends;

#[cfg(feature = "ffi")]
mod dispatch_messaging;

#[cfg(feature = "ffi")]
mod dispatch_community;

#[cfg(feature = "ffi")]
mod dispatch_community_msg;

#[cfg(feature = "ffi")]
mod dispatch_community_ext;

#[cfg(feature = "ffi")]
mod dispatch_dm_files;

#[cfg(feature = "ffi")]
mod dispatch_secure_store;

#[cfg(feature = "ffi")]
mod dispatch_groups;

#[cfg(feature = "ffi")]
mod dispatch_stubs;

#[cfg(feature = "ffi")]
mod c_api;

#[cfg(all(feature = "ffi", target_os = "android"))]
mod jni;

#[cfg(feature = "wasm")]
mod wasm;

pub use types::*;

#[cfg(feature = "ffi")]
pub use c_api::*;

#[cfg(feature = "wasm")]
pub use wasm::*;
