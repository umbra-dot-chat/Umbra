/**
 * @module components/add-friend-input
 * @description React Native AddFriendInput for the Wisp design system.
 *
 * A specialised input for sending friend requests by username,
 * with inline feedback (success / error).
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveAddFriendInputColors } from '@coexist/wisp-core/styles/AddFriendInput.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AddFriendFeedbackState = 'idle' | 'loading' | 'success' | 'error';

export interface AddFriendInputProps extends ViewProps {
  /** Current input value (controlled). */
  value?: string;
  /** Default input value (uncontrolled). */
  defaultValue?: string;
  /** Placeholder text. @default 'Add friend by username...' */
  placeholder?: string;
  /** Called when the input value changes. */
  onValueChange?: (value: string) => void;
  /** Called when the user submits (Enter or button click). */
  onSubmit?: (value: string) => void;
  /** Current feedback state. @default 'idle' */
  feedbackState?: AddFriendFeedbackState;
  /** Feedback message (shown below the input). */
  feedbackMessage?: string;
  /** Whether the input is disabled. @default false */
  disabled?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AddFriendInput = forwardRef<View, AddFriendInputProps>(
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
      (text: string) => {
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
      const skeletonStyle: ViewStyle = {
        height: 48,
        borderRadius: defaultRadii.lg,
        backgroundColor: theme.colors.border.subtle,
        width: '100%',
      };
      return <View ref={ref} style={[skeletonStyle, userStyle as ViewStyle]} {...rest} />;
    }

    // ------ Styles ------
    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      width: '100%',
      opacity: disabled ? 0.5 : 1,
    };

    const inputStyle = {
      flex: 1,
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      color: colors.text,
      padding: 0,
      outlineStyle: 'none' as any,
    } as TextStyle;

    const btnStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      height: 32,
      borderRadius: defaultRadii.md,
      backgroundColor: hasContent ? colors.btnBg : colors.btnBgDisabled,
      flexShrink: 0,
    };

    const btnTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: hasContent ? colors.btnText : colors.btnTextDisabled,
    };

    const feedbackColor =
      feedbackState === 'success' ? colors.feedbackSuccess
        : feedbackState === 'error' ? colors.feedbackError
          : colors.text;

    const feedbackStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      color: feedbackColor,
      paddingTop: defaultSpacing.xs,
      paddingLeft: defaultSpacing.md,
    };

    return (
      <View ref={ref} style={userStyle as ViewStyle} {...rest}>
        <View style={containerStyle}>
          <TextInput
            value={value}
            onChangeText={handleChange}
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            editable={!disabled}
            style={inputStyle}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSubmit}
            disabled={disabled || !hasContent}
            accessibilityLabel="Send friend request"
            style={btnStyle}
          >
            <Text style={btnTextStyle}>
              {feedbackState === 'loading' ? 'Sending...' : 'Send Request'}
            </Text>
          </Pressable>
        </View>
        {feedbackMessage && feedbackState !== 'idle' && (
          <Text style={feedbackStyle}>{feedbackMessage}</Text>
        )}
      </View>
    );
  },
);

AddFriendInput.displayName = 'AddFriendInput';
