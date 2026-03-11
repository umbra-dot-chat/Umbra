/**
 * @module CopyButton.types
 * @description Type definitions for the Wisp CopyButton component.
 */

import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available size presets for the CopyButton component. */
export const copyButtonSizes = ['sm', 'md', 'lg'] as const;

/** Union of allowed copy button size values. */
export type CopyButtonSize = (typeof copyButtonSizes)[number];

/** Dimensional configuration for a single copy button size preset. */
export interface CopyButtonSizeConfig {
  /** Button height in pixels. */
  height: number;
  /** Width and height of the icon in pixels. */
  iconSize: number;
  /** Font size in pixels for the optional label text. */
  fontSize: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Gap between icon and label in pixels. */
  gap: number;
}

/**
 * Maps each {@link CopyButtonSize} to its {@link CopyButtonSizeConfig}.
 *
 * @remarks
 * Used internally by the CopyButton component and its style builders to
 * resolve sizing tokens.
 */
export const copyButtonSizeMap: Record<CopyButtonSize, CopyButtonSizeConfig> = {
  sm: { height: 28, iconSize: 14, fontSize: defaultTypography.sizes.xs.fontSize, paddingX: defaultSpacing.md, gap: defaultSpacing.xs },
  md: { height: 32, iconSize: 16, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: defaultSpacing.md, gap: defaultSpacing.sm },
  lg: { height: 36, iconSize: 18, fontSize: defaultTypography.sizes.sm.fontSize, paddingX: defaultSpacing.lg, gap: defaultSpacing.sm },
};

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available visual variants for the CopyButton component. */
export const copyButtonVariants = ['outline', 'ghost', 'minimal'] as const;

/** Union of valid copy button variant values. */
export type CopyButtonVariant = (typeof copyButtonVariants)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link CopyButton} component.
 */
export interface CopyButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'children' | 'onCopy'> {
  /** The string value to copy to the clipboard when clicked. */
  value: string;

  /**
   * Button size.
   * @default 'md'
   */
  size?: CopyButtonSize;

  /** Optional text label displayed next to the icon. */
  label?: string;

  /**
   * Visual variant controlling border and background rendering.
   * - `'outline'` -- bordered button with subtle background on hover.
   * - `'ghost'` -- no border, transparent background with hover highlight.
   * - `'minimal'` -- icon-only, no border or background.
   * @default 'outline'
   */
  variant?: CopyButtonVariant;

  /**
   * Text shown in the copied (success) state.
   * @default 'Copied!'
   */
  copiedLabel?: string;

  /**
   * Duration in milliseconds to show the copied state before reverting.
   * @default 2000
   */
  copiedDuration?: number;

  /** Callback fired after a successful copy operation. */
  onCopy?: (value: string) => void;

  /**
   * When `true`, the button is visually muted and non-interactive.
   * @default false
   */
  disabled?: boolean;

  /**
   * When `true` a pulsing skeleton placeholder is rendered instead of the component.
   * @default false
   */
  skeleton?: boolean;
}
