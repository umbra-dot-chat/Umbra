/**
 * UnifiedSearchContext — Central state for the unified search feature.
 *
 * Manages search overlay visibility, query state, filter parsing,
 * debounced live search, result grouping, and index status.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { parseSearchQuery, serializeSearchQuery, isEmptyQuery } from '@/services/SearchQueryParser';
import type { ParsedSearchQuery } from '@/services/SearchQueryParser';
import {
  SearchIndexService,
  type GroupedSearchResults,
  type IndexStatus,
  type SearchScope,
} from '@/services/SearchIndexService';
import {
  getSearchHistory,
  addSearchQuery,
  removeSearchQuery,
  clearSearchHistory,
} from '@/services/SearchHistoryService';
import { useUmbra } from '@/contexts/UmbraContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SearchScopeType = 'current' | 'all';

export interface UnifiedSearchContextValue {
  /** Whether the search overlay is visible */
  isOpen: boolean;
  /** Open the search overlay */
  openSearch: () => void;
  /** Close the search overlay */
  closeSearch: () => void;

  /** Raw query string (what the user types) */
  query: string;
  /** Update the raw query */
  setQuery: (q: string) => void;

  /** Parsed query with extracted tokens */
  parsedQuery: ParsedSearchQuery;
  /** Update the parsed query directly (from filter panel) */
  setParsedQuery: (pq: ParsedSearchQuery) => void;

  /** Current search scope */
  scope: SearchScopeType;
  /** Update the scope */
  setScope: (s: SearchScopeType) => void;

  /** Search results grouped by conversation */
  results: GroupedSearchResults[];
  /** Whether a search is in progress */
  loading: boolean;

  /** Index build status */
  indexStatus: IndexStatus;

  /** Recent search queries */
  searchHistory: string[];
  /** Remove a query from history */
  removeFromHistory: (q: string) => void;
  /** Clear all search history */
  clearHistory: () => void;

  /** Whether the filter panel is expanded */
  filtersExpanded: boolean;
  /** Toggle filter panel */
  setFiltersExpanded: (expanded: boolean) => void;

  /** The search index service instance (for building index externally) */
  indexService: SearchIndexService;

  /** Currently active conversation ID (for scoped search) */
  activeConversationId: string | null;
  /** Set the active conversation context */
  setActiveConversationId: (id: string | null) => void;

  /** Navigate to a search result message */
  jumpToMessage: ((conversationId: string, messageId: string) => void) | null;
  /** Register the jump-to-message handler */
  setJumpToMessageHandler: (handler: ((convId: string, msgId: string) => void) | null) => void;

  /** Whether the sidebar search panel is active (in-conversation search) */
  sidebarSearchActive: boolean;
  /** Activate or deactivate the sidebar search panel */
  setSidebarSearchActive: (active: boolean) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EMPTY_QUERY: ParsedSearchQuery = { text: '' };
const EMPTY_RESULTS: GroupedSearchResults[] = [];
const INITIAL_INDEX_STATUS: IndexStatus = {
  building: false,
  progress: 0,
  total: 0,
  indexed: 0,
  ready: false,
};

