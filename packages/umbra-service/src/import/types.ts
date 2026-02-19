/**
 * Chat Import Types
 *
 * Types for importing chat history from external platforms.
 *
 * @packageDocumentation
 */

/**
 * Supported import sources.
 */
export type ImportSource = 'discord' | 'telegram' | 'whatsapp' | 'signal' | 'slack';

/**
 * Import source metadata.
 */
export interface ImportSourceInfo {
  /** Source identifier. */
  id: ImportSource;
  /** Display name. */
  name: string;
  /** Description of the import process. */
  description: string;
  /** Instructions for exporting data from this platform. */
  exportInstructions: string;
  /** URL for more info about exporting. */
  exportUrl?: string;
  /** Accepted file types. */
  acceptedFiles: string[];
  /** Brand color for the platform. */
  color: string;
}

/**
 * An imported message from an external platform.
 */
export interface ImportedMessage {
  /** Original message ID from the platform. */
  originalId: string;
  /** Message content/text. */
  content: string;
  /** Sender's username or identifier. */
  senderName: string;
  /** Sender's platform ID. */
  senderId: string;
  /** Message timestamp. */
  timestamp: Date;
  /** Attachments (URLs or file paths). */
  attachments?: ImportedAttachment[];
  /** Whether this message is from the importing user. */
  isFromSelf: boolean;
  /** Reply reference if this is a reply. */
  replyTo?: string;
  /** Reactions on this message. */
  reactions?: ImportedReaction[];
}

/**
 * An imported attachment.
 */
export interface ImportedAttachment {
  /** Original filename. */
  filename: string;
  /** File URL or local path. */
  url: string;
  /** MIME type if known. */
  mimeType?: string;
  /** File size in bytes. */
  size?: number;
}

/**
 * An imported reaction.
 */
export interface ImportedReaction {
  /** Emoji or reaction identifier. */
  emoji: string;
  /** Users who reacted. */
  users: string[];
  /** Count of reactions. */
  count: number;
}

/**
 * An imported conversation (DM or group).
 */
export interface ImportedConversation {
  /** Original conversation/channel ID. */
  originalId: string;
  /** Conversation name (for groups) or participant name (for DMs). */
  name: string;
  /** Type of conversation. */
  type: 'dm' | 'group' | 'channel';
  /** Participants in the conversation. */
  participants: ImportedParticipant[];
  /** Messages in the conversation. */
  messages: ImportedMessage[];
  /** When the conversation was created. */
  createdAt?: Date;
  /** Platform-specific metadata. */
  metadata?: Record<string, unknown>;
}

/**
 * A participant in a conversation.
 */
export interface ImportedParticipant {
  /** Platform user ID. */
  id: string;
  /** Display name or username. */
  name: string;
  /** Whether this is the importing user. */
  isSelf: boolean;
  /** Avatar URL if available. */
  avatarUrl?: string;
}

/**
 * Result of parsing an import file.
 */
export interface ImportParseResult {
  /** The source platform. */
  source: ImportSource;
  /** The importing user's info. */
  user: ImportedParticipant;
  /** All parsed conversations. */
  conversations: ImportedConversation[];
  /** Total message count. */
  totalMessages: number;
  /** Date range of imported data. */
  dateRange: {
    start: Date;
    end: Date;
  };
  /** Any warnings during parsing. */
  warnings: string[];
  /** Any errors during parsing (non-fatal). */
  errors: string[];
}

/**
 * Progress callback for import operations.
 */
export type ImportProgressCallback = (progress: ImportProgress) => void;

/**
 * Import progress information.
 */
export interface ImportProgress {
  /** Current phase of import. */
  phase: 'parsing' | 'processing' | 'storing' | 'complete';
  /** Progress percentage (0-100). */
  percent: number;
  /** Current item being processed. */
  currentItem?: string;
  /** Total items to process. */
  totalItems?: number;
  /** Items processed so far. */
  processedItems?: number;
}

/**
 * Options for import operations.
 */
export interface ImportOptions {
  /** Only import conversations with these participants. */
  filterParticipants?: string[];
  /** Only import messages after this date. */
  afterDate?: Date;
  /** Only import messages before this date. */
  beforeDate?: Date;
  /** Skip attachments to save space. */
  skipAttachments?: boolean;
  /** Progress callback. */
  onProgress?: ImportProgressCallback;
}

/**
 * Result of an import operation.
 */
export interface ImportResult {
  /** Whether the import was successful. */
  success: boolean;
  /** Number of conversations imported. */
  conversationsImported: number;
  /** Number of messages imported. */
  messagesImported: number;
  /** Any errors that occurred. */
  errors: string[];
  /** Summary of what was imported. */
  summary: string;
}

/**
 * Import service events.
 */
export type ImportServiceEvent =
  | { type: 'parseStarted'; source: ImportSource }
  | { type: 'parseComplete'; result: ImportParseResult }
  | { type: 'importStarted'; conversationCount: number }
  | { type: 'importProgress'; progress: ImportProgress }
  | { type: 'importComplete'; result: ImportResult }
  | { type: 'importError'; error: string };
