//! # Umbra Core
//!
//! A cross-platform P2P messaging library providing end-to-end encrypted
//! communication without central servers.
//!
//! ## Architecture Overview
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         UMBRA CORE MODULES                              │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
//! │  │  Identity   │  │  Discovery  │  │   Friends   │  │   Messaging  │   │
//! │  │             │  │             │  │             │  │              │   │
//! │  │ - Keypairs  │  │ - DHT       │  │ - Requests  │  │ - Encrypt    │   │
//! │  │ - DID       │  │ - Bootstrap │  │ - Accept    │  │ - Send/Recv  │   │
//! │  │ - Profile   │  │ - Announce  │  │ - Block     │  │ - Streams    │   │
//! │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬───────┘   │
//! │         │                │                │                │           │
//! │         └────────────────┴────────────────┴────────────────┘           │
//! │                                   │                                     │
//! │  ┌─────────────┐  ┌─────────────┐ │ ┌─────────────────────────────────┐│
//! │  │   Crypto    │  │   Storage   │ │ │           Network               ││
//! │  │             │  │             │ │ │                                 ││
//! │  │ - X25519    │  │ - SQLite    │◄┘ │ - libp2p (Noise, Yamux)        ││
//! │  │ - AES-GCM   │  │ - Encrypted │   │ - Direct connections           ││
//! │  │ - Signing   │  │ - Platform  │   │ - [Future: Relay/Mesh]         ││
//! │  └─────────────┘  └─────────────┘   └─────────────────────────────────┘│
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Module Hierarchy
//!
//! - [`error`] - Error types for the entire library
//! - [`crypto`] - Cryptographic primitives (keys, encryption, signing)
//! - [`identity`] - User identity management (creation, recovery, profiles)
//! - [`storage`] - Encrypted local storage (SQLite, secure keystore)
//! - [`network`] - P2P networking layer (libp2p, transports)
//! - [`discovery`] - Peer discovery (DHT, bootstrap, direct connect)
//! - [`friends`] - Friend relationships (requests, management)
//! - [`messaging`] - Encrypted messaging (conversations, messages)
//!
//! ## Security Model
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                          SECURITY LAYERS                                │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Layer 1: Transport Security (libp2p Noise Protocol)                   │
//! │  ────────────────────────────────────────────────────                   │
//! │  All peer-to-peer connections are encrypted using Noise_XX handshake   │
//! │  with X25519 key exchange. This protects against eavesdropping on      │
//! │  the network layer.                                                    │
//! │                                                                         │
//! │  Layer 2: Message-Level E2E Encryption (X25519 + AES-256-GCM)          │
//! │  ─────────────────────────────────────────────────────────────          │
//! │  Every message is encrypted with a shared secret derived from          │
//! │  the sender's and recipient's X25519 keys. Even if transport           │
//! │  security is compromised, messages remain confidential.                │
//! │                                                                         │
//! │  Layer 3: Message Authentication (Ed25519 Signatures)                   │
//! │  ──────────────────────────────────────────────────────                 │
//! │  Every message is signed by the sender, preventing forgery             │
//! │  and ensuring non-repudiation.                                         │
//! │                                                                         │
//! │  Layer 4: Local Storage Encryption (AES-256-GCM)                       │
//! │  ─────────────────────────────────────────────────                      │
//! │  All sensitive data stored locally (messages, friend lists)            │
//! │  is encrypted with a key derived from the user's identity.             │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Platform Support
//!
//! | Platform | Transport | Storage | Status |
//! |----------|-----------|---------|--------|
//! | iOS | TCP/QUIC | SQLite + Keychain | Supported |
//! | Android | TCP/QUIC | SQLite + Keystore | Supported |
//! | Web | WebSocket/WebRTC | IndexedDB | Supported |
//! | Desktop | TCP/QUIC | SQLite | Supported |

#![warn(missing_docs)]
#![warn(rustdoc::missing_crate_level_docs)]
#![cfg_attr(docsrs, feature(doc_cfg))]

// ============================================================================
// MODULE DECLARATIONS
// ============================================================================

pub mod community;
pub mod crypto;
pub mod discovery;
pub mod error;
pub mod friends;
pub mod identity;
pub mod messaging;
pub mod network;
pub mod storage;
/// Platform-aware time utilities for native and WASM targets.
pub mod time;

#[cfg(any(feature = "ffi", feature = "wasm"))]
pub mod ffi;

// ============================================================================
// RE-EXPORTS
// ============================================================================

pub use crypto::{KeyPair, PublicKey, SharedSecret};
pub use error::{Error, Result};
pub use identity::{Identity, ProfileUpdate, PublicIdentity};

// ============================================================================
// CORE INSTANCE
// ============================================================================

use once_cell::sync::OnceCell;
use parking_lot::RwLock;
use std::sync::Arc;

/// Global Umbra Core instance
static CORE_INSTANCE: OnceCell<Arc<RwLock<UmbraCore>>> = OnceCell::new();

/// Configuration for initializing Umbra Core
#[derive(Debug, Clone, Default)]
pub struct CoreConfig {
    /// Bootstrap nodes to connect to on startup
    pub bootstrap_nodes: Vec<String>,
    /// Enable verbose logging
    pub verbose_logging: bool,
    /// Storage path (platform-specific default if None)
    pub storage_path: Option<String>,
}

