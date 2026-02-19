/**
 * useMessages — Hook for messages in a conversation with pagination and real-time updates.
 *
 * Fetches messages from the Umbra backend and subscribes to
 * message events for real-time incoming messages.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   messages, isLoading, hasMore,
 *   loadMore, sendMessage, markAsRead,
 *   editMessage, deleteMessage, pinMessage, unpinMessage,
 *   addReaction, removeReaction, forwardMessage,
 *   getThreadReplies, sendThreadReply, pinnedMessages,
 * } = useMessages(conversationId);
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { useNetwork, pushPendingRelayAck } from '@/hooks/useNetwork';
import type { Message, MessageEvent } from '@umbra/service';

const PAGE_SIZE = 50;

export interface UseMessagesResult {
  /** Messages in chronological order */
  messages: Message[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from fetching or sending */
  error: Error | null;
  /** Whether more messages are available for pagination */
  hasMore: boolean;
  /** Load the next page of older messages */
  loadMore: () => Promise<void>;
  /** Send a new text message */
  sendMessage: (text: string, replyToId?: string) => Promise<Message | null>;
  /** Mark all messages in this conversation as read */
  markAsRead: () => Promise<void>;
  /** Refresh the message list */
  refresh: () => Promise<void>;
  /** Edit a message */
  editMessage: (messageId: string, newText: string) => Promise<void>;
  /** Delete a message */
  deleteMessage: (messageId: string) => Promise<void>;
  /** Pin a message */
  pinMessage: (messageId: string) => Promise<void>;
  /** Unpin a message */
  unpinMessage: (messageId: string) => Promise<void>;
  /** Add reaction to a message */
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  /** Remove reaction from a message */
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
  /** Forward a message to another conversation */
  forwardMessage: (messageId: string, targetConversationId: string) => Promise<void>;
  /** Get thread replies for a message */
  getThreadReplies: (parentId: string) => Promise<Message[]>;
  /** Send a reply in a thread */
  sendThreadReply: (parentId: string, text: string) => Promise<Message | null>;
  /** Pinned messages in this conversation */
  pinnedMessages: Message[];
  /** Refresh pinned messages */
  refreshPinned: () => Promise<void>;
}

