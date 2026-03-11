/**
 * @module components/spotlight-tour
 * @description Type definitions for the Wisp SpotlightTour component.
 *
 * Full guided tour with backdrop cutout, step popovers, and navigation.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Step
// ---------------------------------------------------------------------------

/** A single step in the spotlight tour. */
export interface SpotlightTourStep {
  /** Ref to the target element to highlight. */
  target: React.RefObject<HTMLElement | null>;

  /** Title for this step. */
  title: string;

  /** Description for this step. */
  description?: string;

  /** Popover placement relative to the target. */
  placement?: 'top' | 'bottom' | 'left' | 'right';

  /** Alignment along the secondary axis. */
  align?: 'start' | 'center' | 'end';
}

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available colour variants for the SpotlightTour. */
export const spotlightTourVariants = ['default', 'info'] as const;

/** Union of spotlight-tour colour variant keys. */
export type SpotlightTourVariant = (typeof spotlightTourVariants)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link SpotlightTour} component. */
export interface SpotlightTourProps {
  /** Array of tour steps. */
  steps: SpotlightTourStep[];

  /** Whether the tour is open. */
  open: boolean;

  /**
   * Current step index (controlled).
   * @default 0
   */
  currentStep?: number;

  /** Callback fired when the step changes. */
  onStepChange?: (step: number) => void;

  /** Callback fired when the tour finishes (last step completed). */
  onFinish?: () => void;

  /** Callback fired when the tour is closed. */
  onClose?: () => void;

  /**
   * Whether to show step count (e.g. "2 of 5").
   * @default true
   */
  showStepCount?: boolean;

  /**
   * Label for the Next button.
   * @default 'Next'
   */
  nextLabel?: string;

  /**
   * Label for the Previous button.
   * @default 'Back'
   */
  prevLabel?: string;

  /**
   * Label for the Finish button (shown on last step).
   * @default 'Finish'
   */
  finishLabel?: string;

  /**
   * Whether clicking the overlay closes the tour.
   * @default false
   */
  closeOnOverlayClick?: boolean;

  /**
   * Whether pressing Escape closes the tour.
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Colour variant.
   * @default 'default'
   */
  variant?: SpotlightTourVariant;
}
