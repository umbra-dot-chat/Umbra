import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable, FlatList, ScrollView, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type DataTableSize = 'sm' | 'md' | 'lg';

const dtSizeMap: Record<DataTableSize, { cellPV: number; cellPH: number; fontSize: number; headerFontSize: number }> = {
  sm: { cellPV: 6, cellPH: 10, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 12 },
  md: { cellPV: 10, cellPH: 14, fontSize: defaultTypography.sizes.sm.fontSize, headerFontSize: 13 },
  lg: { cellPV: 14, cellPH: 18, fontSize: defaultTypography.sizes.base.fontSize, headerFontSize: 14 },
};

export interface DataTableColumn<T> {
  key: string;
  header: string;
  width?: number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (item: T, index: number) => React.ReactNode;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  size?: DataTableSize;
  striped?: boolean;
  hoverable?: boolean;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  selectable?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  emptyMessage?: string;
  keyExtractor?: (item: T, index: number) => string;
  style?: ViewStyle;
}

function DataTableInner<T>(
  {
    data,
    columns,
    size = 'md',
    striped = false,
    sort,
    onSortChange,
    selectable = false,
    selectedRows,
    onSelectionChange,
    emptyMessage = 'No data',
    keyExtractor,
    style: userStyle,
  }: DataTableProps<T>,
  ref: React.Ref<View>,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const cfg = dtSizeMap[size];

  const handleSort = useCallback(
    (key: string) => {
      if (!onSortChange) return;
      if (sort?.key === key) {
        onSortChange({ key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
      } else {
        onSortChange({ key, direction: 'asc' });
      }
    },
    [sort, onSortChange],
  );

  const toggleRow = useCallback(
    (index: number) => {
      if (!onSelectionChange || !selectedRows) return;
      const next = new Set(selectedRows);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      onSelectionChange(next);
    },
    [selectedRows, onSelectionChange],
  );

  const headerRow = (
    <View style={{ flexDirection: 'row', backgroundColor: themeColors.background.surface, borderBottomWidth: 1, borderBottomColor: themeColors.border.subtle }}>
      {selectable && (
        <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable
            onPress={() => {
              if (!onSelectionChange) return;
              const allSelected = selectedRows?.size === data.length;
              onSelectionChange(allSelected ? new Set() : new Set(data.map((_, i) => i)));
            }}
            style={{ width: 20, height: 20, borderWidth: 1.5, borderColor: themeColors.border.strong, borderRadius: defaultRadii.sm, alignItems: 'center', justifyContent: 'center' }}
          >
            {selectedRows && selectedRows.size > 0 && (
              <View style={{ width: 10, height: 10, borderRadius: defaultRadii.sm, backgroundColor: themeColors.accent.primary }} />
            )}
          </Pressable>
        </View>
      )}
      {columns.map((col) => {
        const isSorted = sort?.key === col.key;
        const rnAlign = col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start';
        return (
          <Pressable
            key={col.key}
            onPress={col.sortable ? () => handleSort(col.key) : undefined}
            disabled={!col.sortable}
            style={{
              flex: col.width ? undefined : 1,
              width: col.width,
              paddingVertical: cfg.cellPV,
              paddingHorizontal: cfg.cellPH,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: rnAlign,
              gap: defaultSpacing.xs,
            }}
          >
            <RNText style={{ fontSize: cfg.headerFontSize, fontWeight: defaultTypography.weights.semibold, color: themeColors.text.secondary } as TextStyle}>
              {col.header}
            </RNText>
            {col.sortable && isSorted && (
              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <Polyline
                  points={sort!.direction === 'asc' ? '18 15 12 9 6 15' : '6 9 12 15 18 9'}
                  stroke={themeColors.text.secondary}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </Pressable>
        );
      })}
    </View>
  );

  const renderRow = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const isSelected = selectedRows?.has(index);
      const isEvenRow = index % 2 === 1;
      return (
        <View
          style={{
            flexDirection: 'row',
            borderBottomWidth: 1,
            borderBottomColor: themeColors.border.subtle,
            backgroundColor: isSelected
              ? themeColors.accent.highlight
              : striped && isEvenRow
              ? themeColors.background.surface
              : 'transparent',
          }}
        >
          {selectable && (
            <Pressable
              onPress={() => toggleRow(index)}
              style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{
                width: 18, height: 18, borderWidth: 1.5,
                borderColor: isSelected ? themeColors.accent.primary : themeColors.border.strong,
                borderRadius: defaultRadii.sm,
                backgroundColor: isSelected ? themeColors.accent.primary : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {isSelected && (
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Polyline points="20 6 9 17 4 12" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                )}
              </View>
            </Pressable>
          )}
          {columns.map((col) => {
            const rnAlign = col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'auto';
            const content = col.render
              ? col.render(item, index)
              : String((item as any)[col.key] ?? '');
            return (
              <View
                key={col.key}
                style={{
                  flex: col.width ? undefined : 1,
                  width: col.width,
                  paddingVertical: cfg.cellPV,
                  paddingHorizontal: cfg.cellPH,
                  justifyContent: 'center',
                }}
              >
                {typeof content === 'string' || typeof content === 'number' ? (
                  <RNText style={{ fontSize: cfg.fontSize, color: themeColors.text.primary, textAlign: rnAlign } as TextStyle}>
                    {String(content)}
                  </RNText>
                ) : (
                  content
                )}
              </View>
            );
          })}
        </View>
      );
    },
    [columns, cfg, themeColors, striped, selectable, selectedRows, toggleRow],
  );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View ref={ref} style={[{ borderWidth: 1, borderColor: themeColors.border.subtle, borderRadius: defaultRadii.md, overflow: 'hidden' }, userStyle]}>
        {headerRow}
        {data.length === 0 ? (
          <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
            <RNText style={{ fontSize: cfg.fontSize, color: themeColors.text.muted } as TextStyle}>{emptyMessage}</RNText>
          </View>
        ) : (
          <FlatList
            data={data}
            renderItem={renderRow}
            keyExtractor={keyExtractor ?? ((_, i) => String(i))}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

export const DataTable = forwardRef(DataTableInner) as <T>(
  props: DataTableProps<T> & { ref?: React.Ref<View> },
) => React.ReactElement | null;

(DataTable as any).displayName = 'DataTable';
