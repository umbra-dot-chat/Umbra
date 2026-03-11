/**
 * @module components/coachmark
 * @description Type definitions for the Wisp Coachmark component.
 *
 * A standalone positioned callout attached to a target element via ref.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available colour variants for the Coachmark. */
export const coachmarkVariants = ['default', 'info', 'success', 'warning'] as const;

/** Union of coachmark colour variant keys. */
export type CoachmarkVariant = (typeof coachmarkVariants)[number];

// ---------------------------------------------------------------------------
// Placements
// ---------------------------------------------------------------------------

/** Available placement positions for the Coachmark. */
export const coachmarkPlacements = ['top', 'bottom', 'left', 'right'] as const;

/** Union of coachmark placement keys. */
export type CoachmarkPlacement = (typeof coachmarkPlacements)[number];

/** Available alignment options for the Coachmark. */
export const coachmarkAligns = ['start', 'center', 'end'] as const;

/** Union of coachmark alignment keys. */
export type CoachmarkAlign = (typeof coachmarkAligns)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link Coachmark} component. */
export interface CoachmarkProps {
  /** Ref to the target element the coachmark attaches to. */
  target: React.RefObject<HTMLElement | null>;

  /** Primary title text. */
  title: string;

  /** Optional description below the title. */
  description?: string;

  /** Label for the primary action button. */
  actionLabel?: string;

  /** Callback fired when the action button is clicked. */
  onAction?: () => void;

  /** Label for the dismiss button. */
  dismissLabel?: string;

  /** Callback fired when the coachmark is dismissed. */
  onDismiss?: () => void;

  /**
   * Placement relative to the target element.
   * @default 'bottom'
   */
  placement?: CoachmarkPlacement;

  /**
   * Alignment along the secondary axis.
   * @default 'center'
   */
  align?: CoachmarkAlign;

  /**
   * Distance in px from the target element.
   * @default 12
   */
  offset?: number;

  /**
   * Whether to show the arrow pointing to the target.
   * @default true
   */
  showArrow?: boolean;

  /**
   * Whether the coachmark is open (visible).
   * @default true
   */
  open?: boolean;

  /** Callback fired when open state changes (e.g. clicking outside or pressing Escape). */
  onOpenChange?: (open: boolean) => void;

  /**
   * Colour variant controlling the accent colours.
   * @default 'default'
   */
  variant?: CoachmarkVariant;

  /** Additional class name for the panel. */
  className?: string;

  /** Additional inline style for the panel. */
  style?: React.CSSProperties;
}
