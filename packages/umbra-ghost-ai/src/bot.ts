/**
 * GhostBot — the main orchestrator that ties everything together.
 *
 * Creates identity, connects to relay, processes messages with LLM,
 * and manages the entire lifecycle of the Ghost AI agent.
 */

import { createServer } from 'http';
import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { GhostConfig, Logger } from './config.js';
import { createLogger } from './config.js';
import { computeConversationId, type GhostIdentity } from './crypto.js';
import { loadOrCreateIdentity } from './identity.js';
import { RelayClient, type ServerMessage } from './relay.js';
import { OllamaProvider } from './llm/ollama.js';
import { ContextStore } from './context/store.js';
import { CodebaseIndexer } from './knowledge/indexer.js';
import { handleFriendRequest, type IncomingFriendRequest } from './handlers/friend-request.js';
import { handleMessage, type IncomingMessage } from './handlers/message.js';
import { checkReminders } from './handlers/reminder.js';
import { CallHandler } from './handlers/call.js';
import { MediaManager } from './media/manager.js';

const BOT_NAMES: Record<string, string> = {
  en: 'Ghost',
  ko: '고스트',
};

export class GhostBot {
  private config: GhostConfig;
  private log: Logger;
  private identity!: GhostIdentity;
  private relay!: RelayClient;
  private llm!: OllamaProvider;
  private store!: ContextStore;
  private indexer!: CodebaseIndexer;
  private knowledgeDb!: Database.Database;
  private reminderInterval: ReturnType<typeof setInterval> | null = null;
  private httpServer: ReturnType<typeof createServer> | null = null;
  private callHandler: CallHandler | null = null;
  private mediaManager: MediaManager | null = null;
  private running = false;

  constructor(config: GhostConfig) {
    this.config = config;
    this.log = createLogger(config);
  }

  async start(): Promise<void> {
    const displayName = BOT_NAMES[this.config.language] || BOT_NAMES.en;

    this.log.info('═══════════════════════════════════════════');
    this.log.info(`  Ghost AI Agent — ${displayName}`);
    this.log.info('═══════════════════════════════════════════');

    // 1. Load or create identity
    this.identity = loadOrCreateIdentity(this.config.dataDir, displayName, this.log);
    this.log.info(`DID: ${this.identity.did}`);
    this.log.info(`Encryption key: ${this.identity.encryptionPublicKey}`);

    // 2. Initialize stores
    this.store = new ContextStore(this.config.dataDir, this.log);

    // 3. Initialize LLM
    this.llm = new OllamaProvider(
      this.config.ollamaUrl,
      this.config.model,
      this.config.embedModel,
      this.log,
    );

    // Check Ollama health
    const ollamaOk = await this.llm.healthCheck();
    if (!ollamaOk) {
      this.log.warn('Ollama is not reachable or model not found. Bot will start but LLM responses will fail.');
      this.log.warn(`Make sure Ollama is running at ${this.config.ollamaUrl} with model '${this.config.model}'`);
    } else {
      this.log.info(`Ollama connected (model: ${this.config.model})`);
    }

    // 4. Initialize codebase knowledge
    if (!existsSync(this.config.dataDir)) {
      mkdirSync(this.config.dataDir, { recursive: true });
    }
    const knowledgeDbPath = join(this.config.dataDir, 'knowledge.db');
    this.knowledgeDb = new Database(knowledgeDbPath);
    this.knowledgeDb.pragma('journal_mode = WAL');
    this.indexer = new CodebaseIndexer(this.knowledgeDb, this.llm, this.config.codebasePath, this.log);

    // Index codebase in background if not already done
    if (!this.indexer.isIndexed()) {
      this.log.info('Codebase not indexed yet — starting background indexing...');
      this.indexCodebaseBackground();
    } else {
      this.log.info('Codebase index loaded');
    }

    // 5. Connect to relay
    this.relay = new RelayClient(this.config.relayUrl, this.identity.did, this.log);
    this.relay.onReconnected = () => {
      this.log.info('Reconnected — fetching offline messages...');
    };

    this.log.info(`Connecting to relay: ${this.config.relayUrl}`);
    try {
      await this.relay.connect();
      this.log.info('Registered with relay ✓');
    } catch (err) {
      this.log.error('Failed to connect to relay:', err);
      this.log.info('Will retry connection...');
      // The relay client will auto-reconnect
    }

    // 6. Set up message handling
    this.relay.onMessage((msg) => this.handleRelayMessage(msg));

    // 7. Fetch offline messages
    this.relay.fetchOffline();

    // 8. Start reminder checker (every 30 seconds)
    this.reminderInterval = setInterval(() => {
      checkReminders(this.identity, this.relay, this.store, this.config.language, this.log);
    }, 30000);

    // 9. Start HTTP health endpoint
    this.startHealthServer();

    // 10. Initialize call handler
    if (this.config.callEnabled) {
      await this.initializeCallHandler();
    }

    this.running = true;
    this.log.info(`Ghost is running! 👻`);
    this.log.info(`Language: ${this.config.language}`);
    this.log.info(`Relay: ${this.config.relayUrl}`);
    this.log.info(`Model: ${this.config.model}`);
    this.log.info('Waiting for messages...\n');
  }

