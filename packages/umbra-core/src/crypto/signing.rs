//! # Digital Signatures Module
//!
//! Provides Ed25519 digital signatures for message authentication and integrity.
//!
//! ## Signature Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         SIGNING FLOW                                    │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  SENDER (Alice)                                                        │
//! │  ─────────────────────────────────────────────────────────────────      │
//! │                                                                         │
//! │  Input: Message to sign                                                │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  ┌──────────────┐                                          │       │
//! │  │  │   Message    │                                          │       │
//! │  │  │              │                                          │       │
//! │  │  │  "Hello Bob" │                                          │       │
//! │  │  └──────┬───────┘                                          │       │
//! │  │         │                                                   │       │
//! │  │         ▼                                                   │       │
//! │  │  ┌──────────────────────────────────────────┐              │       │
//! │  │  │           Ed25519 Sign                   │              │       │
//! │  │  │                                          │              │       │
//! │  │  │  1. Hash message with SHA-512            │              │       │
//! │  │  │  2. Sign hash with private key           │              │       │
//! │  │  │  3. Produce 64-byte signature            │              │       │
//! │  │  │                                          │              │       │
//! │  │  │  Key: Alice's Ed25519 Private Key       │              │       │
//! │  │  └──────────────┬───────────────────────────┘              │       │
//! │  │                 │                                           │       │
//! │  │                 ▼                                           │       │
//! │  │  ┌──────────────────────────────────────────┐              │       │
//! │  │  │            Signature                     │              │       │
//! │  │  │                                          │              │       │
//! │  │  │   64 bytes (512 bits)                   │              │       │
//! │  │  │   Deterministic: same message = same sig│              │       │
//! │  │  └──────────────────────────────────────────┘              │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Output: (Message, Signature)                                          │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//!
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                       VERIFICATION FLOW                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  RECIPIENT (Bob) or ANYONE                                             │
//! │  ─────────────────────────────────────────────────────────────────      │
//! │                                                                         │
//! │  Input: Message, Signature, Alice's Public Key                         │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │       │
//! │  │  │   Message    │  │  Signature   │  │ Alice's Pub  │      │       │
//! │  │  │              │  │              │  │    Key       │      │       │
//! │  │  │  "Hello Bob" │  │  64 bytes    │  │  32 bytes    │      │       │
//! │  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │       │
//! │  │         │                 │                 │               │       │
//! │  │         └─────────────────┼─────────────────┘               │       │
//! │  │                           ▼                                 │       │
//! │  │  ┌──────────────────────────────────────────┐              │       │
//! │  │  │          Ed25519 Verify                  │              │       │
//! │  │  │                                          │              │       │
//! │  │  │  1. Hash message with SHA-512            │              │       │
//! │  │  │  2. Verify signature against public key  │              │       │
//! │  │  │  3. Return valid/invalid                 │              │       │
//! │  │  └──────────────┬───────────────────────────┘              │       │
//! │  │                 │                                           │       │
//! │  │                 ▼                                           │       │
//! │  │  ┌──────────────────────────────────────────┐              │       │
//! │  │  │                                          │              │       │
//! │  │  │   ✓ Valid: Message is from Alice        │              │       │
//! │  │  │   ✗ Invalid: Tampered or not from Alice │              │       │
//! │  │  │                                          │              │       │
//! │  │  └──────────────────────────────────────────┘              │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Security Properties
//!
//! | Property | Description |
//! |----------|-------------|
//! | Authenticity | Verifies the message came from the claimed sender |
//! | Integrity | Detects any modification to the signed message |
//! | Non-repudiation | Sender cannot deny having signed the message |
//! | Public Verification | Anyone with public key can verify |
//!
//! ## Why Ed25519?
//!
//! - **Fast**: ~76,000 signatures/second on modern hardware
//! - **Compact**: 64-byte signatures, 32-byte public keys
//! - **Secure**: 128-bit security level
//! - **Deterministic**: Same input always produces same signature
//! - **Resistant**: No known practical attacks

use ed25519_dalek::{Signature as Ed25519Signature, Signer, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};

use crate::crypto::SigningKeyPair;
use crate::error::{Error, Result};

/// Size of an Ed25519 signature in bytes
pub const SIGNATURE_SIZE: usize = 64;

