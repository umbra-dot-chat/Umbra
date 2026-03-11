import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Kbd Sizes
// ---------------------------------------------------------------------------

/** Available Kbd size presets. */
export const kbdSizes = ['sm', 'md', 'lg'] as const;

/** Union of allowed Kbd size values. */
export type KbdSize = (typeof kbdSizes)[number];

// ---------------------------------------------------------------------------
// Size -> dimensions map
// ---------------------------------------------------------------------------

/**
 * Pixel-level dimension configuration for a single {@link KbdSize} preset.
 */
export interface KbdSizeConfig {
  /** Font size in pixels. */
  fontSize: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Vertical padding in pixels. */
  paddingY: number;
  /** Border radius in pixels. */
  borderRadius: keyof ThemeRadii;
  /** Minimum width to keep single-character keys square-ish, in pixels. */
  minWidth: number;
  /** Gap between consecutive keys rendered inside the same Kbd, in pixels. */
  gap: number;
}

/**
 * Maps each {@link KbdSize} to its corresponding {@link KbdSizeConfig}.
 */
export const kbdSizeMap: Record<KbdSize, KbdSizeConfig> = {
  sm: { fontSize: defaultTypography.sizes.xs.fontSize, paddingX: defaultSpacing.xs, paddingY: defaultSpacing['2xs'], borderRadius: 'sm', minWidth: 18, gap: defaultSpacing['2xs'] },
  md: { fontSize: defaultTypography.sizes.xs.fontSize, paddingX: defaultSpacing.sm, paddingY: defaultSpacing['2xs'], borderRadius: 'sm', minWidth: 22, gap: defaultSpacing.xs },
  lg: { fontSize: defaultTypography.sizes.sm.fontSize, paddingX: defaultSpacing.sm, paddingY: defaultSpacing.xs, borderRadius: 'md', minWidth: 26, gap: defaultSpacing.xs } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link Kbd} component.
 *
 * @remarks
 * Extends the native `HTMLElement` attributes so any standard `<kbd>` prop
 * (e.g. `data-*`, event handlers) is also accepted.
 */
export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  /** The key or key combination to display. Can be a string like `"⌘K"` or composed children. */
  children: React.ReactNode;
  /** Size variant. @default 'md' */
  size?: KbdSize;
}
