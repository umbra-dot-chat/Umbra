/**
 * useNetwork — Hook for network lifecycle, status, WebRTC signaling, and relay.
 *
 * Reports whether the P2P network is running, the peer count,
 * and provides start/stop controls plus WebRTC signaling methods
 * for browser-to-browser P2P connections. Also manages relay
 * server connectivity for offline messaging and single-scan
 * friend adding.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   isConnected, peerCount,
 *   startNetwork, stopNetwork,
 *   createOffer, acceptOffer, completeHandshake,
 *   connectionState, offerData, answerData,
 *   // Relay
 *   relayConnected, relayUrl,
 *   connectRelay, disconnectRelay,
 *   createOfferSession, acceptSession,
 * } = useNetwork();
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useUmbra } from '@/contexts/UmbraContext';
import type { InitStage } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type {
  NetworkStatus,
  DiscoveryEvent,
  RelayEvent,
  RelayEnvelope,
  FriendRequestPayload,
  FriendResponsePayload,
  FriendAcceptAckPayload,
  ChatMessagePayload,
  TypingIndicatorPayload,
  GroupInvitePayload,
  GroupInviteResponsePayload,
  GroupMessagePayload,
  GroupKeyRotationPayload,
  GroupMemberRemovedPayload,
  MessageStatusPayload,
  FriendRequest,
  CommunityEventPayload,
  DmFileEventPayload,
  AccountMetadataPayload,
} from '@umbra/service';
import { PRIMARY_RELAY_URL, DEFAULT_RELAY_SERVERS, NETWORK_CONFIG } from '@/config';

// Module-level singletons to prevent duplicate auto-starts and relay
// connections when multiple components call useNetwork(). Unlike useRef,
// these are shared across all hook instances.
let _hasAutoStarted = false;
let _relayWs: WebSocket | null = null;
let _relayConnectPromise: Promise<void> | null = null;

// ── Reconnect Manager State ──────────────────────────────────────────
/** Whether an intentional disconnect was requested (user-triggered). */
let _intentionalDisconnect = false;
/** Current reconnect attempt count. */
let _reconnectAttempt = 0;
/** Timer ID for the pending reconnect attempt. */
let _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
/** Timer ID for the WebSocket keep-alive ping. */
let _keepAliveTimer: ReturnType<typeof setInterval> | null = null;
/** The last DID used for relay registration (needed for reconnect without AuthContext). */
let _lastRelayDid: string | null = null;
/** The last service reference (needed for reconnect from module-level scope). */
let _lastService: any = null;
/** The index into DEFAULT_RELAY_SERVERS currently being tried. */
let _currentServerIndex = 0;

// Pending message queue for relay ack tracking.
// When we send a chat message via relay, we push the messageId here.
// When the relay sends back an `ack`, we pop the oldest entry and
// transition that message's status from 'sending' → 'sent'.
const _pendingRelayAcks: string[] = [];

/**
 * Push a messageId onto the pending relay ack queue.
 *
 * Call this immediately after calling `relayWs.send()` for a chat message
 * so the next relay `ack` response can be correlated to the correct message
 * and transition its status from 'sending' → 'sent'.
 *
 * For group messages that fan out to N members, push the same messageId once
 * per relay `send` call so each ack pops one entry.
 */
export function pushPendingRelayAck(messageId: string): void {
  _pendingRelayAcks.push(messageId);
}

/** Mark a DID as online (called from external hooks when relay activity is detected). */
export function markDidOnline(did: string): void {
  _markDidOnline(did);
}

// Module-level relay state + subscriber list so ALL useNetwork() instances
// stay in sync. Without this, only the instance that called connectRelay
// sees the WebSocket open — other instances' relayConnected stays false.
let _relayConnected = false;
let _relayUrl: string | null = null;
type RelayListener = (connected: boolean, url: string | null) => void;
const _relayListeners = new Set<RelayListener>();

function _notifyRelayState(connected: boolean, url: string | null) {
  _relayConnected = connected;
  _relayUrl = url;
  for (const listener of _relayListeners) {
    listener(connected, url);
  }
}

// ── Module-level presence tracking ──────────────────────────────────────
// Track which friend DIDs we've seen activity from via relay.
// Any relay message from a DID means they're online right now.
const _onlineDids = new Set<string>();
type PresenceListener = (onlineDids: Set<string>) => void;
const _presenceListeners = new Set<PresenceListener>();

function _markDidOnline(did: string) {
  if (!did || _onlineDids.has(did)) return;
  _onlineDids.add(did);
  _notifyPresence();
}

function _clearOnlineDids() {
  if (_onlineDids.size === 0) return;
  _onlineDids.clear();
  _notifyPresence();
}

function _notifyPresence() {
  const snapshot = new Set(_onlineDids);
  for (const listener of _presenceListeners) {
    listener(snapshot);
  }
}

// ── Reconnect Manager Functions ──────────────────────────────────────

function _clearReconnectTimer(): void {
  if (_reconnectTimer !== null) {
    clearTimeout(_reconnectTimer);
    _reconnectTimer = null;
  }
}

function _clearKeepAlive(): void {
  if (_keepAliveTimer !== null) {
    clearInterval(_keepAliveTimer);
    _keepAliveTimer = null;
  }
}

function _startKeepAlive(): void {
  _clearKeepAlive();
  _keepAliveTimer = setInterval(() => {
    if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
      try {
        _relayWs.send(JSON.stringify({ type: 'ping' }));
      } catch {
        // If send fails, the onclose handler will trigger reconnect
      }
    }
  }, NETWORK_CONFIG.keepAliveInterval);
}

/**
 * Exponential backoff with jitter.
 * Uses NETWORK_CONFIG.reconnectDelay as base, capped at maxBackoffDelay.
 * Adds ±20% random jitter to prevent thundering herd.
 */
function _computeBackoffDelay(attempt: number): number {
  const base = NETWORK_CONFIG.reconnectDelay;
  const exponential = Math.min(base * Math.pow(2, attempt), NETWORK_CONFIG.maxBackoffDelay);
  const jitter = exponential * (0.8 + Math.random() * 0.4);
  return Math.round(jitter);
}

