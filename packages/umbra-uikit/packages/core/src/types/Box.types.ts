/**
 * @module primitives/box
 *
 * Type definitions for the Wisp {@link Box} layout primitive.
 *
 * @remarks
 * Exports theme-key helpers, Storybook control arrays, display/position
 * unions, and the main {@link BoxProps} interface consumed by
 * {@link Box | Box}.
 */

import type React from 'react';
import type { ThemeSpacing, ThemeRadii } from '../theme/types';

// ---------------------------------------------------------------------------
// Theme key types
// ---------------------------------------------------------------------------

/**
 * Union of all spacing scale keys from the Wisp theme.
 *
 * @remarks
 * Derived from {@link ThemeSpacing} so it stays in sync automatically.
 */
export type ThemeSpacingKey = keyof ThemeSpacing;

/**
 * Union of all radii scale keys from the Wisp theme.
 *
 * @remarks
 * Derived from {@link ThemeRadii} so it stays in sync automatically.
 */
export type ThemeRadiiKey = keyof ThemeRadii;

// ---------------------------------------------------------------------------
// Constant arrays for Storybook controls
// ---------------------------------------------------------------------------

/**
 * All spacing keys as a const tuple for Storybook argTypes / controls.
 *
 * @remarks
 * Mirrors the keys of {@link ThemeSpacing} in ascending size order.
 */
export const spacingKeys = [
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

/**
 * All radii keys as a const tuple for Storybook argTypes / controls.
 *
 * @remarks
 * Mirrors the keys of {@link ThemeRadii} in ascending size order.
 */
export const radiiKeys = [
  'none',
  'sm',
  'md',
  'lg',
  'xl',
  'full',
] as const;

// ---------------------------------------------------------------------------
// Display & position value unions
// ---------------------------------------------------------------------------

/** Allowed values for the {@link BoxProps.display} prop. */
export type BoxDisplay = 'block' | 'flex' | 'grid' | 'inline' | 'inline-flex' | 'none';

/** Allowed values for the {@link BoxProps.position} prop. */
export type BoxPosition = 'relative' | 'absolute' | 'fixed' | 'sticky';

// ---------------------------------------------------------------------------
// BoxProps
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Box} layout primitive.
 *
 * @remarks
 * Extends standard HTML element attributes so native props like `className`,
 * `id`, and event handlers are forwarded transparently.
 */
export interface BoxProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Render as a different HTML element or React component.
   * @default 'div'
   */
  as?: React.ElementType;

  // -- Padding (ThemeSpacing keys) ------------------------------------------

  /** Padding on all sides. Overridden by axis and side-specific props. */
  p?: ThemeSpacingKey;
  /** Horizontal padding (left + right). Overridden by `pl` / `pr`. */
  px?: ThemeSpacingKey;
  /** Vertical padding (top + bottom). Overridden by `pt` / `pb`. */
  py?: ThemeSpacingKey;
  /** Padding top. Most specific -- overrides `py` and `p`. */
  pt?: ThemeSpacingKey;
  /** Padding right. Most specific -- overrides `px` and `p`. */
  pr?: ThemeSpacingKey;
  /** Padding bottom. Most specific -- overrides `py` and `p`. */
  pb?: ThemeSpacingKey;
  /** Padding left. Most specific -- overrides `px` and `p`. */
  pl?: ThemeSpacingKey;

  // -- Display & position ---------------------------------------------------

  /** CSS `display` value. */
  display?: BoxDisplay;
  /** CSS `position` value. */
  position?: BoxPosition;

  // -- Sizing ---------------------------------------------------------------

  /** Width. A number is treated as pixels; a string is used as-is. */
  width?: string | number;
  /** Height. A number is treated as pixels; a string is used as-is. */
  height?: string | number;
  /** Minimum width. A number is treated as pixels; a string is used as-is. */
  minWidth?: string | number;
  /** Maximum width. A number is treated as pixels; a string is used as-is. */
  maxWidth?: string | number;
  /** Minimum height. A number is treated as pixels; a string is used as-is. */
  minHeight?: string | number;
  /** Maximum height. A number is treated as pixels; a string is used as-is. */
  maxHeight?: string | number;

  // -- Border radius --------------------------------------------------------

  /** Border radius mapped from the theme radii scale. */
  radius?: ThemeRadiiKey;
}
