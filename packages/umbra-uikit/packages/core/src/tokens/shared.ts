/**
 * @module tokens/shared
 * @description Shared semantic tokens used across ALL Wisp primitives and components.
 *
 * These are the universal enums/types for sizes, weights, colors, and families.
 * Every component that accepts text-related props should import from here
 * rather than defining its own — ensuring kit-wide consistency.
 *
 * @example
 * ```ts
 * import { textSizes, textColors, type TextSize, type TextColor } from '@/tokens/shared';
 * ```
 */

// ---------------------------------------------------------------------------
// Text Size -- 11 steps matching Untitled UI
// ---------------------------------------------------------------------------

/**
 * All available text-size tokens used across Wisp typography primitives.
 *
 * @remarks
 * The scale is split into two tiers:
 * - **Body sizes** (`xs` through `xl`) for running text and UI labels.
 * - **Display sizes** (`display-xs` through `display-2xl`) for headings,
 *   hero text, and other large typographic elements.
 *
 * The values map 1-to-1 with the Untitled UI type scale.
 *
 * @example
 * ```ts
 * import { textSizes } from '@/tokens/shared';
 *
 * textSizes.forEach((size) => console.log(size));
 * // 'xs' | 'sm' | 'md' | ... | 'display-2xl'
 * ```
 */
export const textSizes = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  'display-xs',
  'display-sm',
  'display-md',
  'display-lg',
  'display-xl',
  'display-2xl',
] as const;

/**
 * Union of all valid text-size token strings.
 *
 * @remarks
 * Derived from the {@link textSizes} tuple so that adding a new step
 * automatically widens the type.
 */
export type TextSize = (typeof textSizes)[number];

// ---------------------------------------------------------------------------
// Font Weight -- 4 steps
// ---------------------------------------------------------------------------

/**
 * Ordered tuple of font-weight token names.
 *
 * @remarks
 * Four weights cover the vast majority of UI typography needs.
 * Use {@link fontWeightValues} to resolve a key to its numeric CSS value.
 *
 * @example
 * ```ts
 * import { fontWeightKeys, fontWeightValues } from '@/tokens/shared';
 *
 * const numericWeight = fontWeightValues[fontWeightKeys[2]]; // 600
 * ```
 */
export const fontWeightKeys = ['regular', 'medium', 'semibold', 'bold'] as const;

/**
 * Union of valid font-weight token names.
 *
 * @remarks
 * Derived from the {@link fontWeightKeys} tuple.
 */
export type FontWeightKey = (typeof fontWeightKeys)[number];

/**
 * Maps each {@link FontWeightKey} to its numeric CSS `font-weight` value.
 *
 * | Key        | Value |
 * | ---------- | ----- |
 * | `regular`  | 400   |
 * | `medium`   | 500   |
 * | `semibold` | 600   |
 * | `bold`     | 700   |
 */
export const fontWeightValues: Record<FontWeightKey, number> = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

// ---------------------------------------------------------------------------
// Semantic Color -- 10 variants
// ---------------------------------------------------------------------------

/**
 * Tuple of all semantic color token names available in the Wisp palette.
 *
 * @remarks
 * Semantic colors abstract away raw hex values so that components can
 * reference intent (e.g. `'error'`, `'brand'`) rather than hard-coded colours.
 * Use {@link resolveSemanticColor} to map a token name to the concrete hex
 * value provided by the active theme.
 *
 * @example
 * ```ts
 * import { semanticColors } from '@/tokens/shared';
 *
 * // Iterate for a color-picker component
 * semanticColors.map((name) => ({ label: name }));
 * ```
 */
export const semanticColors = [
  'primary',
  'secondary',
  'tertiary',
  'disabled',
  'white',
  'inverse',
  'inherit',
  'error',
  'danger',
  'warning',
  'success',
  'info',
  'brand',
] as const;

/**
 * Union of all valid semantic color token strings.
 *
 * @remarks
 * Derived from the {@link semanticColors} tuple.
 */
export type SemanticColor = (typeof semanticColors)[number];

// ---------------------------------------------------------------------------
// Font Family
// ---------------------------------------------------------------------------

/**
 * Tuple of font-family token names supported by Wisp.
 *
 * @remarks
 * Currently two families are provided:
 * - `'sans'` -- default UI typeface stack.
 * - `'mono'` -- monospaced stack for code and data.
 *
 * Use {@link fontFamilyStacks} to resolve a key to its full CSS
 * `font-family` string.
 */
export const fontFamilyKeys = ['sans', 'mono'] as const;

/**
 * Union of valid font-family token names.
 *
 * @remarks
 * Derived from the {@link fontFamilyKeys} tuple.
 */
export type FontFamilyKey = (typeof fontFamilyKeys)[number];

/**
 * Maps each {@link FontFamilyKey} to a CSS `font-family` stack string.
 *
 * @remarks
 * The stacks are ordered to prefer system fonts for fast rendering, falling
 * back through well-known web-safe alternatives.
 *
 * @example
 * ```ts
 * import { fontFamilyStacks } from '@/tokens/shared';
 *
 * const style = { fontFamily: fontFamilyStacks.sans };
 * ```
 */
export const fontFamilyStacks: Record<FontFamilyKey, string> = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  mono: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", Menlo, Monaco, Consolas, monospace',
};

// ---------------------------------------------------------------------------
// Component Size -- t-shirt sizing for all interactive components
// ---------------------------------------------------------------------------

