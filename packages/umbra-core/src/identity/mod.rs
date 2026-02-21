//! # Identity Module
//!
//! This module handles user identity creation, recovery, and management.
//!
//! ## Identity Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         IDENTITY SYSTEM                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                     USER IDENTITY                               │   │
//! │  ├─────────────────────────────────────────────────────────────────┤   │
//! │  │                                                                 │   │
//! │  │  ┌───────────────────────────────────────────────────────┐     │   │
//! │  │  │  Cryptographic Identity                               │     │   │
//! │  │  │  ───────────────────────                               │     │   │
//! │  │  │                                                       │     │   │
//! │  │  │  Recovery Phrase (24 words)                           │     │   │
//! │  │  │         │                                             │     │   │
//! │  │  │         ▼                                             │     │   │
//! │  │  │  ┌─────────────────┐   ┌─────────────────┐           │     │   │
//! │  │  │  │ Signing KeyPair │   │ Encryption      │           │     │   │
//! │  │  │  │ (Ed25519)       │   │ KeyPair (X25519)│           │     │   │
//! │  │  │  │                 │   │                 │           │     │   │
//! │  │  │  │ • Sign messages │   │ • Key exchange  │           │     │   │
//! │  │  │  │ • Prove identity│   │ • E2E encryption│           │     │   │
//! │  │  │  │ • Derive PeerId │   │                 │           │     │   │
//! │  │  │  └─────────────────┘   └─────────────────┘           │     │   │
//! │  │  │                                                       │     │   │
//! │  │  │  DID: did:key:z6MkhaXgBZD...                         │     │   │
//! │  │  │  (Derived from Ed25519 public key)                   │     │   │
//! │  │  │                                                       │     │   │
//! │  │  └───────────────────────────────────────────────────────┘     │   │
//! │  │                                                                 │   │
//! │  │  ┌───────────────────────────────────────────────────────┐     │   │
//! │  │  │  Profile                                              │     │   │
//! │  │  │  ─────────                                             │     │   │
//! │  │  │                                                       │     │   │
//! │  │  │  • Display Name: "Alice"                              │     │   │
//! │  │  │  • Status: "Available"                                │     │   │
//! │  │  │  • Avatar: (optional image data)                      │     │   │
//! │  │  │  • Created: 2024-01-15T12:00:00Z                      │     │   │
//! │  │  │                                                       │     │   │
//! │  │  └───────────────────────────────────────────────────────┘     │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Identity Creation Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      IDENTITY CREATION FLOW                             │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Step 1: Generate Recovery Phrase                                      │
//! │  ─────────────────────────────────                                      │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  BIP39 Mnemonic Generation                                  │       │
//! │  │                                                             │       │
//! │  │  1. Generate 256 bits of secure random entropy             │       │
//! │  │  2. Calculate checksum (first 8 bits of SHA256)            │       │
//! │  │  3. Combine entropy + checksum = 264 bits                  │       │
//! │  │  4. Split into 24 × 11-bit segments                        │       │
//! │  │  5. Map each segment to BIP39 wordlist                     │       │
//! │  │                                                             │       │
//! │  │  Output: "abandon abandon abandon ... about"               │       │
//! │  │          (24 words from 2048-word list)                    │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 2: Derive Master Seed                                            │
//! │  ────────────────────────────                                           │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  PBKDF2-HMAC-SHA512                                         │       │
//! │  │                                                             │       │
//! │  │  Input:                                                    │       │
//! │  │    password = mnemonic words (normalized NFKD)             │       │
//! │  │    salt = "mnemonic" + optional passphrase                │       │
//! │  │    iterations = 2048                                       │       │
//! │  │                                                             │       │
//! │  │  Output: 64-byte seed (we use first 32 bytes)             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 3: Derive Key Pairs                                              │
//! │  ───────────────────────                                                │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  HKDF-SHA256 Key Derivation                                 │       │
//! │  │                                                             │       │
//! │  │  Master Seed (32 bytes)                                    │       │
//! │  │        │                                                   │       │
//! │  │        ├──► HKDF(info="umbra-signing-key-v1")             │       │
//! │  │        │         │                                         │       │
//! │  │        │         └──► Ed25519 Signing Key                  │       │
//! │  │        │                                                   │       │
//! │  │        └──► HKDF(info="umbra-encryption-key-v1")          │       │
//! │  │                  │                                         │       │
//! │  │                  └──► X25519 Encryption Key                │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Step 4: Generate DID                                                  │
//! │  ──────────────────                                                     │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  DID:key Method                                             │       │
//! │  │                                                             │       │
//! │  │  1. Take Ed25519 public key (32 bytes)                     │       │
//! │  │  2. Prepend multicodec prefix (0xed01)                     │       │
//! │  │  3. Encode with base58btc                                  │       │
//! │  │  4. Prepend "did:key:"                                     │       │
//! │  │                                                             │       │
//! │  │  Format: did:key:z6MkhaXgBZD...                            │       │
//! │  │          ────────┬─────────────                             │       │
//! │  │          │       └─ Base58-encoded multicodec public key   │       │
//! │  │          └─ DID method identifier                          │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## DID Format
//!
//! We use the `did:key` method which encodes the public key directly in the DID:
//!
//! | Component | Example | Description |
//! |-----------|---------|-------------|
//! | Scheme | `did` | Always "did" |
//! | Method | `key` | The did:key method |
//! | Identifier | `z6Mkha...` | Multibase-encoded public key |
//!
//! The `z` prefix indicates base58btc encoding, and `6Mk` is the multicodec
//! prefix for Ed25519 public keys.

