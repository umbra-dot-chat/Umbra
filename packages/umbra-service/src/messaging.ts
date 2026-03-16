/**
 * Messaging module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm, base64ToUtf8 } from './helpers';
import type {
  Message,
  MessageContent,
  Conversation,
  MessageReaction,
  MessageEvent,
  ChatMessagePayload,
} from './types';

// Debug bridge — accesses app-layer logger singleton if available
const _dbg = (): any => (globalThis as any).__umbra_logger_instance;
const SRC = 'svc:messaging';

/**
 * Payload for sending a file as a message.
 */
export interface FileMessagePayload {
  fileId: string;
  filename: string;
  size: number;
  mimeType: string;
  storageChunksJson: string;
}

/**
 * Categorize a decryption error into a user-friendly message.
 *
 * Error codes are prefixed by the WASM layer (e.g. "KEY_MISMATCH:...").
 */
function categorizeDecryptError(err: unknown): string {
  const errStr = String(err);
  if (errStr.includes('KEY_MISMATCH')) {
    return '[Encrypted with a different key]';
  } else if (errStr.includes('FRIEND_NOT_FOUND')) {
    return '[Sender unknown]';
  } else if (errStr.includes('CONVERSATION_NOT_FOUND')) {
    return '[Message from unknown conversation]';
  } else if (errStr.includes('INVALID_FORMAT')) {
    return '[Corrupted message]';
  }
  return '[Unable to decrypt message]';
}

/**
 * Get all conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  _dbg()?.debug('conversations', 'getConversations START', undefined, SRC);
  const resultJson = wasm().umbra_wasm_messaging_get_conversations();
  const result = await parseWasm<Conversation[]>(resultJson);
  _dbg()?.debug('conversations', `getConversations DONE → ${result.length} conversations`, undefined, SRC);
  return result;
}

/**
 * Create (or get) a DM conversation for a given friend.
 *
 * Uses a deterministic conversation ID derived from both DIDs so that both
 * sides always produce the same ID.  If the conversation already exists this
 * is a no-op.
 *
 * @param friendDid - The friend's DID
 * @returns The conversation ID
 */
export async function createDmConversation(friendDid: string): Promise<string> {
  const resultJson = wasm().umbra_wasm_messaging_create_dm_conversation(friendDid);
  const raw = await parseWasm<{ conversation_id: string }>(resultJson);
  return raw.conversation_id;
}

/**
 * Send a message
 *
 * Encrypts and stores the message locally, then optionally sends it
 * via relay for delivery to the recipient.
 *
 * @param conversationId - Conversation to send to
 * @param text - Message text
 * @param relayWs - Optional WebSocket to send via relay
 * @returns The sent message
 */
