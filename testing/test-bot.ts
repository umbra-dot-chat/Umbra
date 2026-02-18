/**
 * TestBot — An autonomous test peer for Umbra.
 *
 * Creates its own identity, connects to the relay, and can:
 * - Send / accept friend requests (with full two-phase handshake)
 * - Send encrypted DM messages on a schedule
 * - Respond to incoming messages
 * - Create groups and send group messages
 * - Simulate typing indicators
 *
 * The bot stores friend encryption keys in memory so it can encrypt/decrypt
 * messages the same way the real Umbra WASM core does.
 */

import { EventEmitter } from 'events';
import {
  type BotIdentity,
  createIdentity,
  encryptMessage,
  decryptMessage,
  computeConversationId,
  uuid,
} from './crypto.js';
import { RelayClient, type ServerMessage } from './relay.js';
import { BotCallManager, type CallType } from './call-manager.js';
import { MessageTracker, type TrackedMessage } from './message-tracker.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface FriendInfo {
  did: string;
  displayName: string;
  signingKey: string;
  encryptionKey: string;
  conversationId: string;
  /** ID of the original friend request (needed for response flow) */
  requestId?: string;
}

export interface PendingRequest {
  id: string;
  fromDid: string;
  fromDisplayName: string;
  fromSigningKey: string;
  fromEncryptionKey: string;
  message?: string;
  direction: 'incoming' | 'outgoing';
}

export interface ActiveBotCall {
  callId: string;
  remoteDid: string;
  remoteDisplayName: string;
  callType: CallType;
  direction: 'outgoing' | 'incoming';
  status: 'outgoing' | 'incoming' | 'connecting' | 'connected' | 'ended';
  manager: BotCallManager;
  startedAt: number;
  connectedAt: number | null;
  remoteIsMuted: boolean;
  remoteIsCameraOff: boolean;
}

export interface ReactionInfo {
  messageId: string;
  conversationId: string;
  emoji: string;
  senderDid: string;
  timestamp: number;
}

export interface GroupInfo {
  groupId: string;
  groupName: string;
  groupKey: string;
  keyVersion: number;
  members: { did: string; displayName: string; role: 'admin' | 'member' }[];
  conversationId: string;
}

export interface PendingGroupInvite {
  inviteId: string;
  groupId: string;
  groupName: string;
  inviterDid: string;
  inviterName: string;
  encryptedGroupKey: string;
  nonce: string;
  membersJson: string;
  timestamp: number;
}

export interface PendingIncomingCall {
  callId: string;
  fromDid: string;
  fromName: string;
  callType: CallType;
  conversationId: string;
  offerSdp: string;
  receivedAt: number;
}

export type BotEventType =
  | 'messageSent'
  | 'messageReceived'
  | 'threadReplySent'
  | 'threadReplyReceived'
  | 'reactionSent'
  | 'reactionReceived'
  | 'reactionRemoved'
  | 'friendAdded'
  | 'friendRequestRejected'
  | 'callStarted'
  | 'callConnected'
  | 'callEnded'
  | 'callStateUpdate'
  | 'incomingCall'
  | 'statusReceived'
  | 'typingIndicator'
  | 'groupJoined'
  | 'groupMessageSent'
  | 'groupMessageReceived'
  | 'groupMemberRemoved'
  | 'groupKeyRotated';

export interface BotConfig {
  /** Relay WebSocket URL */
  relayUrl: string;
  /** Bot display name */
  name: string;
  /** Auto-accept incoming friend requests */
  autoAcceptFriends: boolean;
  /** Auto-accept incoming calls */
  autoAcceptCalls: boolean;
  /** Interval (ms) between periodic messages (0 = disabled) */
  messageIntervalMs: number;
  /** Pool of messages to send randomly */
  messagePool: string[];
  /** Whether to echo received messages back */
  echoMessages: boolean;
  /** Auto-react to received messages with random emoji */
  autoReact: boolean;
  /** Auto-reply in threads to received messages */
  autoThread: boolean;
  /** Pool of emoji for auto-react */
  reactionPool: string[];
  /** Audio mode for calls */
  audioMode: 'sine' | 'sweep' | 'dtmf' | 'silence';
  /** Auto-accept group invites */
  autoAcceptGroupInvites: boolean;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const DEFAULT_CONFIG: BotConfig = {
  relayUrl: 'wss://relay.umbra.chat/ws',
  name: 'TestBot',
  autoAcceptFriends: true,
  autoAcceptCalls: true,
  messageIntervalMs: 0,
  messagePool: [
    'Hey! How are you?',
    'Testing 1, 2, 3...',
    'This is an automated message from the test bot.',
    'The quick brown fox jumps over the lazy dog.',
    'Hello from the other side!',
    'Encryption is working great!',
    'Did you get my last message?',
    'Just checking in...',
    'Bot says hi! 🤖',
    'Lorem ipsum dolor sit amet.',
  ],
  echoMessages: false,
  autoReact: false,
  autoThread: false,
  reactionPool: ['👍', '❤️', '😂', '🔥', '👀', '🎉', '✨', '💯'],
  audioMode: 'sine',
  autoAcceptGroupInvites: true,
  logLevel: 'info',
};

// ─────────────────────────────────────────────────────────────────────────────
// TestBot
// ─────────────────────────────────────────────────────────────────────────────

export class TestBot {
  readonly identity: BotIdentity;
  readonly config: BotConfig;
  readonly events: EventEmitter = new EventEmitter();
  private relay: RelayClient;
  private friends: Map<string, FriendInfo> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private reactions: Map<string, ReactionInfo[]> = new Map(); // messageId → reactions
  private groups: Map<string, GroupInfo> = new Map();
  private pendingGroupInvites: Map<string, PendingGroupInvite> = new Map();
  private pendingIncomingCalls: Map<string, PendingIncomingCall> = new Map();
  private typingState: Map<string, { did: string; startedAt: number }[]> = new Map();
  private messageStatuses: Map<string, 'sent' | 'delivered' | 'read'> = new Map();
  private messageTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;
  private activeCall: ActiveBotCall | null = null;
  private _messageTracker: MessageTracker = new MessageTracker();

