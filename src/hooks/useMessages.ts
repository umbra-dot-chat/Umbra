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
  /** Message count at the last successful markAsRead — skip WASM call when unchanged. */
  const lastMarkedCountRef = useRef<number>(0);

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

  // Guard against concurrent fetches — prevents racing WASM calls when
  // offline batch completion and initial fetch overlap.
  const fetchingRef = useRef(false);
  // Track which conversation was last successfully loaded so refreshes
  // (offlineBatchComplete, reactions) skip the isLoading toggle and avoid
  // 2 unnecessary re-renders of the entire ChatPage tree per refresh.
  const loadedConversationRef = useRef<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!service || !conversationId) {
      setMessages([]);
      setIsLoading(false);
      loadedConversationRef.current = null;
      return;
    }
    // Skip if already fetching — the in-flight fetch will return the latest data
    if (fetchingRef.current) {
      if (__DEV__) dbg.debug('messages', `getMessages SKIP (already fetching)`, { conversationId: conversationId.slice(0, 12) }, SRC);
      return;
    }
    fetchingRef.current = true;

    // Only show loading spinner for initial loads (new conversation), not
    // for silent refreshes triggered by events (offlineBatchComplete, reactions).
    // Toggling isLoading on refreshes caused 2 extra re-renders of the entire
    // ChatPage tree each time — with 126 offline messages that's a crash.
    const isInitialLoad = loadedConversationRef.current !== conversationId;

    if (__DEV__) dbg.info('messages', `getMessages START`, { conversationId: conversationId.slice(0, 12), isInitialLoad }, SRC);
    try {
      if (isInitialLoad) {
        setIsLoading(true);
        initialLoadDoneRef.current = false;
        setFirstUnreadMessageId(null);
      }
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
      loadedConversationRef.current = conversationId;
      initialLoadDoneRef.current = true;
    } catch (err) {
      if (__DEV__) dbg.error('messages', `getMessages FAILED`, { conversationId: conversationId.slice(0, 12), error: err }, SRC);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (isInitialLoad) setIsLoading(false);
      fetchingRef.current = false;
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
    // Reset the markAsRead guard when switching conversations —
    // otherwise two conversations with the same message count would
    // incorrectly skip the first markAsRead on the new conversation.
    lastMarkedCountRef.current = 0;

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

  // ── Unified mutation queue ──
  // ALL message events (new messages, status changes, edits, content updates,
  // thread replies, deletes, pins) are accumulated in a single queue and flushed
  // once per animation frame. In a 5-member group chat this coalesces dozens of
  // individual setMessages calls (each triggering a ChatArea re-render) into one
  // update per frame — the difference between 20+ renders/sec and ~1-2.
  type MsgMutation =
    | { type: 'append'; messages: Message[] }
    | { type: 'statusChanged'; messageId: string; status: any }
    | { type: 'edited'; messageId: string; newText: string; editedAt?: number }
    | { type: 'contentUpdated'; messageId: string; newText: string }
    | { type: 'deleted'; messageId: string; deletedAt?: number }
    | { type: 'threadReply'; parentId: string }
    | { type: 'pinned'; messageId: string; pinnedBy?: string; pinnedAt?: number }
    | { type: 'unpinned'; messageId: string };

  const pendingMutationsRef = useRef<MsgMutation[]>([]);
  const flushScheduledRef = useRef(false);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMessagesRef = useRef<Message[]>([]);
  // Buffer for content updates that arrive before their message exists (streaming race condition)
  const earlyContentUpdatesRef = useRef<Map<string, string>>(new Map());

  // Debounced fetchMessages — prevents 22+ concurrent refetches from
  // offline batch completions. Only the last request within 500ms fires.
  const debouncedFetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = useCallback(() => {
    if (debouncedFetchTimerRef.current) {
      if (__DEV__) dbg.trace('messages', 'debouncedFetch RESET (timer already pending)', undefined, SRC);
      clearTimeout(debouncedFetchTimerRef.current);
    } else {
      if (__DEV__) dbg.debug('messages', 'debouncedFetch SCHEDULED (500ms)', undefined, SRC);
    }
    debouncedFetchTimerRef.current = setTimeout(() => {
      debouncedFetchTimerRef.current = null;
      if (__DEV__) dbg.info('messages', 'debouncedFetch FIRING', undefined, SRC);
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

    /** Schedule a unified flush after a short delay (idempotent).
     *
     * Previously this used requestAnimationFrame (~16ms / 60fps), which meant
     * every animation frame during bulk offline processing (126 msgs) triggered
     * a setMessages → full ChatPage re-render cascade. With 60 flushes/sec the
     * render storm crashed the tab. A 150ms timer reduces flushes to ~7/sec
     * while still feeling instant for individual messages. */
    const scheduleFlush = () => {
      if (!flushScheduledRef.current) {
        flushScheduledRef.current = true;
        flushTimerRef.current = setTimeout(flushAllMutations, 150);
      }
    };

    /**
     * Flush ALL queued mutations (new messages + status changes + edits + …)
     * into a single setMessages call. This is the critical path that prevents
     * O(N²) re-renders in group chats with active bots.
     */
    const flushAllMutations = () => {
      flushScheduledRef.current = false;

      // Grab and clear both queues atomically
      const mutations = pendingMutationsRef.current;
      const appendBatch = pendingMessagesRef.current;
      pendingMutationsRef.current = [];
      pendingMessagesRef.current = [];

      if (mutations.length === 0 && appendBatch.length === 0) return;

      if (__DEV__) dbg.debug('messages', `flushAll: ${appendBatch.length} appends + ${mutations.length} mutations`, undefined, SRC);

      setMessages((prev) => {
        let next = prev;
        let changed = false;

        // 1. Append new messages (deduped)
        if (appendBatch.length > 0) {
          const existingIds = new Set(next.map((m) => m.id));
          const newMsgs = appendBatch.filter((m) => !existingIds.has(m.id));
          if (newMsgs.length > 0) {
            // Apply any buffered early content updates to newly appended messages
            const earlyUpdates = earlyContentUpdatesRef.current;
            const resolvedNewMsgs = earlyUpdates.size > 0
              ? newMsgs.map((m) => {
                  const earlyText = earlyUpdates.get(m.id);
                  if (earlyText !== undefined) {
                    earlyUpdates.delete(m.id);
                    return { ...m, content: { type: 'text' as const, text: earlyText } };
                  }
                  return m;
                })
              : newMsgs;
            next = [...next, ...resolvedNewMsgs];
            changed = true;
            if (__DEV__) dbg.debug('messages', `flush append: ${newMsgs.length} new of ${appendBatch.length}`, undefined, SRC);
          }
        }

        // 2. Apply all point mutations in a single pass
        if (mutations.length > 0) {
          // Build lookup maps for O(1) mutation application
          const statusMap = new Map<string, any>();
          const editMap = new Map<string, { newText: string; editedAt?: number }>();
          const contentMap = new Map<string, string>();
          const deleteMap = new Map<string, number | undefined>();
          const threadReplySet = new Set<string>();
          const pinMap = new Map<string, { pinned: boolean; pinnedBy?: string; pinnedAt?: number }>();

          for (const mut of mutations) {
            switch (mut.type) {
              case 'statusChanged': statusMap.set(mut.messageId, mut.status); break;
              case 'edited': editMap.set(mut.messageId, { newText: mut.newText, editedAt: mut.editedAt }); break;
              case 'contentUpdated': contentMap.set(mut.messageId, mut.newText); break;
              case 'deleted': deleteMap.set(mut.messageId, mut.deletedAt); break;
              case 'threadReply': threadReplySet.add(mut.parentId); break;
              case 'pinned': pinMap.set(mut.messageId, { pinned: true, pinnedBy: mut.pinnedBy, pinnedAt: mut.pinnedAt }); break;
              case 'unpinned': pinMap.set(mut.messageId, { pinned: false }); break;
            }
          }

          const hasMutations = statusMap.size + editMap.size + contentMap.size +
            deleteMap.size + threadReplySet.size + pinMap.size > 0;

          if (hasMutations) {
            const existingIds = new Set(next.map((m) => m.id));
            next = next.map((m) => {
              let updated = m;
              let dirty = false;

              const s = statusMap.get(m.id);
              if (s !== undefined) { updated = { ...updated, status: s }; dirty = true; }

              const e = editMap.get(m.id);
              if (e) { updated = { ...updated, content: { type: 'text' as const, text: e.newText }, edited: true, editedAt: e.editedAt }; dirty = true; }

              const c = contentMap.get(m.id);
              if (c !== undefined) { updated = { ...updated, content: { type: 'text' as const, text: c } }; dirty = true; contentMap.delete(m.id); }

              const d = deleteMap.get(m.id);
              if (d !== undefined) { updated = { ...updated, deleted: true, deletedAt: d }; dirty = true; }

              if (threadReplySet.has(m.id)) { updated = { ...updated, threadReplyCount: (m.threadReplyCount ?? 0) + 1 }; dirty = true; }

              const p = pinMap.get(m.id);
              if (p) {
                updated = p.pinned
                  ? { ...updated, pinned: true, pinnedBy: p.pinnedBy, pinnedAt: p.pinnedAt }
                  : { ...updated, pinned: false, pinnedBy: undefined, pinnedAt: undefined };
                dirty = true;
              }

              return dirty ? updated : m;
            });
            changed = true;

            // Buffer content updates that couldn't be applied (message not yet in state).
            // This handles the streaming race condition where chat_message_update arrives
            // before the initial chat_message has been stored and appended.
            if (contentMap.size > 0) {
              for (const [mid, text] of contentMap) {
                if (!existingIds.has(mid)) {
                  earlyContentUpdatesRef.current.set(mid, text);
                }
              }
            }
          }
        }

        if (!changed) return prev;

        // Cap at 200 messages
        const capped = next.length > 200 ? next.slice(next.length - 200) : next;
        if (__DEV__) dbg.debug('messages', `flushAll result: ${prev.length}→${capped.length} msgs`, undefined, SRC);
        return capped;
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
          pendingMutationsRef.current.push({ type: 'threadReply', parentId: msg.threadId });
          scheduleFlush();
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
          // Batch message into pending buffer and schedule a unified flush
          pendingMessagesRef.current.push(msg);
          scheduleFlush();
        }
      } else if (event.type === 'threadReplyReceived') {
        if (event.message?.conversationId === conversationId && event.parentId) {
          pendingMutationsRef.current.push({ type: 'threadReply', parentId: event.parentId });
          scheduleFlush();
        }
      } else if (event.type === 'messageEdited') {
        pendingMutationsRef.current.push({ type: 'edited', messageId: event.messageId, newText: event.newText, editedAt: event.editedAt });
        scheduleFlush();
      } else if (event.type === 'messageContentUpdated') {
        pendingMutationsRef.current.push({ type: 'contentUpdated', messageId: event.messageId, newText: event.newText });
        scheduleFlush();
      } else if (event.type === 'messageDeleted') {
        pendingMutationsRef.current.push({ type: 'deleted', messageId: event.messageId, deletedAt: event.deletedAt });
        scheduleFlush();
      } else if (event.type === 'messageStatusChanged') {
        pendingMutationsRef.current.push({ type: 'statusChanged', messageId: event.messageId, status: event.status });
        scheduleFlush();
      } else if (event.type === 'reactionAdded' || event.type === 'reactionRemoved') {
        // Refresh messages to get updated reactions — debounced to prevent flood
        if (__DEV__) dbg.debug('messages', 'reaction event → debounced fetchMessages()', undefined, SRC);
        debouncedFetch();
      } else if (event.type === 'messagePinned' || event.type === 'messageUnpinned') {
        if (event.type === 'messagePinned') {
          pendingMutationsRef.current.push({ type: 'pinned', messageId: event.messageId, pinnedBy: event.pinnedBy, pinnedAt: event.pinnedAt });
        } else {
          pendingMutationsRef.current.push({ type: 'unpinned', messageId: event.messageId });
        }
        scheduleFlush();
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
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
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
        // The event listener will add it to the messages list
        return message;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, conversationId, groupId, getRelayWs]
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
            if (__DEV__) dbg.warn('messages', 'Failed to register file in shared files', { error: String(err) }, SRC);
          }
        }

        return message;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, conversationId, groupId, getRelayWs, myDid]
  );

  // Mark conversation as read + coalesce relay read-receipt sends.
  // Skips the WASM/DB call entirely when message count hasn't changed
  // since the last mark (the DB UPDATE is a no-op anyway, but we avoid
  // the WASM FFI overhead + 2 SQL execute round-trips).
  const markAsRead = useCallback(async () => {
    if (!service || !conversationId) return;
    try {
      // Skip if no messages loaded yet (nothing to mark as read).
      const currentCount = messagesRef.current.length;
      if (currentCount === 0) return;

      // Skip if no new messages since we last marked — avoids 2 SQL
      // execute round-trips that are guaranteed no-ops.
      if (currentCount === lastMarkedCountRef.current) return;

      lastMarkedCountRef.current = currentCount;
      await service.markAsRead(conversationId);

      // Notify ConversationsContext so it can optimistically zero-out
      // the unread badge without a full DB refetch.
      service.dispatchMessageEvent({ type: 'messagesRead', conversationId });

      // Group chats: send a single watermark update instead of per-message
      // read receipts (which generate N WASM calls per member and freeze the UI).
      if (groupId) {
        const msgs = messagesRef.current;
        const lastMsg = msgs[msgs.length - 1];
        if (!lastMsg) return;

        try {
          service.groupMarkRead(groupId, myDid, lastMsg.id, lastMsg.timestamp);
        } catch (err) {
          if (__DEV__) dbg.warn('messages', 'Failed to persist group read watermark', { error: String(err) }, SRC);
        }

        // Broadcast watermark to group members via relay
        const relayWs = getRelayWs();
        if (relayWs && relayWs.readyState === WebSocket.OPEN) {
          const envelope = JSON.stringify({
            envelope: 'group_read_receipt',
            version: 1,
            payload: {
              groupId,
              memberDid: myDid,
              lastReadMessageId: lastMsg.id,
              lastReadTimestamp: lastMsg.timestamp,
            },
          });
          // Build relay messages via service to get proper encryption
          // For now, send raw envelope to each member (group read receipts
          // don't need encryption — they contain no message content)
          const sendToMembers = async () => {
            try {
              const members = await service.getGroupMembers(groupId);
              for (const member of members) {
                if (member.memberDid !== myDid) {
                  relayWs.send(JSON.stringify({
                    type: 'send',
                    to_did: member.memberDid,
                    payload: envelope,
                  }));
                }
              }
            } catch (err) {
              if (__DEV__) dbg.warn('messages', 'Failed to broadcast group read receipt', { error: String(err) }, SRC);
            }
          };
          sendToMembers();
        }
        return;
      }

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
              ).catch((err) => {
                if (__DEV__) dbg.warn('messages', 'Failed to send read receipt', { error: String(err) }, SRC);
              });
            }
          }
        } catch (err) {
          if (__DEV__) dbg.error('messages', 'Failed to send read receipts', { error: String(err) }, SRC);
        }
      }, 2000);
    } catch (err) {
      if (__DEV__) dbg.error('messages', 'Failed to mark as read', { error: String(err) }, SRC);
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
