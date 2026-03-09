/**
 * Event Bridge — WASM-to-JavaScript event dispatch.
 *
 * Receives JSON event strings from the Rust WASM backend and dispatches
 * them to registered TypeScript listeners, organized by domain.
 *
 * ## Event Flow
 *
 * ```
 * Rust (emit_event) → JS callback → EventBridge → domain listeners
 * ```
 *
 * ## Event Format (from Rust)
 *
 * ```json
 * {
 *   "domain": "message" | "friend" | "discovery",
 *   "data": {
 *     "type": "messageSent" | "friendRequestReceived" | ...,
 *     ...event-specific fields
 *   }
 * }
 * ```
 */

import type { UmbraWasmModule } from './loader';

// Debug bridge — accesses app-layer logger singleton if available
const _dbg = (): any => (globalThis as any).__umbra_logger_instance;

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type EventDomain = 'message' | 'friend' | 'discovery' | 'network' | 'relay' | 'group' | 'community' | 'file_transfer';

export interface UmbraEvent {
  domain: EventDomain;
  data: {
    type: string;
    [key: string]: unknown;
  };
}

export type EventListener = (event: UmbraEvent) => void;
export type DomainListener = (data: UmbraEvent['data']) => void;

// ─────────────────────────────────────────────────────────────────────────
// Event Bridge
// ─────────────────────────────────────────────────────────────────────────

/**
 * Manages event subscriptions from the WASM backend.
 *
 * Register domain-specific listeners or a catch-all listener.
 */
export class EventBridge {
  private domainListeners = new Map<EventDomain, Set<DomainListener>>();
  private allListeners = new Set<EventListener>();

  /**
   * Connect to the WASM module's event system.
   *
   * Registers a JavaScript callback that Rust will call whenever
   * an event is emitted via `emit_event()`.
   */
  connect(wasm: UmbraWasmModule): void {
    wasm.umbra_wasm_subscribe_events((eventJson: string) => {
      try {
        const event: UmbraEvent = JSON.parse(eventJson);
        _dbg()?.debug('network', `event-bridge RECV: ${event.domain}.${event.data?.type}`, { raw: eventJson.slice(0, 200) }, 'EventBridge');
        this.dispatch(event);
      } catch (err) {
        _dbg()?.error('network', 'event-bridge PARSE FAILED', { eventJson: eventJson?.slice(0, 100), err: String(err) }, 'EventBridge');
        console.error('[event-bridge] Failed to parse event:', eventJson, err);
      }
    });

    _dbg()?.info('lifecycle', 'event-bridge connected to WASM events', undefined, 'EventBridge');
    console.log('[event-bridge] Connected to WASM events');
  }

  /**
   * Subscribe to events from a specific domain.
   *
   * @param domain - The event domain to listen to
   * @param listener - Callback receiving the event data
   * @returns Unsubscribe function
   */
  on(domain: EventDomain, listener: DomainListener): () => void {
    if (!this.domainListeners.has(domain)) {
      this.domainListeners.set(domain, new Set());
    }
    this.domainListeners.get(domain)!.add(listener);
    const count = this.domainListeners.get(domain)!.size;
    _dbg()?.debug('lifecycle', `event-bridge: subscribed to "${domain}" (${count} listeners now)`, undefined, 'EventBridge');

    return () => {
      this.domainListeners.get(domain)?.delete(listener);
      const remaining = this.domainListeners.get(domain)?.size ?? 0;
      _dbg()?.debug('lifecycle', `event-bridge: unsubscribed from "${domain}" (${remaining} listeners now)`, undefined, 'EventBridge');
    };
  }

  /**
   * Subscribe to all events regardless of domain.
   *
   * @param listener - Callback receiving the full event
   * @returns Unsubscribe function
   */
  onAll(listener: EventListener): () => void {
    this.allListeners.add(listener);
    return () => {
      this.allListeners.delete(listener);
    };
  }

  /**
   * Remove all listeners.
   */
  clear(): void {
    this.domainListeners.clear();
    this.allListeners.clear();
  }

  // ─── Internal ───────────────────────────────────────────────────────

  private dispatch(event: UmbraEvent): void {
    const domainSet = this.domainListeners.get(event.domain);
    const allCount = this.allListeners.size;
    const domainCount = domainSet?.size ?? 0;
    _dbg()?.trace('network', `event-bridge DISPATCH ${event.domain}.${event.data?.type} → ${allCount} catch-all + ${domainCount} domain listeners`, undefined, 'EventBridge');

    // Notify catch-all listeners
    for (const listener of this.allListeners) {
      try {
        listener(event);
      } catch (err) {
        _dbg()?.error('network', `event-bridge catch-all listener threw`, { err: String(err) }, 'EventBridge');
        console.error('[event-bridge] Listener error:', err);
      }
    }

    // Notify domain-specific listeners
    if (domainSet) {
      for (const listener of domainSet) {
        try {
          listener(event.data);
        } catch (err) {
          _dbg()?.error('network', `event-bridge ${event.domain} listener threw`, { err: String(err) }, 'EventBridge');
          console.error(`[event-bridge] ${event.domain} listener error:`, err);
        }
      }
    }
  }
}

/**
 * Singleton event bridge instance.
 */
export const eventBridge = new EventBridge();
