/**
 * Table — A compound data-table component for displaying tabular information.
 *
 * @remarks
 * The Table primitive is composed of several sub-components that mirror
 * native HTML table elements: {@link TableHeader}, {@link TableBody},
 * {@link TableFooter}, {@link TableRow}, {@link TableHead}, and
 * {@link TableCell}. All sub-components must be rendered inside a
 * `<Table>` root, which provides shared context for size, variant,
 * hoverable, and sticky-header settings.
 *
 * Key features:
 * - Three size presets (`sm`, `md`, `lg`) controlling padding and font size.
 * - `striped` variant for alternating row backgrounds.
 * - Optional hover highlighting and sticky header support.
 * - Full WAI-ARIA table semantics out of the box.
 *
 * @module primitives/table
 * @example
 * ```tsx
 * <Table size="md" variant="striped" hoverable>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Name</TableHead>
 *       <TableHead align="right">Price</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>Widget</TableCell>
 *       <TableCell align="right">$4.99</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */

import React, {
  forwardRef,
  useMemo,
  useCallback,
  useState,
  createContext,
  useContext,
} from 'react';
import type {
  TableProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableContextValue,
} from '@coexist/wisp-core/types/Table.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import {
  buildTableBorderedWrapperStyle,
  buildTableStyle,
  buildTableHeaderStyle,
  buildTableBodyStyle,
  buildTableFooterStyle,
  buildTableRowStyle,
  buildTableHeadStyle,
  buildTableCellStyle,
} from '@coexist/wisp-core/styles/Table.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/** @internal React context that distributes shared table settings to sub-components. */
const TableContext = createContext<TableContextValue | null>(null);

/**
 * Returns the nearest {@link TableContextValue} or throws if called
 * outside a `<Table>` provider.
 *
 * @internal
 */
function useTableContext(): TableContextValue {
  const ctx = useContext(TableContext);
  if (ctx === null) {
    throw new Error('[Wisp] Table sub-components must be used within <Table>.');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Table (root)
// ---------------------------------------------------------------------------

/**
 * Root table component that renders an HTML `<table>` and provides
 * context for all child sub-components.
 *
 * @remarks
 * Accepts {@link TableProps} for size, variant, hoverable, and stickyHeader
 * configuration. Forwards a ref to the underlying `<table>` element.
 *
 * @example
 * ```tsx
 * <Table size="lg" stickyHeader>
 *   {/* TableHeader, TableBody, etc. *\/}
 * </Table>
 * ```
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    size = 'md',
    variant = 'default',
    hoverable = false,
    stickyHeader = false,
    bordered = false,
    children,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const contextValue = useMemo<TableContextValue>(
    () => ({ size, variant, hoverable, stickyHeader, bordered }),
    [size, variant, hoverable, stickyHeader, bordered],
  );

  const tableStyle = useMemo(
    () => buildTableStyle(theme, userStyle as CSSStyleObject),
    [theme, userStyle],
  );

  const wrapperStyle = useMemo(
    () => (bordered ? buildTableBorderedWrapperStyle(theme) : undefined),
    [bordered, theme],
  );

  const table = (
    <table ref={ref} className={className} style={tableStyle} role="table" {...rest}>
      {children}
    </table>
  );

  return (
    <TableContext.Provider value={contextValue}>
      {bordered ? <div style={wrapperStyle}>{table}</div> : table}
    </TableContext.Provider>
  );
});
Table.displayName = 'Table';

// ---------------------------------------------------------------------------
// TableHeader (<thead>)
// ---------------------------------------------------------------------------

/**
 * Renders an HTML `<thead>` element. When {@link TableProps.stickyHeader}
 * is enabled, the header receives sticky positioning via
 * {@link buildTableHeaderStyle}.
 */
export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ children, className, style: userStyle, ...rest }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { stickyHeader } = useTableContext();

    const headerStyle = useMemo(
      () => buildTableHeaderStyle(stickyHeader, theme, userStyle as CSSStyleObject),
      [stickyHeader, theme, userStyle],
    );

    return (
      <thead ref={ref} className={className} style={headerStyle} {...rest}>
        {children}
      </thead>
    );
  },
);
TableHeader.displayName = 'TableHeader';

// ---------------------------------------------------------------------------
// TableBody (<tbody>)
// ---------------------------------------------------------------------------

/**
 * Renders an HTML `<tbody>` element that wraps the table's data rows.
 */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody({ children, className, style: userStyle, ...rest }, ref) {
    const bodyStyle = useMemo(
      () => buildTableBodyStyle(userStyle as CSSStyleObject),
      [userStyle],
    );

    return (
      <tbody ref={ref} className={className} style={bodyStyle} {...rest}>
        {children}
      </tbody>
    );
  },
);
TableBody.displayName = 'TableBody';

// ---------------------------------------------------------------------------
// TableFooter (<tfoot>)
// ---------------------------------------------------------------------------

/**
 * Renders an HTML `<tfoot>` element with a subtle top border and
 * surface background for summary or aggregate rows.
 */