  constructor(config: Partial<BotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.identity = createIdentity(this.config.name);
    this.relay = new RelayClient(this.config.relayUrl, this.identity.did);

    this.log('info', `Created identity: ${this.identity.did}`);
    this.log('debug', `Signing key:    ${this.identity.signingPublicKey}`);
    this.log('debug', `Encryption key: ${this.identity.encryptionPublicKey}`);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  async start(): Promise<void> {
    this.log('info', `Connecting to relay: ${this.config.relayUrl}`);
    await this.relay.connect();
    this.log('info', 'Registered with relay');

    // Listen for relay messages
    this.relay.onMessage((msg) => this.handleRelayMessage(msg));

    // Fetch any offline messages
    this.relay.fetchOffline();

    this.running = true;

    // Start periodic message sending if configured
    if (this.config.messageIntervalMs > 0 && this.friends.size > 0) {
      this.startPeriodicMessages();
    }

    this.log('info', `Bot "${this.config.name}" is running`);
  }

  stop(): void {
    this.running = false;
    if (this.messageTimer) {
      clearInterval(this.messageTimer);
      this.messageTimer = null;
    }
    if (this.activeCall) {
      this.activeCall.manager.close();
      this.activeCall = null;
    }
    this.relay.disconnect();
    this.log('info', 'Bot stopped');
  }

  // ─── Friend Requests ────────────────────────────────────────────────────

  /**
   * Send a friend request to a DID.
   */
  sendFriendRequest(toDid: string, message?: string): void {
    const requestId = uuid();
    const envelope = {
      envelope: 'friend_request',
      version: 1,
      payload: {
        id: requestId,
        fromDid: this.identity.did,
        fromDisplayName: this.identity.displayName,
        fromSigningKey: this.identity.signingPublicKey,
        fromEncryptionKey: this.identity.encryptionPublicKey,
        message: message ?? `Hi! I'm ${this.identity.displayName}, a test bot.`,
        createdAt: Date.now(),
      },
    };

    this.relay.sendEnvelope(toDid, envelope);

    this.pendingRequests.set(requestId, {
      id: requestId,
      fromDid: this.identity.did,
      fromDisplayName: this.identity.displayName,
      fromSigningKey: this.identity.signingPublicKey,
      fromEncryptionKey: this.identity.encryptionPublicKey,
      message,
      direction: 'outgoing',
    });

    this.log('info', `Sent friend request to ${toDid.slice(0, 24)}...`);
  }

  /**
   * Accept an incoming friend request by ID.
   */
  acceptFriendRequest(requestId: string): void {
    const req = this.pendingRequests.get(requestId);
    if (!req || req.direction !== 'incoming') {
      this.log('warn', `No incoming request found with ID: ${requestId}`);
      return;
    }

    // Add as friend
    const conversationId = computeConversationId(this.identity.did, req.fromDid);
    this.friends.set(req.fromDid, {
      did: req.fromDid,
      displayName: req.fromDisplayName,
      signingKey: req.fromSigningKey,
      encryptionKey: req.fromEncryptionKey,
      conversationId,
      requestId: req.id,
    });

    // Send acceptance response
    const response = {
      envelope: 'friend_response',
      version: 1,
      payload: {
        requestId: req.id,
        fromDid: this.identity.did,
        fromDisplayName: this.identity.displayName,
        fromSigningKey: this.identity.signingPublicKey,
        fromEncryptionKey: this.identity.encryptionPublicKey,
        accepted: true,
        timestamp: Date.now(),
      },
    };

    this.relay.sendEnvelope(req.fromDid, response);
    this.pendingRequests.delete(requestId);

    this.events.emit('friendAdded', { did: req.fromDid, displayName: req.fromDisplayName });
    this.log('info', `Accepted friend request from ${req.fromDisplayName} (${req.fromDid.slice(0, 24)}...)`);
    this.log('info', `Conversation ID: ${conversationId.slice(0, 16)}...`);

    // Start periodic messages if we now have friends
    if (this.config.messageIntervalMs > 0 && !this.messageTimer) {
      this.startPeriodicMessages();
    }
  }

  /**
   * Reject an incoming friend request by ID.
   */
  rejectFriendRequest(requestId: string): void {
    const req = this.pendingRequests.get(requestId);
    if (!req || req.direction !== 'incoming') {
      this.log('warn', `No incoming request found with ID: ${requestId}`);
      return;
    }

    const response = {
      envelope: 'friend_response',
      version: 1,
      payload: {
        requestId: req.id,
        fromDid: this.identity.did,
        fromDisplayName: this.identity.displayName,
        fromSigningKey: this.identity.signingPublicKey,
        fromEncryptionKey: this.identity.encryptionPublicKey,
        accepted: false,
        timestamp: Date.now(),
      },
    };

    this.relay.sendEnvelope(req.fromDid, response);
    this.pendingRequests.delete(requestId);

    this.events.emit('friendRequestRejected', { requestId, fromDid: req.fromDid });
    this.log('info', `Rejected friend request from ${req.fromDisplayName}`);
  }

  // ─── Messaging ──────────────────────────────────────────────────────────

  /**
   * Send an encrypted message to a friend.
   * Returns the message ID for thread replies / reactions.
   */
  sendMessage(friendDid: string, text: string): string {
    const friend = this.friends.get(friendDid);
    if (!friend) {
      this.log('warn', `Cannot send message: ${friendDid.slice(0, 24)}... is not a friend`);
      return '';
    }

    const timestamp = Date.now();
    const messageId = uuid();

    const { ciphertext, nonce } = encryptMessage(
      text,
      this.identity.encryptionPrivateKey,
      friend.encryptionKey,
      this.identity.did,
      friend.did,
      timestamp,
      friend.conversationId,
    );

    const envelope = {
      envelope: 'chat_message',
      version: 1,
      payload: {
        messageId,
        conversationId: friend.conversationId,
        senderDid: this.identity.did,
        contentEncrypted: ciphertext,
        nonce,
        timestamp,
      },
    };

    this.relay.sendEnvelope(friend.did, envelope);
    this.messageStatuses.set(messageId, 'sent');
    this._messageTracker.trackSent({
      messageId,
      conversationId: friend.conversationId,
      content: text,
      timestamp,
      senderDid: this.identity.did,
      recipientDid: friend.did,
    });
    this.events.emit('messageSent', { messageId, friendDid, text });
    this.log('info', `Sent message to ${friend.displayName}: "${text}" (id: ${messageId.slice(0, 8)}...)`);
    return messageId;
  }

  /**
   * Send a message to all friends.
   */
  broadcastMessage(text: string): void {
    for (const friend of this.friends.values()) {
      this.sendMessage(friend.did, text);
    }
  }

  /**
   * Send a random message from the pool to a random friend.
   */
  sendRandomMessage(): void {
    const friendList = [...this.friends.values()];
    if (friendList.length === 0) return;

    const friend = friendList[Math.floor(Math.random() * friendList.length)];
    const text = this.config.messagePool[
      Math.floor(Math.random() * this.config.messagePool.length)
    ];
    this.sendMessage(friend.did, text);
  }

  /**
   * Send an encrypted thread reply to a friend.
   * The threadId is the messageId of the parent message being replied to.
   */
  sendThreadReply(parentMessageId: string, friendDid: string, text: string): string {
    const friend = this.friends.get(friendDid);
    if (!friend) {
      this.log('warn', `Cannot send thread reply: ${friendDid.slice(0, 24)}... is not a friend`);
      return '';
    }

    const timestamp = Date.now();
    const messageId = uuid();

    const { ciphertext, nonce } = encryptMessage(
      text,
      this.identity.encryptionPrivateKey,
      friend.encryptionKey,
      this.identity.did,
      friend.did,
      timestamp,
      friend.conversationId,
    );

    const envelope = {
      envelope: 'chat_message',
      version: 1,
      payload: {
        messageId,
        conversationId: friend.conversationId,
        senderDid: this.identity.did,
        contentEncrypted: ciphertext,
        nonce,
        timestamp,
        threadId: parentMessageId,
      },
    };

    this.relay.sendEnvelope(friend.did, envelope);
    this._messageTracker.trackSent({
      messageId,
      conversationId: friend.conversationId,
      content: text,
      timestamp,
      senderDid: this.identity.did,
      recipientDid: friend.did,
      threadId: parentMessageId,
    });
    this.events.emit('threadReplySent', { messageId, parentMessageId, friendDid, text });
    this.log('info', `Sent thread reply to ${friend.displayName}: "${text}" (thread: ${parentMessageId.slice(0, 8)}...)`);
    return messageId;
  }

  /**
   * Add a reaction to a message.
   */
  addReaction(messageId: string, friendDid: string, emoji: string): void {
    const friend = this.friends.get(friendDid);
    if (!friend) {
      this.log('warn', `Cannot react: ${friendDid.slice(0, 24)}... is not a friend`);
      return;
    }

    const envelope = {
      envelope: 'reaction_add',
      version: 1,
      payload: {
        messageId,
        conversationId: friend.conversationId,
        senderDid: this.identity.did,
        emoji,
        timestamp: Date.now(),
      },
    };

    this.relay.sendEnvelope(friend.did, envelope);

    // Track locally
    const existing = this.reactions.get(messageId) ?? [];
    existing.push({
      messageId,
      conversationId: friend.conversationId,
      emoji,
      senderDid: this.identity.did,
      timestamp: Date.now(),
    });
    this.reactions.set(messageId, existing);

    this.events.emit('reactionSent', { messageId, emoji, friendDid });
    this.log('info', `Reacted to ${messageId.slice(0, 8)}... with ${emoji}`);
  }

  /**
   * Remove a reaction from a message.
   */
  removeReaction(messageId: string, friendDid: string, emoji: string): void {
    const friend = this.friends.get(friendDid);
    if (!friend) {
      this.log('warn', `Cannot remove reaction: ${friendDid.slice(0, 24)}... is not a friend`);
      return;
    }

    const envelope = {
      envelope: 'reaction_remove',
      version: 1,
      payload: {
        messageId,
        conversationId: friend.conversationId,
        senderDid: this.identity.did,
        emoji,
        timestamp: Date.now(),
      },
    };

    this.relay.sendEnvelope(friend.did, envelope);

    // Remove from local tracking
    const existing = this.reactions.get(messageId);
    if (existing) {
      const idx = existing.findIndex((r) => r.emoji === emoji && r.senderDid === this.identity.did);
      if (idx !== -1) existing.splice(idx, 1);
    }

    this.log('info', `Removed ${emoji} from ${messageId.slice(0, 8)}...`);
  }

  /**
   * Send a message status receipt (delivered / read).
   */
  sendMessageStatus(messageId: string, friendDid: string, status: 'delivered' | 'read'): void {
    const friend = this.friends.get(friendDid);
    if (!friend) return;

    const envelope = {
      envelope: 'message_status',
      version: 1,
      payload: {
        messageId,
        conversationId: friend.conversationId,
        status,
        timestamp: Date.now(),
      },
    };

    this.relay.sendEnvelope(friend.did, envelope);
    this.log('debug', `Sent ${status} receipt for ${messageId.slice(0, 8)}...`);
  }

  /**
   * Send a typing indicator to a friend.
   */
  sendTypingIndicator(friendDid: string, isTyping: boolean): void {
    const friend = this.friends.get(friendDid);
    if (!friend) return;

    const envelope = {
      envelope: 'typing_indicator',
      version: 1,
      payload: {
        conversationId: friend.conversationId,
        senderDid: this.identity.did,
        senderName: this.identity.displayName,
        isTyping,
        timestamp: Date.now(),
      },
    };

    this.relay.sendEnvelope(friend.did, envelope);
  }

  // ─── Groups ─────────────────────────────────────────────────────────────

  /**
   * Create a group and invite all current friends.
   * Returns the groupId.
   */
  createGroupAndInviteAll(groupName: string): string {
    const groupId = uuid();
    const groupKey = `group-key-${uuid().slice(0, 16)}`;
    const friendList = [...this.friends.values()];

    // Store group locally
    const members = [
      { did: this.identity.did, displayName: this.identity.displayName, role: 'admin' as const },
      ...friendList.map((f) => ({ did: f.did, displayName: f.displayName, role: 'member' as const })),
    ];

    this.groups.set(groupId, {
      groupId,
      groupName,
      groupKey,
      keyVersion: 1,
      members,
      conversationId: `group-${groupId}`,
    });

    for (const friend of friendList) {
      const inviteId = uuid();
      const envelope = {
        envelope: 'group_invite',
        version: 1,
        payload: {
          inviteId,
          groupId,
          groupName,
          description: `Test group created by ${this.identity.displayName}`,
          inviterDid: this.identity.did,
          inviterName: this.identity.displayName,
          encryptedGroupKey: groupKey,
          nonce: '000000000000000000000000',
          membersJson: JSON.stringify(members),
          timestamp: Date.now(),
        },
      };
      this.relay.sendEnvelope(friend.did, envelope);
    }

    this.log('info', `Created group "${groupName}" (${groupId.slice(0, 8)}...) and invited ${friendList.length} friend(s)`);
    return groupId;
  }

  /**
   * Send a group invite to a specific DID (must be a friend).
   */
  sendGroupInvite(groupId: string, inviteeDid: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      this.log('warn', `Cannot invite: group ${groupId.slice(0, 8)}... not found`);
      return;
    }
    const friend = this.friends.get(inviteeDid);
    if (!friend) {
      this.log('warn', `Cannot invite: ${inviteeDid.slice(0, 24)}... is not a friend`);
      return;
    }

    const inviteId = uuid();
    const envelope = {
      envelope: 'group_invite',
      version: 1,
      payload: {
        inviteId,
        groupId: group.groupId,
        groupName: group.groupName,
        description: `Group by ${this.identity.displayName}`,
        inviterDid: this.identity.did,
        inviterName: this.identity.displayName,
        encryptedGroupKey: group.groupKey,
        nonce: '000000000000000000000000',
        membersJson: JSON.stringify(group.members),
        timestamp: Date.now(),
      },
    };
    this.relay.sendEnvelope(inviteeDid, envelope);
    this.log('info', `Invited ${friend.displayName} to group "${group.groupName}"`);
  }

