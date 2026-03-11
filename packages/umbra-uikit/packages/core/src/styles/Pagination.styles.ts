/**
 * @module Pagination.styles
 * @description Style builders for the Wisp Pagination primitive.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { PaginationSize } from '../types/Pagination.types';
import { paginationSizeMap } from '../types/Pagination.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Root nav container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the root `<nav>` wrapper.
 *
 * @param disabled - When `true` the container opacity is reduced to 0.5.
 * @returns A `CSSStyleObject` object for the pagination nav container.
 */
export function buildNavStyle(disabled: boolean, theme: WispTheme): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing['2xs'],
    opacity: disabled ? 0.5 : 1 };
}

// ---------------------------------------------------------------------------
// Shared button base
// ---------------------------------------------------------------------------

/**
 * Builds the common base style shared by all page and arrow buttons.
 *
 * @param size - The active {@link PaginationSize} preset.
 * @param disabled - Whether the button should render as non-interactive.
 * @returns A `CSSStyleObject` object containing reset, layout, sizing,
 *   typography, shape, and transition properties.
 */
function buildBaseButtonStyle(
  size: PaginationSize,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, typography } = theme;
  const cfg = paginationSizeMap[size];

  return {
    // Reset
    margin: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    textDecoration: 'none',

    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',

    // Sizing
    height: cfg.height,
    minWidth: cfg.minWidth,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: cfg.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,

    // Shape
    borderRadius: radii.md,

    // Interaction
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}` };
}

// ---------------------------------------------------------------------------
// Page button -- active (current page)
// ---------------------------------------------------------------------------

/**
 * Builds the style for the currently selected (active) page button.
 *
 * @param size - The active {@link PaginationSize} preset.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object with accent background and inverse text.
 */
export function buildActivePageStyle(
  size: PaginationSize,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    ...buildBaseButtonStyle(size, false, theme),
    backgroundColor: themeColors.accent.primary,
    color: themeColors.text.inverse,
    cursor: 'default' };
}

// ---------------------------------------------------------------------------
// Page button -- inactive
// ---------------------------------------------------------------------------

/**
 * Builds the default style for non-selected page buttons.
 *
 * @param size - The active {@link PaginationSize} preset.
 * @param disabled - Whether the button is non-interactive.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object with transparent background and secondary text.
 */
export function buildInactivePageStyle(
  size: PaginationSize,
  disabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    ...buildBaseButtonStyle(size, disabled, theme),
    backgroundColor: 'transparent',
    color: themeColors.text.secondary };
}

// ---------------------------------------------------------------------------
// Hover style for inactive page
// ---------------------------------------------------------------------------

/**
 * Builds the hover state style for non-selected page buttons.
 *
 * @param size - The active {@link PaginationSize} preset.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object with the accent highlight background.
 */
export function buildInactivePageHoverStyle(
  size: PaginationSize,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    ...buildBaseButtonStyle(size, false, theme),
    backgroundColor: themeColors.accent.highlight,
    color: themeColors.text.secondary };
}

// ---------------------------------------------------------------------------
// Arrow button (prev / next / first / last)
// ---------------------------------------------------------------------------

/**
 * Builds the default style for navigation arrow buttons (prev/next/first/last).
 *
 * @param size - The active {@link PaginationSize} preset.
 * @param isDisabled - Whether the arrow is non-interactive (e.g., at boundary).
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object with muted color when disabled.
 */
export function buildArrowStyle(
  size: PaginationSize,
  isDisabled: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    ...buildBaseButtonStyle(size, isDisabled, theme),
    backgroundColor: 'transparent',
    color: isDisabled ? themeColors.text.muted : themeColors.text.secondary };
}

// ---------------------------------------------------------------------------
// Hover style for arrow button
// ---------------------------------------------------------------------------

/**
 * Builds the hover state style for navigation arrow buttons.
 *
 * @param size - The active {@link PaginationSize} preset.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object with the accent highlight background.
 */
export function buildArrowHoverStyle(
  size: PaginationSize,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    ...buildBaseButtonStyle(size, false, theme),
    backgroundColor: themeColors.accent.highlight,
    color: themeColors.text.secondary };
}

// ---------------------------------------------------------------------------
// Ellipsis span
// ---------------------------------------------------------------------------

/**
 * Builds the style for the non-interactive ellipsis (`...`) gap indicator.
 *
 * @param size - The active {@link PaginationSize} preset.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object styled as a centered, muted label.
 */
export function buildEllipsisStyle(
  size: PaginationSize,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  const cfg = paginationSizeMap[size];

  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: cfg.height,
    minWidth: cfg.minWidth,
    fontFamily: fontFamilyStacks.sans,
    fontSize: cfg.fontSize,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    color: themeColors.text.muted,
    userSelect: 'none',
    letterSpacing: 1 };
}
