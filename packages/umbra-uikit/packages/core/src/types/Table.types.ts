/**
 * @module primitives/table
 * @description Type definitions for the Wisp Table primitive.
 *
 * Exports size, variant, and alignment constants along with the
 * component prop interfaces for every Table sub-component.
 */

import type React from 'react';
import { defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Table Size
// ---------------------------------------------------------------------------

/** Available size presets for the Table primitive. */
export const tableSizes = ['sm', 'md', 'lg'] as const;

/** Union of available table size keys. */
export type TableSize = (typeof tableSizes)[number];

/**
 * Maps each {@link TableSize} to its vertical and horizontal padding
 * values (in pixels) used by table cells and header cells.
 */
export const tableSizePaddingMap: Record<TableSize, { vertical: number; horizontal: number }> = {
  sm: { vertical: 6, horizontal: 8 },
  md: { vertical: 10, horizontal: 12 },
  lg: { vertical: 14, horizontal: 16 },
};

/**
 * Maps each {@link TableSize} to its font-size (in pixels) and
 * line-height multiplier for table cell text.
 */
export const tableSizeFontMap: Record<TableSize, { fontSize: number; lineHeight: number }> = {
  sm: { fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 1.34 },
  md: { fontSize: defaultTypography.sizes.sm.fontSize, lineHeight: 1.43 },
  lg: { fontSize: defaultTypography.sizes.base.fontSize, lineHeight: 1.5 },
};

// ---------------------------------------------------------------------------
// Table Variant
// ---------------------------------------------------------------------------

/** Available visual variants for the Table primitive. */
export const tableVariants = ['default', 'striped'] as const;

/** Union of available table variant keys. */
export type TableVariant = (typeof tableVariants)[number];

// ---------------------------------------------------------------------------
// Cell Alignment
// ---------------------------------------------------------------------------

/** Available horizontal text-alignment options for table cells. */
export const tableCellAlignments = ['left', 'center', 'right'] as const;

/** Union of available cell-alignment keys. */
export type TableCellAlignment = (typeof tableCellAlignments)[number];

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * Shape of the React context value shared by the root `<Table>` with all
 * of its sub-components.
 */
export interface TableContextValue {
  /** Active size preset. */
  size: TableSize;
  /** Active visual variant. */
  variant: TableVariant;
  /** Whether row hover highlighting is enabled. */
  hoverable: boolean;
  /** Whether the table header is sticky. */
  stickyHeader: boolean;
  /** Whether the table is wrapped in a card-like bordered container. */
  bordered: boolean;
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

/** Props for the root {@link Table} component. */
export interface TableProps
  extends Omit<React.HTMLAttributes<HTMLTableElement>, 'children'> {
  /**
   * Table size variant affecting cell padding and font size.
   * @default 'md'
   */
  size?: TableSize;
  /**
   * Visual variant. `'striped'` applies alternating row backgrounds.
   * @default 'default'
   */
  variant?: TableVariant;
  /**
   * When `true`, data rows highlight on mouse hover.
   * @default false
   */
  hoverable?: boolean;
  /**
   * When `true`, the `<thead>` receives sticky positioning so it
   * remains visible while the table body scrolls.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * When `true`, the table is wrapped in a card-like container with
   * rounded corners and a border. The last row's bottom border is
   * hidden for a clean look.
   * @default false
   */
  bordered?: boolean;
  /** Table content — typically {@link TableHeader}, {@link TableBody}, and {@link TableFooter}. */
  children: React.ReactNode;
}

/** Props for the {@link TableHeader} (`<thead>`) sub-component. */
export interface TableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** One or more {@link TableRow} elements containing header cells. */
  children: React.ReactNode;
}

/** Props for the {@link TableBody} (`<tbody>`) sub-component. */
export interface TableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** Data rows rendered inside the table body. */
  children: React.ReactNode;
}

/** Props for the {@link TableFooter} (`<tfoot>`) sub-component. */
export interface TableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  /** Summary or aggregate rows rendered inside the table footer. */
  children: React.ReactNode;
}

/** Props for the {@link TableRow} (`<tr>`) sub-component. */
export interface TableRowProps
  extends React.HTMLAttributes<HTMLTableRowElement> {
  /**
   * Whether this row is visually selected / active.
   * @default false
   */
  selected?: boolean;
  /** Cells rendered inside the row. */
  children: React.ReactNode;
}

/** Props for the {@link TableHead} (`<th>`) sub-component. */
export interface TableHeadProps
  extends React.HTMLAttributes<HTMLTableCellElement> {
  /**
   * Horizontal text alignment inside the header cell.
   * @default 'left'
   */
  align?: TableCellAlignment;
  /** Content of the header cell. */
  children?: React.ReactNode;
}

/** Props for the {@link TableCell} (`<td>`) sub-component. */
export interface TableCellProps
  extends React.HTMLAttributes<HTMLTableCellElement> {
  /**
   * Horizontal text alignment inside the data cell.
   * @default 'left'
   */
  align?: TableCellAlignment;
  /** Content of the data cell. */
  children?: React.ReactNode;
}
