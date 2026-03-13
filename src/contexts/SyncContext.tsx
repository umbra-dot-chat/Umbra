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
  getUsername as apiGetUsername,
  registerUsername as apiRegisterUsername,
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
import { dbg } from '@/utils/debug';
import {
  getRelayHttpUrl,
  subscribeRelayState,
  registerSyncUpdateCallback,
  unregisterSyncUpdateCallback,
  sendSyncPush,
} from '@/hooks/useNetwork';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const KV_NAMESPACE = '__umbra_system__';
const KEY_SYNC_ENABLED = '__sync_enabled__';
const KEY_LAST_SYNCED = '__sync_last_synced__';
const DEBOUNCE_MS = 5_000;
const TOKEN_REFRESH_BUFFER_MS = 60_000;
const SRC = 'SyncProvider';

// Module-level flag for sync opt-in during account creation.
// The KV write from CreateWalletFlow may not complete before SyncContext reads
// the database (async native bridge on RN), so CreateWalletFlow sets this flag
// synchronously before calling login(). SyncContext checks this flag on mount.
let _pendingSyncOptIn = false;

/** Set the pending sync opt-in flag (called from CreateWalletFlow). */
export function setPendingSyncOptIn(value: boolean): void {
  _pendingSyncOptIn = value;
}

// Module-level dirty callback — preference providers call this to trigger sync
// without needing React context (they render ABOVE SyncProvider).
type DirtyCallback = (section?: string) => void;
let _dirtyCallback: DirtyCallback | null = null;

/**
 * Mark sync data as dirty from outside React context.
 * Called by ThemeContext, FontContext, SoundContext, etc. when preferences change.
 */
