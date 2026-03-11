import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import type { IndicatorVariant, IndicatorState, IndicatorSize } from '@coexist/wisp-core/types/Indicator.types';
import { indicatorSizeMap } from '@coexist/wisp-core/types/Indicator.types';
import { resolveIndicatorColor } from '@coexist/wisp-core/styles/Indicator.styles';
import { useTheme } from '../../providers';

export interface IndicatorProps {
  variant?: IndicatorVariant;
  state?: IndicatorState;
  size?: IndicatorSize;
  label?: string;
  style?: object;
}

export const Indicator = forwardRef<View, IndicatorProps>(function Indicator(
  {
    variant = 'success',
    state = 'idle',
    size = 'sm',
    label,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = indicatorSizeMap[size];
  const color = useMemo(() => resolveIndicatorColor(variant, theme), [variant, themeColors]);

  // Pulse animation for active state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'active') {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const dotStyle = useMemo(() => {
    const base = {
      width: sizeConfig.dotSize,
      height: sizeConfig.dotSize,
      borderRadius: sizeConfig.dotSize / 2,
      flexShrink: 0,
    };

    if (state === 'inactive') {
      return {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: sizeConfig.borderWidth,
        borderColor: color,
      };
    }

    return {
      ...base,
      backgroundColor: color,
    };
  }, [sizeConfig, color, state]);

  return (
    <View
      ref={ref}
      style={[{ flexDirection: 'row', alignItems: 'center' }, userStyle]}
      accessibilityLabel={label}
    >
      {state === 'active' ? (
        <Animated.View style={[dotStyle, { opacity: pulseAnim }]} />
      ) : (
        <View style={dotStyle} />
      )}
    </View>
  );
});

Indicator.displayName = 'Indicator';
