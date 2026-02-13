import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { Identity } from '@/packages/umbra-service/src';

// ---------------------------------------------------------------------------
// localStorage helpers (web-only)
// ---------------------------------------------------------------------------

const STORAGE_KEY_IDENTITY = 'umbra_identity';
const STORAGE_KEY_REMEMBER = 'umbra_remember_me';
const STORAGE_KEY_PIN = 'umbra_pin';
const STORAGE_KEY_RECOVERY = 'umbra_recovery';

function getStorageItem(key: string): string | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function setStorageItem(key: string, value: string): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function removeStorageItem(key: string): void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

interface AuthContextValue {
  /** The current user's identity, or null if not logged in */
  identity: Identity | null;
  /** Derived from identity !== null */
  isAuthenticated: boolean;
  /** Set the identity after a successful create or import */
  login: (identity: Identity) => void;
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
  // Restore persisted identity on mount
  const [identity, setIdentity] = useState<Identity | null>(() => {
    const remembered = getStorageItem(STORAGE_KEY_REMEMBER);
    if (remembered === 'true') {
      const saved = getStorageItem(STORAGE_KEY_IDENTITY);
      if (saved) {
        try { return JSON.parse(saved) as Identity; } catch { /* ignore */ }
      }
    }
    return null;
  });

  const [rememberMe, setRememberMeState] = useState<boolean>(() => {
    return getStorageItem(STORAGE_KEY_REMEMBER) === 'true';
  });

  const [pin, setPinState] = useState<string | null>(() => {
    return getStorageItem(STORAGE_KEY_PIN);
  });

  // Recovery phrase — persisted so WASM identity can be restored on page refresh
  const [recoveryPhrase, setRecoveryPhraseState] = useState<string[] | null>(() => {
    const saved = getStorageItem(STORAGE_KEY_RECOVERY);
    if (saved) {
      try { return JSON.parse(saved) as string[]; } catch { /* ignore */ }
    }
    return null;
  });

  const [isPinVerified, setIsPinVerified] = useState(false);

  // Keep a ref so login() can read the latest value without re-creating
  const rememberMeRef = useRef(rememberMe);
  rememberMeRef.current = rememberMe;

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
      login,
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
    [identity, login, logout, rememberMe, setRememberMe, recoveryPhrase, setRecoveryPhrase, pin, isPinVerified, setPin, verifyPin, lockApp],
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
