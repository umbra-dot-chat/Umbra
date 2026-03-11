/**
 * Type definitions for the Wisp ScrollArea layout primitive.
 *
 * @remarks
 * ScrollArea provides a styled scrollable container with theme-aware
 * scrollbar colors. Works across both themes with subtle, unobtrusive
 * scrollbar styling.
 *
 * @module primitives/scroll-area
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Direction
// ---------------------------------------------------------------------------

/** Allowed scroll direction values for a {@link ScrollArea}. */
export const scrollAreaDirections = ['vertical', 'horizontal', 'both'] as const;
/** Union of {@link scrollAreaDirections} values indicating which axes are scrollable. */
export type ScrollAreaDirection = (typeof scrollAreaDirections)[number];

// ---------------------------------------------------------------------------
// Scrollbar width
// ---------------------------------------------------------------------------

/** Allowed CSS `scrollbar-width` hint values. */
export const scrollbarWidths = ['thin', 'auto', 'none'] as const;
/** Union of {@link scrollbarWidths} values controlling scrollbar thickness. */
export type ScrollbarWidth = (typeof scrollbarWidths)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link ScrollArea} component.
 *
 * @remarks
 * Extends standard `div` HTML attributes with scroll-specific layout controls.
 */
export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Scrollable content. */
  children?: React.ReactNode;

  /** Which axes are scrollable. @default 'vertical' */
  direction?: ScrollAreaDirection;

  /** Hide scrollbar visually while preserving scroll. @default false */
  hideScrollbar?: boolean;

  /** Scrollbar width hint. @default 'thin' */
  scrollbarWidth?: ScrollbarWidth;

  /** Maximum height of the scroll container. */
  maxHeight?: string | number;

  /** Maximum width of the scroll container. */
  maxWidth?: string | number;
}
