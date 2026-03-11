import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { BannerVariant } from '@coexist/wisp-core/types/Banner.types';
import { resolveBannerColors } from '@coexist/wisp-core/styles/Banner.styles';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface BannerProps {
  children: React.ReactNode;
  title?: string;
  variant?: BannerVariant;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export const Banner = forwardRef<View, BannerProps>(function Banner(
  {
    children,
    title,
    variant = 'default',
    icon,
    action,
    dismissible = false,
    onDismiss,
    fullWidth = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const colors = useMemo(
    () => resolveBannerColors(variant, theme),
    [variant, themeColors],
  );

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: defaultSpacing.md,
      paddingVertical: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.lg,
      borderRadius: fullWidth ? 0 : 10,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      width: fullWidth ? '100%' : undefined,
    }),
    [colors, fullWidth],
  );

  const titleStyle = useMemo<TextStyle>(
    () => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      lineHeight: 20,
      color: colors.text,
    }),
    [colors],
  );

  const messageStyle = useMemo<TextStyle>(
    () => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.regular,
      lineHeight: 21,
      color: colors.text,
    }),
    [colors],
  );

  return (
    <View
      ref={ref}
      accessibilityRole="alert"
      style={[containerStyle, userStyle]}
    >
      {icon && (
        <View style={{ flexShrink: 0, marginTop: defaultSpacing['2xs'] }}>
          {icon}
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        {title && <Text style={titleStyle}>{title}</Text>}
        <Text style={messageStyle}>{children}</Text>
      </View>

      {action && (
        <View style={{ flexShrink: 0 }}>
          {action}
        </View>
      )}

      {dismissible && (
        <Pressable
          onPress={onDismiss}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 20,
            flexShrink: 0,
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <Path
              d="M3.5 3.5l7 7M10.5 3.5l-7 7"
              stroke={colors.icon}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      )}
    </View>
  );
});

Banner.displayName = 'Banner';
