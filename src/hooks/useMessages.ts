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
import { getWasm } from '@umbra/wasm';
import type { Message, MessageEvent, FileMessagePayload } from '@umbra/service';
import { dbg } from '@/utils/debug';

const PAGE_SIZE = 50;

/** Stable ref wrapper — keeps a ref in sync with the latest value. */
function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

/**
 * Check if the user has opted out of sending read receipts.
 * Reads the `privacy_read_receipts` key from the KV store.
 * Returns `true` (enabled) by default if the key is absent or on error.
 */
async function isReadReceiptsEnabled(): Promise<boolean> {
  try {
    const wasm = getWasm();
    if (!wasm) return true;
    const result = await (wasm as any).umbra_wasm_plugin_kv_get('__umbra_system__', 'privacy_read_receipts');
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return parsed?.value !== 'false';
  } catch {
    return true;
  }
}

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
  /** Send a file message */
  sendFileMessage: (filePayload: FileMessagePayload) => Promise<Message | null>;
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
  /** ID of the first new (unread) message received after initial load */
  firstUnreadMessageId: string | null;
  /** Clear the unread divider (e.g. after the user has seen the messages) */
  clearUnreadMarker: () => void;
}

const SRC = 'useMessages';

export function useMessages(conversationId: string | null, groupId?: string | null): UseMessagesResult {
  if (__DEV__) dbg.trackRender(SRC);
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
  const eventCountRef = useRef(0);
  const lastSoundRef = useRef<number>(0);
  const markAsReadReceiptTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs for functions used inside the event subscription effect.
  // This prevents the effect from re-subscribing (and causing an infinite
  // render loop) every time these callbacks get new identities.
  const fetchMessagesRef = useLatest<(() => Promise<void>) | null>(null);
  const fetchPinnedRef = useLatest<(() => Promise<void>) | null>(null);
  const playSoundRef = useLatest(playSound);
  const messagesRef = useLatest(messages);

  // Track the first new message received after the initial fetch so we can
  // render a "New messages" divider in the chat area.
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);
  const initialLoadDoneRef = useRef(false);
  const clearUnreadMarker = useCallback(() => setFirstUnreadMessageId(null), []);

  const fetchMessages = useCallback(async () => {
    if (!service || !conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    if (__DEV__) dbg.info('messages', `getMessages START`, { conversationId: conversationId.slice(0, 12) }, SRC);
    try {
      setIsLoading(true);
      initialLoadDoneRef.current = false;
      setFirstUnreadMessageId(null);
      const endTimer = __DEV__ ? dbg.time(`getMessages(${conversationId.slice(0, 8)})`) : null;
      const result = await service.getMessages(conversationId, {
        limit: PAGE_SIZE,
        offset: 0,
      });
      if (__DEV__) endTimer?.();
      if (__DEV__) dbg.info('messages', `getMessages DONE`, { count: result.length, conversationId: conversationId.slice(0, 12) }, SRC);
      setMessages(result);
      offsetRef.current = result.length;
      setHasMore(result.length >= PAGE_SIZE);
      setError(null);
      initialLoadDoneRef.current = true;
    } catch (err) {
      if (__DEV__) dbg.error('messages', `getMessages FAILED`, { conversationId: conversationId.slice(0, 12), error: err }, SRC);
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

  // Keep refs in sync so the event subscription can call the latest version
  // without needing them in its dependency array.
  fetchMessagesRef.current = fetchMessages;
  fetchPinnedRef.current = fetchPinned;

  // Initial fetch when conversation changes
  // NOTE: We intentionally omit fetchMessages/fetchPinned from deps —
  // they depend on the same [service, conversationId] already listed,
  // and including them caused cascading re-subscriptions.
  useEffect(() => {
    if (isReady && service && conversationId) {
      fetchMessages();
      fetchPinned();
    } else {
      setMessages([]);
      setPinnedMessages([]);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, service, conversationId]);

  // Batch incoming messages to prevent render cascade from rapid arrivals.
  // Messages are collected in a buffer and flushed in a single setState
  // call on the next animation frame (max ~60 flushes/sec instead of 20+).
  const pendingMessagesRef = useRef<Message[]>([]);
  const flushScheduledRef = useRef(false);

  // Debounced fetchMessages — prevents 22+ concurrent refetches from
  // offline batch completions. Only the last request within 500ms fires.
  const debouncedFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = useCallback(() => {
    if (debouncedFetchTimerRef.current) {
      clearTimeout(debouncedFetchTimerRef.current);
    }
    debouncedFetchTimerRef.current = setTimeout(() => {
      debouncedFetchTimerRef.current = null;
      fetchMessagesRef.current?.();
    }, 500);
  }, []);

  // Subscribe to real-time message events.
  //
  // IMPORTANT: This effect must NOT depend on fetchMessages, fetchPinned,
  // playSound, or myDid. Those caused an infinite render loop:
  //   fetchMessages has new identity → effect re-subscribes → event fires →
  //   calls fetchMessages() → sets state → re-render → new fetchMessages →
  //   effect re-subscribes → … (OOM crash in ~2 seconds on Chrome)
  //
  // Instead, we read the latest versions from refs inside the event handler.
  useEffect(() => {
    if (!service || !conversationId) return;

    /** Flush batched messages into state in a single update. */
    const flushPendingMessages = () => {
      flushScheduledRef.current = false;
      const batch = pendingMessagesRef.current;
      if (batch.length === 0) return;
      pendingMessagesRef.current = [];

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = batch.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length === 0) return prev;
        const next = [...prev, ...newMsgs];
        // Cap at 500 messages to prevent unbounded memory growth.
        if (next.length > 500) {
          return next.slice(next.length - 500);
        }
        return next;
      });
    };

    if (__DEV__) dbg.info('messages', 'subscribing to onMessageEvent', { conversationId: conversationId?.slice(0, 12) }, SRC);
    const unsubscribe = service.onMessageEvent((event: MessageEvent) => {
      const evtNum = ++eventCountRef.current;
      if (__DEV__) dbg.debug('messages', `onMessageEvent #${evtNum}`, {
        type: event.type,
        conversationId: (event as any).conversationId?.slice(0, 12),
        messageId: (event as any).messageId?.slice(0, 12),
      }, SRC);
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
          const hasContent =
            typeof msg.content === 'string'
            || msg.content?.type === 'text'
            || msg.content?.type === 'file';
          if (!hasContent) return;
          // Play receive sound for messages from others (throttled: max 1 per 2s)
          if (event.type === 'messageReceived' && msg.senderDid !== myDid) {
            const now = Date.now();
            if (now - lastSoundRef.current >= 2000) {
              lastSoundRef.current = now;
              playSoundRef.current('message_receive');
            }
            // Mark the first incoming message after initial load as the unread boundary
            if (initialLoadDoneRef.current) {
              setFirstUnreadMessageId((prev) => prev ?? msg.id);
            }
          }
          // Batch message into pending buffer and schedule a single flush
          pendingMessagesRef.current.push(msg);
          if (!flushScheduledRef.current) {
            flushScheduledRef.current = true;
            requestAnimationFrame(flushPendingMessages);
          }
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
      } else if (event.type === 'messageContentUpdated') {
        // Streaming/progressive content update — does NOT set edited flag
        setMessages((prev) =>
          prev.map((m) =>
            m.id === event.messageId
              ? { ...m, content: { type: 'text' as const, text: event.newText } }
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
        // Refresh messages to get updated reactions — debounced to prevent flood
        if (__DEV__) dbg.debug('messages', 'reaction event → debounced fetchMessages()', undefined, SRC);
        debouncedFetch();
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
        fetchPinnedRef.current?.();
      } else if (event.type === 'offlineBatchComplete') {
        // Offline messages were stored in DB without individual dispatches.
        // Re-fetch from DB if this conversation received any offline messages.
        // Debounced to prevent 22+ concurrent refetches from rapid batch completions.
        if (event.conversationIds.includes(conversationId)) {
          if (__DEV__) dbg.info('messages', 'offlineBatchComplete → debounced fetchMessages()', { conversationId: conversationId?.slice(0, 12) }, SRC);
          debouncedFetch();
        }
      }
    });

    return () => {
      unsubscribe();
      if (debouncedFetchTimerRef.current) {
        clearTimeout(debouncedFetchTimerRef.current);
      }
      if (markAsReadReceiptTimerRef.current) {
        clearTimeout(markAsReadReceiptTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service, conversationId]);

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
        const message = groupId
          ? await service.sendGroupMessage(groupId, conversationId, text, relayWs)
          : await service.sendMessage(conversationId, text, relayWs);
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
    [service, conversationId, groupId, getRelayWs, playSound]
  );

  const sendFileMessage = useCallback(
    async (filePayload: FileMessagePayload): Promise<Message | null> => {
      if (!service || !conversationId) return null;

      try {
        const relayWs = getRelayWs();
        const message = groupId
          ? await service.sendGroupFileMessage(groupId, conversationId, filePayload, relayWs)
          : await service.sendFileMessage(conversationId, filePayload, relayWs);
        if (message.status === 'sending') {
          pushPendingRelayAck(message.id);
        }
        playSound('message_send');

        // Register in dm_shared_files so it appears in the Shared Files panel
        if (myDid) {
          try {
            const record = await service.uploadDmFile(
              conversationId,
              null,                          // folderId — root level for chat attachments
              filePayload.filename,
              null,                          // description
              filePayload.size,
              filePayload.mimeType,
              filePayload.storageChunksJson,
              myDid,
            );
            service.dispatchDmFileEvent({
              conversationId,
              senderDid: myDid,
              timestamp: Date.now(),
              event: { type: 'fileUploaded', file: record },
            });
          } catch (err) {
            // Non-fatal: the message was sent, just the shared files entry failed
            console.warn('[useMessages] Failed to register file in shared files:', err);
          }
        }

        return message;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, conversationId, groupId, getRelayWs, playSound, myDid]
  );

  // Debounce read-receipt relay sends — when messages stream in rapidly the
  // caller (useEffect on messages.length) fires markAsRead on every arrival.
  // We mark locally immediately but coalesce the expensive relay receipts
  // into a single batch every 2 seconds.
  const markAsRead = useCallback(async () => {
    if (!service || !conversationId) return;
    try {
      // Always mark locally so unread badges update (cheap DB op)
      await service.markAsRead(conversationId);

      // Skip per-message read receipts for group chats — they generate N
      // build_receipt_envelope WASM calls per member, which freezes the UI
      // when bots send messages rapidly. DMs still get individual receipts.
      if (groupId) return;

      // Debounce the relay receipt sends — skip if a flush is already scheduled
      if (markAsReadReceiptTimerRef.current) return;

      markAsReadReceiptTimerRef.current = setTimeout(async () => {
        markAsReadReceiptTimerRef.current = null;
        try {
          const enabled = await isReadReceiptsEnabled();
          if (!enabled) return;

          const relayWs = getRelayWs();
          if (relayWs) {
            const unreadFromOthers = messagesRef.current.filter(
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
          console.error('[useMessages] Failed to send read receipts:', err);
        }
      }, 2000);
    } catch (err) {
      console.error('[useMessages] Failed to mark as read:', err);
    }
  }, [service, conversationId, getRelayWs, myDid]);

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
    sendFileMessage,
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
    firstUnreadMessageId,
    clearUnreadMarker,
  };
}
