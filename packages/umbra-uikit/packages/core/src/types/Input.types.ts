import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

/**
 * Ordered tuple of valid input size tokens, re-exported from the shared
 * {@link ComponentSize} definition for convenience.
 */
export { componentSizes as inputSizes } from '../tokens/shared';

/**
 * Union of valid input size strings (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`),
 * re-exported from the shared {@link ComponentSize} type.
 */
export type { ComponentSize as InputSize } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension and typography tokens for a single input size.
 *
 * @remarks
 * Each {@link ComponentSize} key in {@link inputSizeMap} maps to one of these
 * config objects, which the style builders in `Input.styles.ts` consume to
 * produce size-appropriate `CSSProperties`.
 */
export interface InputSizeConfig {
  /** Total input height */
  height: number;
  /** Horizontal padding inside the input container */
  paddingX: number;
  /** Vertical padding inside the input container */
  paddingY: number;
  /** Font size for the input text */
  fontSize: number;
  /** Line height multiplier */
  lineHeight: number;
  /** Border radius of the input container */
  borderRadius: keyof ThemeRadii;
  /** Size of leading/trailing icons */
  iconSize: number;
  /** Font size for the label text */
  labelFontSize: number;
  /** Font size for the hint/error text */
  hintFontSize: number;
}

/**
 * Lookup from {@link ComponentSize} to the corresponding {@link InputSizeConfig}.
 *
 * @remarks
 * Provides five pre-defined size configs (`xs` through `xl`) consumed by
 * the Input component and its style builders.
 */
export const inputSizeMap: Record<ComponentSize, InputSizeConfig> = {
  xs: { height: 28, paddingX: defaultSpacing.sm, paddingY: defaultSpacing.xs, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 1.33, borderRadius: 'md', iconSize: 14, labelFontSize: 12, hintFontSize: 11 },
  sm: { height: 32, paddingX: defaultSpacing.md, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.38, borderRadius: 'md', iconSize: 16, labelFontSize: 13, hintFontSize: 12 },
  md: { height: 38, paddingX: defaultSpacing.md, paddingY: defaultSpacing.sm, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.43, borderRadius: 'md', iconSize: 18, labelFontSize: 14, hintFontSize: 13 },
  lg: { height: 44, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.47, borderRadius: 'md', iconSize: 20, labelFontSize: 15, hintFontSize: 14 },
  xl: { height: 52, paddingX: defaultSpacing.lg, paddingY: defaultSpacing.md, fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.5, borderRadius: 'lg', iconSize: 22, labelFontSize: 16, hintFontSize: 15 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Input} component.
 *
 * @remarks
 * Extends the native `InputHTMLAttributes` (with `size` omitted to avoid
 * conflict with the design-system size token) and adds Wisp-specific
 * features such as label/hint text, error/warning states, icon slots,
 * skeleton mode, and full-width layout.
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Input size token controlling height, padding, font size, and icon size.
   *
   * @default 'md'
   */
  size?: ComponentSize;

  /** Label text rendered above the input. */
  label?: string;

  /** Hint text rendered below the input (overridden by `error` or `warning` when present). */
  hint?: string;

  /**
   * Error state. When a `string` is provided it is displayed as an error
   * message below the input; when `true` only the red border is shown.
   */
  error?: string | boolean;

  /**
   * Warning state. When a `string` is provided it is displayed as a warning
   * message below the input; when `true` only the yellow border is shown.
   *
   * @remarks
   * Error takes precedence over warning when both are set.
   */
  warning?: string | boolean;

  /**
   * Leading icon rendered inside the input container (left side).
   * Pass a Lucide icon component reference (NOT JSX) -- it will be sized
   * automatically based on the current {@link InputSizeConfig.iconSize}.
   */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;

  /**
   * Trailing icon rendered inside the input container (right side).
   * Pass a Lucide icon component reference (NOT JSX) -- it will be sized
   * automatically based on the current {@link InputSizeConfig.iconSize}.
   */
  trailingIcon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;

  /**
   * When `true`, the input stretches to 100 % of its container width.
   *
   * @default false
   */
  fullWidth?: boolean;

  /**
   * When `true`, renders a skeleton shimmer placeholder instead of the
   * real input. Useful for loading states.
   *
   * @default false
   */
  skeleton?: boolean;
}
