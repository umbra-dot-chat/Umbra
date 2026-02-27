import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { Identity } from '@umbra/service';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEY_IDENTITY = 'umbra_identity';
const STORAGE_KEY_REMEMBER = 'umbra_remember_me';
const STORAGE_KEY_PIN = 'umbra_pin';
const STORAGE_KEY_RECOVERY = 'umbra_recovery';
const STORAGE_KEY_ACCOUNTS = 'umbra_accounts';

// ---------------------------------------------------------------------------
// Multi-account types
// ---------------------------------------------------------------------------

export interface StoredAccount {
  did: string;
  displayName: string;
  avatar?: string;
  recoveryPhrase: string[];
  pin?: string;
  rememberMe: boolean;
  addedAt: number;
}

// ---------------------------------------------------------------------------
// Platform-aware async storage helpers
// ---------------------------------------------------------------------------
// On web: localStorage (synchronous, wrapped in async)
// On native: Rust SecureStore via expo-umbra-core native.call('secure_*', ...)
// ---------------------------------------------------------------------------

const isWeb = Platform.OS === 'web';

/** Get the native module for SecureStore calls (lazy, cached) */
let _nativeModule: any = null;
function getNative(): any {
  if (_nativeModule) return _nativeModule;
  try {
    const { getExpoUmbraCore } = require('@/modules/expo-umbra-core/src');
    _nativeModule = getExpoUmbraCore();
    return _nativeModule;
  } catch {
    return null;
  }
}

/**
 * Ensure the Rust FFI backend is initialized before we try to use SecureStore.
 *
 * AuthProvider mounts *above* UmbraProvider in the tree, so its hydration
 * useEffect can fire before UmbraService.initialize() has called umbra_init().
 * Without a running Rust backend, `native.call('secure_retrieve', ...)` throws
 * and hydration silently returns null → the user appears logged out.
 *
 * `umbra_init()` is idempotent: if UmbraProvider later calls it again, Rust
 * returns "Already initialized" (error code 101) which is handled gracefully.
 */
let _rustInitPromise: Promise<void> | null = null;
function ensureRustInit(native: any): Promise<void> {
  if (_rustInitPromise) return _rustInitPromise;
  _rustInitPromise = (async () => {
    try {
      const result = native.initialize('');
      // processResult() now returns error-as-JSON instead of throwing.
      // Check for error responses and handle "already initialized" (101) gracefully.
      if (typeof result === 'string' && result.startsWith('{"error"')) {
        try {
          const parsed = JSON.parse(result);
          if (parsed && parsed.error === true) {
            const code = parsed.error_code ?? 0;
            const message = parsed.error_message ?? 'Unknown error';
            // 101 = already initialized — that's fine
            if (code !== 101 && !message.includes('Already initialized')) {
              console.warn('[AuthContext] Rust init returned error:', message);
            }
            return; // Don't throw for init errors — they're usually benign
          }
        } catch { /* not valid JSON — ignore */ }
      }
    } catch (e: any) {
      // Fallback: some errors may still throw (e.g., module not loaded)
      const msg = e?.message ?? String(e);
      if (!msg.includes('Already initialized') && !msg.includes('101')) {
        console.warn('[AuthContext] Rust init failed:', e);
      }
    }
  })();
  return _rustInitPromise;
}

async function getStorageItem(key: string): Promise<string | null> {
  if (isWeb) {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  }

  // Native: use Rust SecureStore via dispatcher
  const native = getNative();
  if (!native) return null;
  try {
    await ensureRustInit(native);
    const resultJson = await native.call('secure_retrieve', JSON.stringify({ key }));
    // Check for error-as-JSON responses from processResult()
    if (typeof resultJson === 'string' && resultJson.startsWith('{"error"')) {
      try {
        const errCheck = JSON.parse(resultJson);
        if (errCheck && errCheck.error === true) return null; // Treat errors as "not found"
      } catch { /* not valid error JSON — try normal parse below */ }
    }
    const result = JSON.parse(resultJson);
    return result.value ?? null;
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
    return;
  }

  // Native: use Rust SecureStore via dispatcher
  const native = getNative();
  if (!native) return;
  try {
    await ensureRustInit(native);
    const result = await native.call('secure_store', JSON.stringify({ key, value }));
    // Check for error-as-JSON responses
    if (typeof result === 'string' && result.startsWith('{"error"')) {
      try {
        const errCheck = JSON.parse(result);
        if (errCheck && errCheck.error === true) {
          console.warn('[AuthContext] SecureStore write error:', errCheck.error_message);
        }
      } catch { /* ignore */ }
    }
  } catch (e) {
    console.warn('[AuthContext] SecureStore write failed:', e);
  }
}

