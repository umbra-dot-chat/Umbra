/**
 * @module layouts/stack
 * @description React Native Stack layout primitive for the Wisp design system.
 *
 * Arranges children in a vertical or horizontal line with consistent spacing.
 * Key differences from the React DOM version:
 *
 * - Uses `<View>` with `flexDirection` instead of CSS `display: flex`.
 * - No polymorphic `as` prop (always renders a `View`).
 * - No `className` prop (RN uses `style` arrays).
 * - Gap is resolved from a local spacing map (RN `gap` supported since RN 0.71).
 * - Divider insertion uses `<View>` instead of `<div>`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Spacing map
// ---------------------------------------------------------------------------

/**
 * Maps spacing token keys to their numeric pixel values.
 * Mirrors the shared spacing scale from `@coexist/wisp-core`.
 */
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
// Types
// ---------------------------------------------------------------------------

/** Flow direction for the stack. */
export type StackDirection = 'vertical' | 'horizontal';

/** Gap value -- either a spacing token key or a raw numeric value. */
export type StackGap = keyof typeof spacingMap | number;

/** Cross-axis alignment options. */
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';

/** Main-axis justification options. */
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StackProps extends Omit<ViewProps, 'style'> {
  /** Content rendered inside the stack. */
  children?: React.ReactNode;
  /** Layout direction. @default 'vertical' */
  direction?: StackDirection;
  /** Spacing between children -- a token key or number. @default 'md' */
  gap?: StackGap;
  /** Cross-axis alignment. @default 'stretch' */
  align?: StackAlign;
  /** Main-axis justification. @default 'start' */
  justify?: StackJustify;
  /** Allow children to wrap to the next line. @default false */
  wrap?: boolean;
  /** Reverse the order of children. @default false */
  reverse?: boolean;
  /** Insert a themed divider line between each child. @default false */
  divider?: boolean;
  /** Inline style overrides merged onto the root View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Alignment / justification mapping
// ---------------------------------------------------------------------------

const alignMap: Record<StackAlign, ViewStyle['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const justifyMap: Record<StackJustify, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a gap prop value to a numeric pixel value.
 */
function resolveGap(gap: StackGap): number {
  if (typeof gap === 'number') return gap;
  return spacingMap[gap] ?? 12;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Stack -- Arranges children in a vertical or horizontal line with
 * consistent spacing.
 *
 * @remarks
 * - Configurable direction via `direction` (`vertical` or `horizontal`).
 * - Theme-aware gap between children via `gap`.
 * - Cross-axis alignment and main-axis justification.
 * - Optional child wrapping and order reversal.
 * - Automatic divider insertion between children when `divider` is enabled.
 *
 * @see {@link HStack} for a horizontal convenience alias.
 * @see {@link VStack} for a vertical convenience alias.
 */
export const Stack = forwardRef<View, StackProps>(function Stack(
  {
    children,
    direction = 'vertical',
    gap = 'md',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    reverse = false,
    divider = false,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const resolvedGap = resolveGap(gap);

  const baseStyle = useMemo<ViewStyle>(() => {
    const isHorizontal = direction === 'horizontal';

    const flexDir = isHorizontal
      ? (reverse ? 'row-reverse' : 'row')
      : (reverse ? 'column-reverse' : 'column');

    return {
      flexDirection: flexDir,
      alignItems: alignMap[align],
      justifyContent: justifyMap[justify],
      gap: divider ? undefined : resolvedGap,
      flexWrap: wrap ? 'wrap' : 'nowrap',
    };
  }, [direction, align, justify, resolvedGap, wrap, reverse, divider]);

  const dividerStyle = useMemo<ViewStyle | undefined>(() => {
    if (!divider) return undefined;
    const isHorizontal = direction === 'horizontal';
    return isHorizontal
      ? {
          width: 1,
          alignSelf: 'stretch',
          backgroundColor: themeColors.border.subtle,
          marginHorizontal: resolvedGap / 2,
        }
      : {
          height: 1,
          alignSelf: 'stretch',
          backgroundColor: themeColors.border.subtle,
          marginVertical: resolvedGap / 2,
        };
  }, [divider, direction, resolvedGap, themeColors.border.subtle]);

  // Filter out bare string/number children that would cause
  // "text node cannot be a child of View" errors on React Native Web.
  const safeChildren = React.Children.toArray(children).filter(
    (child) => child != null && typeof child !== 'string' && typeof child !== 'number',
  );

  // Insert dividers between children when the divider prop is set
  let content: React.ReactNode = safeChildren;
  if (divider && dividerStyle) {
    const childArray = safeChildren;
    const withDividers: React.ReactNode[] = [];

    childArray.forEach((child, i) => {
      withDividers.push(child);
      if (i < childArray.length - 1) {
        withDividers.push(
          <View key={`divider-${i}`} style={dividerStyle} />,
        );
      }
    });

    content = withDividers;
  }

  return (
    <View ref={ref} style={[baseStyle, userStyle]} {...rest}>
      {content}
    </View>
  );
});

Stack.displayName = 'Stack';

// ---------------------------------------------------------------------------
// HStack
// ---------------------------------------------------------------------------

/**
 * HStack -- Convenience alias for a horizontal {@link Stack}.
 *
 * @remarks
 * Renders a {@link Stack} with `direction="horizontal"`. All other
 * {@link StackProps} (except `direction`) are forwarded transparently.
 */
export const HStack = forwardRef<View, Omit<StackProps, 'direction'>>(
  function HStack(props, ref) {
    return <Stack ref={ref} direction="horizontal" {...props} />;
  },
);

HStack.displayName = 'HStack';

// ---------------------------------------------------------------------------
// VStack
// ---------------------------------------------------------------------------

/**
 * VStack -- Convenience alias for a vertical {@link Stack}.
 *
 * @remarks
 * Renders a {@link Stack} with `direction="vertical"`. All other
 * {@link StackProps} (except `direction`) are forwarded transparently.
 */
export const VStack = forwardRef<View, Omit<StackProps, 'direction'>>(
  function VStack(props, ref) {
    return <Stack ref={ref} direction="vertical" {...props} />;
  },
);

VStack.displayName = 'VStack';
