import React, { forwardRef, useMemo, useCallback, useState, useId } from 'react';
import type { InputProps } from '@coexist/wisp-core/types/Input.types';
import { inputSizeMap } from '@coexist/wisp-core/types/Input.types';
import {
  resolveInputColors,
  buildWrapperStyle,
  buildInputContainerStyle,
  buildInputStyle,
  buildLabelStyle,
  buildHintStyle,
  getInputSkeletonStyle,
} from '@coexist/wisp-core/styles/Input.styles';
import { useTheme } from '../../providers';

/**
 * Input -- Text input primitive for the Wisp design system.
 *
 * Monochrome bordered input with optional label, hint/error text,
 * and leading/trailing icon slots. Supports five sizes (`xs` through `xl`),
 * error and warning states, disabled state, skeleton loading, and full-width layout.
 *
 * @remarks
 * Key features:
 * - Five sizes via the shared {@link ComponentSize} token (`xs` | `sm` | `md` | `lg` | `xl`).
 * - Optional `label` above and `hint` / `error` / `warning` text below.
 * - Leading and trailing icon slots that auto-size to match the chosen size.
 * - Focus ring, error border, and warning border are theme-aware
 *   (see {@link resolveInputColors}).
 * - `skeleton` mode renders a shimmer placeholder instead of the full input.
 * - Forwards a ref to the underlying `<input>` element and spreads any
 *   remaining native `InputHTMLAttributes`.
 *
 * @module primitives/input
 *
 * @example
 * ```tsx
 * import { Search, X } from 'lucide-react';
 *
 * // Basic
 * <Input placeholder="Enter text..." />
 *
 * // With label and hint
 * <Input label="Email" hint="We'll never share your email." />
 *
 * // With icons
 * <Input icon={Search} trailingIcon={X} placeholder="Search..." />
 *
 * // Error state
 * <Input label="Password" error="Password must be at least 8 characters" />
 *
 * // Warning state
 * <Input label="Username" warning="Username is already taken" />
 *
 * // Skeleton loading
 * <Input skeleton />
 *
 * // Full width
 * <Input fullWidth placeholder="Full width input" />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = 'md',
    label,
    hint,
    error,
    warning,
    icon: LeadingIcon,
    trailingIcon: TrailingIcon,
    fullWidth = false,
    skeleton = false,
    disabled = false,
    id: providedId,
    style: userStyle,
    className,
    onFocus,
    onBlur,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const generatedId = useId();
  const inputId = providedId || generatedId;

  // ---------------------------------------------------------------------------
  // Focus state
  // ---------------------------------------------------------------------------
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      if (!disabled) setFocused(true);
      onFocus?.(e);
    },
    [disabled, onFocus],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  // ---------------------------------------------------------------------------
  // Resolve dimensions + colors
  // ---------------------------------------------------------------------------
  const sizeConfig = useMemo(() => inputSizeMap[size], [size]);

  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  const errorMessage = typeof error === 'string' ? error : undefined;
  const warningMessage = typeof warning === 'string' ? warning : undefined;

  const colors = useMemo(
    () => resolveInputColors(focused, hasError, hasWarning, disabled, theme),
    [focused, hasError, hasWarning, disabled, theme],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getInputSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Build styles
  // ---------------------------------------------------------------------------
  const hasLeadingIcon = Boolean(LeadingIcon);
  const hasTrailingIcon = Boolean(TrailingIcon);

  const wrapperStyle = useMemo(
    () => buildWrapperStyle(sizeConfig, fullWidth),
    [sizeConfig, fullWidth],
  );

  const containerStyle = useMemo(
    () => buildInputContainerStyle(sizeConfig, colors, disabled, hasLeadingIcon, hasTrailingIcon, theme),
    [sizeConfig, colors, disabled, hasLeadingIcon, hasTrailingIcon, theme],
  );

  const inputStyle = useMemo(
    () => buildInputStyle(sizeConfig, colors),
    [sizeConfig, colors],
  );

  const labelStyle = useMemo(
    () => buildLabelStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  // Determine if we show hint, warning, or error below the input (error > warning > hint)
  const bottomText = errorMessage || warningMessage || hint;
  const isStatusText = Boolean(errorMessage || warningMessage);

  const hintStyle = useMemo(
    () => (bottomText ? buildHintStyle(sizeConfig, colors, isStatusText, theme) : undefined),
    [sizeConfig, colors, isStatusText, bottomText, theme],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={{ ...wrapperStyle, ...userStyle }} className={className}>
      {/* Label */}
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}

      {/* Input container */}
      <div style={containerStyle}>
        {/* Leading icon */}
        {LeadingIcon && (
          <LeadingIcon
            size={sizeConfig.iconSize}
            color={colors.icon}
            strokeWidth={2}
          />
        )}

        {/* Input element */}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={bottomText ? `${inputId}-hint` : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={inputStyle}
          {...rest}
        />

        {/* Trailing icon */}
        {TrailingIcon && (
          <TrailingIcon
            size={sizeConfig.iconSize}
            color={colors.icon}
            strokeWidth={2}
          />
        )}
      </div>

      {/* Hint / error text */}
      {bottomText && (
        <span id={`${inputId}-hint`} style={hintStyle}>
          {bottomText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';
