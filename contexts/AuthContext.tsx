import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { Identity } from '@/packages/umbra-service/src';

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const STORAGE_KEY_IDENTITY = 'umbra_identity';
const STORAGE_KEY_REMEMBER = 'umbra_remember_me';
const STORAGE_KEY_PIN = 'umbra_pin';
const STORAGE_KEY_RECOVERY = 'umbra_recovery';

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

async function getStorageItem(key: string): Promise<string | null> {
  if (isWeb) {
    if (typeof window === 'undefined') return null;
    try { return localStorage.getItem(key); } catch { return null; }
  }

  // Native: use Rust SecureStore via dispatcher
  const native = getNative();
  if (!native) return null;
  try {
    const resultJson = await native.call('secure_retrieve', JSON.stringify({ key }));
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
    await native.call('secure_store', JSON.stringify({ key, value }));
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
    await native.call('secure_delete', JSON.stringify({ key }));
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

  // On web, hydration is immediate (synchronous localStorage). On native, async.
  const [isHydrated, setIsHydrated] = useState(isWeb);

  // ─── Native async hydration ─────────────────────────────────────────────
  useEffect(() => {
    if (isWeb) return; // Already hydrated synchronously

    let cancelled = false;

    async function hydrate() {
      try {
        const [rememberedStr, identityStr, pinStr, recoveryStr] = await Promise.all([
          getStorageItem(STORAGE_KEY_REMEMBER),
          getStorageItem(STORAGE_KEY_IDENTITY),
          getStorageItem(STORAGE_KEY_PIN),
          getStorageItem(STORAGE_KEY_RECOVERY),
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
    }),
    [identity, isHydrated, login, updateIdentity, logout, rememberMe, setRememberMe, recoveryPhrase, setRecoveryPhrase, pin, isPinVerified, setPin, verifyPin, lockApp],
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
