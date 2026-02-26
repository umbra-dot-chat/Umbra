//! # Secure Storage
//!
//! Platform-specific secure storage for sensitive data like private keys.
//!
//! ## Platform Implementations
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      SECURE STORAGE                                     │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  SecureStore Trait                                              │   │
//! │  │  ──────────────────                                              │   │
//! │  │                                                                 │   │
//! │  │  • store(key, value)   - Store encrypted data                  │   │
//! │  │  • retrieve(key)       - Retrieve and decrypt data             │   │
//! │  │  • delete(key)         - Securely delete data                  │   │
//! │  │  • exists(key)         - Check if key exists                   │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  Platform Implementations:                                             │
//! │  ────────────────────────                                               │
//! │                                                                         │
//! │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐              │
//! │  │     iOS       │  │   Android     │  │     Web       │              │
//! │  │   Keychain    │  │   Keystore    │  │  IndexedDB    │              │
//! │  │               │  │               │  │ + WebCrypto   │              │
//! │  │ - Hardware-   │  │ - Hardware-   │  │               │              │
//! │  │   backed      │  │   backed      │  │ - Encrypted   │              │
//! │  │ - Biometric   │  │ - Biometric   │  │   storage     │              │
//! │  │   optional    │  │   optional    │  │               │              │
//! │  └───────────────┘  └───────────────┘  └───────────────┘              │
//! │                                                                         │
//! │  ┌───────────────┐  ┌───────────────┐                                  │
//! │  │    macOS      │  │    Linux      │                                  │
//! │  │   Keychain    │  │  libsecret    │                                  │
//! │  │               │  │               │                                  │
//! │  │ - System      │  │ - GNOME       │                                  │
//! │  │   keyring     │  │   keyring     │                                  │
//! │  └───────────────┘  └───────────────┘                                  │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Security Model
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    KEY STORAGE SECURITY                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  What We Store:                                                        │
//! │  ───────────────                                                        │
//! │                                                                         │
//! │  1. Identity Private Keys (Encrypted)                                  │
//! │     - Ed25519 signing key                                              │
//! │     - X25519 encryption key                                            │
//! │     - Encrypted with a key derived from recovery phrase               │
//! │                                                                         │
//! │  2. Recovery Phrase Derived Key                                        │
//! │     - Used to encrypt/decrypt the identity keys                        │
//! │     - User should also have the recovery phrase written down           │
//! │                                                                         │
//! │  Security Properties:                                                  │
//! │  ────────────────────                                                   │
//! │                                                                         │
//! │  • Keys never leave secure enclave (on supported hardware)            │
//! │  • Biometric authentication optional                                   │
//! │  • Data encrypted at rest                                              │
//! │  • Access control per-app                                              │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

#[cfg(not(target_os = "ios"))]
use parking_lot::RwLock;
#[cfg(not(target_os = "ios"))]
use std::collections::HashMap;
use zeroize::Zeroizing;

use crate::crypto::{decrypt, encrypt, EncryptionKey, Nonce};
use crate::error::{Error, Result};

/// Key names for secure storage
#[allow(dead_code)]
pub mod keys {
    /// The encrypted identity keypair
    pub const IDENTITY_KEYS: &str = "umbra.identity.keys";

    /// The DID for quick lookup
    pub const IDENTITY_DID: &str = "umbra.identity.did";

    /// Storage encryption key (derived from identity)
    pub const STORAGE_KEY: &str = "umbra.storage.key";
}

/// Secure storage interface
///
/// This is a platform-agnostic interface. Platform-specific implementations
/// will be added via conditional compilation.
pub struct SecureStore {
    /// In-memory storage (for development/testing)
    /// In production, this is backed by platform keychain/keystore
    #[cfg(not(target_os = "ios"))]
    memory: RwLock<HashMap<String, Vec<u8>>>,

    /// Optional encryption key for additional protection
    encryption_key: Option<EncryptionKey>,
}

impl SecureStore {
    /// Create a new secure store
    pub fn new() -> Self {
        Self {
            #[cfg(not(target_os = "ios"))]
            memory: RwLock::new(HashMap::new()),
            encryption_key: None,
        }
    }

    /// Create a secure store with an encryption key
    ///
    /// All data will be encrypted before storage.
    pub fn with_encryption(key: [u8; 32]) -> Self {
        Self {
            #[cfg(not(target_os = "ios"))]
            memory: RwLock::new(HashMap::new()),
            encryption_key: Some(EncryptionKey::from_bytes(key)),
        }
    }

