/**
 * @module Rating
 * @description Type definitions for the Rating primitive.
 */
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size tokens
// ---------------------------------------------------------------------------

/**
 * Ordered tuple of valid rating size tokens.
 *
 * @remarks
 * Three steps (`sm`, `md`, `lg`) cover typical UI needs for star ratings.
 */
export const ratingSizes = ['sm', 'md', 'lg'] as const;

/**
 * Union of valid rating size token strings.
 *
 * @remarks
 * Derived from the {@link ratingSizes} tuple.
 */
export type RatingSize = (typeof ratingSizes)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension configuration for a single rating size tier.
 *
 * @remarks
 * Each property maps directly to a CSS measurement used by the star SVGs
 * and accompanying value typography.
 */
export interface RatingSizeConfig {
  /** Width and height (px) of each star SVG. */
  starSize: number;
  /** Gap (px) between adjacent stars. */
  gap: number;
  /** Font size (px) for the optional numeric value label. */
  fontSize: number;
}

/**
 * Maps each {@link RatingSize} to its corresponding {@link RatingSizeConfig}.
 *
 * @remarks
 * Used internally by {@link Rating} to derive pixel dimensions for the
 * star icons and value label at every size tier.
 */
export const ratingSizeMap: Record<RatingSize, RatingSizeConfig> = {
  sm: { starSize: 16, gap: defaultSpacing['2xs'], fontSize: defaultTypography.sizes.xs.fontSize },
  md: { starSize: 20, gap: defaultSpacing.xs, fontSize: defaultTypography.sizes.sm.fontSize },
  lg: { starSize: 28, gap: defaultSpacing.xs, fontSize: defaultTypography.sizes.base.fontSize },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link Rating} component.
 *
 * @remarks
 * Extends native `HTMLDivElement` attributes (minus `onChange` which is
 * re-typed for numeric semantics). Supports controlled (`value` + `onChange`)
 * and uncontrolled (`defaultValue`) usage patterns.
 */
export interface RatingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Current rating value (0 to `max`). Pass this for controlled mode.
   */
  value?: number;

  /**
   * Initial value used when operating in uncontrolled mode.
   *
   * @default 0
   */
  defaultValue?: number;

  /**
   * Maximum number of stars.
   *
   * @default 5
   */
  max?: number;

  /**
   * Allow half-star precision. When `true`, clicking the left half of a star
   * selects a half-step value (e.g. 2.5).
   *
   * @default false
   */
  allowHalf?: boolean;

  /**
   * Callback invoked with the new rating value when a star is clicked.
   */
  onChange?: (value: number) => void;

  /**
   * Size tier controlling star dimensions, gap, and value label font size.
   *
   * @default 'md'
   */
  size?: RatingSize;

  /**
   * Read-only display mode. Stars reflect the current value but cannot be
   * changed via interaction.
   *
   * @default false
   */
  readOnly?: boolean;

  /**
   * Disabled state. Reduces opacity and prevents interaction.
   *
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true`, the current numeric value is displayed as a label
   * beside the stars.
   *
   * @default false
   */
  showValue?: boolean;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of the
   * interactive rating stars.
   *
   * @default false
   */
  skeleton?: boolean;
}
