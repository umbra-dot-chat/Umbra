/**
 * Auth Context — Unit Tests
 *
 * Covers Section 1 of the Umbra testing checklist:
 *   T1.1.x  Account creation flow (identity + recovery phrase)
 *   T1.2.x  Account import (restoreIdentity via seed phrase)
 *   T1.3.x  PIN lock (set, verify, remove, lockApp)
 *   T1.4.x  Multi-account (add, remove, switch)
 *   T1.6.x  Logout
 *
 * NOTE: The jest-expo test environment runs as React Native (Platform.OS = 'ios'),
 * not web. AuthContext's storage operations go through the native SecureStore path
 * (which returns null in test since getNative() has no native module). State
 * management still works fully through React. Tests focus on hook behavior.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import type { StoredAccount } from '@/contexts/AuthContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Wrapper that provides AuthProvider to the hook under test. */
function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

/** Factory for a minimal Identity object. */
function makeIdentity(overrides: Record<string, unknown> = {}) {
  return {
    did: `did:key:z6Mk${Date.now().toString(36)}`,
    displayName: 'TestUser',
    createdAt: Date.now() / 1000,
    ...overrides,
  };
}

/** Factory for a StoredAccount entry. */
function makeStoredAccount(overrides: Record<string, unknown> = {}): StoredAccount {
  const did = `did:key:z6MkAccount${Date.now().toString(36)}`;
  return {
    did,
    displayName: 'StoredUser',
    recoveryPhrase: [
      'abandon', 'ability', 'able', 'about', 'above', 'absent',
      'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
      'account', 'accuse', 'achieve', 'acid', 'across', 'act',
      'action', 'actor', 'actress', 'actual', 'adapt', 'add',
    ],
    rememberMe: true,
    addedAt: Date.now(),
    ...overrides,
  } as StoredAccount;
}

// ===========================================================================
//  T1.1 — Account creation flow
// ===========================================================================

describe('T1.1 — Account creation flow', () => {
  // T1.1.1: identity starts null
  test('T1.1.1 — identity starts as null', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for async hydration to complete (native path)
    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(result.current.identity).toBeNull();
  });

  // T1.1.2: isAuthenticated starts false
  test('T1.1.2 — isAuthenticated is false when no identity', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  // T1.1.3: login sets identity
  test('T1.1.3 — login() sets identity in state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity({ displayName: 'Alice' });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    act(() => {
      result.current.login(id);
    });

    expect(result.current.identity).toEqual(id);
    expect(result.current.isAuthenticated).toBe(true);
  });

  // T1.1.4: identity object has required fields (did, displayName, createdAt)
  test('T1.1.4 — identity has did, displayName, and createdAt', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity({ did: 'did:key:z6MkAbc', displayName: 'Bob', createdAt: 1700000000 });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });

    act(() => {
      result.current.login(id);
    });

    expect(result.current.identity!.did).toBe('did:key:z6MkAbc');
    expect(result.current.identity!.displayName).toBe('Bob');
    expect(result.current.identity!.createdAt).toBe(1700000000);
  });

  // T1.1.5: setRecoveryPhrase stores the 24-word phrase
  test('T1.1.5 — setRecoveryPhrase stores 24-word phrase', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const phrase = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent',
      'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
      'account', 'accuse', 'achieve', 'acid', 'across', 'act',
      'action', 'actor', 'actress', 'actual', 'adapt', 'add',
    ];

    act(() => {
      result.current.setRecoveryPhrase(phrase);
    });

    expect(result.current.recoveryPhrase).toEqual(phrase);
    expect(result.current.recoveryPhrase).toHaveLength(24);
  });

  // T1.1.6: recovery phrase can be cleared
  test('T1.1.6 — setRecoveryPhrase(null) clears recovery phrase', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const phrase = Array(24).fill('test');

    act(() => {
      result.current.setRecoveryPhrase(phrase);
    });
    expect(result.current.recoveryPhrase).not.toBeNull();

    act(() => {
      result.current.setRecoveryPhrase(null);
    });
    expect(result.current.recoveryPhrase).toBeNull();
  });

  // T1.1.7: rememberMe defaults to false
  test('T1.1.7 — rememberMe defaults to false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.rememberMe).toBe(false);
  });

  // T1.1.8: setRememberMe toggles persistence flag
  test('T1.1.8 — setRememberMe(true) enables persistence', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setRememberMe(true);
    });

    expect(result.current.rememberMe).toBe(true);
  });

  // T1.1.9: setRememberMe(false) disables persistence
  test('T1.1.9 — setRememberMe(false) disables persistence', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setRememberMe(true);
    });
    expect(result.current.rememberMe).toBe(true);

    act(() => {
      result.current.setRememberMe(false);
    });
    expect(result.current.rememberMe).toBe(false);
  });

  // T1.1.10: login without rememberMe does not affect rememberMe state
  test('T1.1.10 — login does not change rememberMe state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity();

    act(() => {
      result.current.login(id);
    });

    expect(result.current.rememberMe).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
  });

  // T1.1.11: isHydrated becomes true after async hydration
  test('T1.1.11 — isHydrated becomes true after hydration', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isHydrated).toBe(true);
    });
  });

  // T1.1.12: setIdentity updates identity directly
  test('T1.1.12 — setIdentity() updates identity directly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity({ displayName: 'DirectSet' });

    act(() => {
      result.current.setIdentity(id);
    });

    expect(result.current.identity!.displayName).toBe('DirectSet');
    expect(result.current.isAuthenticated).toBe(true);
  });

  // T1.1.13: setIdentity(null) clears identity
  test('T1.1.13 — setIdentity(null) clears identity', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity();

    act(() => {
      result.current.login(id);
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.setIdentity(null);
    });
    expect(result.current.identity).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // T1.1.14: login with rememberMe keeps identity in state
  test('T1.1.14 — login with rememberMe keeps identity in state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity({ displayName: 'Persistent' });

    act(() => {
      result.current.setRememberMe(true);
    });
    act(() => {
      result.current.login(id);
    });

    expect(result.current.identity!.displayName).toBe('Persistent');
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.rememberMe).toBe(true);
  });

  // T1.1.15: identity DID is a string starting with "did:"
  test('T1.1.15 — identity DID follows expected format', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity({ did: 'did:key:z6MkTestFormat' });

    act(() => {
      result.current.login(id);
    });

    expect(result.current.identity!.did).toMatch(/^did:/);
  });
});

