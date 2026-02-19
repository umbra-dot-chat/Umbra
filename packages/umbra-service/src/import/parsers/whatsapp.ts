/**
 * WhatsApp Export Parser
 *
 * Parses WhatsApp's text export format.
 * WhatsApp allows exporting individual chats as .txt or .zip files.
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
 * WhatsApp message line regex patterns.
 * Format varies by locale but generally:
 * [DD/MM/YYYY, HH:MM:SS] Sender: Message
 * or
 * MM/DD/YY, HH:MM AM/PM - Sender: Message
 */
const MESSAGE_PATTERNS = [
  // International format: [DD/MM/YYYY, HH:MM:SS] Sender: Message
  /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)$/,
  // US format: MM/DD/YY, HH:MM AM/PM - Sender: Message
  /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*([^:]+):\s*(.*)$/i,
  // Alternative format without brackets
  /^(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?)\s+-\s+([^:]+):\s*(.*)$/,
];

/**
 * System message patterns (not actual messages).
 */
const SYSTEM_PATTERNS = [
  /Messages and calls are end-to-end encrypted/i,
  /created group/i,
  /added you/i,
  /left$/i,
  /changed the subject/i,
  /changed this group's icon/i,
  /changed the group description/i,
];

/**
 * Parse a WhatsApp export.
 */
export async function parseWhatsAppExport(
  files: Map<string, string | ArrayBuffer>
): Promise<ImportParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const conversations: ImportedConversation[] = [];

  // Find .txt files in the export
  const textFiles: Array<[string, string]> = [];

  for (const [filename, content] of files) {
    if (filename.endsWith('.txt') && typeof content === 'string') {
      textFiles.push([filename, content]);
    }
  }

  if (textFiles.length === 0) {
    errors.push('No WhatsApp chat export files found (.txt)');
    return {
      source: 'whatsapp',
      user: { id: 'unknown', name: 'Unknown', isSelf: true },
      conversations: [],
      totalMessages: 0,
      dateRange: { start: new Date(), end: new Date() },
      warnings,
      errors,
    };
  }

  let totalMessages = 0;
  let earliestDate = new Date();
  let latestDate = new Date(0);

  // We don't know the user's name from the export, so we'll try to infer it
  let selfName: string | null = null;

  for (const [filename, content] of textFiles) {
    const { messages, participants, conversationName } = parseWhatsAppChat(content);

    if (messages.length === 0) {
      warnings.push(`No messages found in ${filename}`);
      continue;
    }

    // Try to infer self from most common sender or "You"
    if (!selfName) {
      const senderCounts = new Map<string, number>();
      for (const msg of messages) {
        senderCounts.set(msg.senderName, (senderCounts.get(msg.senderName) || 0) + 1);
      }
      // Assume the person with most messages is self, or look for "You"
      let maxCount = 0;
      for (const [name, count] of senderCounts) {
        if (name.toLowerCase() === 'you') {
          selfName = name;
          break;
        }
        if (count > maxCount) {
          maxCount = count;
          selfName = name;
        }
      }
    }

    totalMessages += messages.length;

    // Track date range
    for (const msg of messages) {
      if (msg.timestamp < earliestDate) earliestDate = msg.timestamp;
      if (msg.timestamp > latestDate) latestDate = msg.timestamp;
    }

    // Update isFromSelf based on inferred self name
    const updatedMessages = messages.map((msg) => ({
      ...msg,
      isFromSelf: msg.senderName === selfName || msg.senderName.toLowerCase() === 'you',
    }));

    const updatedParticipants = participants.map((p) => ({
      ...p,
      isSelf: p.name === selfName || p.name.toLowerCase() === 'you',
    }));

    // Determine conversation type
    const type: 'dm' | 'group' = participants.length > 2 ? 'group' : 'dm';

    // Extract conversation name from filename if not in content
    const name = conversationName || filename.replace(/\.txt$/, '').replace(/_/g, ' ');

    conversations.push({
      originalId: filename,
      name,
      type,
      participants: updatedParticipants,
      messages: updatedMessages,
    });
  }

  const user: ImportedParticipant = {
    id: selfName || 'self',
    name: selfName || 'You',
    isSelf: true,
  };

  return {
    source: 'whatsapp',
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
 * Parse a single WhatsApp chat export file.
 */
function parseWhatsAppChat(content: string): {
  messages: ImportedMessage[];
  participants: ImportedParticipant[];
  conversationName: string | null;
} {
  const messages: ImportedMessage[] = [];
  const participantMap = new Map<string, ImportedParticipant>();
  const lines = content.split('\n');

  let currentMessage: ImportedMessage | null = null;
  let messageId = 0;
  let conversationName: string | null = null;

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Try to match message patterns
    let matched = false;

    for (const pattern of MESSAGE_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const [, datePart, timePart, sender, text] = match;

        // Skip system messages
        if (SYSTEM_PATTERNS.some((p) => p.test(text))) {
          continue;
        }

        // Parse timestamp
        const timestamp = parseWhatsAppDate(datePart, timePart);
        if (!timestamp) continue;

        // Save previous message
        if (currentMessage) {
          messages.push(currentMessage);
        }

        messageId++;
        const senderName = sender.trim();

        // Track participant
        if (!participantMap.has(senderName)) {
          participantMap.set(senderName, {
            id: senderName,
            name: senderName,
            isSelf: false,
          });
        }

        currentMessage = {
          originalId: messageId.toString(),
          content: text.trim(),
          senderName,
          senderId: senderName,
          timestamp,
          isFromSelf: false,
        };

        // Check for media placeholder
        if (text.includes('<Media omitted>') || text.includes('<attached:')) {
          currentMessage.attachments = [
            {
              filename: 'media',
              url: '',
            },
          ];
        }

        matched = true;
        break;
      }
    }

    // If no match, this might be a continuation of the previous message
    if (!matched && currentMessage) {
      currentMessage.content += '\n' + line;
    }
  }

  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  // Try to extract conversation name from first line if it's a header
  if (lines.length > 0 && !MESSAGE_PATTERNS.some((p) => p.test(lines[0]))) {
    const firstLine = lines[0].trim();
    if (firstLine && !firstLine.startsWith('[') && !SYSTEM_PATTERNS.some((p) => p.test(firstLine))) {
      conversationName = firstLine;
    }
  }

  return {
    messages,
    participants: Array.from(participantMap.values()),
    conversationName,
  };
}

