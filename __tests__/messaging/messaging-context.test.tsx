/**
 * MessagingContext — Jest unit tests for display mode preferences.
 *
 * Test IDs covered:
 *   T4.4.1 - T4.4.5  Display modes (bubble / inline)
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => {
    const { UmbraService } = require('@umbra/service');
    const svc = UmbraService.instance;
    // Ensure onMetadataEvent exists on the mock instance
    if (!svc.onMetadataEvent) {
      svc.onMetadataEvent = jest.fn(() => jest.fn());
    }
    if (!svc.getRelayWs) {
      svc.getRelayWs = jest.fn(() => null);
    }
    return {
      service: svc,
      isReady: true,
      isLoading: false,
      error: null,
      version: '0.1.0-test',
      initStage: 'ready',
    };
  },
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    identity: { did: 'did:key:z6MkTest', displayName: 'Test' },
    isAuthenticated: true,
    isHydrated: true,
    login: jest.fn(),
    logout: jest.fn(),
    setIdentity: jest.fn(),
    rememberMe: false,
    setRememberMe: jest.fn(),
    recoveryPhrase: null,
    setRecoveryPhrase: jest.fn(),
    pin: null,
    hasPin: false,
    isPinVerified: false,
    setPin: jest.fn(),
    verifyPin: jest.fn(),
    lockApp: jest.fn(),
    accounts: [],
    addAccount: jest.fn(),
    removeAccount: jest.fn(),
    switchAccount: jest.fn(),
    loginFromStoredAccount: jest.fn(),
    isSwitching: false,
    switchGeneration: 0,
  }),
  AuthProvider: ({ children }: any) => children,
}));

// Mock @umbra/wasm — getWasm returns a mock with kv_get/kv_set
const mockKvStore: Record<string, string> = {};
const mockWasm = {
  umbra_wasm_plugin_kv_set: jest.fn((ns: string, key: string, value: string) => {
    mockKvStore[`${ns}:${key}`] = value;
  }),
  umbra_wasm_plugin_kv_get: jest.fn((ns: string, key: string) => {
    const val = mockKvStore[`${ns}:${key}`];
    if (val !== undefined) {
      return Promise.resolve(JSON.stringify({ value: val }));
    }
    return Promise.resolve(JSON.stringify({ value: null }));
  }),
};

jest.mock('@umbra/wasm', () => ({
  initUmbraWasm: jest.fn().mockResolvedValue({}),
  getWasm: jest.fn(() => mockWasm),
  isWasmReady: jest.fn().mockReturnValue(true),
  eventBridge: {
    connect: jest.fn(),
    onAll: jest.fn(),
    disconnect: jest.fn(),
  },
}));

// Mock syncMetadataViaRelay as a named export from @umbra/service
// The module mock already handles UmbraService; we need to add the named export.
// Since we can't partially mock a manually-mapped module, we mock the function
// at the import site by intercepting the module reference.
jest.mock('@umbra/service', () => {
  const actual = jest.requireActual('@umbra/service');
  return {
    ...actual,
    syncMetadataViaRelay: jest.fn(),
  };
});

import { UmbraService } from '@umbra/service';
import { MessagingProvider, useMessaging } from '@/contexts/MessagingContext';

const mockService = UmbraService.instance as Record<string, jest.Mock>;
// Ensure methods exist
if (!mockService.onMetadataEvent) {
  mockService.onMetadataEvent = jest.fn(() => jest.fn());
}
if (!mockService.getRelayWs) {
  mockService.getRelayWs = jest.fn(() => null);
}

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MessagingProvider>{children}</MessagingProvider>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetMocks() {
  jest.clearAllMocks();
  // Clear KV store
  for (const key of Object.keys(mockKvStore)) {
    delete mockKvStore[key];
  }
  mockService.onMetadataEvent.mockReturnValue(jest.fn());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessagingContext — Display modes', () => {
  beforeEach(() => {
    resetMocks();
  });

  // =========================================================================
  // T4.4 — Display modes (bubble / inline)
  // =========================================================================

  it('T4.4.1 — default displayMode is "bubble"', async () => {
    const { result } = renderHook(() => useMessaging(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));

    expect(result.current.displayMode).toBe('bubble');
  });

  it('T4.4.2 — setDisplayMode changes mode to "inline"', async () => {
    const { result } = renderHook(() => useMessaging(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));

    act(() => {
      result.current.setDisplayMode('inline');
    });

    expect(result.current.displayMode).toBe('inline');
  });

  it('T4.4.3 — setDisplayMode changes mode back to "bubble"', async () => {
    const { result } = renderHook(() => useMessaging(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));

    act(() => {
      result.current.setDisplayMode('inline');
    });
    expect(result.current.displayMode).toBe('inline');

    act(() => {
      result.current.setDisplayMode('bubble');
    });
    expect(result.current.displayMode).toBe('bubble');
  });

  it('T4.4.4 — setDisplayMode persists to KV store', async () => {
    const { result } = renderHook(() => useMessaging(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));

    act(() => {
      result.current.setDisplayMode('inline');
    });

    expect(mockWasm.umbra_wasm_plugin_kv_set).toHaveBeenCalledWith(
      '__umbra_system__',
      'message_display_mode',
      'inline',
    );
  });

  it('T4.4.5 — preferencesLoaded becomes true after initial restore', async () => {
    const { result } = renderHook(() => useMessaging(), { wrapper: Wrapper });

    // Should eventually be loaded
    await waitFor(() => expect(result.current.preferencesLoaded).toBe(true));
  });
});

describe('MessagingContext — useMessaging outside provider', () => {
  it('throws when used outside MessagingProvider', () => {
    // Suppress console.error for the expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useMessaging());
    }).toThrow('useMessaging must be used within a MessagingProvider');

    spy.mockRestore();
  });
});
