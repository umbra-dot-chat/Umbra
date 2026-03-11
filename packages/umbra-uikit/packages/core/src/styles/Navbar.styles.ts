/**
 * @module Navbar
 */
import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { NavbarVariant } from '../types/Navbar.types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Navbar container
// ---------------------------------------------------------------------------

export function buildNavbarStyle(
  variant: NavbarVariant,
  sticky: boolean,
  height: number,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  const base: CSSStyleObject = {
    display: 'flex',
    alignItems: 'center',
    height,
    paddingLeft: spacing.xl,
    paddingRight: spacing.xl,
    boxSizing: 'border-box',
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    fontFamily: fontFamilyStacks.sans,
    ...(sticky
      ? { position: 'sticky', top: 0, zIndex: zIndex.sticky }
      : {}),
  };

  switch (variant) {
    case 'glass':
      return {
        ...base,
        ...glassStyle,
        color: themeColors.text.primary,
      };
    case 'transparent':
      return {
        ...base,
        backgroundColor: 'transparent',
        color: themeColors.text.primary,
        borderBottom: 'none',
      };
    case 'solid':
    default:
      return {
        ...base,
        backgroundColor: themeColors.background.surface,
        color: themeColors.text.onRaised,
      };
  }
}

// ---------------------------------------------------------------------------
// Brand
// ---------------------------------------------------------------------------

export function buildNavbarBrandStyle(theme: WispTheme): CSSStyleObject {
  const { spacing, typography } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base.fontSize,
    cursor: 'pointer',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export function buildNavbarContentStyle(
  align: 'start' | 'center' | 'end',
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  const justifyMap = { start: 'flex-start', center: 'center', end: 'flex-end' } as const;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: justifyMap[align],
  };
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export function buildNavbarItemStyle(
  active: boolean,
  theme: WispTheme,
  isSolid: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  const textColor = isSolid ? themeColors.text.onRaised : themeColors.text.primary;
  const mutedColor = isSolid ? themeColors.text.onRaisedSecondary : themeColors.text.secondary;

  return {
    display: 'flex',
    alignItems: 'center',
    padding: `${spacing.sm}px ${spacing.md}px`,
    borderRadius: radii.md,
    fontSize: typography.sizes.sm.fontSize,
    fontWeight: active ? 600 : 400,
    color: active ? textColor : mutedColor,
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}
