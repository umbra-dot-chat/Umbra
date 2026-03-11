/**
 * @module components/achievement-card
 * @description Style builders for the Wisp AchievementCard component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { AchievementStatus, AchievementRarity } from '../types/AchievementCard.types';
import { achievementRarityMap } from '../types/AchievementCard.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Colour resolution
// ---------------------------------------------------------------------------

export interface AchievementCardColors {
  bg: string;
  border: string;
  text: string;
  descriptionText: string;
  iconBg: string;
  iconColor: string;
  rarityColor: string;
}

export function resolveAchievementColors(
  status: AchievementStatus,
  rarity: AchievementRarity,
  theme: WispTheme,
): AchievementCardColors {
  const { colors: themeColors } = theme;
  const rarityConfig = achievementRarityMap[rarity];

  if (status === 'locked') {
    return {
      bg: themeColors.background.canvas,
      border: themeColors.border.subtle,
      text: themeColors.text.muted,
      descriptionText: themeColors.text.muted,
      iconBg: themeColors.border.subtle,
      iconColor: themeColors.text.muted,
      rarityColor: themeColors.text.muted,
    };
  }

  return {
    bg: themeColors.background.canvas,
    border: themeColors.border.subtle,
    text: themeColors.text.primary,
    descriptionText: themeColors.text.secondary,
    iconBg: `${rarityConfig.color}1A`,
    iconColor: rarityConfig.color,
    rarityColor: rarityConfig.color,
  };
}

// ---------------------------------------------------------------------------
// Card container
// ---------------------------------------------------------------------------

export function buildAchievementCardStyle(
  colors: AchievementCardColors,
  status: AchievementStatus,
  clickable: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: `${spacing.lg}px ${spacing.lg}px`,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
    cursor: clickable ? 'pointer' : 'default',
    transition: `opacity ${durations.normal}ms ${easings.easeOut.css}, filter ${durations.normal}ms ${easings.easeOut.css}`,
    opacity: status === 'locked' ? 0.6 : 1,
    filter: status === 'locked' ? 'grayscale(0.8)' : 'none',
  };
}

// ---------------------------------------------------------------------------
// Icon container
// ---------------------------------------------------------------------------

export function buildAchievementIconStyle(
  colors: AchievementCardColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.iconBg,
    color: colors.iconColor,
  };
}

// ---------------------------------------------------------------------------
// Content area
// ---------------------------------------------------------------------------

export function buildAchievementContentStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

export function buildAchievementTitleStyle(
  textColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.43,
    color: textColor,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

export function buildAchievementDescriptionStyle(
  descriptionColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.46,
    color: descriptionColor,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

export function buildAchievementProgressTrackStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    width: '100%',
    height: 4,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    marginTop: spacing.xs,
    overflow: 'hidden',
  };
}

export function buildAchievementProgressBarStyle(
  rarityColor: string,
  progress: number,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: `${Math.min(Math.max(progress, 0), 100)}%`,
    height: '100%',
    borderRadius: radii.sm,
    backgroundColor: rarityColor,
    transition: `width ${durations.slow}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Rarity badge
// ---------------------------------------------------------------------------

export function buildAchievementRarityStyle(
  rarityColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.xs,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.semibold,
    color: rarityColor,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  };
}

// ---------------------------------------------------------------------------
// Date text
// ---------------------------------------------------------------------------

export function buildAchievementDateStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.regular,
    color: themeColors.text.muted,
    margin: 0,
  };
}
