/**
 * Chat Import Module
 *
 * Import chat history from external platforms like Discord, Telegram,
 * WhatsApp, Signal, and Slack.
 *
 * @example
 * ```typescript
 * import { useImport, useImportSources } from '@umbra/service';
 *
 * function ImportScreen() {
 *   const { sources } = useImportSources();
 *   const {
 *     selectedSource,
 *     selectSource,
 *     selectFile,
 *     parseFile,
 *     executeImport,
 *     preview,
 *     progress,
 *     error,
 *   } = useImport();
 *
 *   // ... render import UI
 * }
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  ImportSource,
  ImportSourceInfo,
  ImportedMessage,
  ImportedAttachment,
  ImportedReaction,
  ImportedConversation,
  ImportedParticipant,
  ImportParseResult,
  ImportProgress,
  ImportProgressCallback,
  ImportOptions,
  ImportResult,
  ImportServiceEvent,
} from './types';

// API
export {
  getImportSources,
  getImportSourceInfo,
  parseImportFile,
  detectImportSource,
  importChatData,
  getImportPreview,
} from './api';

// Hooks
export {
  useImportSources,
  useImport,
  useImportSourceInfo,
} from './hooks';
export type { UseImportState } from './hooks';

// Discord Community Import
export type {
  DiscordGuildInfo,
  DiscordChannelType,
  DiscordPermissionOverwrite,
  DiscordImportedChannel,
  DiscordImportedRole,
  DiscordImportedStructure,
  DiscordGuildsResponse,
  DiscordGuildStructureResponse,
  DiscordEmoji,
  MappedCommunityStructure,
  MappedCategory,
  MappedChannel,
  MappedRole,
  MappedSeat,
  MappedPinnedMessage,
  MappedEmoji,
  MappedSticker,
  DiscordSticker,
  DiscordImportedMember,
  DiscordGuildMembersResponse,
  DiscordPinnedMessage,
  DiscordChannelPinsResponse,
  DiscordAuditLogEntry,
  DiscordAuditLogResponse,
  MappedAuditLogEntry,
  CommunityImportProgress,
  CommunityImportResult,
} from './discord-community';

export {
  discordColorToHex,
  getGuildIconUrl,
  getGuildBannerUrl,
  getGuildSplashUrl,
  getEmojiUrl,
  getStickerUrl,
  mapStickerFormat,
  downloadAndStoreAsset,
  downloadAndStoreGuildBranding,
  getAvatarUrl,
  snowflakeToTimestamp,
  mapChannelType,
  mapDiscordToUmbra,
  validateImportStructure,
} from './discord-community';

// Discord Permissions
export {
  DISCORD_PERMISSIONS,
  UMBRA_PERMISSIONS,
  translateDiscordPermissions,
  permissionsToNames,
  namesToPermissions,
  hasPermission,
  getDefaultMemberPermissions,
  getModeratorPermissions,
  getAdminPermissions,
  permissionsToString,
  permissionsFromString,
} from './discord-permissions';
