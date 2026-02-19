/**
 * Discord GDPR Export Parser
 *
 * Parses the Discord data package (GDPR export) format.
 * Discord exports include messages, servers, DMs, and user data.
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
 * Discord message format in the export.
 */
interface DiscordMessage {
  ID: string;
  Timestamp: string;
  Contents: string;
  Attachments: string;
}

/**
 * Discord channel metadata.
 */
interface DiscordChannelInfo {
  id: string;
  type: number; // 1 = DM, 3 = Group DM
  name?: string;
  recipients?: string[];
}

/**
 * Discord user info from the export.
 */
interface DiscordUserInfo {
  id: string;
  username: string;
  discriminator: string;
  email?: string;
  avatar_hash?: string;
}

/**
 * Parse a Discord GDPR data package.
 *
 * Expected structure:
 * - package/
 *   - account/
 *     - user.json
 *   - messages/
 *     - index.json (channel metadata)
 *     - c{channel_id}/
 *       - channel.json
 *       - messages.csv
 */
export async function parseDiscordExport(
  files: Map<string, string | ArrayBuffer>
): Promise<ImportParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const conversations: ImportedConversation[] = [];

  // Parse user info
  let user: ImportedParticipant = {
    id: 'unknown',
    name: 'Unknown User',
    isSelf: true,
  };

  const userFile = files.get('account/user.json');
  if (userFile && typeof userFile === 'string') {
    try {
      const userData = JSON.parse(userFile) as DiscordUserInfo;
      user = {
        id: userData.id,
        name: userData.username,
        isSelf: true,
      };
    } catch {
      warnings.push('Could not parse user.json');
    }
  }

  // Parse message index
  const indexFile = files.get('messages/index.json');
  let channelIndex: Record<string, string | null> = {};

  if (indexFile && typeof indexFile === 'string') {
    try {
      channelIndex = JSON.parse(indexFile);
    } catch {
      errors.push('Could not parse messages/index.json');
      return {
        source: 'discord',
        user,
        conversations: [],
        totalMessages: 0,
        dateRange: { start: new Date(), end: new Date() },
        warnings,
        errors,
      };
    }
  }

  // Process each channel
  let totalMessages = 0;
  let earliestDate = new Date();
  let latestDate = new Date(0);

  for (const [channelId, channelName] of Object.entries(channelIndex)) {
    if (channelName === null) continue; // Deleted channel

    const channelDir = `messages/c${channelId}`;
    const messagesFile = files.get(`${channelDir}/messages.csv`);
    const channelFile = files.get(`${channelDir}/channel.json`);

    if (!messagesFile || typeof messagesFile !== 'string') {
      warnings.push(`No messages found for channel ${channelId}`);
      continue;
    }

    // Parse channel metadata
    let channelInfo: DiscordChannelInfo | null = null;
    if (channelFile && typeof channelFile === 'string') {
      try {
        channelInfo = JSON.parse(channelFile);
      } catch {
        warnings.push(`Could not parse channel.json for ${channelId}`);
      }
    }

    // Parse messages CSV
    const messages = parseDiscordMessagesCSV(messagesFile, user.id);
    if (messages.length === 0) continue;

    totalMessages += messages.length;

    // Track date range
    for (const msg of messages) {
      if (msg.timestamp < earliestDate) earliestDate = msg.timestamp;
      if (msg.timestamp > latestDate) latestDate = msg.timestamp;
    }

    // Determine conversation type
    const type: 'dm' | 'group' | 'channel' =
      channelInfo?.type === 1 ? 'dm' : channelInfo?.type === 3 ? 'group' : 'channel';

    // Extract participants from messages
    const participantMap = new Map<string, ImportedParticipant>();
    participantMap.set(user.id, user);

    for (const msg of messages) {
      if (!participantMap.has(msg.senderId)) {
        participantMap.set(msg.senderId, {
          id: msg.senderId,
          name: msg.senderName,
          isSelf: false,
        });
      }
    }

    conversations.push({
      originalId: channelId,
      name: channelName || `Channel ${channelId}`,
      type,
      participants: Array.from(participantMap.values()),
      messages,
      metadata: channelInfo ? { discordType: channelInfo.type } : undefined,
    });
  }

  return {
    source: 'discord',
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
 * Parse Discord messages CSV format.
 */
function parseDiscordMessagesCSV(csv: string, selfId: string): ImportedMessage[] {
  const messages: ImportedMessage[] = [];
  const lines = csv.split('\n');

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV (handle quoted fields)
    const fields = parseCSVLine(line);
    if (fields.length < 4) continue;

    const [id, timestamp, contents, attachments] = fields;

    // Extract sender from message content pattern or use ID
    // Discord CSV doesn't include sender info directly, so we mark all as self
    // In a real implementation, you'd need additional context

    const parsedTimestamp = new Date(timestamp);
    if (isNaN(parsedTimestamp.getTime())) continue;

    const message: ImportedMessage = {
      originalId: id,
      content: contents,
      senderName: 'You', // Discord export doesn't include sender for DMs
      senderId: selfId,
      timestamp: parsedTimestamp,
      isFromSelf: true, // Assume self for now
    };

    // Parse attachments
    if (attachments && attachments.trim()) {
      message.attachments = attachments.split(' ').map((url) => ({
        filename: url.split('/').pop() || 'attachment',
        url: url.trim(),
      }));
    }

    messages.push(message);
  }

  return messages;
}

/**
 * Parse a CSV line handling quoted fields.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Get Discord export source info.
 */
export function getDiscordSourceInfo() {
  return {
    id: 'discord' as const,
    name: 'Discord',
    description: 'Import your Discord messages and DMs',
    exportInstructions:
      'Go to Discord Settings → Privacy & Safety → Request all of my Data. You\'ll receive a download link via email within 30 days.',
    exportUrl: 'https://support.discord.com/hc/en-us/articles/360004027692',
    acceptedFiles: ['.zip'],
    color: '#5865F2',
  };
}
