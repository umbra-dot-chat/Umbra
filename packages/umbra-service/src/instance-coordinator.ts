/**
 * Multi-instance detection and coordination.
 *
 * Uses BroadcastChannel (web) to detect when multiple instances of Umbra
 * are running simultaneously (e.g. multiple browser tabs). When a second
 * instance is detected, a conflict callback fires so the UI can show a
 * warning banner.
 *
 * The first instance to broadcast becomes "primary". Additional instances
 * are marked as non-primary and should operate in read-only mode to prevent
 * database corruption (IndexedDB last-write-wins).
 *
 * On React Native (no BroadcastChannel), this gracefully falls back to
 * reporting isPrimary = true with no conflict detection.
 *
 * @packageDocumentation
 */

const CHANNEL_NAME = 'umbra-instance';

export interface InstanceInfo {
  /** Unique ID for this instance */
  id: string;
  /** Unix timestamp when this instance started */
  startedAt: number;
  /** Whether this instance is the primary (first) instance */
  isPrimary: boolean;
}

export interface InstanceCoordinator {
  /** Whether this instance is the primary instance */
  isPrimary: boolean;
  /** Register a callback for when another instance is detected */
  onConflict: (cb: () => void) => void;
  /** Clean up the BroadcastChannel */
  shutdown: () => void;
}

/**
 * Start the instance coordinator.
 *
 * Broadcasts a "hello" message on the BroadcastChannel. If another instance
 * responds, a conflict is detected.
 *
 * @returns Coordinator with isPrimary flag and conflict callback
 */
export function startInstanceCoordinator(): InstanceCoordinator {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = Date.now();
  let isPrimary = true;
  let conflictCallbacks: Array<() => void> = [];
  let channel: BroadcastChannel | null = null;

  // BroadcastChannel is not available in React Native or older browsers
  if (typeof BroadcastChannel === 'undefined') {
    return {
      isPrimary: true,
      onConflict: () => {},
      shutdown: () => {},
    };
  }

  try {
    channel = new BroadcastChannel(CHANNEL_NAME);

    // Listen for messages from other instances
    channel.onmessage = (event) => {
      const data = event.data;

      if (data?.type === 'hello' && data.id !== id) {
        // Another instance exists
        if (data.startedAt < startedAt) {
          // The other instance started earlier — it's primary, we're not
          isPrimary = false;
        }
        // Notify conflict regardless of who's primary
        for (const cb of conflictCallbacks) {
          try { cb(); } catch (_) { /* ignore callback errors */ }
        }

        // Respond so the other instance also knows about us
        channel?.postMessage({ type: 'hello_ack', id, startedAt });
      }

      if (data?.type === 'hello_ack' && data.id !== id) {
        // Got acknowledgment from another instance
        if (data.startedAt < startedAt) {
          isPrimary = false;
        }
        for (const cb of conflictCallbacks) {
          try { cb(); } catch (_) { /* ignore callback errors */ }
        }
      }
    };

    // Announce ourselves
    channel.postMessage({ type: 'hello', id, startedAt });
  } catch (_) {
    // BroadcastChannel creation failed (e.g., in a worker context)
    return {
      isPrimary: true,
      onConflict: () => {},
      shutdown: () => {},
    };
  }

  return {
    get isPrimary() { return isPrimary; },
    onConflict: (cb: () => void) => {
      conflictCallbacks.push(cb);
    },
    shutdown: () => {
      conflictCallbacks = [];
      if (channel) {
        try {
          channel.close();
        } catch (_) { /* ignore */ }
        channel = null;
      }
    },
  };
}
