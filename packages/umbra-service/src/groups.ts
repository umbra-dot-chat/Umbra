/**
 * Groups module (CRUD, encryption, and invitations)
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type {
  Group,
  GroupMember,
  GroupEvent,
  PendingGroupInvite,
  GroupInvitePayload,
  Message,
} from './types';

// =============================================================================
// GROUP CRUD
// =============================================================================

/**
 * Create a new group
 */
export async function createGroup(
  name: string,
  description?: string
): Promise<{ groupId: string; conversationId: string }> {
  const json = JSON.stringify({ name, description });
  const resultJson = wasm().umbra_wasm_groups_create(json);
  return await parseWasm<{ groupId: string; conversationId: string }>(resultJson);
}

/**
 * Get group info by ID
 */
export async function getGroup(groupId: string): Promise<Group> {
  const resultJson = wasm().umbra_wasm_groups_get(groupId);
  return await parseWasm<Group>(resultJson);
}

/**
 * List all groups
 */
export async function getGroups(): Promise<Group[]> {
  const resultJson = wasm().umbra_wasm_groups_list();
  return await parseWasm<Group[]>(resultJson);
}

/**
 * Update a group
 */
export async function updateGroup(
  groupId: string,
  name: string,
  description?: string
): Promise<void> {
  const json = JSON.stringify({ group_id: groupId, name, description });
  wasm().umbra_wasm_groups_update(json);
}

/**
 * Delete a group (admin only)
 */
export async function deleteGroup(groupId: string): Promise<void> {
  wasm().umbra_wasm_groups_delete(groupId);
}

/**
 * Add a member to a group
 */
export async function addGroupMember(
  groupId: string,
  did: string,
  displayName?: string
): Promise<void> {
  const json = JSON.stringify({ group_id: groupId, did, display_name: displayName });
  wasm().umbra_wasm_groups_add_member(json);
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(groupId: string, did: string): Promise<void> {
  const json = JSON.stringify({ group_id: groupId, did });
  wasm().umbra_wasm_groups_remove_member(json);
}

/**
 * Get all members of a group
 */
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const resultJson = wasm().umbra_wasm_groups_get_members(groupId);
  return await parseWasm<GroupMember[]>(resultJson);
}

// =============================================================================
// GROUP ENCRYPTION
// =============================================================================

/**
 * Generate a shared encryption key for a group.
 *
 * Creates a random AES-256 key, encrypts it with the creator's
 * key-wrapping key, and stores it as version 1.
 *
 * @param groupId - Group ID
 * @returns Key metadata including version
 */
export async function generateGroupKey(
  groupId: string
): Promise<{ groupId: string; keyVersion: number }> {
  const resultJson = wasm().umbra_wasm_groups_generate_key(groupId);
  return await parseWasm<{ groupId: string; keyVersion: number }>(resultJson);
}

/**
 * Rotate the group encryption key.
 *
 * Generates a new AES-256 key and increments the key version.
 * Call this after removing a member to prevent them from reading
 * new messages.
 *
 * @param groupId - Group ID
 * @returns New key metadata
 */
export async function rotateGroupKey(
  groupId: string
): Promise<{ groupId: string; keyVersion: number }> {
  const resultJson = wasm().umbra_wasm_groups_rotate_key(groupId);
  return await parseWasm<{ groupId: string; keyVersion: number }>(resultJson);
}

/**
 * Import a group key received from another member via ECDH.
 *
 * Decrypts the key using the sender's public key (ECDH), then
 * re-encrypts it with our own key-wrapping key for storage.
 *
 * @param encryptedKey - Hex-encoded encrypted key
 * @param nonce - Hex-encoded nonce
 * @param senderDid - DID of the member who sent the key
 * @param groupId - Group ID
 * @param keyVersion - Version number
 */
export async function importGroupKey(
  encryptedKey: string,
  nonce: string,
  senderDid: string,
  groupId: string,
  keyVersion: number
): Promise<void> {
  const json = JSON.stringify({
    encrypted_key: encryptedKey,
    nonce,
    sender_did: senderDid,
    group_id: groupId,
    key_version: keyVersion,
  });
  wasm().umbra_wasm_groups_import_key(json);
}

/**
 * Encrypt a group key for a specific member using ECDH.
 *
 * Used when inviting a member or during key rotation to securely
 * transfer the group key to each member.
 *
 * @param groupId - Group ID
 * @param memberDid - The member's DID
 * @param keyVersion - Which key version to encrypt
 * @returns Encrypted key and nonce for relay transmission
 */
