/**
 * @module FileTransferProgress
 * @description Type definitions for the FileTransferProgress component —
 * a stepped progress indicator for file transfers showing state progression
 * from request through to completion.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** Current state of the transfer. */
export type TransferState =
  | 'requesting'
  | 'negotiating'
  | 'transferring'
  | 'verifying'
  | 'complete'
  | 'error'
  | 'paused'
  | 'cancelled';

/** Individual step in the transfer pipeline. */
export interface TransferStep {
  /** Human-readable label for the step. */
  label: string;
  /** Current status of this step. */
  status: 'pending' | 'active' | 'complete' | 'error';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FileTransferProgress component.
 */
export interface FileTransferProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Name of the file being transferred. */
  filename: string;
  /** Direction of the transfer. */
  direction: 'upload' | 'download';
  /** Overall transfer state. */
  state: TransferState;
  /** Steps in the transfer pipeline. */
  steps: TransferStep[];
  /** Transfer progress from 0 to 100. */
  progress: number;
  /** Bytes transferred so far. */
  bytesTransferred: number;
  /** Total bytes to transfer. */
  totalBytes: number;
  /** Transfer speed in bytes per second. */
  speedBps?: number;
  /** Display name of the peer. */
  peerName?: string;
  /** Transport type being used. */
  transportType?: 'webrtc' | 'relay' | 'libp2p';
  /** Called when the user pauses the transfer. */
  onPause?: () => void;
  /** Called when the user resumes the transfer. */
  onResume?: () => void;
  /** Called when the user cancels the transfer. */
  onCancel?: () => void;
  /** Called when the user retries a failed transfer. */
  onRetry?: () => void;
  /** Whether the detail area is expanded. @default false */
  expanded?: boolean;
  /** Called when the user toggles the detail area. */
  onExpandDetails?: () => void;
  /** Compact mode — hides step indicator. @default false */
  compact?: boolean;
  /** Show skeleton placeholder. @default false */
  skeleton?: boolean;
}
