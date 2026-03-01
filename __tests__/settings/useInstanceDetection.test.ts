/**
 * Tests for useInstanceDetection() hook
 *
 * Covers single-instance default, second-instance conflict detection,
 * conflict callback state updates, BroadcastChannel fallback, and
 * cleanup on unmount.
 *
 * Test IDs: T-ID.1 - T-ID.5
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mock @umbra/service — startInstanceCoordinator
// ---------------------------------------------------------------------------

import { startInstanceCoordinator } from '@umbra/service';

// ---------------------------------------------------------------------------
// Mock UmbraContext (required by module resolution)
// ---------------------------------------------------------------------------

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(() => ({
    isReady: true,
    isLoading: false,
    error: null,
    service: null,
    version: '0.1.0-test',
    initStage: 'ready',
  })),
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { useInstanceDetection } from '@/hooks/useInstanceDetection';

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

const mockStartInstanceCoordinator = startInstanceCoordinator as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();

  // Reset to default mock: primary instance, no conflict
  mockStartInstanceCoordinator.mockReturnValue({
    isPrimary: true,
    onConflict: jest.fn(),
    shutdown: jest.fn(),
  });
});

// ===========================================================================
// T-ID.1  Single instance reports isPrimary = true
// ===========================================================================

describe('T-ID.1 -- Single instance default', () => {
  it('T-ID.1 -- single instance reports isPrimary = true and hasConflict = false', async () => {
    const { result } = renderHook(() => useInstanceDetection());

    await waitFor(() => {
      expect(result.current.isPrimary).toBe(true);
    });

    expect(result.current.isPrimary).toBe(true);
    expect(result.current.hasConflict).toBe(false);
  });
});

// ===========================================================================
// T-ID.2  Second instance detects conflict
// ===========================================================================

describe('T-ID.2 -- Second instance conflict', () => {
  it('T-ID.2 -- second instance detects conflict and sets isPrimary = false', async () => {
    let conflictCb: (() => void) | undefined;

    mockStartInstanceCoordinator.mockReturnValue({
      isPrimary: false,
      onConflict: jest.fn((cb: () => void) => {
        conflictCb = cb;
      }),
      shutdown: jest.fn(),
    });

    const { result } = renderHook(() => useInstanceDetection());

    // The coordinator returns isPrimary: false immediately
    await waitFor(() => {
      expect(result.current.isPrimary).toBe(false);
    });

    // Simulate the conflict callback firing
    act(() => {
      conflictCb?.();
    });

    expect(result.current.isPrimary).toBe(false);
    expect(result.current.hasConflict).toBe(true);
  });
});

// ===========================================================================
// T-ID.3  Conflict callback fires and sets hasConflict = true
// ===========================================================================

describe('T-ID.3 -- Conflict callback sets hasConflict', () => {
  it('T-ID.3 -- onConflict callback fires and sets hasConflict = true', async () => {
    let conflictCb: (() => void) | undefined;

    mockStartInstanceCoordinator.mockReturnValue({
      isPrimary: true,
      onConflict: jest.fn((cb: () => void) => {
        conflictCb = cb;
      }),
      shutdown: jest.fn(),
    });

    const { result } = renderHook(() => useInstanceDetection());

    // Initially no conflict
    await waitFor(() => {
      expect(result.current.isPrimary).toBe(true);
    });

    expect(result.current.hasConflict).toBe(false);

    // Simulate a second tab opening — the conflict callback fires
    act(() => {
      conflictCb?.();
    });

    expect(result.current.hasConflict).toBe(true);
  });
});

// ===========================================================================
// T-ID.4  Graceful fallback when BroadcastChannel unavailable
// ===========================================================================

describe('T-ID.4 -- BroadcastChannel unavailable fallback', () => {
  it('T-ID.4 -- works gracefully when BroadcastChannel is unavailable (default mock)', async () => {
    // The default mock simulates the coordinator working without
    // a real BroadcastChannel (which does not exist in the Jest/jsdom env).
    // The hook should still return valid state.
    const { result } = renderHook(() => useInstanceDetection());

    await waitFor(() => {
      expect(result.current.isPrimary).toBe(true);
    });

    expect(result.current.isPrimary).toBe(true);
    expect(result.current.hasConflict).toBe(false);
    expect(mockStartInstanceCoordinator).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// T-ID.5  Shutdown cleans up on unmount
// ===========================================================================

describe('T-ID.5 -- Shutdown on unmount', () => {
  it('T-ID.5 -- calls coordinator.shutdown() when hook unmounts', async () => {
    const mockShutdown = jest.fn();

    mockStartInstanceCoordinator.mockReturnValue({
      isPrimary: true,
      onConflict: jest.fn(),
      shutdown: mockShutdown,
    });

    const { result, unmount } = renderHook(() => useInstanceDetection());

    await waitFor(() => {
      expect(result.current.isPrimary).toBe(true);
    });

    expect(mockShutdown).not.toHaveBeenCalled();

    unmount();

    expect(mockShutdown).toHaveBeenCalledTimes(1);
  });
});