mod did;
mod profile;
mod recovery;

pub use did::{Did, DID_KEY_PREFIX};
pub use profile::{Profile, ProfileUpdate};
pub use recovery::{RecoveryPhrase, WORD_COUNT};

use serde::{Deserialize, Serialize};
use zeroize::ZeroizeOnDrop;

use crate::crypto::{KeyPair, PublicKey};
use crate::error::{Error, Result};

/// A user's complete identity including keys and profile
///
/// ## Security
///
/// - Contains private keys - handle with care
/// - Zeroized when dropped
/// - Should only exist in memory while needed
#[derive(ZeroizeOnDrop)]
pub struct Identity {
    /// Cryptographic keypairs
    #[zeroize(skip)]
    keypair: KeyPair,

    /// Decentralized Identifier
    #[zeroize(skip)]
    did: Did,

    /// User profile information
    #[zeroize(skip)]
    profile: Profile,

    /// When the identity was created (Unix timestamp)
    created_at: i64,
}

impl Identity {
    /// Create a new identity with a random recovery phrase
    ///
    /// ## Returns
    ///
    /// Tuple of (Identity, RecoveryPhrase)
    ///
    /// ## Important
    ///
    /// The recovery phrase should be shown to the user exactly once
    /// and they should be instructed to write it down securely.
    /// It cannot be recovered later!
    pub fn create(display_name: String) -> Result<(Self, RecoveryPhrase)> {
        let recovery = RecoveryPhrase::generate()?;
        let identity = Self::from_recovery_phrase(&recovery, display_name)?;
        Ok((identity, recovery))
    }

    /// Restore an identity from a recovery phrase
    pub fn from_recovery_phrase(
        recovery: &RecoveryPhrase,
        display_name: String,
    ) -> Result<Self> {
        let seed = recovery.to_seed()?;
        let keypair = KeyPair::from_seed(&seed)?;
        let did = Did::from_public_key(&keypair.signing.public_bytes());

        Ok(Self {
            keypair,
            did,
            profile: Profile::new(display_name),
            created_at: crate::time::now_timestamp(),
        })
    }

    /// Get the DID
    pub fn did(&self) -> &Did {
        &self.did
    }

    /// Get the DID as a string
    pub fn did_string(&self) -> String {
        self.did.to_string()
    }

    /// Get the profile
    pub fn profile(&self) -> &Profile {
        &self.profile
    }

    /// Get mutable profile reference for updates
    pub fn profile_mut(&mut self) -> &mut Profile {
        &mut self.profile
    }

