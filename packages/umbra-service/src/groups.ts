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
  RelayEnvelope,
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
 * Encrypts the group key for the invitee and sends the invite
 * envelope through the relay.
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
  // Get group info
  const group = await getGroup(groupId);

  // Get current key version and encrypt key for the invitee
  const keyInfo = await encryptGroupKeyForMember(groupId, memberDid, 0); // 0 = latest

  // Get our profile
  const profileJson = wasm().umbra_wasm_identity_get_profile();
  const profile = await parseWasm<{ did: string; displayName: string }>(profileJson);

  // Get group members for the invite payload
  const members = await getGroupMembers(groupId);
  const membersJson = JSON.stringify(
    members.map((m) => ({
      did: m.memberDid,
      display_name: m.displayName,
      role: m.role,
    }))
  );

  // Create invite ID
  const inviteId = crypto.randomUUID();

  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    const envelope: RelayEnvelope = {
      envelope: 'group_invite',
      version: 1,
      payload: {
        inviteId,
        groupId,
        groupName: group.name,
        description: group.description,
        inviterDid: profile.did,
        inviterName: profile.displayName,
        encryptedGroupKey: keyInfo.encryptedKey,
        nonce: keyInfo.nonce,
        membersJson,
        timestamp: Date.now(),
      },
    };

    const relayMessage = JSON.stringify({
      type: 'send',
      to_did: memberDid,
      payload: JSON.stringify(envelope),
    });

    relayWs.send(relayMessage);
    console.log('[UmbraService] Group invite sent via relay to', memberDid);
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

  // Notify the inviter via relay
  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    try {
      const profileJson = wasm().umbra_wasm_identity_get_profile();
      const profile = await parseWasm<{ did: string; displayName: string }>(profileJson);

      // Get the invite to find the inviter
      const invites = await getPendingGroupInvites();
      const invite = invites.find((i) => i.id === inviteId);

      if (invite) {
        const envelope: RelayEnvelope = {
          envelope: 'group_invite_accept',
          version: 1,
          payload: {
            inviteId,
            groupId: result.groupId,
            fromDid: profile.did,
            fromDisplayName: profile.displayName,
            timestamp: Date.now(),
          },
        };

        const relayMessage = JSON.stringify({
          type: 'send',
          to_did: invite.inviterDid,
          payload: JSON.stringify(envelope),
        });

        relayWs.send(relayMessage);
        console.log('[UmbraService] Group invite acceptance sent to', invite.inviterDid);
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
 * @param inviteId - Invite ID
 * @param relayWs - WebSocket for relay notification
 */
export async function declineGroupInvite(
  inviteId: string,
  relayWs?: WebSocket | null
): Promise<void> {
  // Get invite info before declining (for relay notification)
  const invites = await getPendingGroupInvites();
  const invite = invites.find((i) => i.id === inviteId);

  wasm().umbra_wasm_groups_decline_invite(inviteId);

  // Notify the inviter
  if (relayWs && relayWs.readyState === WebSocket.OPEN && invite) {
    try {
      const profileJson = wasm().umbra_wasm_identity_get_profile();
      const profile = await parseWasm<{ did: string; displayName: string }>(profileJson);

      const envelope: RelayEnvelope = {
        envelope: 'group_invite_decline',
        version: 1,
        payload: {
          inviteId,
          groupId: invite.groupId,
          fromDid: profile.did,
          fromDisplayName: profile.displayName,
          timestamp: Date.now(),
        },
      };

      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: invite.inviterDid,
        payload: JSON.stringify(envelope),
      });

      relayWs.send(relayMessage);
    } catch (err) {
      console.warn('[UmbraService] Failed to send invite decline via relay:', err);
    }
  }
}

