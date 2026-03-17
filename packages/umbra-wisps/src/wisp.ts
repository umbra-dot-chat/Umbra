/**
 * Core Wisp class -- persona-driven AI agent on the Umbra relay.
 *
 * Manages identity, relay connection, friendships, encrypted messaging,
 * and LLM-powered conversation with history tracking.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RelayClient, type ServerMessage } from './relay-client.js';
import {
  encryptMessage, decryptMessage, computeConversationId, uuid,
  decryptGroupKey, encryptGroupMessage, decryptGroupMessage,
} from './crypto.js';
import type { WispIdentity } from './identity-store.js';
import type { WispPersona } from './personas.js';
import { type ChatMessage, type WispLLMClient } from './llm-client.js';
import { buildWispSystemPrompt, buildContextMessage } from './wisp-prompts.js';
import { WispCallHandler } from './calls/call-handler.js';
import type { BabbleLibrary } from './calls/babble-library.js';

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
  private callHandler: WispCallHandler;
  private friends: Map<string, WispFriend> = new Map();
  private groups: Map<string, WispGroup> = new Map();
  private conversationHistory: Map<string, ChatMessage[]> = new Map();
  private systemPrompt: string;
  private allPersonaNames: string[];
  private dataDir: string;
  private _running = false;
  private presenceInterval: ReturnType<typeof setInterval> | null = null;

  /** Callback invoked on user messages (for reactions/LLM). */
  onUserMessage?: (senderDid: string, messageId: string, conversationId: string) => void;

  /** Callback invoked on group messages from non-wisps (for group response). */
  onGroupMessage?: (senderDid: string, senderName: string, text: string, groupId: string) => void;

  constructor(
    identity: WispIdentity, persona: WispPersona,
    relayUrl: string, llm: WispLLMClient, allPersonaNames: string[],
    dataDir: string = './wisp-data',
  ) {
    this.identity = identity;
    this.persona = persona;
    this.llm = llm;
    this.allPersonaNames = allPersonaNames;
    this.dataDir = dataDir;
    this.systemPrompt = buildWispSystemPrompt(persona, allPersonaNames);
    this.relay = new RelayClient(relayUrl, identity.did);
    this.callHandler = new WispCallHandler(identity, this.relay, persona.name);
    this.loadPersistedState();
  }

  get running() { return this._running; }
  get friendCount() { return this.friends.size; }
  get did() { return this.identity.did; }
  get name() { return this.persona.name; }

  /** Expose relay client for voice handler wiring. */
  get relayClient(): RelayClient { return this.relay; }

  /** Expose identity for voice handler construction. */
  get wispIdentity(): WispIdentity { return this.identity; }

  /** Set the babble library for natural-sounding call audio. */
  setBabbleLibrary(lib: BabbleLibrary): void {
    this.callHandler.setBabbleLibrary(lib);
  }

  async start(): Promise<void> {
    await this.relay.connect();
    this.relay.enableReconnect(Infinity, 2000);
    this.relay.onMessage((msg) => this.handleRelayMessage(msg));
    this.relay.fetchOffline();
    this._running = true;
    console.log(`[${this.persona.name}] Connected as ${this.identity.did.slice(0, 24)}...`);
    // Broadcast presence to all friends and re-broadcast every 60s
    this.broadcastPresence();
    this.presenceInterval = setInterval(() => this.broadcastPresence(), 60_000);
  }

  stop(): void {
    this._running = false;
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    this.callHandler.cleanup();
    this.relay.disconnect();
  }

  // -- Presence --

  private broadcastPresence(): void {
    for (const friend of this.friends.values()) {
      this.relay.sendEnvelope(friend.did, {
        envelope: 'presence_online', version: 1,
        payload: { timestamp: Date.now() },
      });
    }
  }

  private sendPresenceAck(toDid: string): void {
    this.relay.sendEnvelope(toDid, {
      envelope: 'presence_ack', version: 1,
      payload: { timestamp: Date.now() },
    });
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
  addFriend(friend: WispFriend): void { this.friends.set(friend.did, friend); this.persistState(); }
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
      envelope: 'chat_message', version: 1,
      payload: {
        messageId: uuid(), conversationId: friend.conversationId,
        senderDid: this.identity.did, timestamp,
        contentEncrypted: ciphertext, nonce,
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

  // -- Call Initiation (v1: stub, no real WebRTC) --

  initiateCall(toDid: string, callType: 'voice' | 'video' = 'voice'): void {
    const callId = uuid();
    const friend = this.friends.get(toDid);
    this.relay.sendEnvelope(toDid, {
      envelope: 'call_offer', version: 1,
      payload: {
        callId, sdp: '', sdpType: 'offer', callType,
        senderDid: this.identity.did,
        senderDisplayName: this.persona.name,
        conversationId: friend?.conversationId ?? '',
      },
    });
    console.log(`[${this.persona.name}] Initiated ${callType} call to ${toDid.slice(0, 20)}...`);
  }

  // -- Group Messaging --

  sendGroupMessage(groupId: string, text: string): void {
    const group = this.groups.get(groupId);
    if (!group) return;
    const timestamp = Date.now();
    const { ciphertext, nonce } = encryptGroupMessage(
      text, group.groupKey, groupId, this.identity.did, timestamp,
    );
    const msgId = uuid();
    for (const member of group.members) {
      if (member.did === this.identity.did) continue;
      this.relay.sendEnvelope(member.did, {
        envelope: 'group_message', version: 1,
        payload: {
          // camelCase fields for GroupMessagePayload type in the app
          messageId: msgId,
          groupId,
          conversationId: group.conversationId,
          senderDid: this.identity.did,
          senderName: this.persona.name,
          ciphertext,  // Already hex from updated crypto
          nonce,
          keyVersion: 1,
          timestamp,
        },
      });
    }
    this.appendHistory(group.conversationId, 'assistant', text);
  }

  /** Add this wisp to a group directly (used by orchestrator). */
  addGroup(group: WispGroup): void {
    this.groups.set(group.groupId, group);
    this.persistState();
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
      this.handleIncomingEnvelope(msg.payload, msg.from_did);
    } else if (msg.type === 'offline_messages') {
      for (const m of msg.messages) this.handleIncomingEnvelope(m.payload, m.from_did);
    }
  }

  private handleIncomingEnvelope(payloadStr: string, fromDid?: string): void {
    try {
      const envelope = JSON.parse(payloadStr);
      switch (envelope.envelope) {
        case 'friend_request':
          this.handleFriendRequest(envelope.payload);
          break;
        case 'friend_response':
          this.handleFriendResponse(envelope.payload);
          break;
        case 'chat_message':
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
          void this.callHandler.handleOffer(envelope.payload);
          break;
        case 'call_answer':
          break; // Wisps don't initiate calls yet
        case 'call_ice_candidate':
          this.callHandler.handleIceCandidate(envelope.payload);
          break;
        case 'call_end':
          this.callHandler.handleEnd(envelope.payload);
          break;
        case 'presence_online':
          if (fromDid) this.sendPresenceAck(fromDid);
          break;
        case 'presence_ack':
          break; // No action needed, client already marks sender online
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
    this.persistState();
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
    this.persistState();
    console.log(`[${this.persona.name}] Now friends with ${p.fromDisplayName}`);
  }

  private async handleEncryptedMessage(payload: {
    messageId?: string; id?: string;
    senderDid?: string; from?: string;
    conversationId: string;
    contentEncrypted?: string; ciphertext?: string;
    nonce: string; timestamp: number;
  }): Promise<void> {
    const senderDid = payload.senderDid ?? payload.from ?? '';
    const messageId = payload.messageId ?? payload.id ?? '';
    const ciphertext = payload.contentEncrypted ?? payload.ciphertext ?? '';
    const friend = this.friends.get(senderDid);
    if (!friend) return;
    try {
      const plaintext = decryptMessage(
        ciphertext, payload.nonce,
        this.identity.encryptionPrivateKey, friend.encryptionKey,
        senderDid, this.identity.did, payload.timestamp, payload.conversationId,
      );
      console.log(`[${this.persona.name}] From ${friend.displayName}: ${plaintext.slice(0, 50)}...`);
      this.onUserMessage?.(senderDid, messageId, payload.conversationId);
      // Generate LLM response after natural delay (1-3s)
      const delay = 1000 + Math.random() * 2000;
      setTimeout(async () => {
        try {
          this.sendTypingIndicator(senderDid, true);
          const response = await this.generateResponse(
            friend.displayName, plaintext, payload.conversationId,
          );
          this.sendTypingIndicator(senderDid, false);
          await this.sendMessage(senderDid, response);
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
    inviterEncryptionKey?: string;
  }): void {
    try {
      // Accept invites from ANY user (friend or not) as long as decryptable
      const inviter = this.friends.get(p.inviterDid);
      const inviterKey = inviter?.encryptionKey ?? p.inviterEncryptionKey;
      if (!inviterKey) {
        console.warn(`[${this.persona.name}] Cannot decrypt group invite from ${p.inviterName} -- no encryption key`);
        return;
      }
      const groupKey = decryptGroupKey(
        p.encryptedGroupKey, p.nonce,
        this.identity.encryptionPrivateKey, inviterKey,
        p.groupId,
      );
      const members = JSON.parse(p.membersJson) as { did: string; displayName: string }[];
      this.groups.set(p.groupId, {
        groupId: p.groupId, groupName: p.groupName,
        groupKey, members, conversationId: `group-${p.groupId}`,
      });
      // Send acceptance (both envelope types for compat with real app)
      for (const env of ['group_invite_response', 'group_invite_accept'] as const) {
        this.relay.sendEnvelope(p.inviterDid, {
          envelope: env, version: 1,
          payload: {
            inviteId: p.inviteId, groupId: p.groupId, accepted: true,
            fromDid: this.identity.did,
            fromDisplayName: this.persona.name,
            timestamp: Date.now(),
          },
        });
      }
      this.persistState();
      console.log(`[${this.persona.name}] Joined group "${p.groupName}" (invited by ${p.inviterName})`);

      // Send a brief introduction message after a staggered delay (2-5s)
      const introDelay = 2000 + Math.random() * 3000;
      setTimeout(() => {
        void this.sendGroupIntroduction(p.groupId, p.groupName);
      }, introDelay);
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to handle group invite:`, err);
    }
  }

  private async sendGroupIntroduction(groupId: string, groupName: string): Promise<void> {
    try {
      const prompt = `You just joined a group chat called "${groupName}". Introduce yourself briefly in 1-2 sentences, staying in character.`;
      const response = await this.generateResponse('System', prompt, `group-${groupId}`);
      this.sendGroupMessage(groupId, response);
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to send group introduction:`, err);
    }
  }

  private handleGroupMessage(p: {
    messageId: string; groupId: string; senderDid: string;
    senderName: string; ciphertext: string; nonce: string; timestamp: number;
  }): void {
    const group = this.groups.get(p.groupId);
    if (!group) return;
    try {
      const plaintext = decryptGroupMessage(
        p.ciphertext, p.nonce, group.groupKey,
        p.groupId, p.senderDid, p.timestamp,
      );
      this.appendHistory(group.conversationId, 'user', `${p.senderName}: ${plaintext}`);
      // Notify orchestrator for group response coordination
      this.onGroupMessage?.(p.senderDid, p.senderName, plaintext, p.groupId);
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to decrypt group message:`, err);
    }
  }

  /** Generate a response and send it to a group. */
  async generateAndSendGroupMessage(senderName: string, text: string, groupId: string): Promise<void> {
    try {
      const response = await this.generateResponse(senderName, text, groupId);
      this.sendGroupMessage(groupId, response);
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to respond in group:`, err);
    }
  }

  // -- State Persistence --

  private get statePath(): string {
    return join(this.dataDir, this.persona.name, 'state.json');
  }

  private loadPersistedState(): void {
    try {
      if (!existsSync(this.statePath)) return;
      const raw = JSON.parse(readFileSync(this.statePath, 'utf-8')) as {
        friends?: WispFriend[];
        groups?: WispGroup[];
      };
      if (raw.friends) {
        for (const f of raw.friends) this.friends.set(f.did, f);
        console.log(`[${this.persona.name}] Restored ${raw.friends.length} friends from disk`);
      }
      if (raw.groups) {
        for (const g of raw.groups) this.groups.set(g.groupId, g);
        console.log(`[${this.persona.name}] Restored ${raw.groups.length} groups from disk`);
      }
    } catch { /* ignore corrupt state */ }
  }

  persistState(): void {
    try {
      const data = {
        friends: Array.from(this.friends.values()),
        groups: Array.from(this.groups.values()),
      };
      writeFileSync(this.statePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn(`[${this.persona.name}] Failed to persist state:`, err);
    }
  }

}
