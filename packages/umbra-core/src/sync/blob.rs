//! Sync blob creation, encryption, decryption, and parsing.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::crypto::{decrypt, encrypt, derive_sync_key, EncryptionKey, Nonce, NONCE_SIZE};
use crate::error::{Error, Result};

/// AAD string for sync blob encryption.
const SYNC_AAD: &[u8] = b"umbra-sync";

/// Current blob format version.
const BLOB_VERSION: u32 = 1;

// ── Data Types ──────────────────────────────────────────────────────────────

/// A single section within a sync blob.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSection {
    /// Section version counter (monotonically increasing).
    pub v: u64,
    /// Section data — opaque JSON values.
    pub data: serde_json::Value,
}

/// The full decrypted sync blob payload.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncBlobPayload {
    /// Blob format version.
    pub v: u32,
    /// When this blob was created (seconds since epoch).
    pub updated_at: i64,
    /// Per-section data.
    pub sections: HashMap<String, SyncSection>,
}

/// Summary of a sync blob (without full data).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSectionSummary {
    /// Section version.
    pub v: u64,
    /// Number of items in this section.
    pub count: usize,
    /// When this section was last updated.
    pub updated_at: i64,
}

/// High-level summary returned when parsing a blob.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncBlobSummary {
    /// Blob format version.
    pub v: u32,
    /// When the blob was created.
    pub updated_at: i64,
    /// Per-section summaries.
    pub sections: HashMap<String, SyncSectionSummary>,
}

// ── Blob Creation ───────────────────────────────────────────────────────────

/// Collect sync-able data from the database and build a `SyncBlobPayload`.
///
/// Uses `database.export_database()` to extract settings, friends, groups,
/// and blocked users, then restructures into versioned sync sections.
///
/// `section_versions` provides the current version counters for each section.
/// If `None`, all sections start at version 1.
pub fn create_sync_blob(
    database: &crate::storage::Database,
    section_versions: Option<&HashMap<String, u64>>,
) -> Result<SyncBlobPayload> {
    let now = crate::time::now_timestamp();

    fn next_version(versions: Option<&HashMap<String, u64>>, key: &str) -> u64 {
        versions
            .and_then(|v| v.get(key))
            .map(|v| v + 1)
            .unwrap_or(1)
    }

    // Use export_database() which already collects settings, friends, groups, blocked_users
    let export_bytes = database.export_database()?;
    let export: serde_json::Value = serde_json::from_slice(&export_bytes)
        .map_err(|e| Error::DatabaseError(format!("Failed to parse export: {}", e)))?;

    let preferences = export.get("settings")
        .cloned()
        .unwrap_or(serde_json::json!([]));
    let friends = export.get("friends")
        .cloned()
        .unwrap_or(serde_json::json!([]));
    let groups = export.get("groups")
        .cloned()
        .unwrap_or(serde_json::json!([]));
    let blocked = export.get("blocked_users")
        .cloned()
        .unwrap_or(serde_json::json!([]));

    let mut sections = HashMap::new();
    sections.insert(
        "preferences".to_string(),
        SyncSection {
            v: next_version(section_versions, "preferences"),
            data: preferences,
        },
    );
    sections.insert(
        "friends".to_string(),
        SyncSection {
            v: next_version(section_versions, "friends"),
            data: friends,
        },
    );
    sections.insert(
        "groups".to_string(),
        SyncSection {
            v: next_version(section_versions, "groups"),
            data: groups,
        },
    );
    sections.insert(
        "blocked".to_string(),
        SyncSection {
            v: next_version(section_versions, "blocked"),
            data: blocked,
        },
    );

    Ok(SyncBlobPayload {
        v: BLOB_VERSION,
        updated_at: now,
        sections,
    })
}

// ── Encryption / Decryption ─────────────────────────────────────────────────

/// Encrypt a `SyncBlobPayload` into a binary blob ready for upload.
///
/// Output format: `nonce (12 bytes) || ciphertext+tag`
pub fn encrypt_sync_blob(payload: &SyncBlobPayload, seed: &[u8; 32]) -> Result<Vec<u8>> {
    // 1. Derive sync encryption key
    let sync_key = derive_sync_key(seed)?;
    let enc_key = EncryptionKey::from_bytes(sync_key);

    // 2. Serialize to CBOR
    let mut cbor_bytes = Vec::new();
    ciborium::into_writer(payload, &mut cbor_bytes)
        .map_err(|e| Error::EncryptionFailed(format!("CBOR serialization failed: {}", e)))?;

    // 3. Compress
    let compressed = miniz_oxide::deflate::compress_to_vec(&cbor_bytes, 6);

    // 4. Encrypt with AES-256-GCM
    let (nonce, ciphertext) = encrypt(&enc_key, &compressed, SYNC_AAD)?;

    // 5. Assemble: nonce || ciphertext
    let mut blob = Vec::with_capacity(NONCE_SIZE + ciphertext.len());
    blob.extend_from_slice(nonce.as_bytes());
    blob.extend_from_slice(&ciphertext);

    Ok(blob)
}

