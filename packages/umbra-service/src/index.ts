/**
 * # Umbra Service
 *
 * Cross-platform TypeScript API for Umbra Core.
 *
 * This package provides a unified interface to the Umbra Core Rust backend,
 * abstracting away platform differences (Web, iOS, Android).
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         Frontend (React Native)                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         UmbraService (this file)                        │
 * │                                                                         │
 * │  • Unified API across platforms                                        │
 * │  • TypeScript types matching Rust structs                              │
 * │  • Event subscription management                                        │
 * │  • Error handling and transformation                                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *              ┌─────────────────────┼─────────────────────┐
 *              ▼                     ▼                     ▼
 *       ┌────────────┐        ┌────────────┐        ┌────────────┐
 *       │  Web WASM  │        │ iOS Native │        │  Android   │
 *       │            │        │            │        │            │
 *       │ Web Worker │        │ UniFFI/JSI │        │ UniFFI/JNI │
 *       └────────────┘        └────────────┘        └────────────┘
 *              │                     │                     │
 *              └─────────────────────┼─────────────────────┘
 *                                    ▼
 *                          ┌────────────────┐
 *                          │  Umbra Core    │
 *                          │    (Rust)      │
 *                          └────────────────┘
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { UmbraService } from '@umbra/service';
 *
 * // Initialize
 * await UmbraService.initialize();
 *
 * // Create identity
 * const { identity, recoveryPhrase } = await UmbraService.createIdentity('Alice');
 *
 * // Subscribe to events
 * const unsubscribe = UmbraService.onMessageEvent((event) => {
 *   console.log('Message event:', event);
 * });
 * ```
 *
 * @packageDocumentation
 */

import {
  initUmbraWasm,
  getWasm,
  isWasmReady,
  eventBridge,
} from '@umbra/wasm';
import type { UmbraWasmModule, UmbraEvent } from '@umbra/wasm';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Convert snake_case keys to camelCase recursively.
 *
 * Rust returns `snake_case` JSON. TypeScript expects `camelCase`.
 */
function snakeToCamel(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = snakeToCamel(value);
  }
  return result;
}

/**
 * Convert camelCase keys to snake_case for sending to Rust.
 */
function camelToSnake(obj: unknown): unknown {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  return result;
}

/**
 * Get the WASM module, throwing if not initialized.
 */
function wasm(): UmbraWasmModule {
  const w = getWasm();
  if (!w) {
    throw new UmbraError(
      ErrorCode.NotInitialized,
      'WASM module not initialized. Call UmbraService.initialize() first.'
    );
  }
  return w;
}

/**
 * Parse a JSON string from WASM and convert snake_case keys to camelCase.
 *
 * Handles both synchronous (WASM) and asynchronous (Tauri IPC) return
 * values. When the backend is Tauri, `invoke()` returns a Promise, so
 * callers should always `await` this function.
 */
async function parseWasm<T>(jsonOrJsValue: string | Promise<string> | { toString(): string }): Promise<T> {
  const resolved = await jsonOrJsValue;
  const str = typeof resolved === 'string' ? resolved : resolved.toString();
  const raw = JSON.parse(str);
  return snakeToCamel(raw) as T;
}

/**
 * Wrap a WASM call with error conversion.
 */
function wrapWasmError(fn: () => unknown): unknown {
  try {
    return fn();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new UmbraError(ErrorCode.Internal, message);
  }
}

// =============================================================================
// TYPES
// =============================================================================

/**
 * Error codes from Umbra Core
 *
 * Error codes are organized by category:
 * - 100-199: Core lifecycle
 * - 200-299: Identity
 * - 300-399: Crypto
 * - 400-499: Storage
 * - 500-599: Network
 * - 600-699: Friends
 * - 700-799: Messages
 * - 900-999: Internal
 */
export enum ErrorCode {
  // Core (100-199)
  NotInitialized = 100,
  AlreadyInitialized = 101,
  ShutdownInProgress = 102,

  // Identity (200-299)
  NoIdentity = 200,
  IdentityExists = 201,
  InvalidRecoveryPhrase = 202,
  KeyDerivationFailed = 203,
  InvalidDid = 204,
  ProfileUpdateFailed = 205,

  // Crypto (300-399)
  EncryptionFailed = 300,
  DecryptionFailed = 301,
  SigningFailed = 302,
  VerificationFailed = 303,
  InvalidKey = 304,
  KeyExchangeFailed = 305,
  RngFailed = 306,

  // Storage (400-499)
  StorageNotInitialized = 400,
  StorageReadError = 401,
  StorageWriteError = 402,
  StorageNotFound = 403,
  StorageCorrupted = 404,
  DatabaseError = 405,

  // Network (500-599)
  NotConnected = 500,
  ConnectionFailed = 501,
  Timeout = 502,
  PeerNotFound = 503,
  ProtocolError = 504,
  TransportError = 505,
  DhtError = 506,

  // Friends (600-699)
  AlreadyFriends = 600,
  NotFriends = 601,
  RequestPending = 602,
  RequestNotFound = 603,
  UserBlocked = 604,
  InvalidFriendRequest = 605,
  CannotAddSelf = 606,

  // Messages (700-799)
  ConversationNotFound = 700,
  MessageNotFound = 701,
  RecipientOffline = 702,
  DeliveryFailed = 703,
  InvalidMessageContent = 704,

  // Internal (900-999)
  Internal = 900,
  NotImplemented = 901,
  SerializationError = 902,
  DeserializationError = 903,
}

/**
 * Error from Umbra Core
 */
export class UmbraError extends Error {
  /** Numeric error code */
  readonly code: ErrorCode;
  /** Whether the error is recoverable (can retry) */
  readonly recoverable: boolean;

