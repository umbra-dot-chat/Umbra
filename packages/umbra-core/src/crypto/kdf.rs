//! # Key Derivation Functions
//!
//! This module provides key derivation for generating cryptographic keys
//! from seeds and shared secrets.
//!
//! ## Key Derivation Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    KEY DERIVATION HIERARCHY                             │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    BIP39 RECOVERY PHRASE                        │   │
//! │  │                                                                 │   │
//! │  │  "abandon abandon abandon ... about"  (24 words)               │   │
//! │  │                                                                 │   │
//! │  │  • 256 bits of entropy                                         │   │
//! │  │  • Human-readable backup                                       │   │
//! │  │  • Industry standard (Bitcoin, Ethereum, etc.)                 │   │
//! │  └─────────────────────────────┬───────────────────────────────────┘   │
//! │                                │                                        │
//! │                                ▼                                        │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    BIP39 SEED DERIVATION                        │   │
//! │  │                                                                 │   │
//! │  │  PBKDF2-HMAC-SHA512(                                           │   │
//! │  │    password = mnemonic_words,                                  │   │
//! │  │    salt = "mnemonic" + passphrase,                            │   │
//! │  │    iterations = 2048,                                         │   │
//! │  │    output_length = 64 bytes                                   │   │
//! │  │  )                                                            │   │
//! │  │                                                                 │   │
//! │  │  → 512-bit BIP39 Seed (we use first 256 bits)                 │   │
//! │  └─────────────────────────────┬───────────────────────────────────┘   │
//! │                                │                                        │
//! │                                ▼                                        │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    MASTER SEED (32 bytes)                       │   │
//! │  │                                                                 │   │
//! │  │  First 32 bytes of BIP39 seed                                  │   │
//! │  │  Used as Input Key Material (IKM) for HKDF                     │   │
//! │  └─────────────────────────────┬───────────────────────────────────┘   │
//! │                                │                                        │
//! │              ┌─────────────────┴─────────────────┐                     │
//! │              ▼                                   ▼                     │
//! │  ┌───────────────────────────┐   ┌───────────────────────────┐       │
//! │  │     SIGNING KEY           │   │    ENCRYPTION KEY         │       │
//! │  │                           │   │                           │       │
//! │  │  HKDF-SHA256(             │   │  HKDF-SHA256(             │       │
//! │  │    ikm = master_seed,     │   │    ikm = master_seed,     │       │
//! │  │    salt = empty,          │   │    salt = empty,          │       │
//! │  │    info = "umbra-signing  │   │    info = "umbra-encrypt  │       │
//! │  │            -key-v1"       │   │            -key-v1"       │       │
//! │  │  )                        │   │  )                        │       │
//! │  │                           │   │                           │       │
//! │  │  → 32-byte Ed25519 seed   │   │  → 32-byte X25519 secret  │       │
//! │  └───────────────────────────┘   └───────────────────────────┘       │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Shared Secret Key Derivation
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                 SHARED SECRET → MESSAGE KEYS                            │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    X25519 SHARED SECRET                         │   │
//! │  │                                                                 │   │
//! │  │  Result of Diffie-Hellman key exchange:                        │   │
//! │  │  alice_private × bob_public = bob_private × alice_public       │   │
//! │  │                                                                 │   │
//! │  │  → 32 bytes                                                    │   │
//! │  └─────────────────────────────┬───────────────────────────────────┘   │
//! │                                │                                        │
//! │                                ▼                                        │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    HKDF KEY DERIVATION                          │   │
//! │  │                                                                 │   │
//! │  │  HKDF-SHA256(                                                  │   │
//! │  │    ikm = shared_secret,                                       │   │
//! │  │    salt = conversation_id,  ← Binds key to conversation       │   │
//! │  │    info = "umbra-message-encryption-v1"                       │   │
//! │  │  )                                                            │   │
//! │  │                                                                 │   │
//! │  │  → 32-byte AES-256-GCM key                                    │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  Why use conversation_id as salt?                                      │
//! │  ─────────────────────────────────                                      │
//! │  • Different conversations get different encryption keys              │
//! │  • Compromise of one conversation doesn't affect others               │
//! │  • Provides cryptographic domain separation                           │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Security Considerations
//!
//! | Aspect | Design Choice | Rationale |
//! |--------|---------------|-----------|
//! | KDF Algorithm | HKDF-SHA256 | Well-analyzed, recommended by NIST |
//! | Key Separation | Different `info` strings | Prevents key reuse across purposes |
//! | Conversation Binding | `salt = conversation_id` | Domain separation per conversation |
//! | Version String | "-v1" suffix | Allows future algorithm upgrades |

