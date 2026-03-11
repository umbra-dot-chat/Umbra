import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncStatusIndicatorProps {
  status: 'synced' | 'syncing' | 'offline' | 'error';
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// SyncStatusIndicator
// ---------------------------------------------------------------------------

export const SyncStatusIndicator = forwardRef<View, SyncStatusIndicatorProps>(
  function SyncStatusIndicator(
    {
      status,
      progress,
      size = 'md',
      showLabel = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const dotSizeMap = { sm: 6, md: 8, lg: 12 };
    const dotDim = dotSizeMap[size];
    const fontSize = size === 'lg' ? defaultTypography.sizes.sm.fontSize : defaultTypography.sizes.xs.fontSize;

    const colorMap: Record<string, string> = {
      synced: tc.status.success,
      syncing: tc.accent.primary,
      offline: tc.text.muted,
      error: tc.status.danger,
    };

    const color = colorMap[status] ?? tc.text.muted;

    return (
      <View ref={ref} style={[{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }, userStyle]} accessibilityLabel={`Sync status: ${status}`}>
        <View style={{ width: dotDim, height: dotDim, borderRadius: defaultRadii.full, backgroundColor: color }} />
        {showLabel && (
          <RNText style={{ fontSize, color, textTransform: 'capitalize' } as TextStyle}>{status}</RNText>
        )}
      </View>
    );
  },
);

SyncStatusIndicator.displayName = 'SyncStatusIndicator';
