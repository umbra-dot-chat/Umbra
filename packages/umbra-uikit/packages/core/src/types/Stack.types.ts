/**
 * @module primitives/stack
 *
 * Type definitions for the Wisp {@link Stack} layout primitive.
 *
 * @remarks
 * Stack arranges children in a vertical or horizontal line with consistent
 * spacing using theme tokens. {@link HStack} and {@link VStack} are
 * convenience aliases that fix the direction.
 */

import type React from 'react';
import type { ThemeSpacing } from '../theme/types';

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

/** Const tuple of valid stack direction values, useful for Storybook controls. */
export const stackDirections = ['horizontal', 'vertical'] as const;

/** The layout direction of a {@link Stack}: `'horizontal'` or `'vertical'`. */
export type StackDirection = (typeof stackDirections)[number];

// ---------------------------------------------------------------------------
// Spacing — keyed to ThemeSpacing
// ---------------------------------------------------------------------------

/**
 * A spacing token key used for the gap between Stack children.
 *
 * @remarks
 * Derived from {@link ThemeSpacing} so it stays in sync with the theme.
 */
export type StackGap = keyof ThemeSpacing;

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

/** Const tuple of valid cross-axis alignment values, useful for Storybook controls. */
export const stackAligns = ['start', 'center', 'end', 'stretch', 'baseline'] as const;

/** Cross-axis alignment options for {@link StackProps.align}. */
export type StackAlign = (typeof stackAligns)[number];

/** Const tuple of valid main-axis justification values, useful for Storybook controls. */
export const stackJustifys = ['start', 'center', 'end', 'between', 'around', 'evenly'] as const;

/** Main-axis justification options for {@link StackProps.justify}. */
export type StackJustify = (typeof stackJustifys)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Stack} layout primitive.
 *
 * @remarks
 * Extends standard HTML element attributes (minus `children`, which is
 * re-declared to allow `React.ReactNode`).
 */
export interface StackProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** Stack content (rendered as flex children). */
  children?: React.ReactNode;

  /**
   * Layout direction of the flex container.
   * @default 'vertical'
   */
  direction?: StackDirection;

  /**
   * Gap between children, mapped to a theme spacing token.
   * @default 'md'
   */
  gap?: StackGap;

  /**
   * Cross-axis alignment (`align-items`).
   * @default 'stretch'
   */
  align?: StackAlign;

  /**
   * Main-axis distribution (`justify-content`).
   * @default 'start'
   */
  justify?: StackJustify;

  /**
   * Allow children to wrap to the next line.
   * @default false
   */
  wrap?: boolean;

  /**
   * Reverse the visual order of children.
   * @default false
   */
  reverse?: boolean;

  /**
   * Automatically insert a theme-aware divider between each child.
   * @default false
   */
  divider?: boolean;

  /**
   * Render the root element as a custom HTML element or React component.
   * @default 'div'
   */
  as?: React.ElementType;
}