use hkdf::Hkdf;
use sha2::Sha256;
use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::error::{Error, Result};

/// Domain separation strings for HKDF
///
/// These ensure that keys derived for different purposes are cryptographically
/// independent, even when derived from the same master seed.
pub mod domain {
    /// Domain for signing key derivation
    pub const SIGNING_KEY: &[u8] = b"umbra-signing-key-v1";

    /// Domain for encryption key derivation
    pub const ENCRYPTION_KEY: &[u8] = b"umbra-encryption-key-v1";

    /// Domain for message encryption key derivation
    pub const MESSAGE_ENCRYPTION: &[u8] = b"umbra-message-encryption-v1";

    /// Domain for storage encryption key derivation
    #[allow(dead_code)]
    pub const STORAGE_ENCRYPTION: &[u8] = b"umbra-storage-encryption-v1";
}

/// Keys derived from a master seed
#[derive(ZeroizeOnDrop)]
pub struct DerivedKeys {
    /// Ed25519 signing key (32 bytes)
    #[zeroize(skip)]
    pub signing_key: [u8; 32],

    /// X25519 encryption key (32 bytes)
    #[zeroize(skip)]
    pub encryption_key: [u8; 32],
}

/// Derive signing and encryption keys from a master seed
///
/// ## Process
///
/// ```text
/// Master Seed (32 bytes)
///       │
///       ├──► HKDF(info="umbra-signing-key-v1")    → Signing Key
///       │
///       └──► HKDF(info="umbra-encryption-key-v1") → Encryption Key
/// ```
///
/// ## Security Note
///
/// The input seed should have at least 256 bits of entropy (e.g., from BIP39).
pub fn derive_keys_from_seed(seed: &[u8; 32]) -> Result<DerivedKeys> {
    let hkdf = Hkdf::<Sha256>::new(None, seed);

    let mut signing_key = [0u8; 32];
    hkdf.expand(domain::SIGNING_KEY, &mut signing_key)
        .map_err(|_| Error::KeyDerivationFailed("Failed to derive signing key".into()))?;

    let mut encryption_key = [0u8; 32];
    hkdf.expand(domain::ENCRYPTION_KEY, &mut encryption_key)
        .map_err(|_| Error::KeyDerivationFailed("Failed to derive encryption key".into()))?;

    Ok(DerivedKeys {
        signing_key,
        encryption_key,
    })
}

/// Derive a shared secret for message encryption
///
/// Takes the raw X25519 DH output and derives an encryption key
/// bound to a specific conversation.
///
/// ## Parameters
///
/// - `dh_output`: Raw 32-byte output from X25519 Diffie-Hellman
/// - `conversation_id`: Unique identifier for the conversation
///
/// ## Returns
///
/// 32-byte AES-256-GCM encryption key
pub fn derive_shared_secret(
    dh_output: &[u8; 32],
    conversation_id: &[u8],
) -> Result<[u8; 32]> {
    let hkdf = Hkdf::<Sha256>::new(Some(conversation_id), dh_output);

    let mut key = [0u8; 32];
    hkdf.expand(domain::MESSAGE_ENCRYPTION, &mut key)
        .map_err(|_| Error::KeyDerivationFailed("Failed to derive message key".into()))?;

    Ok(key)
}

