import React, { forwardRef, useMemo, useCallback, useState, useRef, useId } from 'react';
import { Minus, Plus } from 'lucide-react';
import type { NumberInputProps } from '@coexist/wisp-core/types/NumberInput.types';
import { inputSizeMap } from '@coexist/wisp-core/types/Input.types';
import {
  numberInputButtonSizeMap,
  buildWrapperStyle,
  buildContainerStyle,
  buildInputStyle,
  buildButtonStyle,
  buildLabelStyle,
  buildHintStyle,
} from '@coexist/wisp-core/styles/NumberInput.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clamp a value between optional min and max bounds. */
function clamp(val: number, min?: number, max?: number): number {
  let clamped = val;
  if (min !== undefined && clamped < min) clamped = min;
  if (max !== undefined && clamped > max) clamped = max;
  return clamped;
}

/** Round a float to avoid floating-point drift (e.g. 0.1 + 0.2). */
function round(val: number, step: number): number {
  const precision = Math.max(
    (step.toString().split('.')[1] || '').length,
    (val.toString().split('.')[1] || '').length,
  );
  return Number(val.toFixed(precision));
}

// ---------------------------------------------------------------------------
// Hold-to-repeat interval config
// ---------------------------------------------------------------------------

const REPEAT_DELAY = 400; // ms before repeating starts
const REPEAT_INTERVAL = 80; // ms between repeats

// ---------------------------------------------------------------------------
// NumberInput
// ---------------------------------------------------------------------------

/**
 * NumberInput — Numeric stepper input with circular increment/decrement buttons.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled modes via {@link NumberInputProps.value} / {@link NumberInputProps.defaultValue}
 * - Min / max clamping with floating-point drift prevention
 * - Configurable step increment
 * - Keyboard support (ArrowUp / ArrowDown)
 * - Hold-to-repeat on sustained button press
 * - Three sizes (`sm`, `md`, `lg`) via {@link NumberInputProps.size}
 * - Error, disabled, label, hint, and fullWidth states
 * - Circular accent-colored +/- stepper buttons
 *
 * @module primitives/number-input
 * @example
 * ```tsx
 * <NumberInput defaultValue={1} min={0} max={10} step={1} />
 * <NumberInput value={qty} onChange={setQty} label="Quantity" />
 * ```
 */