/**
 * Send a group message to all members via relay fan-out.
 *
 * Encrypts the message with the group's shared key and sends
 * it to each member individually through the relay.
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
  // Encrypt with group key
  const encrypted = await encryptGroupMessage(groupId, text);

  // Get our profile
  const profileJson = wasm().umbra_wasm_identity_get_profile();
  const profile = await parseWasm<{ did: string; displayName: string }>(profileJson);

  const messageId = crypto.randomUUID();
  const timestamp = Date.now();

  // Store locally (send through WASM messaging)
  const storeJson = JSON.stringify({
    message_id: messageId,
    conversation_id: conversationId,
    sender_did: profile.did,
    content_encrypted: encrypted.ciphertext,
    nonce: encrypted.nonce,
    timestamp,
  });
  wasm().umbra_wasm_messaging_store_incoming(storeJson);

  // Fan-out to all members via relay
  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    const members = await getGroupMembers(groupId);

    for (const member of members) {
      // Don't send to ourselves
      if (member.memberDid === profile.did) continue;

      const envelope: RelayEnvelope = {
        envelope: 'group_message',
        version: 1,
        payload: {
          messageId,
          groupId,
          conversationId,
          senderDid: profile.did,
          senderName: profile.displayName,
          ciphertext: encrypted.ciphertext,
          nonce: encrypted.nonce,
          keyVersion: encrypted.keyVersion,
          timestamp,
        },
      };

      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: member.memberDid,
        payload: JSON.stringify(envelope),
      });

      relayWs.send(relayMessage);
    }

    console.log('[UmbraService] Group message sent to', members.length - 1, 'members');
  }

  return {
    id: messageId,
    conversationId,
    senderDid: profile.did,
    content: { type: 'text', text },
    timestamp,
    read: false,
    delivered: false,
    status: 'sent',
  };
}

/**
 * Remove a member from a group with key rotation.
 *
 * Removes the member, rotates the group key, and distributes
 * the new key to all remaining members via relay.
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
  // Remove member locally
  await removeGroupMember(groupId, memberDid);

  // Rotate key
  const newKeyInfo = await rotateGroupKey(groupId);

  const profileJson = wasm().umbra_wasm_identity_get_profile();
  const profile = await parseWasm<{ did: string }>(profileJson);

  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    // Get remaining members
    const members = await getGroupMembers(groupId);

    // Distribute new key to each remaining member
    for (const member of members) {
      if (member.memberDid === profile.did) continue;

      try {
        // Encrypt the new key for this specific member
        const keyForMember = await encryptGroupKeyForMember(
          groupId,
          member.memberDid,
          newKeyInfo.keyVersion
        );

        // Send key rotation envelope
        const keyEnvelope: RelayEnvelope = {
          envelope: 'group_key_rotation',
          version: 1,
          payload: {
            groupId,
            encryptedKey: keyForMember.encryptedKey,
            nonce: keyForMember.nonce,
            senderDid: profile.did,
            keyVersion: newKeyInfo.keyVersion,
            timestamp: Date.now(),
          },
        };

        relayWs.send(JSON.stringify({
          type: 'send',
          to_did: member.memberDid,
          payload: JSON.stringify(keyEnvelope),
        }));
      } catch (err) {
        console.warn(`[UmbraService] Failed to send rotated key to ${member.memberDid}:`, err);
      }
    }

    // Notify about removal
    for (const member of members) {
      if (member.memberDid === profile.did) continue;

      const removeEnvelope: RelayEnvelope = {
        envelope: 'group_member_removed',
        version: 1,
        payload: {
          groupId,
          removedDid: memberDid,
          removedBy: profile.did,
          timestamp: Date.now(),
        },
      };

      relayWs.send(JSON.stringify({
        type: 'send',
        to_did: member.memberDid,
        payload: JSON.stringify(removeEnvelope),
      }));
    }

    console.log('[UmbraService] Member removed, key rotated, notifications sent');
  }
}

/**
 * Group event listener management
 */
export type GroupListenerCallback = (event: GroupEvent) => void;
