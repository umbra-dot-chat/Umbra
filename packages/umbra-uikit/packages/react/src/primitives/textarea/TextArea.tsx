import React, { forwardRef, useMemo, useCallback, useState, useId } from 'react';
import type { TextAreaProps } from '@coexist/wisp-core/types/TextArea.types';
import { textAreaSizeMap } from '@coexist/wisp-core/types/TextArea.types';
import {
  resolveTextAreaColors,
  buildWrapperStyle,
  buildTextAreaContainerStyle,
  buildTextAreaStyle,
  buildLabelStyle,
  buildHintStyle,
  getTextAreaSkeletonStyle,
} from '@coexist/wisp-core/styles/TextArea.styles';
import { useTheme } from '../../providers';

/**
 * TextArea — Multi-line text input primitive for the Wisp design system.
 *
 * @remarks
 * Monochrome bordered textarea with optional label, hint/error text,
 * and configurable resize behavior. Key features:
 *
 * - Five sizes via the {@link TextAreaSize} scale (`xs` | `sm` | `md` | `lg` | `xl`).
 * - Error and warning states with optional message text below the textarea.
 * - Disabled state with muted colors and `not-allowed` cursor.
 * - Skeleton loading placeholder with shimmer animation.
 * - Full-width layout mode stretching to 100% of the container.
 * - Configurable resize direction (`none` | `vertical` | `horizontal` | `both`).
 * - Forwards a ref to the underlying `<textarea>` element.
 *
 * @module primitives/textarea
 *
 * @example
 * ```tsx
 * // Basic
 * <TextArea placeholder="Enter text..." />
 *
 * // With label and hint
 * <TextArea label="Description" hint="Max 500 characters." />
 *
 * // Error state
 * <TextArea label="Bio" error="Bio is required." />
 *
 * // Full width, no resize
 * <TextArea fullWidth resize="none" placeholder="Full width textarea" />
 * ```
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    size = 'md',
    label,
    hint,
    error,
    warning,
    fullWidth = false,
    skeleton = false,
    disabled = false,
    resize = 'vertical',
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
  const textAreaId = providedId || generatedId;

  // ---------------------------------------------------------------------------
  // Focus state
  // ---------------------------------------------------------------------------
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!disabled) setFocused(true);
      onFocus?.(e);
    },
    [disabled, onFocus],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  // ---------------------------------------------------------------------------
  // Resolve dimensions + colors
  // ---------------------------------------------------------------------------
  const sizeConfig = useMemo(() => textAreaSizeMap[size], [size]);

  const hasError = Boolean(error);
  const hasWarning = Boolean(warning);
  const errorMessage = typeof error === 'string' ? error : undefined;
  const warningMessage = typeof warning === 'string' ? warning : undefined;

  const colors = useMemo(
    () => resolveTextAreaColors(focused, hasError, hasWarning, disabled, theme),
    [focused, hasError, hasWarning, disabled, theme],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getTextAreaSkeletonStyle(sizeConfig, theme);
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
  const wrapperStyle = useMemo(
    () => buildWrapperStyle(sizeConfig, fullWidth),
    [sizeConfig, fullWidth],
  );

  const containerStyle = useMemo(
    () => buildTextAreaContainerStyle(sizeConfig, colors, disabled, theme),
    [sizeConfig, colors, disabled, theme],
  );

  const textAreaStyle = useMemo(
    () => buildTextAreaStyle(sizeConfig, colors, resize, theme),
    [sizeConfig, colors, resize, theme],
  );

  const labelStyle = useMemo(
    () => buildLabelStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  // Determine if we show hint, warning, or error below the textarea (error > warning > hint)
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
        <label htmlFor={textAreaId} style={labelStyle}>
          {label}
        </label>
      )}

      {/* Textarea container */}
      <div style={containerStyle}>
        {/* Textarea element */}
        <textarea
          ref={ref}
          id={textAreaId}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={bottomText ? `${textAreaId}-hint` : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={textAreaStyle}
          {...rest}
        />
      </div>

      {/* Hint / error text */}
      {bottomText && (
        <span id={`${textAreaId}-hint`} style={hintStyle}>
          {bottomText}
        </span>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';
