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
import type { CommunityMessage, CommunityEvent, MessageMetadata } from '@umbra/service';

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
  sendMessage: (content: string, replyToId?: string, metadata?: MessageMetadata) => Promise<CommunityMessage | null>;
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

export function useCommunityMessages(channelId: string | null, communityId?: string | null): UseCommunityMessagesResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<CommunityMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(false);

  // Track messages received via relay (bridge + remote Umbra members) that
  // don't exist in our local WASM DB. When we refresh from WASM we must
  // merge these back in so they don't disappear.
  const relayMessagesRef = useRef<Map<string, CommunityMessage>>(new Map());

  // Merge WASM DB results with relay-only messages (newest first).
  const mergeWithRelayMessages = useCallback((wasmMessages: CommunityMessage[]): CommunityMessage[] => {
    const relayMsgs = relayMessagesRef.current;
    if (relayMsgs.size === 0) return wasmMessages;

    // Collect relay messages not already in WASM results
    const wasmIds = new Set(wasmMessages.map((m) => m.id));
    const extras = Array.from(relayMsgs.values()).filter((m) => !wasmIds.has(m.id));
    if (extras.length === 0) return wasmMessages;

    // Merge and sort newest first
    const merged = [...wasmMessages, ...extras];
    merged.sort((a, b) => b.createdAt - a.createdAt);
    return merged;
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!service || !channelId) return;
    try {
      setIsLoading(true);
      const result = await service.getCommunityMessages(channelId, PAGE_SIZE);
      setMessages(mergeWithRelayMessages(result));
      setHasMore(result.length >= PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service, channelId, mergeWithRelayMessages]);

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
      relayMessagesRef.current.clear();
    }
  }, [channelId]);

  // Track which message IDs we added optimistically so we don't duplicate
  const optimisticIdsRef = useRef<Set<string>>(new Set());

  // Subscribe to community events for real-time message updates
  useEffect(() => {
    if (!service || !channelId) return;

    // Helper: refresh from WASM DB and merge with relay messages
    const refreshFromWasm = () => {
      service.getCommunityMessages(channelId, PAGE_SIZE).then((fresh) => {
        optimisticIdsRef.current.clear();
        setMessages(mergeWithRelayMessages(fresh));
      }).catch(() => {});
    };

    const unsubscribe = service.onCommunityEvent((event: CommunityEvent) => {
      switch (event.type) {
        case 'communityMessageSent':
          if (event.channelId === channelId) {
            // Skip our own messages — we already added them optimistically
            if (event.senderDid === identity?.did) break;

            // All relay messages (both bridge and Umbra members) include inline
            // content since the recipient doesn't have the message in their local
            // WASM DB. Construct a CommunityMessage from the event fields.
            if (event.content) {
              const now = Date.now();
              const inlineMsg: CommunityMessage = {
                id: event.messageId,
                channelId: event.channelId,
                senderDid: event.senderDid,
                content: event.content,
                edited: false,
                pinned: false,
                systemMessage: false,
                threadReplyCount: 0,
                createdAt: now,
                updatedAt: now,
                // Bridge messages carry sender display name & avatar from Discord
                senderDisplayName: event.senderDisplayName,
                senderAvatarUrl: event.senderAvatarUrl,
                // Platform identity for ghost seat lookup
                platformUserId: event.platformUserId,
                platform: event.platform,
                // Text effect metadata
                metadata: event.metadata,
              };
              // Persist in relay ref so it survives WASM DB refreshes
              relayMessagesRef.current.set(inlineMsg.id, inlineMsg);
              setMessages((prev) => {
                if (prev.some((m) => m.id === inlineMsg.id)) return prev;
                return [inlineMsg, ...prev];
              });

              // Persist to local WASM DB so message survives app restart
              service.storeReceivedCommunityMessage(
                event.messageId, event.channelId, event.senderDid, event.content, now,
                event.metadata,
              ).catch((err) =>
                console.warn('[useCommunityMessages] Failed to persist relay message:', err),
              );
            } else {
              // Event without content — refresh from local WASM DB
              refreshFromWasm();
            }
          }
          break;

        case 'communityMessageEdited':
          if (event.channelId === channelId) {
            refreshFromWasm();
          }
          break;

        case 'communityMessageDeleted':
          if (event.channelId === channelId) {
            relayMessagesRef.current.delete(event.messageId);
            setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
          }
          break;

        case 'communityReactionAdded':
        case 'communityReactionRemoved':
          // Refresh to get updated reactions
          refreshFromWasm();
          break;

        case 'communityMessagePinned':
        case 'communityMessageUnpinned':
          if (event.channelId === channelId) {
            refreshFromWasm();
            // Refresh the pinned messages list
            service.getCommunityPinnedMessages(channelId).then(setPinnedMessages).catch(() => {});
          }
          break;
      }
    });

    return unsubscribe;
  }, [service, channelId, identity?.did, mergeWithRelayMessages]);

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
    async (content: string, replyToId?: string, metadata?: MessageMetadata): Promise<CommunityMessage | null> => {
      if (!service || !channelId || !identity?.did) {
        return null;
      }
      try {
        const msg = await service.sendCommunityMessage(channelId, identity.did, content, replyToId, undefined, metadata);
        // Track this as an optimistic add so the event handler doesn't duplicate it
        optimisticIdsRef.current.add(msg.id);
        // Optimistically add the message (deduplicating in case event already fired)
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [msg, ...prev];
        });

        // Broadcast to other community members via relay.
        // Include `content` so recipients can display the message immediately
        // (they don't have it in their local WASM DB). The event handler
        // constructs a CommunityMessage from the event fields for display.
        // Include `channelName` so receivers can resolve to their local channel ID.
        if (communityId) {
          let channelName: string | undefined;
          try {
            const ch = await service.getChannel(channelId);
            channelName = ch.name;
          } catch { /* best-effort */ }
          const relayWs = service.getRelayWs();
          service.broadcastCommunityEvent(
            communityId,
            {
              type: 'communityMessageSent',
              channelId,
              channelName,
              messageId: msg.id,
              senderDid: identity.did,
              content,
              senderDisplayName: identity.displayName,
              senderAvatarUrl: identity.avatar,
              metadata,
            },
            identity.did,
            relayWs,
          ).catch((err) => console.warn('[useCommunityMessages] Failed to broadcast message:', err));
        }

        return msg;
      } catch (err) {
        console.error('[useCommunityMessages] sendMessage FAILED:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, channelId, communityId, identity?.did],
  );

  // Helper to broadcast a community event via the relay
  const broadcast = useCallback(
    (event: CommunityEvent) => {
      if (!service || !communityId || !identity?.did) return;
      const relayWs = service.getRelayWs();
      service.broadcastCommunityEvent(communityId, event, identity.did, relayWs)
        .catch((err) => console.warn('[useCommunityMessages] Broadcast failed:', err));
    },
    [service, communityId, identity?.did],
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
        if (channelId) broadcast({ type: 'communityMessageEdited', channelId, messageId });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, channelId, identity?.did, broadcast],
  );

  const deleteMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!service) return;
      try {
        await service.deleteCommunityMessage(messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (channelId) broadcast({ type: 'communityMessageDeleted', channelId, messageId });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, channelId, broadcast],
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
        broadcast({ type: 'communityMessagePinned', channelId, messageId });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, channelId, identity?.did, broadcast],
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
        broadcast({ type: 'communityMessageUnpinned', channelId, messageId });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, channelId, identity?.did, broadcast],
  );

  const addReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.addCommunityReaction(messageId, identity.did, emoji);
        broadcast({ type: 'communityReactionAdded', messageId, emoji, memberDid: identity.did });
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, identity?.did, broadcast],
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.removeCommunityReaction(messageId, identity.did, emoji);
        broadcast({ type: 'communityReactionRemoved', messageId, emoji, memberDid: identity.did });
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
