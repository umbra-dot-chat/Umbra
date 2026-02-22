/**
 * Integration tests for account persistence (AuthContext).
 *
 * Tests that the AuthContext correctly manages identity state,
 * rememberMe flag, login/logout, and PIN functionality.
 *
 * Note: localStorage is only used when Platform.OS === 'web'.
 * In Jest (platform 'ios'), storage helpers are no-ops, so these
 * tests focus on the in-memory state management which is the same
 * across platforms.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children);

/** Wait for the native hydration effect to complete before testing state changes. */
async function waitForHydration(result: { current: ReturnType<typeof useAuth> }) {
  await waitFor(() => {
    expect(result.current.isHydrated).toBe(true);
  });
}

describe('Account persistence (AuthContext)', () => {
  test('login sets identity and isAuthenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.identity).toBeNull();

    const identity = {
      did: 'did:key:z6MkTest123',
      displayName: 'TestUser',
      createdAt: Date.now() / 1000,
    };

    await act(async () => {
      result.current.login(identity);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.identity?.did).toBe('did:key:z6MkTest123');
    expect(result.current.identity?.displayName).toBe('TestUser');
  });

  test('logout clears identity and returns to unauthenticated', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Login first
    await act(async () => {
      result.current.login({
        did: 'did:key:z6MkClear',
        displayName: 'ClearMe',
        createdAt: Date.now() / 1000,
      });
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Now logout
    await act(async () => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.identity).toBeNull();
  });

  test('rememberMe state toggles correctly', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for native async hydration to complete before testing state changes
    await waitForHydration(result);

    expect(result.current.rememberMe).toBe(false);

    await act(async () => {
      result.current.setRememberMe(true);
    });

    expect(result.current.rememberMe).toBe(true);

    await act(async () => {
      result.current.setRememberMe(false);
    });

    expect(result.current.rememberMe).toBe(false);
  });

  test('PIN can be set, verified, and cleared', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially no PIN
    expect(result.current.hasPin).toBe(false);
    expect(result.current.isPinVerified).toBe(false);

    // Set PIN
    await act(async () => {
      result.current.setPin('1234');
    });

    expect(result.current.hasPin).toBe(true);
    expect(result.current.isPinVerified).toBe(true); // auto-verified on set

    // Lock the app
    await act(async () => {
      result.current.lockApp();
    });

    expect(result.current.isPinVerified).toBe(false);

    // Verify with wrong PIN
    let verified = false;
    await act(async () => {
      verified = result.current.verifyPin('0000');
    });
    expect(verified).toBe(false);
    expect(result.current.isPinVerified).toBe(false);

    // Verify with correct PIN
    await act(async () => {
      verified = result.current.verifyPin('1234');
    });
    expect(verified).toBe(true);
    expect(result.current.isPinVerified).toBe(true);

    // Clear PIN
    await act(async () => {
      result.current.setPin(null);
    });

    expect(result.current.hasPin).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
  });

  test('logout clears PIN state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Login and set PIN
    await act(async () => {
      result.current.login({
        did: 'did:key:z6MkPinUser',
        displayName: 'PinUser',
        createdAt: Date.now() / 1000,
      });
    });

    await act(async () => {
      result.current.setPin('5678');
    });

    expect(result.current.hasPin).toBe(true);

    // Logout
    await act(async () => {
      result.current.logout();
    });

    expect(result.current.hasPin).toBe(false);
    expect(result.current.isPinVerified).toBe(false);
    expect(result.current.identity).toBeNull();
  });

  test('multiple login/logout cycles work correctly', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    for (let i = 0; i < 3; i++) {
      await act(async () => {
        result.current.login({
          did: `did:key:z6MkCycle${i}`,
          displayName: `Cycle${i}`,
          createdAt: Date.now() / 1000,
        });
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.identity?.did).toBe(`did:key:z6MkCycle${i}`);

      await act(async () => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    }
  });
});
