/**
 * @module components/achievement-unlock
 * @description Style builders for the Wisp AchievementUnlock component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { AchievementRarity } from '../types/AchievementCard.types';
import { achievementRarityMap } from '../types/AchievementCard.types';
import { fontFamilyStacks } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export function buildAchievementUnlockOverlayStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: zIndex.toast,
    backgroundColor: themeColors.background.overlay,
    animation: 'wisp-achievement-panel-in 300ms ease-out',
  };
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function buildAchievementUnlockPanelStyle(
  theme: WispTheme,
  rarity: AchievementRarity,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  const rarityConfig = achievementRarityMap[rarity];
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing['2xl']}px ${spacing['2xl']}px`,
    backgroundColor: themeColors.background.canvas,
    border: `1px solid ${themeColors.border.subtle}`,
    borderTop: `3px solid ${rarityConfig.color}`,
    borderRadius: radii.lg,
    fontFamily: fontFamilyStacks.sans,
    maxWidth: 400,
    width: '90%',
    boxShadow: '0 16px 48px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Icon container
// ---------------------------------------------------------------------------

export function buildAchievementUnlockIconStyle(
  rarityColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: `${rarityColor}1A`,
    color: rarityColor,
    animation: 'wisp-achievement-icon-in 500ms ease-out',
  };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

export function buildAchievementUnlockTitleStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.lg.fontSize,
    fontWeight: typography.weights.bold,
    lineHeight: 1.3,
    color: themeColors.text.primary,
    margin: 0,
    animation: 'wisp-achievement-text-in 400ms ease-out 200ms both',
  };
}

// ---------------------------------------------------------------------------
// Description
// ---------------------------------------------------------------------------

export function buildAchievementUnlockDescriptionStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.5,
    color: themeColors.text.secondary,
    margin: 0,
    animation: 'wisp-achievement-text-in 400ms ease-out 300ms both',
  };
}

// ---------------------------------------------------------------------------
// Rarity label
// ---------------------------------------------------------------------------

export function buildAchievementUnlockRarityStyle(
  rarityColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.bold,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: rarityColor,
    animation: 'wisp-achievement-text-in 400ms ease-out 100ms both',
  };
}

// ---------------------------------------------------------------------------
// Close button
// ---------------------------------------------------------------------------

export function buildAchievementUnlockCloseStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    position: 'absolute',
    top: 10,
    right: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    border: 'none',
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    color: themeColors.text.muted,
    cursor: 'pointer',
  };
}

// ---------------------------------------------------------------------------
// Action button
// ---------------------------------------------------------------------------

export function buildAchievementUnlockActionStyle(
  rarityColor: string,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.sm}px ${spacing.xl}px`,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1,
    borderRadius: radii.md,
    border: 'none',
    backgroundColor: rarityColor,
    color: themeColors.text.inverse,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    marginTop: spacing.xs,
    animation: 'wisp-achievement-text-in 400ms ease-out 400ms both',
  };
}