function _resetReconnectState(): void {
  _reconnectAttempt = 0;
  _currentServerIndex = 0;
  _intentionalDisconnect = false;
  _clearReconnectTimer();
}

// Forward declarations — implemented after _handleRelayMessage
let _scheduleReconnect: () => void;
let _attemptReconnect: (serverUrl: string) => Promise<void>;

export type ConnectionState =
  | 'idle'
  | 'creating_offer'
  | 'waiting_for_answer'
  | 'accepting_offer'
  | 'completing_handshake'
  | 'connected'
  | 'error';

export interface UseNetworkResult {
  /** Whether the network is running */
  isConnected: boolean;
  /** Number of connected peers */
  peerCount: number;
  /** Multiaddresses we're listening on */
  listenAddresses: string[];
  /** Whether the status is being fetched */
  isLoading: boolean;
  /** Error from network operations */
  error: Error | null;
  /** Start the network */
  startNetwork: () => Promise<void>;
  /** Stop the network */
  stopNetwork: () => Promise<void>;
  /** Refresh network status */
  refresh: () => Promise<void>;

  // ── WebRTC Signaling ──────────────────────────────────────────────

  /** Current connection flow state */
  connectionState: ConnectionState;

  /** The offer data JSON (set after createOffer) */
  offerData: string | null;

  /** The answer data JSON (set after acceptOffer) */
  answerData: string | null;

  /**
   * Create a WebRTC offer (step 1 — offerer side).
   * After this, share the offerData with the other peer.
   */
  createOffer: () => Promise<void>;

  /**
   * Accept a WebRTC offer and create an answer (step 2 — answerer side).
   * After this, share the answerData back with the offerer.
   */
  acceptOffer: (offerJson: string) => Promise<void>;

  /**
   * Complete the handshake with the answer (step 3 — offerer side).
   * After this, the WebRTC connection is established.
   */
  completeHandshake: (answerJson: string) => Promise<void>;

  /** Reset the signaling state */
  resetSignaling: () => void;

  // ── Relay ─────────────────────────────────────────────────────────

  /** Whether connected to the relay server */
  relayConnected: boolean;

  /** The relay server URL (if connected) */
  relayUrl: string | null;

  /**
   * Connect to a relay server.
   * Establishes a WebSocket connection for signaling relay,
   * offline messaging, and single-scan friend adding.
   */
  connectRelay: (url: string) => Promise<void>;

  /**
   * Disconnect from the relay server.
   */
  disconnectRelay: () => Promise<void>;

  /**
   * Create an offer session on the relay for single-scan friend adding.
   * Returns a shareable link that the other peer can scan/open.
   */
  createOfferSession: (relayUrl: string) => Promise<{
    sessionId: string;
    link: string;
  } | null>;

  /**
   * Accept/join a relay session (the "scanner" side).
   * Fetches the offer, generates an answer, and completes the handshake.
   */
  acceptSession: (sessionId: string, offerPayload: string) => Promise<void>;

  /**
   * Get the relay WebSocket reference.
   * Used for sending messages via the relay (e.g., friend requests).
   */
  getRelayWs: () => WebSocket | null;

  /** Set of friend DIDs currently known to be online (seen via relay) */
  onlineDids: Set<string>;
}

// ── Extracted relay message handler (module-level) ────────────────────
// Extracted from the inline ws.onmessage closure so it can be shared
// between connectRelay() and the reconnect manager.
// Uses _lastService and _lastRelayDid instead of hook-scoped service/identity.

