import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { BadgeVariant, BadgeShape, BadgeSizeConfig } from '../types/Badge.types';

// ---------------------------------------------------------------------------
// Variant → colors (theme-aware)
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a badge instance.
 *
 * @remarks
 * Produced by {@link resolveBadgeColors} and consumed by the style builders.
 */
export interface BadgeColors {
  /** Background color. */
  bg: string;
  /** Text (and icon) foreground color. */
  text: string;
  /** Border color. */
  border: string;
  /** Dot indicator color. */
  dot: string;
}

/**
 * Maps a {@link BadgeVariant} to its theme-aware {@link BadgeColors}.
 *
 * @param variant - The semantic color variant.
 * @param themeColors - Current theme color tokens.
 * @returns Resolved color set for the given variant.
 */
export function resolveBadgeColors(
  variant: BadgeVariant,
  theme: WispTheme,
): BadgeColors {
  const { colors: themeColors } = theme;
  switch (variant) {
    case 'default':
      return {
        bg: themeColors.border.subtle,
        text: themeColors.text.secondary,
        border: themeColors.border.strong,
        dot: themeColors.text.muted,
      };

    case 'success':
      return {
        bg: themeColors.status.successSurface,
        text: themeColors.status.success,
        border: 'transparent',
        dot: themeColors.status.success,
      };

    case 'warning':
      return {
        bg: themeColors.status.warningSurface,
        text: themeColors.status.warning,
        border: 'transparent',
        dot: themeColors.status.warning,
      };

    case 'danger':
      return {
        bg: themeColors.status.dangerSurface,
        text: themeColors.status.danger,
        border: 'transparent',
        dot: themeColors.status.danger,
      };

    case 'info':
      return {
        bg: themeColors.status.infoSurface,
        text: themeColors.status.info,
        border: 'transparent',
        dot: themeColors.status.info,
      };

    default:
      return resolveBadgeColors('default', theme);
  }
}

// ---------------------------------------------------------------------------
// Build the complete badge style object
// ---------------------------------------------------------------------------

/**
 * Builds the complete inline style object for the badge container.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param colors - Resolved color tokens from {@link resolveBadgeColors}.
 * @param shape - Badge shape (`'pill'` or `'badge'`).
 * @returns A `CSSStyleObject` object ready to spread onto a `<span>`.
 */
export function buildBadgeStyle(
  sizeConfig: BadgeSizeConfig,
  colors: BadgeColors,
  shape: BadgeShape,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  return {
    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    boxSizing: 'border-box',

    // Sizing
    padding: `${sizeConfig.paddingY}px ${sizeConfig.paddingX}px`,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.lineHeight,
    fontWeight: typography.weights.medium,
    whiteSpace: 'nowrap',

    // Shape
    borderRadius: shape === 'pill' ? radii.full : radii[sizeConfig.badgeRadius],

    // Colors
    backgroundColor: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,

    // Interaction — badges are not interactive
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Dot style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the dot indicator circle.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param colors - Resolved color tokens from {@link resolveBadgeColors}.
 * @returns A `CSSStyleObject` object for the dot `<span>`.
 */
export function buildDotStyle(
  sizeConfig: BadgeSizeConfig,
  colors: BadgeColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: radii.full,
    backgroundColor: colors.dot,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the badge skeleton loading placeholder.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param themeColors - Current theme color tokens.
 * @returns A `CSSStyleObject` object with a pulsing animation for the skeleton `<span>`.
 */
export function getBadgeSkeletonStyle(
  sizeConfig: BadgeSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    height: sizeConfig.fontSize * sizeConfig.lineHeight + sizeConfig.paddingY * 2 + 2,
    width: 64,
    borderRadius: radii.full,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
