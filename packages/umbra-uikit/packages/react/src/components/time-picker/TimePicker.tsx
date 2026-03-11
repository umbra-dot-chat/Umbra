import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { TimePickerProps } from '@coexist/wisp-core/types/TimePicker.types';
import { timePickerSizeMap } from '@coexist/wisp-core/types/TimePicker.types';
import {
  buildTimePickerContainerStyle,
  buildTimePickerTriggerStyle,
  buildTimePickerDropdownStyle,
  buildTimePickerColumnStyle,
  buildTimePickerOptionStyle,
  buildTimePickerLabelStyle,
  buildTimePickerErrorStyle,
  buildTimePickerSkeletonStyle,
} from '@coexist/wisp-core/styles/TimePicker.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Parse a 24h time string "HH:MM" into { hour24, minute }. */
function parseTime(time: string): { hour24: number; minute: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour24 = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return null;
  return { hour24, minute };
}

/** Convert 24h hour to 12h parts. */
function to12h(hour24: number): { hour12: number; period: 'AM' | 'PM' } {
  const period: 'AM' | 'PM' = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, period };
}

/** Convert 12h parts back to 24h hour. */
function to24h(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

/** Pad a number to 2 digits. */
function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Format a time string for display. */
function formatDisplay(time: string, format: '12h' | '24h'): string {
  const parsed = parseTime(time);
  if (!parsed) return '';
  if (format === '24h') return `${pad(parsed.hour24)}:${pad(parsed.minute)}`;
  const { hour12, period } = to12h(parsed.hour24);
  return `${hour12}:${pad(parsed.minute)} ${period}`;
}

// ---------------------------------------------------------------------------
// Clock SVG Icon
// ---------------------------------------------------------------------------

function ClockIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// TimePicker
// ---------------------------------------------------------------------------

/**
 * TimePicker -- A time selection component with scrollable columns.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled usage via {@link TimePickerProps.value} / {@link TimePickerProps.defaultValue}.
 * - 12-hour (with AM/PM) and 24-hour format support.
 * - Configurable minute step interval.
 * - Scrollable columns for hours, minutes, and AM/PM.
 * - Closes on outside click and Escape key.
 * - Auto-scrolls selected option into view on open.
 * - Skeleton loading and error states.
 *
 * @module components/time-picker
 * @example
 * ```tsx
 * <TimePicker
 *   size="md"
 *   label="Start time"
 *   format="12h"
 *   onChange={(time) => console.log(time)}
 * />
 * ```
 */
export const TimePicker = forwardRef<HTMLDivElement, TimePickerProps>(function TimePicker(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    size = 'md',
    format = '12h',
    minuteStep = 1,
    placeholder = 'Select time',
    disabled = false,
    skeleton = false,
    label,
    error,
    className,
    style: userStyle,
    ...restProps
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = timePickerSizeMap[size];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

  // Controlled / uncontrolled
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
  const currentValue = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [hoveredMinute, setHoveredMinute] = useState<number | null>(null);
  const [hoveredPeriod, setHoveredPeriod] = useState<string | null>(null);

  const hasError = error === true || (typeof error === 'string' && error.length > 0);
  const errorText = typeof error === 'string' && error.length > 0 ? error : undefined;

  // Derive selected hour, minute, period from current value
  const parsed = currentValue ? parseTime(currentValue) : null;
  const selectedHour24 = parsed?.hour24 ?? null;
  const selectedMinute = parsed?.minute ?? null;
  const selected12h = selectedHour24 !== null ? to12h(selectedHour24) : null;

  // Generate options
  const hours: number[] = useMemo(() => {
    if (format === '24h') {
      return Array.from({ length: 24 }, (_, i) => i);
    }
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }, [format]);

  const minutes: number[] = useMemo(() => {
    const result: number[] = [];
    for (let i = 0; i < 60; i += minuteStep) {
      result.push(i);
    }
    return result;
  }, [minuteStep]);

  // Styles
  const containerStyle = useMemo(() => buildTimePickerContainerStyle(sizeConfig, theme), [sizeConfig, theme]);
  const triggerStyle = useMemo(
    () => buildTimePickerTriggerStyle(sizeConfig, theme, isOpen, disabled, hasError, false),
    [sizeConfig, theme, isOpen, disabled, hasError],
  );
  const dropdownStyle = useMemo(
    () => buildTimePickerDropdownStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );
  const columnStyle = useMemo(
    () => buildTimePickerColumnStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );
  const labelStyle = useMemo(
    () => buildTimePickerLabelStyle(sizeConfig, theme, disabled),
    [sizeConfig, theme, disabled],
  );
  const errorStyle = useMemo(
    () => buildTimePickerErrorStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  // Commit a time change
  const commitTime = useCallback(
    (hour24: number, minute: number) => {
      const timeStr = `${pad(hour24)}:${pad(minute)}`;
      if (!isControlled) setInternalValue(timeStr);
      onChange?.(timeStr);
    },
    [isControlled, onChange],
  );

  // Hour selection
  const handleHourSelect = useCallback(
    (hour: number) => {
      const min = selectedMinute ?? 0;
      if (format === '24h') {
        commitTime(hour, min);
      } else {
        const period = selected12h?.period ?? 'AM';
        commitTime(to24h(hour, period), min);
      }
    },
    [format, selectedMinute, selected12h, commitTime],
  );

  // Minute selection
  const handleMinuteSelect = useCallback(
    (minute: number) => {
      const h24 = selectedHour24 ?? (format === '24h' ? 0 : 12);
      commitTime(h24, minute);
    },
    [format, selectedHour24, commitTime],
  );

  // Period selection
  const handlePeriodSelect = useCallback(
    (period: 'AM' | 'PM') => {
      const hour12 = selected12h?.hour12 ?? 12;
      const min = selectedMinute ?? 0;
      commitTime(to24h(hour12, period), min);
    },
    [selected12h, selectedMinute, commitTime],
  );

  // Toggle dropdown
  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  }, [disabled]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [isOpen],
  );

  // Scroll selected options into view on open
  useEffect(() => {
    if (!isOpen) return;
    // Small delay to let the dropdown render
    const timer = setTimeout(() => {
      [hoursRef, minutesRef, periodRef].forEach((colRef) => {
        if (!colRef.current) return;
        const selected = colRef.current.querySelector('[data-selected="true"]') as HTMLElement;
        if (selected) {
          selected.scrollIntoView({ block: 'nearest' });
        }
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Display value
  const displayText = currentValue ? formatDisplay(currentValue, format) : '';

  // Skeleton
  if (skeleton) {
    const skeletonStyle = buildTimePickerSkeletonStyle(sizeConfig, theme);
    return (
      <div aria-hidden data-testid="time-picker-skeleton" className={className} style={{ ...skeletonStyle, ...userStyle }} />
    );
  }

  return (
    <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} onKeyDown={handleKeyDown} {...restProps}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-disabled={disabled || undefined}
        disabled={disabled}
        style={triggerStyle}
        onClick={handleToggle}
      >
        <ClockIcon size={sizeConfig.iconSize} color={disabled ? themeColors.text.muted : themeColors.text.secondary} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: displayText ? themeColors.text.primary : themeColors.text.muted,
            fontFamily: fontFamilyStacks.sans,
          }}
        >
          {displayText || placeholder}
        </span>
      </button>

      {isOpen && (
        <div ref={dropdownRef} role="listbox" style={dropdownStyle}>
          {/* Hours column */}
          <div ref={hoursRef} style={columnStyle}>
            {hours.map((hour) => {
              const isSelected = format === '24h'
                ? selectedHour24 === hour
                : selected12h?.hour12 === hour;
              return (
                <div
                  key={`h-${hour}`}
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected || undefined}
                  style={buildTimePickerOptionStyle(sizeConfig, theme, isSelected, hoveredHour === hour)}
                  onClick={() => handleHourSelect(hour)}
                  onMouseEnter={() => setHoveredHour(hour)}
                  onMouseLeave={() => setHoveredHour(null)}
                >
                  {format === '24h' ? pad(hour) : hour}
                </div>
              );
            })}
          </div>

          {/* Minutes column */}
          <div ref={minutesRef} style={columnStyle}>
            {minutes.map((minute) => {
              const isSelected = selectedMinute === minute;
              return (
                <div
                  key={`m-${minute}`}
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected || undefined}
                  style={buildTimePickerOptionStyle(sizeConfig, theme, isSelected, hoveredMinute === minute)}
                  onClick={() => handleMinuteSelect(minute)}
                  onMouseEnter={() => setHoveredMinute(minute)}
                  onMouseLeave={() => setHoveredMinute(null)}
                >
                  {pad(minute)}
                </div>
              );
            })}
          </div>

          {/* AM/PM column (12h only) */}
          {format === '12h' && (
            <div ref={periodRef} style={columnStyle}>
              {(['AM', 'PM'] as const).map((period) => {
                const isSelected = selected12h?.period === period;
                return (
                  <div
                    key={period}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected || undefined}
                    style={buildTimePickerOptionStyle(sizeConfig, theme, isSelected, hoveredPeriod === period)}
                    onClick={() => handlePeriodSelect(period)}
                    onMouseEnter={() => setHoveredPeriod(period)}
                    onMouseLeave={() => setHoveredPeriod(null)}
                  >
                    {period}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {errorText && <Text style={errorStyle}>{errorText}</Text>}
    </div>
  );
});

TimePicker.displayName = 'TimePicker';
