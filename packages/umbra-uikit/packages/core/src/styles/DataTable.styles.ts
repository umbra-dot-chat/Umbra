/**
 * @module components/data-table
 * @description Style builder functions for the Wisp DataTable component.
 *
 * Each builder computes a `CSSStyleObject` object based on the
 * current size configuration and theme colour tokens.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { DataTableSizeConfig, DataTableVariant } from '../types/DataTable.types';
import { fontFamilyStacks } from '../tokens/shared';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Table Container (outer wrapper <div>)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the outer container `<div>` that wraps
 * the entire table, providing border, border-radius, and scroll overflow.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @param userStyle - Optional consumer style overrides.
 * @returns A `CSSStyleObject` object for the container.
 */
export function buildTableContainerStyle(
  theme: WispTheme,
  variant: DataTableVariant = 'default',
  userStyle?: CSSStyleObject,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  const base: CSSStyleObject = {
    overflow: 'auto',
  };

  if (variant === 'card') {
    return {
      ...base,
      borderRadius: radii.lg,
      border: `1px solid ${themeColors.border.subtle}`,
      backgroundColor: themeColors.background.canvas,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
      ...userStyle,
    };
  }

  return {
    ...base,
    borderRadius: radii.md,
    border: `1px solid ${themeColors.border.subtle}`,
    ...userStyle,
  };
}

// ---------------------------------------------------------------------------
// Table (<table>)
// ---------------------------------------------------------------------------

/**
 * Builds the root `<table>` inline styles.
 *
 * @returns A `CSSStyleObject` object for the `<table>` element.
 */
