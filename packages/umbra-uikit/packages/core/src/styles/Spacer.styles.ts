/**
 * @module primitives/spacer
 *
 * Style-building utilities for the {@link Spacer} layout primitive.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeSpacing } from '../theme/types';
import type { SpacerSize } from '../types/Spacer.types';

// ---------------------------------------------------------------------------
// Style builder
// ---------------------------------------------------------------------------

/**
 * Build the inline style for a {@link Spacer} element.
 *
 * @remarks
 * Resolution order:
 * 1. If `flex` is truthy, produce a flex-grow style and ignore `size`.
 * 2. If `size` is provided, set fixed `width` and `height` from the theme.
 * 3. Otherwise fall back to a zero-size (invisible) spacer.
 *
 * @param opts - Configuration containing the spacer props and the resolved theme spacing scale.
 * @param opts.size - Theme spacing token key (used for fixed-size spacers).
 * @param opts.flex - Flex grow factor (`true` maps to `1`, a number maps to that value).
 * @param opts.spacing - The resolved {@link ThemeSpacing} scale from the current theme.
 * @returns A `CSSStyleObject` object ready for the root `<div>`.
 */
export function buildSpacerStyle(opts: {
  size?: SpacerSize;
  flex?: number | boolean;
  spacing: ThemeSpacing;
}): CSSStyleObject {
  const { size, flex, spacing } = opts;

  // Flex takes precedence when both are provided.
  if (flex != null && flex !== false) {
    const flexValue = flex === true ? 1 : flex;
    return {
      flex: flexValue,
      flexShrink: 0,
    };
  }

  // Fixed-size spacer: set both width and height so the spacer behaves
  // correctly inside both row and column flex parents.
  if (size != null) {
    const px = spacing[size];
    return {
      width: px,
      height: px,
      flexShrink: 0,
    };
  }

  // Fallback — zero-size spacer (effectively invisible).
  return {
    width: 0,
    height: 0,
    flexShrink: 0,
  };
}
