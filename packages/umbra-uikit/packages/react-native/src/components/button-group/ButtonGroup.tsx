import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ButtonGroupItem, ButtonGroupVariant, ButtonGroupSize } from '@coexist/wisp-core/types/ButtonGroup.types';
import { buttonGroupSizeMap } from '@coexist/wisp-core/types/ButtonGroup.types';
import { defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface ButtonGroupProps {
  items: ButtonGroupItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant?: ButtonGroupVariant;
  size?: ButtonGroupSize;
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const ButtonGroup = forwardRef<View, ButtonGroupProps>(function ButtonGroup(
  {
    items,
    value: controlledValue,
    defaultValue,
    onChange,
    variant = 'outline',
    size = 'md',
    fullWidth = false,
    disabled = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = buttonGroupSizeMap[size];
  const [internalValue, setInternalValue] = useState(defaultValue ?? items[0]?.value);

  const isControlled = controlledValue !== undefined;
  const activeValue = isControlled ? controlledValue : internalValue;

  const handleItemPress = useCallback(
    (itemValue: string, itemDisabled?: boolean) => {
      if (disabled || itemDisabled) return;
      if (!isControlled) setInternalValue(itemValue);
      onChange?.(itemValue);
    },
    [disabled, isControlled, onChange],
  );

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      borderRadius: defaultRadii.md,
      overflow: 'hidden',
      ...(variant === 'outline'
        ? { borderWidth: 1, borderColor: themeColors.border.subtle }
        : {}),
    }),
    [variant, fullWidth, themeColors],
  );

  const textSizeMap: Record<string, number> = {
    xs: 12,
    sm: 13,
    md: 14,
    lg: 14,
  };

  return (
    <View
      ref={ref}
      accessibilityRole="radiogroup"
      style={[containerStyle, userStyle]}
    >
      {items.map((item, i) => {
        const isActive = activeValue === item.value;
        const isItemDisabled = disabled || !!item.disabled;
        const Icon = item.icon;
        const isFirst = i === 0;
        const isLast = i === items.length - 1;

        const itemStyle: ViewStyle = {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingX,
          gap: sizeConfig.gap,
          flex: fullWidth ? 1 : undefined,
          backgroundColor: isActive
            ? themeColors.accent.highlight
            : 'transparent',
          opacity: isItemDisabled ? 0.4 : 1,
          ...(variant === 'outline' && !isLast
            ? { borderRightWidth: 1, borderRightColor: themeColors.border.subtle }
            : {}),
        };

        const labelStyle: TextStyle = {
          fontSize: textSizeMap[size],
          fontWeight: defaultTypography.weights.medium,
          color: isActive
            ? themeColors.text.primary
            : themeColors.text.secondary,
        };

        return (
          <Pressable
            key={item.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: isActive, disabled: isItemDisabled }}
            disabled={isItemDisabled}
            onPress={() => handleItemPress(item.value, item.disabled)}
            style={({ pressed }) => [
              itemStyle,
              pressed && !isActive
                ? { backgroundColor: themeColors.accent.highlight }
                : undefined,
            ]}
          >
            {Icon && (
              <Icon
                size={sizeConfig.iconSize}
                color={isActive ? themeColors.text.primary : themeColors.text.secondary}
                strokeWidth={2}
              />
            )}
            <RNText style={labelStyle}>{item.label}</RNText>
          </Pressable>
        );
      })}
    </View>
  );
});

ButtonGroup.displayName = 'ButtonGroup';
