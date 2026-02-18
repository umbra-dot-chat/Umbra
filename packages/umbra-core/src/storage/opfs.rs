//! # OPFS Storage Adapter (WASM-only)
//!
//! Wraps the Origin Private File System API via JavaScript interop for
//! storing raw chunk data on the web. SQLite tracks metadata; OPFS stores
//! the actual chunk bytes.
//!
//! ## Architecture
//!
//! ```text
//! ┌──────────────────────────────────────────────────────────────────────────┐
//! │                       OPFS STORAGE ADAPTER                              │
//! ├──────────────────────────────────────────────────────────────────────────┤
//! │                                                                        │
//! │  Rust (WASM)                  JavaScript Bridge                        │
//! │  ────────────                 ─────────────────                         │
//! │                                                                        │
//! │  store_chunk_opfs() ───────►  __umbra_opfs.store(id, b64)              │
//! │  get_chunk_opfs()   ───────►  __umbra_opfs.get(id) → b64              │
//! │  delete_chunk_opfs() ──────►  __umbra_opfs.delete(id)                  │
//! │  get_storage_usage() ──────►  __umbra_opfs.usage() → bytes             │
//! │  chunk_exists_opfs() ──────►  __umbra_opfs.exists(id) → bool           │
//! │                                                                        │
//! │  OPFS directory layout:                                                │
//! │    /umbra-chunks/                                                      │
//! │      ├── ab/  (first 2 chars of chunk_id)                              │
//! │      │   ├── abcdef1234...  (chunk file)                               │
//! │      │   └── ab9876fedc...                                             │
//! │      └── cd/                                                           │
//! │          └── cdef567890...                                              │
//! │                                                                        │
//! └──────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! The JavaScript bridge (`opfs-bridge.ts`) must be initialized before calling
//! these functions. It should set up `globalThis.__umbra_opfs` with the
//! required async methods.

use crate::error::{Error, Result};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

// ============================================================================
// JAVASCRIPT BRIDGE — extern functions provided by opfs-bridge.ts
// ============================================================================

#[wasm_bindgen]
extern "C" {
    /// Store a chunk in OPFS. Data is base64-encoded.
    /// Returns a promise that resolves to true on success.
    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_opfs"], js_name = "store", catch)]
    fn opfs_bridge_store(chunk_id: &str, data_b64: &str) -> std::result::Result<js_sys::Promise, JsValue>;

    /// Get a chunk from OPFS. Returns a promise that resolves to base64 string, or null if not found.
    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_opfs"], js_name = "get", catch)]
    fn opfs_bridge_get(chunk_id: &str) -> std::result::Result<js_sys::Promise, JsValue>;

    /// Delete a chunk from OPFS. Returns a promise.
    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_opfs"], js_name = "delete", catch)]
    fn opfs_bridge_delete(chunk_id: &str) -> std::result::Result<js_sys::Promise, JsValue>;

    /// Get total storage usage in bytes. Returns a promise resolving to a number.
    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_opfs"], js_name = "usage", catch)]
    fn opfs_bridge_usage() -> std::result::Result<js_sys::Promise, JsValue>;

    /// Check if a chunk exists in OPFS. Returns a promise resolving to boolean.
    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_opfs"], js_name = "exists", catch)]
    fn opfs_bridge_exists(chunk_id: &str) -> std::result::Result<js_sys::Promise, JsValue>;

    /// Delete all chunks for a given file_id. Chunk IDs are passed as JSON array.
    /// Returns a promise resolving to the number of chunks deleted.
    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_opfs"], js_name = "deleteMany", catch)]
    fn opfs_bridge_delete_many(chunk_ids_json: &str) -> std::result::Result<js_sys::Promise, JsValue>;
}

// ============================================================================
// HELPERS
// ============================================================================

fn opfs_err(e: JsValue) -> Error {
    let msg = e.as_string().unwrap_or_else(|| format!("{:?}", e));
    Error::DatabaseError(format!("OPFS error: {}", msg))
}

/// Check if the OPFS bridge is available (globalThis.__umbra_opfs is set).
pub fn is_opfs_available() -> bool {
    let global = js_sys::global();
    let opfs = js_sys::Reflect::get(&global, &JsValue::from_str("__umbra_opfs"));
    matches!(opfs, Ok(val) if !val.is_undefined() && !val.is_null())
}

// ============================================================================
// PUBLIC API (async — must be called from WASM async context)
// ============================================================================

/// Store a chunk's raw data in OPFS.
///
/// # Arguments
/// * `chunk_id` - Content-addressed chunk ID (SHA-256 hex)
/// * `data` - Raw chunk bytes
pub async fn store_chunk_opfs(chunk_id: &str, data: &[u8]) -> Result<()> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};
    let data_b64 = STANDARD.encode(data);

    let promise = opfs_bridge_store(chunk_id, &data_b64).map_err(opfs_err)?;
    JsFuture::from(promise).await.map_err(opfs_err)?;

    Ok(())
}

