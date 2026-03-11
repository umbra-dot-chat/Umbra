/**
 * @module primitives/color-swatch
 * @description React Native ColorSwatch primitive for the Wisp design system.
 *
 * Reuses size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<View>` instead of `<div>`.
 * - Shape resolved via numeric `borderRadius` instead of CSS `50%`.
 * - No checkerboard mode (CSS `repeating-conic-gradient` unavailable in RN).
 * - No `className` or CSS `inset` / `z-index` overlay.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import type {
  ColorSwatchSize,
  ColorSwatchShape,
  ColorSwatchSizeConfig,
} from '@coexist/wisp-core/types/ColorSwatch.types';
import { colorSwatchSizeMap } from '@coexist/wisp-core/types/ColorSwatch.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ColorSwatchProps extends Omit<ViewProps, 'children'> {
  /** The colour to display. Any valid colour string (hex, rgb, etc.). */
  color: string;

  /**
   * Size variant.
   * @default 'md'
   */
  size?: ColorSwatchSize;

  /**
   * Shape of the swatch.
   * @default 'circle'
   */
  shape?: ColorSwatchShape;

  /**
   * Show a border around the swatch for contrast.
   * @default true
   */
  bordered?: boolean;

  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a numeric `borderRadius` from the given shape and size config.
 *
 * @param shape - The swatch shape (`'circle'`, `'square'`, or `'rounded'`).
 * @param sizeConfig - Pixel dimensions for the chosen size preset.
 * @returns A numeric border radius in pixels.
 */
function resolveBorderRadius(
  shape: ColorSwatchShape,
  sizeConfig: ColorSwatchSizeConfig,
  radii: import('@coexist/wisp-core/theme/types').ThemeRadii,
): number {
  switch (shape) {
    case 'circle':
      return sizeConfig.size / 2;
    case 'square':
      return 0;
    case 'rounded':
      return radii[sizeConfig.borderRadius];
    default:
      return sizeConfig.size / 2;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ColorSwatch -- Displays a color sample for the Wisp design system.
 *
 * @remarks
 * Renders a small colored box or circle to preview a colour value.
 * Key features:
 * - Four size presets (`sm`, `md`, `lg`, `xl`) and three shapes (`circle`, `square`, `rounded`).
 * - Optional border for contrast against matching backgrounds.
 * - Forwards a ref to the outer `<View>` wrapper.
 *
 * @example
 * ```tsx
 * <ColorSwatch color="#3B82F6" />
 * <ColorSwatch color="#10B981" size="lg" shape="rounded" />
 * <ColorSwatch color="#EF4444" size="xl" shape="square" bordered={false} />
 * ```
 */
export const ColorSwatch = forwardRef<View, ColorSwatchProps>(function ColorSwatch(
  {
    color,
    size = 'md',
    shape = 'circle',
    bordered = true,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig: ColorSwatchSizeConfig = colorSwatchSizeMap[size];

  const swatchStyle = useMemo<ViewStyle>(() => ({
    width: sizeConfig.size,
    height: sizeConfig.size,
    borderRadius: resolveBorderRadius(shape, sizeConfig, theme.radii),
    backgroundColor: color,
    borderWidth: bordered ? 1 : 0,
    borderColor: bordered ? themeColors.border.subtle : 'transparent',
    flexShrink: 0,
    overflow: 'hidden',
  }), [sizeConfig, shape, color, bordered, themeColors]);

  return (
    <View
      ref={ref}
      style={[swatchStyle, userStyle]}
      {...rest}
    />
  );
});

ColorSwatch.displayName = 'ColorSwatch';