  /**
   * Accept a pending group invite.
   */
  acceptGroupInvite(inviteId: string): void {
    const invite = this.pendingGroupInvites.get(inviteId);
    if (!invite) {
      this.log('warn', `No pending group invite with ID: ${inviteId}`);
      return;
    }

    // Parse members and add self
    let members: { did: string; displayName: string; role: 'admin' | 'member' }[] = [];
    try {
      members = JSON.parse(invite.membersJson);
    } catch { /* ignore */ }

    if (!members.some((m) => m.did === this.identity.did)) {
      members.push({ did: this.identity.did, displayName: this.identity.displayName, role: 'member' });
    }

    // Store group
    this.groups.set(invite.groupId, {
      groupId: invite.groupId,
      groupName: invite.groupName,
      groupKey: invite.encryptedGroupKey,
      keyVersion: 1,
      members,
      conversationId: `group-${invite.groupId}`,
    });

    // Send acceptance
    const envelope = {
      envelope: 'group_invite_accept',
      version: 1,
      payload: {
        inviteId,
        groupId: invite.groupId,
        senderDid: this.identity.did,
        senderDisplayName: this.identity.displayName,
        timestamp: Date.now(),
      },
    };
    this.relay.sendEnvelope(invite.inviterDid, envelope);
    this.pendingGroupInvites.delete(inviteId);

    this.events.emit('groupJoined', { groupId: invite.groupId, groupName: invite.groupName });
    this.log('info', `Joined group "${invite.groupName}" (${invite.groupId.slice(0, 8)}...)`);
  }

