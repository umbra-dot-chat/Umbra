//! # Encryption Module
//!
//! Provides AES-256-GCM encryption for message confidentiality and integrity.
//!
//! ## Encryption Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      MESSAGE ENCRYPTION FLOW                            │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  SENDER (Alice)                                                        │
//! │  ─────────────────────────────────────────────────────────────────      │
//! │                                                                         │
//! │  Step 1: Derive Shared Secret (once per conversation)                  │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  Alice's X25519 Private Key                                  │       │
//! │  │           ×                                                  │       │
//! │  │  Bob's X25519 Public Key                                     │       │
//! │  │           ↓                                                  │       │
//! │  │  Shared Secret (32 bytes)                                    │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 2: Derive Encryption Key (from shared secret)                    │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  HKDF-SHA256(                                                │       │
//! │  │    ikm = shared_secret,                                     │       │
//! │  │    salt = conversation_id,                                  │       │
//! │  │    info = "umbra-message-encryption-v1"                     │       │
//! │  │  )                                                          │       │
//! │  │           ↓                                                  │       │
//! │  │  Encryption Key (32 bytes)                                   │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 3: Generate Nonce (unique per message)                           │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  Random 12 bytes from CSPRNG                                 │       │
//! │  │  (Never reuse a nonce with the same key!)                   │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 4: Encrypt                                                       │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  AES-256-GCM(                                                │       │
//! │  │    key = encryption_key,                                    │       │
//! │  │    nonce = random_nonce,                                    │       │
//! │  │    plaintext = message,                                     │       │
//! │  │    aad = (sender_did || recipient_did || timestamp)        │       │
//! │  │  )                                                          │       │
//! │  │           ↓                                                  │       │
//! │  │  Ciphertext + 16-byte Auth Tag                              │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Output: (nonce, ciphertext_with_tag)                                  │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//!
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      MESSAGE DECRYPTION FLOW                            │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  RECIPIENT (Bob)                                                       │
//! │  ─────────────────────────────────────────────────────────────────      │
//! │                                                                         │
//! │  Step 1: Derive Same Shared Secret                                     │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  Bob's X25519 Private Key                                    │       │
//! │  │           ×                                                  │       │
//! │  │  Alice's X25519 Public Key                                   │       │
//! │  │           ↓                                                  │       │
//! │  │  Shared Secret (32 bytes) [SAME as Alice computed]          │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 2: Derive Same Encryption Key                                    │
//! │  [Same HKDF process as sender]                                         │
//! │                                                                         │
//! │  Step 3: Decrypt                                                       │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  AES-256-GCM-Decrypt(                                        │       │
//! │  │    key = encryption_key,                                    │       │
//! │  │    nonce = received_nonce,                                  │       │
//! │  │    ciphertext = received_ciphertext,                        │       │
//! │  │    aad = (sender_did || recipient_did || timestamp)        │       │
//! │  │  )                                                          │       │
//! │  │           ↓                                                  │       │
//! │  │  Plaintext (or Error if tampered)                           │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Security Properties
//!
//! | Property | Guarantee |
//! |----------|-----------|
//! | Confidentiality | Only sender and recipient can read the message |
//! | Integrity | Any modification is detected |
//! | Authenticity | AAD binds the message to sender/recipient/time |
//! | Forward Secrecy | (V2) Past messages can't be decrypted if keys leak |

use aes_gcm::{
    aead::{Aead, KeyInit, Payload},
    Aes256Gcm, Nonce as AesNonce,
};
use rand::RngCore;
use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::error::{Error, Result};

/// Size of the AES-GCM nonce in bytes (96 bits)
pub const NONCE_SIZE: usize = 12;

/// Size of the AES-GCM authentication tag in bytes (128 bits)
pub const TAG_SIZE: usize = 16;

/// Size of the encryption key in bytes (256 bits)
pub const KEY_SIZE: usize = 32;

/// A nonce (number used once) for AES-GCM encryption
///
/// ## Critical Security Requirement
///
/// **NEVER reuse a nonce with the same key!**
///
/// Nonce reuse completely breaks AES-GCM security:
/// - Allows recovering the authentication key
/// - Allows forging messages
/// - May allow recovering plaintext
///
/// We use random nonces, which are safe for up to 2^32 messages
/// per key (birthday bound for 96-bit nonces).
#[derive(Clone, Copy, Debug)]
pub struct Nonce(pub [u8; NONCE_SIZE]);

impl Nonce {
    /// Generate a cryptographically random nonce
    pub fn random() -> Result<Self> {
        let mut bytes = [0u8; NONCE_SIZE];
        rand::rngs::OsRng.fill_bytes(&mut bytes);
        Ok(Self(bytes))
    }

