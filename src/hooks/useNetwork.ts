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
  ChatMessageUpdatePayload,
  TypingIndicatorPayload,
  GroupInvitePayload,
  GroupInviteResponsePayload,
  GroupMessagePayload,
  GroupKeyRotationPayload,
  GroupMemberRemovedPayload,
  GroupReadReceiptPayload,
  KeyRotationPayload,
  MessageStatusPayload,
  FriendRequest,
  CommunityEventPayload,
  DmFileEventPayload,
  AccountMetadataPayload,
  AccountBackupManifestPayload,
  AccountBackupChunkPayload,
} from '@umbra/service';
import {
  parseBackupManifest,
  parseBackupChunks,
  restoreFromChunks,
  utf8ToBase64,
} from '@umbra/service';
import { PRIMARY_RELAY_URL, DEFAULT_RELAY_SERVERS, NETWORK_CONFIG } from '@/config';
import { getWasmMemoryStats } from '@umbra/wasm/loader';
import { emit as traceEmit, isDebugActive as isTraceActive } from '@umbra/wasm/tracer';
import { dbg } from '@/utils/debug';

// ── WS debug stats for tracer memory monitor ────────────────────────
// Exposes active WS count and bufferedAmount on globalThis for the tracer.
let _wsSendCount = 0;
let _wsSendBytes = 0;
(globalThis as any).__umbra_ws_debug_stats = () => ({
  activeCount: _relayWs && _relayWs.readyState === WebSocket.OPEN ? 1 : 0,
  bufferedAmount: _relayWs?.bufferedAmount ?? 0,
  sendCount: _wsSendCount,
  sendBytes: _wsSendBytes,
});

// Module-level singletons to prevent duplicate auto-starts and relay
// connections when multiple components call useNetwork(). Unlike useRef,
// these are shared across all hook instances.
let _hasAutoStarted = false;
let _autoStartDeferTimer: ReturnType<typeof setTimeout> | null = null;
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
/** The DID that was actually sent in the most recent relay `register` message. */
let _registeredRelayDid: string | null = null;
/** The last service reference (needed for reconnect from module-level scope). */
let _lastService: any = null;
/** The index into DEFAULT_RELAY_SERVERS currently being tried. */
let _currentServerIndex = 0;

// ── Failed Group Key Cache ───────────────────────────────────────────
// Tracks group key versions that are known to be missing locally.
// When a group_message decrypt fails with "key version … not found",
// we record "groupId:keyVersion" here so subsequent messages with the
// same missing key skip the expensive WASM call entirely.
// Cleared per-group when a group_key_rotation envelope arrives.
const _failedGroupKeys = new Set<string>();

/** Throttle typing indicator dispatches to max 1 per 500ms per conversation.
 *  Prevents 20/sec re-renders from rapid bot typing events. */
const _lastTypingDispatch = new Map<string, number>();
const TYPING_DISPATCH_THROTTLE_MS = 500;

// ── Sync update callback registration ────────────────────────────────
// SyncContext registers a callback to receive real-time sync deltas
// from the relay WebSocket.
type SyncUpdateCallback = (data: { section: string; version: number; encryptedData: string }) => void;
const _syncUpdateCallbacks = new Set<SyncUpdateCallback>();

/** Register a callback for incoming sync update messages. */
export function registerSyncUpdateCallback(cb: SyncUpdateCallback): void {
  _syncUpdateCallbacks.add(cb);
}

/** Unregister a sync update callback. */
export function unregisterSyncUpdateCallback(cb: SyncUpdateCallback): void {
  _syncUpdateCallbacks.delete(cb);
}

/**
 * Send a SyncPush message via WebSocket to notify other sessions of the same DID
 * that a new sync blob has been uploaded. The relay will broadcast a `sync_update`
 * to all other connected sessions of the same DID.
 */
export function sendSyncPush(sections: Record<string, number>): void {
  if (!_relayWs || _relayWs.readyState !== WebSocket.OPEN) {
    if (__DEV__) dbg.warn('network', 'sendSyncPush: WS not open, cannot notify other sessions', { ws: !!_relayWs, readyState: _relayWs?.readyState }, SRC);
    return;
  }
  const entries = Object.entries(sections);
  if (entries.length === 0) {
    if (__DEV__) dbg.warn('network', 'sendSyncPush: no sections to push', undefined, SRC);
    return;
  }
  try {
    for (const [section, version] of entries) {
      const msg = JSON.stringify({
        type: 'sync_push',
        section,
        version,
        encrypted_data: '',
      });
      _relayWs.send(msg);
      _wsSendCount++;
      _wsSendBytes += msg.length;
    }
    if (isTraceActive()) {
      traceEmit({ cat: 'net', fn: 'ws_send', argBytes: 0, durMs: 0, memBefore: 0, memAfter: 0, memGrowth: 0, argPreview: `sync_push ${entries.length} sections` });
    }
  } catch (err) {
    if (__DEV__) dbg.error('network', 'sendSyncPush: failed to send', { error: String(err) }, SRC);
  }
}

/**
 * Get the relay HTTP URL derived from the active WebSocket URL.
 * Converts `wss://host/ws` → `https://host`.
 */
export function getRelayHttpUrl(): string | null {
  const wsUrl = _relayUrl;
  if (!wsUrl) return null;
  return wsUrl
    .replace(/^wss:/, 'https:')
    .replace(/^ws:/, 'http:')
    .replace(/\/ws\/?$/, '');
}

/**
 * Subscribe to relay connection state changes.
 * Returns an unsubscribe function.
 */
export function subscribeRelayState(
  cb: (connected: boolean, url: string | null) => void,
): () => void {
  _relayListeners.add(cb);
  return () => { _relayListeners.delete(cb); };
}

// Pending message queue for relay ack tracking.
// When we send a chat message via relay, we push the messageId here.
// When the relay sends back an `ack`, we pop the oldest entry and
// transition that message's status from 'sending' → 'sent'.
const _pendingRelayAcks: string[] = [];

/**
 * If decrypted message text is a JSON bridge file payload (`{"__file":true,...}`),
 * register it in dm_shared_files so it appears in the Shared Files panel.
 * Non-fatal — errors are silently swallowed so message processing continues.
 */
export async function maybeRegisterIncomingFile(
  service: any,
  conversationId: string,
  senderDid: string,
  decryptedText: string,
): Promise<void> {
  if (!decryptedText.startsWith('{"__file":true')) return;
  try {
    const parsed = JSON.parse(decryptedText);
    if (!parsed.__file || !parsed.fileId || !parsed.filename) return;
    const record = await service.uploadDmFile(
      conversationId,
      null, // folderId — root level
      parsed.filename,
      null, // description
      parsed.size ?? 0,
      parsed.mimeType ?? 'application/octet-stream',
      parsed.storageChunksJson ?? '{}',
      senderDid,
    );
    service.dispatchDmFileEvent({
      conversationId,
      senderDid,
      timestamp: Date.now(),
      event: { type: 'fileUploaded', file: record },
    });
  } catch {
    // Non-fatal — best effort; don't block message processing
  }
}

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

/**
 * Get all relay DIDs currently known to be online.
 * These are the real relay-registered DIDs (from incoming `from_did` fields),
 * NOT the WASM-internal encryption-derived DIDs from getFriends()/getMembers().
 * Use these for sending unencrypted messages (e.g. call invites) to peers.
 */
