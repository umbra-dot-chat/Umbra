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

import {
  type BotIdentity,
  createIdentity,
  encryptMessage,
  decryptMessage,
  computeConversationId,
  uuid,
} from './crypto.js';
import { RelayClient, type ServerMessage } from './relay.js';

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

export interface BotConfig {
  /** Relay WebSocket URL */
  relayUrl: string;
  /** Bot display name */
  name: string;
  /** Auto-accept incoming friend requests */
  autoAcceptFriends: boolean;
  /** Interval (ms) between periodic messages (0 = disabled) */
  messageIntervalMs: number;
  /** Pool of messages to send randomly */
  messagePool: string[];
  /** Whether to echo received messages back */
  echoMessages: boolean;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const DEFAULT_CONFIG: BotConfig = {
  relayUrl: 'wss://relay.deepspaceshipping.co/ws',
  name: 'TestBot',
  autoAcceptFriends: true,
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
  logLevel: 'info',
};

// ─────────────────────────────────────────────────────────────────────────────
// TestBot
// ─────────────────────────────────────────────────────────────────────────────

export class TestBot {
  readonly identity: BotIdentity;
  readonly config: BotConfig;
  private relay: RelayClient;
  private friends: Map<string, FriendInfo> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private messageTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

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

    this.log('info', `Accepted friend request from ${req.fromDisplayName} (${req.fromDid.slice(0, 24)}...)`);
    this.log('info', `Conversation ID: ${conversationId.slice(0, 16)}...`);

    // Start periodic messages if we now have friends
    if (this.config.messageIntervalMs > 0 && !this.messageTimer) {
      this.startPeriodicMessages();
    }
  }

  // ─── Messaging ──────────────────────────────────────────────────────────

  /**
   * Send an encrypted message to a friend.
   */
  sendMessage(friendDid: string, text: string): void {
    const friend = this.friends.get(friendDid);
    if (!friend) {
      this.log('warn', `Cannot send message: ${friendDid.slice(0, 24)}... is not a friend`);
      return;
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
    this.log('info', `Sent message to ${friend.displayName}: "${text}"`);
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
   */
  createGroupAndInviteAll(groupName: string): string {
    const groupId = uuid();
    const friendList = [...this.friends.values()];

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
          encryptedGroupKey: 'test-group-key', // Simplified for testing
          nonce: '000000000000000000000000',
          membersJson: JSON.stringify(
            friendList.map((f) => ({
              did: f.did,
              displayName: f.displayName,
              role: 'member',
            })),
          ),
          timestamp: Date.now(),
        },
      };
      this.relay.sendEnvelope(friend.did, envelope);
    }

    this.log('info', `Created group "${groupName}" (${groupId.slice(0, 8)}...) and invited ${friendList.length} friend(s)`);
    return groupId;
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
        case 'group_invite':
          this.log('info', `Received group invite: "${envelope.payload.groupName}" from ${envelope.payload.inviterName}`);
          break;
        case 'group_message':
          this.log('info', `Group message in ${envelope.payload.groupId?.slice(0, 8)}... from ${envelope.payload.senderName}`);
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
      );

      this.log('info', `Message from ${friend.displayName}: "${plaintext}"`);

      // Echo back if configured
      if (this.config.echoMessages) {
        setTimeout(() => {
          this.sendTypingIndicator(friend.did, true);
          setTimeout(() => {
            this.sendTypingIndicator(friend.did, false);
            this.sendMessage(friend.did, `Echo: ${plaintext}`);
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
