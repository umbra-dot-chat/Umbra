/**
 * @module types/StickerManagementPanel
 * @description Type definitions for the StickerManagementPanel component.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Sticker & Pack
// ---------------------------------------------------------------------------

/** Represents a single sticker image. */
export interface Sticker {
  /** Unique identifier. */
  id: string;

  /** Display name for the sticker. */
  name: string;

  /** URL of the sticker image. */
  imageUrl: string;

  /**
   * Whether the sticker is animated (e.g. GIF/APNG).
   * @default false
   */
  animated?: boolean;
}

/** Represents a collection of stickers grouped into a pack. */
export interface StickerPack {
  /** Unique identifier. */
  id: string;

  /** Display name for the pack. */
  name: string;

  /** Stickers belonging to this pack. */
  stickers: Sticker[];
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link StickerManagementPanel} component.
 *
 * @remarks
 * Admin panel for managing sticker packs, including creating/deleting
 * packs and uploading/deleting individual stickers.
 */
export interface StickerManagementPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Array of sticker packs. */
  packs: StickerPack[];

  /** Callback fired when a new pack is created. */
  onCreatePack?: (name: string) => void;

  /** Callback fired when a pack is deleted. */
  onDeletePack?: (packId: string) => void;

  /** Callback fired when a sticker is uploaded to a pack. */
  onUploadSticker?: (packId: string, file: File, name: string) => void;

  /** Callback fired when a sticker is deleted from a pack. */
  onDeleteSticker?: (packId: string, stickerId: string) => void;

  /** Optional title override for the panel header. */
  title?: string;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