  /**
   * Decline a pending group invite.
   */
  declineGroupInvite(inviteId: string): void {
    const invite = this.pendingGroupInvites.get(inviteId);
    if (!invite) {
      this.log('warn', `No pending group invite with ID: ${inviteId}`);
      return;
    }

    const envelope = {
      envelope: 'group_invite_decline',
      version: 1,
      payload: {
        inviteId,
        groupId: invite.groupId,
        senderDid: this.identity.did,
        timestamp: Date.now(),
      },
    };
    this.relay.sendEnvelope(invite.inviterDid, envelope);
    this.pendingGroupInvites.delete(inviteId);

    this.log('info', `Declined invite to group "${invite.groupName}"`);
  }

  /**
   * Send a message to a group. Uses simplified encryption (group key as shared secret).
   */
  sendGroupMessage(groupId: string, text: string): string {
    const group = this.groups.get(groupId);
    if (!group) {
      this.log('warn', `Cannot send group message: group ${groupId.slice(0, 8)}... not found`);
      return '';
    }

    const messageId = uuid();
    const timestamp = Date.now();

    // Simplified group encryption: use group key as a symmetric key identifier
    // In a real app this would use AES with the shared group key
    const ciphertext = Buffer.from(text).toString('base64');
    const nonce = uuid().replace(/-/g, '').slice(0, 24);

    // Send to all other members in the group
    for (const member of group.members) {
      if (member.did === this.identity.did) continue;

      const envelope = {
        envelope: 'group_message',
        version: 1,
        payload: {
          messageId,
          groupId: group.groupId,
          conversationId: group.conversationId,
          senderDid: this.identity.did,
          senderName: this.identity.displayName,
          ciphertext,
          nonce,
          keyVersion: group.keyVersion,
          timestamp,
        },
      };
      this.relay.sendEnvelope(member.did, envelope);
    }

    this._messageTracker.trackSent({
      messageId,
      conversationId: group.conversationId,
      content: text,
      timestamp,
      senderDid: this.identity.did,
      recipientDid: group.groupId, // Use groupId as "recipient" for group messages
    });

    this.events.emit('groupMessageSent', { messageId, groupId, text });
    this.log('info', `Sent group message to "${group.groupName}": "${text.slice(0, 50)}"`);
    return messageId;
  }

  /**
   * Remove a member from a group and rotate the group key.
   */
  removeGroupMember(groupId: string, memberDid: string): void {
    const group = this.groups.get(groupId);
    if (!group) {
      this.log('warn', `Cannot remove member: group ${groupId.slice(0, 8)}... not found`);
      return;
    }

    // Remove from member list
    group.members = group.members.filter((m) => m.did !== memberDid);

    // Rotate key
    const newKey = `group-key-${uuid().slice(0, 16)}`;
    group.groupKey = newKey;
    group.keyVersion++;

    // Notify removed member
    const removeEnvelope = {
      envelope: 'group_member_removed',
      version: 1,
      payload: {
        groupId: group.groupId,
        removedDid: memberDid,
        senderDid: this.identity.did,
        timestamp: Date.now(),
      },
    };
    this.relay.sendEnvelope(memberDid, removeEnvelope);

    // Send key rotation to remaining members
    for (const member of group.members) {
      if (member.did === this.identity.did) continue;

      const rotateEnvelope = {
        envelope: 'group_key_rotation',
        version: 1,
        payload: {
          groupId: group.groupId,
          encryptedKey: newKey,
          nonce: '000000000000000000000000',
          senderDid: this.identity.did,
          keyVersion: group.keyVersion,
          timestamp: Date.now(),
        },
      };
      this.relay.sendEnvelope(member.did, rotateEnvelope);
    }

    this.events.emit('groupMemberRemoved', { groupId, memberDid });
    this.log('info', `Removed ${memberDid.slice(0, 24)}... from group and rotated key to v${group.keyVersion}`);
  }

  // ─── Calling ───────────────────────────────────────────────────────────

  /**
   * Start a call to a friend. Generates a 4K video stream and sends the
   * SDP offer via the relay.
   */
  async startCall(friendDid: string, callType: CallType = 'video'): Promise<void> {
    const friend = this.friends.get(friendDid);
    if (!friend) {
      this.log('warn', `Cannot call: ${friendDid.slice(0, 24)}... is not a friend`);
      return;
    }
    if (this.activeCall) {
      this.log('warn', 'Already in a call');
      return;
    }

    const callId = `call-${Date.now()}-${uuid().slice(0, 8)}`;
    const manager = new BotCallManager({ audioMode: this.config.audioMode });
    this.setupCallManagerHandlers(manager, callId, friend.did);

    try {
      const sdpOffer = await manager.createOffer(callType);

      this.activeCall = {
        callId,
        remoteDid: friend.did,
        remoteDisplayName: friend.displayName,
        callType,
        direction: 'outgoing',
        status: 'outgoing',
        manager,
        startedAt: Date.now(),
        connectedAt: null,
        remoteIsMuted: false,
        remoteIsCameraOff: false,
      };

      // Send offer via relay
      const envelope = {
        envelope: 'call_offer',
        version: 1,
        payload: {
          callId,
          callType,
          senderDid: this.identity.did,
          senderDisplayName: this.identity.displayName,
          conversationId: friend.conversationId,
          sdp: sdpOffer,
          sdpType: 'offer',
        },
      };
      this.relay.sendEnvelope(friend.did, envelope);

      this.events.emit('callStarted', { callId, remoteDid: friend.did, callType, direction: 'outgoing' });
      const quality = callType === 'video' ? '4K (3840x2160 @ 30fps)' : 'voice only';
      this.log('info', `Calling ${friend.displayName} — ${callType} [${quality}]`);

      // Ring timeout: auto-end after 45s
      setTimeout(() => {
        if (this.activeCall?.callId === callId && this.activeCall.status === 'outgoing') {
          this.log('warn', `Call to ${friend.displayName} timed out (45s)`);
          this.endCall('timeout');
        }
      }, 45_000);

    } catch (err) {
      this.log('error', `Failed to start call: ${err}`);
      manager.close();
      this.activeCall = null;
    }
  }