async function _handleRelayMessage(ws: WebSocket, event: MessageEvent): Promise<void> {
  const service = _lastService;
  if (!service) return;

  try {
    const msg = JSON.parse(event.data);
    console.log('[useNetwork] Relay message:', msg.type);

    switch (msg.type) {
      case 'registered': {
        console.log('[useNetwork] Registered with relay as', msg.did);
        service.relayFetchOffline().then((fetchMsg: string) => {
          if (ws.readyState === WebSocket.OPEN) ws.send(fetchMsg);
        }).catch((err: any) => console.error('[useNetwork] Failed to fetch offline messages:', err));

        service.getFriends().then(async (friendsList: any[]) => {
          const presenceEnvelope = JSON.stringify({
            envelope: 'presence_online', version: 1,
            payload: { timestamp: Date.now() },
          });
          for (const f of friendsList) {
            try {
              const { relayMessage } = await service.relaySend(f.did, presenceEnvelope);
              if (ws.readyState === WebSocket.OPEN) ws.send(relayMessage);
            } catch { /* Best-effort */ }
          }
          console.log('[useNetwork] Broadcast presence_online to', friendsList.length, 'friends');
        }).catch((err: any) => console.warn('[useNetwork] Failed to broadcast presence:', err));

        if (_lastRelayDid) {
          const myDid = _lastRelayDid;
          service.getCommunities(myDid).then(async (communities: any[]) => {
            let published = 0;
            for (const community of communities) {
              if (community.ownerDid !== myDid) continue;
              try {
                const invites = await service.getCommunityInvites(community.id);
                const members = await service.getCommunityMembers(community.id);
                for (const invite of invites) {
                  if (ws.readyState !== WebSocket.OPEN) break;
                  service.publishCommunityInviteToRelay(ws, invite, community.name, community.description, community.iconUrl, members.length);
                  published++;
                }
              } catch { /* Best-effort */ }
            }
            if (published > 0) console.log('[useNetwork] Re-published', published, 'community invite(s) to relay');
          }).catch((err: any) => console.warn('[useNetwork] Failed to re-publish invites:', err));
        }
        break;
      }

      case 'message': {
        const { from_did, payload } = msg;
        console.log('[useNetwork] Message from', from_did);
        if (from_did) _markDidOnline(from_did);

        try {
          const envelope = JSON.parse(payload) as RelayEnvelope;

          if (envelope.envelope === 'friend_request' && envelope.version === 1) {
            const reqPayload = envelope.payload as FriendRequestPayload;
            const friendRequest: FriendRequest = {
              id: reqPayload.id, fromDid: reqPayload.fromDid, toDid: '', direction: 'incoming',
              message: reqPayload.message, fromDisplayName: reqPayload.fromDisplayName,
              fromAvatar: reqPayload.fromAvatar, fromSigningKey: reqPayload.fromSigningKey,
              fromEncryptionKey: reqPayload.fromEncryptionKey, createdAt: reqPayload.createdAt, status: 'pending',
            };
            try { await service.storeIncomingRequest(friendRequest); } catch (e) { console.warn('[useNetwork] Failed to store incoming request:', e); }
            service.dispatchFriendEvent({ type: 'requestReceived', request: friendRequest });

          } else if (envelope.envelope === 'friend_response' && envelope.version === 1) {
            const respPayload = envelope.payload as FriendResponsePayload;
            if (respPayload.accepted) {
              try { await service.processAcceptedFriendResponse({ fromDid: respPayload.fromDid, fromDisplayName: respPayload.fromDisplayName, fromAvatar: respPayload.fromAvatar, fromSigningKey: respPayload.fromSigningKey, fromEncryptionKey: respPayload.fromEncryptionKey }); } catch (e) { console.warn('[useNetwork] Failed to process acceptance:', e); }
              service.dispatchFriendEvent({ type: 'requestAccepted', did: respPayload.fromDid });
              try { const myDid = _lastRelayDid ?? ''; if (myDid) await service.sendFriendAcceptAck(respPayload.fromDid, myDid, ws); } catch (e) { console.warn('[useNetwork] Failed to send friend_accept_ack:', e); }
            } else {
              service.dispatchFriendEvent({ type: 'requestRejected', did: respPayload.fromDid });
            }

          } else if (envelope.envelope === 'friend_accept_ack' && envelope.version === 1) {
            const ackPayload = envelope.payload as FriendAcceptAckPayload;
            service.dispatchFriendEvent({ type: 'friendSyncConfirmed', did: ackPayload.senderDid });

          } else if (envelope.envelope === 'chat_message' && envelope.version === 1) {
            const chatPayload = envelope.payload as ChatMessagePayload;
            try {
              await service.storeIncomingMessage(chatPayload);
              const decryptedText = await service.decryptIncomingMessage(chatPayload);
              if (!decryptedText) {
                console.warn('[useNetwork] Decryption failed, skipping dispatch for', chatPayload.messageId);
              } else if (chatPayload.threadId) {
                service.dispatchMessageEvent({ type: 'threadReplyReceived', message: { id: chatPayload.messageId, conversationId: chatPayload.conversationId, senderDid: chatPayload.senderDid, content: { type: 'text', text: decryptedText }, timestamp: chatPayload.timestamp, read: false, delivered: true, status: 'delivered', threadId: chatPayload.threadId }, parentId: chatPayload.threadId });
              } else {
                service.dispatchMessageEvent({ type: 'messageReceived', message: { id: chatPayload.messageId, conversationId: chatPayload.conversationId, senderDid: chatPayload.senderDid, content: { type: 'text', text: decryptedText }, timestamp: chatPayload.timestamp, read: false, delivered: true, status: 'delivered' } });
              }
              service.sendDeliveryReceipt(chatPayload.messageId, chatPayload.conversationId, chatPayload.senderDid, 'delivered', ws).catch((err: any) => console.warn('[useNetwork] Failed to send delivery receipt:', err));
            } catch (err) { console.warn('[useNetwork] Failed to store incoming chat message:', err); }

          } else if (envelope.envelope === 'group_invite' && envelope.version === 1) {
            const invitePayload = envelope.payload as GroupInvitePayload;
            try {
              await service.storeGroupInvite(invitePayload);
              service.dispatchGroupEvent({ type: 'inviteReceived', invite: { id: invitePayload.inviteId, groupId: invitePayload.groupId, groupName: invitePayload.groupName, description: invitePayload.description, inviterDid: invitePayload.inviterDid, inviterName: invitePayload.inviterName, encryptedGroupKey: invitePayload.encryptedGroupKey, nonce: invitePayload.nonce, membersJson: invitePayload.membersJson, status: 'pending', createdAt: invitePayload.timestamp } });
            } catch (err) { console.warn('[useNetwork] Failed to store group invite:', err); }

          } else if (envelope.envelope === 'group_invite_accept' && envelope.version === 1) {
            const acceptPayload = envelope.payload as GroupInviteResponsePayload;
            try { await service.addGroupMember(acceptPayload.groupId, acceptPayload.fromDid, acceptPayload.fromDisplayName); service.dispatchGroupEvent({ type: 'inviteAccepted', groupId: acceptPayload.groupId, fromDid: acceptPayload.fromDid }); } catch (err) { console.warn('[useNetwork] Failed to process group invite acceptance:', err); }

          } else if (envelope.envelope === 'group_invite_decline' && envelope.version === 1) {
            const declinePayload = envelope.payload as GroupInviteResponsePayload;
            service.dispatchGroupEvent({ type: 'inviteDeclined', groupId: declinePayload.groupId, fromDid: declinePayload.fromDid });

          } else if (envelope.envelope === 'group_message' && envelope.version === 1) {
            const groupMsgPayload = envelope.payload as GroupMessagePayload;
            try {
              const plaintext = await service.decryptGroupMessage(groupMsgPayload.groupId, groupMsgPayload.ciphertext, groupMsgPayload.nonce, groupMsgPayload.keyVersion);
              const storePayload: ChatMessagePayload = { messageId: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId, senderDid: groupMsgPayload.senderDid, contentEncrypted: groupMsgPayload.ciphertext, nonce: groupMsgPayload.nonce, timestamp: groupMsgPayload.timestamp };
              await service.storeIncomingMessage(storePayload);
              service.dispatchMessageEvent({ type: 'messageReceived', message: { id: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId, senderDid: groupMsgPayload.senderDid, content: { type: 'text', text: plaintext }, timestamp: groupMsgPayload.timestamp, read: false, delivered: true, status: 'delivered' } });
            } catch (err) { console.warn('[useNetwork] Failed to process group message:', err); }

          } else if (envelope.envelope === 'group_key_rotation' && envelope.version === 1) {
            const keyPayload = envelope.payload as GroupKeyRotationPayload;
            try { await service.importGroupKey(keyPayload.encryptedKey, keyPayload.nonce, keyPayload.senderDid, keyPayload.groupId, keyPayload.keyVersion); service.dispatchGroupEvent({ type: 'keyRotated', groupId: keyPayload.groupId, keyVersion: keyPayload.keyVersion }); } catch (err) { console.warn('[useNetwork] Failed to import rotated group key:', err); }

          } else if (envelope.envelope === 'group_member_removed' && envelope.version === 1) {
            const removePayload = envelope.payload as GroupMemberRemovedPayload;
            service.dispatchGroupEvent({ type: 'memberRemoved', groupId: removePayload.groupId, removedDid: removePayload.removedDid });

          } else if (envelope.envelope === 'message_status' && envelope.version === 1) {
            const statusPayload = envelope.payload as MessageStatusPayload;
            try { await service.updateMessageStatus(statusPayload.messageId, statusPayload.status); service.dispatchMessageEvent({ type: 'messageStatusChanged', messageId: statusPayload.messageId, status: statusPayload.status }); } catch (err) { console.warn('[useNetwork] Failed to update message status:', err); }

          } else if (envelope.envelope === 'typing_indicator' && envelope.version === 1) {
            const typingPayload = envelope.payload as TypingIndicatorPayload;
            service.dispatchMessageEvent({ type: typingPayload.isTyping ? 'typingStarted' : 'typingStopped', conversationId: typingPayload.conversationId, did: typingPayload.senderDid, senderName: typingPayload.senderName });

          } else if (envelope.envelope === 'call_offer' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callOffer', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_answer' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callAnswer', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_ice_candidate' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callIceCandidate', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_end' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callEnd', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_state' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callState', payload: envelope.payload as any });

          } else if (envelope.envelope === 'community_event' && envelope.version === 1) {
            const communityPayload = envelope.payload as CommunityEventPayload;
            service.dispatchCommunityEvent(communityPayload.event);

          } else if (envelope.envelope === 'dm_file_event' && envelope.version === 1) {
            const dmFilePayload = envelope.payload as DmFileEventPayload;
            service.dispatchDmFileEvent(dmFilePayload);

          } else if (envelope.envelope === 'account_metadata' && envelope.version === 1) {
            const metaPayload = envelope.payload as AccountMetadataPayload;
            service.dispatchMetadataEvent({ type: 'metadataReceived', key: metaPayload.key, value: metaPayload.value, timestamp: metaPayload.timestamp });

          } else if (envelope.envelope === 'presence_online') {
            if (from_did) {
              const ackEnvelope = JSON.stringify({ envelope: 'presence_ack', version: 1, payload: { timestamp: Date.now() } });
              service.relaySend(from_did, ackEnvelope).then(({ relayMessage }: any) => { if (ws.readyState === WebSocket.OPEN) ws.send(relayMessage); }).catch(() => {});
            }
          } else if (envelope.envelope === 'presence_ack') {
            // Already handled via _markDidOnline(from_did) above
          }
        } catch (parseErr) {
          console.log('[useNetwork] Message payload is not a relay envelope:', parseErr);
        }
        break;
      }

      case 'offline_messages': {
        const messages = msg.messages || [];
        console.log('[useNetwork] Received', messages.length, 'offline messages');

        for (const offlineMsg of messages) {
          try {
            const envelope = JSON.parse(offlineMsg.payload) as RelayEnvelope;

            if (envelope.envelope === 'friend_request' && envelope.version === 1) {
              const reqPayload = envelope.payload as FriendRequestPayload;
              const friendRequest: FriendRequest = { id: reqPayload.id, fromDid: reqPayload.fromDid, toDid: '', direction: 'incoming', message: reqPayload.message, fromDisplayName: reqPayload.fromDisplayName, fromAvatar: reqPayload.fromAvatar, fromSigningKey: reqPayload.fromSigningKey, fromEncryptionKey: reqPayload.fromEncryptionKey, createdAt: reqPayload.createdAt, status: 'pending' };
              try { await service.storeIncomingRequest(friendRequest); } catch (e) { console.warn('[useNetwork] Failed to store offline incoming request:', e); }
              service.dispatchFriendEvent({ type: 'requestReceived', request: friendRequest });
            } else if (envelope.envelope === 'friend_response' && envelope.version === 1) {
              const respPayload = envelope.payload as FriendResponsePayload;
              if (respPayload.accepted) {
                try { await service.processAcceptedFriendResponse({ fromDid: respPayload.fromDid, fromDisplayName: respPayload.fromDisplayName, fromAvatar: respPayload.fromAvatar, fromSigningKey: respPayload.fromSigningKey, fromEncryptionKey: respPayload.fromEncryptionKey }); } catch (e) { console.warn('[useNetwork] Failed to process offline acceptance:', e); }
                service.dispatchFriendEvent({ type: 'requestAccepted', did: respPayload.fromDid });
                try { const myDid = _lastRelayDid ?? ''; if (myDid) await service.sendFriendAcceptAck(respPayload.fromDid, myDid, ws); } catch (e) { console.warn('[useNetwork] Failed to send offline friend_accept_ack:', e); }
              } else {
                service.dispatchFriendEvent({ type: 'requestRejected', did: respPayload.fromDid });
              }
            } else if (envelope.envelope === 'friend_accept_ack' && envelope.version === 1) {
              const ackPayload = envelope.payload as FriendAcceptAckPayload;
              service.dispatchFriendEvent({ type: 'friendSyncConfirmed', did: ackPayload.senderDid });
            } else if (envelope.envelope === 'chat_message' && envelope.version === 1) {
              const chatPayload = envelope.payload as ChatMessagePayload;
              try {
                await service.storeIncomingMessage(chatPayload);
                const decryptedText = await service.decryptIncomingMessage(chatPayload);
                if (!decryptedText) { console.warn('[useNetwork] Offline decryption failed for', chatPayload.messageId);
                } else if (chatPayload.threadId) { service.dispatchMessageEvent({ type: 'threadReplyReceived', message: { id: chatPayload.messageId, conversationId: chatPayload.conversationId, senderDid: chatPayload.senderDid, content: { type: 'text', text: decryptedText }, timestamp: chatPayload.timestamp, read: false, delivered: true, status: 'delivered', threadId: chatPayload.threadId }, parentId: chatPayload.threadId });
                } else { service.dispatchMessageEvent({ type: 'messageReceived', message: { id: chatPayload.messageId, conversationId: chatPayload.conversationId, senderDid: chatPayload.senderDid, content: { type: 'text', text: decryptedText }, timestamp: chatPayload.timestamp, read: false, delivered: true, status: 'delivered' } }); }
              } catch (err) { console.warn('[useNetwork] Failed to store offline chat message:', err); }
            } else if (envelope.envelope === 'group_invite' && envelope.version === 1) {
              const invitePayload = envelope.payload as GroupInvitePayload;
              try { await service.storeGroupInvite(invitePayload); service.dispatchGroupEvent({ type: 'inviteReceived', invite: { id: invitePayload.inviteId, groupId: invitePayload.groupId, groupName: invitePayload.groupName, description: invitePayload.description, inviterDid: invitePayload.inviterDid, inviterName: invitePayload.inviterName, encryptedGroupKey: invitePayload.encryptedGroupKey, nonce: invitePayload.nonce, membersJson: invitePayload.membersJson, status: 'pending', createdAt: invitePayload.timestamp } }); } catch (err) { console.warn('[useNetwork] Failed to store offline group invite:', err); }
            } else if (envelope.envelope === 'group_invite_accept' && envelope.version === 1) {
              const acceptPayload = envelope.payload as GroupInviteResponsePayload;
              try { await service.addGroupMember(acceptPayload.groupId, acceptPayload.fromDid, acceptPayload.fromDisplayName); service.dispatchGroupEvent({ type: 'inviteAccepted', groupId: acceptPayload.groupId, fromDid: acceptPayload.fromDid }); } catch (err) { console.warn('[useNetwork] Failed to process offline group invite acceptance:', err); }
            } else if (envelope.envelope === 'group_message' && envelope.version === 1) {
              const groupMsgPayload = envelope.payload as GroupMessagePayload;
              try {
                const plaintext = await service.decryptGroupMessage(groupMsgPayload.groupId, groupMsgPayload.ciphertext, groupMsgPayload.nonce, groupMsgPayload.keyVersion);
                const storePayload: ChatMessagePayload = { messageId: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId, senderDid: groupMsgPayload.senderDid, contentEncrypted: groupMsgPayload.ciphertext, nonce: groupMsgPayload.nonce, timestamp: groupMsgPayload.timestamp };
                await service.storeIncomingMessage(storePayload);
                service.dispatchMessageEvent({ type: 'messageReceived', message: { id: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId, senderDid: groupMsgPayload.senderDid, content: { type: 'text', text: plaintext }, timestamp: groupMsgPayload.timestamp, read: false, delivered: true, status: 'delivered' } });
              } catch (err) { console.warn('[useNetwork] Failed to process offline group message:', err); }
            } else if (envelope.envelope === 'group_key_rotation' && envelope.version === 1) {
              const keyPayload = envelope.payload as GroupKeyRotationPayload;
              try { await service.importGroupKey(keyPayload.encryptedKey, keyPayload.nonce, keyPayload.senderDid, keyPayload.groupId, keyPayload.keyVersion); service.dispatchGroupEvent({ type: 'keyRotated', groupId: keyPayload.groupId, keyVersion: keyPayload.keyVersion }); } catch (err) { console.warn('[useNetwork] Failed to import offline rotated group key:', err); }
            } else if (envelope.envelope === 'group_member_removed' && envelope.version === 1) {
              const removePayload = envelope.payload as GroupMemberRemovedPayload;
              service.dispatchGroupEvent({ type: 'memberRemoved', groupId: removePayload.groupId, removedDid: removePayload.removedDid });
            } else if (envelope.envelope === 'message_status' && envelope.version === 1) {
              const statusPayload = envelope.payload as MessageStatusPayload;
              try { await service.updateMessageStatus(statusPayload.messageId, statusPayload.status); service.dispatchMessageEvent({ type: 'messageStatusChanged', messageId: statusPayload.messageId, status: statusPayload.status }); } catch (err) { console.warn('[useNetwork] Failed to update offline message status:', err); }
            } else if (envelope.envelope === 'community_event' && envelope.version === 1) {
              const communityPayload = envelope.payload as CommunityEventPayload;
              service.dispatchCommunityEvent(communityPayload.event);
            } else if (envelope.envelope === 'dm_file_event' && envelope.version === 1) {
              const dmFilePayload = envelope.payload as DmFileEventPayload;
              service.dispatchDmFileEvent(dmFilePayload);
            } else if (envelope.envelope === 'account_metadata' && envelope.version === 1) {
              const metaPayload = envelope.payload as AccountMetadataPayload;
              service.dispatchMetadataEvent({ type: 'metadataReceived', key: metaPayload.key, value: metaPayload.value, timestamp: metaPayload.timestamp });
            } else if (envelope.envelope === 'presence_online' || envelope.envelope === 'presence_ack') {
              // Stale presence from when we were offline — ignore silently
            }
          } catch (parseErr) {
            console.log('[useNetwork] Offline message parse error:', parseErr);
          }
        }
        break;
      }

      case 'ack': {
        const pendingMsgId = _pendingRelayAcks.shift();
        if (pendingMsgId && service) {
          try {
            await service.updateMessageStatus(pendingMsgId, 'sent');
            service.dispatchMessageEvent({ type: 'messageStatusChanged', messageId: pendingMsgId, status: 'sent' });
            console.log('[useNetwork] Message ack: sending→sent for', pendingMsgId);
          } catch (err) { console.warn('[useNetwork] Failed to update message status on ack:', err); }
        }
        break;
      }

      case 'call_room_created': { service.dispatchCallEvent({ type: 'callRoomCreated', payload: { roomId: msg.room_id, groupId: msg.group_id } }); break; }
      case 'call_participant_joined': { service.dispatchCallEvent({ type: 'callParticipantJoined', payload: { roomId: msg.room_id, did: msg.did } }); break; }
      case 'call_participant_left': { service.dispatchCallEvent({ type: 'callParticipantLeft', payload: { roomId: msg.room_id, did: msg.did } }); break; }
      case 'call_signal_forward': { service.dispatchCallEvent({ type: 'callSignalForward', payload: { roomId: msg.room_id, fromDid: msg.from_did, payload: msg.payload } }); break; }
      case 'pong': break;
      case 'session_created': case 'session_joined': case 'signal': break;
      case 'error': console.error('[useNetwork] Relay error:', msg.message); break;
      default: console.log('[useNetwork] Unknown relay message type:', msg.type);
    }
  } catch (err) {
    console.error('[useNetwork] Failed to parse relay message:', err);
  }
}

