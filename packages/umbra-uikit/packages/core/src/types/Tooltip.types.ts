/**
 * @module Tooltip.types
 * @description Type definitions for the Wisp Tooltip primitive.
 */

import type React from 'react';
import type { SurfaceVariant } from '../tokens/shared';

// ---------------------------------------------------------------------------
// Tooltip Placement
// ---------------------------------------------------------------------------

/** Available placement directions for the tooltip relative to its trigger. */
export const tooltipPlacements = ['top', 'bottom', 'left', 'right'] as const;

/** Union of allowed tooltip placement values. */
export type TooltipPlacement = (typeof tooltipPlacements)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the {@link Tooltip} component. */
export interface TooltipProps {
  /** Content rendered inside the tooltip bubble (text or React nodes). */
  content: React.ReactNode;
  /** The trigger element -- must accept ref forwarding. */
  children: React.ReactElement;
  /**
   * Placement of the tooltip relative to the trigger element.
   * @default 'top'
   */
  placement?: TooltipPlacement;
  /**
   * Delay in milliseconds before the tooltip becomes visible after hover/focus.
   * @default 300
   */
  delay?: number;
  /**
   * Maximum width of the tooltip bubble in pixels.
   * @default 220
   */
  maxWidth?: number;
  /**
   * Surface rendering variant.
   * - `'solid'` (default) -- opaque inverted background.
   * - `'glass'` -- frosted-glass / glassmorphism effect.
   * @default 'solid'
   */
  variant?: SurfaceVariant;

  /**
   * When `true`, the tooltip is disabled and will not appear on hover or focus.
   * @default false
   */
  disabled?: boolean;
  /** Additional CSS class name applied to the tooltip portal container. */
  className?: string;
  /** Additional inline styles merged onto the tooltip bubble element. */
  style?: React.CSSProperties;
}
