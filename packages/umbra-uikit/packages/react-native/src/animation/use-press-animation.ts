import { useRef, useCallback, useMemo } from 'react';
import { Animated } from 'react-native';
import type { SpringConfig } from '@coexist/wisp-core/tokens/motion';
import { DEFAULT_SPRING_CONFIG } from '@coexist/wisp-core/animation/constants';

export type PressAnimationConfig = {
  scale?: number;
  spring?: SpringConfig;
};

export type PressAnimationResult = {
  /** The animated scale value. */
  scale: Animated.Value;
  /** Handlers to spread on a Pressable component. */
  handlers: {
    onPressIn: () => void;
    onPressOut: () => void;
  };
  /** Pre-built animated style with transform. */
  style: { transform: { scale: Animated.Value }[] };
};

/**
 * Provides a spring-powered press feedback animation for Pressable components.
 * On press, scales down; on release, springs back to 1.
 */
export function usePressAnimation(config?: PressAnimationConfig): PressAnimationResult {
  const pressedScale = config?.scale ?? 0.97;
  const tension = config?.spring?.tension ?? DEFAULT_SPRING_CONFIG.tension;
  const friction = config?.spring?.friction ?? DEFAULT_SPRING_CONFIG.friction;

  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: pressedScale,
      tension,
      friction,
      useNativeDriver: true,
    }).start();
  }, [pressedScale, tension, friction, scaleValue]);

  const onPressOut = useCallback(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      tension,
      friction,
      useNativeDriver: true,
    }).start();
  }, [tension, friction, scaleValue]);

  const handlers = useMemo(() => ({ onPressIn, onPressOut }), [onPressIn, onPressOut]);
  const style = useMemo(
    () => ({ transform: [{ scale: scaleValue }] }),
    [scaleValue],
  );

  return { scale: scaleValue, handlers, style };
}