    /// Get the public keys for sharing
    pub fn public_keys(&self) -> PublicKey {
        self.keypair.public_keys()
    }

    /// Get the public identity (safe to share)
    pub fn public_identity(&self) -> PublicIdentity {
        PublicIdentity {
            did: self.did.to_string(),
            display_name: self.profile.display_name.clone(),
            status: self.profile.status.clone(),
            avatar: self.profile.avatar.clone(),
            public_keys: self.keypair.public_keys(),
            created_at: self.created_at,
        }
    }

    /// Get reference to the keypair (for signing/encrypting)
    pub fn keypair(&self) -> &KeyPair {
        &self.keypair
    }

    /// Get when the identity was created
    pub fn created_at(&self) -> i64 {
        self.created_at
    }

    /// Create a safe copy of this identity for passing into service constructors.
    ///
    /// This reconstructs the keypair from the raw key bytes rather than using
    /// `ptr::read` or `Clone` (which is intentionally not derived due to
    /// `ZeroizeOnDrop`). The new identity is a fully independent copy that
    /// owns its own key material.
    pub fn clone_for_service(&self) -> Result<Self> {
        let signing_bytes = self.keypair.signing.secret_bytes();
        let encryption_bytes = self.keypair.encryption.secret_bytes();

        let signing = crate::crypto::SigningKeyPair::from_bytes(&signing_bytes)?;
        let encryption = crate::crypto::EncryptionKeyPair::from_bytes(&encryption_bytes);
        let keypair = KeyPair { signing, encryption };
        let did = Did::from_public_key(&keypair.signing.public_bytes());

        Ok(Self {
            keypair,
            did,
            profile: self.profile.clone(),
            created_at: self.created_at,
        })
    }
}

/// Public portion of an identity that can be shared with others
///
/// This contains no secret information and can be freely transmitted.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct PublicIdentity {
    /// Decentralized Identifier
    pub did: String,

    /// Display name
    pub display_name: String,

    /// Status message
    pub status: Option<String>,

    /// Avatar (base64 encoded image or future IPFS CID)
    pub avatar: Option<String>,

    /// Public keys for verification and encryption
    pub public_keys: PublicKey,

    /// When the identity was created
    pub created_at: i64,
}

impl PublicIdentity {
    /// Verify that a message was signed by this identity
    pub fn verify_signature(
        &self,
        message: &[u8],
        signature: &crate::crypto::Signature,
    ) -> Result<()> {
        crate::crypto::verify(&self.public_keys.signing, message, signature)
    }

    /// Get the encryption public key for encrypting messages to this user
    pub fn encryption_key(&self) -> &[u8; 32] {
        &self.public_keys.encryption
    }

    /// Parse a DID string and validate it matches the public keys
    pub fn validate_did(&self) -> Result<()> {
        let expected_did = Did::from_public_key(&self.public_keys.signing);
        if expected_did.to_string() != self.did {
            return Err(Error::InvalidDid(format!(
                "DID {} does not match public key",
                self.did
            )));
        }
        Ok(())
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_identity() {
        let (identity, recovery) = Identity::create("Alice".to_string()).unwrap();

        assert_eq!(identity.profile().display_name, "Alice");
        assert!(identity.did_string().starts_with("did:key:z"));
        assert_eq!(recovery.words().len(), 24);
    }

    #[test]
    fn test_restore_identity() {
        let (identity1, recovery) = Identity::create("Alice".to_string()).unwrap();

        // Restore from same recovery phrase
        let identity2 = Identity::from_recovery_phrase(&recovery, "Alice".to_string()).unwrap();

        // Should have same DID and keys
        assert_eq!(identity1.did_string(), identity2.did_string());
        assert_eq!(
            identity1.public_keys().signing,
            identity2.public_keys().signing
        );
    }

    #[test]
    fn test_public_identity() {
        let (identity, _) = Identity::create("Alice".to_string()).unwrap();
        let public = identity.public_identity();

        assert_eq!(public.display_name, "Alice");
        assert_eq!(public.did, identity.did_string());
        assert!(public.validate_did().is_ok());
    }
}
