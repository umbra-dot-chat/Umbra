import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing } from '../theme/create-theme';

/**
 * Tuple of valid spinner size literals, re-exported from the shared
 * {@link ComponentSize} token.
 */
export { componentSizes as spinnerSizes } from '../tokens/shared';

/**
 * Union of accepted spinner size values (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`).
 */
export type { ComponentSize as SpinnerSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Resolved dimension values for a single {@link SpinnerSize}.
 *
 * @remarks
 * Used internally by the style builders in `Spinner.styles.ts` to derive
 * pixel values for the SVG, stroke, label font, and layout gap.
 */
export interface SpinnerSizeConfig {
  /** Overall width/height of the spinner SVG in pixels. */
  size: number;
  /** Stroke width for the track and indicator circles. */
  strokeWidth: number;
  /** Font size for the optional label text. */
  labelFontSize: number;
  /** Gap between the spinner SVG and the label, in pixels. */
  gap: number;
}

/**
 * Maps each {@link ComponentSize} to its {@link SpinnerSizeConfig}.
 *
 * @remarks
 * Provides pre-defined dimension tokens for all five spinner sizes.
 */
export const spinnerSizeMap: Record<ComponentSize, SpinnerSizeConfig> = {
  xs: { size: 16, strokeWidth: 2, labelFontSize: 11, gap: defaultSpacing.sm },
  sm: { size: 20, strokeWidth: 2.5, labelFontSize: 12, gap: defaultSpacing.sm },
  md: { size: 28, strokeWidth: 3, labelFontSize: 13, gap: defaultSpacing.sm },
  lg: { size: 36, strokeWidth: 3, labelFontSize: 14, gap: defaultSpacing.md },
  xl: { size: 48, strokeWidth: 4, labelFontSize: 15, gap: defaultSpacing.md },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Spinner} component.
 *
 * @remarks
 * Extends the standard `HTMLDivElement` attributes so that any valid HTML
 * `div` prop (e.g. `id`, `className`, `data-*`) can be forwarded.
 */
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Spinner size.
   *
   * @default 'md'
   */
  size?: ComponentSize;

  /** Optional text label displayed beside the spinner. */
  label?: string;

  /** Override the indicator (spinning arc) color. */
  color?: string;

  /** Override the track (background circle) color. */
  trackColor?: string;
}
