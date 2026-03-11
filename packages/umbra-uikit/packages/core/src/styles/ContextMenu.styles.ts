/**
 * @module ContextMenu
 */
import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Content (dropdown panel)
// ---------------------------------------------------------------------------

export function buildContextMenuContentStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    position: 'fixed',
    zIndex: zIndex.popover,
    minWidth: 180,
    padding: `${spacing.xs}px 0`,
    backgroundColor: themeColors.background.raised,
    border: `1px solid ${themeColors.accent.dividerRaised}`,
    borderRadius: radii.md,
    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
    fontFamily: fontFamilyStacks.sans,
    outline: 'none',
  };
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export function buildContextMenuItemStyle(
  destructive: boolean,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  const textColor = destructive
    ? themeColors.status.danger
    : themeColors.text.onRaised;

  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
    padding: `${spacing.sm}px ${spacing.md}px`,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: 1.4,
    fontFamily: fontFamilyStacks.sans,
    color: disabled ? themeColors.text.muted : textColor,
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    outline: 'none',
    border: 'none',
    backgroundColor: 'transparent',
    opacity: disabled ? 0.5 : 1,
  };
}

export function buildContextMenuItemHoverStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    backgroundColor: themeColors.accent.highlightRaised,
  };
}

// ---------------------------------------------------------------------------
// Shortcut label
// ---------------------------------------------------------------------------

export function buildContextMenuShortcutStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    marginLeft: 'auto',
    fontSize: typography.sizes.xs.fontSize,
    color: themeColors.accent.mutedRaised,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

export function buildContextMenuSeparatorStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    height: 1,
    margin: `${spacing.xs}px 0`,
    backgroundColor: themeColors.accent.dividerRaised,
  };
}
