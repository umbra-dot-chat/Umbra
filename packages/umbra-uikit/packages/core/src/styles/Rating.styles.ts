import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { RatingSizeConfig } from '../types/Rating.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container style (wraps stars + optional value label)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the root rating container.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @returns `CSSStyleObject` for the root `<div>` element.
 */
export function buildRatingContainerStyle(
  sizeConfig: RatingSizeConfig,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Star style (individual star wrapper)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for a single star element.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param active - Whether the star (or half) is currently filled.
 * @param hovered - Whether the star is under the hover preview.
 * @param disabled - Whether the rating is disabled.
 * @param readOnly - Whether the rating is read-only.
 * @param themeColors - Active theme color tokens.
 * @returns `CSSStyleObject` for the star wrapper `<span>` element.
 */
export function buildRatingStarStyle(
  sizeConfig: RatingSizeConfig,
  active: boolean,
  hovered: boolean,
  disabled: boolean,
  readOnly: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const isInteractive = !disabled && !readOnly;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.starSize,
    height: sizeConfig.starSize,
    cursor: isInteractive ? 'pointer' : disabled ? 'not-allowed' : 'default',
    opacity: disabled ? 0.5 : 1,
    color: active || hovered
      ? themeColors.accent.primary
      : themeColors.border.subtle,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}, transform ${durations.fast}ms ${easings.easeOut.css}`,
    transform: hovered && isInteractive ? 'scale(1.1)' : 'scale(1)',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Value label style (numeric readout)
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the numeric value label.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param themeColors - Active theme color tokens.
 * @returns `CSSStyleObject` for the value `<span>` element.
 */
export function buildRatingValueStyle(
  sizeConfig: RatingSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamilyStacks.sans,
    color: themeColors.text.secondary,
    lineHeight: 1.4,
    marginLeft: spacing.xs,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Skeleton style
// ---------------------------------------------------------------------------

/**
 * Builds inline styles for the rating skeleton loading placeholder.
 *
 * @param sizeConfig - Dimension config for the current size tier.
 * @param themeColors - Active theme color tokens.
 * @returns `CSSStyleObject` for the skeleton `<div>` element.
 */
export function getRatingSkeletonStyle(
  sizeConfig: RatingSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const totalWidth =
    sizeConfig.starSize * 5 + sizeConfig.gap * 4;

  return {
    display: 'inline-block',
    width: totalWidth,
    height: sizeConfig.starSize,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
