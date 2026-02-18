/**
 * useUploadProgress — Hook for tracking all active uploads across the app.
 *
 * Provides a single ring progress value (0-100) for the nav icon indicator
 * and summary data for the hover popup.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   uploadRingProgress, activeUploadSummary,
 *   hasActiveUploads, activeUploadCount,
 * } = useUploadProgress();
 * ```
 */

import { useState, useEffect, useMemo } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import type {
  TransferProgress,
  FileTransferEvent,
} from '@umbra/service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadSummaryItem {
  /** Transfer ID */
  transferId: string;
  /** Filename being uploaded */
  filename: string;
  /** Progress 0-100 */
  progress: number;
  /** Speed in bytes/sec */
  speedBps: number;
  /** Estimated time remaining in seconds */
  etaSeconds: number | null;
}

export interface UseUploadProgressResult {
  /** Ring progress for nav icon (0-100, weighted average of all uploads) */
  uploadRingProgress: number;
  /** Individual upload summaries for hover popup */
  activeUploadSummary: UploadSummaryItem[];
  /** Whether any uploads are active */
  hasActiveUploads: boolean;
  /** Number of active uploads */
  activeUploadCount: number;
  /** Total upload speed in bytes/sec */
  totalUploadSpeed: number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUploadProgress(): UseUploadProgressResult {
  const { service, isReady } = useUmbra();

  const [uploads, setUploads] = useState<TransferProgress[]>([]);

  // -------------------------------------------------------------------------
  // Subscribe to file transfer events — filter for uploads
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!service || !isReady) return;

    const unsubscribe = service.onFileTransferEvent((event: FileTransferEvent) => {
      switch (event.type) {
        case 'transferProgress':
          if (event.progress.direction === 'upload') {
            setUploads((prev) => {
              const idx = prev.findIndex((u) => u.transferId === event.progress.transferId);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = event.progress;
                return updated;
              }
              return [...prev, event.progress];
            });
          }
          break;

        case 'transferCompleted':
        case 'transferFailed':
        case 'transferCancelled':
          setUploads((prev) =>
            prev.filter((u) => u.transferId !== event.transferId),
          );
          break;
      }
    });

    return unsubscribe;
  }, [service, isReady]);

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------

  const activeUploads = useMemo(
    () => uploads.filter((u) => u.state === 'transferring' || u.state === 'negotiating'),
    [uploads],
  );

  const uploadRingProgress = useMemo(() => {
    if (activeUploads.length === 0) return 0;

    // Weighted average by total bytes
    let totalWeightedProgress = 0;
    let totalWeight = 0;

    for (const u of activeUploads) {
      const progress =
        u.totalBytes > 0
          ? (u.bytesTransferred / u.totalBytes) * 100
          : u.totalChunks > 0
            ? (u.chunksCompleted / u.totalChunks) * 100
            : 0;
      totalWeightedProgress += progress * u.totalBytes;
      totalWeight += u.totalBytes;
    }

    return totalWeight > 0
      ? Math.round(totalWeightedProgress / totalWeight)
      : 0;
  }, [activeUploads]);

  const activeUploadSummary = useMemo<UploadSummaryItem[]>(() => {
    return activeUploads.map((u) => {
      const progress =
        u.totalBytes > 0
          ? (u.bytesTransferred / u.totalBytes) * 100
          : u.totalChunks > 0
            ? (u.chunksCompleted / u.totalChunks) * 100
            : 0;

      const remainingBytes = u.totalBytes - u.bytesTransferred;
      const etaSeconds =
        u.speedBps > 0 ? Math.ceil(remainingBytes / u.speedBps) : null;

      return {
        transferId: u.transferId,
        filename: u.filename,
        progress: Math.round(progress),
        speedBps: u.speedBps,
        etaSeconds,
      };
    });
  }, [activeUploads]);

  const totalUploadSpeed = useMemo(
    () => activeUploads.reduce((sum, u) => sum + (u.speedBps ?? 0), 0),
    [activeUploads],
  );

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    uploadRingProgress,
    activeUploadSummary,
    hasActiveUploads: activeUploads.length > 0,
    activeUploadCount: activeUploads.length,
    totalUploadSpeed,
  };
}
