/**
 * useCommunityMessages — Hook for messages in a community channel.
 *
 * Fetches messages with pagination and subscribes to community events
 * for real-time message updates (new messages, edits, deletes, reactions).
 *
 * ## Usage
 *
 * ```tsx
 * const { messages, isLoading, hasMore, loadMore, sendMessage } = useCommunityMessages(channelId);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { CommunityMessage, CommunityEvent } from '@umbra/service';

const PAGE_SIZE = 50;

export interface UseCommunityMessagesResult {
  /** Messages in the channel (newest first) */
  messages: CommunityMessage[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Whether there are more messages to load */
  hasMore: boolean;
  /** Error from fetching */
  error: Error | null;
  /** Load older messages (pagination) */
  loadMore: () => Promise<void>;
  /** Send a new message */
  sendMessage: (content: string, replyToId?: string) => Promise<CommunityMessage | null>;
  /** Edit a message */
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  /** Delete a message */
  deleteMessage: (messageId: string) => Promise<void>;
  /** Pin a message */
  pinMessage: (messageId: string) => Promise<void>;
  /** Unpin a message */
  unpinMessage: (messageId: string) => Promise<void>;
  /** Add a reaction */
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  /** Remove a reaction */
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  /** Manually refresh messages */
  refresh: () => Promise<void>;
  /** Pinned messages for this channel */
  pinnedMessages: CommunityMessage[];
  /** Refresh the pinned messages list */
  refreshPinned: () => Promise<void>;
}

export function useCommunityMessages(channelId: string | null): UseCommunityMessagesResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<CommunityMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    if (!service || !channelId) return;
    try {
      setIsLoading(true);
      const result = await service.getCommunityMessages(channelId, PAGE_SIZE);
      setMessages(result);
      setHasMore(result.length >= PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service, channelId]);

  const fetchPinned = useCallback(async () => {
    if (!service || !channelId) return;
    try {
      const pinned = await service.getCommunityPinnedMessages(channelId);
      setPinnedMessages(pinned);
    } catch (err) {
      console.warn('[useCommunityMessages] Failed to fetch pinned:', err);
    }
  }, [service, channelId]);

  // Initial fetch
  useEffect(() => {
    if (isReady && service && channelId) {
      fetchMessages();
      fetchPinned();
    }
  }, [isReady, service, channelId, fetchMessages, fetchPinned]);

  // Reset state when channel changes
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      setPinnedMessages([]);
      setIsLoading(false);
      setHasMore(true);
    }
  }, [channelId]);

  // Track which message IDs we added optimistically so we don't duplicate
  const optimisticIdsRef = useRef<Set<string>>(new Set());

  // Subscribe to community events for real-time message updates
  useEffect(() => {
    if (!service || !channelId) return;

    const unsubscribe = service.onCommunityEvent((event: CommunityEvent) => {
      switch (event.type) {
        case 'communityMessageSent':
          if (event.channelId === channelId) {
            // Bridge messages include inline content (they don't exist in local WASM DB).
            // Construct a CommunityMessage from the event fields and append to state.
            if (event.content) {
              const bridgeMsg: CommunityMessage = {
                id: event.messageId,
                channelId: event.channelId,
                senderDid: event.senderDid,
                content: event.content,
                edited: false,
                pinned: false,
                systemMessage: false,
                threadReplyCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                // Bridge messages carry sender display name & avatar from Discord
                senderDisplayName: event.senderDisplayName,
                senderAvatarUrl: event.senderAvatarUrl,
              };
              setMessages((prev) => {
                if (prev.some((m) => m.id === bridgeMsg.id)) return prev;
                return [bridgeMsg, ...prev];
              });
            } else {
              // Regular (non-bridge) message: refresh from WASM DB.
              // If we sent this optimistically, the message is already in state.
              service.getCommunityMessages(channelId, PAGE_SIZE).then((fresh) => {
                optimisticIdsRef.current.clear();
                setMessages(fresh);
              }).catch(() => {});
            }
          }
          break;

        case 'communityMessageEdited':
          if (event.channelId === channelId) {
            service.getCommunityMessages(channelId, PAGE_SIZE).then(setMessages).catch(() => {});
          }
          break;

        case 'communityMessageDeleted':
          if (event.channelId === channelId) {
            setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
          }
          break;

        case 'communityReactionAdded':
        case 'communityReactionRemoved':
          // Refresh to get updated reactions
          service.getCommunityMessages(channelId, PAGE_SIZE).then(setMessages).catch(() => {});
          break;

        case 'communityMessagePinned':
        case 'communityMessageUnpinned':
          if (event.channelId === channelId) {
            service.getCommunityMessages(channelId, PAGE_SIZE).then(setMessages).catch(() => {});
            // Refresh the pinned messages list
            service.getCommunityPinnedMessages(channelId).then(setPinnedMessages).catch(() => {});
          }
          break;
      }
    });

    return unsubscribe;
  }, [service, channelId]);

  const loadMore = useCallback(async () => {
    if (!service || !channelId || loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    try {
      const oldestMessage = messages[messages.length - 1];
      const beforeTimestamp = oldestMessage?.createdAt;
      const olderMessages = await service.getCommunityMessages(channelId, PAGE_SIZE, beforeTimestamp);
      setMessages((prev) => [...prev, ...olderMessages]);
      setHasMore(olderMessages.length >= PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      loadingRef.current = false;
    }
  }, [service, channelId, hasMore, messages]);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string): Promise<CommunityMessage | null> => {
      if (!service || !channelId || !identity?.did) return null;
      try {
        const msg = await service.sendCommunityMessage(channelId, identity.did, content, replyToId);
        // Track this as an optimistic add so the event handler doesn't duplicate it
        optimisticIdsRef.current.add(msg.id);
        // Optimistically add the message (deduplicating in case event already fired)
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [msg, ...prev];
        });
        return msg;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, channelId, identity?.did],
  );

  const editMessage = useCallback(
    async (messageId: string, newContent: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.editCommunityMessage(messageId, newContent, identity.did);
        // Update local state
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: newContent, edited: true, editedAt: Date.now() } : m,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, identity?.did],
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!service) return;
      try {
        await service.deleteCommunityMessage(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const pinMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!service || !channelId || !identity?.did) return;
      try {
        await service.pinCommunityMessage(messageId, channelId, identity.did);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, pinned: true, pinnedBy: identity.did, pinnedAt: Date.now() } : m,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, channelId, identity?.did],
  );

  const unpinMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!service || !channelId || !identity?.did) return;
      try {
        await service.unpinCommunityMessage(messageId, channelId, identity.did);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, pinned: false, pinnedBy: undefined, pinnedAt: undefined } : m,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, channelId, identity?.did],
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.addCommunityReaction(messageId, identity.did, emoji);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, identity?.did],
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.removeCommunityReaction(messageId, identity.did, emoji);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, identity?.did],
  );

  return {
    messages,
    isLoading,
    hasMore,
    error,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    addReaction,
    removeReaction,
    refresh: fetchMessages,
    pinnedMessages,
    refreshPinned: fetchPinned,
  };
}
