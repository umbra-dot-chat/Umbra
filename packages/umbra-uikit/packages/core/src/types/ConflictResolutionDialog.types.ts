/**
 * @module ConflictResolutionDialog
 * @description Type definitions for the ConflictResolutionDialog component —
 * a modal for resolving file sync conflicts between local and remote versions.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** Metadata for a file version involved in a conflict. */
export interface ConflictVersion {
  /** ISO timestamp of last modification. */
  modifiedAt: string;
  /** Display name of the user who modified the file. */
  modifiedBy: string;
  /** File size in bytes. */
  size: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the ConflictResolutionDialog component.
 */
export interface ConflictResolutionDialogProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the dialog is open. */
  open: boolean;
  /** Name of the conflicting file. */
  filename: string;
  /** Metadata for the local version. */
  localVersion: ConflictVersion;
  /** Metadata for the remote version. */
  remoteVersion: ConflictVersion;
  /** Called when the user chooses to keep the local version. */
  onKeepLocal: () => void;
  /** Called when the user chooses to keep the remote version. */
  onKeepRemote: () => void;
  /** Called when the user chooses to keep both versions. */
  onKeepBoth: () => void;
  /** Called when the dialog is closed. */
  onClose?: () => void;
  /** Show skeleton placeholder. @default false */
  skeleton?: boolean;
}
