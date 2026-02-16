/**
 * Friends management module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type {
  FriendRequest,
  Friend,
  FriendEvent,
  RelayEnvelope,
  FriendAcceptAckPayload,
} from './types';

/**
 * Send a friend request
 *
 * Creates the request locally and optionally sends it via the relay.
 *
 * @param toDid - Recipient's DID
 * @param message - Optional message to include
 * @param relayWs - Optional WebSocket to send via relay
 * @param fromIdentity - Optional identity override for Tauri
 * @returns Object containing the request and delivery status
 */
export async function sendFriendRequest(
  toDid: string,
  message?: string,
  relayWs?: WebSocket | null,
  fromIdentity?: { did: string; displayName: string } | null
): Promise<FriendRequest & { relayDelivered?: boolean }> {
  // Create the request locally
  const resultJson = wasm().umbra_wasm_friends_send_request(toDid, message);
  const request = await parseWasm<FriendRequest>(resultJson);

  // If relay WebSocket is provided and connected, send via relay
  let relayDelivered = false;
  if (relayWs && relayWs.readyState === WebSocket.OPEN) {
    try {
      // Get our identity info for the envelope.
      // Prefer the frontend identity (fromIdentity) because on Tauri the
      // backend may have a different DID than the one stored in localStorage.
      let profile: { did: string; displayName: string };
      if (fromIdentity) {
        profile = fromIdentity;
      } else {
        const profileJson = wasm().umbra_wasm_identity_get_profile();
        profile = await parseWasm<{
          did: string;
          displayName: string;
        }>(profileJson);
      }

      // Create the envelope payload
      const envelope: RelayEnvelope = {
        envelope: 'friend_request',
        version: 1,
        payload: {
          id: request.id,
          fromDid: profile.did,
          fromDisplayName: profile.displayName,
          fromSigningKey: request.fromSigningKey,
          fromEncryptionKey: request.fromEncryptionKey,
          message: request.message,
          createdAt: request.createdAt,
        },
      };

      // Create the relay send message (lowercase — matches Rust serde rename_all = "snake_case")
      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: toDid,
        payload: JSON.stringify(envelope),
      });

      console.log('[UmbraService] Sending friend request via relay to', toDid);
      relayWs.send(relayMessage);
      relayDelivered = true;
      console.log('[UmbraService] Friend request sent via relay to', toDid);
    } catch (err) {
      console.error('[UmbraService] Failed to send friend request via relay:', err);
    }
  }

  return { ...request, relayDelivered };
}

/**
 * Get incoming friend requests
 */
export async function getIncomingRequests(): Promise<FriendRequest[]> {
  const resultJson = wasm().umbra_wasm_friends_pending_requests('incoming');
  return await parseWasm<FriendRequest[]>(resultJson);
}

/**
 * Get outgoing friend requests
 */
export async function getOutgoingRequests(): Promise<FriendRequest[]> {
  const resultJson = wasm().umbra_wasm_friends_pending_requests('outgoing');
  return await parseWasm<FriendRequest[]>(resultJson);
}

/**
 * Accept a friend request
 *
 * Accepts the request locally and optionally sends response via relay.
 *
 * @param requestId - ID of the request to accept
 * @param relayWs - Optional WebSocket to send acceptance via relay
 * @param fromIdentity - Optional identity override for Tauri
 * @returns Result with request_id, status, and relay delivery status
 */
export async function acceptFriendRequest(
  requestId: string,
  relayWs?: WebSocket | null,
  fromIdentity?: { did: string; displayName: string } | null
): Promise<{ requestId: string; status: string; relayDelivered?: boolean }> {
  // First get the request to find the sender's DID
  const incomingJson = wasm().umbra_wasm_friends_pending_requests('incoming');
  const incoming = await parseWasm<FriendRequest[]>(incomingJson);
  const request = incoming.find((r) => r.id === requestId);

  // Accept locally
  const resultJson = wasm().umbra_wasm_friends_accept_request(requestId);
  const result = await parseWasm<{ requestId: string; status: string }>(resultJson);

  // If relay WebSocket is provided and we found the request, send response via relay
  let relayDelivered = false;
  if (relayWs && relayWs.readyState === WebSocket.OPEN && request) {
    try {
      // Get our full profile (including keys) for the response.
      // The requester needs our signing & encryption keys to add us as a friend.
      const profileJson = wasm().umbra_wasm_identity_get_profile();
      const fullProfile = await parseWasm<{
        did: string;
        displayName: string;
        signingKey: string;
        encryptionKey: string;
      }>(profileJson);

      // Prefer the frontend identity DID/name (Tauri may have a different DID)
      const did = fromIdentity?.did ?? fullProfile.did;
      const displayName = fromIdentity?.displayName ?? fullProfile.displayName;

      // Create the response envelope with keys so requester can add us
      const envelope: RelayEnvelope = {
        envelope: 'friend_response',
        version: 1,
        payload: {
          requestId: request.id,
          fromDid: did,
          fromDisplayName: displayName,
          fromSigningKey: fullProfile.signingKey,
          fromEncryptionKey: fullProfile.encryptionKey,
          accepted: true,
          timestamp: Date.now(),
        },
      };

      // Create the relay send message (lowercase — matches Rust serde rename_all = "snake_case")
      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: request.fromDid,
        payload: JSON.stringify(envelope),
      });

      console.log('[UmbraService] Sending friend acceptance via relay to', request.fromDid);
      relayWs.send(relayMessage);
      relayDelivered = true;
      console.log('[UmbraService] Friend acceptance sent via relay to', request.fromDid);
    } catch (err) {
      console.error('[UmbraService] Failed to send friend acceptance via relay:', err);
    }
  }

  return { ...result, relayDelivered };
}