    /// Create from existing bytes
    pub fn from_bytes(bytes: [u8; NONCE_SIZE]) -> Self {
        Self(bytes)
    }

    /// Get the raw bytes
    pub fn as_bytes(&self) -> &[u8; NONCE_SIZE] {
        &self.0
    }
}

/// A shared secret derived from X25519 key exchange
///
/// This is used to derive encryption keys via HKDF.
#[derive(ZeroizeOnDrop)]
pub struct SharedSecret {
    #[zeroize(skip)]
    bytes: [u8; 32],
}

impl SharedSecret {
    /// Create from raw DH output
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self { bytes }
    }

    /// Get the raw bytes (for key derivation)
    pub(crate) fn as_bytes(&self) -> &[u8; 32] {
        &self.bytes
    }

    /// Derive an encryption key from this shared secret
    ///
    /// Uses HKDF-SHA256 with the conversation ID as salt.
    pub fn derive_key(&self, conversation_id: &[u8]) -> Result<EncryptionKey> {
        use hkdf::Hkdf;
        use sha2::Sha256;

        let hkdf = Hkdf::<Sha256>::new(Some(conversation_id), &self.bytes);
        let mut key = [0u8; KEY_SIZE];
        hkdf.expand(b"umbra-message-encryption-v1", &mut key)
            .map_err(|_| Error::KeyDerivationFailed("HKDF expansion failed".into()))?;

        Ok(EncryptionKey(key))
    }
}

/// An AES-256-GCM encryption key
///
/// Zeroized when dropped for security.
#[derive(ZeroizeOnDrop)]
pub struct EncryptionKey([u8; KEY_SIZE]);

impl EncryptionKey {
    /// Create from raw bytes
    pub fn from_bytes(bytes: [u8; KEY_SIZE]) -> Self {
        Self(bytes)
    }
}

/// Encrypt a message using AES-256-GCM
///
/// ## Parameters
///
/// - `key`: 256-bit encryption key
/// - `plaintext`: Message to encrypt
/// - `aad`: Additional authenticated data (not encrypted, but authenticated)
///
/// ## Returns
///
/// Tuple of (nonce, ciphertext_with_tag)
///
/// ## Example
///
/// ```ignore
/// let key = EncryptionKey::from_bytes([0u8; 32]);
/// let (nonce, ciphertext) = encrypt(&key, b"Hello, Bob!", b"context")?;
/// ```
pub fn encrypt(
    key: &EncryptionKey,
    plaintext: &[u8],
    aad: &[u8],
) -> Result<(Nonce, Vec<u8>)> {
    let nonce = Nonce::random()?;
    let cipher = Aes256Gcm::new_from_slice(&key.0)
        .map_err(|e| Error::EncryptionFailed(format!("Invalid key: {}", e)))?;

    let payload = Payload {
        msg: plaintext,
        aad,
    };

    let ciphertext = cipher
        .encrypt(AesNonce::from_slice(&nonce.0), payload)
        .map_err(|e| Error::EncryptionFailed(format!("Encryption failed: {}", e)))?;

    Ok((nonce, ciphertext))
}

/// Decrypt a message using AES-256-GCM
///
/// ## Parameters
///
/// - `key`: 256-bit encryption key (must be same as used for encryption)
/// - `nonce`: Nonce used during encryption
/// - `ciphertext`: Ciphertext with authentication tag
/// - `aad`: Additional authenticated data (must match encryption)
///
/// ## Returns
///
/// Decrypted plaintext
///
/// ## Errors
///
/// Returns `DecryptionFailed` if:
/// - The ciphertext was tampered with
/// - The AAD doesn't match
/// - The key is wrong
/// - The nonce is wrong
pub fn decrypt(
    key: &EncryptionKey,
    nonce: &Nonce,
    ciphertext: &[u8],
    aad: &[u8],
) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new_from_slice(&key.0)
        .map_err(|e| Error::DecryptionFailed(format!("Invalid key: {}", e)))?;

    let payload = Payload {
        msg: ciphertext,
        aad,
    };

    cipher
        .decrypt(AesNonce::from_slice(&nonce.0), payload)
        .map_err(|_| Error::DecryptionFailed("Decryption failed: authentication tag mismatch".into()))
}

