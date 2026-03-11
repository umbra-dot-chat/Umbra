/**
 * @module FolderCard
 * @description Type definitions for the FolderCard component —
 * a card for displaying folders in a file channel grid/list view.
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link FolderCard} component.
 */
export interface FolderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The folder name to display. */
  name: string;

  /** Number of files inside this folder. */
  fileCount?: number;

  /** Callback fired when the card is clicked. */
  onClick?: () => void;

  /** Callback fired when the card is double-clicked (navigate into folder). */
  onDoubleClick?: () => void;

  /** Callback fired on right-click / context menu. */
  onContextMenu?: (event: React.MouseEvent) => void;

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

  /**
   * Whether this folder can accept drop targets (visual indicator).
   * @default false
   */
  dropTarget?: boolean;

  /** Name of the user who created the folder. */
  createdBy?: string;

  /** ISO date string of when the folder was created. */
  createdAt?: string;
}