  /**
   * Accept an incoming call.
   */
  private async acceptIncomingCall(
    callId: string,
    fromDid: string,
    fromName: string,
    callType: CallType,
    conversationId: string,
    offerSdp: string,
  ): Promise<void> {
    if (this.activeCall) {
      // Already in a call — send busy
      this.log('info', `Busy: declining call from ${fromName}`);
      const envelope = {
        envelope: 'call_end',
        version: 1,
        payload: { callId, senderDid: this.identity.did, reason: 'busy' },
      };
      this.relay.sendEnvelope(fromDid, envelope);
      return;
    }

    const manager = new BotCallManager({ audioMode: this.config.audioMode });
    this.setupCallManagerHandlers(manager, callId, fromDid);

    try {
      const sdpAnswer = await manager.acceptOffer(offerSdp, callType);

      this.activeCall = {
        callId,
        remoteDid: fromDid,
        remoteDisplayName: fromName,
        callType,
        direction: 'incoming',
        status: 'connecting',
        manager,
        startedAt: Date.now(),
        connectedAt: null,
        remoteIsMuted: false,
        remoteIsCameraOff: false,
      };

      // Send answer via relay
      const envelope = {
        envelope: 'call_answer',
        version: 1,
        payload: {
          callId,
          senderDid: this.identity.did,
          sdp: sdpAnswer,
          sdpType: 'answer',
        },
      };
      this.relay.sendEnvelope(fromDid, envelope);

      const quality = callType === 'video' ? '4K (3840x2160 @ 30fps)' : 'voice only';
      this.log('info', `Accepted call from ${fromName} — ${callType} [${quality}]`);

    } catch (err) {
      this.log('error', `Failed to accept call: ${err}`);
      manager.close();
      this.activeCall = null;
    }
  }

  /**
   * End the current call.
   */
  endCall(reason: string = 'completed'): void {
    if (!this.activeCall) {
      this.log('warn', 'No active call to end');
      return;
    }

    const { callId, remoteDid, remoteDisplayName, manager } = this.activeCall;

    // Send call_end to remote
    const envelope = {
      envelope: 'call_end',
      version: 1,
      payload: { callId, senderDid: this.identity.did, reason },
    };
    this.relay.sendEnvelope(remoteDid, envelope);

    manager.close();
    this.events.emit('callEnded', { callId, remoteDid, reason });
    this.log('info', `Call with ${remoteDisplayName} ended (${reason})`);
    this.activeCall = null;
  }

  /**
   * Accept a pending incoming call by ID.
   */
  async acceptCall(callId: string): Promise<void> {
    const pending = this.pendingIncomingCalls.get(callId);
    if (!pending) {
      this.log('warn', `No pending incoming call with ID: ${callId}`);
      return;
    }
    this.pendingIncomingCalls.delete(callId);
    await this.acceptIncomingCall(
      pending.callId,
      pending.fromDid,
      pending.fromName,
      pending.callType,
      pending.conversationId,
      pending.offerSdp,
    );
  }

  /**
   * Decline a pending incoming call.
   */
  declineCall(callId: string, reason: string = 'declined'): void {
    const pending = this.pendingIncomingCalls.get(callId);
    if (!pending) {
      this.log('warn', `No pending incoming call with ID: ${callId}`);
      return;
    }
    this.pendingIncomingCalls.delete(callId);

    const envelope = {
      envelope: 'call_end',
      version: 1,
      payload: { callId, senderDid: this.identity.did, reason },
    };
    this.relay.sendEnvelope(pending.fromDid, envelope);
    this.log('info', `Declined call from ${pending.fromName} (${reason})`);
  }

  /**
   * Send a call state update (mute/camera) to the remote peer.
   */
  sendCallState(isMuted?: boolean, isCameraOff?: boolean): void {
    if (!this.activeCall) return;

    const envelope = {
      envelope: 'call_state',
      version: 1,
      payload: {
        callId: this.activeCall.callId,
        senderDid: this.identity.did,
        isMuted,
        isCameraOff,
      },
    };
    this.relay.sendEnvelope(this.activeCall.remoteDid, envelope);
    this.log('debug', `Sent call state: muted=${isMuted}, cameraOff=${isCameraOff}`);
  }

  /**
   * Get the current active call info (for CLI display).
   */
  get currentCall(): ActiveBotCall | null {
    return this.activeCall;
  }

  /**
   * Get pending incoming calls (when autoAcceptCalls is false).
   */
  get pendingCalls(): PendingIncomingCall[] {
    return [...this.pendingIncomingCalls.values()];
  }

  private setupCallManagerHandlers(manager: BotCallManager, callId: string, remoteDid: string): void {
    manager.onIceCandidate = (candidate) => {
      const envelope = {
        envelope: 'call_ice_candidate',
        version: 1,
        payload: {
          callId,
          senderDid: this.identity.did,
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        },
      };
      this.relay.sendEnvelope(remoteDid, envelope);
    };

    manager.onConnectionStateChange = (state) => {
      if (state === 'connected') {
        if (this.activeCall?.callId === callId) {
          this.activeCall.status = 'connected';
          this.activeCall.connectedAt = Date.now();
          this.events.emit('callConnected', { callId, remoteDid });
          this.log('info', `Call connected with ${this.activeCall.remoteDisplayName}`);
        }
      } else if (state === 'failed') {
        this.log('warn', 'Call connection failed');
        this.endCall('failed');
      } else if (state === 'disconnected') {
        this.log('warn', 'Call disconnected');
      }
    };
  }

  // ─── State Queries ──────────────────────────────────────────────────────

  get friendCount(): number {
    return this.friends.size;
  }

  get friendList(): FriendInfo[] {
    return [...this.friends.values()];
  }

  get pendingRequestList(): PendingRequest[] {
    return [...this.pendingRequests.values()];
  }

  get isRunning(): boolean {
    return this.running;
  }

  get messageTracker(): MessageTracker {
    return this._messageTracker;
  }

  get lastSentMessage(): TrackedMessage | null {
    return this._messageTracker.getLastSent();
  }

  get lastReceivedMessage(): TrackedMessage | null {
    return this._messageTracker.getLastReceived();
  }

  get messageHistory(): TrackedMessage[] {
    return this._messageTracker.getAll();
  }

  /**
   * Get all reactions for a specific message.
   */
  getReactionsForMessage(messageId: string): ReactionInfo[] {
    return this.reactions.get(messageId) ?? [];
  }

