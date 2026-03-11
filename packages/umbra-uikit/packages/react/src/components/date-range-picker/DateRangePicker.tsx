import React, { forwardRef, useCallback, useMemo, useState, useRef, useEffect } from 'react';
import type { DateRangePickerProps, DateRange, DateRangePickerSizeConfig } from '@coexist/wisp-core/types/DateRangePicker.types';
import { dateRangePickerSizeMap } from '@coexist/wisp-core/types/DateRangePicker.types';
import {
  buildWrapperStyle,
  buildLabelStyle,
  buildTriggerStyle,
  buildDropdownStyle,
  buildCalendarHeaderStyle,
  buildNavButtonStyle,
  buildMonthYearStyle,
  buildCalendarGridStyle,
  buildDayHeaderStyle,
  buildRangeDayCellStyle,
  buildSkeletonStyle,
} from '@coexist/wisp-core/styles/DateRangePicker.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';
import type { ThemeColors } from '@coexist/wisp-core/theme/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date): boolean {
  const aDate = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bDate = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aDate.getTime() < bDate.getTime();
}

function isBetweenDays(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d > s && d < e;
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateShort(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// ---------------------------------------------------------------------------
// CalendarMonth (inline sub-component)
// ---------------------------------------------------------------------------

interface CalendarMonthProps {
  year: number;
  month: number;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoveredDate: Date | null;
  onDateClick: (date: Date) => void;
  onDateHover: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  sizeConfig: DateRangePickerSizeConfig;
}

function CalendarMonth({
  year,
  month,
  rangeStart,
  rangeEnd,
  hoveredDate,
  onDateClick,
  onDateHover,
  minDate,
  maxDate,
  sizeConfig,
}: CalendarMonthProps) {
  const { theme } = useTheme();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Build grid cells
  const cells: Array<{ date: Date; isOutside: boolean }> = [];

  // Leading days from previous month
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      date: new Date(year, month - 1, prevMonthDays - i),
      isOutside: true,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(year, month, d),
      isOutside: false,
    });
  }

  // Trailing days to fill the grid (up to 42 cells = 6 weeks)
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: new Date(year, month + 1, d),
      isOutside: true,
    });
  }

  const gridStyle = buildCalendarGridStyle(sizeConfig, theme);
  const dayHeaderStyle = buildDayHeaderStyle(sizeConfig, theme);

  // Determine effective end for highlighting: if we have start but no end, use hovered
  const effectiveEnd = rangeEnd || (rangeStart && hoveredDate && !isBeforeDay(hoveredDate, rangeStart) ? hoveredDate : null);

  return (
    <div>
      <div style={gridStyle}>
        {/* Day headers */}
        {DAY_NAMES.map((day) => (
          <div key={day} style={dayHeaderStyle}>
            {day}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, idx) => {
          const { date, isOutside } = cell;

          const isDisabled =
            isOutside ||
            (minDate != null && isBeforeDay(date, minDate)) ||
            (maxDate != null && isBeforeDay(maxDate, date));

          const isStart = rangeStart != null && isSameDay(date, rangeStart);
          const isEnd = effectiveEnd != null && isSameDay(date, effectiveEnd);
          const isInRange =
            rangeStart != null &&
            effectiveEnd != null &&
            isBetweenDays(date, rangeStart, effectiveEnd);
          const isTodayDate = isToday(date);
          const isHovered = hoveredDate != null && isSameDay(date, hoveredDate);

          const cellStyle = buildRangeDayCellStyle(
            sizeConfig,
            theme,
            isStart,
            isEnd,
            isInRange,
            isTodayDate,
            isDisabled,
            isOutside,
            isHovered,
          );

          return (
            <button
              key={idx}
              type="button"
              tabIndex={-1}
              style={cellStyle}
              onClick={() => {
                if (!isDisabled) onDateClick(date);
              }}
              onMouseEnter={() => {
                if (!isDisabled) onDateHover(date);
              }}
              onMouseLeave={() => onDateHover(null)}
              aria-disabled={isDisabled || undefined}
              aria-label={date.toDateString()}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DateRangePicker
// ---------------------------------------------------------------------------

/**
 * DateRangePicker -- A dual-calendar date range selector.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled usage via `value` / `defaultValue`.
 * - Two side-by-side month calendars (left = current, right = next).
 * - Click first date to set start, click second to set end.
 * - Hover preview shows range highlight before confirming end date.
 * - Navigation arrows move both calendars simultaneously.
 * - Supports minDate/maxDate constraints, disabled state, skeleton loading, and labels.
 * - Closes on outside click or Escape key.
 *
 * @module components/date-range-picker
 */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(function DateRangePicker(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    size = 'md',
    placeholder = 'Select dates',
    minDate,
    maxDate,
    disabled = false,
    skeleton = false,
    label,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = dateRangePickerSizeMap[size];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<DateRange>(
    defaultValue ?? { start: null, end: null },
  );
  const currentRange = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Selection state: null = waiting for start, 'start' = start selected, waiting for end
  const [selectionPhase, setSelectionPhase] = useState<'start' | 'end'>('start');
  // Pending start (before range is committed)
  const [pendingStart, setPendingStart] = useState<Date | null>(null);

  // Displayed month (left calendar)
  const now = new Date();
  const [displayYear, setDisplayYear] = useState(
    currentRange.start?.getFullYear() ?? now.getFullYear(),
  );
  const [displayMonth, setDisplayMonth] = useState(
    currentRange.start?.getMonth() ?? now.getMonth(),
  );

  // Right calendar is always one month ahead
  const rightYear = displayMonth === 11 ? displayYear + 1 : displayYear;
  const rightMonth = displayMonth === 11 ? 0 : displayMonth + 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Navigation
  const goToPrevMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      if (prev === 0) {
        setDisplayYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setDisplayMonth((prev) => {
      if (prev === 11) {
        setDisplayYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  // Handle date click
  const handleDateClick = useCallback(
    (date: Date) => {
      if (selectionPhase === 'start') {
        // Set start date
        setPendingStart(date);
        setSelectionPhase('end');
      } else {
        // Set end date
        const start = pendingStart!;
        let newRange: DateRange;

        if (isBeforeDay(date, start)) {
          // Clicked before start: reset and use this as new start
          setPendingStart(date);
          setSelectionPhase('end');
          return;
        }

        newRange = { start, end: date };
        if (!isControlled) setInternalValue(newRange);
        onChange?.(newRange);
        setPendingStart(null);
        setSelectionPhase('start');
        setIsOpen(false);
      }
    },
    [selectionPhase, pendingStart, isControlled, onChange],
  );

  // Active range for display (during selection, show pending start)
  const activeStart = selectionPhase === 'end' ? pendingStart : currentRange.start;
  const activeEnd = selectionPhase === 'end' ? null : currentRange.end;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        // Reset selection if in the middle of picking
        if (selectionPhase === 'end') {
          setPendingStart(null);
          setSelectionPhase('start');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectionPhase]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        if (selectionPhase === 'end') {
          setPendingStart(null);
          setSelectionPhase('start');
        }
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectionPhase]);

  // Sync display month when value changes externally
  useEffect(() => {
    if (currentRange.start) {
      setDisplayYear(currentRange.start.getFullYear());
      setDisplayMonth(currentRange.start.getMonth());
    }
  }, [currentRange.start?.getTime()]);

  // Skeleton
  if (skeleton) {
    const skeletonStyle = buildSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        data-testid="date-range-picker-skeleton"
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Format trigger text
  const triggerText =
    currentRange.start && currentRange.end
      ? `${formatDateShort(currentRange.start)} \u2013 ${formatDateShort(currentRange.end)}`
      : placeholder;
  const hasValue = currentRange.start != null && currentRange.end != null;

  const wrapperStyle = useMemo(() => buildWrapperStyle(sizeConfig), [sizeConfig]);
  const labelStyleObj = useMemo(() => buildLabelStyle(sizeConfig, theme), [sizeConfig, theme]);
  const triggerStyle = useMemo(() => buildTriggerStyle(sizeConfig, theme, isOpen, disabled), [sizeConfig, theme, isOpen, disabled]);
  const dropdownStyle = useMemo(() => buildDropdownStyle(theme), [theme]);
  const headerStyle = useMemo(() => buildCalendarHeaderStyle(sizeConfig, theme), [sizeConfig, theme]);
  const monthYearStyle = useMemo(() => buildMonthYearStyle(sizeConfig, theme), [sizeConfig, theme]);

  return (
    <div ref={ref} className={className} style={{ ...wrapperStyle, ...userStyle }} {...rest}>
      {label && <Text style={labelStyleObj}>{label}</Text>}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-disabled={disabled || undefined}
        disabled={disabled}
        style={triggerStyle}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
      >
        {/* Calendar icon */}
        <svg
          width={sizeConfig.iconSize}
          height={sizeConfig.iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, opacity: 0.6 }}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>

        <Text style={{ flex: 1, color: hasValue ? undefined : themeColors.text.muted }}>
          {hasValue && currentRange.start ? formatDateShort(currentRange.start) : placeholder}
        </Text>

        {hasValue && currentRange.end && (
          <>
            {/* Arrow icon between dates */}
            <svg
              width={sizeConfig.iconSize}
              height={sizeConfig.iconSize}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, opacity: 0.5 }}
            >
              <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>

            <Text>{formatDateShort(currentRange.end)}</Text>
          </>
        )}
      </button>

      {isOpen && (
        <div ref={dropdownRef} role="dialog" aria-label="Date range picker" style={dropdownStyle}>
          {/* Left calendar */}
          <div>
            <div style={headerStyle}>
              <button
                type="button"
                style={buildNavButtonStyle(sizeConfig, theme, hoveredNav === 'prev')}
                onMouseEnter={() => setHoveredNav('prev')}
                onMouseLeave={() => setHoveredNav(null)}
                onClick={goToPrevMonth}
                aria-label="Previous month"
              >
                <svg
                  width={sizeConfig.iconSize}
                  height={sizeConfig.iconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <Text style={monthYearStyle}>
                {monthNames[displayMonth]} {displayYear}
              </Text>

              <div style={{ width: sizeConfig.cellSize < 32 ? 24 : 28 }} />
            </div>

            <CalendarMonth
              year={displayYear}
              month={displayMonth}
              rangeStart={activeStart}
              rangeEnd={activeEnd}
              hoveredDate={hoveredDate}
              onDateClick={handleDateClick}
              onDateHover={setHoveredDate}
              minDate={minDate}
              maxDate={maxDate}
              sizeConfig={sizeConfig}


            />
          </div>

          {/* Right calendar */}
          <div>
            <div style={headerStyle}>
              <div style={{ width: sizeConfig.cellSize < 32 ? 24 : 28 }} />

              <Text style={monthYearStyle}>
                {monthNames[rightMonth]} {rightYear}
              </Text>

              <button
                type="button"
                style={buildNavButtonStyle(sizeConfig, theme, hoveredNav === 'next')}
                onMouseEnter={() => setHoveredNav('next')}
                onMouseLeave={() => setHoveredNav(null)}
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <svg
                  width={sizeConfig.iconSize}
                  height={sizeConfig.iconSize}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <CalendarMonth
              year={rightYear}
              month={rightMonth}
              rangeStart={activeStart}
              rangeEnd={activeEnd}
              hoveredDate={hoveredDate}
              onDateClick={handleDateClick}
              onDateHover={setHoveredDate}
              minDate={minDate}
              maxDate={maxDate}
              sizeConfig={sizeConfig}


            />
          </div>
        </div>
      )}
    </div>
  );
});

DateRangePicker.displayName = 'DateRangePicker';
