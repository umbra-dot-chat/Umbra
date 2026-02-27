/**
 * TypeScript type definitions for Umbra Service
 *
 * @packageDocumentation
 */

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
  /** Sender's avatar (base64 image data or URL) */
  fromAvatar?: string;
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
export type MessageContent =
  | { type: 'text'; text: string }
  | {
      type: 'file';
      fileId: string;
      filename: string;
      size: number;
      mimeType: string;
      /** JSON-encoded P2P chunk references for retrieval */
      storageChunksJson: string;
      /** Optional thumbnail data URI for images/videos */
      thumbnail?: string;
    }
  | {
      type: 'shared_folder';
      folderId: string;
      folderName: string;
      /** How many files are in the folder at time of sharing */
      fileCount?: number;
    };

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
 * A blocked user
 */
export interface BlockedUser {
  /** Blocked user's DID */
  did: string;
  /** When they were blocked (unix timestamp) */
  blockedAt: number;
  /** Optional reason for blocking */
  reason?: string;
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
  | { type: 'typingStarted'; conversationId: string; did: string; senderName?: string }
  | { type: 'typingStopped'; conversationId: string; did: string; senderName?: string }
  // DM file sharing events
  | { type: 'fileShared'; conversationId: string; message: Message }
  | { type: 'sharedFolderCreated'; conversationId: string; folder: DmSharedFolderRecord }
  | { type: 'sharedFolderDeleted'; conversationId: string; folderId: string }
  | { type: 'sharedFileUploaded'; conversationId: string; file: DmSharedFileRecord }
  | { type: 'sharedFileDeleted'; conversationId: string; fileId: string };

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
  | { envelope: 'call_state'; version: 1; payload: any }
  | { envelope: 'community_event'; version: 1; payload: CommunityEventPayload }
  | { envelope: 'dm_file_event'; version: 1; payload: DmFileEventPayload }
  | { envelope: 'account_metadata'; version: 1; payload: AccountMetadataPayload }
  | { envelope: 'presence_online'; version: 1; payload: { timestamp: number } }
  | { envelope: 'presence_ack'; version: 1; payload: { timestamp: number } };

/**
 * Payload for account metadata sync across sessions.
 * Sent to own DID via relay so other sessions receive the update.
 */
export interface AccountMetadataPayload {
  /** Sender's DID (always own DID — self-to-self sync) */
  senderDid: string;
  /** The metadata key being synced (e.g. 'message_display_mode') */
  key: string;
  /** The metadata value (plain string — encrypted at relay transport level) */
  value: string;
  /** Unix timestamp when the metadata was updated */
  timestamp: number;
}

/**
 * Events emitted when account metadata is received via relay sync.
 */
export type MetadataEvent =
  | { type: 'metadataReceived'; key: string; value: string; timestamp: number };

/**
 * Payload for community event relay broadcast
 */
export interface CommunityEventPayload {
  /** Community this event belongs to */
  communityId: string;
  /** The actual community event */
  event: CommunityEvent;
  /** DID of the member who triggered the event */
  senderDid: string;
  /** Unix timestamp when the event was broadcast */
  timestamp: number;
}

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
  /** Sender's avatar (base64 image data or URL) */
  fromAvatar?: string;
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
  /** Responder's avatar (base64 image data or URL) */
  fromAvatar?: string;
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

// =============================================================================
// Community Types
// =============================================================================

/**
 * A community (server)
 */
export interface Community {
  /** Unique community ID */
  id: string;
  /** Community name */
  name: string;
  /** Community description */
  description?: string;
  /** Icon URL */
  iconUrl?: string;
  /** Banner URL */
  bannerUrl?: string;
  /** Splash URL */
  splashUrl?: string;
  /** Accent color (hex) */
  accentColor?: string;
  /** Custom CSS */
  customCss?: string;
  /** Owner's DID */
  ownerDid: string;
  /** Vanity URL slug */
  vanityUrl?: string;
  /** Origin community ID for cross-peer deduplication */
  originCommunityId?: string;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * Result of creating a community
 */
export interface CommunityCreateResult {
  /** Community ID */
  communityId: string;
  /** Default space ID */
  spaceId: string;
  /** Welcome channel ID */
  welcomeChannelId: string;
  /** General channel ID */
  generalChannelId: string;
  /** Preset role IDs */
  roleIds: {
    owner: string;
    admin: string;
    moderator: string;
    member: string;
  };
}

/**
 * A space within a community (category grouping)
 */
export interface CommunitySpace {
  /** Unique space ID */
  id: string;
  /** Parent community ID */
  communityId: string;
  /** Space name */
  name: string;
  /** Sort position */
  position: number;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * A category within a space (groups channels)
 */
export interface CommunityCategory {
  /** Unique category ID */
  id: string;
  /** Parent community ID */
  communityId: string;
  /** Parent space ID */
  spaceId: string;
  /** Category name */
  name: string;
  /** Sort position */
  position: number;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * A channel within a community
 */
export interface CommunityChannel {
  /** Unique channel ID */
  id: string;
  /** Parent community ID */
  communityId: string;
  /** Parent space ID */
  spaceId: string;
  /** Category ID (null = uncategorized) */
  categoryId?: string;
  /** Channel name */
  name: string;
  /** Channel type: text, voice, files, announcement, bulletin, welcome, forum */
  channelType: string;
  /** Channel topic/description */
  topic?: string;
  /** Sort position */
  position: number;
  /** Slow mode cooldown in seconds (0 = disabled) */
  slowModeSeconds: number;
  /** Whether E2EE is enabled */
  e2eeEnabled: boolean;
  /** Maximum number of pinned messages */
  pinLimit: number;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * A member of a community
 */
export interface CommunityMember {
  /** Community ID */
  communityId: string;
  /** Member's DID */
  memberDid: string;
  /** Nickname in this community */
  nickname?: string;
  /** Avatar URL override */
  avatarUrl?: string;
  /** Bio text */
  bio?: string;
  /** When they joined */
  joinedAt: number;
}

/**
 * A role in a community
 */
export interface CommunityRole {
  /** Unique role ID */
  id: string;
  /** Community ID */
  communityId: string;
  /** Role name */
  name: string;
  /** Role color (hex) */
  color?: string;
  /** Whether this role is shown separately in member list */
  hoisted: boolean;
  /** Position in role hierarchy (higher = more authority) */
  position: number;
  /** Permission bitfield (decimal string of a u64) */
  permissionsBitfield: string;
  /** Whether this role can be mentioned */
  mentionable: boolean;
  /** Whether this is a system-generated preset role (e.g. Owner, Member) */
  isPreset?: boolean;
  /** Icon URL */
  icon?: string;
  /** Badge */
  badge?: string;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
}

/**
 * A community seat (ghost member placeholder from platform import).
 *
 * Seats represent imported members from external platforms (Discord, GitHub, etc.)
 * that real users can claim by linking their platform account. Claiming a seat
 * auto-joins the community and assigns the original roles.
 *
 * **Platform-agnostic**: the `platform` field is a generic string.
 * Adding a new platform (e.g., Steam) requires no changes to the seat
 * system — only a new import adapter producing `MappedSeat[]` objects.
 */
export interface CommunitySeat {
  /** Unique seat ID */
  id: string;
  /** Community ID */
  communityId: string;
  /** Source platform (platform-agnostic) */
  platform: string;
  /** User ID on the source platform */
  platformUserId: string;
  /** Username on the source platform */
  platformUsername: string;
  /** Nickname from the source platform */
  nickname?: string;
  /** Avatar URL from the source platform */
  avatarUrl?: string;
  /** Umbra role IDs assigned to this seat */
  roleIds: string[];
  /** DID of the user who claimed this seat (null = ghost/unclaimed) */
  claimedByDid?: string;
  /** When the seat was claimed */
  claimedAt?: number;
  /** When the seat was created */
  createdAt: number;
}

/**
 * A community message
 */
export interface CommunityMessage {
  /** Unique message ID */
  id: string;
  /** Channel ID */
  channelId: string;
  /** Sender's DID */
  senderDid: string;
  /** Message content (plaintext) */
  content: string;
  /** Reply-to message ID */
  replyToId?: string;
  /** Thread ID (if this is a thread reply) */
  threadId?: string;
  /** Content warning text */
  contentWarning?: string;
  /** Whether the message has been edited */
  edited: boolean;
  /** When edited */
  editedAt?: number;
  /** Whether the message is pinned */
  pinned: boolean;
  /** Who pinned it */
  pinnedBy?: string;
  /** When pinned */
  pinnedAt?: number;
  /** Whether this is a system message */
  systemMessage: boolean;
  /** Number of thread replies */
  threadReplyCount: number;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
  /** Bridge message: sender display name (from Discord) */
  senderDisplayName?: string;
  /** Bridge message: sender avatar URL (from Discord) */
  senderAvatarUrl?: string;
  /** Bridge message: platform user ID (e.g. Discord user ID) for ghost seat lookup */
  platformUserId?: string;
  /** Bridge message: platform identifier (e.g. "discord") for ghost seat lookup */
  platform?: string;
  /** Optional metadata (text effects, etc.) stored as JSON */
  metadata?: MessageMetadata;
}

/**
 * A community invite
 */
export interface CommunityInvite {
  /** Unique invite ID */
  id: string;
  /** Community ID */
  communityId: string;
  /** Invite code */
  code: string;
  /** Whether this is a vanity invite */
  vanity: boolean;
  /** Creator's DID */
  creatorDid: string;
  /** Maximum number of uses (null = unlimited) */
  maxUses?: number;
  /** Current use count */
  useCount: number;
  /** Expiry timestamp (null = never) */
  expiresAt?: number;
  /** Created timestamp */
  createdAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Metadata & Text Effects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Available text effects for iMessage-style message animations.
 */
export type TextEffect =
  | 'slam'
  | 'gentle'
  | 'loud'
  | 'invisible_ink'
  | 'confetti'
  | 'balloons'
  | 'shake'
  | 'fade_in';

/**
 * Metadata attached to a community message (stored as JSON).
 */
export interface MessageMetadata {
  /** Optional text effect applied to this message. */
  textEffect?: TextEffect;
}

// ─────────────────────────────────────────────────────────────────────────────
// Community Emoji & Stickers
// ─────────────────────────────────────────────────────────────────────────────

/** A custom emoji belonging to a community. */
export interface CommunityEmoji {
  /** Unique emoji ID. */
  id: string;
  /** Community this emoji belongs to. */
  communityId: string;
  /** Short name (used as `:name:` in messages). */
  name: string;
  /** URL to the emoji image (relay-hosted or external). */
  imageUrl: string;
  /** Optional base64-encoded image data for P2P distribution. */
  imageBase64?: string;
  /** Whether this emoji is animated (GIF/APNG). */
  animated: boolean;
  /** DID of the user who uploaded this emoji. */
  uploadedBy: string;
  /** Unix timestamp of creation. */
  createdAt: number;
}

/** A custom sticker belonging to a community. */
export interface CommunitySticker {
  /** Unique sticker ID. */
  id: string;
  /** Community this sticker belongs to. */
  communityId: string;
  /** Optional sticker pack ID. */
  packId?: string;
  /** Sticker display name. */
  name: string;
  /** URL to the sticker image (relay-hosted or external). */
  imageUrl: string;
  /** Optional base64-encoded image data for P2P distribution. */
  imageBase64?: string;
  /** Whether this sticker is animated. */
  animated: boolean;
  /** Format of the sticker: gif, apng, lottie, png, webp. */
  format?: string;
  /** DID of the user who uploaded this sticker. */
  uploadedBy: string;
  /** Unix timestamp of creation. */
  createdAt: number;
}

/** A sticker pack grouping multiple stickers. */
export interface StickerPack {
  /** Unique pack ID. */
  id: string;
  /** Community this pack belongs to. */
  communityId: string;
  /** Pack display name. */
  name: string;
  /** Optional description. */
  description?: string;
  /** Optional cover sticker ID. */
  coverStickerId?: string;
  /** DID of the creator. */
  createdBy: string;
  /** Unix timestamp of creation. */
  createdAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Community File Records
// ─────────────────────────────────────────────────────────────────────────────

/** A file stored in a community file channel. */
export interface CommunityFileRecord {
  /** Unique file ID */
  id: string;
  /** Channel this file belongs to */
  channelId: string;
  /** Parent folder ID (null = root) */
  folderId?: string | null;
  /** Display filename */
  filename: string;
  /** Optional description */
  description?: string | null;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType?: string | null;
  /** JSON-encoded array of chunk references for P2P retrieval */
  storageChunksJson: string;
  /** DID of the uploader */
  uploadedBy: string;
  /** File version number */
  version: number;
  /** Number of times this file has been downloaded */
  downloadCount: number;
  /** Created timestamp (epoch ms) */
  createdAt: number;
  /** Whether the file chunks are encrypted (E2EE) */
  isEncrypted?: boolean;
  /** Encryption key version (for key rotation tracking) */
  encryptionKeyVersion?: number;
}

/** A folder inside a community file channel. */
export interface CommunityFileFolderRecord {
  /** Unique folder ID */
  id: string;
  /** Channel this folder belongs to */
  channelId: string;
  /** Parent folder ID (null = root) */
  parentFolderId?: string | null;
  /** Folder name */
  name: string;
  /** DID of the creator */
  createdBy: string;
  /** Created timestamp (epoch ms) */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// DM Shared Files & Folders
// ---------------------------------------------------------------------------

/**
 * A file shared in a DM or group conversation.
 * Uses the same P2P chunk storage as community files but scoped to a conversation.
 */
export interface DmSharedFileRecord {
  /** Unique file ID */
  id: string;
  /** Conversation this file belongs to (DM or group) */
  conversationId: string;
  /** Parent folder ID (null = root / unfiled) */
  folderId?: string | null;
  /** Display filename */
  filename: string;
  /** Optional description */
  description?: string | null;
  /** File size in bytes */
  fileSize: number;
  /** MIME type */
  mimeType?: string | null;
  /** JSON-encoded array of P2P chunk references */
  storageChunksJson: string;
  /** DID of the uploader */
  uploadedBy: string;
  /** File version number */
  version: number;
  /** Number of times downloaded */
  downloadCount: number;
  /** Created timestamp (epoch ms) */
  createdAt: number;
  /**
   * Encrypted metadata blob (Base64).
   * Contains filename + description encrypted with the conversation's
   * ECDH-derived key so metadata is private even from relay.
   */
  encryptedMetadata?: string;
  /** Nonce for metadata encryption (hex) */
  encryptionNonce?: string;
  /** Whether the file chunks are encrypted (E2EE) */
  isEncrypted?: boolean;
  /** Encryption key version (for key rotation tracking) */
  encryptionKeyVersion?: number;
}

/**
 * A shared folder in a DM or group conversation.
 * Both participants can add/remove files and create sub-folders.
 */
export interface DmSharedFolderRecord {
  /** Unique folder ID */
  id: string;
  /** Conversation this folder belongs to */
  conversationId: string;
  /** Parent folder ID (null = root) */
  parentFolderId?: string | null;
  /** Folder name */
  name: string;
  /** DID of the creator */
  createdBy: string;
  /** Created timestamp (epoch ms) */
  createdAt: number;
}

/**
 * Relay payload for DM file sharing event.
 * Sent via relay to notify the other party about shared files/folders.
 */
export interface DmFileEventPayload {
  /** Conversation ID */
  conversationId: string;
  /** Sender's DID */
  senderDid: string;
  /** Unix timestamp */
  timestamp: number;
  /** The file event */
  event:
    | { type: 'fileUploaded'; file: DmSharedFileRecord }
    | { type: 'fileDeleted'; fileId: string }
    | { type: 'fileMoved'; fileId: string; targetFolderId: string | null }
    | { type: 'folderCreated'; folder: DmSharedFolderRecord }
    | { type: 'folderDeleted'; folderId: string }
    | { type: 'folderRenamed'; folderId: string; newName: string };
}

/**
 * Community event types
 */
export type CommunityEvent =
  | { type: 'communityCreated'; communityId: string; name: string }
  | { type: 'communityUpdated'; communityId: string }
  | { type: 'communityDeleted'; communityId: string }
  | { type: 'ownershipTransferred'; communityId: string; newOwnerDid: string }
  | { type: 'spaceCreated'; communityId: string; spaceId: string }
  | { type: 'spaceUpdated'; communityId: string; spaceId: string }
  | { type: 'spaceDeleted'; communityId: string; spaceId: string }
  | { type: 'categoryCreated'; communityId: string; categoryId: string }
  | { type: 'categoryUpdated'; categoryId: string }
  | { type: 'categoryDeleted'; categoryId: string }
  | { type: 'channelCreated'; communityId: string; channelId: string }
  | { type: 'channelUpdated'; communityId: string; channelId: string }
  | { type: 'channelDeleted'; communityId: string; channelId: string }
  | { type: 'memberJoined'; communityId: string; memberDid: string; memberNickname?: string; memberAvatar?: string }
  | { type: 'memberLeft'; communityId: string; memberDid: string }
  | { type: 'memberKicked'; communityId: string; memberDid: string }
  | { type: 'memberBanned'; communityId: string; memberDid: string }
  | { type: 'memberUnbanned'; communityId: string; memberDid: string }
  | { type: 'roleAssigned'; communityId: string; memberDid: string; roleId: string }
  | { type: 'roleUnassigned'; communityId: string; memberDid: string; roleId: string }
  | { type: 'communityMessageSent'; channelId: string; channelName?: string; messageId: string; senderDid: string; content?: string; senderDisplayName?: string; senderAvatarUrl?: string; platformUserId?: string; platform?: string; metadata?: MessageMetadata }
  | { type: 'communityMessageEdited'; channelId: string; channelName?: string; messageId: string }
  | { type: 'communityMessageDeleted'; channelId: string; channelName?: string; messageId: string }
  | { type: 'communityReactionAdded'; messageId: string; emoji: string; memberDid: string }
  | { type: 'communityReactionRemoved'; messageId: string; emoji: string; memberDid: string }
  | { type: 'communityMessagePinned'; channelId: string; channelName?: string; messageId: string }
  | { type: 'communityMessageUnpinned'; channelId: string; channelName?: string; messageId: string }
  | { type: 'communityRoleCreated'; communityId: string; roleId: string }
  | { type: 'communityRoleUpdated'; roleId: string }
  | { type: 'communityRolePermissionsUpdated'; roleId: string }
  | { type: 'communityRoleDeleted'; roleId: string }
  | { type: 'inviteCreated'; communityId: string; inviteId: string }
  | { type: 'inviteDeleted'; communityId: string; inviteId: string }
  | { type: 'voiceChannelJoined'; communityId: string; channelId: string; memberDid: string }
  | { type: 'voiceChannelLeft'; communityId: string; channelId: string; memberDid: string }
  // File channel events
  | { type: 'fileUploaded'; channelId: string; fileId: string; senderDid: string }
  | { type: 'fileDeleted'; channelId: string; fileId: string }
  | { type: 'folderCreated'; channelId: string; folderId: string }
  | { type: 'folderDeleted'; channelId: string; folderId: string }
  | { type: 'fileMoved'; channelId: string; fileId: string; targetFolderId: string | null }
  // Emoji events
  | { type: 'emojiCreated'; communityId: string; emoji: CommunityEmoji }
  | { type: 'emojiDeleted'; communityId: string; emojiId: string }
  | { type: 'emojiRenamed'; communityId: string; emojiId: string; newName: string }
  // Sticker events
  | { type: 'stickerCreated'; communityId: string; sticker: CommunitySticker }
  | { type: 'stickerDeleted'; communityId: string; stickerId: string }
  | { type: 'stickerPackCreated'; communityId: string; pack: StickerPack }
  | { type: 'stickerPackDeleted'; communityId: string; packId: string };

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
// FILE CHUNKING
// =============================================================================

/**
 * Reference to a single chunk within a file manifest.
 */
export interface ChunkRef {
  /** SHA-256 hash of the chunk data (content-addressed ID) */
  chunkId: string;
  /** Zero-based index of this chunk within the file */
  chunkIndex: number;
  /** Size of this chunk in bytes */
  size: number;
  /** SHA-256 hash for verification */
  hash: string;
}

/**
 * Manifest describing how a file is split into chunks.
 * Returned by `chunkFile()` after splitting and storing.
 */
export interface ChunkManifest {
  /** Unique file identifier */
  fileId: string;
  /** Display filename */
  filename: string;
  /** Total file size in bytes */
  totalSize: number;
  /** Chunk size used for splitting (bytes) */
  chunkSize: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Ordered list of chunk references */
  chunks: ChunkRef[];
  /** SHA-256 hash of the entire file */
  fileHash: string;
}

/**
 * Stored file manifest record from the database.
 * Returned by `getFileManifest()`.
 */
export interface FileManifestRecord {
  /** File ID */
  fileId: string;
  /** Display filename */
  filename: string;
  /** Total size in bytes */
  totalSize: number;
  /** Chunk size in bytes */
  chunkSize: number;
  /** Number of chunks */
  totalChunks: number;
  /** JSON-encoded array of ChunkRef objects */
  chunksJson: string;
  /** SHA-256 hash of the complete file */
  fileHash: string;
  /** Whether the file is encrypted */
  encrypted: boolean;
  /** Encryption key ID (if encrypted) */
  encryptionKeyId: string | null;
  /** Created timestamp */
  createdAt: number;
}

/**
 * Result from reassembling a file from its stored chunks.
 */
export interface ReassembledFile {
  /** File contents as base64-encoded string */
  dataB64: string;
  /** Original filename */
  filename: string;
  /** SHA-256 hash of the reassembled file */
  fileHash: string;
  /** Total file size in bytes */
  totalSize: number;
}

// =============================================================================
// FILE TRANSFER
// =============================================================================

/**
 * Transport type for file transfers
 */
export type TransportType = 'webrtc' | 'relay' | 'libp2p';

/**
 * State of a file transfer session
 */
export type TransferState =
  | 'requesting'
  | 'negotiating'
  | 'transferring'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Direction of a file transfer
 */
export type TransferDirection = 'upload' | 'download';

/**
 * Progress information for a file transfer
 */
export interface TransferProgress {
  /** Unique transfer session ID */
  transferId: string;
  /** File being transferred */
  fileId: string;
  /** Display filename */
  filename: string;
  /** Upload or download */
  direction: TransferDirection;
  /** Current state */
  state: TransferState;
  /** Number of chunks completed */
  chunksCompleted: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Bytes transferred so far */
  bytesTransferred: number;
  /** Total bytes to transfer */
  totalBytes: number;
  /** Current transfer speed in bytes per second */
  speedBps: number;
  /** DID of the peer we're transferring with */
  peerDid: string;
  /** When the transfer started (Unix timestamp) */
  startedAt: number;
  /** Transport being used */
  transportType: TransportType;
  /** Error message if state is 'failed' */
  error?: string;
  /** Bitfield of completed chunks (for resume) */
  chunksBitfield?: string;
}

/**
 * An incoming transfer request from a peer
 */
export interface IncomingTransferRequest {
  /** Transfer session ID */
  transferId: string;
  /** File ID being offered */
  fileId: string;
  /** Display filename */
  filename: string;
  /** Total file size in bytes */
  totalBytes: number;
  /** Total number of chunks */
  totalChunks: number;
  /** DID of the peer sending the file */
  peerDid: string;
  /** Manifest JSON for the file */
  manifestJson: string;
}

/**
 * Events emitted by the file transfer system
 */
export type FileTransferEvent =
  | { type: 'transferRequested'; request: IncomingTransferRequest }
  | { type: 'transferAccepted'; transferId: string }
  | { type: 'transferRejected'; transferId: string; reason?: string }
  | { type: 'transferProgress'; progress: TransferProgress }
  | { type: 'transferCompleted'; transferId: string; fileId: string }
  | { type: 'transferFailed'; transferId: string; error: string }
  | { type: 'transferPaused'; transferId: string }
  | { type: 'transferResumed'; transferId: string }
  | { type: 'transferCancelled'; transferId: string };
