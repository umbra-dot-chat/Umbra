/**
 * @module Toggle
 */
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing } from '../theme/create-theme';

// Re-export shared tokens
export { componentSizes as toggleSizes } from '../tokens/shared';
export type { ComponentSize as ToggleSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension tokens for a single toggle size step.
 *
 * @remarks
 * Consumed by the style builder functions in `Toggle.styles.ts` to produce
 * track, handle, and content inline styles.
 */
export interface ToggleSizeConfig {
  /** Track width in pixels. */
  trackWidth: number;
  /** Track height in pixels. */
  trackHeight: number;
  /** Handle (thumb) diameter in pixels. */
  handleSize: number;
  /** Inner padding in pixels between the track edge and the handle. */
  padding: number;
  /** Horizontal translate distance in pixels for the handle when checked. */
  translateX: number;
  /** Icon size in pixels for icons placed inside track labels. */
  trackIconSize: number;
  /** Font size in pixels for text placed on the track surface. */
  trackFontSize: number;
  /** Icon size in pixels for the icon embedded inside the handle. */
  handleIconSize: number;
}

/**
 * Maps each {@link ComponentSize} to its standard {@link ToggleSizeConfig}.
 *
 * @remarks
 * Provides five size steps from `xs` (32 px wide) through `xl` (68 px wide).
 */
export const toggleSizeMap: Record<ComponentSize, ToggleSizeConfig> = {
  xs: { trackWidth: 32, trackHeight: 18, handleSize: 14, padding: defaultSpacing['2xs'], translateX: 14, trackIconSize: 10, trackFontSize: 8, handleIconSize: 10 },
  sm: { trackWidth: 40, trackHeight: 22, handleSize: 18, padding: defaultSpacing['2xs'], translateX: 18, trackIconSize: 12, trackFontSize: 9, handleIconSize: 12 },
  md: { trackWidth: 48, trackHeight: 26, handleSize: 22, padding: defaultSpacing['2xs'], translateX: 22, trackIconSize: 14, trackFontSize: 10, handleIconSize: 14 },
  lg: { trackWidth: 56, trackHeight: 30, handleSize: 26, padding: defaultSpacing['2xs'], translateX: 26, trackIconSize: 16, trackFontSize: 11, handleIconSize: 16 },
  xl: { trackWidth: 68, trackHeight: 36, handleSize: 32, padding: defaultSpacing['2xs'], translateX: 32, trackIconSize: 20, trackFontSize: 12, handleIconSize: 20 },
};

// ---------------------------------------------------------------------------
// Slim variant size overrides
// ---------------------------------------------------------------------------

/**
 * Maps each {@link ComponentSize} to its slim-variant {@link ToggleSizeConfig}.
 *
 * @remarks
 * The slim variant uses reduced track heights, smaller handles, and tighter
 * padding for a more compact appearance. Used when the `slim` prop is `true`.
 */
export const toggleSlimSizeMap: Record<ComponentSize, ToggleSizeConfig> = {
  xs: { trackWidth: 28, trackHeight: 14, handleSize: 12, padding: defaultSpacing['2xs'], translateX: 14, trackIconSize: 8, trackFontSize: 7, handleIconSize: 8 },
  sm: { trackWidth: 36, trackHeight: 18, handleSize: 16, padding: defaultSpacing['2xs'], translateX: 18, trackIconSize: 10, trackFontSize: 8, handleIconSize: 10 },
  md: { trackWidth: 44, trackHeight: 22, handleSize: 20, padding: defaultSpacing['2xs'], translateX: 22, trackIconSize: 12, trackFontSize: 9, handleIconSize: 12 },
  lg: { trackWidth: 52, trackHeight: 26, handleSize: 24, padding: defaultSpacing['2xs'], translateX: 26, trackIconSize: 14, trackFontSize: 10, handleIconSize: 14 },
  xl: { trackWidth: 64, trackHeight: 32, handleSize: 30, padding: defaultSpacing['2xs'], translateX: 32, trackIconSize: 18, trackFontSize: 11, handleIconSize: 18 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Toggle} component.
 *
 * @remarks
 * Extends native `<button>` HTML attributes (excluding `onChange`, which is
 * re-declared with a boolean signature). Supports both controlled and
 * uncontrolled state patterns.
 */
export interface ToggleProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /**
   * Controlled checked state.
   * When provided, the component operates in controlled mode and `onChange`
   * should be used to update external state.
   */
  checked?: boolean;

  /**
   * Initial checked state for uncontrolled usage.
   * @default false
   */
  defaultChecked?: boolean;

  /** Callback fired when the toggle state changes. Receives the new boolean value. */
  onChange?: (checked: boolean) => void;

  /**
   * Toggle size controlling track dimensions, handle diameter, and content sizing.
   * @default 'md'
   */
  size?: ComponentSize;

  /**
   * When `true`, renders a slimmer track with a smaller handle for compact layouts.
   * @default false
   */
  slim?: boolean;

  /**
   * Disabled state -- applies muted colors and `cursor: not-allowed`.
   * @default false
   */
  disabled?: boolean;

  /**
   * Content shown on the track surface when the toggle is CHECKED (left side,
   * behind the handle). Typically a small {@link Icon} or short text string.
   */
  checkedContent?: React.ReactNode;

  /**
   * Content shown on the track surface when the toggle is UNCHECKED (right side,
   * behind the handle). Typically a small {@link Icon} or short text string.
   */
  uncheckedContent?: React.ReactNode;

  /**
   * Icon component rendered inside the handle itself.
   *
   * @remarks
   * Pass a Lucide icon **component** (e.g. `Sun`), not JSX (`<Sun />`).
   * The component will be sized and colored automatically based on the
   * current size step and contrast requirements.
   */
  handleIcon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;

  /**
   * Override the track background color when checked.
   * Accepts any valid CSS color string. Defaults to the theme's monochrome accent.
   */
  checkedColor?: string;

  /**
   * Override the track background color when unchecked.
   * Accepts any valid CSS color string. Defaults to the theme's subtle gray.
   */
  uncheckedColor?: string;

  /**
   * When `true`, renders a skeleton shimmer placeholder instead of the toggle.
   * @default false
   */
  skeleton?: boolean;

  /** Accessible label applied as `aria-label` for screen readers. */
  label?: string;
}
