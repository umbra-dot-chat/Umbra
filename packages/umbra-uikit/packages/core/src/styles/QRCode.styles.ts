import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { QRCodeSizeConfig } from '../types/QRCode.types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Resolved colour tokens for the QRCode component.
 */
export interface QRCodeColors {
  /** Colour of dark (active) modules. */
  dark: string;
  /** Background colour (light modules). */
  light: string;
}

/**
 * Resolves the default dark / light colours from the current theme.
 *
 * @param themeColors - Current {@link ThemeColors}.
 * @returns A {@link QRCodeColors} object.
 */
export function resolveQRCodeColors(theme: WispTheme): QRCodeColors {
  const { colors: themeColors } = theme;
  return {
    dark: themeColors.text.primary,
    light: themeColors.background.canvas,
  };
}

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (inline-flex column, centred).
 *
 * @returns A {@link CSSStyleObject}.
 */
export function buildQRCodeWrapperStyle(): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// SVG container
// ---------------------------------------------------------------------------

/**
 * Builds the style for the SVG container.
 *
 * @param sizeConfig - Resolved {@link QRCodeSizeConfig}.
 * @returns A {@link CSSStyleObject}.
 */
export function buildQRCodeSvgStyle(sizeConfig: QRCodeSizeConfig): CSSStyleObject {
  return {
    position: 'relative',
    width: sizeConfig.dimension,
    height: sizeConfig.dimension,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Logo overlay
// ---------------------------------------------------------------------------

/**
 * Builds the absolutely-positioned overlay for custom centre content (logo).
 *
 * @param sizeConfig - Resolved {@link QRCodeSizeConfig}.
 * @returns A {@link CSSStyleObject}.
 */
export function buildQRCodeLogoOverlayStyle(sizeConfig: QRCodeSizeConfig): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    width: sizeConfig.dimension,
    height: sizeConfig.dimension,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  };
}
