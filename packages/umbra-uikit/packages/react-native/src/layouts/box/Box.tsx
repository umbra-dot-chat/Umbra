/**
 * @module layouts/box
 * @description React Native Box layout primitive for the Wisp design system.
 *
 * A generic `View` wrapper with theme-aware spacing and sizing props.
 * Key differences from the React DOM version:
 *
 * - Always renders a `<View>` (no polymorphic `as` prop).
 * - No `display` or `position` shorthand props (use `style` directly).
 * - No `className` prop (RN uses `style` arrays).
 * - Spacing tokens are resolved from a local map rather than `defaultSpacing`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Spacing & radius maps
// ---------------------------------------------------------------------------

/** Spacing token key. */
export type SpacingToken = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

const spacingMap: Record<SpacingToken, number> = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

/** Border radius token key. */
export type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

const radiusMap: Record<RadiusToken, number> = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BoxProps extends Omit<ViewProps, 'style'> {
  /** Content rendered inside the box. */
  children?: React.ReactNode;
  /** Padding on all sides. */
  p?: SpacingToken | number;
  /** Horizontal padding. */
  px?: SpacingToken | number;
  /** Vertical padding. */
  py?: SpacingToken | number;
  /** Padding top. */
  pt?: SpacingToken | number;
  /** Padding right. */
  pr?: SpacingToken | number;
  /** Padding bottom. */
  pb?: SpacingToken | number;
  /** Padding left. */
  pl?: SpacingToken | number;
  /** Width of the box. */
  width?: number | string;
  /** Height of the box. */
  height?: number | string;
  /** Minimum width. */
  minWidth?: number | string;
  /** Maximum width. */
  maxWidth?: number | string;
  /** Minimum height. */
  minHeight?: number | string;
  /** Maximum height. */
  maxHeight?: number | string;
  /** Border radius token or number. */
  radius?: RadiusToken | number;
  /** Inline style overrides merged onto the root View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveSpacing(value: SpacingToken | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return spacingMap[value];
}

function resolveRadius(value: RadiusToken | number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return value;
  return radiusMap[value];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Box -- The foundational layout primitive for the Wisp design system (RN).
 *
 * @remarks
 * A generic `View` wrapper that provides theme-aware spacing (padding),
 * border-radius, and sizing through dedicated props instead of inline styles.
 *
 * Padding resolution order: specific > axis > shorthand
 * (`pt` overrides `py` which overrides `p`).
 */
export const Box = forwardRef<View, BoxProps>(function Box(
  {
    children,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    radius,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const computedStyle = useMemo<ViewStyle>(() => {
    const pAll = resolveSpacing(p);
    const pX = resolveSpacing(px);
    const pY = resolveSpacing(py);

    const s: ViewStyle = {};

    // Padding: specific > axis > shorthand
    const paddingTop = resolveSpacing(pt) ?? pY ?? pAll;
    const paddingRight = resolveSpacing(pr) ?? pX ?? pAll;
    const paddingBottom = resolveSpacing(pb) ?? pY ?? pAll;
    const paddingLeft = resolveSpacing(pl) ?? pX ?? pAll;

    if (paddingTop !== undefined) s.paddingTop = paddingTop;
    if (paddingRight !== undefined) s.paddingRight = paddingRight;
    if (paddingBottom !== undefined) s.paddingBottom = paddingBottom;
    if (paddingLeft !== undefined) s.paddingLeft = paddingLeft;

    // Sizing
    if (width !== undefined) s.width = width as number;
    if (height !== undefined) s.height = height as number;
    if (minWidth !== undefined) s.minWidth = minWidth as number;
    if (maxWidth !== undefined) s.maxWidth = maxWidth as number;
    if (minHeight !== undefined) s.minHeight = minHeight as number;
    if (maxHeight !== undefined) s.maxHeight = maxHeight as number;

    // Border radius
    const resolvedRadius = resolveRadius(radius);
    if (resolvedRadius !== undefined) {
      s.borderRadius = resolvedRadius;
      s.overflow = 'hidden';
    }

    return s;
  }, [p, px, py, pt, pr, pb, pl, width, height, minWidth, maxWidth, minHeight, maxHeight, radius]);

  return (
    <View ref={ref} style={[computedStyle, userStyle]} {...rest}>
      {children}
    </View>
  );
});

Box.displayName = 'Box';
