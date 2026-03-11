/**
 * @module FileTransferList
 * @description Type definitions for the FileTransferList component —
 * a list of active file transfers with summary counts.
 */
import type React from 'react';
import type { FileTransferProgressProps } from './FileTransferProgress.types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FileTransferList component.
 */
export interface FileTransferListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of active transfers to display. */
  transfers: FileTransferProgressProps[];
  /** Called when the user clears completed transfers. */
  onClearCompleted?: () => void;
  /** Text shown when no transfers exist. @default 'No active transfers' */
  emptyText?: string;
  /** Show skeleton placeholder. @default false */
  skeleton?: boolean;
}