export function useMessages(conversationId: string | null): UseMessagesResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();
  const { playSound } = useSound();
  const { getRelayWs } = useNetwork();
  const myDid = identity?.did ?? '';
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const offsetRef = useRef(0);

  const fetchMessages = useCallback(async () => {
    if (!service || !conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const result = await service.getMessages(conversationId, {
        limit: PAGE_SIZE,
        offset: 0,
      });
      setMessages(result);
      offsetRef.current = result.length;
      setHasMore(result.length >= PAGE_SIZE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service, conversationId]);

  const fetchPinned = useCallback(async () => {
    if (!service || !conversationId) {
      setPinnedMessages([]);
      return;
    }
    try {
      const result = await service.getPinnedMessages(conversationId);
      setPinnedMessages(result);
    } catch {
      // silently fail
    }
  }, [service, conversationId]);

  // Initial fetch when conversation changes
  useEffect(() => {
    if (isReady && service && conversationId) {
      fetchMessages();
      fetchPinned();
    } else {
      setMessages([]);
      setPinnedMessages([]);
      setIsLoading(false);
    }
  }, [isReady, service, conversationId, fetchMessages, fetchPinned]);

  // Subscribe to real-time message events
  useEffect(() => {
    if (!service || !conversationId) return;

    const unsubscribe = service.onMessageEvent((event: MessageEvent) => {
      if (event.type === 'messageSent' || event.type === 'messageReceived') {
        const msg = event.message;
        // Don't add thread replies to the main chat — they belong in the thread panel
        if (msg.threadId) {
          // Increment the thread reply count on the parent message
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.threadId
                ? { ...m, threadReplyCount: (m.threadReplyCount ?? 0) + 1 }
                : m
            )
          );
          return;
        }
        if (msg.conversationId === conversationId) {
          // Don't append messages with empty content (e.g. from decryption failure)
          const text = typeof msg.content === 'string' ? msg.content : (msg.content?.type === 'text' ? msg.content.text : undefined);
          if (!text) return;
          // Play receive sound for messages from others
          if (event.type === 'messageReceived' && msg.senderDid !== myDid) {
            playSound('message_receive');
          }
          setMessages((prev) => [...prev, msg]);
        }
      } else if (event.type === 'threadReplyReceived') {
        // Thread reply received from relay — don't add to main chat,
        // just increment the reply count on the parent message
        if (event.message?.conversationId === conversationId && event.parentId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === event.parentId
                ? { ...m, threadReplyCount: (m.threadReplyCount ?? 0) + 1 }
                : m
            )
          );
        }
      } else if (event.type === 'messageEdited') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId
              ? { ...m, content: { type: 'text' as const, text: event.newText }, edited: true, editedAt: event.editedAt }
              : m
          )
        );
      } else if (event.type === 'messageDeleted') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId
              ? { ...m, deleted: true, deletedAt: event.deletedAt }
              : m
          )
        );
      } else if (event.type === 'messageStatusChanged') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId
              ? { ...m, status: event.status }
              : m
          )
        );
      } else if (event.type === 'reactionAdded' || event.type === 'reactionRemoved') {
        // Refresh messages to get updated reactions
        fetchMessages();
      } else if (event.type === 'messagePinned' || event.type === 'messageUnpinned') {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== event.messageId) return m;
            if (event.type === 'messagePinned') {
              return { ...m, pinned: true, pinnedBy: event.pinnedBy, pinnedAt: event.pinnedAt };
            }
            return { ...m, pinned: false, pinnedBy: undefined, pinnedAt: undefined };
          })
        );
        fetchPinned();
      }
    });

    return unsubscribe;
  }, [service, conversationId, fetchMessages, fetchPinned, playSound, myDid]);

  const loadMore = useCallback(async () => {
    if (!service || !conversationId || !hasMore) return;

    try {
      const older = await service.getMessages(conversationId, {
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      if (older.length > 0) {
        setMessages((prev) => [...older, ...prev]);
        offsetRef.current += older.length;
      }
      setHasMore(older.length >= PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service, conversationId, hasMore]);

  const sendMessage = useCallback(
    async (text: string, _replyToId?: string): Promise<Message | null> => {
      if (!service || !conversationId) return null;

      try {
        const relayWs = getRelayWs();
        const message = await service.sendMessage(conversationId, text, relayWs);
        // Track the relay ack so we can transition sending → sent
        if (message.status === 'sending') {
          pushPendingRelayAck(message.id);
        }
        playSound('message_send');
        // The event listener will add it to the messages list
        return message;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, conversationId, getRelayWs, playSound]
  );

  const markAsRead = useCallback(async () => {
    if (!service || !conversationId) return;
    try {
      await service.markAsRead(conversationId);

      // Send read receipts for messages from other users
      const relayWs = getRelayWs();
      if (relayWs) {
        const unreadFromOthers = messages.filter(
          (m) => m.status !== 'read' && m.senderDid !== myDid
        );
        for (const msg of unreadFromOthers) {
          service.sendDeliveryReceipt(
            msg.id, conversationId, msg.senderDid, 'read', relayWs
          ).catch((err) =>
            console.warn('[useMessages] Failed to send read receipt:', err)
          );
        }
      }
    } catch (err) {
      console.error('[useMessages] Failed to mark as read:', err);
    }
  }, [service, conversationId, messages, getRelayWs, myDid]);

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!service) return;
    try {
      await service.editMessage(messageId, newText);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!service) return;
    try {
      await service.deleteMessage(messageId);
      playSound('message_delete');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service, playSound]);

  const pinMessage = useCallback(async (messageId: string) => {
    if (!service) return;
    try {
      await service.pinMessage(messageId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const unpinMessage = useCallback(async (messageId: string) => {
    if (!service) return;
    try {
      await service.unpinMessage(messageId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!service) return;
    try {
      await service.addReaction(messageId, emoji);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!service) return;
    try {
      await service.removeReaction(messageId, emoji);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const forwardMessage = useCallback(async (messageId: string, targetConversationId: string) => {
    if (!service) return;
    try {
      await service.forwardMessage(messageId, targetConversationId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [service]);

  const getThreadReplies = useCallback(async (parentId: string): Promise<Message[]> => {
    if (!service) return [];
    try {
      return await service.getThreadReplies(parentId);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [service]);

  const sendThreadReply = useCallback(async (parentId: string, text: string): Promise<Message | null> => {
    if (!service) return null;
    try {
      const relayWs = getRelayWs();
      const message = await service.sendThreadReply(parentId, text, relayWs);
      // Track the relay ack so we can transition sending → sent
      if (message.status === 'sending') {
        pushPendingRelayAck(message.id);
      }
      return message;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, [service, getRelayWs]);

  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    sendMessage,
    markAsRead,
    refresh: fetchMessages,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    addReaction,
    removeReaction,
    forwardMessage,
    getThreadReplies,
    sendThreadReply,
    pinnedMessages,
    refreshPinned: fetchPinned,
  };
}
