/**
 * @module primitives/pin-input
 * @description React Native PinInput primitive for the Wisp design system.
 *
 * Reuses pin-input size maps and color resolution from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<TextInput>` instead of `<input>` for each cell.
 * - No `useControllable` hook — controlled/uncontrolled handled inline.
 * - Auto-advance and backspace navigation via refs array.
 * - `keyboardType` replaces `inputMode` / `pattern`.
 * - `secureTextEntry` replaces `type="password"` for masked mode.
 * - No `className`, `useId`, or CSS `boxShadow` focus ring.
 * - Label, hint, error rendered as `<Text>` components from `../text`.
 */

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, TextInput } from 'react-native';
import type {
  ViewProps,
  ViewStyle,
  TextStyle,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import type { PinInputType } from '@coexist/wisp-core/types/PinInput.types';
import { pinInputSizeMap } from '@coexist/wisp-core/types/PinInput.types';
import { resolvePinInputColors } from '@coexist/wisp-core/styles/PinInput.styles';
import { Text } from '../text';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PinInputProps extends Omit<ViewProps, 'children'> {
  /** Number of input cells. @default 6 */
  length?: number;

  /** Cell and typography size preset. @default 'md' */
  size?: ComponentSize;

  /** Input mode: `'number'` for digits only, `'text'` for alphanumeric. @default 'number' */
  type?: PinInputType;

  /** Controlled value — a string of length <= `length`. */
  value?: string;

  /** Initial value for uncontrolled mode. @default '' */
  defaultValue?: string;

  /** Called whenever the value changes. Receives the full string. */
  onChange?: (value: string) => void;

  /** Called when every cell is filled. Receives the complete string. */
  onComplete?: (value: string) => void;

  /** Label text rendered above the cells. */
  label?: string;

  /** Hint text rendered below the cells. */
  hint?: string;

  /** Error state — string shows as error message, boolean just shows error border. */
  error?: string | boolean;

  /** Warning state — string shows as warning message, boolean just shows warning border. */
  warning?: string | boolean;

  /** Mask entered characters (show dots). @default false */
  mask?: boolean;

  /** Placeholder character for empty cells. @default '' */
  placeholder?: string;

  /** Disables all cells. @default false */
  disabled?: boolean;

  /** Auto-focus the first cell on mount. @default false */
  autoFocus?: boolean;

  /** Optional style override for the wrapper View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PinInput — A row of single-character input cells for entering verification
 * codes, OTPs, or PINs in the Wisp design system (React Native).
 *
 * @remarks
 * Supports numeric-only and alphanumeric modes, auto-advance on input,
 * backspace navigation, masked display, and all five component sizes.
 *
 * @example
 * ```tsx
 * <PinInput length={6} label="Verification Code" />
 * <PinInput value={code} onChange={setCode} onComplete={handleSubmit} />
 * <PinInput type="text" error="Invalid code" />
 * <PinInput mask />
 * ```
 */
export const PinInput = forwardRef<View, PinInputProps>(function PinInput(
  {
    length = 6,
    size = 'md',
    type = 'number',
    value,
    defaultValue = '',
    onChange,
    onComplete,
    label,
    hint,
    error,
    warning,
    mask = false,
    placeholder = '',
    disabled = false,
    autoFocus = false,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = pinInputSizeMap[size];

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? value : internalValue;

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Array of refs for each TextInput cell
  const cellRefs = useRef<(TextInput | null)[]>([]);

  // -----------------------------------------------------------------------
  // Derived
  // -----------------------------------------------------------------------
  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  const errorMessage = typeof error === 'string' ? error : undefined;
  const warningMessage = typeof warning === 'string' ? warning : undefined;
  const bottomText = errorMessage || warningMessage || hint;
  const isStatusText = Boolean(errorMessage || warningMessage);

  // Split value into array of characters
  const chars = useMemo(() => {
    const arr = currentValue.split('').slice(0, length);
    while (arr.length < length) arr.push('');
    return arr;
  }, [currentValue, length]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const updateValue = useCallback(
    (newChars: string[]) => {
      const newValue = newChars.join('').slice(0, length);
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
      if (newValue.length === length) {
        onComplete?.(newValue);
      }
    },
    [length, isControlled, onChange, onComplete],
  );

  const focusCell = useCallback((index: number) => {
    const cell = cellRefs.current[index];
    if (cell) {
      cell.focus();
    }
  }, []);

  const handleChangeText = useCallback(
    (index: number, inputValue: string) => {
      // Filter for numeric mode
      let char = inputValue;
      if (type === 'number') {
        char = char.replace(/[^0-9]/g, '');
      }

      if (!char) return;

      // Handle paste: distribute characters across cells
      if (char.length > 1) {
        const pastedChars = char.slice(0, length).split('');
        const newChars = [...chars];
        for (let i = 0; i < pastedChars.length && (index + i) < length; i++) {
          newChars[index + i] = pastedChars[i];
        }
        updateValue(newChars);
        const nextIndex = Math.min(index + pastedChars.length, length - 1);
        focusCell(nextIndex);
        return;
      }

      // Take only the last character if multiple were entered
      const singleChar = char.slice(-1);
      const newChars = [...chars];
      newChars[index] = singleChar;
      updateValue(newChars);

      // Auto-advance to next cell
      if (index < length - 1) {
        focusCell(index + 1);
      }
    },
    [chars, type, length, updateValue, focusCell],
  );

  const handleKeyPress = useCallback(
    (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = e.nativeEvent.key;

      if (key === 'Backspace') {
        const newChars = [...chars];

        if (chars[index]) {
          // Clear current cell
          newChars[index] = '';
          updateValue(newChars);
        } else if (index > 0) {
          // Move to previous cell and clear it
          newChars[index - 1] = '';
          updateValue(newChars);
          focusCell(index - 1);
        }
      }
    },
    [chars, updateValue, focusCell],
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  // -----------------------------------------------------------------------
  // Auto-focus on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => focusCell(0), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled, focusCell]);

  // -----------------------------------------------------------------------
  // Styles
  // -----------------------------------------------------------------------
  const wrapperStyle = useMemo<ViewStyle>(() => ({
    gap: sizeConfig.gap > 8 ? 6 : 4,
    alignSelf: 'flex-start',
  }), [sizeConfig]);

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    gap: sizeConfig.gap,
    alignItems: 'center',
  }), [sizeConfig]);

  const labelStyle = useMemo<TextStyle | undefined>(() => {
    if (!label) return undefined;
    const colors = resolvePinInputColors(false, hasError, hasWarning, disabled, theme);
    return {
      fontSize: sizeConfig.labelFontSize,
      fontWeight: defaultTypography.weights.medium,
      color: colors.label,
      marginBottom: defaultSpacing['2xs'],
    };
  }, [label, sizeConfig, hasError, hasWarning, disabled, themeColors]);

  const hintStyle = useMemo<TextStyle | undefined>(() => {
    if (!bottomText) return undefined;
    const colors = resolvePinInputColors(false, hasError, hasWarning, disabled, theme);
    return {
      fontSize: sizeConfig.hintFontSize,
      color: isStatusText ? colors.hint : colors.hint,
      marginTop: defaultSpacing['2xs'],
    };
  }, [bottomText, sizeConfig, hasError, hasWarning, disabled, isStatusText, themeColors]);

  const buildCellStyle = useCallback(
    (index: number): TextStyle => {
      const cellIsFocused = focusedIndex === index;
      const colors = resolvePinInputColors(cellIsFocused, hasError, hasWarning, disabled, theme);

      return {
        width: sizeConfig.cellSize,
        height: sizeConfig.cellSize,
        fontSize: sizeConfig.fontSize,
        fontWeight: defaultTypography.weights.semibold,
        fontFamily: 'Courier',
        textAlign: 'center',
        color: colors.text,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: cellIsFocused
          ? (colors.focusRing !== 'transparent' ? colors.focusRing : colors.border)
          : colors.border,
        borderRadius: sizeConfig.borderRadius,
        overflow: 'hidden' as const,
        padding: 0,
        opacity: disabled ? 0.5 : 1,
      };
    },
    [focusedIndex, sizeConfig, hasError, hasWarning, disabled, themeColors],
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <View ref={ref} style={[wrapperStyle, userStyle]} {...rest}>
      {label && <Text style={labelStyle}>{label}</Text>}

      <View
        style={containerStyle}
        accessibilityRole="none"
        accessibilityLabel={label || 'Pin input'}
      >
        {Array.from({ length }, (_, i) => {
          const displayValue = mask && chars[i] ? '\u2022' : chars[i];

          return (
            <TextInput
              key={i}
              ref={(el) => { cellRefs.current[i] = el; }}
              value={displayValue}
              placeholder={placeholder}
              editable={!disabled}
              maxLength={1}
              keyboardType={type === 'number' ? 'number-pad' : 'default'}
              secureTextEntry={false}
              autoComplete="one-time-code"
              onChangeText={(text) => handleChangeText(i, text)}
              onKeyPress={(e) => handleKeyPress(i, e)}
              onFocus={() => handleFocus(i)}
              onBlur={handleBlur}
              selectTextOnFocus
              accessibilityLabel={`${label || 'Pin'} digit ${i + 1} of ${length}`}
              style={buildCellStyle(i)}
            />
          );
        })}
      </View>

      {bottomText && (
        <Text
          style={hintStyle}
          accessibilityRole={isStatusText ? 'alert' : undefined}
        >
          {bottomText}
        </Text>
      )}
    </View>
  );
});

PinInput.displayName = 'PinInput';
