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

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export type EventDomain = 'message' | 'friend' | 'discovery' | 'network' | 'relay' | 'group';

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
        this.dispatch(event);
      } catch (err) {
        console.error('[event-bridge] Failed to parse event:', eventJson, err);
      }
    });

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

    return () => {
      this.domainListeners.get(domain)?.delete(listener);
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
    // Notify catch-all listeners
    for (const listener of this.allListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[event-bridge] Listener error:', err);
      }
    }

    // Notify domain-specific listeners
    const domainSet = this.domainListeners.get(event.domain);
    if (domainSet) {
      for (const listener of domainSet) {
        try {
          listener(event.data);
        } catch (err) {
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
