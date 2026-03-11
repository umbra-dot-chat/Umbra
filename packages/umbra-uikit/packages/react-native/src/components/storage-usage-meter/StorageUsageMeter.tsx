import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StorageSegment {
  label: string;
  bytes: number;
  color: string;
}

export interface StorageUsageMeterProps {
  totalUsed: number;
  totalAvailable?: number;
  breakdown: StorageSegment[];
  onCleanup?: () => void;
  onManageStorage?: () => void;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

// ---------------------------------------------------------------------------
// StorageUsageMeter
// ---------------------------------------------------------------------------

export const StorageUsageMeter = forwardRef<View, StorageUsageMeterProps>(
  function StorageUsageMeter(
    {
      totalUsed,
      totalAvailable,
      breakdown,
      onCleanup,
      onManageStorage,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;
    const total = totalAvailable ?? totalUsed;

    if (skeleton) {
      return (
        <View ref={ref} style={[{ height: 80, borderRadius: defaultRadii.lg, backgroundColor: tc.border.subtle }, userStyle]} />
      );
    }

    return (
      <View ref={ref} style={[{ gap: defaultSpacing.md }, userStyle]}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: '600', color: tc.text.primary } as TextStyle}>
            Storage
          </RNText>
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
            {formatSize(totalUsed)}{totalAvailable ? ` / ${formatSize(totalAvailable)}` : ''}
          </RNText>
        </View>

        {/* Bar */}
        <View style={{ flexDirection: 'row', height: 12, borderRadius: defaultRadii.full, backgroundColor: tc.border.subtle, overflow: 'hidden' }}>
          {breakdown.map(seg => {
            const pct = total > 0 ? (seg.bytes / total) * 100 : 0;
            return (
              <View key={seg.label} style={{ width: `${pct}%`, height: '100%', backgroundColor: seg.color } as ViewStyle} />
            );
          })}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: defaultSpacing.md }}>
          {breakdown.map(seg => (
            <View key={seg.label} style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: defaultRadii.full, backgroundColor: seg.color }} />
              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary } as TextStyle}>
                {seg.label} ({formatSize(seg.bytes)})
              </RNText>
            </View>
          ))}
        </View>

        {/* Actions */}
        {(onCleanup || onManageStorage) && (
          <View style={{ flexDirection: 'row', gap: defaultSpacing.sm }}>
            {onCleanup && (
              <Pressable onPress={onCleanup}>
                <RNText style={{ color: tc.accent.primary, fontSize: 12 } as TextStyle}>Clean up</RNText>
              </Pressable>
            )}
            {onManageStorage && (
              <Pressable onPress={onManageStorage}>
                <RNText style={{ color: tc.accent.primary, fontSize: 12 } as TextStyle}>Manage storage</RNText>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  },
);

StorageUsageMeter.displayName = 'StorageUsageMeter';
