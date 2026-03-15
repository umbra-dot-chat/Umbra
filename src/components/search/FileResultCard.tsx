/**
 * FileResultCard — Search result card for file attachments.
 *
 * Shows file icon, name, and size in a compact format.
 * Click to expand for an inline preview (images only for now).
 */

import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Text,
  HStack,
  VStack,
  Badge,
  useTheme,
} from '@coexist/wisp-react-native';
import type { UnifiedSearchResult } from '@/services/SearchIndexService';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function FileIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <View style={{
      width: size, height: size,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 3,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color, marginBottom: 2 }} />
      <View style={{ width: size * 0.5, height: 1.5, backgroundColor: color }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileResultCardProps {
  result: UnifiedSearchResult;
  /** Called when the card is clicked */
  onPress?: (result: UnifiedSearchResult) => void;
  /** Whether this result is selected */
  selected?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FileResultCard({ result, onPress, selected }: FileResultCardProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const doc = result.document;
  const [expanded, setExpanded] = useState(false);

  const handlePress = useCallback(() => {
    onPress?.(result);
  }, [onPress, result]);

  const handleToggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const timeStr = formatCompactTime(doc.timestamp);

  return (
    <VStack style={{ gap: 0 }}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: selected
            ? tc.background.raised
            : pressed
              ? tc.background.raised
              : 'transparent',
        })}
      >
        <View style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: `${tc.accent.primary}15`,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <FileIcon size={20} color={tc.accent.primary} />
        </View>

        <VStack style={{ flex: 1, gap: 2 }}>
          <Text size="sm" weight="medium" numberOfLines={1}>
            {doc.text}
          </Text>
          <HStack style={{ gap: 6, alignItems: 'center' }}>
            <Text size="xs" color="tertiary">{timeStr}</Text>
            <Badge size="sm">File</Badge>
          </HStack>
        </VStack>

        <Pressable
          onPress={handleToggleExpand}
          style={({ pressed }) => ({
            opacity: pressed ? 0.5 : 1,
            padding: 4,
          })}
          accessibilityLabel={expanded ? 'Collapse preview' : 'Expand preview'}
        >
          <Text size="xs" color="secondary">
            {expanded ? '▲' : '▼'}
          </Text>
        </Pressable>
      </Pressable>

      {/* Expandable preview area */}
      {expanded && (
        <View style={{
          marginLeft: 58,
          marginRight: 12,
          marginBottom: 8,
          padding: 12,
          borderRadius: 8,
          backgroundColor: tc.background.sunken,
          borderWidth: 1,
          borderColor: tc.border.subtle,
        }}>
          <Text size="xs" color="tertiary">
            File preview not yet available. Click "Jump to message" to view in context.
          </Text>
        </View>
      )}
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCompactTime(ts: number): string {
  const tsMs = ts < 1000000000000 ? ts * 1000 : ts;
  const date = new Date(tsMs);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

FileResultCard.displayName = 'FileResultCard';
