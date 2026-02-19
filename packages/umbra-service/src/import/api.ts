/**
 * Import API
 *
 * Functions for importing chat history from external platforms.
 *
 * @packageDocumentation
 */

import JSZip from 'jszip';
import type {
  ImportSource,
  ImportSourceInfo,
  ImportParseResult,
  ImportOptions,
  ImportResult,
  ImportProgress,
} from './types';
import {
  parseDiscordExport,
  getDiscordSourceInfo,
  parseTelegramExport,
  getTelegramSourceInfo,
  parseWhatsAppExport,
  getWhatsAppSourceInfo,
  parseSignalExport,
  getSignalSourceInfo,
  parseSlackExport,
  getSlackSourceInfo,
} from './parsers';

/**
 * Get all available import sources.
 */
export function getImportSources(): ImportSourceInfo[] {
  return [
    getDiscordSourceInfo(),
    getTelegramSourceInfo(),
    getWhatsAppSourceInfo(),
    getSignalSourceInfo(),
    getSlackSourceInfo(),
  ];
}

/**
 * Get info for a specific import source.
 */
export function getImportSourceInfo(source: ImportSource): ImportSourceInfo | null {
  switch (source) {
    case 'discord':
      return getDiscordSourceInfo();
    case 'telegram':
      return getTelegramSourceInfo();
    case 'whatsapp':
      return getWhatsAppSourceInfo();
    case 'signal':
      return getSignalSourceInfo();
    case 'slack':
      return getSlackSourceInfo();
    default:
      return null;
  }
}

/**
 * Extract files from a zip archive.
 */
async function extractZip(file: File): Promise<Map<string, string | ArrayBuffer>> {
  const zip = await JSZip.loadAsync(file);
  const files = new Map<string, string | ArrayBuffer>();

  const zipFiles = zip.files;
  for (const path of Object.keys(zipFiles)) {
    const zipEntry = zipFiles[path];
    if (zipEntry.dir) continue;

    // Determine if file is text or binary
    const isText =
      path.endsWith('.json') ||
      path.endsWith('.txt') ||
      path.endsWith('.csv') ||
      path.endsWith('.html');

    try {
      if (isText) {
        const content = await zipEntry.async('string');
        files.set(path, content);
      } else {
        const content = await zipEntry.async('arraybuffer');
        files.set(path, content);
      }
    } catch {
      // Skip files that can't be read
    }
  }

  return files;
}

/**
 * Read a single file as text.
 */
async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Parse an import file and extract chat data.
 */
export async function parseImportFile(
  file: File,
  source: ImportSource
): Promise<ImportParseResult> {
  let files: Map<string, string | ArrayBuffer>;

  // Handle zip files vs single files
  if (file.name.endsWith('.zip')) {
    files = await extractZip(file);
  } else {
    // Single file (JSON or TXT)
    const content = await readFileAsText(file);
    files = new Map([[file.name, content]]);
  }

  // Parse based on source
  switch (source) {
    case 'discord':
      return parseDiscordExport(files);
    case 'telegram':
      return parseTelegramExport(files);
    case 'whatsapp':
      return parseWhatsAppExport(files);
    case 'signal':
      return parseSignalExport(files);
    case 'slack':
      return parseSlackExport(files);
    default:
      throw new Error(`Unsupported import source: ${source}`);
  }
}

/**
 * Auto-detect the import source from a file.
 */