// ===========================================================================
//  T1.2 — Account import (restore from seed phrase)
// ===========================================================================

describe('T1.2 — Account import', () => {
  const validPhrase = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent',
    'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
    'account', 'accuse', 'achieve', 'acid', 'across', 'act',
    'action', 'actor', 'actress', 'actual', 'adapt', 'add',
  ];

  // T1.2.1: login after import sets identity
  test('T1.2.1 — login after import sets identity with correct fields', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const restoredIdentity = makeIdentity({
      did: 'did:key:z6MkRestored',
      displayName: 'ImportedUser',
    });

    act(() => {
      result.current.login(restoredIdentity);
    });

    expect(result.current.identity!.did).toBe('did:key:z6MkRestored');
    expect(result.current.identity!.displayName).toBe('ImportedUser');
    expect(result.current.isAuthenticated).toBe(true);
  });

  // T1.2.2: recovery phrase can be stored after import
  test('T1.2.2 — recovery phrase stored after import', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setRecoveryPhrase(validPhrase);
    });

    expect(result.current.recoveryPhrase).toEqual(validPhrase);
    expect(result.current.recoveryPhrase).toHaveLength(24);
  });

  // T1.2.3: imported identity and recovery phrase coexist
  test('T1.2.3 — imported identity and recovery phrase coexist in state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity({ did: 'did:key:z6MkImported', displayName: 'Imported' });

    act(() => {
      result.current.login(id);
      result.current.setRecoveryPhrase(validPhrase);
    });

    expect(result.current.identity!.did).toBe('did:key:z6MkImported');
    expect(result.current.recoveryPhrase).toHaveLength(24);
  });

  // T1.2.4: login replaces previous identity (simulating re-import)
  test('T1.2.4 — login replaces previous identity', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeIdentity({ did: 'did:key:z6MkOld' }));
    });
    expect(result.current.identity!.did).toBe('did:key:z6MkOld');

    act(() => {
      result.current.login(makeIdentity({ did: 'did:key:z6MkNew' }));
    });
    expect(result.current.identity!.did).toBe('did:key:z6MkNew');
  });

  // T1.2.5: setIdentity with rememberMe updates state
  test('T1.2.5 — setIdentity with rememberMe updates state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setRememberMe(true);
    });

    const id = makeIdentity({ displayName: 'Updated' });
    act(() => {
      result.current.setIdentity(id);
    });

    expect(result.current.identity!.displayName).toBe('Updated');
    expect(result.current.rememberMe).toBe(true);
  });

  // T1.2.6: recovery phrase is exactly 24 words
  test('T1.2.6 — recovery phrase validates as 24 words', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setRecoveryPhrase(validPhrase);
    });

    expect(result.current.recoveryPhrase).toHaveLength(24);
    expect(result.current.recoveryPhrase!.every((w) => typeof w === 'string')).toBe(true);
  });

  // T1.2.7: clearing recovery phrase works after import
  test('T1.2.7 — clearing recovery phrase after import', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeIdentity());
      result.current.setRecoveryPhrase(validPhrase);
    });
    expect(result.current.recoveryPhrase).not.toBeNull();

    act(() => {
      result.current.setRecoveryPhrase(null);
    });
    expect(result.current.recoveryPhrase).toBeNull();
    // Identity should still be present
    expect(result.current.isAuthenticated).toBe(true);
  });

  // T1.2.8: multiple imports (login calls) work sequentially
  test('T1.2.8 — multiple sequential imports work correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeIdentity({ did: 'did:key:z6Mk1st', displayName: 'First' }));
      result.current.setRecoveryPhrase(validPhrase);
    });

    act(() => {
      result.current.login(makeIdentity({ did: 'did:key:z6Mk2nd', displayName: 'Second' }));
    });

    expect(result.current.identity!.did).toBe('did:key:z6Mk2nd');
    expect(result.current.identity!.displayName).toBe('Second');
  });
});

