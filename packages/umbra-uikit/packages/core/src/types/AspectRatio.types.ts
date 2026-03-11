/**
 * @module primitives/aspect-ratio
 * @description Type definitions for the Wisp AspectRatio primitive.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link AspectRatio} component. */
export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Desired aspect ratio expressed as `width / height`.
   *
   * @remarks
   * Common values include `16 / 9` (widescreen), `4 / 3` (classic TV),
   * and `1` (square). Any positive number is accepted.
   *
   * @default 1
   */
  ratio?: number;
  /** Content to render inside the aspect-ratio container. */
  children?: React.ReactNode;
}
