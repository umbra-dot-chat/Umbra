/**
 * @module Calendar.types
 * @description Type definitions for the Wisp Calendar component.
 */

import type { HTMLAttributes } from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/** Available size presets for the Calendar component. */
export const calendarSizes = ['sm', 'md', 'lg'] as const;

/** Union of allowed calendar size values. */
export type CalendarSize = (typeof calendarSizes)[number];

/** Dimensional configuration for a single calendar size preset. */
export interface CalendarSizeConfig {
  /** Width and height of each day cell in pixels. */
  cellSize: number;
  /** Font size in pixels for day numbers. */
  fontSize: number;
  /** Font size in pixels for the month/year header. */
  headerFontSize: number;
  /** Gap between cells in pixels. */
  gap: number;
  /** Outer padding in pixels. */
  padding: number;
  /** Font size in pixels for the day-of-week headers (Su, Mo, ...). */
  dayHeaderFontSize: number;
}

/**
 * Maps each {@link CalendarSize} to its {@link CalendarSizeConfig}.
 *
 * @remarks
 * Used internally by the Calendar component and its style builders to
 * resolve sizing tokens.
 */
export const calendarSizeMap: Record<CalendarSize, CalendarSizeConfig> = {
  sm: { cellSize: 28, fontSize: defaultTypography.sizes.xs.fontSize, headerFontSize: 13, gap: defaultSpacing['2xs'], padding: defaultSpacing.sm, dayHeaderFontSize: 11 },
  md: { cellSize: 36, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 14, gap: defaultSpacing['2xs'], padding: defaultSpacing.md, dayHeaderFontSize: 12 },
  lg: { cellSize: 44, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 16, gap: defaultSpacing.xs, padding: defaultSpacing.lg, dayHeaderFontSize: 13 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the {@link Calendar} component. */
export interface CalendarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * The currently selected date (controlled).
   * When provided the component is fully controlled.
   */
  value?: Date;
  /**
   * The initially selected date (uncontrolled).
   * Ignored when {@link CalendarProps.value} is provided.
   */
  defaultValue?: Date;
  /** Callback fired when the user selects a date. */
  onChange?: (date: Date) => void;
  /**
   * Controls the visual size of the calendar.
   * @default 'md'
   */
  size?: CalendarSize;
  /** The earliest selectable date. Days before this are disabled. */
  minDate?: Date;
  /** The latest selectable date. Days after this are disabled. */
  maxDate?: Date;
  /** An array of specific dates that should be disabled. */
  disabledDates?: Date[];
  /**
   * BCP-47 locale string used for month/day formatting.
   * @default 'en-US'
   */
  locale?: string;
  /**
   * Day the week starts on.
   * - `0` = Sunday (default)
   * - `1` = Monday
   * @default 0
   */
  weekStartsOn?: 0 | 1;
  /**
   * When `true`, days from the previous and next months are shown
   * to fill the grid.
   * @default true
   */
  showOutsideDays?: boolean;
  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the component.
   * @default false
   */
  skeleton?: boolean;
}
