/**
 * @module styles/RoleBadge
 * @description Pure style-builder functions for the RoleBadge component.
 *
 * A compact pill that represents a role assignment. Supports per-role color
 * overrides, five size presets, and an optional remove button. The default
 * colors derive from text tokens with alpha transparency so the badge
 * blends naturally on any background layer.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { withAlpha } from '../tokens/color-utils';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

/**
 * Resolved color tokens for a role badge instance.
 *
 * @remarks
 * These are per-role dynamic, so the interface provides sensible defaults
 * that can be overridden when a role specifies a custom color.
 * Produced by {@link resolveRoleBadgeColors} and consumed by the style builders.
 */
export interface RoleBadgeColors {
  /** Background color of the badge pill. */
  defaultBg: string;
  /** Text color of the role name. */
  defaultText: string;
  /** Border color of the badge pill. */
  defaultBorder: string;
  /** Background color of the remove button (rest state). */
  removeBg: string;
  /** Icon color of the remove button. */
  removeIcon: string;
  /** Background color of the remove button on hover. */
  removeHoverBg: string;
}

/**
 * Resolves theme-aware default colors for a role badge.
 *
 * @remarks
 * Uses alpha-blended text tokens so the badge sits naturally on any
 * background elevation layer. Per-role color overrides can replace
 * individual fields after resolution.
 *
 * @param theme - The current Wisp theme instance.
 * @returns Resolved color set for the role badge.
 */
export function resolveRoleBadgeColors(
  theme: WispTheme,
): RoleBadgeColors {
  const { colors } = theme;
  return {
    defaultBg: withAlpha(colors.text.secondary, 0.12),
    defaultText: colors.text.primary,
    defaultBorder: withAlpha(colors.text.secondary, 0.2),
    removeBg: 'transparent',
    removeIcon: colors.text.muted,
    removeHoverBg: withAlpha(colors.text.primary, 0.1),
  };
}

// ---------------------------------------------------------------------------
// Size configuration
// ---------------------------------------------------------------------------

/**
 * Dimensional presets for each role badge size.
 *
 * @remarks
 * All values are in logical pixels. The five sizes cover compact inline
 * use (`xs`) through large standalone display (`xl`).
 */
export const roleBadgeSizeMap = {
  xs: { height: 16, fontSize: 10, paddingX: 6, iconSize: 8, gap: 2 },
  sm: { height: 20, fontSize: 11, paddingX: 8, iconSize: 10, gap: 3 },
  md: { height: 24, fontSize: 12, paddingX: 10, iconSize: 12, gap: 4 },
  lg: { height: 28, fontSize: 13, paddingX: 12, iconSize: 14, gap: 4 },
  xl: { height: 32, fontSize: 14, paddingX: 14, iconSize: 16, gap: 5 },
};

/** Union of supported role badge size keys. */
export type RoleBadgeSize = keyof typeof roleBadgeSizeMap;

/** Shape of each entry in {@link roleBadgeSizeMap}. */
export type RoleBadgeSizeConfig = (typeof roleBadgeSizeMap)[RoleBadgeSize];

// ---------------------------------------------------------------------------
// 1. Badge container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the role badge container pill.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param colors - Resolved color tokens from {@link resolveRoleBadgeColors}.
 * @param theme - The current Wisp theme instance.
 * @param userStyle - Optional consumer-provided style overrides.
 * @returns A `CSSStyleObject` object for the badge `<span>`.
 */
export function buildRoleBadgeStyle(
  sizeConfig: RoleBadgeSizeConfig,
  colors: RoleBadgeColors,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
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
    backgroundColor: colors.defaultBg,
    color: colors.defaultText,
    border: `1px solid ${colors.defaultBorder}`,
    borderRadius: radii.full,
    boxSizing: 'border-box',
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1,
    fontWeight: typography.weights.medium,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, border-color ${durations.fast}ms ${easings.easeOut.css}`,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// 2. Role color dot
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the role color dot indicator.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param dotColor - The role's assigned color (rendered as a filled circle).
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the dot `<span>`.
 */
export function buildRoleBadgeDotStyle(
  sizeConfig: RoleBadgeSizeConfig,
  dotColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const dotSize = Math.max(sizeConfig.iconSize - 2, 4);
  return {
    width: dotSize,
    height: dotSize,
    borderRadius: radii.full,
    backgroundColor: dotColor,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// 3. Role name text
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the role name text label.
 *
 * @param colors - Resolved color tokens from {@link resolveRoleBadgeColors}.
 * @returns A `CSSStyleObject` object for the name `<span>`.
 */
export function buildRoleBadgeNameStyle(
  colors: RoleBadgeColors,
): CSSStyleObject {
  return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: colors.defaultText,
    lineHeight: 1,
  };
}

// ---------------------------------------------------------------------------
// 4. Remove button
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the remove / close button inside the badge.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param colors - Resolved color tokens from {@link resolveRoleBadgeColors}.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object for the remove `<button>`.
 */
export function buildRoleBadgeRemoveButtonStyle(
  sizeConfig: RoleBadgeSizeConfig,
  colors: RoleBadgeColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  const btnSize = sizeConfig.iconSize + 4;
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
    width: btnSize,
    height: btnSize,
    borderRadius: radii.full,
    backgroundColor: colors.removeBg,
    color: colors.removeIcon,
    cursor: 'pointer',
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 5. Skeleton placeholder
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the role badge skeleton loading placeholder.
 *
 * @param sizeConfig - Dimensional config for the chosen size.
 * @param theme - The current Wisp theme instance.
 * @returns A `CSSStyleObject` object with a pulsing animation for the skeleton `<span>`.
 */
export function getRoleBadgeSkeletonStyle(
  sizeConfig: RoleBadgeSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    display: 'inline-block',
    width: 64,
    height: sizeConfig.height,
    borderRadius: radii.full,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
