//! # Error Handling
//!
//! This module provides comprehensive error types for Umbra Core.
//!
//! ## Error Hierarchy
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                           ERROR HIERARCHY                               │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Error (top-level)                                                     │
//! │  │                                                                      │
//! │  ├── Core Errors                                                       │
//! │  │   ├── NotInitialized        - Core not initialized                  │
//! │  │   ├── AlreadyInitialized    - Core already initialized              │
//! │  │   └── ShutdownInProgress    - Core is shutting down                 │
//! │  │                                                                      │
//! │  ├── Identity Errors                                                   │
//! │  │   ├── NoIdentity            - No identity loaded                    │
//! │  │   ├── IdentityExists        - Identity already exists               │
//! │  │   ├── InvalidRecoveryPhrase - Invalid BIP39 phrase                  │
//! │  │   ├── KeyDerivationFailed   - Failed to derive keys                 │
//! │  │   └── InvalidDid            - Invalid DID format                    │
//! │  │                                                                      │
//! │  ├── Crypto Errors                                                     │
//! │  │   ├── EncryptionFailed      - Encryption operation failed           │
//! │  │   ├── DecryptionFailed      - Decryption operation failed           │
//! │  │   ├── SigningFailed         - Signing operation failed              │
//! │  │   ├── VerificationFailed    - Signature verification failed         │
//! │  │   ├── InvalidKey            - Invalid key format/length             │
//! │  │   └── KeyExchangeFailed     - Key exchange failed                   │
//! │  │                                                                      │
//! │  ├── Storage Errors                                                    │
//! │  │   ├── StorageNotInitialized - Storage not initialized               │
//! │  │   ├── ReadError             - Failed to read from storage           │
//! │  │   ├── WriteError            - Failed to write to storage            │
//! │  │   ├── NotFound              - Item not found in storage             │
//! │  │   └── Corrupted             - Data corruption detected              │
//! │  │                                                                      │
//! │  ├── Network Errors                                                    │
//! │  │   ├── NotConnected          - Not connected to network              │
//! │  │   ├── ConnectionFailed      - Failed to connect to peer             │
//! │  │   ├── Timeout               - Operation timed out                   │
//! │  │   ├── PeerNotFound          - Peer not found on network             │
//! │  │   └── ProtocolError         - Protocol-level error                  │
//! │  │                                                                      │
//! │  ├── Friend Errors                                                     │
//! │  │   ├── AlreadyFriends        - Already friends with user             │
//! │  │   ├── NotFriends            - Not friends with user                 │
//! │  │   ├── RequestPending        - Friend request already pending        │
//! │  │   ├── RequestNotFound       - Friend request not found              │
//! │  │   ├── Blocked               - User is blocked                       │
//! │  │   └── InvalidRequest        - Invalid friend request                │
//! │  │                                                                      │
//! │  └── Message Errors                                                    │
//! │      ├── ConversationNotFound  - Conversation doesn't exist            │
//! │      ├── MessageNotFound       - Message doesn't exist                 │
//! │      ├── RecipientOffline      - Recipient is offline                  │
//! │      └── DeliveryFailed        - Message delivery failed               │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Error Handling Best Practices
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      ERROR HANDLING FLOW                                │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Internal (Rust)              FFI Boundary              External (TS)  │
//! │  ──────────────────────────────────────────────────────────────────     │
//! │                                                                         │
//! │  Result<T, Error>  ──────►  ErrorCode + Message  ──────►  throw Error  │
//! │                              (integer + string)          (JavaScript)  │
//! │                                                                         │
//! │  Example:                                                              │
//! │  Err(Error::DecryptionFailed)  →  { code: 201, message: "..." }       │
//! │                                  →  throw new UmbraError(201, "...")   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use thiserror::Error;

/// Result type alias for Umbra Core operations
pub type Result<T> = std::result::Result<T, Error>;

/// Main error type for Umbra Core
///
/// All errors are categorized by module/domain to make error handling
/// clearer and to provide meaningful error messages to users.
#[derive(Error, Debug)]
pub enum Error {
    // ========================================================================
    // Core Lifecycle Errors (100-199)
    // ========================================================================

    /// Core has not been initialized
    #[error("Umbra Core has not been initialized. Call UmbraCore::initialize() first.")]
    NotInitialized,

    /// Core has already been initialized
    #[error("Umbra Core has already been initialized.")]
    AlreadyInitialized,

    /// Core is shutting down
    #[error("Umbra Core is shutting down.")]
    ShutdownInProgress,

    // ========================================================================
    // Identity Errors (200-299)
    // ========================================================================

    /// No identity has been loaded
    #[error("No identity loaded. Create or load an identity first.")]
    NoIdentity,

    /// An identity already exists
    #[error("An identity already exists. Cannot create a new one without removing the existing identity.")]
    IdentityExists,

    /// Invalid recovery phrase
    #[error("Invalid recovery phrase: {0}")]
    InvalidRecoveryPhrase(String),

