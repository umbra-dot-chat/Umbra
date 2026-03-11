/**
 * @module AddFriendInput
 * @description Specialised input for the Wisp design system.
 *
 * A text input with submit button for sending friend requests by username,
 * with inline feedback (success / error / loading states).
 */
import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { AddFriendInputProps } from '@coexist/wisp-core/types/AddFriendInput.types';
import {
  resolveAddFriendInputColors,
  buildAddFriendInputContainerStyle,
  buildAddFriendInputFieldStyle,
  buildAddFriendInputButtonStyle,
  buildAddFriendInputFeedbackStyle,
} from '@coexist/wisp-core/styles/AddFriendInput.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// AddFriendInput
// ---------------------------------------------------------------------------

/**
 * AddFriendInput — A friend-request input with inline feedback.
 *
 * @remarks
 * Renders an input field with a submit button for adding friends by username.
 * Supports controlled and uncontrolled modes, and shows feedback messages
 * below the input for success, error, or loading states.
 *
 * @example
 * ```tsx
 * <AddFriendInput
 *   placeholder="Add friend by username..."
 *   onSubmit={(value) => sendFriendRequest(value)}
 *   feedbackState="success"
 *   feedbackMessage="Friend request sent!"
 * />
 * ```
 */
export const AddFriendInput = forwardRef<HTMLDivElement, AddFriendInputProps>(
  function AddFriendInput(
    {
      value: controlledValue,
      defaultValue = '',
      placeholder = 'Add friend by username...',
      onValueChange,
      onSubmit,
      feedbackState = 'idle',
      feedbackMessage,
      disabled = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : internalValue;
    const hasContent = value.trim().length > 0;

    const colors = useMemo(
      () => resolveAddFriendInputColors(theme),
      [theme],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        if (controlledValue === undefined) setInternalValue(text);
        onValueChange?.(text);
      },
      [controlledValue, onValueChange],
    );

    const handleSubmit = useCallback(() => {
      if (!hasContent || disabled) return;
      onSubmit?.(value);
      if (controlledValue === undefined) setInternalValue('');
    }, [hasContent, disabled, value, onSubmit, controlledValue]);

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonStyle = useMemo(
        () => ({
          height: 48,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.border.subtle,
          width: '100%',
          boxSizing: 'border-box' as const,
        }),
        [theme],
      );

      return (
        <div
          ref={ref}
          aria-hidden
          className={className}
          style={{ ...skeletonStyle, ...userStyle }}
          {...rest}
        />
      );
    }

    // ------ Normal render ------
    const containerStyle = useMemo(
      () => buildAddFriendInputContainerStyle(colors, theme),
      [colors, theme],
    );

    const inputStyle = useMemo(
      () => buildAddFriendInputFieldStyle(colors, theme),
      [colors, theme],
    );

    const btnStyle = useMemo(
      () => buildAddFriendInputButtonStyle(colors, hasContent, theme),
      [colors, hasContent, theme],
    );

    const feedbackStyle = useMemo(
      () => buildAddFriendInputFeedbackStyle(colors, feedbackState, theme),
      [colors, feedbackState, theme],
    );

    const wrapperStyle = useMemo(
      () => ({
        width: '100%',
        opacity: disabled ? 0.5 : 1,
      }),
      [disabled],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...wrapperStyle, ...userStyle }}
        {...rest}
      >
        <div style={containerStyle}>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            style={inputStyle}
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !hasContent}
            aria-label="Send friend request"
            style={btnStyle}
          >
            {feedbackState === 'loading' ? 'Sending...' : 'Send Request'}
          </button>
        </div>
        {feedbackMessage && feedbackState !== 'idle' && (
          <span style={feedbackStyle}>{feedbackMessage}</span>
        )}
      </div>
    );
  },
);

AddFriendInput.displayName = 'AddFriendInput';
