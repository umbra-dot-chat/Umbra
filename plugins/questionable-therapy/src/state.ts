/**
 * Module-level reactive state for the Questionable Therapy plugin.
 *
 * Uses a simple pub/sub pattern so React components can subscribe
 * to state changes without needing a full context provider.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

/** Whether a therapy session is currently active. */
export let therapyActive = false;

/** Index of the currently selected zen track. */
export let currentTrack = 0;

/** Whether zen audio is currently playing. */
export let isPlaying = false;

/** Volume level for zen audio (0.0 - 1.0). */
export let volume = 0.3;

/** Total number of therapy sessions this user has had. */
export let sessionCount = 0;

/** Timestamp when the current session started (ms since epoch). */
export let sessionStartedAt = 0;

// -- Setters ------------------------------------------------------------------

export function setTherapyActive(active: boolean): void {
  therapyActive = active;
  notify();
}

export function setCurrentTrack(track: number): void {
  currentTrack = track;
  notify();
}

export function setIsPlaying(playing: boolean): void {
  isPlaying = playing;
  notify();
}

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  notify();
}

export function setSessionCount(count: number): void {
  sessionCount = Math.max(0, count);
  notify();
}

export function setSessionStartedAt(timestamp: number): void {
  sessionStartedAt = timestamp;
  notify();
}

// -- Pub/Sub ------------------------------------------------------------------

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

// -- Reset --------------------------------------------------------------------

export function resetState(): void {
  therapyActive = false;
  currentTrack = 0;
  isPlaying = false;
  volume = 0.3;
  sessionCount = 0;
  sessionStartedAt = 0;
  notify();
}
