/**
 * @module animation/presets
 * @description Declarative animation preset configurations for the Wisp UI kit.
 *
 * Each preset is a plain data object describing the `from` and `to` states,
 * duration, and easing of an animation. They are intentionally **not** tied
 * to any specific animation runtime (CSS transitions, `requestAnimationFrame`,
 * React Native `Animated`, etc.) so they can be consumed on any platform.
 *
 * @example
 * ```ts
 * import { fadeIn, scaleIn } from '@wisp/animation/presets';
 *
 * // Use with a CSS transition helper
 * applyTransition(element, fadeIn);
 *
 * // Or read values to feed into a spring / rAF loop
 * const { from, to, duration, easing } = scaleIn;
 * ```
 */

import { DEFAULT_DURATION, FAST_DURATION, DEFAULT_EASING } from './constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A platform-agnostic description of an animation.
 *
 * - `from` -- initial animated property values.
 * - `to` -- target animated property values.
 * - `duration` -- length of the animation in milliseconds.
 * - `easing` -- CSS easing string (or a name that the consuming runtime maps to
 *   an easing function).
 *
 * @example
 * ```ts
 * import type { AnimationPreset } from '@wisp/animation/presets';
 *
 * const custom: AnimationPreset = {
 *   from: { opacity: 0, rotate: -5 },
 *   to: { opacity: 1, rotate: 0 },
 *   duration: 300,
 *   easing: 'easeOut',
 * };
 * ```
 */
export type AnimationPreset = {
  /** Initial animated property values */
  from: Record<string, number>;
  /** Target animated property values */
  to: Record<string, number>;
  /** Duration in milliseconds */
  duration: number;
  /** Easing identifier (CSS timing function string or named curve) */
  easing: string;
};

// ---------------------------------------------------------------------------
// Fade presets
// ---------------------------------------------------------------------------

/**
 * Fade-in preset -- opacity from 0 to 1.
 *
 * @example
 * ```ts
 * import { fadeIn } from '@wisp/animation/presets';
 * // fadeIn.from.opacity === 0
 * // fadeIn.to.opacity   === 1
 * ```
 */
export const fadeIn: AnimationPreset = {
  from: { opacity: 0 },
  to: { opacity: 1 },
  duration: DEFAULT_DURATION,
  easing: 'easeOut',
};

/**
 * Fade-out preset -- opacity from 1 to 0.
 *
 * @example
 * ```ts
 * import { fadeOut } from '@wisp/animation/presets';
 * // fadeOut.from.opacity === 1
 * // fadeOut.to.opacity   === 0
 * ```
 */
export const fadeOut: AnimationPreset = {
  from: { opacity: 1 },
  to: { opacity: 0 },
  duration: DEFAULT_DURATION,
  easing: 'easeIn',
};

// ---------------------------------------------------------------------------
// Scale presets
// ---------------------------------------------------------------------------

/**
 * Scale-in preset -- fades in while scaling from 95% to 100%.
 *
 * @example
 * ```ts
 * import { scaleIn } from '@wisp/animation/presets';
 * // scaleIn.from === { opacity: 0, scale: 0.95 }
 * ```
 */
export const scaleIn: AnimationPreset = {
  from: { opacity: 0, scale: 0.95 },
  to: { opacity: 1, scale: 1 },
  duration: DEFAULT_DURATION,
  easing: 'easeOut',
};

/**
 * Scale-out preset -- fades out while scaling from 100% to 95%.
 *
 * @example
 * ```ts
 * import { scaleOut } from '@wisp/animation/presets';
 * // scaleOut.to === { opacity: 0, scale: 0.95 }
 * ```
 */
export const scaleOut: AnimationPreset = {
  from: { opacity: 1, scale: 1 },
  to: { opacity: 0, scale: 0.95 },
  duration: DEFAULT_DURATION,
  easing: 'easeIn',
};

// ---------------------------------------------------------------------------
// Slide presets
// ---------------------------------------------------------------------------

/**
 * Slide-up preset -- fades in while translating up from 8 px below.
 *
 * @example
 * ```ts
 * import { slideUp } from '@wisp/animation/presets';
 * // slideUp.from === { opacity: 0, translateY: 8 }
 * ```
 */
export const slideUp: AnimationPreset = {
  from: { opacity: 0, translateY: 8 },
  to: { opacity: 1, translateY: 0 },
  duration: DEFAULT_DURATION,
  easing: 'easeOut',
};

/**
 * Slide-down preset -- fades in while translating down from 8 px above.
 *
 * @example
 * ```ts
 * import { slideDown } from '@wisp/animation/presets';
 * // slideDown.from === { opacity: 0, translateY: -8 }
 * ```
 */
export const slideDown: AnimationPreset = {
  from: { opacity: 0, translateY: -8 },
  to: { opacity: 1, translateY: 0 },
  duration: DEFAULT_DURATION,
  easing: 'easeOut',
};

/**
 * Slide-left preset -- fades in while translating left from 8 px to the right.
 *
 * @example
 * ```ts
 * import { slideLeft } from '@wisp/animation/presets';
 * // slideLeft.from === { opacity: 0, translateX: 8 }
 * ```
 */
export const slideLeft: AnimationPreset = {
  from: { opacity: 0, translateX: 8 },
  to: { opacity: 1, translateX: 0 },
  duration: DEFAULT_DURATION,
  easing: 'easeOut',
};

/**
 * Slide-right preset -- fades in while translating right from 8 px to the left.
 *
 * @example
 * ```ts
 * import { slideRight } from '@wisp/animation/presets';
 * // slideRight.from === { opacity: 0, translateX: -8 }
 * ```
 */
export const slideRight: AnimationPreset = {
  from: { opacity: 0, translateX: -8 },
  to: { opacity: 1, translateX: 0 },
  duration: DEFAULT_DURATION,
  easing: 'easeOut',
};
