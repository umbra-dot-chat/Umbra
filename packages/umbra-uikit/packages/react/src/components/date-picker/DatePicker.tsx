import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { DatePickerProps } from '@coexist/wisp-core/types/DatePicker.types';
import { datePickerSizeMap } from '@coexist/wisp-core/types/DatePicker.types';
import {
  buildDatePickerContainerStyle,
  buildDatePickerTriggerStyle,
  buildDatePickerDropdownStyle,
  buildDatePickerIconStyle,
  buildDatePickerClearStyle,
  buildDatePickerLabelStyle,
  buildDatePickerErrorStyle,
  buildDatePickerSkeletonStyle,
} from '@coexist/wisp-core/styles/DatePicker.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives/text';
import { Calendar } from '../calendar';

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

/**
 * Formats a `Date` into a display string based on a simple format token.
 *
 * @param date - The date to format.
 * @param format - The format string (supports `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`).
 * @returns A formatted date string.
 */
function formatDate(date: Date, format: string): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = String(date.getFullYear());

  switch (format) {
    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`;
    case 'MM/DD/YYYY':
    default:
      return `${mm}/${dd}/${yyyy}`;
  }
}

// ---------------------------------------------------------------------------
// DatePicker
// ---------------------------------------------------------------------------

/**
 * DatePicker -- A date selection component with a trigger and Calendar dropdown.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled usage via {@link DatePickerProps.value} / {@link DatePickerProps.defaultValue}.
 * - Calendar icon trigger with formatted date display.
 * - Optional clear button to reset the selected date.
 * - Closes on date select, outside click, or Escape key.
 * - Supports label, error state, disabled state, and skeleton loading.
 * - Min/max date and disabled dates forwarded to the Calendar.
 *
 * @module components/date-picker
 * @example
 * ```tsx
 * <DatePicker
 *   size="md"
 *   label="Start date"
 *   placeholder="Select date"
 *   onChange={(date) => console.log(date)}
 * />
 * ```
 */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(function DatePicker(
  {
    value: controlledValue,
    defaultValue,
    onChange,
    size = 'md',
    placeholder = 'Select date',
    format = 'MM/DD/YYYY',
    minDate,
    maxDate,
    disabledDates,
    disabled = false,
    skeleton = false,
    label,
    error,
    clearable = true,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = datePickerSizeMap[size];
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState<Date | undefined>(defaultValue);
  const selectedDate = isControlled ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [isTriggerHovered, setIsTriggerHovered] = useState(false);
  const [isClearHovered, setIsClearHovered] = useState(false);

  const hasError = error === true || (typeof error === 'string' && error.length > 0);
  const errorText = typeof error === 'string' && error.length > 0 ? error : undefined;

  // -------------------------------------------------------------------------
  // Memoised styles
  // -------------------------------------------------------------------------

  const containerStyle = useMemo(
    () => buildDatePickerContainerStyle(sizeConfig, false, theme),
    [sizeConfig, theme],
  );

  const triggerStyle = useMemo(
    () => buildDatePickerTriggerStyle(sizeConfig, theme, isOpen, disabled, hasError, isTriggerHovered),
    [sizeConfig, theme, isOpen, disabled, hasError, isTriggerHovered],
  );

  const dropdownStyle = useMemo(
    () => buildDatePickerDropdownStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  const iconStyle = useMemo(
    () => buildDatePickerIconStyle(theme, disabled),
    [theme, disabled],
  );

  const clearStyle = useMemo(
    () => buildDatePickerClearStyle(theme, isClearHovered),
    [theme, isClearHovered],
  );

  const labelStyle = useMemo(
    () => buildDatePickerLabelStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  const errorStyle = useMemo(
    () => buildDatePickerErrorStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  }, [disabled]);

  const handleSelect = useCallback(
    (date: Date) => {
      if (!isControlled) setInternalValue(date);
      onChange?.(date);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [isControlled, onChange],
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) setInternalValue(undefined);
      onChange?.(null);
      triggerRef.current?.focus();
    },
    [isControlled, onChange],
  );

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Keyboard on trigger
  // -------------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    [disabled, isOpen],
  );

  // -------------------------------------------------------------------------
  // Skeleton
  // -------------------------------------------------------------------------

  if (skeleton) {
    const skeletonStyle = buildDatePickerSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        data-testid="datepicker-skeleton"
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const displayText = selectedDate ? formatDate(selectedDate, format) : undefined;

  return (
    <div
      ref={(node) => {
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      {...rest}
    >
      {label && <Text style={labelStyle}>{label}</Text>}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-disabled={disabled || undefined}
        disabled={disabled}
        style={triggerStyle}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsTriggerHovered(true)}
        onMouseLeave={() => setIsTriggerHovered(false)}
      >
        {/* Calendar icon */}
        <span style={iconStyle}>
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
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </span>

        {/* Display text or placeholder */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
            color: displayText ? themeColors.text.primary : themeColors.text.muted,
          }}
        >
          {displayText || placeholder}
        </span>

        {/* Clear button */}
        {clearable && selectedDate && !disabled && (
          <button
            type="button"
            aria-label="Clear date"
            style={clearStyle}
            onClick={handleClear}
            onMouseEnter={() => setIsClearHovered(true)}
            onMouseLeave={() => setIsClearHovered(false)}
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
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div ref={dropdownRef} style={dropdownStyle}>
          <Calendar
            value={selectedDate}
            onChange={handleSelect}
            size={size}
            minDate={minDate}
            maxDate={maxDate}
            disabledDates={disabledDates}
          />
        </div>
      )}

      {/* Error message */}
      {errorText && <Text style={errorStyle}>{errorText}</Text>}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';
