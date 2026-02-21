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
  _fromIdentity?: { did: string; displayName: string } | null
): Promise<FriendRequest & { relayDelivered?: boolean }> {
  // Create the request locally — Rust now includes relay_messages in the return
  const resultJson = wasm().umbra_wasm_friends_send_request(toDid, message);
  const request = await parseWasm<FriendRequest & {
    relayMessages?: Array<{ toDid: string; payload: string }>;
  }>(resultJson);

  // Send relay envelopes (built in Rust)
  let relayDelivered = false;
  if (relayWs && relayWs.readyState === WebSocket.OPEN && request.relayMessages) {
    for (const rm of request.relayMessages) {
      try {
        relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
        relayDelivered = true;
      } catch (err) {
        console.error('[UmbraService] Failed to send friend request via relay:', err);
      }
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
  _fromIdentity?: { did: string; displayName: string } | null
): Promise<{ requestId: string; status: string; relayDelivered?: boolean }> {
  // Accept locally — Rust now includes relay_messages with our keys in the return
  const resultJson = wasm().umbra_wasm_friends_accept_request(requestId);
  const result = await parseWasm<{
    requestId: string;
    status: string;
    relayMessages?: Array<{ toDid: string; payload: string }>;
  }>(resultJson);

  // Send relay envelopes (built in Rust)
  let relayDelivered = false;
  if (relayWs && relayWs.readyState === WebSocket.OPEN && result.relayMessages) {
    for (const rm of result.relayMessages) {
      try {
        relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
        relayDelivered = true;
      } catch (err) {
        console.error('[UmbraService] Failed to send friend acceptance via relay:', err);
      }
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
    from_avatar: request.fromAvatar,
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
  fromAvatar?: string;
  fromSigningKey?: string;
  fromEncryptionKey?: string;
}): Promise<void> {
  const json = JSON.stringify({
    from_did: payload.fromDid,
    from_display_name: payload.fromDisplayName ?? '',
    from_avatar: payload.fromAvatar ?? null,
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

  // Build envelope in Rust, TS just sends it
  const json = JSON.stringify({ accepter_did: accepterDid, my_did: myDid });
  const resultJson = wasm().umbra_wasm_friends_build_accept_ack(json);
  const rm = await parseWasm<{ toDid: string; payload: string }>(resultJson);
  relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
}

/**
 * Friend event listener management
 */
export type FriendListenerCallback = (event: FriendEvent) => void;
