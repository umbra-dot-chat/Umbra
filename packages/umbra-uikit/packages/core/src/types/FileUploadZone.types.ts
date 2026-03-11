/**
 * @module FileUploadZone
 * @description Type definitions for the FileUploadZone component —
 * a drag-and-drop file upload area with progress indicator.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FileUploadZone component.
 */
export interface FileUploadZoneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Called when files are dropped onto the zone. */
  onFileDrop?: (files: File[]) => void;
  /** Called when files are selected via the file picker. */
  onFileSelect?: (files: File[]) => void;
  /** Whether a file is currently being uploaded. @default false */
  uploading?: boolean;
  /** Upload progress (0–100). */
  uploadProgress?: number;
  /** Name of the file currently being uploaded. */
  currentFileName?: string;
  /** MIME type filter for file picker. */
  accept?: string;
  /** Maximum file size in bytes. */
  maxSize?: number;
  /** Children wrapped by the drop zone. */
  children: React.ReactNode;
  /** Whether the upload zone is disabled. @default false */
  disabled?: boolean;
}
