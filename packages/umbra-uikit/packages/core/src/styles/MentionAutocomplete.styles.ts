/**
 * @module styles/MentionAutocomplete
 * @description Pure style-builder functions for the MentionAutocomplete component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface MentionAutocompleteColors {
  bg: string;
  border: string;
  itemBg: string;
  itemBgActive: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  /** Text color when item is active (on dark surface). */
  textActive: string;
  /** Muted text color when item is active (on dark surface). */
  textMutedActive: string;
  onlineDot: string;
  shadow: string;
}

export function resolveMentionAutocompleteColors(
  theme: WispTheme,
): MentionAutocompleteColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    itemBg: 'transparent',
    itemBgActive: colors.background.raised,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    textActive: colors.text.onRaised,
    textMutedActive: withAlpha(colors.text.onRaisedSecondary, 0.7),
    onlineDot: colors.status.success,
    shadow: theme.mode === 'light'
      ? 'rgba(0, 0, 0, 0.1)'
      : 'rgba(0, 0, 0, 0.4)',
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildMentionContainerStyle(
  colors: MentionAutocompleteColors,
  maxVisible: number,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    overflowY: 'auto',
    maxHeight: maxVisible * 44,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    boxShadow: `0 4px 16px ${colors.shadow}`,
    boxSizing: 'border-box',
    padding: 4,
  };
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export function buildMentionItemStyle(
  colors: MentionAutocompleteColors,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: radii.md,
    backgroundColor: active ? colors.itemBgActive : colors.itemBg,
    cursor: 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    minHeight: 36,
    boxSizing: 'border-box',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Avatar wrapper
// ---------------------------------------------------------------------------

export function buildMentionAvatarWrapperStyle(): CSSStyleObject {
  return {
    position: 'relative',
    flexShrink: 0,
  };
}

export function buildMentionOnlineDotStyle(
  colors: MentionAutocompleteColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.onlineDot,
    border: `1.5px solid ${colors.bg}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export function buildMentionNameStyle(
  colors: MentionAutocompleteColors,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: active ? colors.textActive : colors.text,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

export function buildMentionUsernameStyle(
  colors: MentionAutocompleteColors,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: active ? colors.textMutedActive : colors.textMuted,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Empty / Loading
// ---------------------------------------------------------------------------

export function buildMentionEmptyStyle(
  colors: MentionAutocompleteColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.textMuted,
    padding: `${spacing.sm}px ${spacing.md}px`,
    textAlign: 'center',
  };
}