export function getOnlineRelayDids(): Set<string> {
  return new Set(_onlineDids);
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

  // Trace WS connection state change
  if (isTraceActive()) {
    traceEmit({
      cat: 'net',
      fn: 'ws_state',
      argBytes: 0,
      durMs: 0,
      memBefore: 0,
      memAfter: 0,
      memGrowth: 0,
      argPreview: `connected=${connected} url=${url ?? 'null'}`,
    });
  }

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

// ── Module-level discovery subscription ─────────────────────────────
// Only ONE onDiscoveryEvent listener across all useNetwork() instances.
// Previously each of 15+ hook instances subscribed independently,
// causing 21+ discovery listeners and massive memory pressure.
type DiscoveryListener = (status: NetworkStatus) => void;
const _discoveryListeners = new Set<DiscoveryListener>();
let _discoveryUnsubscribe: (() => void) | null = null;
let _discoveryService: any = null; // Track which service we're subscribed to
let _networkStatus: NetworkStatus = { isRunning: false, peerCount: 0, listenAddresses: [] };

function _subscribeDiscovery(service: any, fetchStatus: () => Promise<void>) {
  // Already subscribed to this service instance
  if (_discoveryService === service && _discoveryUnsubscribe) return;

  // Clean up old subscription
  if (_discoveryUnsubscribe) {
    _discoveryUnsubscribe();
    _discoveryUnsubscribe = null;
  }

  _discoveryService = service;
  _discoveryUnsubscribe = service.onDiscoveryEvent((event: DiscoveryEvent) => {
    if (event.type === 'networkStatus') {
      _networkStatus = {
        ..._networkStatus,
        isRunning: event.connected,
        peerCount: event.peerCount,
      };
      for (const l of _discoveryListeners) l(_networkStatus);
    } else {
      fetchStatus();
    }
  });
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
        const msg = JSON.stringify({ type: 'ping' });
        _relayWs.send(msg);
        _wsSendCount++;
        _wsSendBytes += msg.length;
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

const SRC = 'useNetwork';

// ── Serial message queue ─────────────────────────────────────────────
// Relay messages (especially friend_response + chat_message) must be
// processed sequentially. Without this, `await` gaps in WASM calls
// allow a chat_message to start processing before the preceding
// friend_response has finished adding the friend & conversation,
// causing OOM / corrupted state.
let _msgQueuePromise: Promise<void> = Promise.resolve();

/** Yield to the event loop for a minimum duration, giving V8 idle time to GC. */
const _gcYield = (ms: number = 16) => new Promise<void>(r => setTimeout(r, ms));

// ── Streaming dedup ──────────────────────────────────────────────────
// Ghost sends multiple chat_message envelopes with the same messageId
// (accumulated text at each chunk). The WASM INSERT OR REPLACE silently
// overwrites, so we track seen IDs here to detect streaming updates.
const _seenMessageIds = new Set<string>();
const SEEN_IDS_MAX = 500;
function _trackMessageId(id: string): boolean {
  if (_seenMessageIds.has(id)) return true; // already seen → streaming update
  _seenMessageIds.add(id);
  // Prune to avoid unbounded growth
  if (_seenMessageIds.size > SEEN_IDS_MAX) {
    const iter = _seenMessageIds.values();
    for (let i = 0; i < 100; i++) iter.next();
    // Delete oldest 100
    const arr = Array.from(_seenMessageIds);
    for (let i = 0; i < 100; i++) _seenMessageIds.delete(arr[i]);
  }
  return false; // new message
}

// ── Deferred offline message queue ──────────────────────────────────
// Offline messages (1400+) each require WASM calls that grow the V8
// cage (WASM linear memory never shrinks). Processing them all during
// startup fills the 4GB V8 cage and crashes the renderer. Instead, we
// queue offline chunks and process them one message at a time with
// generous GC yields, starting AFTER the app has fully rendered.
let _offlineMsgQueue: any[] = [];
let _offlineProcessing = false;
let _offlineWs: WebSocket | null = null;

function _enqueueRelayMessage(ws: WebSocket, event: MessageEvent): void {
  _msgQueuePromise = _msgQueuePromise.then(
    // Add a 50ms GC yield between each queued message so V8 can run
    // mark-compact GC. Without this, rapid-fire messages (offline delivery,
    // chatty bots) exhaust V8's GC budget → "Ineffective mark-compacts
    // near heap limit" → renderer crash.
    () => _gcYield(50).then(() => _handleRelayMessage(ws, event)),
    () => _gcYield(50).then(() => _handleRelayMessage(ws, event)),
  );
}

async function _handleRelayMessage(ws: WebSocket, event: MessageEvent): Promise<void> {
  const service = _lastService;
  if (!service) return;

  // Trace WS receive event
  if (isTraceActive()) {
    const dataLen = typeof event.data === 'string' ? event.data.length : (event.data?.byteLength ?? 0);
    traceEmit({
      cat: 'net',
      fn: 'ws_recv',
      argBytes: dataLen,
      durMs: 0,
      memBefore: 0,
      memAfter: 0,
      memGrowth: 0,
    });
  }

  try {
    const msg = JSON.parse(event.data);
    if (__DEV__) dbg.debug('network', `relay msg: ${msg.type}`, undefined, SRC);
    if (__DEV__) dbg.info('network', 'relay message', { type: msg.type }, SRC);

    switch (msg.type) {
      case 'registered': {
        if (__DEV__) dbg.info('network', 'registered with relay', { did: msg.did }, SRC);

        // IMPORTANT: Process registration tasks SEQUENTIALLY with GC yields.
        // Previously these ran as 3 parallel promise chains, each doing multiple
        // WASM calls. Combined with the initial render cascade, this overwhelmed
        // V8's GC → "Ineffective mark-compacts near heap limit" → crash.
        try {
          // 1. Request offline messages from relay
          const fetchMsg = await service.relayFetchOffline();
          if (ws.readyState === WebSocket.OPEN) ws.send(fetchMsg);
        } catch (err) { if (__DEV__) dbg.error('network', 'failed to fetch offline messages', { error: String(err) }, SRC); }

        await _gcYield(100);

        // 2. Broadcast online presence to friends (sequential, with yields)
        try {
          const friendsList = await service.getFriends();
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
          if (__DEV__) dbg.info('network', 'broadcast presence_online', { friendCount: friendsList.length }, SRC);
        } catch (err) { if (__DEV__) dbg.warn('network', 'failed to broadcast presence', { error: String(err) }, SRC); }

        await _gcYield(100);

        // 3. Re-publish community invites (deferred, non-blocking)
        if (_lastRelayDid) {
          const myDid = _lastRelayDid;
          // Use setTimeout to defer this entirely — not urgent at startup
          setTimeout(async () => {
            try {
              const communities = await service.getCommunities(myDid);
              let published = 0;
              for (const community of communities) {
                if (community.ownerDid !== myDid) continue;
                try {
                  const invites = await service.getCommunityInvites(community.id);
                  const members = await service.getCommunityMembers(community.id);
                  let ownerNickname: string | undefined;
                  try { const ownerMember = await service.getCommunityMember(community.id, myDid); ownerNickname = ownerMember?.nickname; } catch { /* ignore */ }
                  for (const invite of invites) {
                    if (ws.readyState !== WebSocket.OPEN) break;
                    const invitePayload = JSON.stringify({ owner_did: myDid, owner_nickname: ownerNickname ?? null, owner_avatar: null });
                    service.publishCommunityInviteToRelay(ws, invite, community.name, community.description, community.iconUrl, members.length, invitePayload);
                    published++;
                  }
                  await _gcYield(50);
                } catch { /* Best-effort */ }
              }
              if (published > 0 && __DEV__) dbg.info('network', 're-published community invites to relay', { count: published }, SRC);
            } catch (err) { if (__DEV__) dbg.warn('network', 'failed to re-publish invites', { error: String(err) }, SRC); }
          }, 3000); // Defer 3s after connection
        }
        break;
      }

      case 'message': {
        const { from_did, payload } = msg;
        if (__DEV__) dbg.info('network', 'message from peer', { fromDid: from_did }, SRC);
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
            let isNew = true;
            try { isNew = await service.storeIncomingRequest(friendRequest); } catch (e) { if (__DEV__) dbg.warn('network', 'failed to store incoming request', { error: String(e) }, SRC); }
            if (isNew) {
              service.dispatchFriendEvent({ type: 'requestReceived', request: friendRequest });
            } else {
              // Reconnection: sender is already a friend but may have lost our keys.
              // Re-send friend_response so they can re-establish the friendship.
              try {
                const pub = await service.getPublicIdentity();
                const responseEnvelope = JSON.stringify({
                  envelope: 'friend_response', version: 1,
                  payload: {
                    requestId: reqPayload.id, fromDid: pub.did,
                    fromDisplayName: pub.displayName, fromAvatar: pub.avatar ?? '',
                    fromSigningKey: pub.publicKeys.signing,
                    fromEncryptionKey: pub.publicKeys.encryption,
                    accepted: true, timestamp: Date.now(),
                  },
                });
                ws.send(JSON.stringify({ type: 'send', to_did: reqPayload.fromDid, payload: responseEnvelope }));
                if (__DEV__) dbg.info('network', 're-sent friend_response to already-friended peer', { displayName: reqPayload.fromDisplayName }, SRC);
              } catch (e) { if (__DEV__) dbg.warn('network', 'failed to re-send friend_response', { error: String(e) }, SRC); }
            }

          } else if (envelope.envelope === 'friend_response' && envelope.version === 1) {
            const respPayload = envelope.payload as FriendResponsePayload;
            if (respPayload.accepted) {
              try { await service.processAcceptedFriendResponse({ fromDid: respPayload.fromDid, fromDisplayName: respPayload.fromDisplayName, fromAvatar: respPayload.fromAvatar, fromSigningKey: respPayload.fromSigningKey, fromEncryptionKey: respPayload.fromEncryptionKey }); } catch (e) { if (__DEV__) dbg.warn('network', 'failed to process acceptance', { error: String(e) }, SRC); }
              service.dispatchFriendEvent({ type: 'requestAccepted', did: respPayload.fromDid });
              try { const myDid = _lastRelayDid ?? ''; if (myDid) await service.sendFriendAcceptAck(respPayload.fromDid, myDid, ws); } catch (e) { if (__DEV__) dbg.warn('network', 'failed to send friend_accept_ack', { error: String(e) }, SRC); }
            } else {
              service.dispatchFriendEvent({ type: 'requestRejected', did: respPayload.fromDid });
            }

          } else if (envelope.envelope === 'friend_accept_ack' && envelope.version === 1) {
            const ackPayload = envelope.payload as FriendAcceptAckPayload;
            service.dispatchFriendEvent({ type: 'friendSyncConfirmed', did: ackPayload.senderDid });

          } else if (envelope.envelope === 'chat_message' && envelope.version === 1) {
            const chatPayload = envelope.payload as ChatMessagePayload;
            try {
              // Ensure conversation exists before decrypt (handles edge cases where
              // friend acceptance relay was missed or conversation wasn't created yet)
              try { await service.createDmConversation(chatPayload.senderDid); } catch { /* friend may not exist yet */ }

              // Detect streaming updates: Ghost sends multiple chat_message envelopes
              // with the same messageId (accumulated text). INSERT OR REPLACE in WASM
              // silently overwrites, so we track seen IDs to detect updates.
              const isUpdate = _trackMessageId(chatPayload.messageId);

              // Store in WASM DB. For streaming updates, use updateIncomingMessageContent
              // which does NOT emit a WASM-side messageReceived event (avoiding duplicate
              // events and TypeError in listeners expecting msg.content).
              try {
                if (isUpdate) {
                  await service.updateIncomingMessageContent(
                    chatPayload.messageId,
                    chatPayload.contentEncrypted,
                    chatPayload.nonce,
                    chatPayload.timestamp,
                  );
                } else {
                  await service.storeIncomingMessage(chatPayload);
                }
              } catch (storeErr) {
                if (__DEV__) dbg.warn('network', 'storeIncomingMessage failed', { error: String(storeErr) }, SRC);
              }

              const decryptedText = await service.decryptIncomingMessage(chatPayload);
              if (!decryptedText) {
                if (__DEV__) dbg.warn('network', 'decryption failed, skipping dispatch', { messageId: chatPayload.messageId }, SRC);
              } else if (isUpdate) {
                // Streaming update — update existing message content in-place
                service.dispatchMessageEvent({
                  type: 'messageContentUpdated',
                  messageId: chatPayload.messageId,
                  newText: decryptedText,
                });
              } else if (chatPayload.threadId) {
                service.dispatchMessageEvent({ type: 'threadReplyReceived', message: { id: chatPayload.messageId, conversationId: chatPayload.conversationId, senderDid: chatPayload.senderDid, content: { type: 'text', text: decryptedText }, timestamp: chatPayload.timestamp, read: false, delivered: true, status: 'delivered', threadId: chatPayload.threadId }, parentId: chatPayload.threadId });
              } else {
                service.dispatchMessageEvent({ type: 'messageReceived', message: { id: chatPayload.messageId, conversationId: chatPayload.conversationId, senderDid: chatPayload.senderDid, content: { type: 'text', text: decryptedText }, timestamp: chatPayload.timestamp, read: false, delivered: true, status: 'delivered' } });
                await maybeRegisterIncomingFile(service, chatPayload.conversationId, chatPayload.senderDid, decryptedText);
              }
              service.sendDeliveryReceipt(chatPayload.messageId, chatPayload.conversationId, chatPayload.senderDid, 'delivered', ws).catch((err: any) => { if (__DEV__) dbg.warn('network', 'failed to send delivery receipt', { error: String(err) }, SRC); });
            } catch (err) {
              const errStr = String(err);
              if (errStr.includes('not a known friend')) {
                dbg.trackNonFriendFailure(chatPayload.senderDid);
              } else {
                if (__DEV__) dbg.warn('network', 'failed to store incoming chat message', { error: String(err) }, SRC);
              }
            }

          } else if (envelope.envelope === 'chat_message_update' && envelope.version === 1) {
            // Streaming/progressive update — decrypt and update existing message in-place
            const updatePayload = envelope.payload as ChatMessageUpdatePayload;
            console.log('[STREAM] chat_message_update received', { mid: updatePayload.messageId?.slice(0, 8), ts: updatePayload.timestamp });
            try {
              // Reuse decryptIncomingMessage with the same payload shape
              const decryptedText = await service.decryptIncomingMessage(updatePayload as ChatMessagePayload);
              console.log('[STREAM] decrypted:', decryptedText ? decryptedText.slice(0, 50) : 'NULL');
              if (decryptedText) {
                // Dispatch content update (NOT messageEdited — avoids "(edited)" label)
                service.dispatchMessageEvent({
                  type: 'messageContentUpdated',
                  messageId: updatePayload.messageId,
                  newText: decryptedText,
                });
                // Persist streamed content to storage so it survives page reload
                // Use updateIncomingMessageContent (no sender check) since this is a remote peer's message
                service.updateIncomingMessageContent(
                  updatePayload.messageId,
                  updatePayload.contentEncrypted,
                  updatePayload.nonce,
                  updatePayload.timestamp,
                ).catch((err: any) =>
                  { console.error('[STREAM] persist failed:', err); }
                );
              }
            } catch (err) { console.error('[STREAM] chat_message_update FAILED:', err); }

          } else if (envelope.envelope === 'group_invite' && envelope.version === 1) {
            const invitePayload = envelope.payload as GroupInvitePayload;
            try {
              await service.storeGroupInvite(invitePayload);
              service.dispatchGroupEvent({ type: 'inviteReceived', invite: { id: invitePayload.inviteId, groupId: invitePayload.groupId, groupName: invitePayload.groupName, description: invitePayload.description, inviterDid: invitePayload.inviterDid, inviterName: invitePayload.inviterName, encryptedGroupKey: invitePayload.encryptedGroupKey, nonce: invitePayload.nonce, membersJson: invitePayload.membersJson, status: 'pending', createdAt: invitePayload.timestamp } });
            } catch (err) { if (__DEV__) dbg.warn('network', 'failed to store group invite', { error: String(err) }, SRC); }

          } else if (envelope.envelope === 'group_invite_accept' && envelope.version === 1) {
            const acceptPayload = envelope.payload as GroupInviteResponsePayload;
            try { await service.addGroupMember(acceptPayload.groupId, acceptPayload.fromDid, acceptPayload.fromDisplayName); service.dispatchGroupEvent({ type: 'inviteAccepted', groupId: acceptPayload.groupId, fromDid: acceptPayload.fromDid }); } catch (err) { if (__DEV__) dbg.warn('network', 'failed to process group invite acceptance', { error: String(err) }, SRC); }

          } else if (envelope.envelope === 'group_invite_decline' && envelope.version === 1) {
            const declinePayload = envelope.payload as GroupInviteResponsePayload;
            service.dispatchGroupEvent({ type: 'inviteDeclined', groupId: declinePayload.groupId, fromDid: declinePayload.fromDid });

          } else if (envelope.envelope === 'group_message' && envelope.version === 1) {
            const groupMsgPayload = envelope.payload as GroupMessagePayload;
            const groupKeyId = `${groupMsgPayload.groupId}:${groupMsgPayload.keyVersion}`;

            // Skip WASM decrypt if this key version is already known to be missing.
            // This prevents hundreds of repeated failing WASM calls (e.g. 726/745
            // failures when bots send messages with a key version the client lacks).
            if (_failedGroupKeys.has(groupKeyId)) {
              // Silently skip — key rotation will clear this entry
            } else {
              // Separate decrypt from dispatch/store — only decrypt errors
              // should poison _failedGroupKeys. Errors from dispatchMessageEvent
              // or storeIncomingMessage must NOT mark the key as failed.
              let plaintext: string | null = null;
              try {
                plaintext = await service.decryptGroupMessage(groupMsgPayload.groupId, groupMsgPayload.ciphertext, groupMsgPayload.nonce, groupMsgPayload.keyVersion, groupMsgPayload.senderDid, groupMsgPayload.timestamp);
              } catch (err) {
                const errStr = String(err);
                if (errStr.includes('key version') || errStr.includes('not found')) {
                  _failedGroupKeys.add(groupKeyId);
                }
                if (__DEV__) dbg.warn('network', 'failed to decrypt group message', { error: String(err) }, SRC);
              }
              if (plaintext !== null) {
                try {
                  service.dispatchMessageEvent({ type: 'messageReceived', message: { id: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId, senderDid: groupMsgPayload.senderDid, content: { type: 'text', text: plaintext }, timestamp: groupMsgPayload.timestamp, read: false, delivered: true, status: 'delivered' } });
                  await maybeRegisterIncomingFile(service, groupMsgPayload.conversationId, groupMsgPayload.senderDid, plaintext);
                } catch (err) { if (__DEV__) dbg.warn('network', 'failed to dispatch group message', { error: String(err) }, SRC); }
                try {
                  const storePayload: ChatMessagePayload = { messageId: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId, senderDid: groupMsgPayload.senderDid, contentEncrypted: utf8ToBase64(plaintext), nonce: '000000000000000000000000', timestamp: groupMsgPayload.timestamp, isGroup: true };
                  await service.storeIncomingMessage(storePayload);
                } catch { /* Storage is best-effort for group messages */ }
              }
            }

          } else if (envelope.envelope === 'group_key_rotation' && envelope.version === 1) {
            const keyPayload = envelope.payload as GroupKeyRotationPayload;
            // Clear all cached failures for this group — the new key may
            // resolve previously-missing versions.
            for (const key of _failedGroupKeys) {
              if (key.startsWith(keyPayload.groupId + ':')) {
                _failedGroupKeys.delete(key);
              }
            }
            try { await service.importGroupKey(keyPayload.encryptedKey, keyPayload.nonce, keyPayload.senderDid, keyPayload.groupId, keyPayload.keyVersion); service.dispatchGroupEvent({ type: 'keyRotated', groupId: keyPayload.groupId, keyVersion: keyPayload.keyVersion }); } catch (err) { if (__DEV__) dbg.warn('network', 'failed to import rotated group key', { error: String(err) }, SRC); }

          } else if (envelope.envelope === 'key_rotation' && envelope.version === 1) {
            const keyPayload = envelope.payload as KeyRotationPayload;
            try {
              await service.updateFriendEncryptionKey(keyPayload.fromDid, keyPayload.newEncryptionKey, keyPayload.signature);
              service.dispatchFriendEvent({ type: 'friendKeyRotated', did: keyPayload.fromDid });
            } catch (err) { if (__DEV__) dbg.warn('network', 'failed to process key rotation', { error: String(err) }, SRC); }

          } else if (envelope.envelope === 'group_member_removed' && envelope.version === 1) {
            const removePayload = envelope.payload as GroupMemberRemovedPayload;
            service.dispatchGroupEvent({ type: 'memberRemoved', groupId: removePayload.groupId, removedDid: removePayload.removedDid });

          } else if (envelope.envelope === 'message_status' && envelope.version === 1) {
            const statusPayload = envelope.payload as MessageStatusPayload;
            try { await service.updateMessageStatus(statusPayload.messageId, statusPayload.status); service.dispatchMessageEvent({ type: 'messageStatusChanged', messageId: statusPayload.messageId, status: statusPayload.status }); } catch (err) { if (__DEV__) dbg.warn('network', 'failed to update message status', { error: String(err) }, SRC); }

          } else if (envelope.envelope === 'group_read_receipt' && envelope.version === 1) {
            const grr = envelope.payload as GroupReadReceiptPayload;
            try {
              service.groupMarkRead(grr.groupId, grr.memberDid, grr.lastReadMessageId, grr.lastReadTimestamp);
              // Trigger a UI refresh by dispatching a messagesRead event for the group's conversation
              // ChatArea will re-fetch watermarks when messages change
              service.dispatchMessageEvent({ type: 'messagesRead', conversationId: `group-${grr.groupId}` });
            } catch (err) { if (__DEV__) dbg.warn('network', 'failed to process group read receipt', { error: String(err) }, SRC); }

          } else if (envelope.envelope === 'typing_indicator' && envelope.version === 1) {
            const typingPayload = envelope.payload as TypingIndicatorPayload;
            // Throttle typing dispatches to prevent render cascade (bots send typing at ~20/sec)
            const typingKey = `${typingPayload.conversationId}:${typingPayload.senderDid}`;
            const now = performance.now();
            const lastDispatch = _lastTypingDispatch.get(typingKey) || 0;
            if (typingPayload.isTyping && now - lastDispatch < TYPING_DISPATCH_THROTTLE_MS) {
              // Skip — already dispatched recently for this user/conversation
            } else {
              _lastTypingDispatch.set(typingKey, now);
              service.dispatchMessageEvent({ type: typingPayload.isTyping ? 'typingStarted' : 'typingStopped', conversationId: typingPayload.conversationId, did: typingPayload.senderDid, senderName: typingPayload.senderName });
            }

          } else if (envelope.envelope === 'call_offer' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callOffer', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_answer' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callAnswer', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_ice_candidate' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callIceCandidate', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_end' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callEnd', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_state' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callState', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_reoffer' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callReoffer', payload: envelope.payload as any });
          } else if (envelope.envelope === 'call_reanswer' && envelope.version === 1) { service.dispatchCallEvent({ type: 'callReanswer', payload: envelope.payload as any });
          } else if (envelope.envelope === 'group_call_invite' && envelope.version === 1) { service.dispatchCallEvent({ type: 'groupCallInvite', payload: envelope.payload as any });

          } else if (envelope.envelope === 'community_event' && envelope.version === 1) {
            const communityPayload = envelope.payload as CommunityEventPayload;
            const event = communityPayload.event;

            // Resolve remote community/channel IDs to local equivalents using origin mapping.
            // Each peer generates its own local IDs when importing a community from relay.
            // The canonical communityId in the envelope is the owner's original community ID.
            // - For joiners: findCommunityByOrigin(canonicalId) → their local ID
            // - For the owner: findCommunityByOrigin returns null, but the canonical ID IS their local ID
            try {
              const remoteCommunityId = communityPayload.communityId;
              let localCommunityId = await service.findCommunityByOrigin(remoteCommunityId);

              // Fallback: if not found by origin, check if we own a community with this exact ID
              // (the owner's local ID === the canonical ID, so origin_community_id is null)
              if (!localCommunityId) {
                try {
                  const directCommunity = await service.getCommunity(remoteCommunityId);
                  if (directCommunity) localCommunityId = remoteCommunityId;
                } catch { /* community not found — skip */ }
              }

              if (localCommunityId) {
                // Resolve channelName to local channelId for message/channel events
                if ('channelName' in event && event.channelName && 'channelId' in event) {
                  const channels = await service.getAllChannels(localCommunityId);
                  const match = channels.find((ch: any) => ch.name === event.channelName);
                  if (match) (event as any).channelId = match.id;
                }
                // Update communityId references to local ID
                if ('communityId' in event) (event as any).communityId = localCommunityId;

                // Handle memberJoined: add new member to our local community DB
                if (event.type === 'memberJoined') {
                  try {
                    await service.joinCommunity(localCommunityId, event.memberDid, event.memberNickname);
                  } catch { /* may already exist — AlreadyMember is expected */ }

                  // Fan-out: if we're the community owner, re-broadcast this event
                  // to all other members. New joiners only know the owner, so other
                  // existing members won't learn about the new member without this.
                  try {
                    const community = await service.getCommunity(localCommunityId);
                    const myDid = _lastRelayDid;
                    if (myDid && community.ownerDid === myDid && ws.readyState === WebSocket.OPEN) {
                      await service.broadcastCommunityEvent(localCommunityId, event, myDid, ws);
                    }
                  } catch { /* best-effort fan-out */ }
                }
              }
            } catch { /* best-effort — fall through to dispatch with original IDs */ }

            service.dispatchCommunityEvent(event);

          } else if (envelope.envelope === 'dm_file_event' && envelope.version === 1) {
            const dmFilePayload = envelope.payload as DmFileEventPayload;
            service.dispatchDmFileEvent(dmFilePayload);

          } else if (envelope.envelope === 'account_metadata' && envelope.version === 1) {
            const metaPayload = envelope.payload as AccountMetadataPayload;
            service.dispatchMetadataEvent({ type: 'metadataReceived', key: metaPayload.key, value: metaPayload.value, timestamp: metaPayload.timestamp });

          } else if (envelope.envelope === 'account_backup_manifest' || envelope.envelope === 'account_backup_chunk') {
            // Backup envelopes are collected during offline fetch, not processed in real-time
            if (__DEV__) dbg.info('network', 'ignoring live backup envelope (only processed during offline fetch)', undefined, SRC);

          } else if (envelope.envelope === 'presence_online') {
            if (from_did) {
              const ackEnvelope = JSON.stringify({ envelope: 'presence_ack', version: 1, payload: { timestamp: Date.now() } });
              service.relaySend(from_did, ackEnvelope).then(({ relayMessage }: any) => { if (ws.readyState === WebSocket.OPEN) ws.send(relayMessage); }).catch(() => {});
            }
          } else if (envelope.envelope === 'presence_ack') {
            // Already handled via _markDidOnline(from_did) above
          }
        } catch (parseErr) {
          if (__DEV__) dbg.info('network', 'message payload is not a relay envelope', { error: String(parseErr) }, SRC);
        }
        break;
      }

      case 'offline_messages': {
        const messages = msg.messages || [];
        const totalMessages = msg.total_messages ?? messages.length;
        const chunkIndex = msg.chunk_index ?? 0;
        const totalChunks = msg.total_chunks ?? 1;

        if (__DEV__) dbg.info('network', `offline chunk ${chunkIndex + 1}/${totalChunks} (${messages.length} msgs, ${totalMessages} total)`, undefined, SRC);
        if (__DEV__) dbg.info('network', `offline chunk ${chunkIndex + 1}/${totalChunks}`, { msgCount: messages.length, total: totalMessages }, SRC);
        if (__DEV__) dbg.info('network', `offline_messages START, chunk=${chunkIndex + 1}/${totalChunks}`, { count: messages.length, total: totalMessages }, SRC);
        const _backupEnvelopes: any[] = [];
        // Track affected conversation IDs so we can fire a single batch
        // refresh event at the end instead of 1400 individual dispatchMessageEvent
        // calls (each of which triggers a React re-render → parseMessageContent
        // on all visible messages → V8 GC exhaustion → crash).
        const _offlineConversationIds = new Set<string>();

        // Process in small batches with generous GC yields.
        // V8 crashes with "Ineffective mark-compacts near heap limit" when
        // WASM calls create temporary objects faster than GC can collect them.
        // A 50ms yield gives V8 idle time for mark-compact GC between batches.
        // Log WASM memory baseline before offline processing starts
        const _memBefore = getWasmMemoryStats();
        if (__DEV__) dbg.info('network', `WASM-TRACE offline START: ${_memBefore.summary}`, undefined, SRC);
        let _wasmCallCount = 0;

        // Trace offline batch start
        if (isTraceActive()) {
          traceEmit({
            cat: 'net',
            fn: 'offline_batch_start',
            argBytes: 0,
            durMs: 0,
            memBefore: _memBefore.totalWasmBytes,
            memAfter: _memBefore.totalWasmBytes,
            memGrowth: 0,
            argPreview: `chunk=${chunkIndex + 1}/${totalChunks} msgs=${messages.length} total=${totalMessages}`,
          });
        }

        const OFFLINE_BATCH_SIZE = 5;
        for (let batchStart = 0; batchStart < messages.length; batchStart += OFFLINE_BATCH_SIZE) {
          const batchEnd = Math.min(batchStart + OFFLINE_BATCH_SIZE, messages.length);

          // Yield to event loop between batches — 100ms gives V8 GC time
          if (batchStart > 0) {
            await _gcYield(100);
          }
          // Log WASM memory at each batch boundary to track growth
          const _memBatch = getWasmMemoryStats();
          if (__DEV__) dbg.info('network', `WASM-TRACE batch ${batchStart + 1}-${batchEnd}/${messages.length}: ${_memBatch.summary}`, { wasmCalls: _wasmCallCount }, SRC);

          for (let i = batchStart; i < batchEnd; i++) {
          const offlineMsg = messages[i];

          try {
            const envelope = JSON.parse(offlineMsg.payload) as RelayEnvelope;

            if (envelope.envelope === 'friend_request' && envelope.version === 1) {
              const reqPayload = envelope.payload as FriendRequestPayload;
              const friendRequest: FriendRequest = { id: reqPayload.id, fromDid: reqPayload.fromDid, toDid: '', direction: 'incoming', message: reqPayload.message, fromDisplayName: reqPayload.fromDisplayName, fromAvatar: reqPayload.fromAvatar, fromSigningKey: reqPayload.fromSigningKey, fromEncryptionKey: reqPayload.fromEncryptionKey, createdAt: reqPayload.createdAt, status: 'pending' };
              let isNew = true;
              try { isNew = await service.storeIncomingRequest(friendRequest); _wasmCallCount++; } catch (e) { if (__DEV__) dbg.warn('network', 'failed to store offline incoming request', { error: String(e) }, SRC); }
              if (isNew) {
                service.dispatchFriendEvent({ type: 'requestReceived', request: friendRequest });
              } else {
                // Reconnection: re-send friend_response for already-friended sender
                try {
                  const pub = await service.getPublicIdentity();
                  const responseEnvelope = JSON.stringify({
                    envelope: 'friend_response', version: 1,
                    payload: {
                      requestId: reqPayload.id, fromDid: pub.did,
                      fromDisplayName: pub.displayName, fromAvatar: pub.avatar ?? '',
                      fromSigningKey: pub.publicKeys.signing,
                      fromEncryptionKey: pub.publicKeys.encryption,
                      accepted: true, timestamp: Date.now(),
                    },
                  });
                  ws.send(JSON.stringify({ type: 'send', to_did: reqPayload.fromDid, payload: responseEnvelope }));
                  if (__DEV__) dbg.info('network', 're-sent offline friend_response', { displayName: reqPayload.fromDisplayName }, SRC);
                } catch (e) { if (__DEV__) dbg.warn('network', 'failed to re-send offline friend_response', { error: String(e) }, SRC); }
              }
            } else if (envelope.envelope === 'friend_response' && envelope.version === 1) {
              const respPayload = envelope.payload as FriendResponsePayload;
              if (respPayload.accepted) {
                try { await service.processAcceptedFriendResponse({ fromDid: respPayload.fromDid, fromDisplayName: respPayload.fromDisplayName, fromAvatar: respPayload.fromAvatar, fromSigningKey: respPayload.fromSigningKey, fromEncryptionKey: respPayload.fromEncryptionKey }); _wasmCallCount++; } catch (e) { if (__DEV__) dbg.warn('network', 'failed to process offline acceptance', { error: String(e) }, SRC); }
                service.dispatchFriendEvent({ type: 'requestAccepted', did: respPayload.fromDid });
                try { const myDid = _lastRelayDid ?? ''; if (myDid) await service.sendFriendAcceptAck(respPayload.fromDid, myDid, ws); } catch (e) { if (__DEV__) dbg.warn('network', 'failed to send offline friend_accept_ack', { error: String(e) }, SRC); }
              } else {
                service.dispatchFriendEvent({ type: 'requestRejected', did: respPayload.fromDid });
              }
            } else if (envelope.envelope === 'friend_accept_ack' && envelope.version === 1) {
              const ackPayload = envelope.payload as FriendAcceptAckPayload;
              service.dispatchFriendEvent({ type: 'friendSyncConfirmed', did: ackPayload.senderDid });
            } else if (envelope.envelope === 'chat_message' && envelope.version === 1) {
              const chatPayload = envelope.payload as ChatMessagePayload;
              try {
                try { await service.createDmConversation(chatPayload.senderDid); _wasmCallCount++; } catch { /* friend may not exist yet */ }
                await service.storeIncomingMessage(chatPayload); _wasmCallCount++;
                _offlineConversationIds.add(chatPayload.conversationId);
              } catch (err) {
                const errStr = String(err);
                if (errStr.includes('not a known friend')) {
                  dbg.trackNonFriendFailure(chatPayload.senderDid);
                } else {
                  if (__DEV__) dbg.warn('network', 'failed to store offline chat message', { error: String(err) }, SRC);
                }
              }
            } else if (envelope.envelope === 'chat_message_update' && envelope.version === 1) {
              // Persist streaming content so it survives reload (updates timestamp for AAD match)
              const updatePayload = envelope.payload as ChatMessageUpdatePayload;
              if (updatePayload.conversationId) _offlineConversationIds.add(updatePayload.conversationId);
              try {
                await service.updateIncomingMessageContent(
                  updatePayload.messageId,
                  updatePayload.contentEncrypted,
                  updatePayload.nonce,
                  updatePayload.timestamp,
                );
                _wasmCallCount++;
              } catch (err) { if (__DEV__) dbg.warn('network', 'failed to persist offline streaming update', { error: String(err) }, SRC); }
            } else if (envelope.envelope === 'group_invite' && envelope.version === 1) {
              const invitePayload = envelope.payload as GroupInvitePayload;
              try { await service.storeGroupInvite(invitePayload); _wasmCallCount++; service.dispatchGroupEvent({ type: 'inviteReceived', invite: { id: invitePayload.inviteId, groupId: invitePayload.groupId, groupName: invitePayload.groupName, description: invitePayload.description, inviterDid: invitePayload.inviterDid, inviterName: invitePayload.inviterName, encryptedGroupKey: invitePayload.encryptedGroupKey, nonce: invitePayload.nonce, membersJson: invitePayload.membersJson, status: 'pending', createdAt: invitePayload.timestamp } }); } catch (err) { if (__DEV__) dbg.warn('network', 'failed to store offline group invite', { error: String(err) }, SRC); }
            } else if (envelope.envelope === 'group_invite_accept' && envelope.version === 1) {
              const acceptPayload = envelope.payload as GroupInviteResponsePayload;
              try { await service.addGroupMember(acceptPayload.groupId, acceptPayload.fromDid, acceptPayload.fromDisplayName); _wasmCallCount++; service.dispatchGroupEvent({ type: 'inviteAccepted', groupId: acceptPayload.groupId, fromDid: acceptPayload.fromDid }); } catch (err) { if (__DEV__) dbg.warn('network', 'failed to process offline group invite acceptance', { error: String(err) }, SRC); }
            } else if (envelope.envelope === 'group_message' && envelope.version === 1) {
              const groupMsgPayload = envelope.payload as GroupMessagePayload;
              const groupKeyId = `${groupMsgPayload.groupId}:${groupMsgPayload.keyVersion}`;
              if (_failedGroupKeys.has(groupKeyId)) {
                // Skip — key version already known to be missing (prevents WASM/SQL flood)
              } else {
                try {
                  const plaintext = await service.decryptGroupMessage(groupMsgPayload.groupId, groupMsgPayload.ciphertext, groupMsgPayload.nonce, groupMsgPayload.keyVersion, groupMsgPayload.senderDid, groupMsgPayload.timestamp); _wasmCallCount++;
                  try {
                    const storePayload: ChatMessagePayload = { messageId: groupMsgPayload.messageId, conversationId: groupMsgPayload.conversationId, senderDid: groupMsgPayload.senderDid, contentEncrypted: utf8ToBase64(plaintext), nonce: '000000000000000000000000', timestamp: groupMsgPayload.timestamp, isGroup: true };
                    await service.storeIncomingMessage(storePayload); _wasmCallCount++;
                  } catch { /* Storage is best-effort for group messages */ }
                  _offlineConversationIds.add(groupMsgPayload.conversationId);
                } catch (err) {
                  const errStr = String(err);
                  if (errStr.includes('key version') || errStr.includes('not found')) {
                    _failedGroupKeys.add(groupKeyId);
                  }
                  if (__DEV__) dbg.warn('network', 'failed to process offline group message', { error: String(err) }, SRC);
                }
              }
            } else if (envelope.envelope === 'group_key_rotation' && envelope.version === 1) {
              const keyPayload = envelope.payload as GroupKeyRotationPayload;
              try { await service.importGroupKey(keyPayload.encryptedKey, keyPayload.nonce, keyPayload.senderDid, keyPayload.groupId, keyPayload.keyVersion); _wasmCallCount++; service.dispatchGroupEvent({ type: 'keyRotated', groupId: keyPayload.groupId, keyVersion: keyPayload.keyVersion }); } catch (err) { if (__DEV__) dbg.warn('network', 'failed to import offline rotated group key', { error: String(err) }, SRC); }
            } else if (envelope.envelope === 'key_rotation' && envelope.version === 1) {
              const keyPayload = envelope.payload as KeyRotationPayload;
              try {
                await service.updateFriendEncryptionKey(keyPayload.fromDid, keyPayload.newEncryptionKey, keyPayload.signature); _wasmCallCount++;
                service.dispatchFriendEvent({ type: 'friendKeyRotated', did: keyPayload.fromDid });
              } catch (err) { if (__DEV__) dbg.warn('network', 'failed to process offline key rotation', { error: String(err) }, SRC); }
            } else if (envelope.envelope === 'group_member_removed' && envelope.version === 1) {
              const removePayload = envelope.payload as GroupMemberRemovedPayload;
              service.dispatchGroupEvent({ type: 'memberRemoved', groupId: removePayload.groupId, removedDid: removePayload.removedDid });
            } else if (envelope.envelope === 'message_status' && envelope.version === 1) {
              const statusPayload = envelope.payload as MessageStatusPayload;
              try { await service.updateMessageStatus(statusPayload.messageId, statusPayload.status); _wasmCallCount++; } catch (err) { if (__DEV__) dbg.warn('network', 'failed to update offline message status', { error: String(err) }, SRC); }
            } else if (envelope.envelope === 'group_read_receipt' && envelope.version === 1) {
              const grr = envelope.payload as GroupReadReceiptPayload;
              try { service.groupMarkRead(grr.groupId, grr.memberDid, grr.lastReadMessageId, grr.lastReadTimestamp); _wasmCallCount++; } catch (err) { if (__DEV__) dbg.warn('network', 'failed to process offline group read receipt', { error: String(err) }, SRC); }
            } else if (envelope.envelope === 'community_event' && envelope.version === 1) {
              const communityPayload = envelope.payload as CommunityEventPayload;
              const offlineEvent = communityPayload.event;
              // Resolve remote IDs to local (same logic as online handler)
              try {
                let localId = await service.findCommunityByOrigin(communityPayload.communityId);
                // Fallback: owner's local ID === canonical ID (no origin_community_id set)
                if (!localId) {
                  try {
                    const directCommunity = await service.getCommunity(communityPayload.communityId);
                    if (directCommunity) localId = communityPayload.communityId;
                  } catch { /* not found */ }
                }
                if (localId) {
                  if ('channelName' in offlineEvent && offlineEvent.channelName && 'channelId' in offlineEvent) {
                    const chs = await service.getAllChannels(localId);
                    const m = chs.find((ch: any) => ch.name === offlineEvent.channelName);
                    if (m) (offlineEvent as any).channelId = m.id;
                  }
                  if ('communityId' in offlineEvent) (offlineEvent as any).communityId = localId;
                  if (offlineEvent.type === 'memberJoined') {
                    try { await service.joinCommunity(localId, offlineEvent.memberDid, offlineEvent.memberNickname); } catch { /* already exists */ }
                    // Fan-out: owner re-broadcasts to all other members (see online handler)
                    try {
                      const community = await service.getCommunity(localId);
                      const myDid = _lastRelayDid;
                      if (myDid && community.ownerDid === myDid && ws.readyState === WebSocket.OPEN) {
                        await service.broadcastCommunityEvent(localId, offlineEvent, myDid, ws);
                      }
                    } catch { /* best-effort fan-out */ }
                  }
                  // Persist offline community messages to local DB so they appear after navigation
                  if (offlineEvent.type === 'communityMessageSent' && offlineEvent.content && offlineEvent.channelId) {
                    try {
                      await service.storeReceivedCommunityMessage(
                        offlineEvent.messageId, offlineEvent.channelId, offlineEvent.senderDid,
                        offlineEvent.content, Date.now(), offlineEvent.metadata,
                      );
                    } catch { /* best-effort — may already exist */ }
                  }
                }
              } catch { /* best-effort */ }
              service.dispatchCommunityEvent(offlineEvent);
            } else if (envelope.envelope === 'dm_file_event' && envelope.version === 1) {
              const dmFilePayload = envelope.payload as DmFileEventPayload;
              service.dispatchDmFileEvent(dmFilePayload);
            } else if (envelope.envelope === 'account_metadata' && envelope.version === 1) {
              const metaPayload = envelope.payload as AccountMetadataPayload;
              service.dispatchMetadataEvent({ type: 'metadataReceived', key: metaPayload.key, value: metaPayload.value, timestamp: metaPayload.timestamp });
            } else if (envelope.envelope === 'account_backup_manifest' || envelope.envelope === 'account_backup_chunk') {
              // Collected below after the loop
              _backupEnvelopes.push(envelope);
            } else if (envelope.envelope === 'presence_online' || envelope.envelope === 'presence_ack') {
              // Stale presence from when we were offline — ignore silently
            }
          } catch (parseErr) {
            if (__DEV__) dbg.info('network', 'offline message parse error', { error: String(parseErr) }, SRC);
          }
          }
        }

        // Log final WASM memory after all offline messages processed
        const _memAfter = getWasmMemoryStats();
        const _wasmGrowthMB = ((_memAfter.totalWasmBytes - _memBefore.totalWasmBytes) / 1024 / 1024).toFixed(1);
        if (__DEV__) dbg.info('network', `WASM-TRACE offline END: ${_memAfter.summary}`, { growthMB: _wasmGrowthMB, wasmCalls: _wasmCallCount }, SRC);

        // Trace offline batch end
        if (isTraceActive()) {
          traceEmit({
            cat: 'net',
            fn: 'offline_batch_end',
            argBytes: 0,
            durMs: 0,
            memBefore: _memBefore.totalWasmBytes,
            memAfter: _memAfter.totalWasmBytes,
            memGrowth: _memAfter.totalWasmBytes - _memBefore.totalWasmBytes,
            argPreview: `chunk=${chunkIndex + 1}/${totalChunks} wasmCalls=${_wasmCallCount} growth=${_wasmGrowthMB}MB`,
          });
        }
        // Per-module growth breakdown
        for (const mod of _memAfter.modules) {
          const before = _memBefore.modules.find(m => m.label === mod.label);
          const growth = before ? ((mod.bytes - before.bytes) / 1024 / 1024).toFixed(1) : '?';
          if (__DEV__) dbg.info('network', `WASM-TRACE module: ${mod.label}`, { mb: mod.mb, growthMB: growth }, SRC);
        }

        // Fire a single batch refresh for all conversations that received
        // offline messages. This replaces 1400+ individual dispatchMessageEvent
        // calls with a single event, preventing V8 GC exhaustion.
        if (_offlineConversationIds.size > 0) {
          if (__DEV__) dbg.info('network', 'offline batch complete', { conversationsAffected: _offlineConversationIds.size }, SRC);
          await _gcYield(100); // Give V8 GC time before triggering render
          service.dispatchMessageEvent({
            type: 'offlineBatchComplete',
            conversationIds: Array.from(_offlineConversationIds),
          });
        }

        // Process backup envelopes if any were collected
        if (_backupEnvelopes.length > 0) {
          try {
            const manifest = parseBackupManifest(_backupEnvelopes);
            if (manifest) {
              const chunks = parseBackupChunks(_backupEnvelopes, manifest.backupId);
              if (chunks.length === manifest.totalChunks) {
                if (__DEV__) dbg.info('network', 'found complete backup, restoring', { totalChunks: manifest.totalChunks }, SRC);
                const result = await restoreFromChunks(chunks, manifest.nonce);
                if (__DEV__) dbg.info('network', 'backup restored', { imported: result.imported }, SRC);
                service.dispatchMetadataEvent({
                  type: 'backupRestored',
                  imported: result.imported,
                });
              } else {
                if (__DEV__) dbg.warn('network', 'incomplete backup', { chunks: chunks.length, totalChunks: manifest.totalChunks }, SRC);
              }
            }
          } catch (backupErr) {
            if (__DEV__) dbg.warn('network', 'backup restore error', { error: String(backupErr) }, SRC);
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
            if (__DEV__) dbg.info('network', 'message ack: sending→sent', { messageId: pendingMsgId }, SRC);
          } catch (err) { if (__DEV__) dbg.warn('network', 'failed to update message status on ack', { error: String(err) }, SRC); }
        }
        break;
      }

      case 'call_room_created': { service.dispatchCallEvent({ type: 'callRoomCreated', payload: { roomId: msg.room_id, groupId: msg.group_id } }); break; }
      case 'call_participant_joined': { service.dispatchCallEvent({ type: 'callParticipantJoined', payload: { roomId: msg.room_id, did: msg.did } }); break; }
      case 'call_participant_left': { service.dispatchCallEvent({ type: 'callParticipantLeft', payload: { roomId: msg.room_id, did: msg.did } }); break; }
      case 'call_signal_forward': { service.dispatchCallEvent({ type: 'callSignalForward', payload: { roomId: msg.room_id, fromDid: msg.from_did, payload: msg.payload } }); break; }
      case 'pong': break;
      case 'session_created': case 'session_joined': case 'signal': break;
      case 'error': if (__DEV__) dbg.error('network', 'relay error', { message: msg.message }, SRC); break;
      case 'sync_update': {
        // Real-time sync delta from another session of the same DID
        // Forward sync_update to registered callbacks (SyncContext)
        for (const cb of _syncUpdateCallbacks) {
          try {
            cb({
              section: msg.section,
              version: msg.version,
              encryptedData: msg.encrypted_data,
            });
          } catch (e) {
            if (__DEV__) dbg.error('network', 'sync update callback error', { error: String(e) }, SRC);
          }
        }
        break;
      }
      default: if (__DEV__) dbg.info('network', 'unknown relay message type', { type: msg.type }, SRC);
    }
  } catch (err) {
    if (__DEV__) dbg.error('network', 'failed to parse relay message', { error: String(err) }, SRC);
  }
}

