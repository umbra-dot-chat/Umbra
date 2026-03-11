import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import type { Thickness } from '../tokens/shared';

/**
 * Tuple of valid progress-bar size literals, re-exported from the shared
 * {@link ComponentSize} token.
 */
export { componentSizes as progressSizes } from '../tokens/shared';

/**
 * Union of accepted progress-bar size values (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`).
 */
export type { ComponentSize as ProgressSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Resolved dimension values for a single {@link ProgressSize}.
 *
 * @remarks
 * Consumed by the style builders in `Progress.styles.ts` to derive track
 * height, border-radius, and typographic sizes.
 */
export interface ProgressSizeConfig {
  /** Track height in pixels. */
  height: number;
  /** Border radius for the track and fill, in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Font size for the label text above the bar. */
  labelFontSize: number;
  /** Font size for the value text above the bar. */
  valueFontSize: number;
}

/**
 * Maps each {@link ComponentSize} to its {@link ProgressSizeConfig}.
 *
 * @remarks
 * Provides pre-defined dimension tokens for all five progress sizes.
 */
export const progressSizeMap: Record<ComponentSize, ProgressSizeConfig> = {
  xs: { height: 4, borderRadius: 'sm', labelFontSize: 12, valueFontSize: 12 },
  sm: { height: 6, borderRadius: 'sm', labelFontSize: 13, valueFontSize: 13 },
  md: { height: 8, borderRadius: 'sm', labelFontSize: 14, valueFontSize: 14 },
  lg: { height: 10, borderRadius: 'sm', labelFontSize: 15, valueFontSize: 15 },
  xl: { height: 12, borderRadius: 'md', labelFontSize: 16, valueFontSize: 16 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Progress} component.
 *
 * @remarks
 * Extends standard `HTMLDivElement` attributes (minus `children`) so that
 * any valid HTML `div` prop can be forwarded to the root element.
 */
export interface ProgressProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Current progress value (clamped between `0` and {@link ProgressProps.max | max}).
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
   * Progress bar size.
   *
   * @default 'md'
   */
  size?: ComponentSize;

  /** Label text rendered above the bar on the left side. */
  label?: string;

  /**
   * Whether to display the formatted percentage value above the bar.
   *
   * @default false
   */
  showValue?: boolean;

  /**
   * Custom value formatter used when {@link ProgressProps.showValue | showValue} is `true`.
   *
   * @param value - The clamped current value.
   * @param max - The maximum value.
   * @returns A formatted string to display (e.g. `"75%"`).
   */
  formatValue?: (value: number, max: number) => string;

  /**
   * Semantic color variant for the filled portion of the bar.
   *
   * @default 'default'
   */
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';

  /**
   * When `true`, renders a continuously sliding animation instead of a
   * fixed-width fill. Useful when the total duration is unknown.
   *
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Override the bar thickness (height) using the shared {@link Thickness}
   * token. When provided this takes precedence over the size-based default.
   */
  thickness?: Thickness;

  /**
   * When `true`, renders a skeleton placeholder bar instead of the
   * interactive progress bar. Useful for loading layouts.
   *
   * @default false
   */
  skeleton?: boolean;
}
