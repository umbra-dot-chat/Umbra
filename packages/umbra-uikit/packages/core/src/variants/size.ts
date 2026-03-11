/**
 * @module variants/size
 * @description Size variants for Wisp components.
 *
 * Defines a seven-step size scale (`2xs` through `2xl`) with resolved
 * dimension values for height, font size, padding, icon size, and gap.
 * Components that support the `size` prop should consume these values to
 * maintain visual consistency across the design system.
 */

// ---------------------------------------------------------------------------
// Size enum
// ---------------------------------------------------------------------------

/**
 * Tuple of all supported size variant names, ordered smallest to largest.
 *
 * Use the {@link Size} type (derived from this tuple) for prop typing.
 */
export const sizes = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

/**
 * Union type of all supported size variant names.
 *
 * @example
 * ```ts
 * interface ButtonProps {
 *   size?: Size; // '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * }
 * ```
 */
export type Size = (typeof sizes)[number];

// ---------------------------------------------------------------------------
// Resolved size dimensions
// ---------------------------------------------------------------------------

/**
 * Dimension values resolved for a single {@link Size} step.
 *
 * All values are in logical pixels (dp on mobile, px on web).
 */
export interface SizeDimensions {
  /** Total element height. */
  height: number;
  /** Font size for the label / text content. */
  fontSize: number;
  /** Horizontal (inline) padding. */
  paddingX: number;
  /** Vertical (block) padding. */
  paddingY: number;
  /** Size of inline icons. */
  iconSize: number;
  /** Gap between icon and label. */
  gap: number;
}

// ---------------------------------------------------------------------------
// Size configuration map
// ---------------------------------------------------------------------------

/**
 * Lookup table mapping every {@link Size} step to its resolved dimensions.
 *
 * @remarks
 * The scale is designed so that `md` (36 px height, 14 px font) serves as
 * the default for most interactive elements.  Smaller steps (`2xs`, `xs`)
 * are useful for dense data tables and toolbars, while larger steps
 * (`xl`, `2xl`) suit hero sections and prominent CTAs.
 *
 * @example
 * ```ts
 * const { height, fontSize, paddingX } = sizeConfig['md'];
 * // => { height: 36, fontSize: 14, paddingX: 12, ... }
 * ```
 */
export const sizeConfig: Record<Size, SizeDimensions> = {
  /** 24 px height -- ultra-compact for dense UIs. */
  '2xs': {
    height: 24,
    fontSize: 10,
    paddingX: 6,
    paddingY: 2,
    iconSize: 12,
    gap: 4,
  },

  /** 28 px height -- compact controls and inline actions. */
  xs: {
    height: 28,
    fontSize: 12,
    paddingX: 8,
    paddingY: 4,
    iconSize: 14,
    gap: 4,
  },

  /** 32 px height -- small-sized inputs and buttons. */
  sm: {
    height: 32,
    fontSize: 14,
    paddingX: 10,
    paddingY: 6,
    iconSize: 16,
    gap: 6,
  },

  /** 36 px height -- the default / base size for most components. */
  md: {
    height: 36,
    fontSize: 14,
    paddingX: 12,
    paddingY: 8,
    iconSize: 18,
    gap: 8,
  },

  /** 40 px height -- comfortable touch target. */
  lg: {
    height: 40,
    fontSize: 16,
    paddingX: 16,
    paddingY: 10,
    iconSize: 20,
    gap: 8,
  },

  /** 48 px height -- prominent controls. */
  xl: {
    height: 48,
    fontSize: 18,
    paddingX: 20,
    paddingY: 12,
    iconSize: 24,
    gap: 10,
  },

  /** 56 px height -- hero / jumbo controls. */
  '2xl': {
    height: 56,
    fontSize: 20,
    paddingX: 24,
    paddingY: 16,
    iconSize: 28,
    gap: 12,
  },
};
