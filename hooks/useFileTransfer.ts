/**
 * useFileTransfer — Hook for managing P2P file transfers.
 *
 * Tracks active, completed, and queued transfers. Provides control methods
 * (initiate, accept, pause, resume, cancel) and aggregates speed stats.
 * Subscribes to WASM `file_transfer` domain events for real-time updates.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   activeTransfers, completedTransfers, queuedTransfers,
 *   initiateUpload, acceptDownload,
 *   pauseTransfer, resumeTransfer, cancelTransfer,
 *   totalUploadSpeed, totalDownloadSpeed,
 *   clearCompleted,
 * } = useFileTransfer();
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import type {
  TransferProgress,
  FileTransferEvent,
  TransferDirection,
  TransportType,
} from '@umbra/service';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface UseFileTransferResult {
  /** Transfers currently in progress (transferring/negotiating/requesting) */
  activeTransfers: TransferProgress[];
  /** Completed transfers */
  completedTransfers: TransferProgress[];
  /** Queued transfers waiting to start */
  queuedTransfers: TransferProgress[];
  /** All transfers (active + completed + queued) */
  allTransfers: TransferProgress[];
  /** Aggregate upload speed in bytes/sec */
  totalUploadSpeed: number;
  /** Aggregate download speed in bytes/sec */
  totalDownloadSpeed: number;
  /** Whether any transfers are active */
  hasActiveTransfers: boolean;
  /** Initiate a file upload to a peer */
  initiateUpload: (
    fileId: string,
    peerDid: string,
    manifestJson: string,
    transportType?: TransportType,
  ) => Promise<TransferProgress | null>;
  /** Accept an incoming download request */
  acceptDownload: (transferId: string) => Promise<TransferProgress | null>;
  /** Pause a transfer */
  pauseTransfer: (transferId: string) => Promise<void>;
  /** Resume a paused transfer */
  resumeTransfer: (transferId: string) => Promise<void>;
  /** Cancel a transfer */
  cancelTransfer: (transferId: string, reason?: string) => Promise<void>;
  /** Clear all completed transfers from the list */
  clearCompleted: () => void;
  /** Refresh transfers from the service */
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// State helpers
// ---------------------------------------------------------------------------