/**
 * Reject a friend request
 *
 * @param requestId - ID of the request to reject
 */
export async function rejectFriendRequest(requestId: string): Promise<void> {
  await wasm().umbra_wasm_friends_reject_request(requestId);
}

/**
 * Get all friends
 */
export async function getFriends(): Promise<Friend[]> {
  const resultJson = wasm().umbra_wasm_friends_list();
  return await parseWasm<Friend[]>(resultJson);
}

/**
 * Remove a friend
 *
 * @param did - Friend's DID
 * @returns true if a friend was removed
 */
export async function removeFriend(did: string): Promise<boolean> {
  return await wasm().umbra_wasm_friends_remove(did);
}

/**
 * Block a user
 *
 * Blocked users cannot send friend requests or messages.
 *
 * @param did - User's DID to block
 * @param reason - Optional reason for blocking
 */
export async function blockUser(did: string, reason?: string): Promise<void> {
  await wasm().umbra_wasm_friends_block(did, reason);
}

/**
 * Unblock a user
 *
 * @param did - User's DID to unblock
 * @returns true if a user was unblocked
 */
export async function unblockUser(did: string): Promise<boolean> {
  return await wasm().umbra_wasm_friends_unblock(did);
}

/**
 * Store an incoming friend request received via relay into the WASM database.
 * This must be called before dispatching the friend event so that
 * getIncomingRequests() returns the request when the UI refreshes.
 */
export async function storeIncomingRequest(request: FriendRequest): Promise<void> {
  const json = JSON.stringify({
    id: request.id,
    from_did: request.fromDid,
    to_did: request.toDid || '',
    message: request.message,
    from_signing_key: request.fromSigningKey,
    from_encryption_key: request.fromEncryptionKey,
    from_display_name: request.fromDisplayName,
    created_at: request.createdAt,
  });
  wasm().umbra_wasm_friends_store_incoming(json);
}

/**
 * Process an accepted friend response received via relay.
 *
 * When User B accepts User A's friend request and sends the response
 * via relay, User A calls this to:
 * 1. Add User B as a friend in the database
 * 2. Create a conversation for the new friendship
 *
 * @param payload - The accepter's identity info with keys
 */
export async function processAcceptedFriendResponse(payload: {
  fromDid: string;
  fromDisplayName?: string;
  fromSigningKey?: string;
  fromEncryptionKey?: string;
}): Promise<void> {
  const json = JSON.stringify({
    from_did: payload.fromDid,
    from_display_name: payload.fromDisplayName ?? '',
    from_signing_key: payload.fromSigningKey ?? '',
    from_encryption_key: payload.fromEncryptionKey ?? '',
  });
  const resultJson = wasm().umbra_wasm_friends_accept_from_relay(json);
  await parseWasm<unknown>(resultJson);
}

/**
 * Send a friend_accept_ack back to the accepter to confirm the friendship
 * is fully synced on both sides (two-phase friend sync).
 *
 * Called by the original requester after processing an incoming friend_response.
 *
 * @param accepterDid - DID of the friend who accepted the request
 * @param myDid - Our DID (the original requester)
 * @param relayWs - WebSocket for relay delivery
 */
export async function sendFriendAcceptAck(
  accepterDid: string,
  myDid: string,
  relayWs?: WebSocket | null
): Promise<void> {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;

  const envelope: RelayEnvelope = {
    envelope: 'friend_accept_ack',
    version: 1,
    payload: {
      senderDid: myDid,
      timestamp: Date.now(),
    } as FriendAcceptAckPayload,
  };

  const relayMessage = JSON.stringify({
    type: 'send',
    to_did: accepterDid,
    payload: JSON.stringify(envelope),
  });

  console.log('[UmbraService] Sending friend_accept_ack to', accepterDid);
  relayWs.send(relayMessage);
}

/**
 * Friend event listener management
 */
export type FriendListenerCallback = (event: FriendEvent) => void;
