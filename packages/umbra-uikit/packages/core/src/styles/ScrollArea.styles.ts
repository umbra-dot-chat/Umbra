/**
 * Style builders for the {@link ScrollArea} component.
 *
 * @module primitives/scroll-area
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { ScrollAreaDirection, ScrollbarWidth } from '../types/ScrollArea.types';

// ---------------------------------------------------------------------------
// Overflow resolution
// ---------------------------------------------------------------------------

/**
 * Resolve overflow-x / overflow-y values based on the scroll direction.
 *
 * @param direction - The scroll axis configuration (`'vertical'`, `'horizontal'`, or `'both'`).
 * @returns An object with `overflowX` and `overflowY` CSS values.
 */
function resolveOverflow(direction: ScrollAreaDirection): {
  overflowX: CSSStyleObject['overflowX'];
  overflowY: CSSStyleObject['overflowY'];
} {
  switch (direction) {
    case 'vertical':
      return { overflowX: 'hidden', overflowY: 'auto' };
    case 'horizontal':
      return { overflowX: 'auto', overflowY: 'hidden' };
    case 'both':
      return { overflowX: 'auto', overflowY: 'auto' };
    default:
      return { overflowX: 'hidden', overflowY: 'auto' };
  }
}

// ---------------------------------------------------------------------------
// Main style builder
// ---------------------------------------------------------------------------

/**
 * Build the inline `CSSProperties` for a {@link ScrollArea} container.
 *
 * @param opts - Scroll area configuration including direction, scrollbar width,
 *               hide flag, dimension constraints, and theme colors.
 * @returns A `CSSStyleObject` object with overflow, scrollbar, and
 *          dimension properties applied.
 */
export function buildScrollAreaStyle(opts: {
  direction: ScrollAreaDirection;
  scrollbarWidth: ScrollbarWidth;
  hideScrollbar: boolean;
  maxHeight?: string | number;
  maxWidth?: string | number;
  theme: WispTheme;
}): CSSStyleObject {
  const { colors: themeColors } = opts.theme;
  const { direction, scrollbarWidth, hideScrollbar, maxHeight, maxWidth } = opts;
  const overflow = resolveOverflow(direction);

  // scrollbar-color is a standard CSS property: thumb-color track-color
  const scrollbarColor = hideScrollbar
    ? undefined
    : `${themeColors.border.strong} transparent`;

  return {
    position: 'relative',
    ...overflow,
    maxHeight,
    maxWidth,

    // Standard CSS scrollbar properties
    scrollbarWidth: hideScrollbar ? 'none' : scrollbarWidth,
    scrollbarColor,

    // Smooth scrolling
    WebkitOverflowScrolling: 'touch',
  } as CSSStyleObject;
}
