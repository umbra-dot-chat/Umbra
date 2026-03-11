/**
 * Type definitions for the Wisp Grid layout primitive.
 *
 * @remarks
 * Grid provides a CSS Grid container with token-based gap, responsive
 * columns, and named template areas. {@link GridItemProps} controls
 * placement within the grid.
 *
 * @module primitives/grid
 */

import type React from 'react';
import type { ThemeSpacing } from '../theme/types';

// ---------------------------------------------------------------------------
// Gap — keyed to ThemeSpacing
// ---------------------------------------------------------------------------

/** Gap size token keyed to {@link ThemeSpacing}. */
export type GridGap = keyof ThemeSpacing;

// ---------------------------------------------------------------------------
// Columns helper
// ---------------------------------------------------------------------------

/**
 * Column configuration for the grid.
 *
 * - `number` — equal-width columns (e.g. `3` → `repeat(3, 1fr)`)
 * - `string` — raw CSS grid-template-columns value
 */
export type GridColumns = number | string;

/**
 * Row configuration for the grid.
 *
 * - `number` — equal-height rows (e.g. `3` → `repeat(3, 1fr)`)
 * - `string` — raw CSS grid-template-rows value
 */
export type GridRows = number | string;

// ---------------------------------------------------------------------------
// Alignment
// ---------------------------------------------------------------------------

/** Allowed values for the CSS `align-items` property within a Grid. */
export const gridAlignItems = ['start', 'center', 'end', 'stretch', 'baseline'] as const;
/** Union of {@link gridAlignItems} values. */
export type GridAlignItems = (typeof gridAlignItems)[number];

/** Allowed values for the CSS `justify-items` property within a Grid. */
export const gridJustifyItems = ['start', 'center', 'end', 'stretch'] as const;
/** Union of {@link gridJustifyItems} values. */
export type GridJustifyItems = (typeof gridJustifyItems)[number];

/** Allowed values for the CSS `align-content` property within a Grid. `'between'`, `'around'`, and `'evenly'` are shorthand for `space-*` equivalents. */
export const gridAlignContents = ['start', 'center', 'end', 'stretch', 'between', 'around', 'evenly'] as const;
/** Union of {@link gridAlignContents} values. */
export type GridAlignContent = (typeof gridAlignContents)[number];

/** Allowed values for the CSS `justify-content` property within a Grid. `'between'`, `'around'`, and `'evenly'` are shorthand for `space-*` equivalents. */
export const gridJustifyContents = ['start', 'center', 'end', 'stretch', 'between', 'around', 'evenly'] as const;
/** Union of {@link gridJustifyContents} values. */
export type GridJustifyContent = (typeof gridJustifyContents)[number];

// ---------------------------------------------------------------------------
// GridProps
// ---------------------------------------------------------------------------

/**
 * Props for the {@link Grid} component.
 *
 * @remarks
 * Extends standard HTML attributes and adds CSS Grid-specific layout controls.
 */
export interface GridProps extends React.HTMLAttributes<HTMLElement> {
  /** Render as a custom element. @default 'div' */
  as?: React.ElementType;

  /** Number of columns (number → equal-width) or raw CSS value. @default 1 */
  columns?: GridColumns;

  /** Number of rows (number → equal-height) or raw CSS value. */
  rows?: GridRows;

  /** Gap between all cells, using theme spacing keys. @default 'md' */
  gap?: GridGap;

  /** Horizontal gap between columns (overrides `gap` on column axis). */
  columnGap?: GridGap;

  /** Vertical gap between rows (overrides `gap` on row axis). */
  rowGap?: GridGap;

  /** CSS grid-template-areas string. */
  areas?: string;

  /** CSS grid-auto-flow. @default 'row' */
  flow?: 'row' | 'column' | 'dense' | 'row dense' | 'column dense';

  /** Align items along the block (column) axis. @default 'stretch' */
  alignItems?: GridAlignItems;

  /** Justify items along the inline (row) axis. @default 'stretch' */
  justifyItems?: GridJustifyItems;

  /** Align the grid content within its container (block axis). */
  alignContent?: GridAlignContent;

  /** Justify the grid content within its container (inline axis). */
  justifyContent?: GridJustifyContent;

  /** CSS min-height for auto rows. Useful for consistent row heights. */
  autoRows?: string;

  /** CSS min-width for auto columns. */
  autoColumns?: string;

  /** Enable inline grid (display: inline-grid). @default false */
  inline?: boolean;
}

// ---------------------------------------------------------------------------
// GridItemProps
// ---------------------------------------------------------------------------

/**
 * Props for the {@link GridItem} component.
 *
 * @remarks
 * Controls placement and self-alignment of a child within a {@link Grid}.
 * When `area` is provided, `column` / `row` / `colSpan` / `rowSpan` are ignored.
 */
export interface GridItemProps extends React.HTMLAttributes<HTMLElement> {
  /** Render as a custom element. @default 'div' */
  as?: React.ElementType;

  /** CSS grid-column value (e.g. `"1 / 3"`, `"span 2"`). */
  column?: string;

  /** CSS grid-row value (e.g. `"1 / 3"`, `"span 2"`). */
  row?: string;

  /** CSS grid-area name (used with parent `areas`). */
  area?: string;

  /** Number of columns to span. Shorthand for `column="span N"`. */
  colSpan?: number;

  /** Number of rows to span. Shorthand for `row="span N"`. */
  rowSpan?: number;

  /** Align this item along the block axis. */
  alignSelf?: 'start' | 'center' | 'end' | 'stretch';

  /** Justify this item along the inline axis. */
  justifySelf?: 'start' | 'center' | 'end' | 'stretch';
}