/// Retrieve a chunk's raw data from OPFS.
///
/// Returns `None` if the chunk doesn't exist.
pub async fn get_chunk_opfs(chunk_id: &str) -> Result<Option<Vec<u8>>> {
    use base64::{Engine as _, engine::general_purpose::STANDARD};

    let promise = opfs_bridge_get(chunk_id).map_err(opfs_err)?;
    let result = JsFuture::from(promise).await.map_err(opfs_err)?;

    if result.is_null() || result.is_undefined() {
        return Ok(None);
    }

    let b64_str = result.as_string().ok_or_else(|| {
        Error::DatabaseError("OPFS get returned non-string value".to_string())
    })?;

    let bytes = STANDARD.decode(&b64_str).map_err(|e| {
        Error::DatabaseError(format!("OPFS base64 decode error: {}", e))
    })?;

    Ok(Some(bytes))
}

/// Delete a chunk from OPFS.
pub async fn delete_chunk_opfs(chunk_id: &str) -> Result<()> {
    let promise = opfs_bridge_delete(chunk_id).map_err(opfs_err)?;
    JsFuture::from(promise).await.map_err(opfs_err)?;
    Ok(())
}

/// Get total storage usage in OPFS (bytes).
pub async fn get_storage_usage() -> Result<u64> {
    let promise = opfs_bridge_usage().map_err(opfs_err)?;
    let result = JsFuture::from(promise).await.map_err(opfs_err)?;

    let bytes = result.as_f64().unwrap_or(0.0) as u64;
    Ok(bytes)
}

/// Check if a chunk exists in OPFS.
pub async fn chunk_exists_opfs(chunk_id: &str) -> Result<bool> {
    let promise = opfs_bridge_exists(chunk_id).map_err(opfs_err)?;
    let result = JsFuture::from(promise).await.map_err(opfs_err)?;

    Ok(result.as_bool().unwrap_or(false))
}

/// Delete multiple chunks from OPFS at once.
/// Returns the number of chunks deleted.
pub async fn delete_chunks_opfs(chunk_ids: &[String]) -> Result<u32> {
    let json = serde_json::to_string(chunk_ids).map_err(|e| {
        Error::DatabaseError(format!("Failed to serialize chunk IDs: {}", e))
    })?;

    let promise = opfs_bridge_delete_many(&json).map_err(opfs_err)?;
    let result = JsFuture::from(promise).await.map_err(opfs_err)?;

    let count = result.as_f64().unwrap_or(0.0) as u32;
    Ok(count)
}

// ============================================================================
// COMBINED OPERATIONS (SQLite metadata + OPFS data)
// ============================================================================

/// Store a chunk in both OPFS (raw data) and SQLite (metadata).
/// This is the primary method for storing chunks on the web.
pub async fn store_chunk_hybrid(
    db: &crate::storage::Database,
    chunk_id: &str,
    file_id: &str,
    chunk_index: i32,
    data: &[u8],
) -> Result<()> {
    let size = data.len() as i64;
    let now = js_sys::Date::now() as i64;

    // Store raw bytes in OPFS
    store_chunk_opfs(chunk_id, data).await?;

    // Store metadata in SQLite (without duplicating the data blob)
    // We store an empty vec for data since the actual bytes are in OPFS
    db.store_chunk(chunk_id, file_id, chunk_index, &[], size, now)?;

    Ok(())
}

/// Retrieve a chunk by reading raw data from OPFS.
/// Falls back to SQLite blob if OPFS data is missing.
pub async fn get_chunk_hybrid(
    db: &crate::storage::Database,
    chunk_id: &str,
) -> Result<Option<Vec<u8>>> {
    // Try OPFS first
    if let Some(data) = get_chunk_opfs(chunk_id).await? {
        return Ok(Some(data));
    }

    // Fall back to SQLite blob storage
    if let Some(record) = db.get_chunk(chunk_id)? {
        if !record.data.is_empty() {
            return Ok(Some(record.data));
        }
    }

    Ok(None)
}

/// Delete all chunks for a file from both OPFS and SQLite.
///
/// # Arguments
/// * `db` - Database reference for SQLite metadata
/// * `file_id` - File ID whose chunks to delete
/// * `chunk_ids` - List of chunk IDs to delete from OPFS
pub async fn delete_file_chunks_hybrid(
    db: &crate::storage::Database,
    file_id: &str,
    chunk_ids: &[String],
) -> Result<()> {
    // Delete raw data from OPFS
    if !chunk_ids.is_empty() {
        let _ = delete_chunks_opfs(chunk_ids).await;
    }

    // Delete metadata from SQLite
    db.delete_chunks_for_file(file_id)?;

    Ok(())
}
