/**
 * @module FileCard
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link FileCard} component.
 */
export interface FileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The file name to display. */
  name: string;

  /** File size in bytes. */
  size: number;

  /** MIME type of the file (used to determine icon). */
  mimeType: string;

  /** Optional thumbnail image URL for preview. */
  thumbnail?: string;

  /** Number of times the file has been downloaded. */
  downloadCount?: number;

  /** Name of the user who uploaded the file. */
  uploadedBy?: string;

  /** ISO date string of when the file was uploaded. */
  uploadedAt?: string;

  /** Version number of the file. */
  version?: number;

  /** Callback fired when the card is clicked. */
  onClick?: () => void;

  /** Callback fired when the download button is clicked. */
  onDownload?: () => void;

  /**
   * Whether the card is in a selected state.
   * @default false
   */
  selected?: boolean;

  /**
   * When `true`, renders skeleton placeholders.
   * @default false
   */
  skeleton?: boolean;

  // ---- Transfer / sync status (Section 6.2) ----

  /** Sync status of the file. */
  syncStatus?: 'synced' | 'syncing' | 'downloading' | 'error';

  /** Transfer progress from 0 to 100 (renders overlay bar on thumbnail). */
  transferProgress?: number;

  /** Whether the file is end-to-end encrypted. Shows lock icon. @default false */
  encrypted?: boolean;

  /** Number of peers that have this file. */
  peerCount?: number;
}
