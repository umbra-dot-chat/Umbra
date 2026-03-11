/**
 * @module tokens
 * @description Barrel export for all Wisp UI kit design tokens.
 *
 * Import individual tokens or the aggregate namespace objects depending
 * on your preference.
 *
 * @example
 * ```ts
 * // Named imports (tree-shakeable)
 * import { colors, spacing, radii, shadows } from '@/tokens';
 *
 * // Granular imports
 * import { neutral, brand, success } from '@/tokens';
 * import { fontSizes, fontWeights } from '@/tokens';
 * import { withAlpha, darken } from '@/tokens';
 * ```
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export {
  colors,
  neutral,
  brand,
  brandGradient,
  success,
  warning,
  danger,
  info,
  dataViz,
  type NeutralStep,
  type BrandColor,
  type StatusVariant,
  type DataVizColor,
} from './colors';

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export {
  spacing,
  type SpacingKey,
  type SpacingValue,
} from './spacing';

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export {
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacing,
  type FontFamily,
  type FontSize,
  type FontWeight,
  type LineHeight,
  type LetterSpacing,
} from './typography';

// ---------------------------------------------------------------------------
// Radii
// ---------------------------------------------------------------------------

export {
  radii,
  type RadiiKey,
  type RadiiValue,
} from './radii';

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------

export {
  shadows,
  type ShadowToken,
  type ShadowLevel,
} from './shadows';

// ---------------------------------------------------------------------------
// Borders
// ---------------------------------------------------------------------------

export {
  borderWidths,
  type BorderWidthKey,
  type BorderWidthValue,
} from './borders';

// ---------------------------------------------------------------------------
// Sizing
// ---------------------------------------------------------------------------

export {
  sizing,
  componentHeights,
  iconSizes,
  type ComponentHeightKey,
  type ComponentHeightValue,
  type IconSizeKey,
  type IconSizeValue,
} from './sizing';

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------

export {
  motion,
  durations,
  easings,
  springs,
  type EasingToken,
  type SpringConfig,
  type DurationKey,
  type EasingKey,
  type SpringKey,
} from './motion';

// ---------------------------------------------------------------------------
// Z-Index
// ---------------------------------------------------------------------------

export {
  zIndex,
  type ZIndexKey,
  type ZIndexValue,
} from './z-index';

// ---------------------------------------------------------------------------
// Breakpoints
// ---------------------------------------------------------------------------

export {
  breakpoints,
  type BreakpointKey,
  type BreakpointValue,
} from './breakpoints';

// ---------------------------------------------------------------------------
// Opacity
// ---------------------------------------------------------------------------

export {
  opacity,
  type OpacityKey,
  type OpacityValue,
} from './opacity';

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

export {
  withAlpha,
  lighten,
  darken,
  mixColors,
  hexToRgb,
  rgbToHex,
  type RgbColor,
} from './color-utils';

// ---------------------------------------------------------------------------
// Shared component tokens (universal enums)
// ---------------------------------------------------------------------------

export {
  textSizes,
  fontWeightKeys,
  fontWeightValues,
  semanticColors,
  fontFamilyKeys,
  fontFamilyStacks,
  componentSizes,
  resolveSemanticColor,
  type TextSize,
  type FontWeightKey,
  type SemanticColor,
  type FontFamilyKey,
  type ComponentSize,
} from './shared';
