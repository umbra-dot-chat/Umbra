/**
 * Type definitions for the Wisp Popover primitive.
 *
 * @module primitives/popover/types
 */

import type React from 'react';
import type { SurfaceVariant } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Placement & Alignment
// ---------------------------------------------------------------------------

/** All valid popover placement sides. */
export const popoverPlacements = ['top', 'right', 'bottom', 'left'] as const;

/** Side of the trigger on which the popover content appears. */
export type PopoverPlacement = (typeof popoverPlacements)[number];

/** All valid popover alignment options. */
export const popoverAligns = ['start', 'center', 'end'] as const;

/** Alignment of the popover content along the perpendicular axis of its placement. */
export type PopoverAlign = (typeof popoverAligns)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the root {@link Popover} compound component. */
export interface PopoverProps {
  /** Child elements, typically {@link PopoverTrigger} and {@link PopoverContent}. */
  children: React.ReactNode;

  /** Controlled open state. When provided the component becomes controlled. */
  open?: boolean;

  /**
   * Initial open state for uncontrolled usage.
   * @default false
   */
  defaultOpen?: boolean;

  /** Callback fired when the open state changes. */
  onOpenChange?: (open: boolean) => void;

  /**
   * Which side of the trigger to place the popover content on.
   * @default 'bottom'
   */
  placement?: PopoverPlacement;

  /**
   * Alignment along the perpendicular axis of the placement.
   * @default 'center'
   */
  align?: PopoverAlign;

  /**
   * Pixel distance between the trigger and the popover content.
   * @default 8
   */
  offset?: number;
}

/** Props for the {@link PopoverTrigger} wrapper. */
export interface PopoverTriggerProps {
  /** A single React element that serves as the popover trigger. */
  children: React.ReactElement;
}

/** Props for the {@link PopoverContent} floating panel. */
export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content rendered inside the floating panel. */
  children: React.ReactNode;

  /**
   * Surface rendering variant.
   * - `'solid'` (default) -- opaque raised background.
   * - `'glass'` -- frosted-glass / glassmorphism effect.
   * @default 'solid'
   */
  variant?: SurfaceVariant;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** Internal context value shared between Popover compound components. */
export interface PopoverContextValue {
  /** Whether the popover is currently open. */
  open: boolean;

  /** Callback to update the open state. */
  setOpen: (open: boolean) => void;

  /** Ref to the trigger element for positioning calculations. */
  triggerRef: React.RefObject<HTMLElement | null>;

  /** Active placement side. */
  placement: PopoverPlacement;

  /** Active alignment along the perpendicular axis. */
  align: PopoverAlign;

  /** Pixel offset from the trigger. */
  offset: number;
}
