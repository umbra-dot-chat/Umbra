/**
 * DM Files module — CRUD for shared files and folders in DM/group conversations.
 *
 * Mirrors the community file WASM bridge pattern but operates on
 * `dm_shared_files` and `dm_shared_folders` tables, scoped by conversation_id.
 *
 * The actual P2P file transfer (chunking, encryption, WebRTC DataChannel)
 * is handled separately; this module only manages metadata persistence.
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type {
  DmSharedFileRecord,
  DmSharedFolderRecord,
  DmFileEventPayload,
  RelayEnvelope,
} from './types';

// ── Files ──────────────────────────────────────────────────────────────────

/**
 * Store metadata for a file shared in a DM/group conversation.
 *
 * The actual file data should already be stored/available via P2P chunks
 * referenced in `storageChunksJson`.
 */
export async function uploadDmFile(
  conversationId: string,
  folderId: string | null,
  filename: string,
  description: string | null,
  fileSize: number,
  mimeType: string | null,
  storageChunksJson: string,
  uploadedBy: string,
): Promise<DmSharedFileRecord> {
  const json = JSON.stringify({
    conversation_id: conversationId,
    folder_id: folderId ?? null,
    filename,
    description: description ?? null,
    file_size: fileSize,
    mime_type: mimeType ?? null,
    storage_chunks_json: storageChunksJson,
    uploaded_by: uploadedBy,
  });
  const resultJson = wasm().umbra_wasm_dm_upload_file(json);
  return await parseWasm<DmSharedFileRecord>(resultJson);
}

/**
 * List files in a conversation, optionally filtered by folder.
 */
export async function getDmFiles(
  conversationId: string,
  folderId: string | null,
  limit: number,
  offset: number,
): Promise<DmSharedFileRecord[]> {
  const json = JSON.stringify({
    conversation_id: conversationId,
    folder_id: folderId ?? null,
    limit,
    offset,
  });
  const resultJson = wasm().umbra_wasm_dm_get_files(json);
  return await parseWasm<DmSharedFileRecord[]>(resultJson);
}

/**
 * Get a single shared file by ID.
 */
export async function getDmFile(id: string): Promise<DmSharedFileRecord> {
  const json = JSON.stringify({ id });
  const resultJson = wasm().umbra_wasm_dm_get_file(json);
  return await parseWasm<DmSharedFileRecord>(resultJson);
}

/**
 * Delete a shared file from the conversation.
 * Both participants can delete files they uploaded; admins in groups can delete any.
 */
export async function deleteDmFile(id: string, actorDid: string): Promise<void> {
  const json = JSON.stringify({ id, actor_did: actorDid });
  const resultJson = wasm().umbra_wasm_dm_delete_file(json);
  await parseWasm<void>(resultJson);
}

/**
 * Record a download for analytics.
 */
export async function recordDmFileDownload(id: string): Promise<void> {
  const json = JSON.stringify({ id });
  const resultJson = wasm().umbra_wasm_dm_record_file_download(json);
  await parseWasm<void>(resultJson);
}

/**
 * Move a file to a different folder within the same conversation.
 */
export async function moveDmFile(
  fileId: string,
  targetFolderId: string | null,
): Promise<void> {
  const json = JSON.stringify({
    file_id: fileId,
    target_folder_id: targetFolderId ?? null,
  });
  const resultJson = wasm().umbra_wasm_dm_move_file(json);
  await parseWasm<void>(resultJson);
}

// ── Folders ────────────────────────────────────────────────────────────────

/**
 * Create a shared folder in a DM/group conversation.
 */
export async function createDmFolder(
  conversationId: string,
  parentFolderId: string | null,
  name: string,
  createdBy: string,
): Promise<DmSharedFolderRecord> {
  const json = JSON.stringify({
    conversation_id: conversationId,
    parent_folder_id: parentFolderId ?? null,
    name,
    created_by: createdBy,
  });
  const resultJson = wasm().umbra_wasm_dm_create_folder(json);
  return await parseWasm<DmSharedFolderRecord>(resultJson);
}

/**
 * List folders in a conversation, optionally filtered by parent.
 */
export async function getDmFolders(
  conversationId: string,
  parentFolderId: string | null,
): Promise<DmSharedFolderRecord[]> {
  const json = JSON.stringify({
    conversation_id: conversationId,
    parent_folder_id: parentFolderId ?? null,
  });
  const resultJson = wasm().umbra_wasm_dm_get_folders(json);
  return await parseWasm<DmSharedFolderRecord[]>(resultJson);
}

/**
 * Delete a shared folder and all its contents.
 */
export async function deleteDmFolder(id: string): Promise<void> {
  const json = JSON.stringify({ id });
  const resultJson = wasm().umbra_wasm_dm_delete_folder(json);
  await parseWasm<void>(resultJson);
}

/**
 * Rename a shared folder.
 */
export async function renameDmFolder(
  folderId: string,
  newName: string,
): Promise<void> {
  const json = JSON.stringify({ folder_id: folderId, new_name: newName });
  const resultJson = wasm().umbra_wasm_dm_rename_folder(json);
  await parseWasm<void>(resultJson);
}

// ── Broadcast helpers ──────────────────────────────────────────────────────

/**
 * Send a DM file event to the other party via relay.
 * Used for real-time notifications about shared file changes.
 */
export function buildDmFileEventEnvelope(
  conversationId: string,
  senderDid: string,
  event: DmFileEventPayload['event'],
): RelayEnvelope {
  return {
    envelope: 'dm_file_event',
    version: 1,
    payload: {
      conversationId,
      senderDid,
      timestamp: Date.now(),
      event,
    },
  };
}

/**
 * Broadcast a DM file event to the other participant(s) via relay WebSocket.
 *
 * For 1-on-1 DMs, sends to the friend's DID.
 * For group conversations, fan-out to all members (excluding sender).
 */
export async function broadcastDmFileEvent(
  recipientDids: string[],
  envelope: RelayEnvelope,
  relayWs: WebSocket | null,
): Promise<void> {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;

  const payloadStr = JSON.stringify(envelope);

  for (const did of recipientDids) {
    const relayMessage = JSON.stringify({
      type: 'send',
      to_did: did,
      payload: payloadStr,
    });
    relayWs.send(relayMessage);
  }
}
