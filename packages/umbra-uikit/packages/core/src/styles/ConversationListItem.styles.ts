/**
 * @module styles/ConversationListItem
 * @description Pure style-builder functions for the ConversationListItem component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface ConversationListItemColors {
  bg: string;
  bgHover: string;
  bgActive: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  unreadBg: string;
  unreadText: string;
  onlineDot: string;
  border: string;
}

export function resolveConversationListItemColors(
  active: boolean,
  theme: WispTheme,
): ConversationListItemColors {
  const { colors: themeColors } = theme;

  if (active) {
    return {
      bg: themeColors.background.raised,
      bgHover: themeColors.background.raised,
      bgActive: themeColors.background.raised,
      text: themeColors.text.onRaised,
      textSecondary: themeColors.text.onRaisedSecondary,
      textMuted: withAlpha(themeColors.text.onRaisedSecondary, 0.7),
      unreadBg: themeColors.accent.primary,
      unreadText: themeColors.text.inverse,
      onlineDot: themeColors.status.success,
      border: themeColors.border.subtle,
    };
  }

  return {
    bg: 'transparent',
    bgHover: themeColors.background.raised,
    bgActive: themeColors.background.raised,
    text: themeColors.text.onRaised,
    textSecondary: themeColors.text.onRaisedSecondary,
    textMuted: withAlpha(themeColors.text.onRaisedSecondary, 0.7),
    unreadBg: themeColors.accent.primary,
    unreadText: themeColors.text.inverse,
    onlineDot: themeColors.status.success,
    border: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Container style
// ---------------------------------------------------------------------------

export function buildConversationListItemStyle(
  colors: ConversationListItemColors,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    userSelect: 'none',
    minHeight: 56,
    boxSizing: 'border-box',
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Avatar wrapper (with online dot)
// ---------------------------------------------------------------------------

export function buildAvatarWrapperStyle(): CSSStyleObject {
  return {
    position: 'relative',
    flexShrink: 0,
  };
}

export function buildOnlineDotStyle(
  colors: ConversationListItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.onlineDot,
    border: `2px solid ${themeColors.background.canvas}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Content column (name + last message)
// ---------------------------------------------------------------------------

export function buildContentStyle(): CSSStyleObject {
  return {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
}

export function buildNameRowStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  };
}

export function buildNameStyle(
  colors: ConversationListItemColors,
  hasUnread: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: hasUnread ? typography.weights.semibold : typography.weights.medium,
    color: colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  };
}

export function buildTimestampStyle(
  colors: ConversationListItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    color: colors.textMuted,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Message row (last message + indicators)
// ---------------------------------------------------------------------------

export function buildMessageRowStyle(): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  };
}

export function buildLastMessageStyle(
  colors: ConversationListItemColors,
  hasUnread: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: hasUnread ? typography.weights.medium : typography.weights.regular,
    color: hasUnread ? colors.textSecondary : colors.textMuted,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// Indicators (unread badge, pinned, muted)
// ---------------------------------------------------------------------------

export function buildUnreadBadgeStyle(
  colors: ConversationListItemColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    padding: '0 5px',
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: 1,
    fontWeight: typography.weights.semibold,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: colors.unreadBg,
    color: colors.unreadText,
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}

export function buildIndicatorStyle(
  colors: ConversationListItemColors,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    color: colors.textMuted,
    flexShrink: 0,
    gap: 2,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildConversationListItemSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii, colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radii.md,
    minHeight: 56,
    width: '100%',
    boxSizing: 'border-box',
  };
}

export function buildSkeletonCircleStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.border.subtle,
    flexShrink: 0,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

export function buildSkeletonLineStyle(
  width: string,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    height: 12,
    width,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
