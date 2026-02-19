/**
 * Telegram Export Parser
 *
 * Parses Telegram's JSON export format.
 * Telegram Desktop allows exporting chats as JSON via Settings → Advanced → Export.
 *
 * @packageDocumentation
 */

import type {
  ImportParseResult,
  ImportedConversation,
  ImportedMessage,
  ImportedParticipant,
  ImportedAttachment,
} from '../types';

/**
 * Telegram export result format.
 */
interface TelegramExport {
  about: string;
  personal_information?: {
    user_id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    phone_number?: string;
  };
  chats?: {
    about: string;
    list: TelegramChat[];
  };
}

/**
 * Telegram chat format.
 */
interface TelegramChat {
  name: string;
  type: 'personal_chat' | 'private_group' | 'private_supergroup' | 'public_supergroup' | 'saved_messages';
  id: number;
  messages: TelegramMessage[];
}

/**
 * Telegram message format.
 */
interface TelegramMessage {
  id: number;
  type: 'message' | 'service';
  date: string;
  date_unixtime: string;
  from?: string;
  from_id?: string;
  text: string | TelegramTextEntity[];
  photo?: string;
  file?: string;
  media_type?: string;
  mime_type?: string;
  reply_to_message_id?: number;
}

/**
 * Telegram rich text entity.
 */
interface TelegramTextEntity {
  type: string;
  text: string;
}

/**
 * Parse a Telegram export JSON file.
 */
export async function parseTelegramExport(
  files: Map<string, string | ArrayBuffer>
): Promise<ImportParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const conversations: ImportedConversation[] = [];

  // Find the main result.json file
  let exportData: TelegramExport | null = null;

  for (const [filename, content] of files) {
    if (filename.endsWith('result.json') && typeof content === 'string') {
      try {
        exportData = JSON.parse(content);
        break;
      } catch {
        errors.push(`Failed to parse ${filename}`);
      }
    }
  }

  if (!exportData) {
    errors.push('No valid result.json found in export');
    return {
      source: 'telegram',
      user: { id: 'unknown', name: 'Unknown', isSelf: true },
      conversations: [],
      totalMessages: 0,
      dateRange: { start: new Date(), end: new Date() },
      warnings,
      errors,
    };
  }

  // Parse user info
  const userInfo = exportData.personal_information;
  const user: ImportedParticipant = {
    id: userInfo?.user_id?.toString() || 'unknown',
    name: userInfo
      ? `${userInfo.first_name}${userInfo.last_name ? ' ' + userInfo.last_name : ''}`
      : 'Unknown User',
    isSelf: true,
  };

  // Parse chats
  let totalMessages = 0;
  let earliestDate = new Date();
  let latestDate = new Date(0);

  const chats = exportData.chats?.list || [];

  for (const chat of chats) {
    if (chat.type === 'saved_messages') continue; // Skip saved messages

    const messages: ImportedMessage[] = [];
    const participantMap = new Map<string, ImportedParticipant>();
    participantMap.set(user.id, user);

    for (const msg of chat.messages) {
      if (msg.type !== 'message') continue; // Skip service messages

      const timestamp = new Date(parseInt(msg.date_unixtime) * 1000);
      if (isNaN(timestamp.getTime())) continue;

      if (timestamp < earliestDate) earliestDate = timestamp;
      if (timestamp > latestDate) latestDate = timestamp;

      // Extract text content
      let content = '';
      if (typeof msg.text === 'string') {
        content = msg.text;
      } else if (Array.isArray(msg.text)) {
        content = msg.text.map((e) => (typeof e === 'string' ? e : e.text)).join('');
      }

      const senderId = msg.from_id || user.id;
      const senderName = msg.from || user.name;
      const isFromSelf = senderId === user.id || senderId === `user${user.id}`;

      // Track participants
      if (!participantMap.has(senderId)) {
        participantMap.set(senderId, {
          id: senderId,
          name: senderName,
          isSelf: isFromSelf,
        });
      }

      const message: ImportedMessage = {
        originalId: msg.id.toString(),
        content,
        senderName,
        senderId,
        timestamp,
        isFromSelf,
        replyTo: msg.reply_to_message_id?.toString(),
      };

      // Handle attachments
      if (msg.photo || msg.file) {
        message.attachments = [];
        if (msg.photo) {
          message.attachments.push({
            filename: msg.photo,
            url: msg.photo,
            mimeType: 'image/jpeg',
          });
        }
        if (msg.file) {
          message.attachments.push({
            filename: msg.file,
            url: msg.file,
            mimeType: msg.mime_type,
          });
        }
      }

      messages.push(message);
    }

    if (messages.length === 0) continue;

    totalMessages += messages.length;

    const type: 'dm' | 'group' | 'channel' =
      chat.type === 'personal_chat' ? 'dm' : 'group';

    conversations.push({
      originalId: chat.id.toString(),
      name: chat.name,
      type,
      participants: Array.from(participantMap.values()),
      messages,
    });
  }

  return {
    source: 'telegram',
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
 * Get Telegram export source info.
 */
export function getTelegramSourceInfo() {
  return {
    id: 'telegram' as const,
    name: 'Telegram',
    description: 'Import your Telegram chats and messages',
    exportInstructions:
      'In Telegram Desktop, go to Settings → Advanced → Export Telegram Data. Select JSON format and the chats you want to export.',
    exportUrl: 'https://telegram.org/blog/export-and-more',
    acceptedFiles: ['.zip', '.json'],
    color: '#0088CC',
  };
}