export async function sendMessage(
  conversationId: string,
  text: string,
  relayWs?: WebSocket | null
): Promise<Message> {
  _dbg()?.info('messages', `sendMessage cid=${conversationId.slice(0, 8)}… len=${text.length}`, undefined, SRC);
  const _t0 = performance.now();
  const resultJson = wasm().umbra_wasm_messaging_send(conversationId, text);
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_send dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_send: ${_dur.toFixed(1)}ms`, { cid: conversationId.slice(0, 8), textLen: text.length }, 'messaging');
  const raw = await parseWasm<{
    id: string;
    conversationId: string;
    senderDid: string;
    timestamp: number;
    delivered: boolean;
    read: boolean;
    relayMessages?: Array<{ toDid: string; payload: string }>;
  }>(resultJson);

  // Send relay envelopes (built in Rust) for offline/non-P2P delivery
  let relaySent = false;
  if (relayWs && relayWs.readyState === WebSocket.OPEN && raw.relayMessages) {
    for (const rm of raw.relayMessages) {
      try {
        relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
        relaySent = true;
      } catch (err) {
        _dbg()?.warn?.('messages', 'Failed to send relay message', { error: String(err) }, SRC);
      }
    }
  }

  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderDid: raw.senderDid,
    content: { type: 'text', text },
    timestamp: raw.timestamp,
    read: raw.read,
    delivered: raw.delivered,
    status: relaySent ? 'sending' : 'sent',
  };
}

/**
 * Send a file message
 *
 * Encodes file metadata as a JSON bridge payload, sends it as a text message
 * via the WASM layer, then returns a Message with proper file content type.
 *
 * @param conversationId - Conversation to send to
 * @param filePayload - File metadata (fileId, filename, size, mimeType, storageChunksJson)
 * @param relayWs - Optional WebSocket to send via relay
 * @returns The sent message with file content
 */
export async function sendFileMessage(
  conversationId: string,
  filePayload: FileMessagePayload,
  relayWs?: WebSocket | null
): Promise<Message> {
  // Encode as JSON bridge text — the WASM layer only supports text content
  const encoded = JSON.stringify({
    __file: true,
    ...filePayload,
  });

  const message = await sendMessage(conversationId, encoded, relayWs);

  // Override content to use the typed file variant
  const fileContent: MessageContent = {
    type: 'file',
    fileId: filePayload.fileId,
    filename: filePayload.filename,
    size: filePayload.size,
    mimeType: filePayload.mimeType,
    storageChunksJson: filePayload.storageChunksJson,
  };

  return {
    ...message,
    content: fileContent,
  };
}

/**
 * Get messages in a conversation
 *
 * @param conversationId - Conversation ID
 * @param options - Pagination options
 */
export async function getMessages(
  conversationId: string,
  options?: { offset?: number; limit?: number }
): Promise<Message[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  _dbg()?.debug('messages', `getMessages START cid=${conversationId.slice(0, 8)}… limit=${limit} offset=${offset}`, undefined, SRC);
  const _t0 = performance.now();
  const resultJson = wasm().umbra_wasm_messaging_get_messages(
    conversationId,
    limit,
    offset
  );
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_get_messages dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_get_messages: ${_dur.toFixed(1)}ms`, { cid: conversationId.slice(0, 8), limit, offset }, 'messaging');

  const raw = await parseWasm<Array<{
    id: string;
    conversationId: string;
    senderDid: string;
    contentEncrypted: string;
    nonce: string;
    timestamp: number;
    delivered: boolean;
    read: boolean;
    threadReplyCount?: number;
    threadId?: string;
  }>>(resultJson);

  // Filter out thread replies — they belong in the thread panel, not the main chat
  const mainMessages = raw.filter((m) => !m.threadId);

  // Decrypt messages sequentially to avoid overwhelming V8 with concurrent
  // WASM calls. Promise.all(50 decrypts) previously exhausted the GC budget
  // during startup, causing "Ineffective mark-compacts" → renderer crash.
  const results: Message[] = [];
  let _decryptOk = 0;
  let _decryptFail = 0;
  let _decryptTotalMs = 0;
  for (const m of mainMessages) {
    let text = '';
    try {
      if (m.conversationId.startsWith('group-')) {
        // Group messages store pre-decrypted plaintext as UTF-8 bytes.
        // WASM returns the raw bytes as base64 on load.
        try {
          text = base64ToUtf8(m.contentEncrypted);
          // Guard: detect garbled ciphertext that was stored before the
          // plaintext-storage fix. Ciphertext decoded as UTF-8 produces
          // replacement chars (U+FFFD) and non-printable control chars.
          if (text.length > 0) {
            const sample = text.slice(0, 40);
            // eslint-disable-next-line no-control-regex
            const badChars = (sample.match(/[\uFFFD\u0000-\u0008\u000E-\u001F\u25C8]/g) || []).length;
            if (badChars > sample.length * 0.15) {
              text = '[Unable to decode message]';
            }
          }
        } catch {
          // Fallback: may be raw plaintext from before the encoding change.
          // Guard against raw ciphertext — if it looks like base64 gibberish
          // (long string with no spaces), show a friendly indicator instead
          // to prevent the markdown parser from OOM-crashing V8.
          if (m.contentEncrypted.length > 500 && !m.contentEncrypted.includes(' ')) {
            text = '[Unable to decode message]';
          } else {
            text = m.contentEncrypted;
          }
        }
      } else {
        // DM messages: decrypt using ECDH shared secret
        // Rust now returns content_encrypted as base64 (converted from hex in WASM)
        const _t0d = performance.now();
        const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
          m.conversationId,
          m.contentEncrypted,
          m.nonce,
          m.senderDid,
          m.timestamp
        );
        const _durD = performance.now() - _t0d;
        _decryptTotalMs += _durD;
        _dbg()?.tracePerf?.('service', `wasm.messaging_decrypt dur=${_durD.toFixed(1)}ms`, _durD, 'messaging');
        if (_durD > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_decrypt: ${_durD.toFixed(1)}ms`, { mid: m.id.slice(0, 8) }, 'messaging');
        text = await parseWasm<string>(decryptedJson);
        _decryptOk++;
      }
    } catch (err) {
      // Fallback: show a user-friendly indicator instead of raw ciphertext
      _dbg()?.warn?.('messages', 'decrypt failed for msg', { mid: m.id?.slice(0, 8), error: String(err) }, SRC);
      text = categorizeDecryptError(err);
      _decryptFail++;
    }
    results.push({
      id: m.id,
      conversationId: m.conversationId,
      senderDid: m.senderDid,
      content: { type: 'text' as const, text },
      timestamp: m.timestamp,
      read: m.read,
      delivered: m.delivered,
      status: m.read ? ('read' as const) : m.delivered ? ('delivered' as const) : ('sent' as const),
      threadReplyCount: m.threadReplyCount ?? 0,
      threadId: m.threadId,
    });
  }
  const _avgMs = _decryptOk > 0 ? _decryptTotalMs / _decryptOk : 0;
  _dbg()?.info?.('service', `getMessages DECRYPT DONE: total=${mainMessages.length}, decrypted=${_decryptOk}, failed=${_decryptFail}, totalMs=${_decryptTotalMs.toFixed(1)}, avgMs=${_avgMs.toFixed(1)}`, { cid: conversationId.slice(0, 8) }, 'messaging');
  return results;
}

/**
 * Mark messages as read
 *
 * @param conversationId - Conversation ID
 * @returns Number of messages marked as read
 */
export async function markAsRead(conversationId: string): Promise<number> {
  return await wasm().umbra_wasm_messaging_mark_read(conversationId);
}

/**
 * Edit a message
 */
export async function editMessage(messageId: string, newText: string): Promise<Message> {
  const json = JSON.stringify({ message_id: messageId, new_text: newText });
  const _t0 = performance.now();
  const resultJson = wasm().umbra_wasm_messaging_edit(json);
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_edit dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_edit: ${_dur.toFixed(1)}ms`, { mid: messageId.slice(0, 8) }, 'messaging');
  return await parseWasm<Message>(resultJson);
}

/**
 * Update an incoming message's encrypted content (no sender check).
 * Used for streaming/progressive message updates from remote peers (e.g. Ghost AI).
 */
export async function updateIncomingMessageContent(
  messageId: string,
  contentEncrypted: string,
  nonce: string,
  timestamp: number,
): Promise<void> {
  const json = JSON.stringify({ message_id: messageId, content_encrypted: contentEncrypted, nonce, timestamp });
  const _t0 = performance.now();
  wasm().umbra_wasm_messaging_update_incoming_content(json);
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_update_incoming_content dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_update_incoming_content: ${_dur.toFixed(1)}ms`, { mid: messageId.slice(0, 8) }, 'messaging');
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const json = JSON.stringify({ message_id: messageId });
  const _t0 = performance.now();
  wasm().umbra_wasm_messaging_delete(json);
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_delete dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_delete: ${_dur.toFixed(1)}ms`, { mid: messageId.slice(0, 8) }, 'messaging');
}

