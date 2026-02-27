/**
 * usePendingInvite — Persists an invite code through the auth flow.
 *
 * When an unauthenticated user clicks an invite link:
 * 1. The invite route stores the code via `setPendingCode(code)`
 * 2. User is redirected to auth
 * 3. After auth completes, AuthGate calls `consumePendingCode()`
 *    to retrieve + clear the code, then navigates to `/invite/CODE`
 *
 * Storage:
 * - Web/Tauri: localStorage (survives page reloads)
 * - Mobile: module-level variable (survives in-memory during signup,
 *   but not across cold starts — acceptable since deep links re-fire)
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

const PENDING_INVITE_KEY = '@umbra/pending_invite';

// Module-level fallback for native (no AsyncStorage dependency needed)
let _pendingCodeNative: string | null = null;

function getStoredCode(): string | null {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(PENDING_INVITE_KEY);
    } catch {
      return null;
    }
  }
  return _pendingCodeNative;
}

function setStoredCode(code: string): void {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(PENDING_INVITE_KEY, code);
    } catch {
      // localStorage may be unavailable in some contexts
    }
  }
  _pendingCodeNative = code;
}

function clearStoredCode(): void {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(PENDING_INVITE_KEY);
    } catch {
      // Ignore
    }
  }
  _pendingCodeNative = null;
}

export function usePendingInvite() {
  const [pendingCode, setPendingCodeState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    const code = getStoredCode();
    setPendingCodeState(code);
    setIsLoaded(true);
  }, []);

  const setPendingCode = useCallback((code: string) => {
    setStoredCode(code);
    setPendingCodeState(code);
  }, []);

  const consumePendingCode = useCallback(async (): Promise<string | null> => {
    const code = getStoredCode();
    clearStoredCode();
    setPendingCodeState(null);
    return code;
  }, []);

  return { pendingCode, isLoaded, setPendingCode, consumePendingCode };
}
