/**
 * @module primitives/center
 *
 * Style-building utilities for the {@link Center} layout primitive.
 */

import type { CSSStyleObject } from '../types';

// ---------------------------------------------------------------------------
// Build the center container style
// ---------------------------------------------------------------------------

/**
 * Build the inline flex styles for a {@link Center} container.
 *
 * @param inline - When `true`, uses `inline-flex` instead of `flex`.
 * @returns A `CSSStyleObject` object that centres content on both axes.
 */
export function buildCenterStyle(inline: boolean): CSSStyleObject {
  return {
    display: inline ? 'inline-flex' : 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
