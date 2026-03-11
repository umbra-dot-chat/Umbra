/**
 * @module animation/Presence
 * @description A React component that animates the mount and unmount of its
 * children. Built on top of {@link useTransition}, it provides a declarative
 * API for common enter/exit animations.
 *
 * @example
 * ```tsx
 * import { Presence } from '../animation';
 *
 * function App() {
 *   const [show, setShow] = useState(false);
 *
 *   return (
 *     <>
 *       <button onClick={() => setShow((s) => !s)}>Toggle</button>
 *       <Presence visible={show} animation="scaleIn" duration={200}>
 *         <div style={{ padding: defaultSpacing.lg, background: '#1E293B', color: '#F8FAFC' }}>
 *           Hello from Presence!
 *         </div>
 *       </Presence>
 *     </>
 *   );
 * }
 * ```
 */

import React, { useMemo } from 'react';
import { useTransition } from './use-transition';
import type { TransitionPhase } from './use-transition';
import { DEFAULT_DURATION } from '@coexist/wisp-core/animation/constants';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Built-in animation style options for {@link Presence}.
 *
 * @example
 * ```tsx
 * <Presence visible={show} animation="slideUp">
 *   <div>Content</div>
 * </Presence>
 * ```
 */
export type PresenceAnimation = 'fadeIn' | 'scaleIn' | 'slideUp' | 'slideDown';

/**
 * Props for the {@link Presence} component.
 *
 * @example
 * ```tsx
 * <Presence visible={isOpen} animation="fadeIn" duration={300}>
 *   <Modal />
 * </Presence>
 * ```
 */
export type PresenceProps = {
  /** Whether the children should be visible. */
  visible: boolean;
  /**
   * The animation style to use.
   * Defaults to `'fadeIn'`.
   *
   * @example
   * ```tsx
   * <Presence visible={show} animation="slideUp">...</Presence>
   * ```
   */
  animation?: PresenceAnimation;
  /**
   * Duration in milliseconds for both enter and exit.
   * Defaults to {@link DEFAULT_DURATION}.
   *
   * @example
   * ```tsx
   * <Presence visible={show} duration={400}>...</Presence>
   * ```
   */
  duration?: number;
  /** The content to animate in and out. */
  children: React.ReactNode;
};

// ---------------------------------------------------------------------------
// Animation style builders
// ---------------------------------------------------------------------------

/**
 * Build CSS styles for each animation variant based on the current
 * transition phase.
 */
function buildAnimationStyle(
  animation: PresenceAnimation,
  phase: TransitionPhase,
  duration: number,
): React.CSSProperties {
  const isVisible = phase === 'idle' || phase === 'enter';
  const easing = 'cubic-bezier(0, 0, 0.2, 1)';

  const base: React.CSSProperties = {
    willChange: 'opacity, transform',
  };

  switch (animation) {
    case 'fadeIn':
      return {
        ...base,
        opacity: isVisible ? 1 : 0,
        transition: `opacity ${duration}ms ${easing}`,
      };

    case 'scaleIn':
      return {
        ...base,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`,
      };

    case 'slideUp':
      return {
        ...base,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`,
      };

    case 'slideDown':
      return {
        ...base,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-8px)',
        transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`,
      };

    default: {
      // Exhaustive check -- TypeScript will error if a case is missing.
      const _exhaustive: never = animation;
      return base;
    }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders children with an animated mount/unmount transition.
 *
 * The component keeps children in the DOM during the exit animation and
 * removes them only after the transition completes.
 *
 * @param props - {@link PresenceProps}
 * @returns The wrapped children with transition styles, or `null` when
 *   fully unmounted.
 *
 * @example
 * ```tsx
 * import { Presence } from '../animation';
 *
 * function Notification({ show, message }: { show: boolean; message: string }) {
 *   return (
 *     <Presence visible={show} animation="slideUp" duration={200}>
 *       <div className="notification">{message}</div>
 *     </Presence>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Fade-in modal overlay
 * <Presence visible={isModalOpen} animation="fadeIn" duration={300}>
 *   <div className="overlay">
 *     <div className="modal-content">...</div>
 *   </div>
 * </Presence>
 * ```
 */
export function Presence({
  visible,
  animation = 'fadeIn',
  duration = DEFAULT_DURATION,
  children,
}: PresenceProps): JSX.Element | null {
  const { mounted, phase } = useTransition(visible, { duration });

  const style = useMemo(
    () => buildAnimationStyle(animation, phase, duration),
    [animation, phase, duration],
  );

  if (!mounted) {
    return null;
  }

  return <div style={style}>{children}</div>;
}
