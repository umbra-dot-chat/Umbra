//! # File Chunking
//!
//! Splits files into content-addressed chunks for storage and P2P transfer.
//!
//! ## Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         FILE CHUNKING                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Input: Raw file bytes                                                 │
//! │                                                                         │
//! │  1. Split into fixed-size chunks (default 256 KB)                      │
//! │  2. SHA-256 hash each chunk → chunk_id                                 │
//! │  3. SHA-256 hash full file → file_hash                                 │
//! │  4. Build ChunkManifest with ordered ChunkRef list                     │
//! │                                                                         │
//! │  Output: (ChunkManifest, Vec<FileChunk>)                               │
//! │                                                                         │
//! │  Reassembly:                                                           │
//! │  1. Sort chunks by index                                               │
//! │  2. Verify each chunk hash                                             │
//! │  3. Concatenate data                                                   │
//! │  4. Verify full file hash                                              │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use sha2::{Sha256, Digest};
use serde::{Serialize, Deserialize};
use crate::error::{Error, Result};

/// Default chunk size: 256 KB
pub const DEFAULT_CHUNK_SIZE: usize = 256 * 1024;

/// Web file size limit: 2 GB
pub const WEB_FILE_SIZE_LIMIT: u64 = 2 * 1024 * 1024 * 1024;

/// Web file size warning threshold: 1.5 GB
pub const WEB_FILE_SIZE_WARNING: u64 = (1.5 * 1024.0 * 1024.0 * 1024.0) as u64;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/// A reference to a single chunk within a manifest (metadata only, no data).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkRef {
    /// Content-addressed ID: hex-encoded SHA-256 of the chunk data.
    pub chunk_id: String,
    /// Zero-based position within the file.
    pub chunk_index: u32,
    /// Size of this chunk in bytes.
    pub size: usize,
    /// Hex-encoded SHA-256 hash of the chunk data (same as chunk_id).
    pub hash: String,
}

/// Manifest describing how a file was chunked.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkManifest {
    /// Unique file identifier.
    pub file_id: String,
    /// Original filename.
    pub filename: String,
    /// Total file size in bytes.
    pub total_size: u64,
    /// Chunk size used for splitting (bytes).
    pub chunk_size: usize,
    /// Total number of chunks.
    pub total_chunks: u32,
    /// Ordered list of chunk references.
    pub chunks: Vec<ChunkRef>,
    /// Hex-encoded SHA-256 of the entire file.
    pub file_hash: String,
}

