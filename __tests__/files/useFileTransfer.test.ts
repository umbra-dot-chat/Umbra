/**
 * useFileTransfer — Jest unit tests for P2P file transfer operations.
 *
 * Test IDs covered:
 *   T4.23.1 - T4.23.8  File transfer lifecycle
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/contexts/UmbraContext', () => ({
  useUmbra: () => {
    const { UmbraService } = require('@umbra/service');
    return {
      service: UmbraService.instance,
      isReady: true,
      isLoading: false,
      error: null,
      version: '0.1.0-test',
      initStage: 'ready',
    };
  },
}));

import { UmbraService } from '@umbra/service';
import { useFileTransfer } from '@/hooks/useFileTransfer';

const mockService = UmbraService.instance as Record<string, jest.Mock>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTransferProgress(overrides: Record<string, unknown> = {}) {
  return {
    transferId: 'xfer-1',
    fileId: 'file-1',
    filename: 'doc.pdf',
    direction: 'upload' as const,
    state: 'negotiating' as string,
    chunksCompleted: 0,
    totalChunks: 4,
    bytesTransferred: 0,
    totalBytes: 4096,
    speedBps: 0,
    peerDid: 'did:key:z6MkPeer',
    startedAt: Date.now(),
    transportType: 'relay' as const,
    ...overrides,
  };
}

function resetMocks() {
  jest.clearAllMocks();
  mockService.getTransfers.mockResolvedValue([]);
  mockService.getIncompleteTransfers.mockResolvedValue([]);
  mockService.initiateTransfer.mockResolvedValue(makeTransferProgress());
  mockService.acceptTransfer.mockResolvedValue(
    makeTransferProgress({ state: 'transferring' }),
  );
  mockService.pauseTransfer.mockResolvedValue(undefined);
  mockService.resumeTransfer.mockResolvedValue(undefined);
  mockService.cancelTransfer.mockResolvedValue(undefined);
  mockService.onFileTransferEvent.mockReturnValue(jest.fn());
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useFileTransfer', () => {
  beforeEach(() => {
    resetMocks();
  });

  // =========================================================================
  // T4.23 — File transfer lifecycle
  // =========================================================================

  it('T4.23.1 — initiateUpload transitions from idle to negotiating', async () => {
    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.getTransfers).toHaveBeenCalled());

    await act(async () => {
      await result.current.initiateUpload(
        'file-1',
        'did:key:z6MkPeer',
        JSON.stringify({ name: 'doc.pdf', size: 1024 }),
        'relay',
      );
    });

    expect(mockService.initiateTransfer).toHaveBeenCalledWith(
      'file-1',
      'did:key:z6MkPeer',
      JSON.stringify({ name: 'doc.pdf', size: 1024 }),
      'upload',
      'relay',
    );

    expect(result.current.activeTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          transferId: 'xfer-1',
          state: 'negotiating',
          direction: 'upload',
        }),
      ]),
    );
  });

  it('T4.23.2 — acceptDownload calls service.acceptTransfer', async () => {
    let eventHandler: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventHandler = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.onFileTransferEvent).toHaveBeenCalled());

    // Simulate an incoming transfer request
    await act(async () => {
      eventHandler?.({
        type: 'transferRequested',
        request: {
          transferId: 'xfer-dl-1',
          fileId: 'file-dl-1',
          filename: 'incoming.pdf',
          totalChunks: 4,
          totalBytes: 4096,
          peerDid: 'did:key:z6MkSender',
        },
      });
    });

    await act(async () => {
      await result.current.acceptDownload('xfer-dl-1');
    });

    expect(mockService.acceptTransfer).toHaveBeenCalledWith('xfer-dl-1');
  });

  it('T4.23.3 — Progress updates via transferProgress event', async () => {
    let eventHandler: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventHandler = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.onFileTransferEvent).toHaveBeenCalled());

    // Add a transfer via progress event
    await act(async () => {
      eventHandler?.({
        type: 'transferProgress',
        progress: makeTransferProgress({ state: 'transferring', bytesTransferred: 0 }),
      });
    });

    // Update progress
    await act(async () => {
      eventHandler?.({
        type: 'transferProgress',
        progress: makeTransferProgress({
          state: 'transferring',
          bytesTransferred: 2048,
          chunksCompleted: 2,
          speedBps: 512000,
        }),
      });
    });

    expect(result.current.activeTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          transferId: 'xfer-1',
          bytesTransferred: 2048,
          chunksCompleted: 2,
        }),
      ]),
    );
  });

  it('T4.23.4 — cancelTransfer calls service.cancelTransfer with correct args', async () => {
    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.getTransfers).toHaveBeenCalled());

    await act(async () => {
      await result.current.cancelTransfer('xfer-1', 'user requested');
    });

    expect(mockService.cancelTransfer).toHaveBeenCalledWith('xfer-1', 'user requested');
  });

  it('T4.23.5 — Pause and resume transitions work via events', async () => {
    let eventHandler: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventHandler = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.onFileTransferEvent).toHaveBeenCalled());

    // Start with a transferring transfer
    await act(async () => {
      eventHandler?.({
        type: 'transferProgress',
        progress: makeTransferProgress({ state: 'transferring' }),
      });
    });

    expect(result.current.activeTransfers).toHaveLength(1);

    // Pause via event
    await act(async () => {
      eventHandler?.({
        type: 'transferPaused',
        transferId: 'xfer-1',
      });
    });

    expect(result.current.queuedTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transferId: 'xfer-1', state: 'paused' }),
      ]),
    );
    expect(result.current.activeTransfers).toHaveLength(0);

    // Resume via event
    await act(async () => {
      eventHandler?.({
        type: 'transferResumed',
        transferId: 'xfer-1',
      });
    });

    expect(result.current.activeTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transferId: 'xfer-1', state: 'transferring' }),
      ]),
    );
    expect(result.current.queuedTransfers).toHaveLength(0);
  });

  it('T4.23.6 — Transfer completes via transferCompleted event', async () => {
    let eventHandler: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventHandler = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.onFileTransferEvent).toHaveBeenCalled());

    // Start with a transferring transfer
    await act(async () => {
      eventHandler?.({
        type: 'transferProgress',
        progress: makeTransferProgress({ state: 'transferring' }),
      });
    });

    expect(result.current.activeTransfers).toHaveLength(1);

    // Complete
    await act(async () => {
      eventHandler?.({
        type: 'transferCompleted',
        transferId: 'xfer-1',
      });
    });

    expect(result.current.completedTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transferId: 'xfer-1', state: 'completed' }),
      ]),
    );
    expect(result.current.activeTransfers).toHaveLength(0);
  });

  it('T4.23.7 — Transfer error via transferFailed event sets failed state', async () => {
    let eventHandler: ((event: any) => void) | null = null;
    mockService.onFileTransferEvent.mockImplementation((cb: any) => {
      eventHandler = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.onFileTransferEvent).toHaveBeenCalled());

    // Start with a transferring transfer
    await act(async () => {
      eventHandler?.({
        type: 'transferProgress',
        progress: makeTransferProgress({ state: 'transferring' }),
      });
    });

    // Fail
    await act(async () => {
      eventHandler?.({
        type: 'transferFailed',
        transferId: 'xfer-1',
        error: 'Connection lost',
      });
    });

    expect(result.current.completedTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transferId: 'xfer-1', state: 'failed' }),
      ]),
    );
    expect(result.current.activeTransfers).toHaveLength(0);
  });

  it('T4.23.8 — Multiple concurrent transfers tracked independently', async () => {
    mockService.initiateTransfer
      .mockResolvedValueOnce(makeTransferProgress({ transferId: 'xfer-1', fileId: 'file-1' }))
      .mockResolvedValueOnce(makeTransferProgress({ transferId: 'xfer-2', fileId: 'file-2' }));

    const { result } = renderHook(() => useFileTransfer());
    await waitFor(() => expect(mockService.getTransfers).toHaveBeenCalled());

    await act(async () => {
      await result.current.initiateUpload('file-1', 'did:key:z6MkPeer', '{}', 'relay');
    });

    await act(async () => {
      await result.current.initiateUpload('file-2', 'did:key:z6MkPeer2', '{}', 'relay');
    });

    expect(result.current.activeTransfers).toHaveLength(2);
    expect(result.current.activeTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ transferId: 'xfer-1', fileId: 'file-1' }),
        expect.objectContaining({ transferId: 'xfer-2', fileId: 'file-2' }),
      ]),
    );
  });
});
