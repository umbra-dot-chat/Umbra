import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { KbdSizeConfig } from '../types/Kbd.types';

// ---------------------------------------------------------------------------
// Build the complete kbd style object
// ---------------------------------------------------------------------------

/**
 * Builds the complete inline style object for the `<kbd>` element.
 *
 * @remarks
 * Applies monospace typography, a keycap shadow for physical depth, and
 * theme-aware colours.
 *
 * @param sizeConfig - Pixel dimensions for the chosen size preset.
 * @param themeColors - Active theme colour tokens.
 * @returns A `CSSStyleObject` object for the `<kbd>` element.
 */
export function buildKbdStyle(
  sizeConfig: KbdSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, radii } = theme;
  return {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    boxSizing: 'border-box',

    // Sizing
    padding: `${sizeConfig.paddingY}px ${sizeConfig.paddingX}px`,
    minWidth: sizeConfig.minWidth,

    // Typography
    fontFamily: fontFamilyStacks.mono,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
    whiteSpace: 'nowrap',

    // Shape
    borderRadius: radii[sizeConfig.borderRadius],

    // Colors
    backgroundColor: themeColors.background.raised,
    color: themeColors.text.onRaisedSecondary,
    border: `1px solid ${themeColors.accent.dividerRaised}`,

    // Key-cap shadow — subtle 1px bottom shadow for depth
    boxShadow: `0 1px 0 0 ${themeColors.accent.dividerRaised}`,

    // Interaction — kbd is not interactive
    userSelect: 'none',
  };
}
