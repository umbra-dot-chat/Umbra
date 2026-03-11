/**
 * @module primitives/stack
 *
 * Style-building utilities for the {@link Stack} layout primitive.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeSpacing } from '../theme/types';
import type { StackDirection, StackAlign, StackJustify, StackGap } from '../types/Stack.types';

// ---------------------------------------------------------------------------
// Alignment → CSS value maps
// ---------------------------------------------------------------------------

/** Maps {@link StackAlign} shorthand values to their CSS `align-items` equivalents. */
const alignMap: Record<StackAlign, CSSStyleObject['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

/** Maps {@link StackJustify} shorthand values to their CSS `justify-content` equivalents. */
const justifyMap: Record<StackJustify, CSSStyleObject['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

// ---------------------------------------------------------------------------
// Main style builder
// ---------------------------------------------------------------------------

/**
 * Build the inline flex styles for a {@link Stack} container.
 *
 * @param opts - Stack layout configuration including direction, gap, alignment, and theme spacing.
 * @returns A `CSSStyleObject` object with `display: flex` and the resolved flex properties.
 */
export function buildStackStyle(opts: {
  direction: StackDirection;
  gap: StackGap;
  align: StackAlign;
  justify: StackJustify;
  wrap: boolean;
  reverse: boolean;
  spacing: ThemeSpacing;
}): CSSStyleObject {
  const { direction, gap, align, justify, wrap, reverse, spacing } = opts;

  const isHorizontal = direction === 'horizontal';
  let flexDirection: CSSStyleObject['flexDirection'] = isHorizontal ? 'row' : 'column';
  if (reverse) {
    flexDirection = isHorizontal ? 'row-reverse' : 'column-reverse';
  }

  return {
    display: 'flex',
    flexDirection,
    gap: spacing[gap],
    alignItems: alignMap[align],
    justifyContent: justifyMap[justify],
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };
}

// ---------------------------------------------------------------------------
// Separator style (for divider mode)
// ---------------------------------------------------------------------------

/**
 * Build the inline styles for a divider element inserted between Stack children.
 *
 * @remarks
 * Produces a horizontal rule (border-top) when the Stack is vertical, and a
 * vertical rule (border-left) when the Stack is horizontal.
 *
 * @param direction - The current {@link StackDirection} of the parent Stack.
 * @param borderColor - Resolved CSS colour string for the divider border.
 * @returns A `CSSStyleObject` object for the divider `<div>`.
 */
export function buildDividerStyle(
  direction: StackDirection,
  borderColor: string,
): CSSStyleObject {
  const isHorizontal = direction === 'horizontal';

  return {
    alignSelf: 'stretch',
    flexShrink: 0,
    border: 'none',
    ...(isHorizontal
      ? {
          width: 1,
          minHeight: '100%',
          borderLeft: `1px solid ${borderColor}`,
        }
      : {
          height: 1,
          minWidth: '100%',
          borderTop: `1px solid ${borderColor}`,
        }),
  };
}
