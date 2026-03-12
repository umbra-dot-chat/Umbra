/**
 * ConversationsContext — Single-instance provider for conversation data.
 *
 * Previously, useConversations was a hook used by 6+ components, each
 * independently subscribing to message/friend events and fetching from
 * the database.  This caused:
 *   - 4+ duplicate DB queries on every event
 *   - 8+ redundant event listeners (message + friend per instance)
 *   - Render cascades as each instance updates state independently
 *
 * This context centralizes everything into ONE provider instance.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import type { Conversation, MessageEvent, FriendEvent } from '@umbra/service';
import { dbg } from '@/utils/debug';

const SRC = 'ConversationsProvider';

/** Minimum interval between event-triggered fetches (ms). */
const FETCH_DEBOUNCE_MS = 300;

export interface ConversationsContextValue {
  conversations: Conversation[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: React.ReactNode }) {
  if (__DEV__) dbg.trackRender(SRC);
  const { service, isReady } = useUmbra();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchCountRef = useRef(0);
  const lastFetchRef = useRef(0);

  const fetchConversations = useCallback(async () => {
    if (!service) return;
    const fetchNum = ++fetchCountRef.current;
    const now = performance.now();
    const sinceLastFetch = now - lastFetchRef.current;
    lastFetchRef.current = now;

    if (__DEV__) {
      dbg.info('conversations', `getConversations START (#${fetchNum}, gap: ${sinceLastFetch.toFixed(0)}ms)`, undefined, SRC);
      if (sinceLastFetch < 100 && fetchNum > 2) {
        dbg.warn('conversations', `RAPID fetch (#${fetchNum}) — only ${sinceLastFetch.toFixed(0)}ms since last!`, undefined, SRC);
      }
    }

    try {
      const endTimer = __DEV__ ? dbg.time(`getConversations #${fetchNum}`) : null;
      const result = await service.getConversations();
      if (__DEV__) endTimer?.();
      if (__DEV__) dbg.info('conversations', `getConversations DONE (#${fetchNum})`, { count: result.length }, SRC);
      setConversations(result);
      setError(null);
    } catch (err) {
      if (__DEV__) dbg.error('conversations', `getConversations FAILED (#${fetchNum})`, err, SRC);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Stable ref for fetchConversations — used in the debounced fetch and event
  // subscriptions to avoid including it in effect deps (which causes infinite loops).
  const fetchConversationsRef = useRef(fetchConversations);
  fetchConversationsRef.current = fetchConversations;

  // Debounced version for event-triggered refreshes.
  // Uses ref to avoid depending on fetchConversations identity.
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      fetchConversationsRef.current();
    }, FETCH_DEBOUNCE_MS);
  }, []);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Initial fetch
  useEffect(() => {
    if (isReady && service) {
      if (__DEV__) dbg.info('conversations', 'initial fetch triggered', undefined, SRC);
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, service]);

  // Subscribe to message events — ONE listener for the whole app
  useEffect(() => {
    if (!service) return;

    if (__DEV__) dbg.info('conversations', 'subscribing to onMessageEvent (single instance)', undefined, SRC);
    const unsubscribe = service.onMessageEvent((event: MessageEvent) => {
      if (__DEV__) dbg.debug('conversations', 'onMessageEvent → debounced refresh', { type: event.type }, SRC);
      debouncedFetch();
    });

    return () => {
      if (__DEV__) dbg.info('conversations', 'unsubscribing from onMessageEvent', undefined, SRC);
      unsubscribe();
    };
  }, [service, debouncedFetch]);

  // Subscribe to friend events — ONE listener for the whole app
  useEffect(() => {
    if (!service) return;

    if (__DEV__) dbg.info('conversations', 'subscribing to onFriendEvent (single instance)', undefined, SRC);
    const unsubscribe = service.onFriendEvent((event: FriendEvent) => {
      if (__DEV__) dbg.debug('conversations', 'onFriendEvent → debounced refresh', { type: event.type }, SRC);
      debouncedFetch();
    });

    return () => {
      if (__DEV__) dbg.info('conversations', 'unsubscribing from onFriendEvent', undefined, SRC);
      unsubscribe();
    };
  }, [service, debouncedFetch]);

  const value = React.useMemo<ConversationsContextValue>(
    () => ({ conversations, isLoading, error, refresh: fetchConversations }),
    [conversations, isLoading, error, fetchConversations],
  );

  return (
    <ConversationsContext.Provider value={value}>
      {children}
    </ConversationsContext.Provider>
  );
}

/**
 * Access conversation data from the ConversationsContext.
 *
 * Must be used within a `<ConversationsProvider>`.
 */
export function useConversationsContext(): ConversationsContextValue {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error(
      'useConversationsContext must be used within a <ConversationsProvider>.',
    );
  }
  return context;
}
