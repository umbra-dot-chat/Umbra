/**
 * DataTable -- A data-driven table component with sorting, selection,
 * striping, hover highlighting, sticky header, and skeleton loading.
 *
 * @remarks
 * Unlike the lower-level {@link Table} primitive which uses a compound
 * sub-component API, DataTable accepts an array of `data` and `columns`
 * and renders the entire table declaratively. It is designed for common
 * data-display use cases where manual composition is unnecessary.
 *
 * Key features:
 * - Three size presets (`sm`, `md`, `lg`) controlling row height, padding, and font size.
 * - Click-to-sort column headers with ascending / descending / none cycling.
 * - Row selection via checkboxes with select-all support.
 * - Striped and hoverable row styles.
 * - Sticky header for scrollable containers.
 * - Skeleton loading state with animated placeholder bars.
 * - Custom cell rendering via column `render` functions.
 * - Empty state with configurable message.
 *
 * @module components/data-table
 * @example
 * ```tsx
 * <DataTable
 *   data={users}
 *   columns={[
 *     { key: 'name', header: 'Name' },
 *     { key: 'email', header: 'Email' },
 *     { key: 'role', header: 'Role' },
 *   ]}
 *   size="md"
 *   hoverable
 *   sortable
 * />
 * ```
 */

import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { DataTableProps, DataTableColumn, SortState } from '@coexist/wisp-core/types/DataTable.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { dataTableSizeMap } from '@coexist/wisp-core/types/DataTable.types';
import {
  buildTableContainerStyle,
  buildTableStyle,
  buildTableHeaderStyle,
  buildTableHeaderCellStyle,
  buildTableRowStyle,
  buildTableCellStyle,
  buildSortIconStyle,
  buildCheckboxStyle,
  buildCheckboxCellStyle,
  buildEmptyStateStyle,
  buildSkeletonBarStyle,
} from '@coexist/wisp-core/styles/DataTable.styles';
import { useTheme } from '../../providers';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Sort Icons
// ---------------------------------------------------------------------------

/** Props shared by sort direction SVG icon components. */
interface SortIconProps {
  /** Icon width and height in pixels. */
  size: number;
  /** Stroke colour applied to the SVG path. */
  color: string;
}

/** Upward-pointing sort arrow (ascending). */
const SortAscIcon: React.FC<SortIconProps> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 15l4-4 4 4" />
  </svg>
);

/** Downward-pointing sort arrow (descending). */
const SortDescIcon: React.FC<SortIconProps> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 9l4 4 4-4" />
  </svg>
);

// ---------------------------------------------------------------------------
// Skeleton keyframes injector
// ---------------------------------------------------------------------------

/** Tracks whether the skeleton pulse keyframes have been injected into the document. */
let skeletonKeyframesInjected = false;

/**
 * Injects the `wisp-skeleton-pulse` CSS keyframes rule into the document
 * head on first invocation. Subsequent calls are no-ops.
 */
