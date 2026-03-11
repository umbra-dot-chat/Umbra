import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Meter Size
// ---------------------------------------------------------------------------

/**
 * Tuple of valid meter size literals.
 */
export const meterSizes = ['sm', 'md', 'lg'] as const;

/**
 * Union of accepted meter size values (`'sm' | 'md' | 'lg'`).
 */
export type MeterSize = (typeof meterSizes)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Resolved dimension values for a single {@link MeterSize}.
 *
 * @remarks
 * Consumed by the style builders in `Meter.styles.ts` to derive track
 * height, border-radius, typographic sizes, and spacing.
 */
export interface MeterSizeConfig {
  /** Track height in pixels. */
  height: number;
  /** Border radius for the track and fill, in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Font size for the label and value text. */
  fontSize: number;
  /** Gap between the label row and the track, in pixels. */
  gap: number;
}

/**
 * Maps each {@link MeterSize} to its {@link MeterSizeConfig}.
 *
 * @remarks
 * Provides pre-defined dimension tokens for all three meter sizes.
 */
export const meterSizeMap: Record<MeterSize, MeterSizeConfig> = {
  sm: { height: 6, borderRadius: 'sm', fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.sm },
  md: { height: 8, borderRadius: 'sm', fontSize: defaultTypography.sizes.sm.fontSize, gap: defaultSpacing.sm },
  lg: { height: 12, borderRadius: 'md', fontSize: defaultTypography.sizes.sm.fontSize, gap: defaultSpacing.md } };

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

/**
 * Tuple of valid meter variant literals.
 */
export const meterVariants = ['default', 'gradient', 'segments'] as const;

/**
 * Union of accepted meter variant values.
 *
 * @remarks
 * - `'default'` -- Solid accent fill colour.
 * - `'gradient'` -- Left-to-right gradient fill.
 * - `'segments'` -- Semantic green/yellow/red colouring based on
 *   {@link MeterProps.optimum | optimum}, {@link MeterProps.low | low},
 *   and {@link MeterProps.high | high} thresholds.
 */
export type MeterVariant = (typeof meterVariants)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Meter} component.
 *
 * @remarks
 * Extends standard `HTMLDivElement` attributes (minus `children`) so that
 * any valid HTML `div` prop can be forwarded to the root element.
 */
export interface MeterProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Current meter value (clamped between {@link MeterProps.min | min}
   * and {@link MeterProps.max | max}).
   */
  value: number;

  /**
   * Minimum value for the meter range.
   *
   * @default 0
   */
  min?: number;

  /**
   * Maximum value for the meter range.
   *
   * @default 100
   */
  max?: number;

  /**
   * Meter track and typography size.
   *
   * @default 'md'
   */
  size?: MeterSize;

  /** Label text rendered to the left of the value display. */
  label?: string;

  /**
   * Whether to display the current percentage value.
   *
   * @default false
   */
  showValue?: boolean;

  /**
   * Visual variant controlling the fill appearance.
   *
   * @default 'default'
   */
  variant?: MeterVariant;

  /**
   * Number of visual color segments when using the `'segments'` variant.
   *
   * @remarks
   * This value is used for display hinting but the actual fill colour is
   * derived from the {@link MeterProps.optimum | optimum},
   * {@link MeterProps.low | low}, and {@link MeterProps.high | high}
   * threshold props.
   *
   * @default 3
   */
  segments?: number;

  /**
   * The optimal (ideal) value within the meter range.
   *
   * @remarks
   * Used by the `'segments'` variant to determine semantic fill colour.
   * When the current value is near `optimum`, the fill is green. When it
   * falls between {@link MeterProps.low | low} and
   * {@link MeterProps.high | high}, the fill is yellow. Otherwise red.
   *
   * @default 50
   */
  optimum?: number;

  /**
   * Low threshold value for semantic colouring in the `'segments'` variant.
   *
   * @remarks
   * Values at or below this threshold are considered "low" and may render
   * as red or yellow depending on where {@link MeterProps.optimum | optimum}
   * falls.
   *
   * @default 25
   */
  low?: number;

  /**
   * High threshold value for semantic colouring in the `'segments'` variant.
   *
   * @remarks
   * Values at or above this threshold are considered "high" and may render
   * as red or yellow depending on where {@link MeterProps.optimum | optimum}
   * falls.
   *
   * @default 75
   */
  high?: number;

  /**
   * When `true`, renders a skeleton placeholder instead of the
   * interactive meter. Useful for loading layouts.
   *
   * @default false
   */
  skeleton?: boolean;

  /**
   * When `true`, the meter is visually dimmed to indicate a disabled state.
   *
   * @default false
   */
  disabled?: boolean;
}
