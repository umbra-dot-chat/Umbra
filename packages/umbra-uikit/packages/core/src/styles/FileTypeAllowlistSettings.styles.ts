/**
 * @module FileTypeAllowlistSettings
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Root container
// ---------------------------------------------------------------------------

export function buildAllowlistRootStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

export function buildAllowlistSectionTitleStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.primary,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Preset chip row
// ---------------------------------------------------------------------------

export function buildAllowlistPresetRowStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
  };
}

export function buildAllowlistPresetChipStyle(
  theme: WispTheme,
  active: boolean,
): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['2xs'],
    padding: `${spacing['2xs']}px ${spacing.sm}px`,
    borderRadius: radii.full,
    border: `1px solid ${active ? themeColors.accent.primary : themeColors.border.subtle}`,
    backgroundColor: active ? themeColors.accent.highlight : 'transparent',
    color: active ? themeColors.accent.primary : themeColors.text.secondary,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    cursor: 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, background-color ${durations.fast}ms ${easings.easeOut.css}`,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Type tag list (allowed / blocked)
// ---------------------------------------------------------------------------

export function buildAllowlistTagListStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing.xs,
  };
}

export function buildAllowlistTagStyle(
  theme: WispTheme,
  variant: 'allowed' | 'blocked',
): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  const isBlocked = variant === 'blocked';
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing['2xs'],
    padding: `2px ${spacing.xs}px`,
    borderRadius: radii.md,
    backgroundColor: isBlocked ? themeColors.status.danger + '1A' : themeColors.status.success + '1A',
    color: isBlocked ? themeColors.status.danger : themeColors.status.success,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
  };
}

export function buildAllowlistTagRemoveStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 14,
    height: 14,
    cursor: 'pointer',
    opacity: 0.7,
    border: 'none',
    backgroundColor: 'transparent',
    padding: 0,
    color: 'inherit',
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildAllowlistEmptyStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, spacing } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.text.muted,
    padding: spacing.sm,
    margin: 0,
  };
}