// ── Reconnect scheduler & executor ────────────────────────────────────

_scheduleReconnect = function(): void {
  if (_intentionalDisconnect) { console.log('[Reconnect] Skipping — intentional disconnect'); return; }
  if (_relayConnectPromise) { console.log('[Reconnect] Skipping — connection already in progress'); return; }
  if (!_lastRelayDid || !_lastService) { console.log('[Reconnect] Skipping — no DID or service available'); return; }

  const maxPerServer = NETWORK_CONFIG.maxReconnectAttempts;
  const totalServers = DEFAULT_RELAY_SERVERS.length;
  const totalMaxAttempts = maxPerServer * totalServers;

  if (_reconnectAttempt >= totalMaxAttempts) {
    console.warn('[Reconnect] All servers exhausted after', _reconnectAttempt, 'attempts. Will retry on foreground.');
    return;
  }

  _currentServerIndex = Math.floor(_reconnectAttempt / maxPerServer) % totalServers;
  const serverUrl = DEFAULT_RELAY_SERVERS[_currentServerIndex];
  const delay = _computeBackoffDelay(_reconnectAttempt % maxPerServer);
  console.log(`[Reconnect] Attempt ${_reconnectAttempt + 1}/${totalMaxAttempts} to ${serverUrl} in ${delay}ms`);

  _clearReconnectTimer();
  _reconnectTimer = setTimeout(() => {
    _reconnectTimer = null;
    _attemptReconnect(serverUrl);
  }, delay);
};