/// An Ed25519 digital signature
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Signature(#[serde(with = "signature_bytes")] pub [u8; SIGNATURE_SIZE]);

impl Signature {
    /// Create from raw bytes
    pub fn from_bytes(bytes: [u8; SIGNATURE_SIZE]) -> Self {
        Self(bytes)
    }

    /// Create from a slice (must be exactly 64 bytes)
    pub fn from_slice(slice: &[u8]) -> Result<Self> {
        if slice.len() != SIGNATURE_SIZE {
            return Err(Error::InvalidKey(format!(
                "Signature must be {} bytes, got {}",
                SIGNATURE_SIZE,
                slice.len()
            )));
        }
        let mut bytes = [0u8; SIGNATURE_SIZE];
        bytes.copy_from_slice(slice);
        Ok(Self(bytes))
    }

    /// Get the raw bytes
    pub fn as_bytes(&self) -> &[u8; SIGNATURE_SIZE] {
        &self.0
    }

    /// Encode as hex string
    pub fn to_hex(&self) -> String {
        hex::encode(self.0)
    }

    /// Decode from hex string
    pub fn from_hex(hex_str: &str) -> Result<Self> {
        let bytes = hex::decode(hex_str)
            .map_err(|e| Error::InvalidKey(format!("Invalid signature hex: {}", e)))?;
        Self::from_slice(&bytes)
    }
}

impl AsRef<[u8]> for Signature {
    fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

/// Sign a message using Ed25519
///
/// ## Parameters
///
/// - `keypair`: The signing keypair (contains private key)
/// - `message`: The message to sign
///
/// ## Returns
///
/// A 64-byte Ed25519 signature
///
/// ## Security Note
///
/// Ed25519 signatures are deterministic: signing the same message
/// with the same key always produces the same signature. This is
/// intentional and provides better security properties than
/// randomized signatures.
///
/// ## Example
///
/// ```ignore
/// let keypair = SigningKeyPair::generate();
/// let signature = sign(&keypair, b"Hello, World!");
/// ```
pub fn sign(keypair: &SigningKeyPair, message: &[u8]) -> Signature {
    let sig = keypair.signing_key().sign(message);
    Signature(sig.to_bytes())
}

/// Verify an Ed25519 signature
///
/// ## Parameters
///
/// - `public_key`: The signer's public key (32 bytes)
/// - `message`: The signed message
/// - `signature`: The signature to verify
///
/// ## Returns
///
/// `Ok(())` if valid, `Err(VerificationFailed)` if invalid
///
/// ## Example
///
/// ```ignore
/// let public_key = keypair.public_bytes();
/// verify(&public_key, b"Hello, World!", &signature)?;
/// ```
pub fn verify(public_key: &[u8; 32], message: &[u8], signature: &Signature) -> Result<()> {
    let verifying_key = VerifyingKey::from_bytes(public_key)
        .map_err(|e| Error::InvalidKey(format!("Invalid public key: {}", e)))?;

    let sig = Ed25519Signature::from_bytes(&signature.0);

    verifying_key
        .verify(message, &sig)
        .map_err(|_| Error::VerificationFailed)
}

/// Verify a signature using a VerifyingKey directly
#[allow(dead_code)]
pub fn verify_with_key(
    verifying_key: &VerifyingKey,
    message: &[u8],
    signature: &Signature,
) -> Result<()> {
    let sig = Ed25519Signature::from_bytes(&signature.0);
    verifying_key
        .verify(message, &sig)
        .map_err(|_| Error::VerificationFailed)
}

/// Serde helper for signature bytes
mod signature_bytes {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &[u8; 64], serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&hex::encode(bytes))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> std::result::Result<[u8; 64], D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        let bytes = hex::decode(&s).map_err(serde::de::Error::custom)?;
        bytes
            .try_into()
            .map_err(|_| serde::de::Error::custom("Invalid signature length"))
    }
}

// ============================================================================
// SIGNED DATA WRAPPER
// ============================================================================

/// A piece of data along with its signature
///
/// This is useful for transmitting signed messages where the signature
/// needs to travel with the data.
///
/// ## Wire Format
///
/// ```text
/// ┌─────────────────────────────────────────────────────────────────────────┐
/// │                        SIGNED DATA FORMAT                               │
/// ├─────────────────────────────────────────────────────────────────────────┤
/// │                                                                         │
/// │  ┌─────────────────────────────────────────────────────────────────┐   │
/// │  │  data: T (serialized)                                           │   │
/// │  │  ─────────────────────                                           │   │
/// │  │  Variable length, depends on T                                  │   │
/// │  └─────────────────────────────────────────────────────────────────┘   │
/// │                                                                         │
/// │  ┌─────────────────────────────────────────────────────────────────┐   │
/// │  │  signer_public_key: 32 bytes                                    │   │
/// │  │  ───────────────────────────                                     │   │
/// │  │  Ed25519 public key of the signer                               │   │
/// │  └─────────────────────────────────────────────────────────────────┘   │
/// │                                                                         │
/// │  ┌─────────────────────────────────────────────────────────────────┐   │
/// │  │  signature: 64 bytes                                            │   │
/// │  │  ─────────────────────                                           │   │
/// │  │  Ed25519 signature over serialized data                         │   │
/// │  └─────────────────────────────────────────────────────────────────┘   │
/// │                                                                         │
/// └─────────────────────────────────────────────────────────────────────────┘
/// ```
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signed<T: Serialize> {
    /// The signed data
    pub data: T,
    /// Public key of the signer
    #[serde(with = "hex_bytes_32")]
    pub signer_public_key: [u8; 32],
    /// Signature over the serialized data
    pub signature: Signature,
}

