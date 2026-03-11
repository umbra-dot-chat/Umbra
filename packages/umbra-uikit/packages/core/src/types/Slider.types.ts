import type React from 'react';
import type { ComponentSize, Thickness } from '../tokens/shared';

/**
 * Ordered tuple of valid slider sizes, re-exported from shared tokens.
 *
 * @remarks
 * Alias of {@link ComponentSize} values: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`.
 */
export { componentSizes as sliderSizes } from '../tokens/shared';

/** Union type representing the allowed slider size values. */
export type { ComponentSize as SliderSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension configuration for a single slider size tier.
 *
 * @remarks
 * Each property maps directly to a CSS measurement used by the track,
 * thumb, and accompanying label/value typography.
 */
export interface SliderSizeConfig {
  /** Height (px) of the track bar. */
  trackHeight: number;
  /** Diameter (px) of the draggable thumb circle. */
  thumbSize: number;
  /** Border radius (px) of the track bar ends. */
  trackRadius: number;
  /** Font size (px) for the label text above the track. */
  labelFontSize: number;
  /** Font size (px) for the current-value display above the track. */
  valueFontSize: number;
}

/**
 * Maps each {@link ComponentSize} to its corresponding {@link SliderSizeConfig}.
 *
 * @remarks
 * Used internally by {@link Slider} to derive pixel dimensions for the
 * track, thumb, and typography at every size tier.
 */
export const sliderSizeMap: Record<ComponentSize, SliderSizeConfig> = {
  xs: { trackHeight: 3, thumbSize: 14, trackRadius: 2, labelFontSize: 12, valueFontSize: 12 },
  sm: { trackHeight: 4, thumbSize: 16, trackRadius: 2, labelFontSize: 13, valueFontSize: 13 },
  md: { trackHeight: 5, thumbSize: 18, trackRadius: 3, labelFontSize: 14, valueFontSize: 14 },
  lg: { trackHeight: 6, thumbSize: 22, trackRadius: 3, labelFontSize: 15, valueFontSize: 15 },
  xl: { trackHeight: 8, thumbSize: 26, trackRadius: 4, labelFontSize: 16, valueFontSize: 16 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link Slider} component.
 *
 * @remarks
 * Extends native `HTMLDivElement` attributes (minus `onChange` and
 * `defaultValue` which are re-typed for numeric semantics).
 * Supports controlled (`value` + `onChange`) and uncontrolled (`defaultValue`)
 * usage patterns.
 */
export interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Current numeric value. Pass this for controlled mode. */
  value?: number;

  /**
   * Initial value used when operating in uncontrolled mode.
   *
   * @default 0
   */
  defaultValue?: number;

  /** Callback invoked with the new value on every change during drag or keyboard interaction. */
  onChange?: (value: number) => void;

  /** Callback invoked with the final value when a drag gesture or keyboard interaction ends. */
  onChangeEnd?: (value: number) => void;

  /**
   * Minimum allowed value.
   *
   * @default 0
   */
  min?: number;

  /**
   * Maximum allowed value.
   *
   * @default 100
   */
  max?: number;

  /**
   * Step increment the value snaps to.
   *
   * @default 1
   */
  step?: number;

  /**
   * Size tier controlling track height, thumb diameter, and label font sizes.
   *
   * @default 'md'
   */
  size?: ComponentSize;

  /** Optional label text rendered above the track on the leading side. */
  label?: string;

  /**
   * When `true`, the current value is displayed above the track on the trailing side.
   *
   * @default false
   */
  showValue?: boolean;

  /**
   * Custom formatter for the displayed value string.
   *
   * @remarks
   * Only used when `showValue` is `true`. Receives the raw numeric value
   * and should return a display string (e.g., `(v) => \`\${v}%\``).
   */
  formatValue?: (value: number) => string;

  /**
   * Whether the slider is disabled.
   *
   * @default false
   */
  disabled?: boolean;

  /**
   * Overrides the track thickness (height) independently of the `size` tier.
   *
   * @remarks
   * When provided, the track height and its border radius are derived from
   * the shared {@link Thickness} scale instead of the size-based default.
   */
  thickness?: Thickness;

  /**
   * When `true`, renders a pulsing skeleton placeholder instead of the interactive slider.
   *
   * @default false
   */
  skeleton?: boolean;
}
