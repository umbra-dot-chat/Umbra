/**
 * useConversations — Hook for conversation list with real-time updates.
 *
 * Fetches conversations from the Umbra backend and subscribes to
 * message events for real-time new-message updates.
 *
 * ## Usage
 *
 * ```tsx
 * const { conversations, isLoading, error, refresh } = useConversations();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import type { Conversation, MessageEvent, FriendEvent } from '@umbra/service';

export interface UseConversationsResult {
  /** List of conversations sorted by last activity */
  conversations: Conversation[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from fetching conversations */
  error: Error | null;
  /** Manually refresh the conversation list */
  refresh: () => Promise<void>;
}

export function useConversations(): UseConversationsResult {
  const { service, isReady } = useUmbra();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = useCallback(async () => {
    if (!service) return;
    try {
      const result = await service.getConversations();
      setConversations(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  // Initial fetch
  useEffect(() => {
    if (isReady && service) {
      fetchConversations();
    }
  }, [isReady, service, fetchConversations]);

  // Subscribe to message events for real-time updates
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onMessageEvent((_event: MessageEvent) => {
      // Refresh the conversation list when any message event occurs
      // This updates last_message_at, unread_count, etc.
      fetchConversations();
    });

    return unsubscribe;
  }, [service, fetchConversations]);

  // Subscribe to friend events — accepting a request creates a conversation
  useEffect(() => {
    if (!service) return;

    const unsubscribe = service.onFriendEvent((_event: FriendEvent) => {
      fetchConversations();
    });

    return unsubscribe;
  }, [service, fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    refresh: fetchConversations,
  };
}
