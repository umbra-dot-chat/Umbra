/**
 * @module styles/ThemePreview
 * @description Pure style-builder functions for the ThemePreview component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface ThemePreviewColors {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  sunken: string;
  channelBg: string;
  messageBg: string;
}

export function resolveThemePreviewColors(theme: WispTheme): ThemePreviewColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    cardBg: colors.background.surface,
    border: colors.border.subtle,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    sunken: colors.background.sunken,
    channelBg: colors.background.sunken,
    messageBg: colors.background.surface,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildThemePreviewContainerStyle(
  colors: ThemePreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.cardBg,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 400,
    minHeight: 280,
  };
}

export function buildThemePreviewHeaderStyle(
  accentColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    backgroundColor: accentColor,
    color: '#ffffff',
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm.fontSize,
    flexShrink: 0,
  };
}

export function buildThemePreviewIconStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  };
}

export function buildThemePreviewBodyStyle(
  colors: ThemePreviewColors,
): CSSStyleObject {
  return {
    display: 'flex',
    flex: 1,
  };
}

export function buildThemePreviewChannelListStyle(
  colors: ThemePreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: spacing.sm,
    width: 120,
    backgroundColor: colors.channelBg,
    borderRight: `1px solid ${colors.border}`,
    flexShrink: 0,
  };
}

export function buildThemePreviewChannelItemStyle(
  colors: ThemePreviewColors,
  active: boolean,
  accentColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing, radii } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: active ? accentColor : colors.textSecondary,
    fontWeight: active ? typography.weights.semibold : typography.weights.regular,
    padding: `${spacing['2xs']}px ${spacing.xs}px`,
    borderRadius: radii.sm,
    backgroundColor: active ? colors.bg : 'transparent',
    cursor: 'default',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

export function buildThemePreviewMessageAreaStyle(
  colors: ThemePreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    padding: spacing.sm,
    flex: 1,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  };
}

export function buildThemePreviewMessageStyle(
  colors: ThemePreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    gap: spacing.xs,
    alignItems: 'flex-start',
  };
}

export function buildThemePreviewMessageAvatarStyle(
  accentColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    backgroundColor: accentColor,
    opacity: 0.7,
    flexShrink: 0,
  };
}

export function buildThemePreviewMessageContentStyle(
  colors: ThemePreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  };
}

export function buildThemePreviewMessageAuthorStyle(
  accentColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: accentColor,
  };
}

export function buildThemePreviewMessageTextStyle(
  colors: ThemePreviewColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: colors.textSecondary,
    lineHeight: 1.4,
  };
}

export function buildThemePreviewSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    maxWidth: 400,
    height: 280,
    borderRadius: radii.lg,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
