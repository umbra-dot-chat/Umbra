/**
 * @module MemberSearchFilter
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export interface MemberSearchFilterColors {
  bg: string;
  text: string;
  textMuted: string;
  border: string;
  badgeBg: string;
  badgeText: string;
}

export function resolveMemberSearchFilterColors(theme: WispTheme): MemberSearchFilterColors {
  const { colors: c } = theme;
  return {
    bg: c.background.surface,
    text: c.text.primary,
    textMuted: c.text.muted,
    border: c.border.subtle,
    badgeBg: c.background.sunken,
    badgeText: c.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildMemberSearchFilterContainerStyle(
  colors: MemberSearchFilterColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: '100%',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Input wrapper
// ---------------------------------------------------------------------------

export function buildMemberSearchFilterInputWrapperStyle(): CSSStyleObject {
  return {
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// Result count badge
// ---------------------------------------------------------------------------

export function buildMemberSearchFilterBadgeStyle(
  colors: MemberSearchFilterColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
    minWidth: 20,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: theme.radii.full,
    backgroundColor: colors.badgeBg,
    color: colors.badgeText,
    fontSize: 11,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: 500,
    lineHeight: 1,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function buildMemberSearchFilterSkeletonStyle(
  colors: MemberSearchFilterColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    width: '100%',
  };
}
