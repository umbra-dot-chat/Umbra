import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

const sizeMap = {
  sm: { height: 28, fontSize: defaultTypography.sizes.xs.fontSize, minWidth: 28, iconSize: 14, gap: defaultSpacing.xs },
  md: { height: 34, fontSize: defaultTypography.sizes.sm.fontSize, minWidth: 34, iconSize: 16, gap: defaultSpacing.sm },
  lg: { height: 40, fontSize: defaultTypography.sizes.base.fontSize, minWidth: 40, iconSize: 18, gap: defaultSpacing.sm },
} as const;

type PaginationSize = keyof typeof sizeMap;

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  siblingCount?: number;
  size?: PaginationSize;
  showFirstLast?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

type PageItem = { type: 'page'; page: number } | { type: 'ellipsis'; key: string };

function generatePages(current: number, total: number, siblings: number): PageItem[] {
  if (total <= 1) return [{ type: 'page', page: 1 }];
  const items: PageItem[] = [];
  const leftStart = Math.max(2, current - siblings);
  const rightEnd = Math.min(total - 1, current + siblings);
  const showLeftEllipsis = leftStart > 2;
  const showRightEllipsis = rightEnd < total - 1;

  items.push({ type: 'page', page: 1 });
  if (showLeftEllipsis) items.push({ type: 'ellipsis', key: 'left' });
  for (let i = leftStart; i <= rightEnd; i++) items.push({ type: 'page', page: i });
  if (showRightEllipsis) items.push({ type: 'ellipsis', key: 'right' });
  if (total > 1) items.push({ type: 'page', page: total });
  return items;
}

export const Pagination = forwardRef<View, PaginationProps>(function Pagination(
  {
    page,
    totalPages,
    onChange,
    siblingCount = 1,
    size = 'md',
    showFirstLast = true,
    disabled = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const cfg = sizeMap[size];
  const isAtFirst = page <= 1;
  const isAtLast = page >= totalPages;
  const pageItems = useMemo(() => generatePages(page, totalPages, siblingCount), [page, totalPages, siblingCount]);

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: cfg.gap,
    }),
    [cfg],
  );

  const buttonStyle = useCallback(
    (isActive: boolean, isDisabled: boolean): ViewStyle => ({
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: cfg.minWidth,
      height: cfg.height,
      borderRadius: cfg.height / 2,
      backgroundColor: isActive ? themeColors.accent.highlight : 'transparent',
      opacity: isDisabled ? 0.3 : 1,
    }),
    [cfg, themeColors],
  );

  const labelStyle = useCallback(
    (isActive: boolean): TextStyle => ({
      fontSize: cfg.fontSize,
      fontWeight: isActive ? '600' : '400',
      color: isActive ? themeColors.text.primary : themeColors.text.secondary,
    }),
    [cfg, themeColors],
  );

  const chevronColor = themeColors.text.secondary;

  return (
    <View ref={ref} accessibilityRole="none" style={[containerStyle, userStyle]}>
      {showFirstLast && (
        <Pressable
          onPress={() => onChange(1)}
          disabled={disabled || isAtFirst}
          accessibilityLabel="First page"
          style={buttonStyle(false, disabled || isAtFirst)}
        >
          <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none">
            <Polyline points="11 17 6 12 11 7" stroke={chevronColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points="18 17 13 12 18 7" stroke={chevronColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      )}

      <Pressable
        onPress={() => onChange(page - 1)}
        disabled={disabled || isAtFirst}
        accessibilityLabel="Previous page"
        style={buttonStyle(false, disabled || isAtFirst)}
      >
        <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none">
          <Polyline points="15 18 9 12 15 6" stroke={chevronColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      {pageItems.map((item) => {
        if (item.type === 'ellipsis') {
          return (
            <View key={item.key} style={{ minWidth: cfg.minWidth, alignItems: 'center', justifyContent: 'center' }}>
              <RNText style={{ color: themeColors.text.muted, fontSize: cfg.fontSize }}>…</RNText>
            </View>
          );
        }
        const isActive = item.page === page;
        return (
          <Pressable
            key={item.page}
            onPress={() => onChange(item.page)}
            disabled={disabled || isActive}
            accessibilityLabel={`Page ${item.page}`}
            accessibilityState={{ selected: isActive }}
            style={buttonStyle(isActive, disabled)}
          >
            <RNText style={labelStyle(isActive)}>{item.page}</RNText>
          </Pressable>
        );
      })}

      <Pressable
        onPress={() => onChange(page + 1)}
        disabled={disabled || isAtLast}
        accessibilityLabel="Next page"
        style={buttonStyle(false, disabled || isAtLast)}
      >
        <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none">
          <Polyline points="9 18 15 12 9 6" stroke={chevronColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      {showFirstLast && (
        <Pressable
          onPress={() => onChange(totalPages)}
          disabled={disabled || isAtLast}
          accessibilityLabel="Last page"
          style={buttonStyle(false, disabled || isAtLast)}
        >
          <Svg width={cfg.iconSize} height={cfg.iconSize} viewBox="0 0 24 24" fill="none">
            <Polyline points="13 17 18 12 13 7" stroke={chevronColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points="6 17 11 12 6 7" stroke={chevronColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      )}
    </View>
  );
});

Pagination.displayName = 'Pagination';
