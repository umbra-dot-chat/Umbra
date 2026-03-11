import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import type { ChipSize, ChipColor, ChipVariant } from '@coexist/wisp-core/types/Chip.types';
import { chipSizeMap } from '@coexist/wisp-core/types/Chip.types';
import { resolveChipColors } from '@coexist/wisp-core/styles/Chip.styles';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface ChipProps {
  children: React.ReactNode;
  size?: ChipSize;
  color?: ChipColor;
  variant?: ChipVariant;
  removable?: boolean;
  onRemove?: () => void;
  clickable?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: object;
}

export const Chip = forwardRef<View, ChipProps>(function Chip(
  {
    children,
    size = 'md',
    color = 'default',
    variant = 'filled',
    removable = false,
    onRemove,
    clickable = false,
    icon,
    disabled = false,
    onPress,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = chipSizeMap[size];

  const colors = useMemo(
    () => resolveChipColors(color, variant, theme),
    [color, variant, themeColors],
  );

  const handleRemove = useCallback(() => {
    if (!disabled && onRemove) onRemove();
  }, [disabled, onRemove]);

  const handlePress = useCallback(() => {
    if (!disabled && clickable && onPress) onPress();
  }, [disabled, clickable, onPress]);

  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizeConfig.gap,
      paddingHorizontal: sizeConfig.paddingX,
      paddingVertical: sizeConfig.paddingY,
      borderRadius: sizeConfig.borderRadius,
      overflow: 'hidden' as const,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      opacity: disabled ? 0.5 : 1,
    }),
    [sizeConfig, colors, disabled],
  );

  const content = (
    <>
      {icon && (
        <View style={{ width: sizeConfig.iconSize, height: sizeConfig.iconSize }}>
          {icon}
        </View>
      )}
      <RNText
        style={{
          fontSize: sizeConfig.fontSize,
          lineHeight: sizeConfig.fontSize * sizeConfig.lineHeight,
          fontWeight: defaultTypography.weights.medium,
          color: colors.text,
        }}
      >
        {children}
      </RNText>
      {removable && (
        <Pressable
          onPress={handleRemove}
          disabled={disabled}
          accessibilityLabel="Remove"
          style={{
            width: sizeConfig.removeButtonSize,
            height: sizeConfig.removeButtonSize,
            borderRadius: theme.radii[sizeConfig.borderRadius] > 4 ? theme.radii[sizeConfig.borderRadius] - 2 : 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: sizeConfig.removeIconSize, height: sizeConfig.removeIconSize }}>
            <View
              style={{
                position: 'absolute',
                width: sizeConfig.removeIconSize,
                height: 1.5,
                backgroundColor: colors.text,
                top: sizeConfig.removeIconSize / 2 - 0.75,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: sizeConfig.removeIconSize,
                height: 1.5,
                backgroundColor: colors.text,
                top: sizeConfig.removeIconSize / 2 - 0.75,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        </Pressable>
      )}
    </>
  );

  if (clickable) {
    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled}
        style={[containerStyle, userStyle]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      {content}
    </View>
  );
});

Chip.displayName = 'Chip';
