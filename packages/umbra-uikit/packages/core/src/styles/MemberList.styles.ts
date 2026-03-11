/**
 * @module styles/MemberList
 * @description Pure style-builder functions for the MemberList component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface MemberListColors {
  bg: string;
  border: string;
  headerText: string;
  headerTextMuted: string;
  closeHoverBg: string;
  sectionLabel: string;
  memberText: string;
  memberTextSecondary: string;
  memberHoverBg: string;
  statusOnline: string;
  statusIdle: string;
  statusDnd: string;
  statusOffline: string;
  loadingText: string;
}

export function resolveMemberListColors(
  theme: WispTheme,
): MemberListColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    headerText: colors.text.primary,
    headerTextMuted: colors.text.muted,
    closeHoverBg: withAlpha(colors.text.primary, 0.08),
    sectionLabel: colors.text.muted,
    memberText: colors.text.primary,
    memberTextSecondary: colors.text.secondary,
    memberHoverBg: withAlpha(colors.text.primary, 0.06),
    statusOnline: colors.status.success,
    statusIdle: colors.status.warning,
    statusDnd: colors.status.danger,
    statusOffline: colors.text.muted,
    loadingText: colors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Panel container
// ---------------------------------------------------------------------------

export function buildMemberListContainerStyle(
  colors: MemberListColors,
  _theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg,
    borderLeft: `1px solid ${colors.border}`,
    boxSizing: 'border-box',
    minWidth: 240,
    maxWidth: 300,
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

export function buildMemberListHeaderStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    flexShrink: 0,
    minHeight: 48,
    boxSizing: 'border-box',
  };
}

export function buildMemberListTitleStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.headerText,
    margin: 0,
  };
}

export function buildMemberListCloseStyle(
  colors: MemberListColors,
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
    backgroundColor: 'transparent',
    color: colors.headerTextMuted,
    cursor: 'pointer',
    padding: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Body (scrollable)
// ---------------------------------------------------------------------------

export function buildMemberListBodyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    padding: `${spacing.xs}px 0`,
    minHeight: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Section header (collapsible)
// ---------------------------------------------------------------------------

export function buildSectionHeaderStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs}px ${spacing.md}px`,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildSectionLabelStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: 0,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Member item
// ---------------------------------------------------------------------------

export function buildMemberItemStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.md}px`,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: radii.sm,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
    // Adjust width for side margins
    maxWidth: `calc(100% - ${spacing.xs * 2}px)`,
    textAlign: 'left',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildMemberNameStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.memberText,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
  };
}

export function buildMemberRoleTextStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.memberTextSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

export function buildMemberStatusDotStyle(
  status: 'online' | 'idle' | 'dnd' | 'offline' | undefined,
  colors: MemberListColors,
  _theme: WispTheme,
): CSSStyleObject {
  let dotColor: string;
  switch (status) {
    case 'online':
      dotColor = colors.statusOnline;
      break;
    case 'idle':
      dotColor = colors.statusIdle;
      break;
    case 'dnd':
      dotColor = colors.statusDnd;
      break;
    case 'offline':
    default:
      dotColor = colors.statusOffline;
      break;
  }

  return {
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: dotColor,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

export function buildMemberListLoadingStyle(
  colors: MemberListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xl}px`,
    flex: 1,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    color: colors.loadingText,
  };
}
