import { useRef, useState, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { DEFAULT_DURATION } from '@coexist/wisp-core/animation/constants';

const EASING_MAP: Record<string, (value: number) => number> = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
};

function resolveEasing(name: string): (value: number) => number {
  return EASING_MAP[name] ?? EASING_MAP.easeOut;
}

export type AnimatedValueConfig = {
  duration?: number;
  easing?: string;
};

export type AnimatedValueResult = {
  /** The Animated.Value for use in animated styles. */
  value: Animated.Value;
  /** The current numeric target. */
  currentValue: number;
  /** true while the value is actively transitioning. */
  isAnimating: boolean;
};

/**
 * Smoothly interpolates a numeric value toward targetValue over time.
 * Uses React Native's Animated.timing for native-driver performance.
 */
export function useAnimatedValue(
  targetValue: number,
  config?: AnimatedValueConfig,
): AnimatedValueResult {
  const duration = config?.duration ?? DEFAULT_DURATION;
  const easingName = config?.easing ?? 'easeOut';

  const animatedValue = useRef(new Animated.Value(targetValue)).current;
  const [currentValue, setCurrentValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);
  const targetRef = useRef(targetValue);

  useEffect(() => {
    if (Math.abs(targetRef.current - targetValue) < 1e-6) return;
    targetRef.current = targetValue;
    setIsAnimating(true);

    Animated.timing(animatedValue, {
      toValue: targetValue,
      duration,
      easing: resolveEasing(easingName),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsAnimating(false);
        setCurrentValue(targetValue);
      }
    });
  }, [targetValue, duration, easingName, animatedValue]);

  return { value: animatedValue, currentValue, isAnimating };
}
