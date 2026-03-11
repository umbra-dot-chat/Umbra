/**
 * Core Wisp class -- persona-driven AI agent on the Umbra relay.
 *
 * Manages identity, relay connection, friendships, encrypted messaging,
 * and LLM-powered conversation with history tracking.
 */

import { RelayClient, type ServerMessage } from './relay-client.js';
import {
  encryptMessage, decryptMessage, computeConversationId, uuid,
  decryptGroupKey, encryptGroupMessage, decryptGroupMessage,
} from './crypto.js';
import type { WispIdentity } from './identity-store.js';
import type { WispPersona } from './personas.js';
import { type ChatMessage, type WispLLMClient } from './llm-client.js';
import { buildWispSystemPrompt, buildContextMessage } from './wisp-prompts.js';

export interface WispFriend {
  did: string;
  displayName: string;
  signingKey: string;
  encryptionKey: string;
  conversationId: string;
}

export interface WispGroup {
  groupId: string;
  groupName: string;
  groupKey: string; // Shared AES-256 key (hex)
  members: { did: string; displayName: string }[];
  conversationId: string;
}

export class Wisp {
  readonly identity: WispIdentity;
  readonly persona: WispPersona;
  private relay: RelayClient;
  private llm: WispLLMClient;
  private friends: Map<string, WispFriend> = new Map();
  private groups: Map<string, WispGroup> = new Map();
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private systemPrompt: string;
  private allPersonaNames: string[];
  private _running = false;

  /** Callback invoked on user messages (for reactions/LLM). */
  onUserMessage?: (senderDid: string, messageId: string, conversationId: string) => void;

