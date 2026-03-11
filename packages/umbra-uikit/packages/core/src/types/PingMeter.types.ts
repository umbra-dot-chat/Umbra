/**
 * @module PingMeter
 */
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available ping meter size tokens. */
export const pingMeterSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid ping meter size values derived from {@link pingMeterSizes}. */
export type PingMeterSize = (typeof pingMeterSizes)[number];

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available ping meter display variant tokens. */
export const pingMeterVariants = ['dot', 'bars', 'full'] as const;

/** Union of valid ping meter variant values derived from {@link pingMeterVariants}. */
export type PingMeterVariant = (typeof pingMeterVariants)[number];

// ---------------------------------------------------------------------------
// Quality
// ---------------------------------------------------------------------------

/** Connection quality level derived from latency. */
export type PingQuality = 'excellent' | 'good' | 'fair' | 'poor';

// ---------------------------------------------------------------------------
// Size → dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimensional configuration for a single ping meter size.
 *
 * @remarks
 * Each property maps to a CSS value used by the style builders in
 * `PingMeter.styles.ts`.
 */
export interface PingMeterSizeConfig {
  /** Diameter of the ping dot indicator in pixels. */
  dotSize: number;
  /** Width of each signal bar in pixels. */
  barWidth: number;
  /** Maximum height of the tallest signal bar in pixels. */
  barHeight: number;
  /** Horizontal gap between signal bars in pixels. */
  barGap: number;
  /** Font size for the latency text in pixels. */
  fontSize: number;
  /** Gap between major sections (dot, bars, text) in pixels. */
  gap: number;
}

/**
 * Lookup from {@link PingMeterSize} to its {@link PingMeterSizeConfig} dimensions.
 *
 * @remarks
 * Pre-defined for `sm`, `md`, and `lg`.
 */
export const pingMeterSizeMap: Record<PingMeterSize, PingMeterSizeConfig> = {
  sm: { dotSize: 6, barWidth: 3, barHeight: 12, barGap: 2, fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.sm },
  md: { dotSize: 8, barWidth: 4, barHeight: 16, barGap: 2, fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.sm },
  lg: { dotSize: 10, barWidth: 5, barHeight: 20, barGap: 3, fontSize: defaultTypography.sizes.sm.fontSize, gap: defaultSpacing.md },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link PingMeter} component.
 *
 * @remarks
 * Extends the native `<div>` element attributes so any valid HTML div
 * prop (e.g. `aria-*`, `data-*`, `onClick`) can be forwarded.
 */
export interface PingMeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Network latency in milliseconds. */
  latency: number;

  /**
   * Controls the overall dimensions of the ping meter.
   * @default 'md'
   */
  size?: PingMeterSize;

  /**
   * When `true`, displays the latency value as text (e.g. "75ms").
   * @default true
   */
  showLatency?: boolean;

  /**
   * When `true`, displays signal strength bars.
   * @default true
   */
  showBars?: boolean;

  /**
   * When `true`, displays the animated ping dot indicator.
   * @default true
   */
  showDot?: boolean;

  /**
   * Display variant controlling which elements are visible.
   *
   * - `'dot'` -- animated ping dot only.
   * - `'bars'` -- signal strength bars only.
   * - `'full'` -- dot + bars + latency text.
   *
   * @default 'full'
   */
  variant?: PingMeterVariant;

  /**
   * Maximum latency value (in ms) used for scaling calculations.
   * @default 500
   */
  maxLatency?: number;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