export async function encryptGroupKeyForMember(
  groupId: string,
  memberDid: string,
  keyVersion: number
): Promise<{ encryptedKey: string; nonce: string }> {
  const json = JSON.stringify({
    group_id: groupId,
    member_did: memberDid,
    key_version: keyVersion,
  });
  const resultJson = wasm().umbra_wasm_groups_encrypt_key_for_member(json);
  return await parseWasm<{ encryptedKey: string; nonce: string }>(resultJson);
}

/**
 * Encrypt a message using the group's shared key.
 *
 * @param groupId - Group ID
 * @param plaintext - Message text
 * @returns Encrypted data for relay transmission
 */
export async function encryptGroupMessage(
  groupId: string,
  plaintext: string
): Promise<{ ciphertext: string; nonce: string; keyVersion: number }> {
  const json = JSON.stringify({
    group_id: groupId,
    plaintext,
  });
  const resultJson = wasm().umbra_wasm_groups_encrypt_message(json);
  return await parseWasm<{ ciphertext: string; nonce: string; keyVersion: number }>(resultJson);
}

/**
 * Decrypt a group message using the specified key version.
 *
 * @param groupId - Group ID
 * @param ciphertext - Hex-encoded ciphertext
 * @param nonce - Hex-encoded nonce
 * @param keyVersion - Key version that was used for encryption
 * @returns Decrypted plaintext
 */
export async function decryptGroupMessage(
  groupId: string,
  ciphertext: string,
  nonce: string,
  keyVersion: number
): Promise<string> {
  const json = JSON.stringify({
    group_id: groupId,
    ciphertext,
    nonce,
    key_version: keyVersion,
  });
  const resultJson = wasm().umbra_wasm_groups_decrypt_message(json);
  return await parseWasm<string>(resultJson);
}

// =============================================================================
// GROUP INVITATIONS
// =============================================================================

/**
 * Send a group invitation to a friend via relay.
 *
 * Rust handles: group info lookup, profile, key encryption for invitee,
 * member list, UUID generation, and envelope construction.
 *
 * @param groupId - Group ID
 * @param memberDid - Friend's DID to invite
 * @param relayWs - WebSocket for relay delivery
 */
export async function sendGroupInvite(
  groupId: string,
  memberDid: string,
  relayWs?: WebSocket | null
): Promise<void> {
  const json = JSON.stringify({ group_id: groupId, member_did: memberDid });
  const resultJson = wasm().umbra_wasm_groups_send_invite(json);
  const raw = await parseWasm<{
    relayMessages: Array<{ toDid: string; payload: string }>;
  }>(resultJson);

  if (relayWs && relayWs.readyState === WebSocket.OPEN && raw.relayMessages) {
    for (const rm of raw.relayMessages) {
      relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
    }
  }
}

/**
 * Store a received group invite in the local database.
 *
 * Called when we receive a group_invite relay envelope.
 */
export async function storeGroupInvite(payload: GroupInvitePayload): Promise<void> {
  const json = JSON.stringify({
    id: payload.inviteId,
    group_id: payload.groupId,
    group_name: payload.groupName,
    description: payload.description ?? null,
    inviter_did: payload.inviterDid,
    inviter_name: payload.inviterName,
    encrypted_group_key: payload.encryptedGroupKey,
    nonce: payload.nonce,
    members_json: payload.membersJson,
    created_at: payload.timestamp,
  });
  wasm().umbra_wasm_groups_store_invite(json);
}

/**
 * Get all pending group invitations.
 */
export async function getPendingGroupInvites(): Promise<PendingGroupInvite[]> {
  const resultJson = wasm().umbra_wasm_groups_get_pending_invites();
  return await parseWasm<PendingGroupInvite[]>(resultJson);
}

/**
 * Accept a group invitation.
 *
 * Imports the group key, creates the group and conversation locally,
 * and sends an acceptance notification to the inviter via relay.
 * Rust builds the acceptance envelope (profile + inviter lookup).
 *
 * @param inviteId - Invite ID
 * @param relayWs - WebSocket for relay notification
 * @returns Group and conversation IDs
 */
