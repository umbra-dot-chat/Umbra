import type { ThemeRadii } from '../theme/types';
import type React from 'react';

// ---------------------------------------------------------------------------
// Swatch Sizes
// ---------------------------------------------------------------------------

/** Available ColorSwatch size presets. */
export const colorSwatchSizes = ['sm', 'md', 'lg', 'xl'] as const;

/** Union of allowed ColorSwatch size values. */
export type ColorSwatchSize = (typeof colorSwatchSizes)[number];

// ---------------------------------------------------------------------------
// Swatch Shapes
// ---------------------------------------------------------------------------

/** Available ColorSwatch shape options. */
export const colorSwatchShapes = ['circle', 'square', 'rounded'] as const;

/** Union of allowed ColorSwatch shape values. */
export type ColorSwatchShape = (typeof colorSwatchShapes)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Pixel-level dimension configuration for a single {@link ColorSwatchSize} preset.
 */
export interface ColorSwatchSizeConfig {
  /** Width and height of the swatch in pixels. */
  size: number;
  /** Border radius applied when {@link ColorSwatchShape} is `'rounded'`, in pixels. */
  borderRadius: keyof ThemeRadii;
}

/**
 * Maps each {@link ColorSwatchSize} to its corresponding {@link ColorSwatchSizeConfig}.
 */
export const colorSwatchSizeMap: Record<ColorSwatchSize, ColorSwatchSizeConfig> = {
  sm: { size: 16, borderRadius: 'sm' },
  md: { size: 24, borderRadius: 'sm' },
  lg: { size: 32, borderRadius: 'md' },
  xl: { size: 48, borderRadius: 'md' } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ColorSwatch} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so any standard `div` prop
 * (e.g. `data-*`, event handlers) is also accepted.
 */
export interface ColorSwatchProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The colour to display. Any valid CSS colour string (hex, rgb, hsl, etc.). */
  color: string;
  /** Size variant. @default 'md' */
  size?: ColorSwatchSize;
  /** Shape of the swatch. @default 'circle' */
  shape?: ColorSwatchShape;
  /** Show a border around the swatch for contrast. @default true */
  bordered?: boolean;
  /** Show a checkered transparency pattern behind the colour. @default false */
  checkerboard?: boolean;
}
