import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ColorSwatchShape, ColorSwatchSizeConfig } from '../types/ColorSwatch.types';

// ---------------------------------------------------------------------------
// Resolve border-radius from shape
// ---------------------------------------------------------------------------

/**
 * Resolves a CSS `border-radius` value from the given shape and size config.
 *
 * @param shape - The swatch shape (`'circle'`, `'square'`, or `'rounded'`).
 * @param sizeConfig - Pixel dimensions for the chosen size preset.
 * @returns A number (pixels) or `'50%'` string for circle shapes.
 */
function resolveBorderRadius(
  shape: ColorSwatchShape,
  sizeConfig: ColorSwatchSizeConfig,
): number | string {
  switch (shape) {
    case 'circle':
      return '50%';
    case 'square':
      return 0;
    case 'rounded':
      return sizeConfig.borderRadius;
    default:
      return '50%';
  }
}

// ---------------------------------------------------------------------------
// Build the swatch style — the visible color element
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the standard (non-checkerboard) swatch element.
 *
 * @param sizeConfig - Pixel dimensions for the chosen size preset.
 * @param color - CSS colour string to display.
 * @param shape - Shape of the swatch.
 * @param bordered - Whether to render a visible border.
 * @param hasCheckerboard - `true` when a checkerboard wrapper is present, affecting z-index.
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` object for the swatch `<div>`.
 */
export function buildSwatchStyle(
  sizeConfig: ColorSwatchSizeConfig,
  color: string,
  shape: ColorSwatchShape,
  bordered: boolean,
  hasCheckerboard: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',

    // Sizing
    width: sizeConfig.size,
    height: sizeConfig.size,

    // Shape
    borderRadius: resolveBorderRadius(shape, sizeConfig),

    // Color
    backgroundColor: color,

    // Border
    border: bordered ? `1px solid ${themeColors.border.subtle}` : 'none',

    // Stacking — sits above checkerboard when present
    position: hasCheckerboard ? 'relative' : 'relative',
    overflow: 'hidden',
    zIndex: hasCheckerboard ? 1 : undefined,
  };
}

// ---------------------------------------------------------------------------
// Build the checkerboard background style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the checkerboard background wrapper.
 *
 * @remarks
 * Uses a `repeating-conic-gradient` to create the transparency grid pattern.
 *
 * @param sizeConfig - Pixel dimensions for the chosen size preset.
 * @param shape - Shape of the swatch (determines border-radius).
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` object for the checkerboard wrapper `<div>`.
 */
export function buildCheckerboardStyle(
  sizeConfig: ColorSwatchSizeConfig,
  shape: ColorSwatchShape,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'relative',
    display: 'inline-flex',
    flexShrink: 0,
    width: sizeConfig.size,
    height: sizeConfig.size,
    borderRadius: resolveBorderRadius(shape, sizeConfig),
    overflow: 'hidden',
    background: `repeating-conic-gradient(${themeColors.border.subtle} 0% 25%, transparent 0% 50%) 0 0 / 8px 8px`,
  };
}

// ---------------------------------------------------------------------------
// Build the color overlay style (inside checkerboard wrapper)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the colour overlay that sits inside
 * the checkerboard wrapper.
 *
 * @param color - CSS colour string to display.
 * @param bordered - Whether to render a visible border.
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` object for the overlay `<div>`.
 */
export function buildColorOverlayStyle(
  color: string,
  bordered: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
    backgroundColor: color,
    border: bordered ? `1px solid ${themeColors.border.subtle}` : 'none',
    borderRadius: 'inherit',
  };
}