/// Encrypt a message for a specific recipient
///
/// This is a higher-level function that handles key derivation.
///
/// ## Flow
///
/// ```text
/// ┌─────────────────────────────────────────────────────────────────────────┐
/// │  encrypt_for_recipient()                                               │
/// ├─────────────────────────────────────────────────────────────────────────┤
/// │                                                                         │
/// │  1. X25519 DH: our_private × their_public → shared_secret              │
/// │                                                                         │
/// │  2. HKDF: shared_secret + conversation_id → encryption_key             │
/// │                                                                         │
/// │  3. AES-GCM: encrypt(key, nonce, plaintext, aad)                       │
/// │                                                                         │
/// │  Output: (nonce, ciphertext)                                           │
/// │                                                                         │
/// └─────────────────────────────────────────────────────────────────────────┘
/// ```
pub fn encrypt_for_recipient(
    our_encryption_key: &super::EncryptionKeyPair,
    their_public_key: &[u8; 32],
    conversation_id: &[u8],
    plaintext: &[u8],
    aad: &[u8],
) -> Result<(Nonce, Vec<u8>)> {
    // Perform DH key exchange
    let dh_output = our_encryption_key.diffie_hellman(their_public_key);
    let shared_secret = SharedSecret::from_bytes(dh_output);

    // Derive encryption key
    let encryption_key = shared_secret.derive_key(conversation_id)?;

    // Encrypt
    encrypt(&encryption_key, plaintext, aad)
}

/// Decrypt a message from a sender
///
/// This is a higher-level function that handles key derivation.
pub fn decrypt_from_sender(
    our_encryption_key: &super::EncryptionKeyPair,
    their_public_key: &[u8; 32],
    conversation_id: &[u8],
    nonce: &Nonce,
    ciphertext: &[u8],
    aad: &[u8],
) -> Result<Vec<u8>> {
    // Perform DH key exchange (produces same shared secret as sender)
    let dh_output = our_encryption_key.diffie_hellman(their_public_key);
    let shared_secret = SharedSecret::from_bytes(dh_output);

    // Derive encryption key
    let encryption_key = shared_secret.derive_key(conversation_id)?;

    // Decrypt
    decrypt(&encryption_key, nonce, ciphertext, aad)
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::EncryptionKeyPair;

    #[test]
    fn test_encrypt_decrypt_basic() {
        let key = EncryptionKey::from_bytes([42u8; 32]);
        let plaintext = b"Hello, World!";
        let aad = b"context";

        let (nonce, ciphertext) = encrypt(&key, plaintext, aad).unwrap();
        let decrypted = decrypt(&key, &nonce, &ciphertext, aad).unwrap();

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_encrypt_decrypt_empty() {
        let key = EncryptionKey::from_bytes([42u8; 32]);
        let plaintext = b"";
        let aad = b"";

        let (nonce, ciphertext) = encrypt(&key, plaintext, aad).unwrap();
        let decrypted = decrypt(&key, &nonce, &ciphertext, aad).unwrap();

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_tampered_ciphertext_fails() {
        let key = EncryptionKey::from_bytes([42u8; 32]);
        let plaintext = b"Hello, World!";
        let aad = b"context";

        let (nonce, mut ciphertext) = encrypt(&key, plaintext, aad).unwrap();

        // Tamper with ciphertext
        if !ciphertext.is_empty() {
            ciphertext[0] ^= 0xFF;
        }

        let result = decrypt(&key, &nonce, &ciphertext, aad);
        assert!(result.is_err());
    }

    #[test]
    fn test_wrong_aad_fails() {
        let key = EncryptionKey::from_bytes([42u8; 32]);
        let plaintext = b"Hello, World!";
        let aad = b"context";

        let (nonce, ciphertext) = encrypt(&key, plaintext, aad).unwrap();
        let result = decrypt(&key, &nonce, &ciphertext, b"wrong context");

        assert!(result.is_err());
    }

    #[test]
    fn test_encrypt_for_recipient_round_trip() {
        let alice = EncryptionKeyPair::generate();
        let bob = EncryptionKeyPair::generate();

        let conversation_id = b"conv-123";
        let plaintext = b"Secret message for Bob";
        let aad = b"alice-did|bob-did|timestamp";

        // Alice encrypts for Bob
        let (nonce, ciphertext) = encrypt_for_recipient(
            &alice,
            &bob.public_bytes(),
            conversation_id,
            plaintext,
            aad,
        ).unwrap();

        // Bob decrypts from Alice
        let decrypted = decrypt_from_sender(
            &bob,
            &alice.public_bytes(),
            conversation_id,
            &nonce,
            &ciphertext,
            aad,
        ).unwrap();

        assert_eq!(decrypted, plaintext);
    }

    #[test]
    fn test_different_nonces_produce_different_ciphertext() {
        let key = EncryptionKey::from_bytes([42u8; 32]);
        let plaintext = b"Hello, World!";
        let aad = b"context";

        let (_, ct1) = encrypt(&key, plaintext, aad).unwrap();
        let (_, ct2) = encrypt(&key, plaintext, aad).unwrap();

        // Random nonces should produce different ciphertexts
        assert_ne!(ct1, ct2);
    }
}
