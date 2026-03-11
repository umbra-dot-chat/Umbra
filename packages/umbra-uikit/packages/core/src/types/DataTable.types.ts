/**
 * @module components/data-table
 * @description Type definitions for the Wisp DataTable component.
 *
 * Exports size constants, size configuration maps, column definition,
 * sort state, and the main component prop interface.
 */

import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// DataTable Size
// ---------------------------------------------------------------------------

/** Available size presets for the DataTable component. */
export const dataTableSizes = ['sm', 'md', 'lg'] as const;

/** Union of allowed DataTable size values. */
export type DataTableSize = (typeof dataTableSizes)[number];

/** Dimensional configuration for a single DataTable size preset. */
export interface DataTableSizeConfig {
  /** Row height in pixels. */
  rowHeight: number;
  /** Header row height in pixels. */
  headerHeight: number;
  /** Body cell font size in pixels. */
  fontSize: number;
  /** Header cell font size in pixels. */
  headerFontSize: number;
  /** Horizontal cell padding in pixels. */
  paddingX: number;
  /** Checkbox size in pixels (when selectable). */
  checkboxSize: number;
}

/**
 * Maps each {@link DataTableSize} to its {@link DataTableSizeConfig}.
 *
 * @remarks
 * Used internally by the DataTable component and its style builders to
 * resolve sizing tokens.
 */
export const dataTableSizeMap: Record<DataTableSize, DataTableSizeConfig> = {
  sm: { rowHeight: 36, headerHeight: 32, fontSize: defaultTypography.sizes.xs.fontSize, headerFontSize: 11, paddingX: defaultSpacing.md, checkboxSize: 14 },
  md: { rowHeight: 44, headerHeight: 40, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 12, paddingX: defaultSpacing.lg, checkboxSize: 16 },
  lg: { rowHeight: 52, headerHeight: 48, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 13, paddingX: defaultSpacing.xl, checkboxSize: 18 },
};

// ---------------------------------------------------------------------------
// DataTable Variant
// ---------------------------------------------------------------------------

/** Visual variant presets for the DataTable component. */
export const dataTableVariants = ['default', 'card'] as const;

/** Union of allowed DataTable variant values. */
export type DataTableVariant = (typeof dataTableVariants)[number];

// ---------------------------------------------------------------------------
// Column Definition
// ---------------------------------------------------------------------------

/**
 * Describes a single column in the DataTable, including its data key,
 * header label, optional width, sort capability, custom renderer, and
 * text alignment.
 *
 * @typeParam T - The row data type.
 */
export interface DataTableColumn<T> {
  /** Property key used to access the cell value from a row object. */
  key: string;
  /** Header label displayed in the column header cell. */
  header: string;
  /** Optional fixed or percentage width for the column (number = px, string = CSS value). */
  width?: number | string;
  /** Whether this column supports click-to-sort. */
  sortable?: boolean;
  /** Custom cell renderer. Receives the cell value and the full row object. */
  render?: (value: any, row: T) => React.ReactNode;
  /**
   * Horizontal text alignment for the column.
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';
}

// ---------------------------------------------------------------------------
// Sort State
// ---------------------------------------------------------------------------

/**
 * Represents the current sort state of the DataTable.
 *
 * @remarks
 * When `null`, no sorting is active. Otherwise holds the column key
 * and sort direction.
 */
export type SortState = { key: string; direction: 'asc' | 'desc' } | null;

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link DataTable} component.
 *
 * @typeParam T - The row data type.
 */
export interface DataTableProps<T>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** Array of row data objects to display. */
  data: T[];
  /** Column definitions describing header labels, keys, widths, and renderers. */
  columns: DataTableColumn<T>[];
  /**
   * Controls the visual size of the table (row height, padding, font size).
   * @default 'md'
   */
  size?: DataTableSize;
  /**
   * Visual variant. `'default'` renders a flat bordered table; `'card'`
   * wraps the table in a rounded card with subtle shadow.
   * @default 'default'
   */
  variant?: DataTableVariant;
  /**
   * When `true`, renders a checkbox column for row selection.
   * @default false
   */
  selectable?: boolean;
  /** Set of selected row indices (controlled). */
  selectedRows?: Set<number>;
  /** Callback fired when the selection changes. Receives the updated set of selected row indices. */
  onSelectionChange?: (selected: Set<number>) => void;
  /**
   * When `true`, enables column header click-to-sort behaviour.
   * @default false
   */
  sortable?: boolean;
  /** Current sort state (controlled). */
  sort?: SortState;
  /** Callback fired when the sort state changes. */
  onSortChange?: (sort: SortState) => void;
  /**
   * When `true`, applies alternating row backgrounds.
   * @default false
   */
  striped?: boolean;
  /**
   * When `true`, rows highlight on mouse hover.
   * @default true
   */
  hoverable?: boolean;
  /**
   * When `true`, the header row receives sticky positioning so it
   * remains visible while the table body scrolls.
   * @default false
   */
  stickyHeader?: boolean;
  /**
   * Message displayed when `data` is empty.
   * @default 'No data'
   */
  emptyMessage?: string;
  /**
   * When `true`, renders placeholder skeleton rows instead of data.
   * @default false
   */
  skeleton?: boolean;
  /**
   * Number of skeleton rows to render when `skeleton` is `true`.
   * @default 5
   */
  skeletonRows?: number;
}
