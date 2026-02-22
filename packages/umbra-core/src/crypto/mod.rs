//! # Cryptography Module
//!
//! This module provides all cryptographic primitives used by Umbra Core.
//!
//! ## Security Overview
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    CRYPTOGRAPHIC ARCHITECTURE                           │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    KEY HIERARCHY                                │   │
//! │  ├─────────────────────────────────────────────────────────────────┤   │
//! │  │                                                                 │   │
//! │  │  Recovery Phrase (BIP39 - 24 words, 256 bits of entropy)       │   │
//! │  │                          │                                      │   │
//! │  │                          ▼                                      │   │
//! │  │  ┌─────────────────────────────────────────────────────────┐   │   │
//! │  │  │              Master Seed (256 bits)                      │   │   │
//! │  │  │         Derived via PBKDF2-SHA512 (2048 rounds)         │   │   │
//! │  │  └─────────────────────────────────────────────────────────┘   │   │
//! │  │                          │                                      │   │
//! │  │            ┌─────────────┴─────────────┐                       │   │
//! │  │            ▼                           ▼                       │   │
//! │  │  ┌─────────────────┐         ┌─────────────────┐              │   │
//! │  │  │  Signing Key    │         │ Encryption Key  │              │   │
//! │  │  │  (Ed25519)      │         │ (X25519)        │              │   │
//! │  │  │                 │         │                 │              │   │
//! │  │  │ • Identity      │         │ • Key Exchange  │              │   │
//! │  │  │ • Signatures    │         │ • E2E Encryption│              │   │
//! │  │  │ • PeerId derive │         │ • Shared Secrets│              │   │
//! │  │  └─────────────────┘         └─────────────────┘              │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                 ENCRYPTION SCHEME                               │   │
//! │  ├─────────────────────────────────────────────────────────────────┤   │
//! │  │                                                                 │   │
//! │  │  Message Encryption (AES-256-GCM)                              │   │
//! │  │  ─────────────────────────────────                              │   │
//! │  │                                                                 │   │
//! │  │  1. Key Exchange: X25519 ECDH                                  │   │
//! │  │     Alice's Private × Bob's Public = Shared Secret            │   │
//! │  │                                                                 │   │
//! │  │  2. Key Derivation: HKDF-SHA256                                │   │
//! │  │     Shared Secret → (Encryption Key, Auth Key)                │   │
//! │  │                                                                 │   │
//! │  │  3. Encryption: AES-256-GCM                                    │   │
//! │  │     • 256-bit key                                              │   │
//! │  │     • 96-bit nonce (random per message)                        │   │
//! │  │     • 128-bit authentication tag                               │   │
//! │  │                                                                 │   │
//! │  │  Ciphertext = AES-GCM(key, nonce, plaintext, associated_data) │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                 SIGNATURE SCHEME                                │   │
//! │  ├─────────────────────────────────────────────────────────────────┤   │
//! │  │                                                                 │   │
//! │  │  Digital Signatures (Ed25519)                                  │   │
//! │  │  ─────────────────────────────                                  │   │
//! │  │                                                                 │   │
//! │  │  • Curve: Curve25519 (Ed25519 form)                            │   │
//! │  │  • Hash: SHA-512                                               │   │
//! │  │  • Signature size: 64 bytes                                    │   │
//! │  │  • Public key size: 32 bytes                                   │   │
//! │  │                                                                 │   │
//! │  │  Properties:                                                   │   │
//! │  │  • Deterministic (same message = same signature)              │   │
//! │  │  • Fast verification                                          │   │
//! │  │  • Strong security (128-bit equivalent)                       │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Algorithm Choices & Rationale
//!
//! | Algorithm | Purpose | Why Chosen |
//! |-----------|---------|------------|
//! | Ed25519 | Signing | Fast, small keys, widely audited |
//! | X25519 | Key Exchange | Fast ECDH, same curve as Ed25519 |
//! | AES-256-GCM | Encryption | Hardware acceleration, AEAD |
//! | HKDF-SHA256 | Key Derivation | Industry standard, well-analyzed |
//! | BIP39 | Recovery Phrase | User-friendly backup, standard |
//!
//! ## Security Considerations
//!
//! 1. **Key Zeroization**: All secret keys are zeroized when dropped
//! 2. **Constant-Time Operations**: Using dalek for constant-time crypto
//! 3. **Secure Random**: Using `rand::rngs::OsRng` for cryptographic randomness
//! 4. **No Key Reuse**: Unique nonces for every encryption operation

mod encryption;
mod kdf;
mod keys;
mod signing;

pub use encryption::{
    decrypt, decrypt_chunk, decrypt_from_sender, encrypt, encrypt_chunk, encrypt_for_recipient,
    EncryptedChunkInfo, EncryptionKey, Nonce, SharedSecret, NONCE_SIZE,
};
pub use kdf::{
    compute_key_fingerprint, derive_channel_file_key, derive_file_key, derive_keys_from_seed,
    derive_shared_secret, verify_key_fingerprint, DerivedKeys,
};
pub use keys::{EncryptionKeyPair, KeyPair, PublicKey, SigningKeyPair};
pub use signing::{sign, verify, Signature, SIGNATURE_SIZE};

/// Size of encryption keys in bytes (256 bits)
pub const ENCRYPTION_KEY_SIZE: usize = 32;

/// Size of signing keys in bytes (256 bits)
pub const SIGNING_KEY_SIZE: usize = 32;

/// Size of public keys in bytes
pub const PUBLIC_KEY_SIZE: usize = 32;