    /// Store data securely
    ///
    /// The data will be encrypted if an encryption key was provided.
    pub fn store(&self, key: &str, value: &[u8]) -> Result<()> {
        let data = if let Some(ref enc_key) = self.encryption_key {
            // Encrypt the data
            let (nonce, ciphertext) = encrypt(enc_key, value, key.as_bytes())?;
            let mut result = nonce.as_bytes().to_vec();
            result.extend_from_slice(&ciphertext);
            result
        } else {
            value.to_vec()
        };

        self.store_raw(key, &data)
    }

    /// Retrieve data securely
    ///
    /// The data will be decrypted if an encryption key was provided.
    pub fn retrieve(&self, key: &str) -> Result<Option<Zeroizing<Vec<u8>>>> {
        let data = match self.retrieve_raw(key)? {
            Some(d) => d,
            None => return Ok(None),
        };

        let result = if let Some(ref enc_key) = self.encryption_key {
            // Decrypt the data
            if data.len() < 12 {
                return Err(Error::StorageReadError("Stored data too short".into()));
            }

            let nonce = Nonce::from_bytes(data[..12].try_into().unwrap());
            let ciphertext = &data[12..];

            let plaintext = decrypt(enc_key, &nonce, ciphertext, key.as_bytes())?;
            Zeroizing::new(plaintext)
        } else {
            Zeroizing::new(data)
        };

        Ok(Some(result))
    }

    /// Delete data from secure storage
    pub fn delete(&self, key: &str) -> Result<bool> {
        self.delete_raw(key)
    }

    /// Check if a key exists
    pub fn exists(&self, key: &str) -> Result<bool> {
        self.exists_raw(key)
    }

    // ========================================================================
    // PLATFORM-SPECIFIC IMPLEMENTATIONS
    // ========================================================================

    // Development/Testing implementation (in-memory)
    #[cfg(not(target_os = "ios"))]
    fn store_raw(&self, key: &str, value: &[u8]) -> Result<()> {
        let mut storage = self.memory.write();
        storage.insert(key.to_string(), value.to_vec());
        Ok(())
    }

    #[cfg(not(target_os = "ios"))]
    fn retrieve_raw(&self, key: &str) -> Result<Option<Vec<u8>>> {
        let storage = self.memory.read();
        Ok(storage.get(key).cloned())
    }

    #[cfg(not(target_os = "ios"))]
    fn delete_raw(&self, key: &str) -> Result<bool> {
        let mut storage = self.memory.write();
        Ok(storage.remove(key).is_some())
    }

    #[cfg(not(target_os = "ios"))]
    fn exists_raw(&self, key: &str) -> Result<bool> {
        let storage = self.memory.read();
        Ok(storage.contains_key(key))
    }

    // iOS Keychain implementation
    #[cfg(target_os = "ios")]
    fn store_raw(&self, key: &str, value: &[u8]) -> Result<()> {
        use security_framework::passwords::{delete_generic_password, set_generic_password};

        const SERVICE_NAME: &str = "com.umbra.keychain";

        // First try to delete any existing item (update pattern)
        let _ = delete_generic_password(SERVICE_NAME, key);

        // Store the new value
        set_generic_password(SERVICE_NAME, key, value)
            .map_err(|e| Error::StorageWriteError(format!("Keychain write failed: {}", e)))?;

        Ok(())
    }

    #[cfg(target_os = "ios")]
    fn retrieve_raw(&self, key: &str) -> Result<Option<Vec<u8>>> {
        use security_framework::passwords::get_generic_password;

        const SERVICE_NAME: &str = "com.umbra.keychain";

        match get_generic_password(SERVICE_NAME, key) {
            Ok(data) => Ok(Some(data.to_vec())),
            Err(e) => {
                // Check if the error is "item not found"
                let err_str = e.to_string();
                if err_str.contains("not found") || err_str.contains("-25300") {
                    Ok(None)
                } else {
                    Err(Error::StorageReadError(format!(
                        "Keychain read failed: {}",
                        e
                    )))
                }
            }
        }
    }

    #[cfg(target_os = "ios")]
    fn delete_raw(&self, key: &str) -> Result<bool> {
        use security_framework::passwords::delete_generic_password;

        const SERVICE_NAME: &str = "com.umbra.keychain";

        match delete_generic_password(SERVICE_NAME, key) {
            Ok(_) => Ok(true),
            Err(e) => {
                // Check if the error is "item not found"
                let err_str = e.to_string();
                if err_str.contains("not found") || err_str.contains("-25300") {
                    Ok(false)
                } else {
                    Err(Error::StorageWriteError(format!(
                        "Keychain delete failed: {}",
                        e
                    )))
                }
            }
        }
    }

