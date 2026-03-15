/**
 * RecentSearches — Shows recent search queries when the search overlay
 * is open with no active query.
 */

import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Text, HStack, VStack, Button, useTheme } from '@coexist/wisp-react-native';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ClockIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <View style={{
      width: size, height: size,
      borderRadius: size / 2,
      borderWidth: 1.5,
      borderColor: color,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <View style={{
        width: 1.5, height: size * 0.25,
        backgroundColor: color,
        position: 'absolute',
        top: size * 0.2,
      }} />
      <View style={{
        width: size * 0.2, height: 1.5,
        backgroundColor: color,
        position: 'absolute',
        right: size * 0.2,
        top: size * 0.4,
      }} />
    </View>
  );
}

function XIcon({ size = 12, color }: { size?: number; color: string }) {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{
        width: size * 0.7, height: 1.5, backgroundColor: color,
        transform: [{ rotate: '45deg' }], position: 'absolute',
      }} />
      <View style={{
        width: size * 0.7, height: 1.5, backgroundColor: color,
        transform: [{ rotate: '-45deg' }], position: 'absolute',
      }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RecentSearches() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { searchHistory, setQuery, removeFromHistory, clearHistory } = useUnifiedSearch();

  const handleSelectQuery = useCallback((q: string) => {
    setQuery(q);
  }, [setQuery]);

  if (searchHistory.length === 0) {
    return (
      <VStack style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
        <Text size="lg" weight="medium" color="secondary">Search Umbra</Text>
        <Text size="sm" color="tertiary">
          Search across messages, files, links, and more
        </Text>
        <Text size="xs" color="tertiary" style={{ marginTop: 12 }}>
          Try: from:username, in:channel, before:2025-01-01, has:file
        </Text>
      </VStack>
    );
  }

  return (
    <VStack style={{ gap: 4 }}>
      <HStack style={{ alignItems: 'center', marginBottom: 8 }}>
        <Text size="xs" weight="medium" color="secondary" style={{ flex: 1 }}>
          Recent searches
        </Text>
        <Button variant="tertiary" size="xs" onPress={clearHistory}>
          Clear all
        </Button>
      </HStack>

      {searchHistory.map((q) => (
        <HStack key={q} style={{ alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => handleSelectQuery(q)}
            style={({ pressed }) => ({
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: pressed ? tc.background.raised : 'transparent',
            })}
          >
            <ClockIcon size={14} color={tc.text.muted} />
            <Text size="sm" color="primary" numberOfLines={1}>{q}</Text>
          </Pressable>
          <Pressable
            onPress={() => removeFromHistory(q)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
              padding: 6,
            })}
            accessibilityLabel={`Remove "${q}" from history`}
          >
            <XIcon size={12} color={tc.text.muted} />
          </Pressable>
        </HStack>
      ))}
    </VStack>
  );
}

RecentSearches.displayName = 'RecentSearches';
