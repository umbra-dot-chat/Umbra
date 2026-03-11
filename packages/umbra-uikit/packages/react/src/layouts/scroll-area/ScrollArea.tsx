import React, { forwardRef, useMemo } from 'react';
import type { ScrollAreaProps } from '@coexist/wisp-core/types/ScrollArea.types';
import { buildScrollAreaStyle } from '@coexist/wisp-core/styles/ScrollArea.styles';
import { useTheme } from '../../providers';

/**
 * ScrollArea -- A styled scrollable container with theme-aware scrollbar colors.
 *
 * @remarks
 * Uses the CSS standard `scrollbar-width` and `scrollbar-color` properties
 * for styling, ensuring consistent appearance across modern browsers.
 * Supports vertical, horizontal, or bidirectional scrolling via the
 * {@link ScrollAreaProps.direction | direction} prop.
 *
 * Key features:
 * - Theme-aware scrollbar track and thumb colors via {@link ThemeColors}
 * - Configurable scrollbar width (`thin`, `auto`, `none`)
 * - Optional scrollbar hiding while preserving scroll behavior
 * - Constrained dimensions with `maxHeight` / `maxWidth`
 * - Smooth iOS momentum scrolling (`-webkit-overflow-scrolling: touch`)
 *
 * @module primitives/scroll-area
 * @example
 * ```tsx
 * <ScrollArea maxHeight={400}>
 *   <LongContent />
 * </ScrollArea>
 * ```
 *
 * @example Horizontal scrolling
 * ```tsx
 * <ScrollArea direction="horizontal" maxWidth={600}>
 *   <WideTable />
 * </ScrollArea>
 * ```
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  {
    children,
    direction = 'vertical',
    hideScrollbar = false,
    scrollbarWidth = 'thin',
    maxHeight,
    maxWidth,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const scrollStyle = useMemo(
    () => buildScrollAreaStyle({
      direction,
      scrollbarWidth,
      hideScrollbar,
      maxHeight,
      maxWidth,
      theme,
    }),
    [direction, scrollbarWidth, hideScrollbar, maxHeight, maxWidth, theme],
  );

  const mergedStyle = useMemo(
    () => ({ ...scrollStyle, ...userStyle }),
    [scrollStyle, userStyle],
  );

  return (
    <div ref={ref} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
});

ScrollArea.displayName = 'ScrollArea';
