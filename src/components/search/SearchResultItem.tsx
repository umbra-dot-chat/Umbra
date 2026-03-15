/**
 * SearchResultItem — A single search result row.
 *
 * Shows sender avatar, name, timestamp, message snippet with highlights,
 * and file/link indicators.
 */

import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import {
  Text,
  HStack,
  VStack,
  Avatar,
  Badge,
  useTheme,
} from '@coexist/wisp-react-native';
import { HighlightedText } from './HighlightedText';
import type { UnifiedSearchResult } from '@/services/SearchIndexService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResultItemProps {
  result: UnifiedSearchResult;
  /** Display name of the sender */
  senderName: string;
  /** Avatar URL of the sender (optional) */
  senderAvatar?: string;
  /** Whether this result is currently selected for preview */
  selected?: boolean;
  /** Called when the result is clicked */
  onPress?: (result: UnifiedSearchResult) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SearchResultItem({
  result,
  senderName,
  senderAvatar,
  selected,
  onPress,
}: SearchResultItemProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const doc = result.document;

  const handlePress = useCallback(() => {
    onPress?.(result);
  }, [onPress, result]);

  const timeStr = formatTimestamp(doc.timestamp);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
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
      <Avatar
        name={senderName}
        src={senderAvatar}
        size="sm"
      />

      <VStack style={{ flex: 1, gap: 2 }}>
        <HStack style={{ alignItems: 'center', gap: 6 }}>
          <Text size="sm" weight="medium" numberOfLines={1} style={{ flex: 1 }}>
            {senderName}
          </Text>
          <Text size="xs" color="tertiary">{timeStr}</Text>
        </HStack>

        <HighlightedText
          text={doc.text}
          terms={result.matchedTerms}
          size="sm"
          color="secondary"
          numberOfLines={2}
        />

        {/* Indicators */}
        {(doc.hasFile || doc.hasLink || doc.isPinned) && (
          <HStack style={{ gap: 4, marginTop: 2 }}>
            {doc.hasFile && <Badge size="sm">File</Badge>}
            {doc.hasLink && <Badge size="sm">Link</Badge>}
            {doc.isPinned && <Badge size="sm">Pinned</Badge>}
          </HStack>
        )}
      </VStack>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(ts: number): string {
  const tsMs = ts < 1000000000000 ? ts * 1000 : ts;
  const date = new Date(tsMs);
  const now = new Date();

  // Same day: show time only
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  // Within this year: show month/day
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Otherwise: full date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

SearchResultItem.displayName = 'SearchResultItem';
