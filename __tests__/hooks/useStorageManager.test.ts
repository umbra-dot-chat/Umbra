import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useStorageManager } from '@/hooks/useStorageManager';

// Mock UmbraContext
jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

// Mock the storage-manager functions from @umbra/service
const mockGetStorageUsage = jest.fn();
const mockSmartCleanup = jest.fn();
const mockGetCleanupSuggestions = jest.fn();
const mockSetAutoCleanupRules = jest.fn();
const mockGetAutoCleanupRules = jest.fn();
const mockFormatBytes = jest.fn();

jest.mock('@umbra/service', () => ({
  getStorageUsage: (...args: any[]) => mockGetStorageUsage(...args),
  smartCleanup: (...args: any[]) => mockSmartCleanup(...args),
  getCleanupSuggestions: (...args: any[]) => mockGetCleanupSuggestions(...args),
  setAutoCleanupRules: (...args: any[]) => mockSetAutoCleanupRules(...args),
  getAutoCleanupRules: (...args: any[]) => mockGetAutoCleanupRules(...args),
  formatBytes: (...args: any[]) => mockFormatBytes(...args),
}));

const { useUmbra } = require('@/contexts/UmbraContext');

const mockStorageUsage = {
  total: 1024 * 1024 * 50, // 50 MB
  byContext: {
    community: 1024 * 1024 * 20,
    dm: 1024 * 1024 * 15,
    sharedFolders: 1024 * 1024 * 10,
    cache: 1024 * 1024 * 5,
  },
  manifestCount: 25,
  chunkCount: 100,
  activeTransfers: 2,
};

const mockSuggestions = [
  {
    type: 'old_transfers',
    description: 'Clear completed transfers older than 7 days',
    bytesReclaimable: 1024 * 1024 * 8,
  },
];

describe('useStorageManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: isReady
    (useUmbra as jest.Mock).mockReturnValue({ isReady: true });

    // Default mock implementations
    mockGetStorageUsage.mockResolvedValue(mockStorageUsage);
    mockGetCleanupSuggestions.mockResolvedValue(mockSuggestions);
    mockSmartCleanup.mockResolvedValue({ bytesFreed: 1024 * 1024 * 8, itemsRemoved: 12 });
    mockGetAutoCleanupRules.mockReturnValue({});
    mockSetAutoCleanupRules.mockImplementation(() => {});
    mockFormatBytes.mockImplementation((bytes: number) => {
      if (bytes === 0) return '0 B';
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
      if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
      return `${(bytes / 1073741824).toFixed(1)} GB`;
    });
  });

  test('loads storage usage on mount', async () => {
    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.storageUsage).toBeDefined();
    expect(result.current.storageUsage?.total).toBe(1024 * 1024 * 50);
    expect(mockGetStorageUsage).toHaveBeenCalled();
  });

  test('provides formatBytes utility', () => {
    const { result } = renderHook(() => useStorageManager());

    expect(result.current.formatBytes(0)).toBe('0 B');
    expect(result.current.formatBytes(1024)).toBe('1.0 KB');
    expect(result.current.formatBytes(1048576)).toBe('1.0 MB');
    expect(result.current.formatBytes(1073741824)).toBe('1.0 GB');
  });

  test('loads cleanup suggestions', async () => {
    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.cleanupSuggestions).toHaveLength(1);
    expect(result.current.cleanupSuggestions[0].type).toBe('old_transfers');
  });

  test('does not load when not ready', () => {
    (useUmbra as jest.Mock).mockReturnValue({ isReady: false });

    const { result } = renderHook(() => useStorageManager());

    expect(mockGetStorageUsage).not.toHaveBeenCalled();
    expect(result.current.storageUsage).toBeNull();
  });

  test('handles errors gracefully', async () => {
    mockGetStorageUsage.mockRejectedValue(new Error('Storage error'));

    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.storageUsage).toBeNull();
  });

  test('runs smart cleanup and refreshes usage', async () => {
    const { result } = renderHook(() => useStorageManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let cleanupResult: any;
    await act(async () => {
      cleanupResult = await result.current.smartCleanup();
    });

    expect(cleanupResult).toBeDefined();
    expect(cleanupResult?.bytesFreed).toBe(1024 * 1024 * 8);
    expect(mockSmartCleanup).toHaveBeenCalled();
    // Should refresh usage after cleanup
    expect(mockGetStorageUsage).toHaveBeenCalledTimes(2);
  });
});
