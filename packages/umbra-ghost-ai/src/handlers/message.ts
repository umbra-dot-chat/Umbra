/**
 * Message handler — receives encrypted messages, processes with LLM, sends encrypted responses.
 */

import { decryptMessage, encryptMessage, uuid, type GhostIdentity } from '../crypto.js';
import type { RelayClient } from '../relay.js';
import type { ContextStore, StoredFriend } from '../context/store.js';
import type { LLMProvider, ChatMessage } from '../llm/provider.js';
import { getSystemPrompt } from '../llm/system-prompts.js';
import { parseReminder } from './reminder.js';
import type { Logger } from '../config.js';

export interface IncomingMessage {
  messageId: string;
  conversationId: string;
  senderDid: string;
  contentEncrypted: string;
  nonce: string;
  timestamp: number;
  threadId?: string;
}

export async function handleMessage(
  msg: IncomingMessage,
  identity: GhostIdentity,
  relay: RelayClient,
  store: ContextStore,
  llm: LLMProvider,
  language: 'en' | 'ko',
  codebaseContext: string | null,
  log: Logger,
): Promise<void> {
  // Look up the friend
  const friend = store.getFriend(msg.senderDid);
  if (!friend) {
    log.warn(`Received message from unknown DID: ${msg.senderDid.slice(0, 24)}...`);
    return;
  }

  // Decrypt the message
  let plaintext: string;
  try {
    plaintext = decryptMessage(
      msg.contentEncrypted,
      msg.nonce,
      identity.encryptionPrivateKey,
      friend.encryptionKey,
      msg.senderDid,
      identity.did,
      msg.timestamp,
      msg.conversationId,
    );
  } catch (err) {
    log.error(`Failed to decrypt message from ${friend.displayName}:`, err);
    return;
  }

  log.info(`Message from ${friend.displayName}: "${plaintext.slice(0, 100)}${plaintext.length > 100 ? '...' : ''}"`);

  // Save user message to context
  store.saveMessage({
    id: msg.messageId,
    conversationId: msg.conversationId,
    role: 'user',
    content: plaintext,
    timestamp: msg.timestamp,
  });

  // Send typing indicator
  sendTypingIndicator(identity, relay, friend);

  // Check for reminder intent
  const reminder = parseReminder(plaintext, msg.senderDid, msg.conversationId, language);
  if (reminder) {
    store.saveReminder(reminder);
    const confirmText = language === 'ko'
      ? `알겠어요! ⏰ "${reminder.message}" — 알려드릴게요!`
      : `Got it! ⏰ I'll remind you: "${reminder.message}"`;
    await sendResponse(confirmText, identity, relay, store, friend, log);
    return;
  }

  // Build LLM context
  const history = store.getRecentMessages(msg.conversationId, 20);
  const messages: ChatMessage[] = [];

  // System prompt
  let systemContent = getSystemPrompt(language);
  if (codebaseContext) {
    systemContent += '\n\n## Relevant Codebase Context\n' + codebaseContext;
  }
  messages.push({ role: 'system', content: systemContent });

  // Conversation history
  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }

  // Current message (already in history from saveMessage above, but just in case)
  if (!history.find((h) => h.id === msg.messageId)) {
    messages.push({ role: 'user', content: plaintext });
  }

  // Call LLM
  const responseText = await llm.chat(messages);

  // Send response
  await sendResponse(responseText, identity, relay, store, friend, log);
}

async function sendResponse(
  text: string,
  identity: GhostIdentity,
  relay: RelayClient,
  store: ContextStore,
  friend: StoredFriend,
  log: Logger,
): Promise<void> {
  const timestamp = Date.now();
  const messageId = uuid();

  const { ciphertext, nonce } = encryptMessage(
    text,
    identity.encryptionPrivateKey,
    friend.encryptionKey,
    identity.did,
    friend.did,
    timestamp,
    friend.conversationId,
  );

  const envelope = {
    envelope: 'chat_message',
    version: 1,
    payload: {
      messageId,
      conversationId: friend.conversationId,
      senderDid: identity.did,
      contentEncrypted: ciphertext,
      nonce,
      timestamp,
    },
  };

  relay.sendEnvelope(friend.did, envelope);

  // Save assistant response
  store.saveMessage({
    id: messageId,
    conversationId: friend.conversationId,
    role: 'assistant',
    content: text,
    timestamp,
  });

  log.info(`Replied to ${friend.displayName}: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`);
}

function sendTypingIndicator(identity: GhostIdentity, relay: RelayClient, friend: StoredFriend): void {
  const envelope = {
    envelope: 'typing_indicator',
    version: 1,
    payload: {
      conversationId: friend.conversationId,
      senderDid: identity.did,
      isTyping: true,
      timestamp: Date.now(),
    },
  };
  relay.sendEnvelope(friend.did, envelope);
}
