/**
 * @module OnlineStatusIndicator
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

/** Available online presence statuses. */
export const onlineStatuses = ['online', 'idle', 'dnd', 'offline', 'invisible'] as const;

/** Union of valid online status values. */
export type OnlineStatus = (typeof onlineStatuses)[number];

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available indicator sizes. */
export const onlineStatusIndicatorSizes = ['xs', 'sm', 'md', 'lg'] as const;

/** Union of valid indicator size values. */
export type OnlineStatusIndicatorSize = (typeof onlineStatusIndicatorSizes)[number];

/** Pixel dimensions for each indicator size. */
export interface OnlineStatusIndicatorSizeConfig {
  /** Dot diameter in pixels. */
  dotSize: number;
  /** Font size for the optional label. */
  fontSize: number;
  /** Gap between dot and label. */
  gap: number;
}

/** Maps each size to its dimensional config. */
export const onlineStatusIndicatorSizeMap: Record<OnlineStatusIndicatorSize, OnlineStatusIndicatorSizeConfig> = {
  xs: { dotSize: 6, fontSize: 10, gap: 4 },
  sm: { dotSize: 8, fontSize: 12, gap: 6 },
  md: { dotSize: 10, fontSize: 13, gap: 6 },
  lg: { dotSize: 14, fontSize: 14, gap: 8 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link OnlineStatusIndicator} component.
 *
 * @remarks
 * A standalone indicator dot for online/offline/idle/dnd status.
 */
export interface OnlineStatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The online presence status to display.
   */
  status: OnlineStatus;

  /**
   * Size of the indicator.
   * @default 'sm'
   */
  size?: OnlineStatusIndicatorSize;

  /**
   * When true, shows a text label next to the dot.
   * @default false
   */
  showLabel?: boolean;

  /**
   * When true, adds a pulse animation for the online status.
   * @default false
   */
  pulse?: boolean;
}
