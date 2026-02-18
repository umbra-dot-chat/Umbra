/**
 * Chunking module — TypeScript wrappers for file chunking WASM functions.
 *
 * Provides:
 * - `chunkFile()` — split a file into content-addressed chunks, store in DB
 * - `reassembleFile()` — reassemble chunks from DB back into file data
 * - `getFileManifest()` — retrieve a stored chunk manifest
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type { ChunkManifest, FileManifestRecord, ReassembledFile } from './types';

// ── Chunk File ─────────────────────────────────────────────────────────────

/**
 * Split a file into content-addressed chunks, store them in the database,
 * and return the chunk manifest.
 *
 * @param fileId - Unique file identifier (UUID)
 * @param filename - Display filename
 * @param dataBase64 - File contents as base64-encoded string
 * @param chunkSize - Optional chunk size in bytes (default 256KB)
 * @returns The chunk manifest describing all chunks
 */
export async function chunkFile(
  fileId: string,
  filename: string,
  dataBase64: string,
  chunkSize?: number,
): Promise<ChunkManifest> {
  const json = JSON.stringify({
    file_id: fileId,
    filename,
    data_b64: dataBase64,
    ...(chunkSize !== undefined ? { chunk_size: chunkSize } : {}),
  });
  const resultJson = wasm().umbra_wasm_chunk_file(json);
  return await parseWasm<ChunkManifest>(resultJson);
}

// ── Reassemble File ────────────────────────────────────────────────────────

/**
 * Reassemble a file from stored chunks in the database.
 *
 * Retrieves the manifest and all chunks, verifies hashes, and returns
 * the file data as a base64 string along with metadata.
 *
 * @param fileId - The file ID whose chunks are stored locally
 * @returns The reassembled file data (base64) and metadata
 */
export async function reassembleFile(
  fileId: string,
): Promise<ReassembledFile> {
  const json = JSON.stringify({ file_id: fileId });
  const resultJson = wasm().umbra_wasm_reassemble_file(json);
  return await parseWasm<ReassembledFile>(resultJson);
}

// ── Get Manifest ───────────────────────────────────────────────────────────

/**
 * Retrieve a stored file manifest from the database.
 *
 * @param fileId - The file ID to look up
 * @returns The manifest record, or null if not found
 */
export async function getFileManifest(
  fileId: string,
): Promise<FileManifestRecord | null> {
  const json = JSON.stringify({ file_id: fileId });
  const resultJson = wasm().umbra_wasm_get_file_manifest(json);
  return await parseWasm<FileManifestRecord | null>(resultJson);
}
