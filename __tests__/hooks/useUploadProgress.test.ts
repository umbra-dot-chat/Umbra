/**
 * Tests for useUploadProgress hook
 *
 * Covers: initial state, tracking uploads, progress calculation,
 * removal on completion.
 */

import { renderHook, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOnFileTransferEvent = jest.fn();

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => ({
    service: { onFileTransferEvent: mockOnFileTransferEvent },
    isReady: true,
  }),
}));

import { useUploadProgress } from '@/hooks/useUploadProgress';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useUploadProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnFileTransferEvent.mockReturnValue(jest.fn());
  });

  it('starts with no active uploads', () => {
    const { result } = renderHook(() => useUploadProgress());

    expect(result.current.hasActiveUploads).toBe(false);
    expect(result.current.activeUploadCount).toBe(0);
    expect(result.current.uploadRingProgress).toBe(0);
  });

  it('tracks upload progress events', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockOnFileTransferEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useUploadProgress());

    act(() => {
      eventCallback!({
        type: 'transferProgress',
        progress: {
          transferId: 'tx-1',
          direction: 'upload',
          filename: 'photo.jpg',
          state: 'transferring',
          bytesTransferred: 50,
          totalBytes: 100,
          totalChunks: 10,
          chunksCompleted: 5,
          speedBps: 1000,
        },
      });
    });

    expect(result.current.hasActiveUploads).toBe(true);
    expect(result.current.activeUploadCount).toBe(1);
    expect(result.current.uploadRingProgress).toBe(50);
  });

  it('removes upload on transfer completion', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockOnFileTransferEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useUploadProgress());

    act(() => {
      eventCallback!({
        type: 'transferProgress',
        progress: {
          transferId: 'tx-1',
          direction: 'upload',
          filename: 'photo.jpg',
          state: 'transferring',
          bytesTransferred: 50,
          totalBytes: 100,
          totalChunks: 10,
          chunksCompleted: 5,
          speedBps: 1000,
        },
      });
    });
    expect(result.current.hasActiveUploads).toBe(true);

    act(() => {
      eventCallback!({
        type: 'transferCompleted',
        transferId: 'tx-1',
      });
    });
    expect(result.current.hasActiveUploads).toBe(false);
    expect(result.current.activeUploadCount).toBe(0);
  });

  it('ignores download progress events', () => {
    let eventCallback: ((event: any) => void) | null = null;
    mockOnFileTransferEvent.mockImplementation((cb: any) => {
      eventCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useUploadProgress());

    act(() => {
      eventCallback!({
        type: 'transferProgress',
        progress: {
          transferId: 'tx-2',
          direction: 'download', // not upload
          filename: 'file.pdf',
          state: 'transferring',
          bytesTransferred: 30,
          totalBytes: 100,
          totalChunks: 10,
          chunksCompleted: 3,
          speedBps: 500,
        },
      });
    });

    expect(result.current.hasActiveUploads).toBe(false);
  });
});
