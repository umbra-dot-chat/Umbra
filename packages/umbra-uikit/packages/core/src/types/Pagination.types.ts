/**
 * @module Pagination.types
 * @description Type definitions for the Wisp Pagination primitive.
 */

import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

/** Available size presets for the Pagination component. */
export const paginationSizes = ['sm', 'md', 'lg'] as const;

/** Union of allowed pagination size values. */
export type PaginationSize = (typeof paginationSizes)[number];

/** Dimensional configuration for a single pagination size preset. */
export interface PaginationSizeConfig {
  /** Button height in pixels. */
  height: number;
  /** Font size in pixels for page numbers and labels. */
  fontSize: number;
  /** Minimum button width in pixels (keeps buttons square when content is narrow). */
  minWidth: number;
  /** Width and height of navigation chevron icons in pixels. */
  iconSize: number;
  /** Horizontal gap between adjacent buttons in pixels. */
  gap: number;
}

/**
 * Maps each {@link PaginationSize} to its {@link PaginationSizeConfig}.
 *
 * @remarks
 * Used internally by the Pagination component and its style builders to
 * resolve sizing tokens.
 */
export const paginationSizeMap: Record<PaginationSize, PaginationSizeConfig> = {
  sm: { height: 28, fontSize: defaultTypography.sizes.xs.fontSize, minWidth: 28, iconSize: 14, gap: defaultSpacing.xs },
  md: { height: 34, fontSize: defaultTypography.sizes.sm.fontSize, minWidth: 34, iconSize: 16, gap: defaultSpacing.sm },
  lg: { height: 40, fontSize: defaultTypography.sizes.base.fontSize, minWidth: 40, iconSize: 18, gap: defaultSpacing.sm },
};

/**
 * Discriminated union representing a single item in the pagination strip.
 *
 * @remarks
 * - `{ type: 'page'; page: number }` -- a clickable page button.
 * - `{ type: 'ellipsis'; key: string }` -- a non-interactive gap indicator.
 */
export type PageItem =
  | { type: 'page'; page: number }
  | { type: 'ellipsis'; key: string };

/** Props accepted by the {@link Pagination} component. */
export interface PaginationProps {
  /** The 1-based index of the currently active page (controlled). */
  page: number;
  /** Total number of pages available. */
  totalPages: number;
  /** Callback fired when the user selects a different page. */
  onChange: (page: number) => void;
  /**
   * Number of page buttons visible on each side of the current page.
   * @default 1
   */
  siblingCount?: number;
  /**
   * Controls the visual size of buttons and icons.
   * @default 'md'
   */
  size?: PaginationSize;
  /**
   * When `true`, shows first-page and last-page jump buttons.
   * @default true
   */
  showFirstLast?: boolean;
  /**
   * When `true`, all buttons are visually muted and non-interactive.
   * @default false
   */
  disabled?: boolean;
  /** Additional CSS class name applied to the root `<nav>` element. */
  className?: string;
  /** Additional inline styles merged onto the root `<nav>` element. */
  style?: React.CSSProperties;
}
