/**
 * MessagingContext — Controls message display mode (bubble vs inline).
 *
 * Persists preferences via the WASM KV store (same pattern as ThemeContext).
 * Re-reads from KV on account switch via preferencesReady/didChanged.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { getWasm } from '@umbra/wasm';
import { useUmbra } from '@/contexts/UmbraContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Available message display modes. */
export type MessageDisplayMode = 'bubble' | 'inline';

export interface MessagingContextValue {
  /** Current message display mode. */
  displayMode: MessageDisplayMode;
  /** Set the message display mode. Persists to KV store. */
  setDisplayMode: (mode: MessageDisplayMode) => void;
  /** Whether saved preferences have been loaded from the WASM KV store. */
  preferencesLoaded: boolean;
}

const MessagingCtx = createContext<MessagingContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Persistence keys
// ─────────────────────────────────────────────────────────────────────────────

const KV_NAMESPACE = '__umbra_system__';
const KEY_DISPLAY_MODE = 'message_display_mode';

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { preferencesReady, didChanged } = useUmbra();

  const [displayMode, setDisplayModeState] = useState<MessageDisplayMode>('bubble');
  const [loaded, setLoaded] = useState(false);

  // ── Persistence helpers ──────────────────────────────────────────────

  const kvSet = useCallback((key: string, value: string) => {
    try {
      const wasm = getWasm();
      if (!wasm) return;
      (wasm as any).umbra_wasm_plugin_kv_set(KV_NAMESPACE, key, value);
    } catch (err) {
      console.warn('[MessagingContext] Failed to save:', key, err);
    }
  }, []);

  const kvGet = useCallback(async (key: string): Promise<string | null> => {
    try {
      const wasm = getWasm();
      if (!wasm) return null;
      const result = await (wasm as any).umbra_wasm_plugin_kv_get(KV_NAMESPACE, key);
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      return parsed.value ?? null;
    } catch {
      return null;
    }
  }, []);

  // ── Load saved state on mount ────────────────────────────────────────

  useEffect(() => {
    if (!preferencesReady) return;

    async function restorePreferences() {
      const savedMode = await kvGet(KEY_DISPLAY_MODE);
      if (savedMode === 'bubble' || savedMode === 'inline') {
        setDisplayModeState(savedMode);
      }

      setLoaded(true);
    }

    restorePreferences();
  }, [preferencesReady, didChanged, kvGet]);

  // ── Public setters ───────────────────────────────────────────────────

  const setDisplayMode = useCallback(
    (mode: MessageDisplayMode) => {
      setDisplayModeState(mode);
      kvSet(KEY_DISPLAY_MODE, mode);
    },
    [kvSet],
  );

  // ── Context value ────────────────────────────────────────────────────

  const value = useMemo<MessagingContextValue>(
    () => ({
      displayMode,
      setDisplayMode,
      preferencesLoaded: loaded,
    }),
    [displayMode, setDisplayMode, loaded],
  );

  return (
    <MessagingCtx.Provider value={value}>{children}</MessagingCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useMessaging(): MessagingContextValue {
  const ctx = useContext(MessagingCtx);
  if (!ctx) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return ctx;
}
