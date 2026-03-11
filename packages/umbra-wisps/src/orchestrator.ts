/**
 * WispOrchestrator -- spawns and manages a swarm of Wisp instances.
 *
 * Handles lifecycle (start/stop), persona assignment, and provides
 * a status summary for monitoring.
 */

import { Wisp } from './wisp.js';
import { WispLLMClient } from './llm-client.js';
import { loadOrCreateWispIdentity } from './identity-store.js';
import { DEFAULT_PERSONAS, type WispPersona } from './personas.js';
import { ConversationLoop } from './conversation-loop.js';
import { maybeReact } from './reactions.js';

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
    this.conversationLoop = new ConversationLoop(() => this.getWisps());
    this.conversationLoop.start();
    console.log(`[Orchestrator] ${this.wisps.size} wisps active`);
  }

  async stop(): Promise<void> {
    this.conversationLoop?.stop();
    for (const wisp of this.wisps.values()) wisp.stop();
    this.wisps.clear();
    this._running = false;
    console.log('[Orchestrator] All wisps stopped');
  }

  async spawnWisp(persona: WispPersona, allNames: string[]): Promise<Wisp> {
    const identity = loadOrCreateWispIdentity(this.config.dataDir, persona.name);
    const wisp = new Wisp(identity, persona, this.config.relayUrl, this.llm, allNames);
    wisp.onUserMessage = (senderDid, messageId) => {
      maybeReact(this.getWisps(), senderDid, messageId);
    };
    await wisp.start();
    this.wisps.set(persona.name, wisp);
    return wisp;
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
