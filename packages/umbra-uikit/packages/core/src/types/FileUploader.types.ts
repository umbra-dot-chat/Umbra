/**
 * @module FileUploader
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link FileUploader} component.
 */
export interface FileUploaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Accepted file types (e.g. "image/*", ".pdf,.doc").
   */
  accept?: string;

  /**
   * Allow multiple file selection.
   * @default false
   */
  multiple?: boolean;

  /**
   * Maximum file size in bytes. Files exceeding this are rejected.
   */
  maxSize?: number;

  /**
   * Maximum number of files (when multiple is true).
   */
  maxFiles?: number;

  /** Callback fired when files are selected or dropped. */
  onChange?: (files: File[]) => void;

  /** Callback fired when a file is rejected (too large, wrong type). */
  onReject?: (file: File, reason: string) => void;

  /**
   * When `true`, the component is non-interactive.
   * @default false
   */
  disabled?: boolean;

  /** Custom title text for the dropzone. */
  title?: string;

  /** Custom description text for the dropzone. */
  description?: string;

  /** Optional icon component displayed in the dropzone. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
}
