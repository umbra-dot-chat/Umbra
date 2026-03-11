import React, { forwardRef, useMemo } from 'react';
import type { StickyProps } from '@coexist/wisp-core/types/Sticky.types';
import { buildStickyStyle } from '@coexist/wisp-core/styles/Sticky.styles';

/**
 * Sticky -- Sticky positioning primitive for the Wisp design system.
 *
 * @remarks
 * Wraps content with `position: sticky`, proper z-index from theme tokens,
 * and configurable edge/offset. Use for headers, toolbars, and navigation
 * that should remain visible on scroll.
 *
 * - Supports `top` and `bottom` sticky edges.
 * - Z-index resolved from the theme z-index scale or a custom numeric value.
 * - Polymorphic via the `as` prop (renders as `div` by default).
 *
 * @module primitives/sticky
 * @example
 * ```tsx
 * <Sticky edge="top" offset={0}>
 *   <Toolbar>...</Toolbar>
 * </Sticky>
 *
 * <Sticky edge="bottom" zIndex="overlay">
 *   <BottomNav>...</BottomNav>
 * </Sticky>
 * ```
 */
export const Sticky = forwardRef<HTMLElement, StickyProps>(function Sticky(
  {
    children,
    as: Component = 'div',
    edge = 'top',
    offset = 0,
    zIndex,
    zIndexValue,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const computedStyle = useMemo(
    () => buildStickyStyle({ edge, offset, zIndex, zIndexValue }),
    [edge, offset, zIndex, zIndexValue],
  );

  const mergedStyle = userStyle ? { ...computedStyle, ...userStyle } : computedStyle;

  return React.createElement(
    Component,
    { ref, style: mergedStyle, ...rest },
    children,
  );
});

Sticky.displayName = 'Sticky';