    /// Key derivation failed
    #[error("Failed to derive keys: {0}")]
    KeyDerivationFailed(String),

    /// Invalid DID format
    #[error("Invalid DID format: {0}")]
    InvalidDid(String),

    /// Profile update failed
    #[error("Failed to update profile: {0}")]
    ProfileUpdateFailed(String),

    // ========================================================================
    // Crypto Errors (300-399)
    // ========================================================================

    /// Encryption failed
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),

    /// Decryption failed
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),

    /// Signing failed
    #[error("Signing failed: {0}")]
    SigningFailed(String),

    /// Signature verification failed
    #[error("Signature verification failed")]
    VerificationFailed,

    /// Invalid key format or length
    #[error("Invalid key: {0}")]
    InvalidKey(String),

    /// Key exchange failed
    #[error("Key exchange failed: {0}")]
    KeyExchangeFailed(String),

    /// Random number generation failed
    #[error("Random number generation failed")]
    RngFailed,

    // ========================================================================
    // Storage Errors (400-499)
    // ========================================================================

    /// Storage has not been initialized
    #[error("Storage has not been initialized.")]
    StorageNotInitialized,

    /// Failed to read from storage
    #[error("Failed to read from storage: {0}")]
    StorageReadError(String),

    /// Failed to write to storage
    #[error("Failed to write to storage: {0}")]
    StorageWriteError(String),

    /// Item not found in storage
    #[error("Item not found: {0}")]
    StorageNotFound(String),

    /// Data corruption detected
    #[error("Data corruption detected: {0}")]
    StorageCorrupted(String),

    /// Database error
    #[error("Database error: {0}")]
    DatabaseError(String),

    // ========================================================================
    // Network Errors (500-599)
    // ========================================================================

    /// Not connected to the network
    #[error("Not connected to the network.")]
    NotConnected,

    /// Failed to connect to peer
    #[error("Failed to connect to peer: {0}")]
    ConnectionFailed(String),

    /// Operation timed out
    #[error("Operation timed out: {0}")]
    Timeout(String),

    /// Peer not found on network
    #[error("Peer not found: {0}")]
    PeerNotFound(String),

    /// Protocol-level error
    #[error("Protocol error: {0}")]
    ProtocolError(String),

    /// Transport error
    #[error("Transport error: {0}")]
    TransportError(String),

    /// DHT error
    #[error("DHT error: {0}")]
    DhtError(String),

    // ========================================================================
    // Friend Errors (600-699)
    // ========================================================================

    /// Already friends with this user
    #[error("Already friends with this user.")]
    AlreadyFriends,

    /// Not friends with this user
    #[error("Not friends with this user.")]
    NotFriends,

    /// Friend request already pending
    #[error("A friend request is already pending for this user.")]
    RequestPending,

    /// Friend request not found
    #[error("Friend request not found.")]
    RequestNotFound,

    /// User is blocked
    #[error("This user is blocked.")]
    UserBlocked,

    /// Invalid friend request
    #[error("Invalid friend request: {0}")]
    InvalidFriendRequest(String),

    /// Cannot send request to self
    #[error("Cannot send a friend request to yourself.")]
    CannotAddSelf,

    // ========================================================================
    // Message Errors (700-799)
    // ========================================================================

    /// Conversation not found
    #[error("Conversation not found.")]
    ConversationNotFound,

    /// Message not found
    #[error("Message not found.")]
    MessageNotFound,

    /// Recipient is offline
    #[error("Recipient is offline. Message will be delivered when they come online.")]
    RecipientOffline,

    /// Message delivery failed
    #[error("Failed to deliver message: {0}")]
    DeliveryFailed(String),

    /// Invalid message content
    #[error("Invalid message content: {0}")]
    InvalidMessageContent(String),

    // ========================================================================
    // Internal Errors (900-999)
    // ========================================================================

    /// Internal error (should not happen in normal operation)
    #[error("Internal error: {0}")]
    Internal(String),

    /// Feature not implemented yet
    #[error("Feature not implemented: {0}")]
    NotImplemented(String),

    /// Serialization error
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// Deserialization error
    #[error("Deserialization error: {0}")]
    DeserializationError(String),
}

