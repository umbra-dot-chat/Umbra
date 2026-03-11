import { useRef, useState, useEffect, useCallback } from 'react';
import { Animated } from 'react-native';
import type { SpringConfig } from '@coexist/wisp-core/tokens/motion';
import { DEFAULT_SPRING_CONFIG } from '@coexist/wisp-core/animation/constants';

export type SpringResult = {
  /** The current Animated.Value for use in animated styles. */
  value: Animated.Value;
  /** The current numeric value (for non-animated usage). */
  currentValue: number;
  /** true while the spring is still in motion. */
  isAnimating: boolean;
};

/**
 * Animates a numeric value toward target using spring physics.
 * Uses React Native's Animated.spring for native-driver performance.
 */
export function useSpring(
  target: number,
  config?: SpringConfig,
): SpringResult {
  const tension = config?.tension ?? DEFAULT_SPRING_CONFIG.tension;
  const friction = config?.friction ?? DEFAULT_SPRING_CONFIG.friction;

  const animatedValue = useRef(new Animated.Value(target)).current;
  const [currentValue, setCurrentValue] = useState(target);
  const [isAnimating, setIsAnimating] = useState(false);
  const targetRef = useRef(target);

  useEffect(() => {
    if (Math.abs(targetRef.current - target) < 1e-6) return;
    targetRef.current = target;
    setIsAnimating(true);

    Animated.spring(animatedValue, {
      toValue: target,
      tension,
      friction,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsAnimating(false);
        setCurrentValue(target);
      }
    });
  }, [target, tension, friction, animatedValue]);

  return { value: animatedValue, currentValue, isAnimating };
}
