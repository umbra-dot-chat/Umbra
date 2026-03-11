/**
 * @module styles/AddFriendInput
 * @description Pure style-builder functions for the AddFriendInput component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface AddFriendInputColors {
  bg: string;
  border: string;
  borderFocus: string;
  text: string;
  placeholder: string;
  btnBg: string;
  btnBgDisabled: string;
  btnText: string;
  btnTextDisabled: string;
  feedbackSuccess: string;
  feedbackError: string;
}

export function resolveAddFriendInputColors(
  theme: WispTheme,
): AddFriendInputColors {
  const { colors: themeColors } = theme;
  return {
    bg: 'transparent',
    border: themeColors.border.strong,
    borderFocus: themeColors.accent.primary,
    text: themeColors.text.primary,
    placeholder: themeColors.text.muted,
    btnBg: themeColors.accent.primary,
    btnBgDisabled: themeColors.background.raised,
    btnText: themeColors.text.inverse,
    btnTextDisabled: themeColors.text.muted,
    feedbackSuccess: themeColors.status.success,
    feedbackError: themeColors.status.danger,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildAddFriendInputContainerStyle(
  colors: AddFriendInputColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'solid',
    backgroundColor: colors.bg,
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}`,
    width: '100%',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export function buildAddFriendInputFieldStyle(
  colors: AddFriendInputColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    flex: 1,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.text,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    padding: 0,
  };
}

// ---------------------------------------------------------------------------
// Submit button
// ---------------------------------------------------------------------------

export function buildAddFriendInputButtonStyle(
  colors: AddFriendInputColors,
  hasContent: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    height: 32,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: hasContent ? colors.btnBg : colors.btnBgDisabled,
    color: hasContent ? colors.btnText : colors.btnTextDisabled,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    cursor: hasContent ? 'pointer' : 'default',
    flexShrink: 0,
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Feedback message
// ---------------------------------------------------------------------------

export function buildAddFriendInputFeedbackStyle(
  colors: AddFriendInputColors,
  state: 'success' | 'error' | 'idle' | 'loading',
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  const colorMap = {
    success: colors.feedbackSuccess,
    error: colors.feedbackError,
    idle: 'transparent',
    loading: colors.text,
  };
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colorMap[state],
    paddingTop: spacing.xs,
    paddingLeft: spacing.md,
  };
}