export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  function TableFooter({ children, className, style: userStyle, ...rest }, ref) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const footerStyle = useMemo(
      () => buildTableFooterStyle(theme, userStyle as CSSStyleObject),
      [theme, userStyle],
    );

    return (
      <tfoot ref={ref} className={className} style={footerStyle} {...rest}>
        {children}
      </tfoot>
    );
  },
);
TableFooter.displayName = 'TableFooter';

// ---------------------------------------------------------------------------
// TableRow (<tr>)
// ---------------------------------------------------------------------------

/**
 * Internal helper that determines whether a `<tr>` lives inside a
 * `<thead>`. Avoids a second React context by inspecting the parent
 * DOM element directly.
 *
 * @param node - The table row DOM element, or `null` before mount.
 * @returns `true` when the row's parent is a `<thead>`.
 * @internal
 */
function useIsHeaderRow(node: HTMLTableRowElement | null): boolean {
  if (!node) return false;
  return node.parentElement?.tagName === 'THEAD';
}

/**
 * Internal helper that returns the 0-based index of a `<tr>` among its
 * siblings so that the `striped` variant can colour even rows.
 *
 * @param node - The table row DOM element, or `null` before mount.
 * @returns The 0-based sibling index of the row.
 * @internal
 */
function useRowIndex(node: HTMLTableRowElement | null): number {
  if (!node || !node.parentElement) return 0;
  return Array.prototype.indexOf.call(node.parentElement.children, node);
}

/**
 * Internal helper that determines whether a `<tr>` is the last child
 * of its parent section, used to hide the bottom border in bordered mode.
 *
 * @param node - The table row DOM element, or `null` before mount.
 * @returns `true` when this is the last row in its section.
 * @internal
 */
function useIsLastRow(node: HTMLTableRowElement | null): boolean {
  if (!node || !node.parentElement) return false;
  return node === node.parentElement.lastElementChild;
}

/**
 * Renders an HTML `<tr>` element with support for hover highlighting,
 * selection state, and striped-variant background colouring.
 *
 * @remarks
 * Uses a merged ref strategy to read its own DOM position for striped
 * row logic without requiring an additional React context.
 */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow(
    { selected = false, children, className, style: userStyle, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { variant, hoverable, bordered } = useTableContext();

    const [hovered, setHovered] = useState(false);
    const [rowNode, setRowNode] = useState<HTMLTableRowElement | null>(null);

    const isHeaderRow = useIsHeaderRow(rowNode);
    const rowIndex = useRowIndex(rowNode);
    const isEvenRow = rowIndex % 2 === 1; // 0-indexed, so index 1,3,5 are visually "even" (2nd,4th,6th)
    const isLastRow = useIsLastRow(rowNode);

    // Merge forwarded ref + internal ref
    const setRefs = useCallback(
      (node: HTMLTableRowElement | null) => {
        setRowNode(node);
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
        }
      },
      [ref],
    );

    const handleMouseEnter = useCallback(() => {
      if (hoverable) setHovered(true);
    }, [hoverable]);

    const handleMouseLeave = useCallback(() => {
      setHovered(false);
    }, []);

    const rowStyle = useMemo(
      () =>
        buildTableRowStyle({
          hoverable,
          hovered,
          selected,
          variant,
          isEvenRow,
          isHeaderRow,
          bordered,
          isLastRow,
          theme,
          userStyle: userStyle as CSSStyleObject,
        }),
      [hoverable, hovered, selected, variant, isEvenRow, isHeaderRow, bordered, isLastRow, theme, userStyle],
    );

    return (
      <tr
        ref={setRefs}
        className={className}
        style={rowStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-selected={selected || undefined}
        {...rest}
      >
        {children}
      </tr>
    );
  },
);
TableRow.displayName = 'TableRow';

// ---------------------------------------------------------------------------
// TableHead (<th>)
// ---------------------------------------------------------------------------

/**
 * Renders an HTML `<th>` header cell with configurable text alignment
 * and size-aware padding and font styling.
 */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead(
    { align = 'left', children, className, style: userStyle, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { size } = useTableContext();

    const headStyle = useMemo(
      () => buildTableHeadStyle({ size, align, theme, userStyle: userStyle as CSSStyleObject }),
      [size, align, theme, userStyle],
    );

    return (
      <th ref={ref} className={className} style={headStyle} scope="col" {...rest}>
        {children}
      </th>
    );
  },
);
TableHead.displayName = 'TableHead';

// ---------------------------------------------------------------------------
// TableCell (<td>)
// ---------------------------------------------------------------------------

/**
 * Renders an HTML `<td>` data cell with configurable text alignment
 * and size-aware padding and font styling.
 */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell(
    { align = 'left', children, className, style: userStyle, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const { size } = useTableContext();

    const cellStyle = useMemo(
      () => buildTableCellStyle({ size, align, theme, userStyle: userStyle as CSSStyleObject }),
      [size, align, theme, userStyle],
    );

    return (
      <td ref={ref} className={className} style={cellStyle} {...rest}>
        {children}
      </td>
    );
  },
);
TableCell.displayName = 'TableCell';