const UnifiedSearchContext = createContext<UnifiedSearchContextValue>({
  isOpen: false,
  openSearch: () => {},
  closeSearch: () => {},
  query: '',
  setQuery: () => {},
  parsedQuery: EMPTY_QUERY,
  setParsedQuery: () => {},
  scope: 'all',
  setScope: () => {},
  results: EMPTY_RESULTS,
  loading: false,
  indexStatus: INITIAL_INDEX_STATUS,
  searchHistory: [],
  removeFromHistory: () => {},
  clearHistory: () => {},
  filtersExpanded: false,
  setFiltersExpanded: () => {},
  indexService: new SearchIndexService(),
  activeConversationId: null,
  setActiveConversationId: () => {},
  jumpToMessage: null,
  setJumpToMessageHandler: () => {},
  sidebarSearchActive: false,
  setSidebarSearchActive: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 300;

export function UnifiedSearchProvider({ children }: { children: React.ReactNode }) {
  const { service, isReady } = useUmbra();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQueryRaw] = useState('');
  const [parsedQuery, setParsedQueryRaw] = useState<ParsedSearchQuery>(EMPTY_QUERY);
  const [scope, setScope] = useState<SearchScopeType>('all');
  const [results, setResults] = useState<GroupedSearchResults[]>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [indexStatus, setIndexStatus] = useState<IndexStatus>(INITIAL_INDEX_STATUS);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory());
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [jumpToMessageHandler, setJumpToMessageHandlerRaw] = useState<
    ((convId: string, msgId: string) => void) | null
  >(null);
  const [sidebarSearchActive, setSidebarSearchActiveRaw] = useState(false);

  const indexServiceRef = useRef(new SearchIndexService());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexBuiltRef = useRef(false);

  // Subscribe to index status changes
  useEffect(() => {
    return indexServiceRef.current.onStatusChange(setIndexStatus);
  }, []);

  // Build the search index when the service is ready
  useEffect(() => {
    if (!service || !isReady || indexBuiltRef.current) return;
    indexBuiltRef.current = true;

    console.log('[SearchIndex] Building index...');
    indexServiceRef.current.buildIndex(
      () => service.getConversations(),
      (convId, opts) => service.getMessages(convId, opts),
    ).then(() => {
      console.log('[SearchIndex] Index built, size:', indexServiceRef.current.size);
    }).catch((err) => {
      console.error('[SearchIndex] Build failed:', err);
    });
  }, [service, isReady]);

  // Index new messages in real-time
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onMessageEvent((event: any) => {
      if (event.type === 'messageReceived' || event.type === 'messageSent') {
        if (event.message?.content) {
          indexServiceRef.current.indexMessage(event.message);
        }
      }
    });

    return unsubscribe;
  }, [service]);

  // Execute search when parsedQuery or scope changes (debounced)
  const executeSearch = useCallback((pq: ParsedSearchQuery, currentScope: SearchScopeType) => {
    if (isEmptyQuery(pq)) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    setLoading(true);

    const searchScope: SearchScope = currentScope === 'current' && activeConversationId
      ? { type: 'conversation', conversationId: activeConversationId }
      : { type: 'all' };

    console.log('[SearchIndex] Searching:', { text: pq.text, scope: searchScope, indexSize: indexServiceRef.current.size });
    const grouped = indexServiceRef.current.search(pq, searchScope);
    console.log('[SearchIndex] Results:', grouped.length, 'groups,', grouped.reduce((n, g) => n + g.results.length, 0), 'total results');
    setResults(grouped);
    setLoading(false);
  }, [activeConversationId]);

  // Debounced query handler
  const setQuery = useCallback((raw: string) => {
    setQueryRaw(raw);
    const parsed = parseSearchQuery(raw);
    setParsedQueryRaw(parsed);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(parsed, scope);
    }, DEBOUNCE_MS);
  }, [executeSearch, scope]);

  // Direct parsed query update (from filter panel)
  const setParsedQuery = useCallback((pq: ParsedSearchQuery) => {
    setParsedQueryRaw(pq);
    setQueryRaw(serializeSearchQuery(pq));

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      executeSearch(pq, scope);
    }, DEBOUNCE_MS);
  }, [executeSearch, scope]);

  // Re-execute search when scope changes
  useEffect(() => {
    if (!isEmptyQuery(parsedQuery)) {
      executeSearch(parsedQuery, scope);
    }
  }, [scope, parsedQuery, executeSearch]);

  const openSearch = useCallback(() => {
    setIsOpen(true);
    setSearchHistory(getSearchHistory());
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    // Save current query to history if non-empty
    if (query.trim()) {
      addSearchQuery(query.trim());
      setSearchHistory(getSearchHistory());
    }
    // Reset state
    setQueryRaw('');
    setParsedQueryRaw(EMPTY_QUERY);
    setResults(EMPTY_RESULTS);
    setFiltersExpanded(false);
  }, [query]);

  const removeFromHistory = useCallback((q: string) => {
    removeSearchQuery(q);
    setSearchHistory(getSearchHistory());
  }, []);

  const handleClearHistory = useCallback(() => {
    clearSearchHistory();
    setSearchHistory([]);
  }, []);

  const setJumpToMessageHandler = useCallback(
    (handler: ((convId: string, msgId: string) => void) | null) => {
      setJumpToMessageHandlerRaw(() => handler);
    },
    [],
  );

  const setSidebarSearchActive = useCallback((active: boolean) => {
    if (active) {
      setSidebarSearchActiveRaw(true);
      setScope('current');
    } else {
      setSidebarSearchActiveRaw(false);
      // Reset query and results (same as closeSearch behavior)
      setQueryRaw('');
      setParsedQueryRaw(EMPTY_QUERY);
      setResults(EMPTY_RESULTS);
    }
  }, []);

  const jumpToMessage = useMemo(() => {
    if (!jumpToMessageHandler) return null;
    return (conversationId: string, messageId: string) => {
      jumpToMessageHandler(conversationId, messageId);
      closeSearch();
    };
  }, [jumpToMessageHandler, closeSearch]);

  const value = useMemo<UnifiedSearchContextValue>(
    () => ({
      isOpen,
      openSearch,
      closeSearch,
      query,
      setQuery,
      parsedQuery,
      setParsedQuery,
      scope,
      setScope,
      results,
      loading,
      indexStatus,
      searchHistory,
      removeFromHistory,
      clearHistory: handleClearHistory,
      filtersExpanded,
      setFiltersExpanded,
      indexService: indexServiceRef.current,
      activeConversationId,
      setActiveConversationId,
      jumpToMessage,
      setJumpToMessageHandler,
      sidebarSearchActive,
      setSidebarSearchActive,
    }),
    [
      isOpen, openSearch, closeSearch,
      query, setQuery,
      parsedQuery, setParsedQuery,
      scope,
      results, loading,
      indexStatus,
      searchHistory, removeFromHistory, handleClearHistory,
      filtersExpanded,
      activeConversationId,
      jumpToMessage, setJumpToMessageHandler,
      sidebarSearchActive, setSidebarSearchActive,
    ],
  );

  return (
    <UnifiedSearchContext.Provider value={value}>
      {children}
    </UnifiedSearchContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUnifiedSearch(): UnifiedSearchContextValue {
  return useContext(UnifiedSearchContext);
}
