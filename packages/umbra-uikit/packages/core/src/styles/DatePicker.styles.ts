/**
 * @module DatePicker.styles
 * @description Style builders for the Wisp DatePicker component.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { DatePickerSizeConfig } from '../types/DatePicker.types';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (vertical flex column for label + trigger + error).
 *
 * @param sizeConfig - Active {@link DatePickerSizeConfig}.
 * @param fullWidth - Whether the wrapper should stretch to 100% width.
 * @returns CSS properties for the wrapper `<div>`.
 */
export function buildDatePickerContainerStyle(
  sizeConfig: DatePickerSizeConfig,
  fullWidth: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: fullWidth ? 'flex' : 'inline-flex',
    flexDirection: 'column',
    gap: spacing.xs,
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

/**
 * Builds the trigger button style (the clickable area that opens the calendar).
 *
 * @param sizeConfig - Active {@link DatePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @param isOpen - Whether the dropdown is currently open.
 * @param isDisabled - Whether the trigger is disabled.
 * @param hasError - Whether the component is in an error state.
 * @param isHovered - Whether the trigger is currently hovered.
 * @returns CSS properties for the trigger `<button>`.
 */
export function buildDatePickerTriggerStyle(
  sizeConfig: DatePickerSizeConfig,
  theme: WispTheme,
  isOpen: boolean,
  isDisabled: boolean,
  hasError: boolean,
  isHovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  let borderColor = themeColors.border.strong;
  if (hasError) borderColor = themeColors.status.danger;
  else if (isOpen) borderColor = themeColors.accent.primary;

  let boxShadow = 'none';
  if (isOpen && !hasError) {
    boxShadow = `0 0 0 2px ${themeColors.accent.primary}25`;
  } else if (hasError && isOpen) {
    boxShadow = `0 0 0 2px ${themeColors.status.danger}25`;
  }

  return {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizeConfig.paddingX > 10 ? 8 : 6,
    height: sizeConfig.inputHeight,
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    backgroundColor: 'transparent',
    borderRadius: radii[sizeConfig.borderRadius],
    boxSizing: 'border-box',
    border: `1px solid ${borderColor}`,
    boxShadow,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    color: themeColors.text.primary,
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamilyStacks.sans,
    appearance: 'none' as const,
    outline: 'none',
    margin: 0,
    width: '100%',
    userSelect: 'none',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    WebkitTapHighlightColor: 'transparent',
    opacity: isDisabled ? 0.5 : 1,
  };
}

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------

/**
 * Builds the dropdown panel style that contains the Calendar.
 *
 * @param sizeConfig - Active {@link DatePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the dropdown `<div>`.
 */
export function buildDatePickerDropdownStyle(
  sizeConfig: DatePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, shadows } = theme;
  return {
    position: 'absolute',
    top: sizeConfig.inputHeight + 4,
    left: 0,
    zIndex: zIndex.dropdown,
    boxShadow: shadows.md,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
    backgroundColor: themeColors.background.raised,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

/**
 * Builds the style for the calendar icon inside the trigger.
 *
 * @param themeColors - Active theme color tokens.
 * @param isDisabled - Whether the component is disabled.
 * @returns CSS properties for the icon `<svg>` wrapper.
 */
export function buildDatePickerIconStyle(
  theme: WispTheme,
  isDisabled: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    color: themeColors.text.muted,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
  };
}

// ---------------------------------------------------------------------------
// Clear button
// ---------------------------------------------------------------------------

/**
 * Builds the style for the clear (X) button inside the trigger.
 *
 * @param themeColors - Active theme color tokens.
 * @param isHovered - Whether the clear button is currently hovered.
 * @returns CSS properties for the clear `<button>`.
 */
export function buildDatePickerClearStyle(
  theme: WispTheme,
  isHovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing } = theme;
  return {
    appearance: 'none' as const,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: isHovered ? themeColors.text.primary : themeColors.text.muted,
    padding: spacing['2xs'],
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    borderRadius: radii.sm,
    outline: 'none',
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

/**
 * Builds the label text style rendered above the trigger.
 *
 * @param sizeConfig - Active {@link DatePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the label `<span>`.
 */
export function buildDatePickerLabelStyle(
  sizeConfig: DatePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    lineHeight: 1.4,
    fontWeight: typography.weights.medium,
    color: themeColors.text.primary,
    cursor: 'default',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Error text
// ---------------------------------------------------------------------------

/**
 * Builds the error message text style rendered below the trigger.
 *
 * @param sizeConfig - Active {@link DatePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the error `<span>`.
 */
export function buildDatePickerErrorStyle(
  sizeConfig: DatePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize - 1,
    lineHeight: 1.4,
    fontWeight: typography.weights.regular,
    color: themeColors.status.danger,
    margin: 0,
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for the DatePicker component.
 *
 * @param sizeConfig - Active {@link DatePickerSizeConfig}.
 * @param themeColors - Active theme color tokens.
 * @returns CSS properties for the skeleton `<div>`.
 */
export function buildDatePickerSkeletonStyle(
  sizeConfig: DatePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: '100%',
    height: sizeConfig.inputHeight,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
