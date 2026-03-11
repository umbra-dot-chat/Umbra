/**
 * @module radii
 * @description Border radius tokens for the Wisp UI kit.
 *
 * Provides a graduated scale from sharp corners (`none`) to fully circular
 * elements (`full`). Use the t-shirt-sized keys for consistent component
 * rounding across the design system.
 *
 * @example
 * ```tsx
 * import { radii } from '@/tokens';
 *
 * // Subtle rounding for a card
 * <View style={{ borderRadius: radii.lg }} />
 *
 * // Pill-shaped button
 * <Pressable style={{ borderRadius: radii.full }} />
 * ```
 */

/**
 * Border radius scale (in pixels).
 *
 * | Token | px    | Typical use                         |
 * |-------|-------|-------------------------------------|
 * | none  | 0     | Sharp corners                       |
 * | xs    | 2     | Subtle rounding, code blocks        |
 * | sm    | 4     | Inputs, small cards                 |
 * | md    | 6     | Default component rounding          |
 * | lg    | 8     | Cards, dialogs                      |
 * | xl    | 12    | Large cards, popovers               |
 * | 2xl   | 16    | Hero sections, feature cards        |
 * | full  | 9999  | Pill shapes, avatars, circles       |
 *
 * @example
 * ```ts
 * radii.none  // 0
 * radii.md    // 6
 * radii.full  // 9999
 * ```
 */
export const radii = {
  /** 0 px - sharp corners */
  none: 0,
  /** 2 px - subtle rounding, code blocks */
  xs: 2,
  /** 4 px - inputs, small cards */
  sm: 4,
  /** 6 px - default component rounding */
  md: 6,
  /** 8 px - cards, dialogs */
  lg: 8,
  /** 12 px - large cards, popovers */
  xl: 12,
  /** 16 px - hero sections, feature cards */
  '2xl': 16,
  /** 9999 px - pill shapes, avatars, circles */
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all radius scale keys */
export type RadiiKey = keyof typeof radii;

/** Union of all radius pixel values */
export type RadiiValue = (typeof radii)[RadiiKey];