const ACTIVE_STATES = new Set(['requesting', 'negotiating', 'transferring']);
const QUEUED_STATES = new Set(['paused']);
const COMPLETED_STATES = new Set(['completed', 'failed', 'cancelled']);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFileTransfer(): UseFileTransferResult {
  const { service, isReady } = useUmbra();

  const [transfers, setTransfers] = useState<TransferProgress[]>([]);

  // -------------------------------------------------------------------------
  // Fetch existing transfers on mount
  // -------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    if (!service) return;
    try {
      const all = await service.getTransfers();
      const incomplete = await service.getIncompleteTransfers();
      // Merge: active from manager + incomplete from DB
      const seen = new Set(all.map((t) => t.transferId));
      const merged = [...all];
      for (const t of incomplete) {
        if (!seen.has(t.transferId)) {
          merged.push(t);
        }
      }
      setTransfers(merged);
    } catch (err) {
      console.error('[useFileTransfer] Failed to fetch transfers:', err);
    }
  }, [service]);

  useEffect(() => {
    if (isReady && service) {
      refresh();
    }
  }, [isReady, service, refresh]);

  // -------------------------------------------------------------------------
  // Subscribe to file transfer events
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onFileTransferEvent((event: FileTransferEvent) => {
      switch (event.type) {
        case 'transferProgress':
          setTransfers((prev) => {
            const idx = prev.findIndex((t) => t.transferId === event.progress.transferId);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = event.progress;
              return updated;
            }
            return [...prev, event.progress];
          });
          break;

        case 'transferCompleted':
          setTransfers((prev) =>
            prev.map((t) =>
              t.transferId === event.transferId
                ? { ...t, state: 'completed' as const }
                : t,
            ),
          );
          break;

        case 'transferFailed':
          setTransfers((prev) =>
            prev.map((t) =>
              t.transferId === event.transferId
                ? { ...t, state: 'failed' as const, error: event.error }
                : t,
            ),
          );
          break;

        case 'transferPaused':
          setTransfers((prev) =>
            prev.map((t) =>
              t.transferId === event.transferId
                ? { ...t, state: 'paused' as const }
                : t,
            ),
          );
          break;

        case 'transferResumed':
          setTransfers((prev) =>
            prev.map((t) =>
              t.transferId === event.transferId
                ? { ...t, state: 'transferring' as const }
                : t,
            ),
          );
          break;

        case 'transferCancelled':
          setTransfers((prev) =>
            prev.map((t) =>
              t.transferId === event.transferId
                ? { ...t, state: 'cancelled' as const }
                : t,
            ),
          );
          break;

        case 'transferRequested':
          // An incoming request — add to transfers list
          setTransfers((prev) => [
            ...prev,
            {
              transferId: event.request.transferId,
              fileId: event.request.fileId,
              filename: event.request.filename,
              direction: 'download' as TransferDirection,
              state: 'requesting',
              chunksCompleted: 0,
              totalChunks: event.request.totalChunks,
              bytesTransferred: 0,
              totalBytes: event.request.totalBytes,
              speedBps: 0,
              peerDid: event.request.peerDid,
              startedAt: Date.now(),
              transportType: 'relay' as TransportType,
            },
          ]);
          break;
      }
    });

    return unsubscribe;
  }, [service]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const activeTransfers = useMemo(
    () => transfers.filter((t) => ACTIVE_STATES.has(t.state)),
    [transfers],
  );

  const completedTransfers = useMemo(
    () => transfers.filter((t) => COMPLETED_STATES.has(t.state)),
    [transfers],
  );

  const queuedTransfers = useMemo(
    () => transfers.filter((t) => QUEUED_STATES.has(t.state)),
    [transfers],
  );

  const totalUploadSpeed = useMemo(
    () =>
      activeTransfers
        .filter((t) => t.direction === 'upload')
        .reduce((sum, t) => sum + (t.speedBps ?? 0), 0),
    [activeTransfers],
  );

  const totalDownloadSpeed = useMemo(
    () =>
      activeTransfers
        .filter((t) => t.direction === 'download')
        .reduce((sum, t) => sum + (t.speedBps ?? 0), 0),
    [activeTransfers],
  );

  const hasActiveTransfers = activeTransfers.length > 0;

  // -------------------------------------------------------------------------
  // Control methods
  // -------------------------------------------------------------------------

  const initiateUpload = useCallback(
    async (
      fileId: string,
      peerDid: string,
      manifestJson: string,
      transportType: TransportType = 'relay',
    ): Promise<TransferProgress | null> => {
      if (!service) return null;
      try {
        const progress = await service.initiateTransfer(
          fileId,
          peerDid,
          manifestJson,
          'upload',
          transportType,
        );
        setTransfers((prev) => [...prev, progress]);
        return progress;
      } catch (err) {
        console.error('[useFileTransfer] Failed to initiate upload:', err);
        return null;
      }
    },
    [service],
  );

  const acceptDownload = useCallback(
    async (transferId: string): Promise<TransferProgress | null> => {
      if (!service) return null;
      try {
        const progress = await service.acceptTransfer(transferId);
        setTransfers((prev) =>
          prev.map((t) => (t.transferId === transferId ? progress : t)),
        );
        return progress;
      } catch (err) {
        console.error('[useFileTransfer] Failed to accept download:', err);
        return null;
      }
    },
    [service],
  );

  const pauseTransfer = useCallback(
    async (transferId: string): Promise<void> => {
      if (!service) return;
      try {
        await service.pauseTransfer(transferId);
      } catch (err) {
        console.error('[useFileTransfer] Failed to pause transfer:', err);
      }
    },
    [service],
  );

  const resumeTransfer = useCallback(
    async (transferId: string): Promise<void> => {
      if (!service) return;
      try {
        await service.resumeTransfer(transferId);
      } catch (err) {
        console.error('[useFileTransfer] Failed to resume transfer:', err);
      }
    },
    [service],
  );

  const cancelTransfer = useCallback(
    async (transferId: string, reason?: string): Promise<void> => {
      if (!service) return;
      try {
        await service.cancelTransfer(transferId, reason);
      } catch (err) {
        console.error('[useFileTransfer] Failed to cancel transfer:', err);
      }
    },
    [service],
  );

  const clearCompleted = useCallback(() => {
    setTransfers((prev) => prev.filter((t) => !COMPLETED_STATES.has(t.state)));
  }, []);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    activeTransfers,
    completedTransfers,
    queuedTransfers,
    allTransfers: transfers,
    totalUploadSpeed,
    totalDownloadSpeed,
    hasActiveTransfers,
    initiateUpload,
    acceptDownload,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
    clearCompleted,
    refresh,
  };
}
