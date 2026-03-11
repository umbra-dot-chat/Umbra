/**
 * @module styles/ChannelHeader
 * @description Pure style-builder functions for the ChannelHeader component.
 *
 * A horizontal header bar displayed at the top of an active channel view.
 * Shows the channel name, type icon, topic text, and action buttons.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface ChannelHeaderColors {
  /** Header background. */
  bg: string;
  /** Bottom border. */
  border: string;
  /** Channel name text. */
  nameText: string;
  /** Topic text (secondary). */
  topicText: string;
  /** Channel type icon color. */
  iconColor: string;
  /** Action button default color. */
  actionColor: string;
  /** Action button hover background. */
  actionHoverBg: string;
  /** Action button active/toggled color. */
  actionActiveColor: string;
  /** Divider between info area and actions. */
  divider: string;
  /** Skeleton placeholder color. */
  skeleton: string;
}

export function resolveChannelHeaderColors(
  theme: WispTheme,
): ChannelHeaderColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    nameText: colors.text.primary,
    topicText: colors.text.secondary,
    iconColor: colors.text.muted,
    actionColor: colors.text.secondary,
    actionHoverBg: withAlpha(colors.text.primary, 0.06),
    actionActiveColor: colors.text.primary,
    divider: colors.border.subtle,
    skeleton: colors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// 1. Root container
// ---------------------------------------------------------------------------

export function buildChannelHeaderStyle(
  colors: ChannelHeaderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    minHeight: 48,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    boxSizing: 'border-box',
    width: '100%',
    flexShrink: 0,
    gap: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// 2. Name container (icon + name + badges)
// ---------------------------------------------------------------------------

export function buildNameContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// 3. Channel name text
// ---------------------------------------------------------------------------

export function buildNameStyle(
  colors: ChannelHeaderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.base.fontSize,
    lineHeight: `${typography.sizes.base.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.nameText,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// 4. Topic text
// ---------------------------------------------------------------------------

export function buildTopicStyle(
  colors: ChannelHeaderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.topicText,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
    paddingLeft: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// 5. Divider between info area and actions
// ---------------------------------------------------------------------------

export function buildDividerStyle(
  colors: ChannelHeaderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
    flexShrink: 0,
    marginLeft: spacing.xs,
    marginRight: spacing.xs,
  };
}

// ---------------------------------------------------------------------------
// 6. Actions container
// ---------------------------------------------------------------------------

export function buildActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['2xs'],
    flexShrink: 0,
    marginLeft: 'auto',
  };
}

// ---------------------------------------------------------------------------
// 7. Action button
// ---------------------------------------------------------------------------

export function buildActionButtonStyle(
  colors: ChannelHeaderColors,
  active: boolean,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: active ? colors.actionHoverBg : 'transparent',
    color: active ? colors.actionActiveColor : colors.actionColor,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    padding: 0,
    flexShrink: 0,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 8. Indicator icon (lock, clock)
// ---------------------------------------------------------------------------

export function buildIndicatorIconStyle(
  colors: ChannelHeaderColors,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: colors.iconColor,
  };
}

// ---------------------------------------------------------------------------
// 9. Skeleton styles
// ---------------------------------------------------------------------------

export function buildSkeletonNameStyle(
  colors: ChannelHeaderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    height: 16,
    width: 120,
    borderRadius: radii.sm,
    backgroundColor: colors.skeleton,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

export function buildSkeletonTopicStyle(
  colors: ChannelHeaderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    height: 12,
    width: 200,
    borderRadius: radii.sm,
    backgroundColor: colors.skeleton,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
    flex: 1,
    maxWidth: 200,
  };
}

export function buildSkeletonActionStyle(
  colors: ChannelHeaderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    height: 24,
    width: 24,
    borderRadius: radii.md,
    backgroundColor: colors.skeleton,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
