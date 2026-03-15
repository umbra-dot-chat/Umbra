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

/** Minimum interval between event-triggered fetches (ms).
 *  Increased from 300ms to 1000ms to prevent excessive getConversations
 *  WASM calls during rapid message bursts (e.g. bots in group chat). */
const FETCH_DEBOUNCE_MS = 1000;

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
      // Only update state if conversations actually changed — prevents
      // unnecessary re-renders of every conversation-dependent component
      // when the data is identical (e.g. repeated event-triggered fetches).
      setConversations(prev => {
        if (
          prev.length === result.length &&
          prev.every((c, i) =>
            c.id === result[i].id &&
            c.lastMessageAt === result[i].lastMessageAt &&
            c.unreadCount === result[i].unreadCount,
          )
        ) {
          return prev; // Same reference — no re-render
        }
        return result;
      });
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

  // Throttled version for event-triggered refreshes (leading + trailing).
  // The old trailing-only debounce starved during sustained bot floods — the
  // timer kept resetting so getConversations() never fired until the burst
  // ended.  A throttle fires immediately on the first event, then at most
  // once per FETCH_DEBOUNCE_MS, with one trailing call to capture the last
  // batch of events.
  const lastThrottleFetchRef = useRef(0);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const throttledFetch = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastThrottleFetchRef.current;

    if (elapsed >= FETCH_DEBOUNCE_MS) {
      // Leading edge: fire immediately
      lastThrottleFetchRef.current = now;
      fetchConversationsRef.current();
    } else if (!trailingTimerRef.current) {
      // Schedule trailing edge if not already pending
      trailingTimerRef.current = setTimeout(() => {
        trailingTimerRef.current = null;
        lastThrottleFetchRef.current = Date.now();
        fetchConversationsRef.current();
      }, FETCH_DEBOUNCE_MS - elapsed);
    }
    // If trailing is already scheduled, do nothing (it will pick up latest data)
  }, []);

  // Clean up trailing timer on unmount
  useEffect(() => {
    return () => {
      if (trailingTimerRef.current) {
        clearTimeout(trailingTimerRef.current);
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
      // Optimistic update: zero-out the unread badge immediately without
      // a full DB refetch — markAsRead already wrote to the database.
      if (event.type === 'messagesRead') {
        if (__DEV__) dbg.debug('conversations', 'onMessageEvent → optimistic unread reset', { conversationId: event.conversationId }, SRC);
        setConversations(prev =>
          prev.map(c =>
            c.id === event.conversationId && c.unreadCount > 0
              ? { ...c, unreadCount: 0 }
              : c,
          ),
        );
        return;
      }

      if (__DEV__) dbg.debug('conversations', 'onMessageEvent → debounced refresh', { type: event.type }, SRC);
      throttledFetch();
    });

    return () => {
      if (__DEV__) dbg.info('conversations', 'unsubscribing from onMessageEvent', undefined, SRC);
      unsubscribe();
    };
  }, [service, throttledFetch]);

  // Subscribe to friend events — ONE listener for the whole app
  useEffect(() => {
    if (!service) return;

    if (__DEV__) dbg.info('conversations', 'subscribing to onFriendEvent (single instance)', undefined, SRC);
    const unsubscribe = service.onFriendEvent((event: FriendEvent) => {
      if (__DEV__) dbg.debug('conversations', 'onFriendEvent → debounced refresh', { type: event.type }, SRC);
      throttledFetch();
    });

    return () => {
      if (__DEV__) dbg.info('conversations', 'unsubscribing from onFriendEvent', undefined, SRC);
      unsubscribe();
    };
  }, [service, throttledFetch]);

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
