/**
 * Shared translation state module.
 *
 * Both TranslateAction and TranslationDecorator live in the same bundle,
 * so they share this module-level state. A simple pub/sub mechanism
 * (listeners + subscribe) lets React components re-render when state changes.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

/** messageId -> translated text */
export const translations: Map<string, string> = new Map();

/** Current target language code (ISO 639-1) */
export let targetLang = 'es';

// ---------------------------------------------------------------------------
// Listeners (for reactivity)
// ---------------------------------------------------------------------------

export const listeners: Set<() => void> = new Set();

function notify(): void {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      /* ignore listener errors */
    }
  }
}

// ---------------------------------------------------------------------------
// Mutators
// ---------------------------------------------------------------------------

/**
 * Update the target language for future translations.
 */
export function setTargetLang(lang: string): void {
  targetLang = lang;
}

/**
 * Store a translation result for a message and notify subscribers.
 */
export function addTranslation(id: string, text: string): void {
  translations.set(id, text);
  notify();
}

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

/**
 * Subscribe to translation state changes.
 * Returns an unsubscribe function.
 */
export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
