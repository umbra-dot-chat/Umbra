import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import type { ComponentSize } from '../tokens/shared';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Tag sizes — subset of ComponentSize
// ---------------------------------------------------------------------------

/** Available tag size tokens. */
export const tagSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid tag size values derived from {@link tagSizes}. */
export type TagSize = (typeof tagSizes)[number];

// ---------------------------------------------------------------------------
// Size configuration
// ---------------------------------------------------------------------------

/**
 * Dimensional configuration for a single tag size.
 *
 * @remarks
 * Each property maps to a CSS value used by {@link buildTagStyle} and
 * related style builders in `Tag.styles.ts`.
 */
export interface TagSizeConfig {
  /** Overall tag height in pixels. */
  height: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Font size in pixels. */
  fontSize: number;
  /** Unitless CSS line-height multiplier. */
  lineHeight: number;
  /** Border radius in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Gap between internal elements in pixels. */
  gap: number;
  /** Close button container size in pixels. */
  closeSize: number;
  /** Close icon (X) size in pixels. */
  closeIconSize: number;
}

/**
 * Lookup from {@link TagSize} to its {@link TagSizeConfig} dimensions.
 *
 * @remarks
 * Pre-defined for `sm`, `md`, and `lg`.
 */
export const tagSizeMap: Record<TagSize, TagSizeConfig> = {
  sm: { height: 24, paddingX: defaultSpacing.sm, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 1.33, borderRadius: 'sm', gap: defaultSpacing.xs, closeSize: 16, closeIconSize: 10 },
  md: { height: 28, paddingX: defaultSpacing.md, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.38, borderRadius: 'sm', gap: defaultSpacing.sm, closeSize: 18, closeIconSize: 12 },
  lg: { height: 32, paddingX: defaultSpacing.md, fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.43, borderRadius: 'md', gap: defaultSpacing.sm, closeSize: 20, closeIconSize: 14 } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Tag} component.
 *
 * @remarks
 * Extends the native `<span>` element attributes (with `children` redefined)
 * so any valid HTML span prop (e.g. `aria-*`, `data-*`, `onClick`) can be forwarded.
 */
export interface TagProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Tag content (text or inline elements). */
  children: React.ReactNode;
  /**
   * Controls the overall dimensions of the tag.
   * @default 'md'
   */
  size?: TagSize;
  /**
   * Remove callback. When provided, renders an X close button that
   * invokes this callback on click.
   */
  onRemove?: () => void;
  /**
   * Whether the tag is in a selected/active visual state.
   * @default false
   */
  selected?: boolean;
  /**
   * Whether the tag is disabled (reduced opacity, no hover, no remove).
   * @default false
   */
  disabled?: boolean;
  /** Optional leading icon component (e.g. a Lucide icon). */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  /**
   * When `true`, renders a pulsing skeleton placeholder instead of content.
   * @default false
   */
  skeleton?: boolean;
}
