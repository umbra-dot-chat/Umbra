import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Badge Sizes
// ---------------------------------------------------------------------------

/** Available badge size tokens. */
export const badgeSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid badge size values derived from {@link badgeSizes}. */
export type BadgeSize = (typeof badgeSizes)[number];

// ---------------------------------------------------------------------------
// Badge Variants
// ---------------------------------------------------------------------------

/** Available badge color variant tokens. */
export const badgeVariants = ['default', 'success', 'warning', 'danger', 'info'] as const;

/** Union of valid badge variant values derived from {@link badgeVariants}. */
export type BadgeVariant = (typeof badgeVariants)[number];

// ---------------------------------------------------------------------------
// Badge Shapes
// ---------------------------------------------------------------------------

/** Available badge shape tokens. */
export const badgeShapes = ['pill', 'badge'] as const;

/** Union of valid badge shape values derived from {@link badgeShapes}. */
export type BadgeShape = (typeof badgeShapes)[number];

// ---------------------------------------------------------------------------
// Size → dimensions map
// ---------------------------------------------------------------------------

/**
 * Dimensional configuration for a single badge size.
 *
 * @remarks
 * Each property maps to a CSS value used by {@link buildBadgeStyle} and
 * related style builders in `Badge.styles.ts`.
 */
export interface BadgeSizeConfig {
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Vertical padding in pixels. */
  paddingY: number;
  /** Font size in pixels. */
  fontSize: number;
  /** Unitless CSS line-height multiplier. */
  lineHeight: number;
  /** Border radius in pixels used when {@link BadgeProps.shape} is `'badge'`. */
  badgeRadius: keyof ThemeRadii;
  /** Diameter of the dot indicator in pixels. */
  dotSize: number;
  /** Gap between internal elements (dot/icon and text) in pixels. */
  gap: number;
  /** Leading/trailing icon size in pixels. */
  iconSize: number;
}

/**
 * Lookup from {@link BadgeSize} to its {@link BadgeSizeConfig} dimensions.
 *
 * @remarks
 * Pre-defined for `sm`, `md`, and `lg`.
 */
export const badgeSizeMap: Record<BadgeSize, BadgeSizeConfig> = {
  sm: { paddingX: defaultSpacing.sm, paddingY: defaultSpacing['2xs'], fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 1.33, badgeRadius: 'sm', dotSize: 6, gap: defaultSpacing.xs, iconSize: 12 },
  md: { paddingX: defaultSpacing.md, paddingY: defaultSpacing.xs, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.38, badgeRadius: 'sm', dotSize: 6, gap: defaultSpacing.sm, iconSize: 14 },
  lg: { paddingX: defaultSpacing.md, paddingY: defaultSpacing.xs, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.43, badgeRadius: 'sm', dotSize: 8, gap: defaultSpacing.sm, iconSize: 16 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Badge} component.
 *
 * @remarks
 * Extends the native `<span>` element attributes so any valid HTML span
 * prop (e.g. `aria-*`, `data-*`, `onClick`) can be forwarded.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Badge content (text or inline elements). */
  children: React.ReactNode;
  /**
   * Controls the overall dimensions of the badge.
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Semantic color variant applied to background, text, and border.
   * @default 'default'
   */
  variant?: BadgeVariant;
  /**
   * Badge shape -- `'pill'` (fully rounded) or `'badge'` (slight rounding).
   * @default 'pill'
   */
  shape?: BadgeShape;
  /**
   * When `true`, renders a small colored dot before the text content.
   * @default false
   */
  dot?: boolean;
  /** Optional leading icon component (e.g. a Lucide icon). */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  /** Optional trailing icon component rendered after the text. */
  trailingIcon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
