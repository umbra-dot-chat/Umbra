import React, { forwardRef, useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';
import { useTheme } from '../../providers';

export type SkeletonVariant = 'rectangular' | 'circular' | 'text';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number;
  lines?: number;
  lineHeight?: number;
  lineSpacing?: number;
  radius?: number;
  style?: object;
}

export const Skeleton = forwardRef<View, SkeletonProps>(function Skeleton(
  {
    variant = 'rectangular',
    width,
    height,
    lines = 3,
    lineHeight = 16,
    lineSpacing = 8,
    radius,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const bgColor = themeColors.border.subtle;

  if (variant === 'circular') {
    const size = (typeof width === 'number' ? width : undefined) ?? height ?? 48;
    return (
      <Animated.View
        ref={ref}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: bgColor,
            opacity: pulseAnim,
          },
          userStyle,
        ]}
      />
    );
  }

  if (variant === 'text') {
    const resolvedWidth = width ?? '100%';
    const resolvedRadius = radius ?? 4;

    const lineElements = [];
    for (let i = 0; i < lines; i++) {
      const isLast = i === lines - 1;
      const widthPercent = isLast && lines > 1 ? '60%' : '100%';
      lineElements.push(
        <Animated.View
          key={i}
          style={{
            width: widthPercent,
            height: lineHeight,
            borderRadius: resolvedRadius,
            backgroundColor: bgColor,
            opacity: pulseAnim,
            marginBottom: isLast ? 0 : lineSpacing,
          }}
        />,
      );
    }

    return (
      <View ref={ref} style={[{ width: resolvedWidth }, userStyle]}>
        {lineElements}
      </View>
    );
  }

  // Rectangular
  const resolvedWidth = width ?? '100%';
  const resolvedHeight = height ?? 48;
  const resolvedRadius = radius ?? 8;

  return (
    <Animated.View
      ref={ref}
      style={[
        {
          width: resolvedWidth,
          height: resolvedHeight,
          borderRadius: resolvedRadius,
          backgroundColor: bgColor,
          opacity: pulseAnim,
        },
        userStyle,
      ]}
    />
  );
});

Skeleton.displayName = 'Skeleton';
