import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCommunityFiles } from '@/hooks/useCommunityFiles';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useUmbra } = require('@/contexts/UmbraContext');
const { useAuth } = require('@/contexts/AuthContext');

const mockFiles = [
  {
    id: 'file-1',
    channelId: 'ch-1',
    folderId: null,
    filename: 'readme.md',
    fileSize: 2048,
    mimeType: 'text/markdown',
    storageChunksJson: '[]',
    uploadedBy: 'did:key:z6MkTest',
    version: 1,
    downloadCount: 3,
    createdAt: Date.now(),
  },
];

const mockFolders = [
  {
    id: 'folder-1',
    channelId: 'ch-1',
    name: 'Documents',
    parentFolderId: null,
    createdBy: 'did:key:z6MkTest',
    createdAt: Date.now(),
  },
];

function createMockService(overrides = {}) {
  return {
    getCommunityFiles: jest.fn().mockResolvedValue([]),
    getCommunityFolders: jest.fn().mockResolvedValue([]),
    uploadCommunityFile: jest.fn().mockResolvedValue({ id: 'file-new' }),
    deleteCommunityFile: jest.fn().mockResolvedValue(undefined),
    createCommunityFolder: jest.fn().mockResolvedValue({ id: 'folder-new', name: 'New' }),
    deleteCommunityFolder: jest.fn().mockResolvedValue(undefined),
    onCommunityEvent: jest.fn().mockReturnValue(jest.fn()),
    ...overrides,
  };
}

describe('useCommunityFiles', () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = createMockService();
    (useUmbra as jest.Mock).mockReturnValue({
      service: mockService,
      isReady: true,
    });
    (useAuth as jest.Mock).mockReturnValue({
      identity: { did: 'did:key:z6MkTest', displayName: 'Test' },
    });
  });

  test('returns empty arrays initially', async () => {
    const { result } = renderHook(() => useCommunityFiles('ch-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toEqual([]);
    expect(result.current.folders).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('loads files and folders on mount', async () => {
    mockService.getCommunityFiles.mockResolvedValue(mockFiles);
    mockService.getCommunityFolders.mockResolvedValue(mockFolders);

    const { result } = renderHook(() => useCommunityFiles('ch-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.folders).toHaveLength(1);
    expect(mockService.getCommunityFiles).toHaveBeenCalled();
  });

  test('handles service errors gracefully', async () => {
    mockService.getCommunityFiles.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCommunityFiles('ch-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
  });

  test('does not fetch when service is not ready', () => {
    (useUmbra as jest.Mock).mockReturnValue({
      service: null,
      isReady: false,
    });

    renderHook(() => useCommunityFiles('ch-1'));

    expect(mockService.getCommunityFiles).not.toHaveBeenCalled();
  });

  test('navigates into folders', async () => {
    mockService.getCommunityFiles.mockResolvedValue(mockFiles);
    mockService.getCommunityFolders.mockResolvedValue(mockFolders);

    const { result } = renderHook(() => useCommunityFiles('ch-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.navigateToFolder('folder-1');
    });

    expect(result.current.currentFolderId).toBe('folder-1');
  });

  test('returns null channelId does not fetch', () => {
    const { result } = renderHook(() => useCommunityFiles(null));

    expect(mockService.getCommunityFiles).not.toHaveBeenCalled();
    expect(result.current.files).toEqual([]);
  });
});
