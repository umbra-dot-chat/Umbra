/**
 * Umbra Core TypeScript Type Definitions
 *
 * These types represent the data structures returned by the FFI API.
 * Use these as a reference when building frontend applications.
 */

// ============================================================================
// IDENTITY
// ============================================================================

export interface Identity {
  did: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
}

export interface IdentityCreationResult {
  did: string;
  recoveryPhrase: string;  // 24 words, space-separated
}

export interface ProfileUpdate {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
}

// ============================================================================
// FRIENDS
// ============================================================================

export interface Friend {
  did: string;
  displayName: string;
  nickname?: string;
  addedAt: number;  // Unix timestamp (seconds)
}

export interface FriendRequest {
  id: string;
  fromDid: string;
  toDid: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: number;
}

export interface SendFriendRequestResult {
  id: string;
  toDid: string;
  status: string;
}

// ============================================================================
// MESSAGING
// ============================================================================

export interface Conversation {
  id: string;
  participantDid: string;
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderDid: string;
  contentType: 'text' | 'image' | 'file' | 'read_receipt' | 'delivery_receipt';
  content: string;  // Decrypted content
  timestamp: number;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface SendMessageResult {
  id: string;
  conversationId: string;
  timestamp: number;
}

// ============================================================================
// NETWORK
// ============================================================================

export interface NetworkStatus {
  isRunning: boolean;
  peerId: string;
  listenAddresses: string[];
  connectedPeers: number;
}

export interface NetworkConfig {
  listenAddrs?: string[];
  bootstrapPeers?: string[];
  enableDht?: boolean;
  enableRelay?: boolean;
}

// ============================================================================
// DISCOVERY
// ============================================================================

export interface ConnectionInfo {
  link: string;      // umbra://connect/... URL
  json: string;      // JSON representation
  base64: string;    // Base64 for QR codes
  did: string;
  peerId: string;
  addresses: string[];
  displayName: string;
}

export interface DiscoveredPeer {
  did: string;
  peerId: string;
  addresses: string[];
  displayName?: string;
}

// ============================================================================
// EVENTS
// ============================================================================

export type NetworkEventType =
  | 'listening'
  | 'peer_connected'
  | 'peer_disconnected'
  | 'connection_failed'
  | 'message_received'
  | 'message_delivered'
  | 'message_failed'
  | 'peer_identified'
  | 'dht_updated'
  | 'peer_discovered';

export interface NetworkEvent {
  type: NetworkEventType;
  peerId?: string;
  addresses?: string[];
  message?: Uint8Array;
  error?: string;
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export interface UmbraError {
  code: number;
  message: string;
  recoverable: boolean;
}

/**
 * Error code ranges:
 * - 100-199: Core lifecycle
 * - 200-299: Identity
 * - 300-399: Crypto
 * - 400-499: Storage
 * - 500-599: Network
 * - 600-699: Friends
 * - 700-799: Messages
 * - 900-999: Internal
 */

// ============================================================================
// API INTERFACE (for reference)
// ============================================================================

/**
 * These are the FFI functions available. Implementation varies by platform:
 * - iOS: C FFI functions (umbra_*)
 * - Android: JNI methods (UmbraCore.native*)
 * - Web: WASM exports (umbra_wasm_*)
 */
export interface UmbraCoreAPI {
  // Initialization
  init(storagePath?: string): void;
  shutdown(): void;
  version(): string;

  // Identity
  identityCreate(displayName: string): IdentityCreationResult;
  identityRestore(recoveryPhrase: string, displayName: string): string;
  identityGetDid(): string | null;
  identityGetProfile(): Identity | null;
  identityUpdateProfile(update: ProfileUpdate): void;

  // Network
  networkStart(config?: NetworkConfig): string;  // Returns peer ID
  networkStop(): void;
  networkStatus(): NetworkStatus;
  networkConnect(multiaddr: string): void;

  // Discovery
  discoveryGetConnectionInfo(): ConnectionInfo;
  discoveryConnectWithInfo(info: string): string;  // Returns peer ID
  discoveryLookupPeer(did: string): DiscoveredPeer | null;

  // Friends
  friendsSendRequest(did: string, message?: string): SendFriendRequestResult;
  friendsAcceptRequest(requestId: string): Friend;
  friendsRejectRequest(requestId: string): void;
  friendsList(): Friend[];
  friendsPendingRequests(): FriendRequest[];

  // Messaging
  messagingSendText(recipientDid: string, text: string): SendMessageResult;
  messagingGetConversations(): Conversation[];
  messagingGetMessages(conversationId: string, limit?: number, beforeId?: string): Message[];
}
