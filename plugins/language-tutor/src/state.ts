/**
 * Module-level reactive state for the Language Tutor plugin.
 *
 * Uses a simple pub/sub pattern so React components can subscribe
 * to state changes without needing a full context provider.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

/** Whether the tutor is currently active. */
export let tutorActive = false;

/** Target language code (e.g. "es", "fr"). */
export let targetLanguage = '';

/** Current proficiency score (0–100). */
export let currentScore = 0;

// ── Setters ──────────────────────────────────────────────────────────────────

export function setTutorActive(active: boolean): void {
  tutorActive = active;
  notify();
}

export function setTargetLanguage(lang: string): void {
  targetLanguage = lang;
  notify();
}

export function setCurrentScore(score: number): void {
  currentScore = Math.max(0, Math.min(100, score));
  notify();
}

// ── Pub/Sub ──────────────────────────────────────────────────────────────────

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

// ── Reset ────────────────────────────────────────────────────────────────────

export function resetState(): void {
  tutorActive = false;
  targetLanguage = '';
  currentScore = 0;
  notify();
}
