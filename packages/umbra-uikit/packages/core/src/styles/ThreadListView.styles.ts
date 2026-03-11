/**
 * @module ThreadListView.styles
 * @description Style builders for the Wisp ThreadListView component.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { WispTheme } from '../theme/types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds the style for the ThreadListView outer container.
 */
export function buildThreadListContainerStyle(theme: WispTheme): CSSStyleObject {
  const { colors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.background.surface,
    border: `1px solid ${colors.border.subtle}`,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

/**
 * Builds the style for the header row (title + close button).
 */
export function buildHeaderStyle(theme: WispTheme): CSSStyleObject {
  const { colors, spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.border.subtle}`,
  };
}

/**
 * Builds the style for the header title text.
 */
export function buildHeaderTitleStyle(theme: WispTheme): CSSStyleObject {
  const { typography, colors } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.base.fontSize,
    lineHeight: `${typography.sizes.base.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    margin: 0,
  };
}

/**
 * Builds the style for the header close button.
 */
export function buildCloseButtonStyle(theme: WispTheme): CSSStyleObject {
  const { colors } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: colors.text.secondary,
    borderRadius: theme.radii.sm,
    width: 28,
    height: 28,
  };
}

// ---------------------------------------------------------------------------
// Thread card
// ---------------------------------------------------------------------------

/**
 * Builds the style for a single thread card.
 */
export function buildThreadCardStyle(
  theme: WispTheme,
  hovered: boolean,
  hasUnread: boolean,
): CSSStyleObject {
  const { colors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.border.subtle}`,
    cursor: 'pointer',
    backgroundColor: hovered ? colors.accent.highlight : 'transparent',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    borderLeft: hasUnread ? `3px solid ${colors.accent.primary}` : '3px solid transparent',
  };
}

// ---------------------------------------------------------------------------
// Parent preview section
// ---------------------------------------------------------------------------

/**
 * Builds the style for the sender row (avatar + name).
 */
export function buildSenderRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };
}

/**
 * Builds the style for the sender name text.
 */
export function buildSenderNameStyle(theme: WispTheme): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  };
}

/**
 * Builds the style for the parent message preview text.
 */
export function buildPreviewTextStyle(theme: WispTheme): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Metadata row
// ---------------------------------------------------------------------------

/**
 * Builds the style for the metadata row (reply count, timestamp, follow).
 */
export function buildMetadataRowStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing['2xs'],
  };
}

/**
 * Builds the style for the reply count badge text.
 */
export function buildReplyCountBadgeStyle(theme: WispTheme): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: colors.text.link,
  };
}

/**
 * Builds the style for the last activity timestamp.
 */
export function buildActivityTimestampStyle(theme: WispTheme): CSSStyleObject {
  const { colors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: colors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

/**
 * Builds the style for the empty state container.
 */
export function buildEmptyStateStyle(theme: WispTheme): CSSStyleObject {
  const { colors, spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing['2xl']}px ${spacing.lg}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: colors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * Builds the style for a skeleton thread card.
 */
export function buildSkeletonCardStyle(theme: WispTheme): CSSStyleObject {
  const { colors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${colors.border.subtle}`,
  };
}

/**
 * Builds the style for a skeleton line.
 */
export function buildSkeletonLineStyle(
  theme: WispTheme,
  width: string | number,
  height: number,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    width,
    height,
    borderRadius: radii.sm,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
