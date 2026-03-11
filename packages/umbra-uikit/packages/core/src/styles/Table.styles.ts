/**
 * @module primitives/table
 * @description Style builder functions for the Table primitive and its sub-components.
 *
 * Each builder computes a `CSSStyleObject` object that is merged
 * with an optional consumer-provided `userStyle` override.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { TableSize, TableCellAlignment, TableVariant } from '../types/Table.types';
import { tableSizePaddingMap, tableSizeFontMap } from '../types/Table.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Table bordered wrapper (<div>)
// ---------------------------------------------------------------------------

/**
 * Builds the inline styles for the card-like wrapper `<div>` that encloses
 * the `<table>` when the `bordered` prop is enabled.
 *
 * @param themeColors - Current theme colour tokens.
 * @returns CSS properties for the bordered wrapper.
 */
export function buildTableBorderedWrapperStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    border: `1px solid ${themeColors.border.subtle}`,
    borderRadius: radii.md,
    overflow: 'hidden',
  };
}

// ---------------------------------------------------------------------------
// Table (root <table>)
// ---------------------------------------------------------------------------

/**
 * Builds the root `<table>` inline styles.
 *
 * @param themeColors - Current theme colour tokens.
 * @param userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the `<table>` element.
 */
export function buildTableStyle(
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
    fontFamily: fontFamilyStacks.sans,
    color: themeColors.text.primary,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// TableHeader (<thead>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<thead>` inline styles, optionally applying sticky
 * positioning when the table's `stickyHeader` flag is set.
 *
 * @param stickyHeader - Whether the header should stick to the scroll container.
 * @param themeColors - Current theme colour tokens.
 * @param userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the `<thead>` element.
 */
export function buildTableHeaderStyle(
  stickyHeader: boolean,
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  const base: CSSStyleObject = {};

  if (stickyHeader) {
    base.position = 'sticky';
    base.top = 0;
    base.zIndex = 2;
    base.backgroundColor = themeColors.background.sunken;
  }

  return { ...base, ...userStyle };
}

// ---------------------------------------------------------------------------
// TableBody (<tbody>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<tbody>` inline styles.
 *
 * @param userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the `<tbody>` element.
 */
export function buildTableBodyStyle(
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  return { ...userStyle };
}

// ---------------------------------------------------------------------------
// TableFooter (<tfoot>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<tfoot>` inline styles with a subtle top border and
 * surface background.
 *
 * @param themeColors - Current theme colour tokens.
 * @param userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the `<tfoot>` element.
 */
export function buildTableFooterStyle(
  theme: WispTheme,
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    borderTop: '1px solid ' + themeColors.border.subtle,
    backgroundColor: themeColors.background.sunken,
    fontWeight: typography.weights.medium,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// TableRow (<tr>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<tr>` inline styles, resolving the background colour
 * from the current selection, hover, and striped-variant state.
 *
 * @param opts - Configuration bag containing row state and theme colours.
 * @param opts.hoverable - Whether hover highlighting is enabled.
 * @param opts.hovered - Whether the row is currently hovered.
 * @param opts.selected - Whether the row is selected.
 * @param opts.variant - Active table variant (`'default'` or `'striped'`).
 * @param opts.isEvenRow - Whether this is a visually even row (for striping).
 * @param opts.isHeaderRow - Whether the row lives inside a `<thead>`.
 * @param opts.themeColors - Current theme colour tokens.
 * @param opts.userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the `<tr>` element.
 */
export function buildTableRowStyle(opts: {
  hoverable: boolean;
  hovered: boolean;
  selected: boolean;
  variant: TableVariant;
  isEvenRow: boolean;
  isHeaderRow: boolean;
  bordered: boolean;
  isLastRow: boolean;
  theme: WispTheme;
  userStyle?: CSSStyleObject;
}): CSSStyleObject {
  const { colors: themeColors } = opts.theme;
  let backgroundColor: string | undefined;

  if (opts.selected) {
    backgroundColor = themeColors.accent.highlight;
  } else if (opts.hoverable && opts.hovered && !opts.isHeaderRow) {
    backgroundColor = themeColors.accent.highlight;
  } else if (opts.variant === 'striped' && opts.isEvenRow && !opts.isHeaderRow) {
    backgroundColor = themeColors.accent.highlight;
  }

  // Hide the bottom border on the last body row when bordered,
  // so it doesn't double up against the wrapper border.
  const hideBorder = opts.bordered && opts.isLastRow && !opts.isHeaderRow;

  return {
    borderBottom: hideBorder ? 'none' : '1px solid ' + themeColors.border.subtle,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    backgroundColor,
    ...opts.userStyle,
  };
}

// ---------------------------------------------------------------------------
// TableHead (<th>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<th>` header-cell inline styles with size-aware padding,
 * font sizing, and text alignment.
 *
 * @param opts - Configuration bag containing size, alignment, and theme colours.
 * @param opts.size - Active table size preset.
 * @param opts.align - Horizontal text alignment.
 * @param opts.themeColors - Current theme colour tokens.
 * @param opts.userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the `<th>` element.
 */
export function buildTableHeadStyle(opts: {
  size: TableSize;
  align: TableCellAlignment;
  theme: WispTheme;
  userStyle?: CSSStyleObject;
}): CSSStyleObject {
  const { colors: themeColors, typography } = opts.theme;
  const padding = tableSizePaddingMap[opts.size];
  const font = tableSizeFontMap[opts.size];

  return {
    padding: `${padding.vertical}px ${padding.horizontal}px`,
    textAlign: opts.align,
    fontSize: font.fontSize,
    lineHeight: font.lineHeight,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.secondary,
    backgroundColor: themeColors.background.sunken,
    whiteSpace: 'nowrap',
    ...opts.userStyle,
  };
}

// ---------------------------------------------------------------------------
// TableCell (<td>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<td>` data-cell inline styles with size-aware padding,
 * font sizing, and text alignment.
 *
 * @param opts - Configuration bag containing size, alignment, and theme colours.
 * @param opts.size - Active table size preset.
 * @param opts.align - Horizontal text alignment.
 * @param opts.themeColors - Current theme colour tokens.
 * @param opts.userStyle - Optional consumer style overrides.
 * @returns Merged CSS properties for the `<td>` element.
 */
export function buildTableCellStyle(opts: {
  size: TableSize;
  align: TableCellAlignment;
  theme: WispTheme;
  userStyle?: CSSStyleObject;
}): CSSStyleObject {
  const { colors: themeColors, typography } = opts.theme;
  const padding = tableSizePaddingMap[opts.size];
  const font = tableSizeFontMap[opts.size];

  return {
    padding: `${padding.vertical}px ${padding.horizontal}px`,
    textAlign: opts.align,
    fontSize: font.fontSize,
    lineHeight: font.lineHeight,
    fontWeight: typography.weights.regular,
    color: themeColors.text.primary,
    ...opts.userStyle,
  };
}
