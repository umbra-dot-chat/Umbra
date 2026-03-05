//! # Account Sync Module
//!
//! Provides encrypted sync blob creation, parsing, and application for
//! cross-device account synchronisation.
//!
//! ## Sync Blob Format
//!
//! ```text
//! ┌──────────────────────────────────────────────────────────────────┐
//! │  Sync Blob Wire Format                                          │
//! ├──────────────────────────────────────────────────────────────────┤
//! │                                                                  │
//! │  Bytes 0..12   : AES-256-GCM Nonce (96 bits)                   │
//! │  Bytes 12..N   : Encrypted CBOR payload + 16-byte auth tag     │
//! │                                                                  │
//! │  Encrypted payload (CBOR):                                      │
//! │  {                                                               │
//! │    "v": 1,                        // blob format version        │
//! │    "updated_at": 1709500000,      // seconds since epoch        │
//! │    "sections": {                                                │
//! │      "preferences": { "v": 3, "data": [...] },                 │
//! │      "friends":     { "v": 7, "data": [...] },                 │
//! │      "groups":      { "v": 2, "data": [...] },                 │
//! │      "blocked":     { "v": 1, "data": [...] },                 │
//! │    }                                                             │
//! │  }                                                               │
//! │                                                                  │
//! └──────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Encryption
//!
//! The sync key is derived from the BIP39 master seed via HKDF:
//!
//! ```text
//! sync_key = HKDF-SHA256(ikm=seed, info="umbra-account-sync-v1")
//! ```
//!
//! This means any device with the recovery phrase can decrypt the blob.

mod blob;

pub use blob::{
    create_sync_blob, decrypt_sync_blob, encrypt_sync_blob, parse_sync_blob_summary,
    SyncBlobPayload, SyncBlobSummary, SyncSection, SyncSectionSummary,
};
