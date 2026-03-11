/**
 * @module primitives/box
 *
 * Style-building utilities for the {@link Box} layout primitive.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeSpacing, ThemeRadii } from '../theme/types';
import type { ThemeSpacingKey, ThemeRadiiKey, BoxDisplay, BoxPosition } from '../types/Box.types';

// ---------------------------------------------------------------------------
// Sizing helper
// ---------------------------------------------------------------------------

/**
 * Normalise a dimension value so it can be used as a CSS property.
 *
 * @param value - A numeric pixel value or a raw CSS string (`%`, `vw`, `auto`, etc.).
 * @returns The normalised string, or `undefined` when `value` is `undefined`.
 */
function normaliseDimension(value: string | number | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

// ---------------------------------------------------------------------------
// buildBoxStyle
// ---------------------------------------------------------------------------

/**
 * Resolve {@link BoxProps} spacing, sizing, display, position, and radius
 * values into a plain `CSSStyleObject` object.
 *
 * @remarks
 * **Padding resolution order** (most specific wins):
 *   `pt` / `pr` / `pb` / `pl`  \>  `px` / `py`  \>  `p`
 *
 * @param opts - An object containing theme scales and the individual Box props.
 * @returns A `CSSStyleObject` object ready to be applied to the root element.
 */
export function buildBoxStyle(opts: {
  // Spacing scale from the theme
  spacing: ThemeSpacing;
  // Radii scale from the theme
  radii: ThemeRadii;

  // Padding props
  p?: ThemeSpacingKey;
  px?: ThemeSpacingKey;
  py?: ThemeSpacingKey;
  pt?: ThemeSpacingKey;
  pr?: ThemeSpacingKey;
  pb?: ThemeSpacingKey;
  pl?: ThemeSpacingKey;

  // Display & position
  display?: BoxDisplay;
  position?: BoxPosition;

  // Sizing
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;

  // Radius
  radius?: ThemeRadiiKey;
}): CSSStyleObject {
  const { spacing, radii } = opts;
  const style: CSSStyleObject = {};

  // -- Padding --------------------------------------------------------------
  // Resolution: specific > axis > shorthand

  const pTop = opts.pt ?? opts.py ?? opts.p;
  const pRight = opts.pr ?? opts.px ?? opts.p;
  const pBottom = opts.pb ?? opts.py ?? opts.p;
  const pLeft = opts.pl ?? opts.px ?? opts.p;

  if (pTop !== undefined) style.paddingTop = spacing[pTop];
  if (pRight !== undefined) style.paddingRight = spacing[pRight];
  if (pBottom !== undefined) style.paddingBottom = spacing[pBottom];
  if (pLeft !== undefined) style.paddingLeft = spacing[pLeft];

  // -- Display & position ---------------------------------------------------

  if (opts.display !== undefined) style.display = opts.display;
  if (opts.position !== undefined) style.position = opts.position;

  // -- Sizing ---------------------------------------------------------------

  const w = normaliseDimension(opts.width);
  const h = normaliseDimension(opts.height);
  const minW = normaliseDimension(opts.minWidth);
  const maxW = normaliseDimension(opts.maxWidth);
  const minH = normaliseDimension(opts.minHeight);
  const maxH = normaliseDimension(opts.maxHeight);

  if (w !== undefined) style.width = w;
  if (h !== undefined) style.height = h;
  if (minW !== undefined) style.minWidth = minW;
  if (maxW !== undefined) style.maxWidth = maxW;
  if (minH !== undefined) style.minHeight = minH;
  if (maxH !== undefined) style.maxHeight = maxH;

  // -- Border radius --------------------------------------------------------

  if (opts.radius !== undefined) style.borderRadius = radii[opts.radius];

  return style;
}
