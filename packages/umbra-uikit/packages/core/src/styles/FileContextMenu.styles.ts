/**
 * @module FileContextMenu
 */
import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Menu container (positioned overlay)
// ---------------------------------------------------------------------------

export function buildFileContextMenuStyle(
  theme: WispTheme,
  open: boolean,
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
    opacity: open ? 1 : 0,
    pointerEvents: open ? 'auto' : 'none',
    transition: `opacity ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Menu item row
// ---------------------------------------------------------------------------

export function buildFileContextMenuItemStyle(
  theme: WispTheme,
  hovered: boolean,
  destructive: boolean,
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
    color: textColor,
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: hovered ? themeColors.accent.highlightRaised : 'transparent',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    outline: 'none',
    border: 'none',
  };
}

// ---------------------------------------------------------------------------
// Menu item icon
// ---------------------------------------------------------------------------

export function buildFileContextMenuItemIconStyle(
  theme: WispTheme,
  destructive: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 16,
    height: 16,
    color: destructive ? themeColors.status.danger : themeColors.text.muted,
    flexShrink: 0,
  };
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export function buildFileContextMenuDividerStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    height: 1,
    margin: `${spacing.xs}px 0`,
    backgroundColor: themeColors.accent.dividerRaised,
  };
}

// ---------------------------------------------------------------------------
// Multi-select count badge
// ---------------------------------------------------------------------------

export function buildFileContextMenuBadgeStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography, radii, spacing } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 18,
    padding: `0 ${spacing.xs}px`,
    borderRadius: radii.full,
    backgroundColor: themeColors.accent.primary,
    color: themeColors.text.onAccent,
    fontSize: typography.sizes.xs.fontSize,
    fontWeight: typography.weights.semibold,
    marginLeft: 'auto',
  };
}
