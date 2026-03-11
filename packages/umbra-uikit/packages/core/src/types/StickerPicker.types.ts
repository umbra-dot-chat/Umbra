/**
 * @module types/StickerPicker
 * @description Type definitions for the StickerPicker component.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available sticker picker size tokens. */
export const stickerPickerSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid sticker picker size values. */
export type StickerPickerSize = (typeof stickerPickerSizes)[number];

// ---------------------------------------------------------------------------
// Sticker Picker Pack
// ---------------------------------------------------------------------------

/** Represents a sticker pack for the user-facing picker. */
export interface StickerPickerPack {
  /** Unique identifier. */
  id: string;

  /** Display name for the pack. */
  name: string;

  /** Optional icon URL shown in the pack tab. */
  iconUrl?: string;

  /** Stickers in this pack. */
  stickers: Array<{
    /** Unique identifier. */
    id: string;
    /** Display name. */
    name: string;
    /** URL of the sticker image. */
    imageUrl: string;
    /**
     * Whether the sticker is animated.
     * @default false
     */
    animated?: boolean;
  }>;
}

// ---------------------------------------------------------------------------
// Size Config
// ---------------------------------------------------------------------------

/** Dimensional configuration for a single sticker picker size. */
export interface StickerPickerSizeConfig {
  /** Width of the picker container. */
  width: number;
  /** Height of the picker container. */
  height: number;
  /** Sticker cell size in pixels. */
  cellSize: number;
  /** Number of columns in the grid. */
  columns: number;
  /** Gap between cells. */
  gap: number;
  /** Padding around content areas. */
  padding: number;
  /** Tab bar height. */
  tabHeight: number;
  /** Tab icon size. */
  tabIconSize: number;
}

/** Lookup from size to its dimensional config. */
export const stickerPickerSizeMap: Record<StickerPickerSize, StickerPickerSizeConfig> = {
  sm: { width: 280, height: 300, cellSize: 64, columns: 4, gap: 4, padding: 8, tabHeight: 36, tabIconSize: 20 },
  md: { width: 340, height: 360, cellSize: 80, columns: 4, gap: 6, padding: 10, tabHeight: 40, tabIconSize: 24 },
  lg: { width: 420, height: 440, cellSize: 96, columns: 4, gap: 8, padding: 12, tabHeight: 44, tabIconSize: 28 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link StickerPicker} component.
 *
 * @remarks
 * User-facing sticker selection picker with pack tabs and sticker grid.
 */
export interface StickerPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Array of sticker packs to display. */
  packs: StickerPickerPack[];

  /** Callback fired when a sticker is selected. */
  onSelect?: (stickerId: string, packId: string) => void;

  /**
   * Controls the overall dimensions of the picker.
   * @default 'md'
   */
  size?: StickerPickerSize;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
