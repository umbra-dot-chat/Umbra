/**
 * @module ButtonGroup
 */
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available button group sizes. */
export const buttonGroupSizes = ['xs', 'sm', 'md', 'lg'] as const;

/** Union of valid button group size values. */
export type ButtonGroupSize = (typeof buttonGroupSizes)[number];

/** Dimensional config for a button group size step. */
export interface ButtonGroupSizeConfig {
  /** Button height in pixels. */
  height: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Font size in pixels. */
  fontSize: number;
  /** Line height in pixels. */
  lineHeight: number;
  /** Icon size in pixels. */
  iconSize: number;
  /** Gap between icon and label. */
  gap: number;
}

/** Size → config lookup. */
export const buttonGroupSizeMap: Record<ButtonGroupSize, ButtonGroupSizeConfig> = {
  xs: { height: 28, paddingX: defaultSpacing.md, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 18, iconSize: 14, gap: defaultSpacing.xs },
  sm: { height: 32, paddingX: defaultSpacing.md, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, iconSize: 16, gap: defaultSpacing.xs },
  md: { height: 36, paddingX: defaultSpacing.lg, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 20, iconSize: 16, gap: defaultSpacing.sm },
  lg: { height: 40, paddingX: defaultSpacing.lg, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 24, iconSize: 20, gap: defaultSpacing.sm },
};

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available button group visual variants. */
export const buttonGroupVariants = ['outline', 'ghost'] as const;

/** Union of valid button group variant values. */
export type ButtonGroupVariant = (typeof buttonGroupVariants)[number];

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

/** Describes a single item within a ButtonGroup. */
export interface ButtonGroupItem {
  /** Unique value identifying this item. */
  value: string;
  /** Visible label text. */
  label: string;
  /** Optional icon displayed before the label. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  /**
   * Whether this item is disabled.
   * @default false
   */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ButtonGroup} component.
 */
export interface ButtonGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Array of items to render. */
  items: ButtonGroupItem[];

  /** Controlled selected value. */
  value?: string;

  /** Initial value for uncontrolled usage. */
  defaultValue?: string;

  /** Callback fired when selection changes. */
  onChange?: (value: string) => void;

  /**
   * Visual variant.
   * - `outline` — bordered buttons
   * - `ghost` — no borders, subtle highlight on active
   * @default 'outline'
   */
  variant?: ButtonGroupVariant;

  /**
   * Size controlling height, padding, and font size.
   * @default 'md'
   */
  size?: ButtonGroupSize;

  /**
   * When `true`, the group stretches to fill its container.
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Disables all items.
   * @default false
   */
  disabled?: boolean;
}
