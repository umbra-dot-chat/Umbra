/**
 * GroupedResultsList — Search results grouped by conversation.
 *
 * Each group has a conversation header with name and result count,
 * followed by individual search result items.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Pressable } from 'react-native';
import {
  Text,
  HStack,
  VStack,
  Badge,
  useTheme,
} from '@coexist/wisp-react-native';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';
import { useFriendsContext } from '@/contexts/FriendsContext';
import { useAuth } from '@/contexts/AuthContext';
import { SearchResultItem } from './SearchResultItem';
import type { UnifiedSearchResult, GroupedSearchResults } from '@/services/SearchIndexService';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GroupedResultsList() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const { results, jumpToMessage } = useUnifiedSearch();
  const { friends } = useFriendsContext();
  const { identity } = useAuth();
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  // Build DID → display name resolver
  const resolveName = useMemo(() => {
    const myDid = identity?.did ?? '';
    const myDisplayName = identity?.displayName ?? '';
    const nameMap: Record<string, string> = {};
    for (const f of friends) {
      nameMap[f.did] = f.displayName;
    }
    return (did: string): string => {
      if (!did) return 'Unknown';
      if (did === myDid) return myDisplayName || 'You';
      return nameMap[did] || did.slice(0, 16) + '...';
    };
  }, [friends, identity?.did, identity?.displayName]);

  const handleResultPress = useCallback((result: UnifiedSearchResult) => {
    setSelectedResult(result.document.id);
    // For now, jump directly. Phase 5 will add preview pane.
    if (jumpToMessage) {
      jumpToMessage(result.document.conversationId, result.document.id);
    }
  }, [jumpToMessage]);

  const totalResults = results.reduce((sum, g) => sum + g.results.length, 0);

  return (
    <VStack style={{ gap: 16 }}>
      <Text size="xs" color="tertiary">
        {totalResults} result{totalResults !== 1 ? 's' : ''}
      </Text>

      {results.map((group) => (
        <ConversationGroup
          key={group.conversationId}
          group={group}
          selectedResultId={selectedResult}
          onResultPress={handleResultPress}
          resolveName={resolveName}
        />
      ))}
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Conversation Group
// ---------------------------------------------------------------------------

function ConversationGroup({
  group,
  selectedResultId,
  onResultPress,
  resolveName,
}: {
  group: GroupedSearchResults;
  selectedResultId: string | null;
  onResultPress: (result: UnifiedSearchResult) => void;
  resolveName: (did: string) => string;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <VStack style={{ gap: 2 }}>
      {/* Group header */}
      <Pressable onPress={toggleCollapse}>
        <HStack style={{
          alignItems: 'center',
          gap: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 6,
          backgroundColor: tc.background.surface,
        }}>
          <Text size="xs" style={{ transform: [{ rotate: collapsed ? '-90deg' : '0deg' }] }}>
            ▾
          </Text>
          <Text size="sm" weight="medium" style={{ flex: 1 }} numberOfLines={1}>
            {group.conversationId.slice(0, 24)}...
          </Text>
          <Badge size="sm">{group.results.length}</Badge>
        </HStack>
      </Pressable>

      {/* Results */}
      {!collapsed && group.results.map((result) => (
        <SearchResultItem
          key={result.document.id}
          result={result}
          senderName={resolveName(result.document.senderDid)}
          selected={selectedResultId === result.document.id}
          onPress={onResultPress}
        />
      ))}
    </VStack>
  );
}

GroupedResultsList.displayName = 'GroupedResultsList';