export async function acceptGroupInvite(
  inviteId: string,
  relayWs?: WebSocket | null
): Promise<{ groupId: string; conversationId: string }> {
  const resultJson = wasm().umbra_wasm_groups_accept_invite(inviteId);
  const result = await parseWasm<{ groupId: string; conversationId: string }>(resultJson);

  // Build and send acceptance envelope via Rust
  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    try {
      const envJson = JSON.stringify({ invite_id: inviteId, group_id: result.groupId });
      const envResultJson = wasm().umbra_wasm_groups_build_invite_accept_envelope(envJson);
      const envResult = await parseWasm<{
        relayMessages: Array<{ toDid: string; payload: string }>;
      }>(envResultJson);

      for (const rm of envResult.relayMessages) {
        relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
      }
    } catch (err) {
      console.warn('[UmbraService] Failed to send invite acceptance via relay:', err);
    }
  }

  return result;
}

/**
 * Decline a group invitation.
 *
 * Rust builds the decline envelope (invite lookup + profile) before
 * the invite is deleted from the database.
 *
 * @param inviteId - Invite ID
 * @param relayWs - WebSocket for relay notification
 */
export async function declineGroupInvite(
  inviteId: string,
  relayWs?: WebSocket | null
): Promise<void> {
  // Build envelope BEFORE declining (invite still exists in DB)
  let relayMessages: Array<{ toDid: string; payload: string }> = [];
  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    try {
      const envJson = JSON.stringify({ invite_id: inviteId });
      const envResultJson = wasm().umbra_wasm_groups_build_invite_decline_envelope(envJson);
      const envResult = await parseWasm<{
        relayMessages: Array<{ toDid: string; payload: string }>;
      }>(envResultJson);
      relayMessages = envResult.relayMessages ?? [];
    } catch (err) {
      console.warn('[UmbraService] Failed to build decline envelope:', err);
    }
  }

  // Now decline (deletes/marks the invite)
  wasm().umbra_wasm_groups_decline_invite(inviteId);

  // Send the pre-built envelopes
  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    for (const rm of relayMessages) {
      relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
    }
  }
}

/**
 * Send a group message to all members via relay fan-out.
 *
 * Rust handles: encryption, local storage, UUID generation,
 * member lookup, and envelope construction for all members.
 *
 * @param groupId - Group ID
 * @param conversationId - Conversation ID for the group
 * @param text - Message text
 * @param relayWs - WebSocket for relay delivery
 * @returns The sent message
 */
export async function sendGroupMessage(
  groupId: string,
  conversationId: string,
  text: string,
  relayWs?: WebSocket | null
): Promise<Message> {
  const json = JSON.stringify({ group_id: groupId, conversation_id: conversationId, text });
  const resultJson = wasm().umbra_wasm_groups_send_message(json);
  const raw = await parseWasm<{
    message: {
      id: string;
      conversationId: string;
      senderDid: string;
      timestamp: number;
    };
    relayMessages: Array<{ toDid: string; payload: string }>;
  }>(resultJson);

  // Fan-out relay messages
  if (relayWs && relayWs.readyState === WebSocket.OPEN && raw.relayMessages) {
    for (const rm of raw.relayMessages) {
      relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
    }
  }

  return {
    id: raw.message.id,
    conversationId: raw.message.conversationId,
    senderDid: raw.message.senderDid,
    content: { type: 'text', text },
    timestamp: raw.message.timestamp,
    read: false,
    delivered: false,
    status: 'sent',
  };
}

/**
 * Remove a member from a group with key rotation.
 *
 * Rust handles: member removal, key rotation, per-member ECDH key
 * encryption, and building both `group_key_rotation` and
 * `group_member_removed` envelopes for all remaining members.
 *
 * @param groupId - Group ID
 * @param memberDid - DID of the member to remove
 * @param relayWs - WebSocket for relay notifications
 */
export async function removeGroupMemberWithRotation(
  groupId: string,
  memberDid: string,
  relayWs?: WebSocket | null
): Promise<void> {
  const json = JSON.stringify({ group_id: groupId, member_did: memberDid });
  const resultJson = wasm().umbra_wasm_groups_remove_member_with_rotation(json);
  const raw = await parseWasm<{
    keyVersion: number;
    relayMessages: Array<{ toDid: string; payload: string }>;
  }>(resultJson);

  if (relayWs && relayWs.readyState === WebSocket.OPEN && raw.relayMessages) {
    for (const rm of raw.relayMessages) {
      try {
        relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
      } catch (err) {
        console.warn('[UmbraService] Failed to send relay message:', err);
      }
    }
  }
}

/**
 * Group event listener management
 */
export type GroupListenerCallback = (event: GroupEvent) => void;
