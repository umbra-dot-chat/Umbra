/**
 * @module Collapse.types
 *
 * Type definitions for the Wisp Collapse layout primitive.
 *
 * @remarks
 * Collapse provides an animated expand/collapse container that measures
 * its content height and transitions smoothly. Extracted from the
 * Accordion pattern for general-purpose reuse.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Animation duration
// ---------------------------------------------------------------------------

/** Available animation duration presets for the Collapse transition. */
export const collapseDurations = ['instant', 'fast', 'normal', 'slow'] as const;

/** Union of collapse animation duration preset keys. */
export type CollapseDuration = (typeof collapseDurations)[number];

/** Maps each {@link CollapseDuration} to its millisecond value. */
export const collapseDurationMap: Record<CollapseDuration, number> = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 400,
};

// ---------------------------------------------------------------------------
// CollapseProps
// ---------------------------------------------------------------------------

/** Props for the {@link Collapse} component. */
export interface CollapseProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Content to show/hide. */
  children?: React.ReactNode;

  /** Whether the content is expanded. @default false */
  open?: boolean;

  /** Animation duration preset. @default 'normal' */
  duration?: CollapseDuration;

  /** Custom duration in ms (overrides `duration` preset). */
  durationMs?: number;

  /** CSS easing function. @default 'cubic-bezier(0.4, 0, 0.2, 1)' */
  easing?: string;

  /**
   * Whether to unmount children when collapsed.
   * When false, children remain in the DOM but hidden.
   * @default false
   */
  unmountOnClose?: boolean;

  /** Called when the expand/collapse transition ends. */
  onTransitionEnd?: () => void;
}