/// Decrypt a binary sync blob back into a `SyncBlobPayload`.
pub fn decrypt_sync_blob(blob: &[u8], seed: &[u8; 32]) -> Result<SyncBlobPayload> {
    if blob.len() < NONCE_SIZE + 16 {
        return Err(Error::DecryptionFailed(
            "Sync blob too short".into(),
        ));
    }

    // 1. Split nonce and ciphertext
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    nonce_bytes.copy_from_slice(&blob[..NONCE_SIZE]);
    let nonce = Nonce::from_bytes(nonce_bytes);
    let ciphertext = &blob[NONCE_SIZE..];

    // 2. Derive sync key and decrypt
    let sync_key = derive_sync_key(seed)?;
    let enc_key = EncryptionKey::from_bytes(sync_key);
    let compressed = decrypt(&enc_key, &nonce, ciphertext, SYNC_AAD)?;

    // 3. Decompress
    let cbor_bytes = miniz_oxide::inflate::decompress_to_vec(&compressed)
        .map_err(|e| Error::DecryptionFailed(format!("Decompression failed: {:?}", e)))?;

    // 4. Deserialize CBOR
    let payload: SyncBlobPayload = ciborium::from_reader(&cbor_bytes[..])
        .map_err(|e| Error::DecryptionFailed(format!("CBOR deserialization failed: {}", e)))?;

    Ok(payload)
}

/// Parse a sync blob and return only a summary (section names, versions, counts).
pub fn parse_sync_blob_summary(blob: &[u8], seed: &[u8; 32]) -> Result<SyncBlobSummary> {
    let payload = decrypt_sync_blob(blob, seed)?;

    let sections = payload
        .sections
        .iter()
        .map(|(name, section)| {
            let count = match &section.data {
                serde_json::Value::Array(arr) => arr.len(),
                serde_json::Value::Object(obj) => obj.len(),
                _ => 1,
            };
            (
                name.clone(),
                SyncSectionSummary {
                    v: section.v,
                    count,
                    updated_at: payload.updated_at,
                },
            )
        })
        .collect();

    Ok(SyncBlobSummary {
        v: payload.v,
        updated_at: payload.updated_at,
        sections,
    })
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_test_payload() -> SyncBlobPayload {
        let mut sections = HashMap::new();
        sections.insert(
            "preferences".to_string(),
            SyncSection {
                v: 1,
                data: serde_json::json!([
                    {"key": "theme", "value": "dark"},
                    {"key": "font_size", "value": "14"},
                ]),
            },
        );
        sections.insert(
            "friends".to_string(),
            SyncSection {
                v: 3,
                data: serde_json::json!([
                    {"did": "did:umbra:abc123", "display_name": "Alice"},
                    {"did": "did:umbra:def456", "display_name": "Bob"},
                ]),
            },
        );
        sections.insert(
            "groups".to_string(),
            SyncSection {
                v: 1,
                data: serde_json::json!([]),
            },
        );
        sections.insert(
            "blocked".to_string(),
            SyncSection {
                v: 1,
                data: serde_json::json!([]),
            },
        );

        SyncBlobPayload {
            v: 1,
            updated_at: 1709500000,
            sections,
        }
    }

    #[test]
    fn test_encrypt_decrypt_round_trip() {
        let seed = [42u8; 32];
        let payload = make_test_payload();

        let blob = encrypt_sync_blob(&payload, &seed).unwrap();
        let decrypted = decrypt_sync_blob(&blob, &seed).unwrap();

        assert_eq!(decrypted.v, payload.v);
        assert_eq!(decrypted.updated_at, payload.updated_at);
        assert_eq!(decrypted.sections.len(), payload.sections.len());

        // Check friends section survived round-trip
        let friends = decrypted.sections.get("friends").unwrap();
        assert_eq!(friends.v, 3);
        assert_eq!(friends.data.as_array().unwrap().len(), 2);
    }

    #[test]
    fn test_wrong_seed_fails() {
        let seed = [42u8; 32];
        let wrong_seed = [99u8; 32];
        let payload = make_test_payload();

        let blob = encrypt_sync_blob(&payload, &seed).unwrap();
        let result = decrypt_sync_blob(&blob, &wrong_seed);

        assert!(result.is_err());
    }

    #[test]
    fn test_tampered_blob_fails() {
        let seed = [42u8; 32];
        let payload = make_test_payload();

        let mut blob = encrypt_sync_blob(&payload, &seed).unwrap();
        // Tamper with ciphertext (after nonce)
        if blob.len() > NONCE_SIZE + 1 {
            blob[NONCE_SIZE + 1] ^= 0xFF;
        }
        let result = decrypt_sync_blob(&blob, &seed);

        assert!(result.is_err());
    }

    #[test]
    fn test_too_short_blob_fails() {
        let seed = [42u8; 32];
        let result = decrypt_sync_blob(&[0u8; 10], &seed);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_summary() {
        let seed = [42u8; 32];
        let payload = make_test_payload();

        let blob = encrypt_sync_blob(&payload, &seed).unwrap();
        let summary = parse_sync_blob_summary(&blob, &seed).unwrap();

        assert_eq!(summary.v, 1);
        assert_eq!(summary.sections.len(), 4);
        assert_eq!(summary.sections["friends"].v, 3);
        assert_eq!(summary.sections["friends"].count, 2);
        assert_eq!(summary.sections["preferences"].count, 2);
        assert_eq!(summary.sections["groups"].count, 0);
    }
}
