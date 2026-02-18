/**
 * OPFS Bridge — JavaScript implementation of the OPFS storage interface.
 *
 * Provides the `globalThis.__umbra_opfs` object that the Rust WASM code
 * calls via `wasm_bindgen` extern. The OPFS (Origin Private File System)
 * is a web-only storage API for storing file chunk data efficiently.
 *
 * ## Architecture
 *
 * ```
 * Rust (WASM) ──> __umbra_opfs.store(id, b64) ──> OPFS /umbra-chunks/ab/abcdef...
 * Rust (WASM) ──> __umbra_opfs.get(id)         ──> base64 chunk data
 * Rust (WASM) ──> __umbra_opfs.delete(id)      ──> removes chunk file
 * Rust (WASM) ──> __umbra_opfs.usage()          ──> total bytes used
 * Rust (WASM) ──> __umbra_opfs.exists(id)       ──> boolean
 * ```
 *
 * ## Directory Layout
 *
 * Chunks are stored in a two-level directory tree using the first 2 characters
 * of the chunk ID as a bucket prefix, preventing too many files in a single
 * directory:
 *
 * ```
 * /umbra-chunks/
 *   ├── ab/
 *   │   ├── abcdef1234...
 *   │   └── ab9876fedc...
 *   └── cd/
 *       └── cdef567890...
 * ```
 *
 * ## Usage
 *
 * Call `initOpfsBridge()` before loading WASM to set up the bridge:
 *
 * ```ts
 * import { initOpfsBridge } from '@umbra/service';
 * await initOpfsBridge();
 * // Now WASM can call __umbra_opfs.store(), .get(), etc.
 * ```
 *
 * @packageDocumentation
 */

const ROOT_DIR_NAME = 'umbra-chunks';

// ── Helpers ──────────────────────────────────────────────────────────────

/** Get the OPFS root directory handle. */
async function getRoot(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(ROOT_DIR_NAME, { create: true });
}

/** Get a bucket subdirectory for a chunk ID (first 2 chars). */
async function getBucket(root: FileSystemDirectoryHandle, chunkId: string): Promise<FileSystemDirectoryHandle> {
  const prefix = chunkId.substring(0, 2);
  return root.getDirectoryHandle(prefix, { create: true });
}

/** Convert a base64 string to a Uint8Array. */
function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Convert a Uint8Array to a base64 string. */
function bytesToB64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ── OPFS Operations ──────────────────────────────────────────────────────

/**
 * Store a chunk in OPFS.
 *
 * @param chunkId - Content-addressed chunk identifier (SHA-256 hex)
 * @param dataB64 - Base64-encoded chunk data
 * @returns `true` on success
 */
async function storeChunk(chunkId: string, dataB64: string): Promise<boolean> {
  const root = await getRoot();
  const bucket = await getBucket(root, chunkId);
  const fileHandle = await bucket.getFileHandle(chunkId, { create: true });

  const writable = await (fileHandle as any).createWritable();
  const bytes = b64ToBytes(dataB64);
  await writable.write(bytes);
  await writable.close();

  return true;
}

/**
 * Get a chunk from OPFS.
 *
 * @param chunkId - Content-addressed chunk identifier
 * @returns Base64-encoded chunk data, or `null` if not found
 */
async function getChunk(chunkId: string): Promise<string | null> {
  try {
    const root = await getRoot();
    const bucket = await getBucket(root, chunkId);
    const fileHandle = await bucket.getFileHandle(chunkId);
    const file = await fileHandle.getFile();
    const buffer = await file.arrayBuffer();
    return bytesToB64(new Uint8Array(buffer));
  } catch {
    // File not found
    return null;
  }
}

/**
 * Delete a chunk from OPFS.
 *
 * @param chunkId - Content-addressed chunk identifier
 * @returns `true` on success, `false` if not found
 */
async function deleteChunk(chunkId: string): Promise<boolean> {
  try {
    const root = await getRoot();
    const prefix = chunkId.substring(0, 2);
    const bucket = await root.getDirectoryHandle(prefix);
    await bucket.removeEntry(chunkId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get total storage usage in OPFS (bytes).
 *
 * Iterates all chunks and sums their sizes.
 *
 * @returns Total bytes used by stored chunks
 */
async function getUsage(): Promise<number> {
  let totalBytes = 0;

  try {
    const root = await getRoot();

    // Iterate bucket directories
    for await (const [, bucketHandle] of (root as any).entries()) {
      if (bucketHandle.kind !== 'directory') continue;

      // Iterate chunk files in bucket
      for await (const [, fileHandle] of (bucketHandle as any).entries()) {
        if (fileHandle.kind !== 'file') continue;
        const file = await fileHandle.getFile();
        totalBytes += file.size;
      }
    }
  } catch {
    // Root directory may not exist yet
  }

  return totalBytes;
}

/**
 * Check if a chunk exists in OPFS.
 *
 * @param chunkId - Content-addressed chunk identifier
 * @returns `true` if the chunk exists
 */
async function existsChunk(chunkId: string): Promise<boolean> {
  try {
    const root = await getRoot();
    const bucket = await getBucket(root, chunkId);
    await bucket.getFileHandle(chunkId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete multiple chunks from OPFS at once.
 *
 * @param chunkIdsJson - JSON array of chunk IDs to delete
 * @returns Number of chunks successfully deleted
 */
async function deleteManyChunks(chunkIdsJson: string): Promise<number> {
  let deleted = 0;
  try {
    const chunkIds: string[] = JSON.parse(chunkIdsJson);
    const root = await getRoot();

    for (const chunkId of chunkIds) {
      try {
        const prefix = chunkId.substring(0, 2);
        const bucket = await root.getDirectoryHandle(prefix);
        await bucket.removeEntry(chunkId);
        deleted++;
      } catch {
        // Chunk not found or already deleted, continue
      }
    }
  } catch {
    // JSON parse error or root not found
  }

  return deleted;
}

// ── Bridge Setup ─────────────────────────────────────────────────────────

/** The OPFS bridge interface expected by Rust WASM. */
interface OpfsBridge {
  store: (chunkId: string, dataB64: string) => Promise<boolean>;
  get: (chunkId: string) => Promise<string | null>;
  delete: (chunkId: string) => Promise<boolean>;
  deleteMany: (chunkIdsJson: string) => Promise<number>;
  usage: () => Promise<number>;
  exists: (chunkId: string) => Promise<boolean>;
}

/**
 * Initialize the OPFS bridge by setting `globalThis.__umbra_opfs`.
 *
 * Must be called before loading WASM on web platforms. On non-web
 * platforms (e.g., Tauri/desktop), this function does nothing since
 * OPFS is not available and the desktop uses native filesystem storage.
 *
 * @returns `true` if the bridge was initialized, `false` if OPFS is not available
 */
export function initOpfsBridge(): boolean {
  // Only available in web browsers with OPFS support
  if (typeof globalThis === 'undefined') return false;
  if (typeof navigator === 'undefined') return false;
  if (!navigator.storage || !('getDirectory' in navigator.storage)) {
    console.warn('[opfs-bridge] OPFS not supported in this browser');
    return false;
  }

  const bridge: OpfsBridge = {
    store: storeChunk,
    get: getChunk,
    delete: deleteChunk,
    deleteMany: deleteManyChunks,
    usage: getUsage,
    exists: existsChunk,
  };

  (globalThis as any).__umbra_opfs = bridge;
  return true;
}

/**
 * Check if the OPFS bridge is available and initialized.
 */
export function isOpfsBridgeReady(): boolean {
  return typeof globalThis !== 'undefined' && !!(globalThis as any).__umbra_opfs;
}
