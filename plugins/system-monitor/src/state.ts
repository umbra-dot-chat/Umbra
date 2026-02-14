/**
 * System Monitor — reactive state with simulated system stats.
 *
 * In a real desktop build the data would come from a Tauri command or WASM
 * module that reads /proc, sysctl, WMI, etc.  For this proof-of-concept we
 * generate plausible numbers that drift over time so the UI feels alive.
 */

// =============================================================================
// Types
// =============================================================================

export interface SystemStats {
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Memory in use (GB) */
  memoryUsed: number;
  /** Total installed memory (GB) */
  memoryTotal: number;
  /** Disk space in use (GB) */
  diskUsed: number;
  /** Total disk capacity (GB) */
  diskTotal: number;
  /** System uptime in seconds */
  uptime: number;
  /** Operating system / platform name */
  platform: string;
}

// =============================================================================
// Helpers
// =============================================================================

/** Clamp a value between min and max. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Return a random float in [min, max). */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Round to N decimal places. */
function round(value: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(value * f) / f;
}

// =============================================================================
// State
// =============================================================================

type Listener = (stats: SystemStats) => void;

const listeners: Set<Listener> = new Set();

let stats: SystemStats = {
  cpuUsage: 32,
  memoryUsed: 8.2,
  memoryTotal: 16.0,
  diskUsed: 120,
  diskTotal: 500,
  uptime: 86400, // start at 1 day
  platform: 'macOS 15.3 (Sequoia)',
};

// =============================================================================
// Public API
// =============================================================================

/** Get a snapshot of the current stats. */
export function getStats(): SystemStats {
  return { ...stats };
}

/**
 * Generate the next set of simulated stats.
 *
 * CPU fluctuates between 15-85 % with some inertia so it feels natural.
 * Memory drifts slightly around 8 GB on a 16 GB system.
 * Disk barely changes (writes are slow relative to poll interval).
 * Uptime always increments by 2 seconds per tick.
 */
export function updateStats(): void {
  const prev = stats;

  const cpuDelta = rand(-8, 8);
  const cpuUsage = round(clamp(prev.cpuUsage + cpuDelta, 15, 85), 1);

  const memDelta = rand(-0.3, 0.3);
  const memoryUsed = round(clamp(prev.memoryUsed + memDelta, 4.0, 14.0), 1);

  const diskDelta = rand(-0.01, 0.05);
  const diskUsed = round(clamp(prev.diskUsed + diskDelta, 80, 480), 1);

  stats = {
    cpuUsage,
    memoryUsed,
    memoryTotal: prev.memoryTotal,
    diskUsed,
    diskTotal: prev.diskTotal,
    uptime: prev.uptime + 2,
    platform: prev.platform,
  };

  // Notify subscribers
  listeners.forEach((fn) => fn(stats));
}

/** Subscribe to stat updates. Returns an unsubscribe function. */
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Remove all subscribers (used during deactivation). */
export function clearListeners(): void {
  listeners.clear();
}
