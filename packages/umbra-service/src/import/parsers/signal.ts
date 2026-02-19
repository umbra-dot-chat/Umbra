/**
 * Signal Export Parser
 *
 * Parses Signal backup files.
 * Signal allows exporting encrypted backups which can be decrypted with the passphrase.
 * For simplicity, this parser handles the plaintext JSON export from Signal Desktop.
 *
 * @packageDocumentation
 */

import type {
  ImportParseResult,
  ImportedConversation,
  ImportedMessage,
  ImportedParticipant,
} from '../types';

/**
 * Signal desktop export format (simplified).
 */
interface SignalExport {
  conversations?: SignalConversation[];
  messages?: SignalMessage[];
}

/**
 * Signal conversation.
 */
interface SignalConversation {
  id: string;
  name?: string;
  type: 'private' | 'group';
  members?: string[];
  profileName?: string;
  phoneNumber?: string;
}

/**
 * Signal message.
 */
interface SignalMessage {
  id: string;
  conversationId: string;
  source?: string;
  sourceDevice?: number;
  sent_at: number;
  received_at?: number;
  body?: string;
  type: 'incoming' | 'outgoing';
  attachments?: SignalAttachment[];
  quote?: {
    id: number;
    author: string;
    text: string;
  };
  reactions?: Array<{
    emoji: string;
    fromId: string;
    timestamp: number;
  }>;
}

/**
 * Signal attachment.
 */
interface SignalAttachment {
  contentType: string;
  fileName?: string;
  path?: string;
  size?: number;
}

/**
 * Parse a Signal export.
 */
export async function parseSignalExport(
  files: Map<string, string | ArrayBuffer>
): Promise<ImportParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const conversations: ImportedConversation[] = [];

  // Look for JSON export file
  let exportData: SignalExport | null = null;

  for (const [filename, content] of files) {
    if ((filename.endsWith('.json') || filename.includes('signal')) && typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (parsed.conversations || parsed.messages) {
          exportData = parsed;
          break;
        }
      } catch {
        // Not a valid JSON file
      }
    }
  }

  if (!exportData) {
    errors.push('No valid Signal export found. Please export from Signal Desktop.');
    return {
      source: 'signal',
      user: { id: 'self', name: 'You', isSelf: true },
      conversations: [],
      totalMessages: 0,
      dateRange: { start: new Date(), end: new Date() },
      warnings,
      errors,
    };
  }

  const user: ImportedParticipant = {
    id: 'self',
    name: 'You',
    isSelf: true,
  };

  // Group messages by conversation
  const messagesByConversation = new Map<string, SignalMessage[]>();

  if (exportData.messages) {
    for (const msg of exportData.messages) {
      const existing = messagesByConversation.get(msg.conversationId) || [];
      existing.push(msg);
      messagesByConversation.set(msg.conversationId, existing);
    }
  }

  // Build conversation map
  const conversationMap = new Map<string, SignalConversation>();
  if (exportData.conversations) {
    for (const conv of exportData.conversations) {
      conversationMap.set(conv.id, conv);
    }
  }

  let totalMessages = 0;
  let earliestDate = new Date();
  let latestDate = new Date(0);

  for (const [convId, messages] of messagesByConversation) {
    const convInfo = conversationMap.get(convId);
    const participantMap = new Map<string, ImportedParticipant>();
    participantMap.set(user.id, user);

    const importedMessages: ImportedMessage[] = [];

    for (const msg of messages) {
      const timestamp = new Date(msg.sent_at);
      if (isNaN(timestamp.getTime())) continue;

      if (timestamp < earliestDate) earliestDate = timestamp;
      if (timestamp > latestDate) latestDate = timestamp;

      const isFromSelf = msg.type === 'outgoing';
      const senderId = isFromSelf ? user.id : (msg.source || 'unknown');
      const senderName = isFromSelf ? user.name : (msg.source || 'Unknown');

      if (!participantMap.has(senderId)) {
        participantMap.set(senderId, {
          id: senderId,
          name: senderName,
          isSelf: false,
        });
      }

      const importedMessage: ImportedMessage = {
        originalId: msg.id,
        content: msg.body || '',
        senderName,
        senderId,
        timestamp,
        isFromSelf,
        replyTo: msg.quote?.id?.toString(),
      };

      if (msg.attachments && msg.attachments.length > 0) {
        importedMessage.attachments = msg.attachments.map((att) => ({
          filename: att.fileName || 'attachment',
          url: att.path || '',
          mimeType: att.contentType,
          size: att.size,
        }));
      }

      if (msg.reactions && msg.reactions.length > 0) {
        const reactionMap = new Map<string, { emoji: string; users: string[]; count: number }>();
        for (const r of msg.reactions) {
          const existing = reactionMap.get(r.emoji);
          if (existing) {
            existing.users.push(r.fromId);
            existing.count++;
          } else {
            reactionMap.set(r.emoji, { emoji: r.emoji, users: [r.fromId], count: 1 });
          }
        }
        importedMessage.reactions = Array.from(reactionMap.values());
      }

      importedMessages.push(importedMessage);
    }

    if (importedMessages.length === 0) continue;

    totalMessages += importedMessages.length;

    const convName = convInfo?.name || convInfo?.profileName || convInfo?.phoneNumber || `Chat ${convId}`;
    const convType: 'dm' | 'group' = convInfo?.type === 'group' ? 'group' : 'dm';

    conversations.push({
      originalId: convId,
      name: convName,
      type: convType,
      participants: Array.from(participantMap.values()),
      messages: importedMessages,
    });
  }

  return {
    source: 'signal',
    user,
    conversations,
    totalMessages,
    dateRange: {
      start: earliestDate,
      end: latestDate,
    },
    warnings,
    errors,
  };
}

/**
 * Get Signal export source info.
 */
export function getSignalSourceInfo() {
  return {
    id: 'signal' as const,
    name: 'Signal',
    description: 'Import your Signal private messages',
    exportInstructions:
      'Signal Desktop: File → Export as plaintext. For mobile backups, you\'ll need to decrypt them first using signal-backup-decode.',
    exportUrl: 'https://support.signal.org/hc/en-us/articles/360007059752',
    acceptedFiles: ['.json', '.zip'],
    color: '#3A76F0',
  };
}
