/**
 * File Transfer module — TypeScript wrappers for P2P file transfer WASM functions.
 *
 * Provides:
 * - `initiateTransfer()` — start a new file transfer to a peer
 * - `acceptTransfer()` — accept an incoming transfer request
 * - `pauseTransfer()` / `resumeTransfer()` — pause/resume a transfer
 * - `cancelTransfer()` — cancel a transfer
 * - `processTransferMessage()` — handle incoming transfer protocol messages
 * - `getTransfers()` / `getTransfer()` — query active transfers
 * - `getIncompleteTransfers()` — get resumable transfers
 * - `getChunksToSend()` — get next chunks to send (respects flow control)
 * - `markChunkSent()` — mark a chunk as sent for RTT tracking
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type {
  TransferProgress,
  TransferDirection,
  TransportType,
} from './types';

// ── Initiate Transfer ──────────────────────────────────────────────────────

/**
 * Initiate a file transfer to a peer.
 *
 * Creates a new transfer session and returns the transfer request message
 * that should be sent to the peer via relay.
 *
 * @param fileId - ID of the file to transfer
 * @param peerDid - DID of the recipient
 * @param manifestJson - JSON-encoded chunk manifest
 * @param direction - 'upload' or 'download'
 * @param transportType - Transport to use (default: 'relay')
 * @returns Transfer progress with initial state
 */
export async function initiateTransfer(
  fileId: string,
  peerDid: string,
  manifestJson: string,
  direction: TransferDirection = 'upload',
  transportType: TransportType = 'relay',
): Promise<TransferProgress> {
  const json = JSON.stringify({
    file_id: fileId,
    peer_did: peerDid,
    manifest_json: manifestJson,
    direction,
    transport_type: transportType,
  });
  const resultJson = wasm().umbra_wasm_transfer_initiate(json);
  return await parseWasm<TransferProgress>(resultJson);
}

// ── Accept Transfer ────────────────────────────────────────────────────────

/**
 * Accept an incoming transfer request.
 *
 * @param transferId - ID of the transfer to accept
 * @returns Updated transfer progress
 */
export async function acceptTransfer(
  transferId: string,
): Promise<TransferProgress> {
  const json = JSON.stringify({ transfer_id: transferId });
  const resultJson = wasm().umbra_wasm_transfer_accept(json);
  return await parseWasm<TransferProgress>(resultJson);
}

// ── Pause Transfer ─────────────────────────────────────────────────────────

/**
 * Pause an active transfer.
 *
 * @param transferId - ID of the transfer to pause
 * @returns Updated transfer progress
 */
export async function pauseTransfer(
  transferId: string,
): Promise<TransferProgress> {
  const resultJson = wasm().umbra_wasm_transfer_pause(transferId);
  return await parseWasm<TransferProgress>(resultJson);
}

// ── Resume Transfer ────────────────────────────────────────────────────────

/**
 * Resume a paused transfer.
 *
 * @param transferId - ID of the transfer to resume
 * @returns Updated transfer progress
 */
export async function resumeTransfer(
  transferId: string,
): Promise<TransferProgress> {
  const resultJson = wasm().umbra_wasm_transfer_resume(transferId);
  return await parseWasm<TransferProgress>(resultJson);
}

// ── Cancel Transfer ────────────────────────────────────────────────────────

/**
 * Cancel a transfer (from either side).
 *
 * @param transferId - ID of the transfer to cancel
 * @param reason - Optional reason for cancellation
 * @returns Updated transfer progress
 */
export async function cancelTransfer(
  transferId: string,
  reason?: string,
): Promise<TransferProgress> {
  const json = JSON.stringify({
    transfer_id: transferId,
    ...(reason ? { reason } : {}),
  });
  const resultJson = wasm().umbra_wasm_transfer_cancel(json);
  return await parseWasm<TransferProgress>(resultJson);
}

// ── Process Transfer Message ───────────────────────────────────────────────

/**
 * Process an incoming file transfer protocol message.
 *
 * This handles all 10 message variants (TransferRequest, TransferAccept,
 * ChunkData, ChunkAck, etc.) and updates internal state accordingly.
 *
 * @param messageJson - JSON-encoded FileTransferMessage
 * @returns Result with any events that were generated
 */
export async function processTransferMessage(
  messageJson: string,
): Promise<{ events: Array<Record<string, unknown>> }> {
  const resultJson = wasm().umbra_wasm_transfer_on_message(messageJson);
  return await parseWasm<{ events: Array<Record<string, unknown>> }>(resultJson);
}

// ── List Transfers ─────────────────────────────────────────────────────────

/**
 * Get all active transfer sessions.
 *
 * @returns Array of transfer progress objects
 */
export async function getTransfers(): Promise<TransferProgress[]> {
  const resultJson = wasm().umbra_wasm_transfer_list();
  return await parseWasm<TransferProgress[]>(resultJson);
}

// ── Get Transfer ───────────────────────────────────────────────────────────

/**
 * Get a specific transfer by ID.
 *
 * @param transferId - ID of the transfer
 * @returns Transfer progress, or null if not found
 */
export async function getTransfer(
  transferId: string,
): Promise<TransferProgress | null> {
  const resultJson = wasm().umbra_wasm_transfer_get(transferId);
  return await parseWasm<TransferProgress | null>(resultJson);
}

// ── Get Incomplete Transfers ───────────────────────────────────────────────

/**
 * Get all incomplete transfers that can be resumed.
 *
 * Useful for restoring transfer state after app restart.
 *
 * @returns Array of incomplete transfer progress objects
 */
export async function getIncompleteTransfers(): Promise<TransferProgress[]> {
  const resultJson = wasm().umbra_wasm_transfer_get_incomplete();
  return await parseWasm<TransferProgress[]>(resultJson);
}

// ── Get Chunks To Send ─────────────────────────────────────────────────────

/**
 * Get the next batch of chunk indices to send for a transfer.
 *
 * Respects the adaptive flow control window — only returns as many
 * chunks as the current window allows.
 *
 * @param transferId - ID of the transfer
 * @returns Array of chunk indices to send
 */
export async function getChunksToSend(
  transferId: string,
): Promise<number[]> {
  const resultJson = wasm().umbra_wasm_transfer_chunks_to_send(transferId);
  return await parseWasm<number[]>(resultJson);
}

// ── Mark Chunk Sent ────────────────────────────────────────────────────────

/**
 * Mark a chunk as sent, starting the RTT timer for flow control.
 *
 * Call this after actually transmitting the chunk data over the transport.
 *
 * @param transferId - ID of the transfer
 * @param chunkIndex - Index of the chunk that was sent
 */
export async function markChunkSent(
  transferId: string,
  chunkIndex: number,
): Promise<void> {
  const json = JSON.stringify({
    transfer_id: transferId,
    chunk_index: chunkIndex,
  });
  const resultJson = wasm().umbra_wasm_transfer_mark_chunk_sent(json);
  await parseWasm<Record<string, unknown>>(resultJson);
}