/**
 * Pin a message
 */
export async function pinMessage(messageId: string): Promise<Message> {
  const json = JSON.stringify({ message_id: messageId });
  const resultJson = wasm().umbra_wasm_messaging_pin(json);
  return await parseWasm<Message>(resultJson);
}

/**
 * Unpin a message
 */
export async function unpinMessage(messageId: string): Promise<void> {
  const json = JSON.stringify({ message_id: messageId });
  wasm().umbra_wasm_messaging_unpin(json);
}

/**
 * Add a reaction to a message
 */
export async function addReaction(messageId: string, emoji: string): Promise<MessageReaction[]> {
  const json = JSON.stringify({ message_id: messageId, emoji });
  const resultJson = wasm().umbra_wasm_messaging_add_reaction(json);
  const result = await parseWasm<{ reactions: MessageReaction[] }>(resultJson);
  return result.reactions;
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(messageId: string, emoji: string): Promise<MessageReaction[]> {
  const json = JSON.stringify({ message_id: messageId, emoji });
  const resultJson = wasm().umbra_wasm_messaging_remove_reaction(json);
  const result = await parseWasm<{ reactions: MessageReaction[] }>(resultJson);
  return result.reactions;
}

/**
 * Forward a message to another conversation
 */
export async function forwardMessage(messageId: string, targetConversationId: string): Promise<Message> {
  const json = JSON.stringify({ message_id: messageId, target_conversation_id: targetConversationId });
  const resultJson = wasm().umbra_wasm_messaging_forward(json);
  return await parseWasm<Message>(resultJson);
}

/**
 * Get thread replies for a message
 */
export async function getThreadReplies(parentId: string): Promise<Message[]> {
  const json = JSON.stringify({ parent_id: parentId });
  const resultJson = wasm().umbra_wasm_messaging_get_thread(json);
  const raw = await parseWasm<Array<any>>(resultJson);
  const results: Message[] = [];
  for (const m of raw) {
    let text = '';
    try {
      if (m.conversationId?.startsWith('group-')) {
        text = m.contentEncrypted || '';
      } else {
        const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
          m.conversationId,
          m.contentEncrypted || '',
          m.nonce || '',
          m.senderDid,
          m.timestamp
        );
        text = await parseWasm<string>(decryptedJson);
      }
    } catch (err) {
      text = categorizeDecryptError(err);
    }
    results.push({
      id: m.id,
      conversationId: m.conversationId,
      senderDid: m.senderDid,
      content: { type: 'text' as const, text },
      timestamp: m.timestamp,
      read: m.read ?? false,
      delivered: m.delivered ?? false,
      status: 'sent' as const,
      threadId: m.threadId,
    });
  }
  return results;
}

