/**
 * @module layouts/container
 * @description React Native Container layout primitive for the Wisp design system.
 *
 * Constrains content to a maximum width and optionally centers it horizontally.
 * Key differences from the React DOM version:
 *
 * - Always renders a `<View>` (no polymorphic `as` prop).
 * - Centering uses `alignSelf: 'center'` instead of CSS `margin: 0 auto`.
 * - No `className` prop (RN uses `style` arrays).
 * - `px` padding resolved from a local spacing map.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Available container size presets. */
export type ContainerSize = 'sm' | 'md' | 'lg' | 'xl';

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------

/** Maps each ContainerSize to its maxWidth pixel value. */
const containerSizeMap: Record<ContainerSize, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/** Spacing tokens for horizontal padding. */
const spacingMap: Record<string, number> = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ContainerProps extends Omit<ViewProps, 'style'> {
  /** Content rendered inside the container. */
  children?: React.ReactNode;
  /** Maximum width preset. @default 'lg' */
  size?: ContainerSize;
  /** Center the container horizontally. @default true */
  center?: boolean;
  /** Inline style overrides merged onto the root View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Container -- Constrains content to a max-width and centers it horizontally.
 *
 * @remarks
 * Provides predefined size tiers (`sm`, `md`, `lg`, `xl`) that map to
 * common breakpoint values. When `center` is `true` (default), the
 * container centers itself via `alignSelf: 'center'` with full width
 * up to the max-width constraint.
 */
export const Container = forwardRef<View, ContainerProps>(function Container(
  {
    children,
    size = 'lg',
    center = true,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const containerStyle = useMemo<ViewStyle>(() => {
    const s: ViewStyle = {
      width: '100%',
      maxWidth: containerSizeMap[size],
      paddingHorizontal: spacingMap.lg,
    };

    if (center) {
      s.alignSelf = 'center';
    }

    return s;
  }, [size, center]);

  return (
    <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
      {children}
    </View>
  );
});

Container.displayName = 'Container';
