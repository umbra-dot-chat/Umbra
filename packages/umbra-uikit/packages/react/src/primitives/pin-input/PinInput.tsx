import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PinInputProps } from '@coexist/wisp-core/types/PinInput.types';
import { pinInputSizeMap } from '@coexist/wisp-core/types/PinInput.types';
import {
  resolvePinInputColors,
  buildWrapperStyle,
  buildCellContainerStyle,
  buildCellStyle,
  buildLabelStyle,
  buildHintStyle,
  buildSkeletonCellStyle,
} from '@coexist/wisp-core/styles/PinInput.styles';
import { useControllable } from '../../hooks/use-controllable';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * PinInput — A row of single-character input cells for entering verification
 * codes, OTPs, or PINs in the Wisp design system.
 *
 * @remarks
 * Supports numeric-only and alphanumeric modes, auto-advance on input,
 * backspace navigation, paste distribution, masked display, and all five
 * component sizes.
 *
 * Uses the controlled/uncontrolled pattern via {@link useControllable}.
 * Validation states (error, warning) follow the same `string | boolean`
 * convention as the Input primitive.
 *
 * @module primitives/pin-input
 * @example
 * ```tsx
 * import { PinInput } from 'wisp';
 *
 * // Uncontrolled numeric OTP
 * <PinInput length={6} label="Verification Code" />
 *
 * // Controlled with completion handler
 * <PinInput value={code} onChange={setCode} onComplete={handleSubmit} />
 *
 * // Alphanumeric with error
 * <PinInput type="text" error="Invalid code" />
 *
 * // Masked (password-style)
 * <PinInput mask />
 * ```
 */
export const PinInput = forwardRef<HTMLDivElement, PinInputProps>(function PinInput(
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
    autoFocus = false,
    disabled = false,
    skeleton = false,
    mask = false,
    placeholder = '',
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = pinInputSizeMap[size];

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [currentValue, setCurrentValue] = useControllable<string>({
    value,
    defaultValue,
    onChange,
  });

  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Array of refs for each input cell
  const cellRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateValue = useCallback(
    (newChars: string[]) => {
      const newValue = newChars.join('').slice(0, length);
      setCurrentValue(newValue);
      if (newValue.length === length) {
        onComplete?.(newValue);
      }
    },
    [length, setCurrentValue, onComplete],
  );

  const focusCell = useCallback((index: number) => {
    const cell = cellRefs.current[index];
    if (cell) {
      cell.focus();
      // Select existing content so it gets replaced on next keystroke
      cell.select();
    }
  }, []);

  const handleInput = useCallback(
    (index: number, inputValue: string) => {
      // Filter for numeric mode
      let char = inputValue;
      if (type === 'number') {
        char = char.replace(/[^0-9]/g, '');
      }

      if (!char) return;

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

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
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
      } else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        focusCell(index - 1);
      } else if (e.key === 'ArrowRight' && index < length - 1) {
        e.preventDefault();
        focusCell(index + 1);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        const newChars = [...chars];
        newChars[index] = '';
        updateValue(newChars);
      }
    },
    [chars, length, updateValue, focusCell],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      let pasted = e.clipboardData.getData('text/plain');

      if (type === 'number') {
        pasted = pasted.replace(/[^0-9]/g, '');
      }

      if (!pasted) return;

      const pastedChars = pasted.slice(0, length).split('');
      const newChars = [...chars];

      for (let i = 0; i < pastedChars.length && i < length; i++) {
        newChars[i] = pastedChars[i];
      }

      updateValue(newChars);

      // Focus the cell after the last pasted character, or the last cell
      const nextIndex = Math.min(pastedChars.length, length - 1);
      focusCell(nextIndex);
    },
    [chars, type, length, updateValue, focusCell],
  );

  const handleFocus = useCallback((index: number) => {
    setFocusedIndex(index);
  }, []);

  const handleBlur = useCallback(() => {
    setFocusedIndex(-1);
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-focus on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (autoFocus && !disabled && !skeleton) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => focusCell(0), 0);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled, skeleton, focusCell]);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const isFocused = focusedIndex >= 0;
  const colors = useMemo(
    () => resolvePinInputColors(isFocused, hasError, hasWarning, disabled, theme),
    [isFocused, hasError, hasWarning, disabled, theme],
  );

  const wrapperStyle = useMemo(() => buildWrapperStyle(sizeConfig), [sizeConfig, theme]);
  const containerStyle = useMemo(() => buildCellContainerStyle(sizeConfig), [sizeConfig]);
  const labelStyleObj = useMemo(() => buildLabelStyle(sizeConfig, colors, theme), [sizeConfig, colors, theme]);
  const hintStyleObj = useMemo(() => buildHintStyle(sizeConfig, colors, theme), [sizeConfig, colors, theme]);

  const mergedStyle = useMemo(
    () => (userStyle ? { ...wrapperStyle, ...userStyle } : wrapperStyle),
    [wrapperStyle, userStyle],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------

  if (skeleton) {
    const skeletonCellStyle = buildSkeletonCellStyle(sizeConfig, theme);
    return (
      <div
        ref={ref}
        aria-hidden
        className={className}
        style={mergedStyle}
        {...rest}
      >
        <div style={containerStyle}>
          {Array.from({ length }, (_, i) => (
            <div key={i} style={skeletonCellStyle} />
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={ref} className={className} style={mergedStyle} {...rest}>
      {label && <Text as="label" style={labelStyleObj}>{label}</Text>}

      <div style={containerStyle} role="group" aria-label={label || 'Pin input'}>
        {Array.from({ length }, (_, i) => {
          const cellIsFocused = focusedIndex === i;
          const cellColors = resolvePinInputColors(cellIsFocused, hasError, hasWarning, disabled, theme);
          const style = buildCellStyle(sizeConfig, cellColors, cellIsFocused, disabled, theme);

          const displayValue = mask && chars[i] ? '•' : chars[i];

          return (
            <input
              key={i}
              ref={(el) => { cellRefs.current[i] = el; }}
              type={mask ? 'password' : 'text'}
              inputMode={type === 'number' ? 'numeric' : 'text'}
              pattern={type === 'number' ? '[0-9]' : undefined}
              maxLength={1}
              value={displayValue}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="one-time-code"
              aria-label={`${label || 'Pin'} digit ${i + 1} of ${length}`}
              aria-invalid={hasError || undefined}
              style={style}
              onInput={(e) => {
                const target = e.target as HTMLInputElement;
                handleInput(i, target.value);
              }}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(e)}
              onFocus={() => handleFocus(i)}
              onBlur={handleBlur}
            />
          );
        })}
      </div>

      {bottomText && (
        <p
          style={hintStyleObj}
          role={isStatusText ? 'alert' : undefined}
        >
          {bottomText}
        </p>
      )}
    </div>
  );
});

PinInput.displayName = 'PinInput';