/// A single chunk with its data payload.
#[derive(Debug, Clone)]
pub struct FileChunk {
    /// Content-addressed ID: hex-encoded SHA-256 of `data`.
    pub chunk_id: String,
    /// Zero-based position within the file.
    pub chunk_index: u32,
    /// Total chunks in the file (for context).
    pub total_chunks: u32,
    /// The raw chunk bytes.
    pub data: Vec<u8>,
    /// The file this chunk belongs to.
    pub file_id: String,
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/// Check file size against platform limits.
///
/// Returns `Ok(())` if the file is within limits.
/// Returns `Err` if the file exceeds the web limit.
///
/// # Arguments
/// * `size` - File size in bytes
/// * `is_web` - Whether running in a web browser (WASM)
pub fn check_file_size_limit(size: u64, is_web: bool) -> Result<()> {
    if is_web && size > WEB_FILE_SIZE_LIMIT {
        return Err(Error::InvalidCommunityOperation(format!(
            "File size {} bytes exceeds the web limit of {} bytes (2 GB). Use the desktop app for larger files.",
            size, WEB_FILE_SIZE_LIMIT
        )));
    }
    Ok(())
}

/// Check if a file size is approaching the web limit.
pub fn is_near_web_size_limit(size: u64) -> bool {
    size >= WEB_FILE_SIZE_WARNING
}

/// Split file data into content-addressed chunks.
///
/// Returns a manifest describing the file layout and a vector of chunks
/// containing the actual data.
///
/// # Arguments
/// * `file_id` - Unique identifier for the file
/// * `filename` - Original filename
/// * `data` - Raw file bytes
/// * `chunk_size` - Size of each chunk in bytes (use `DEFAULT_CHUNK_SIZE` for 256 KB)
pub fn chunk_file(
    file_id: &str,
    filename: &str,
    data: &[u8],
    chunk_size: usize,
) -> Result<(ChunkManifest, Vec<FileChunk>)> {
    if chunk_size == 0 {
        return Err(Error::InvalidCommunityOperation(
            "Chunk size must be > 0".to_string(),
        ));
    }

    // Enforce web file size limit when compiling for WASM
    #[cfg(target_arch = "wasm32")]
    check_file_size_limit(data.len() as u64, true)?;

    // Hash the entire file
    let file_hash = hex::encode(Sha256::digest(data));

    let total_size = data.len() as u64;
    let total_chunks = if data.is_empty() {
        0u32
    } else {
        ((data.len() + chunk_size - 1) / chunk_size) as u32
    };

    let mut chunks = Vec::with_capacity(total_chunks as usize);
    let mut chunk_refs = Vec::with_capacity(total_chunks as usize);

    for (i, window) in data.chunks(chunk_size).enumerate() {
        let hash = hex::encode(Sha256::digest(window));
        let chunk_index = i as u32;

        chunk_refs.push(ChunkRef {
            chunk_id: hash.clone(),
            chunk_index,
            size: window.len(),
            hash: hash.clone(),
        });

        chunks.push(FileChunk {
            chunk_id: hash,
            chunk_index,
            total_chunks,
            data: window.to_vec(),
            file_id: file_id.to_string(),
        });
    }

    let manifest = ChunkManifest {
        file_id: file_id.to_string(),
        filename: filename.to_string(),
        total_size,
        chunk_size,
        total_chunks,
        chunks: chunk_refs,
        file_hash,
    };

    Ok((manifest, chunks))
}

// ---------------------------------------------------------------------------
// Reassembly
// ---------------------------------------------------------------------------

/// Reassemble a file from its manifest and chunks.
///
/// Verifies each chunk hash and the final file hash.
///
/// # Arguments
/// * `manifest` - The chunk manifest describing the file
/// * `chunks` - The chunk data (can be in any order; sorted by index internally)
pub fn reassemble_file(
    manifest: &ChunkManifest,
    chunks: &[FileChunk],
) -> Result<Vec<u8>> {
    if chunks.len() != manifest.total_chunks as usize {
        return Err(Error::InvalidCommunityOperation(format!(
            "Expected {} chunks, got {}",
            manifest.total_chunks,
            chunks.len()
        )));
    }

    // Handle empty files
    if manifest.total_chunks == 0 {
        let hash = hex::encode(Sha256::digest(&[]));
        if hash != manifest.file_hash {
            return Err(Error::InvalidCommunityOperation(
                "File hash mismatch for empty file".to_string(),
            ));
        }
        return Ok(Vec::new());
    }

    // Sort chunks by index
    let mut sorted: Vec<&FileChunk> = chunks.iter().collect();
    sorted.sort_by_key(|c| c.chunk_index);

    // Verify indices are contiguous 0..N-1
    for (i, chunk) in sorted.iter().enumerate() {
        if chunk.chunk_index != i as u32 {
            return Err(Error::InvalidCommunityOperation(format!(
                "Missing chunk at index {}, found index {}",
                i, chunk.chunk_index
            )));
        }
    }

    // Verify each chunk hash and concatenate
    let mut result = Vec::with_capacity(manifest.total_size as usize);
    for (i, chunk) in sorted.iter().enumerate() {
        let expected = &manifest.chunks[i];
        if !verify_chunk_hash(&chunk.data, &expected.hash) {
            return Err(Error::InvalidCommunityOperation(format!(
                "Chunk {} hash mismatch: expected {}, got {}",
                i,
                expected.hash,
                hex::encode(Sha256::digest(&chunk.data))
            )));
        }
        result.extend_from_slice(&chunk.data);
    }

    // Verify final file hash
    let final_hash = hex::encode(Sha256::digest(&result));
    if final_hash != manifest.file_hash {
        return Err(Error::InvalidCommunityOperation(format!(
            "File hash mismatch: expected {}, got {}",
            manifest.file_hash, final_hash
        )));
    }

    Ok(result)
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

/// Verify a chunk's data matches the expected hash.
pub fn verify_chunk_hash(data: &[u8], expected_hash: &str) -> bool {
    let actual = hex::encode(Sha256::digest(data));
    actual == expected_hash
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chunk_and_reassemble_round_trip() {
        let data = b"Hello, Umbra! This is a test file for chunking.";
        let (manifest, chunks) = chunk_file("file-1", "test.txt", data, 16).unwrap();

        assert_eq!(manifest.file_id, "file-1");
        assert_eq!(manifest.filename, "test.txt");
        assert_eq!(manifest.total_size, data.len() as u64);
        assert_eq!(manifest.chunk_size, 16);
        assert_eq!(manifest.total_chunks, 3); // 48 bytes / 16 = 3
        assert_eq!(chunks.len(), 3);

        let reassembled = reassemble_file(&manifest, &chunks).unwrap();
        assert_eq!(reassembled, data);
    }

    #[test]
    fn test_empty_file() {
        let data = b"";
        let (manifest, chunks) = chunk_file("file-empty", "empty.bin", data, DEFAULT_CHUNK_SIZE).unwrap();

        assert_eq!(manifest.total_size, 0);
        assert_eq!(manifest.total_chunks, 0);
        assert!(chunks.is_empty());

        let reassembled = reassemble_file(&manifest, &chunks).unwrap();
        assert!(reassembled.is_empty());
    }

    #[test]
    fn test_exact_chunk_boundary() {
        let data = vec![0xABu8; 32];
        let (manifest, chunks) = chunk_file("file-exact", "exact.bin", &data, 16).unwrap();

        assert_eq!(manifest.total_chunks, 2);
        assert_eq!(chunks[0].data.len(), 16);
        assert_eq!(chunks[1].data.len(), 16);

        let reassembled = reassemble_file(&manifest, &chunks).unwrap();
        assert_eq!(reassembled, data);
    }

    #[test]
    fn test_single_chunk_file() {
        let data = b"small";
        let (manifest, chunks) = chunk_file("file-small", "small.txt", data, DEFAULT_CHUNK_SIZE).unwrap();

        assert_eq!(manifest.total_chunks, 1);
        assert_eq!(chunks.len(), 1);

        let reassembled = reassemble_file(&manifest, &chunks).unwrap();
        assert_eq!(reassembled, data);
    }

    #[test]
    fn test_large_file() {
        // 1 MB file with 256 KB chunks = 4 chunks
        let data = vec![0x42u8; 1024 * 1024];
        let (manifest, chunks) = chunk_file("file-large", "large.bin", &data, DEFAULT_CHUNK_SIZE).unwrap();

        assert_eq!(manifest.total_chunks, 4);
        assert_eq!(manifest.total_size, 1024 * 1024);

        let reassembled = reassemble_file(&manifest, &chunks).unwrap();
        assert_eq!(reassembled, data);
    }

    #[test]
    fn test_corrupt_chunk_detected() {
        let data = b"Hello, Umbra! This is a test file for chunking.";
        let (manifest, mut chunks) = chunk_file("file-corrupt", "test.txt", data, 16).unwrap();

        // Corrupt the first chunk
        chunks[0].data[0] = 0xFF;

        let result = reassemble_file(&manifest, &chunks);
        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("hash mismatch"), "Error: {}", err);
    }

    #[test]
    fn test_missing_chunk_detected() {
        let data = b"Hello, Umbra! This is a test file for chunking.";
        let (manifest, mut chunks) = chunk_file("file-missing", "test.txt", data, 16).unwrap();

        // Remove a chunk
        chunks.remove(1);

        let result = reassemble_file(&manifest, &chunks);
        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("Expected 3 chunks, got 2"), "Error: {}", err);
    }

