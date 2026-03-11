/**
 * @module styles/UserMiniCard
 * @description Pure style-builder functions for the UserMiniCard component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface UserMiniCardColors {
  bg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  actionBg: string;
  actionBgHover: string;
  actionIcon: string;
  statusOnline: string;
  statusIdle: string;
  statusDnd: string;
  statusOffline: string;
  shadow: string;
}

export function resolveUserMiniCardColors(
  theme: WispTheme,
): UserMiniCardColors {
  const { colors: themeColors } = theme;
  return {
    bg: themeColors.background.surface,
    border: themeColors.border.subtle,
    text: themeColors.text.primary,
    textSecondary: themeColors.text.secondary,
    textMuted: themeColors.text.muted,
    actionBg: 'transparent',
    actionBgHover: themeColors.background.raised,
    actionIcon: themeColors.text.secondary,
    statusOnline: themeColors.status.success,
    statusIdle: themeColors.status.warning,
    statusDnd: themeColors.status.danger,
    statusOffline: themeColors.text.muted,
    shadow: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildUserMiniCardContainerStyle(
  colors: UserMiniCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  const isLight = theme.mode === 'light';
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
    minWidth: 240,
    maxWidth: 320,
    boxSizing: 'border-box',
    // Light mode gets a subtle shadow for visual lift; dark mode relies on borders
    ...(isLight && {
      boxShadow: `0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)`,
    }),
  };
}

// ---------------------------------------------------------------------------
// Text styles
// ---------------------------------------------------------------------------

export function buildUserMiniCardNameStyle(
  colors: UserMiniCardColors,
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

export function buildUserMiniCardUsernameStyle(
  colors: UserMiniCardColors,
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

export function buildUserMiniCardStatusStyle(
  colors: UserMiniCardColors,
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

export function buildUserMiniCardActionStyle(
  colors: UserMiniCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: colors.actionBg,
    color: colors.actionIcon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}