  constructor(
    identity: WispIdentity, persona: WispPersona,
    relayUrl: string, llm: WispLLMClient, allPersonaNames: string[],
  ) {
    this.identity = identity;
    this.persona = persona;
    this.llm = llm;
    this.allPersonaNames = allPersonaNames;
    this.systemPrompt = buildWispSystemPrompt(persona, allPersonaNames);
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
  getGroup(groupId: string): WispGroup | undefined { return this.groups.get(groupId); }
  getGroups(): WispGroup[] { return Array.from(this.groups.values()); }

  // -- Message Sending --

  async sendMessage(toDid: string, text: string): Promise<void> {
    const friend = this.friends.get(toDid);
    if (!friend) return;
    const timestamp = Date.now();
    const { ciphertext, nonce } = encryptMessage(
      text, this.identity.encryptionPrivateKey, friend.encryptionKey,
      this.identity.did, toDid, timestamp, friend.conversationId,
    );
    this.relay.sendEnvelope(toDid, {
      envelope: 'encrypted_message', version: 1,
      payload: {
        id: uuid(), conversationId: friend.conversationId,
        from: this.identity.did, to: toDid, timestamp,
        ciphertext, nonce, senderDisplayName: this.persona.name,
      },
    });
    this.appendHistory(friend.conversationId, 'assistant', text);
  }

  sendTypingIndicator(toDid: string, isTyping: boolean): void {
    const friend = this.friends.get(toDid);
    if (!friend) return;
    this.relay.sendEnvelope(toDid, {
      envelope: 'typing_indicator', version: 1,
      payload: {
        conversationId: friend.conversationId,
        from: this.identity.did, isTyping, timestamp: Date.now(),
      },
    });
  }

  sendReaction(toDid: string, messageId: string, emoji: string): void {
    const friend = this.friends.get(toDid);
    if (!friend) return;
    this.relay.sendEnvelope(toDid, {
      envelope: 'reaction_add', version: 1,
      payload: {
        messageId, conversationId: friend.conversationId,
        from: this.identity.did, emoji, timestamp: Date.now(),
      },
    });
  }

  // -- Group Messaging --

  sendGroupMessage(groupId: string, text: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;
    const { ciphertext, nonce } = encryptGroupMessage(text, group.groupKey);
    for (const member of group.members) {
      if (member.did === this.identity.did) continue;
      this.relay.sendEnvelope(member.did, {
        envelope: 'group_message', version: 1,
        payload: {
          id: uuid(), groupId, conversationId: group.conversationId,
          from: this.identity.did,
          senderDisplayName: this.persona.name,
          timestamp: Date.now(), ciphertext, nonce,
        },
      });
    }
    this.appendHistory(group.conversationId, 'assistant', text);
  }

  /** Add this wisp to a group directly (used by orchestrator). */
  addGroup(group: WispGroup): void {
    this.groups.set(group.groupId, group);
  }

  /** Send a raw envelope via this wisp's relay (used by orchestrator). */
  sendRawEnvelope(toDid: string, envelope: object): void {
    this.relay.sendEnvelope(toDid, envelope);
  }

  // -- LLM Response --

  async generateResponse(senderName: string, text: string, conversationId: string): Promise<string> {
    const history = this.conversationHistory.get(conversationId) ?? [];
    const context = buildContextMessage(senderName, this.persona);
    const messages: ChatMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'system', content: context },
      ...history.slice(-10),
      { role: 'user', content: text },
    ];
    const response = await this.llm.chat(messages);
    this.appendHistory(conversationId, 'user', text);
    this.appendHistory(conversationId, 'assistant', response);
    return response;
  }

  private appendHistory(conversationId: string, role: 'user' | 'assistant', content: string): void {
    if (!this.conversationHistory.has(conversationId)) {
      this.conversationHistory.set(conversationId, []);
    }
    const history = this.conversationHistory.get(conversationId)!;
    history.push({ role, content });
    if (history.length > 20) history.splice(0, history.length - 20);
  }

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
        case 'encrypted_message':
          void this.handleEncryptedMessage(envelope.payload);
          break;
        case 'group_invite':
          this.handleGroupInvite(envelope.payload);
          break;
        case 'group_message':
          this.handleGroupMessage(envelope.payload);
          break;
        case 'call_offer':
          this.handleCallOffer(envelope.payload);
          break;
        case 'call_end':
          this.handleCallEnd(envelope.payload);
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

  private async handleEncryptedMessage(payload: {
    id: string; from: string; conversationId: string;
    ciphertext: string; nonce: string; timestamp: number;
  }): Promise<void> {
    const friend = this.friends.get(payload.from);
    if (!friend) return;
    try {
      const plaintext = decryptMessage(
        payload.ciphertext, payload.nonce,
        this.identity.encryptionPrivateKey, friend.encryptionKey,
        payload.from, this.identity.did, payload.timestamp, payload.conversationId,
      );
      console.log(`[${this.persona.name}] From ${friend.displayName}: ${plaintext.slice(0, 50)}...`);
      this.onUserMessage?.(payload.from, payload.id, payload.conversationId);
      // Generate LLM response after natural delay (1-3s)
      const delay = 1000 + Math.random() * 2000;
      setTimeout(async () => {
        try {
          this.sendTypingIndicator(payload.from, true);
          const response = await this.generateResponse(
            friend.displayName, plaintext, payload.conversationId,
          );
          this.sendTypingIndicator(payload.from, false);
          await this.sendMessage(payload.from, response);
        } catch (err) {
          console.warn(`[${this.persona.name}] Failed to respond:`, err);
        }
      }, delay);
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to decrypt message:`, err);
    }
  }

  private handleGroupInvite(p: {
    inviteId: string; groupId: string; groupName: string;
    inviterDid: string; inviterName: string;
    encryptedGroupKey: string; nonce: string;
    membersJson: string; timestamp: number;
  }): void {
    try {
      const inviter = this.friends.get(p.inviterDid);
      if (!inviter) return; // Must be friends to accept group invites
      const groupKey = decryptGroupKey(
        p.encryptedGroupKey, p.nonce,
        this.identity.encryptionPrivateKey, inviter.encryptionKey,
      );
      const members = JSON.parse(p.membersJson) as { did: string; displayName: string }[];
      this.groups.set(p.groupId, {
        groupId: p.groupId, groupName: p.groupName,
        groupKey, members, conversationId: p.groupId,
      });
      // Send acceptance
      this.relay.sendEnvelope(p.inviterDid, {
        envelope: 'group_invite_response', version: 1,
        payload: {
          inviteId: p.inviteId, groupId: p.groupId, accepted: true,
          fromDid: this.identity.did,
          fromDisplayName: this.persona.name,
          timestamp: Date.now(),
        },
      });
      console.log(`[${this.persona.name}] Joined group "${p.groupName}"`);
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to handle group invite:`, err);
    }
  }

  private handleGroupMessage(p: {
    id: string; groupId: string; from: string;
    senderDisplayName: string; ciphertext: string; nonce: string;
  }): void {
    const group = this.groups.get(p.groupId);
    if (!group) return;
    try {
      const plaintext = decryptGroupMessage(p.ciphertext, p.nonce, group.groupKey);
      console.log(`[${this.persona.name}] Group "${group.groupName}" from ${p.senderDisplayName}: ${plaintext.slice(0, 50)}...`);
      this.appendHistory(group.conversationId, 'user', plaintext);
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to decrypt group message:`, err);
    }
  }

  // -- Call Signaling (v1: stub, no real WebRTC) --

  private handleCallOffer(p: {
    callId: string; sdp: string; callType: string;
    senderDid: string; conversationId: string;
  }): void {
    console.log(`[${this.persona.name}] Incoming ${p.callType} call from ${p.senderDid.slice(0, 20)}...`);
    // v1: auto-end after 3s (simulates brief answer then hangup)
    setTimeout(() => {
      this.relay.sendEnvelope(p.senderDid, {
        envelope: 'call_end', version: 1,
        payload: {
          callId: p.callId, reason: 'completed',
          endedBy: this.identity.did, timestamp: Date.now(),
        },
      });
      console.log(`[${this.persona.name}] Ended call ${p.callId.slice(0, 12)}...`);
    }, 3000);
  }

  private handleCallEnd(p: { callId: string; reason: string }): void {
    console.log(`[${this.persona.name}] Call ${p.callId.slice(0, 12)}... ended: ${p.reason}`);
  }
}
