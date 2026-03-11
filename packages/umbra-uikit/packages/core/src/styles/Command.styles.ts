/**
 * Style builders for the Wisp Command palette primitive.
 *
 * @module primitives/command/styles
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CommandSize } from '../types/Command.types';
import { commandSizeMap } from '../types/Command.types';
import { fontFamilyStacks, glassStyle } from '../tokens/shared';
import type { SurfaceVariant } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export function buildOverlayStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: zIndex.modal,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '20vh',
    backgroundColor: themeColors.background.overlay,
  };
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function buildPanelStyle(
  size: CommandSize,
  theme: WispTheme,
  variant: SurfaceVariant = 'solid',
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const base: CSSStyleObject = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: commandSizeMap[size],
    maxHeight: 420,
    backgroundColor: themeColors.background.canvas,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.lg,
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
    outline: 'none',
    overflow: 'hidden',
    fontFamily: fontFamilyStacks.sans,
  };

  if (variant === 'glass') {
    return { ...base, ...glassStyle, borderRadius: radii.lg, overflow: 'hidden' };
  }

  return base;
}

// ---------------------------------------------------------------------------
// Input wrapper
// ---------------------------------------------------------------------------

export function buildInputWrapperStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.md}px ${spacing.lg}px`,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export function buildInputStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: themeColors.text.primary,
    fontSize: typography.sizes.base.fontSize,
    lineHeight: `${typography.sizes.base.lineHeight}px`,
    fontFamily: fontFamilyStacks.sans,
    padding: 0,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Input icon
// ---------------------------------------------------------------------------

export function buildInputIconStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    color: themeColors.text.muted,
  };
}

// ---------------------------------------------------------------------------
// List container
// ---------------------------------------------------------------------------

export function buildListStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    overflowY: 'auto',
    maxHeight: 320,
    padding: `${spacing.sm}px 0`,
    flex: 1,
  };
}

// ---------------------------------------------------------------------------
// Group heading
// ---------------------------------------------------------------------------

export function buildGroupHeadingStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    padding: `${spacing.sm}px ${spacing.lg}px ${spacing.xs}px`,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: themeColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: fontFamilyStacks.sans,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export function buildItemStyle(
  theme: WispTheme,
  isActive: boolean,
  isDisabled: boolean,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: `${spacing.md}px ${spacing.lg}px`,
    cursor: isDisabled ? 'default' : 'pointer',
    backgroundColor: isActive ? themeColors.accent.highlight : 'transparent',
    color: isDisabled ? themeColors.text.muted : themeColors.text.primary,
    opacity: isDisabled ? 0.5 : 1,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    fontFamily: fontFamilyStacks.sans,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Item icon
// ---------------------------------------------------------------------------

export function buildItemIconStyle(
  theme: WispTheme,
  isDisabled: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    width: 20,
    height: 20,
    color: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Item label area
// ---------------------------------------------------------------------------

export function buildItemLabelStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing['2xs'],
  };
}

// ---------------------------------------------------------------------------
// Item description
// ---------------------------------------------------------------------------

export function buildItemDescriptionStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Item shortcut
// ---------------------------------------------------------------------------

export function buildItemShortcutStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    marginLeft: 'auto',
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: themeColors.text.secondary,
    fontFamily: fontFamilyStacks.sans,
    display: 'flex',
    gap: spacing.xs,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Shortcut key
// ---------------------------------------------------------------------------

export function buildShortcutKeyStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
    padding: `0 ${spacing.xs}px`,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    borderRadius: radii.sm,
    backgroundColor: themeColors.accent.highlight,
    color: themeColors.text.secondary,
  };
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

export function buildSeparatorStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    height: 1,
    margin: `${spacing.xs}px 0`,
    backgroundColor: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

export function buildEmptyStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    padding: `${spacing['2xl']}px ${spacing.lg}px`,
    textAlign: 'center',
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    color: themeColors.text.muted,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

export function buildLoadingStyle(theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `${spacing.xl}px ${spacing.lg}px`,
  };
}
