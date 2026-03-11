/**
 * Core Wisp class -- identity, relay connection, and friend management.
 *
 * A Wisp is a persona-driven AI agent that connects to the Umbra relay,
 * manages friendships, and can send/receive encrypted messages.
 * LLM integration is added separately by the orchestrator.
 */

import { RelayClient, type ServerMessage } from './relay-client.js';
import { computeConversationId, uuid } from './crypto.js';
import type { WispIdentity } from './identity-store.js';
import type { WispPersona } from './personas.js';

export interface WispFriend {
  did: string;
  displayName: string;
  signingKey: string;
  encryptionKey: string;
  conversationId: string;
}

export class Wisp {
  readonly identity: WispIdentity;
  readonly persona: WispPersona;
  private relay: RelayClient;
  private friends: Map<string, WispFriend> = new Map();
  private _running = false;

  /** Callback invoked on user messages (for reactions/LLM). */
  onUserMessage?: (senderDid: string, messageId: string, conversationId: string) => void;

  constructor(identity: WispIdentity, persona: WispPersona, relayUrl: string) {
    this.identity = identity;
    this.persona = persona;
    this.relay = new RelayClient(relayUrl, identity.did);
  }

  get running() { return this._running; }
  get friendCount() { return this.friends.size; }
  get did() { return this.identity.did; }
  get name() { return this.persona.name; }

  async start(): Promise<void> {
    await this.relay.connect();
    this.relay.enableReconnect(Infinity, 2000);
    this.relay.onMessage((msg) => this.handleRelayMessage(msg));
    this.relay.fetchOffline();
    this._running = true;
    console.log(`[${this.persona.name}] Connected as ${this.identity.did.slice(0, 24)}...`);
  }

  stop(): void {
    this._running = false;
    this.relay.disconnect();
  }

  // -- Friend Management --

  sendFriendRequest(toDid: string): void {
    this.relay.sendEnvelope(toDid, {
      envelope: 'friend_request',
      version: 1,
      payload: {
        id: uuid(),
        fromDid: this.identity.did,
        fromDisplayName: this.persona.name,
        fromSigningKey: this.identity.signingPublicKey,
        fromEncryptionKey: this.identity.encryptionPublicKey,
        message: `Hey! I'm ${this.persona.name}, the ${this.persona.title} ${this.persona.emoji}`,
        createdAt: Date.now(),
      },
    });
  }

  hasFriend(did: string): boolean { return this.friends.has(did); }
  addFriend(friend: WispFriend): void { this.friends.set(friend.did, friend); }
  getFriend(did: string): WispFriend | undefined { return this.friends.get(did); }

  // -- Relay Dispatch --

  private handleRelayMessage(msg: ServerMessage): void {
    if (msg.type === 'message') {
      this.handleIncomingEnvelope(msg.payload);
    } else if (msg.type === 'offline_messages') {
      for (const m of msg.messages) this.handleIncomingEnvelope(m.payload);
    }
  }

  private handleIncomingEnvelope(payloadStr: string): void {
    try {
      const envelope = JSON.parse(payloadStr);
      switch (envelope.envelope) {
        case 'friend_request':
          this.handleFriendRequest(envelope.payload);
          break;
        case 'friend_response':
          this.handleFriendResponse(envelope.payload);
          break;
      }
    } catch { /* ignore parse errors */ }
  }

  private handleFriendRequest(p: {
    id: string; fromDid: string; fromDisplayName: string;
    fromSigningKey: string; fromEncryptionKey: string;
  }): void {
    const conversationId = computeConversationId(this.identity.did, p.fromDid);
    this.friends.set(p.fromDid, {
      did: p.fromDid, displayName: p.fromDisplayName,
      signingKey: p.fromSigningKey, encryptionKey: p.fromEncryptionKey, conversationId,
    });
    this.relay.sendEnvelope(p.fromDid, {
      envelope: 'friend_response', version: 1,
      payload: {
        requestId: p.id, fromDid: this.identity.did,
        fromDisplayName: this.persona.name,
        fromSigningKey: this.identity.signingPublicKey,
        fromEncryptionKey: this.identity.encryptionPublicKey,
        accepted: true, timestamp: Date.now(),
      },
    });
    console.log(`[${this.persona.name}] Accepted friend request from ${p.fromDisplayName}`);
  }

  private handleFriendResponse(p: {
    accepted: boolean; fromDid: string; fromDisplayName: string;
    fromSigningKey: string; fromEncryptionKey: string;
  }): void {
    if (!p.accepted) return;
    const conversationId = computeConversationId(this.identity.did, p.fromDid);
    this.friends.set(p.fromDid, {
      did: p.fromDid, displayName: p.fromDisplayName,
      signingKey: p.fromSigningKey, encryptionKey: p.fromEncryptionKey, conversationId,
    });
    console.log(`[${this.persona.name}] Now friends with ${p.fromDisplayName}`);
  }
}
