/**
 * @module opacity
 * @description Opacity scale tokens for the Wisp UI kit.
 *
 * A semantic, named scale from fully transparent to fully opaque.
 * Use these tokens whenever you need a consistent opacity value --
 * overlays, disabled states, hover feedback, skeleton loaders, etc.
 *
 * @example
 * ```tsx
 * import { opacity } from '@/tokens';
 *
 * // Disabled button
 * <Pressable
 *   disabled
 *   style={{ opacity: opacity.subtle }}
 * />
 *
 * // Overlay backdrop
 * <View style={{
 *   ...StyleSheet.absoluteFillObject,
 *   backgroundColor: '#000',
 *   opacity: opacity.medium,
 * }} />
 * ```
 */

/**
 * Opacity scale from 0 (invisible) to 1 (fully visible).
 *
 * | Token       | Value | Typical use                           |
 * |-------------|-------|---------------------------------------|
 * | transparent | 0     | Fully invisible                       |
 * | ghost       | 0.05  | Ghost elements, ultra-faint overlays  |
 * | faint       | 0.1   | Skeleton loaders, faint hints         |
 * | muted       | 0.2   | Disabled icons, watermarks            |
 * | subtle      | 0.4   | Disabled text / buttons               |
 * | medium      | 0.6   | Overlay backdrops                     |
 * | strong      | 0.8   | Semi-opaque panels                    |
 * | opaque      | 1     | Fully visible (default)               |
 *
 * @example
 * ```ts
 * opacity.transparent // 0
 * opacity.subtle      // 0.4
 * opacity.opaque      // 1
 * ```
 */
export const opacity = {
  /** 0 - fully invisible */
  transparent: 0,
  /** 0.05 - ghost elements, ultra-faint overlays */
  ghost: 0.05,
  /** 0.1 - skeleton loaders, faint hints */
  faint: 0.1,
  /** 0.2 - disabled icons, watermarks */
  muted: 0.2,
  /** 0.4 - disabled text / buttons */
  subtle: 0.4,
  /** 0.6 - overlay backdrops */
  medium: 0.6,
  /** 0.8 - semi-opaque panels */
  strong: 0.8,
  /** 1 - fully visible (default) */
  opaque: 1,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all opacity keys */
export type OpacityKey = keyof typeof opacity;

/** Union of all opacity values */
export type OpacityValue = (typeof opacity)[OpacityKey];
