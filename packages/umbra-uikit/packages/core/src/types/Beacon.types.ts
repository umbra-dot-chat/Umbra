/**
 * @module primitives/beacon
 * @description Type definitions for the Wisp Beacon primitive.
 *
 * A pulsing icon button that opens a popover with help content.
 */

import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { PopoverPlacement, PopoverAlign } from './Popover.types';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available colour variants for the Beacon. */
export const beaconVariants = ['default', 'info', 'success', 'warning'] as const;

/** Union of beacon colour variant keys. */
export type BeaconVariant = (typeof beaconVariants)[number];

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available size presets for the Beacon. */
export const beaconSizes = ['sm', 'md', 'lg'] as const;

/** Union of beacon size keys. */
export type BeaconSize = (typeof beaconSizes)[number];

/** Dimensional config for a given beacon size. */
export interface BeaconSizeConfig {
  /** Outer button diameter in pixels. */
  buttonSize: number;
  /** Icon size in pixels. */
  iconSize: number;
  /** Border radius (half of buttonSize for a circle). */
  borderRadius: keyof ThemeRadii;
}

/** Maps each {@link BeaconSize} to its dimensional config. */
export const beaconSizeMap: Record<BeaconSize, BeaconSizeConfig> = {
  sm: { buttonSize: 18, iconSize: 14, borderRadius: 'md' },
  md: { buttonSize: 22, iconSize: 16, borderRadius: 'lg' },
  lg: { buttonSize: 28, iconSize: 20, borderRadius: 'xl' } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the {@link Beacon} primitive. */
export interface BeaconProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Content rendered inside the popover panel when clicked. */
  children: React.ReactNode;

  /**
   * Icon component rendered inside the circular button.
   * Receives `size` and `color` props.
   * @default Info icon from lucide-react
   */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number | string }>;

  /**
   * Whether the beacon pulses to draw attention.
   * @default true
   */
  pulsing?: boolean;

  /**
   * Which side of the beacon button to place the popover on.
   * @default 'bottom'
   */
  placement?: PopoverPlacement;

  /**
   * Alignment of the popover along the perpendicular axis.
   * @default 'center'
   */
  align?: PopoverAlign;

  /**
   * Pixel offset between the beacon and the popover.
   * @default 8
   */
  offset?: number;

  /**
   * Size preset for the beacon button.
   * @default 'md'
   */
  size?: BeaconSize;

  /**
   * Colour variant controlling the beacon's tint.
   * @default 'info'
   */
  variant?: BeaconVariant;

  /** Controlled open state for the popover. */
  open?: boolean;

  /** Callback fired when the popover open state changes. */
  onOpenChange?: (open: boolean) => void;
}