  /**
   * Get all tracked reactions across all messages.
   */
  get allReactions(): ReactionInfo[] {
    const all: ReactionInfo[] = [];
    for (const reactions of this.reactions.values()) {
      all.push(...reactions);
    }
    return all;
  }

  /**
   * Get all groups this bot is a member of.
   */
  get groupList(): GroupInfo[] {
    return [...this.groups.values()];
  }

  get groupCount(): number {
    return this.groups.size;
  }

  getGroup(groupId: string): GroupInfo | null {
    return this.groups.get(groupId) ?? null;
  }

  get pendingGroupInviteList(): PendingGroupInvite[] {
    return [...this.pendingGroupInvites.values()];
  }

  /**
   * Get typing users for a conversation.
   */
  getTypingUsers(conversationId: string): { did: string; startedAt: number }[] {
    return this.typingState.get(conversationId) ?? [];
  }

  /**
   * Check if a specific user is typing in a conversation.
   */
  isUserTyping(conversationId: string, did: string): boolean {
    const users = this.typingState.get(conversationId) ?? [];
    return users.some((u) => u.did === did);
  }

  /**
   * Get the tracked status of a sent message.
   */
  getMessageStatus(messageId: string): 'sent' | 'delivered' | 'read' | null {
    return this.messageStatuses.get(messageId) ?? null;
  }

  /**
   * Get the relay client (for advanced scenario use).
   */
  get relayClient(): RelayClient {
    return this.relay;
  }

  // ─── Internal ───────────────────────────────────────────────────────────

  private handleRelayMessage(msg: ServerMessage): void {
    if (msg.type === 'message') {
      this.handleIncomingEnvelope(msg.from_did, msg.payload);
    } else if (msg.type === 'offline_messages') {
      this.log('info', `Received ${msg.messages.length} offline message(s)`);
      for (const m of msg.messages) {
        this.handleIncomingEnvelope(m.from_did, m.payload);
      }
    } else if (msg.type === 'ack') {
      this.log('debug', `Relay ack: ${msg.id}`);
    } else if (msg.type === 'error') {
      this.log('error', `Relay error: ${msg.message}`);
    }
  }

  private handleIncomingEnvelope(fromDid: string, payloadStr: string): void {
    try {
      const envelope = JSON.parse(payloadStr);
      const type = envelope.envelope;

      switch (type) {
        case 'friend_request':
          this.handleFriendRequest(envelope.payload);
          break;
        case 'friend_response':
          this.handleFriendResponse(envelope.payload);
          break;
        case 'friend_accept_ack':
          this.handleFriendAcceptAck(envelope.payload);
          break;
        case 'chat_message':
          this.handleChatMessage(envelope.payload);
          break;
        case 'typing_indicator':
          this.handleTypingIndicator(envelope.payload);
          break;
        case 'call_offer':
          this.handleCallOffer(envelope.payload);
          break;
        case 'call_answer':
          this.handleCallAnswer(envelope.payload);
          break;
        case 'call_ice_candidate':
          this.handleCallIceCandidate(envelope.payload);
          break;
        case 'call_end':
          this.handleCallEnd(envelope.payload);
          break;
        case 'call_state':
          this.handleCallState(envelope.payload);
          break;
        case 'reaction_add':
          this.handleReactionAdd(envelope.payload);
          break;
        case 'reaction_remove':
          this.handleReactionRemove(envelope.payload);
          break;
        case 'message_status':
          this.handleMessageStatusReceipt(envelope.payload);
          break;
        case 'group_invite':
          this.handleGroupInviteEnvelope(envelope.payload);
          break;
        case 'group_invite_accept':
          this.handleGroupInviteAccept(envelope.payload);
          break;
        case 'group_invite_decline':
          this.handleGroupInviteDecline(envelope.payload);
          break;
        case 'group_message':
          this.handleGroupMessageEnvelope(envelope.payload);
          break;
        case 'group_key_rotation':
          this.handleGroupKeyRotation(envelope.payload);
          break;
        case 'group_member_removed':
          this.handleGroupMemberRemovedEnvelope(envelope.payload);
          break;
        default:
          this.log('debug', `Unhandled envelope type: ${type}`);
      }
    } catch (err) {
      this.log('warn', `Failed to parse envelope from ${fromDid.slice(0, 24)}...: ${err}`);
    }
  }

  private handleFriendRequest(payload: any): void {
    this.log('info', `Incoming friend request from ${payload.fromDisplayName ?? 'Unknown'} (${payload.fromDid?.slice(0, 24)}...)`);
    if (payload.message) {
      this.log('info', `  Message: "${payload.message}"`);
    }

    // Store as pending
    this.pendingRequests.set(payload.id, {
      id: payload.id,
      fromDid: payload.fromDid,
      fromDisplayName: payload.fromDisplayName ?? 'Unknown',
      fromSigningKey: payload.fromSigningKey ?? '',
      fromEncryptionKey: payload.fromEncryptionKey ?? '',
      message: payload.message,
      direction: 'incoming',
    });

    // Auto-accept if configured
    if (this.config.autoAcceptFriends) {
      this.log('info', 'Auto-accepting friend request...');
      this.acceptFriendRequest(payload.id);
    }
  }

  private handleFriendResponse(payload: any): void {
    if (!payload.accepted) {
      this.log('info', `Friend request ${payload.requestId} was rejected by ${payload.fromDid?.slice(0, 24)}...`);
      this.pendingRequests.delete(payload.requestId);
      return;
    }

    this.log('info', `Friend request accepted by ${payload.fromDisplayName ?? 'Unknown'} (${payload.fromDid?.slice(0, 24)}...)`);

    // Add as friend using their public keys
    const conversationId = computeConversationId(this.identity.did, payload.fromDid);
    this.friends.set(payload.fromDid, {
      did: payload.fromDid,
      displayName: payload.fromDisplayName ?? 'Unknown',
      signingKey: payload.fromSigningKey ?? '',
      encryptionKey: payload.fromEncryptionKey ?? '',
      conversationId,
      requestId: payload.requestId,
    });

    this.pendingRequests.delete(payload.requestId);

    // Send friend_accept_ack (second leg of two-phase sync)
    const ack = {
      envelope: 'friend_accept_ack',
      version: 1,
      payload: {
        senderDid: this.identity.did,
        timestamp: Date.now(),
      },
    };
    this.relay.sendEnvelope(payload.fromDid, ack);

    this.events.emit('friendAdded', { did: payload.fromDid, displayName: payload.fromDisplayName });
    this.log('info', `Friendship established! Conversation: ${conversationId.slice(0, 16)}...`);

    // Start periodic messages if configured and not already running
    if (this.config.messageIntervalMs > 0 && !this.messageTimer) {
      this.startPeriodicMessages();
    }
  }

  private handleFriendAcceptAck(payload: any): void {
    this.log('info', `Friend accept acknowledged by ${payload.senderDid?.slice(0, 24)}...`);
  }

