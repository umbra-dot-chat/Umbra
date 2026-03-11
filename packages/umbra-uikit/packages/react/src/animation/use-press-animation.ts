/**
 * @module animation/use-press-animation
 * @description A React hook that provides spring-based press feedback
 * (scale down on press, spring back on release).
 *
 * Returns a `scale` value, mouse/pointer event handlers, and a
 * pre-computed `style` object so consumers can simply spread the result
 * onto an element.
 *
 * @example
 * ```tsx
 * import { usePressAnimation } from '../animation';
 *
 * function PressableCard({ children }: { children: React.ReactNode }) {
 *   const { handlers, style } = usePressAnimation({ scale: 0.97 });
 *
 *   return (
 *     <div {...handlers} style={{ ...style, padding: 16 }}>
 *       {children}
 *     </div>
 *   );
 * }
 * ```
 */

import { useCallback, useMemo, useState } from 'react';
import type React from 'react';
import { useSpring } from './use-spring';
import { DEFAULT_SPRING_CONFIG } from '@coexist/wisp-core/animation/constants';
import type { SpringConfig } from '@coexist/wisp-core/tokens/motion';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Optional configuration for {@link usePressAnimation}.
 *
 * @example
 * ```ts
 * const config: PressAnimationConfig = { scale: 0.95, spring: { tension: 250, friction: 12 } };
 * ```
 */
export type PressAnimationConfig = {
  /**
   * The scale factor to animate to while the element is pressed.
   * Defaults to `0.97`.
   *
   * @example
   * ```ts
   * { scale: 0.95 } // more pronounced press effect
   * ```
   */
  scale?: number;
  /**
   * Spring configuration for the press animation.
   * Defaults to {@link DEFAULT_SPRING_CONFIG}.
   *
   * @example
   * ```ts
   * { spring: { tension: 300, friction: 10 } }
   * ```
   */
  spring?: SpringConfig;
};

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

/**
 * The return value of {@link usePressAnimation}.
 *
 * @example
 * ```tsx
 * const { scale, handlers, style } = usePressAnimation();
 * ```
 */
export type PressAnimationResult = {
  /** The current scale value (animated). */
  scale: number;
  /** Event handlers to spread onto the target element. */
  handlers: {
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: () => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
  };
  /** Pre-built CSS transform style reflecting the current scale. */
  style: React.CSSProperties;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Provides a spring-powered press feedback animation.
 *
 * While the pointer is down, the element scales to the configured `scale`
 * value. On release (or when the pointer leaves the element) it springs
 * back to `1`. Because the animation uses spring physics, the release
 * feels natural and responsive.
 *
 * @param config - Optional scale target and spring configuration.
 * @returns An object with the current `scale`, event `handlers`, and a
 *   ready-to-use CSS `style` object.
 *
 * @example
 * ```tsx
 * import { usePressAnimation } from '../animation';
 *
 * function Button({ label }: { label: string }) {
 *   const { handlers, style } = usePressAnimation();
 *   return (
 *     <button {...handlers} style={style}>
 *       {label}
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom scale and spring
 * const { handlers, style } = usePressAnimation({
 *   scale: 0.92,
 *   spring: { tension: 300, friction: 10 },
 * });
 * ```
 */
export function usePressAnimation(config?: PressAnimationConfig): PressAnimationResult {
  const pressedScale = config?.scale ?? 0.97;
  const springConfig = config?.spring ?? DEFAULT_SPRING_CONFIG;

  const [pressed, setPressed] = useState(false);

  const { value: scale } = useSpring(pressed ? pressedScale : 1, springConfig);

  const onMouseDown = useCallback(() => setPressed(true), []);
  const onMouseUp = useCallback(() => setPressed(false), []);
  const onMouseLeave = useCallback(() => setPressed(false), []);
  const onTouchStart = useCallback(() => setPressed(true), []);
  const onTouchEnd = useCallback(() => setPressed(false), []);
  const onTouchCancel = useCallback(() => setPressed(false), []);

  const handlers = useMemo(
    () => ({
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      onTouchStart,
      onTouchEnd,
      onTouchCancel,
    }),
    [onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd, onTouchCancel],
  );

  const style: React.CSSProperties = useMemo(
    () => ({
      transform: `scale(${scale})`,
      willChange: 'transform',
    }),
    [scale],
  );

  return { scale, handlers, style };
}