export function buildTableStyle(): CSSStyleObject {
  return {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Table Header (<thead>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<thead>` inline styles.
 *
 * @param sizeConfig - Resolved size configuration for the active size preset.
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the `<thead>` element.
 */
export function buildTableHeaderStyle(
  sizeConfig: DataTableSizeConfig,
  theme: WispTheme,
  variant: DataTableVariant = 'default',
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    height: sizeConfig.headerHeight,
    backgroundColor: themeColors.background.raised,
    borderBottom: `1px solid ${variant === 'card' ? themeColors.accent.dividerRaised : themeColors.border.subtle}`,
  };
}

// ---------------------------------------------------------------------------
// Table Header Cell (<th>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<th>` header-cell inline styles with size-aware padding,
 * font sizing, and optional sortable cursor.
 *
 * @param sizeConfig - Resolved size configuration for the active size preset.
 * @param themeColors - Resolved theme colour tokens.
 * @param sortable - Whether the column is sortable (changes cursor).
 * @param align - Horizontal text alignment.
 * @returns A `CSSStyleObject` object for the `<th>` element.
 */
export function buildTableHeaderCellStyle(
  sizeConfig: DataTableSizeConfig,
  theme: WispTheme,
  sortable: boolean,
  align: 'left' | 'center' | 'right',
): CSSStyleObject {
  const { colors: themeColors, typography } = theme;
  return {
    padding: `0 ${sizeConfig.paddingX}px`,
    fontSize: sizeConfig.headerFontSize,
    fontWeight: typography.weights.semibold,
    color: themeColors.text.onRaised,
    textAlign: align,
    cursor: sortable ? 'pointer' : 'default',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    border: 'none',
    background: 'none',
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Table Row (<tr>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<tr>` inline styles, resolving the background colour from
 * the current hover, selection, and striped state.
 *
 * @param sizeConfig - Resolved size configuration for the active size preset.
 * @param themeColors - Resolved theme colour tokens.
 * @param isHovered - Whether the row is currently hovered.
 * @param isSelected - Whether the row is currently selected.
 * @param isStriped - Whether the row should receive a striped background.
 * @returns A `CSSStyleObject` object for the `<tr>` element.
 */
export function buildTableRowStyle(
  sizeConfig: DataTableSizeConfig,
  theme: WispTheme,
  isHovered: boolean,
  isSelected: boolean,
  isStriped: boolean,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  let backgroundColor: string | undefined;

  if (isSelected) {
    backgroundColor = themeColors.accent.highlight;
  } else if (isHovered) {
    backgroundColor = themeColors.accent.highlight;
  } else if (isStriped) {
    backgroundColor = themeColors.background.surface;
  }

  return {
    height: sizeConfig.rowHeight,
    borderBottom: `1px solid ${themeColors.border.subtle}`,
    transition: `background-color ${durations.fast}ms ${easings.easeOut.css}`,
    backgroundColor,
  };
}

// ---------------------------------------------------------------------------
// Table Cell (<td>)
// ---------------------------------------------------------------------------

/**
 * Builds the `<td>` data-cell inline styles with size-aware padding,
 * font sizing, and text alignment.
 *
 * @param sizeConfig - Resolved size configuration for the active size preset.
 * @param themeColors - Resolved theme colour tokens.
 * @param align - Horizontal text alignment.
 * @returns A `CSSStyleObject` object for the `<td>` element.
 */
export function buildTableCellStyle(
  sizeConfig: DataTableSizeConfig,
  theme: WispTheme,
  align: 'left' | 'center' | 'right',
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    padding: `0 ${sizeConfig.paddingX}px`,
    fontSize: sizeConfig.fontSize,
    color: themeColors.text.primary,
    textAlign: align,
    verticalAlign: 'middle',
  };
}

// ---------------------------------------------------------------------------
// Sort Icon
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the sort direction indicator icon.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @param isActive - Whether this column is the actively sorted column.
 * @param _direction - Current sort direction (reserved for future use).
 * @returns A `CSSStyleObject` object for the sort icon wrapper.
 */
export function buildSortIconStyle(
  theme: WispTheme,
  isActive: boolean,
  _direction: 'asc' | 'desc',
): CSSStyleObject {
  const { colors: themeColors, spacing } = theme;
  return {
    display: 'inline-flex',
    marginLeft: spacing.xs,
    color: isActive ? themeColors.text.onRaised : themeColors.text.onRaisedSecondary,
  };
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the selection checkbox `<input>`.
 *
 * @param sizeConfig - Resolved size configuration for the active size preset.
 * @returns A `CSSStyleObject` object for the checkbox input.
 */
export function buildCheckboxStyle(
  sizeConfig: DataTableSizeConfig,
): CSSStyleObject {
  return {
    width: sizeConfig.checkboxSize,
    height: sizeConfig.checkboxSize,
    margin: 0,
    cursor: 'pointer',
    accentColor: 'currentColor',
  };
}

// ---------------------------------------------------------------------------
// Checkbox Cell (<td> / <th> for checkbox column)
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the checkbox column cell (both header and body).
 *
 * @param sizeConfig - Resolved size configuration for the active size preset.
 * @returns A `CSSStyleObject` object for the checkbox cell.
 */
export function buildCheckboxCellStyle(
  sizeConfig: DataTableSizeConfig,
): CSSStyleObject {
  return {
    width: sizeConfig.checkboxSize + sizeConfig.paddingX * 2,
    padding: `0 ${sizeConfig.paddingX}px`,
    textAlign: 'center',
    verticalAlign: 'middle',
  };
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for the empty-state message row.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @param sizeConfig - Resolved size configuration for the active size preset.
 * @returns A `CSSStyleObject` object for the empty-state cell.
 */
export function buildEmptyStateStyle(
  theme: WispTheme,
  sizeConfig: DataTableSizeConfig,
): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    padding: `${sizeConfig.rowHeight}px ${sizeConfig.paddingX}px`,
    textAlign: 'center',
    color: themeColors.text.muted,
    fontSize: sizeConfig.fontSize,
    fontFamily: fontFamilyStacks.sans,
  };
}

// ---------------------------------------------------------------------------
// Skeleton Bar
// ---------------------------------------------------------------------------

/**
 * Builds the inline style for a skeleton placeholder bar.
 *
 * @param themeColors - Resolved theme colour tokens.
 * @returns A `CSSStyleObject` object for the skeleton bar element.
 */
export function buildSkeletonBarStyle(
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    height: 12,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
    opacity: 0.5,
  };
}