/// The main Umbra Core instance that coordinates all modules
///
/// ## Lifecycle
///
/// ```text
/// ┌─────────────────────────────────────────────────────────────────────────┐
/// │                        UMBRA CORE LIFECYCLE                             │
/// ├─────────────────────────────────────────────────────────────────────────┤
/// │                                                                         │
/// │  1. Initialize                                                          │
/// │     ┌─────────────┐                                                    │
/// │     │ UmbraCore:: │──► Load config                                     │
/// │     │ initialize()│──► Initialize storage                              │
/// │     └─────────────┘──► Set up crypto context                           │
/// │            │                                                           │
/// │            ▼                                                           │
/// │  2. Load or Create Identity                                            │
/// │     ┌─────────────┐                                                    │
/// │     │ load_       │──► Check secure storage                            │
/// │     │ identity()  │──► Decrypt and load keypairs                       │
/// │     └─────────────┘──► Or create new identity                          │
/// │            │                                                           │
/// │            ▼                                                           │
/// │  3. Start Network                                                      │
/// │     ┌─────────────┐                                                    │
/// │     │ start_      │──► Initialize libp2p swarm                         │
/// │     │ network()   │──► Connect to bootstrap nodes                      │
/// │     └─────────────┘──► Announce presence to DHT                        │
/// │            │                                                           │
/// │            ▼                                                           │
/// │  4. Ready for Operations                                               │
/// │     ┌─────────────┐                                                    │
/// │     │  Active     │◄─► Send/receive messages                           │
/// │     │  State      │◄─► Manage friends                                  │
/// │     └─────────────┘◄─► Discover peers                                  │
/// │            │                                                           │
/// │            ▼                                                           │
/// │  5. Shutdown                                                           │
/// │     ┌─────────────┐                                                    │
/// │     │ shutdown()  │──► Close network connections                       │
/// │     │             │──► Flush pending writes                            │
/// │     └─────────────┘──► Clean up resources                              │
/// │                                                                         │
/// └─────────────────────────────────────────────────────────────────────────┘
/// ```
pub struct UmbraCore {
    /// Current user's identity (if loaded)
    #[allow(dead_code)]
    identity: Option<Identity>,
    /// Configuration
    #[allow(dead_code)]
    config: CoreConfig,
    /// Whether the core is initialized
    initialized: bool,
}

impl UmbraCore {
    /// Initialize the Umbra Core with the given configuration
    ///
    /// This should be called once at application startup.
    ///
    /// ## Example
    ///
    /// ```ignore
    /// use umbra_core::{UmbraCore, CoreConfig};
    ///
    /// let config = CoreConfig::default();
    /// UmbraCore::initialize(config).await?;
    /// ```
    pub async fn initialize(config: CoreConfig) -> Result<()> {
        tracing::info!("Initializing Umbra Core v{}", env!("CARGO_PKG_VERSION"));

        let core = Self {
            identity: None,
            config,
            initialized: true,
        };

        CORE_INSTANCE
            .set(Arc::new(RwLock::new(core)))
            .map_err(|_| Error::AlreadyInitialized)?;

        tracing::info!("Umbra Core initialized successfully");
        Ok(())
    }

    /// Get the global core instance
    ///
    /// Returns an error if the core hasn't been initialized.
    pub fn instance() -> Result<Arc<RwLock<UmbraCore>>> {
        CORE_INSTANCE.get().cloned().ok_or(Error::NotInitialized)
    }

    /// Check if the core is initialized
    pub fn is_initialized() -> bool {
        CORE_INSTANCE.get().is_some()
    }

    /// Shutdown the core and clean up resources
    pub async fn shutdown() -> Result<()> {
        tracing::info!("Shutting down Umbra Core");

        if let Some(core) = CORE_INSTANCE.get() {
            let mut core = core.write();
            core.initialized = false;
            // TODO: Close network connections, flush storage
        }

        tracing::info!("Umbra Core shutdown complete");
        Ok(())
    }
}

// ============================================================================
// VERSION INFO
// ============================================================================

/// Returns the version of Umbra Core
pub fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

/// Returns build information for debugging
pub fn build_info() -> BuildInfo {
    BuildInfo {
        version: env!("CARGO_PKG_VERSION"),
        #[cfg(target_os = "ios")]
        target: "ios",
        #[cfg(target_os = "android")]
        target: "android",
        #[cfg(target_os = "macos")]
        target: "macos",
        #[cfg(target_os = "linux")]
        target: "linux",
        #[cfg(target_os = "windows")]
        target: "windows",
        #[cfg(target_arch = "wasm32")]
        target: "wasm32",
        #[cfg(not(any(
            target_os = "ios",
            target_os = "android",
            target_os = "macos",
            target_os = "linux",
            target_os = "windows",
            target_arch = "wasm32"
        )))]
        target: "unknown",
        profile: if cfg!(debug_assertions) {
            "debug"
        } else {
            "release"
        },
    }
}

/// Build information for debugging
#[derive(Debug, Clone)]
pub struct BuildInfo {
    /// Crate version
    pub version: &'static str,
    /// Target triple
    pub target: &'static str,
    /// Build profile (debug/release)
    pub profile: &'static str,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!version().is_empty());
    }

    #[test]
    fn test_build_info() {
        let info = build_info();
        assert_eq!(info.version, version());
    }
}
