/**
 * Growable PIN input that starts with a minimum number of cells (default 4)
 * and grows up to a maximum (default 10) as the user types.
 *
 * Works around wisp PinInput centering and borderRadius bugs by using a
 * hidden TextInput with custom-rendered cells.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, type ViewStyle, type TextStyle } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GrowablePinInputProps {
  /** Minimum number of visible cells. @default 4 */
  minLength?: number;
  /** Maximum number of cells. @default 10 */
  maxLength?: number;
  /** Show dots instead of digits. @default false */
  mask?: boolean;
  /** Auto-focus on mount. @default false */
  autoFocus?: boolean;
  /** Disable input. @default false */
  disabled?: boolean;
  /** Show error styling. @default false */
  error?: boolean;
  /** Controlled value. */
  value?: string;
  /** Called when value changes. */
  onChange?: (value: string) => void;
  /** Called when the user submits (presses done/return). */
  onSubmit?: (value: string) => void;
  /** Called when all cells are filled (only when minLength === maxLength). */
  onComplete?: (value: string) => void;
  /** Cell size in px. @default 48 */
  cellSize?: number;
  /** Gap between cells in px. @default 10 */
  gap?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GrowablePinInput({
  minLength = 4,
  maxLength = 10,
  mask = false,
  autoFocus = false,
  disabled = false,
  error = false,
  value,
  onChange,
  onSubmit,
  onComplete,
  cellSize = 48,
  gap = 10,
}: GrowablePinInputProps) {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState('');
  const currentValue = isControlled ? value : internalValue;

  // Number of visible cells: at least minLength, grows with input
  const visibleLength = Math.max(minLength, Math.min(currentValue.length + 1, maxLength));

  // Split value into character array padded to visible length
  const chars = currentValue.split('').slice(0, maxLength);
  while (chars.length < visibleLength) chars.push('');

  const handleChangeText = useCallback(
    (text: string) => {
      const digits = text.replace(/[^0-9]/g, '').slice(0, maxLength);
      if (!isControlled) setInternalValue(digits);
      onChange?.(digits);
      if (digits.length === maxLength) {
        onComplete?.(digits);
      }
    },
    [maxLength, isControlled, onChange, onComplete],
  );

  const handleSubmit = useCallback(() => {
    if (currentValue.length >= minLength) {
      onSubmit?.(currentValue);
    }
  }, [currentValue, minLength, onSubmit]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (autoFocus && !disabled) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // Colors
  const colors = theme.colors;
  const borderColor = error
    ? colors.status.dangerBorder
    : colors.border.subtle;
  const focusBorderColor = error
    ? colors.status.dangerBorder
    : colors.border.focus;
  const textColor = colors.text.primary;
  const bgColor = colors.background.sunken;
  const radius = theme.radii.md;

  // Active cell index (cursor position)
  const activeIndex = currentValue.length;

  const cellStyle = useCallback(
    (index: number): ViewStyle => ({
      width: cellSize,
      height: cellSize,
      borderWidth: 1,
      borderColor: index === activeIndex && !disabled ? focusBorderColor : borderColor,
      borderRadius: radius,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? 0.5 : 1,
    }),
    [cellSize, activeIndex, disabled, borderColor, focusBorderColor, radius, bgColor],
  );

  const charStyle: TextStyle = {
    fontSize: cellSize * 0.45,
    fontWeight: '600',
    fontFamily: 'Courier',
    color: textColor,
    textAlign: 'center',
  };

  const dotStyle: ViewStyle = {
    width: cellSize * 0.25,
    height: cellSize * 0.25,
    borderRadius: cellSize * 0.125,
    backgroundColor: textColor,
  };

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Hidden input captures keyboard */}
      <TextInput
        ref={inputRef}
        value={currentValue}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        keyboardType="number-pad"
        maxLength={maxLength}
        editable={!disabled}
        autoFocus={autoFocus}
        caretHidden
        style={hiddenInputStyle}
      />

      {/* Visible cells */}
      <Pressable
        onPress={focusInput}
        style={{ flexDirection: 'row', gap, alignItems: 'center' }}
      >
        {chars.map((char, i) => (
          <View key={i} style={cellStyle(i)}>
            {char ? (
              mask ? (
                <View style={dotStyle} />
              ) : (
                <Text style={charStyle}>{char}</Text>
              )
            ) : null}
          </View>
        ))}
      </Pressable>
    </View>
  );
}

const hiddenInputStyle: TextStyle = {
  position: 'absolute',
  opacity: 0,
  height: 0,
  width: 0,
};
