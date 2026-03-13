/**
 * UmbraContext — Root provider for the Umbra backend service.
 *
 * Initializes the WASM module, creates the UmbraService instance,
 * and provides it to the entire component tree.
 *
 * ## Usage
 *
 * Wrap your app with `<UmbraProvider>`:
 *
 * ```tsx
 * <UmbraProvider>
 *   <App />
 * </UmbraProvider>
 * ```
 *
 * Then consume in components:
 *
 * ```tsx
 * const { isReady, service, error } = useUmbra();
 * ```
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { UmbraService } from '@umbra/service';
import type { InitConfig } from '@umbra/service';
import { getWasm, enablePersistence } from '@umbra/wasm';
import { useAuth } from '@/contexts/AuthContext';
import { dbg } from '@/utils/debug';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Granular initialization stage for loading screen progress */
export type InitStage = 'booting' | 'loading-db' | 'restoring-identity' | 'loading-data' | 'ready' | 'hydrating' | 'hydrated';

export interface UmbraContextValue {
  /** Whether the WASM module is loaded and ready */
  isReady: boolean;
  /** Whether we're currently loading the WASM module */
  isLoading: boolean;
  /** Error if WASM loading failed */
  error: Error | null;
  /** The UmbraService singleton (null while loading) */
  service: UmbraService | null;
  /** WASM module version string */
  version: string;
  /** Granular init stage for loading screen progress */
  initStage: InitStage;
  /** Whether the per-account database is loaded and identity hydrated — safe to read preferences */
  preferencesReady: boolean;
  /** Counter that increments on account switch — triggers preference contexts to re-read from the new account's DB */
  didChanged: number;
  /** Counter that increments when remote sync applies preferences — triggers contexts to re-read from KV */
  syncVersion: number;
  /** Increment syncVersion to signal that preferences were updated by a sync restore */
  bumpSyncVersion: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const UmbraContext = createContext<UmbraContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface UmbraProviderProps {
  children: React.ReactNode;
  config?: InitConfig;
}

const SRC = 'UmbraProvider';

export function UmbraProvider({ children, config }: UmbraProviderProps) {
  if (__DEV__) dbg.trackRender(SRC);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState('');
  const [initStage, setInitStage] = useState<InitStage>('booting');
  const [didChanged, setDidChanged] = useState(0);
  const [syncVersion, setSyncVersion] = useState(0);
  const bumpSyncVersion = useCallback(() => setSyncVersion((c) => c + 1), []);
  const prevDidRef = useRef<string | null>(null);
  const hydrationDoneRef = useRef(false);
  const { identity, recoveryPhrase, isHydrated } = useAuth();
  // Refs so the hydration effect can access current values without depending on
  // the full object references (which change on display name / avatar updates).
  const identityRef = useRef(identity);
  identityRef.current = identity;
  const phraseRef = useRef(recoveryPhrase);
  phraseRef.current = recoveryPhrase;

  // Track DID changes — increments didChanged counter so downstream preference
  // contexts know to re-read from the new account's per-DID database.
  useEffect(() => {
    const currentDid = identity?.did ?? null;
    if (prevDidRef.current !== null && currentDid !== prevDidRef.current) {
      setDidChanged((c) => c + 1);
      // Reset hydration guard so the new account gets hydrated
      hydrationDoneRef.current = false;
    }
    prevDidRef.current = currentDid;
  }, [identity?.did]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const endTimer = __DEV__ ? dbg.time('UmbraService.initialize') : null;
      try {
        // If we have a persisted identity with a DID, pass it to the
        // initialization so the database can be restored from IndexedDB
        const persistedDid = identity?.did;
        const initConfig: InitConfig = {
          ...config,
          ...(persistedDid ? { did: persistedDid } : {}),
        };

        if (__DEV__) dbg.info('lifecycle', 'UmbraService.initialize START', { persistedDid: persistedDid?.slice(0, 20), hasConfig: !!config }, SRC);

        if (persistedDid) {
          setInitStage('loading-db');
          if (__DEV__) dbg.info('lifecycle', 'initStage → loading-db', undefined, SRC);
        }

        await UmbraService.initialize(initConfig);
        if (__DEV__) dbg.info('lifecycle', 'UmbraService.initialize COMPLETE', undefined, SRC);

        // Yield to let the native bridge (Expo Modules / TurboModule) finish
        // any pending async work before downstream contexts start firing
        // FFI calls. Without this, multiple plugin_kv_get calls hit the
        // bridge simultaneously on startup and can trigger Hermes GC heap
        // corruption via concurrent NSException-to-JSError conversion.
        await new Promise((r) => setTimeout(r, 0));

        if (!cancelled) {
          const v = UmbraService.getVersion();
          setVersion(v);
          setIsReady(true);
          setIsLoading(false);
          setInitStage('ready');
          if (__DEV__) { dbg.info('lifecycle', 'initStage → ready', { version: v }, SRC); endTimer?.(); }
        }
      } catch (err) {
        if (!cancelled) {
          if (__DEV__) { dbg.error('lifecycle', 'UmbraService.initialize FAILED', err, SRC); endTimer?.(); }
          if (__DEV__) dbg.error('lifecycle', 'Initialization failed', err, SRC);
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []); // Only initialize once

  // Restore backend identity from persisted AuthContext identity.
  //
  // On WASM, identity_set is a no-op — the only way to restore keys is via
  // restoreIdentity (using the persisted recovery phrase). Without this, all
  // operations that require an identity (friend requests, P2P network, etc.)
  // fail with "No identity loaded" after a page refresh.
  //
  // On Tauri, identity_set works via IPC to configure the backend.
  // Hydration: restore the backend identity from AuthContext.
  // Depends on identity?.did (not the full identity object) so that cosmetic
  // updates (display name, avatar, banner from sync) don't re-trigger a full
  // hydration cycle. The effect reads identity/phrase from refs instead.
  useEffect(() => {
    const currentDid = identity?.did;
    if (!isReady || !isHydrated || !currentDid) {
      if (__DEV__) dbg.debug('lifecycle', 'hydrateIdentity SKIP', { isReady, isHydrated, hasDid: !!currentDid }, SRC);
      return;
    }

    // Guard: don't re-hydrate if already done for this DID
    if (hydrationDoneRef.current) {
      if (__DEV__) dbg.debug('lifecycle', 'hydrateIdentity SKIP (already hydrated)', undefined, SRC);
      return;
    }

    setInitStage('hydrating');
    if (__DEV__) dbg.info('lifecycle', 'initStage → hydrating', undefined, SRC);

    async function hydrateIdentity() {
      const endTimer = __DEV__ ? dbg.time('hydrateIdentity') : null;
      // Read current values from refs (stable across renders)
      const currentIdentity = identityRef.current;
      const currentPhrase = phraseRef.current;

      try {
        const w = getWasm();
        if (!w) {
          if (__DEV__) dbg.warn('lifecycle', 'hydrateIdentity: no WASM module', undefined, SRC);
          setInitStage('hydrated');
          hydrationDoneRef.current = true;
          return;
        }

        setInitStage('restoring-identity');
        if (__DEV__) dbg.info('lifecycle', 'initStage → restoring-identity', undefined, SRC);

        // Check if backend already has an identity loaded
        let backendDid: string | null = null;
        try {
          backendDid = await w.umbra_wasm_identity_get_did();
          if (__DEV__) dbg.info('service', 'umbra_wasm_identity_get_did', { backendDid: backendDid?.slice(0, 20) }, SRC);
        } catch {
          if (__DEV__) dbg.info('lifecycle', 'No identity loaded in backend (expected on fresh restart)', undefined, SRC);
        }

        if (!backendDid) {
          // Try restoring via recovery phrase first (required for WASM)
          if (currentPhrase && currentPhrase.length === 24) {
            try {
              if (__DEV__) dbg.info('service', 'restoreIdentity via recovery phrase START', undefined, SRC);
              const svc = UmbraService.instance;
              await svc.restoreIdentity(currentPhrase, currentIdentity?.displayName ?? '');
              if (__DEV__) dbg.info('service', 'restoreIdentity via recovery phrase SUCCESS', undefined, SRC);
              if (__DEV__) dbg.info('lifecycle', 'Restored WASM identity via recovery phrase', undefined, SRC);
            } catch (restoreErr) {
              if (__DEV__) dbg.warn('service', 'restoreIdentity FAILED, falling back', restoreErr, SRC);
              if (__DEV__) dbg.warn('lifecycle', 'restoreIdentity failed', restoreErr, SRC);
              // Fall back to identity_set (works on Tauri)
              if (typeof w.umbra_wasm_identity_set === 'function') {
                await w.umbra_wasm_identity_set(JSON.stringify({
                  did: currentDid,
                  display_name: currentIdentity?.displayName ?? '',
                }));
                if (__DEV__) dbg.info('service', 'identity_set fallback SUCCESS', undefined, SRC);
                if (__DEV__) dbg.info('lifecycle', 'Fell back to identity_set', undefined, SRC);
              }
            }
          } else if (typeof w.umbra_wasm_identity_set === 'function') {
            // No recovery phrase — use identity_set (Tauri path)
            if (__DEV__) dbg.info('service', 'identity_set (no recovery phrase) START', undefined, SRC);
            await w.umbra_wasm_identity_set(JSON.stringify({
              did: currentDid,
              display_name: currentIdentity?.displayName ?? '',
            }));
            if (__DEV__) dbg.info('service', 'identity_set SUCCESS', undefined, SRC);
            if (__DEV__) dbg.info('lifecycle', 'Restored backend identity via identity_set', undefined, SRC);
          }
        } else {
          if (__DEV__) dbg.info('lifecycle', 'Backend already has identity loaded, skipping restore', undefined, SRC);
        }

        setInitStage('loading-data');
        if (__DEV__) dbg.info('lifecycle', 'initStage → loading-data', undefined, SRC);
      } catch (err) {
        if (__DEV__) dbg.error('lifecycle', 'hydrateIdentity FAILED', err, SRC);
        if (__DEV__) dbg.warn('lifecycle', 'Failed to restore backend identity', err, SRC);
      }

      hydrationDoneRef.current = true;
      setInitStage('hydrated');
      if (__DEV__) dbg.info('lifecycle', 'initStage → hydrated', undefined, SRC);
      endTimer?.();
    }

    hydrateIdentity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isHydrated, identity?.did]);

  const preferencesReady = initStage === 'hydrated';

  const value = useMemo<UmbraContextValue>(() => {
    let service: UmbraService | null = null;
    if (isReady) {
      try {
        service = UmbraService.instance;
      } catch {
        // Instance may be unavailable during hot-reload when static state resets
        // but React state hasn't re-synced yet. This is a transient condition.
      }
    }
    return { isReady, isLoading, error, service, version, initStage, preferencesReady, didChanged, syncVersion, bumpSyncVersion };
  }, [isReady, isLoading, error, version, initStage, preferencesReady, didChanged, syncVersion, bumpSyncVersion]);

  return (
    <UmbraContext.Provider value={value}>
      {children}
    </UmbraContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Access the Umbra service context.
 *
 * Must be used within an `<UmbraProvider>`.
 *
 * @returns The Umbra context value
 * @throws If used outside of UmbraProvider
 */
export function useUmbra(): UmbraContextValue {
  const context = useContext(UmbraContext);
  if (!context) {
    throw new Error(
      'useUmbra must be used within an <UmbraProvider>. ' +
      'Wrap your app with <UmbraProvider> in the root layout.'
    );
  }
  return context;
}
