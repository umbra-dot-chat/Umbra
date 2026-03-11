/**
 * Type definitions for the Wisp EmptyState layout primitive.
 *
 * @remarks
 * EmptyState provides a centered placeholder for empty content areas,
 * featuring an icon, title, description, and optional action button.
 *
 * @module primitives/empty-state
 */

import type React from 'react';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Size variants
// ---------------------------------------------------------------------------

/** Allowed size variant tokens for an {@link EmptyState}. */
export const emptyStateSizes = ['sm', 'md', 'lg'] as const;
/** Union of {@link emptyStateSizes} values. */
export type EmptyStateSize = (typeof emptyStateSizes)[number];

/**
 * Resolved size configuration for a single {@link EmptyStateSize} variant.
 *
 * @remarks
 * Each property is a pixel value consumed by the style builders in
 * {@link module:primitives/empty-state | EmptyState.styles}.
 */
export interface EmptyStateSizeConfig {
  /** Icon wrapper size in pixels. */
  iconSize: number;
  /** Title font size in pixels. */
  titleFontSize: number;
  /** Description font size in pixels. */
  descriptionFontSize: number;
  /** Minimum container height in pixels. */
  minHeight: number;
  /** Gap between stacked elements in pixels. */
  gap: number;
}

/** Map from {@link EmptyStateSize} token to its resolved {@link EmptyStateSizeConfig}. */
export const emptyStateSizeMap: Record<EmptyStateSize, EmptyStateSizeConfig> = {
  sm: { iconSize: 32, titleFontSize: 14, descriptionFontSize: 12, minHeight: 160, gap: defaultSpacing.sm },
  md: { iconSize: 48, titleFontSize: 18, descriptionFontSize: 14, minHeight: 240, gap: defaultSpacing.md },
  lg: { iconSize: 64, titleFontSize: 24, descriptionFontSize: 16, minHeight: 320, gap: defaultSpacing.lg },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the {@link EmptyState} component.
 *
 * @remarks
 * Extends standard `div` HTML attributes with slots for icon, title,
 * description, and action content.
 */
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon element displayed above the title. */
  icon?: React.ReactNode;

  /** Primary message. */
  title: string;

  /** Supporting text below the title. */
  description?: string;

  /** Action element (e.g. Button) displayed below the description. */
  action?: React.ReactNode;

  /** Size variant. @default 'md' */
  size?: EmptyStateSize;
}
