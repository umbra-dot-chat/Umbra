/**
 * @module primitives/stepper
 * @description React Native Stepper primitive for the Wisp design system.
 *
 * Reuses size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<Pressable>` with `onPress` instead of `<button>` with `onClick`.
 * - Uses RN `<Text>` for the minus/plus glyphs instead of inline SVGs.
 * - Pressed state via `Pressable` callback styles (no CSS hover).
 * - No keyboard handler, `className`, or skeleton mode.
 * - No CSS `boxShadow` or `transition`.
 */

import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { StepperSize, StepperSizeConfig } from '@coexist/wisp-core/types/Stepper.types';
import { stepperSizeMap } from '@coexist/wisp-core/types/Stepper.types';
import { Text } from '../text';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StepperProps extends Omit<ViewProps, 'children'> {
  /** Current numeric value when used as a controlled component. */
  value?: number;

  /**
   * Initial value when used as an uncontrolled component.
   * @default 0
   */
  defaultValue?: number;

  /** Minimum allowed value. The stepper clamps below this bound. */
  min?: number;

  /** Maximum allowed value. The stepper clamps above this bound. */
  max?: number;

  /**
   * Amount to increment or decrement per step.
   * @default 1
   */
  step?: number;

  /**
   * Size variant controlling height, font size, and button dimensions.
   * @default 'md'
   */
  size?: StepperSize;

  /** Callback invoked with the clamped numeric value whenever it changes. */
  onChange?: (value: number) => void;

  /**
   * When `true`, the stepper buttons are non-interactive.
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true`, the value is displayed but buttons are non-interactive.
   * @default false
   */
  readOnly?: boolean;

  style?: ViewStyle;
}

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
// Component
// ---------------------------------------------------------------------------

/**
 * Stepper -- Compact numeric increment/decrement control for the Wisp design system.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled modes via {@link StepperProps.value} / {@link StepperProps.defaultValue}
 * - Min / max clamping with floating-point drift prevention
 * - Configurable step increment
 * - Three sizes (`sm`, `md`, `lg`) via {@link StepperProps.size}
 * - Disabled and readOnly states
 * - Disables minus button at min, plus button at max
 *
 * @example
 * ```tsx
 * <Stepper defaultValue={1} min={0} max={10} step={1} />
 * <Stepper value={qty} onChange={setQty} />
 * ```
 */
export const Stepper = forwardRef<View, StepperProps>(function Stepper(
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
    style: userStyle,
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
  // Resolve dimensions
  // -----------------------------------------------------------------------
  const sizeConfig: StepperSizeConfig = useMemo(() => stepperSizeMap[size], [size]);

  // -----------------------------------------------------------------------
  // Determine button disabled states
  // -----------------------------------------------------------------------
  const isNonInteractive = disabled || readOnly;
  const minusDisabled = isNonInteractive || (min !== undefined && currentValue <= min);
  const plusDisabled = isNonInteractive || (max !== undefined && currentValue >= max);

  // -----------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------
  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    height: sizeConfig.height,
    borderWidth: 1,
    borderColor: themeColors.border.strong,
    borderRadius: sizeConfig.borderRadius,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    opacity: disabled ? 0.5 : 1,
  }), [sizeConfig, themeColors, disabled]);

  const buttonStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.buttonWidth,
    height: sizeConfig.height,
    alignItems: 'center',
    justifyContent: 'center',
  }), [sizeConfig]);

  const valueCellStyle = useMemo<ViewStyle>(() => ({
    minWidth: sizeConfig.buttonWidth,
    height: sizeConfig.height,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: themeColors.border.strong,
    paddingHorizontal: defaultSpacing.sm,
  }), [sizeConfig, themeColors]);

  const buttonTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.iconSize,
    lineHeight: sizeConfig.iconSize + 2,
    fontWeight: defaultTypography.weights.medium,
  }), [sizeConfig]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <View
      ref={ref}
      accessibilityRole="adjustable"
      accessibilityState={{ disabled }}
      accessibilityValue={{
        now: currentValue,
        min,
        max,
      }}
      style={[containerStyle, userStyle]}
      {...rest}
    >
      {/* Minus / decrement button */}
      <Pressable
        accessibilityLabel="Decrement"
        accessibilityRole="button"
        disabled={minusDisabled}
        onPress={decrement}
        style={({ pressed }) => [
          buttonStyle,
          {
            backgroundColor: pressed && !minusDisabled
              ? themeColors.accent.highlight
              : 'transparent',
          },
        ]}
      >
        <Text
          size="sm"
          weight="medium"
          color={minusDisabled ? themeColors.text.muted : themeColors.text.primary}
          style={buttonTextStyle}
        >
          {'\u2212'}
        </Text>
      </Pressable>

      {/* Value display */}
      <View style={valueCellStyle}>
        <Text
          size="sm"
          weight="medium"
          color={themeColors.text.primary}
          style={{ fontSize: sizeConfig.fontSize }}
        >
          {currentValue}
        </Text>
      </View>

      {/* Plus / increment button */}
      <Pressable
        accessibilityLabel="Increment"
        accessibilityRole="button"
        disabled={plusDisabled}
        onPress={increment}
        style={({ pressed }) => [
          buttonStyle,
          {
            backgroundColor: pressed && !plusDisabled
              ? themeColors.accent.highlight
              : 'transparent',
          },
        ]}
      >
        <Text
          size="sm"
          weight="medium"
          color={plusDisabled ? themeColors.text.muted : themeColors.text.primary}
          style={buttonTextStyle}
        >
          +
        </Text>
      </Pressable>
    </View>
  );
});

Stepper.displayName = 'Stepper';
