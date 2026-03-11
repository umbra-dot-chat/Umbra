/**
 * @module styles/UserProfileCard
 * @description Pure style-builder functions for the UserProfileCard component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { UserStatus } from '../types/UserProfileCard.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';
import { withAlpha } from '../tokens/color-utils';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface UserProfileCardColors {
  /** Card background — sits on surface (always dark). */
  bg: string;
  /** Border around the card. */
  border: string;
  /** Primary text (name) on the dark surface. */
  text: string;
  /** Secondary text (username, status text) on the dark surface. */
  textSecondary: string;
  /** Muted text (bio, metadata) on the dark surface. */
  textMuted: string;
  /** Divider line on the dark surface. */
  divider: string;
  /** Close button text color. */
  closeText: string;
  /** Close button hover background. */
  closeHoverBg: string;
  /** Action button background. */
  actionBg: string;
  /** Action button hover background. */
  actionBgHover: string;
  /** Action button text color. */
  actionText: string;
  /** Action button border. */
  actionBorder: string;
  /** Default role badge background (when no custom color). */
  roleBgDefault: string;
  /** Default role badge text (when no custom color). */
  roleTextDefault: string;
  /** Online status dot color. */
  statusOnline: string;
  /** Idle status dot color. */
  statusIdle: string;
  /** Do-not-disturb status dot color. */
  statusDnd: string;
  /** Offline status dot color. */
  statusOffline: string;
  /** Default banner color when no image or explicit color is provided. */
  bannerDefault: string;
  /** Default avatar background (visible against both banner and card bg). */
  avatarBg: string;
  /** Avatar ring/border color — creates a cut-out effect against the banner. */
  avatarRing: string;
}

export function resolveUserProfileCardColors(
  theme: WispTheme,
): UserProfileCardColors {
  const { colors } = theme;
  return {
    bg: colors.background.surface,
    border: colors.accent.dividerRaised,
    text: colors.text.onRaised,
    textSecondary: colors.text.onRaisedSecondary,
    textMuted: withAlpha(colors.text.onRaisedSecondary, 0.7),
    divider: colors.accent.dividerRaised,
    closeText: colors.text.onRaisedSecondary,
    closeHoverBg: withAlpha(colors.text.onRaised, 0.08),
    actionBg: 'transparent',
    actionBgHover: withAlpha(colors.text.onRaised, 0.08),
    actionText: colors.text.onRaisedSecondary,
    actionBorder: colors.accent.dividerRaised,
    roleBgDefault: withAlpha(colors.text.onRaisedSecondary, 0.12),
    roleTextDefault: colors.text.onRaisedSecondary,
    statusOnline: colors.status.success,
    statusIdle: colors.status.warning,
    statusDnd: colors.status.danger,
    statusOffline: colors.text.muted,
    bannerDefault: colors.background.raised,
    avatarBg: withAlpha(colors.text.onRaised, 0.18),
    avatarRing: colors.background.surface,
  };
}

// ---------------------------------------------------------------------------
// Card container
// ---------------------------------------------------------------------------

export function buildUserProfileCardContainerStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, shadows } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: 340,
    borderRadius: radii.lg,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.lg,
    overflow: 'hidden',
    boxSizing: 'border-box',
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Banner
// ---------------------------------------------------------------------------

export function buildBannerStyle(
  colors: UserProfileCardColors,
  bannerUrl: string | undefined,
  bannerColor: string | undefined,
  theme: WispTheme,
): CSSStyleObject {
  const bgColor = bannerColor ?? colors.bannerDefault;
  return {
    width: '100%',
    height: 60,
    flexShrink: 0,
    backgroundColor: bgColor,
    backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Avatar area (overlaps banner)
// ---------------------------------------------------------------------------

export function buildAvatarAreaStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    position: 'relative',
    marginTop: -24,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    display: 'flex',
    alignItems: 'flex-end',
    zIndex: 1,
  };
}

// ---------------------------------------------------------------------------
// Avatar wrapper — ring around the avatar for visual separation from banner
// ---------------------------------------------------------------------------

export function buildAvatarWrapperStyle(
  colors: UserProfileCardColors,
  _theme: WispTheme,
): CSSStyleObject {
  return {
    position: 'relative',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: colors.avatarRing,
    border: `4px solid ${colors.avatarRing}`,
    boxSizing: 'content-box',
  };
}

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

export function buildStatusDotStyle(
  status: UserStatus,
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const statusColorMap: Record<UserStatus, string> = {
    online: colors.statusOnline,
    idle: colors.statusIdle,
    dnd: colors.statusDnd,
    offline: colors.statusOffline,
  };

  return {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: statusColorMap[status],
    border: `3px solid ${colors.bg}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Profile info section
// ---------------------------------------------------------------------------

export function buildProfileInfoStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    padding: `${spacing.sm}px ${spacing.md}px ${spacing.md}px`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Name
// ---------------------------------------------------------------------------

export function buildNameStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.base.fontSize,
    lineHeight: `${typography.sizes.base.lineHeight}px`,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Username
// ---------------------------------------------------------------------------

export function buildUsernameStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Status text
// ---------------------------------------------------------------------------

export function buildStatusTextStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textMuted,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Bio
// ---------------------------------------------------------------------------

export function buildBioStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.regular,
    color: colors.textSecondary,
    margin: 0,
    padding: `${spacing.sm}px 0`,
    wordBreak: 'break-word',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 3,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Roles container
// ---------------------------------------------------------------------------

export function buildRolesContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
    padding: `${spacing.sm}px ${spacing.md}px`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Individual role badge
// ---------------------------------------------------------------------------

export function buildRoleBadgeStyle(
  color: string | undefined,
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii } = theme;
  const badgeBg = color ? withAlpha(color, 0.15) : colors.roleBgDefault;
  const badgeText = color ?? colors.roleTextDefault;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '2px 8px',
    borderRadius: radii.full,
    backgroundColor: badgeBg,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes['2xs'].fontSize,
    lineHeight: `${typography.sizes['2xs'].lineHeight}px`,
    fontWeight: typography.weights.medium,
    color: badgeText,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export function buildDividerStyle(
  colors: UserProfileCardColors,
): CSSStyleObject {
  return {
    width: '100%',
    height: 1,
    backgroundColor: colors.divider,
    flexShrink: 0,
    border: 'none',
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Actions container
// ---------------------------------------------------------------------------

export function buildActionsContainerStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderTop: `1px solid ${colors.divider}`,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Individual action button
// ---------------------------------------------------------------------------

export function buildActionButtonStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, radii, spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flex: 1,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: radii.md,
    border: `1px solid ${colors.actionBorder}`,
    backgroundColor: colors.actionBg,
    color: colors.actionText,
    fontFamily: fontFamilyStacks.sans,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

export function buildCloseButtonStyle(
  colors: UserProfileCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    position: 'absolute',
    top: 8,
    right: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.closeText,
    cursor: 'pointer',
    padding: 0,
    zIndex: 2,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

export function buildSkeletonContainerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { radii, shadows, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: 340,
    borderRadius: radii.lg,
    backgroundColor: theme.colors.background.surface,
    border: `1px solid ${theme.colors.accent.dividerRaised}`,
    boxShadow: shadows.lg,
    overflow: 'hidden',
    boxSizing: 'border-box',
    gap: spacing.sm,
  };
}
