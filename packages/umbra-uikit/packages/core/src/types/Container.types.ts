/**
 * @module primitives/container
 *
 * Type definitions for the Wisp {@link Container} layout primitive.
 *
 * @remarks
 * Container constrains content to a max-width and centres it horizontally.
 * Sizes align with the breakpoint tokens from the Wisp token system so
 * layout constraints match responsive design tiers.
 */

import type React from 'react';
import type { ThemeSpacing } from '../theme/types';

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

/**
 * Const tuple of valid {@link ContainerSize} values, useful for Storybook controls.
 *
 * @remarks
 * Listed in ascending order from the smallest breakpoint to `'full'`.
 */
export const containerSizes = ['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const;

/** Allowed values for the {@link ContainerProps.size} prop. */
export type ContainerSize = (typeof containerSizes)[number];

// ---------------------------------------------------------------------------
// Size → max-width map (aligns with breakpoint tokens)
// ---------------------------------------------------------------------------

/**
 * Maps each {@link ContainerSize} to a `max-width` value (pixels or CSS string).
 *
 * @remarks
 * Numeric values are interpreted as pixels by {@link buildContainerStyle}.
 * The `'full'` key maps to `'100%'` so the container spans the available width.
 */
export const containerSizeMap: Record<ContainerSize, number | string> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  full: '100%',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Container} layout primitive.
 *
 * @remarks
 * Extends standard HTML element attributes so native props like `className`,
 * `id`, and event handlers are forwarded transparently.
 */
export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  /** Container content. */
  children?: React.ReactNode;

  /**
   * Max-width constraint tier.
   *
   * @remarks
   * See {@link containerSizeMap} for the pixel value each key resolves to.
   *
   * @default 'lg'
   */
  size?: ContainerSize;

  /**
   * Center the container horizontally using `margin-left: auto; margin-right: auto`.
   * @default true
   */
  center?: boolean;

  /**
   * Horizontal padding applied to both sides, mapped to a theme spacing token.
   * @default 'lg'
   */
  px?: keyof ThemeSpacing;

  /**
   * Render the root element as a custom HTML element or React component.
   * @default 'div'
   */
  as?: React.ElementType;
}