impl Error {
    /// Get the error code for FFI
    ///
    /// Error codes are organized by category:
    /// - 100-199: Core lifecycle
    /// - 200-299: Identity
    /// - 300-399: Crypto
    /// - 400-499: Storage
    /// - 500-599: Network
    /// - 600-699: Friends
    /// - 700-799: Messages
    /// - 900-999: Internal
    pub fn code(&self) -> i32 {
        match self {
            // Core (100-199)
            Error::NotInitialized => 100,
            Error::AlreadyInitialized => 101,
            Error::ShutdownInProgress => 102,

            // Identity (200-299)
            Error::NoIdentity => 200,
            Error::IdentityExists => 201,
            Error::InvalidRecoveryPhrase(_) => 202,
            Error::KeyDerivationFailed(_) => 203,
            Error::InvalidDid(_) => 204,
            Error::ProfileUpdateFailed(_) => 205,

            // Crypto (300-399)
            Error::EncryptionFailed(_) => 300,
            Error::DecryptionFailed(_) => 301,
            Error::SigningFailed(_) => 302,
            Error::VerificationFailed => 303,
            Error::InvalidKey(_) => 304,
            Error::KeyExchangeFailed(_) => 305,
            Error::RngFailed => 306,

            // Storage (400-499)
            Error::StorageNotInitialized => 400,
            Error::StorageReadError(_) => 401,
            Error::StorageWriteError(_) => 402,
            Error::StorageNotFound(_) => 403,
            Error::StorageCorrupted(_) => 404,
            Error::DatabaseError(_) => 405,

            // Network (500-599)
            Error::NotConnected => 500,
            Error::ConnectionFailed(_) => 501,
            Error::Timeout(_) => 502,
            Error::PeerNotFound(_) => 503,
            Error::ProtocolError(_) => 504,
            Error::TransportError(_) => 505,
            Error::DhtError(_) => 506,

            // Friends (600-699)
            Error::AlreadyFriends => 600,
            Error::NotFriends => 601,
            Error::RequestPending => 602,
            Error::RequestNotFound => 603,
            Error::UserBlocked => 604,
            Error::InvalidFriendRequest(_) => 605,
            Error::CannotAddSelf => 606,

            // Messages (700-799)
            Error::ConversationNotFound => 700,
            Error::MessageNotFound => 701,
            Error::RecipientOffline => 702,
            Error::DeliveryFailed(_) => 703,
            Error::InvalidMessageContent(_) => 704,

            // Internal (900-999)
            Error::Internal(_) => 900,
            Error::NotImplemented(_) => 901,
            Error::SerializationError(_) => 902,
            Error::DeserializationError(_) => 903,
        }
    }

    /// Check if this error is recoverable
    ///
    /// Recoverable errors can potentially be resolved by retrying
    /// or by user action.
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            Error::Timeout(_)
                | Error::ConnectionFailed(_)
                | Error::RecipientOffline
                | Error::NotConnected
                | Error::PeerNotFound(_)
        )
    }

    /// Check if this error requires user action
    pub fn requires_user_action(&self) -> bool {
        matches!(
            self,
            Error::NoIdentity
                | Error::InvalidRecoveryPhrase(_)
                | Error::UserBlocked
                | Error::NotFriends
        )
    }
}

// ============================================================================
// ERROR CONVERSIONS
// ============================================================================

#[cfg(not(target_arch = "wasm32"))]
impl From<rusqlite::Error> for Error {
    fn from(err: rusqlite::Error) -> Self {
        Error::DatabaseError(err.to_string())
    }
}

impl From<serde_json::Error> for Error {
    fn from(err: serde_json::Error) -> Self {
        Error::SerializationError(err.to_string())
    }
}

impl From<bincode::Error> for Error {
    fn from(err: bincode::Error) -> Self {
        Error::SerializationError(err.to_string())
    }
}

impl From<std::io::Error> for Error {
    fn from(err: std::io::Error) -> Self {
        Error::StorageReadError(err.to_string())
    }
}

// ============================================================================
// FFI ERROR REPRESENTATION
// ============================================================================

/// FFI-friendly error representation
///
/// This struct can be safely passed across the FFI boundary
#[derive(Debug, Clone)]
#[repr(C)]
pub struct FfiError {
    /// Numeric error code
    pub code: i32,
    /// Human-readable error message
    pub message: String,
    /// Whether the error is recoverable
    pub recoverable: bool,
}

impl From<Error> for FfiError {
    fn from(err: Error) -> Self {
        Self {
            code: err.code(),
            message: err.to_string(),
            recoverable: err.is_recoverable(),
        }
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_codes() {
        assert_eq!(Error::NotInitialized.code(), 100);
        assert_eq!(Error::NoIdentity.code(), 200);
        assert_eq!(Error::EncryptionFailed("test".into()).code(), 300);
        assert_eq!(Error::StorageNotInitialized.code(), 400);
        assert_eq!(Error::NotConnected.code(), 500);
        assert_eq!(Error::AlreadyFriends.code(), 600);
        assert_eq!(Error::ConversationNotFound.code(), 700);
        assert_eq!(Error::Internal("test".into()).code(), 900);
    }

    #[test]
    fn test_recoverable_errors() {
        assert!(Error::Timeout("test".into()).is_recoverable());
        assert!(Error::RecipientOffline.is_recoverable());
        assert!(!Error::NoIdentity.is_recoverable());
        assert!(!Error::VerificationFailed.is_recoverable());
    }

    #[test]
    fn test_ffi_error_conversion() {
        let err = Error::InvalidRecoveryPhrase("bad phrase".into());
        let ffi_err: FfiError = err.into();

        assert_eq!(ffi_err.code, 202);
        assert!(ffi_err.message.contains("bad phrase"));
        assert!(!ffi_err.recoverable);
    }
}
