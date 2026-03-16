/**
 * WispOrchestrator -- spawns and manages a swarm of Wisp instances.
 *
 * Handles lifecycle (start/stop), persona assignment, and provides
 * a status summary for monitoring.
 */

import { join } from 'node:path';
import { Wisp, type WispGroup } from './wisp.js';
import { WispLLMClient } from './llm-client.js';
import { loadOrCreateWispIdentity } from './identity-store.js';
import { DEFAULT_PERSONAS, type WispPersona } from './personas.js';
import { ConversationLoop } from './conversation-loop.js';
import { maybeReact } from './reactions.js';
import { uuid, encryptGroupKey } from './crypto.js';
import { randomBytes } from '@noble/ciphers/webcrypto';
import { bytesToHex } from '@noble/curves/abstract/utils';
import { runScenario, getScenario, listScenarios } from './scenarios/index.js';
import { startHealthServer } from './health-server.js';
import { CommunityActivity, type CommunityInfo, type RecentMessage } from './community-activity.js';
import { PresenceScheduler, type WispShift } from './presence-scheduler.js';
import { VoiceBabbleHandler } from './calls/voice-babble.js';
import { BabbleLibrary } from './calls/babble-library.js';
import type { Server } from 'node:http';

// Register all built-in scenarios (side-effect imports)
import './scenarios/dm-conversation.js';
import './scenarios/group-chat.js';
import './scenarios/friend-storm.js';
import './scenarios/debate.js';
import './scenarios/community-chat.js';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export interface OrchestratorConfig {
  relayUrl: string;
  ollamaUrl: string;
  model: string;
  count: number;
  dataDir: string;
  httpPort: number;
}