/**
 * Send a reply in a thread
 */
export async function sendThreadReply(
  parentId: string,
  text: string,
  relayWs?: WebSocket | null
): Promise<Message> {
  const json = JSON.stringify({ parent_id: parentId, text });
  const _t0 = performance.now();
  const resultJson = wasm().umbra_wasm_messaging_reply_thread(json);
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_reply_thread dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_reply_thread: ${_dur.toFixed(1)}ms`, { parentId: parentId.slice(0, 8) }, 'messaging');
  const raw = await parseWasm<{
    id: string;
    conversationId: string;
    senderDid: string;
    timestamp: number;
    threadId?: string;
    relayMessages?: Array<{ toDid: string; payload: string }>;
  }>(resultJson);

  // Send relay envelopes (built in Rust) for offline/non-P2P delivery
  let relaySent = false;
  if (relayWs && relayWs.readyState === WebSocket.OPEN && raw.relayMessages) {
    for (const rm of raw.relayMessages) {
      try {
        relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
        relaySent = true;
      } catch (err) {
        _dbg()?.warn?.('messages', 'Failed to send relay message (thread)', { error: String(err) }, SRC);
      }
    }
  }

  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderDid: raw.senderDid,
    content: { type: 'text', text },
    timestamp: raw.timestamp,
    read: false,
    delivered: false,
    status: relaySent ? 'sending' : 'sent',
    threadId: parentId,
  };
}

/**
 * Get pinned messages in a conversation
 */
export async function getPinnedMessages(conversationId: string): Promise<Message[]> {
  const json = JSON.stringify({ conversation_id: conversationId });
  const _t0 = performance.now();
  const resultJson = wasm().umbra_wasm_messaging_get_pinned(json);
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_get_pinned dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_get_pinned: ${_dur.toFixed(1)}ms`, { cid: conversationId.slice(0, 8) }, 'messaging');
  const raw = await parseWasm<Array<any>>(resultJson);
  const results: Message[] = [];
  for (const m of raw) {
    let text = '';
    try {
      if (m.conversationId?.startsWith('group-')) {
        text = m.contentEncrypted || '';
      } else {
        const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
          m.conversationId,
          m.contentEncrypted || '',
          m.nonce || '',
          m.senderDid,
          m.timestamp
        );
        text = await parseWasm<string>(decryptedJson);
      }
    } catch (err) {
      text = categorizeDecryptError(err);
    }
    results.push({
      id: m.id,
      conversationId: m.conversationId,
      senderDid: m.senderDid,
      content: { type: 'text' as const, text },
      timestamp: m.timestamp,
      read: m.read ?? false,
      delivered: m.delivered ?? false,
      status: 'sent' as const,
      pinned: true,
      pinnedBy: m.pinnedBy,
      pinnedAt: m.pinnedAt,
    });
  }
  return results;
}

