import React, { forwardRef, useMemo } from 'react';
import type { GridProps, GridItemProps } from '@coexist/wisp-core/types/Grid.types';
import { buildGridStyle, buildGridItemStyle } from '@coexist/wisp-core/styles/Grid.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

/**
 * Grid -- CSS Grid layout primitive for the Wisp design system.
 *
 * @remarks
 * Provides a declarative interface to CSS Grid with token-based gaps,
 * responsive columns, named template areas, and alignment props.
 * Renders as a polymorphic element via the {@link GridProps.as | as} prop.
 *
 * Key features:
 * - Token-based `gap`, `columnGap`, and `rowGap` mapped to {@link ThemeSpacing}
 * - Numeric `columns`/`rows` shorthand converted to `repeat(n, 1fr)`
 * - Named `areas` for template-area layouts
 * - Full CSS Grid alignment surface (`alignItems`, `justifyItems`, `alignContent`, `justifyContent`)
 * - Inline grid support via the `inline` prop
 *
 * @see {@link GridItem} for child placement helpers.
 *
 * @module primitives/grid
 * @example
 * ```tsx
 * <Grid columns={3} gap="lg">
 *   <GridItem>Cell 1</GridItem>
 *   <GridItem>Cell 2</GridItem>
 *   <GridItem colSpan={2}>Wide cell</GridItem>
 * </Grid>
 * ```
 *
 * @example Named areas
 * ```tsx
 * <Grid
 *   areas={`"header header" "sidebar main"`}
 *   columns="200px 1fr"
 *   gap="md"
 * >
 *   <GridItem area="header">Header</GridItem>
 *   <GridItem area="sidebar">Sidebar</GridItem>
 *   <GridItem area="main">Main</GridItem>
 * </Grid>
 * ```
 */
export const Grid = forwardRef<HTMLElement, GridProps>(function Grid(
  {
    children,
    as: Component = 'div',
    columns,
    rows,
    gap = 'md',
    columnGap,
    rowGap,
    areas,
    flow,
    alignItems,
    justifyItems,
    alignContent,
    justifyContent,
    autoRows,
    autoColumns,
    inline,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();

  const computedStyle = useMemo(
    () =>
      buildGridStyle({
        spacing: theme.spacing,
        columns,
        rows,
        gap,
        columnGap,
        rowGap,
        areas,
        flow,
        alignItems,
        justifyItems,
        alignContent,
        justifyContent,
        autoRows,
        autoColumns,
        inline,
      }),
    [
      theme.spacing,
      columns,
      rows,
      gap,
      columnGap,
      rowGap,
      areas,
      flow,
      alignItems,
      justifyItems,
      alignContent,
      justifyContent,
      autoRows,
      autoColumns,
      inline,
    ],
  );

  const mergedStyle = userStyle ? { ...computedStyle, ...userStyle } : computedStyle;

  return React.createElement(
    Component,
    { ref, style: mergedStyle, ...rest },
    children,
  );
});

Grid.displayName = 'Grid';

// ---------------------------------------------------------------------------
// GridItem
// ---------------------------------------------------------------------------

/**
 * GridItem -- Placement helper for children of a {@link Grid}.
 *
 * @remarks
 * Controls column/row span, named area placement, and self-alignment
 * within the parent grid container. When an `area` prop is set, explicit
 * `column`/`row` values are ignored.
 *
 * @see {@link Grid} for the parent container.
 *
 * @module primitives/grid
 * @example
 * ```tsx
 * <Grid columns={4} gap="md">
 *   <GridItem colSpan={2}>Spans 2 columns</GridItem>
 *   <GridItem column="3 / 5">Columns 3-4</GridItem>
 * </Grid>
 * ```
 */
export const GridItem = forwardRef<HTMLElement, GridItemProps>(function GridItem(
  {
    children,
    as: Component = 'div',
    column,
    row,
    area,
    colSpan,
    rowSpan,
    alignSelf,
    justifySelf,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const computedStyle = useMemo(
    () =>
      buildGridItemStyle({
        column,
        row,
        area,
        colSpan,
        rowSpan,
        alignSelf,
        justifySelf,
      }),
    [column, row, area, colSpan, rowSpan, alignSelf, justifySelf],
  );

  const mergedStyle = userStyle ? { ...computedStyle, ...userStyle } : computedStyle;

  return React.createElement(
    Component,
    { ref, style: mergedStyle, ...rest },
    children,
  );
});

GridItem.displayName = 'GridItem';
