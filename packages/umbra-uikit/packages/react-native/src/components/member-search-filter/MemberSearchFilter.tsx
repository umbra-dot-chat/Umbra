/**
 * @module components/member-search-filter
 * @description React Native MemberSearchFilter for the Wisp design system.
 *
 * A search/filter input for the member list panel with optional result count badge.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MemberSearchFilterProps extends ViewProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  size?: 'sm' | 'md';
  loading?: boolean;
  resultCount?: number;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MemberSearchFilter = forwardRef<View, MemberSearchFilterProps>(
  function MemberSearchFilter(
    {
      value: controlledValue,
      defaultValue = '',
      onChange,
      onClear,
      placeholder = 'Search members...',
      size = 'sm',
      loading = false,
      resultCount,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : internalValue;

    const isSm = size === 'sm';
    const inputHeight = isSm ? 32 : 38;

    const handleChange = useCallback(
      (text: string) => {
        if (!isControlled) setInternalValue(text);
        onChange?.(text);
      },
      [isControlled, onChange],
    );

    const handleClear = useCallback(() => {
      if (!isControlled) setInternalValue('');
      onChange?.('');
      onClear?.();
    }, [isControlled, onChange, onClear]);

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
    }), []);

    const inputContainerStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      height: inputHeight,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      gap: 6,
    }), [inputHeight, themeColors]);

    const inputStyle = useMemo<TextStyle>(() => ({
      flex: 1,
      fontSize: isSm ? defaultTypography.sizes.sm.fontSize : defaultTypography.sizes.base.fontSize,
      color: themeColors.text.primary,
      padding: 0,
    }), [isSm, themeColors]);

    const badgeStyle = useMemo<ViewStyle>(() => ({
      height: 20,
      minWidth: 20,
      paddingHorizontal: 6,
      borderRadius: 10,
      backgroundColor: themeColors.background.sunken,
      alignItems: 'center',
      justifyContent: 'center',
    }), [themeColors]);

    const badgeTextStyle = useMemo<TextStyle>(() => ({
      fontSize: 11,
      fontWeight: '500',
      color: themeColors.text.secondary,
    }), [themeColors]);

    if (skeleton) {
      return (
        <View
          ref={ref}
          style={[containerStyle, userStyle]}
          accessibilityElementsHidden
          {...rest}
        >
          <View
            style={{
              flex: 1,
              height: inputHeight,
              borderRadius: defaultRadii.md,
              backgroundColor: themeColors.border.subtle,
              opacity: 0.4,
            }}
          />
        </View>
      );
    }

    return (
      <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
        <View style={inputContainerStyle}>
          <TextInput
            value={currentValue}
            onChangeText={handleChange}
            placeholder={placeholder}
            placeholderTextColor={themeColors.text.muted}
            style={inputStyle}
            accessibilityLabel={placeholder}
          />
          {currentValue && !loading ? (
            <TouchableOpacity
              onPress={handleClear}
              accessibilityLabel="Clear search"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: themeColors.text.muted, fontSize: 16 }}>
                {'\u2715'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {resultCount !== undefined && (
          <View style={badgeStyle}>
            <Text style={badgeTextStyle}>{resultCount}</Text>
          </View>
        )}
      </View>
    );
  },
);

MemberSearchFilter.displayName = 'MemberSearchFilter';
