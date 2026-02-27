/**
 * # Umbra Service
 *
 * Cross-platform TypeScript API for Umbra Core.
 *
 * This package provides a unified interface to the Umbra Core Rust backend,
 * abstracting away platform differences (Web, iOS, Android).
 *
 * ## Architecture
 *
 * ```
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         Frontend (React Native)                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *                                    ▼
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         UmbraService (this package)                     │
 * │                                                                         │
 * │  • Unified API across platforms                                        │
 * │  • TypeScript types matching Rust structs                              │
 * │  • Event subscription management                                        │
 * │  • Error handling and transformation                                    │
 * └─────────────────────────────────────────────────────────────────────────┘
 *                                    │
 *              ┌─────────────────────┼─────────────────────┐
 *              ▼                     ▼                     ▼
 *       ┌────────────┐        ┌────────────┐        ┌────────────┐
 *       │  Web WASM  │        │ iOS Native │        │  Android   │
 *       │            │        │            │        │            │
 *       │ Web Worker │        │ UniFFI/JSI │        │ UniFFI/JNI │
 *       └────────────┘        └────────────┘        └────────────┘
 *              │                     │                     │
 *              └─────────────────────┼─────────────────────┘
 *                                    ▼
 *                          ┌────────────────┐
 *                          │  Umbra Core    │
 *                          │    (Rust)      │
 *                          └────────────────┘
 * ```
 *
 * ## Usage
 *
 * ```typescript
 * import { UmbraService } from '@umbra/service';
 *
 * // Initialize
 * await UmbraService.initialize();
 *
 * // Create identity
 * const { identity, recoveryPhrase } = await UmbraService.createIdentity('Alice');
 *
 * // Subscribe to events
 * const unsubscribe = UmbraService.onMessageEvent((event) => {
 *   console.log('Message event:', event);
 * });
 * ```
 *
 * @packageDocumentation
 */

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Errors
export { ErrorCode, UmbraError } from './errors';

// Types
export type {
  ChatMessagePayload, ConnectionInfo, Conversation, CreateIdentityResult, DiscoveryEvent, DiscoveryResult, Friend, FriendAcceptAckPayload, FriendEvent, FriendRequest, FriendRequestPayload,
  BlockedUser, FriendResponsePayload, Group, GroupEvent, GroupInvitePayload,
  GroupInviteResponsePayload, GroupKeyRotationPayload, GroupMember, GroupMemberRemovedPayload, GroupMessagePayload, Identity, InitConfig, Message, MessageAttachment, MessageContent, MessageEvent, MessageReaction, MessageStatus, MessageStatusPayload, NetworkStatus, PendingGroupInvite, ProfileUpdate, PublicIdentity, PublicKeys, RelayAcceptResult, RelayEnvelope, RelayEvent, RelaySession, RelayStatus, ReplyTo, TypingIndicatorPayload,
  Community, CommunityCreateResult, CommunitySpace, CommunityCategory, CommunityChannel, CommunityMember, CommunityRole, CommunitySeat, CommunityMessage, CommunityInvite, CommunityEvent, CommunityEventPayload,
  CommunityFileRecord, CommunityFileFolderRecord,
  CommunityEmoji, CommunitySticker, StickerPack,
  TextEffect, MessageMetadata,
  DmSharedFileRecord, DmSharedFolderRecord, DmFileEventPayload,
  ChunkManifest, ChunkRef, FileManifestRecord, ReassembledFile,
  TransferProgress, TransferDirection, TransferState, TransportType,
  IncomingTransferRequest, FileTransferEvent,
  AccountMetadataPayload,
  MetadataEvent,
} from './types';

// File chunking
export { chunkFile, reassembleFile, getFileManifest } from './chunking';

// File encryption (E2EE)
export {
  deriveFileKey, encryptFileChunk, decryptFileChunk,
  deriveChannelFileKey, computeKeyFingerprint, verifyKeyFingerprint,
  markFilesForReencryption, getFilesNeedingReencryption, clearReencryptionFlag,
} from './file-encryption';
export type {
  DerivedFileKey, EncryptedChunk, DecryptedChunk,
  DerivedChannelFileKey, KeyFingerprint, KeyVerificationResult,
  ReencryptionMarkResult, FileNeedingReencryption,
} from './file-encryption';

// File transfer
export {
  initiateTransfer, acceptTransfer, pauseTransfer, resumeTransfer, cancelTransfer,
  processTransferMessage, getTransfers, getTransfer, getIncompleteTransfers,
  getChunksToSend, markChunkSent,
} from './file-transfer';

