/**
 * @module animation/use-transition
 * @description A React hook for animating the mount and unmount of an
 * element. The element stays in the DOM during the exit animation and is
 * removed only after the animation completes.
 *
 * This is the low-level hook that powers the {@link Presence} component.
 *
 * @example
 * ```tsx
 * import { useTransition } from '../animation';
 *
 * function Toast({ visible, message }: { visible: boolean; message: string }) {
 *   const { mounted, style, phase } = useTransition(visible, {
 *     duration: 200,
 *     easing: 'easeOut',
 *   });
 *
 *   if (!mounted) return null;
 *
 *   return (
 *     <div style={{ ...style, padding: 12, background: '#1E293B', color: '#F8FAFC' }}>
 *       {message} ({phase})
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type React from 'react';
import { DEFAULT_DURATION } from '@coexist/wisp-core/animation/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Lifecycle phase of the transition.
 *
 * - `enter` -- the element is animating into view.
 * - `idle` -- the element is fully visible and static.
 * - `exit` -- the element is animating out of view.
 *
 * @example
 * ```ts
 * if (phase === 'exit') {
 *   // perform cleanup before unmount
 * }
 * ```
 */
export type TransitionPhase = 'enter' | 'idle' | 'exit';

/**
 * Optional configuration for {@link useTransition}.
 *
 * @example
 * ```ts
 * const config: TransitionConfig = { duration: 300, easing: 'easeInOut' };
 * ```
 */
export type TransitionConfig = {
  /** Duration in milliseconds for both enter and exit. Defaults to {@link DEFAULT_DURATION}. */
  duration?: number;
  /** CSS easing string applied via the `transition` property. Defaults to `'ease-out'`. */
  easing?: string;
};

/**
 * Return type of {@link useTransition}.
 *
 * @example
 * ```tsx
 * const { mounted, style, phase } = useTransition(visible);
 * ```
 */
export type TransitionResult = {
  /** Whether the element should be rendered in the DOM. */
  mounted: boolean;
  /** CSS styles to apply to the element (opacity, transform, transition). */
  style: React.CSSProperties;
  /** Current lifecycle phase of the animation. */
  phase: TransitionPhase;
};

// ---------------------------------------------------------------------------
// Easing map
// ---------------------------------------------------------------------------

/** Map friendly names to CSS timing functions. */
const CSS_EASINGS: Record<string, string> = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 0.5)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

function resolveCSSEasing(name: string): string {
  return CSS_EASINGS[name] ?? name;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages the mount / unmount lifecycle of an element with CSS transitions.
 *
 * When `visible` becomes `true` the element is mounted and transitioned in.
 * When `visible` becomes `false` the element begins its exit transition and
 * is unmounted only after `duration` milliseconds.
 *
 * @param visible - Whether the element should be visible.
 * @param config - Optional duration and easing overrides.
 * @returns An object with `mounted`, `style`, and `phase`.
 *
 * @example
 * ```tsx
 * import { useTransition } from '../animation';
 *
 * function Tooltip({ show, text }: { show: boolean; text: string }) {
 *   const { mounted, style } = useTransition(show, { duration: 150 });
 *   if (!mounted) return null;
 *   return <span style={style}>{text}</span>;
 * }
 * ```
 */
export function useTransition(
  visible: boolean,
  config?: TransitionConfig,
): TransitionResult {
  const duration = config?.duration ?? DEFAULT_DURATION;
  const cssEasing = resolveCSSEasing(config?.easing ?? 'easeOut');

  const [mounted, setMounted] = useState(visible);
  const [phase, setPhase] = useState<TransitionPhase>(visible ? 'idle' : 'exit');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialRenderRef = useRef(true);

  // Clean up timeout on unmount.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (visible) {
      // Mount immediately, then transition to idle on the next frame.
      setMounted(true);
      setPhase('enter');

      // Transition from enter -> idle after the animation completes.
      timeoutRef.current = setTimeout(() => {
        setPhase('idle');
        timeoutRef.current = null;
      }, duration);
    } else {
      if (initialRenderRef.current) {
        // On the very first render, if not visible, just stay unmounted.
        setMounted(false);
        setPhase('exit');
      } else {
        // Begin exit transition, then unmount.
        setPhase('exit');

        timeoutRef.current = setTimeout(() => {
          setMounted(false);
          timeoutRef.current = null;
        }, duration);
      }
    }

    initialRenderRef.current = false;
  }, [visible, duration]);

  const style: React.CSSProperties = useMemo(() => {
    const isVisible = phase === 'idle' || phase === 'enter';
    // During enter phase, we need the element to start invisible then become visible.
    // We use a two-step approach: mount with enter styles, then transition.
    const opacity = phase === 'enter' || phase === 'idle' ? 1 : 0;
    const transform =
      phase === 'enter' || phase === 'idle'
        ? 'translateY(0) scale(1)'
        : 'translateY(4px) scale(0.98)';

    return {
      opacity,
      transform,
      transition: `opacity ${duration}ms ${cssEasing}, transform ${duration}ms ${cssEasing}`,
      willChange: 'opacity, transform',
    };
  }, [phase, duration, cssEasing]);

  return { mounted, style, phase };
}
