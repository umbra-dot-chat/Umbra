/**
 * @module types/EmojiManagementPanel
 * @description Type definitions for the EmojiManagementPanel component.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Custom Emoji
// ---------------------------------------------------------------------------

/** Represents a single custom community emoji. */
export interface CustomEmoji {
  /** Unique identifier. */
  id: string;

  /** Display name (used as shortcode, e.g. :wave:). */
  name: string;

  /** URL of the emoji image. */
  imageUrl: string;

  /**
   * Whether the emoji is animated (e.g. GIF/APNG).
   * @default false
   */
  animated?: boolean;

  /** Username or ID of the uploader. */
  uploadedBy: string;

  /** ISO date string of when the emoji was uploaded. */
  uploadedAt: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link EmojiManagementPanel} component.
 *
 * @remarks
 * Admin panel for managing custom community emoji, including upload,
 * rename, and delete operations.
 */
export interface EmojiManagementPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Array of custom emoji in the community. */
  emojis: CustomEmoji[];

  /** Callback fired when a new emoji file is uploaded with a name. */
  onUpload?: (file: File, name: string) => void;

  /** Callback fired when an emoji is deleted. */
  onDelete?: (emojiId: string) => void;

  /** Callback fired when an emoji is renamed. */
  onRename?: (emojiId: string, name: string) => void;

  /**
   * When `true`, the upload section shows a loading state.
   * @default false
   */
  uploading?: boolean;

  /**
   * Maximum number of custom emoji allowed.
   * @default 50
   */
  maxEmojis?: number;

  /** Optional title override for the panel header. */
  title?: string;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
