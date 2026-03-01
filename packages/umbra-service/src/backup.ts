/**
 * Account backup and restore module
 *
 * Provides encrypted backup of account data (settings, friends, conversations,
 * groups, blocked users) to relay, and restoration from relay on account import.
 *
 * Backup encryption uses a key derived deterministically from the BIP39 master
 * seed, so any device with the recovery phrase can decrypt the backup.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface BackupResult {
  /** Number of 64KB chunks the backup was split into */
  chunkCount: number;
  /** Total encrypted size in bytes */
  totalSize: number;
}

export interface RestoreResult {
  imported: {
    settings: number;
    friends: number;
    conversations: number;
    groups: number;
    blocked_users: number;
  };
}

export interface BackupManifest {
  backupId: string;
  senderDid: string;
  totalChunks: number;
  totalSize: number;
  nonce: string;
  timestamp: number;
}

export interface BackupChunk {
  backupId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string;
  hash: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an encrypted account backup and send it to the relay.
 *
 * The backup is encrypted with a key derived from the BIP39 master seed,
 * compressed, chunked into 64KB pieces, and sent to the user's own DID
 * on the relay for cross-device recovery.
 *
 * @param relayWs - Active WebSocket connection to the relay
 * @param ownDid - The user's own DID
 * @returns Backup statistics (chunk count and total size)
 */
export async function createAccountBackup(
  relayWs: WebSocket,
  ownDid: string,
): Promise<BackupResult> {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) {
    throw new Error('Relay not connected');
  }

  const resultJson = wasm().umbra_wasm_account_create_backup(JSON.stringify({}));
  const result = await parseWasm<{
    relayMessages: Array<{ to_did: string; payload: string }>;
    chunkCount: number;
    totalSize: number;
  }>(resultJson);

  // Send all relay messages (manifest + chunks)
  for (const msg of result.relayMessages) {
    relayWs.send(
      JSON.stringify({
        type: 'send',
        to_did: msg.to_did,
        payload: msg.payload,
      }),
    );
  }

  return {
    chunkCount: result.chunkCount,
    totalSize: result.totalSize,
  };
}

/**
 * Restore account data from an encrypted backup fetched from the relay.
 *
 * Parses offline messages for backup manifest and chunks, reassembles them,
 * and passes to the WASM layer for decryption and database import.
 *
 * @param relayWs - Active WebSocket connection to the relay
 * @param ownDid - The user's own DID
 * @returns Import stats, or null if no backup was found
 */
export async function restoreAccountBackup(
  relayWs: WebSocket,
  ownDid: string,
): Promise<RestoreResult | null> {
  // This function is called after FetchOffline has already been processed.
  // The caller should pass the offline messages to parseBackupManifest/parseBackupChunks
  // and then call restoreFromChunks directly.
  // This is a convenience wrapper that does nothing if there's no pending data.
  console.warn('[backup] Use parseBackupManifest + restoreFromChunks for offline message flow');
  return null;
}

/**
 * Parse offline messages to find a backup manifest.
 *
 * @param offlineMessages - Array of parsed relay message payloads
 * @returns The most recent backup manifest, or null if none found
 */
export function parseBackupManifest(
  offlineMessages: Array<{ envelope?: string; payload?: any }>,
): BackupManifest | null {
  const manifests = offlineMessages
    .filter((m) => m.envelope === 'account_backup_manifest')
    .map((m) => m.payload as BackupManifest)
    .sort((a, b) => b.timestamp - a.timestamp);

  return manifests[0] ?? null;
}

/**
 * Parse offline messages to extract ordered backup chunks for a given backup ID.
 *
 * @param offlineMessages - Array of parsed relay message payloads
 * @param backupId - The backup ID from the manifest
 * @returns Ordered array of base64-encoded chunk data strings
 */
export function parseBackupChunks(
  offlineMessages: Array<{ envelope?: string; payload?: any }>,
  backupId: string,
): string[] {
  const chunks = offlineMessages
    .filter(
      (m) =>
        m.envelope === 'account_backup_chunk' &&
        m.payload?.backupId === backupId,
    )
    .sort((a, b) => (a.payload?.chunkIndex ?? 0) - (b.payload?.chunkIndex ?? 0))
    .map((m) => m.payload?.data as string);

  return chunks;
}

/**
 * Restore from pre-parsed backup chunks and manifest nonce.
 *
 * @param chunks - Ordered base64-encoded encrypted chunk data
 * @param nonce - Hex-encoded nonce from the backup manifest
 * @returns Import stats
 */
export async function restoreFromChunks(
  chunks: string[],
  nonce: string,
): Promise<RestoreResult> {
  const json = JSON.stringify({ chunks, nonce });
  const resultJson = wasm().umbra_wasm_account_restore_backup(json);
  const result = await parseWasm<RestoreResult>(resultJson);
  return result;
}