_attemptReconnect = async function(serverUrl: string): Promise<void> {
  if (_intentionalDisconnect || !_lastService || !_lastRelayDid) return;
  if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
    console.log('[Reconnect] Already connected, aborting attempt');
    return;
  }

  console.log('[Reconnect] Attempting connection to', serverUrl);
  _reconnectAttempt++;

  try {
    const registerMessage = JSON.stringify({ type: 'register', did: _lastRelayDid });

    try { await _lastService.connectRelay(serverUrl); } catch { /* Non-fatal */ }

    if (_relayWs) { _relayWs.close(); _relayWs = null; }

    const ws = new WebSocket(serverUrl);
    _relayWs = ws;
    _lastService.setRelayWs(ws);

    ws.onopen = () => {
      console.log('[Reconnect] Connected to', serverUrl);
      ws.send(registerMessage);
      _notifyRelayState(true, serverUrl);
      _reconnectAttempt = 0;
      _currentServerIndex = 0;
      _startKeepAlive();
    };

    ws.onmessage = (event) => _handleRelayMessage(ws, event);

    ws.onerror = (event) => {
      console.error('[Reconnect] WebSocket error:', event);
    };

    ws.onclose = (event) => {
      console.log('[Reconnect] WebSocket closed — code:', event.code);
      if (_relayWs === ws) {
        _relayWs = null;
        _notifyRelayState(false, null);
        _clearKeepAlive();
        _clearOnlineDids();
        _scheduleReconnect();
      }
    };
  } catch (err) {
    console.error('[Reconnect] Failed:', err);
    _scheduleReconnect();
  }
};

