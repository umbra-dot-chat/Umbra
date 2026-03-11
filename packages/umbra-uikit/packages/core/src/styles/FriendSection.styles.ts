/**
 * @module styles/FriendSection
 * @description Pure style-builder functions for the FriendSection component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface FriendSectionColors {
  headerText: string;
  countText: string;
  countBg: string;
  chevron: string;
  emptyText: string;
  border: string;
}

export function resolveFriendSectionColors(
  theme: WispTheme,
): FriendSectionColors {
  const { colors: themeColors } = theme;
  return {
    headerText: themeColors.text.secondary,
    countText: themeColors.text.inverse,
    countBg: themeColors.background.surface,
    chevron: themeColors.text.muted,
    emptyText: themeColors.text.muted,
    border: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Header row
// ---------------------------------------------------------------------------

export function buildFriendSectionHeaderStyle(
  colors: FriendSectionColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    cursor: 'pointer',
    userSelect: 'none',
  };
}

export function buildFriendSectionTitleStyle(
  colors: FriendSectionColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.headerText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };
}

export function buildFriendSectionCountStyle(
  colors: FriendSectionColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.countText,
    backgroundColor: colors.countBg,
    borderRadius: radii.full,
    paddingLeft: 6,
    paddingRight: 6,
    minWidth: 20,
    textAlign: 'center',
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildFriendSectionEmptyStyle(
  colors: FriendSectionColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.emptyText,
    padding: `${spacing.lg}px ${spacing.md}px`,
    textAlign: 'center',
  };
}
