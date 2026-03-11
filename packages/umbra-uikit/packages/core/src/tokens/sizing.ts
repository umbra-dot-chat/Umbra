/**
 * @module sizing
 * @description Component and icon sizing tokens for the Wisp UI kit.
 *
 * Provides standardised height values for interactive components (buttons,
 * inputs, chips) and a matching scale for icon dimensions. Using these
 * tokens guarantees that icons, text, and controls align on a consistent
 * vertical rhythm.
 *
 * @example
 * ```tsx
 * import { componentHeights, iconSizes } from '@/tokens';
 *
 * <Pressable style={{ height: componentHeights.md }}>
 *   <Icon size={iconSizes.md} name="check" />
 *   <Text>Confirm</Text>
 * </Pressable>
 * ```
 */

// ---------------------------------------------------------------------------
// Component heights
// ---------------------------------------------------------------------------

/**
 * Standard heights for interactive components (buttons, inputs, chips, etc.).
 *
 * | Token | px | Typical use                        |
 * |-------|----|------------------------------------|
 * | 2xs   | 24 | Inline tags, micro buttons         |
 * | xs    | 28 | Small chips, compact controls       |
 * | sm    | 32 | Compact buttons, small inputs      |
 * | md    | 36 | Default buttons, inputs            |
 * | lg    | 40 | Comfortable buttons, search bars   |
 * | xl    | 48 | Large CTAs, prominent inputs       |
 * | 2xl   | 56 | Hero buttons, feature inputs       |
 *
 * @example
 * ```ts
 * componentHeights['2xs'] // 24
 * componentHeights.md     // 36
 * componentHeights['2xl'] // 56
 * ```
 */
export const componentHeights = {
  /** 24 px - inline tags, micro buttons */
  '2xs': 24,
  /** 28 px - small chips, compact controls */
  xs: 28,
  /** 32 px - compact buttons, small inputs */
  sm: 32,
  /** 36 px - default buttons, inputs */
  md: 36,
  /** 40 px - comfortable buttons, search bars */
  lg: 40,
  /** 48 px - large CTAs, prominent inputs */
  xl: 48,
  /** 56 px - hero buttons, feature inputs */
  '2xl': 56,
} as const;

// ---------------------------------------------------------------------------
// Icon sizes
// ---------------------------------------------------------------------------

/**
 * Standard widths & heights for icon elements.
 *
 * Icons are always rendered as squares (equal width and height).
 *
 * | Token | px | Typical use                        |
 * |-------|----|------------------------------------|
 * | 2xs   | 12 | Inline indicators, status dots     |
 * | xs    | 14 | Compact labels, badge icons        |
 * | sm    | 16 | Small buttons, input adornments    |
 * | md    | 20 | Default icon size                  |
 * | lg    | 24 | Navigation icons, list icons       |
 * | xl    | 32 | Feature icons, empty states        |
 * | 2xl   | 40 | Hero icons, illustration elements  |
 *
 * @example
 * ```ts
 * iconSizes.sm    // 16
 * iconSizes.md    // 20
 * iconSizes['2xl'] // 40
 * ```
 */
export const iconSizes = {
  /** 12 px - inline indicators, status dots */
  '2xs': 12,
  /** 14 px - compact labels, badge icons */
  xs: 14,
  /** 16 px - small buttons, input adornments */
  sm: 16,
  /** 20 px - default icon size */
  md: 20,
  /** 24 px - navigation icons, list icons */
  lg: 24,
  /** 32 px - feature icons, empty states */
  xl: 32,
  /** 40 px - hero icons, illustration elements */
  '2xl': 40,
} as const;

// ---------------------------------------------------------------------------
// Aggregate export
// ---------------------------------------------------------------------------

/**
 * Complete sizing system for the Wisp UI kit.
 *
 * @example
 * ```ts
 * import { sizing } from '@/tokens';
 *
 * sizing.componentHeights.md  // 36
 * sizing.iconSizes.lg         // 24
 * ```
 */
export const sizing = {
  componentHeights,
  iconSizes,
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Union of component height keys */
export type ComponentHeightKey = keyof typeof componentHeights;

/** Union of component height pixel values */
export type ComponentHeightValue = (typeof componentHeights)[ComponentHeightKey];

/** Union of icon size keys */
export type IconSizeKey = keyof typeof iconSizes;

/** Union of icon size pixel values */
export type IconSizeValue = (typeof iconSizes)[IconSizeKey];