export async function detectImportSource(file: File): Promise<ImportSource | null> {
  let files: Map<string, string | ArrayBuffer>;

  try {
    if (file.name.endsWith('.zip')) {
      files = await extractZip(file);
    } else {
      const content = await readFileAsText(file);
      files = new Map([[file.name, content]]);
    }
  } catch {
    return null;
  }

  // Check for Discord indicators
  if (files.has('account/user.json') || files.has('messages/index.json')) {
    return 'discord';
  }

  // Check for Telegram indicators
  for (const filename of files.keys()) {
    if (filename.endsWith('result.json')) {
      const content = files.get(filename);
      if (typeof content === 'string' && content.includes('"personal_information"')) {
        return 'telegram';
      }
    }
  }

  // Check for Slack indicators
  if (files.has('users.json') && (files.has('channels.json') || files.has('dms.json'))) {
    return 'slack';
  }

  // Check for Signal indicators
  for (const filename of files.keys()) {
    if (filename.endsWith('.json')) {
      const content = files.get(filename);
      if (typeof content === 'string' && content.includes('"conversationId"')) {
        return 'signal';
      }
    }
  }

  // Check for WhatsApp indicators (text file with message pattern)
  for (const [filename, content] of files) {
    if (filename.endsWith('.txt') && typeof content === 'string') {
      // Check for WhatsApp message format
      if (/^\[\d{1,2}\/\d{1,2}\/\d{2,4}/.test(content) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(content)) {
        return 'whatsapp';
      }
    }
  }

  return null;
}

/**
 * Import chat data into Umbra.
 *
 * This function takes parsed import data and stores it in Umbra's database.
 * The imported conversations can be used for friend discovery and message history.
 */
export async function importChatData(
  parseResult: ImportParseResult,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const errors: string[] = [];
  let conversationsImported = 0;
  let messagesImported = 0;

  const { onProgress, filterParticipants, afterDate, beforeDate, skipAttachments } = options;

  // Report initial progress
  onProgress?.({
    phase: 'processing',
    percent: 0,
    totalItems: parseResult.conversations.length,
    processedItems: 0,
  });

  for (let i = 0; i < parseResult.conversations.length; i++) {
    const conversation = parseResult.conversations[i];

    // Apply filters
    if (filterParticipants && filterParticipants.length > 0) {
      const hasMatchingParticipant = conversation.participants.some((p) =>
        filterParticipants.includes(p.id) || filterParticipants.includes(p.name)
      );
      if (!hasMatchingParticipant) continue;
    }

    // Filter messages by date
    let messages = conversation.messages;
    if (afterDate) {
      messages = messages.filter((m) => m.timestamp >= afterDate);
    }
    if (beforeDate) {
      messages = messages.filter((m) => m.timestamp <= beforeDate);
    }

    if (messages.length === 0) continue;

    // Strip attachments if requested
    if (skipAttachments) {
      messages = messages.map((m) => ({ ...m, attachments: undefined }));
    }

    // Here you would store the conversation in Umbra's database
    // For now, we just count the imported data
    // TODO: Integrate with UmbraService to store imported conversations

    conversationsImported++;
    messagesImported += messages.length;

    // Report progress
    onProgress?.({
      phase: 'processing',
      percent: Math.round(((i + 1) / parseResult.conversations.length) * 100),
      currentItem: conversation.name,
      totalItems: parseResult.conversations.length,
      processedItems: i + 1,
    });
  }

  // Report completion
  onProgress?.({
    phase: 'complete',
    percent: 100,
    totalItems: parseResult.conversations.length,
    processedItems: parseResult.conversations.length,
  });

  const summary = `Imported ${conversationsImported} conversations with ${messagesImported} messages from ${parseResult.source}`;

  return {
    success: errors.length === 0,
    conversationsImported,
    messagesImported,
    errors,
    summary,
  };
}

/**
 * Get a preview of what will be imported.
 */
export function getImportPreview(parseResult: ImportParseResult): {
  source: ImportSource;
  userName: string;
  conversationCount: number;
  messageCount: number;
  dateRange: { start: Date; end: Date };
  topConversations: Array<{ name: string; messageCount: number; type: string }>;
} {
  const topConversations = parseResult.conversations
    .map((c) => ({
      name: c.name,
      messageCount: c.messages.length,
      type: c.type,
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);

  return {
    source: parseResult.source,
    userName: parseResult.user.name,
    conversationCount: parseResult.conversations.length,
    messageCount: parseResult.totalMessages,
    dateRange: parseResult.dateRange,
    topConversations,
  };
}
