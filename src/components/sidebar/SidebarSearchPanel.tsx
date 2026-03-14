/**
 * SidebarSearchPanel — Replaces the conversation list in the sidebar
 * when the user is performing an in-conversation search.
 *
 * Consumes UnifiedSearchContext for query, results, filters, and history.
 * Renders FilterPanel, SearchResultItem, and IndexStatusBar from the
 * shared search component library.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ScrollView, type TextInput } from 'react-native';
import {
  Box,
  Text,
  SearchInput,
  Button,
  useTheme,
} from '@coexist/wisp-react-native';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';
import { useFriendsContext } from '@/contexts/FriendsContext';
import { useAuth } from '@/contexts/AuthContext';
import { FilterPanel } from '@/components/search/FilterPanel';
import { SearchResultItem } from '@/components/search/SearchResultItem';
import { IndexStatusBar } from '@/components/search/IndexStatusBar';
import { ArrowLeftIcon, XIcon } from '@/components/ui';
import type { UnifiedSearchResult } from '@/services/SearchIndexService';

// ---------------------------------------------------------------------------
// SidebarSearchResults — Just the results portion (filters, results, history).
// Used by SidebarShell to display search results inline below the search input.
// ---------------------------------------------------------------------------

export function SidebarSearchResults() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const {
    query,
    setQuery,
    results,
    loading,
    filtersExpanded,
    setFiltersExpanded,
    indexStatus,
    searchHistory,
    removeFromHistory,
    clearHistory,
    setScope,
    jumpToMessage,
  } = useUnifiedSearch();
  const { friends } = useFriendsContext();
  const { identity } = useAuth();

  // Build DID → display name map for resolving sender names
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

  // Lock scope to current conversation when this panel mounts
  useEffect(() => {
    setScope('current');
  }, [setScope]);

  const handleToggleFilters = useCallback(() => {
    setFiltersExpanded(!filtersExpanded);
  }, [filtersExpanded, setFiltersExpanded]);

  const handleHistoryItemPress = useCallback(
    (q: string) => {
      setQuery(q);
    },
    [setQuery],
  );

  const handleResultPress = useCallback(
    (result: UnifiedSearchResult) => {
      jumpToMessage?.(result.document.conversationId, result.document.id);
    },
    [jumpToMessage],
  );

  // Flatten all grouped results into a single list
  const flatResults = results.flatMap((group) => group.results);

  const hasQuery = query.trim().length > 0;

  return (
    <Box style={{ flex: 1 }}>
      {/* Filter toggle */}
      <Box style={{ paddingHorizontal: 12, marginBottom: 4 }}>
        <Button
          variant="tertiary"
          onSurface
          size="xs"
          onPress={handleToggleFilters}
          style={{ justifyContent: 'flex-start' }}
        >
          <Text size="xs" color="secondary">
            {filtersExpanded ? 'Hide filters' : 'Filters'}
          </Text>
        </Button>
      </Box>

      {/* Filter panel */}
      {filtersExpanded && (
        <Box style={{ paddingHorizontal: 12 }}>
          <FilterPanel />
        </Box>
      )}

      {/* Index status bar (inline, not absolute) */}
      {indexStatus.building && (
        <Box style={{ paddingHorizontal: 12, marginBottom: 8 }}>
          <IndexStatusBar />
        </Box>
      )}

      {/* Results area */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <Box style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text size="sm" color="secondary">
              Searching...
            </Text>
          </Box>
        ) : hasQuery && flatResults.length > 0 ? (
          flatResults.map((result) => (
            <SearchResultItem
              key={result.document.id}
              result={result}
              senderName={resolveName(result.document.senderDid)}
              onPress={handleResultPress}
            />
          ))
        ) : hasQuery && flatResults.length === 0 ? (
          <Box style={{ paddingVertical: 24, alignItems: 'center' }}>
            <Text size="sm" color="secondary">
              No results found
            </Text>
          </Box>
        ) : (
          /* Empty query — show recent searches */
          <Box style={{ paddingHorizontal: 12, paddingTop: 8 }}>
            {searchHistory.length > 0 && (
              <>
                <Box
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <Text
                    size="xs"
                    weight="semibold"
                    style={{
                      color: tc.text.onRaisedSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Recent searches
                  </Text>
                  <Button
                    variant="tertiary"
                    onSurface
                    size="xs"
                    onPress={clearHistory}
                  >
                    <Text size="xs" color="secondary">
                      Clear
                    </Text>
                  </Button>
                </Box>
                {searchHistory.map((historyQuery) => (
                  <Box
                    key={historyQuery}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text size="xs" color="tertiary">
                      {'> '}
                    </Text>
                    <Button
                      variant="tertiary"
                      onSurface
                      size="xs"
                      onPress={() => handleHistoryItemPress(historyQuery)}
                      style={{ flex: 1, justifyContent: 'flex-start' }}
                    >
                      <Text size="sm" numberOfLines={1}>
                        {historyQuery}
                      </Text>
                    </Button>
                    <Button
                      variant="tertiary"
                      onSurface
                      size="xs"
                      onPress={() => removeFromHistory(historyQuery)}
                      accessibilityLabel={`Remove "${historyQuery}" from history`}
                      iconLeft={
                        <XIcon
                          size={12}
                          color={tc.text.onRaisedSecondary}
                        />
                      }
                      shape="pill"
                    />
                  </Box>
                ))}
              </>
            )}
          </Box>
        )}
      </ScrollView>
    </Box>
  );
}

SidebarSearchResults.displayName = 'SidebarSearchResults';

// ---------------------------------------------------------------------------
// SidebarSearchPanel — Legacy wrapper (deprecated).
// Kept for backward compatibility. New code should use SidebarSearchResults
// rendered inside SidebarShell which provides its own search input.
// ---------------------------------------------------------------------------

/** @deprecated Use SidebarSearchResults inside SidebarShell instead. */
export function SidebarSearchPanel() {
  const { theme } = useTheme();
  const tc = theme.colors;
  const {
    query,
    setQuery,
    setSidebarSearchActive,
  } = useUnifiedSearch();

  const inputRef = useRef<TextInput>(null);

  // Auto-focus the search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setSidebarSearchActive?.(false);
  }, [setSidebarSearchActive]);

  return (
    <Box style={{ flex: 1, paddingHorizontal: 8, paddingTop: 20 }}>
      {/* Header row */}
      <Box
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 6,
          marginBottom: 12,
        }}
      >
        <Button
          variant="tertiary"
          onSurface
          size="xs"
          onPress={handleClose}
          accessibilityLabel="Close search"
          iconLeft={
            <ArrowLeftIcon size={16} color={tc.text.onRaisedSecondary} />
          }
          shape="pill"
        />
        <Text size="sm" weight="semibold" style={{ color: tc.text.onRaised }}>
          Search
        </Text>
      </Box>

      {/* Search input */}
      <Box style={{ paddingHorizontal: 6, marginBottom: 8 }}>
        <SearchInput
          ref={inputRef as any}
          value={query}
          onValueChange={setQuery}
          placeholder="Search messages..."
          size="md"
          fullWidth
          onSurface
          onClear={() => setQuery('')}
        />
      </Box>

      {/* Results */}
      <SidebarSearchResults />
    </Box>
  );
}

SidebarSearchPanel.displayName = 'SidebarSearchPanel';
