//! # Key Management
//!
//! This module handles cryptographic key generation and management.
//!
//! ## Key Types
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                          KEY TYPES                                      │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  SigningKeyPair (Ed25519)                                       │   │
//! │  │  ─────────────────────────                                       │   │
//! │  │                                                                  │   │
//! │  │  Purpose:                                                       │   │
//! │  │  • Proving identity (signing messages)                          │   │
//! │  │  • Verifying authenticity of received messages                  │   │
//! │  │  • Deriving libp2p PeerId                                       │   │
//! │  │                                                                  │   │
//! │  │  Format:                                                        │   │
//! │  │  • Private key: 32 bytes (kept secret, zeroized on drop)       │   │
//! │  │  • Public key: 32 bytes (shared freely)                        │   │
//! │  │                                                                  │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  EncryptionKeyPair (X25519)                                     │   │
//! │  │  ─────────────────────────────                                   │   │
//! │  │                                                                  │   │
//! │  │  Purpose:                                                       │   │
//! │  │  • Key exchange with peers (ECDH)                               │   │
//! │  │  • Deriving shared secrets for E2E encryption                   │   │
//! │  │                                                                  │   │
//! │  │  Format:                                                        │   │
//! │  │  • Private key: 32 bytes (kept secret, zeroized on drop)       │   │
//! │  │  • Public key: 32 bytes (shared with friends)                  │   │
//! │  │                                                                  │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │  KeyPair (Combined)                                             │   │
//! │  │  ────────────────────                                            │   │
//! │  │                                                                  │   │
//! │  │  Contains both signing and encryption keypairs.                 │   │
//! │  │  This is the main key structure for a user's identity.          │   │
//! │  │                                                                  │   │
//! │  │  ┌───────────────┐    ┌───────────────┐                        │   │
//! │  │  │ SigningKeyPair│    │EncryptionKey  │                        │   │
//! │  │  │               │    │ Pair          │                        │   │
//! │  │  └───────────────┘    └───────────────┘                        │   │
//! │  │                                                                  │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use ed25519_dalek::{SigningKey, VerifyingKey};
use x25519_dalek::{PublicKey as X25519PublicKey, StaticSecret};
use rand::rngs::OsRng;
use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

use crate::error::{Error, Result};

/// Combined keypair containing both signing and encryption keys
///
/// ## Security
///
/// - Private keys are zeroized when this struct is dropped
/// - Keys are derived from a common seed for backup simplicity
/// - Public keys can be safely shared with anyone
#[derive(ZeroizeOnDrop)]
pub struct KeyPair {
    /// Ed25519 keypair for signing
    pub signing: SigningKeyPair,
    /// X25519 keypair for encryption
    pub encryption: EncryptionKeyPair,
}

impl KeyPair {
    /// Generate a new random keypair
    ///
    /// Uses the operating system's secure random number generator.
    ///
    /// ## Security Note
    ///
    /// This creates keys that cannot be recovered without backup.
    /// For user-facing key generation, use `from_seed()` with a
    /// BIP39-derived seed instead.
    pub fn generate() -> Self {
        Self {
            signing: SigningKeyPair::generate(),
            encryption: EncryptionKeyPair::generate(),
        }
    }

    /// Create a keypair from a 32-byte seed
    ///
    /// This is deterministic: the same seed always produces the same keys.
    ///
    /// ## Key Derivation
    ///
    /// ```text
    /// Seed (32 bytes)
    ///       │
    ///       ├──► HKDF(seed, "umbra-signing-v1")   → Signing Key
    ///       │
    ///       └──► HKDF(seed, "umbra-encryption-v1") → Encryption Key
    /// ```
    pub fn from_seed(seed: &[u8; 32]) -> Result<Self> {
        use crate::crypto::kdf::derive_keys_from_seed;

        let derived = derive_keys_from_seed(seed)?;

        Ok(Self {
            signing: SigningKeyPair::from_bytes(&derived.signing_key)?,
            encryption: EncryptionKeyPair::from_bytes(&derived.encryption_key),
        })
    }

    /// Get the public keys for sharing with others
    pub fn public_keys(&self) -> PublicKey {
        PublicKey {
            signing: self.signing.public_bytes(),
            encryption: self.encryption.public_bytes(),
        }
    }
}

/// Ed25519 signing keypair
#[derive(ZeroizeOnDrop)]
pub struct SigningKeyPair {
    /// Private signing key (secret)
    #[zeroize(skip)] // ed25519_dalek::SigningKey handles its own zeroization
    secret: SigningKey,
}

impl SigningKeyPair {
    /// Generate a new random signing keypair
    pub fn generate() -> Self {
        let secret = SigningKey::generate(&mut OsRng);
        Self { secret }
    }

    /// Create from raw bytes
    pub fn from_bytes(bytes: &[u8; 32]) -> Result<Self> {
        let secret = SigningKey::from_bytes(bytes);
        Ok(Self { secret })
    }

    /// Get the secret key bytes (for backup/storage)
    ///
    /// ## Security Warning
    ///
    /// Only use this for secure storage. Never log or transmit these bytes.
    pub fn secret_bytes(&self) -> [u8; 32] {
        self.secret.to_bytes()
    }

    /// Get the public key bytes
    pub fn public_bytes(&self) -> [u8; 32] {
        self.secret.verifying_key().to_bytes()
    }

    /// Get the verifying key for signature verification
    pub fn verifying_key(&self) -> VerifyingKey {
        self.secret.verifying_key()
    }

    /// Get reference to the signing key
    pub(crate) fn signing_key(&self) -> &SigningKey {
        &self.secret
    }
}

