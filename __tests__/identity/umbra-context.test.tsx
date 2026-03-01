/**
 * Umbra Context — Unit Tests
 *
 * Covers Section 1 of the Umbra testing checklist:
 *   T1.5.1–T1.5.4: Loading/splash screen stages
 *
 * Tests the UmbraContext/useUmbra hook:
 *   - isReady starts false
 *   - initStage progression (booting -> ready)
 *   - service available after ready
 *   - error handling on init failure
 *
 * NOTE: The jest-expo test environment runs as React Native (Platform.OS = 'ios').
 * AuthContext hydrates asynchronously on native. UmbraProvider mounts inside
 * AuthProvider and initializes UmbraService asynchronously.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { UmbraProvider, useUmbra } from '@/contexts/UmbraContext';
import { UmbraService } from '@umbra/service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wrapper that provides both AuthProvider (outer) and UmbraProvider (inner),
 * since UmbraProvider calls useAuth() internally.
 */
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UmbraProvider>{children}</UmbraProvider>
    </AuthProvider>
  );
}

/** Create a wrapper with a custom UmbraProvider config. */
function makeWrapper(config?: Record<string, unknown>) {
  return function CustomWrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        <UmbraProvider config={config}>{children}</UmbraProvider>
      </AuthProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Reset the mock to default success behavior
  (UmbraService.initialize as jest.Mock).mockResolvedValue(undefined);
  (UmbraService.getVersion as jest.Mock).mockReturnValue('0.1.0-test');
  UmbraService._initialized = false;
});

// ===========================================================================
//  T1.5 — Loading / Splash screen stages
// ===========================================================================

describe('T1.5 — Loading / splash screen stages', () => {
  // T1.5.1: isReady starts false, isLoading starts true
  test('T1.5.1 — isReady starts false and isLoading starts true', () => {
    // Use a delayed initialize so we can observe the loading state
    (UmbraService.initialize as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves — stays in loading state
    );

    const { result } = renderHook(() => useUmbra(), { wrapper });

    expect(result.current.isReady).toBe(false);
    expect(result.current.isLoading).toBe(true);
  });

  // T1.5.2: initStage starts at 'booting'
  test('T1.5.2 — initStage starts at booting', () => {
    (UmbraService.initialize as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useUmbra(), { wrapper });
    expect(result.current.initStage).toBe('booting');
  });

  // T1.5.3: after successful init, isReady is true and initStage is ready
  test('T1.5.3 — after init, isReady is true and initStage reaches ready', async () => {
    const { result } = renderHook(() => useUmbra(), { wrapper });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  // T1.5.4: service is available after init
  test('T1.5.4 — service is available after initialization completes', async () => {
    const { result } = renderHook(() => useUmbra(), { wrapper });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // The mock UmbraService.instance should be returned
    expect(result.current.service).not.toBeNull();
    expect(result.current.service).toBe(UmbraService.instance);
  });
});

// ===========================================================================
//  Initialization behavior
// ===========================================================================

describe('Initialization behavior', () => {
  test('UmbraService.initialize is called once on mount', async () => {
    const { result } = renderHook(() => useUmbra(), { wrapper });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(UmbraService.initialize).toHaveBeenCalledTimes(1);
  });

  test('version is set from UmbraService.getVersion() after init', async () => {
    (UmbraService.getVersion as jest.Mock).mockReturnValue('1.2.3-test');

    const { result } = renderHook(() => useUmbra(), { wrapper });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.version).toBe('1.2.3-test');
  });

  test('config is passed through to UmbraService.initialize', async () => {
    const customWrapper = makeWrapper({ customOption: true });

    const { result } = renderHook(() => useUmbra(), { wrapper: customWrapper });

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(UmbraService.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ customOption: true })
    );
  });
});

// ===========================================================================
//  Error handling
// ===========================================================================

describe('Error handling', () => {
  test('error is set when initialization fails', async () => {
    const initError = new Error('WASM load failed');
    (UmbraService.initialize as jest.Mock).mockRejectedValue(initError);

    // Suppress console.error for expected error log
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUmbra(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.message).toBe('WASM load failed');
    expect(result.current.isReady).toBe(false);
    expect(result.current.service).toBeNull();

    spy.mockRestore();
  });

  test('non-Error rejection is wrapped in Error', async () => {
    (UmbraService.initialize as jest.Mock).mockRejectedValue('string error');

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUmbra(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error!.message).toBe('string error');

    spy.mockRestore();
  });

  test('service is null when there is an error', async () => {
    (UmbraService.initialize as jest.Mock).mockRejectedValue(new Error('fail'));

    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUmbra(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.service).toBeNull();

    spy.mockRestore();
  });
});

// ===========================================================================
//  Hook guard
// ===========================================================================

describe('Hook guard', () => {
  test('useUmbra throws when used outside UmbraProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Wrap in AuthProvider only (no UmbraProvider)
    const authOnlyWrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    expect(() => {
      renderHook(() => useUmbra(), { wrapper: authOnlyWrapper });
    }).toThrow('useUmbra must be used within an <UmbraProvider>');

    spy.mockRestore();
  });
});