/**
 * Send typing indicator to a specific user via relay.
 *
 * @param conversationId - Conversation ID
 * @param recipientDid - DID of the recipient to notify
 * @param senderDid - Our DID
 * @param senderName - Our display name
 * @param isTyping - Whether we started or stopped typing
 * @param relayWs - WebSocket for relay delivery
 */
export async function sendTypingIndicator(
  conversationId: string,
  recipientDid: string,
  senderDid: string,
  senderName: string,
  isTyping: boolean,
  relayWs?: WebSocket | null
): Promise<void> {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;

  // Build envelope in Rust, TS just sends it
  const json = JSON.stringify({
    conversation_id: conversationId,
    recipient_did: recipientDid,
    sender_did: senderDid,
    sender_name: senderName,
    is_typing: isTyping,
  });
  const resultJson = wasm().umbra_wasm_messaging_build_typing_envelope(json);
  const rm = await parseWasm<{ toDid: string; payload: string }>(resultJson);
  relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
}

/**
 * Store an incoming chat message received via relay.
 *
 * @param payload - The chat message payload from the relay envelope
 */
export async function storeIncomingMessage(payload: ChatMessagePayload): Promise<void> {
  _dbg()?.info('messages', `storeIncoming mid=${payload.messageId?.slice(0, 8)}… cid=${payload.conversationId?.slice(0, 8)}… from=${payload.senderDid?.slice(0, 16)}…`, undefined, SRC);
  const data: Record<string, unknown> = {
    message_id: payload.messageId,
    conversation_id: payload.conversationId,
    sender_did: payload.senderDid,
    content_encrypted: payload.contentEncrypted,
    nonce: payload.nonce,
    timestamp: payload.timestamp,
  };
  // Include thread_id if this is a thread reply
  if (payload.threadId) {
    data.thread_id = payload.threadId;
  }
  // Skip friend validation for group messages (members authenticated via group key)
  if (payload.isGroup) {
    data.is_group = true;
  }
  const json = JSON.stringify(data);
  const _t0 = performance.now();
  await wasm().umbra_wasm_messaging_store_incoming(json);
  const _dur = performance.now() - _t0;
  _dbg()?.tracePerf?.('service', `wasm.messaging_store_incoming dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
  if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_store_incoming: ${_dur.toFixed(1)}ms`, { mid: payload.messageId?.slice(0, 8) }, 'messaging');
}

/**
 * Decrypt an incoming message payload.
 *
 * Attempts to decrypt the encrypted content using the shared secret
 * for the conversation. Returns the decrypted plaintext, or a
 * fallback string if decryption fails.
 */