/// X25519 encryption keypair for key exchange
#[derive(ZeroizeOnDrop)]
pub struct EncryptionKeyPair {
    /// Private encryption key (secret)
    #[zeroize(skip)] // x25519_dalek handles its own zeroization
    secret: StaticSecret,
    /// Public encryption key (derived from secret)
    public: X25519PublicKey,
}

impl EncryptionKeyPair {
    /// Generate a new random encryption keypair
    pub fn generate() -> Self {
        let secret = StaticSecret::random_from_rng(OsRng);
        let public = X25519PublicKey::from(&secret);
        Self { secret, public }
    }

    /// Create from raw bytes
    pub fn from_bytes(bytes: &[u8; 32]) -> Self {
        let secret = StaticSecret::from(*bytes);
        let public = X25519PublicKey::from(&secret);
        Self { secret, public }
    }

    /// Get the secret key bytes (for backup/storage)
    ///
    /// ## Security Warning
    ///
    /// Only use this for secure storage. Never log or transmit these bytes.
    pub fn secret_bytes(&self) -> [u8; 32] {
        self.secret.to_bytes()
    }

    /// Get the public key bytes
    pub fn public_bytes(&self) -> [u8; 32] {
        self.public.to_bytes()
    }

    /// Perform Diffie-Hellman key exchange
    ///
    /// Returns a shared secret that both parties can compute:
    /// - Alice: alice_secret × bob_public
    /// - Bob: bob_secret × alice_public
    ///
    /// Both computations produce the same shared secret.
    pub fn diffie_hellman(&self, their_public: &[u8; 32]) -> [u8; 32] {
        let their_public = X25519PublicKey::from(*their_public);
        self.secret.diffie_hellman(&their_public).to_bytes()
    }
}

/// Public keys that can be safely shared with others
///
/// This contains only public information and can be serialized,
/// transmitted, and stored without security concerns.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PublicKey {
    /// Ed25519 public key for signature verification (32 bytes)
    #[serde(with = "hex_bytes")]
    pub signing: [u8; 32],

    /// X25519 public key for encryption (32 bytes)
    #[serde(with = "hex_bytes")]
    pub encryption: [u8; 32],
}

impl PublicKey {
    /// Create a PublicKey from raw bytes
    pub fn from_bytes(signing: [u8; 32], encryption: [u8; 32]) -> Self {
        Self { signing, encryption }
    }

    /// Get the verifying key for signature verification
    pub fn verifying_key(&self) -> Result<VerifyingKey> {
        VerifyingKey::from_bytes(&self.signing)
            .map_err(|e| Error::InvalidKey(format!("Invalid signing public key: {}", e)))
    }

    /// Encode as hex string (for display/QR codes)
    pub fn to_hex(&self) -> String {
        format!("{}{}", hex::encode(self.signing), hex::encode(self.encryption))
    }

    /// Decode from hex string
    pub fn from_hex(hex_str: &str) -> Result<Self> {
        if hex_str.len() != 128 {
            return Err(Error::InvalidKey("Public key hex must be 128 characters".into()));
        }

        let bytes = hex::decode(hex_str)
            .map_err(|e| Error::InvalidKey(format!("Invalid hex: {}", e)))?;

        let signing: [u8; 32] = bytes[0..32]
            .try_into()
            .map_err(|_| Error::InvalidKey("Invalid signing key length".into()))?;

        let encryption: [u8; 32] = bytes[32..64]
            .try_into()
            .map_err(|_| Error::InvalidKey("Invalid encryption key length".into()))?;

        Ok(Self { signing, encryption })
    }
}

/// Serde helper for serializing byte arrays as hex
mod hex_bytes {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &[u8; 32], serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&hex::encode(bytes))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<[u8; 32], D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        let bytes = hex::decode(&s).map_err(serde::de::Error::custom)?;
        bytes.try_into().map_err(|_| serde::de::Error::custom("Invalid length"))
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_keypair_generation() {
        let kp1 = KeyPair::generate();
        let kp2 = KeyPair::generate();

        // Keys should be different
        assert_ne!(kp1.signing.public_bytes(), kp2.signing.public_bytes());
        assert_ne!(kp1.encryption.public_bytes(), kp2.encryption.public_bytes());
    }

    #[test]
    fn test_keypair_from_seed() {
        let seed = [42u8; 32];

        let kp1 = KeyPair::from_seed(&seed).unwrap();
        let kp2 = KeyPair::from_seed(&seed).unwrap();

        // Same seed should produce same keys
        assert_eq!(kp1.signing.public_bytes(), kp2.signing.public_bytes());
        assert_eq!(kp1.encryption.public_bytes(), kp2.encryption.public_bytes());
    }

    #[test]
    fn test_diffie_hellman() {
        let alice = EncryptionKeyPair::generate();
        let bob = EncryptionKeyPair::generate();

        // Both parties should derive the same shared secret
        let alice_shared = alice.diffie_hellman(&bob.public_bytes());
        let bob_shared = bob.diffie_hellman(&alice.public_bytes());

        assert_eq!(alice_shared, bob_shared);
    }

    #[test]
    fn test_public_key_serialization() {
        let kp = KeyPair::generate();
        let public = kp.public_keys();

        // Serialize to JSON
        let json = serde_json::to_string(&public).unwrap();
        let restored: PublicKey = serde_json::from_str(&json).unwrap();

        assert_eq!(public, restored);
    }

    #[test]
    fn test_public_key_hex() {
        let kp = KeyPair::generate();
        let public = kp.public_keys();

        let hex = public.to_hex();
        let restored = PublicKey::from_hex(&hex).unwrap();

        assert_eq!(public, restored);
    }
}
