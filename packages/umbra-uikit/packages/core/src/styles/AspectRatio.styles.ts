/**
 * @module primitives/aspect-ratio
 * @description Style builder functions for the AspectRatio primitive.
 *
 * Implements the classic CSS `padding-bottom` percentage technique to
 * enforce a responsive aspect ratio on any container.
 */

import type { CSSStyleObject } from '../types';

// ---------------------------------------------------------------------------
// Build the outer container style (padding-bottom trick)
// ---------------------------------------------------------------------------

/**
 * Builds the outer container styles that enforce the aspect ratio via
 * a percentage-based `paddingBottom`.
 *
 * @param ratio - The desired width-to-height ratio (e.g. `16 / 9`).
 * @param userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the outer wrapper `<div>`.
 */
export function buildContainerStyle(
  ratio: number,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  return {
    position: 'relative',
    width: '100%',
    paddingBottom: `${(1 / ratio) * 100}%`,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Build the inner absolute-fill style
// ---------------------------------------------------------------------------

/**
 * Builds the inner `<div>` styles that absolutely fill the padded
 * container, giving children a natural `width: 100%` / `height: 100%`
 * coordinate space.
 *
 * @returns CSS properties for the inner absolute-fill `<div>`.
 */
export function buildInnerStyle(): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
}
