/**
 * Messaging module
 *
 * @packageDocumentation
 */

import { wasm, parseWasm } from './helpers';
import type {
  Message,
  Conversation,
  MessageReaction,
  MessageEvent,
  ChatMessagePayload,
  RelayEnvelope,
  TypingIndicatorPayload,
  MessageStatusPayload,
} from './types';

/**
 * Get all conversations
 */
export async function getConversations(): Promise<Conversation[]> {
  const resultJson = wasm().umbra_wasm_messaging_get_conversations();
  return await parseWasm<Conversation[]>(resultJson);
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
  const resultJson = wasm().umbra_wasm_messaging_send(conversationId, text);
  const raw = await parseWasm<{
    id: string;
    conversationId: string;
    senderDid: string;
    timestamp: number;
    delivered: boolean;
    read: boolean;
    contentEncrypted?: string;
    nonce?: string;
    friendDid?: string;
  }>(resultJson);

  // Send via relay for offline/non-P2P delivery
  if (
    relayWs &&
    relayWs.readyState === WebSocket.OPEN &&
    raw.contentEncrypted &&
    raw.nonce &&
    raw.friendDid
  ) {
    try {
      const envelope: RelayEnvelope = {
        envelope: 'chat_message',
        version: 1,
        payload: {
          messageId: raw.id,
          conversationId: raw.conversationId,
          senderDid: raw.senderDid,
          contentEncrypted: raw.contentEncrypted,
          nonce: raw.nonce,
          timestamp: raw.timestamp,
        },
      };

      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: raw.friendDid,
        payload: JSON.stringify(envelope),
      });

      relayWs.send(relayMessage);
      console.log('[UmbraService] Message sent via relay to', raw.friendDid);
    } catch (err) {
      console.warn('[UmbraService] Failed to send message via relay:', err);
    }
  }

  // Return with 'sending' status initially. The relay will send back an
  // ack message confirming receipt, at which point the status transitions
  // to 'sent'. If the relay send failed, status stays 'sending' in the UI
  // (a visual indicator that delivery is uncertain).
  const relaySent = relayWs && relayWs.readyState === WebSocket.OPEN && raw.contentEncrypted;

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

  const resultJson = wasm().umbra_wasm_messaging_get_messages(
    conversationId,
    limit,
    offset
  );

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

  return await Promise.all(mainMessages.map(async (m) => {
    let text = '';
    try {
      // DB stores ciphertext as hex, but the WASM decrypt function expects base64.
      // Convert hex → bytes → base64 before calling decrypt.
      let contentForDecrypt = m.contentEncrypted;
      if (/^[0-9a-fA-F]+$/.test(contentForDecrypt) && contentForDecrypt.length > 0) {
        const hexPairs = contentForDecrypt.match(/.{2}/g) || [];
        const hexBytes = new Uint8Array(hexPairs.map((b: string) => parseInt(b, 16)));
        // Use chunked approach to avoid max call stack with spread on large arrays
        let binary = '';
        for (let i = 0; i < hexBytes.length; i++) {
          binary += String.fromCharCode(hexBytes[i]);
        }
        contentForDecrypt = btoa(binary);
      }

      // WASM expects i64 (BigInt) for timestamp, but DB returns JS number
      const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
        m.conversationId,
        contentForDecrypt,
        m.nonce,
        m.senderDid,
        BigInt(m.timestamp)
      );
      text = await parseWasm<string>(decryptedJson);
    } catch (err) {
      // Fallback: show raw if decrypt fails (e.g. own messages stored as plaintext)
      console.warn('[getMessages] decrypt failed for msg', m.id, err);
      text = m.contentEncrypted;
    }
    return {
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
    };
  }));
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
  const resultJson = wasm().umbra_wasm_messaging_edit(json);
  return await parseWasm<Message>(resultJson);
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const json = JSON.stringify({ message_id: messageId });
  wasm().umbra_wasm_messaging_delete(json);
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
  return await Promise.all(raw.map(async (m) => {
    let text = '';
    try {
      let contentForDecrypt = m.contentEncrypted || '';
      if (/^[0-9a-fA-F]+$/.test(contentForDecrypt) && contentForDecrypt.length > 0) {
        const hexPairs = contentForDecrypt.match(/.{2}/g) || [];
        const hexBytes = new Uint8Array(hexPairs.map((b: string) => parseInt(b, 16)));
        let binary = '';
        for (let i = 0; i < hexBytes.length; i++) binary += String.fromCharCode(hexBytes[i]);
        contentForDecrypt = btoa(binary);
      }
      const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
        m.conversationId,
        contentForDecrypt,
        m.nonce || '',
        m.senderDid,
        BigInt(m.timestamp)
      );
      text = await parseWasm<string>(decryptedJson);
    } catch {
      text = m.contentEncrypted || '';
    }
    return {
      id: m.id,
      conversationId: m.conversationId,
      senderDid: m.senderDid,
      content: { type: 'text' as const, text },
      timestamp: m.timestamp,
      read: m.read ?? false,
      delivered: m.delivered ?? false,
      status: 'sent' as const,
      threadId: m.threadId,
    };
  }));
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
  const resultJson = wasm().umbra_wasm_messaging_reply_thread(json);
  const raw = await parseWasm<{
    id: string;
    conversationId: string;
    senderDid: string;
    friendDid?: string;
    timestamp: number;
    threadId?: string;
    contentEncrypted?: string;
    nonce?: string;
  }>(resultJson);

  // Send via relay for offline/non-P2P delivery
  if (
    relayWs &&
    relayWs.readyState === WebSocket.OPEN &&
    raw.contentEncrypted &&
    raw.nonce &&
    raw.friendDid
  ) {
    try {
      const envelope: RelayEnvelope = {
        envelope: 'chat_message',
        version: 1,
        payload: {
          messageId: raw.id,
          conversationId: raw.conversationId,
          senderDid: raw.senderDid,
          contentEncrypted: raw.contentEncrypted,
          nonce: raw.nonce,
          timestamp: raw.timestamp,
          threadId: parentId,
        },
      };

      const relayMessage = JSON.stringify({
        type: 'send',
        to_did: raw.friendDid,
        payload: JSON.stringify(envelope),
      });

      relayWs.send(relayMessage);
      console.log('[UmbraService] Thread reply sent via relay to', raw.friendDid);
    } catch (err) {
      console.warn('[UmbraService] Failed to send thread reply via relay:', err);
    }
  }

  const relaySent = relayWs && relayWs.readyState === WebSocket.OPEN && raw.contentEncrypted;

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
  const resultJson = wasm().umbra_wasm_messaging_get_pinned(json);
  const raw = await parseWasm<Array<any>>(resultJson);
  return await Promise.all(raw.map(async (m) => {
    let text = '';
    try {
      let contentForDecrypt = m.contentEncrypted || '';
      if (/^[0-9a-fA-F]+$/.test(contentForDecrypt) && contentForDecrypt.length > 0) {
        const hexPairs = contentForDecrypt.match(/.{2}/g) || [];
        const hexBytes = new Uint8Array(hexPairs.map((b: string) => parseInt(b, 16)));
        let binary = '';
        for (let i = 0; i < hexBytes.length; i++) binary += String.fromCharCode(hexBytes[i]);
        contentForDecrypt = btoa(binary);
      }
      const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
        m.conversationId,
        contentForDecrypt,
        m.nonce || '',
        m.senderDid,
        BigInt(m.timestamp)
      );
      text = await parseWasm<string>(decryptedJson);
    } catch {
      text = m.contentEncrypted || '';
    }
    return {
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
    };
  }));
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

  const envelope: RelayEnvelope = {
    envelope: 'typing_indicator',
    version: 1,
    payload: {
      conversationId,
      senderDid,
      senderName,
      isTyping,
      timestamp: Date.now(),
    } as TypingIndicatorPayload,
  };

  const relayMessage = JSON.stringify({
    type: 'send',
    to_did: recipientDid,
    payload: JSON.stringify(envelope),
  });

  relayWs.send(relayMessage);
}

