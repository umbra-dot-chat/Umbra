/**
 * @module primitives/badge
 * @description React Native Badge primitive for the Wisp design system.
 *
 * Reuses color resolution and size maps from `@coexist/wisp-core`.
 * Renders via `<View>` + `<Text>` instead of `<span>`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { BadgeSize, BadgeVariant, BadgeShape } from '@coexist/wisp-core/types/Badge.types';
import { badgeSizeMap } from '@coexist/wisp-core/types/Badge.types';
import { resolveBadgeColors } from '@coexist/wisp-core/styles/Badge.styles';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  size?: BadgeSize;
  variant?: BadgeVariant;
  shape?: BadgeShape;
  dot?: boolean;
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  trailingIcon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Badge = forwardRef<View, BadgeProps>(function Badge(
  {
    children,
    size = 'md',
    variant = 'default',
    shape = 'pill',
    dot = false,
    icon: Icon,
    trailingIcon: TrailingIcon,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = badgeSizeMap[size];

  const colors = useMemo(
    () => resolveBadgeColors(variant, theme),
    [variant, themeColors],
  );

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: sizeConfig.paddingX,
    paddingVertical: sizeConfig.paddingY,
    borderRadius: shape === 'pill' ? 9999 : sizeConfig.badgeRadius,
    overflow: 'hidden' as const,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: sizeConfig.gap,
  }), [sizeConfig, colors, shape]);

  const textStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.fontSize * sizeConfig.lineHeight,
    color: colors.text,
    fontWeight: defaultTypography.weights.medium,
  }), [sizeConfig, colors]);

  const dotStyle = useMemo<ViewStyle | undefined>(() => {
    if (!dot) return undefined;
    return {
      width: sizeConfig.dotSize,
      height: sizeConfig.dotSize,
      borderRadius: sizeConfig.dotSize / 2,
      backgroundColor: colors.dot,
    };
  }, [dot, sizeConfig, colors]);

  return (
    <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
      {dot && <View style={dotStyle} />}
      {Icon && <Icon size={sizeConfig.iconSize} color={colors.text} strokeWidth={2} />}
      <Text style={textStyle}>{children}</Text>
      {TrailingIcon && <TrailingIcon size={sizeConfig.iconSize} color={colors.text} strokeWidth={2} />}
    </View>
  );
});

Badge.displayName = 'Badge';
