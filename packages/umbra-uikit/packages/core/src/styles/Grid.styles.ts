/**
 * Style builders for the {@link Grid} and {@link GridItem} components.
 *
 * @module primitives/grid
 */

import type { CSSStyleObject } from '../types';
import type { ThemeSpacing } from '../theme/types';
import type {
  GridGap,
  GridColumns,
  GridRows,
  GridAlignItems,
  GridJustifyItems,
  GridAlignContent,
  GridJustifyContent,
} from '../types/Grid.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Convert a numeric column count to a CSS `repeat()` expression,
 * or pass through a raw CSS string.
 *
 * @param columns - Column count or raw CSS grid-template-columns value.
 * @returns A valid CSS `grid-template-columns` string.
 */
function resolveColumns(columns: GridColumns): string {
  return typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns;
}

/**
 * Convert a numeric row count to a CSS `repeat()` expression,
 * or pass through a raw CSS string.
 *
 * @param rows - Row count or raw CSS grid-template-rows value.
 * @returns A valid CSS `grid-template-rows` string.
 */
function resolveRows(rows: GridRows): string {
  return typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows;
}

/**
 * Map shorthand alignment tokens (`'between'`, `'around'`, `'evenly'`)
 * to their CSS `space-*` equivalents.
 *
 * @param value - Alignment shorthand or standard CSS value.
 * @returns The resolved CSS alignment value.
 */
function resolveContentAlignment(value: string): string {
  const map: Record<string, string> = {
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  };
  return map[value] ?? value;
}

// ---------------------------------------------------------------------------
// buildGridStyle
// ---------------------------------------------------------------------------

/**
 * Build the inline `CSSProperties` object for a {@link Grid} container.
 *
 * @param opts - Grid layout options including spacing tokens, template definitions,
 *               gap sizes, flow direction, and alignment values.
 * @returns A `CSSStyleObject` object ready to be applied as an inline style.
 */
export function buildGridStyle(opts: {
  spacing: ThemeSpacing;
  columns?: GridColumns;
  rows?: GridRows;
  gap?: GridGap;
  columnGap?: GridGap;
  rowGap?: GridGap;
  areas?: string;
  flow?: string;
  alignItems?: GridAlignItems;
  justifyItems?: GridJustifyItems;
  alignContent?: GridAlignContent;
  justifyContent?: GridJustifyContent;
  autoRows?: string;
  autoColumns?: string;
  inline?: boolean;
}): CSSStyleObject {
  const { spacing } = opts;
  const style: CSSStyleObject = {};

  style.display = opts.inline ? 'inline-grid' : 'grid';

  // Template
  if (opts.columns !== undefined) {
    style.gridTemplateColumns = resolveColumns(opts.columns);
  }
  if (opts.rows !== undefined) {
    style.gridTemplateRows = resolveRows(opts.rows);
  }
  if (opts.areas !== undefined) {
    style.gridTemplateAreas = opts.areas;
  }

  // Gap
  if (opts.columnGap !== undefined || opts.rowGap !== undefined) {
    if (opts.columnGap !== undefined) style.columnGap = spacing[opts.columnGap];
    if (opts.rowGap !== undefined) style.rowGap = spacing[opts.rowGap];
    // Fill in default gap for the axis not explicitly set
    if (opts.columnGap === undefined && opts.gap !== undefined) style.columnGap = spacing[opts.gap];
    if (opts.rowGap === undefined && opts.gap !== undefined) style.rowGap = spacing[opts.gap];
  } else if (opts.gap !== undefined) {
    style.gap = spacing[opts.gap];
  }

  // Flow
  if (opts.flow !== undefined) style.gridAutoFlow = opts.flow;

  // Alignment
  if (opts.alignItems !== undefined) style.alignItems = opts.alignItems;
  if (opts.justifyItems !== undefined) style.justifyItems = opts.justifyItems;
  if (opts.alignContent !== undefined) {
    style.alignContent = resolveContentAlignment(opts.alignContent);
  }
  if (opts.justifyContent !== undefined) {
    style.justifyContent = resolveContentAlignment(opts.justifyContent);
  }

  // Auto sizing
  if (opts.autoRows !== undefined) style.gridAutoRows = opts.autoRows;
  if (opts.autoColumns !== undefined) style.gridAutoColumns = opts.autoColumns;

  return style;
}

// ---------------------------------------------------------------------------
// buildGridItemStyle
// ---------------------------------------------------------------------------

/**
 * Build the inline `CSSProperties` object for a {@link GridItem}.
 *
 * @remarks
 * When `area` is provided the item is placed by named area and explicit
 * `column` / `row` values are ignored.
 *
 * @param opts - Placement options including column/row positions, spans,
 *               named area, and self-alignment overrides.
 * @returns A `CSSStyleObject` object ready to be applied as an inline style.
 */
export function buildGridItemStyle(opts: {
  column?: string;
  row?: string;
  area?: string;
  colSpan?: number;
  rowSpan?: number;
  alignSelf?: string;
  justifySelf?: string;
}): CSSStyleObject {
  const style: CSSStyleObject = {};

  if (opts.area !== undefined) {
    style.gridArea = opts.area;
  } else {
    if (opts.column !== undefined) {
      style.gridColumn = opts.column;
    } else if (opts.colSpan !== undefined) {
      style.gridColumn = `span ${opts.colSpan}`;
    }

    if (opts.row !== undefined) {
      style.gridRow = opts.row;
    } else if (opts.rowSpan !== undefined) {
      style.gridRow = `span ${opts.rowSpan}`;
    }
  }

  if (opts.alignSelf !== undefined) style.alignSelf = opts.alignSelf;
  if (opts.justifySelf !== undefined) style.justifySelf = opts.justifySelf;

  return style;
}