  stop(): void {
    this.running = false;
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    this.callHandler?.endAllCalls();
    this.relay?.disconnect();
    this.store?.close();
    this.knowledgeDb?.close();
    this.httpServer?.close();
    this.log.info('Ghost stopped');
  }

  // ─── Message Routing ─────────────────────────────────────────────────

  private handleRelayMessage(msg: ServerMessage): void {
    if (msg.type === 'message') {
      this.handleIncomingEnvelope(msg.from_did, msg.payload);
    } else if (msg.type === 'offline_messages') {
      this.log.info(`Processing ${msg.messages.length} offline message(s)`);
      for (const m of msg.messages) {
        this.handleIncomingEnvelope(m.from_did, m.payload);
      }
    }
  }

  private handleIncomingEnvelope(fromDid: string, payloadStr: string): void {
    let envelope: any;
    try {
      envelope = JSON.parse(payloadStr);
    } catch {
      this.log.warn('Failed to parse envelope');
      return;
    }

    const type = envelope.envelope || envelope.type;
    const payload = envelope.payload || envelope;

    switch (type) {
      case 'friend_request':
        this.handleFriendRequestEnvelope(payload);
        break;

      case 'friend_response':
        this.handleFriendResponseEnvelope(payload);
        break;

      case 'chat_message':
        this.handleChatMessageEnvelope(payload, fromDid);
        break;

      case 'call_offer':
        if (this.callHandler?.enabled) {
          this.callHandler.handleCallOffer(payload);
        }
        break;

      case 'call_answer':
        // Ghost doesn't initiate calls, but handle for completeness
        break;

      case 'call_ice_candidate':
        if (this.callHandler?.enabled) {
          this.callHandler.handleCallIceCandidate(payload);
        }
        break;

      case 'call_end':
        if (this.callHandler?.enabled) {
          this.callHandler.handleCallEnd(payload);
        }
        break;

      case 'call_state':
        if (this.callHandler?.enabled) {
          this.callHandler.handleCallState(payload);
        }
        break;

      case 'typing_indicator':
      case 'message_status':
      case 'reaction_add':
      case 'reaction_remove':
        // Acknowledge but don't process
        break;

      default:
        this.log.debug(`Unhandled envelope type: ${type}`);
    }
  }

  private handleFriendRequestEnvelope(payload: any): void {
    const request: IncomingFriendRequest = {
      id: payload.id,
      fromDid: payload.fromDid,
      fromDisplayName: payload.fromDisplayName,
      fromSigningKey: payload.fromSigningKey,
      fromEncryptionKey: payload.fromEncryptionKey,
      message: payload.message,
    };
    handleFriendRequest(request, this.identity, this.relay, this.store, this.config.language, this.log);
  }

