/**
 * @module styles/BrandingSettingsPage
 * @description Pure style-builder functions for the BrandingSettingsPage component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface BrandingSettingsPageColors {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  sectionBg: string;
  previewBg: string;
}

export function resolveBrandingSettingsPageColors(theme: WispTheme): BrandingSettingsPageColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    cardBg: colors.background.surface,
    border: colors.border.subtle,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    sectionBg: colors.background.sunken,
    previewBg: colors.background.sunken,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildBrandingSettingsPageContainerStyle(
  colors: BrandingSettingsPageColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    width: '100%',
    maxWidth: 720,
  };
}

export function buildBrandingSettingsPageHeaderStyle(
  colors: BrandingSettingsPageColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    fontSize: typography.sizes.xl.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  };
}

export function buildBrandingSettingsPageSectionStyle(
  colors: BrandingSettingsPageColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing, radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.cardBg,
    borderRadius: radii.lg,
    border: `1px solid ${colors.border}`,
  };
}

export function buildBrandingSettingsPageSectionTitleStyle(
  colors: BrandingSettingsPageColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  return {
    fontSize: typography.sizes.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  };
}

export function buildBrandingSettingsPageFieldStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xs,
  };
}

export function buildBrandingSettingsPageLabelStyle(
  colors: BrandingSettingsPageColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  };
}

export function buildBrandingSettingsPagePreviewStyle(
  colors: BrandingSettingsPageColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing } = theme;
  return {
    width: '100%',
    height: 120,
    borderRadius: radii.md,
    backgroundColor: colors.previewBg,
    border: `1px solid ${colors.border}`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };
}

export function buildBrandingSettingsPageColorPresetsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
  };
}

export function buildBrandingSettingsPageColorPresetStyle(
  color: string,
  active: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: color,
    border: active ? '2px solid white' : '2px solid transparent',
    boxShadow: active ? `0 0 0 2px ${color}` : 'none',
    cursor: 'pointer',
    flexShrink: 0,
  };
}

export function buildBrandingSettingsPageFooterStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: spacing.md,
  };
}

export function buildBrandingSettingsPageSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 720,
    backgroundColor: colors.border.subtle,
    borderRadius: radii.lg,
    height: 600,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