    #[test]
    fn test_verify_chunk_hash() {
        let data = b"test data";
        let hash = hex::encode(Sha256::digest(data));

        assert!(verify_chunk_hash(data, &hash));
        assert!(!verify_chunk_hash(data, "0000000000000000000000000000000000000000000000000000000000000000"));
    }

    #[test]
    fn test_chunks_out_of_order_reassembly() {
        let data = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ012345";
        let (manifest, mut chunks) = chunk_file("file-order", "alpha.txt", data, 8).unwrap();

        assert_eq!(manifest.total_chunks, 4);

        // Shuffle chunks
        chunks.reverse();

        // Should still reassemble correctly (sorted internally)
        let reassembled = reassemble_file(&manifest, &chunks).unwrap();
        assert_eq!(reassembled, data);
    }

    #[test]
    fn test_chunk_ids_are_content_addressed() {
        let data1 = b"identical content";
        let data2 = b"identical content";

        let (_, chunks1) = chunk_file("file-a", "a.txt", data1, DEFAULT_CHUNK_SIZE).unwrap();
        let (_, chunks2) = chunk_file("file-b", "b.txt", data2, DEFAULT_CHUNK_SIZE).unwrap();

        // Same content → same chunk IDs
        assert_eq!(chunks1[0].chunk_id, chunks2[0].chunk_id);
    }

    #[test]
    fn test_zero_chunk_size_rejected() {
        let result = chunk_file("bad", "bad.txt", b"data", 0);
        assert!(result.is_err());
    }

    #[test]
    fn test_manifest_serialization() {
        let data = b"serialize me";
        let (manifest, _) = chunk_file("file-ser", "ser.txt", data, 8).unwrap();

        // Manifest should be serializable to JSON
        let json = serde_json::to_string(&manifest).unwrap();
        let deserialized: ChunkManifest = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.file_id, manifest.file_id);
        assert_eq!(deserialized.total_size, manifest.total_size);
        assert_eq!(deserialized.chunks.len(), manifest.chunks.len());
    }
}