async function removeStorageItem(key: string): Promise<void> {
  if (isWeb) {
    if (typeof window === 'undefined') return;
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    return;
  }

  // Native: use Rust SecureStore via dispatcher
  const native = getNative();
  if (!native) return;
  try {
    await ensureRustInit(native);
    const result = await native.call('secure_delete', JSON.stringify({ key }));
    // Check for error-as-JSON responses
    if (typeof result === 'string' && result.startsWith('{"error"')) {
      try {
        const errCheck = JSON.parse(result);
        if (errCheck && errCheck.error === true) {
          console.warn('[AuthContext] SecureStore delete error:', errCheck.error_message);
        }
      } catch { /* ignore */ }
    }
  } catch (e) {
    console.warn('[AuthContext] SecureStore delete failed:', e);
  }
}

// ---------------------------------------------------------------------------
// Synchronous web-only helpers for useState initializers (web only)
// ---------------------------------------------------------------------------

function getWebStorageItem(key: string): string | null {
  if (!isWeb || typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** The current user's identity, or null if not logged in */
  identity: Identity | null;
  /** Derived from identity !== null */
  isAuthenticated: boolean;
  /** Whether persisted auth state has been loaded (always true on web, async on native) */
  isHydrated: boolean;
  /** Set the identity after a successful create or import */
  login: (identity: Identity) => void;
  /** Directly update the identity in state (and persist if rememberMe is on) */
  setIdentity: (identity: Identity | null) => void;
  /** Clear the identity (return to auth screen) */
  logout: () => void;

  // Persistence
  /** Whether the user has opted to stay logged in */
  rememberMe: boolean;
  /** Toggle the remember-me preference */
  setRememberMe: (value: boolean) => void;

  // Recovery phrase (persisted for WASM identity restoration on page refresh)
  /** The recovery phrase words, or null if not stored */
  recoveryPhrase: string[] | null;
  /** Store the recovery phrase for session persistence */
  setRecoveryPhrase: (phrase: string[] | null) => void;

  // PIN lock
  /** The stored PIN, or null if not configured */
  pin: string | null;
  /** Derived: whether a PIN has been set */
  hasPin: boolean;
  /** Whether the user has verified their PIN this session */
  isPinVerified: boolean;
  /** Set or clear the PIN. Pass null to remove. */
  setPin: (pin: string | null) => void;
  /** Check a PIN attempt. Returns true on match and unlocks the session. */
  verifyPin: (attempt: string) => boolean;
  /** Re-lock the app (requires PIN again) */
  lockApp: () => void;

  // Multi-account
  /** All stored accounts on this device */
  accounts: StoredAccount[];
  /** Add or update an account in the stored list */
  addAccount: (account: StoredAccount) => void;
  /** Remove an account from the stored list (and its data) */
  removeAccount: (did: string) => void;
  /** Switch to a different stored account */
  switchAccount: (did: string) => Promise<void>;
  /** Re-login to a stored account from the auth screen (service may not be running) */
  loginFromStoredAccount: (did: string) => Promise<void>;
  /** Whether an account switch is currently in progress */
  isSwitching: boolean;
  /** Incremented on each account switch to trigger UmbraProvider remount */
  switchGeneration: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ─── State ──────────────────────────────────────────────────────────────
  // On web, we can initialize synchronously from localStorage.
  // On native, we start with defaults and hydrate asynchronously from SecureStore.

  const [identity, setIdentity] = useState<Identity | null>(() => {
    if (!isWeb) return null; // Will be hydrated async
    const remembered = getWebStorageItem(STORAGE_KEY_REMEMBER);
    if (remembered === 'true') {
      const saved = getWebStorageItem(STORAGE_KEY_IDENTITY);
      if (saved) {
        try { return JSON.parse(saved) as Identity; } catch { /* ignore */ }
      }
    }
    return null;
  });

  const [rememberMe, setRememberMeState] = useState<boolean>(() => {
    if (!isWeb) return false; // Will be hydrated async
    return getWebStorageItem(STORAGE_KEY_REMEMBER) === 'true';
  });

  const [pin, setPinState] = useState<string | null>(() => {
    if (!isWeb) return null; // Will be hydrated async
    return getWebStorageItem(STORAGE_KEY_PIN);
  });

  const [recoveryPhrase, setRecoveryPhraseState] = useState<string[] | null>(() => {
    if (!isWeb) return null; // Will be hydrated async
    const saved = getWebStorageItem(STORAGE_KEY_RECOVERY);
    if (saved) {
      try { return JSON.parse(saved) as string[]; } catch { /* ignore */ }
    }
    return null;
  });

  const [isPinVerified, setIsPinVerified] = useState(false);

  // Multi-account state
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    if (!isWeb) return [];
    const saved = getWebStorageItem(STORAGE_KEY_ACCOUNTS);
    if (saved) {
      try { return JSON.parse(saved) as StoredAccount[]; } catch { /* ignore */ }
    }
    return [];
  });
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchGeneration, setSwitchGeneration] = useState(0);

  // On web, hydration is immediate (synchronous localStorage). On native, async.
  const [isHydrated, setIsHydrated] = useState(isWeb);

  // ─── Native async hydration ─────────────────────────────────────────────
  useEffect(() => {
    if (isWeb) return; // Already hydrated synchronously

    let cancelled = false;

    async function hydrate() {
      try {
        const [rememberedStr, identityStr, pinStr, recoveryStr, accountsStr] = await Promise.all([
          getStorageItem(STORAGE_KEY_REMEMBER),
          getStorageItem(STORAGE_KEY_IDENTITY),
          getStorageItem(STORAGE_KEY_PIN),
          getStorageItem(STORAGE_KEY_RECOVERY),
          getStorageItem(STORAGE_KEY_ACCOUNTS),
        ]);

        if (cancelled) return;

        const remembered = rememberedStr === 'true';
        setRememberMeState(remembered);

        if (remembered && identityStr) {
          try {
            setIdentity(JSON.parse(identityStr) as Identity);
          } catch { /* ignore malformed JSON */ }
        }

        if (pinStr) {
          setPinState(pinStr);
        }

        if (recoveryStr) {
          try {
            setRecoveryPhraseState(JSON.parse(recoveryStr) as string[]);
          } catch { /* ignore */ }
        }

        if (accountsStr) {
          try {
            setAccounts(JSON.parse(accountsStr) as StoredAccount[]);
          } catch { /* ignore */ }
        }
      } catch (e) {
        console.warn('[AuthContext] Native hydration failed:', e);
      }

      if (!cancelled) {
        setIsHydrated(true);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  // ─── Defensive: ensure active identity is in accounts list ──────────────
  // Covers the case where an account was created before multi-account support
  // was added. Without this, the account switcher wouldn't show the user's
  // current account and "Add Account" → logout → create new → would make it
  // appear as if the old account was deleted.
  useEffect(() => {
    if (!isHydrated || !identity || !recoveryPhrase) return;
    // Use functional updater so we always read the latest accounts list
    // without needing `accounts` in the dependency array (avoids infinite loop).
    setAccounts((prev) => {
      if (prev.some((a) => a.did === identity.did)) return prev; // Already registered
      const updated = [...prev, {
        did: identity.did,
        displayName: identity.displayName ?? '',
        avatar: identity.avatar,
        recoveryPhrase,
        pin: pin ?? undefined,
        rememberMe,
        addedAt: identity.createdAt ?? Date.now(),
      }];
      setStorageItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updated));
      return updated;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, identity?.did, recoveryPhrase]);

  // ─── Ref for rememberMe ─────────────────────────────────────────────────
  const rememberMeRef = useRef(rememberMe);
  rememberMeRef.current = rememberMe;

  // ─── Callbacks ──────────────────────────────────────────────────────────

  const setRememberMe = useCallback((value: boolean) => {
    setRememberMeState(value);
    rememberMeRef.current = value;
    if (value) {
      setStorageItem(STORAGE_KEY_REMEMBER, 'true');
    } else {
      removeStorageItem(STORAGE_KEY_REMEMBER);
      removeStorageItem(STORAGE_KEY_IDENTITY);
    }
  }, []);

  const setRecoveryPhrase = useCallback((phrase: string[] | null) => {
    setRecoveryPhraseState(phrase);
    if (phrase) {
      setStorageItem(STORAGE_KEY_RECOVERY, JSON.stringify(phrase));
    } else {
      removeStorageItem(STORAGE_KEY_RECOVERY);
    }
  }, []);

  const login = useCallback((id: Identity) => {
    setIdentity(id);
    if (rememberMeRef.current) {
      setStorageItem(STORAGE_KEY_IDENTITY, JSON.stringify(id));
      setStorageItem(STORAGE_KEY_REMEMBER, 'true');
    }
  }, []);

  const updateIdentity = useCallback((id: Identity | null) => {
    setIdentity(id);
    if (id && rememberMeRef.current) {
      setStorageItem(STORAGE_KEY_IDENTITY, JSON.stringify(id));
    }
  }, []);

  const logout = useCallback(() => {
    setIdentity(null);
    setPinState(null);
    setRecoveryPhraseState(null);
    setIsPinVerified(false);
    // Always clear persisted data on logout
    removeStorageItem(STORAGE_KEY_IDENTITY);
    removeStorageItem(STORAGE_KEY_REMEMBER);
    removeStorageItem(STORAGE_KEY_PIN);
    removeStorageItem(STORAGE_KEY_RECOVERY);
  }, []);

  const setPin = useCallback((newPin: string | null) => {
    setPinState(newPin);
    if (newPin !== null) {
      setIsPinVerified(true);
      if (rememberMeRef.current) {
        setStorageItem(STORAGE_KEY_PIN, newPin);
      }
    } else {
      setIsPinVerified(false);
      removeStorageItem(STORAGE_KEY_PIN);
    }
  }, []);

  const verifyPin = useCallback(
    (attempt: string) => {
      if (attempt === pin) {
        setIsPinVerified(true);
        return true;
      }
      return false;
    },
    [pin],
  );

  const lockApp = useCallback(() => {
    setIsPinVerified(false);
  }, []);

  // ─── Multi-account callbacks ──────────────────────────────────────────

  /** Add or update an account in the stored list */
  const addAccount = useCallback((account: StoredAccount) => {
    setAccounts((prev) => {
      const exists = prev.findIndex((a) => a.did === account.did);
      let updated: StoredAccount[];
      if (exists >= 0) {
        // Update existing entry (preserves addedAt, merges new fields)
        updated = [...prev];
        updated[exists] = { ...prev[exists], ...account };
      } else {
        updated = [...prev, account];
      }
      setStorageItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** Remove an account from the stored list */
  const removeAccount = useCallback((did: string) => {
    setAccounts((prev) => {
      const updated = prev.filter((a) => a.did !== did);
      setStorageItem(STORAGE_KEY_ACCOUNTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** Ref to latest accounts for use inside switchAccount without stale closure */
  const accountsRef = useRef(accounts);
  accountsRef.current = accounts;

  /**
   * Switch to a different stored account.
   *
   * Orchestrates: DB flush → service shutdown → WASM reset → state swap →
   * UmbraProvider remount (via switchGeneration key change).
   */
  const switchAccount = useCallback(async (did: string) => {
    const target = accountsRef.current.find((a) => a.did === did);
    if (!target) {
      console.warn('[AuthContext] switchAccount: account not found for DID:', did.slice(0, 20));
      return;
    }

    setIsSwitching(true);

    try {
      // 1. Flush and close the current database (persist to IndexedDB)
      const { flushAndCloseSqlBridge } = await import('@umbra/wasm');
      await flushAndCloseSqlBridge();

      // 2. Shutdown the service (clears event bridge + singleton)
      const { UmbraService } = await import('@umbra/service');
      await UmbraService.shutdown();

      // 3. Reset the WASM loader so initUmbraWasm() can re-run with new DID
      const { resetWasm } = await import('@umbra/wasm');
      resetWasm();

      // 4. Update auth state to the target account
      const targetIdentity: Identity = {
        did: target.did,
        displayName: target.displayName,
        avatar: target.avatar,
        createdAt: target.addedAt,
      };

      setIdentity(targetIdentity);
      setRecoveryPhraseState(target.recoveryPhrase);
      setPinState(target.pin ?? null);
      setIsPinVerified(false);

      // Persist active identity
      setStorageItem(STORAGE_KEY_IDENTITY, JSON.stringify(targetIdentity));
      setStorageItem(STORAGE_KEY_REMEMBER, 'true');
      setStorageItem(STORAGE_KEY_RECOVERY, JSON.stringify(target.recoveryPhrase));
      if (target.pin) {
        setStorageItem(STORAGE_KEY_PIN, target.pin);
      } else {
        removeStorageItem(STORAGE_KEY_PIN);
      }

      // 5. Bump switchGeneration — triggers UmbraProvider remount
      setSwitchGeneration((g) => g + 1);

      console.log('[AuthContext] Switched to account:', target.displayName);
    } catch (err) {
      console.error('[AuthContext] Account switch failed:', err);
    } finally {
      setIsSwitching(false);
    }
  }, []);

  /**
   * Re-login to a stored account from the auth screen.
   *
   * Similar to switchAccount but handles the case where the WASM service
   * may not be fully initialized (coming from the unauthenticated state).
   * PIN verification is expected to happen on the auth screen *before*
   * calling this — isPinVerified is set to true unconditionally.
   */
  const loginFromStoredAccount = useCallback(async (did: string) => {
    const target = accountsRef.current.find((a) => a.did === did);
    if (!target) {
      console.warn('[AuthContext] loginFromStoredAccount: account not found for DID:', did.slice(0, 20));
      return;
    }

    setIsSwitching(true);

    try {
      // 1. Try to flush and close any existing database (may fail if not initialized)
      try {
        const { flushAndCloseSqlBridge } = await import('@umbra/wasm');
        await flushAndCloseSqlBridge();
      } catch { /* Expected if WASM/service isn't running yet */ }

      // 2. Try to shutdown the service if it's running
      try {
        const { UmbraService } = await import('@umbra/service');
        if (UmbraService.isInitialized) {
          await UmbraService.shutdown();
        }
      } catch { /* Expected if service isn't initialized */ }

      // 3. Reset the WASM loader so it can re-initialize with the new DID
      try {
        const { resetWasm } = await import('@umbra/wasm');
        resetWasm();
      } catch { /* May fail if WASM was never loaded */ }

      // 4. Update auth state to the target account
      const targetIdentity: Identity = {
        did: target.did,
        displayName: target.displayName,
        avatar: target.avatar,
        createdAt: target.addedAt,
      };

      setIdentity(targetIdentity);
      setRecoveryPhraseState(target.recoveryPhrase);
      setPinState(target.pin ?? null);
      // PIN was already verified on the auth screen before this was called
      setIsPinVerified(true);

      // Persist active identity
      setStorageItem(STORAGE_KEY_IDENTITY, JSON.stringify(targetIdentity));
      setStorageItem(STORAGE_KEY_REMEMBER, 'true');
      setStorageItem(STORAGE_KEY_RECOVERY, JSON.stringify(target.recoveryPhrase));
      if (target.pin) {
        setStorageItem(STORAGE_KEY_PIN, target.pin);
      } else {
        removeStorageItem(STORAGE_KEY_PIN);
      }

      // 5. Bump switchGeneration — triggers UmbraProvider remount
      setSwitchGeneration((g) => g + 1);

      console.log('[AuthContext] Re-logged into stored account:', target.displayName);
    } catch (err) {
      console.error('[AuthContext] loginFromStoredAccount failed:', err);
    } finally {
      setIsSwitching(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      identity,
      isAuthenticated: identity !== null,
      isHydrated,
      login,
      setIdentity: updateIdentity,
      logout,
      rememberMe,
      setRememberMe,
      recoveryPhrase,
      setRecoveryPhrase,
      pin,
      hasPin: pin !== null,
      isPinVerified,
      setPin,
      verifyPin,
      lockApp,
      accounts,
      addAccount,
      removeAccount,
      switchAccount,
      loginFromStoredAccount,
      isSwitching,
      switchGeneration,
    }),
    [identity, isHydrated, login, updateIdentity, logout, rememberMe, setRememberMe, recoveryPhrase, setRecoveryPhrase, pin, isPinVerified, setPin, verifyPin, lockApp, accounts, addAccount, removeAccount, switchAccount, loginFromStoredAccount, isSwitching, switchGeneration],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
