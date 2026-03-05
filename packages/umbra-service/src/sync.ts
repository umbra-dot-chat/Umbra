/**
 * Account sync service
 *
 * Provides encrypted sync blob CRUD via relay REST endpoints and WASM wrappers
 * for creating, parsing, and applying sync blobs. Uses challenge-response
 * authentication with Ed25519 signatures.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import { ErrorCode, UmbraError } from './errors';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Result of sync authentication (challenge-response). */
export interface SyncAuthResult {
  /** Bearer token for subsequent sync API calls */
  token: string;
  /** When the token expires (Unix timestamp) */
  expiresAt: number;
}

/** Summary of a sync blob section (returned by parseSyncBlob). */
export interface SyncSectionSummary {
  /** Section version counter */
  v: number;
  /** Number of items in this section */
  count: number;
  /** When this section was last updated (Unix timestamp) */
  updatedAt: number;
}

/** Summary of a parsed sync blob. */
export interface SyncBlobSummary {
  /** Blob format version */
  v: number;
  /** When the blob was created (Unix timestamp) */
  updatedAt: number;
  /** Per-section summaries */
  sections: Record<string, SyncSectionSummary>;
}

/** Result of creating a sync blob via WASM. */
export interface SyncCreateResult {
  /** Base64-encoded encrypted blob */
  blob: string;
  /** Per-section version counters */
  sections: Record<string, number>;
  /** Blob size in bytes */
  size: number;
}

/** Result of applying (importing) a sync blob. */
export interface SyncImportResult {
  imported: {
    settings: number;
    friends: number;
    groups: number;
    blockedUsers: number;
  };
}

/** Relay blob metadata (returned by GET /api/sync/:did/meta). */
export interface SyncBlobMeta {
  /** DID of the blob owner */
  did: string;
  /** Blob size in bytes */
  size: number;
  /** When the blob was last updated (Unix timestamp) */
  updatedAt: number;
  /** When the blob expires (Unix timestamp) */
  expiresAt: number;
}

/** Sync delta for real-time WS updates. */
export interface SyncDelta {
  /** Section name (e.g. "preferences", "friends") */
  section: string;
  /** Section version after this delta */
  version: number;
  /** Base64-encoded encrypted delta data */
  encryptedData: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Authenticate with the relay sync API using Ed25519 challenge-response.
 *
 * 1. POST /api/sync/:did/auth → receive nonce
 * 2. Sign nonce with Ed25519 key via WASM
 * 3. POST /api/sync/:did/verify → receive Bearer token
 *
 * @param relayUrl - Base URL of the relay (e.g. "https://relay.umbra.chat")
 * @param did - The user's DID
 * @returns Bearer token and expiry
 */
export async function authenticateSync(
  relayUrl: string,
  did: string,
): Promise<SyncAuthResult> {
  const baseUrl = relayUrl.replace(/\/+$/, '');

  // Step 1: Request challenge nonce
  const challengeRes = await fetch(`${baseUrl}/api/sync/${encodeURIComponent(did)}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!challengeRes.ok) {
    const body = await challengeRes.text().catch(() => '');
    throw new UmbraError(
      ErrorCode.ConnectionFailed,
      `Sync auth challenge failed (${challengeRes.status}): ${body}`,
      true,
    );
  }

  const { nonce } = (await challengeRes.json()) as { nonce: string };

  // Step 2: Sign nonce via WASM
  const signResult = await parseWasm<{ signature: string; publicKey: string }>(
    wasm().umbra_wasm_sync_sign_challenge(JSON.stringify({ nonce })),
  );

  // Step 3: Verify signature and get token
  const verifyRes = await fetch(`${baseUrl}/api/sync/${encodeURIComponent(did)}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nonce,
      signature: signResult.signature,
      public_key: signResult.publicKey,
    }),
  });

  if (!verifyRes.ok) {
    const body = await verifyRes.text().catch(() => '');
    throw new UmbraError(
      ErrorCode.VerificationFailed,
      `Sync auth verification failed (${verifyRes.status}): ${body}`,
      true,
    );
  }

  const { token, expires_at } = (await verifyRes.json()) as {
    token: string;
    expires_at: number;
  };

  return { token, expiresAt: expires_at };
}

