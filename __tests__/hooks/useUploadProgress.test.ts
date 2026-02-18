import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useUploadProgress } from '@/hooks/useUploadProgress';

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: jest.fn(),
}));

const { useUmbra } = require('@/contexts/UmbraContext');

function createMockService(overrides = {}) {
  return {
    onFileTransferEvent: jest.fn().mockReturnValue(jest.fn()),
    ...overrides,
  };
}

describe('useUploadProgress', () => {
  let mockService: ReturnType<typeof createMockService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = createMockService();
    (useUmbra as jest.Mock).mockReturnValue({
      service: mockService,
      isReady: true,
    });
  });

  test('returns zero progress with no active uploads', () => {
    const { result } = renderHook(() => useUploadProgress());

    expect(result.current.uploadRingProgress).toBe(0);
    expect(result.current.hasActiveUploads).toBe(false);
    expect(result.current.activeUploadCount).toBe(0);
    expect(result.current.activeUploadSummary).toEqual([]);
    expect(result.current.totalUploadSpeed).toBe(0);
  });

  test('subscribes to file transfer events', () => {
    renderHook(() => useUploadProgress());

    expect(mockService.onFileTransferEvent).toHaveBeenCalled();
  });

  test('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockService.onFileTransferEvent.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useUploadProgress());
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  test('does not subscribe when service is not ready', () => {
    (useUmbra as jest.Mock).mockReturnValue({
      service: null,
      isReady: false,
    });

    renderHook(() => useUploadProgress());

    expect(mockService.onFileTransferEvent).not.toHaveBeenCalled();
  });

  test('tracks upload progress from events', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useUploadProgress());

    // Simulate a progress event
    act(() => {
      eventCallback?.({
        type: 'transferProgress',
        progress: {
          transferId: 'xfer-1',
          direction: 'upload',
          state: 'transferring',
          bytesTransferred: 500,
          totalBytes: 1000,
          chunksCompleted: 1,
          totalChunks: 2,
          speedBps: 50000,
          filename: 'test.txt',
        },
      });
    });

    expect(result.current.hasActiveUploads).toBe(true);
    expect(result.current.activeUploadCount).toBe(1);
    expect(result.current.uploadRingProgress).toBe(50);
    expect(result.current.totalUploadSpeed).toBe(50000);
  });

  test('removes completed uploads', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useUploadProgress());

    // Add an upload
    act(() => {
      eventCallback?.({
        type: 'transferProgress',
        progress: {
          transferId: 'xfer-1',
          direction: 'upload',
          state: 'transferring',
          bytesTransferred: 500,
          totalBytes: 1000,
          chunksCompleted: 1,
          totalChunks: 2,
          speedBps: 50000,
          filename: 'test.txt',
        },
      });
    });

    expect(result.current.hasActiveUploads).toBe(true);

    // Complete the upload
    act(() => {
      eventCallback?.({
        type: 'transferCompleted',
        transferId: 'xfer-1',
      });
    });

    expect(result.current.hasActiveUploads).toBe(false);
    expect(result.current.activeUploadCount).toBe(0);
    expect(result.current.uploadRingProgress).toBe(0);
  });

  test('ignores download progress events', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useUploadProgress());

    // Simulate a download progress event
    act(() => {
      eventCallback?.({
        type: 'transferProgress',
        progress: {
          transferId: 'xfer-dl',
          direction: 'download',
          state: 'transferring',
          bytesTransferred: 500,
          totalBytes: 1000,
          chunksCompleted: 1,
          totalChunks: 2,
          speedBps: 50000,
          filename: 'download.txt',
        },
      });
    });

    // Should still be zero — downloads are not tracked
    expect(result.current.hasActiveUploads).toBe(false);
    expect(result.current.uploadRingProgress).toBe(0);
  });
});
