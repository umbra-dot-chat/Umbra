/**
 * @module primitives/spinner
 * @description React Native Spinner primitive for the Wisp design system.
 *
 * Reuses size maps from `@coexist/wisp-core` while rendering through RN's
 * `Animated` API. Key differences from the React DOM version:
 *
 * - Uses `Animated.View` with `Animated.loop(Animated.timing(...))` instead of
 *   CSS `@keyframes` and SVG.
 * - Circular border with one colored segment replaces the SVG track + arc.
 * - No `className`, `style` object is a `ViewStyle`.
 * - No SSR keyframe injection needed.
 */

import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import { spinnerSizeMap } from '@coexist/wisp-core/types/Spinner.types';
import { Text } from '../text';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpinnerProps extends Omit<ViewProps, 'children'> {
  /**
   * Spinner size.
   *
   * @default 'md'
   */
  size?: ComponentSize;

  /** Optional text label displayed beside the spinner. */
  label?: string;

  /** Override the indicator (spinning arc) color. */
  color?: string;

  /** Override the track (background circle) color. */
  trackColor?: string;

  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Spinner = forwardRef<View, SpinnerProps>(function Spinner(
  {
    size = 'md',
    label,
    color,
    trackColor,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = spinnerSizeMap[size];

  // Continuous rotation animation
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Resolve colors
  const resolvedTrackColor = trackColor || themeColors.border.subtle;
  const resolvedIndicatorColor = color || themeColors.accent.primary;

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: label ? sizeConfig.gap : 0,
    flexShrink: 0,
  }), [sizeConfig, label]);

  const ringStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.size,
    height: sizeConfig.size,
    borderRadius: sizeConfig.size / 2,
    borderWidth: sizeConfig.strokeWidth,
    borderColor: resolvedTrackColor,
    borderTopColor: resolvedIndicatorColor,
    flexShrink: 0,
  }), [sizeConfig, resolvedTrackColor, resolvedIndicatorColor]);

  const labelStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.labelFontSize,
    lineHeight: Math.round(sizeConfig.labelFontSize * 1.4),
    fontWeight: defaultTypography.weights.medium,
    color: themeColors.text.muted,
  }), [sizeConfig, themeColors]);

  return (
    <View
      ref={ref}
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={label || 'Loading'}
      style={[containerStyle, userStyle]}
      {...rest}
    >
      <Animated.View
        style={[
          ringStyle,
          { transform: [{ rotate }] },
        ]}
      />
      {label && <Text style={labelStyle}>{label}</Text>}
    </View>
  );
});

Spinner.displayName = 'Spinner';
