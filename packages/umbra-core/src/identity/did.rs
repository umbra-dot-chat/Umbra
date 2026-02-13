//! # Decentralized Identifiers (DIDs)
//!
//! Implementation of the `did:key` method for Umbra identities.
//!
//! ## DID:key Method
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                        DID:KEY FORMAT                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Example: did:key:z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5...                │
//! │                                                                         │
//! │  ┌─────────┬─────────┬───────────────────────────────────────────┐     │
//! │  │ Scheme  │ Method  │           Method-specific ID              │     │
//! │  ├─────────┼─────────┼───────────────────────────────────────────┤     │
//! │  │  did    │   key   │  z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5...   │     │
//! │  └─────────┴─────────┴───────────────────────────────────────────┘     │
//! │                                                                         │
//! │  Method-specific ID breakdown:                                         │
//! │  ┌─────────┬──────────────────────────────────────────────────────┐    │
//! │  │   z     │  Base58btc encoding indicator (multibase)            │    │
//! │  ├─────────┼──────────────────────────────────────────────────────┤    │
//! │  │  6Mk    │  Ed25519 public key multicodec prefix (0xed01)       │    │
//! │  ├─────────┼──────────────────────────────────────────────────────┤    │
//! │  │  ...    │  32-byte Ed25519 public key (base58btc encoded)      │    │
//! │  └─────────┴──────────────────────────────────────────────────────┘    │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Why DID:key?
//!
//! | Benefit | Description |
//! |---------|-------------|
//! | Self-certifying | DID encodes the public key directly |
//! | No registry | No blockchain or central registry needed |
//! | Offline | Can be created and verified without network |
//! | Standard | W3C DID specification compliant |
//! | Interoperable | Supported by many decentralized identity systems |
//!
//! ## References
//!
//! - [W3C DID Core](https://www.w3.org/TR/did-core/)
//! - [DID:key Method](https://w3c-ccg.github.io/did-method-key/)
//! - [Multicodec](https://github.com/multiformats/multicodec)
//! - [Multibase](https://github.com/multiformats/multibase)

use serde::{Deserialize, Serialize};

use crate::error::{Error, Result};

/// The DID method prefix for did:key
pub const DID_KEY_PREFIX: &str = "did:key:";

/// Multicodec prefix for Ed25519 public keys (0xed01 in varint encoding)
const ED25519_MULTICODEC_PREFIX: [u8; 2] = [0xed, 0x01];

/// A Decentralized Identifier using the did:key method
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Did {
    /// The full DID string (e.g., "did:key:z6MkhaXg...")
    value: String,
}

impl Did {
    /// Create a DID from an Ed25519 public key
    ///
    /// ## Process
    ///
    /// 1. Prepend multicodec prefix (0xed01) to public key
    /// 2. Encode with base58btc
    /// 3. Prepend "z" (multibase prefix for base58btc)
    /// 4. Prepend "did:key:"
    pub fn from_public_key(public_key: &[u8; 32]) -> Self {
        // Combine multicodec prefix with public key
        let mut multicodec_key = Vec::with_capacity(34);
        multicodec_key.extend_from_slice(&ED25519_MULTICODEC_PREFIX);
        multicodec_key.extend_from_slice(public_key);

        // Encode with base58btc and prepend multibase prefix "z"
        let encoded = format!("z{}", bs58::encode(&multicodec_key).into_string());

        // Create full DID
        let value = format!("{}{}", DID_KEY_PREFIX, encoded);

        Self { value }
    }

    /// Parse a DID string
    ///
    /// ## Validation
    ///
    /// - Must start with "did:key:"
    /// - Must have a valid base58btc-encoded public key
    /// - Public key must have correct multicodec prefix
    pub fn parse(did_string: &str) -> Result<Self> {
        if !did_string.starts_with(DID_KEY_PREFIX) {
            return Err(Error::InvalidDid(format!(
                "DID must start with '{}', got '{}'",
                DID_KEY_PREFIX, did_string
            )));
        }

        let identifier = &did_string[DID_KEY_PREFIX.len()..];

        // Must start with 'z' (base58btc multibase prefix)
        if !identifier.starts_with('z') {
            return Err(Error::InvalidDid(
                "DID identifier must start with 'z' (base58btc)".into(),
            ));
        }

        // Decode base58btc (skip the 'z' prefix)
        let decoded = bs58::decode(&identifier[1..])
            .into_vec()
            .map_err(|e| Error::InvalidDid(format!("Invalid base58btc encoding: {}", e)))?;

        // Verify multicodec prefix
        if decoded.len() < 2 {
            return Err(Error::InvalidDid("DID too short".into()));
        }

        if decoded[0..2] != ED25519_MULTICODEC_PREFIX {
            return Err(Error::InvalidDid(format!(
                "Invalid multicodec prefix: expected Ed25519 (0xed01), got {:02x}{:02x}",
                decoded[0], decoded[1]
            )));
        }

        // Verify public key length
        if decoded.len() != 34 {
            return Err(Error::InvalidDid(format!(
                "Invalid public key length: expected 34 bytes (2 prefix + 32 key), got {}",
                decoded.len()
            )));
        }

        Ok(Self {
            value: did_string.to_string(),
        })
    }

    /// Extract the public key from this DID
    pub fn public_key(&self) -> Result<[u8; 32]> {
        let identifier = &self.value[DID_KEY_PREFIX.len()..];

        // Decode base58btc (skip the 'z' prefix)
        let decoded = bs58::decode(&identifier[1..])
            .into_vec()
            .map_err(|e| Error::InvalidDid(format!("Invalid base58btc encoding: {}", e)))?;

        // Skip multicodec prefix and extract public key
        let key_bytes: [u8; 32] = decoded[2..]
            .try_into()
            .map_err(|_| Error::InvalidDid("Invalid public key length".into()))?;

        Ok(key_bytes)
    }

    /// Get the full DID string
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

impl std::fmt::Display for Did {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

impl std::str::FromStr for Did {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self> {
        Self::parse(s)
    }
}

impl AsRef<str> for Did {
    fn as_ref(&self) -> &str {
        &self.value
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_did_from_public_key() {
        let public_key = [0u8; 32];
        let did = Did::from_public_key(&public_key);

        assert!(did.as_str().starts_with("did:key:z"));
    }

    #[test]
    fn test_did_roundtrip() {
        let public_key = [42u8; 32];
        let did = Did::from_public_key(&public_key);

        // Parse and verify
        let parsed = Did::parse(did.as_str()).unwrap();
        assert_eq!(did, parsed);

        // Extract public key and verify
        let extracted = parsed.public_key().unwrap();
        assert_eq!(public_key, extracted);
    }

    #[test]
    fn test_did_parse_invalid_prefix() {
        let result = Did::parse("did:web:example.com");
        assert!(result.is_err());
    }

    #[test]
    fn test_did_parse_invalid_multibase() {
        // Missing 'z' prefix
        let result = Did::parse("did:key:6MkhaXg...");
        assert!(result.is_err());
    }

    #[test]
    fn test_did_display() {
        let public_key = [1u8; 32];
        let did = Did::from_public_key(&public_key);

        let display = format!("{}", did);
        assert!(display.starts_with("did:key:z"));
    }

    #[test]
    fn test_did_deterministic() {
        let public_key = [42u8; 32];

        let did1 = Did::from_public_key(&public_key);
        let did2 = Did::from_public_key(&public_key);

        assert_eq!(did1, did2);
    }
}
