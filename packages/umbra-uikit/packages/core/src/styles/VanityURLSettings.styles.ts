/**
 * @module styles/VanityURLSettings
 * @description Pure style-builder functions for the VanityURLSettings component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import type { VanityUrlAvailability } from '../types/VanityURLSettings.types';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface VanityURLSettingsColors {
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  available: string;
  taken: string;
  checking: string;
  invalid: string;
}

export function resolveVanityURLSettingsColors(theme: WispTheme): VanityURLSettingsColors {
  const { colors } = theme;
  return {
    bg: colors.background.canvas,
    cardBg: colors.background.surface,
    border: colors.border.subtle,
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textMuted: colors.text.muted,
    available: colors.status.success,
    taken: colors.status.danger,
    checking: colors.text.muted,
    invalid: colors.status.warning,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildVanityURLSettingsContainerStyle(
  colors: VanityURLSettingsColors,
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

export function buildVanityURLSettingsTitleStyle(
  colors: VanityURLSettingsColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.base.fontSize,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  };
}

export function buildVanityURLSettingsDescriptionStyle(
  colors: VanityURLSettingsColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    color: colors.textSecondary,
  };
}

export function buildVanityURLSettingsInputRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  };
}

export function buildVanityURLSettingsPrefixStyle(
  colors: VanityURLSettingsColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing, radii } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    color: colors.textMuted,
    backgroundColor: colors.bg,
    padding: `${spacing.xs}px ${spacing.sm}px`,
    borderRadius: `${radii.md}px 0 0 ${radii.md}px`,
    border: `1px solid ${colors.border}`,
    borderRight: 'none',
    whiteSpace: 'nowrap',
    lineHeight: '34px',
  };
}

export function buildVanityURLSettingsStatusStyle(
  availability: VanityUrlAvailability,
  colors: VanityURLSettingsColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography, spacing } = theme;
  const colorMap: Record<VanityUrlAvailability, string> = {
    available: colors.available,
    taken: colors.taken,
    checking: colors.checking,
    invalid: colors.invalid,
  };
  return {
    fontSize: typography.sizes.sm.fontSize,
    color: colorMap[availability],
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
  };
}

export function buildVanityURLSettingsActionsStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  };
}

export function buildVanityURLSettingsSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
