/**
 * @module ActivityFeed
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ActivityFeedSizeConfig } from '../types/ActivityFeed.types';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export function buildFeedContainerStyle(): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'column',
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Item wrapper
// ---------------------------------------------------------------------------

export function buildFeedItemStyle(
  sizeConfig: ActivityFeedSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: sizeConfig.gap,
    position: 'relative',
    padding: `${spacing.md}px 0`,
  };
}

// ---------------------------------------------------------------------------
// Avatar / Icon circle
// ---------------------------------------------------------------------------

export function buildFeedAvatarStyle(
  sizeConfig: ActivityFeedSizeConfig,
  theme: WispTheme,
  iconColor?: string,
): CSSStyleObject {
  const { colors: themeColors, radii, typography } = theme;
  return {
    width: sizeConfig.avatarSize,
    height: sizeConfig.avatarSize,
    borderRadius: radii.full,
    backgroundColor: iconColor || themeColors.accent.highlight,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
    color: themeColors.text.secondary,
    fontSize: sizeConfig.secondaryFontSize,
    fontWeight: typography.weights.semibold,
    position: 'relative',
    zIndex: 1,
  };
}

// ---------------------------------------------------------------------------
// Connector line
// ---------------------------------------------------------------------------

export function buildFeedConnectorStyle(
  sizeConfig: ActivityFeedSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'absolute',
    left: sizeConfig.avatarSize / 2 - sizeConfig.lineWidth / 2,
    top: sizeConfig.avatarSize + 12,
    bottom: -12,
    width: sizeConfig.lineWidth,
    backgroundColor: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Content text
// ---------------------------------------------------------------------------

export function buildFeedContentStyle(
  sizeConfig: ActivityFeedSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    fontSize: sizeConfig.primaryFontSize,
    lineHeight: 1.5,
    color: themeColors.text.primary,
    margin: 0,
  };
}

export function buildFeedTimestampStyle(
  sizeConfig: ActivityFeedSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    fontSize: sizeConfig.secondaryFontSize,
    lineHeight: 1.4,
    color: themeColors.text.muted,
    margin: 0,
    marginTop: spacing['2xs'],
  };
}