// ===========================================================================
//  T1.3 — PIN lock
// ===========================================================================

describe('T1.3 — PIN lock', () => {
  // T1.3.1: PIN starts as null
  test('T1.3.1 — pin starts as null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.pin).toBeNull();
    expect(result.current.hasPin).toBe(false);
  });

  // T1.3.2: isPinVerified starts false
  test('T1.3.2 — isPinVerified starts false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isPinVerified).toBe(false);
  });

  // T1.3.3: setPin sets the PIN and marks as verified
  test('T1.3.3 — setPin() sets PIN and marks as verified', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('1234');
    });

    expect(result.current.pin).toBe('1234');
    expect(result.current.hasPin).toBe(true);
    expect(result.current.isPinVerified).toBe(true);
  });

  // T1.3.4: verifyPin returns true on correct attempt
  test('T1.3.4 — verifyPin() returns true on correct PIN', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('5678');
    });

    // Lock first so we can test verification
    act(() => {
      result.current.lockApp();
    });
    expect(result.current.isPinVerified).toBe(false);

    let verifyResult: boolean = false;
    act(() => {
      verifyResult = result.current.verifyPin('5678');
    });

    expect(verifyResult).toBe(true);
    expect(result.current.isPinVerified).toBe(true);
  });

  // T1.3.5: verifyPin returns false on wrong attempt
  test('T1.3.5 — verifyPin() returns false on wrong PIN', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('1234');
    });

    act(() => {
      result.current.lockApp();
    });

    let verifyResult: boolean = false;
    act(() => {
      verifyResult = result.current.verifyPin('0000');
    });

    expect(verifyResult).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
  });

  // T1.3.6: lockApp sets isPinVerified to false
  test('T1.3.6 — lockApp() locks the session', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('1234');
    });
    expect(result.current.isPinVerified).toBe(true);

    act(() => {
      result.current.lockApp();
    });
    expect(result.current.isPinVerified).toBe(false);
  });

  // T1.3.7: setPin(null) removes the PIN
  test('T1.3.7 — setPin(null) removes the PIN', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('9999');
    });
    expect(result.current.hasPin).toBe(true);

    act(() => {
      result.current.setPin(null);
    });

    expect(result.current.pin).toBeNull();
    expect(result.current.hasPin).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
  });

  // T1.3.8: setPin with rememberMe keeps PIN in state
  test('T1.3.8 — setPin with rememberMe keeps PIN in state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setRememberMe(true);
    });

    act(() => {
      result.current.setPin('4321');
    });

    expect(result.current.pin).toBe('4321');
    expect(result.current.hasPin).toBe(true);
    expect(result.current.isPinVerified).toBe(true);
  });

  // T1.3.9: PIN removal clears verified state
  test('T1.3.9 — PIN removal clears verified state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('4321');
    });
    expect(result.current.isPinVerified).toBe(true);

    act(() => {
      result.current.setPin(null);
    });
    expect(result.current.isPinVerified).toBe(false);
    expect(result.current.hasPin).toBe(false);
  });

  // T1.3.10: verifyPin on empty PIN always fails
  test('T1.3.10 — verifyPin fails when no PIN is set', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    let verifyResult: boolean = false;
    act(() => {
      verifyResult = result.current.verifyPin('1234');
    });

    expect(verifyResult).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
  });

  // T1.3.11: multiple wrong attempts do not auto-unlock
  test('T1.3.11 — multiple wrong PIN attempts do not unlock', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('1234');
      result.current.lockApp();
    });

    act(() => {
      result.current.verifyPin('0000');
      result.current.verifyPin('1111');
      result.current.verifyPin('2222');
    });

    expect(result.current.isPinVerified).toBe(false);
  });

  // T1.3.12: setPin updates existing PIN
  test('T1.3.12 — setPin replaces existing PIN', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('1111');
    });
    expect(result.current.pin).toBe('1111');

    act(() => {
      result.current.setPin('2222');
    });
    expect(result.current.pin).toBe('2222');

    // Old PIN should not work
    act(() => {
      result.current.lockApp();
    });
    let verifyResult: boolean = false;
    act(() => {
      verifyResult = result.current.verifyPin('1111');
    });
    expect(verifyResult).toBe(false);

    act(() => {
      verifyResult = result.current.verifyPin('2222');
    });
    expect(verifyResult).toBe(true);
  });

  // T1.3.13: lock then unlock cycle
  test('T1.3.13 — lock and unlock cycle works correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('5555');
    });
    expect(result.current.isPinVerified).toBe(true);

    // Lock
    act(() => {
      result.current.lockApp();
    });
    expect(result.current.isPinVerified).toBe(false);

    // Unlock
    let ok = false;
    act(() => {
      ok = result.current.verifyPin('5555');
    });
    expect(ok).toBe(true);
    expect(result.current.isPinVerified).toBe(true);

    // Lock again
    act(() => {
      result.current.lockApp();
    });
    expect(result.current.isPinVerified).toBe(false);
  });

  // T1.3.14: logout clears PIN
  test('T1.3.14 — logout clears PIN', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('9999');
    });
    expect(result.current.hasPin).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.pin).toBeNull();
    expect(result.current.hasPin).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
  });
});

