/**
 * MessagingContext — Controls message display mode (bubble vs inline).
 *
 * Persists preferences via the WASM KV store (same pattern as ThemeContext).
 * Supports relay sync so preferences propagate across sessions.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { getWasm } from '@umbra/wasm';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { syncMetadataViaRelay } from '@umbra/service';
import type { MetadataEvent } from '@umbra/service';

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
  const { isReady, service } = useUmbra();
  const { identity } = useAuth();

  const [displayMode, setDisplayModeState] = useState<MessageDisplayMode>('bubble');
  const [loaded, setLoaded] = useState(false);

  // Track whether we've done initial restore so we don't clobber state
  const initialRestoreRef = useRef(false);

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

  const kvGet = useCallback((key: string): string | null => {
    try {
      const wasm = getWasm();
      if (!wasm) return null;
      const result = (wasm as any).umbra_wasm_plugin_kv_get(KV_NAMESPACE, key);
      const parsed = JSON.parse(result);
      return parsed.value ?? null;
    } catch {
      return null;
    }
  }, []);

  // ── Load saved state on mount ────────────────────────────────────────

  useEffect(() => {
    if (!isReady || initialRestoreRef.current) return;
    initialRestoreRef.current = true;

    const savedMode = kvGet(KEY_DISPLAY_MODE);
    if (savedMode === 'bubble' || savedMode === 'inline') {
      setDisplayModeState(savedMode);
    }

    setLoaded(true);
  }, [isReady, kvGet]);

  // ── Relay sync: listen for incoming metadata updates ─────────────────

  useEffect(() => {
    if (!service) return;

    const unsub = service.onMetadataEvent((event: MetadataEvent) => {
      if (event.type === 'metadataReceived' && event.key === KEY_DISPLAY_MODE) {
        const newMode = event.value;
        if (newMode === 'bubble' || newMode === 'inline') {
          console.log('[MessagingContext] Relay sync: display mode updated to', newMode);
          setDisplayModeState(newMode);
          // Also persist locally so it survives reload
          kvSet(KEY_DISPLAY_MODE, newMode);
        }
      }
    });

    return unsub;
  }, [service, kvSet]);

  // ── Public setters ───────────────────────────────────────────────────

  const setDisplayMode = useCallback(
    (mode: MessageDisplayMode) => {
      setDisplayModeState(mode);
      kvSet(KEY_DISPLAY_MODE, mode);

      // Sync to other sessions via relay
      if (service && identity?.did) {
        try {
          const relayWs = service.getRelayWs();
          if (relayWs) {
            syncMetadataViaRelay(relayWs, identity.did, KEY_DISPLAY_MODE, mode);
          }
        } catch (err) {
          console.warn('[MessagingContext] Failed to sync via relay:', err);
        }
      }
    },
    [kvSet, service, identity],
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
