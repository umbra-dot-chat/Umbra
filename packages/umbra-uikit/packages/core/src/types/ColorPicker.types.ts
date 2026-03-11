import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/**
 * Ordered tuple of valid color-picker size tokens.
 *
 * @remarks
 * Three steps (`sm`, `md`, `lg`) cover the typical range of inline
 * colour-picker use-cases without overwhelming the UI.
 */
export const colorPickerSizes = ['sm', 'md', 'lg'] as const;

/**
 * Union of valid color-picker size strings (`'sm' | 'md' | 'lg'`).
 *
 * @remarks
 * Derived from the {@link colorPickerSizes} tuple.
 */
export type ColorPickerSize = (typeof colorPickerSizes)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimension and typography tokens for a single color-picker size.
 *
 * @remarks
 * Each {@link ColorPickerSize} key in {@link colorPickerSizeMap} maps to one
 * of these config objects, which the style builders in
 * `ColorPicker.styles.ts` consume to produce size-appropriate
 * `CSSProperties`.
 */
export interface ColorPickerSizeConfig {
  /** Width and height of each preset swatch. */
  swatchSize: number;
  /** Height of the hex text input. */
  inputHeight: number;
  /** Font size used in the input and label. */
  fontSize: number;
  /** Gap between major layout sections. */
  gap: number;
  /** Border radius applied to containers and the input. */
  borderRadius: keyof ThemeRadii;
  /** Width and height of the colour preview swatch. */
  previewSize: number;
}

/**
 * Lookup from {@link ColorPickerSize} to the corresponding
 * {@link ColorPickerSizeConfig}.
 *
 * @remarks
 * Provides three pre-defined size configs (`sm`, `md`, `lg`) consumed by
 * the ColorPicker component and its style builders.
 */
export const colorPickerSizeMap: Record<ColorPickerSize, ColorPickerSizeConfig> = {
  sm: { swatchSize: 20, inputHeight: 28, fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.sm, borderRadius: 'md', previewSize: 28 },
  md: { swatchSize: 24, inputHeight: 34, fontSize: defaultTypography.sizes.sm.fontSize, gap: defaultSpacing.md, borderRadius: 'md', previewSize: 34 },
  lg: { swatchSize: 28, inputHeight: 40, fontSize: defaultTypography.sizes.sm.fontSize, gap: defaultSpacing.md, borderRadius: 'md', previewSize: 40 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ColorPicker} component.
 *
 * @remarks
 * Extends the native `HTMLAttributes` for a `<div>` (with `onChange`
 * omitted to avoid conflict with the custom colour callback) and adds
 * Wisp-specific features such as preset swatches, a hex input, skeleton
 * mode, and controlled / uncontrolled value management.
 */
export interface ColorPickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * The currently selected hex colour (controlled mode).
   *
   * @remarks
   * When provided, the component becomes controlled and `onChange`
   * must be used to update the value externally.
   */
  value?: string;

  /**
   * Initial hex colour for uncontrolled mode.
   *
   * @default '#000000'
   */
  defaultValue?: string;

  /**
   * Callback fired whenever the selected colour changes.
   *
   * @param color - The new hex colour string (e.g. `'#3B82F6'`).
   */
  onChange?: (color: string) => void;

  /**
   * Size token controlling swatch dimensions, input height, font size,
   * and spacing.
   *
   * @default 'md'
   */
  size?: ColorPickerSize;

  /**
   * Array of hex colour strings to display as clickable preset swatches.
   *
   * @remarks
   * When omitted a sensible default palette of ten common colours is used.
   */
  presets?: string[];

  /**
   * Whether to show the hex text input alongside the colour preview.
   *
   * @default true
   */
  showInput?: boolean;

  /**
   * When `true`, the component is non-interactive.
   *
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true`, renders a skeleton shimmer placeholder instead of the
   * real picker. Useful for loading states.
   *
   * @default false
   */
  skeleton?: boolean;

  /**
   * Optional label text rendered above the picker.
   */
  label?: string;
}