export const NumberInput = forwardRef<HTMLDivElement, NumberInputProps>(
  function NumberInput(
    {
      value: controlledValue,
      defaultValue = 0,
      onChange,
      min,
      max,
      step = 1,
      size = 'md',
      disabled = false,
      error = false,
      placeholder,
      fullWidth = false,
      label,
      hint,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const generatedId = useId();
    const inputId = `number-input-${generatedId}`;

    // -----------------------------------------------------------------------
    // Internal state (uncontrolled mode)
    // -----------------------------------------------------------------------
    const [internalValue, setInternalValue] = useState<number>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // -----------------------------------------------------------------------
    // Focus & hover state
    // -----------------------------------------------------------------------
    const [focused, setFocused] = useState(false);
    const [minusHovered, setMinusHovered] = useState(false);
    const [plusHovered, setPlusHovered] = useState(false);

    // -----------------------------------------------------------------------
    // Refs for hold-to-repeat
    // -----------------------------------------------------------------------
    const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // -----------------------------------------------------------------------
    // Value updater
    // -----------------------------------------------------------------------
    const updateValue = useCallback(
      (next: number) => {
        const clamped = clamp(round(next, step), min, max);
        if (!isControlled) setInternalValue(clamped);
        onChange?.(clamped);
      },
      [isControlled, onChange, min, max, step],
    );

    const increment = useCallback(() => {
      updateValue(currentValue + step);
    }, [currentValue, step, updateValue]);

    const decrement = useCallback(() => {
      updateValue(currentValue - step);
    }, [currentValue, step, updateValue]);

    // -----------------------------------------------------------------------
    // Hold-to-repeat handlers
    // -----------------------------------------------------------------------
    const clearRepeat = useCallback(() => {
      if (repeatTimerRef.current) {
        clearTimeout(repeatTimerRef.current);
        repeatTimerRef.current = null;
      }
      if (repeatIntervalRef.current) {
        clearInterval(repeatIntervalRef.current);
        repeatIntervalRef.current = null;
      }
    }, []);

    const startRepeat = useCallback(
      (action: () => void) => {
        if (disabled) return;
        action();
        repeatTimerRef.current = setTimeout(() => {
          repeatIntervalRef.current = setInterval(action, REPEAT_INTERVAL);
        }, REPEAT_DELAY);
      },
      [disabled],
    );

    const handleMinusDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        startRepeat(decrement);
      },
      [startRepeat, decrement],
    );

    const handlePlusDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        startRepeat(increment);
      },
      [startRepeat, increment],
    );

    const handleMouseUpOrLeave = useCallback(() => {
      clearRepeat();
    }, [clearRepeat]);

    // -----------------------------------------------------------------------
    // Input text change handler
    // -----------------------------------------------------------------------
    const [inputText, setInputText] = useState<string | null>(null);

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;

        // Allow empty, minus sign, or decimal-in-progress while typing
        if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
          setInputText(raw);
          return;
        }

        const parsed = parseFloat(raw);
        if (!isNaN(parsed)) {
          setInputText(raw);
          updateValue(parsed);
        }
      },
      [updateValue],
    );

    const handleInputFocus = useCallback(() => {
      if (!disabled) {
        setFocused(true);
        setInputText(null);
      }
    }, [disabled]);

    const handleInputBlur = useCallback(() => {
      setFocused(false);
      setInputText(null);
    }, []);

    // -----------------------------------------------------------------------
    // Keyboard handler
    // -----------------------------------------------------------------------
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          increment();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          decrement();
        }
      },
      [disabled, increment, decrement],
    );

    // -----------------------------------------------------------------------
    // Resolve dimensions
    // -----------------------------------------------------------------------
    const sizeConfig = useMemo(() => inputSizeMap[size], [size]);
    const buttonConfig = useMemo(() => numberInputButtonSizeMap[size], [size]);

    // -----------------------------------------------------------------------
    // Build styles
    // -----------------------------------------------------------------------
    const wrapperStyle = useMemo(
      () => buildWrapperStyle(fullWidth, theme),
      [fullWidth, theme],
    );

    const containerStyle = useMemo(
      () => buildContainerStyle(sizeConfig, disabled, error, focused, theme),
      [sizeConfig, disabled, error, focused, theme],
    );

    const inputStyle = useMemo(
      () => buildInputStyle(sizeConfig, theme),
      [sizeConfig, theme],
    );

    const minusButtonStyle = useMemo(
      () => buildButtonStyle(buttonConfig, disabled || (min !== undefined && currentValue <= min), minusHovered, theme),
      [buttonConfig, disabled, min, currentValue, minusHovered, theme],
    );

    const plusButtonStyle = useMemo(
      () => buildButtonStyle(buttonConfig, disabled || (max !== undefined && currentValue >= max), plusHovered, theme),
      [buttonConfig, disabled, max, currentValue, plusHovered, theme],
    );

    const labelStyle = useMemo(
      () => (label ? buildLabelStyle(sizeConfig, disabled, theme) : undefined),
      [label, sizeConfig, disabled, theme],
    );

    const hintStyle = useMemo(
      () => (hint ? buildHintStyle(sizeConfig, error, theme) : undefined),
      [hint, sizeConfig, error, theme],
    );

    // -----------------------------------------------------------------------
    // Displayed text value
    // -----------------------------------------------------------------------
    const displayedValue = inputText !== null ? inputText : String(currentValue);

    // -----------------------------------------------------------------------
    // Determine button disabled states
    // -----------------------------------------------------------------------
    const minusDisabled = disabled || (min !== undefined && currentValue <= min);
    const plusDisabled = disabled || (max !== undefined && currentValue >= max);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div
        ref={ref}
        style={{ ...wrapperStyle, ...userStyle }}
        className={className}
        {...rest}
      >
        {/* Label */}
        {label && (
          <label htmlFor={inputId} style={labelStyle}>
            {label}
          </label>
        )}

        {/* Container */}
        <div style={containerStyle}>
          {/* Minus button — circular */}
          <button
            type="button"
            aria-label="Decrement"
            tabIndex={-1}
            disabled={minusDisabled}
            style={minusButtonStyle}
            onMouseDown={handleMinusDown}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={() => { handleMouseUpOrLeave(); setMinusHovered(false); }}
            onMouseEnter={() => setMinusHovered(true)}
          >
            <Minus size={buttonConfig.iconSize} strokeWidth={2.5} />
          </button>

          {/* Input field */}
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="decimal"
            role="spinbutton"
            aria-valuenow={currentValue}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-invalid={error || undefined}
            aria-describedby={hint ? `${inputId}-hint` : undefined}
            disabled={disabled}
            placeholder={placeholder}
            value={displayedValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            style={inputStyle}
          />

          {/* Plus button — circular */}
          <button
            type="button"
            aria-label="Increment"
            tabIndex={-1}
            disabled={plusDisabled}
            style={plusButtonStyle}
            onMouseDown={handlePlusDown}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={() => { handleMouseUpOrLeave(); setPlusHovered(false); }}
            onMouseEnter={() => setPlusHovered(true)}
          >
            <Plus size={buttonConfig.iconSize} strokeWidth={2.5} />
          </button>
        </div>

        {/* Hint text */}
        {hint && (
          <span id={`${inputId}-hint`} style={hintStyle}>
            {hint}
          </span>
        )}
      </div>
    );
  },
);

NumberInput.displayName = 'NumberInput';
