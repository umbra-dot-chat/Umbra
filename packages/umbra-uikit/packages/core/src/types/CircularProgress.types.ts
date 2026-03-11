import type React from 'react';
import type { Thickness } from '../tokens/shared';
import { defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/**
 * Tuple of valid circular-progress size literals (`'sm' | 'md' | 'lg' | 'xl'`).
 *
 * @remarks
 * Unlike the linear {@link Progress} which uses the full five-value
 * `ComponentSize` token, the circular variant omits `xs` for visual clarity.
 */
export const circularProgressSizes = ['sm', 'md', 'lg', 'xl'] as const;

/** Union type derived from {@link circularProgressSizes}. */
export type CircularProgressSize = (typeof circularProgressSizes)[number];

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

/**
 * Tuple of supported ring variants.
 *
 * @remarks
 * - `'full'` -- 360-degree donut ring.
 * - `'half'` -- 180-degree gauge arc (speedometer style).
 */
export const circularProgressVariants = ['full', 'half'] as const;

/** Union type derived from {@link circularProgressVariants}. */
export type CircularProgressVariant = (typeof circularProgressVariants)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Resolved dimension values for a single {@link CircularProgressSize}.
 *
 * @remarks
 * Consumed by the style builders in `CircularProgress.styles.ts` to derive
 * SVG dimensions, stroke width, and center-label font size.
 */
export interface CircularProgressSizeConfig {
  /** Overall width/height of the SVG in pixels. */
  size: number;
  /** Stroke width for the track and progress arcs. */
  strokeWidth: number;
  /** Font size for the center value label in pixels. */
  fontSize: number;
}

/**
 * Maps each {@link CircularProgressSize} to its {@link CircularProgressSizeConfig}.
 *
 * @remarks
 * Provides pre-defined dimension tokens for all four circular-progress sizes.
 */
export const circularProgressSizeMap: Record<CircularProgressSize, CircularProgressSizeConfig> = {
  sm: { size: 32, strokeWidth: 3, fontSize: defaultTypography.sizes['2xs'].fontSize },
  md: { size: 48, strokeWidth: 4, fontSize: defaultTypography.sizes.xs.fontSize },
  lg: { size: 64, strokeWidth: 5, fontSize: defaultTypography.sizes.sm.fontSize },
  xl: { size: 96, strokeWidth: 6, fontSize: defaultTypography.sizes.lg.fontSize },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link CircularProgress} component.
 *
 * @remarks
 * Extends standard `HTMLDivElement` attributes (minus `children`, which is
 * re-declared as `React.ReactNode` for the center content slot) so that any
 * valid HTML `div` prop can be forwarded to the root element.
 */
export interface CircularProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Current progress value (clamped between `0` and {@link CircularProgressProps.max | max}).
   *
   * @default 0
   */
  value?: number;

  /**
   * Maximum value that represents 100% completion.
   *
   * @default 100
   */
  max?: number;

  /**
   * Size variant controlling ring diameter and stroke width.
   *
   * @default 'md'
   */
  size?: CircularProgressSize;

  /**
   * Ring shape variant.
   *
   * - `'full'` -- 360-degree donut ring.
   * - `'half'` -- 180-degree gauge arc.
   *
   * @default 'full'
   */
  variant?: CircularProgressVariant;

  /**
   * Whether to display the formatted percentage value inside the ring.
   *
   * @default false
   */
  showValue?: boolean;

  /**
   * Custom value formatter used when {@link CircularProgressProps.showValue | showValue} is `true`.
   *
   * @param value - The clamped current value.
   * @param max - The maximum value.
   * @returns A formatted string to display (e.g. `"75%"`).
   */
  formatValue?: (value: number, max: number) => string;

  /**
   * Semantic colour variant for the progress arc.
   *
   * @default 'default'
   */
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';

  /**
   * When `true`, the full-circle variant renders a continuously spinning
   * indicator arc instead of a fixed stroke offset.
   *
   * @default false
   */
  indeterminate?: boolean;

  /** Optional label text rendered below the ring. */
  label?: string;

  /**
   * Override the stroke thickness using the shared {@link Thickness} token.
   * When provided this takes precedence over the size-based default.
   */
  thickness?: Thickness;

  /**
   * Arbitrary content rendered in the center of the ring.
   *
   * @remarks
   * When provided, this takes precedence over the auto-generated value
   * label that {@link CircularProgressProps.showValue | showValue} would render.
   */
  children?: React.ReactNode;
}