export async function decryptIncomingMessage(payload: ChatMessagePayload): Promise<string | null> {
  try {
    // Rust now accepts f64 for timestamp (no BigInt needed)
    const _t0 = performance.now();
    const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
      payload.conversationId,
      payload.contentEncrypted,
      payload.nonce,
      payload.senderDid,
      payload.timestamp
    );
    const _dur = performance.now() - _t0;
    _dbg()?.tracePerf?.('service', `wasm.messaging_decrypt(incoming) dur=${_dur.toFixed(1)}ms`, _dur, 'messaging');
    if (_dur > 50) _dbg()?.warn?.('service', `SLOW wasm.messaging_decrypt(incoming): ${_dur.toFixed(1)}ms`, { mid: payload.messageId?.slice(0, 8) }, 'messaging');
    const text = await parseWasm<string>(decryptedJson);
    // Guard against empty string from WASM (shouldn't happen, but be safe)
    return text || null;
  } catch (err) {
    _dbg()?.warn?.('messages', 'Decryption failed for incoming message', {
      mid: payload.messageId?.slice(0, 8),
      cid: payload.conversationId?.slice(0, 8),
      from: payload.senderDid?.slice(0, 16),
      nonce: payload.nonce?.slice(0, 16),
      error: String(err),
      category: categorizeDecryptError(err),
    }, SRC);
    return null;
  }
}

/**
 * Update message delivery status.
 *
 * @param messageId - Message ID
 * @param status - 'sent', 'delivered', or 'read'
 */
export async function updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
  const json = JSON.stringify({
    message_id: messageId,
    status,
  });
  wasm().umbra_wasm_messaging_update_status(json);
}

/**
 * Mark a group as read up to a specific message (local watermark upsert).
 *
 * @param groupId - Group ID
 * @param memberDid - The member's DID
 * @param lastReadMessageId - ID of the last read message
 * @param lastReadTimestamp - Timestamp of the last read message
 */
export function groupMarkRead(
  groupId: string,
  memberDid: string,
  lastReadMessageId: string,
  lastReadTimestamp: number,
): void {
  wasm().umbra_wasm_group_mark_read(
    JSON.stringify({
      group_id: groupId,
      member_did: memberDid,
      last_read_message_id: lastReadMessageId,
      last_read_timestamp: lastReadTimestamp,
    }),
  );
}

/**
 * Get all read receipt watermarks for a group.
 *
 * @param groupId - Group ID
 * @returns Array of watermark records for each group member
 */
export function getGroupReadReceipts(
  groupId: string,
): Array<{
  group_id: string;
  member_did: string;
  last_read_message_id: string;
  last_read_timestamp: number;
  read_at: number;
}> {
  const result = wasm().umbra_wasm_group_read_receipts(
    JSON.stringify({ group_id: groupId }),
  );
  return typeof result === 'string' ? JSON.parse(result) : result;
}

/**
 * Send a delivery receipt to the message sender via relay.
 *
 * Called when we receive a message (status: 'delivered') or when
 * the user views the conversation (status: 'read').
 *
 * @param messageId - Message ID
 * @param conversationId - Conversation ID
 * @param senderDid - DID of the original message sender
 * @param status - 'delivered' or 'read'
 * @param relayWs - WebSocket for relay delivery
 */
export async function sendDeliveryReceipt(
  messageId: string,
  conversationId: string,
  senderDid: string,
  status: 'delivered' | 'read',
  relayWs?: WebSocket | null
): Promise<void> {
  if (!relayWs || relayWs.readyState !== WebSocket.OPEN) return;

  // Build envelope in Rust, TS just sends it
  const json = JSON.stringify({
    message_id: messageId,
    conversation_id: conversationId,
    sender_did: senderDid,
    status,
  });
  const resultJson = wasm().umbra_wasm_messaging_build_receipt_envelope(json);
  const rm = await parseWasm<{ toDid: string; payload: string }>(resultJson);
  relayWs.send(JSON.stringify({ type: 'send', to_did: rm.toDid, payload: rm.payload }));
}

/**
 * Message event listener management
 */
export type MessageListenerCallback = (event: MessageEvent) => void;
