/**
 * @module Stepper
 */
import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { StepperProps } from '@coexist/wisp-core/types/Stepper.types';
import { stepperSizeMap } from '@coexist/wisp-core/types/Stepper.types';
import {
  buildStepperContainerStyle,
  buildStepperButtonStyle,
  buildStepperValueStyle,
  getStepperSkeletonStyle,
} from '@coexist/wisp-core/styles/Stepper.styles';
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
// Stepper
// ---------------------------------------------------------------------------

/**
 * Stepper -- Compact numeric increment/decrement control for the Wisp design system.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled modes via {@link StepperProps.value} / {@link StepperProps.defaultValue}
 * - Min / max clamping with floating-point drift prevention
 * - Configurable step increment
 * - Keyboard support (ArrowUp / ArrowDown)
 * - Three sizes (`sm`, `md`, `lg`) via {@link StepperProps.size}
 * - Disabled, readOnly, and skeleton states
 * - Inline SVG minus and plus icons (no external icon dependency)
 * - Disables minus button at min, plus button at max
 *
 * @module primitives/stepper
 * @example
 * ```tsx
 * <Stepper defaultValue={1} min={0} max={10} step={1} />
 * <Stepper value={qty} onChange={setQty} />
 * ```
 */
export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  function Stepper(
    {
      value: controlledValue,
      defaultValue = 0,
      onChange,
      min,
      max,
      step = 1,
      size = 'md',
      disabled = false,
      readOnly = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;

    // -----------------------------------------------------------------------
    // Internal state (uncontrolled mode)
    // -----------------------------------------------------------------------
    const [internalValue, setInternalValue] = useState<number>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // -----------------------------------------------------------------------
    // Hover state per button
    // -----------------------------------------------------------------------
    const [minusHovered, setMinusHovered] = useState(false);
    const [plusHovered, setPlusHovered] = useState(false);

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
    // Keyboard handler
    // -----------------------------------------------------------------------
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (disabled || readOnly) return;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          increment();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          decrement();
        }
      },
      [disabled, readOnly, increment, decrement],
    );

    // -----------------------------------------------------------------------
    // Resolve dimensions
    // -----------------------------------------------------------------------
    const sizeConfig = useMemo(() => stepperSizeMap[size], [size]);

    // -----------------------------------------------------------------------
    // Skeleton
    // -----------------------------------------------------------------------
    if (skeleton) {
      const skeletonStyle = getStepperSkeletonStyle(sizeConfig, theme);
      return (
        <div
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
        />
      );
    }

    // -----------------------------------------------------------------------
    // Determine button disabled states
    // -----------------------------------------------------------------------
    const isNonInteractive = disabled || readOnly;
    const minusDisabled = isNonInteractive || (min !== undefined && currentValue <= min);
    const plusDisabled = isNonInteractive || (max !== undefined && currentValue >= max);

    // -----------------------------------------------------------------------
    // Build styles
    // -----------------------------------------------------------------------
    const containerStyle = useMemo(
      () => buildStepperContainerStyle(sizeConfig, theme),
      [sizeConfig, theme],
    );

    const minusButtonStyle = useMemo(
      () => buildStepperButtonStyle(sizeConfig, theme, minusDisabled, minusHovered),
      [sizeConfig, theme, minusDisabled, minusHovered],
    );

    const plusButtonStyle = useMemo(
      () => buildStepperButtonStyle(sizeConfig, theme, plusDisabled, plusHovered),
      [sizeConfig, theme, plusDisabled, plusHovered],
    );

    const valueStyle = useMemo(
      () => buildStepperValueStyle(sizeConfig, theme),
      [sizeConfig, theme],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div
        ref={ref}
        role="group"
        aria-label="Stepper"
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        tabIndex={disabled ? -1 : 0}
        className={className}
        style={{
          ...containerStyle,
          ...(disabled ? { opacity: 0.5 } : {}),
          ...userStyle,
        }}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {/* Minus / decrement button */}
        <button
          type="button"
          aria-label="Decrement"
          tabIndex={-1}
          disabled={minusDisabled}
          style={minusButtonStyle}
          onClick={decrement}
          onMouseEnter={() => setMinusHovered(true)}
          onMouseLeave={() => setMinusHovered(false)}
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
            <path d="M5 12h14" />
          </svg>
        </button>

        {/* Value display */}
        <span style={valueStyle} aria-live="polite">
          {currentValue}
        </span>

        {/* Plus / increment button */}
        <button
          type="button"
          aria-label="Increment"
          tabIndex={-1}
          disabled={plusDisabled}
          style={plusButtonStyle}
          onClick={increment}
          onMouseEnter={() => setPlusHovered(true)}
          onMouseLeave={() => setPlusHovered(false)}
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
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    );
  },
);

Stepper.displayName = 'Stepper';