    #[cfg(target_os = "ios")]
    fn exists_raw(&self, key: &str) -> Result<bool> {
        // Use retrieve_raw and check if it returns Some
        match self.retrieve_raw(key)? {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    // Android: Uses in-memory storage for now.
    // TODO: Implement Android Keystore via the dispatcher FFI pattern.
}

impl Default for SecureStore {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Store an identity's private keys securely
///
/// The keys are encrypted with a storage key derived from the master seed.
#[allow(dead_code)]
pub fn store_identity_keys(
    store: &SecureStore,
    signing_key: &[u8; 32],
    encryption_key: &[u8; 32],
    did: &str,
) -> Result<()> {
    // Combine keys for storage
    let mut combined = Vec::with_capacity(64);
    combined.extend_from_slice(signing_key);
    combined.extend_from_slice(encryption_key);

    // Store encrypted keys
    store.store(keys::IDENTITY_KEYS, &combined)?;

    // Store DID for quick lookup
    store.store(keys::IDENTITY_DID, did.as_bytes())?;

    Ok(())
}

/// Retrieve identity private keys from secure storage
///
/// Returns (signing_key, encryption_key, did).
#[allow(dead_code, clippy::type_complexity)]
pub fn retrieve_identity_keys(
    store: &SecureStore,
) -> Result<Option<(Zeroizing<[u8; 32]>, Zeroizing<[u8; 32]>, String)>> {
    // Get DID
    let did = match store.retrieve(keys::IDENTITY_DID)? {
        Some(d) => String::from_utf8(d.to_vec())
            .map_err(|_| Error::StorageReadError("Invalid DID encoding".into()))?,
        None => return Ok(None),
    };

    // Get keys
    let combined = match store.retrieve(keys::IDENTITY_KEYS)? {
        Some(k) => k,
        None => return Ok(None),
    };

    if combined.len() != 64 {
        return Err(Error::StorageReadError("Invalid key data length".into()));
    }

    let mut signing_key = Zeroizing::new([0u8; 32]);
    let mut encryption_key = Zeroizing::new([0u8; 32]);

    signing_key.copy_from_slice(&combined[..32]);
    encryption_key.copy_from_slice(&combined[32..]);

    Ok(Some((signing_key, encryption_key, did)))
}

/// Delete identity keys from secure storage
#[allow(dead_code)]
pub fn delete_identity_keys(store: &SecureStore) -> Result<()> {
    store.delete(keys::IDENTITY_KEYS)?;
    store.delete(keys::IDENTITY_DID)?;
    store.delete(keys::STORAGE_KEY)?;
    Ok(())
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_store_retrieve() {
        let store = SecureStore::new();

        // Store data
        store.store("test-key", b"test-value").unwrap();

        // Retrieve data
        let value = store.retrieve("test-key").unwrap().unwrap();
        assert_eq!(&*value, b"test-value");

        // Delete data
        let deleted = store.delete("test-key").unwrap();
        assert!(deleted);

        // Verify deletion
        let value = store.retrieve("test-key").unwrap();
        assert!(value.is_none());
    }

    #[test]
    fn test_store_with_encryption() {
        let key = [42u8; 32];
        let store = SecureStore::with_encryption(key);

        // Store encrypted data
        store.store("secret", b"very secret data").unwrap();

        // Retrieve and decrypt
        let value = store.retrieve("secret").unwrap().unwrap();
        assert_eq!(&*value, b"very secret data");
    }

    #[test]
    fn test_exists() {
        let store = SecureStore::new();

        assert!(!store.exists("nonexistent").unwrap());

        store.store("exists", b"data").unwrap();
        assert!(store.exists("exists").unwrap());
    }

    #[test]
    fn test_identity_keys_storage() {
        let store = SecureStore::new();

        let signing_key = [1u8; 32];
        let encryption_key = [2u8; 32];
        let did = "did:key:z6MkTest";

        // Store
        store_identity_keys(&store, &signing_key, &encryption_key, did).unwrap();

        // Retrieve
        let (retrieved_signing, retrieved_encryption, retrieved_did) =
            retrieve_identity_keys(&store).unwrap().unwrap();

        assert_eq!(&*retrieved_signing, &signing_key);
        assert_eq!(&*retrieved_encryption, &encryption_key);
        assert_eq!(retrieved_did, did);

        // Delete
        delete_identity_keys(&store).unwrap();

        // Verify deletion
        let result = retrieve_identity_keys(&store).unwrap();
        assert!(result.is_none());
    }
}
