import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Chip Sizes
// ---------------------------------------------------------------------------

/** Available size variants for the {@link Chip} primitive. */
export const chipSizes = ['sm', 'md', 'lg'] as const;

/** Union of supported Chip size values. */
export type ChipSize = (typeof chipSizes)[number];

// ---------------------------------------------------------------------------
// Chip Color Variants
// ---------------------------------------------------------------------------

/** Available semantic color variants for the {@link Chip} primitive. */
export const chipColors = ['default', 'success', 'warning', 'danger', 'info'] as const;

/** Union of supported Chip color values. */
export type ChipColor = (typeof chipColors)[number];

// ---------------------------------------------------------------------------
// Chip Style Variants
// ---------------------------------------------------------------------------

/** Available style variants for the {@link Chip} primitive. */
export const chipVariants = ['filled', 'outlined', 'subtle'] as const;

/** Union of supported Chip style variant values. */
export type ChipVariant = (typeof chipVariants)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/** Dimension and spacing tokens for a single {@link ChipSize} variant. */
export interface ChipSizeConfig {
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Vertical padding in pixels. */
  paddingY: number;
  /** Font size in pixels. */
  fontSize: number;
  /** CSS line-height multiplier. */
  lineHeight: number;
  /** Border radius in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Gap between icon, text, and remove button in pixels. */
  gap: number;
  /** Leading icon size in pixels. */
  iconSize: number;
  /** Remove button hit-area size in pixels. */
  removeButtonSize: number;
  /** Remove icon (X) size in pixels. */
  removeIconSize: number;
}

/** Maps each {@link ChipSize} to its corresponding dimension tokens. */
export const chipSizeMap: Record<ChipSize, ChipSizeConfig> = {
  sm: {
    paddingX: defaultSpacing.sm,
    paddingY: defaultSpacing['2xs'],
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 1.33,
    borderRadius: 'sm',
    gap: defaultSpacing.xs,
    iconSize: 12,
    removeButtonSize: 16,
    removeIconSize: 10 },
  md: {
    paddingX: defaultSpacing.md,
    paddingY: defaultSpacing.xs,
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 1.38,
    borderRadius: 'md',
    gap: defaultSpacing.sm,
    iconSize: 14,
    removeButtonSize: 18,
    removeIconSize: 12 },
  lg: {
    paddingX: defaultSpacing.md,
    paddingY: defaultSpacing.sm,
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 1.43,
    borderRadius: 'md',
    gap: defaultSpacing.sm,
    iconSize: 16,
    removeButtonSize: 20,
    removeIconSize: 14 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link Chip} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes. The chip renders as an
 * inline-flex container with optional icon, label, and remove button.
 */
export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Content rendered inside the chip (typically a text label). */
  children: React.ReactNode;

  /**
   * Size variant controlling padding, font size, and icon dimensions.
   * @default 'md'
   */
  size?: ChipSize;

  /**
   * Semantic color variant applied to background, text, and border.
   * @default 'default'
   */
  color?: ChipColor;

  /**
   * Style variant controlling fill, outline, and border behavior.
   * @default 'filled'
   */
  variant?: ChipVariant;

  /**
   * When `true`, a remove (X) button is rendered at the trailing edge.
   * @default false
   */
  removable?: boolean;

  /** Callback invoked when the remove button is clicked. */
  onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * When `true`, the chip gains pointer cursor and interactive hover effects.
   * @default false
   */
  clickable?: boolean;

  /** Optional leading icon element rendered before the label. */
  icon?: React.ReactNode;

  /**
   * When `true`, the chip is visually dimmed and non-interactive.
   * @default false
   */
  disabled?: boolean;
}