  constructor(code: ErrorCode, message: string, recoverable: boolean = false) {
    super(message);
    this.name = 'UmbraError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

/**
 * Public keys for a user
 */
export interface PublicKeys {
  /** Ed25519 public key for signature verification (hex) */
  signing: string;
  /** X25519 public key for encryption (hex) */
  encryption: string;
}

/**
 * Public identity information (safe to share)
 */
export interface PublicIdentity {
  /** Decentralized Identifier (did:key:z6Mk...) */
  did: string;
  /** Display name */
  displayName: string;
  /** Status message */
  status?: string;
  /** Avatar (base64 or IPFS CID) */
  avatar?: string;
  /** Public keys */
  publicKeys: PublicKeys;
  /** When created (Unix timestamp) */
  createdAt: number;
}

/**
 * User's own identity (includes DID but not private keys)
 */
export interface Identity {
  /** Decentralized Identifier */
  did: string;
  /** Display name */
  displayName: string;
  /** Status message */
  status?: string;
  /** Avatar */
  avatar?: string;
  /** When created (Unix timestamp) */
  createdAt: number;
}

/**
 * Profile update types
 */
export type ProfileUpdate =
  | { type: 'displayName'; value: string }
  | { type: 'status'; value: string | null }
  | { type: 'avatar'; value: string | null };

/**
 * Result of creating an identity
 */
export interface CreateIdentityResult {
  /** The created identity */
  identity: Identity;
  /** Recovery phrase (24 words) - SHOW ONCE ONLY */
  recoveryPhrase: string[];
}

/**
 * Peer connection information
 */
export interface ConnectionInfo {
  /** The peer's DID */
  did: string;
  /** libp2p PeerId */
  peerId: string;
  /** Multiaddresses where the peer can be reached */
  addresses: string[];
  /** Display name */
  displayName?: string;
  /** Shareable link */
  link?: string;
  /** Base64-encoded connection info */
  base64?: string;
}

/**
 * Discovery result
 */
export type DiscoveryResult =
  | { status: 'found'; peer: ConnectionInfo }
  | { status: 'offline'; lastSeen?: number }
  | { status: 'notFound' };

/**
 * Discovery events
 */
export type DiscoveryEvent =
  | { type: 'peerOnline'; did: string; addresses: string[] }
  | { type: 'peerOffline'; did: string }
  | { type: 'networkStatus'; connected: boolean; peerCount: number };

/**
 * A friend request (as returned from the database)
 */
export interface FriendRequest {
  /** Unique request ID */
  id: string;
  /** Sender's DID */
  fromDid: string;
  /** Recipient's DID */
  toDid: string;
  /** Direction: "incoming" or "outgoing" */
  direction: string;
  /** Optional message */
  message?: string;
  /** Sender's display name */
  fromDisplayName?: string;
  /** Sender's signing key (hex) */
  fromSigningKey?: string;
  /** Sender's encryption key (hex) */
  fromEncryptionKey?: string;
  /** When created (Unix timestamp) */
  createdAt: number;
  /** Status: "pending", "accepted", "rejected" */
  status: string;
}

/**
 * A confirmed friend
 */
export interface Friend {
  /** Friend's DID */
  did: string;
  /** Display name */
  displayName: string;
  /** Status message */
  status?: string;
  /** Avatar */
  avatar?: string;
  /** Their Ed25519 signing key (hex) */
  signingKey: string;
  /** Their X25519 encryption key (hex) */
  encryptionKey: string;
  /** When friendship was established */
  createdAt: number;
  /** Last updated */
  updatedAt: number;
  /** Currently online */
  online?: boolean;
}

/**
 * Friend events
 */
export type FriendEvent =
  | { type: 'requestReceived'; request: FriendRequest }
  | { type: 'requestAccepted'; did: string }
  | { type: 'requestRejected'; did: string }
  | { type: 'friendSyncConfirmed'; did: string }
  | { type: 'friendOnline'; did: string }
  | { type: 'friendOffline'; did: string }
  | { type: 'friendUpdated'; did: string };

/**
 * Message content
 */
export type MessageContent = { type: 'text'; text: string };

/**
 * A reaction on a message
 */
export interface MessageReaction {
  /** The emoji character */
  emoji: string;
  /** Number of users who reacted */
  count: number;
  /** DIDs of users who reacted */
  users: string[];
  /** Whether the current user has reacted with this emoji */
  reacted: boolean;
}

/**
 * Reply-to reference
 */
export interface ReplyTo {
  /** Original message ID */
  messageId: string;
  /** Sender's DID */
  senderDid: string;
  /** Sender display name */
  senderName?: string;
  /** Text preview */
  text: string;
}

/**
 * Attachment on a message
 */
export interface MessageAttachment {
  /** Unique attachment ID */
  id: string;
  /** File name */
  name: string;
  /** File size in bytes */
  size?: number;
  /** MIME type */
  type?: string;
  /** URL or data URI */
  url?: string;
}

/**
 * Message delivery status
 */
export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | { failed: string };

/**
 * A message in a conversation
 */
export interface Message {
  /** Unique message ID */
  id: string;
  /** Conversation ID */
  conversationId: string;
  /** Sender's DID */
  senderDid: string;
  /** Message content */
  content: MessageContent;
  /** When sent (Unix timestamp ms) */
  timestamp: number;
  /** Whether we've read it */
  read: boolean;
  /** Whether it's been delivered */
  delivered: boolean;
  /** Delivery status */
  status: MessageStatus;
  /** Reactions on this message */
  reactions?: MessageReaction[];
  /** Reply reference */
  replyTo?: ReplyTo;
  /** Whether message has been edited */
  edited?: boolean;
  /** When edited (Unix timestamp ms) */
  editedAt?: number;
  /** Whether message has been deleted */
  deleted?: boolean;
  /** When deleted (Unix timestamp ms) */
  deletedAt?: number;
  /** Whether message is pinned */
  pinned?: boolean;
  /** Who pinned it (DID) */
  pinnedBy?: string;
  /** When pinned (Unix timestamp ms) */
  pinnedAt?: number;
  /** Thread parent ID */
  threadId?: string;
  /** Number of thread replies */
  threadReplyCount?: number;
  /** Whether message was forwarded */
  forwarded?: boolean;
  /** Forwarded from info */
  forwardedFrom?: { senderDid: string; senderName?: string };
  /** Attachments */
  attachments?: MessageAttachment[];
}

/**
 * A conversation (DM or group)
 */
export interface Conversation {
  /** Unique conversation ID */
  id: string;
  /** Friend we're chatting with (undefined for groups) */
  friendDid?: string;
  /** Conversation type */
  type: 'dm' | 'group';
  /** Group ID (undefined for DMs) */
  groupId?: string;
  /** Unread count */
  unreadCount: number;
  /** Created timestamp */
  createdAt: number;
  /** Last message timestamp */
  lastMessageAt?: number;
}

/**
 * A group
 */
export interface Group {
  /** Unique group ID */
  id: string;
  /** Group name */
  name: string;
  /** Group description */
  description?: string;
  /** Avatar URL/data */
  avatar?: string;
  /** Creator's DID */
  createdBy: string;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * A group member
 */
export interface GroupMember {
  /** Group ID */
  groupId: string;
  /** Member's DID */
  memberDid: string;
  /** Display name in this group */
  displayName?: string;
  /** Role: 'admin' or 'member' */
  role: 'admin' | 'member';
  /** When they joined */
  joinedAt: number;
}

/**
 * Message events
 */
export type MessageEvent =
  | { type: 'messageSent'; message: Message }
  | { type: 'messageReceived'; message: Message }
  | { type: 'threadReplyReceived'; message: Message; parentId: string }
  | { type: 'messageStatusChanged'; messageId: string; status: MessageStatus }
  | { type: 'messageEdited'; messageId: string; newText: string; editedAt: number }
  | { type: 'messageDeleted'; messageId: string; deletedAt: number }
  | { type: 'reactionAdded'; messageId: string; emoji: string; userDid: string }
  | { type: 'reactionRemoved'; messageId: string; emoji: string; userDid: string }
  | { type: 'messagePinned'; messageId: string; pinnedBy: string; pinnedAt: number }
  | { type: 'messageUnpinned'; messageId: string }
  | { type: 'typingStarted'; conversationId: string; did: string }
  | { type: 'typingStopped'; conversationId: string; did: string };

/**
 * Network status
 */
export interface NetworkStatus {
  isRunning: boolean;
  peerCount: number;
  listenAddresses: string[];
}

/**
 * Relay connection status
 */
export interface RelayStatus {
  /** Whether connected to the relay server */
  connected: boolean;
  /** The relay server URL */
  relayUrl: string | null;
  /** Our DID on the relay */
  did: string | null;
}

/**
 * Relay session for single-scan friend adding
 */
export interface RelaySession {
  /** Unique session ID */
  sessionId: string;
  /** Relay server URL */
  relayUrl: string;
  /** Our DID */
  did: string;
  /** Our peer ID */
  peerId: string;
  /** The SDP offer payload */
  offerPayload: string;
  /** The relay message to send via WebSocket */
  createSessionMessage: string;
  /** Shareable link for QR code */
  link: string;
}

/**
 * Result of accepting a relay session
 */
export interface RelayAcceptResult {
  /** Session ID */
  sessionId: string;
  /** The SDP answer payload */
  answerPayload: string;
  /** The relay message to send via WebSocket */
  joinSessionMessage: string;
  /** Remote peer's DID */
  did: string;
  /** Remote peer's peer ID */
  peerId: string;
}

/**
 * Relay event types
 */
export type RelayEvent =
  | { type: 'connecting'; relayUrl: string }
  | { type: 'connected'; relayUrl: string; did: string }
  | { type: 'disconnected' }
  | { type: 'sessionCreated'; sessionId: string }
  | { type: 'sessionJoined'; sessionId: string; fromDid: string; answerPayload: string }
  | { type: 'signalReceived'; fromDid: string; payload: string }
  | { type: 'messageReceived'; fromDid: string; payload: string; timestamp: number }
  | { type: 'offlineMessages'; messages: Array<{ id: string; fromDid: string; payload: string; timestamp: number }> }
  | { type: 'error'; message: string };

/**
 * Relay envelope types for identifying relay payload types
 */
export type RelayEnvelope =
  | { envelope: 'friend_request'; version: 1; payload: FriendRequestPayload }
  | { envelope: 'friend_response'; version: 1; payload: FriendResponsePayload }
  | { envelope: 'friend_accept_ack'; version: 1; payload: FriendAcceptAckPayload }
  | { envelope: 'chat_message'; version: 1; payload: ChatMessagePayload }
  | { envelope: 'group_invite'; version: 1; payload: GroupInvitePayload }
  | { envelope: 'group_invite_accept'; version: 1; payload: GroupInviteResponsePayload }
  | { envelope: 'group_invite_decline'; version: 1; payload: GroupInviteResponsePayload }
  | { envelope: 'group_message'; version: 1; payload: GroupMessagePayload }
  | { envelope: 'group_key_rotation'; version: 1; payload: GroupKeyRotationPayload }
  | { envelope: 'group_member_removed'; version: 1; payload: GroupMemberRemovedPayload }
  | { envelope: 'message_status'; version: 1; payload: MessageStatusPayload }
  | { envelope: 'typing_indicator'; version: 1; payload: TypingIndicatorPayload }
  | { envelope: 'call_offer'; version: 1; payload: any }
  | { envelope: 'call_answer'; version: 1; payload: any }
  | { envelope: 'call_ice_candidate'; version: 1; payload: any }
  | { envelope: 'call_end'; version: 1; payload: any }
  | { envelope: 'call_state'; version: 1; payload: any };

/**
 * Payload for friend request envelope
 */
export interface FriendRequestPayload {
  /** Unique request ID */
  id: string;
  /** Sender's DID */
  fromDid: string;
  /** Sender's display name */
  fromDisplayName?: string;
  /** Sender's signing key (hex) */
  fromSigningKey?: string;
  /** Sender's encryption key (hex) */
  fromEncryptionKey?: string;
  /** Optional message */
  message?: string;
  /** Unix timestamp when created */
  createdAt: number;
}

/**
 * Payload for friend response envelope (accept/reject)
 */
export interface FriendResponsePayload {
  /** Original request ID */
  requestId: string;
  /** Responder's DID */
  fromDid: string;
  /** Responder's display name */
  fromDisplayName?: string;
  /** Responder's signing key (hex) */
  fromSigningKey?: string;
  /** Responder's encryption key (hex) */
  fromEncryptionKey?: string;
  /** Whether the request was accepted */
  accepted: boolean;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for chat message envelope (relay-based message delivery)
 */
export interface ChatMessagePayload {
  /** Unique message ID */
  messageId: string;
  /** Conversation ID */
  conversationId: string;
  /** Sender's DID */
  senderDid: string;
  /** Base64-encoded encrypted content */
  contentEncrypted: string;
  /** Hex-encoded 12-byte nonce */
  nonce: string;
  /** Unix timestamp */
  timestamp: number;
  /** Thread parent ID (present when this is a thread reply) */
  threadId?: string;
}

/**
 * Payload for group invite envelope
 */
export interface GroupInvitePayload {
  /** Invite ID */
  inviteId: string;
  /** Group ID */
  groupId: string;
  /** Group name */
  groupName: string;
  /** Group description */
  description?: string;
  /** Inviter's DID */
  inviterDid: string;
  /** Inviter's display name */
  inviterName: string;
  /** Encrypted group key (hex) */
  encryptedGroupKey: string;
  /** Nonce for group key decryption (hex) */
  nonce: string;
  /** JSON-encoded member list */
  membersJson: string;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for group invite response (accept/decline)
 */
export interface GroupInviteResponsePayload {
  /** Invite ID */
  inviteId: string;
  /** Group ID */
  groupId: string;
  /** Responder's DID */
  fromDid: string;
  /** Responder's display name */
  fromDisplayName: string;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for group message envelope (relay-based group message delivery)
 */
export interface GroupMessagePayload {
  /** Unique message ID */
  messageId: string;
  /** Group ID */
  groupId: string;
  /** Conversation ID */
  conversationId: string;
  /** Sender's DID */
  senderDid: string;
  /** Sender's display name */
  senderName: string;
  /** Encrypted message content (hex) */
  ciphertext: string;
  /** Nonce (hex) */
  nonce: string;
  /** Key version used for encryption */
  keyVersion: number;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for group key rotation (sent after member removal)
 */
export interface GroupKeyRotationPayload {
  /** Group ID */
  groupId: string;
  /** Encrypted new group key for this recipient (hex) */
  encryptedKey: string;
  /** Nonce for key decryption (hex) */
  nonce: string;
  /** Sender's DID (admin who rotated) */
  senderDid: string;
  /** New key version */
  keyVersion: number;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for group member removed notification
 */
export interface GroupMemberRemovedPayload {
  /** Group ID */
  groupId: string;
  /** DID of the removed member */
  removedDid: string;
  /** Admin who removed them */
  removedBy: string;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for friend acceptance acknowledgment (second leg of two-phase friend sync).
 * Sent by the original requester back to the accepter to confirm friendship is fully synced.
 */
export interface FriendAcceptAckPayload {
  /** DID of the sender (original requester acknowledging) */
  senderDid: string;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for typing indicator envelope
 */
export interface TypingIndicatorPayload {
  /** Conversation ID (for DMs) or Group ID (for groups) */
  conversationId: string;
  /** Sender's DID */
  senderDid: string;
  /** Sender's display name */
  senderName: string;
  /** Whether the user started or stopped typing */
  isTyping: boolean;
  /** Unix timestamp */
  timestamp: number;
}

/**
 * Payload for message delivery/read status updates
 */
export interface MessageStatusPayload {
  /** Message ID */
  messageId: string;
  /** Conversation ID */
  conversationId: string;
  /** Status update: 'delivered' or 'read' */
  status: 'delivered' | 'read';
  /** Unix timestamp of the status change */
  timestamp: number;
}

/**
 * A pending group invitation
 */
export interface PendingGroupInvite {
  /** Invite ID */
  id: string;
  /** Group ID */
  groupId: string;
  /** Group name */
  groupName: string;
  /** Group description */
  description?: string;
  /** Inviter's DID */
  inviterDid: string;
  /** Inviter's display name */
  inviterName: string;
  /** Encrypted group key */
  encryptedGroupKey: string;
  /** Nonce */
  nonce: string;
  /** Member list JSON */
  membersJson: string;
  /** Invite status */
  status: string;
  /** When created */
  createdAt: number;
}

/**
 * Group event types
 */
export type GroupEvent =
  | { type: 'inviteReceived'; invite: PendingGroupInvite }
  | { type: 'inviteAccepted'; groupId: string; fromDid: string }
  | { type: 'inviteDeclined'; groupId: string; fromDid: string }
  | { type: 'memberRemoved'; groupId: string; removedDid: string }
  | { type: 'keyRotated'; groupId: string; keyVersion: number }
  | { type: 'groupMessageReceived'; groupId: string; message: Message };

/**
 * Initialization configuration
 */
export interface InitConfig {
  /** Bootstrap nodes to connect to */
  bootstrapNodes?: string[];
  /** Enable verbose logging */
  verboseLogging?: boolean;
  /** Custom storage path */
  storagePath?: string;
  /** DID for IndexedDB persistence (web only). When provided, the database
   *  is restored from IndexedDB on init and auto-saved on every write. */
  did?: string;
}

// =============================================================================
// CORE SERVICE
// =============================================================================

/**
 * Main Umbra Service class
 *
 * Provides a unified API for interacting with Umbra Core across all platforms.
 * Methods delegate to WASM (web) or native (mobile) bindings.
 */
export class UmbraService {
  private static _instance: UmbraService | null = null;
  private static _initialized = false;

  // Event listeners
  private _discoveryListeners: Array<(event: DiscoveryEvent) => void> = [];
  private _friendListeners: Array<(event: FriendEvent) => void> = [];
  private _messageListeners: Array<(event: MessageEvent) => void> = [];
  private _relayListeners: Array<(event: RelayEvent) => void> = [];
  private _groupListeners: Array<(event: GroupEvent) => void> = [];
  private _callListeners: Array<(event: any) => void> = [];
  private _relayWsRef: WebSocket | null = null;

  private constructor() {}

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize Umbra Service
   *
   * Loads the WASM module, initializes sql.js, and sets up the event bridge.
   *
   * @param config - Optional configuration
   * @throws {UmbraError} If already initialized
   */
  static async initialize(config?: InitConfig): Promise<void> {
    if (this._initialized && this._instance) {
      // Already initialized — safe to return (handles HMR re-renders)
      return;
    }

    // Load and initialize the WASM module (includes sql.js + DB schema init)
    // Pass DID for IndexedDB persistence when available
    const wasmModule = await initUmbraWasm(config?.did);

    const instance = new UmbraService();

    // Connect event bridge to dispatch events to our listeners
    eventBridge.connect(wasmModule);
    eventBridge.onAll((event: UmbraEvent) => {
      instance._dispatchEvent(event);
    });

    this._instance = instance;
    this._initialized = true;

    console.log(
      '[UmbraService] Initialized — WASM version:',
      wasmModule.umbra_wasm_version()
    );
  }

  /**
   * Get the service instance
   *
   * @throws {UmbraError} If not initialized
   */
  static get instance(): UmbraService {
    if (!this._initialized || !this._instance) {
      throw new UmbraError(
        ErrorCode.NotInitialized,
        'UmbraService not initialized. Call UmbraService.initialize() first.'
      );
    }
    return this._instance;
  }

  /**
   * Check if the service is initialized
   */
  static get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Shutdown the service
   */
  static async shutdown(): Promise<void> {
    if (this._instance) {
      eventBridge.clear();
      this._instance = null;
      this._initialized = false;
    }
  }

  // ===========================================================================
  // IDENTITY
  // ===========================================================================

  /**
   * Create a new identity
   *
   * Generates a new cryptographic identity with a recovery phrase.
   *
   * ## IMPORTANT
   *
   * The recovery phrase should be displayed to the user ONCE and they
   * should be instructed to write it down. It cannot be recovered later!
   *
   * @param displayName - User's display name
   * @returns Identity and recovery phrase
   */
  async createIdentity(displayName: string): Promise<CreateIdentityResult> {
    const resultJson = wasm().umbra_wasm_identity_create(displayName);
    const result = await parseWasm<{ did: string; recoveryPhrase: string }>(resultJson);

    // Get full profile info after creation
    const profileJson = wasm().umbra_wasm_identity_get_profile();
    const profile = await parseWasm<{
      did: string;
      displayName: string;
      status?: string;
      avatar?: string;
    }>(profileJson);

    return {
      identity: {
        did: result.did,
        displayName: profile.displayName,
        status: profile.status ?? undefined,
        avatar: profile.avatar ?? undefined,
        createdAt: Date.now() / 1000,
      },
      recoveryPhrase: result.recoveryPhrase.split(' '),
    };
  }

  /**
   * Restore identity from recovery phrase
   *
   * @param recoveryPhrase - 24-word recovery phrase
   * @param displayName - Display name for the identity
   * @returns Restored identity
   *
   * @throws {UmbraError} If recovery phrase is invalid
   */
  async restoreIdentity(
    recoveryPhrase: string[],
    displayName: string
  ): Promise<Identity> {
    if (recoveryPhrase.length !== 24) {
      throw new UmbraError(
        ErrorCode.InvalidRecoveryPhrase,
        `Expected 24 words, got ${recoveryPhrase.length}`
      );
    }

    const phrase = recoveryPhrase.join(' ');
    const did = await wasm().umbra_wasm_identity_restore(phrase, displayName);

    return {
      did,
      displayName,
      createdAt: Date.now() / 1000,
    };
  }

  /**
   * Load existing identity from storage
   *
   * @returns Identity if one exists, null otherwise
   */
  async loadIdentity(): Promise<Identity | null> {
    try {
      const did = await wasm().umbra_wasm_identity_get_did();
      if (!did) return null;

      const profileJson = wasm().umbra_wasm_identity_get_profile();
      const profile = await parseWasm<{
        did: string;
        displayName: string;
        status?: string;
        avatar?: string;
      }>(profileJson);

      return {
        did: profile.did,
        displayName: profile.displayName,
        status: profile.status ?? undefined,
        avatar: profile.avatar ?? undefined,
        createdAt: Date.now() / 1000,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get the current identity
   *
   * @throws {UmbraError} If no identity is loaded
   */
  async getIdentity(): Promise<Identity> {
    const identity = await this.loadIdentity();
    if (!identity) {
      throw new UmbraError(
        ErrorCode.NoIdentity,
        'No identity loaded. Create or restore an identity first.'
      );
    }
    return identity;
  }

  /**
   * Update profile information
   *
   * @param update - Profile update
   */
  async updateProfile(update: ProfileUpdate): Promise<void> {
    const json: Record<string, unknown> = {};
    switch (update.type) {
      case 'displayName':
        json.display_name = update.value;
        break;
      case 'status':
        json.status = update.value;
        break;
      case 'avatar':
        json.avatar = update.value;
        break;
    }
    await wasm().umbra_wasm_identity_update_profile(JSON.stringify(json));
  }

  /**
   * Get public identity for sharing
   *
   * Returns the public portion of the identity that can be safely
   * shared with others.
   */
  async getPublicIdentity(): Promise<PublicIdentity> {
    const profileJson = wasm().umbra_wasm_identity_get_profile();
    const profile = await parseWasm<{
      did: string;
      displayName: string;
      status?: string;
      avatar?: string;
    }>(profileJson);

    return {
      did: profile.did,
      displayName: profile.displayName,
      status: profile.status ?? undefined,
      avatar: profile.avatar ?? undefined,
      publicKeys: {
        signing: '', // TODO: expose public keys via WASM
        encryption: '',
      },
      createdAt: Date.now() / 1000,
    };
  }

  // ===========================================================================
  // NETWORK & DISCOVERY
  // ===========================================================================

  /**
   * Start the network service
   *
   * Initializes the libp2p swarm with WebRTC transport.
   * Must be called after identity creation.
   */
  async startNetwork(): Promise<void> {
    console.log('[UmbraService] Starting network...');
    await wasm().umbra_wasm_network_start();
    console.log('[UmbraService] Network started');
  }

  /**
   * Stop the network service
   */
  async stopNetwork(): Promise<void> {
    console.log('[UmbraService] Stopping network...');
    await wasm().umbra_wasm_network_stop();
    console.log('[UmbraService] Network stopped');
  }

  /**
   * Create a WebRTC offer for signaling (step 1 of connection)
   *
   * Returns JSON string with SDP offer and ICE candidates.
   * Share this with the other peer via QR code or connection link.
   */
  async createOffer(): Promise<string> {
    return wasm().umbra_wasm_network_create_offer();
  }

  /**
   * Accept a WebRTC offer and create an answer (step 2 of connection)
   *
   * Takes the offer JSON string from the other peer.
   * Returns JSON string with SDP answer and ICE candidates.
   */
  async acceptOffer(offerJson: string): Promise<string> {
    return wasm().umbra_wasm_network_accept_offer(offerJson);
  }

  /**
   * Complete the WebRTC handshake (step 3 - offerer side)
   *
   * Takes the answer JSON string from the other peer.
   */
  async completeHandshake(answerJson: string): Promise<void> {
    await wasm().umbra_wasm_network_complete_handshake(answerJson);
  }

  /**
   * Complete the answerer side of the WebRTC connection
   *
   * Called after acceptOffer() to finalize the answerer's connection.
   * Pass the offerer's DID or PeerId from the original offer so the
   * swarm knows who the remote peer is.
   */
  async completeAnswerer(offererDid?: string, offererPeerId?: string): Promise<void> {
    await wasm().umbra_wasm_network_complete_answerer(offererDid, offererPeerId);
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    const statusJson = wasm().umbra_wasm_network_status();
    return await parseWasm<NetworkStatus>(statusJson);
  }

  /**
   * Look up a peer by DID
   *
   * @param _did - The peer's DID
   * @returns Discovery result
   */
  async lookupPeer(_did: string): Promise<DiscoveryResult> {
    // DHT lookup not yet available via DummyTransport
    return { status: 'notFound' };
  }

  /**
   * Get our connection info for sharing
   *
   * Returns information that can be encoded in a QR code or link
   * for others to connect to us directly.
   */
  async getConnectionInfo(): Promise<ConnectionInfo> {
    const infoJson = wasm().umbra_wasm_discovery_get_connection_info();
    return await parseWasm<ConnectionInfo>(infoJson);
  }

  /**
   * Parse connection info from a string (link, base64, or JSON)
   */
  async parseConnectionInfo(info: string): Promise<ConnectionInfo> {
    const resultJson = wasm().umbra_wasm_discovery_parse_connection_info(info);
    return await parseWasm<ConnectionInfo>(resultJson);
  }

  /**
   * Connect directly to a peer
   *
   * @param info - Connection info (from QR code or link)
   */
  async connectDirect(info: ConnectionInfo): Promise<void> {
    console.log('[UmbraService] Direct connect requested for:', info.did);
    // TODO: Extract WebRTC offer from connection info and complete handshake
  }

  /**
   * Subscribe to discovery events
   *
   * @param callback - Called when discovery events occur
   * @returns Unsubscribe function
   */
  onDiscoveryEvent(callback: (event: DiscoveryEvent) => void): () => void {
    this._discoveryListeners.push(callback);
    return () => {
      const index = this._discoveryListeners.indexOf(callback);
      if (index !== -1) {
        this._discoveryListeners.splice(index, 1);
      }
    };
  }

  // ===========================================================================
  // FRIENDS
  // ===========================================================================

  /**
   * Send a friend request
   *
   * Creates the request locally and optionally sends it via the relay.
   *
   * @param toDid - Recipient's DID
   * @param message - Optional message to include
   * @param relayWs - Optional WebSocket to send via relay
   * @returns Object containing the request and delivery status
   */
  async sendFriendRequest(
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
  async getIncomingRequests(): Promise<FriendRequest[]> {
    const resultJson = wasm().umbra_wasm_friends_pending_requests('incoming');
    return await parseWasm<FriendRequest[]>(resultJson);
  }

  /**
   * Get outgoing friend requests
   */
  async getOutgoingRequests(): Promise<FriendRequest[]> {
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
   * @returns Result with request_id, status, and relay delivery status
   */
  async acceptFriendRequest(
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
  async rejectFriendRequest(requestId: string): Promise<void> {
    await wasm().umbra_wasm_friends_reject_request(requestId);
  }

  /**
   * Get all friends
   */
  async getFriends(): Promise<Friend[]> {
    const resultJson = wasm().umbra_wasm_friends_list();
    return await parseWasm<Friend[]>(resultJson);
  }

  /**
   * Remove a friend
   *
   * @param did - Friend's DID
   * @returns true if a friend was removed
   */
  async removeFriend(did: string): Promise<boolean> {
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
  async blockUser(did: string, reason?: string): Promise<void> {
    await wasm().umbra_wasm_friends_block(did, reason);
  }

  /**
   * Unblock a user
   *
   * @param did - User's DID to unblock
   * @returns true if a user was unblocked
   */
  async unblockUser(did: string): Promise<boolean> {
    return await wasm().umbra_wasm_friends_unblock(did);
  }

  /**
   * Subscribe to friend events
   *
   * @param callback - Called when friend events occur
   * @returns Unsubscribe function
   */
  onFriendEvent(callback: (event: FriendEvent) => void): () => void {
    this._friendListeners.push(callback);
    return () => {
      const index = this._friendListeners.indexOf(callback);
      if (index !== -1) {
        this._friendListeners.splice(index, 1);
      }
    };
  }

  /**
   * Dispatch a friend event to all registered listeners.
   *
   * Used by the network layer to dispatch events when friend requests
   * or responses are received via the relay.
   *
   * @param event - The friend event to dispatch
   */
  dispatchFriendEvent(event: FriendEvent): void {
    for (const listener of this._friendListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Friend listener error:', err);
      }
    }
  }

  /**
   * Store an incoming friend request received via relay into the WASM database.
   * This must be called before dispatching the friend event so that
   * getIncomingRequests() returns the request when the UI refreshes.
   */
  async storeIncomingRequest(request: FriendRequest): Promise<void> {
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
  async processAcceptedFriendResponse(payload: {
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
  async sendFriendAcceptAck(
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
      },
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
   * Store an incoming chat message received via relay.
   *
   * @param payload - The chat message payload from the relay envelope
   */
  async storeIncomingMessage(payload: ChatMessagePayload): Promise<void> {
    const data: Record<string, unknown> = {
      message_id: payload.messageId,
      conversation_id: payload.conversationId,
      sender_did: payload.senderDid,
      content_encrypted: payload.contentEncrypted,
      nonce: payload.nonce,
      timestamp: payload.timestamp,
    };
    // Include thread_id if this is a thread reply
    if (payload.threadId) {
      data.thread_id = payload.threadId;
    }
    const json = JSON.stringify(data);
    await wasm().umbra_wasm_messaging_store_incoming(json);
  }

  /**
   * Decrypt an incoming message payload.
   *
   * Attempts to decrypt the encrypted content using the shared secret
   * for the conversation. Returns the decrypted plaintext, or a
   * fallback string if decryption fails.
   */
  async decryptIncomingMessage(payload: ChatMessagePayload): Promise<string> {
    try {
      // WASM expects i64 (BigInt) for timestamp
      const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
        payload.conversationId,
        payload.contentEncrypted,
        payload.nonce,
        payload.senderDid,
        BigInt(payload.timestamp)
      );
      return await parseWasm<string>(decryptedJson);
    } catch (err) {
      console.warn('[decryptIncomingMessage] failed:', err);
      return '';
    }
  }

  /**
   * Dispatch a message event to all registered listeners.
   *
   * Used by the network layer to dispatch events when chat messages
   * are received via the relay.
   */
  dispatchMessageEvent(event: MessageEvent): void {
    for (const listener of this._messageListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Message listener error:', err);
      }
    }
  }

  // ===========================================================================
  // MESSAGING
  // ===========================================================================

  /**
   * Get all conversations
   */
  async getConversations(): Promise<Conversation[]> {
    const resultJson = wasm().umbra_wasm_messaging_get_conversations();
    return await parseWasm<Conversation[]>(resultJson);
  }

  /**
   * Create (or get) a DM conversation for a given friend.
   *
   * Uses a deterministic conversation ID derived from both DIDs so that both
   * sides always produce the same ID.  If the conversation already exists this
   * is a no-op.
   *
   * @param friendDid - The friend's DID
   * @returns The conversation ID
   */
  async createDmConversation(friendDid: string): Promise<string> {
    const resultJson = wasm().umbra_wasm_messaging_create_dm_conversation(friendDid);
    const raw = await parseWasm<{ conversation_id: string }>(resultJson);
    return raw.conversation_id;
  }

  /**
   * Send a message
   *
   * Encrypts and stores the message locally, then optionally sends it
   * via relay for delivery to the recipient.
   *
   * @param conversationId - Conversation to send to
   * @param text - Message text
   * @param relayWs - Optional WebSocket to send via relay
   * @returns The sent message
   */
  async sendMessage(
    conversationId: string,
    text: string,
    relayWs?: WebSocket | null
  ): Promise<Message> {
    const resultJson = wasm().umbra_wasm_messaging_send(conversationId, text);
    const raw = await parseWasm<{
      id: string;
      conversationId: string;
      senderDid: string;
      timestamp: number;
      delivered: boolean;
      read: boolean;
      contentEncrypted?: string;
      nonce?: string;
      friendDid?: string;
    }>(resultJson);

    // Send via relay for offline/non-P2P delivery
    if (
      relayWs &&
      relayWs.readyState === WebSocket.OPEN &&
      raw.contentEncrypted &&
      raw.nonce &&
      raw.friendDid
    ) {
      try {
        const envelope: RelayEnvelope = {
          envelope: 'chat_message',
          version: 1,
          payload: {
            messageId: raw.id,
            conversationId: raw.conversationId,
            senderDid: raw.senderDid,
            contentEncrypted: raw.contentEncrypted,
            nonce: raw.nonce,
            timestamp: raw.timestamp,
          },
        };

        const relayMessage = JSON.stringify({
          type: 'send',
          to_did: raw.friendDid,
          payload: JSON.stringify(envelope),
        });

        relayWs.send(relayMessage);
        console.log('[UmbraService] Message sent via relay to', raw.friendDid);
      } catch (err) {
        console.warn('[UmbraService] Failed to send message via relay:', err);
      }
    }

    // Return with 'sending' status initially. The relay will send back an
    // ack message confirming receipt, at which point the status transitions
    // to 'sent'. If the relay send failed, status stays 'sending' in the UI
    // (a visual indicator that delivery is uncertain).
    const relaySent = relayWs && relayWs.readyState === WebSocket.OPEN && raw.contentEncrypted;

    return {
      id: raw.id,
      conversationId: raw.conversationId,
      senderDid: raw.senderDid,
      content: { type: 'text', text },
      timestamp: raw.timestamp,
      read: raw.read,
      delivered: raw.delivered,
      status: relaySent ? 'sending' : 'sent',
    };
  }

  /**
   * Get messages in a conversation
   *
   * @param conversationId - Conversation ID
   * @param options - Pagination options
   */
  async getMessages(
    conversationId: string,
    options?: { offset?: number; limit?: number }
  ): Promise<Message[]> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const resultJson = wasm().umbra_wasm_messaging_get_messages(
      conversationId,
      limit,
      offset
    );

    const raw = await parseWasm<Array<{
      id: string;
      conversationId: string;
      senderDid: string;
      contentEncrypted: string;
      nonce: string;
      timestamp: number;
      delivered: boolean;
      read: boolean;
      threadReplyCount?: number;
    }>>(resultJson);

    return await Promise.all(raw.map(async (m) => {
      let text = '';
      try {
        // DB stores ciphertext as hex, but the WASM decrypt function expects base64.
        // Convert hex → bytes → base64 before calling decrypt.
        let contentForDecrypt = m.contentEncrypted;
        if (/^[0-9a-fA-F]+$/.test(contentForDecrypt) && contentForDecrypt.length > 0) {
          const hexPairs = contentForDecrypt.match(/.{2}/g) || [];
          const hexBytes = new Uint8Array(hexPairs.map((b: string) => parseInt(b, 16)));
          // Use chunked approach to avoid max call stack with spread on large arrays
          let binary = '';
          for (let i = 0; i < hexBytes.length; i++) {
            binary += String.fromCharCode(hexBytes[i]);
          }
          contentForDecrypt = btoa(binary);
        }

        // WASM expects i64 (BigInt) for timestamp, but DB returns JS number
        const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
          m.conversationId,
          contentForDecrypt,
          m.nonce,
          m.senderDid,
          BigInt(m.timestamp)
        );
        text = await parseWasm<string>(decryptedJson);
      } catch (err) {
        // Fallback: show raw if decrypt fails (e.g. own messages stored as plaintext)
        console.warn('[getMessages] decrypt failed for msg', m.id, err);
        text = m.contentEncrypted;
      }
      return {
        id: m.id,
        conversationId: m.conversationId,
        senderDid: m.senderDid,
        content: { type: 'text' as const, text },
        timestamp: m.timestamp,
        read: m.read,
        delivered: m.delivered,
        status: m.read ? ('read' as const) : m.delivered ? ('delivered' as const) : ('sent' as const),
        threadReplyCount: m.threadReplyCount ?? 0,
      };
    }));
  }

  /**
   * Mark messages as read
   *
   * @param conversationId - Conversation ID
   * @returns Number of messages marked as read
   */
  async markAsRead(conversationId: string): Promise<number> {
    return await wasm().umbra_wasm_messaging_mark_read(conversationId);
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newText: string): Promise<Message> {
    const json = JSON.stringify({ message_id: messageId, new_text: newText });
    const resultJson = wasm().umbra_wasm_messaging_edit(json);
    return await parseWasm<Message>(resultJson);
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    const json = JSON.stringify({ message_id: messageId });
    wasm().umbra_wasm_messaging_delete(json);
  }

  /**
   * Pin a message
   */
  async pinMessage(messageId: string): Promise<Message> {
    const json = JSON.stringify({ message_id: messageId });
    const resultJson = wasm().umbra_wasm_messaging_pin(json);
    return await parseWasm<Message>(resultJson);
  }

  /**
   * Unpin a message
   */
  async unpinMessage(messageId: string): Promise<void> {
    const json = JSON.stringify({ message_id: messageId });
    wasm().umbra_wasm_messaging_unpin(json);
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(messageId: string, emoji: string): Promise<MessageReaction[]> {
    const json = JSON.stringify({ message_id: messageId, emoji });
    const resultJson = wasm().umbra_wasm_messaging_add_reaction(json);
    const result = await parseWasm<{ reactions: MessageReaction[] }>(resultJson);
    return result.reactions;
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(messageId: string, emoji: string): Promise<MessageReaction[]> {
    const json = JSON.stringify({ message_id: messageId, emoji });
    const resultJson = wasm().umbra_wasm_messaging_remove_reaction(json);
    const result = await parseWasm<{ reactions: MessageReaction[] }>(resultJson);
    return result.reactions;
  }

  /**
   * Forward a message to another conversation
   */
  async forwardMessage(messageId: string, targetConversationId: string): Promise<Message> {
    const json = JSON.stringify({ message_id: messageId, target_conversation_id: targetConversationId });
    const resultJson = wasm().umbra_wasm_messaging_forward(json);
    return await parseWasm<Message>(resultJson);
  }

  /**
   * Get thread replies for a message
   */
  async getThreadReplies(parentId: string): Promise<Message[]> {
    const json = JSON.stringify({ parent_id: parentId });
    const resultJson = wasm().umbra_wasm_messaging_get_thread(json);
    const raw = await parseWasm<Array<any>>(resultJson);
    return await Promise.all(raw.map(async (m) => {
      let text = '';
      try {
        let contentForDecrypt = m.contentEncrypted || '';
        if (/^[0-9a-fA-F]+$/.test(contentForDecrypt) && contentForDecrypt.length > 0) {
          const hexPairs = contentForDecrypt.match(/.{2}/g) || [];
          const hexBytes = new Uint8Array(hexPairs.map((b: string) => parseInt(b, 16)));
          let binary = '';
          for (let i = 0; i < hexBytes.length; i++) binary += String.fromCharCode(hexBytes[i]);
          contentForDecrypt = btoa(binary);
        }
        const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
          m.conversationId,
          contentForDecrypt,
          m.nonce || '',
          m.senderDid,
          BigInt(m.timestamp)
        );
        text = await parseWasm<string>(decryptedJson);
      } catch {
        text = m.contentEncrypted || '';
      }
      return {
        id: m.id,
        conversationId: m.conversationId,
        senderDid: m.senderDid,
        content: { type: 'text' as const, text },
        timestamp: m.timestamp,
        read: m.read ?? false,
        delivered: m.delivered ?? false,
        status: 'sent' as const,
        threadId: m.threadId,
      };
    }));
  }

  /**
   * Send a reply in a thread
   */
  async sendThreadReply(
    parentId: string,
    text: string,
    relayWs?: WebSocket | null
  ): Promise<Message> {
    const json = JSON.stringify({ parent_id: parentId, text });
    const resultJson = wasm().umbra_wasm_messaging_reply_thread(json);
    const raw = await parseWasm<{
      id: string;
      conversationId: string;
      senderDid: string;
      friendDid?: string;
      timestamp: number;
      threadId?: string;
      contentEncrypted?: string;
      nonce?: string;
    }>(resultJson);

    // Send via relay for offline/non-P2P delivery
    if (
      relayWs &&
      relayWs.readyState === WebSocket.OPEN &&
      raw.contentEncrypted &&
      raw.nonce &&
      raw.friendDid
    ) {
      try {
        const envelope: RelayEnvelope = {
          envelope: 'chat_message',
          version: 1,
          payload: {
            messageId: raw.id,
            conversationId: raw.conversationId,
            senderDid: raw.senderDid,
            contentEncrypted: raw.contentEncrypted,
            nonce: raw.nonce,
            timestamp: raw.timestamp,
            threadId: parentId,
          },
        };

        const relayMessage = JSON.stringify({
          type: 'send',
          to_did: raw.friendDid,
          payload: JSON.stringify(envelope),
        });

        relayWs.send(relayMessage);
        console.log('[UmbraService] Thread reply sent via relay to', raw.friendDid);
      } catch (err) {
        console.warn('[UmbraService] Failed to send thread reply via relay:', err);
      }
    }

    const relaySent = relayWs && relayWs.readyState === WebSocket.OPEN && raw.contentEncrypted;

    return {
      id: raw.id,
      conversationId: raw.conversationId,
      senderDid: raw.senderDid,
      content: { type: 'text', text },
      timestamp: raw.timestamp,
      read: false,
      delivered: false,
      status: relaySent ? 'sending' : 'sent',
      threadId: parentId,
    };
  }

  /**
   * Get pinned messages in a conversation
   */
  async getPinnedMessages(conversationId: string): Promise<Message[]> {
    const json = JSON.stringify({ conversation_id: conversationId });
    const resultJson = wasm().umbra_wasm_messaging_get_pinned(json);
    const raw = await parseWasm<Array<any>>(resultJson);
    return await Promise.all(raw.map(async (m) => {
      let text = '';
      try {
        let contentForDecrypt = m.contentEncrypted || '';
        if (/^[0-9a-fA-F]+$/.test(contentForDecrypt) && contentForDecrypt.length > 0) {
          const hexPairs = contentForDecrypt.match(/.{2}/g) || [];
          const hexBytes = new Uint8Array(hexPairs.map((b: string) => parseInt(b, 16)));
          let binary = '';
          for (let i = 0; i < hexBytes.length; i++) binary += String.fromCharCode(hexBytes[i]);
          contentForDecrypt = btoa(binary);
        }
        const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
          m.conversationId,
          contentForDecrypt,
          m.nonce || '',
          m.senderDid,
          BigInt(m.timestamp)
        );
        text = await parseWasm<string>(decryptedJson);
      } catch {
        text = m.contentEncrypted || '';
      }
      return {
        id: m.id,
        conversationId: m.conversationId,
        senderDid: m.senderDid,
        content: { type: 'text' as const, text },
        timestamp: m.timestamp,
        read: m.read ?? false,
        delivered: m.delivered ?? false,
        status: 'sent' as const,
        pinned: true,
        pinnedBy: m.pinnedBy,
        pinnedAt: m.pinnedAt,
      };
    }));
  }

  /**
   * Send typing indicator to a specific user via relay.
   *
   * @param conversationId - Conversation ID
   * @param recipientDid - DID of the recipient to notify
   * @param senderDid - Our DID
   * @param senderName - Our display name
   * @param isTyping - Whether we started or stopped typing
   * @param relayWs - WebSocket for relay delivery
   */
  async sendTypingIndicator(
    conversationId: string,
    recipientDid: string,
    senderDid: string,
    senderName: string,
    isTyping: boolean,
    relayWs?: WebSocket | null
  ): Promise<void> {
    if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;

    const envelope: RelayEnvelope = {
      envelope: 'typing_indicator',
      version: 1,
      payload: {
        conversationId,
        senderDid,
        senderName,
        isTyping,
        timestamp: Date.now(),
      },
    };

    const relayMessage = JSON.stringify({
      type: 'send',
      to_did: recipientDid,
      payload: JSON.stringify(envelope),
    });

    relayWs.send(relayMessage);
  }

  /**
   * Subscribe to message events
   *
   * @param callback - Called when message events occur
   * @returns Unsubscribe function
   */
  onMessageEvent(callback: (event: MessageEvent) => void): () => void {
    this._messageListeners.push(callback);
    return () => {
      const index = this._messageListeners.indexOf(callback);
      if (index !== -1) {
        this._messageListeners.splice(index, 1);
      }
    };
  }

  // ===========================================================================
  // CALLING
  // ===========================================================================

  /**
   * Subscribe to call events (offers, answers, ICE candidates, end signals).
   */
  onCallEvent(callback: (event: any) => void): () => void {
    this._callListeners.push(callback);
    return () => {
      const index = this._callListeners.indexOf(callback);
      if (index !== -1) {
        this._callListeners.splice(index, 1);
      }
    };
  }

  /**
   * Dispatch a call event to all registered listeners.
   */
  dispatchCallEvent(event: any): void {
    for (const listener of this._callListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Call listener error:', err);
      }
    }
  }

  /**
   * Store a reference to the relay WebSocket for call signaling.
   */
  setRelayWs(ws: WebSocket | null): void {
    this._relayWsRef = ws;
  }

  /**
   * Send a call signaling message via the relay WebSocket.
   */
  sendCallSignal(toDid: string, relayMessage: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(relayMessage);
    } else {
      console.warn('[UmbraService] Cannot send call signal: relay not connected');
    }
  }

  /**
   * Create a call room on the relay for group calling.
   */
  createCallRoom(groupId: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'create_call_room', group_id: groupId }));
    } else {
      console.warn('[UmbraService] Cannot create call room: relay not connected');
    }
  }

  /**
   * Join an existing call room on the relay.
   */
  joinCallRoom(roomId: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'join_call_room', room_id: roomId }));
    } else {
      console.warn('[UmbraService] Cannot join call room: relay not connected');
    }
  }

  /**
   * Leave a call room on the relay.
   */
  leaveCallRoom(roomId: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'leave_call_room', room_id: roomId }));
    } else {
      console.warn('[UmbraService] Cannot leave call room: relay not connected');
    }
  }

  /**
   * Send a call signaling payload to a specific peer in a call room.
   */
  sendCallRoomSignal(roomId: string, toDid: string, payload: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'call_signal', room_id: roomId, to_did: toDid, payload }));
    } else {
      console.warn('[UmbraService] Cannot send call room signal: relay not connected');
    }
  }

  /**
   * Store a new call record
   */
  async storeCallRecord(id: string, conversationId: string, callType: string, direction: string, participants: string[]): Promise<{ id: string; startedAt: number }> {
    const json = JSON.stringify({ id, conversation_id: conversationId, call_type: callType, direction, participants: JSON.stringify(participants) });
    const resultJson = wasm().umbra_wasm_calls_store(json);
    return await parseWasm<{ id: string; startedAt: number }>(resultJson);
  }

  /**
   * End a call record
   */
  async endCallRecord(callId: string, status: string): Promise<{ id: string; endedAt: number; durationMs: number }> {
    const json = JSON.stringify({ id: callId, status });
    const resultJson = wasm().umbra_wasm_calls_end(json);
    return await parseWasm<{ id: string; endedAt: number; durationMs: number }>(resultJson);
  }

  /**
   * Get call history for a conversation
   */
  async getCallHistory(conversationId: string, limit = 50, offset = 0): Promise<any[]> {
    const json = JSON.stringify({ conversation_id: conversationId, limit, offset });
    const resultJson = wasm().umbra_wasm_calls_get_history(json);
    return await parseWasm<any[]>(resultJson);
  }

  /**
   * Get all call history
   */
  async getAllCallHistory(limit = 50, offset = 0): Promise<any[]> {
    const json = JSON.stringify({ limit, offset });
    const resultJson = wasm().umbra_wasm_calls_get_all_history(json);
    return await parseWasm<any[]>(resultJson);
  }

  // ===========================================================================
  // GROUPS
  // ===========================================================================

  /**
   * Create a new group
   */
  async createGroup(name: string, description?: string): Promise<{ groupId: string; conversationId: string }> {
    const json = JSON.stringify({ name, description });
    const resultJson = wasm().umbra_wasm_groups_create(json);
    return await parseWasm<{ groupId: string; conversationId: string }>(resultJson);
  }

  /**
   * Get group info by ID
   */
  async getGroup(groupId: string): Promise<Group> {
    const resultJson = wasm().umbra_wasm_groups_get(groupId);
    return await parseWasm<Group>(resultJson);
  }

  /**
   * List all groups
   */
  async getGroups(): Promise<Group[]> {
    const resultJson = wasm().umbra_wasm_groups_list();
    return await parseWasm<Group[]>(resultJson);
  }

  /**
   * Update a group
   */
  async updateGroup(groupId: string, name: string, description?: string): Promise<void> {
    const json = JSON.stringify({ group_id: groupId, name, description });
    wasm().umbra_wasm_groups_update(json);
  }

  /**
   * Delete a group (admin only)
   */
  async deleteGroup(groupId: string): Promise<void> {
    wasm().umbra_wasm_groups_delete(groupId);
  }

  /**
   * Add a member to a group
   */
  async addGroupMember(groupId: string, did: string, displayName?: string): Promise<void> {
    const json = JSON.stringify({ group_id: groupId, did, display_name: displayName });
    wasm().umbra_wasm_groups_add_member(json);
  }

  /**
   * Remove a member from a group
   */
  async removeGroupMember(groupId: string, did: string): Promise<void> {
    const json = JSON.stringify({ group_id: groupId, did });
    wasm().umbra_wasm_groups_remove_member(json);
  }

  /**
   * Get all members of a group
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const resultJson = wasm().umbra_wasm_groups_get_members(groupId);
    return await parseWasm<GroupMember[]>(resultJson);
  }

  // ===========================================================================
  // GROUP ENCRYPTION
  // ===========================================================================

  /**
   * Generate a shared encryption key for a group.
   *
   * Creates a random AES-256 key, encrypts it with the creator's
   * key-wrapping key, and stores it as version 1.
   *
   * @param groupId - Group ID
   * @returns Key metadata including version
   */
  async generateGroupKey(groupId: string): Promise<{ groupId: string; keyVersion: number }> {
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
  async rotateGroupKey(groupId: string): Promise<{ groupId: string; keyVersion: number }> {
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
  async importGroupKey(
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
  async encryptGroupKeyForMember(
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
  async encryptGroupMessage(
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
  async decryptGroupMessage(
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

  // ===========================================================================
  // GROUP INVITATIONS
  // ===========================================================================

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
  async sendGroupInvite(
    groupId: string,
    memberDid: string,
    relayWs?: WebSocket | null
  ): Promise<void> {
    // Get group info
    const group = await this.getGroup(groupId);

    // Get current key version and encrypt key for the invitee
    const keyInfo = await this.encryptGroupKeyForMember(groupId, memberDid, 0); // 0 = latest

    // Get our profile
    const profileJson = wasm().umbra_wasm_identity_get_profile();
    const profile = await parseWasm<{ did: string; displayName: string }>(profileJson);

    // Get group members for the invite payload
    const members = await this.getGroupMembers(groupId);
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
  async storeGroupInvite(payload: GroupInvitePayload): Promise<void> {
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
  async getPendingGroupInvites(): Promise<PendingGroupInvite[]> {
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
  async acceptGroupInvite(
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
        const invites = await this.getPendingGroupInvites();
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
  async declineGroupInvite(
    inviteId: string,
    relayWs?: WebSocket | null
  ): Promise<void> {
    // Get invite info before declining (for relay notification)
    const invites = await this.getPendingGroupInvites();
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
  async sendGroupMessage(
    groupId: string,
    conversationId: string,
    text: string,
    relayWs?: WebSocket | null
  ): Promise<Message> {
    // Encrypt with group key
    const encrypted = await this.encryptGroupMessage(groupId, text);

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
      const members = await this.getGroupMembers(groupId);

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
  async removeGroupMemberWithRotation(
    groupId: string,
    memberDid: string,
    relayWs?: WebSocket | null
  ): Promise<void> {
    // Remove member locally
    await this.removeGroupMember(groupId, memberDid);

    // Rotate key
    const newKeyInfo = await this.rotateGroupKey(groupId);

    const profileJson = wasm().umbra_wasm_identity_get_profile();
    const profile = await parseWasm<{ did: string }>(profileJson);

    if (relayWs && relayWs.readyState === WebSocket.OPEN) {
      // Get remaining members
      const members = await this.getGroupMembers(groupId);

      // Distribute new key to each remaining member
      for (const member of members) {
        if (member.memberDid === profile.did) continue;

        try {
          // Encrypt the new key for this specific member
          const keyForMember = await this.encryptGroupKeyForMember(
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
   * Subscribe to group events
   *
   * @param callback - Called when group events occur
   * @returns Unsubscribe function
   */
  onGroupEvent(callback: (event: GroupEvent) => void): () => void {
    this._groupListeners.push(callback);
    return () => {
      const index = this._groupListeners.indexOf(callback);
      if (index !== -1) {
        this._groupListeners.splice(index, 1);
      }
    };
  }

  /**
   * Dispatch a group event to all registered listeners.
   */
  dispatchGroupEvent(event: GroupEvent): void {
    for (const listener of this._groupListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Group listener error:', err);
      }
    }
  }

  // ===========================================================================
  // MESSAGE DELIVERY STATUS
  // ===========================================================================

  /**
   * Update message delivery status.
   *
   * @param messageId - Message ID
   * @param status - 'sent', 'delivered', or 'read'
   */
  async updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
    const json = JSON.stringify({
      message_id: messageId,
      status,
    });
    wasm().umbra_wasm_messaging_update_status(json);
  }

  /**
   * Send a delivery receipt to the message sender via relay.
   *
   * Called when we receive a message (status: 'delivered') or when
   * the user views the conversation (status: 'read').
   *
   * @param messageId - Message ID
   * @param conversationId - Conversation ID
   * @param senderDid - DID of the original message sender
   * @param status - 'delivered' or 'read'
   * @param relayWs - WebSocket for relay delivery
   */
  async sendDeliveryReceipt(
    messageId: string,
    conversationId: string,
    senderDid: string,
    status: 'delivered' | 'read',
    relayWs?: WebSocket | null
  ): Promise<void> {
    if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;

    const envelope: RelayEnvelope = {
      envelope: 'message_status',
      version: 1,
      payload: {
        messageId,
        conversationId,
        status,
        timestamp: Date.now(),
      },
    };

    const relayMessage = JSON.stringify({
      type: 'send',
      to_did: senderDid,
      payload: JSON.stringify(envelope),
    });

    relayWs.send(relayMessage);
  }

  // ===========================================================================
  // CRYPTO
  // ===========================================================================

  /**
   * Sign data with the current identity's key
   *
   * @param data - Data to sign
   * @returns 64-byte Ed25519 signature
   */
  async sign(data: Uint8Array): Promise<Uint8Array> {
    return await wasm().umbra_wasm_crypto_sign(data);
  }

  /**
   * Verify a signature
   *
   * @param publicKeyHex - Ed25519 public key (hex)
   * @param data - Original data
   * @param signature - 64-byte signature
   * @returns true if valid
   */
  async verify(
    publicKeyHex: string,
    data: Uint8Array,
    signature: Uint8Array
  ): Promise<boolean> {
    return await wasm().umbra_wasm_crypto_verify(publicKeyHex, data, signature);
  }

  // ===========================================================================
  // RELAY
  // ===========================================================================

  /**
   * Connect to a relay server
   *
   * Returns connection info for the JS layer to establish the WebSocket.
   * The actual WebSocket is managed by the useNetwork hook.
   *
   * @param relayUrl - WebSocket URL of the relay server (e.g., "wss://relay.umbra.app/ws")
   * @returns Connection info including the register message to send
   */
  async connectRelay(relayUrl: string): Promise<RelayStatus & { registerMessage: string }> {
    const resultJson = await wasm().umbra_wasm_relay_connect(relayUrl);
    return await parseWasm<RelayStatus & { registerMessage: string }>(resultJson);
  }

  /**
   * Disconnect from the relay server
   */
  async disconnectRelay(): Promise<void> {
    await wasm().umbra_wasm_relay_disconnect();
  }

  /**
   * Create a signaling session for single-scan friend adding
   *
   * Generates an SDP offer, returns the data needed to:
   * 1. Send a create_session message to the relay via WebSocket
   * 2. Generate a QR code/link with the session ID
   *
   * @param relayUrl - Relay server URL
   * @returns Session data including the offer and relay message
   */
  async createOfferSession(relayUrl: string): Promise<RelaySession> {
    const resultJson = await wasm().umbra_wasm_relay_create_session(relayUrl);
    const raw = await parseWasm<{
      relayUrl: string;
      did: string;
      peerId: string;
      offerPayload: string;
      createSessionMessage: string;
    }>(resultJson);

    return {
      ...raw,
      sessionId: '', // Set by the relay response
      link: '', // Set after session creation
    };
  }

  /**
   * Accept/join a relay session (the "scanner" side)
   *
   * Takes the session ID and offer payload from the relay,
   * generates an SDP answer, and returns the data to send back.
   *
   * @param sessionId - Session ID from the scanned QR code/link
   * @param offerPayload - The SDP offer payload from the session
   * @returns Answer data including the relay message to send back
   */
  async acceptSession(sessionId: string, offerPayload: string): Promise<RelayAcceptResult> {
    const resultJson = await wasm().umbra_wasm_relay_accept_session(sessionId, offerPayload);
    return await parseWasm<RelayAcceptResult>(resultJson);
  }

  /**
   * Send a message through the relay (for offline delivery)
   *
   * @param toDid - Recipient's DID
   * @param payload - Encrypted message payload
   * @returns Relay message to send via WebSocket
   */
  async relaySend(toDid: string, payload: string): Promise<{ relayMessage: string }> {
    const resultJson = await wasm().umbra_wasm_relay_send(toDid, payload);
    return await parseWasm<{ relayMessage: string }>(resultJson);
  }

  /**
   * Fetch offline messages from the relay
   *
   * @returns The fetch_offline message to send via WebSocket
   */
  async relayFetchOffline(): Promise<string> {
    return wasm().umbra_wasm_relay_fetch_offline();
  }

  /**
   * Subscribe to relay events
   *
   * @param callback - Called when relay events occur
   * @returns Unsubscribe function
   */
  onRelayEvent(callback: (event: RelayEvent) => void): () => void {
    this._relayListeners.push(callback);
    return () => {
      const index = this._relayListeners.indexOf(callback);
      if (index !== -1) {
        this._relayListeners.splice(index, 1);
      }
    };
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Get WASM module version
   */
  static getVersion(): string {
    if (!isWasmReady()) return 'not loaded';
    return getWasm()!.umbra_wasm_version();
  }

  /**
   * Validate a recovery phrase
   *
   * Checks if the phrase has valid words and checksum.
   *
   * @param phrase - Recovery phrase (space-separated or array)
   * @returns True if valid
   */
  static validateRecoveryPhrase(phrase: string | string[]): boolean {
    const words = Array.isArray(phrase) ? phrase : phrase.split(' ');
    if (words.length !== 24) {
      return false;
    }
    // TODO: call WASM validation when available
    return true;
  }

  /**
   * Get word suggestions for recovery phrase input
   *
   * @param _prefix - Partial word typed by user
   * @returns Matching BIP39 words
   */
  static suggestRecoveryWords(_prefix: string): string[] {
    // TODO: call WASM suggestion when available
    return [];
  }

  // ===========================================================================
  // INTERNAL: Event Dispatch
  // ===========================================================================

  /**
   * Dispatch a WASM event to registered listeners.
   *
   * Called by the event bridge when Rust emits an event.
   */
  private _dispatchEvent(event: UmbraEvent): void {
    const { domain, data } = event;
    const camelData = snakeToCamel(data) as Record<string, unknown>;

    switch (domain) {
      case 'message': {
        // Transform message events from WASM: the Rust side sends `content`
        // as a plain string, but the TypeScript Message type expects
        // `content: { type: 'text', text: string }`.
        const msgData = camelData as Record<string, unknown>;
        if (
          (msgData.type === 'messageSent' || msgData.type === 'messageReceived') &&
          msgData.message &&
          typeof msgData.message === 'object'
        ) {
          const msg = msgData.message as Record<string, unknown>;
          if (typeof msg.content === 'string') {
            msg.content = { type: 'text', text: msg.content };
          } else if (!msg.content) {
            msg.content = { type: 'text', text: '' };
          }
          // Ensure required fields
          if (msg.status === undefined) {
            msg.status = msgData.type === 'messageSent' ? 'sent' : 'delivered';
          }
        }

        for (const listener of this._messageListeners) {
          try {
            listener(camelData as unknown as MessageEvent);
          } catch (err) {
            console.error('[UmbraService] Message listener error:', err);
          }
        }
        break;
      }

      case 'friend':
        for (const listener of this._friendListeners) {
          try {
            listener(camelData as unknown as FriendEvent);
          } catch (err) {
            console.error('[UmbraService] Friend listener error:', err);
          }
        }
        break;

      case 'discovery':
      case 'network':
        for (const listener of this._discoveryListeners) {
          try {
            listener(camelData as unknown as DiscoveryEvent);
          } catch (err) {
            console.error('[UmbraService] Discovery listener error:', err);
          }
        }
        break;

      case 'relay':
        for (const listener of this._relayListeners) {
          try {
            listener(camelData as unknown as RelayEvent);
          } catch (err) {
            console.error('[UmbraService] Relay listener error:', err);
          }
        }
        break;

      case 'group':
        for (const listener of this._groupListeners) {
          try {
            listener(camelData as unknown as GroupEvent);
          } catch (err) {
            console.error('[UmbraService] Group listener error:', err);
          }
        }
        break;
    }
  }
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export default UmbraService;
