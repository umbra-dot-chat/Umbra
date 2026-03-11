/**
 * @module styles/FriendListItem
 * @description Pure style-builder functions for the FriendListItem component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface FriendListItemColors {
  bg: string;
  bgHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  actionBg: string;
  actionBgHover: string;
  actionIcon: string;
  statusOnline: string;
  statusIdle: string;
  statusDnd: string;
  statusOffline: string;
}

export function resolveFriendListItemColors(
  theme: WispTheme,
): FriendListItemColors {
  const { colors: themeColors } = theme;
  return {
    bg: 'transparent',
    bgHover: themeColors.background.raised,
    text: themeColors.text.primary,
    textSecondary: themeColors.text.secondary,
    textMuted: themeColors.text.muted,
    border: themeColors.border.subtle,
    actionBg: themeColors.background.sunken,
    actionBgHover: themeColors.border.subtle,
    actionIcon: themeColors.text.secondary,
    statusOnline: themeColors.status.success,
    statusIdle: themeColors.status.warning,
    statusDnd: themeColors.status.danger,
    statusOffline: themeColors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildFriendListItemStyle(
  colors: FriendListItemColors,
  disabled: boolean,
  theme: WispTheme,
  flat = false,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: flat ? 0 : radii.md,
    backgroundColor: colors.bg,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    userSelect: 'none',
    minHeight: 56,
    boxSizing: 'border-box',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  };
}

// ---------------------------------------------------------------------------
// Content column
// ---------------------------------------------------------------------------

export function buildFriendListItemNameStyle(
  colors: FriendListItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

export function buildFriendListItemUsernameStyle(
  colors: FriendListItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textMuted,
  };
}

export function buildFriendListItemStatusTextStyle(
  colors: FriendListItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

export function buildFriendListItemActionStyle(
  colors: FriendListItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: radii.full,
    border: 'none',
    backgroundColor: colors.actionBg,
    color: colors.actionIcon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildFriendListItemSkeletonStyle(
  theme: WispTheme,
  flat = false,
): CSSStyleObject {
  const { spacing, radii, colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: flat ? 0 : radii.md,
    minHeight: 56,
    width: '100%',
    boxSizing: 'border-box',
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border.subtle,
    borderBottomStyle: 'solid',
  };
}
