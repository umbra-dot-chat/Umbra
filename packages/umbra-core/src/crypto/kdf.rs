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

    /// Domain for per-file encryption key derivation
    pub const FILE_ENCRYPTION: &[u8] = b"umbra-file-encryption-v1";

    /// Domain for community channel file encryption key derivation
    pub const CHANNEL_FILE_ENCRYPTION: &[u8] = b"umbra-channel-file-encryption-v1";

    /// Domain for key fingerprint derivation
    pub const KEY_FINGERPRINT: &[u8] = b"umbra-key-fingerprint-v1";
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

/// Derive a unique encryption key for a specific file.
///
/// Uses HKDF-SHA256 with the shared secret (from ECDH) as input key material,
/// the file_id as salt, and the file encryption domain string as info.
///
/// ## Parameters
///
/// - `shared_secret`: The 32-byte ECDH shared secret for the conversation
/// - `file_id`: Unique file identifier, used as salt for domain separation
///
/// ## Returns
///
/// 32-byte AES-256-GCM encryption key unique to this file.
///
/// ## Security
///
/// Each file gets its own encryption key derived from the conversation's shared
/// secret. This means:
/// - Compromise of one file key doesn't affect other files
/// - Both conversation participants independently derive the same key
/// - Key is bound to both the conversation (via shared_secret) and the file (via file_id)
pub fn derive_file_key(
    shared_secret: &[u8; 32],
    file_id: &[u8],
) -> Result<[u8; 32]> {
    let hkdf = Hkdf::<Sha256>::new(Some(file_id), shared_secret);

    let mut key = [0u8; 32];
    hkdf.expand(domain::FILE_ENCRYPTION, &mut key)
        .map_err(|_| Error::KeyDerivationFailed("Failed to derive file encryption key".into()))?;

    Ok(key)
}

/// Derive a unique encryption key for a community channel file.
///
/// Uses HKDF-SHA256 with the channel's group key as input key material,
/// `file_id || key_version` as salt, and the channel file encryption domain
/// string as info.
///
/// ## Parameters
///
/// - `channel_key`: The 32-byte group encryption key for the community channel
/// - `file_id`: Unique file identifier
/// - `key_version`: Key version number (for key rotation tracking)
///
/// ## Returns
///
/// 32-byte AES-256-GCM encryption key unique to this file and key version.
///
/// ## Security
///
/// Each file gets its own key derived from the channel's group key.
/// The key_version parameter ensures that after key rotation, new file keys
/// are derived from the new channel key, enabling on-access re-encryption.
pub fn derive_channel_file_key(
    channel_key: &[u8; 32],
    file_id: &[u8],
    key_version: u32,
) -> Result<[u8; 32]> {
    // Build salt: file_id || key_version (little-endian)
    let mut salt = Vec::with_capacity(file_id.len() + 4);
    salt.extend_from_slice(file_id);
    salt.extend_from_slice(&key_version.to_le_bytes());

    let hkdf = Hkdf::<Sha256>::new(Some(&salt), channel_key);

    let mut key = [0u8; 32];
    hkdf.expand(domain::CHANNEL_FILE_ENCRYPTION, &mut key)
        .map_err(|_| Error::KeyDerivationFailed("Failed to derive channel file key".into()))?;

    Ok(key)
}

/// Compute a short fingerprint of an encryption key for verification.
///
/// Used for automatic key verification between peers. Both sides independently
/// derive the file key and compute its fingerprint. If fingerprints match,
/// they have the same key and no MITM attack occurred.
///
/// ## Parameters
///
/// - `key`: The encryption key to fingerprint
///
/// ## Returns
///
/// 8-byte fingerprint as a hex string (16 characters).
///
/// ## Security
///
/// The fingerprint is intentionally short (64 bits) since it's used for
/// UI display and comparison, not for security-critical operations.
/// A 64-bit fingerprint has a collision probability of ~1 in 2^32 per
/// comparison, which is sufficient for key verification.
pub fn compute_key_fingerprint(key: &[u8; 32]) -> Result<String> {
    let hkdf = Hkdf::<Sha256>::new(None, key);

    let mut fingerprint = [0u8; 8];
    hkdf.expand(domain::KEY_FINGERPRINT, &mut fingerprint)
        .map_err(|_| Error::KeyDerivationFailed("Failed to compute key fingerprint".into()))?;

    Ok(hex::encode(fingerprint))
}

