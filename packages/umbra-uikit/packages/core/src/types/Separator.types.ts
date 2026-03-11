/**
 * Type definitions for the Wisp Separator divider primitive.
 *
 * @remarks
 * Defines orientation, variant, spacing, and thickness options used by
 * the {@link Separator} component to render horizontal or vertical dividers.
 *
 * @module primitives/separator
 */

import type React from 'react';
import type { Thickness } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Separator Orientation
// ---------------------------------------------------------------------------

/** Available orientation values for the Separator. */
export const separatorOrientations = ['horizontal', 'vertical'] as const;

/** Union of valid Separator orientation values. */
export type SeparatorOrientation = (typeof separatorOrientations)[number];

// ---------------------------------------------------------------------------
// Separator Variants
// ---------------------------------------------------------------------------

/** Available color variants for the Separator line. */
export const separatorVariants = ['subtle', 'strong'] as const;

/** Union of valid Separator color variant names. */
export type SeparatorVariant = (typeof separatorVariants)[number];

// ---------------------------------------------------------------------------
// Separator Spacing
// ---------------------------------------------------------------------------

/** Available spacing presets for margin around the Separator. */
export const separatorSpacings = ['none', 'sm', 'md', 'lg'] as const;

/** Union of valid Separator spacing preset names. */
export type SeparatorSpacing = (typeof separatorSpacings)[number];

// ---------------------------------------------------------------------------
// Spacing -> px map
// ---------------------------------------------------------------------------

/**
 * Maps each {@link SeparatorSpacing} preset to its pixel value.
 */
export const separatorSpacingMap: Record<SeparatorSpacing, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Separator} component.
 *
 * @remarks
 * Extends standard `HTMLDivElement` attributes. All visual
 * properties have sensible defaults so a bare `<Separator />`
 * renders a horizontal, subtle, medium-spaced 1 px line.
 */
export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation of the separator line. @default 'horizontal' */
  orientation?: SeparatorOrientation;
  /** Visual weight of the separator line. @default 'subtle' */
  variant?: SeparatorVariant;
  /** Optional label displayed centered in the separator line. */
  label?: React.ReactNode;
  /** Spacing around the separator. @default 'md' */
  spacing?: SeparatorSpacing;
  /** Additional CSS class name. */
  className?: string;
  /** Override the line thickness. @default 1 (px) */
  thickness?: Thickness;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}
