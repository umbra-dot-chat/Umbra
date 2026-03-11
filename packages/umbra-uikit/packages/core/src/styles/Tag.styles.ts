import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { TagSizeConfig } from '../types/Tag.types';
import { fontFamilyStacks } from '../tokens/shared';
import { relativeLuminance } from '../utils/contrast';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Helper: detect hex color strings
// ---------------------------------------------------------------------------

/**
 * Tests whether a string is a valid 3- or 6-digit hex color.
 *
 * @param color - The string to test.
 * @returns `true` if the string matches `#RGB` or `#RRGGBB`.
 */
function isHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

// ---------------------------------------------------------------------------
// Resolved tag colors
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a tag instance.
 *
 * @remarks
 * Produced by {@link resolveTagColors} and consumed by the style builders.
 */
export interface TagColors {
  /** Background color (rest state). */
  bg: string;
  /** Text foreground color. */
  text: string;
  /** Border color. */
  border: string;
  /** Background color on hover. */
  bgHover: string;
  /** Close button background (rest state). */
  closeBg: string;
  /** Close button background on hover. */
  closeHover: string;
  /** Close icon stroke color. */
  closeColor: string;
}

// ---------------------------------------------------------------------------
// Resolve tag colors based on selected / disabled state
// ---------------------------------------------------------------------------

/**
 * Resolves theme-aware colors for a tag based on its interactive state.
 *
 * @remarks
 * Uses {@link relativeLuminance} for automatic contrast detection when
 * the tag is in a selected state against the accent color.
 *
 * @param selected - Whether the tag is in a selected/active state.
 * @param disabled - Whether the tag is disabled.
 * @param themeColors - Current theme color tokens.
 * @returns Resolved color set for the given state combination.
 */
export function resolveTagColors(
  selected: boolean,
  disabled: boolean,
  theme: WispTheme,
): TagColors {
  const { colors: themeColors } = theme;
  // Disabled — muted everything, no hover
  if (disabled) {
    return {
      bg: 'transparent',
      text: themeColors.text.muted,
      border: themeColors.border.subtle,
      bgHover: 'transparent',
      closeBg: 'transparent',
      closeHover: themeColors.border.subtle,
      closeColor: themeColors.text.muted,
    };
  }

  // Selected — filled with accent color
  if (selected) {
    const accentBg = themeColors.accent.primary;
    // Auto-detect whether accent is light or dark to pick contrasting text
    const accentIsLight = isHexColor(accentBg) && relativeLuminance(accentBg) > 0.4;
    const textColor = accentIsLight ? '#0A0E15' : '#F7F8FA';
    const closeHoverBg = accentIsLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.15)';

    return {
      bg: accentBg,
      text: textColor,
      border: accentBg,
      bgHover: themeColors.accent.primaryHover,
      closeBg: 'transparent',
      closeHover: closeHoverBg,
      closeColor: textColor,
    };
  }

  // Default — transparent bg, border ring (like Input)
  return {
    bg: 'transparent',
    text: themeColors.text.secondary,
    border: themeColors.border.strong,
    bgHover: themeColors.accent.highlight,
    closeBg: 'transparent',
    closeHover: themeColors.border.subtle,
    closeColor: themeColors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Build tag container style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the tag container.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param colors - Resolved color tokens from {@link resolveTagColors}.
 * @param disabled - Whether the tag is disabled (affects cursor and opacity).
 * @returns A `CSSStyleObject` object ready to spread onto a `<span>`.
 */
export function buildTagStyle(
  sizeConfig: TagSizeConfig,
  colors: TagColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    height: sizeConfig.height,
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: radii[sizeConfig.borderRadius],
    boxSizing: 'border-box',
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.lineHeight,
    fontWeight: typography.weights.medium,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, border-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Build close button style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the tag close/remove button.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param colors - Resolved color tokens from {@link resolveTagColors}.
 * @returns A `CSSStyleObject` object for the close `<button>`.
 */
export function buildCloseButtonStyle(
  sizeConfig: TagSizeConfig,
  colors: TagColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    // Reset button defaults
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'none',

    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.closeSize,
    height: sizeConfig.closeSize,
    borderRadius: radii[sizeConfig.borderRadius] > 4 ? radii[sizeConfig.borderRadius] - 2 : 2,
    backgroundColor: colors.closeBg,
    cursor: 'pointer',
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the tag skeleton loading placeholder.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param themeColors - Current theme color tokens.
 * @returns A `CSSStyleObject` object with a pulsing animation for the skeleton `<div>`.
 */
export function getTagSkeletonStyle(
  sizeConfig: TagSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: 64,
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