/**
 * T-shirt size tokens shared by all interactive Wisp components
 * (buttons, inputs, avatars, etc.).
 *
 * @remarks
 * Five steps (`xs` through `xl`) provide sufficient granularity for the
 * majority of layout needs. Components map these tokens to concrete
 * pixel dimensions internally.
 *
 * @example
 * ```tsx
 * import { componentSizes } from '@/tokens/shared';
 *
 * // Render a size-picker for a Storybook control
 * componentSizes.map((size) => <option key={size}>{size}</option>);
 * ```
 */
export const componentSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

/**
 * Union of valid component-size token strings.
 *
 * @remarks
 * Derived from the {@link componentSizes} tuple so that adding or removing
 * a step keeps the union in sync automatically.
 */
export type ComponentSize = (typeof componentSizes)[number];

// ---------------------------------------------------------------------------
// Surface Variant -- solid vs glassmorphism for overlay/floating components
// ---------------------------------------------------------------------------

/**
 * Surface rendering variants for overlay and floating components
 * (Popover, DropdownMenu, Dialog, Sheet, Tooltip, Toast).
 *
 * @remarks
 * - `'solid'` -- default opaque background using the theme's raised surface color.
 * - `'glass'` -- frosted-glass (glassmorphism) effect with a translucent
 *   background, backdrop blur, and a subtle border. Because Wisp raised
 *   surfaces are dark in both light and dark modes, the glass values are
 *   identical across themes.
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger><button>Open</button></PopoverTrigger>
 *   <PopoverContent variant="glass">Frosted content</PopoverContent>
 * </Popover>
 * ```
 */
export const surfaceVariants = ['solid', 'glass'] as const;

/**
 * Union of valid surface variant token strings.
 *
 * @remarks
 * Derived from the {@link surfaceVariants} tuple.
 */
export type SurfaceVariant = (typeof surfaceVariants)[number];

/**
 * CSS properties that produce the frosted-glass / glassmorphism effect.
 *
 * @remarks
 * Intended for use in style builder functions. When `variant` is `'glass'`,
 * spread these properties into the component's computed style object,
 * overriding `backgroundColor` and `border`.
 *
 * The values are consistent across light and dark modes because Wisp raised
 * surfaces are always dark.
 */
export const glassStyle = {
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  backgroundColor: 'rgba(10, 10, 10, 0.72)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
} as const;

// ---------------------------------------------------------------------------
// Shared color resolver -- maps semantic color names to theme hex values
// ---------------------------------------------------------------------------

import type { ThemeColors } from '../theme/types';

/**
 * Resolves a {@link SemanticColor} token (or arbitrary color string) to a
 * concrete hex value using the active theme palette.
 *
 * @remarks
 * When `color` matches one of the known {@link SemanticColor} names the
 * corresponding value is looked up from `themeColors`. Any other string
 * (e.g. a raw hex like `'#FF0000'`) is returned verbatim, enabling a
 * convenient "pass-through" pattern for one-off overrides.
 *
 * @param color - A semantic token name or raw CSS color string.
 * @param themeColors - The resolved {@link ThemeColors} from the current theme.
 * @returns The resolved hex (or raw) color string.
 *
 * @example
 * ```ts
 * import { resolveSemanticColor } from '@/tokens/shared';
 *
 * const hex = resolveSemanticColor('brand', themeColors);
 * // => e.g. '#6366F1'
 *
 * const raw = resolveSemanticColor('#FF0000', themeColors);
 * // => '#FF0000' (passthrough)
 * ```
 */
export function resolveSemanticColor(color: SemanticColor | string, themeColors: ThemeColors): string {
  switch (color) {
    case 'primary':   return themeColors.text.primary;
    case 'secondary': return themeColors.text.secondary;
    case 'tertiary':  return themeColors.text.muted;
    case 'disabled':  return themeColors.border.strong; // dimmed gray
    case 'white':     return '#FFFFFF';
    case 'inverse':   return themeColors.text.inverse;
    case 'inherit':   return 'inherit';
    case 'error':     return themeColors.status.danger;
    case 'danger':    return themeColors.status.danger;
    case 'warning':   return themeColors.status.warning;
    case 'success':   return themeColors.status.success;
    case 'info':      return themeColors.status.info;
    case 'brand':     return themeColors.accent.primary;
    default:          return color; // raw hex passthrough
  }
}

// ---------------------------------------------------------------------------
// Thickness -- for progress bars, circular progress, dividers, etc.
// ---------------------------------------------------------------------------

/**
 * Tuple of thickness token names used by stroke-based Wisp components
 * such as progress bars, circular spinners, and dividers.
 *
 * @remarks
 * Five steps range from a barely-visible hairline (`thin`) to a heavy
 * decorative stroke (`heavy`). Use {@link thicknessValues} to resolve a
 * token name to its pixel value.
 */
export const thicknesses = ['thin', 'regular', 'medium', 'thick', 'heavy'] as const;

/**
 * Union of valid thickness token strings.
 *
 * @remarks
 * Derived from the {@link thicknesses} tuple.
 */
export type Thickness = (typeof thicknesses)[number];

/**
 * Maps each {@link Thickness} token to its pixel value.
 *
 * | Key       | Value (px) |
 * | --------- | ---------- |
 * | `thin`    | 2          |
 * | `regular` | 4          |
 * | `medium`  | 6          |
 * | `thick`   | 8          |
 * | `heavy`   | 12         |
 *
 * @example
 * ```ts
 * import { thicknessValues } from '@/tokens/shared';
 *
 * const strokeWidth = thicknessValues.medium; // 6
 * ```
 */
export const thicknessValues: Record<Thickness, number> = {
  thin: 2,
  regular: 4,
  medium: 6,
  thick: 8,
  heavy: 12,
};