#[allow(dead_code)]
impl<T: Serialize + for<'de> Deserialize<'de>> Signed<T> {
    /// Create a new signed wrapper
    ///
    /// Signs the serialized form of the data.
    pub fn new(data: T, keypair: &SigningKeyPair) -> Result<Self> {
        let serialized = bincode::serialize(&data)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        let signature = sign(keypair, &serialized);

        Ok(Self {
            data,
            signer_public_key: keypair.public_bytes(),
            signature,
        })
    }

    /// Verify the signature and return the data if valid
    pub fn verify(&self) -> Result<&T> {
        let serialized = bincode::serialize(&self.data)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        verify(&self.signer_public_key, &serialized, &self.signature)?;

        Ok(&self.data)
    }

    /// Verify and consume, returning owned data if valid
    pub fn verify_into(self) -> Result<T> {
        self.verify()?;
        Ok(self.data)
    }
}

/// Serde helper for 32-byte arrays as hex
#[allow(dead_code)]
mod hex_bytes_32 {
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(bytes: &[u8; 32], serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&hex::encode(bytes))
    }

    pub fn deserialize<'de, D>(deserializer: D) -> std::result::Result<[u8; 32], D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        let bytes = hex::decode(&s).map_err(serde::de::Error::custom)?;
        bytes
            .try_into()
            .map_err(|_| serde::de::Error::custom("Invalid length"))
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sign_verify() {
        let keypair = SigningKeyPair::generate();
        let message = b"Hello, World!";

        let signature = sign(&keypair, message);
        let result = verify(&keypair.public_bytes(), message, &signature);

        assert!(result.is_ok());
    }

    #[test]
    fn test_verify_wrong_message_fails() {
        let keypair = SigningKeyPair::generate();
        let message = b"Hello, World!";
        let wrong_message = b"Wrong message!";

        let signature = sign(&keypair, message);
        let result = verify(&keypair.public_bytes(), wrong_message, &signature);

        assert!(result.is_err());
    }

    #[test]
    fn test_verify_wrong_key_fails() {
        let keypair1 = SigningKeyPair::generate();
        let keypair2 = SigningKeyPair::generate();
        let message = b"Hello, World!";

        let signature = sign(&keypair1, message);
        let result = verify(&keypair2.public_bytes(), message, &signature);

        assert!(result.is_err());
    }

    #[test]
    fn test_deterministic_signatures() {
        let keypair = SigningKeyPair::generate();
        let message = b"Hello, World!";

        let sig1 = sign(&keypair, message);
        let sig2 = sign(&keypair, message);

        // Ed25519 is deterministic
        assert_eq!(sig1, sig2);
    }

    #[test]
    fn test_signature_serialization() {
        let keypair = SigningKeyPair::generate();
        let signature = sign(&keypair, b"test");

        let json = serde_json::to_string(&signature).unwrap();
        let restored: Signature = serde_json::from_str(&json).unwrap();

        assert_eq!(signature, restored);
    }

    #[test]
    fn test_signed_wrapper() {
        let keypair = SigningKeyPair::generate();

        #[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
        struct TestData {
            message: String,
            value: u32,
        }

        let data = TestData {
            message: "Hello".to_string(),
            value: 42,
        };

        let signed = Signed::new(data.clone(), &keypair).unwrap();

        // Verify should succeed
        let verified = signed.verify().unwrap();
        assert_eq!(verified.message, data.message);
        assert_eq!(verified.value, data.value);
    }

    #[test]
    fn test_signed_wrapper_tampered() {
        let keypair = SigningKeyPair::generate();

        #[derive(Debug, Clone, Serialize, Deserialize)]
        struct TestData {
            value: u32,
        }

        let data = TestData { value: 42 };
        let mut signed = Signed::new(data, &keypair).unwrap();

        // Tamper with data
        signed.data.value = 999;

        // Verify should fail
        assert!(signed.verify().is_err());
    }
}