// ===========================================================================
//  T1.4 — Multi-account
// ===========================================================================

describe('T1.4 — Multi-account', () => {
  // T1.4.1: accounts list starts empty
  test('T1.4.1 — accounts list starts empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.accounts).toEqual([]);
  });

  // T1.4.2: addAccount adds an account
  test('T1.4.2 — addAccount adds a stored account', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const account = makeStoredAccount({ did: 'did:key:z6MkMulti1', displayName: 'Account1' });

    act(() => {
      result.current.addAccount(account);
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].did).toBe('did:key:z6MkMulti1');
    expect(result.current.accounts[0].displayName).toBe('Account1');
  });

  // T1.4.3: addAccount updates existing account by DID
  test('T1.4.3 — addAccount updates existing account by DID', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const account = makeStoredAccount({ did: 'did:key:z6MkSame', displayName: 'Original' });

    act(() => {
      result.current.addAccount(account);
    });
    expect(result.current.accounts[0].displayName).toBe('Original');

    act(() => {
      result.current.addAccount({ ...account, displayName: 'Updated' });
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].displayName).toBe('Updated');
  });

  // T1.4.4: removeAccount removes by DID
  test('T1.4.4 — removeAccount removes account by DID', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const a1 = makeStoredAccount({ did: 'did:key:z6MkA1', displayName: 'A1' });
    const a2 = makeStoredAccount({ did: 'did:key:z6MkA2', displayName: 'A2' });

    act(() => {
      result.current.addAccount(a1);
      result.current.addAccount(a2);
    });
    expect(result.current.accounts).toHaveLength(2);

    act(() => {
      result.current.removeAccount('did:key:z6MkA1');
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].did).toBe('did:key:z6MkA2');
  });

  // T1.4.5: removeAccount on non-existent DID is a no-op
  test('T1.4.5 — removeAccount is a no-op for unknown DID', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const a1 = makeStoredAccount({ did: 'did:key:z6MkKeep' });

    act(() => {
      result.current.addAccount(a1);
    });

    act(() => {
      result.current.removeAccount('did:key:z6MkNonexistent');
    });

    expect(result.current.accounts).toHaveLength(1);
  });

  // T1.4.6: multiple accounts can be added
  test('T1.4.6 — multiple accounts can be added', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.addAccount(makeStoredAccount({ did: 'did:key:z6MkAcc1', displayName: 'Acc1' }));
      result.current.addAccount(makeStoredAccount({ did: 'did:key:z6MkAcc2', displayName: 'Acc2' }));
      result.current.addAccount(makeStoredAccount({ did: 'did:key:z6MkAcc3', displayName: 'Acc3' }));
    });

    expect(result.current.accounts).toHaveLength(3);
  });

  // T1.4.7: isSwitching starts false
  test('T1.4.7 — isSwitching starts false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isSwitching).toBe(false);
  });

  // T1.4.8: switchGeneration starts at 0
  test('T1.4.8 — switchGeneration starts at 0', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.switchGeneration).toBe(0);
  });

  // T1.4.9: stored account has correct structure
  test('T1.4.9 — stored account has correct fields', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const account = makeStoredAccount({
      did: 'did:key:z6MkStruct',
      displayName: 'StructTest',
      pin: '1234',
    });

    act(() => {
      result.current.addAccount(account);
    });

    const stored = result.current.accounts[0];
    expect(stored.did).toBe('did:key:z6MkStruct');
    expect(stored.displayName).toBe('StructTest');
    expect(stored.recoveryPhrase).toHaveLength(24);
    expect(stored.rememberMe).toBe(true);
    expect(stored.addedAt).toBeGreaterThan(0);
    expect(stored.pin).toBe('1234');
  });
});