/// Verify that two peers derived the same file encryption key by comparing
/// fingerprints.
///
/// ## Parameters
///
/// - `local_key`: Our locally derived encryption key
/// - `remote_fingerprint`: The fingerprint received from the remote peer
///
/// ## Returns
///
/// `true` if the fingerprints match, `false` if they don't (possible MITM).
pub fn verify_key_fingerprint(
    local_key: &[u8; 32],
    remote_fingerprint: &str,
) -> Result<bool> {
    let local_fingerprint = compute_key_fingerprint(local_key)?;
    Ok(local_fingerprint == remote_fingerprint)
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

    #[test]
    fn test_file_key_deterministic() {
        let shared_secret = [42u8; 32];
        let file_id = b"file-abc-123";

        let key1 = derive_file_key(&shared_secret, file_id).unwrap();
        let key2 = derive_file_key(&shared_secret, file_id).unwrap();

        assert_eq!(key1, key2);
    }

    #[test]
    fn test_different_files_different_keys() {
        let shared_secret = [42u8; 32];

        let key1 = derive_file_key(&shared_secret, b"file-1").unwrap();
        let key2 = derive_file_key(&shared_secret, b"file-2").unwrap();

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_different_secrets_different_file_keys() {
        let secret1 = [1u8; 32];
        let secret2 = [2u8; 32];
        let file_id = b"file-abc";

        let key1 = derive_file_key(&secret1, file_id).unwrap();
        let key2 = derive_file_key(&secret2, file_id).unwrap();

        assert_ne!(key1, key2);
    }

    // ========================================================================
    // Channel file key tests
    // ========================================================================

    #[test]
    fn test_channel_file_key_deterministic() {
        let channel_key = [42u8; 32];
        let file_id = b"file-abc-123";
        let key_version = 1u32;

        let key1 = derive_channel_file_key(&channel_key, file_id, key_version).unwrap();
        let key2 = derive_channel_file_key(&channel_key, file_id, key_version).unwrap();

        assert_eq!(key1, key2);
    }

    #[test]
    fn test_channel_file_key_different_files() {
        let channel_key = [42u8; 32];

        let key1 = derive_channel_file_key(&channel_key, b"file-1", 1).unwrap();
        let key2 = derive_channel_file_key(&channel_key, b"file-2", 1).unwrap();

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_channel_file_key_different_versions() {
        let channel_key = [42u8; 32];
        let file_id = b"file-abc";

        let key1 = derive_channel_file_key(&channel_key, file_id, 1).unwrap();
        let key2 = derive_channel_file_key(&channel_key, file_id, 2).unwrap();

        // Different key versions produce different file keys (for rotation)
        assert_ne!(key1, key2);
    }

    #[test]
    fn test_channel_file_key_different_channel_keys() {
        let key1 = derive_channel_file_key(&[1u8; 32], b"file-abc", 1).unwrap();
        let key2 = derive_channel_file_key(&[2u8; 32], b"file-abc", 1).unwrap();

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_channel_vs_dm_file_keys_differ() {
        // Channel and DM keys should differ even with same input material
        let key_material = [42u8; 32];
        let file_id = b"file-abc";

        let channel_key = derive_channel_file_key(&key_material, file_id, 1).unwrap();
        let dm_key = derive_file_key(&key_material, file_id).unwrap();

        // Different domain strings ensure different keys
        assert_ne!(channel_key, dm_key);
    }

    // ========================================================================
    // Key fingerprint tests
    // ========================================================================

    #[test]
    fn test_key_fingerprint_deterministic() {
        let key = [42u8; 32];

        let fp1 = compute_key_fingerprint(&key).unwrap();
        let fp2 = compute_key_fingerprint(&key).unwrap();

        assert_eq!(fp1, fp2);
    }

    #[test]
    fn test_key_fingerprint_is_hex_16_chars() {
        let key = [42u8; 32];
        let fp = compute_key_fingerprint(&key).unwrap();

        assert_eq!(fp.len(), 16); // 8 bytes = 16 hex chars
        assert!(fp.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn test_different_keys_different_fingerprints() {
        let key1 = [1u8; 32];
        let key2 = [2u8; 32];

        let fp1 = compute_key_fingerprint(&key1).unwrap();
        let fp2 = compute_key_fingerprint(&key2).unwrap();

        assert_ne!(fp1, fp2);
    }

    #[test]
    fn test_verify_key_fingerprint_match() {
        let key = [42u8; 32];
        let fingerprint = compute_key_fingerprint(&key).unwrap();

        assert!(verify_key_fingerprint(&key, &fingerprint).unwrap());
    }

    #[test]
    fn test_verify_key_fingerprint_mismatch() {
        let key = [42u8; 32];

        assert!(!verify_key_fingerprint(&key, "0000000000000000").unwrap());
    }
}