function injectSkeletonKeyframes(): void {
  if (skeletonKeyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-skeleton-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.25; } }`;
  document.head.appendChild(style);
  skeletonKeyframesInjected = true;
}

// ---------------------------------------------------------------------------
// DataTable Component
// ---------------------------------------------------------------------------

/**
 * Inner generic implementation. Wrapped by a typed `forwardRef` below.
 *
 * @internal
 */
function DataTableInner<T extends Record<string, any>>(
  {
    data,
    columns,
    size = 'md',
    variant = 'default',
    selectable = false,
    selectedRows,
    onSelectionChange,
    sortable = false,
    sort,
    onSortChange,
    striped = false,
    hoverable = true,
    stickyHeader = false,
    emptyMessage = 'No data',
    skeleton = false,
    skeletonRows = 5,
    style: userStyle,
    ...rest
  }: DataTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = dataTableSizeMap[size];

  // -- Hover tracking per row ------------------------------------------------
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  // -- Inject skeleton keyframes when skeleton mode is active ----------------
  if (skeleton) {
    injectSkeletonKeyframes();
  }

  // -- Memoised styles -------------------------------------------------------
  const containerStyle = useMemo(
    () => buildTableContainerStyle(theme, variant, userStyle as CSSStyleObject),
    [theme, variant, userStyle],
  );
  const tableStyle = useMemo(() => buildTableStyle(), [theme]);
  const headerStyle = useMemo(
    () => buildTableHeaderStyle(sizeConfig, theme, variant),
    [sizeConfig, theme, variant],
  );
  const checkboxCellStyle = useMemo(
    () => buildCheckboxCellStyle(sizeConfig),
    [sizeConfig],
  );
  const checkboxStyle = useMemo(
    () => buildCheckboxStyle(sizeConfig),
    [sizeConfig],
  );
  const emptyStyle = useMemo(
    () => buildEmptyStateStyle(theme, sizeConfig),
    [theme, sizeConfig],
  );
  const skeletonBarStyle = useMemo(
    () => buildSkeletonBarStyle(theme),
    [theme],
  );

  // -- Sort handler ----------------------------------------------------------
  const handleSort = useCallback(
    (columnKey: string) => {
      if (!onSortChange) return;
      if (sort && sort.key === columnKey) {
        if (sort.direction === 'asc') {
          onSortChange({ key: columnKey, direction: 'desc' });
        } else {
          onSortChange(null);
        }
      } else {
        onSortChange({ key: columnKey, direction: 'asc' });
      }
    },
    [sort, onSortChange],
  );

  // -- Selection handlers ----------------------------------------------------
  const selected = selectedRows ?? new Set<number>();

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (selected.size === data.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((_, i) => i)));
    }
  }, [onSelectionChange, selected, data]);

  const handleSelectRow = useCallback(
    (rowIndex: number) => {
      if (!onSelectionChange) return;
      const next = new Set(selected);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      onSelectionChange(next);
    },
    [onSelectionChange, selected],
  );

  const allSelected = data.length > 0 && selected.size === data.length;
  const someSelected = selected.size > 0 && selected.size < data.length;

  // -- Sticky header style ---------------------------------------------------
  const stickyHeaderRowStyle: React.CSSProperties | undefined = stickyHeader
    ? { position: 'sticky', top: 0, zIndex: 2 }
    : undefined;

  // -- Total column count including checkbox ---------------------------------
  const totalColumns = columns.length + (selectable ? 1 : 0);

  // -- Render header cells ---------------------------------------------------
  const renderHeaderCells = () => {
    const cells: React.ReactNode[] = [];

    if (selectable) {
      cells.push(
        <th key="__checkbox" style={{ ...checkboxCellStyle, ...headerStyle }}>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={handleSelectAll}
            style={checkboxStyle}
            aria-label="Select all rows"
          />
        </th>,
      );
    }

    columns.forEach((col) => {
      const isSortable = sortable && col.sortable !== false;
      const isActiveSort = sort?.key === col.key;
      const cellStyle = buildTableHeaderCellStyle(
        sizeConfig,
        theme,
        isSortable,
        col.align ?? 'left',
      );

      cells.push(
        <th
          key={col.key}
          style={cellStyle}
          onClick={isSortable ? () => handleSort(col.key) : undefined}
          aria-sort={
            isActiveSort
              ? sort!.direction === 'asc'
                ? 'ascending'
                : 'descending'
              : undefined
          }
        >
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {col.header}
            {isSortable && isActiveSort && (
              <span
                style={buildSortIconStyle(
                  theme,
                  true,
                  sort!.direction,
                )}
              >
                {sort!.direction === 'asc' ? (
                  <SortAscIcon size={sizeConfig.headerFontSize} color="currentColor" />
                ) : (
                  <SortDescIcon size={sizeConfig.headerFontSize} color="currentColor" />
                )}
              </span>
            )}
            {isSortable && !isActiveSort && (
              <span style={buildSortIconStyle(theme, false, 'asc')}>
                <SortAscIcon size={sizeConfig.headerFontSize} color="currentColor" />
              </span>
            )}
          </span>
        </th>,
      );
    });

    return cells;
  };

  // -- Render body rows ------------------------------------------------------
  const renderBodyRows = () => {
    if (skeleton) {
      return Array.from({ length: skeletonRows }, (_, rowIndex) => {
        const rowStyle = buildTableRowStyle(
          sizeConfig,
          theme,
          false,
          false,
          false,
        );
        return (
          <tr key={`skeleton-${rowIndex}`} style={rowStyle}>
            {selectable && (
              <td style={checkboxCellStyle}>
                <div style={{ ...skeletonBarStyle, width: sizeConfig.checkboxSize, height: sizeConfig.checkboxSize, borderRadius: defaultRadii.sm }} />
              </td>
            )}
            {columns.map((col, colIndex) => {
              const cellStyle = buildTableCellStyle(sizeConfig, theme, col.align ?? 'left');
              // Vary skeleton bar width for visual interest
              const widths = ['60%', '80%', '45%', '70%', '55%'];
              return (
                <td key={col.key} style={cellStyle}>
                  <div style={{ ...skeletonBarStyle, width: widths[colIndex % widths.length] }} />
                </td>
              );
            })}
          </tr>
        );
      });
    }

    if (data.length === 0) {
      return (
        <tr>
          <td colSpan={totalColumns} style={emptyStyle}>
            {emptyMessage}
          </td>
        </tr>
      );
    }

    return data.map((row, rowIndex) => {
      const isSelected = selected.has(rowIndex);
      const isHovered = hoverable && hoveredRow === rowIndex;
      const isStriped = striped && rowIndex % 2 === 1;
      const rowStyle = buildTableRowStyle(
        sizeConfig,
        theme,
        isHovered,
        isSelected,
        isStriped,
      );

      return (
        <tr
          key={rowIndex}
          style={rowStyle}
          onMouseEnter={hoverable ? () => setHoveredRow(rowIndex) : undefined}
          onMouseLeave={hoverable ? () => setHoveredRow(null) : undefined}
          aria-selected={isSelected || undefined}
        >
          {selectable && (
            <td style={checkboxCellStyle}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectRow(rowIndex)}
                style={checkboxStyle}
                aria-label={`Select row ${rowIndex + 1}`}
              />
            </td>
          )}
          {columns.map((col) => {
            const cellValue = (row as any)[col.key];
            const cellStyle = buildTableCellStyle(sizeConfig, theme, col.align ?? 'left');
            return (
              <td key={col.key} style={cellStyle}>
                {col.render ? col.render(cellValue, row) : cellValue}
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return (
    <div ref={ref} {...rest} style={containerStyle}>
      <table style={tableStyle} role="table">
        <thead style={stickyHeaderRowStyle}>
          <tr style={headerStyle}>
            {renderHeaderCells()}
          </tr>
        </thead>
        <tbody>
          {renderBodyRows()}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Generic-aware `forwardRef` wrapper for the DataTable component.
 *
 * @remarks
 * TypeScript's `forwardRef` does not natively support generics, so we
 * cast the inner component to preserve the generic `<T>` parameter in
 * the public API.
 */
export const DataTable = forwardRef(DataTableInner) as <T extends Record<string, any>>(
  props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement | null;

(DataTable as any).displayName = 'DataTable';