export function markSyncDirty(section?: string): void {
  _dirtyCallback?.(section);
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

async function kvGet(key: string): Promise<string | null> {
  try {
    const w = getWasm();
    if (!w) return null;
    const result = await (w as any).umbra_wasm_plugin_kv_get(KV_NAMESPACE, key);
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
  if (__DEV__) dbg.trackRender(SRC);
  const { preferencesReady, didChanged, bumpSyncVersion } = useUmbra();
  const { identity, setIdentity } = useAuth();

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
  // Keep a stable ref to the latest identity to avoid recreating restoreFromRemote
  // every time identity changes (which would re-register sync callbacks).
  const identityRef = useRef(identity);
  identityRef.current = identity;

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

  // ── Restore sync-enabled flag and lastSyncedAt from per-account KV ──
  useEffect(() => {
    if (!preferencesReady) return;

    async function restoreSyncState() {
      if (__DEV__) dbg.info('sync', 'restoreSyncState START', undefined, SRC);
      const saved = await kvGet(KEY_SYNC_ENABLED);
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
        setSyncStatus('idle');
      } else {
        setSyncEnabledState(false);
        setSyncStatus('disabled');
      }

      // Restore lastSyncedAt
      const savedTs = await kvGet(KEY_LAST_SYNCED);
      if (savedTs) {
        const ts = parseInt(savedTs, 10);
        if (!isNaN(ts)) {
          setLastSyncedAt(ts);
          setSyncStatus('synced');
        }
      }
    }

    restoreSyncState();
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
    if (__DEV__) dbg.info('sync', 'doSyncUpload START', undefined, SRC);
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

      // Notify other sessions via WebSocket so they pick up the new blob
      sendSyncPush(result.sections);

      if (mountedRef.current) {
        const now = Date.now();
        setLastSyncedAt(now);
        setSyncStatus('synced');
        kvSet(KEY_LAST_SYNCED, String(now));
        if (__DEV__) dbg.info('sync', `doSyncUpload DONE (${result.size} bytes)`, undefined, SRC);
        if (__DEV__) dbg.info('sync', 'Upload complete', { size: result.size }, SRC);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (__DEV__) dbg.error('sync', 'doSyncUpload FAILED', err, SRC);
      if (__DEV__) dbg.error('sync', 'Sync upload failed', { message: msg }, SRC);
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
        if (__DEV__) dbg.info('sync', 'Remote sync data deleted', undefined, SRC);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (__DEV__) dbg.error('sync', 'Delete sync data failed', { message: msg }, SRC);
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
      if (__DEV__) dbg.error('sync', 'Check remote blob failed', err, SRC);
      return null;
    }
  }, [identity?.did, relayHttpUrl, ensureAuth]);

  const restoreFromRemote = useCallback(async (): Promise<SyncImportResult | null> => {
    const id = identityRef.current;
    if (!id?.did || !relayHttpUrl) return null;
    if (__DEV__) dbg.info('sync', 'restoreFromRemote START', undefined, SRC);
    try {
      const auth = await ensureAuth();
      const blob = await downloadSyncBlob(relayHttpUrl, id.did, auth.token);
      if (!blob) { if (__DEV__) dbg.info('sync', 'restoreFromRemote: no blob', undefined, SRC); return null; }

      const result = await applySyncBlob(blob);
      // Signal preference contexts to re-read from KV
      bumpSyncVersion();

      // Sync display name, avatar, and banner from the blob.
      // Collect all changes and apply as a SINGLE setIdentity call to avoid
      // cascading re-renders (each setIdentity triggers context propagation).
      try {
        const currentId = identityRef.current;
        if (currentId) {
          const [syncedName, syncedAvatar, syncedBanner] = await Promise.all([
            kvGet('__display_name__').catch(() => null),
            kvGet('__avatar__').catch(() => null),
            kvGet('__banner__').catch(() => null),
          ]);

          const updates: Record<string, unknown> = {};
          const profileUpdates: Record<string, unknown> = {};

          if (syncedName && syncedName !== currentId.displayName) {
            updates.displayName = syncedName;
            profileUpdates.display_name = syncedName;
          }
          if (syncedAvatar !== null && syncedAvatar !== (currentId.avatar ?? '')) {
            const avatarValue = syncedAvatar || null;
            updates.avatar = avatarValue ?? undefined;
            profileUpdates.avatar = avatarValue;
          }
          if (syncedBanner !== null && syncedBanner !== (currentId.banner ?? '')) {
            const bannerValue = syncedBanner || null;
            updates.banner = bannerValue ?? undefined;
            profileUpdates.banner = bannerValue;
          }

          if (Object.keys(profileUpdates).length > 0) {
            const w = getWasm();
            if (w) {
              await w.umbra_wasm_identity_update_profile(JSON.stringify(profileUpdates));
            }
            // Single setIdentity call instead of 3 separate ones
            setIdentity({ ...currentId, ...updates });
            if (__DEV__) dbg.info('sync', 'identity profile synced', updates, SRC);
            if (__DEV__) dbg.info('sync', 'Profile synced', { keys: Object.keys(updates) }, SRC);
          }
        }
      } catch { /* ignore — profile sync is best-effort */ }

      // Restore username if synced in the blob
      try {
        const syncedUsername = await kvGet('__username__');
        const currentId = identityRef.current;
        if (syncedUsername && currentId?.did) {
          // Check if the relay already has this username for this DID
          const current = await apiGetUsername(currentId.did);
          if (!current.username || current.username !== syncedUsername) {
            // Extract the name portion (before #) and re-register
            const namePart = syncedUsername.split('#')[0];
            if (namePart) {
              await apiRegisterUsername(currentId.did, namePart);
              if (__DEV__) dbg.info('sync', 'Username reclaimed from sync', { syncedUsername }, SRC);
            }
          }
        }
      } catch (e) {
        if (__DEV__) dbg.warn('sync', 'Username restore best-effort failed', e, SRC);
      }

      if (__DEV__) dbg.info('sync', 'restoreFromRemote DONE', { imported: result.imported }, SRC);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (__DEV__) dbg.error('sync', 'restoreFromRemote FAILED', err, SRC);
      if (__DEV__) dbg.error('sync', 'Restore from remote failed', { message: msg }, SRC);
      if (mountedRef.current) {
        setSyncError(msg);
      }
      return null;
    }
  }, [relayHttpUrl, ensureAuth, bumpSyncVersion, setIdentity]);

  // ── Register module-level dirty callback ────────────────────────────
  // This allows preference contexts (ThemeContext, FontContext, SoundContext)
  // which render ABOVE SyncProvider to trigger syncs via markSyncDirty().
  useEffect(() => {
    _dirtyCallback = markDirty;
    return () => {
      if (_dirtyCallback === markDirty) {
        _dirtyCallback = null;
      }
    };
  }, [markDirty]);

  // ── Initial sync upload when sync is enabled ──────────────────────
  // When syncEnabled transitions to true AND we have a relay URL, do an
  // initial upload so the relay has a copy of the current state.
  const prevSyncEnabledRef = useRef(false);
  useEffect(() => {
    if (syncEnabled && !prevSyncEnabledRef.current && relayHttpUrl && identity?.did) {
      // Sync just got enabled — do an initial upload after a short delay
      // to let preference contexts finish mounting.
      const timer = setTimeout(() => {
        doSyncUpload();
      }, 2_000);
      prevSyncEnabledRef.current = true;
      return () => clearTimeout(timer);
    }
    prevSyncEnabledRef.current = syncEnabled;
  }, [syncEnabled, relayHttpUrl, identity?.did, doSyncUpload]);

  // ── Listen for incoming sync deltas via relay WS ──────────────────────
  // Debounce incoming sync_update messages: the relay sends one per section
  // (blocked, friends, groups, preferences), but we only need to download
  // and apply the blob once.
  const syncUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!syncEnabled || !preferencesReady) return;

    const handleSyncUpdate = (_data: { section: string; version: number; encryptedData: string }) => {
      // Debounce: coalesce rapid-fire section updates into a single restore
      if (syncUpdateTimerRef.current) {
        clearTimeout(syncUpdateTimerRef.current);
      }
      syncUpdateTimerRef.current = setTimeout(() => {
        syncUpdateTimerRef.current = null;
        restoreFromRemote().catch((err) => {
          if (__DEV__) dbg.error('sync', 'Failed to apply incoming sync update', err, SRC);
        });
      }, 300);
    };

    registerSyncUpdateCallback(handleSyncUpdate);
    return () => {
      unregisterSyncUpdateCallback(handleSyncUpdate);
      if (syncUpdateTimerRef.current) {
        clearTimeout(syncUpdateTimerRef.current);
        syncUpdateTimerRef.current = null;
      }
    };
  }, [syncEnabled, preferencesReady, restoreFromRemote]);

  // ── Sync on load: download latest blob from relay on every launch ──
  // Ensures devices that were offline catch up on changes from other devices
  // without requiring the user to manually click "Sync Now".
  const didInitialSyncRef = useRef(false);
  useEffect(() => {
    if (!syncEnabled || !preferencesReady || !relayHttpUrl || !identity?.did) return;
    if (didInitialSyncRef.current) return;
    didInitialSyncRef.current = true;

    // Small delay to ensure preference contexts are mounted
    const timer = setTimeout(() => {
      restoreFromRemote().catch((err) => {
        if (__DEV__) dbg.error('sync', 'Initial sync-on-load failed', err, SRC);
      });
    }, 1_500);

    return () => clearTimeout(timer);
  }, [syncEnabled, preferencesReady, relayHttpUrl, identity?.did, restoreFromRemote]);

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