// ── Reconnect scheduler & executor ────────────────────────────────────

_scheduleReconnect = function(): void {
  if (_intentionalDisconnect) { if (__DEV__) dbg.debug('network', 'reconnect SKIP — intentional disconnect', undefined, SRC); return; }
  if (_relayConnectPromise) { if (__DEV__) dbg.debug('network', 'reconnect SKIP — already connecting', undefined, SRC); return; }
  if (!_lastRelayDid || !_lastService) { if (__DEV__) dbg.debug('network', 'reconnect SKIP — no DID/service', undefined, SRC); return; }

  const maxPerServer = NETWORK_CONFIG.maxReconnectAttempts;
  const totalServers = DEFAULT_RELAY_SERVERS.length;
  const totalMaxAttempts = maxPerServer * totalServers;

  if (_reconnectAttempt >= totalMaxAttempts) {
    if (__DEV__) dbg.warn('network', 'reconnect: all servers exhausted, will retry on foreground', { attempts: _reconnectAttempt }, SRC);
    return;
  }

  _currentServerIndex = Math.floor(_reconnectAttempt / maxPerServer) % totalServers;
  const serverUrl = DEFAULT_RELAY_SERVERS[_currentServerIndex];
  const delay = _computeBackoffDelay(_reconnectAttempt % maxPerServer);
  if (__DEV__) dbg.info('network', `reconnect attempt ${_reconnectAttempt + 1}/${totalMaxAttempts} → ${serverUrl} in ${delay}ms`, undefined, SRC);
  if (__DEV__) dbg.info('network', `reconnect: attempt ${_reconnectAttempt + 1}/${totalMaxAttempts}`, { serverUrl, delayMs: delay }, SRC);

  _clearReconnectTimer();
  _reconnectTimer = setTimeout(() => {
    _reconnectTimer = null;
    _attemptReconnect(serverUrl);
  }, delay);
};

