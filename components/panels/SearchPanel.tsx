import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MessageSearch } from '@coexist/wisp-react-native';
import type { SearchResult } from '@coexist/wisp-react-native/src/components/message-search';
import { useUmbra } from '@/contexts/UmbraContext';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import type { Message } from '@umbra/service';

export interface SearchPanelProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  /** Active conversation to search within */
  conversationId?: string | null;
  /** Callback when a search result is clicked (e.g. to scroll to message) */
  onResultClick?: (messageId: string) => void;
}

/** Debounce delay in ms before performing search */
const SEARCH_DEBOUNCE_MS = 300;
/** Maximum number of messages to load for client-side search */
const MAX_SEARCH_MESSAGES = 500;

export function SearchPanel({ query, onQueryChange, onClose, conversationId, onResultClick }: SearchPanelProps) {
  const { service } = useUmbra();
  const { friends } = useFriends();
  const { identity } = useAuth();
  const myDid = identity?.did ?? '';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build a DID -> display name map
  const friendNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of friends) {
      map[f.did] = f.displayName;
    }
    return map;
  }, [friends]);

  const resolveDisplayName = useCallback((senderDid: string) => {
    if (senderDid === myDid) return 'You';
    return friendNames[senderDid] || senderDid.slice(0, 16);
  }, [myDid, friendNames]);

  const formatTimestamp = useCallback((ts: number) => {
    const tsMs = ts < 1000000000000 ? ts * 1000 : ts;
    return new Date(tsMs).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }, []);

  // Perform the search: load messages then filter client-side
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!service || !conversationId || !searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load messages in pages for client-side search
      let allMessages: Message[] = [];
      let offset = 0;
      const pageSize = 50;

      while (offset < MAX_SEARCH_MESSAGES) {
        const page = await service.getMessages(conversationId, { offset, limit: pageSize });
        allMessages = allMessages.concat(page);
        if (page.length < pageSize) break; // No more messages
        offset += pageSize;
      }

      // Filter by query (case-insensitive)
      const lowerQuery = searchQuery.toLowerCase();
      const matched = allMessages.filter((msg) => {
        if (msg.deleted) return false;
        if (msg.content.type === 'text') {
          return msg.content.text.toLowerCase().includes(lowerQuery);
        }
        return false;
      });

      // Convert to SearchResult format
      const searchResults: SearchResult[] = matched.map((msg) => ({
        id: msg.id,
        sender: resolveDisplayName(msg.senderDid),
        content: msg.content.type === 'text' ? msg.content.text : '',
        timestamp: formatTimestamp(msg.timestamp),
      }));

      setResults(searchResults);
    } catch (err) {
      console.warn('[SearchPanel] Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [service, conversationId, resolveDisplayName, formatTimestamp]);

  // Keep a ref to the latest performSearch so the effect doesn't depend on it
  const performSearchRef = useRef(performSearch);
  performSearchRef.current = performSearch;

  // Debounced search triggered on query change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults((prev) => (prev.length === 0 ? prev : []));
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      performSearchRef.current(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [query]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick?.(result.id);
  }, [onResultClick]);

  return (
    <MessageSearch
      query={query}
      onQueryChange={onQueryChange}
      results={results}
      loading={loading}
      totalResults={results.length}
      onClose={onClose}
      onResultClick={handleResultClick}
    />
  );
}
