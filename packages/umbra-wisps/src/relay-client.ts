/**
 * Relay WebSocket client for wisps.
 *
 * Handles connection, DID registration, envelope sending/receiving,
 * offline message fetching, and automatic reconnection.
 *
 * Copied from @umbra/test-bot/relay.ts to avoid cross-package
 * TypeScript compilation issues (test-bot has no build step).
 */

import WebSocket from 'ws';

export type ServerMessage =
  | { type: 'registered'; did: string }
  | { type: 'message'; from_did: string; payload: string; timestamp: number }
  | { type: 'ack'; id: string }
  | { type: 'pong' }
  | { type: 'offline_messages'; messages: { from_did: string; payload: string; timestamp: number }[] }
  | { type: 'error'; message: string }
  | { type: 'call_room_created'; room_id: string; group_id: string }
  | { type: 'call_participant_joined'; room_id: string; did: string }
  | { type: 'call_participant_left'; room_id: string; did: string }
  | { type: 'call_signal_forward'; room_id: string; from_did: string; payload: string };

export type MessageHandler = (msg: ServerMessage) => void;

export class RelayClient {
  private ws: WebSocket | null = null;
  private did: string;
  private url: string;
  private handlers: MessageHandler[] = [];
  private _registered = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private _reconnectEnabled = false;
  private _reconnectAttempts = 0;
  private _maxReconnectAttempts = 5;
  private _reconnectBaseDelay = 1000;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _intentionalDisconnect = false;

  constructor(url: string, did: string) {
    this.url = url;
    this.did = did;
  }

  get registered(): boolean { return this._registered; }
  get connected(): boolean { return this.ws?.readyState === WebSocket.OPEN; }

  enableReconnect(maxAttempts = 5, baseDelayMs = 1000): void {
    this._reconnectEnabled = true;
    this._maxReconnectAttempts = maxAttempts;
    this._reconnectBaseDelay = baseDelayMs;
  }

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
        this.send({ type: 'register', did: this.did });
      });

      this.ws.on('message', (raw: Buffer | string) => {
        try {
          const str = typeof raw === 'string' ? raw : raw.toString('utf-8');
          const msg = JSON.parse(str) as ServerMessage;
          if (msg.type === 'registered') {
            this._registered = true;
            this._reconnectAttempts = 0;
            if (this.pingInterval) clearInterval(this.pingInterval);
            this.pingInterval = setInterval(() => {
              if (this.connected) this.send({ type: 'ping' });
            }, 30000);
            resolve();
          }
          for (const h of this.handlers) {
            try { h(msg); } catch { /* ignore */ }
          }
        } catch { /* ignore parse errors */ }
      });

      this.ws.on('error', (err: Error) => {
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
        if (wasRegistered && !this._intentionalDisconnect && this._reconnectEnabled) {
          this.attemptReconnect();
        }
      });
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.push(handler);
    return () => { this.handlers = this.handlers.filter((h) => h !== handler); };
  }

  sendEnvelope(toDid: string, envelope: object): void {
    this.send({
      type: 'send',
      to_did: toDid,
      payload: JSON.stringify(envelope),
    });
  }

  fetchOffline(): void {
    this.send({ type: 'fetch_offline' });
  }

  send(msg: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

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

  private attemptReconnect(): void {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) return;
    const delay = Math.min(
      this._reconnectBaseDelay * Math.pow(2, this._reconnectAttempts),
      30000,
    );
    this._reconnectAttempts++;
    this._reconnectTimer = setTimeout(async () => {
      this._reconnectTimer = null;
      try {
        await this.connect();
        this.fetchOffline();
      } catch { /* retry via close handler */ }
    }, delay);
  }
}
