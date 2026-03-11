/**
 * @module Sticky.types
 *
 * Type definitions for the Wisp Sticky layout primitive.
 *
 * @remarks
 * Sticky wraps content with CSS sticky positioning and proper z-index
 * from theme tokens.
 */

import type React from 'react';
import type { ZIndexKey } from '../tokens/z-index';

// ---------------------------------------------------------------------------
// Sticky edge
// ---------------------------------------------------------------------------

/** Available sticky edge positions. */
export const stickyEdges = ['top', 'bottom'] as const;

/** Union of sticky edge positions. */
export type StickyEdge = (typeof stickyEdges)[number];

// ---------------------------------------------------------------------------
// StickyProps
// ---------------------------------------------------------------------------

/** Props for the {@link Sticky} component. */
export interface StickyProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Render as a custom HTML element or component.
   * @default 'div'
   */
  as?: React.ElementType;

  /**
   * Edge to stick to when scrolling.
   * @default 'top'
   */
  edge?: StickyEdge;

  /**
   * Offset from the sticky edge in pixels.
   * @default 0
   */
  offset?: number;

  /**
   * Z-index layer from the theme z-index scale.
   * @default 'sticky'
   */
  zIndex?: ZIndexKey;

  /** Custom z-index number (overrides the `zIndex` layer token). */
  zIndexValue?: number;
}
