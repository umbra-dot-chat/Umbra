/**
 * @module primitives/number-input
 * @description React Native NumberInput primitive for the Wisp design system.
 *
 * Reuses input size maps and color resolution from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<TextInput>` instead of `<input>` and `<Pressable>` instead of `<button>`.
 * - Hold-to-repeat via `setTimeout` / `setInterval` with `onPressIn` / `onPressOut`.
 * - No `useId()`, `htmlFor`, or `aria-describedby` (RN accessibility model).
 * - No CSS hover states — pressed state via `Pressable` callback styles.
 * - Simple `+` / `-` text in buttons instead of Lucide SVG icons.
 * - Label and hint rendered as `<Text>` components from `../text`.
 */

import React, { forwardRef, useMemo, useCallback, useState, useRef } from 'react';
import { View, TextInput, Pressable } from 'react-native';
import type {
  ViewProps,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TargetedEvent,
} from 'react-native';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import { inputSizeMap } from '@coexist/wisp-core/types/Input.types';
import { resolveInputColors } from '@coexist/wisp-core/styles/Input.styles';
import { Text } from '../text';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
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
// Button size map (circular stepper buttons)
// ---------------------------------------------------------------------------

interface ButtonSizeConfig {
  buttonSize: number;
  fontSize: number;
}

