/**
 * Relay WebSocket client for the test bot.
 *
 * Handles:
 * - Connection and DID registration
 * - Sending/receiving relay envelopes
 * - Offline message fetching
 * - Automatic reconnection with exponential backoff
 * - Message queueing when disconnected
 */

import WebSocket from 'ws';

export type ServerMessage =
  | { type: 'registered'; did: string }
  | { type: 'message'; from_did: string; payload: string; timestamp: number }
  | { type: 'ack'; id: string }
  | { type: 'pong' }
  | { type: 'offline_messages'; messages: { from_did: string; payload: string; timestamp: number }[] }
  | { type: 'error'; message: string }
  | { type: 'session_created'; session_id: string }
  | { type: 'session_joined'; session_id: string; from_did: string; answer_payload: string };

export type MessageHandler = (msg: ServerMessage) => void;

export class RelayClient {
  private ws: WebSocket | null = null;
  private did: string;
  private url: string;
  private handlers: MessageHandler[] = [];
  private _registered = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  // Reconnection
  private _reconnectEnabled = false;
  private _reconnectAttempts = 0;
  private _maxReconnectAttempts = 5;
  private _reconnectBaseDelay = 1000;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _intentionalDisconnect = false;

  // Message queue (used when disconnected + reconnect enabled)
  private _messageQueue: object[] = [];

  // Callbacks
  onReconnected: (() => void) | null = null;
  onDisconnected: (() => void) | null = null;

  constructor(url: string, did: string) {
    this.url = url;
    this.did = did;
  }

  get registered(): boolean {
    return this._registered;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get socket(): WebSocket | null {
    return this.ws;
  }

  get reconnectEnabled(): boolean {
    return this._reconnectEnabled;
  }

  get queueSize(): number {
    return this._messageQueue.length;
  }

  /**
   * Enable automatic reconnection with exponential backoff.
   */
  enableReconnect(maxAttempts = 5, baseDelayMs = 1000): void {
    this._reconnectEnabled = true;
    this._maxReconnectAttempts = maxAttempts;
    this._reconnectBaseDelay = baseDelayMs;
  }

  /**
   * Disable automatic reconnection.
   */
  disableReconnect(): void {
    this._reconnectEnabled = false;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  /**
   * Connect to the relay and register our DID.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._intentionalDisconnect = false;
      this.ws = new WebSocket(this.url);

      const timeout = setTimeout(() => {
        this.ws?.close();
        reject(new Error('Connection timeout'));
      }, 10000);

      this.ws.on('open', () => {
        clearTimeout(timeout);
        // Register DID
        this.send({ type: 'register', did: this.did });
      });

      this.ws.on('message', (raw) => {
        try {
          const str = typeof raw === 'string' ? raw : raw.toString('utf-8');
          const msg = JSON.parse(str) as ServerMessage;

          if (msg.type === 'registered') {
            this._registered = true;
            this._reconnectAttempts = 0; // Reset on successful registration
            // Start keepalive pings
            if (this.pingInterval) clearInterval(this.pingInterval);
            this.pingInterval = setInterval(() => {
              if (this.connected) this.send({ type: 'ping' });
            }, 30000);
            resolve();
          }

          // Notify handlers
          for (const h of this.handlers) {
            try { h(msg); } catch (e) { /* ignore handler errors */ }
          }
        } catch {
          // ignore parse errors
        }
      });

      this.ws.on('error', (err) => {
        clearTimeout(timeout);
        if (!this._registered) reject(err);
      });

      this.ws.on('close', () => {
        const wasRegistered = this._registered;
        this._registered = false;
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }

        if (wasRegistered && !this._intentionalDisconnect) {
          this.onDisconnected?.();

          // Auto-reconnect if enabled
          if (this._reconnectEnabled) {
            this.attemptReconnect();
          }
        }
      });
    });
  }

  /**
   * Subscribe to relay messages.
   */
  onMessage(handler: MessageHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  /**
   * Wait for a specific message matching a predicate.
   */
  waitFor(predicate: (msg: ServerMessage) => boolean, timeoutMs = 15000): Promise<ServerMessage> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsub();
        reject(new Error('Timed out waiting for message'));
      }, timeoutMs);

      const unsub = this.onMessage((msg) => {
        if (predicate(msg)) {
          clearTimeout(timeout);
          unsub();
          resolve(msg);
        }
      });
    });
  }

  /**
   * Send a relay envelope to a recipient DID.
   */
  sendEnvelope(toDid: string, envelope: object): void {
    this.send({
      type: 'send',
      to_did: toDid,
      payload: JSON.stringify(envelope),
    });
  }

  /**
   * Request offline messages.
   */
  fetchOffline(): void {
    this.send({ type: 'fetch_offline' });
  }

  /**
   * Send raw JSON to relay. Queues if disconnected and reconnect is enabled.
   */
  send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else if (this._reconnectEnabled) {
      // Queue for later delivery
      this._messageQueue.push(msg);
    }
    // Otherwise silently drop (original behavior)
  }

  /**
   * Send raw data directly to the WebSocket (for malformed envelope tests).
   */
  sendRaw(data: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  /**
   * Simulate a disconnect for testing reconnection scenarios.
   * Closes the WebSocket without marking it as intentional,
   * so reconnect logic triggers if enabled.
   */
  simulateDisconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Disconnect from relay (intentional — will NOT auto-reconnect).
   */
  disconnect(): void {
    this._intentionalDisconnect = true;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close();
    this.ws = null;
    this._registered = false;
  }

  // ─── Internal ─────────────────────────────────────────────────────────────

  /**
   * Attempt to reconnect with exponential backoff.
   */
  private attemptReconnect(): void {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      return; // Give up
    }

    const delay = Math.min(
      this._reconnectBaseDelay * Math.pow(2, this._reconnectAttempts),
      30000, // Cap at 30s
    );

    this._reconnectAttempts++;

    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      try {
        await this.connect();
        // Reconnected — fetch offline messages and flush queue
        this.fetchOffline();
        this.flushQueue();
        this.onReconnected?.();
      } catch {
        // Connect failed — will retry via the close handler
        // (connect() sets up a new close handler that calls attemptReconnect)
      }
    }, delay);
  }

  /**
   * Flush all queued messages after reconnection.
   */
  private flushQueue(): void {
    const queued = [...this._messageQueue];
    this._messageQueue = [];
    for (const msg of queued) {
      this.send(msg);
    }
  }
}
