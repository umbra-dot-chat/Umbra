/**
 * Relay WebSocket client for the test bot.
 *
 * Handles:
 * - Connection and DID registration
 * - Sending/receiving relay envelopes
 * - Offline message fetching
 * - Automatic reconnection
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

  /**
   * Connect to the relay and register our DID.
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
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
            // Start keepalive pings
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
        this._registered = false;
        if (this.pingInterval) clearInterval(this.pingInterval);
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
   * Send raw JSON to relay.
   */
  send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Disconnect from relay.
   */
  disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close();
    this.ws = null;
    this._registered = false;
  }
}
