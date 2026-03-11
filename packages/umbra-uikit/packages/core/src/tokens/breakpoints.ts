/**
 * @module breakpoints
 * @description Responsive breakpoint tokens for the Wisp UI kit.
 *
 * Follows a mobile-first philosophy: the smallest breakpoint (`xs`) starts
 * at 0 and each subsequent key represents the *minimum* viewport width at
 * which that tier activates.
 *
 * These values align with widely-adopted Tailwind CSS breakpoints, making
 * migration and documentation straightforward.
 *
 * @example
 * ```ts
 * import { breakpoints } from '@/tokens';
 * import { useWindowDimensions } from 'react-native';
 *
 * const { width } = useWindowDimensions();
 *
 * const columns =
 *   width >= breakpoints.xl ? 4 :
 *   width >= breakpoints.lg ? 3 :
 *   width >= breakpoints.md ? 2 : 1;
 * ```
 */

/**
 * Breakpoint scale (minimum viewport widths in pixels).
 *
 * | Token | px   | Typical device / context              |
 * |-------|------|---------------------------------------|
 * | xs    |    0 | Small phones (default / base)         |
 * | sm    |  640 | Large phones, landscape               |
 * | md    |  768 | Tablets (portrait)                    |
 * | lg    | 1024 | Tablets (landscape), small laptops    |
 * | xl    | 1280 | Desktops, large laptops               |
 * | 2xl   | 1536 | Wide desktops, ultra-wide monitors    |
 *
 * @example
 * ```ts
 * breakpoints.xs    // 0
 * breakpoints.md    // 768
 * breakpoints['2xl'] // 1536
 * ```
 */
export const breakpoints = {
  /** 0 px - small phones (default base) */
  xs: 0,
  /** 640 px - large phones, landscape */
  sm: 640,
  /** 768 px - tablets (portrait) */
  md: 768,
  /** 1024 px - tablets (landscape), small laptops */
  lg: 1024,
  /** 1280 px - desktops, large laptops */
  xl: 1280,
  /** 1536 px - wide desktops, ultra-wide monitors */
  '2xl': 1536,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of all breakpoint keys */
export type BreakpointKey = keyof typeof breakpoints;

/** Union of all breakpoint pixel values */
export type BreakpointValue = (typeof breakpoints)[BreakpointKey];
