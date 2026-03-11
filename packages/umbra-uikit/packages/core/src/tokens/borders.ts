/**
 * @module borders
 * @description Border width tokens for the Wisp UI kit.
 *
 * A minimal scale of border widths to maintain consistent stroke rendering
 * across all components. Values are in pixels and are suitable for both
 * React Native `borderWidth` and CSS `border-width`.
 *
 * @example
 * ```tsx
 * import { borderWidths } from '@/tokens';
 *
 * // Hairline divider
 * <View style={{ borderBottomWidth: borderWidths.thin, borderColor: '#333' }} />
 *
 * // Active state ring
 * <View style={{ borderWidth: borderWidths.medium, borderColor: brand.primary }} />
 * ```
 */

/**
 * Border width scale (in pixels).
 *
 * | Token  | px | Typical use                           |
 * |--------|----|---------------------------------------|
 * | none   |  0 | No border                             |
 * | thin   |  1 | Hairline borders, dividers            |
 * | medium |  2 | Active/focus rings, emphasized borders|
 * | thick  |  3 | Heavy accents, selection indicators   |
 *
 * @example
 * ```ts
 * borderWidths.none   // 0
 * borderWidths.thin   // 1
 * borderWidths.medium // 2
 * borderWidths.thick  // 3
 * ```
 */
export const borderWidths = {
  /** 0 px - no border */
  none: 0,
  /** 1 px - hairline borders, dividers */
  thin: 1,
  /** 2 px - active / focus rings, emphasized borders */
  medium: 2,
  /** 3 px - heavy accents, selection indicators */
  thick: 3,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all border width keys */
export type BorderWidthKey = keyof typeof borderWidths;

/** Union of all border width pixel values */
export type BorderWidthValue = (typeof borderWidths)[BorderWidthKey];
