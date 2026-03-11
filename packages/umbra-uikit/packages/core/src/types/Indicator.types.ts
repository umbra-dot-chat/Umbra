/**
 * @module Indicator
 */
import type React from 'react';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available indicator color variants. */
export const indicatorVariants = ['neutral', 'success', 'warning', 'danger', 'info'] as const;

/** Union of valid indicator variant values. */
export type IndicatorVariant = (typeof indicatorVariants)[number];

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

/** Available indicator animation states. */
export const indicatorStates = ['idle', 'active', 'inactive'] as const;

/** Union of valid indicator state values. */
export type IndicatorState = (typeof indicatorStates)[number];

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available indicator sizes. */
export const indicatorSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid indicator size values. */
export type IndicatorSize = (typeof indicatorSizes)[number];

/** Pixel dimensions for each indicator size. */
export interface IndicatorSizeConfig {
  /** Dot diameter in pixels. */
  dotSize: number;
  /** Border width for inactive (hollow) state. */
  borderWidth: number;
}

/** Maps each size to its dimensional config. */
export const indicatorSizeMap: Record<IndicatorSize, IndicatorSizeConfig> = {
  sm: { dotSize: 8, borderWidth: 2 },
  md: { dotSize: 12, borderWidth: 2 },
  lg: { dotSize: 16, borderWidth: 2 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Indicator} component.
 */
export interface IndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Semantic color variant.
   * @default 'success'
   */
  variant?: IndicatorVariant;

  /**
   * Animation state:
   * - `idle` — static dot
   * - `active` — pulsing animation
   * - `inactive` — hollow ring (outline only)
   * @default 'idle'
   */
  state?: IndicatorState;

  /**
   * Size of the indicator dot.
   * @default 'sm'
   */
  size?: IndicatorSize;

  /**
   * Accessible label for screen readers. Renders as `sr-only` text.
   */
  label?: string;
}
