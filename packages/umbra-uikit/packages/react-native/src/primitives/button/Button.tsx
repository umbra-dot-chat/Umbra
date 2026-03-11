/**
 * @module primitives/button
 * @description React Native Button primitive for the Wisp design system.
 *
 * Reuses variant color resolution and size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<Pressable>` with `onPress` instead of `<button>` with `onClick`.
 * - Uses `<ActivityIndicator>` instead of CSS spinner animation.
 * - Pressed/hover state via `Pressable` callback styles.
 * - No CSS keyframe injection (spinner, pulse).
 * - No `className`, `type`, or `onMouse*` props.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { Pressable, ActivityIndicator, View } from 'react-native';
import type { PressableProps, ViewStyle } from 'react-native';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import type { TextSize } from '@coexist/wisp-core/tokens/shared';
import type { ButtonVariant, ButtonShape } from '@coexist/wisp-core/types/Button.types';
import { buttonSizeMap, shapeRadiusMap } from '@coexist/wisp-core/types/Button.types';
import {
  resolveVariantColors,
  getDisabledColors,
} from '@coexist/wisp-core/styles/Button.styles';
import { Text } from '../text';
import { toRNShadow } from '../../utils';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style' | 'disabled'> {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  onSurface?: boolean;
  size?: ComponentSize;
  shape?: ButtonShape;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Text size mapping
// ---------------------------------------------------------------------------

const buttonTextSizeMap: Record<ComponentSize, TextSize> = {
  xs: 'xs',
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  xl: 'md',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Button = forwardRef<View, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    onSurface = false,
    size = 'md',
    shape = 'rounded',
    iconLeft,
    iconRight,
    isLoading = false,
    disabled = false,
    fullWidth = false,
    style: userStyle,
    onPress,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = buttonSizeMap[size];
  const isIconOnly = !children && !!(iconLeft || iconRight);
  const isDisabled = disabled || isLoading;

  const variantColors = useMemo(() => {
    if (disabled && !isLoading) return getDisabledColors(theme);
    return resolveVariantColors(variant, theme, onSurface);
  }, [variant, disabled, isLoading, themeColors, onSurface]);

  const handlePress = useCallback(
    (e: any) => {
      if (isDisabled) return;
      onPress?.(e);
    },
    [isDisabled, onPress],
  );

  const baseStyle = useMemo<ViewStyle>(() => {
    const borderWidth = variantColors.border !== 'transparent' ? 1 : 0;
    const paddingH = isIconOnly ? sizeConfig.iconOnlyPadding : sizeConfig.paddingX;

    return {
      height: sizeConfig.height,
      paddingHorizontal: paddingH,
      borderRadius: theme.radii[shapeRadiusMap[shape]],
      borderWidth,
      borderColor: variantColors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizeConfig.gap,
      overflow: 'hidden',
      opacity: isDisabled ? 0.6 : 1,
      ...(fullWidth ? { width: '100%' } : { alignSelf: 'flex-start' }),
    } as ViewStyle;
  }, [sizeConfig, shape, variantColors, isIconOnly, fullWidth, isDisabled]);

  const textSize = buttonTextSizeMap[size];

  const content = isLoading ? (
    <>
      <ActivityIndicator
        size="small"
        color={variantColors.text}
      />
      {children && (
        <Text size={textSize} weight="medium" color={variantColors.text} style={{ opacity: 0.7 }}>
          {children}
        </Text>
      )}
    </>
  ) : (
    <>
      {iconLeft}
      {children && (
        <Text size={textSize} weight="medium" color={variantColors.text}>
          {children}
        </Text>
      )}
      {iconRight}
    </>
  );

  return (
    <Pressable
      ref={ref}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
      style={({ pressed }) => [
        baseStyle,
        {
          backgroundColor: pressed
            ? variantColors.bgActive
            : variantColors.bg,
          borderColor: variantColors.border,
        },
        userStyle,
      ]}
      {...rest}
    >
      {content}
    </Pressable>
  );
});

Button.displayName = 'Button';
