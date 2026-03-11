/**
 * @module styles/ChannelList
 * @description Pure style-builder functions for the ChannelList component.
 *
 * A collapsible category-grouped channel list (Discord-style sidebar).
 * Sits on `background.canvas` and uses standard text tokens.
 *
 * Channel type icons:
 * - text = Hash (#)
 * - voice = Volume2 (speaker)
 * - announcement = Megaphone
 * - thread = MessageSquare
 * - forum = MessagesSquare
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface ChannelListColors {
  /** Panel background — canvas layer. */
  bg: string;
  /** Border separating the panel from adjacent content. */
  border: string;
  /** Header slot background. */
  headerBg: string;
  /** Header slot text. */
  headerText: string;
  /** Category label text (muted, uppercase). */
  categoryText: string;
  /** Category chevron icon. */
  categoryIcon: string;
  /** Category row hover background. */
  categoryHoverBg: string;
  /** Channel item default text (inactive). */
  channelText: string;
  /** Channel item active text. */
  channelTextActive: string;
  /** Channel item icon (inactive). */
  channelIcon: string;
  /** Channel item icon (active). */
  channelIconActive: string;
  /** Channel item hover background. */
  channelHoverBg: string;
  /** Channel item active/selected background. */
  channelActiveBg: string;
  /** Unread/mention badge background. */
  badgeBg: string;
  /** Unread/mention badge text. */
  badgeText: string;
  /** Loading/skeleton placeholder color. */
  skeleton: string;
}

export function resolveChannelListColors(
  theme: WispTheme,
): ChannelListColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    border: colors.border.subtle,
    headerBg: colors.background.canvas,
    headerText: colors.text.primary,
    categoryText: colors.text.muted,
    categoryIcon: colors.text.muted,
    categoryHoverBg: withAlpha(colors.text.primary, 0.06),
    channelText: colors.text.secondary,
    channelTextActive: colors.text.primary,
    channelIcon: colors.text.muted,
    channelIconActive: colors.text.primary,
    channelHoverBg: withAlpha(colors.text.primary, 0.06),
    channelActiveBg: colors.accent.highlight,
    badgeBg: colors.accent.primary,
    badgeText: colors.text.inverse,
    skeleton: colors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// 1. Panel container
// ---------------------------------------------------------------------------

export function buildChannelListContainerStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: colors.bg,
    boxSizing: 'border-box',
    overflowY: 'auto',
    overflowX: 'hidden',
    width: '100%',
  };
}

// ---------------------------------------------------------------------------
// 2. Header slot area
// ---------------------------------------------------------------------------

export function buildChannelListHeaderSlotStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.md}px ${spacing.md}px`,
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: colors.headerBg,
    flexShrink: 0,
    minHeight: 48,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// 3. Category header (clickable row)
// ---------------------------------------------------------------------------

export function buildCategoryHeaderStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    margin: `${spacing.sm}px ${spacing.sm}px 0`,
    borderRadius: radii.sm,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    textAlign: 'left',
    width: `calc(100% - ${spacing.sm * 2}px)`,
    boxSizing: 'border-box',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 3b. Category create-channel button (+)
// ---------------------------------------------------------------------------

export function buildCategoryCreateButtonStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: radii.sm,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.categoryIcon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    opacity: 0,
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 4. Category label (uppercase text)
// ---------------------------------------------------------------------------

export function buildCategoryLabelStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.categoryText,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// 5. Channel item row
// ---------------------------------------------------------------------------

export function buildChannelItemStyle(
  colors: ChannelListColors,
  active: boolean,
  muted: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.xs + 1}px ${spacing.sm}px`,
    margin: `1px ${spacing.sm}px`,
    borderRadius: radii.md,
    backgroundColor: active ? colors.channelActiveBg : 'transparent',
    cursor: 'pointer',
    userSelect: 'none',
    opacity: muted && !active ? 0.5 : 1,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, opacity ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
    minHeight: 32,
    width: `calc(100% - ${spacing.sm * 2}px)`,
  };
}

// ---------------------------------------------------------------------------
// 6. Channel type icon
// ---------------------------------------------------------------------------

export function buildChannelIconStyle(
  colors: ChannelListColors,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 18,
    height: 18,
    color: active ? colors.channelIconActive : colors.channelIcon,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 7. Channel name text
// ---------------------------------------------------------------------------

export function buildChannelNameStyle(
  colors: ChannelListColors,
  active: boolean,
  hasUnread: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: active || hasUnread
      ? typography.weights.semibold
      : typography.weights.regular,
    color: active ? colors.channelTextActive : colors.channelText,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    minWidth: 0,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// 8. Unread / mention badge
// ---------------------------------------------------------------------------

export function buildChannelBadgeStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    padding: '0 5px',
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
// 9. Loading state
// ---------------------------------------------------------------------------

export function buildChannelListLoadingStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xl}px`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    color: colors.categoryText,
  };
}

// ---------------------------------------------------------------------------
// Skeleton helpers
// ---------------------------------------------------------------------------

export function buildChannelListSkeletonCategoryStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    height: 10,
    width: '40%',
    borderRadius: radii.sm,
    backgroundColor: colors.skeleton,
    margin: `${spacing.sm}px ${spacing.md}px ${spacing.xs}px`,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}

export function buildChannelListSkeletonItemStyle(
  colors: ChannelListColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    height: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.skeleton,
    margin: `${spacing.xs}px ${spacing.md}px`,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