  private handleChatMessage(payload: any): void {
    const friend = this.friends.get(payload.senderDid);
    if (!friend) {
      this.log('warn', `Message from unknown sender: ${payload.senderDid?.slice(0, 24)}...`);
      return;
    }

    try {
      const plaintext = decryptMessage(
        payload.contentEncrypted,
        payload.nonce,
        this.identity.encryptionPrivateKey,
        friend.encryptionKey,
        payload.senderDid,
        this.identity.did,
        payload.timestamp,
        friend.conversationId,
      );

      const threadInfo = payload.threadId ? ` (thread: ${payload.threadId.slice(0, 8)}...)` : '';
      this.log('info', `Message from ${friend.displayName}: "${plaintext}"${threadInfo} (id: ${payload.messageId?.slice(0, 8)}...)`);

      // Track incoming message
      this._messageTracker.trackReceived({
        messageId: payload.messageId,
        conversationId: payload.conversationId,
        content: plaintext,
        timestamp: payload.timestamp,
        senderDid: payload.senderDid,
        recipientDid: this.identity.did,
        threadId: payload.threadId,
      });

      const eventType = payload.threadId ? 'threadReplyReceived' : 'messageReceived';
      this.events.emit(eventType, {
        messageId: payload.messageId,
        senderDid: payload.senderDid,
        text: plaintext,
        threadId: payload.threadId,
      });

      // Auto-send delivery receipt
      this.sendMessageStatus(payload.messageId, friend.did, 'delivered');

      // Auto-send read receipt after a short delay
      setTimeout(() => {
        this.sendMessageStatus(payload.messageId, friend.did, 'read');
      }, 500 + Math.random() * 1500);

      // Auto-react if configured
      if (this.config.autoReact) {
        const emoji = this.config.reactionPool[
          Math.floor(Math.random() * this.config.reactionPool.length)
        ];
        setTimeout(() => {
          this.addReaction(payload.messageId, friend.did, emoji);
        }, 300 + Math.random() * 1000);
      }

      // Auto-thread reply if configured
      if (this.config.autoThread) {
        const parentId = payload.threadId ?? payload.messageId;
        setTimeout(() => {
          this.sendTypingIndicator(friend.did, true);
          setTimeout(() => {
            this.sendTypingIndicator(friend.did, false);
            this.sendThreadReply(parentId, friend.did, `Re: ${plaintext.slice(0, 50)}`);
          }, 800 + Math.random() * 1500);
        }, 500);
      }
      // Echo back if configured (and not auto-threading, to avoid double replies)
      else if (this.config.echoMessages) {
        setTimeout(() => {
          this.sendTypingIndicator(friend.did, true);
          setTimeout(() => {
            this.sendTypingIndicator(friend.did, false);
            if (payload.threadId) {
              this.sendThreadReply(payload.threadId, friend.did, `Echo: ${plaintext}`);
            } else {
              this.sendMessage(friend.did, `Echo: ${plaintext}`);
            }
          }, 1000 + Math.random() * 2000);
        }, 500);
      }
    } catch (err) {
      this.log('warn', `Failed to decrypt message from ${friend.displayName}: ${err}`);
    }
  }

  private handleTypingIndicator(payload: any): void {
    const friend = this.friends.get(payload.senderDid);
    const name = friend?.displayName ?? payload.senderName ?? 'Unknown';
    this.log('debug', `${name} ${payload.isTyping ? 'started' : 'stopped'} typing`);

    // Track typing state
    const convId = payload.conversationId;
    if (convId) {
      const existing = this.typingState.get(convId) ?? [];
      if (payload.isTyping) {
        const idx = existing.findIndex((t) => t.did === payload.senderDid);
        if (idx >= 0) {
          existing[idx].startedAt = Date.now();
        } else {
          existing.push({ did: payload.senderDid, startedAt: Date.now() });
        }
      } else {
        const idx = existing.findIndex((t) => t.did === payload.senderDid);
        if (idx >= 0) existing.splice(idx, 1);
      }
      this.typingState.set(convId, existing);
    }

    this.events.emit('typingIndicator', {
      conversationId: convId,
      senderDid: payload.senderDid,
      isTyping: payload.isTyping,
    });
  }

  private handleCallOffer(payload: any): void {
    this.log('info', `Incoming ${payload.callType} call from ${payload.senderDisplayName ?? 'Unknown'} (call: ${payload.callId?.slice(0, 12)}...)`);

    if (this.config.autoAcceptCalls) {
      this.log('info', 'Auto-accepting call...');
      this.acceptIncomingCall(
        payload.callId,
        payload.senderDid,
        payload.senderDisplayName ?? 'Unknown',
        payload.callType ?? 'voice',
        payload.conversationId,
        payload.sdp,
      );
    } else {
      // Store for manual acceptance
      this.pendingIncomingCalls.set(payload.callId, {
        callId: payload.callId,
        fromDid: payload.senderDid,
        fromName: payload.senderDisplayName ?? 'Unknown',
        callType: payload.callType ?? 'voice',
        conversationId: payload.conversationId,
        offerSdp: payload.sdp,
        receivedAt: Date.now(),
      });
      this.events.emit('incomingCall', {
        callId: payload.callId,
        fromDid: payload.senderDid,
        fromName: payload.senderDisplayName ?? 'Unknown',
        callType: payload.callType ?? 'voice',
      });
      this.log('info', 'Call stored for manual acceptance');
    }
  }

  private handleCallAnswer(payload: any): void {
    if (!this.activeCall || this.activeCall.callId !== payload.callId) {
      this.log('debug', `Ignoring call answer for unknown call: ${payload.callId}`);
      return;
    }

    this.log('info', 'Received call answer, completing handshake...');
    this.activeCall.status = 'connecting';

    this.activeCall.manager.completeHandshake(payload.sdp).catch((err) => {
      this.log('error', `Handshake failed: ${err}`);
      this.endCall('failed');
    });
  }

  private handleCallIceCandidate(payload: any): void {
    if (!this.activeCall || this.activeCall.callId !== payload.callId) return;

    this.activeCall.manager.addIceCandidate({
      candidate: payload.candidate,
      sdpMid: payload.sdpMid,
      sdpMLineIndex: payload.sdpMLineIndex,
    }).catch((err) => {
      this.log('warn', `Failed to add ICE candidate: ${err}`);
    });
  }

  private handleCallEnd(payload: any): void {
    if (!this.activeCall || this.activeCall.callId !== payload.callId) return;

    this.log('info', `Call ended by remote (${payload.reason ?? 'completed'})`);
    this.activeCall.manager.close();
    this.activeCall = null;
  }

  private handleCallState(payload: any): void {
    if (!this.activeCall || this.activeCall.callId !== payload.callId) return;
    this.log('debug', `Remote state update: muted=${payload.isMuted}, cameraOff=${payload.isCameraOff}`);

    if (payload.isMuted !== undefined) this.activeCall.remoteIsMuted = payload.isMuted;
    if (payload.isCameraOff !== undefined) this.activeCall.remoteIsCameraOff = payload.isCameraOff;

    this.events.emit('callStateUpdate', {
      callId: payload.callId,
      isMuted: payload.isMuted,
      isCameraOff: payload.isCameraOff,
    });
  }

