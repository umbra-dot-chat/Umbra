import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Text as RNText, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { CircularProgressSize } from '@coexist/wisp-core/types/CircularProgress.types';
import { circularProgressSizeMap } from '@coexist/wisp-core/types/CircularProgress.types';
import { resolveCircularProgressColors } from '@coexist/wisp-core/styles/CircularProgress.styles';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type ColorVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export interface CircularProgressProps {
  value?: number;
  max?: number;
  size?: CircularProgressSize;
  showValue?: boolean;
  formatValue?: (value: number, max: number) => string;
  color?: ColorVariant;
  indeterminate?: boolean;
  label?: string;
  children?: React.ReactNode;
  style?: object;
}

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export const CircularProgress = forwardRef<View, CircularProgressProps>(
  function CircularProgress(
    {
      value = 0,
      max = 100,
      size = 'md',
      showValue = false,
      formatValue,
      color = 'default',
      indeterminate = false,
      label,
      children,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = circularProgressSizeMap[size];

    const clampedValue = Math.min(Math.max(value, 0), max);
    const percent = max > 0 ? clampedValue / max : 0;

    const defaultFormat = (v: number, m: number): string =>
      `${Math.round((v / m) * 100)}%`;

    const displayValue = useMemo(() => {
      const formatter = formatValue || defaultFormat;
      return formatter(clampedValue, max);
    }, [clampedValue, max, formatValue]);

    const colors = useMemo(
      () => resolveCircularProgressColors(color, theme),
      [color, themeColors],
    );

    const viewBoxSize = sizeConfig.size;
    const center = viewBoxSize / 2;
    const radius = (viewBoxSize - sizeConfig.strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Spin animation for indeterminate
    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (indeterminate) {
        const animation = Animated.loop(
          Animated.timing(spinAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        );
        animation.start();
        return () => animation.stop();
      }
    }, [indeterminate, spinAnim]);

    const spinDeg = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const dashOffset = indeterminate
      ? circumference * 0.75
      : circumference * (1 - percent);

    const hasCenterContent = children != null || (showValue && !indeterminate);

    const svgContent = (
      <Svg
        width={sizeConfig.size}
        height={sizeConfig.size}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.track}
          strokeWidth={sizeConfig.strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.indicator}
          strokeWidth={sizeConfig.strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
    );

    return (
      <View
        ref={ref}
        accessibilityRole="progressbar"
        accessibilityLabel={label || `Progress: ${displayValue}`}
        style={[
          {
            alignItems: 'center',
            gap: label ? 4 : 0,
          },
          userStyle,
        ]}
      >
        <View style={{ width: sizeConfig.size, height: sizeConfig.size, position: 'relative' }}>
          {indeterminate ? (
            <Animated.View style={{ transform: [{ rotate: spinDeg }] }}>
              {svgContent}
            </Animated.View>
          ) : (
            svgContent
          )}

          {hasCenterContent && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {children != null ? (
                typeof children === 'string' || typeof children === 'number' ? (
                  <RNText style={{ fontSize: sizeConfig.fontSize, fontWeight: defaultTypography.weights.semibold, color: colors.valueText }}>{children}</RNText>
                ) : children
              ) : (
                <RNText
                  style={{
                    fontSize: sizeConfig.fontSize,
                    fontWeight: defaultTypography.weights.semibold,
                    color: colors.valueText,
                  }}
                >
                  {displayValue}
                </RNText>
              )}
            </View>
          )}
        </View>

        {label && (
          <RNText
            style={{
              fontSize: sizeConfig.fontSize - 2,
              color: colors.labelText,
            }}
          >
            {label}
          </RNText>
        )}
      </View>
    );
  },
);

CircularProgress.displayName = 'CircularProgress';
