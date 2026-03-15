/**
 * IndexStatusBar — Dev-mode status bar showing search index build progress.
 *
 * Renders at the bottom of the app. Only visible when __DEV__ is true
 * and the index is currently building.
 */

import React from 'react';
import { View } from 'react-native';
import { Text, HStack, Progress, useTheme } from '@coexist/wisp-react-native';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';

export function IndexStatusBar() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { indexStatus } = useUnifiedSearch();

  // Only show in dev mode while building
  if (!__DEV__ || !indexStatus.building) return null;

  const pct = Math.round(indexStatus.progress * 100);

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: tc.background.surface,
      borderTopWidth: 1,
      borderTopColor: tc.border.subtle,
      paddingHorizontal: 16,
      paddingVertical: 6,
      zIndex: 9999,
    }}>
      <HStack style={{ alignItems: 'center', gap: 12 }}>
        <Text size="xs" color="secondary">
          Indexing messages: {pct}% ({indexStatus.indexed}/{indexStatus.total})
        </Text>
        <View style={{ flex: 1 }}>
          <Progress value={indexStatus.progress * 100} size="sm" />
        </View>
      </HStack>
    </View>
  );
}

IndexStatusBar.displayName = 'IndexStatusBar';
