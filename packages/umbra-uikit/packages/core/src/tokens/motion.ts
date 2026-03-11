/**
 * @module motion
 * @description Animation and motion tokens for the Wisp UI kit.
 *
 * Provides duration presets, easing curves (as CSS timing functions and
 * React Native Animated-compatible Bezier arrays), and spring physics
 * configurations for use with `Animated.spring` or Reanimated.
 *
 * @example
 * ```tsx
 * import { durations, easings, springs } from '@/tokens';
 *
 * // React Native Animated
 * Animated.timing(opacity, {
 *   toValue: 1,
 *   duration: durations.normal,
 *   easing: Easing.bezier(...easings.easeOut.bezier),
 *   useNativeDriver: true,
 * }).start();
 *
 * // Spring animation
 * Animated.spring(scale, {
 *   toValue: 1,
 *   tension: springs.snappy.tension,
 *   friction: springs.snappy.friction,
 *   useNativeDriver: true,
 * }).start();
 * ```
 */

// ---------------------------------------------------------------------------
// Durations
// ---------------------------------------------------------------------------

/**
 * Animation duration presets in milliseconds.
 *
 * | Token   | ms  | Typical use                                |
 * |---------|-----|--------------------------------------------|
 * | instant |  50 | Micro-interactions (opacity toggles)       |
 * | fast    | 150 | Hover / press feedback, small transitions  |
 * | normal  | 250 | Default transitions (fade, slide)          |
 * | slow    | 400 | Complex transitions (layout shifts)        |
 * | slowest | 600 | Dramatic reveals, page transitions         |
 *
 * @example
 * ```ts
 * durations.instant // 50
 * durations.normal  // 250
 * durations.slowest // 600
 * ```
 */
export const durations = {
  /** 50 ms - micro-interactions */
  instant: 50,
  /** 150 ms - hover / press feedback */
  fast: 150,
  /** 250 ms - default transitions */
  normal: 250,
  /** 400 ms - complex transitions */
  slow: 400,
  /** 600 ms - dramatic reveals */
  slowest: 600,
} as const;

// ---------------------------------------------------------------------------
// Easings
// ---------------------------------------------------------------------------

/**
 * Shape of a single easing token.
 *
 * Each token provides:
 * - `css`    -- A CSS `transition-timing-function` string.
 * - `bezier` -- A 4-element tuple `[x1, y1, x2, y2]` for
 *               `Easing.bezier()` in React Native Animated.
 */
export interface EasingToken {
  /** CSS timing-function string */
  css: string;
  /** Cubic-bezier control points [x1, y1, x2, y2] */
  bezier: readonly [number, number, number, number];
}

/**
 * Easing curve presets.
 *
 * @example
 * ```ts
 * easings.default.css     // 'cubic-bezier(0.4, 0, 0.2, 1)'
 * easings.easeOut.bezier  // [0, 0, 0.2, 1]
 * ```
 */
export const easings = {
  /**
   * Default easing - smooth all-purpose curve.
   * Equivalent to Material Design "standard" easing.
   */
  default: {
    css: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bezier: [0.4, 0, 0.2, 1] as const,
  },
  /** Linear - no acceleration, useful for opacity or color changes */
  linear: {
    css: 'linear',
    bezier: [0, 0, 1, 1] as const,
  },
  /** Ease-in - starts slow, accelerates (enter-from-rest) */
  easeIn: {
    css: 'cubic-bezier(0.4, 0, 1, 1)',
    bezier: [0.4, 0, 1, 1] as const,
  },
  /** Ease-out - starts fast, decelerates (settle-to-rest) */
  easeOut: {
    css: 'cubic-bezier(0, 0, 0.2, 1)',
    bezier: [0, 0, 0.2, 1] as const,
  },
  /** Ease-in-out - symmetric acceleration and deceleration */
  easeInOut: {
    css: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bezier: [0.4, 0, 0.2, 1] as const,
  },
} as const;

// ---------------------------------------------------------------------------
// Spring configs
// ---------------------------------------------------------------------------

/**
 * Shape of a spring physics configuration.
 *
 * Compatible with both React Native `Animated.spring` and Reanimated
 * `withSpring` (via the `mass`, `damping`, `stiffness` equivalences).
 */
export interface SpringConfig {
  /** Spring tension (stiffness). Higher = stiffer / faster. */
  tension: number;
  /** Spring friction (damping). Higher = less oscillation. */
  friction: number;
}

/**
 * Pre-tuned spring configurations for common interaction patterns.
 *
 * | Token     | Tension | Friction | Character                    |
 * |-----------|---------|----------|------------------------------|
 * | gentle    |     120 |       14 | Soft, dreamy motion          |
 * | default   |     170 |       26 | Balanced, general purpose    |
 * | snappy    |     300 |       20 | Quick with slight overshoot  |
 * | bouncy    |     400 |       12 | Playful, noticeable bounce   |
 * | stiff     |     500 |       30 | Rigid, almost no overshoot   |
 *
 * @example
 * ```ts
 * Animated.spring(value, {
 *   toValue: 1,
 *   ...springs.snappy,
 *   useNativeDriver: true,
 * }).start();
 * ```
 */
export const springs = {
  /** Soft, dreamy motion */
  gentle: { tension: 120, friction: 14 } as const,
  /** Balanced, general purpose */
  default: { tension: 170, friction: 26 } as const,
  /** Quick with slight overshoot */
  snappy: { tension: 300, friction: 20 } as const,
  /** Playful, noticeable bounce */
  bouncy: { tension: 400, friction: 12 } as const,
  /** Rigid, almost no overshoot */
  stiff: { tension: 500, friction: 30 } as const,
} as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

/**
 * Complete motion system for the Wisp UI kit.
 *
 * @example
 * ```ts
 * import { motion } from '@/tokens';
 *
 * motion.durations.fast        // 150
 * motion.easings.easeOut.css   // 'cubic-bezier(0, 0, 0.2, 1)'
 * motion.springs.snappy        // { tension: 300, friction: 20 }
 * ```
 */
export const motion = {
  durations,
  easings,
  springs,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of duration keys */
export type DurationKey = keyof typeof durations;

/** Union of easing keys */
export type EasingKey = keyof typeof easings;

/** Union of spring config keys */
export type SpringKey = keyof typeof springs;