// DM file sharing
export {
  uploadDmFile, getDmFiles, getDmFile, deleteDmFile, recordDmFileDownload, moveDmFile,
  createDmFolder, getDmFolders, deleteDmFolder, renameDmFolder,
  buildDmFileEventEnvelope, broadcastDmFileEvent,
} from './dm-files';

// OPFS bridge (web chunk storage)
export { initOpfsBridge, isOpfsBridgeReady } from './opfs-bridge';

// Storage manager
export {
  getStorageUsage, smartCleanup, setAutoCleanupRules, getAutoCleanupRules,
  getCleanupSuggestions, formatBytes,
} from './storage-manager';
export type {
  StorageUsage, StorageUsageByContext, CleanupResult,
  CleanupSuggestion, AutoCleanupRules,
} from './storage-manager';

// Metadata sync
export { syncMetadataViaRelay } from './metadata';

// Discovery service
export {
  // Types
  type Platform as DiscoveryPlatform,
  type LinkedAccountInfo,
  type DiscoveryStatus,
  type HashedLookup,
  type LookupResult,
  type FriendSuggestion,
  type SearchResult as DiscoverySearchResult,
  type DiscoveryServiceEvent,
  type UsernameResponse,
  type UsernameLookupResult,
  type UsernameSearchResult,
  // API
  setRelayUrl as setDiscoveryRelayUrl,
  getRelayUrl as getDiscoveryRelayUrl,
  startAuth,
  getStatus as getDiscoveryStatus,
  updateSettings as updateDiscoverySettings,
  batchLookup,
  unlinkAccount,
  createHash,
  batchCreateHashes,
  searchByUsername,
  registerUsername,
  getUsername,
  lookupUsername,
  searchUsernames,
  changeUsername,
  releaseUsername,
  // Hooks
  useLinkedAccounts,
  useDiscovery,
  useFriendSuggestions,
  useUsername,
  useUsernameSearch,
  useDiscoveryService,
} from './discovery';

// Chat import service
export {
  // Types
  type ImportSource,
  type ImportSourceInfo,
  type ImportedMessage,
  type ImportedAttachment,
  type ImportedReaction,
  type ImportedConversation,
  type ImportedParticipant,
  type ImportParseResult,
  type ImportProgress,
  type ImportProgressCallback,
  type ImportOptions,
  type ImportResult,
  type ImportServiceEvent,
  type UseImportState,
  // API
  getImportSources,
  getImportSourceInfo,
  parseImportFile,
  detectImportSource,
  importChatData,
  getImportPreview,
  // Hooks
  useImportSources,
  useImport,
  useImportSourceInfo,
  // Discord community import types
  type DiscordGuildInfo,
  type DiscordChannelType,
  type DiscordPermissionOverwrite,
  type DiscordImportedChannel,
  type DiscordImportedRole,
  type DiscordImportedStructure,
  type DiscordGuildsResponse,
  type DiscordGuildStructureResponse,
  type MappedCommunityStructure,
  type MappedCategory,
  type MappedChannel,
  type MappedRole,
  type MappedSeat,
  type MappedPinnedMessage,
  type MappedEmoji,
  type MappedSticker,
  type DiscordSticker,
  type DiscordImportedMember,
  type DiscordGuildMembersResponse,
  type DiscordPinnedMessage,
  type DiscordChannelPinsResponse,
  type DiscordAuditLogEntry,
  type DiscordAuditLogResponse,
  type MappedAuditLogEntry,
  type DiscordEmoji,
  type CommunityImportProgress,
  type CommunityImportResult,
  // Discord community import functions
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
  // Discord permissions
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
} from './import';

// Community import from Discord
export { createCommunityFromDiscordImport } from './community';

// Community invite relay operations
export {
  publishInviteToRelay,
  revokeInviteOnRelay,
  resolveInviteFromRelay,
  importCommunityFromRelay,
} from './community';
export type { RelayInviteResolution } from './community';

// Notifications
export {
  createNotification, getNotifications, markNotificationRead,
  markAllNotificationsRead, dismissNotification, getUnreadCounts,
} from './notifications';
export type {
  NotificationRecord, NotificationType, UnreadCounts, NotificationCategory,
} from './notifications';

// Messaging helpers
export { createDmConversation } from './messaging';

// Main service class
export { UmbraService } from './service';

// Default export
export { UmbraService as default } from './service';
