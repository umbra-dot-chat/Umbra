/**
 * @module primitives/center
 *
 * Type definitions for the Wisp {@link Center} layout primitive.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Center} layout primitive.
 *
 * @remarks
 * Extends standard HTML element attributes so native props like `className`,
 * `id`, and event handlers are forwarded transparently.
 */
export interface CenterProps extends React.HTMLAttributes<HTMLElement> {
  /** Content to center horizontally and vertically. */
  children?: React.ReactNode;

  /**
   * Use `inline-flex` instead of `flex` for the display mode.
   *
   * @remarks
   * Useful when the Center should sit inline alongside text or other
   * inline elements (e.g., centering an icon next to a label).
   *
   * @default false
   */
  inline?: boolean;

  /**
   * Render the root element as a custom HTML element or React component.
   * @default 'div'
   */
  as?: React.ElementType;
}
