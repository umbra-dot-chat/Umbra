//! # Storage Module
//!
//! Encrypted local storage for Umbra data.
//!
//! ## Storage Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         STORAGE SYSTEM                                  │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  Platform Secure Storage (Keys Only)                            │   │
//! │  │  ───────────────────────────────────                             │   │
//! │  │                                                                 │   │
//! │  │  iOS: Keychain                                                 │   │
//! │  │  Android: Keystore + EncryptedSharedPreferences               │   │
//! │  │  Web: IndexedDB + WebCrypto                                    │   │
//! │  │  Desktop: OS keyring (libsecret, Windows Credential Manager)  │   │
//! │  │                                                                 │   │
//! │  │  Stored: Identity private keys (encrypted)                     │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  SQLite Database (Encrypted)                                    │   │
//! │  │  ──────────────────────────────                                  │   │
//! │  │                                                                 │   │
//! │  │  Tables:                                                       │   │
//! │  │  • friends - Friend list with public keys                      │   │
//! │  │  • conversations - Conversation metadata                       │   │
//! │  │  • messages - Encrypted message content                        │   │
//! │  │  • friend_requests - Pending requests                          │   │
//! │  │  • blocked_users - Block list                                  │   │
//! │  │  • settings - User preferences                                 │   │
//! │  │                                                                 │   │
//! │  │  Encryption: AES-256-GCM with storage-derived key             │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Security Model
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      STORAGE ENCRYPTION                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Identity Master Seed                                                   │
//! │         │                                                               │
//! │         ├──► HKDF("umbra-signing-key-v1")  ──► Signing Key             │
//! │         │                                                               │
//! │         ├──► HKDF("umbra-encryption-key-v1") ──► Encryption Key        │
//! │         │                                                               │
//! │         └──► HKDF("umbra-storage-key-v1") ──► Storage Encryption Key   │
//! │                                              │                          │
//! │                                              ▼                          │
//! │                                    ┌──────────────────┐                 │
//! │                                    │ Encrypted SQLite │                 │
//! │                                    │ Database         │                 │
//! │                                    └──────────────────┘                 │
//! │                                                                         │
//! │  All sensitive fields in the database are encrypted with AES-256-GCM  │
//! │  using the storage encryption key derived from the user's identity.   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

// Platform-specific database implementation
#[cfg(not(target_arch = "wasm32"))]
mod database;
#[cfg(target_arch = "wasm32")]
#[path = "wasm_database.rs"]
mod database;

mod secure_store;
mod schema;

pub use database::{
    Database, DatabaseConfig, FriendRecord, FriendRequestRecord,
    ConversationRecord, MessageRecord, GroupRecord, GroupMemberRecord,
    GroupKeyRecord, GroupInviteRecord, ReactionRecord,
};
pub use secure_store::SecureStore;

use crate::error::Result;

/// Storage configuration
#[derive(Debug, Clone, Default)]
pub struct StorageConfig {
    /// Path to the database file (None for in-memory)
    pub database_path: Option<String>,
}

/// Initialize the storage system
pub async fn init(_config: StorageConfig) -> Result<Database> {
    Database::open(None).await
}