_attemptReconnect = async function(serverUrl: string): Promise<void> {
  if (_intentionalDisconnect || !_lastService || !_lastRelayDid) return;
  if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
    if (__DEV__) dbg.info('network', 'reconnect: already connected, aborting attempt', undefined, SRC);
    return;
  }

  if (__DEV__) dbg.info('network', 'reconnect: attempting connection', { serverUrl }, SRC);
  _reconnectAttempt++;

  try {
    const registerMessage = JSON.stringify({ type: 'register', did: _lastRelayDid });

    try { await _lastService.connectRelay(serverUrl); } catch { /* Non-fatal */ }

    if (_relayWs) { _relayWs.close(); _relayWs = null; }

    const ws = new WebSocket(serverUrl);
    _relayWs = ws;
    _lastService.setRelayWs(ws);

    ws.onopen = () => {
      if (__DEV__) dbg.info('network', 'reconnect: connected', { serverUrl }, SRC);
      ws.send(registerMessage);
      _wsSendCount++;
      _wsSendBytes += registerMessage.length;
      if (isTraceActive()) {
        traceEmit({ cat: 'net', fn: 'ws_send', argBytes: registerMessage.length, durMs: 0, memBefore: 0, memAfter: 0, memGrowth: 0, argPreview: 'register' });
      }
      _registeredRelayDid = _lastRelayDid;
      _notifyRelayState(true, serverUrl);
      _reconnectAttempt = 0;
      _currentServerIndex = 0;
      _startKeepAlive();
    };

    ws.onmessage = (event) => _enqueueRelayMessage(ws, event);

    ws.onerror = (event) => {
      if (__DEV__) dbg.error('network', 'reconnect: WebSocket error', { event: String(event) }, SRC);
    };

    ws.onclose = (event) => {
      if (__DEV__) dbg.info('network', 'reconnect: WebSocket closed', { code: event.code }, SRC);
      if (_relayWs === ws) {
        _relayWs = null;
        _notifyRelayState(false, null);
        _clearKeepAlive();
        _clearOnlineDids();
        _scheduleReconnect();
      }
    };
  } catch (err) {
    if (__DEV__) dbg.error('network', 'reconnect: failed', { error: String(err) }, SRC);
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

  // Subscribe to module-level discovery events (single service-level listener
  // shared across all useNetwork() instances). This replaces the per-instance
  // onDiscoveryEvent subscription that was creating 21+ listeners.
  useEffect(() => {
    if (!service) return;

    // Ensure the single service-level subscription exists
    _subscribeDiscovery(service, fetchStatus);

    // Sync current state on mount
    setStatus(_networkStatus);

    // Subscribe to module-level notifications
    const listener: DiscoveryListener = (s) => setStatus(s);
    _discoveryListeners.add(listener);
    return () => { _discoveryListeners.delete(listener); };
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
    if (__DEV__) dbg.info('network', `connectRelay START → ${url}`, undefined, SRC);

    // If already connected or connecting, skip — but ensure the current
    // service instance has the WS reference (critical after account switch,
    // where the reconnect manager may have created the WS on the old instance).
    if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
      // If DID changed, close old WS and fall through to open a fresh one
      // (the relay doesn't support re-registration on the same connection)
      if (identity?.did && _registeredRelayDid && _registeredRelayDid !== identity.did) {
        if (__DEV__) dbg.info('network', 'DID changed — closing old relay WS to reconnect with new DID', undefined, SRC);
        _relayWs.close();
        _relayWs = null;
        _registeredRelayDid = null;
        _clearKeepAlive();
        // Fall through to create a new connection below
      } else {
        if (__DEV__) dbg.info('network', 'relay already connected, syncing to current service', undefined, SRC);
        relayWsRef.current = _relayWs;
        service.setRelayWs(_relayWs);
        _lastService = service;
        _notifyRelayState(true, url);
        return;
      }
    }
    if (_relayConnectPromise) {
      if (__DEV__) dbg.info('network', 'relay connection already in progress, waiting', undefined, SRC);
      await _relayConnectPromise;
      // After waiting, ensure this service instance has the WS reference
      if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
        service.setRelayWs(_relayWs);
        _lastService = service;
      }
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
          if (__DEV__) dbg.info('network', 'using frontend DID for relay register', { did: identity.did.slice(0, 24) + '...' }, SRC);
        }

        // Still call the backend to notify it about the relay connection
        if (__DEV__) dbg.info('network', 'connecting to relay', { url }, SRC);
        try {
          const result = await service.connectRelay(url);
          if (__DEV__) dbg.info('network', 'connectRelay result', { hasResult: !!result }, SRC);
          // Use backend register message as fallback if frontend identity not available
          if (!registerMessage && result?.registerMessage) {
            registerMessage = result.registerMessage;
          }
        } catch (backendErr) {
          if (__DEV__) dbg.warn('network', 'backend connectRelay failed (non-fatal, using frontend DID)', { error: String(backendErr) }, SRC);
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
            if (__DEV__) dbg.info('network', 'relay WS OPEN, sending register', undefined, SRC);
            ws.send(registerMessage);
            _wsSendCount++;
            _wsSendBytes += registerMessage.length;
            if (isTraceActive()) {
              traceEmit({ cat: 'net', fn: 'ws_send', argBytes: registerMessage.length, durMs: 0, memBefore: 0, memAfter: 0, memGrowth: 0, argPreview: 'register' });
            }
            _registeredRelayDid = identity?.did ?? null;
          } else {
            if (__DEV__) dbg.warn('network', 'relay WS OPEN but no register message — relay may not know our DID', undefined, SRC);
          }
          // Notify ALL useNetwork() instances via shared state
          _notifyRelayState(true, url);
          // Reset reconnect state on successful connection & start keep-alive
          _reconnectAttempt = 0;
          _currentServerIndex = 0;
          _startKeepAlive();
          if (__DEV__) dbg.info('network', 'relay WebSocket connected', { url }, SRC);
        };

        ws.onmessage = (event) => _enqueueRelayMessage(ws, event);

        ws.onerror = (event) => {
          if (__DEV__) dbg.error('network', 'relay WS ERROR', { readyState: ws.readyState, event: String(event) }, SRC);
          setError(new Error('Relay connection error'));
        };

        ws.onclose = (event) => {
          if (__DEV__) dbg.warn('network', 'relay WS CLOSED', { code: event.code, reason: event.reason, clean: event.wasClean }, SRC);
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
    if (__DEV__) dbg.info('lifecycle', 'autoStart TRIGGERED (initStage=hydrated) — deferring 1.5s to reduce peak memory', undefined, SRC);

    // Defer P2P + relay startup by 1.5s to let the initial React render
    // storm settle. The WASM module + sql.js + React bundle already consume
    // significant memory; starting libp2p WebRTC at the same time pushes
    // browsers over the OOM threshold.
    const deferTimer = setTimeout(() => {
      autoStart();
    }, 1500);
    // Cleanup if the component unmounts during the defer period
    // (stored in a ref below)
    _autoStartDeferTimer = deferTimer;

    async function autoStart() {
      const endTimer = __DEV__ ? dbg.time('autoStart') : null;
      // Start the P2P network and relay connection in parallel.
      // The relay doesn't depend on the P2P swarm, so there's no
      // reason to block the relay WebSocket on libp2p startup.
      const tasks: Promise<void>[] = [];

      // P2P network — only start if explicitly enabled.
      // The libp2p swarm runs a continuous WASM event loop that accumulates
      // linear memory (never shrinks), causing eventual OOM tab crash.
      // All messaging works via the relay WebSocket without P2P.
      if (NETWORK_CONFIG.autoStartP2P) {
        tasks.push(
          (async () => {
            try {
              if (__DEV__) dbg.info('network', 'P2P startNetwork START', undefined, SRC);
              await service!.startNetwork();
              if (__DEV__) dbg.info('network', 'P2P startNetwork DONE', undefined, SRC);
            } catch (err) {
              if (__DEV__) dbg.error('network', 'P2P startNetwork FAILED', { error: String(err) }, SRC);
            }
          })()
        );
      } else {
        if (__DEV__) dbg.info('network', 'P2P network disabled (autoStartP2P=false), relay-only mode', undefined, SRC);
      }

      // Relay server
      if (NETWORK_CONFIG.autoConnectRelay) {
        tasks.push(
          (async () => {
            if (__DEV__) dbg.info('network', `auto-connecting relay → ${PRIMARY_RELAY_URL}`, undefined, SRC);
            try {
              await connectRelay(PRIMARY_RELAY_URL);
              if (__DEV__) dbg.info('network', 'relay auto-connect DONE', undefined, SRC);
            } catch (err) {
              if (__DEV__) dbg.error('network', 'relay auto-connect FAILED', { error: String(err) }, SRC);
            }
          })()
        );
      }

      await Promise.all(tasks);
      endTimer?.();
    }
  }, [isReady, service, identity, initStage, connectRelay]);

  // ── AppState listener + account-switch relay sync ─────────────────────
  //
  // This effect fires whenever `service` or `identity.did` changes.
  // After an account switch:
  //   1. The UmbraProvider remounts (new service instance)
  //   2. _hasAutoStarted is still true (module-level flag)
  //   3. The relay WS may still be OPEN from the reconnect manager
  //   4. But the relay has the OLD DID registered
  //
  // This effect fixes all three issues: syncs the WS to the new service,
  // re-registers with the relay for the new DID, and if the WS is dead,
  // resets _hasAutoStarted so the auto-start effect can fire.
  useEffect(() => {
    if (!service || !identity?.did) return;

    // Detect account switch: the relay is registered with a different DID
    const needsReRegister = _registeredRelayDid !== null && _registeredRelayDid !== identity.did;

    // Keep module-level refs fresh for reconnect manager
    _lastService = service;
    _lastRelayDid = identity.did;

    if (needsReRegister) {
      // Account switched — the relay doesn't support re-registration on the
      // same WS, so we must close the old connection and open a fresh one
      // registered to the new DID.
      if (__DEV__) dbg.info('network', 'account switched — closing old relay WS and reconnecting for new DID', { did: identity.did.slice(0, 24) + '...' }, SRC);

      // Mark as intentional so onclose won't trigger the reconnect manager
      _intentionalDisconnect = true;
      _clearReconnectTimer();
      _clearKeepAlive();

      if (_relayWs) {
        _relayWs.close();
        _relayWs = null;
      }
      _registeredRelayDid = null;
      _relayConnectPromise = null;
      _notifyRelayState(false, null);
      service.setRelayWs(null as any);

      // Use connectRelay to open a fresh connection with the new DID.
      // Small delay to let the service finish hydration after switch.
      setTimeout(() => {
        _intentionalDisconnect = false;
        connectRelay(PRIMARY_RELAY_URL).catch((err: any) => {
          if (__DEV__) dbg.warn('network', 'post-switch relay reconnect failed', { error: String(err) }, SRC);
          // Fall back to reconnect manager
          _resetReconnectState();
          _scheduleReconnect();
        });
      }, 500);
    } else if (_relayWs && _relayWs.readyState === WebSocket.OPEN) {
      // Same DID, just sync WS to the (potentially new) service instance
      service.setRelayWs(_relayWs);
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        // Foreground: check relay and reconnect if needed
        if (!_relayWs || _relayWs.readyState !== WebSocket.OPEN) {
          if (__DEV__) dbg.info('network', 'foregrounded — relay disconnected, scheduling reconnect', undefined, SRC);
          _resetReconnectState();
          _scheduleReconnect();
        } else {
          // Relay still open — restart keep-alive in case it lapsed
          _startKeepAlive();
        }
        // Check P2P network too (only if enabled)
        if (NETWORK_CONFIG.autoStartP2P) {
          service.getNetworkStatus().then((status: NetworkStatus) => {
            if (!status.isRunning) {
              if (__DEV__) dbg.info('network', 'P2P network not running, restarting', undefined, SRC);
              service.startNetwork().catch(() => {});
            }
          }).catch(() => {});
        }
      } else if (nextState === 'background') {
        // Background: stop keep-alive to save battery
        _clearKeepAlive();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [service, identity?.did, connectRelay]);

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