/// Derive a storage encryption key from identity keys
///
/// Used to encrypt local storage (SQLite database, etc.)
///
/// ## Security
///
/// The storage key is derived from both signing and encryption keys,
/// ensuring it's tied to the user's identity.
#[allow(dead_code)]
pub fn derive_storage_key(
    signing_key: &[u8; 32],
    encryption_key: &[u8; 32],
) -> Result<[u8; 32]> {
    // Combine both keys as input key material
    let mut combined = [0u8; 64];
    combined[..32].copy_from_slice(signing_key);
    combined[32..].copy_from_slice(encryption_key);

    let hkdf = Hkdf::<Sha256>::new(None, &combined);

    let mut storage_key = [0u8; 32];
    hkdf.expand(domain::STORAGE_ENCRYPTION, &mut storage_key)
        .map_err(|_| Error::KeyDerivationFailed("Failed to derive storage key".into()))?;

    // Zeroize combined key material
    combined.zeroize();

    Ok(storage_key)
}

/// Derive multiple keys from a shared secret for different purposes
///
/// Useful when you need multiple independent keys from one DH exchange.
///
/// ## Example Use Case
///
/// ```text
/// Shared Secret
///       │
///       ├──► Key for Alice → Bob messages
///       ├──► Key for Bob → Alice messages
///       └──► Key for read receipts
/// ```
#[allow(dead_code)]
pub fn derive_multiple_keys<const N: usize>(
    shared_secret: &[u8; 32],
    salt: &[u8],
    infos: &[&[u8]; N],
) -> Result<[[u8; 32]; N]> {
    let hkdf = Hkdf::<Sha256>::new(Some(salt), shared_secret);

    let mut keys = [[0u8; 32]; N];
    for (i, info) in infos.iter().enumerate() {
        hkdf.expand(info, &mut keys[i])
            .map_err(|_| Error::KeyDerivationFailed(format!(
                "Failed to derive key {}", i
            )))?;
    }

    Ok(keys)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_derive_keys_deterministic() {
        let seed = [42u8; 32];

        let keys1 = derive_keys_from_seed(&seed).unwrap();
        let keys2 = derive_keys_from_seed(&seed).unwrap();

        assert_eq!(keys1.signing_key, keys2.signing_key);
        assert_eq!(keys1.encryption_key, keys2.encryption_key);
    }

    #[test]
    fn test_derive_keys_different_seeds() {
        let seed1 = [1u8; 32];
        let seed2 = [2u8; 32];

        let keys1 = derive_keys_from_seed(&seed1).unwrap();
        let keys2 = derive_keys_from_seed(&seed2).unwrap();

        assert_ne!(keys1.signing_key, keys2.signing_key);
        assert_ne!(keys1.encryption_key, keys2.encryption_key);
    }

    #[test]
    fn test_signing_encryption_keys_different() {
        let seed = [42u8; 32];
        let keys = derive_keys_from_seed(&seed).unwrap();

        // Signing and encryption keys should be different
        assert_ne!(keys.signing_key, keys.encryption_key);
    }

    #[test]
    fn test_shared_secret_derivation() {
        let dh_output = [42u8; 32];
        let conversation_id = b"conv-123";

        let key1 = derive_shared_secret(&dh_output, conversation_id).unwrap();
        let key2 = derive_shared_secret(&dh_output, conversation_id).unwrap();

        assert_eq!(key1, key2);
    }

    #[test]
    fn test_different_conversations_different_keys() {
        let dh_output = [42u8; 32];

        let key1 = derive_shared_secret(&dh_output, b"conv-1").unwrap();
        let key2 = derive_shared_secret(&dh_output, b"conv-2").unwrap();

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_derive_multiple_keys() {
        let shared = [42u8; 32];
        let salt = b"test-salt";
        let infos: [&[u8]; 3] = [b"key1", b"key2", b"key3"];

        let keys = derive_multiple_keys(&shared, salt, &infos).unwrap();

        // All keys should be different
        assert_ne!(keys[0], keys[1]);
        assert_ne!(keys[1], keys[2]);
        assert_ne!(keys[0], keys[2]);
    }

    #[test]
    fn test_storage_key_derivation() {
        let signing = [1u8; 32];
        let encryption = [2u8; 32];

        let key1 = derive_storage_key(&signing, &encryption).unwrap();
        let key2 = derive_storage_key(&signing, &encryption).unwrap();

        assert_eq!(key1, key2);
    }
}
