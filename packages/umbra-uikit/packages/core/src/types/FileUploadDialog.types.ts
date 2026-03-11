/**
 * @module FileUploadDialog
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/**
 * Represents a file currently being uploaded with progress tracking.
 */
export interface UploadingFile {
  id: string;
  name: string;
  size: number;
  /** Upload progress from 0 to 100. */
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link FileUploadDialog} component.
 */
export interface FileUploadDialogProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  /** Whether the dialog is open. */
  open: boolean;

  /** Callback to close the dialog. */
  onClose: () => void;

  /** Callback fired when files are selected via browse or drag-and-drop. */
  onFilesSelected?: (files: File[]) => void;

  /** Array of files currently being uploaded, with progress info. */
  uploadingFiles?: UploadingFile[];

  /** Callback to cancel upload of a specific file. */
  onCancelUpload?: (fileId: string) => void;

  /** Callback to retry a failed upload. */
  onRetryUpload?: (fileId: string) => void;

  /** Accepted file types (e.g. "image/*", ".pdf,.doc"). */
  accept?: string;

  /** Maximum file size in bytes. */
  maxSize?: number;

  /**
   * Allow multiple file selection.
   * @default true
   */
  multiple?: boolean;

  /**
   * Dialog title.
   * @default 'Upload Files'
   */
  title?: string;

  /** Display name of the target folder for context. */
  targetFolderName?: string;

  // ---- Chunking progress (Section 6.3) ----

  /** Whether the file is being chunked. @default false */
  chunking?: boolean;

  /** Number of chunks completed. */
  chunksCompleted?: number;

  /** Total number of chunks. */
  totalChunks?: number;

  /** Encryption status of the upload. @default 'none' */
  encryptionStatus?: 'encrypting' | 'encrypted' | 'none';

  /** Whether to allow folder uploads (recursive structure preservation). @default false */
  allowFolderUpload?: boolean;

  /**
   * File size warning threshold in bytes. Files above this size show a warning.
   * @default 1610612736 (1.5 GB)
   */
  warnSizeThreshold?: number;

  /**
   * Maximum block size in bytes. Files above this are rejected on web.
   * @default 2147483648 (2 GB)
   */
  blockSizeThreshold?: number;
}
