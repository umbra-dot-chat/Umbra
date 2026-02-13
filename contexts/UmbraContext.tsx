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
  useMemo,
} from 'react';
import { UmbraService } from '@umbra/service';
import type { InitConfig } from '@umbra/service';
import { getWasm, enablePersistence } from '@umbra/wasm';
import { useAuth } from '@/contexts/AuthContext';

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

export function UmbraProvider({ children, config }: UmbraProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState('');
  const [initStage, setInitStage] = useState<InitStage>('booting');
  const { identity, recoveryPhrase } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // If we have a persisted identity with a DID, pass it to the
        // initialization so the database can be restored from IndexedDB
        const persistedDid = identity?.did;
        const initConfig: InitConfig = {
          ...config,
          ...(persistedDid ? { did: persistedDid } : {}),
        };

        if (persistedDid) {
          setInitStage('loading-db');
        }

        await UmbraService.initialize(initConfig);

        if (!cancelled) {
          setVersion(UmbraService.getVersion());
          setIsReady(true);
          setIsLoading(false);
          setInitStage('ready');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[UmbraProvider] Initialization failed:', err);
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
  useEffect(() => {
    if (!isReady || !identity) return;

    const currentIdentity = identity;
    const currentPhrase = recoveryPhrase;
    setInitStage('hydrating');

    async function hydrateIdentity() {
      try {
        const w = getWasm();
        if (!w) {
          setInitStage('hydrated');
          return;
        }

        setInitStage('restoring-identity');

        // Check if backend already has an identity loaded
        let currentDid: string | null = null;
        try {
          currentDid = await w.umbra_wasm_identity_get_did();
        } catch {
          // No identity loaded — expected on fresh restart
        }

        if (!currentDid) {
          // Try restoring via recovery phrase first (required for WASM)
          if (currentPhrase && currentPhrase.length === 24) {
            try {
              const svc = UmbraService.instance;
              await svc.restoreIdentity(currentPhrase, currentIdentity.displayName);
              console.log('[UmbraProvider] Restored WASM identity via recovery phrase');
            } catch (restoreErr) {
              console.warn('[UmbraProvider] restoreIdentity failed:', restoreErr);
              // Fall back to identity_set (works on Tauri)
              if (typeof w.umbra_wasm_identity_set === 'function') {
                await w.umbra_wasm_identity_set(JSON.stringify({
                  did: currentIdentity.did,
                  display_name: currentIdentity.displayName,
                }));
                console.log('[UmbraProvider] Fell back to identity_set');
              }
            }
          } else if (typeof w.umbra_wasm_identity_set === 'function') {
            // No recovery phrase — use identity_set (Tauri path)
            await w.umbra_wasm_identity_set(JSON.stringify({
              did: currentIdentity.did,
              display_name: currentIdentity.displayName,
            }));
            console.log('[UmbraProvider] Restored backend identity via identity_set');
          }
        }

        setInitStage('loading-data');
      } catch (err) {
        console.warn('[UmbraProvider] Failed to restore backend identity:', err);
      }

      setInitStage('hydrated');
    }

    hydrateIdentity();
  }, [isReady, identity, recoveryPhrase]);

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
    return { isReady, isLoading, error, service, version, initStage };
  }, [isReady, isLoading, error, version, initStage]);

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
