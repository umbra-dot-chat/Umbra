/**
 * SyncContext — Manages encrypted account sync with the relay.
 *
 * Handles authentication, debounced blob uploads, incoming delta application,
 * and sync state for the UI.
 *
 * ## Provider placement
 *
 * Must be inside UmbraProvider (needs service + preferencesReady) and
 * AuthProvider (needs identity DID), after all preference providers so
 * it can observe their changes.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { getWasm } from '@umbra/wasm';
import {
  authenticateSync,
  uploadSyncBlob,
  downloadSyncBlob,
  parseSyncBlob,
  applySyncBlob,
  deleteSyncBlob,
  getSyncBlobMeta,
} from '@umbra/service';
import type {
  SyncAuthResult,
  SyncBlobSummary,
  SyncImportResult,
  SyncBlobMeta,
  SyncStatus,
} from '@umbra/service';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  getRelayHttpUrl,
  subscribeRelayState,
  registerSyncUpdateCallback,
  unregisterSyncUpdateCallback,
} from '@/hooks/useNetwork';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const KV_NAMESPACE = '__umbra_system__';
const KEY_SYNC_ENABLED = '__sync_enabled__';
const DEBOUNCE_MS = 5_000;
const TOKEN_REFRESH_BUFFER_MS = 60_000;

// Module-level flag for sync opt-in during account creation.
// The KV write from CreateWalletFlow may not complete before SyncContext reads
// the database (async native bridge on RN), so CreateWalletFlow sets this flag
// synchronously before calling login(). SyncContext checks this flag on mount.
let _pendingSyncOptIn = false;

/** Set the pending sync opt-in flag (called from CreateWalletFlow). */
export function setPendingSyncOptIn(value: boolean): void {
  _pendingSyncOptIn = value;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SyncContextValue {
  /** Whether sync is enabled for this account */
  syncEnabled: boolean;
  /** Current sync status */
  syncStatus: SyncStatus;
  /** Last successful sync timestamp (Unix ms) */
  lastSyncedAt: number | null;
  /** Error message if sync failed */
  syncError: string | null;
  /** Enable or disable sync for this account */
  setSyncEnabled: (enabled: boolean) => void;
  /** Trigger an immediate sync upload */
  triggerSync: () => Promise<void>;
  /** Mark data as dirty — triggers debounced sync upload */
  markDirty: (section?: string) => void;
  /** Delete synced data from the relay */
  deleteSyncData: () => Promise<void>;
  /** Check relay for existing sync blob (returns summary or null) */
  checkRemoteBlob: () => Promise<{ summary: SyncBlobSummary; meta: SyncBlobMeta } | null>;
  /** Download and apply sync blob from relay */
  restoreFromRemote: () => Promise<SyncImportResult | null>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const SyncContext = createContext<SyncContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function kvGet(key: string): string | null {
  try {
    const w = getWasm();
    if (!w) return null;
    const result = (w as any).umbra_wasm_plugin_kv_get(KV_NAMESPACE, key);
    if (!result) return null;
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

function kvSet(key: string, value: string): void {
  try {
    const w = getWasm();
    if (!w) return;
    (w as any).umbra_wasm_plugin_kv_set(KV_NAMESPACE, key, value);
  } catch {
    // Ignore KV write failures
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { preferencesReady, didChanged } = useUmbra();
  const { identity } = useAuth();

  // State
  const [syncEnabled, setSyncEnabledState] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Refs
  const authRef = useRef<SyncAuthResult | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSyncingRef = useRef(false);
  const mountedRef = useRef(true);
  const sectionVersionsRef = useRef<Record<string, number>>({});

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // ── Restore sync-enabled flag from per-account KV ─────────────────────
  useEffect(() => {
    if (!preferencesReady) return;
    const saved = kvGet(KEY_SYNC_ENABLED);
    // Also check the module-level pending flag (set by CreateWalletFlow before
    // login). On RN, the async native bridge may not have completed the KV write
    // by the time this effect runs.
    if (saved === 'true' || _pendingSyncOptIn) {
      setSyncEnabledState(true);
      if (_pendingSyncOptIn) {
        _pendingSyncOptIn = false;
        // Persist to KV (fire-and-forget) so it's available on next app launch
        kvSet(KEY_SYNC_ENABLED, 'true');
      }
    } else {
      setSyncEnabledState(false);
      setSyncStatus('disabled');
    }
  }, [preferencesReady, didChanged]);

  // ── Relay HTTP URL (reactive — updates when relay connects) ──────────
  const [relayHttpUrl, setRelayHttpUrl] = useState<string | null>(() => getRelayHttpUrl());
  useEffect(() => {
    // Pick up relay URL if already connected at mount
    const current = getRelayHttpUrl();
    if (current && current !== relayHttpUrl) setRelayHttpUrl(current);
    // Subscribe to future connection changes
    return subscribeRelayState((_connected, url) => {
      const httpUrl = url
        ? url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/ws\/?$/, '')
        : null;
      setRelayHttpUrl(httpUrl);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth helper ───────────────────────────────────────────────────────
  const ensureAuth = useCallback(async (): Promise<SyncAuthResult> => {
    const did = identity?.did;
    if (!did) throw new Error('No identity');
    if (!relayHttpUrl) throw new Error('No relay URL');

    // Reuse existing token if not expired
    if (authRef.current) {
      const now = Math.floor(Date.now() / 1000);
      if (authRef.current.expiresAt > now + TOKEN_REFRESH_BUFFER_MS / 1000) {
        return authRef.current;
      }
    }

    const auth = await authenticateSync(relayHttpUrl, did);
    authRef.current = auth;
    return auth;
  }, [identity?.did, relayHttpUrl]);

  // ── Sync upload ───────────────────────────────────────────────────────
  const doSyncUpload = useCallback(async () => {
    if (!identity?.did || !relayHttpUrl || !syncEnabled || isSyncingRef.current) return;

    isSyncingRef.current = true;
    if (mountedRef.current) {
      setSyncStatus('syncing');
      setSyncError(null);
    }

    try {
      const auth = await ensureAuth();
      const result = await uploadSyncBlob(
        relayHttpUrl,
        identity.did,
        auth.token,
        Object.keys(sectionVersionsRef.current).length > 0
          ? sectionVersionsRef.current
          : undefined,
      );

      // Update section versions for next upload
      sectionVersionsRef.current = result.sections;

      if (mountedRef.current) {
        const now = Date.now();
        setLastSyncedAt(now);
        setSyncStatus('synced');
        console.log(`[SyncContext] Upload complete (${result.size} bytes)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[SyncContext] Sync upload failed:', msg);
      if (mountedRef.current) {
        setSyncStatus('error');
        setSyncError(msg);
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [identity?.did, relayHttpUrl, syncEnabled, ensureAuth]);

  // ── Public API ────────────────────────────────────────────────────────

  const setSyncEnabled = useCallback((enabled: boolean) => {
    setSyncEnabledState(enabled);
    kvSet(KEY_SYNC_ENABLED, enabled ? 'true' : 'false');
    if (!enabled) {
      setSyncStatus('disabled');
      // Cancel any pending debounced sync
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    } else {
      setSyncStatus('idle');
    }
  }, []);

  const triggerSync = useCallback(async () => {
    // Cancel any pending debounced sync
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await doSyncUpload();
  }, [doSyncUpload]);

  const markDirty = useCallback((_section?: string) => {
    if (!syncEnabled) return;

    // Reset debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      doSyncUpload();
    }, DEBOUNCE_MS);
  }, [syncEnabled, doSyncUpload]);

  const deleteSyncData = useCallback(async () => {
    if (!identity?.did || !relayHttpUrl) return;
    try {
      const auth = await ensureAuth();
      await deleteSyncBlob(relayHttpUrl, identity.did, auth.token);
      if (mountedRef.current) {
        setLastSyncedAt(null);
        setSyncStatus('idle');
        sectionVersionsRef.current = {};
        console.log('[SyncContext] Remote sync data deleted');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[SyncContext] Delete sync data failed:', msg);
      if (mountedRef.current) {
        setSyncError(msg);
      }
    }
  }, [identity?.did, relayHttpUrl, ensureAuth]);

  const checkRemoteBlob = useCallback(async () => {
    if (!identity?.did || !relayHttpUrl) return null;
    try {
      const auth = await ensureAuth();
      const meta = await getSyncBlobMeta(relayHttpUrl, identity.did, auth.token);
      if (!meta) return null;

      const blob = await downloadSyncBlob(relayHttpUrl, identity.did, auth.token);
      if (!blob) return null;

      const summary = await parseSyncBlob(blob);
      return { summary, meta };
    } catch (err) {
      console.error('[SyncContext] Check remote blob failed:', err);
      return null;
    }
  }, [identity?.did, relayHttpUrl, ensureAuth]);

  const restoreFromRemote = useCallback(async (): Promise<SyncImportResult | null> => {
    if (!identity?.did || !relayHttpUrl) return null;
    try {
      const auth = await ensureAuth();
      const blob = await downloadSyncBlob(relayHttpUrl, identity.did, auth.token);
      if (!blob) return null;

      const result = await applySyncBlob(blob);
      console.log('[SyncContext] Restored from remote:', result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[SyncContext] Restore from remote failed:', msg);
      if (mountedRef.current) {
        setSyncError(msg);
      }
      return null;
    }
  }, [identity?.did, relayHttpUrl, ensureAuth]);

  // ── Listen for incoming sync deltas via relay WS ──────────────────────
  useEffect(() => {
    if (!syncEnabled || !preferencesReady) return;

    const handleSyncUpdate = (data: { section: string; version: number; encryptedData: string }) => {
      console.log(`[SyncContext] Received sync delta: ${data.section} v${data.version}`);
      // Apply the delta — for now, re-download full blob on any update
      // (true delta apply will be added when WASM supports partial apply)
      restoreFromRemote().catch((err) => {
        console.error('[SyncContext] Failed to apply incoming sync update:', err);
      });
    };

    registerSyncUpdateCallback(handleSyncUpdate);
    return () => unregisterSyncUpdateCallback(handleSyncUpdate);
  }, [syncEnabled, preferencesReady, restoreFromRemote]);

  // ── Context value ─────────────────────────────────────────────────────
  const value = useMemo<SyncContextValue>(() => ({
    syncEnabled,
    syncStatus,
    lastSyncedAt,
    syncError,
    setSyncEnabled,
    triggerSync,
    markDirty,
    deleteSyncData,
    checkRemoteBlob,
    restoreFromRemote,
  }), [
    syncEnabled, syncStatus, lastSyncedAt, syncError,
    setSyncEnabled, triggerSync, markDirty, deleteSyncData,
    checkRemoteBlob, restoreFromRemote,
  ]);

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return ctx;
}
