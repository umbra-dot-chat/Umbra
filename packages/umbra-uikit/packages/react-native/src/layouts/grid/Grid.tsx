import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export interface GridProps {
  children?: React.ReactNode;
  /** Number of columns. @default 1 */
  columns?: number;
  /** Gap between cells in pixels. @default 12 */
  gap?: number;
  /** Horizontal gap (overrides gap on column axis). */
  columnGap?: number;
  /** Vertical gap (overrides gap on row axis). */
  rowGap?: number;
  /** Align items along the cross axis. @default 'stretch' */
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  style?: object;
}

/**
 * Grid — Flexbox-based grid layout for React Native.
 *
 * Since CSS Grid is not available in React Native, this component
 * uses a flex-wrap approach with percentage-based widths to simulate
 * a grid layout.
 */
export const Grid = forwardRef<View, GridProps>(function Grid(
  {
    children,
    columns = 1,
    gap = 12,
    columnGap,
    rowGap,
    alignItems = 'stretch',
    style: userStyle,
  },
  ref,
) {
  const resolvedColumnGap = columnGap ?? gap;
  const resolvedRowGap = rowGap ?? gap;

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems,
      marginHorizontal: -(resolvedColumnGap / 2),
      marginVertical: -(resolvedRowGap / 2),
    }),
    [alignItems, resolvedColumnGap, resolvedRowGap],
  );

  // Inject width and margin into each child
  const items = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    const childStyle = (child.props as { style?: object }).style;
    const colSpan = (child.props as { colSpan?: number }).colSpan ?? 1;
    const itemWidth = `${(colSpan / columns) * 100}%`;

    return (
      <View
        style={[
          {
            width: itemWidth as any,
            paddingHorizontal: resolvedColumnGap / 2,
            paddingVertical: resolvedRowGap / 2,
          },
          childStyle,
        ]}
      >
        {child}
      </View>
    );
  });

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      {items}
    </View>
  );
});

Grid.displayName = 'Grid';

// ---------------------------------------------------------------------------
// GridItem
// ---------------------------------------------------------------------------

export interface GridItemProps {
  children?: React.ReactNode;
  /** Number of columns to span. @default 1 */
  colSpan?: number;
  /** Align this item along the cross axis. */
  alignSelf?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  style?: object;
}

/**
 * GridItem — Placement helper for children of a Grid.
 *
 * Accepts `colSpan` to span multiple columns. The actual width is
 * calculated by the parent Grid component.
 */
export const GridItem = forwardRef<View, GridItemProps>(function GridItem(
  { children, colSpan: _colSpan, alignSelf, style: userStyle },
  ref,
) {
  const itemStyle = useMemo<ViewStyle>(
    () => ({
      alignSelf,
      flex: 1,
    }),
    [alignSelf],
  );

  return (
    <View ref={ref} style={[itemStyle, userStyle]}>
      {children}
    </View>
  );
});

GridItem.displayName = 'GridItem';
