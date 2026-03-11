import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import type { TagSize } from '@coexist/wisp-core/types/Tag.types';
import { tagSizeMap } from '@coexist/wisp-core/types/Tag.types';
import { resolveTagColors } from '@coexist/wisp-core/styles/Tag.styles';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface TagProps {
  children: React.ReactNode;
  size?: TagSize;
  onRemove?: () => void;
  selected?: boolean;
  disabled?: boolean;
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  onPress?: () => void;
  style?: object;
}

export const Tag = forwardRef<View, TagProps>(function Tag(
  {
    children,
    size = 'md',
    onRemove,
    selected = false,
    disabled = false,
    icon: IconComponent,
    onPress,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = tagSizeMap[size];

  const colors = useMemo(
    () => resolveTagColors(selected, disabled, theme),
    [selected, disabled, themeColors],
  );

  const handleRemove = useCallback(() => {
    if (!disabled && onRemove) onRemove();
  }, [disabled, onRemove]);

  const containerStyle = useMemo(
    () => ({
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: sizeConfig.gap,
      height: sizeConfig.height,
      paddingLeft: sizeConfig.paddingX,
      paddingRight: onRemove ? sizeConfig.paddingX - 2 : sizeConfig.paddingX,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: sizeConfig.borderRadius,
      overflow: 'hidden' as const,
      opacity: disabled ? 0.5 : 1,
    }),
    [sizeConfig, colors, disabled, onRemove],
  );

  const content = (
    <>
      {IconComponent && (
        <IconComponent
          size={sizeConfig.fontSize}
          color={colors.text}
          strokeWidth={2}
        />
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
      {onRemove && (
        <Pressable
          onPress={handleRemove}
          disabled={disabled}
          accessibilityLabel="Remove"
          style={{
            width: sizeConfig.closeSize,
            height: sizeConfig.closeSize,
            borderRadius: theme.radii[sizeConfig.borderRadius] > 4 ? theme.radii[sizeConfig.borderRadius] - 2 : 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: sizeConfig.closeIconSize, height: sizeConfig.closeIconSize }}>
            <View
              style={{
                position: 'absolute',
                width: sizeConfig.closeIconSize,
                height: 1.5,
                backgroundColor: colors.closeColor,
                top: sizeConfig.closeIconSize / 2 - 0.75,
                transform: [{ rotate: '45deg' }],
              }}
            />
            <View
              style={{
                position: 'absolute',
                width: sizeConfig.closeIconSize,
                height: 1.5,
                backgroundColor: colors.closeColor,
                top: sizeConfig.closeIconSize / 2 - 0.75,
                transform: [{ rotate: '-45deg' }],
              }}
            />
          </View>
        </Pressable>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        ref={ref}
        onPress={() => { if (!disabled) onPress(); }}
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

Tag.displayName = 'Tag';
