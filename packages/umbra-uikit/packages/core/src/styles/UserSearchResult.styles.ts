/**
 * @module styles/UserSearchResult
 * @description Pure style-builder functions for the UserSearchResult component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface UserSearchResultColors {
  bg: string;
  bgHover: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  btnBgSend: string;
  btnTextSend: string;
  btnBgPending: string;
  btnTextPending: string;
  btnBgFriends: string;
  btnTextFriends: string;
}

export function resolveUserSearchResultColors(
  theme: WispTheme,
): UserSearchResultColors {
  const { colors: themeColors } = theme;
  return {
    bg: 'transparent',
    bgHover: themeColors.background.raised,
    text: themeColors.text.primary,
    textSecondary: themeColors.text.secondary,
    textMuted: themeColors.text.muted,
    border: themeColors.border.subtle,
    btnBgSend: themeColors.accent.primary,
    btnTextSend: themeColors.text.inverse,
    btnBgPending: themeColors.background.sunken,
    btnTextPending: themeColors.text.muted,
    btnBgFriends: themeColors.background.sunken,
    btnTextFriends: themeColors.status.success,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildUserSearchResultStyle(
  colors: UserSearchResultColors,
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
// Action button
// ---------------------------------------------------------------------------

export function buildUserSearchResultButtonStyle(
  colors: UserSearchResultColors,
  state: 'none' | 'pending' | 'friends',
  theme: WispTheme,
): CSSStyleObject {
  const { radii, typography } = theme;
  const bgMap = { none: colors.btnBgSend, pending: colors.btnBgPending, friends: colors.btnBgFriends };
  const textMap = { none: colors.btnTextSend, pending: colors.btnTextPending, friends: colors.btnTextFriends };

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    height: 32,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: bgMap[state],
    color: textMap[state],
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    cursor: state === 'none' ? 'pointer' : 'default',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };
}
