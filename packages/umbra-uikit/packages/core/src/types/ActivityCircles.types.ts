import type React from 'react';
import type { Thickness } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/**
 * Tuple of valid activity-circles size literals.
 *
 * @remarks
 * Controls the overall diameter, stroke width, gap between rings,
 * and legend font size.
 */
export const activityCirclesSizes = ['sm', 'md', 'lg', 'xl'] as const;

/** Union type derived from {@link activityCirclesSizes}. */
export type ActivityCirclesSize = (typeof activityCirclesSizes)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Resolved dimension values for a single {@link ActivityCirclesSize}.
 */
export interface ActivityCirclesSizeConfig {
  /** Overall width/height of the SVG in pixels. */
  diameter: number;
  /** Stroke width for each ring in pixels. */
  strokeWidth: number;
  /** Gap between concentric rings in pixels. */
  gap: number;
  /** Font size for legend labels in pixels. */
  fontSize: number;
}

/**
 * Maps each {@link ActivityCirclesSize} to its {@link ActivityCirclesSizeConfig}.
 */
export const activityCirclesSizeMap: Record<ActivityCirclesSize, ActivityCirclesSizeConfig> = {
  sm: { diameter: 64, strokeWidth: 6, gap: defaultSpacing.xs, fontSize: defaultTypography.sizes['2xs'].fontSize },
  md: { diameter: 120, strokeWidth: 10, gap: defaultSpacing.xs, fontSize: defaultTypography.sizes.xs.fontSize },
  lg: { diameter: 180, strokeWidth: 14, gap: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize },
  xl: { diameter: 240, strokeWidth: 18, gap: defaultSpacing.sm, fontSize: defaultTypography.sizes.lg.fontSize },
};

// ---------------------------------------------------------------------------
// Ring definition
// ---------------------------------------------------------------------------

/**
 * Describes a single ring in the {@link ActivityCircles} component.
 */
export interface ActivityCirclesRing {
  /** Current progress value. */
  value: number;
  /** Maximum value representing a full ring (default: 100). */
  max: number;
  /**
   * Override colour for this ring.
   * When omitted the component picks from the `theme.data` palette
   * based on ring index.
   */
  color?: string;
  /** Optional label displayed in the legend. */
  label?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ActivityCircles} component.
 *
 * @remarks
 * Renders Apple-Watch-style concentric progress rings. Each ring
 * represents a separate metric (e.g. Move, Exercise, Stand).
 *
 * - Up to 5 rings supported (outer → inner).
 * - Default colours sourced from the `theme.data` palette.
 * - Rounded stroke caps for a polished look.
 * - Optional legend, center content, and mount animation.
 */
export interface ActivityCirclesProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Array of ring definitions, rendered from outermost to innermost.
   * A maximum of 5 rings is supported.
   */
  rings: ActivityCirclesRing[];

  /**
   * Size variant controlling diameter, stroke width, and gap.
   *
   * @default 'md'
   */
  size?: ActivityCirclesSize;

  /**
   * Override the stroke thickness using the shared {@link Thickness} token.
   * When provided this takes precedence over the size-based default.
   */
  thickness?: Thickness;

  /**
   * Whether to display a colour-coded legend below the rings.
   *
   * @default false
   */
  showLabels?: boolean;

  /**
   * Whether to animate the rings on mount.
   *
   * @default false
   */
  animated?: boolean;

  /**
   * Arbitrary content rendered in the centre of the rings.
   */
  children?: React.ReactNode;
}
