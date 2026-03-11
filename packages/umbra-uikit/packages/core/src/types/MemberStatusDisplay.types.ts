/**
 * @module MemberStatusDisplay
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available display sizes. */
export const memberStatusDisplaySizes = ['xs', 'sm', 'md'] as const;

/** Union of valid display size values. */
export type MemberStatusDisplaySize = (typeof memberStatusDisplaySizes)[number];

/** Font sizes for each display size. */
export interface MemberStatusDisplaySizeConfig {
  /** Font size in pixels. */
  fontSize: number;
  /** Line height multiplier. */
  lineHeight: number;
  /** Emoji size in pixels. */
  emojiSize: number;
  /** Gap between emoji and text. */
  gap: number;
}

/** Maps each size to its config. */
export const memberStatusDisplaySizeMap: Record<MemberStatusDisplaySize, MemberStatusDisplaySizeConfig> = {
  xs: { fontSize: 11, lineHeight: 1.33, emojiSize: 12, gap: 3 },
  sm: { fontSize: 12, lineHeight: 1.38, emojiSize: 14, gap: 4 },
  md: { fontSize: 13, lineHeight: 1.43, emojiSize: 16, gap: 5 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link MemberStatusDisplay} component.
 *
 * @remarks
 * An inline display of a member's custom status (emoji + text).
 */
export interface MemberStatusDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Status text to display.
   */
  text?: string;

  /**
   * Emoji to display before the text.
   */
  emoji?: string;

  /**
   * Size of the display.
   * @default 'sm'
   */
  size?: MemberStatusDisplaySize;

  /**
   * When true, truncates text with ellipsis.
   * @default true
   */
  truncate?: boolean;

  /**
   * Maximum width in pixels for truncation.
   * @default 200
   */
  maxWidth?: number;
}
