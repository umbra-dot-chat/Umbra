/**
 * @module components/online-status-indicator
 * @description React Native OnlineStatusIndicator for the Wisp design system.
 *
 * A standalone indicator dot for online/offline/idle/dnd status.
 */

import React, { forwardRef, useMemo, useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { OnlineStatus } from '@coexist/wisp-core/types/OnlineStatusIndicator.types';
import { onlineStatusIndicatorSizeMap } from '@coexist/wisp-core/types/OnlineStatusIndicator.types';
import { resolveOnlineStatusLabel } from '@coexist/wisp-core/styles/OnlineStatusIndicator.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface OnlineStatusIndicatorProps extends ViewProps {
  status: OnlineStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulse?: boolean;
}

// ---------------------------------------------------------------------------
// Color resolver
// ---------------------------------------------------------------------------

function resolveColor(status: OnlineStatus, colors: any): string {
  switch (status) {
    case 'online':
      return colors.status.success;
    case 'idle':
      return colors.status.warning;
    case 'dnd':
      return colors.status.danger;
    case 'offline':
    case 'invisible':
      return colors.text.muted;
    default:
      return colors.text.muted;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const OnlineStatusIndicator = forwardRef<View, OnlineStatusIndicatorProps>(
  function OnlineStatusIndicator(
    {
      status,
      size = 'sm',
      showLabel = false,
      pulse = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const sizeConfig = useMemo(
      () => onlineStatusIndicatorSizeMap[size],
      [size],
    );

    const dotColor = useMemo(
      () => resolveColor(status, themeColors),
      [status, themeColors],
    );

    const label = useMemo(
      () => resolveOnlineStatusLabel(status),
      [status],
    );

    const shouldPulse = pulse && status === 'online';

    // Pulse animation
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      if (!shouldPulse) {
        pulseAnim.setValue(1);
        return;
      }

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      loop.start();
      return () => loop.stop();
    }, [shouldPulse, pulseAnim]);

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizeConfig.gap,
    }), [sizeConfig]);

    const dotStyle = useMemo<ViewStyle>(() => ({
      width: sizeConfig.dotSize,
      height: sizeConfig.dotSize,
      borderRadius: sizeConfig.dotSize / 2,
      backgroundColor: dotColor,
    }), [sizeConfig, dotColor]);

    const labelStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      color: themeColors.text.secondary,
    }), [sizeConfig, themeColors]);

    return (
      <View
        ref={ref}
        style={[containerStyle, userStyle]}
        accessibilityRole="none"
        accessibilityLabel={label}
        {...rest}
      >
        {shouldPulse ? (
          <Animated.View
            style={[dotStyle, { transform: [{ scale: pulseAnim }] }]}
          />
        ) : (
          <View style={dotStyle} />
        )}
        {showLabel && <Text style={labelStyle}>{label}</Text>}
      </View>
    );
  },
);

OnlineStatusIndicator.displayName = 'OnlineStatusIndicator';
