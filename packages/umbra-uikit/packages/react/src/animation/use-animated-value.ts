/**
 * @module animation/use-animated-value
 * @description A cross-platform React hook for smoothly interpolating a
 * numeric value over time using `requestAnimationFrame`.
 *
 * This is the web-first implementation. The hook linearly (or via easing)
 * interpolates from the previous target to the new target whenever the
 * `targetValue` argument changes.
 *
 * @example
 * ```tsx
 * import { useAnimatedValue } from '../animation';
 *
 * function ProgressBar({ progress }: { progress: number }) {
 *   const { value, isAnimating } = useAnimatedValue(progress, {
 *     duration: 300,
 *     easing: 'easeOut',
 *   });
 *
 *   return (
 *     <div
 *       style={{
 *         width: `${value * 100}%`,
 *         height: 4,
 *         backgroundColor: isAnimating ? '#A78BFA' : '#6D28D9',
 *       }}
 *     />
 *   );
 * }
 * ```
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { DEFAULT_DURATION } from '@coexist/wisp-core/animation/constants';

// ---------------------------------------------------------------------------
// Easing helpers
// ---------------------------------------------------------------------------

/**
 * Built-in easing functions used by {@link useAnimatedValue}.
 *
 * @example
 * ```ts
 * const t = easingFunctions.easeOut(0.5); // ~0.75
 * ```
 */
const easingFunctions: Record<string, (t: number) => number> = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/**
 * Resolve an easing name to a function. Falls back to `easeOut` for unknown
 * names.
 *
 * @param name - Easing function name
 * @returns An easing function mapping `[0, 1]` to `[0, 1]`
 *
 * @example
 * ```ts
 * const fn = resolveEasing('easeInOut');
 * fn(0.5); // 0.5
 * ```
 */
function resolveEasing(name: string): (t: number) => number {
  return easingFunctions[name] ?? easingFunctions.easeOut;
}

// ---------------------------------------------------------------------------
// Hook configuration
// ---------------------------------------------------------------------------

/**
 * Optional configuration for {@link useAnimatedValue}.
 *
 * @example
 * ```ts
 * const config: AnimatedValueConfig = { duration: 200, easing: 'easeInOut' };
 * ```
 */
export type AnimatedValueConfig = {
  /** Duration of the interpolation in milliseconds. Defaults to {@link DEFAULT_DURATION}. */
  duration?: number;
  /** Easing curve name (`linear`, `easeIn`, `easeOut`, `easeInOut`). Defaults to `'easeOut'`. */
  easing?: string;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Return type of {@link useAnimatedValue}.
 */
export type AnimatedValueResult = {
  /** The current interpolated numeric value. */
  value: number;
  /** `true` while the value is actively transitioning. */
  isAnimating: boolean;
};

/**
 * Smoothly interpolates a numeric value toward `targetValue` over time using
 * `requestAnimationFrame`.
 *
 * Every time `targetValue` changes, a new rAF loop starts from the current
 * interpolated value and transitions to the new target over `duration` ms
 * using the specified `easing` curve.
 *
 * @param targetValue - The value to animate toward.
 * @param config - Optional duration and easing overrides.
 * @returns An object containing the current `value` and an `isAnimating` flag.
 *
 * @example
 * ```tsx
 * function Opacity({ visible }: { visible: boolean }) {
 *   const { value } = useAnimatedValue(visible ? 1 : 0);
 *   return <div style={{ opacity: value }}>Hello</div>;
 * }
 * ```
 */
export function useAnimatedValue(
  targetValue: number,
  config?: AnimatedValueConfig,
): AnimatedValueResult {
  const duration = config?.duration ?? DEFAULT_DURATION;
  const easingName = config?.easing ?? 'easeOut';
  const easingFn = resolveEasing(easingName);

  const [value, setValue] = useState(targetValue);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs to survive across renders without restarting the effect.
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const fromRef = useRef<number>(targetValue);
  const toRef = useRef<number>(targetValue);
  const currentRef = useRef<number>(targetValue);

  const animate = useCallback(
    (timestamp: number) => {
      if (startTimeRef.current === 0) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const rawProgress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;
      const easedProgress = easingFn(rawProgress);

      const from = fromRef.current;
      const to = toRef.current;
      const next = from + (to - from) * easedProgress;

      currentRef.current = next;
      setValue(next);

      if (rawProgress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        rafRef.current = null;
        setIsAnimating(false);
      }
    },
    [duration, easingFn],
  );

  useEffect(() => {
    // If the target hasn't changed (within floating-point tolerance), skip.
    if (Math.abs(toRef.current - targetValue) < 1e-6) {
      return;
    }

    // Cancel any running animation.
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    // Start from wherever we currently are.
    fromRef.current = currentRef.current;
    toRef.current = targetValue;
    startTimeRef.current = 0;
    setIsAnimating(true);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [targetValue, animate]);

  return { value, isAnimating };
}
