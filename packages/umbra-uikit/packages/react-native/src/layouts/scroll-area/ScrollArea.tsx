/**
 * @module layouts/scroll-area
 * @description React Native ScrollArea layout primitive for the Wisp design system.
 *
 * A wrapper around `ScrollView` with simplified direction and dimension props.
 * Key differences from the React DOM version:
 *
 * - Uses `<ScrollView>` instead of a styled `<div>` with CSS overflow.
 * - No custom scrollbar styling (RN scrollbar customisation is limited).
 * - No `hideScrollbar` / `scrollbarWidth` props -- use
 *   `showsVerticalScrollIndicator` / `showsHorizontalScrollIndicator` instead.
 * - No `className` prop (RN uses `style` arrays).
 */

import React, { forwardRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import type { ScrollViewProps, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Scroll direction for the ScrollArea. */
export type ScrollAreaDirection = 'vertical' | 'horizontal' | 'both';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ScrollAreaProps extends Omit<ScrollViewProps, 'style' | 'horizontal'> {
  /** Content rendered inside the scroll area. */
  children?: React.ReactNode;
  /** Scroll direction. @default 'vertical' */
  direction?: ScrollAreaDirection;
  /** Maximum height constraint. */
  maxHeight?: number;
  /** Maximum width constraint. */
  maxWidth?: number;
  /** Inline style overrides merged onto the ScrollView content container. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ScrollArea -- A scrollable container wrapping React Native's `ScrollView`.
 *
 * @remarks
 * Simplifies `ScrollView` usage by exposing a `direction` prop that
 * automatically sets the `horizontal` flag and enables bidirectional
 * scrolling when `direction="both"`.
 */
export const ScrollArea = forwardRef<ScrollView, ScrollAreaProps>(function ScrollArea(
  {
    children,
    direction = 'vertical',
    maxHeight,
    maxWidth,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const isHorizontal = direction === 'horizontal' || direction === 'both';

  const containerStyle = useMemo<ViewStyle>(() => {
    const s: ViewStyle = {};
    if (maxHeight !== undefined) s.maxHeight = maxHeight;
    if (maxWidth !== undefined) s.maxWidth = maxWidth;
    return s;
  }, [maxHeight, maxWidth]);

  return (
    <ScrollView
      ref={ref}
      horizontal={direction === 'horizontal'}
      showsVerticalScrollIndicator={direction !== 'horizontal'}
      showsHorizontalScrollIndicator={isHorizontal}
      style={[containerStyle, userStyle]}
      {...rest}
    >
      {children}
    </ScrollView>
  );
});

ScrollArea.displayName = 'ScrollArea';
