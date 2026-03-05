/**
 * ScrollProgress — thin gradient progress bar that tracks ScrollView position.
 *
 * Renders a 2px gradient bar at the top of its container. Pass the
 * `onScroll` handler to your ScrollView and this component will
 * animate the fill width accordingly.
 */

import React, { useCallback, useRef, useState } from 'react';
import { Animated, Platform, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

interface ScrollProgressProps {
  /** Height of the bar in pixels. @default 2 */
  height?: number;
}

const GRADIENT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6'];

export function useScrollProgress() {
  const scrollProgress = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const maxScroll = contentSize.height - layoutMeasurement.height;
      const progress = maxScroll > 0 ? contentOffset.y / maxScroll : 0;
      scrollProgress.setValue(Math.min(1, Math.max(0, progress)));
    },
    [scrollProgress],
  );

  return { scrollProgress, handleScroll };
}

export function ScrollProgress({
  height = 2,
}: ScrollProgressProps & { progress: Animated.Value }) {
  return null; // Unused standalone — use ScrollProgressBar instead
}

export function ScrollProgressBar({
  progress,
  height = 2,
}: {
  progress: Animated.Value;
  height?: number;
}) {
  const gradientStyle = Platform.OS === 'web'
    ? {
        background: `linear-gradient(90deg, ${GRADIENT_COLORS.join(', ')})`,
      } as any
    : {
        backgroundColor: GRADIENT_COLORS[0],
      };

  return (
    <View style={{ width: '100%', height, overflow: 'hidden' }}>
      <Animated.View
        style={[
          {
            height,
            borderRadius: height / 2,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
          gradientStyle,
        ]}
      />
    </View>
  );
}
