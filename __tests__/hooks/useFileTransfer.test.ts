import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFileTransfer } from '@/hooks/useFileTransfer';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

const { useUmbra } = require('@/contexts/UmbraContext');

const mockTransfer = {
  transferId: 'xfer-1',
  fileId: 'file-1',
  peerDid: 'did:key:z6MkPeer',
  direction: 'upload' as const,
  state: 'transferring' as const,
  bytesTransferred: 512,
  totalBytes: 1024,
  chunksCompleted: 1,
  totalChunks: 2,
  speedBps: 100000,
  filename: 'test.txt',
};

function createMockService(overrides = {}) {
  return {
    getTransfers: jest.fn().mockResolvedValue([]),
    getTransfer: jest.fn().mockResolvedValue(null),
    getIncompleteTransfers: jest.fn().mockResolvedValue([]),
    initiateTransfer: jest.fn().mockResolvedValue(mockTransfer),
    acceptTransfer: jest.fn().mockResolvedValue({ ...mockTransfer, state: 'transferring' }),
    pauseTransfer: jest.fn().mockResolvedValue({ ...mockTransfer, state: 'paused' }),
    resumeTransfer: jest.fn().mockResolvedValue({ ...mockTransfer, state: 'transferring' }),
    cancelTransfer: jest.fn().mockResolvedValue({ ...mockTransfer, state: 'cancelled' }),
    onFileTransferEvent: jest.fn().mockReturnValue(jest.fn()),
    ...overrides,
  };
}

describe('useFileTransfer', () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = createMockService();
    (useUmbra as jest.Mock).mockReturnValue({
      service: mockService,
      isReady: true,
    });
  });

  test('returns empty transfers initially', async () => {
    const { result } = renderHook(() => useFileTransfer());

    await waitFor(() => {
      expect(result.current.allTransfers).toBeDefined();
    });

    expect(result.current.activeTransfers).toEqual([]);
    expect(result.current.completedTransfers).toEqual([]);
    expect(result.current.hasActiveTransfers).toBe(false);
  });

  test('loads transfers on mount', async () => {
    mockService.getTransfers.mockResolvedValue([mockTransfer]);

    const { result } = renderHook(() => useFileTransfer());

    await waitFor(() => {
      expect(result.current.allTransfers.length).toBeGreaterThan(0);
    });

    expect(result.current.activeTransfers).toHaveLength(1);
    expect(result.current.activeTransfers[0].transferId).toBe('xfer-1');
    expect(result.current.hasActiveTransfers).toBe(true);
  });

  test('subscribes to file transfer events', () => {
    renderHook(() => useFileTransfer());

    expect(mockService.onFileTransferEvent).toHaveBeenCalled();
  });

  test('does not fetch when service is not ready', () => {
    (useUmbra as jest.Mock).mockReturnValue({
      service: null,
      isReady: false,
    });

    renderHook(() => useFileTransfer());

    expect(mockService.getTransfers).not.toHaveBeenCalled();
  });

  test('computes upload/download speeds', async () => {
    const uploadTransfer = { ...mockTransfer, direction: 'upload', speedBps: 50000 };
    const downloadTransfer = { ...mockTransfer, transferId: 'xfer-2', direction: 'download', speedBps: 75000 };
    mockService.getTransfers.mockResolvedValue([uploadTransfer, downloadTransfer]);

    const { result } = renderHook(() => useFileTransfer());

    await waitFor(() => {
      expect(result.current.allTransfers.length).toBe(2);
    });

    expect(result.current.totalUploadSpeed).toBe(50000);
    expect(result.current.totalDownloadSpeed).toBe(75000);
  });
});