/**
 * Store an incoming chat message received via relay.
 *
 * @param payload - The chat message payload from the relay envelope
 */
export async function storeIncomingMessage(payload: ChatMessagePayload): Promise<void> {
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
  const json = JSON.stringify(data);
  await wasm().umbra_wasm_messaging_store_incoming(json);
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
    // WASM expects i64 (BigInt) for timestamp
    const decryptedJson = wasm().umbra_wasm_messaging_decrypt(
      payload.conversationId,
      payload.contentEncrypted,
      payload.nonce,
      payload.senderDid,
      BigInt(payload.timestamp)
    );
    const text = await parseWasm<string>(decryptedJson);
    // Guard against empty string from WASM (shouldn't happen, but be safe)
    return text || null;
  } catch (err) {
    console.warn(
      '[decryptIncomingMessage] Decryption failed for message',
      payload.messageId,
      'in conversation', payload.conversationId,
      'from', payload.senderDid,
      '— nonce:', payload.nonce?.slice(0, 16) + '…',
      '— error:', err,
    );
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

  const envelope: RelayEnvelope = {
    envelope: 'message_status',
    version: 1,
    payload: {
      messageId,
      conversationId,
      status,
      timestamp: Date.now(),
    } as MessageStatusPayload,
  };

  const relayMessage = JSON.stringify({
    type: 'send',
    to_did: senderDid,
    payload: JSON.stringify(envelope),
  });

  relayWs.send(relayMessage);
}

/**
 * Message event listener management
 */
export type MessageListenerCallback = (event: MessageEvent) => void;
