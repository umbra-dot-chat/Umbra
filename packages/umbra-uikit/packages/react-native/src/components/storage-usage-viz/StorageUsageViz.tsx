/**
 * @module components/storage-usage-viz
 * @description React Native StorageUsageViz component for the Wisp design system.
 *
 * Reuses type definitions and color utilities from `@coexist/wisp-core`.
 * Renders via `<View>` + `<Text>` instead of DOM elements.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { StorageBar } from '@coexist/wisp-core/types/StorageUsageViz.types';
import { getDefaultBarColor } from '@coexist/wisp-core/styles/StorageUsageViz.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StorageUsageVizProps extends ViewProps {
  bars: StorageBar[];
  title?: string;
  showLegend?: boolean;
  height?: number;
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StorageUsageViz = forwardRef<View, StorageUsageVizProps>(
  function StorageUsageViz(
    {
      bars, title = 'Storage Usage', showLegend = true,
      height = 200, skeleton = false, style: userStyle, ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    if (skeleton) {
      return (
        <View
          ref={ref}
          style={[{
            height: height + 80,
            borderRadius: theme.radii.lg,
            backgroundColor: theme.colors.border.subtle,
          }, userStyle]}
          {...rest}
        />
      );
    }

    const resolvedBars = bars.map((bar, i) => ({
      ...bar,
      color: bar.color || getDefaultBarColor(i),
      percent: bar.totalBytes > 0 ? (bar.usedBytes / bar.totalBytes) * 100 : 0,
    }));

    return (
      <View
        ref={ref}
        style={[{
          gap: theme.spacing.lg,
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
        }, userStyle]}
        {...rest}
      >
        {/* Title */}
        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>{title}</Text>

        {/* Chart area */}
        <View style={{ gap: theme.spacing.md, minHeight: height, justifyContent: 'space-between' }}>
          {resolvedBars.map((bar, i) => (
            <View key={bar.label + i} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
              <Text
                numberOfLines={1}
                style={{ width: 80, fontSize: 13, color: theme.colors.text.secondary }}
              >
                {bar.label}
              </Text>
              <View style={{ flex: 1, height: 16, borderRadius: theme.radii.md, backgroundColor: theme.colors.border.subtle, overflow: 'hidden' }}>
                <View
                  style={{
                    height: '100%',
                    borderRadius: theme.radii.md,
                    backgroundColor: bar.color,
                    width: `${Math.min(100, Math.max(0, bar.percent))}%`,
                  }}
                />
              </View>
              <Text style={{ width: 50, fontSize: 12, color: theme.colors.text.muted, textAlign: 'right' }}>
                {bar.percent.toFixed(0)}%
              </Text>
            </View>
          ))}
        </View>

        {/* Legend */}
        {showLegend && resolvedBars.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border.subtle }}>
            {resolvedBars.map((bar, i) => (
              <View key={bar.label + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: bar.color }} />
                <Text style={{ fontSize: 12, color: theme.colors.text.secondary }}>{bar.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  },
);

StorageUsageViz.displayName = 'StorageUsageViz';