const buttonSizeMap: Record<ComponentSize, ButtonSizeConfig> = {
  xs: { buttonSize: 24, fontSize: defaultTypography.sizes.base.fontSize },
  sm: { buttonSize: 28, fontSize: defaultTypography.sizes.lg.fontSize },
  md: { buttonSize: 36, fontSize: defaultTypography.sizes.xl.fontSize },
  lg: { buttonSize: 44, fontSize: defaultTypography.sizes['2xl'].fontSize },
  xl: { buttonSize: 52, fontSize: 28 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NumberInputProps extends Omit<ViewProps, 'children'> {
  /** Controlled numeric value. */
  value?: number;

  /** Initial value for uncontrolled mode. @default 0 */
  defaultValue?: number;

  /** Called whenever the value changes. Receives the clamped number. */
  onChange?: (value: number) => void;

  /** Minimum allowed value. */
  min?: number;

  /** Maximum allowed value. */
  max?: number;

  /** Step increment. @default 1 */
  step?: number;

  /** Component size token. @default 'md' */
  size?: ComponentSize;

  /** Disables the input and stepper buttons. @default false */
  disabled?: boolean;

  /** Label text rendered above the input. */
  label?: string;

  /** Hint text rendered below the input. */
  hint?: string;

  /** Error state. String shows as error message, boolean shows error border. */
  error?: string | boolean;

  /** Stretches to full container width when true. @default false */
  fullWidth?: boolean;

  /** Optional style override for the wrapper View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NumberInput — Numeric stepper input with circular increment/decrement buttons.
 *
 * @remarks
 * Key features:
 * - Controlled and uncontrolled modes via `value` / `defaultValue`
 * - Min / max clamping with floating-point drift prevention
 * - Configurable step increment
 * - Hold-to-repeat on sustained button press
 * - Five sizes (`xs` through `xl`)
 * - Error, disabled, label, hint, and fullWidth states
 *
 * @example
 * ```tsx
 * <NumberInput defaultValue={1} min={0} max={10} step={1} />
 * <NumberInput value={qty} onChange={setQty} label="Quantity" />
 * ```
 */
export const NumberInput = forwardRef<View, NumberInputProps>(
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
      label,
      hint,
      error = false,
      fullWidth = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = inputSizeMap[size];
    const btnConfig = buttonSizeMap[size];

    // -------------------------------------------------------------------
    // Internal state (uncontrolled mode)
    // -------------------------------------------------------------------
    const [internalValue, setInternalValue] = useState<number>(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    // -------------------------------------------------------------------
    // Focus state
    // -------------------------------------------------------------------
    const [focused, setFocused] = useState(false);

    // -------------------------------------------------------------------
    // Refs for hold-to-repeat
    // -------------------------------------------------------------------
    const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const repeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Keep current callbacks accessible in timers without stale closures
    const incrementRef = useRef<() => void>(() => {});
    const decrementRef = useRef<() => void>(() => {});

    // -------------------------------------------------------------------
    // Value updater
    // -------------------------------------------------------------------
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

    // Keep refs in sync
    incrementRef.current = increment;
    decrementRef.current = decrement;

    // -------------------------------------------------------------------
    // Hold-to-repeat handlers
    // -------------------------------------------------------------------
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
      (actionRef: React.MutableRefObject<() => void>) => {
        if (disabled) return;
        actionRef.current();
        repeatTimerRef.current = setTimeout(() => {
          repeatIntervalRef.current = setInterval(() => {
            actionRef.current();
          }, REPEAT_INTERVAL);
        }, REPEAT_DELAY);
      },
      [disabled],
    );

    const handleMinusPressIn = useCallback(() => {
      startRepeat(decrementRef);
    }, [startRepeat]);

    const handlePlusPressIn = useCallback(() => {
      startRepeat(incrementRef);
    }, [startRepeat]);

    const handlePressOut = useCallback(() => {
      clearRepeat();
    }, [clearRepeat]);

    // -------------------------------------------------------------------
    // TextInput change handler
    // -------------------------------------------------------------------
    const [inputText, setInputText] = useState<string | null>(null);

    const handleChangeText = useCallback(
      (raw: string) => {
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

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        if (!disabled) {
          setFocused(true);
          setInputText(null);
        }
      },
      [disabled],
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TargetedEvent>) => {
        setFocused(false);
        setInputText(null);
      },
      [],
    );

    // -------------------------------------------------------------------
    // Derived state
    // -------------------------------------------------------------------
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;
    const bottomText = errorMessage || hint;

    const colors = useMemo(
      () => resolveInputColors(focused, hasError, false, disabled, theme),
      [focused, hasError, disabled, themeColors],
    );

    const minusDisabled = disabled || (min !== undefined && currentValue <= min);
    const plusDisabled = disabled || (max !== undefined && currentValue >= max);

    // -------------------------------------------------------------------
    // Displayed text value
    // -------------------------------------------------------------------
    const displayedValue = inputText !== null ? inputText : String(currentValue);

    // -------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------
    const wrapperStyle = useMemo<ViewStyle>(() => ({
      gap: defaultSpacing.sm,
      ...(fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }),
    }), [fullWidth]);

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      height: sizeConfig.height + 16,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: sizeConfig.borderRadius + 4,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: disabled ? colors.bg : 'transparent',
      opacity: disabled ? 0.5 : 1,
    }), [sizeConfig, colors, disabled]);

    const inputStyle = useMemo<TextStyle>(() => ({
      flex: 1,
      fontSize: sizeConfig.fontSize + 1,
      fontWeight: defaultTypography.weights.medium,
      textAlign: 'center',
      color: colors.text,
      padding: 0,
    }), [sizeConfig, colors]);

    const buttonBaseStyle = useCallback(
      (isDisabled: boolean): ViewStyle => ({
        width: btnConfig.buttonSize,
        height: btnConfig.buttonSize,
        borderRadius: btnConfig.buttonSize / 2,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabled ? 0.4 : 1,
      }),
      [btnConfig],
    );

    const labelStyle = useMemo<TextStyle | undefined>(() => {
      if (!label) return undefined;
      return {
        fontSize: sizeConfig.labelFontSize,
        fontWeight: defaultTypography.weights.semibold,
        color: disabled ? themeColors.text.muted : themeColors.text.primary,
        marginBottom: defaultSpacing['2xs'],
      };
    }, [label, sizeConfig, disabled, themeColors]);

    const hintStyle = useMemo<TextStyle | undefined>(() => {
      if (!bottomText) return undefined;
      return {
        fontSize: sizeConfig.hintFontSize,
        color: hasError ? themeColors.status.danger : themeColors.text.muted,
        marginTop: defaultSpacing['2xs'],
      };
    }, [bottomText, sizeConfig, hasError, themeColors]);

    const buttonTextStyle = useCallback(
      (isDisabled: boolean): TextStyle => ({
        fontSize: btnConfig.fontSize,
        fontWeight: defaultTypography.weights.semibold,
        color: isDisabled ? themeColors.text.muted : themeColors.text.inverse,
        lineHeight: btnConfig.fontSize + 2,
      }),
      [btnConfig, themeColors],
    );

    // -------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------
    return (
      <View ref={ref} style={[wrapperStyle, userStyle]} {...rest}>
        {label && <Text style={labelStyle}>{label}</Text>}

        <View style={containerStyle}>
          {/* Minus button — circular */}
          <Pressable
            onPressIn={handleMinusPressIn}
            onPressOut={handlePressOut}
            disabled={minusDisabled}
            accessibilityRole="button"
            accessibilityLabel="Decrement"
            accessibilityState={{ disabled: minusDisabled }}
            style={({ pressed }) => [
              buttonBaseStyle(minusDisabled),
              {
                backgroundColor: minusDisabled
                  ? themeColors.accent.highlight
                  : pressed
                    ? themeColors.accent.primaryActive
                    : themeColors.accent.primary,
              },
            ]}
          >
            <Text style={buttonTextStyle(minusDisabled)}>-</Text>
          </Pressable>

          {/* Input field */}
          <TextInput
            editable={!disabled}
            keyboardType="numeric"
            value={displayedValue}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholderTextColor={colors.placeholder}
            style={inputStyle}
            accessibilityLabel={label || 'Number input'}
          />

          {/* Plus button — circular */}
          <Pressable
            onPressIn={handlePlusPressIn}
            onPressOut={handlePressOut}
            disabled={plusDisabled}
            accessibilityRole="button"
            accessibilityLabel="Increment"
            accessibilityState={{ disabled: plusDisabled }}
            style={({ pressed }) => [
              buttonBaseStyle(plusDisabled),
              {
                backgroundColor: plusDisabled
                  ? themeColors.accent.highlight
                  : pressed
                    ? themeColors.accent.primaryActive
                    : themeColors.accent.primary,
              },
            ]}
          >
            <Text style={buttonTextStyle(plusDisabled)}>+</Text>
          </Pressable>
        </View>

        {bottomText && <Text style={hintStyle}>{bottomText}</Text>}
      </View>
    );
  },
);

NumberInput.displayName = 'NumberInput';
