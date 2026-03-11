/**
 * @module types/AttachmentPreview
 * @description Type definitions for the AttachmentPreview component —
 * queued file preview cards displayed above the message input area.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** File type category for icon/preview selection. */
export type AttachmentFileType = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other';

/** A single queued attachment. */
export interface Attachment {
  /** Unique identifier. */
  id: string;
  /** Original file name. */
  fileName: string;
  /** File size in bytes. */
  fileSize: number;
  /** File type category. */
  fileType: AttachmentFileType;
  /** Optional thumbnail URL (for images/videos). */
  thumbnailUrl?: string;
  /** Upload progress (0-100). If undefined, upload hasn't started. */
  progress?: number;
  /** Whether the upload failed. */
  error?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the AttachmentPreview component.
 *
 * @remarks
 * Renders a horizontal scrollable row of file preview cards above the
 * message input. Each card shows a thumbnail (for images) or file icon,
 * file name, size, and a remove button.
 */
export interface AttachmentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of queued attachments. */
  attachments: Attachment[];

  /** Called when the remove button is clicked on an attachment. */
  onRemove?: (id: string) => void;

  /** Called when an attachment card is clicked (e.g. to preview). */
  onPreview?: (attachment: Attachment) => void;

  /** Whether all attachments are disabled (e.g. while sending). @default false */
  disabled?: boolean;
}