// ===========================================================================
//  T1.6 — Logout
// ===========================================================================

describe('T1.6 — Logout', () => {
  // T1.6.1: logout clears identity
  test('T1.6.1 — logout clears identity and sets isAuthenticated to false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    const id = makeIdentity();

    act(() => {
      result.current.login(id);
    });
    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.identity).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  // T1.6.2: logout clears all auth state
  test('T1.6.2 — logout clears all auth-related state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeIdentity());
      result.current.setRecoveryPhrase(Array(24).fill('word'));
      result.current.setPin('1234');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.recoveryPhrase).not.toBeNull();
    expect(result.current.hasPin).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.identity).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.pin).toBeNull();
    expect(result.current.hasPin).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
    expect(result.current.recoveryPhrase).toBeNull();
  });

  // T1.6.3: logout resets PIN and recovery state
  test('T1.6.3 — logout resets PIN, recovery phrase, and pin verification', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeIdentity());
      result.current.setRecoveryPhrase(Array(24).fill('word'));
      result.current.setPin('5555');
    });

    expect(result.current.hasPin).toBe(true);
    expect(result.current.isPinVerified).toBe(true);
    expect(result.current.recoveryPhrase).not.toBeNull();

    act(() => {
      result.current.logout();
    });

    expect(result.current.pin).toBeNull();
    expect(result.current.hasPin).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
    expect(result.current.recoveryPhrase).toBeNull();
  });
});

// ===========================================================================
//  Edge cases
// ===========================================================================

describe('Edge cases', () => {
  test('useAuth throws when used outside AuthProvider', () => {
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');

    spy.mockRestore();
  });

  test('multiple logins replace the previous identity', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeIdentity({ did: 'did:key:first' }));
    });
    expect(result.current.identity!.did).toBe('did:key:first');

    act(() => {
      result.current.login(makeIdentity({ did: 'did:key:second' }));
    });
    expect(result.current.identity!.did).toBe('did:key:second');
  });

  test('logout after logout is safe (no crash)', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.identity).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('login then immediate logout clears correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login(makeIdentity());
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.identity).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('setPin without login still works', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setPin('1234');
    });

    expect(result.current.hasPin).toBe(true);
    expect(result.current.isPinVerified).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
