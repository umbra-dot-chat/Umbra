/**
 * useAnimatedToggle — Drives a 0↔1 Animated.Value in sync with a boolean,
 * keeping the component mounted during the exit animation.
 *
 * @example
 * ```tsx
 * const { animatedValue, shouldRender } = useAnimatedToggle(isOpen, { duration: 150 });
 * if (!shouldRender) return null;
 * return <Animated.View style={{ opacity: animatedValue }}>{children}</Animated.View>;
 * ```
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

// ---------------------------------------------------------------------------
// Motion tokens (inlined to avoid import issues across platforms)
// Mirrors @coexist/wisp-core/tokens/motion
// ---------------------------------------------------------------------------

const DURATION_NORMAL = 250;
const EASING_OUT: readonly [number, number, number, number] = [0, 0, 0.2, 1];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnimatedToggleOptions {
  /** Duration in ms (default 250) */
  duration?: number;
  /** Cubic-bezier control points [x1, y1, x2, y2] (default ease-out) */
  easing?: readonly [number, number, number, number];
  /** Whether to use the native driver (default true — only for opacity/transform) */
  useNativeDriver?: boolean;
}

export interface AnimatedToggleResult {
  /** Animated value (0 = hidden, 1 = visible). Use for opacity / transform interpolation. */
  animatedValue: Animated.Value;
  /** Whether the component should remain in the render tree. Stays true during exit. */
  shouldRender: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAnimatedToggle(
  visible: boolean,
  options: AnimatedToggleOptions = {},
): AnimatedToggleResult {
  const {
    duration = DURATION_NORMAL,
    easing = EASING_OUT,
    useNativeDriver = true,
  } = options;

  const animatedValue = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [shouldRender, setShouldRender] = useState(visible);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const show = useCallback(() => {
    setShouldRender(true);
    animRef.current?.stop();
    animRef.current = Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.bezier(easing[0], easing[1], easing[2], easing[3]),
      useNativeDriver,
    });
    animRef.current.start();
  }, [animatedValue, duration, easing, useNativeDriver]);

  const hide = useCallback(() => {
    animRef.current?.stop();
    animRef.current = Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: Easing.bezier(easing[0], easing[1], easing[2], easing[3]),
      useNativeDriver,
    });
    animRef.current.start(({ finished }) => {
      if (finished) setShouldRender(false);
    });
  }, [animatedValue, duration, easing, useNativeDriver]);

  useEffect(() => {
    if (visible) {
      show();
    } else {
      hide();
    }
  }, [visible, show, hide]);

  return { animatedValue, shouldRender };
}
