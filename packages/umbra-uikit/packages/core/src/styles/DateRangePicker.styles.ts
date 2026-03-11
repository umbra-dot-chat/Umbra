/**
 * @module DateRangePicker.styles
 * @description Style builders for the Wisp DateRangePicker component.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { DateRangePickerSizeConfig } from '../types/DateRangePicker.types';
import { zIndex } from '../tokens/z-index';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Wrapper
// ---------------------------------------------------------------------------

/**
 * Builds the outer wrapper style (vertical flex column for label + trigger).
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @returns A `CSSStyleObject` object for the wrapper `<div>`.
 */
export function buildWrapperStyle(
  sizeConfig: DateRangePickerSizeConfig,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    flexDirection: 'column',
    gap: sizeConfig.paddingX > 10 ? 6 : 4,
    position: 'relative',
  };
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

/**
 * Builds the label text style rendered above the trigger.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for the label `<span>`.
 */
export function buildLabelStyle(
  sizeConfig: DateRangePickerSizeConfig,
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
// Trigger
// ---------------------------------------------------------------------------

/**
 * Builds the trigger button style (the clickable area that opens the dropdown).
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @param isOpen - Whether the dropdown is currently open.
 * @param disabled - Whether the trigger is disabled.
 * @returns A `CSSStyleObject` object for the trigger `<button>`.
 */
export function buildTriggerStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
  isOpen: boolean,
  disabled: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: sizeConfig.paddingX > 10 ? 8 : 6,
    height: sizeConfig.inputHeight,
    paddingLeft: sizeConfig.paddingX,
    paddingRight: sizeConfig.paddingX,
    backgroundColor: disabled ? themeColors.border.subtle : 'transparent',
    borderRadius: radii[sizeConfig.borderRadius],
    boxSizing: 'border-box',
    border: `1px solid ${isOpen ? themeColors.accent.primary : themeColors.border.strong}`,
    boxShadow: isOpen ? `0 0 0 2px ${themeColors.accent.primary}25` : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `border-color ${durations.fast}ms ${easings.easeOut.css}, box-shadow ${durations.fast}ms ${easings.easeOut.css}`,
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    color: disabled ? themeColors.text.muted : themeColors.text.primary,
    outline: 'none',
    margin: 0,
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    whiteSpace: 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Dropdown
// ---------------------------------------------------------------------------

/**
 * Builds the dropdown container style with two side-by-side calendars.
 *
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for the dropdown `<div>`.
 */
export function buildDropdownStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii, spacing, shadows } = theme;
  return {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: zIndex.dropdown,
    display: 'flex',
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    marginTop: spacing.xs,
    backgroundColor: themeColors.background.canvas,
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.lg,
    boxShadow: shadows.md,
    boxSizing: 'border-box',
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Calendar Header
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for each calendar header row.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @returns A `CSSStyleObject` object for the header flex container.
 */
export function buildCalendarHeaderStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
  };
}

// ---------------------------------------------------------------------------
// Navigation Button
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the prev/next month navigation buttons.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @param isHovered - Whether the button is currently hovered.
 * @returns A `CSSStyleObject` object for the nav button.
 */
export function buildNavButtonStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
  isHovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const btnSize = sizeConfig.cellSize < 32 ? 24 : 28;

  return {
    appearance: 'none' as const,
    border: 'none',
    margin: 0,
    padding: 0,
    outline: 'none',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    width: btnSize,
    height: btnSize,
    borderRadius: radii.md,
    backgroundColor: isHovered ? themeColors.accent.highlight : 'transparent',
    color: themeColors.text.primary,
    cursor: 'pointer',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Month/Year Label
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the month/year text in the header.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for the month/year label.
 */
export function buildMonthYearStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontWeight: typography.weights.semibold,
    fontSize: sizeConfig.headerFontSize,
    color: themeColors.text.primary,
    lineHeight: 1,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Calendar Grid
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the 7-column day grid.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @returns A `CSSStyleObject` object for the CSS Grid container.
 */
export function buildCalendarGridStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(7, ${sizeConfig.cellSize}px)`,
    gap: spacing['2xs'],
  };
}

// ---------------------------------------------------------------------------
// Day Header
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the day-of-week header cells.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for each day header cell.
 */
export function buildDayHeaderStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    textAlign: 'center',
    fontSize: sizeConfig.dayHeaderFontSize,
    color: themeColors.text.secondary,
    fontWeight: typography.weights.medium,
    lineHeight: 1,
    height: sizeConfig.cellSize,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Range Day Cell
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for an individual day cell with range support.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @param isStart - Whether this day is the range start.
 * @param isEnd - Whether this day is the range end.
 * @param isInRange - Whether this day falls between start and end.
 * @param isToday - Whether this day is today's date.
 * @param isDisabled - Whether this day is disabled.
 * @param isOutside - Whether this day belongs to an adjacent month.
 * @param isHovered - Whether the mouse is currently over this cell.
 * @returns A `CSSStyleObject` object for the day cell button.
 */
export function buildRangeDayCellStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
  isStart: boolean,
  isEnd: boolean,
  isInRange: boolean,
  isToday: boolean,
  isDisabled: boolean,
  isOutside: boolean,
  isHovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, typography } = theme;

  // Base style
  const style: CSSStyleObject = {
    appearance: 'none' as const,
    border: 'none',
    margin: 0,
    padding: 0,
    outline: 'none',
    textDecoration: 'none',
    background: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
    color: themeColors.text.primary,
    cursor: 'pointer',
    userSelect: 'none',
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };

  // --- State overrides (order matters: disabled > start/end > inRange > today > hover > outside) ---

  if (isDisabled) {
    style.color = themeColors.text.secondary;
    style.opacity = 0.4;
    style.cursor = 'not-allowed';
    return style;
  }

  if (isStart && isEnd) {
    // Single-day range: fully rounded
    style.backgroundColor = themeColors.accent.primary;
    style.color = themeColors.text.inverse;
    style.fontWeight = 600;
    style.borderRadius = '50%';
    return style;
  }

  if (isStart) {
    style.backgroundColor = themeColors.accent.primary;
    style.color = themeColors.text.inverse;
    style.fontWeight = 600;
    style.borderRadius = '50%';
    return style;
  }

  if (isEnd) {
    style.backgroundColor = themeColors.accent.primary;
    style.color = themeColors.text.inverse;
    style.fontWeight = 600;
    style.borderRadius = '50%';
    return style;
  }

  if (isInRange) {
    style.backgroundColor = themeColors.border.subtle;
    style.color = themeColors.text.primary;
    style.borderRadius = '50%';
  }

  if (isOutside) {
    style.color = themeColors.text.secondary;
    style.opacity = 0.4;
  }

  if (isToday && !isOutside) {
    style.border = `1px solid ${themeColors.accent.primary}`;
    style.fontWeight = 600;
  }

  if (isHovered && !isDisabled && !isInRange) {
    style.backgroundColor = themeColors.accent.highlight;
  }

  return style;
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for the DateRangePicker.
 *
 * @param sizeConfig - Active {@link DateRangePickerSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for the skeleton `<div>`.
 */
export function buildSkeletonStyle(
  sizeConfig: DateRangePickerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: 220,
    height: sizeConfig.inputHeight,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