// ─────────────────────────────────────────────────────────────────────────────
// Blob CRUD (Relay REST)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload an encrypted sync blob to the relay.
 *
 * Creates the blob via WASM (collecting data from the local DB), then PUTs
 * the encrypted binary to the relay.
 *
 * @param relayUrl - Base URL of the relay
 * @param did - The user's DID
 * @param token - Bearer token from authenticateSync()
 * @param sectionVersions - Optional current section version counters
 * @returns The create result with section versions and size
 */
export async function uploadSyncBlob(
  relayUrl: string,
  did: string,
  token: string,
  sectionVersions?: Record<string, number>,
): Promise<SyncCreateResult> {
  // 1. Create encrypted blob via WASM
  const input = sectionVersions ? { section_versions: sectionVersions } : {};
  const createResult = await parseWasm<SyncCreateResult>(
    wasm().umbra_wasm_sync_create_blob(JSON.stringify(input)),
  );

  // 2. Convert base64 blob to binary
  const binaryStr = atob(createResult.blob);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  // 3. Upload to relay
  const baseUrl = relayUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/api/sync/${encodeURIComponent(did)}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
    },
    body: bytes,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new UmbraError(
      ErrorCode.SyncUploadFailed,
      `Sync blob upload failed (${res.status}): ${body}`,
      true,
    );
  }

  return createResult;
}

/**
 * Download an encrypted sync blob from the relay.
 *
 * @param relayUrl - Base URL of the relay
 * @param did - The user's DID
 * @param token - Bearer token from authenticateSync()
 * @returns Base64-encoded blob string, or null if no blob exists
 */
