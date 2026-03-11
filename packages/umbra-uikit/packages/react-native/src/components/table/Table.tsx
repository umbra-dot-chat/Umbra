import React, { forwardRef, useMemo, createContext, useContext } from 'react';
import { View, ScrollView, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types & Context
// ---------------------------------------------------------------------------

type TableSize = 'sm' | 'md' | 'lg';
type TableVariant = 'default' | 'striped';

const tableSizeMap: Record<TableSize, { cellPaddingV: number; cellPaddingH: number; fontSize: number; headerFontSize: number }> = {
  sm: { cellPaddingV: 6, cellPaddingH: 10, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 12 },
  md: { cellPaddingV: 10, cellPaddingH: 14, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 13 },
  lg: { cellPaddingV: 14, cellPaddingH: 18, fontSize: defaultTypography.sizes.base.fontSize, headerFontSize: 14 },
};

interface TableContextValue {
  size: TableSize;
  variant: TableVariant;
  hoverable: boolean;
}

const TableContext = createContext<TableContextValue>({
  size: 'md',
  variant: 'default',
  hoverable: false,
});

function useTableContext() {
  return useContext(TableContext);
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export interface TableProps {
  children: React.ReactNode;
  size?: TableSize;
  variant?: TableVariant;
  hoverable?: boolean;
  style?: ViewStyle;
}

export const Table = forwardRef<View, TableProps>(function Table(
  { children, size = 'md', variant = 'default', hoverable = false, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const ctxValue = useMemo<TableContextValue>(() => ({ size, variant, hoverable }), [size, variant, hoverable]);

  const tableStyle = useMemo<ViewStyle>(
    () => ({
      borderWidth: 1,
      borderColor: themeColors.border.subtle,
      borderRadius: defaultRadii.md,
      overflow: 'hidden',
    }),
    [themeColors],
  );

  return (
    <TableContext.Provider value={ctxValue}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View ref={ref} style={[tableStyle, userStyle]}>
          {children}
        </View>
      </ScrollView>
    </TableContext.Provider>
  );
});

Table.displayName = 'Table';

// ---------------------------------------------------------------------------
// TableHeader
// ---------------------------------------------------------------------------

export interface TableHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TableHeader = forwardRef<View, TableHeaderProps>(function TableHeader(
  { children, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  return (
    <View
      ref={ref}
      style={[{ backgroundColor: themeColors.background.surface, borderBottomWidth: 1, borderBottomColor: themeColors.border.subtle }, userStyle]}
    >
      {children}
    </View>
  );
});

TableHeader.displayName = 'TableHeader';

// ---------------------------------------------------------------------------
// TableBody
// ---------------------------------------------------------------------------

export interface TableBodyProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TableBody = forwardRef<View, TableBodyProps>(function TableBody(
  { children, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { variant } = useTableContext();
  const themeColors = theme.colors;

  const childrenWithIndex = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;
    return React.cloneElement(child as React.ReactElement<any>, {
      _rowIndex: index,
      _isStriped: variant === 'striped',
    });
  });

  return (
    <View ref={ref} style={userStyle}>
      {childrenWithIndex}
    </View>
  );
});

TableBody.displayName = 'TableBody';

// ---------------------------------------------------------------------------
// TableFooter
// ---------------------------------------------------------------------------

export interface TableFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const TableFooter = forwardRef<View, TableFooterProps>(function TableFooter(
  { children, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  return (
    <View ref={ref} style={[{ borderTopWidth: 1, borderTopColor: themeColors.border.subtle }, userStyle]}>
      {children}
    </View>
  );
});

TableFooter.displayName = 'TableFooter';

// ---------------------------------------------------------------------------
// TableRow
// ---------------------------------------------------------------------------

export interface TableRowProps {
  children: React.ReactNode;
  selected?: boolean;
  _rowIndex?: number;
  _isStriped?: boolean;
  style?: ViewStyle;
}

export const TableRow = forwardRef<View, TableRowProps>(function TableRow(
  { children, selected = false, _rowIndex = 0, _isStriped = false, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const isEvenRow = _rowIndex % 2 === 1;

  const rowStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
      backgroundColor: selected
        ? themeColors.accent.highlight
        : _isStriped && isEvenRow
        ? themeColors.background.surface
        : 'transparent',
    }),
    [selected, _isStriped, isEvenRow, themeColors],
  );

  return (
    <View ref={ref} style={[rowStyle, userStyle]}>
      {children}
    </View>
  );
});

TableRow.displayName = 'TableRow';

// ---------------------------------------------------------------------------
// TableHead
// ---------------------------------------------------------------------------

export interface TableHeadProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number;
  style?: ViewStyle;
}

export const TableHead = forwardRef<View, TableHeadProps>(function TableHead(
  { children, align = 'left', width, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { size } = useTableContext();
  const themeColors = theme.colors;
  const cfg = tableSizeMap[size];

  const cellStyle = useMemo<ViewStyle>(
    () => ({
      paddingVertical: cfg.cellPaddingV,
      paddingHorizontal: cfg.cellPaddingH,
      justifyContent: 'center',
      width,
      flex: width ? undefined : 1,
    }),
    [cfg, width],
  );

  const rnAlign = align === 'left' ? 'auto' : align === 'center' ? 'center' : 'right';

  return (
    <View ref={ref} style={[cellStyle, userStyle]}>
      <RNText
        style={{
          fontSize: cfg.headerFontSize,
          fontWeight: defaultTypography.weights.semibold,
          color: themeColors.text.secondary,
          textAlign: rnAlign,
        } as TextStyle}
      >
        {children}
      </RNText>
    </View>
  );
});

TableHead.displayName = 'TableHead';

// ---------------------------------------------------------------------------
// TableCell
// ---------------------------------------------------------------------------

export interface TableCellProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: number;
  style?: ViewStyle;
}

export const TableCell = forwardRef<View, TableCellProps>(function TableCell(
  { children, align = 'left', width, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const { size } = useTableContext();
  const themeColors = theme.colors;
  const cfg = tableSizeMap[size];

  const cellStyle = useMemo<ViewStyle>(
    () => ({
      paddingVertical: cfg.cellPaddingV,
      paddingHorizontal: cfg.cellPaddingH,
      justifyContent: 'center',
      width,
      flex: width ? undefined : 1,
    }),
    [cfg, width],
  );

  const rnAlign = align === 'left' ? 'auto' : align === 'center' ? 'center' : 'right';

  return (
    <View ref={ref} style={[cellStyle, userStyle]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <RNText style={{ fontSize: cfg.fontSize, color: themeColors.text.primary, textAlign: rnAlign } as TextStyle}>
          {children}
        </RNText>
      ) : (
        children
      )}
    </View>
  );
});

TableCell.displayName = 'TableCell';
