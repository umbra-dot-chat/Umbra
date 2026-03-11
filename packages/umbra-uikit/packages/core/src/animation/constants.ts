/**
 * @module animation/constants
 * @description Re-exports motion tokens as animation-specific constants.
 *
 * This module provides convenient aliases so animation code can import
 * duration, easing, and spring values without reaching into the raw
 * token layer.
 *
 * @example
 * ```ts
 * import {
 *   DEFAULT_DURATION,
 *   FAST_DURATION,
 *   DEFAULT_EASING,
 *   DEFAULT_SPRING_CONFIG,
 * } from '@wisp/animation/constants';
 *
 * const transition = `opacity ${DEFAULT_DURATION}ms ${DEFAULT_EASING}`;
 * ```
 */

import { durations, easings, springs } from '../tokens/motion';
import type { SpringConfig } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Duration constants
// ---------------------------------------------------------------------------

/**
 * Instant duration (50 ms) -- micro-interactions like opacity toggles.
 *
 * @example
 * ```ts
 * import { INSTANT_DURATION } from '@wisp/animation/constants';
 * // INSTANT_DURATION === 50
 * ```
 */
export const INSTANT_DURATION: number = durations.instant;

/**
 * Fast duration (150 ms) -- micro-interactions such as button presses.
 *
 * @example
 * ```ts
 * import { FAST_DURATION } from '@wisp/animation/constants';
 * // FAST_DURATION === 150
 * ```
 */
export const FAST_DURATION: number = durations.fast;

/**
 * Default / normal duration (250 ms) -- the standard UI transition speed.
 *
 * @example
 * ```ts
 * import { DEFAULT_DURATION } from '@wisp/animation/constants';
 * const style = { transition: `all ${DEFAULT_DURATION}ms ease-out` };
 * ```
 */
export const DEFAULT_DURATION: number = durations.normal;

/**
 * Slow duration (400 ms) -- deliberate animations like modals.
 *
 * @example
 * ```ts
 * import { SLOW_DURATION } from '@wisp/animation/constants';
 * // SLOW_DURATION === 400
 * ```
 */
export const SLOW_DURATION: number = durations.slow;

/**
 * Slowest duration (600 ms) -- dramatic reveals and page transitions.
 *
 * @example
 * ```ts
 * import { SLOWEST_DURATION } from '@wisp/animation/constants';
 * // SLOWEST_DURATION === 600
 * ```
 */
export const SLOWEST_DURATION: number = durations.slowest;

// ---------------------------------------------------------------------------
// Easing constants
// ---------------------------------------------------------------------------

/**
 * Default easing CSS string (`ease-out`) used for most UI transitions.
 *
 * Derived from the `easeOut` motion token.
 *
 * @example
 * ```ts
 * import { DEFAULT_EASING } from '@wisp/animation/constants';
 * const style = { transition: `opacity 250ms ${DEFAULT_EASING}` };
 * // DEFAULT_EASING === 'cubic-bezier(0, 0, 0.2, 1)'
 * ```
 */
export const DEFAULT_EASING: string = easings.easeOut.css;

/**
 * Linear easing -- constant speed, no acceleration.
 *
 * @example
 * ```ts
 * import { LINEAR_EASING } from '@wisp/animation/constants';
 * // LINEAR_EASING === 'linear'
 * ```
 */
export const LINEAR_EASING: string = easings.linear.css;

/**
 * Ease-in CSS string -- starts slow, finishes fast.
 *
 * @example
 * ```ts
 * import { EASE_IN } from '@wisp/animation/constants';
 * ```
 */
export const EASE_IN: string = easings.easeIn.css;

/**
 * Ease-in-out CSS string -- smooth acceleration and deceleration.
 *
 * @example
 * ```ts
 * import { EASE_IN_OUT } from '@wisp/animation/constants';
 * ```
 */
export const EASE_IN_OUT: string = easings.easeInOut.css;

// ---------------------------------------------------------------------------
// Spring configuration constants
// ---------------------------------------------------------------------------

/**
 * Default spring config -- balanced feel for general-purpose transitions.
 *
 * @example
 * ```ts
 * import { DEFAULT_SPRING_CONFIG } from '@wisp/animation/constants';
 * // { tension: 180, friction: 12 }
 * ```
 */
export const DEFAULT_SPRING_CONFIG: SpringConfig = { tension: 180, friction: 12 };

/**
 * Gentle spring config -- soft, understated motion.
 *
 * @example
 * ```ts
 * import { GENTLE_SPRING_CONFIG } from '@wisp/animation/constants';
 * // { tension: 120, friction: 14 }
 * ```
 */
export const GENTLE_SPRING_CONFIG: SpringConfig = springs.gentle;

/**
 * Bouncy spring config -- energetic, playful interactions.
 *
 * @example
 * ```ts
 * import { BOUNCY_SPRING_CONFIG } from '@wisp/animation/constants';
 * // { tension: 300, friction: 10 }
 * ```
 */
export const BOUNCY_SPRING_CONFIG: SpringConfig = { tension: 300, friction: 10 };