  private handleFriendResponseEnvelope(payload: any): void {
    if (payload.accepted) {
      this.log.info(`Friend response: ${payload.fromDisplayName} accepted our request`);
      const conversationId = computeConversationId(this.identity.did, payload.fromDid);
      this.store.saveFriend({
        did: payload.fromDid,
        displayName: payload.fromDisplayName,
        encryptionKey: payload.fromEncryptionKey,
        signingKey: payload.fromSigningKey,
        conversationId,
        addedAt: Date.now(),
      });
    } else {
      this.log.info(`Friend response: ${payload.fromDisplayName} rejected our request`);
    }
  }

  private async handleChatMessageEnvelope(payload: any, fromDid: string): Promise<void> {
    const msg: IncomingMessage = {
      messageId: payload.messageId,
      conversationId: payload.conversationId,
      senderDid: payload.senderDid || fromDid,
      contentEncrypted: payload.contentEncrypted,
      nonce: payload.nonce,
      timestamp: payload.timestamp,
      threadId: payload.threadId,
    };

    // Search codebase for relevant context
    let codebaseContext: string | null = null;
    if (this.indexer.isIndexed()) {
      // We need the decrypted text to search — but we decrypt inside handleMessage
      // So we'll do a lightweight check: search after decryption
      // For now, pass null and let handleMessage do the search if needed
    }

    await handleMessage(
      msg,
      this.identity,
      this.relay,
      this.store,
      this.llm,
      this.config.language,
      codebaseContext,
      this.log,
      this.callHandler,
    );
  }

  // ─── Call Handler ──────────────────────────────────────────────────────

  private async initializeCallHandler(): Promise<void> {
    const cacheDir = this.config.mediaCacheDir || join(this.config.dataDir, 'media');
    this.mediaManager = new MediaManager(this.config.mediaConfigPath, cacheDir, this.log);
    await this.mediaManager.initialize();

    // Download media in background
    this.mediaManager.downloadAll().catch((err) => {
      this.log.error('Media download failed:', err);
    });

    this.callHandler = new CallHandler(
      this.config,
      this.identity,
      this.relay,
      this.store,
      this.mediaManager,
      this.log,
    );

    const loaded = await this.callHandler.initialize();
    if (loaded) {
      this.log.info('Call handler ready — accepting calls');
    } else {
      this.log.warn('Call handler disabled — @roamhq/wrtc not available');
    }
  }

  // ─── Knowledge Indexing ──────────────────────────────────────────────

  private async indexCodebaseBackground(): Promise<void> {
    try {
      await this.indexer.indexCodebase();
    } catch (err) {
      this.log.error('Background indexing failed:', err);
    }
  }

  async reindexCodebase(): Promise<void> {
    this.log.info('Re-indexing codebase...');
    await this.indexer.indexCodebase();
  }

  // ─── Health Server ───────────────────────────────────────────────────

  private startHealthServer(): void {
    this.httpServer = createServer((req, res) => {
      if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          did: this.identity.did,
          displayName: this.identity.displayName,
          language: this.config.language,
          relay: this.config.relayUrl,
          relayConnected: this.relay?.connected ?? false,
          model: this.config.model,
          friends: this.store?.getAllFriends().length ?? 0,
          callsEnabled: this.callHandler?.enabled ?? false,
          activeCalls: this.callHandler?.getCallCount() ?? 0,
          uptime: process.uptime(),
        }));
      } else if (req.url === '/calls' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.callHandler?.getActiveCalls() ?? []));
      } else if (req.url === '/media' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.mediaManager?.getAllMedia() ?? { audio: [], video: [], files: [] }));
      } else if (req.url === '/webhook/git' && req.method === 'POST') {
        // Git webhook — trigger codebase re-indexing
        this.log.info('Git webhook received — re-indexing codebase...');
        this.reindexCodebase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'reindexing' }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.httpServer.listen(this.config.httpPort, '0.0.0.0', () => {
      this.log.info(`Health server listening on port ${this.config.httpPort}`);
    });
  }
}
