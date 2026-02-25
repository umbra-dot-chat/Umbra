/**
 * AnimatedPresence — Declarative mount/unmount animation wrapper.
 *
 * Wraps children in an Animated.View that fades/slides/scales on enter and
 * exit. Uses useAnimatedToggle internally so children stay mounted during
 * the exit animation.
 *
 * All presets use only opacity + transform → compatible with useNativeDriver.
 *
 * @example
 * ```tsx
 * <AnimatedPresence visible={menuOpen} preset="scaleIn">
 *   <ContextMenu />
 * </AnimatedPresence>
 * ```
 */

import React from 'react';
import { Animated } from 'react-native';
import type { ViewStyle } from 'react-native';
import { useAnimatedToggle } from '@/hooks/useAnimatedToggle';
import type { AnimatedToggleOptions } from '@/hooks/useAnimatedToggle';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnimationPreset =
  | 'fadeIn'
  | 'slideUp'
  | 'slideDown'
  | 'slideRight'
  | 'slideLeft'
  | 'scaleIn';

interface AnimatedPresenceProps {
  /** Controls visibility — triggers enter/exit animation */
  visible: boolean;
  /** Animation preset (default: fadeIn) */
  preset?: AnimationPreset;
  /** Distance in px for slide presets (default: 20) */
  slideDistance?: number;
  /** Override animation options (duration, easing, useNativeDriver) */
  options?: AnimatedToggleOptions;
  /** Style applied to the Animated.View wrapper */
  style?: ViewStyle;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Preset interpolation factory
// ---------------------------------------------------------------------------

function buildAnimatedStyle(
  animatedValue: Animated.Value,
  preset: AnimationPreset,
  slideDistance: number,
): Animated.WithAnimatedObject<ViewStyle> {
  switch (preset) {
    case 'fadeIn':
      return { opacity: animatedValue };

    case 'slideUp':
      return {
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDistance, 0],
            }),
          },
        ],
      };

    case 'slideDown':
      return {
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-slideDistance, 0],
            }),
          },
        ],
      };

    case 'slideRight':
      return {
        opacity: animatedValue,
        transform: [
          {
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [slideDistance, 0],
            }),
          },
        ],
      };

    case 'slideLeft':
      return {
        opacity: animatedValue,
        transform: [
          {
            translateX: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-slideDistance, 0],
            }),
          },
        ],
      };

    case 'scaleIn':
      return {
        opacity: animatedValue,
        transform: [
          {
            scale: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          },
        ],
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AnimatedPresence({
  visible,
  preset = 'fadeIn',
  slideDistance = 20,
  options,
  style,
  children,
}: AnimatedPresenceProps) {
  const { animatedValue, shouldRender } = useAnimatedToggle(visible, options);

  if (!shouldRender) return null;

  const animatedStyle = buildAnimatedStyle(animatedValue, preset, slideDistance);

  return (
    <Animated.View style={[style, animatedStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      {children}
    </Animated.View>
  );
}
