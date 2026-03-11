/**
 * @module styles/CommunitySidebar
 * @description Pure style-builder functions for the CommunitySidebar component.
 *
 * Provides a community header, horizontal space tab strip, and delegates
 * channel rendering to the ChannelList component. All colours come from
 * the theme so it adapts automatically to light/dark mode.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface CommunitySidebarColors {
  /** Panel background. */
  bg: string;
  /** Border between regions. */
  border: string;
  /** Community header background. */
  headerBg: string;
  /** Community name text. */
  headerText: string;
  /** Subtitle / member count text. */
  headerSubtext: string;
  /** Space tab inactive text. */
  tabText: string;
  /** Space tab active text. */
  tabTextActive: string;
  /** Space tab hover background. */
  tabHoverBg: string;
  /** Space tab active indicator bar. */
  tabIndicator: string;
  /** Tab strip bottom border. */
  tabBorder: string;
  /** Unread badge background. */
  badgeBg: string;
  /** Unread badge text. */
  badgeText: string;
}

export function resolveCommunitySidebarColors(
  theme: WispTheme,
): CommunitySidebarColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    headerBg: colors.background.canvas,
    headerText: colors.text.primary,
    headerSubtext: colors.text.muted,
    tabText: colors.text.muted,
    tabTextActive: colors.text.primary,
    tabHoverBg: withAlpha(colors.text.primary, 0.06),
    tabIndicator: colors.accent.primary,
    tabBorder: colors.border.subtle,
    badgeBg: colors.accent.primary,
    badgeText: colors.text.inverse,
  };
}

// ---------------------------------------------------------------------------
// 1. Root container
// ---------------------------------------------------------------------------

export function buildCommunitySidebarContainerStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg,
    boxSizing: 'border-box',
    overflow: 'hidden',
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// 2. Community header
// ---------------------------------------------------------------------------

export function buildCommunityHeaderStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.headerBg,
    flexShrink: 0,
    minHeight: 48,
    boxSizing: 'border-box',
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildCommunityNameStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.headerText,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
  };
}

export function buildCommunitySubtitleStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.headerSubtext,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// 3. Space tab strip
// ---------------------------------------------------------------------------

export function buildSpaceTabStripStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottom: `1px solid ${colors.tabBorder}`,
    flexShrink: 0,
    overflow: 'hidden',
    position: 'relative',
    padding: `0 ${spacing.sm}px`,
  };
}

export function buildSpaceTabScrollStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarWidth: 'none',
    flex: 1,
    minWidth: 0,
  };
}

export function buildSpaceTabStyle(
  colors: CommunitySidebarColors,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography, radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.md}px ${spacing.md}px`,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: active ? typography.weights.semibold : typography.weights.medium,
    color: active ? colors.tabTextActive : colors.tabText,
    position: 'relative',
    flexShrink: 0,
    borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}, background-color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
  };
}

export function buildSpaceTabIndicatorStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.tabIndicator,
    borderRadius: radii.sm,
  };
}

export function buildSpaceTabBadgeStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    padding: '0 4px',
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: 1,
    fontWeight: typography.weights.semibold,
    fontFamily: fontFamilyStacks.sans,
    backgroundColor: colors.badgeBg,
    color: colors.badgeText,
    flexShrink: 0,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 4. Channel list area (flex-grows to fill remaining space)
// ---------------------------------------------------------------------------

export function buildChannelListAreaStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// 5. Skeleton helpers
// ---------------------------------------------------------------------------

/** Skeleton wrapper for the community header area. */
export function buildCommunitySidebarSkeletonHeaderStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    minHeight: 48,
    boxSizing: 'border-box',
  };
}

/** Skeleton pill for text bars (header name, subtitle, etc.). */
export function buildCommunitySidebarSkeletonBarStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

/** Skeleton pill for a single space tab. */
export function buildCommunitySidebarSkeletonTabStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    height: 10,
    width: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    margin: `${spacing.sm}px ${spacing.xs}px`,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

/** Skeleton pill for a category label (short, uppercase-style). */
export function buildCommunitySidebarSkeletonCategoryStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    height: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    margin: `${spacing.sm}px ${spacing.md}px ${spacing.xs}px`,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

/** Skeleton row for a channel item (icon + name bar). */
export function buildCommunitySidebarSkeletonChannelRowStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs}px ${spacing.md}px`,
    margin: `1px ${spacing.sm}px`,
    borderRadius: radii.md,
    minHeight: 28,
    boxSizing: 'border-box',
  };
}

/** Skeleton circle/square for a channel type icon. */
export function buildCommunitySidebarSkeletonIconStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: 16,
    height: 16,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    flexShrink: 0,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

/** Skeleton bar for a channel name text. */
export function buildCommunitySidebarSkeletonChannelNameStyle(
  colors: CommunitySidebarColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
    flex: 1,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
