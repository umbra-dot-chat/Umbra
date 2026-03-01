/**
 * Tests for useStorageManager hook
 *
 * Covers storage usage fetching, smart cleanup, auto-cleanup rules,
 * error handling, and formatBytes utility.
 *
 * Test IDs: T11.11.1 - T11.11.11
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mock UmbraContext before importing the hook
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

// The @umbra/service mock is auto-resolved via moduleNameMapper
// It provides: getStorageUsage, smartCleanup, getCleanupSuggestions,
//              setAutoCleanupRules, getAutoCleanupRules, formatBytes

import { useStorageManager } from '@/hooks/useStorageManager';
import { useUmbra } from '@/contexts/UmbraContext';
import {
  getStorageUsage,
  smartCleanup,
  getCleanupSuggestions,
  setAutoCleanupRules,
  getAutoCleanupRules,
  formatBytes,
} from '@umbra/service';

// Cast mocks for type safety
const mockGetStorageUsage = getStorageUsage as jest.Mock;
const mockSmartCleanup = smartCleanup as jest.Mock;
const mockGetCleanupSuggestions = getCleanupSuggestions as jest.Mock;
const mockSetAutoCleanupRules = setAutoCleanupRules as jest.Mock;
const mockGetAutoCleanupRules = getAutoCleanupRules as jest.Mock;
const mockFormatBytes = formatBytes as jest.Mock;

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();

  // Reset default mock return values
  mockGetStorageUsage.mockResolvedValue({
    total: 1048576,
    byContext: { community: 524288, dm: 262144, sharedFolders: 131072, cache: 131072 },
    manifestCount: 5,
    chunkCount: 20,
    activeTransfers: 0,
  });

  mockGetCleanupSuggestions.mockResolvedValue([]);

  mockSmartCleanup.mockResolvedValue({
    bytesFreed: 0,
    chunksRemoved: 0,
    manifestsRemoved: 0,
    transfersCleaned: 0,
  });

  mockGetAutoCleanupRules.mockReturnValue({
    maxTotalBytes: 2 * 1024 * 1024 * 1024,
    maxTransferAge: 604800,
    maxCacheAge: 86400,
    removeOrphanedChunks: true,
  });

  // Ensure useUmbra returns ready state
  (useUmbra as jest.Mock).mockReturnValue({
    isReady: true,
    isLoading: false,
    error: null,
    service: null,
    version: '0.1.0-test',
    initStage: 'ready',
  });
});

// ---------------------------------------------------------------------------
// T11.11.1 — Initial loading state
// ---------------------------------------------------------------------------

describe('T11.11.1 — Initial Loading State', () => {
  it('T11.11.1 — isLoading starts as true and becomes false after fetch', async () => {
    const { result } = renderHook(() => useStorageManager());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// T11.11.2-3 — Fetch storage usage
// ---------------------------------------------------------------------------

describe('T11.11.2-3 — Storage Usage Fetching', () => {
  it('T11.11.2 — fetches and populates storageUsage on mount', async () => {
    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.storageUsage).not.toBeNull();
    });

    expect(result.current.storageUsage?.total).toBe(1048576);
    expect(result.current.storageUsage?.chunkCount).toBe(20);
    expect(mockGetStorageUsage).toHaveBeenCalledTimes(1);
  });

  it('T11.11.3 — does not fetch when isReady is false', async () => {
    (useUmbra as jest.Mock).mockReturnValue({
      isReady: false,
      isLoading: true,
      error: null,
      service: null,
      version: '',
      initStage: 'booting',
    });

    const { result } = renderHook(() => useStorageManager());

    // Give it a tick to potentially fire the effect
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(mockGetStorageUsage).not.toHaveBeenCalled();
    expect(result.current.storageUsage).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T11.11.4-5 — Smart cleanup
// ---------------------------------------------------------------------------

describe('T11.11.4-5 — Smart Cleanup', () => {
  it('T11.11.4 — smartCleanup runs cleanup and refreshes usage', async () => {
    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      const cleanupResult = await result.current.smartCleanup();
      expect(cleanupResult).not.toBeNull();
      expect(cleanupResult?.bytesFreed).toBe(0);
    });

    expect(mockSmartCleanup).toHaveBeenCalledTimes(1);
    // Should have re-fetched usage after cleanup (initial + cleanup refresh)
    expect(mockGetStorageUsage).toHaveBeenCalledTimes(2);
  });

  it('T11.11.5 — smartCleanup stores lastCleanupResult', async () => {
    mockSmartCleanup.mockResolvedValue({
      bytesFreed: 1024,
      chunksRemoved: 2,
      manifestsRemoved: 1,
      transfersCleaned: 0,
    });

    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.smartCleanup();
    });

    expect(result.current.lastCleanupResult?.bytesFreed).toBe(1024);
    expect(result.current.lastCleanupResult?.chunksRemoved).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// T11.11.6-7 — Cleanup errors
// ---------------------------------------------------------------------------

describe('T11.11.6-7 — Cleanup Error Handling', () => {
  it('T11.11.6 — smartCleanup returns null and sets error on failure', async () => {
    mockSmartCleanup.mockRejectedValue(new Error('Cleanup failed'));

    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let cleanupResult: any;
    await act(async () => {
      cleanupResult = await result.current.smartCleanup();
    });

    expect(cleanupResult).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Cleanup failed');
  });

  it('T11.11.7 — fetch error sets error state', async () => {
    mockGetStorageUsage.mockRejectedValue(new Error('Storage read error'));

    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error?.message).toBe('Storage read error');
    expect(result.current.storageUsage).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T11.11.8-9 — Auto-cleanup rules
// ---------------------------------------------------------------------------

describe('T11.11.8-9 — Auto-Cleanup Rules', () => {
  it('T11.11.8 — autoCleanupRules reflects initial rules from getAutoCleanupRules', () => {
    const { result } = renderHook(() => useStorageManager());

    expect(result.current.autoCleanupRules.maxTotalBytes).toBe(2 * 1024 * 1024 * 1024);
    expect(result.current.autoCleanupRules.removeOrphanedChunks).toBe(true);
  });

  it('T11.11.9 — setAutoCleanupRules calls setRules and refreshes state', async () => {
    const updatedRules = {
      maxTotalBytes: 1024 * 1024 * 1024,
      maxTransferAge: 604800,
      maxCacheAge: 86400,
      removeOrphanedChunks: false,
    };

    mockGetAutoCleanupRules.mockReturnValue(updatedRules);

    const { result } = renderHook(() => useStorageManager());

    act(() => {
      result.current.setAutoCleanupRules({ removeOrphanedChunks: false });
    });

    expect(mockSetAutoCleanupRules).toHaveBeenCalledWith({ removeOrphanedChunks: false });
    // After setting, the hook re-reads rules
    expect(result.current.autoCleanupRules.removeOrphanedChunks).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// T11.11.10 — Refresh
// ---------------------------------------------------------------------------

describe('T11.11.10 — Refresh', () => {
  it('T11.11.10 — refresh re-fetches storage usage', async () => {
    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Update mock return value for the refresh
    mockGetStorageUsage.mockResolvedValue({
      total: 2097152,
      byContext: { community: 1048576, dm: 524288, sharedFolders: 262144, cache: 262144 },
      manifestCount: 10,
      chunkCount: 40,
      activeTransfers: 1,
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.storageUsage?.total).toBe(2097152);
    expect(result.current.storageUsage?.manifestCount).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// T11.11.11 — formatBytes utility
// ---------------------------------------------------------------------------

describe('T11.11.11 — formatBytes', () => {
  it('T11.11.11 — formatBytes is exposed and delegates to service', () => {
    const { result } = renderHook(() => useStorageManager());

    const formatted = result.current.formatBytes(1048576);

    expect(mockFormatBytes).toHaveBeenCalledWith(1048576);
    expect(typeof formatted).toBe('string');
  });
});
