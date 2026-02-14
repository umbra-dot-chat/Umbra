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
} from '@umbra/service';
import { PRIMARY_RELAY_URL, NETWORK_CONFIG } from '@/config';

// Module-level singletons to prevent duplicate auto-starts and relay
// connections when multiple components call useNetwork(). Unlike useRef,
// these are shared across all hook instances.
let _hasAutoStarted = false;
let _relayWs: WebSocket | null = null;
let _relayConnectPromise: Promise<void> | null = null;

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
}

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
          console.log('[useNetwork] Relay WebSocket connected to', url);
        };

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data);
            console.log('[useNetwork] Relay message:', msg.type);

            // Handle relay messages based on type
            switch (msg.type) {
              case 'registered': {
                console.log('[useNetwork] Registered with relay as', msg.did);
                // Fetch offline messages after registration
                service.relayFetchOffline().then((fetchMsg) => {
                  if (ws.readyState === WebSocket.OPEN) {
                    ws.send(fetchMsg);
                  }
                }).catch((err) => {
                  console.error('[useNetwork] Failed to fetch offline messages:', err);
                });
                break;
              }

              case 'message': {
                // Handle incoming message - could be a friend request/response
                const { from_did, payload } = msg;
                console.log('[useNetwork] Message from', from_did);

                try {
                  const envelope = JSON.parse(payload) as RelayEnvelope;

                  if (envelope.envelope === 'friend_request' && envelope.version === 1) {
                    // Handle incoming friend request
                    const reqPayload = envelope.payload as FriendRequestPayload;
                    console.log('[useNetwork] Friend request received from', reqPayload.fromDid);

                    // Create a FriendRequest object to dispatch
                    const friendRequest: FriendRequest = {
                      id: reqPayload.id,
                      fromDid: reqPayload.fromDid,
                      toDid: '', // Will be filled by the service
                      direction: 'incoming',
                      message: reqPayload.message,
                      fromDisplayName: reqPayload.fromDisplayName,
                      fromSigningKey: reqPayload.fromSigningKey,
                      fromEncryptionKey: reqPayload.fromEncryptionKey,
                      createdAt: reqPayload.createdAt,
                      status: 'pending',
                    };

                    // Store in database THEN dispatch event so UI refresh finds it
                    try {
                      await service.storeIncomingRequest(friendRequest);
                    } catch (storeErr) {
                      console.warn('[useNetwork] Failed to store incoming request:', storeErr);
                    }
                    service.dispatchFriendEvent({
                      type: 'requestReceived',
                      request: friendRequest,
                    });
                  } else if (envelope.envelope === 'friend_response' && envelope.version === 1) {
                    // Handle friend response (acceptance/rejection)
                    const respPayload = envelope.payload as FriendResponsePayload;
                    console.log('[useNetwork] Friend response received from', respPayload.fromDid, 'accepted:', respPayload.accepted);

                    if (respPayload.accepted) {
                      // Add the accepter as a friend on OUR side (with their keys)
                      try {
                        await service.processAcceptedFriendResponse({
                          fromDid: respPayload.fromDid,
                          fromDisplayName: respPayload.fromDisplayName,
                          fromSigningKey: respPayload.fromSigningKey,
                          fromEncryptionKey: respPayload.fromEncryptionKey,
                        });
                      } catch (err) {
                        console.warn('[useNetwork] Failed to process acceptance:', err);
                      }
                      service.dispatchFriendEvent({
                        type: 'requestAccepted',
                        did: respPayload.fromDid,
                      });

                      // Two-phase sync: send friend_accept_ack back to the accepter
                      // so they know friendship is confirmed on both sides
                      try {
                        const myDid = identity?.did ?? '';
                        if (myDid) {
                          await service.sendFriendAcceptAck(respPayload.fromDid, myDid, ws);
                        }
                      } catch (err) {
                        console.warn('[useNetwork] Failed to send friend_accept_ack:', err);
                      }
                    } else {
                      service.dispatchFriendEvent({
                        type: 'requestRejected',
                        did: respPayload.fromDid,
                      });
                    }
                  } else if (envelope.envelope === 'friend_accept_ack' && envelope.version === 1) {
                    // Handle friend acceptance acknowledgment (two-phase sync confirmation)
                    const ackPayload = envelope.payload as FriendAcceptAckPayload;
                    console.log('[useNetwork] Friend accept ack received from', ackPayload.senderDid);

                    // The original requester has confirmed friendship on their side.
                    // Dispatch event so UI can update (e.g., show confirmed status).
                    service.dispatchFriendEvent({
                      type: 'friendSyncConfirmed',
                      did: ackPayload.senderDid,
                    });
                  } else if (envelope.envelope === 'chat_message' && envelope.version === 1) {
                    // Handle incoming chat message
                    const chatPayload = envelope.payload as ChatMessagePayload;
                    console.log('[useNetwork] Chat message received from', chatPayload.senderDid, chatPayload.threadId ? `(thread reply to ${chatPayload.threadId})` : '');

                    try {
                      await service.storeIncomingMessage(chatPayload);
                      // Decrypt the message content for real-time UI display
                      const decryptedText = await service.decryptIncomingMessage(chatPayload);

                      if (chatPayload.threadId) {
                        // Thread reply — dispatch threadReplyReceived so the UI
                        // does NOT add this to the main chat list
                        service.dispatchMessageEvent({
                          type: 'threadReplyReceived',
                          message: {
                            id: chatPayload.messageId,
                            conversationId: chatPayload.conversationId,
                            senderDid: chatPayload.senderDid,
                            content: { type: 'text', text: decryptedText },
                            timestamp: chatPayload.timestamp,
                            read: false,
                            delivered: true,
                            status: 'delivered',
                            threadId: chatPayload.threadId,
                          },
                          parentId: chatPayload.threadId,
                        });
                      } else {
                        // Regular message — dispatch normally
                        service.dispatchMessageEvent({
                          type: 'messageReceived',
                          message: {
                            id: chatPayload.messageId,
                            conversationId: chatPayload.conversationId,
                            senderDid: chatPayload.senderDid,
                            content: { type: 'text', text: decryptedText },
                            timestamp: chatPayload.timestamp,
                            read: false,
                            delivered: true,
                            status: 'delivered',
                          },
                        });
                      }
                      // Send delivery receipt back to sender
                      service.sendDeliveryReceipt(
                        chatPayload.messageId,
                        chatPayload.conversationId,
                        chatPayload.senderDid,
                        'delivered',
                        ws
                      ).catch((err) => console.warn('[useNetwork] Failed to send delivery receipt:', err));
                    } catch (err) {
                      console.warn('[useNetwork] Failed to store incoming chat message:', err);
                    }
                  } else if (envelope.envelope === 'group_invite' && envelope.version === 1) {
                    // Handle incoming group invitation
                    const invitePayload = envelope.payload as GroupInvitePayload;
                    console.log('[useNetwork] Group invite received from', invitePayload.inviterDid, 'for group', invitePayload.groupName);

                    try {
                      await service.storeGroupInvite(invitePayload);
                      service.dispatchGroupEvent({
                        type: 'inviteReceived',
                        invite: {
                          id: invitePayload.inviteId,
                          groupId: invitePayload.groupId,
                          groupName: invitePayload.groupName,
                          description: invitePayload.description,
                          inviterDid: invitePayload.inviterDid,
                          inviterName: invitePayload.inviterName,
                          encryptedGroupKey: invitePayload.encryptedGroupKey,
                          nonce: invitePayload.nonce,
                          membersJson: invitePayload.membersJson,
                          status: 'pending',
                          createdAt: invitePayload.timestamp,
                        },
                      });
                    } catch (err) {
                      console.warn('[useNetwork] Failed to store group invite:', err);
                    }
                  } else if (envelope.envelope === 'group_invite_accept' && envelope.version === 1) {
                    // Handle group invite acceptance
                    const acceptPayload = envelope.payload as GroupInviteResponsePayload;
                    console.log('[useNetwork] Group invite accepted by', acceptPayload.fromDid);

                    try {
                      // Add the accepting member to the group
                      await service.addGroupMember(acceptPayload.groupId, acceptPayload.fromDid, acceptPayload.fromDisplayName);
                      service.dispatchGroupEvent({
                        type: 'inviteAccepted',
                        groupId: acceptPayload.groupId,
                        fromDid: acceptPayload.fromDid,
                      });
                    } catch (err) {
                      console.warn('[useNetwork] Failed to process group invite acceptance:', err);
                    }
                  } else if (envelope.envelope === 'group_invite_decline' && envelope.version === 1) {
                    // Handle group invite decline
                    const declinePayload = envelope.payload as GroupInviteResponsePayload;
                    console.log('[useNetwork] Group invite declined by', declinePayload.fromDid);

                    service.dispatchGroupEvent({
                      type: 'inviteDeclined',
                      groupId: declinePayload.groupId,
                      fromDid: declinePayload.fromDid,
                    });
                  } else if (envelope.envelope === 'group_message' && envelope.version === 1) {
                    // Handle incoming group message
                    const groupMsgPayload = envelope.payload as GroupMessagePayload;
                    console.log('[useNetwork] Group message from', groupMsgPayload.senderDid, 'in group', groupMsgPayload.groupId);

                    try {
                      // Decrypt the group message
                      const plaintext = await service.decryptGroupMessage(
                        groupMsgPayload.groupId,
                        groupMsgPayload.ciphertext,
                        groupMsgPayload.nonce,
                        groupMsgPayload.keyVersion
                      );

                      // Store the message locally
                      const storePayload: ChatMessagePayload = {
                        messageId: groupMsgPayload.messageId,
                        conversationId: groupMsgPayload.conversationId,
                        senderDid: groupMsgPayload.senderDid,
                        contentEncrypted: groupMsgPayload.ciphertext,
                        nonce: groupMsgPayload.nonce,
                        timestamp: groupMsgPayload.timestamp,
                      };
                      await service.storeIncomingMessage(storePayload);

                      // Dispatch for real-time UI
                      service.dispatchMessageEvent({
                        type: 'messageReceived',
                        message: {
                          id: groupMsgPayload.messageId,
                          conversationId: groupMsgPayload.conversationId,
                          senderDid: groupMsgPayload.senderDid,
                          content: { type: 'text', text: plaintext },
                          timestamp: groupMsgPayload.timestamp,
                          read: false,
                          delivered: true,
                          status: 'delivered',
                        },
                      });
                    } catch (err) {
                      console.warn('[useNetwork] Failed to process group message:', err);
                    }
                  } else if (envelope.envelope === 'group_key_rotation' && envelope.version === 1) {
                    // Handle group key rotation (after a member was removed)
                    const keyPayload = envelope.payload as GroupKeyRotationPayload;
                    console.log('[useNetwork] Group key rotated for', keyPayload.groupId, 'version', keyPayload.keyVersion);

                    try {
                      await service.importGroupKey(
                        keyPayload.encryptedKey,
                        keyPayload.nonce,
                        keyPayload.senderDid,
                        keyPayload.groupId,
                        keyPayload.keyVersion
                      );
                      service.dispatchGroupEvent({
                        type: 'keyRotated',
                        groupId: keyPayload.groupId,
                        keyVersion: keyPayload.keyVersion,
                      });
                    } catch (err) {
                      console.warn('[useNetwork] Failed to import rotated group key:', err);
                    }
                  } else if (envelope.envelope === 'group_member_removed' && envelope.version === 1) {
                    // Handle group member removal notification
                    const removePayload = envelope.payload as GroupMemberRemovedPayload;
                    console.log('[useNetwork] Member', removePayload.removedDid, 'removed from group', removePayload.groupId);

                    service.dispatchGroupEvent({
                      type: 'memberRemoved',
                      groupId: removePayload.groupId,
                      removedDid: removePayload.removedDid,
                    });
                  } else if (envelope.envelope === 'message_status' && envelope.version === 1) {
                    // Handle message delivery/read status update
                    const statusPayload = envelope.payload as MessageStatusPayload;
                    console.log('[useNetwork] Message status:', statusPayload.messageId, statusPayload.status);

                    try {
                      await service.updateMessageStatus(statusPayload.messageId, statusPayload.status);
                      service.dispatchMessageEvent({
                        type: 'messageStatusChanged',
                        messageId: statusPayload.messageId,
                        status: statusPayload.status,
                      });
                    } catch (err) {
                      console.warn('[useNetwork] Failed to update message status:', err);
                    }
                  } else if (envelope.envelope === 'typing_indicator' && envelope.version === 1) {
                    // Handle typing indicator
                    const typingPayload = envelope.payload as TypingIndicatorPayload;
                    service.dispatchMessageEvent({
                      type: typingPayload.isTyping ? 'typingStarted' : 'typingStopped',
                      conversationId: typingPayload.conversationId,
                      did: typingPayload.senderDid,
                    });
                  } else if (envelope.envelope === 'call_offer' && envelope.version === 1) {
                    service.dispatchCallEvent({ type: 'callOffer', payload: envelope.payload as any });
                  } else if (envelope.envelope === 'call_answer' && envelope.version === 1) {
                    service.dispatchCallEvent({ type: 'callAnswer', payload: envelope.payload as any });
                  } else if (envelope.envelope === 'call_ice_candidate' && envelope.version === 1) {
                    service.dispatchCallEvent({ type: 'callIceCandidate', payload: envelope.payload as any });
                  } else if (envelope.envelope === 'call_end' && envelope.version === 1) {
                    service.dispatchCallEvent({ type: 'callEnd', payload: envelope.payload as any });
                  } else if (envelope.envelope === 'call_state' && envelope.version === 1) {
                    service.dispatchCallEvent({ type: 'callState', payload: envelope.payload as any });
                  }
                } catch (parseErr) {
                  console.log('[useNetwork] Message payload is not a relay envelope:', parseErr);
                }
                break;
              }

              case 'offline_messages': {
                // Handle offline messages batch
                const messages = msg.messages || [];
                console.log('[useNetwork] Received', messages.length, 'offline messages');

                for (const offlineMsg of messages) {
                  try {
                    const envelope = JSON.parse(offlineMsg.payload) as RelayEnvelope;

                    if (envelope.envelope === 'friend_request' && envelope.version === 1) {
                      const reqPayload = envelope.payload as FriendRequestPayload;
                      const friendRequest: FriendRequest = {
                        id: reqPayload.id,
                        fromDid: reqPayload.fromDid,
                        toDid: '',
                        direction: 'incoming',
                        message: reqPayload.message,
                        fromDisplayName: reqPayload.fromDisplayName,
                        fromSigningKey: reqPayload.fromSigningKey,
                        fromEncryptionKey: reqPayload.fromEncryptionKey,
                        createdAt: reqPayload.createdAt,
                        status: 'pending',
                      };

                      // Store in database THEN dispatch event
                      try {
                        await service.storeIncomingRequest(friendRequest);
                      } catch (storeErr) {
                        console.warn('[useNetwork] Failed to store offline incoming request:', storeErr);
                      }
                      service.dispatchFriendEvent({
                        type: 'requestReceived',
                        request: friendRequest,
                      });
                    } else if (envelope.envelope === 'friend_response' && envelope.version === 1) {
                      const respPayload = envelope.payload as FriendResponsePayload;
                      if (respPayload.accepted) {
                        // Add the accepter as a friend on OUR side
                        try {
                          await service.processAcceptedFriendResponse({
                            fromDid: respPayload.fromDid,
                            fromDisplayName: respPayload.fromDisplayName,
                            fromSigningKey: respPayload.fromSigningKey,
                            fromEncryptionKey: respPayload.fromEncryptionKey,
                          });
                        } catch (err) {
                          console.warn('[useNetwork] Failed to process offline acceptance:', err);
                        }
                        service.dispatchFriendEvent({
                          type: 'requestAccepted',
                          did: respPayload.fromDid,
                        });

                        // Two-phase sync: send friend_accept_ack back to the accepter
                        try {
                          const myDid = identity?.did ?? '';
                          if (myDid) {
                            await service.sendFriendAcceptAck(respPayload.fromDid, myDid, ws);
                          }
                        } catch (err) {
                          console.warn('[useNetwork] Failed to send offline friend_accept_ack:', err);
                        }
                      } else {
                        service.dispatchFriendEvent({
                          type: 'requestRejected',
                          did: respPayload.fromDid,
                        });
                      }
                    } else if (envelope.envelope === 'friend_accept_ack' && envelope.version === 1) {
                      // Handle offline friend acceptance acknowledgment
                      const ackPayload = envelope.payload as FriendAcceptAckPayload;
                      console.log('[useNetwork] Offline friend accept ack from', ackPayload.senderDid);
                      service.dispatchFriendEvent({
                        type: 'friendSyncConfirmed',
                        did: ackPayload.senderDid,
                      });
                    } else if (envelope.envelope === 'chat_message' && envelope.version === 1) {
                      // Handle offline chat message
                      const chatPayload = envelope.payload as ChatMessagePayload;
                      try {
                        await service.storeIncomingMessage(chatPayload);
                        const decryptedText = await service.decryptIncomingMessage(chatPayload);

                        if (chatPayload.threadId) {
                          // Thread reply — dispatch threadReplyReceived
                          service.dispatchMessageEvent({
                            type: 'threadReplyReceived',
                            message: {
                              id: chatPayload.messageId,
                              conversationId: chatPayload.conversationId,
                              senderDid: chatPayload.senderDid,
                              content: { type: 'text', text: decryptedText },
                              timestamp: chatPayload.timestamp,
                              read: false,
                              delivered: true,
                              status: 'delivered',
                              threadId: chatPayload.threadId,
                            },
                            parentId: chatPayload.threadId,
                          });
                        } else {
                          service.dispatchMessageEvent({
                            type: 'messageReceived',
                            message: {
                              id: chatPayload.messageId,
                              conversationId: chatPayload.conversationId,
                              senderDid: chatPayload.senderDid,
                              content: { type: 'text', text: decryptedText },
                              timestamp: chatPayload.timestamp,
                              read: false,
                              delivered: true,
                              status: 'delivered',
                            },
                          });
                        }
                      } catch (err) {
                        console.warn('[useNetwork] Failed to store offline chat message:', err);
                      }
                    } else if (envelope.envelope === 'group_invite' && envelope.version === 1) {
                      const invitePayload = envelope.payload as GroupInvitePayload;
                      try {
                        await service.storeGroupInvite(invitePayload);
                        service.dispatchGroupEvent({
                          type: 'inviteReceived',
                          invite: {
                            id: invitePayload.inviteId,
                            groupId: invitePayload.groupId,
                            groupName: invitePayload.groupName,
                            description: invitePayload.description,
                            inviterDid: invitePayload.inviterDid,
                            inviterName: invitePayload.inviterName,
                            encryptedGroupKey: invitePayload.encryptedGroupKey,
                            nonce: invitePayload.nonce,
                            membersJson: invitePayload.membersJson,
                            status: 'pending',
                            createdAt: invitePayload.timestamp,
                          },
                        });
                      } catch (err) {
                        console.warn('[useNetwork] Failed to store offline group invite:', err);
                      }
                    } else if (envelope.envelope === 'group_invite_accept' && envelope.version === 1) {
                      const acceptPayload = envelope.payload as GroupInviteResponsePayload;
                      try {
                        await service.addGroupMember(acceptPayload.groupId, acceptPayload.fromDid, acceptPayload.fromDisplayName);
                        service.dispatchGroupEvent({ type: 'inviteAccepted', groupId: acceptPayload.groupId, fromDid: acceptPayload.fromDid });
                      } catch (err) {
                        console.warn('[useNetwork] Failed to process offline group invite acceptance:', err);
                      }
                    } else if (envelope.envelope === 'group_message' && envelope.version === 1) {
                      const groupMsgPayload = envelope.payload as GroupMessagePayload;
                      try {
                        const plaintext = await service.decryptGroupMessage(groupMsgPayload.groupId, groupMsgPayload.ciphertext, groupMsgPayload.nonce, groupMsgPayload.keyVersion);
                        const storePayload: ChatMessagePayload = {
                          messageId: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId,
                          senderDid: groupMsgPayload.senderDid, contentEncrypted: groupMsgPayload.ciphertext,
                          nonce: groupMsgPayload.nonce, timestamp: groupMsgPayload.timestamp,
                        };
                        await service.storeIncomingMessage(storePayload);
                        service.dispatchMessageEvent({
                          type: 'messageReceived',
                          message: {
                            id: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId,
                            senderDid: groupMsgPayload.senderDid, content: { type: 'text', text: plaintext },
                            timestamp: groupMsgPayload.timestamp, read: false, delivered: true, status: 'delivered',
                          },
                        });
                      } catch (err) {
                        console.warn('[useNetwork] Failed to process offline group message:', err);
                      }
                    } else if (envelope.envelope === 'group_key_rotation' && envelope.version === 1) {
                      const keyPayload = envelope.payload as GroupKeyRotationPayload;
                      try {
                        await service.importGroupKey(keyPayload.encryptedKey, keyPayload.nonce, keyPayload.senderDid, keyPayload.groupId, keyPayload.keyVersion);
                        service.dispatchGroupEvent({ type: 'keyRotated', groupId: keyPayload.groupId, keyVersion: keyPayload.keyVersion });
                      } catch (err) {
                        console.warn('[useNetwork] Failed to import offline rotated group key:', err);
                      }
                    } else if (envelope.envelope === 'group_member_removed' && envelope.version === 1) {
                      const removePayload = envelope.payload as GroupMemberRemovedPayload;
                      service.dispatchGroupEvent({ type: 'memberRemoved', groupId: removePayload.groupId, removedDid: removePayload.removedDid });
                    } else if (envelope.envelope === 'message_status' && envelope.version === 1) {
                      const statusPayload = envelope.payload as MessageStatusPayload;
                      try {
                        await service.updateMessageStatus(statusPayload.messageId, statusPayload.status);
                        service.dispatchMessageEvent({ type: 'messageStatusChanged', messageId: statusPayload.messageId, status: statusPayload.status });
                      } catch (err) {
                        console.warn('[useNetwork] Failed to update offline message status:', err);
                      }
                    }
                  } catch (parseErr) {
                    console.log('[useNetwork] Offline message parse error:', parseErr);
                  }
                }
                break;
              }

              case 'ack': {
                // Relay confirmed it received our message.
                // Transition the oldest pending message from 'sending' → 'sent'.
                const pendingMsgId = _pendingRelayAcks.shift();
                if (pendingMsgId && service) {
                  try {
                    await service.updateMessageStatus(pendingMsgId, 'sent');
                    service.dispatchMessageEvent({
                      type: 'messageStatusChanged',
                      messageId: pendingMsgId,
                      status: 'sent',
                    });
                    console.log('[useNetwork] Message ack: sending→sent for', pendingMsgId);
                  } catch (err) {
                    console.warn('[useNetwork] Failed to update message status on ack:', err);
                  }
                }
                break;
              }

              case 'pong':
                // Keepalive response — nothing to do
                break;

              case 'session_created':
              case 'session_joined':
              case 'signal':
                // These are handled elsewhere for WebRTC signaling
                break;

              case 'error':
                console.error('[useNetwork] Relay error:', msg.message);
                break;

              default:
                console.log('[useNetwork] Unknown relay message type:', msg.type);
            }
          } catch (err) {
            console.error('[useNetwork] Failed to parse relay message:', err);
          }
        };

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

  const disconnectRelay = useCallback(async () => {
    if (!service) return;
    try {
      await service.disconnectRelay();

      if (_relayWs) {
        _relayWs.close();
        _relayWs = null;
      }
      relayWsRef.current = null;

      _notifyRelayState(false, null);
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
  };
}