export function useNetwork(): UseNetworkResult {
  const { service, isReady, initStage } = useUmbra();
  const { identity } = useAuth();
  const [status, setStatus] = useState<NetworkStatus>({
    isRunning: false,
    peerCount: 0,
    listenAddresses: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Signaling state
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [offerData, setOfferData] = useState<string | null>(null);
  const [answerData, setAnswerData] = useState<string | null>(null);

  // Relay state — synced from module-level shared state
  const [relayConnected, setRelayConnected] = useState(_relayConnected);
  const [relayUrl, setRelayUrl] = useState<string | null>(_relayUrl);
  const relayWsRef = useRef<WebSocket | null>(null);

  // Presence state — synced from module-level shared state
  const [onlineDids, setOnlineDids] = useState<Set<string>>(new Set(_onlineDids));

  // Subscribe to module-level presence changes
  useEffect(() => {
    setOnlineDids(new Set(_onlineDids));
    const listener: PresenceListener = (dids) => setOnlineDids(dids);
    _presenceListeners.add(listener);
    return () => { _presenceListeners.delete(listener); };
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!service) return;
    try {
      const result = await service.getNetworkStatus();
      setStatus(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Initial fetch
  useEffect(() => {
    if (isReady && service) {
      fetchStatus();
    }
  }, [isReady, service, fetchStatus]);

  // Subscribe to discovery events for status updates
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onDiscoveryEvent((event: DiscoveryEvent) => {
      if (event.type === 'networkStatus') {
        setStatus((prev: NetworkStatus) => ({
          ...prev,
          isRunning: event.connected,
          peerCount: event.peerCount,
        }));
      } else {
        // Refresh on peer online/offline events
        fetchStatus();
      }
    });

    return unsubscribe;
  }, [service, fetchStatus]);

  // Subscribe to module-level relay state changes so ALL useNetwork()
  // instances stay in sync. This replaces the old mount-only sync.
  useEffect(() => {
    // Sync current state on mount
    if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
      relayWsRef.current = _relayWs;
    }
    setRelayConnected(_relayConnected);
    setRelayUrl(_relayUrl);

    // Subscribe to future changes
    const listener: RelayListener = (connected, url) => {
      setRelayConnected(connected);
      setRelayUrl(url);
      if (connected && _relayWs) {
        relayWsRef.current = _relayWs;
      }
    };
    _relayListeners.add(listener);
    return () => { _relayListeners.delete(listener); };
  }, []);

  const startNetwork = useCallback(async () => {
    if (!service) return;
    try {
      await service.startNetwork();
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service, fetchStatus]);

  const stopNetwork = useCallback(async () => {
    if (!service) return;
    try {
      await service.stopNetwork();
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service, fetchStatus]);

  // ── WebRTC Signaling ──────────────────────────────────────────────

  const createOffer = useCallback(async () => {
    if (!service) return;
    try {
      setError(null);
      setConnectionState('creating_offer');

      const offer = await service.createOffer();
      setOfferData(offer);
      setConnectionState('waiting_for_answer');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setConnectionState('error');
    }
  }, [service]);

  const acceptOffer = useCallback(async (offerJson: string) => {
    if (!service) return;
    try {
      setError(null);
      setConnectionState('accepting_offer');

      // Parse the offer to extract the offerer's identity
      let offererDid: string | undefined;
      let offererPeerId: string | undefined;
      try {
        const parsed = JSON.parse(offerJson);
        offererDid = parsed.did || undefined;
        offererPeerId = parsed.peer_id || undefined;
      } catch {
        // If parsing fails, acceptOffer will handle the error
      }

      const answer = await service.acceptOffer(offerJson);
      setAnswerData(answer);

      // Complete the answerer side connection with the offerer's identity
      await service.completeAnswerer(offererDid, offererPeerId);
      setConnectionState('connected');
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setConnectionState('error');
    }
  }, [service, fetchStatus]);

  const completeHandshake = useCallback(async (answerJson: string) => {
    if (!service) return;
    try {
      setError(null);
      setConnectionState('completing_handshake');

      await service.completeHandshake(answerJson);
      setConnectionState('connected');
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setConnectionState('error');
    }
  }, [service, fetchStatus]);

  const resetSignaling = useCallback(() => {
    setConnectionState('idle');
    setOfferData(null);
    setAnswerData(null);
    setError(null);
  }, []);

  // ── Relay ─────────────────────────────────────────────────────────

  const connectRelay = useCallback(async (url: string) => {
    if (!service) return;

    // If already connected or connecting, skip
    if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
      console.log('[useNetwork] Relay already connected, skipping');
      relayWsRef.current = _relayWs;
      _notifyRelayState(true, url);
      return;
    }
    if (_relayConnectPromise) {
      console.log('[useNetwork] Relay connection already in progress, waiting...');
      await _relayConnectPromise;
      return;
    }

    const doConnect = async () => {
      try {
        setError(null);

        // Store refs for reconnect manager (module-level, survives unmounts)
        _intentionalDisconnect = false;
        if (identity?.did) _lastRelayDid = identity.did;
        if (service) _lastService = service;

        // Build the register message using the frontend identity's DID.
        //
        // We prefer the frontend DID (from AuthContext / localStorage) over
        // whatever the backend returns because on Tauri the backend creates
        // a *new* identity in set_identity (different keys → different DID).
        // The DID shared with friends is the one from AuthContext, so the
        // relay must register with that DID for friend requests to route.
        let registerMessage: string | undefined;
        if (identity?.did) {
          registerMessage = JSON.stringify({ type: 'register', did: identity.did });
          console.log('[useNetwork] Using frontend DID for relay register:', identity.did.slice(0, 24) + '...');
        }

        // Still call the backend to notify it about the relay connection
        console.log('[useNetwork] Connecting to relay:', url);
        try {
          const result = await service.connectRelay(url);
          console.log('[useNetwork] connectRelay result:', result ? 'got register message from backend' : 'no result');
          // Use backend register message as fallback if frontend identity not available
          if (!registerMessage && result?.registerMessage) {
            registerMessage = result.registerMessage;
          }
        } catch (backendErr) {
          console.warn('[useNetwork] Backend connectRelay failed (non-fatal, using frontend DID):', backendErr);
        }

        // Close any existing WebSocket before creating a new one
        if (_relayWs) {
          _relayWs.close();
          _relayWs = null;
        }

        // Establish the WebSocket connection
        const ws = new WebSocket(url);
        _relayWs = ws;
        relayWsRef.current = ws;
        service.setRelayWs(ws);

        ws.onopen = () => {
          // Send the register message
          if (registerMessage) {
            console.log('[useNetwork] Sending register message to relay');
            ws.send(registerMessage);
          } else {
            console.warn('[useNetwork] No register message available — relay may not know our DID');
          }
          // Notify ALL useNetwork() instances via shared state
          _notifyRelayState(true, url);
          // Reset reconnect state on successful connection & start keep-alive
          _reconnectAttempt = 0;
          _currentServerIndex = 0;
          _startKeepAlive();
          console.log('[useNetwork] Relay WebSocket connected to', url);
        };

        ws.onmessage = (event) => _handleRelayMessage(ws, event);

        ws.onerror = (event) => {
          console.error('[useNetwork] Relay WebSocket error:', event);
          console.error('[useNetwork] WebSocket readyState:', ws.readyState);
          setError(new Error('Relay connection error'));
        };

        ws.onclose = (event) => {
          console.log('[useNetwork] Relay WebSocket closed — code:', event.code, 'reason:', event.reason, 'clean:', event.wasClean);
          // Only clear state if this is still the active WebSocket
          if (_relayWs === ws) {
            _relayWs = null;
            relayWsRef.current = null;
            // Notify ALL useNetwork() instances
            _notifyRelayState(false, null);
            // Clear presence — can't know who's online without relay
            _clearOnlineDids();
            // Stop keep-alive and schedule auto-reconnect (unless intentional)
            _clearKeepAlive();
            _scheduleReconnect();
          }
        };
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    _relayConnectPromise = doConnect();
    try {
      await _relayConnectPromise;
    } finally {
      _relayConnectPromise = null;
    }
  }, [service, identity]);

  // Auto-start network + connect to relay when identity hydration is complete.
  //
  // We wait for `initStage === 'hydrated'` because:
  // - relay_connect requires an identity to build the register message
  // - on Tauri, the Rust backend needs set_identity to be called first
  //   (which UmbraContext does during hydration: 'hydrating' → 'hydrated')
  // - without a fully hydrated identity, relay_connect fails with
  //   "No identity loaded" or registers with the wrong DID
  //
  // NOTE: _hasAutoStarted is a module-level flag (not useRef) to prevent
  // duplicate auto-starts when multiple components call useNetwork().
  useEffect(() => {
    if (!isReady || !service || !identity || _hasAutoStarted) return;
    // Wait for backend identity hydration to complete before connecting
    if (initStage !== 'hydrated') return;
    _hasAutoStarted = true;

    async function autoStart() {
      // Start the P2P network and relay connection in parallel.
      // The relay doesn't depend on the P2P swarm, so there's no
      // reason to block the relay WebSocket on libp2p startup.
      const tasks: Promise<void>[] = [];

      // P2P network
      tasks.push(
        (async () => {
          try {
            console.log('[useNetwork] Auto-starting network...');
            await service!.startNetwork();
            console.log('[useNetwork] Network started');
          } catch (err) {
            console.error('[useNetwork] Auto-start network failed:', err);
          }
        })()
      );

      // Relay server
      if (NETWORK_CONFIG.autoConnectRelay) {
        tasks.push(
          (async () => {
            console.log('[useNetwork] Auto-connecting to relay:', PRIMARY_RELAY_URL);
            try {
              await connectRelay(PRIMARY_RELAY_URL);
              console.log('[useNetwork] Relay connected successfully');
            } catch (err) {
              console.error('[useNetwork] Auto-connect to relay failed:', err);
            }
          })()
        );
      }

      await Promise.all(tasks);
    }

    autoStart();
  }, [isReady, service, identity, initStage, connectRelay]);

  // ── AppState listener — reconnect when app returns to foreground ──────
  useEffect(() => {
    if (!service || !identity?.did) return;
    // Keep module-level refs fresh for reconnect manager
    _lastService = service;
    _lastRelayDid = identity.did;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Foreground: check relay and reconnect if needed
        if (!_relayWs || _relayWs.readyState !== WebSocket.OPEN) {
          console.log('[AppState] Foregrounded — relay disconnected, scheduling reconnect');
          _resetReconnectState();
          _scheduleReconnect();
        } else {
          // Relay still open — restart keep-alive in case it lapsed
          _startKeepAlive();
        }
        // Check P2P network too
        service.getNetworkStatus().then((status: NetworkStatus) => {
          if (!status.isRunning) {
            console.log('[AppState] P2P network not running, restarting...');
            service.startNetwork().catch(() => {});
          }
        }).catch(() => {});
      } else if (nextState === 'background') {
        // Background: stop keep-alive to save battery
        _clearKeepAlive();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [service, identity?.did]);

  const disconnectRelay = useCallback(async () => {
    if (!service) return;
    try {
      // Mark as intentional so onclose won't trigger reconnect
      _intentionalDisconnect = true;
      _clearReconnectTimer();
      _clearKeepAlive();

      await service.disconnectRelay();

      if (_relayWs) {
        _relayWs.close();
        _relayWs = null;
      }
      relayWsRef.current = null;

      _notifyRelayState(false, null);
      _clearOnlineDids();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const createOfferSession = useCallback(async (sessionRelayUrl: string) => {
    if (!service) return null;
    try {
      setError(null);

      const sessionData = await service.createOfferSession(sessionRelayUrl);

      // Send the create_session message via the relay WebSocket
      if (relayWsRef.current?.readyState === WebSocket.OPEN) {
        relayWsRef.current.send(sessionData.createSessionMessage);
      } else {
        throw new Error('Not connected to relay server');
      }

      // The session ID will come back in a relay response
      // For now, return a placeholder
      return {
        sessionId: sessionData.sessionId || 'pending',
        link: `umbra://connect/${sessionData.sessionId}@${encodeURIComponent(sessionRelayUrl)}`,
      };
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, [service]);

  const acceptSession = useCallback(async (sessionId: string, offerPayload: string) => {
    if (!service) return;
    try {
      setError(null);
      setConnectionState('accepting_offer');

      // Parse the offer to extract the offerer's identity
      let offererDid: string | undefined;
      let offererPeerId: string | undefined;
      try {
        const parsed = JSON.parse(offerPayload);
        offererDid = parsed.did || undefined;
        offererPeerId = parsed.peer_id || undefined;
      } catch {
        // If parsing fails, acceptSession will handle the error
      }

      const result = await service.acceptSession(sessionId, offerPayload);

      // Send the join_session message via the relay WebSocket
      if (relayWsRef.current?.readyState === WebSocket.OPEN) {
        relayWsRef.current.send(result.joinSessionMessage);
      }

      // Complete the WebRTC handshake on our side
      await service.completeAnswerer(offererDid, offererPeerId);
      setConnectionState('connected');
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setConnectionState('error');
    }
  }, [service, fetchStatus]);

  const getRelayWs = useCallback(() => {
    return _relayWs || relayWsRef.current;
  }, []);

  return {
    isConnected: status.isRunning,
    peerCount: status.peerCount,
    listenAddresses: status.listenAddresses,
    isLoading,
    error,
    startNetwork,
    stopNetwork,
    refresh: fetchStatus,

    // Signaling
    connectionState,
    offerData,
    answerData,
    createOffer,
    acceptOffer,
    completeHandshake,
    resetSignaling,

    // Relay
    relayConnected,
    relayUrl,
    connectRelay,
    disconnectRelay,
    createOfferSession,
    acceptSession,
    getRelayWs,

    // Presence
    onlineDids,
  };
}
