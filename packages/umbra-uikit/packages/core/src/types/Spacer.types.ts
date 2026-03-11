/**
 * @module primitives/spacer
 *
 * Type definitions for the Wisp {@link Spacer} layout primitive.
 *
 * @remarks
 * Spacer creates deliberate whitespace -- either fixed-size (using theme
 * spacing tokens) or flexible (`flex-grow`) -- to separate sibling elements
 * in a layout.
 */

import type React from 'react';
import type { ThemeSpacing } from '../theme/types';

// ---------------------------------------------------------------------------
// Size — keyed to ThemeSpacing
// ---------------------------------------------------------------------------

/**
 * A spacing token key from the theme's spacing scale.
 *
 * @remarks
 * Derived from {@link ThemeSpacing} so it stays in sync with the theme.
 */
export type SpacerSize = keyof ThemeSpacing;

/**
 * Ordered tuple of every valid {@link SpacerSize}, useful for Storybook controls.
 *
 * @remarks
 * Mirrors the keys of {@link ThemeSpacing} in ascending size order.
 */
export const spacerSizes = [
  'none',
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Spacer} layout primitive.
 *
 * @remarks
 * Exactly one of `size` or `flex` should typically be provided. When both
 * are present, `flex` takes precedence.
 */
export interface SpacerProps {
  /**
   * Fixed size using a theme spacing token.
   *
   * @remarks
   * Sets both `width` and `height` to the resolved pixel value so the spacer
   * works correctly inside both row and column flex containers.
   */
  size?: SpacerSize;

  /**
   * Flexible spacer that grows to fill available space.
   *
   * @remarks
   * - `true` is equivalent to `flex: 1`.
   * - A number sets `flex` to that value (e.g. `2` produces `flex: 2`).
   *
   * When both {@link SpacerProps.size | size} and `flex` are provided,
   * `flex` takes precedence.
   *
   * @default false
   */
  flex?: number | boolean;

  /** Additional inline styles merged onto the root `<div>` element. */
  style?: React.CSSProperties;
}