/**
 * Parse WhatsApp date/time string.
 */
function parseWhatsAppDate(datePart: string, timePart: string): Date | null {
  try {
    // Try various date formats
    const dateFormats = [
      // DD/MM/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // DD/MM/YY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
      // MM/DD/YYYY
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      // MM/DD/YY
      /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
    ];

    let day: number, month: number, year: number;

    for (const format of dateFormats) {
      const match = datePart.match(format);
      if (match) {
        // Assume DD/MM/YYYY first (most common internationally)
        day = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        year = parseInt(match[3]);

        // If year is 2 digits, assume 2000s
        if (year < 100) year += 2000;

        // If day > 12, it must be DD/MM format
        // If day <= 12 and month <= 12, assume DD/MM
        break;
      }
    }

    // Parse time
    const timeMatch = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
    const period = timeMatch[4];

    // Handle AM/PM
    if (period) {
      if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    return new Date(year!, month!, day!, hours, minutes, seconds);
  } catch {
    return null;
  }
}

/**
 * Get WhatsApp export source info.
 */
export function getWhatsAppSourceInfo() {
  return {
    id: 'whatsapp' as const,
    name: 'WhatsApp',
    description: 'Import your WhatsApp conversations',
    exportInstructions:
      'Open a chat in WhatsApp, tap the menu (⋮) → More → Export chat. Choose "Without media" for faster import, or "Include media" for attachments.',
    exportUrl: 'https://faq.whatsapp.com/1180414079177245',
    acceptedFiles: ['.txt', '.zip'],
    color: '#25D366',
  };
}
