/**
 * @module styles/FriendRequestItem
 * @description Pure style-builder functions for the FriendRequestItem component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface FriendRequestItemColors {
  bg: string;
  bgHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  acceptBg: string;
  acceptText: string;
  declineBg: string;
  declineText: string;
  cancelBg: string;
  cancelText: string;
}

export function resolveFriendRequestItemColors(
  theme: WispTheme,
): FriendRequestItemColors {
  const { colors: themeColors } = theme;
  return {
    bg: 'transparent',
    bgHover: themeColors.background.raised,
    text: themeColors.text.primary,
    textSecondary: themeColors.text.secondary,
    textMuted: themeColors.text.muted,
    border: themeColors.border.subtle,
    acceptBg: themeColors.status.success,
    acceptText: themeColors.text.inverse,
    declineBg: themeColors.background.sunken,
    declineText: themeColors.text.secondary,
    cancelBg: themeColors.background.sunken,
    cancelText: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildFriendRequestItemStyle(
  colors: FriendRequestItemColors,
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
    cursor: disabled ? 'not-allowed' : 'default',
    opacity: disabled ? 0.5 : 1,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    minHeight: 60,
    boxSizing: 'border-box',
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomStyle: 'solid',
  };
}

// ---------------------------------------------------------------------------
// Text styles
// ---------------------------------------------------------------------------

export function buildFriendRequestItemNameStyle(
  colors: FriendRequestItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  };
}

export function buildFriendRequestItemSubtitleStyle(
  colors: FriendRequestItemColors,
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

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

export function buildFriendRequestAcceptStyle(
  colors: FriendRequestItemColors,
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
    backgroundColor: colors.acceptBg,
    color: colors.acceptText,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  };
}

export function buildFriendRequestDeclineStyle(
  colors: FriendRequestItemColors,
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
    backgroundColor: colors.declineBg,
    color: colors.declineText,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  };
}
