import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ColorPickerSizeConfig } from '../types/ColorPicker.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container style (vertical flex column)
// ---------------------------------------------------------------------------

/**
 * Builds the outermost container style (vertical flex column containing
 * the label, preview row, and preset swatch grid).
 *
 * @param sizeConfig - Dimension tokens for the active size.
 * @returns `CSSStyleObject` for the container `<div>`.
 */
export function buildColorPickerContainerStyle(
  sizeConfig: ColorPickerSizeConfig,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: sizeConfig.gap,
  };
}

// ---------------------------------------------------------------------------
// Preview row style (preview swatch + hex input)
// ---------------------------------------------------------------------------

/**
 * Builds the preview row style — a horizontal flex row containing the
 * colour preview swatch and the optional hex text input.
 *
 * @param sizeConfig - Dimension tokens for the active size.
 * @returns `CSSStyleObject` for the preview row `<div>`.
 */
export function buildColorPickerPreviewRowStyle(
  sizeConfig: ColorPickerSizeConfig,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeConfig.gap,
  };
}

// ---------------------------------------------------------------------------
// Preview swatch style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the colour preview swatch displayed next to the hex
 * input.
 *
 * @param sizeConfig  - Dimension tokens for the active size.
 * @param color       - The current hex colour to display.
 * @param themeColors - The active {@link ThemeColors} for border colour.
 * @returns `CSSStyleObject` for the preview swatch `<div>`.
 */
export function buildColorPickerPreviewStyle(
  sizeConfig: ColorPickerSizeConfig,
  color: string,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width: sizeConfig.previewSize,
    height: sizeConfig.previewSize,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: color,
    border: `1px solid ${themeColors.border.subtle}`,
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Hex input style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the hex colour text input.
 *
 * @param sizeConfig  - Dimension tokens for the active size.
 * @param themeColors - The active {@link ThemeColors} for border and text.
 * @returns `CSSStyleObject` for the `<input>` element.
 */
export function buildColorPickerInputStyle(
  sizeConfig: ColorPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    height: sizeConfig.inputHeight,
    borderRadius: radii[sizeConfig.borderRadius],
    border: `1px solid ${themeColors.border.strong}`,
    backgroundColor: 'transparent',
    color: themeColors.text.primary,
    fontSize: sizeConfig.fontSize,
    padding: `0 ${Math.round(sizeConfig.fontSize * 0.6)}px`,
    fontFamily: fontFamilyStacks.mono,
    width: 100,
    boxSizing: 'border-box',
    outline: 'none',
    margin: 0,
    appearance: 'none',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Swatch grid style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the preset swatch grid container.
 *
 * @param _sizeConfig - Dimension tokens for the active size (reserved for
 *                      future per-size spacing adjustments).
 * @returns `CSSStyleObject` for the swatch grid `<div>`.
 */
export function buildColorPickerSwatchGridStyle(
  _sizeConfig: ColorPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Individual swatch style
// ---------------------------------------------------------------------------

/**
 * Builds styles for a single preset colour swatch.
 *
 * @param sizeConfig  - Dimension tokens for the active size.
 * @param color       - The hex colour of this swatch.
 * @param isSelected  - Whether this swatch is the currently selected colour.
 * @param isHovered   - Whether the pointer is currently over this swatch.
 * @param themeColors - The active {@link ThemeColors} for border colours.
 * @returns `CSSStyleObject` for the swatch `<button>`.
 */
export function buildColorPickerSwatchStyle(
  sizeConfig: ColorPickerSizeConfig,
  color: string,
  isSelected: boolean,
  isHovered: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  let border: string;
  if (isSelected) {
    border = `2px solid ${themeColors.accent.primary}`;
  } else if (isHovered) {
    border = `2px solid ${themeColors.border.strong}`;
  } else {
    border = `1px solid ${themeColors.border.subtle}`;
  }

  return {
    width: sizeConfig.swatchSize,
    height: sizeConfig.swatchSize,
    borderRadius: radii.sm,
    backgroundColor: color,
    cursor: 'pointer',
    border,
    padding: 0,
    outline: 'none',
    boxSizing: 'border-box',
    flexShrink: 0,
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Label style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the optional label text rendered above the picker.
 *
 * @param sizeConfig  - Dimension tokens for the active size.
 * @param themeColors - The active {@link ThemeColors} for text colour.
 * @returns `CSSStyleObject` for the `<label>` element.
 */
export function buildColorPickerLabelStyle(
  sizeConfig: ColorPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    color: themeColors.text.secondary,
    fontWeight: typography.weights.medium,
    lineHeight: 1.4,
    cursor: 'default',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds styles for the skeleton shimmer placeholder shown when
 * `skeleton` is `true`.
 *
 * @param sizeConfig  - Dimension tokens for the active size.
 * @param themeColors - The active {@link ThemeColors} providing the
 *                      skeleton background tint.
 * @returns `CSSStyleObject` for the skeleton `<div>`.
 */
export function getColorPickerSkeletonStyle(
  sizeConfig: ColorPickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: 180,
    height: sizeConfig.previewSize + sizeConfig.gap + sizeConfig.swatchSize * 2 + 6,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
