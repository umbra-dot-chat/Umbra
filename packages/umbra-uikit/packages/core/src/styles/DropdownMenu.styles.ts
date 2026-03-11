/**
 * @module DropdownMenu.styles
 * @description Style builders for the Wisp DropdownMenu primitive.
 */

import type React from "react";
import type { CSSStyleObject } from "../types";
import type { ThemeColors, WispTheme } from '../theme/types';
import { fontFamilyStacks, glassStyle } from "../tokens/shared";
import type { SurfaceVariant } from "../tokens/shared";
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

/**
 * Builds the style for the dropdown content panel (the floating menu container).
 *
 * @param themeColors - Resolved theme color tokens.
 * @param variant - Surface variant (`'solid'` | `'glass'`). Defaults to `'solid'`.
 * @returns A `CSSStyleObject` object with absolute positioning, shadow, border, and background.
 */
export function buildContentStyle(
  theme: WispTheme,
  variant: SurfaceVariant = 'solid',
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    position: "absolute",
    zIndex: zIndex.dropdown,
    minWidth: 180,
    padding: spacing.xs,
    backgroundColor: themeColors.background.canvas,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    boxShadow: `0 4px 12px ${themeColors.background.overlay}`,
    outline: "none",
    fontFamily: fontFamilyStacks.sans,
    boxSizing: "border-box",
    color: themeColors.text.primary,
    ...(variant === 'glass' ? glassStyle : undefined),
  };
}

/**
 * Builds the style for an individual dropdown menu item.
 *
 * @param opts - Configuration object.
 * @param opts.themeColors - Resolved theme color tokens.
 * @param opts.disabled - Whether the item is non-interactive.
 * @param opts.danger - Whether the item represents a destructive action.
 * @param opts.isActive - Whether the item is currently hovered or keyboard-focused.
 * @returns A `CSSStyleObject` object with background, text color, cursor, and opacity
 *   adjusted based on the active, disabled, and danger states.
 */
export function buildItemStyle(opts: {
  theme: WispTheme;
  disabled: boolean;
  danger: boolean;
  isActive: boolean;
}): CSSStyleObject {
  const { colors: themeColors, radii, spacing, typography } = opts.theme;
  const { disabled, danger, isActive } = opts;

  let backgroundColor = "transparent";
  let color = themeColors.text.primary;

  if (danger) {
    color = themeColors.status.danger;
    if (isActive && !disabled) {
      backgroundColor = themeColors.status.dangerSurface;
    }
  } else if (isActive && !disabled) {
    backgroundColor = themeColors.accent.highlight;
  }

  if (disabled) {
    color = themeColors.text.muted;
  }

  return {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: `${spacing.sm}px ${spacing.md}px`,
    margin: 0,
    border: "none",
    borderRadius: radii.sm,
    backgroundColor,
    color,
    fontSize: typography.sizes.sm.fontSize,
    lineHeight: `${typography.sizes.sm.lineHeight}px`,
    fontFamily: fontFamilyStacks.sans,
    fontWeight: typography.weights.regular,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    outline: "none",
    textAlign: "left",
    textDecoration: "none",
    userSelect: "none",
    boxSizing: "border-box",
    gap: spacing.sm,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

/**
 * Builds the style for the leading icon slot inside a menu item.
 *
 * @returns A `CSSStyleObject` object that centers and constrains the icon to 16x16px.
 */
export function buildItemIconStyle(): CSSStyleObject {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    flexShrink: 0,
  };
}

/**
 * Builds the style for the trailing keyboard-shortcut label inside a menu item.
 *
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object with muted color and smaller font size.
 */
export function buildShortcutStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing, typography } = theme;
  return {
    marginLeft: "auto",
    paddingLeft: spacing.lg,
    fontSize: typography.sizes.xs.fontSize,
    lineHeight: `${typography.sizes.xs.lineHeight}px`,
    color: themeColors.text.muted,
    fontFamily: fontFamilyStacks.sans,
    flexShrink: 0,
  };
}

/**
 * Builds the style for a horizontal separator line between menu item groups.
 *
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object rendering a 1px themed divider.
 */
export function buildSeparatorStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    height: 1,
    margin: `${spacing.xs}px 0`,
    backgroundColor: themeColors.border.subtle,
    border: "none",
  };
}
