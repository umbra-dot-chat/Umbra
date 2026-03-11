/**
 * @module Floating.types
 *
 * Type definitions for the Wisp Floating layout primitive.
 *
 * @remarks
 * Floating provides a positioning engine for floating UI relative to a
 * trigger element. Handles placement, offset, flip, shift, and viewport
 * collision detection. Extracts and generalises the positioning logic from
 * Popover/Tooltip/DropdownMenu for reuse by DatePicker, ColorPicker,
 * Autocomplete, MentionInput, ContextMenu, etc.
 */

import type React from 'react';
import type { ZIndexKey } from '../tokens/z-index';

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

/** Available primary placement sides for floating content. */
export const floatingPlacements = ['top', 'bottom', 'left', 'right'] as const;

/** Union of floating placement side keys. */
export type FloatingPlacement = (typeof floatingPlacements)[number];

// ---------------------------------------------------------------------------
// Alignment on the cross axis
// ---------------------------------------------------------------------------

/** Available cross-axis alignment options for floating content. */
export const floatingAligns = ['start', 'center', 'end'] as const;

/** Union of floating cross-axis alignment keys. */
export type FloatingAlign = (typeof floatingAligns)[number];

// ---------------------------------------------------------------------------
// Collision strategy
// ---------------------------------------------------------------------------

/** Available strategies for handling viewport collisions. */
export const floatingStrategies = ['flip', 'shift', 'none'] as const;

/** Union of floating collision strategy keys. */
export type FloatingStrategy = (typeof floatingStrategies)[number];

// ---------------------------------------------------------------------------
// Computed position
// ---------------------------------------------------------------------------

/** Computed position returned by the {@link useFloating} hook. */
export interface FloatingPosition {
  /** Vertical offset from the viewport top in pixels. */
  top: number;
  /** Horizontal offset from the viewport left in pixels. */
  left: number;
  /** Optional CSS transform string. */
  transform: string | undefined;
  /** The final resolved placement after flip/collision handling. */
  resolvedPlacement: FloatingPlacement;
}

// ---------------------------------------------------------------------------
// useFloating hook options
// ---------------------------------------------------------------------------

/** Options for the {@link useFloating} positioning hook. */
export interface UseFloatingOptions {
  /** Preferred placement relative to the anchor. @default 'bottom' */
  placement?: FloatingPlacement;

  /** Cross-axis alignment. @default 'center' */
  align?: FloatingAlign;

  /** Distance from the anchor element in px. @default 8 */
  offset?: number;

  /**
   * How to handle viewport collision.
   * - `'flip'` — switch to the opposite side when clipped
   * - `'shift'` — slide along the edge to stay in view
   * - `'none'` — no collision handling
   * @default 'flip'
   */
  strategy?: FloatingStrategy;

  /** Whether floating is currently active (for re-measurement). */
  open?: boolean;
}

// ---------------------------------------------------------------------------
// FloatingProps (wrapper component)
// ---------------------------------------------------------------------------

/** Props for the declarative {@link Floating} wrapper component. */
export interface FloatingProps {
  /** The trigger/anchor element. Must accept a ref. */
  children: React.ReactElement;

  /** The floating content. */
  content: React.ReactNode;

  /** Whether the floating content is visible. */
  open: boolean;

  /** Preferred placement. @default 'bottom' */
  placement?: FloatingPlacement;

  /** Cross-axis alignment. @default 'center' */
  align?: FloatingAlign;

  /** Distance from the anchor in px. @default 8 */
  offset?: number;

  /** Collision strategy. @default 'flip' */
  strategy?: FloatingStrategy;

  /** Z-index layer. @default 'popover' */
  zIndex?: ZIndexKey;

  /** Custom z-index number (overrides `zIndex` layer). */
  zIndexValue?: number;

  /** Whether the floating content should render in a portal. @default true */
  portal?: boolean;

  /** Additional style for the floating container. */
  floatingStyle?: React.CSSProperties;

  /** Additional class name for the floating container. */
  floatingClassName?: string;
}
