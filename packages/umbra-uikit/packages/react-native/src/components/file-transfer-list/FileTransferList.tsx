import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import { FileTransferProgress } from '../file-transfer-progress';
import type { FileTransferProgressProps } from '../file-transfer-progress';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileTransferListProps {
  transfers: FileTransferProgressProps[];
  onClearCompleted?: () => void;
  emptyText?: string;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// FileTransferList
// ---------------------------------------------------------------------------

export const FileTransferList = forwardRef<View, FileTransferListProps>(
  function FileTransferList(
    {
      transfers,
      onClearCompleted,
      emptyText = 'No active transfers',
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const completed = transfers.filter(t => t.state === 'complete');

    return (
      <View ref={ref} style={[{ gap: defaultSpacing.sm }, userStyle]}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: '600', color: tc.text.primary } as TextStyle}>
            Transfers
          </RNText>
          {completed.length > 0 && onClearCompleted && (
            <Pressable onPress={onClearCompleted}>
              <RNText style={{ fontSize: 12, color: tc.accent.primary } as TextStyle}>Clear completed</RNText>
            </Pressable>
          )}
        </View>

        {/* Items */}
        {transfers.length === 0 ? (
          <View style={{ padding: defaultSpacing.xl, alignItems: 'center' }}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted } as TextStyle}>
              {emptyText}
            </RNText>
          </View>
        ) : (
          <ScrollView style={{ maxHeight: 400 }}>
            <View style={{ gap: defaultSpacing.sm }}>
              {transfers.map((transfer, i) => (
                <FileTransferProgress key={transfer.filename + i} {...transfer} />
              ))}
            </View>
          </ScrollView>
        )}
      </View>
    );
  },
);

FileTransferList.displayName = 'FileTransferList';
