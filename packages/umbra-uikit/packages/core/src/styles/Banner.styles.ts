/**
 * @module Banner
 */
import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { BannerVariant } from '../types/Banner.types';

// ---------------------------------------------------------------------------
// Variant colors
// ---------------------------------------------------------------------------

export interface BannerColors {
  bg: string;
  text: string;
  border: string;
  icon: string;
}

export function resolveBannerColors(
  variant: BannerVariant,
  theme: WispTheme,
): BannerColors {
  const { colors: themeColors } = theme;
  switch (variant) {
    case 'info':
      return {
        bg: themeColors.status.infoSurface,
        text: themeColors.text.primary,
        border: themeColors.status.infoBorder,
        icon: themeColors.status.info,
      };
    case 'success':
      return {
        bg: themeColors.status.successSurface,
        text: themeColors.text.primary,
        border: themeColors.status.successBorder,
        icon: themeColors.status.success,
      };
    case 'warning':
      return {
        bg: themeColors.status.warningSurface,
        text: themeColors.text.primary,
        border: themeColors.status.warningBorder,
        icon: themeColors.status.warning,
      };
    case 'danger':
      return {
        bg: themeColors.status.dangerSurface,
        text: themeColors.text.primary,
        border: themeColors.status.dangerBorder,
        icon: themeColors.status.danger,
      };
    case 'default':
    default:
      return {
        bg: themeColors.background.surface,
        text: themeColors.text.onRaised,
        border: themeColors.border.strong,
        icon: themeColors.text.onRaisedSecondary,
      };
  }
}

// ---------------------------------------------------------------------------
// Container style
// ---------------------------------------------------------------------------

export function buildBannerStyle(
  colors: BannerColors,
  fullWidth: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderRadius: fullWidth ? radii.none : radii.lg,
    backgroundColor: colors.bg,
    border: `1px solid ${colors.border}`,
    fontFamily: fontFamilyStacks.sans,
    boxSizing: 'border-box',
    width: fullWidth ? '100%' : undefined,
  };
}

// ---------------------------------------------------------------------------
// Text styles
// ---------------------------------------------------------------------------

export function buildBannerTitleStyle(
  colors: BannerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    lineHeight: 1.4,
    color: colors.text,
    margin: 0,
  };
}

export function buildBannerMessageStyle(
  colors: BannerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1.5,
    color: colors.text,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Dismiss button style
// ---------------------------------------------------------------------------

export function buildBannerDismissStyle(
  colors: BannerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    height: 20,
    padding: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: colors.icon,
    flexShrink: 0,
    borderRadius: radii.sm,
  };
}
