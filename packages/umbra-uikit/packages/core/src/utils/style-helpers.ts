/**
 * @module utils/style-helpers
 * @description Helper functions that map Wisp variant tokens to concrete
 * style values (colors, dimensions, radii).
 *
 * These are pure functions with no React dependency, making them suitable
 * for use in both component render paths and utility / testing code.
 *
 * @example
 * ```ts
 * import { getAppearanceColors, getSizeValues, getShapeRadius } from '@wisp/utils/style-helpers';
 * import type { ThemeColors } from '@wisp/theme/types';
 *
 * const colors = getAppearanceColors('primary', themeColors);
 * const size = getSizeValues('md');
 * const radius = getShapeRadius('rounded');
 * ```
 */

import type { ThemeColors } from '../theme/types';

// ---------------------------------------------------------------------------
// Variant type definitions
// ---------------------------------------------------------------------------

/**
 * Visual appearance variants for interactive components.
 *
 * | Variant     | Description                              |
 * | ----------- | ---------------------------------------- |
 * | `primary`   | Main call-to-action, filled accent       |
 * | `secondary` | Lower emphasis, subtle background         |
 * | `outline`   | Border only, transparent background       |
 * | `ghost`     | No background or border, text-only        |
 * | `danger`    | Destructive / error action                |
 *
 * @example
 * ```ts
 * const appearance: Appearance = 'primary';
 * ```
 */
export type Appearance = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * T-shirt size scale for component sizing.
 *
 * @example
 * ```ts
 * const size: Size = 'md';
 * ```
 */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Border-radius shape variants.
 *
 * | Variant   | Description                            |
 * | --------- | -------------------------------------- |
 * | `square`  | No border radius (sharp corners)       |
 * | `rounded` | Default moderate radius                |
 * | `pill`    | Fully rounded ends (capsule / pill)    |
 * | `circle`  | Perfect circle (equal width & height)  |
 *
 * @example
 * ```ts
 * const shape: Shape = 'rounded';
 * ```
 */
export type Shape = 'square' | 'rounded' | 'pill' | 'circle';

// ---------------------------------------------------------------------------
// Appearance colors
// ---------------------------------------------------------------------------

/**
 * Resolved color set for a given appearance variant.
 */
export interface AppearanceColors {
  /** Background color for the default state. */
  background: string;
  /** Text / foreground color. */
  text: string;
  /** Border color. */
  border: string;
  /** Background color for the hover state. */
  hoverBackground: string;
}

/**
 * Returns the resolved color set for a given {@link Appearance} variant
 * using the supplied theme color tokens.
 *
 * @param appearance - The visual appearance variant.
 * @param colors - The current theme's semantic color map.
 * @returns An {@link AppearanceColors} object.
 *
 * @example
 * ```ts
 * const colors = getAppearanceColors('primary', theme.colors);
 * // {
 * //   background: '#A78BFA',
 * //   text: '#FFFFFF',
 * //   border: 'transparent',
 * //   hoverBackground: '#B79FFF',
 * // }
 * ```
 *
 * @example
 * ```ts
 * // Danger variant
 * const dangerColors = getAppearanceColors('danger', theme.colors);
 * // Uses status.danger and status.dangerSurface
 * ```
 */
export function getAppearanceColors(
  appearance: Appearance,
  colors: ThemeColors,
): AppearanceColors {
  switch (appearance) {
    case 'primary':
      return {
        background: colors.accent.primary,
        text: colors.text.inverse,
        border: 'transparent',
        hoverBackground: colors.accent.primaryHover,
      };

    case 'secondary':
      return {
        background: colors.background.surface,
        text: colors.text.primary,
        border: colors.border.subtle,
        hoverBackground: colors.background.raised,
      };

    case 'outline':
      return {
        background: 'transparent',
        text: colors.accent.primary,
        border: colors.accent.primary,
        hoverBackground: colors.accent.highlight,
      };

    case 'ghost':
      return {
        background: 'transparent',
        text: colors.text.primary,
        border: 'transparent',
        hoverBackground: colors.background.surface,
      };

    case 'danger':
      return {
        background: colors.status.danger,
        text: colors.text.inverse,
        border: 'transparent',
        hoverBackground: colors.status.dangerSurface,
      };

    default: {
      // Exhaustive check — should never be reached.
      const _exhaustive: never = appearance;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Size values
// ---------------------------------------------------------------------------

/**
 * Resolved dimension set for a given size variant.
 */
export interface SizeValues {
  /** Component height in pixels. */
  height: number;
  /** Font size in pixels. */
  fontSize: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Vertical padding in pixels. */
  paddingY: number;
  /** Icon size (width & height) in pixels. */
  iconSize: number;
  /** Gap between child elements in pixels. */
  gap: number;
}

/**
 * Returns the resolved dimension set for a given {@link Size} variant.
 *
 * All values are in logical pixels (dp on mobile, px on web).
 *
 * @param size - The t-shirt size variant.
 * @returns A {@link SizeValues} object.
 *
 * @example
 * ```ts
 * const { height, fontSize, paddingX } = getSizeValues('md');
 * // { height: 40, fontSize: 14, paddingX: 16, paddingY: 8, iconSize: 18, gap: 8 }
 * ```
 *
 * @example
 * ```ts
 * // Use in a styled component
 * const size = getSizeValues(props.size ?? 'md');
 * const style = {
 *   height: size.height,
 *   paddingLeft: size.paddingX,
 *   paddingRight: size.paddingX,
 *   fontSize: size.fontSize,
 * };
 * ```
 */
export function getSizeValues(size: Size): SizeValues {
  switch (size) {
    case 'xs':
      return {
        height: 24,
        fontSize: 12,
        paddingX: 8,
        paddingY: 4,
        iconSize: 14,
        gap: 4,
      };

    case 'sm':
      return {
        height: 32,
        fontSize: 13,
        paddingX: 12,
        paddingY: 6,
        iconSize: 16,
        gap: 6,
      };

    case 'md':
      return {
        height: 40,
        fontSize: 14,
        paddingX: 16,
        paddingY: 8,
        iconSize: 18,
        gap: 8,
      };

    case 'lg':
      return {
        height: 48,
        fontSize: 16,
        paddingX: 20,
        paddingY: 10,
        iconSize: 20,
        gap: 10,
      };

    case 'xl':
      return {
        height: 56,
        fontSize: 18,
        paddingX: 24,
        paddingY: 12,
        iconSize: 24,
        gap: 12,
      };

    default: {
      const _exhaustive: never = size;
      return _exhaustive;
    }
  }
}

// ---------------------------------------------------------------------------
// Shape radius
// ---------------------------------------------------------------------------

/**
 * Returns the border radius (in pixels) for a given {@link Shape} variant.
 *
 * @param shape - The shape variant.
 * @returns Border radius in pixels.
 *
 * @example
 * ```ts
 * getShapeRadius('square')  // 0
 * getShapeRadius('rounded') // 8
 * getShapeRadius('pill')    // 9999
 * getShapeRadius('circle')  // 9999
 * ```
 *
 * @example
 * ```ts
 * const radius = getShapeRadius(props.shape ?? 'rounded');
 * <View style={{ borderRadius: radius }} />
 * ```
 */
export function getShapeRadius(shape: Shape): number {
  switch (shape) {
    case 'square':
      return 0;
    case 'rounded':
      return 8;
    case 'pill':
      return 9999;
    case 'circle':
      return 9999;
    default: {
      const _exhaustive: never = shape;
      return _exhaustive;
    }
  }
}
