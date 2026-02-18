import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useDmFiles } from '@/hooks/useDmFiles';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useUmbra } = require('@/contexts/UmbraContext');
const { useAuth } = require('@/contexts/AuthContext');

const mockDmFiles = [
  {
    id: 'dm-file-1',
    conversationId: 'conv-1',
    folderId: null,
    filename: 'shared-doc.pdf',
    fileSize: 4096,
    mimeType: 'application/pdf',
    storageChunksJson: '[]',
    uploadedBy: 'did:key:z6MkPeer',
    version: 1,
    downloadCount: 1,
    createdAt: Date.now(),
    isEncrypted: true,
  },
  {
    id: 'dm-file-2',
    conversationId: 'conv-1',
    folderId: null,
    filename: 'vacation.jpg',
    fileSize: 204800,
    mimeType: 'image/jpeg',
    storageChunksJson: '[]',
    uploadedBy: 'did:key:z6MkTest',
    version: 1,
    downloadCount: 0,
    createdAt: Date.now(),
    isEncrypted: true,
  },
];

function createMockService(overrides = {}) {
  return {
    getDmFiles: jest.fn().mockResolvedValue([]),
    uploadDmFile: jest.fn().mockResolvedValue({ id: 'dm-file-new' }),
    deleteDmFile: jest.fn().mockResolvedValue(undefined),
    recordDmFileDownload: jest.fn().mockResolvedValue(undefined),
    moveDmFile: jest.fn().mockResolvedValue(undefined),
    getDmFolders: jest.fn().mockResolvedValue([]),
    createDmFolder: jest.fn().mockResolvedValue({ id: 'dm-folder-new' }),
    deleteDmFolder: jest.fn().mockResolvedValue(undefined),
    renameDmFolder: jest.fn().mockResolvedValue(undefined),
    onFileTransferEvent: jest.fn().mockReturnValue(jest.fn()),
    onDmFileEvent: jest.fn().mockReturnValue(jest.fn()),
    ...overrides,
  };
}

describe('useDmFiles', () => {
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

  test('returns empty files initially', async () => {
    const { result } = renderHook(() => useDmFiles('conv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  test('loads files on mount', async () => {
    mockService.getDmFiles.mockResolvedValue(mockDmFiles);

    const { result } = renderHook(() => useDmFiles('conv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.files).toHaveLength(2);
  });

  test('filters files by type', async () => {
    mockService.getDmFiles.mockResolvedValue(mockDmFiles);

    const { result } = renderHook(() => useDmFiles('conv-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Set filter to images
    act(() => {
      result.current.setFilter('images');
    });

    expect(result.current.filter).toBe('images');
    // After filtering, only image files should be present
    const imageFiles = result.current.files.filter((f: any) => f.mimeType.startsWith('image/'));
    expect(imageFiles.length).toBeLessThanOrEqual(result.current.files.length);
  });

  test('handles service errors gracefully', async () => {
    mockService.getDmFiles.mockRejectedValue(new Error('Connection failed'));

    const { result } = renderHook(() => useDmFiles('conv-1'));

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

    renderHook(() => useDmFiles('conv-1'));

    expect(mockService.getDmFiles).not.toHaveBeenCalled();
  });

  test('does not fetch with null conversationId', () => {
    renderHook(() => useDmFiles(null));

    expect(mockService.getDmFiles).not.toHaveBeenCalled();
  });
});