export async function downloadSyncBlob(
  relayUrl: string,
  did: string,
  token: string,
): Promise<string | null> {
  const baseUrl = relayUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/api/sync/${encodeURIComponent(did)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new UmbraError(
      ErrorCode.SyncDownloadFailed,
      `Sync blob download failed (${res.status}): ${body}`,
      true,
    );
  }

  // Convert binary response to base64
  const arrayBuf = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Get metadata about a sync blob without downloading it.
 *
 * @param relayUrl - Base URL of the relay
 * @param did - The user's DID
 * @param token - Bearer token from authenticateSync()
 * @returns Blob metadata, or null if no blob exists
 */
export async function getSyncBlobMeta(
  relayUrl: string,
  did: string,
  token: string,
): Promise<SyncBlobMeta | null> {
  const baseUrl = relayUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/api/sync/${encodeURIComponent(did)}/meta`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new UmbraError(
      ErrorCode.SyncDownloadFailed,
      `Sync blob meta fetch failed (${res.status}): ${body}`,
      true,
    );
  }

  const data = await res.json();
  return {
    did: data.did,
    size: data.size,
    updatedAt: data.updated_at,
    expiresAt: data.expires_at,
  };
}

/**
 * Delete a sync blob from the relay.
 *
 * @param relayUrl - Base URL of the relay
 * @param did - The user's DID
 * @param token - Bearer token from authenticateSync()
 * @returns true if a blob was deleted, false if none existed
 */
export async function deleteSyncBlob(
  relayUrl: string,
  did: string,
  token: string,
): Promise<boolean> {
  const baseUrl = relayUrl.replace(/\/+$/, '');
  const res = await fetch(`${baseUrl}/api/sync/${encodeURIComponent(did)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) {
    return false;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new UmbraError(
      ErrorCode.SyncDeleteFailed,
      `Sync blob delete failed (${res.status}): ${body}`,
      true,
    );
  }

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// WASM Wrappers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an encrypted sync blob from the local database.
 *
 * Collects preferences, friends, groups, and blocked users from the DB,
 * serializes to CBOR, compresses, and encrypts with the sync key.
 *
 * @param sectionVersions - Optional current section version counters
 * @returns The blob (base64), section versions, and size
 */
export async function createSyncBlob(
  sectionVersions?: Record<string, number>,
): Promise<SyncCreateResult> {
  const input = sectionVersions ? { section_versions: sectionVersions } : {};
  return parseWasm<SyncCreateResult>(
    wasm().umbra_wasm_sync_create_blob(JSON.stringify(input)),
  );
}

/**
 * Parse an encrypted sync blob and return a summary.
 *
 * Decrypts and deserializes the blob but only returns metadata (section names,
 * versions, item counts) — does not import anything.
 *
 * @param blob - Base64-encoded encrypted blob
 * @returns Blob summary with per-section metadata
 */
export async function parseSyncBlob(blob: string): Promise<SyncBlobSummary> {
  return parseWasm<SyncBlobSummary>(
    wasm().umbra_wasm_sync_parse_blob(JSON.stringify({ blob })),
  );
}

/**
 * Apply (import) an encrypted sync blob into the local database.
 *
 * Decrypts the blob and upserts preferences, friends, groups, and blocked
 * users into the DB.
 *
 * @param blob - Base64-encoded encrypted blob
 * @returns Import statistics
 */
export async function applySyncBlob(blob: string): Promise<SyncImportResult> {
  return parseWasm<SyncImportResult>(
    wasm().umbra_wasm_sync_apply_blob(JSON.stringify({ blob })),
  );
}

/**
 * Create an encrypted delta for a single sync section.
 *
 * @param section - Section name (e.g. "preferences", "friends")
 * @returns Encrypted delta ready for WS transmission
 */
export async function createSyncDelta(section: string): Promise<SyncDelta> {
  return parseWasm<SyncDelta>(
    wasm().umbra_wasm_sync_create_blob(JSON.stringify({ sections: [section] })),
  );
}

/**
 * Apply an incoming sync delta to the local database.
 *
 * @param delta - The delta received via WebSocket
 * @returns Whether the delta was applied and the resulting version
 */
export async function applySyncDelta(
  delta: SyncDelta,
): Promise<{ applied: boolean; section: string; version: number }> {
  return parseWasm<{ applied: boolean; section: string; version: number }>(
    wasm().umbra_wasm_sync_apply_blob(
      JSON.stringify({
        blob: delta.encryptedData,
        section: delta.section,
        version: delta.version,
      }),
    ),
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// High-Level Convenience
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full sync flow: authenticate → create blob → upload.
 *
 * Convenience function that handles the entire upload sequence.
 *
 * @param relayUrl - Base URL of the relay
 * @param did - The user's DID
 * @param sectionVersions - Optional current section version counters
 * @returns Auth result and create result
 */
export async function fullSyncUpload(
  relayUrl: string,
  did: string,
  sectionVersions?: Record<string, number>,
): Promise<{ auth: SyncAuthResult; result: SyncCreateResult }> {
  const auth = await authenticateSync(relayUrl, did);
  const result = await uploadSyncBlob(relayUrl, did, auth.token, sectionVersions);
  return { auth, result };
}

/**
 * Full sync flow: authenticate → download → parse summary.
 *
 * Convenience function that checks whether a sync blob exists and returns
 * its summary without importing.
 *
 * @param relayUrl - Base URL of the relay
 * @param did - The user's DID
 * @returns Blob summary and the raw base64 blob, or null if none exists
 */
export async function fullSyncCheck(
  relayUrl: string,
  did: string,
): Promise<{ auth: SyncAuthResult; blob: string; summary: SyncBlobSummary } | null> {
  const auth = await authenticateSync(relayUrl, did);
  const blob = await downloadSyncBlob(relayUrl, did, auth.token);
  if (!blob) return null;

  const summary = await parseSyncBlob(blob);
  return { auth, blob, summary };
}

/**
 * Full sync flow: authenticate → download → apply.
 *
 * Convenience function that downloads and imports a sync blob.
 *
 * @param relayUrl - Base URL of the relay
 * @param did - The user's DID
 * @returns Import result, or null if no blob exists
 */
export async function fullSyncRestore(
  relayUrl: string,
  did: string,
): Promise<SyncImportResult | null> {
  const auth = await authenticateSync(relayUrl, did);
  const blob = await downloadSyncBlob(relayUrl, did, auth.token);
  if (!blob) return null;

  return applySyncBlob(blob);
}
