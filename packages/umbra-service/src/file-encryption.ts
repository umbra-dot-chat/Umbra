/**
 * File Encryption module — TypeScript wrappers for E2EE file encryption WASM functions.
 *
 * Provides:
 * - `deriveFileKey()` — derive a per-file encryption key from a conversation shared secret
 * - `encryptFileChunk()` — encrypt a single file chunk with AES-256-GCM
 * - `decryptFileChunk()` — decrypt a single file chunk with AAD verification
 *
 * ## Encryption Scheme
 *
 * ```
 * ECDH(myKey, peerKey) → shared secret
 *   → HKDF(shared_secret, context) → conversation key
 *     → HKDF(conv_key, file_id) → per-file key
 *       → AES-256-GCM(file_key, nonce, chunk_data, AAD=file_id||chunk_index)
 * ```
 *
 * Both conversation participants independently derive the same file key.
 * Each chunk gets a unique random nonce. AAD binding prevents chunk
 * reordering and cross-file substitution attacks.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';

// ── Types ─────────────────────────────────────────────────────────────────

/** Result of deriving a per-file encryption key. */
export interface DerivedFileKey {
  /** Hex-encoded 256-bit file encryption key */
  keyHex: string;
}

/** Result of encrypting a file chunk. */
export interface EncryptedChunk {
  /** Hex-encoded 96-bit nonce used for this chunk */
  nonceHex: string;
  /** Base64-encoded encrypted chunk data (ciphertext + auth tag) */
  encryptedDataB64: string;
}

/** Result of decrypting a file chunk. */
export interface DecryptedChunk {
  /** Base64-encoded plaintext chunk data */
  chunkDataB64: string;
}

/** Result of deriving a channel file encryption key. */
export interface DerivedChannelFileKey {
  /** Hex-encoded 256-bit file encryption key */
  keyHex: string;
}

/** Result of computing a key fingerprint. */
export interface KeyFingerprint {
  /** 16-character hex fingerprint */
  fingerprint: string;
}

/** Result of verifying a key fingerprint. */
export interface KeyVerificationResult {
  /** Whether the fingerprints match */
  verified: boolean;
}

/** Result of marking files for re-encryption. */
export interface ReencryptionMarkResult {
  /** Number of files marked */
  filesMarked: number;
}

/** File record needing re-encryption. */
export interface FileNeedingReencryption {
  id: string;
  channelId: string;
  folderId: string | null;
  filename: string;
  fileSize: number;
  mimeType: string | null;
  uploadedBy: string;
  version: number;
}

// ── Derive File Key ───────────────────────────────────────────────────────

/**
 * Derive a per-file encryption key from the conversation shared secret.
 *
 * Uses ECDH between the local identity's encryption key and the peer's
 * encryption key to compute a shared secret, then derives a conversation
 * key via HKDF, and finally derives a file-specific key using the file ID.
 *
 * Both conversation participants will independently derive the same key.
 *
 * @param peerDid - The peer's DID (e.g. "did:key:...")
 * @param fileId - Unique file identifier (UUID)
 * @param context - Optional HKDF context string (e.g. conversation ID)
 * @returns The derived file encryption key (hex-encoded)
 */
export async function deriveFileKey(
  peerDid: string,
  fileId: string,
  context?: string,
): Promise<DerivedFileKey> {
  const json = JSON.stringify({
    peer_did: peerDid,
    file_id: fileId,
    ...(context !== undefined ? { context } : {}),
  });
  const resultJson = wasm().umbra_wasm_file_derive_key(json);
  return await parseWasm<DerivedFileKey>(resultJson);
}

// ── Encrypt Chunk ─────────────────────────────────────────────────────────

/**
 * Encrypt a single file chunk using AES-256-GCM.
 *
 * A random 96-bit nonce is generated for each chunk. The AAD (additional
 * authenticated data) is constructed from `file_id || chunk_index` to bind
 * each chunk to its position and prevent reordering attacks.
 *
 * @param keyHex - Hex-encoded 256-bit file encryption key (from `deriveFileKey`)
 * @param chunkDataB64 - Base64-encoded plaintext chunk data
 * @param fileId - The file ID this chunk belongs to
 * @param chunkIndex - Zero-based index of this chunk within the file
 * @returns The nonce and encrypted data
 */
export async function encryptFileChunk(
  keyHex: string,
  chunkDataB64: string,
  fileId: string,
  chunkIndex: number,
): Promise<EncryptedChunk> {
  const json = JSON.stringify({
    key_hex: keyHex,
    chunk_data_b64: chunkDataB64,
    file_id: fileId,
    chunk_index: chunkIndex,
  });
  const resultJson = wasm().umbra_wasm_file_encrypt_chunk(json);
  return await parseWasm<EncryptedChunk>(resultJson);
}

// ── Decrypt Chunk ─────────────────────────────────────────────────────────

/**
 * Decrypt a single file chunk using AES-256-GCM.
 *
 * Reconstructs the AAD from `file_id || chunk_index` and verifies the
 * authentication tag. Fails if the chunk has been tampered with, reordered,
 * or decrypted with the wrong key.
 *
 * @param keyHex - Hex-encoded 256-bit file encryption key (from `deriveFileKey`)
 * @param nonceHex - Hex-encoded 96-bit nonce (from `encryptFileChunk`)
 * @param encryptedDataB64 - Base64-encoded encrypted chunk data
 * @param fileId - The file ID this chunk belongs to
 * @param chunkIndex - Zero-based index of this chunk within the file
 * @returns The decrypted plaintext chunk data (base64-encoded)
 */
