/**
 * @module Calendar.styles
 * @description Style builders for the Wisp Calendar component.
 */

import type { CSSStyleObject } from '../types';
import { fontFamilyStacks } from '../tokens/shared';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { CalendarSizeConfig } from '../types/Calendar.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the root calendar container.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for the calendar wrapper.
 */
export function buildCalendarContainerStyle(
  sizeConfig: CalendarSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    padding: sizeConfig.padding,
    backgroundColor: themeColors.background.raised,
    borderRadius: radii.lg,
    border: `1px solid ${themeColors.border.subtle}`,
    fontFamily: fontFamilyStacks.sans,
    display: 'inline-block',
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Header (month/year row with nav buttons)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the calendar header row.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @returns A `CSSStyleObject` object for the header flex container.
 */
export function buildCalendarHeaderStyle(
  sizeConfig: CalendarSizeConfig,
): CSSStyleObject {
  return {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: sizeConfig.padding,
  };
}

// ---------------------------------------------------------------------------
// Navigation button (prev / next month)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the prev/next month navigation buttons.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @param isHovered - Whether the button is currently hovered.
 * @returns A `CSSStyleObject` object for the nav button.
 */
export function buildCalendarNavButtonStyle(
  sizeConfig: CalendarSizeConfig,
  theme: WispTheme,
  isHovered: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const btnSize = sizeConfig.cellSize < 36 ? 28 : 36;

  return {
    // Reset
    appearance: 'none' as const,
    border: 'none',
    margin: 0,
    padding: 0,
    outline: 'none',
    textDecoration: 'none',

    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',

    // Sizing
    width: btnSize,
    height: btnSize,

    // Shape
    borderRadius: radii.md,

    // Color
    backgroundColor: isHovered ? themeColors.accent.highlight : 'transparent',
    color: themeColors.text.onRaised,

    // Interaction
    cursor: 'pointer',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

// ---------------------------------------------------------------------------
// Day grid (7-column grid)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the 7-column day grid.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @returns A `CSSStyleObject` object for the CSS Grid container.
 */
export function buildCalendarGridStyle(
  sizeConfig: CalendarSizeConfig,
): CSSStyleObject {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(7, ${sizeConfig.cellSize}px)`,
    gap: sizeConfig.gap,
  };
}

// ---------------------------------------------------------------------------
// Day-of-week header (Su, Mo, Tu, ...)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the day-of-week header cells.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for each day header cell.
 */
export function buildCalendarDayHeaderStyle(
  sizeConfig: CalendarSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    textAlign: 'center',
    fontSize: sizeConfig.dayHeaderFontSize,
    color: themeColors.text.onRaisedSecondary,
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
// Day cell
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for an individual day cell in the grid.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @param isSelected - Whether this day is the currently selected date.
 * @param isToday - Whether this day is today's date.
 * @param isDisabled - Whether this day is disabled.
 * @param isOutside - Whether this day belongs to an adjacent month.
 * @param isHovered - Whether the mouse is currently over this cell.
 * @param isInRange - Reserved for future range-selection support.
 * @returns A `CSSStyleObject` object for the day cell button.
 */
export function buildCalendarDayCellStyle(
  sizeConfig: CalendarSizeConfig,
  theme: WispTheme,
  isSelected: boolean,
  isToday: boolean,
  isDisabled: boolean,
  isOutside: boolean,
  isHovered: boolean,
  isInRange: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii, typography } = theme;
  // Base style
  const style: CSSStyleObject = {
    // Reset
    appearance: 'none' as const,
    border: 'none',
    margin: 0,
    padding: 0,
    outline: 'none',
    textDecoration: 'none',
    background: 'none',

    // Layout
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',

    // Sizing
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,

    // Typography
    fontFamily: fontFamilyStacks.sans,
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.regular,
    lineHeight: 1,

    // Shape
    borderRadius: radii.full,

    // Color defaults
    backgroundColor: 'transparent',
    color: themeColors.text.onRaised,

    // Interaction
    cursor: 'pointer',
    userSelect: 'none',

    // Transition
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}, color ${durations.fast}ms ${easings.easeOut.css}`,
  };

  // --- State overrides (order matters: disabled > selected > today > hover > outside) ---

  if (isDisabled) {
    style.color = themeColors.text.onRaisedSecondary;
    style.opacity = 0.4;
    style.cursor = 'not-allowed';
    return style;
  }

  if (isSelected) {
    style.backgroundColor = themeColors.accent.primary;
    style.color = themeColors.text.inverse;
    style.fontWeight = 600;
    return style;
  }

  if (isInRange) {
    style.backgroundColor = themeColors.accent.highlight;
    style.color = themeColors.text.onRaised;
  }

  if (isOutside) {
    style.color = themeColors.text.onRaisedSecondary;
    style.opacity = 0.4;
  }

  if (isToday && !isOutside) {
    style.border = `1px solid ${themeColors.accent.primary}`;
    style.fontWeight = 600;
  }

  if (isHovered && !isDisabled) {
    style.backgroundColor = themeColors.accent.highlight;
  }

  return style;
}

// ---------------------------------------------------------------------------
// Month/year label
// ---------------------------------------------------------------------------

/**
 * Builds the inline style object for the month/year text in the header.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for the month/year label.
 */
export function buildCalendarMonthYearStyle(
  sizeConfig: CalendarSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    fontWeight: typography.weights.semibold,
    fontSize: sizeConfig.headerFontSize,
    color: themeColors.text.onRaised,
    lineHeight: 1,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton loading placeholder style for a single cell.
 *
 * @param sizeConfig - Active {@link CalendarSizeConfig}.
 * @param themeColors - Resolved theme color tokens.
 * @returns A `CSSStyleObject` object for a skeleton cell.
 */
export function buildCalendarSkeletonCellStyle(
  sizeConfig: CalendarSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    width: sizeConfig.cellSize,
    height: sizeConfig.cellSize,
    borderRadius: radii.full,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
