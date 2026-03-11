/**
 * @module components/role-badge
 * @description React Native RoleBadge for the Wisp design system.
 *
 * A colored pill badge that displays a user role with a tinted background,
 * colored dot indicator, and optional remove button.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveRoleBadgeColors } from '@coexist/wisp-core/styles/RoleBadge.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Hex-to-RGB helper
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    sanitized = sanitized[0] + sanitized[0] + sanitized[1] + sanitized[1] + sanitized[2] + sanitized[2];
  }
  const num = parseInt(sanitized, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 10, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const SIZE_MAP = {
  xs: { height: 16, fontSize: 10, paddingH: 6, dotSize: 4, iconSize: 8, gap: 3 },
  sm: { height: 20, fontSize: 11, paddingH: 8, dotSize: 5, iconSize: 9, gap: 4 },
  md: { height: 24, fontSize: 12, paddingH: 10, dotSize: 6, iconSize: 10, gap: 5 },
  lg: { height: 28, fontSize: 13, paddingH: 12, dotSize: 7, iconSize: 11, gap: 6 },
  xl: { height: 32, fontSize: 14, paddingH: 14, dotSize: 8, iconSize: 12, gap: 7 },
} as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface RoleBadgeProps extends Omit<ViewProps, 'role'> {
  /** Role object containing id, name, color, optional icon, and position. */
  role: {
    id: string;
    name: string;
    color: string;
    icon?: React.ReactNode;
    position: number;
  };
  /** Size preset. @default 'md' */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether the badge shows a remove button. @default false */
  removable?: boolean;
  /** Callback fired when the remove button is pressed. */
  onRemove?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RoleBadge = forwardRef<View, RoleBadgeProps>(
  function RoleBadge(
    {
      role,
      size = 'md',
      removable = false,
      onRemove,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveRoleBadgeColors(theme),
      [theme],
    );

    const sizeConfig = SIZE_MAP[size];

    const handleRemove = useCallback(() => {
      onRemove?.();
    }, [onRemove]);

    // Derive tinted colors from role.color
    const roleColor = role.color;
    const { r, g, b } = useMemo(() => hexToRgb(roleColor), [roleColor]);
    const bgColor = `rgba(${r}, ${g}, ${b}, 0.15)`;
    const borderColor = `rgba(${r}, ${g}, ${b}, 0.3)`;

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingH,
      borderRadius: sizeConfig.height / 2,
      borderWidth: 1,
      borderColor: borderColor,
      backgroundColor: bgColor,
      gap: sizeConfig.gap,
      alignSelf: 'flex-start',
    }), [sizeConfig, bgColor, borderColor]);

    const dotStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.dotSize,
      height: sizeConfig.dotSize,
      borderRadius: sizeConfig.dotSize / 2,
      backgroundColor: roleColor,
      flexShrink: 0,
    }), [sizeConfig, roleColor]);

    const nameTextStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      lineHeight: sizeConfig.fontSize * 1.3,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: roleColor,
      flexShrink: 1,
    }), [sizeConfig, roleColor]);

    const removeButtonStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.iconSize + 4,
      height: sizeConfig.iconSize + 4,
      borderRadius: (sizeConfig.iconSize + 4) / 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 1,
      flexShrink: 0,
    }), [sizeConfig]);

    return (
      <View
        ref={ref}
        accessibilityRole="text"
        accessibilityLabel={`Role: ${role.name}`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Role icon or colored dot */}
        {role.icon ? role.icon : <View style={dotStyle} />}

        {/* Role name */}
        <Text style={nameTextStyle} numberOfLines={1}>
          {role.name}
        </Text>

        {/* Remove button */}
        {removable && onRemove && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove role ${role.name}`}
            onPress={handleRemove}
            style={removeButtonStyle}
          >
            <CloseIcon size={sizeConfig.iconSize} color={roleColor} />
          </Pressable>
        )}
      </View>
    );
  },
);

RoleBadge.displayName = 'RoleBadge';