export class WispOrchestrator {
  private wisps: Map<string, Wisp> = new Map();
  private llm: WispLLMClient;
  private config: OrchestratorConfig;
  private conversationLoop: ConversationLoop | null = null;
  private communityActivity: CommunityActivity | null = null;
  private presenceScheduler: PresenceScheduler | null = null;
  private babbleLibrary: BabbleLibrary | null = null;
  private voiceHandlers: Map<string, VoiceBabbleHandler> = new Map();
  private httpServer: Server | null = null;
  private _running = false;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.llm = new WispLLMClient(config.ollamaUrl, config.model);
  }

  get running() { return this._running; }

  async start(): Promise<void> {
    console.log(`[Orchestrator] Starting ${this.config.count} wisps...`);
    const personas = DEFAULT_PERSONAS.slice(0, this.config.count);
    const allNames = personas.map(p => p.name);
    for (const persona of personas) {
      await this.spawnWisp(persona, allNames);
    }
    this._running = true;

    // Initialize babble library for voice channel support
    this.babbleLibrary = new BabbleLibrary(join(import.meta.dirname, '..', 'babble'));
    await this.babbleLibrary.load();

    // Wire babble library into each wisp's call handler for natural audio
    for (const wisp of this.wisps.values()) {
      wisp.setBabbleLibrary(this.babbleLibrary);
    }

    this.conversationLoop = new ConversationLoop(() => this.getWisps());
    this.conversationLoop.start();
    this.httpServer = startHealthServer(this, this.config.httpPort);
    console.log(`[Orchestrator] ${this.wisps.size} wisps active`);
  }

  async stop(): Promise<void> {
    this.conversationLoop?.stop();
    this.presenceScheduler?.stop();
    this.presenceScheduler = null;
    this.communityActivity?.stop();
    this.communityActivity = null;
    for (const handler of this.voiceHandlers.values()) handler.leaveChannel();
    this.voiceHandlers.clear();
    this.httpServer?.close();
    this.httpServer = null;
    for (const wisp of this.wisps.values()) wisp.stop();
    this.wisps.clear();
    this._running = false;
    console.log('[Orchestrator] All wisps stopped');
  }

  async spawnWisp(persona: WispPersona, allNames: string[]): Promise<Wisp> {
    const identity = loadOrCreateWispIdentity(this.config.dataDir, persona.name);
    const wisp = new Wisp(identity, persona, this.config.relayUrl, this.llm, allNames, this.config.dataDir);
    wisp.onUserMessage = (senderDid, messageId) => {
      maybeReact(this.getWisps(), senderDid, messageId);
    };
    wisp.onGroupMessage = (senderDid, senderName, text, groupId) => {
      this.handleGroupResponse(wisp, senderDid, senderName, text, groupId);
    };

    // Route relay call events to voice handlers
    wisp.relayClient.onMessage((msg) => {
      if (msg.type !== 'message') return;
      try {
        const envelope = JSON.parse(msg.payload);
        const eventType = envelope.envelope ?? envelope.type;
        if (
          eventType === 'callRoomCreated' ||
          eventType === 'callParticipantJoined' ||
          eventType === 'callParticipantLeft' ||
          eventType === 'callSignalForward'
        ) {
          const handler = this.voiceHandlers.get(persona.name);
          handler?.handleCallEvent({ type: eventType, payload: envelope.payload ?? envelope });
        }
      } catch { /* ignore parse errors */ }
    });

    // Wire babble library if already loaded
    if (this.babbleLibrary) {
      wisp.setBabbleLibrary(this.babbleLibrary);
    }

    await wisp.start();
    this.wisps.set(persona.name, wisp);
    return wisp;
  }

  /**
   * Coordinate group responses: 1-2 random wisps reply to each group message.
   * 10% chance no wisp responds (feels natural). Only the first wisp
   * alphabetically coordinates to avoid duplicate responses.
   */
  private handleGroupResponse(
    receiver: Wisp, senderDid: string, senderName: string, text: string, groupId: string,
  ): void {
    // Only let ONE wisp handle the coordination (first alphabetically that has the group)
    const allWisps = this.getWisps().filter(w => w.getGroup(groupId));
    if (allWisps.length === 0) return;
    allWisps.sort((a, b) => a.name.localeCompare(b.name));
    if (allWisps[0].name !== receiver.name) return; // Only first wisp coordinates

    // 10% chance nobody responds (natural group behavior)
    if (Math.random() < 0.1) return;

    this.dispatchGroupResponders(senderDid, senderName, text, groupId, allWisps);
  }

  /**
   * Trigger wisp group responses from an external source (e.g. Ghost bot).
   * Picks 1-2 random wisps that have the group and are not the sender.
   */
  triggerGroupResponse(senderDid: string, senderName: string, text: string, groupId: string): void {
    const allWisps = this.getWisps().filter(w => w.getGroup(groupId));
    if (allWisps.length === 0) return;

    // 10% chance nobody responds (natural group behavior)
    if (Math.random() < 0.1) return;

    this.dispatchGroupResponders(senderDid, senderName, text, groupId, allWisps);
  }

  /** Pick 1-2 random wisps (excluding sender) and schedule staggered responses. */
  private dispatchGroupResponders(
    senderDid: string, senderName: string, text: string,
    groupId: string, allWisps: Wisp[],
  ): void {
    const responders = allWisps.filter(w => w.did !== senderDid);
    if (responders.length === 0) return;
    const count = Math.random() < 0.5 ? 1 : Math.min(2, responders.length);
    const shuffled = responders.sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);

    for (let i = 0; i < chosen.length; i++) {
      const delay = 2000 + Math.random() * 4000 + i * 3000; // Stagger responses
      setTimeout(() => {
        void chosen[i].generateAndSendGroupMessage(senderName, text, groupId);
      }, delay);
    }
  }

  getWisp(name: string): Wisp | undefined { return this.wisps.get(name); }
  getWisps(): Wisp[] { return Array.from(this.wisps.values()); }

  /** Have all wisps befriend each other via mutual friend requests. */
  async befriendAll(): Promise<void> {
    const wispList = this.getWisps();
    for (let i = 0; i < wispList.length; i++) {
      for (let j = i + 1; j < wispList.length; j++) {
        if (!wispList[i].hasFriend(wispList[j].did)) {
          wispList[i].sendFriendRequest(wispList[j].did);
          await sleep(500);
        }
      }
    }
    await sleep(2000); // Wait for friend responses to arrive
    console.log('[Orchestrator] All wisps befriended');
  }

  /** Have all wisps send friend requests to a real user DID. */
  async befriendUser(userDid: string): Promise<void> {
    for (const wisp of this.wisps.values()) {
      if (!wisp.hasFriend(userDid)) {
        wisp.sendFriendRequest(userDid);
        await sleep(300);
      }
    }
    console.log(`[Orchestrator] All wisps sent friend requests to ${userDid.slice(0, 24)}...`);
  }

  /** Create a group with all wisps and optionally a real user. */
  async createGroup(name: string, creatorName: string, userDid?: string): Promise<string> {
    const creator = this.wisps.get(creatorName);
    if (!creator) throw new Error(`Unknown wisp: ${creatorName}`);
    const groupId = uuid();
    const groupKeyBytes = randomBytes(32);
    const groupKeyHex = bytesToHex(groupKeyBytes);
    const allWisps = this.getWisps();
    const members: { did: string; displayName: string }[] =
      allWisps.map(w => ({ did: w.did, displayName: w.name }));

    // Include the real user in the member list
    if (userDid) {
      const userFriend = creator.getFriend(userDid);
      members.push({ did: userDid, displayName: userFriend?.displayName ?? 'User' });
    }
    const membersJson = JSON.stringify(members);

    // Creator adds itself to the group directly
    // conversationId must use "group-{groupId}" to match WASM convention
    const conversationId = `group-${groupId}`;
    const group: WispGroup = {
      groupId, groupName: name, groupKey: groupKeyHex,
      members, conversationId,
    };
    creator.addGroup(group);

    // Send encrypted group invites to all other wisps
    for (const wisp of allWisps) {
      if (wisp.name === creatorName) continue;
      const friend = creator.getFriend(wisp.did);
      if (!friend) continue;
      const { ciphertext, nonce } = encryptGroupKey(
        groupKeyHex, creator.identity.encryptionPrivateKey, friend.encryptionKey, groupId,
      );
      creator.sendRawEnvelope(wisp.did, {
        envelope: 'group_invite', version: 1,
        payload: {
          inviteId: uuid(), groupId, groupName: name,
          inviterDid: creator.did, inviterName: creator.name,
          encryptedGroupKey: ciphertext, nonce, membersJson,
          timestamp: Date.now(),
        },
      });
      await sleep(300);
    }

    // Send group invite to the real user if specified
    if (userDid) {
      const userFriend = creator.getFriend(userDid);
      if (userFriend) {
        const { ciphertext, nonce } = encryptGroupKey(
          groupKeyHex, creator.identity.encryptionPrivateKey, userFriend.encryptionKey, groupId,
        );
        creator.sendRawEnvelope(userDid, {
          envelope: 'group_invite', version: 1,
          payload: {
            inviteId: uuid(), groupId, groupName: name,
            inviterDid: creator.did, inviterName: creator.name,
            encryptedGroupKey: ciphertext, nonce, membersJson,
            timestamp: Date.now(),
          },
        });
      }
    }

    await sleep(2000); // Wait for invite processing
    console.log(`[Orchestrator] Group "${name}" created (${groupId.slice(0, 12)}...)`);
    return groupId;
  }

  /** Register a community for wisp activity */
  addCommunity(
    info: CommunityInfo,
    sendFn: (wispDid: string, communityId: string, channelId: string, channelName: string, senderDisplayName: string, content: string, replyToId?: string) => void,
    reactionFn: (wispDid: string, communityId: string, channelId: string, messageId: string, emoji: string) => void,
  ): void {
    if (!this.communityActivity) {
      this.communityActivity = new CommunityActivity(
        () => this.getWisps(),
        async (wisp, channelName, replyContext) => {
          const prompt = replyContext
            ? `You're chatting in the #${channelName} channel of a community. Someone said: "${replyContext}". Reply in character in 1-2 sentences.`
            : `You're chatting in the #${channelName} channel of a community. Say something interesting and in character in 1-2 sentences.`;
          return wisp.generateResponse('Community', prompt, `community-${channelName}`);
        },
        sendFn,
        reactionFn,
      );
      this.communityActivity.start();
    }
    this.communityActivity.addCommunity(info);
  }

  /** Remove a community from wisp activity */
  removeCommunity(communityId: string): void {
    this.communityActivity?.removeCommunity(communityId);
  }

  /** Track a community message for reply/reaction context */
  trackCommunityMessage(communityId: string, msg: RecentMessage): void {
    this.communityActivity?.trackMessage(communityId, msg);
  }

  /** Run a named scenario. */
  async runScenario(name: string): Promise<{ success: boolean; error?: string }> {
    const scenario = getScenario(name);
    if (!scenario) return { success: false, error: `Unknown scenario: ${name}` };
    return runScenario(scenario, this);
  }

  /** List registered scenario names. */
  getAvailableScenarios(): string[] { return listScenarios(); }

  /** Enable shift-based presence scheduling for wisps. */
  enablePresenceScheduling(): void {
    if (this.presenceScheduler) return;
    this.presenceScheduler = new PresenceScheduler(
      (name) => this.getWisp(name),
      () => this.getAllWispNames(),
    );
    this.presenceScheduler.start();
    console.log('[Orchestrator] Presence scheduling enabled');
  }

  /** Get presence scheduler status (shifts, online/offline lists). */
  getPresenceStatus(): { online: string[]; offline: string[]; shifts: WispShift[] } | null {
    return this.presenceScheduler?.getStatus() ?? null;
  }

  /** Join wisps to a voice channel. If no names given, pick 2-3 random wisps. */
  async joinVoice(channelId: string, wispNames?: string[]): Promise<string[]> {
    if (!this.babbleLibrary) throw new Error('Babble library not initialized');

    let names: string[];
    if (wispNames && wispNames.length > 0) {
      names = wispNames.filter(n => this.wisps.has(n));
    } else {
      const all = this.getAllWispNames();
      const count = 2 + Math.floor(Math.random() * 2); // 2-3
      const shuffled = all.sort(() => Math.random() - 0.5);
      names = shuffled.slice(0, Math.min(count, all.length));
    }

    const joined: string[] = [];
    for (const name of names) {
      const wisp = this.wisps.get(name);
      if (!wisp) continue;

      let handler = this.voiceHandlers.get(name);
      if (!handler) {
        handler = new VoiceBabbleHandler(
          wisp.wispIdentity, wisp.relayClient, this.babbleLibrary, name,
        );
        this.voiceHandlers.set(name, handler);
      }
      await handler.joinChannel(channelId);
      joined.push(name);
    }

    console.log(`[Orchestrator] ${joined.join(', ')} joined voice channel ${channelId}`);
    return joined;
  }

  /** Remove wisps from voice channels. If no names given, remove all. */
  leaveVoice(wispNames?: string[]): string[] {
    const names = wispNames && wispNames.length > 0
      ? wispNames
      : Array.from(this.voiceHandlers.keys());

    const left: string[] = [];
    for (const name of names) {
      const handler = this.voiceHandlers.get(name);
      if (handler) {
        handler.leaveChannel();
        this.voiceHandlers.delete(name);
        left.push(name);
      }
    }

    console.log(`[Orchestrator] ${left.join(', ') || 'no wisps'} left voice`);
    return left;
  }

  /** Get which wisps are currently in voice channels. */
  getVoiceStatus(): { channels: { channelId: string; wisps: string[] }[] } {
    const channelMap = new Map<string, string[]>();
    for (const [name, handler] of this.voiceHandlers) {
      if (!handler.inChannel) continue;
      const chId = handler.currentChannelId ?? 'unknown';
      if (!channelMap.has(chId)) channelMap.set(chId, []);
      channelMap.get(chId)!.push(name);
    }
    return {
      channels: Array.from(channelMap.entries()).map(
        ([channelId, wisps]) => ({ channelId, wisps }),
      ),
    };
  }

  private getAllWispNames(): string[] {
    return Array.from(this.wisps.keys());
  }

  getStatus() {
    return {
      running: this._running,
      wispCount: this.wisps.size,
      wisps: Array.from(this.wisps.values()).map(w => ({
        name: w.name, did: w.did, running: w.running, friends: w.friendCount,
      })),
    };
  }
}
