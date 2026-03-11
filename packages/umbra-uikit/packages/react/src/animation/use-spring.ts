/**
 * @module animation/use-spring
 * @description A React hook that animates a numeric value toward a target
 * using spring physics (`requestAnimationFrame`).
 *
 * The simulation models a damped harmonic oscillator defined by `tension`
 * (stiffness) and `friction` (damping). This produces natural-feeling
 * motion that overshoots and settles, unlike easing-based transitions.
 *
 * @example
 * ```tsx
 * import { useSpring } from '../animation';
 *
 * function ScaleBox({ active }: { active: boolean }) {
 *   const { value, isAnimating } = useSpring(active ? 1.1 : 1, {
 *     tension: 300,
 *     friction: 10,
 *   });
 *
 *   return (
 *     <div style={{ transform: `scale(${value})` }}>
 *       {isAnimating ? 'Moving...' : 'Still'}
 *     </div>
 *   );
 * }
 * ```
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import type { SpringConfig } from '@coexist/wisp-core/tokens/motion';
import { DEFAULT_SPRING_CONFIG } from '@coexist/wisp-core/animation/constants';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The simulation is considered "at rest" when both velocity and displacement
 * are below this threshold.
 *
 * @example
 * ```ts
 * // Internal use only
 * if (Math.abs(velocity) < REST_THRESHOLD && Math.abs(displacement) < REST_THRESHOLD) { ... }
 * ```
 */
const REST_THRESHOLD = 0.001;

/**
 * Fixed time-step for the physics simulation (seconds). Using a fixed step
 * prevents frame-rate-dependent behaviour.
 *
 * @example
 * ```ts
 * // Internal use: advances simulation in 1 ms increments
 * ```
 */
const STEP_MS = 1;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Return type of {@link useSpring}.
 */
export type SpringResult = {
  /** The current spring-animated numeric value. */
  value: number;
  /** `true` while the spring is still in motion. */
  isAnimating: boolean;
};

/**
 * Animates a numeric value toward `target` using spring physics.
 *
 * The spring simulation runs inside a `requestAnimationFrame` loop with a
 * fixed time-step integrator so that behaviour is deterministic regardless
 * of the display refresh rate.
 *
 * @param target - The value the spring should settle on.
 * @param config - Optional spring `tension` and `friction`. Defaults to
 *   {@link DEFAULT_SPRING_CONFIG} (`{ tension: 180, friction: 12 }`).
 * @returns An object containing the current `value` and an `isAnimating` flag.
 *
 * @example
 * ```tsx
 * import { useSpring } from '../animation';
 * import { BOUNCY_SPRING_CONFIG } from '@coexist/wisp-core/animation/constants';
 *
 * function Badge({ count }: { count: number }) {
 *   const { value } = useSpring(count, BOUNCY_SPRING_CONFIG);
 *   return <span>{Math.round(value)}</span>;
 * }
 * ```
 */
export function useSpring(
  target: number,
  config?: SpringConfig,
): SpringResult {
  const tension = config?.tension ?? DEFAULT_SPRING_CONFIG.tension;
  const friction = config?.friction ?? DEFAULT_SPRING_CONFIG.friction;

  const [value, setValue] = useState(target);
  const [isAnimating, setIsAnimating] = useState(false);

  const rafRef = useRef<number | null>(null);
  const positionRef = useRef<number>(target);
  const velocityRef = useRef<number>(0);
  const targetRef = useRef<number>(target);
  const lastTimeRef = useRef<number>(0);

  /**
   * Advance the spring by `dt` milliseconds using semi-implicit Euler
   * integration, which offers a good balance of accuracy and simplicity
   * for interactive UI.
   */
  const step = useCallback(
    (dt: number) => {
      const displacement = positionRef.current - targetRef.current;
      // Spring force: F = -k * x  (Hooke's law)
      // Damping force: F = -c * v
      const springForce = -tension * displacement;
      const dampingForce = -friction * velocityRef.current;
      const acceleration = springForce + dampingForce;

      velocityRef.current += acceleration * (dt / 1000);
      positionRef.current += velocityRef.current * (dt / 1000);
    },
    [tension, friction],
  );

  const loop = useCallback(
    (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      let remaining = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Clamp to avoid spiral-of-death if the tab was backgrounded.
      if (remaining > 64) {
        remaining = 64;
      }

      // Fixed time-step integration.
      while (remaining >= STEP_MS) {
        step(STEP_MS);
        remaining -= STEP_MS;
      }

      setValue(positionRef.current);

      const displacement = Math.abs(positionRef.current - targetRef.current);
      const speed = Math.abs(velocityRef.current);

      if (displacement < REST_THRESHOLD && speed < REST_THRESHOLD) {
        // Snap to exact target when at rest.
        positionRef.current = targetRef.current;
        velocityRef.current = 0;
        setValue(targetRef.current);
        setIsAnimating(false);
        rafRef.current = null;
      } else {
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [step],
  );

  useEffect(() => {
    if (Math.abs(targetRef.current - target) < 1e-6) {
      return;
    }

    targetRef.current = target;
    lastTimeRef.current = 0;
    setIsAnimating(true);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, loop]);

  return { value, isAnimating };
}
