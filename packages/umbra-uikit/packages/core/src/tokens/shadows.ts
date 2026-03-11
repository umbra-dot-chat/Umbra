/**
 * @module shadows
 * @description Elevation shadow tokens for the Wisp UI kit.
 *
 * Every shadow is a clean, dark drop-shadow suitable for both light and dark
 * themes. Each level contains the full set of React Native shadow properties
 * (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) plus an
 * `elevation` value for the Android platform.
 *
 * **Note:** This module intentionally provides elevation shadows only --
 * no colored glows or inset shadows.
 *
 * @example
 * ```tsx
 * import { shadows } from '@/tokens';
 *
 * // Flat element
 * <View style={shadows.none} />
 *
 * // Floating card
 * <View style={shadows.md} />
 *
 * // Modal overlay
 * <View style={shadows.xl} />
 * ```
 */

/**
 * Shape of a single shadow token.
 *
 * Mirrors the React Native shadow style API with an additional `elevation`
 * field for Android.
 */
export interface ShadowToken {
  /** Color of the shadow (always black for elevation shadows) */
  shadowColor: string;
  /** Offset from the element - { width, height } in pixels */
  shadowOffset: { width: number; height: number };
  /** Opacity of the shadow layer (0-1) */
  shadowOpacity: number;
  /** Blur radius of the shadow in pixels */
  shadowRadius: number;
  /** Android-specific elevation value */
  elevation: number;
}

/**
 * No shadow - completely flat element.
 *
 * @example
 * ```tsx
 * <View style={shadows.none} />
 * ```
 */
const none: ShadowToken = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
} as const;

/**
 * Extra-small shadow - barely perceptible lift.
 * Good for dividers, list items, or subtle depth cues.
 *
 * @example
 * ```tsx
 * <View style={shadows.xs} />
 * ```
 */
const xs: ShadowToken = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 1,
  elevation: 1,
} as const;

/**
 * Small shadow - gentle lift for cards and inputs.
 *
 * @example
 * ```tsx
 * <View style={shadows.sm} />
 * ```
 */
const sm: ShadowToken = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 2,
  elevation: 2,
} as const;

/**
 * Medium shadow - default floating element.
 * Ideal for cards, dropdowns, and interactive surfaces.
 *
 * @example
 * ```tsx
 * <View style={shadows.md} />
 * ```
 */
const md: ShadowToken = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 4,
} as const;

/**
 * Large shadow - pronounced lift for popovers and drawers.
 *
 * @example
 * ```tsx
 * <View style={shadows.lg} />
 * ```
 */
const lg: ShadowToken = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.2,
  shadowRadius: 8,
  elevation: 8,
} as const;

/**
 * Extra-large shadow - highest elevation for modals and toasts.
 *
 * @example
 * ```tsx
 * <View style={shadows.xl} />
 * ```
 */
const xl: ShadowToken = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 16,
} as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

/**
 * Complete elevation shadow scale for the Wisp UI kit.
 *
 * @example
 * ```ts
 * import { shadows } from '@/tokens';
 *
 * shadows.none // flat
 * shadows.xs   // barely perceptible
 * shadows.sm   // gentle lift
 * shadows.md   // default floating
 * shadows.lg   // pronounced lift
 * shadows.xl   // highest elevation
 * ```
 */
export const shadows = {
  none,
  xs,
  sm,
  md,
  lg,
  xl,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all shadow level keys */
export type ShadowLevel = keyof typeof shadows;