  private handleReactionAdd(payload: any): void {
    const info: ReactionInfo = {
      messageId: payload.messageId,
      conversationId: payload.conversationId,
      emoji: payload.emoji,
      senderDid: payload.senderDid,
      timestamp: payload.timestamp ?? Date.now(),
    };

    const existing = this.reactions.get(payload.messageId) ?? [];
    existing.push(info);
    this.reactions.set(payload.messageId, existing);

    this.events.emit('reactionReceived', info);
    this.log('info', `Received ${payload.emoji} on message ${payload.messageId?.slice(0, 8)}... from ${payload.senderDid?.slice(0, 24)}...`);
  }

  private handleReactionRemove(payload: any): void {
    const existing = this.reactions.get(payload.messageId);
    if (existing) {
      const idx = existing.findIndex(
        (r) => r.emoji === payload.emoji && r.senderDid === payload.senderDid,
      );
      if (idx !== -1) existing.splice(idx, 1);
    }

    this.events.emit('reactionRemoved', {
      messageId: payload.messageId,
      emoji: payload.emoji,
      senderDid: payload.senderDid,
    });
    this.log('info', `${payload.emoji} removed from ${payload.messageId?.slice(0, 8)}... by ${payload.senderDid?.slice(0, 24)}...`);
  }

  private handleMessageStatusReceipt(payload: any): void {
    if (payload.messageId) {
      this.messageStatuses.set(payload.messageId, payload.status);
    }
    this.events.emit('statusReceived', {
      messageId: payload.messageId,
      status: payload.status,
    });
    this.log('debug', `Message ${payload.messageId?.slice(0, 8)}... marked as ${payload.status}`);
  }

  private handleGroupInviteEnvelope(payload: any): void {
    this.log('info', `Received group invite: "${payload.groupName}" from ${payload.inviterName}`);

    this.pendingGroupInvites.set(payload.inviteId, {
      inviteId: payload.inviteId,
      groupId: payload.groupId,
      groupName: payload.groupName,
      inviterDid: payload.inviterDid,
      inviterName: payload.inviterName,
      encryptedGroupKey: payload.encryptedGroupKey,
      nonce: payload.nonce,
      membersJson: payload.membersJson,
      timestamp: payload.timestamp ?? Date.now(),
    });

    if (this.config.autoAcceptGroupInvites) {
      this.log('info', 'Auto-accepting group invite...');
      this.acceptGroupInvite(payload.inviteId);
    }
  }

  private handleGroupInviteAccept(payload: any): void {
    const group = this.groups.get(payload.groupId);
    if (group) {
      if (!group.members.some((m) => m.did === payload.senderDid)) {
        group.members.push({
          did: payload.senderDid,
          displayName: payload.senderDisplayName ?? 'Unknown',
          role: 'member',
        });
      }
      this.events.emit('groupMemberAdded', { groupId: payload.groupId, did: payload.senderDid });
    }
    this.log('info', `${payload.senderDisplayName ?? 'Unknown'} accepted group invite for ${payload.groupId?.slice(0, 8)}...`);
  }

  private handleGroupInviteDecline(payload: any): void {
    this.log('info', `Group invite declined for ${payload.groupId?.slice(0, 8)}... by ${payload.senderDid?.slice(0, 24)}...`);
  }

  private handleGroupMessageEnvelope(payload: any): void {
    const group = this.groups.get(payload.groupId);
    if (!group) {
      this.log('warn', `Group message for unknown group: ${payload.groupId?.slice(0, 8)}...`);
      return;
    }

    // Simplified decryption (base64 decode)
    let plaintext: string;
    try {
      plaintext = Buffer.from(payload.ciphertext, 'base64').toString('utf-8');
    } catch {
      this.log('warn', `Failed to decrypt group message from ${payload.senderName}`);
      return;
    }

    this.log('info', `Group message in "${group.groupName}" from ${payload.senderName}: "${plaintext}"`);

    this._messageTracker.trackReceived({
      messageId: payload.messageId,
      conversationId: payload.conversationId ?? group.conversationId,
      content: plaintext,
      timestamp: payload.timestamp,
      senderDid: payload.senderDid,
      recipientDid: group.groupId,
    });

    this.events.emit('groupMessageReceived', {
      messageId: payload.messageId,
      groupId: payload.groupId,
      senderDid: payload.senderDid,
      text: plaintext,
    });
  }

  private handleGroupKeyRotation(payload: any): void {
    const group = this.groups.get(payload.groupId);
    if (!group) {
      this.log('warn', `Key rotation for unknown group: ${payload.groupId?.slice(0, 8)}...`);
      return;
    }

    group.groupKey = payload.encryptedKey;
    group.keyVersion = payload.keyVersion;

    this.events.emit('groupKeyRotated', { groupId: payload.groupId, keyVersion: payload.keyVersion });
    this.log('info', `Group key rotated for "${group.groupName}" to v${payload.keyVersion}`);
  }

  private handleGroupMemberRemovedEnvelope(payload: any): void {
    if (payload.removedDid === this.identity.did) {
      // We were removed
      const group = this.groups.get(payload.groupId);
      const name = group?.groupName ?? payload.groupId?.slice(0, 8);
      this.groups.delete(payload.groupId);
      this.log('info', `Removed from group "${name}"`);
      this.events.emit('groupMemberRemoved', { groupId: payload.groupId, memberDid: this.identity.did, self: true });
    } else {
      const group = this.groups.get(payload.groupId);
      if (group) {
        group.members = group.members.filter((m) => m.did !== payload.removedDid);
      }
      this.log('info', `Member ${payload.removedDid?.slice(0, 24)}... removed from group ${payload.groupId?.slice(0, 8)}...`);
      this.events.emit('groupMemberRemoved', { groupId: payload.groupId, memberDid: payload.removedDid, self: false });
    }
  }

  private startPeriodicMessages(): void {
    if (this.messageTimer) return;
    this.log('info', `Starting periodic messages every ${this.config.messageIntervalMs}ms`);
    this.messageTimer = setInterval(() => {
      if (this.friends.size > 0) {
        this.sendRandomMessage();
      }
    }, this.config.messageIntervalMs);
  }

  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) < levels.indexOf(this.config.logLevel)) return;

    const time = new Date().toLocaleTimeString();
    const prefix = `[${time}] [${this.config.name}]`;
    switch (level) {
      case 'debug': console.log(`\x1b[90m${prefix} ${message}\x1b[0m`); break;
      case 'info':  console.log(`\x1b[36m${prefix}\x1b[0m ${message}`); break;
      case 'warn':  console.log(`\x1b[33m${prefix} ⚠ ${message}\x1b[0m`); break;
      case 'error': console.log(`\x1b[31m${prefix} ✗ ${message}\x1b[0m`); break;
    }
  }
}