export async function decryptFileChunk(
  keyHex: string,
  nonceHex: string,
  encryptedDataB64: string,
  fileId: string,
  chunkIndex: number,
): Promise<DecryptedChunk> {
  const json = JSON.stringify({
    key_hex: keyHex,
    nonce_hex: nonceHex,
    encrypted_data_b64: encryptedDataB64,
    file_id: fileId,
    chunk_index: chunkIndex,
  });
  const resultJson = wasm().umbra_wasm_file_decrypt_chunk(json);
  return await parseWasm<DecryptedChunk>(resultJson);
}

// ── Channel File Key Derivation ──────────────────────────────────────────

/**
 * Derive a per-file encryption key for a community channel file.
 *
 * Uses HKDF(channel_group_key, file_id || key_version) with a channel-specific
 * domain string. This is separate from DM file keys to provide domain separation.
 *
 * @param channelKeyHex - Hex-encoded 256-bit channel group encryption key
 * @param fileId - Unique file identifier
 * @param keyVersion - Key version number (for key rotation)
 * @returns The derived file encryption key
 */
export async function deriveChannelFileKey(
  channelKeyHex: string,
  fileId: string,
  keyVersion: number,
): Promise<DerivedChannelFileKey> {
  const json = JSON.stringify({
    channel_key_hex: channelKeyHex,
    file_id: fileId,
    key_version: keyVersion,
  });
  const resultJson = wasm().umbra_wasm_channel_file_derive_key(json);
  return await parseWasm<DerivedChannelFileKey>(resultJson);
}

// ── Key Fingerprints ─────────────────────────────────────────────────────

/**
 * Compute a fingerprint of an encryption key for verification.
 *
 * Used for automatic key verification between peers. Both sides compute
 * the fingerprint independently and compare — if they match, no MITM
 * attack occurred.
 *
 * @param keyHex - Hex-encoded 256-bit encryption key
 * @returns A 16-character hex fingerprint
 */
export async function computeKeyFingerprint(
  keyHex: string,
): Promise<KeyFingerprint> {
  const json = JSON.stringify({ key_hex: keyHex });
  const resultJson = wasm().umbra_wasm_compute_key_fingerprint(json);
  return await parseWasm<KeyFingerprint>(resultJson);
}

/**
 * Verify a key fingerprint received from a remote peer.
 *
 * @param keyHex - Hex-encoded local encryption key
 * @param remoteFingerprint - Fingerprint received from the peer
 * @returns Whether the fingerprints match
 */
export async function verifyKeyFingerprint(
  keyHex: string,
  remoteFingerprint: string,
): Promise<KeyVerificationResult> {
  const json = JSON.stringify({
    key_hex: keyHex,
    remote_fingerprint: remoteFingerprint,
  });
  const resultJson = wasm().umbra_wasm_verify_key_fingerprint(json);
  return await parseWasm<KeyVerificationResult>(resultJson);
}

// ── Re-encryption Management ─────────────────────────────────────────────

/**
 * Mark all files in a channel for re-encryption after key rotation.
 *
 * When a community channel's group key is rotated (e.g., member removed),
 * all existing files need to be re-encrypted with the new key. This marks
 * them for lazy on-access re-encryption.
 *
 * @param channelId - The channel whose files need re-encryption
 * @param newKeyVersion - The new key version number
 * @returns Number of files marked
 */
export async function markFilesForReencryption(
  channelId: string,
  newKeyVersion: number,
): Promise<ReencryptionMarkResult> {
  const json = JSON.stringify({
    channel_id: channelId,
    new_key_version: newKeyVersion,
  });
  const resultJson = wasm().umbra_wasm_mark_files_for_reencryption(json);
  return await parseWasm<ReencryptionMarkResult>(resultJson);
}

/**
 * Get files that need re-encryption in a channel.
 *
 * Used for on-access re-encryption: when a user accesses a file marked
 * for re-encryption, the app re-encrypts it with the current key version.
 *
 * @param channelId - The channel to check
 * @param limit - Maximum number of files to return (default 10)
 * @returns Array of file records needing re-encryption
 */
export async function getFilesNeedingReencryption(
  channelId: string,
  limit?: number,
): Promise<FileNeedingReencryption[]> {
  const json = JSON.stringify({
    channel_id: channelId,
    limit: limit ?? 10,
  });
  const resultJson = wasm().umbra_wasm_get_files_needing_reencryption(json);
  return await parseWasm<FileNeedingReencryption[]>(resultJson);
}

/**
 * Clear the re-encryption flag after a file has been successfully re-encrypted.
 *
 * @param fileId - The file that was re-encrypted
 * @param fingerprint - Optional new encryption fingerprint
 */
export async function clearReencryptionFlag(
  fileId: string,
  fingerprint?: string,
): Promise<void> {
  const json = JSON.stringify({
    file_id: fileId,
    ...(fingerprint !== undefined ? { fingerprint } : {}),
  });
  wasm().umbra_wasm_clear_reencryption_flag(json);
}
