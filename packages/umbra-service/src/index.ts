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
  FriendResponsePayload, Group, GroupEvent, GroupInvitePayload,
  GroupInviteResponsePayload, GroupKeyRotationPayload, GroupMember, GroupMemberRemovedPayload, GroupMessagePayload, Identity, InitConfig, Message, MessageAttachment, MessageContent, MessageEvent, MessageReaction, MessageStatus, MessageStatusPayload, NetworkStatus, PendingGroupInvite, ProfileUpdate, PublicIdentity, PublicKeys, RelayAcceptResult, RelayEnvelope, RelayEvent, RelaySession, RelayStatus, ReplyTo, TypingIndicatorPayload,
  Community, CommunityCreateResult, CommunitySpace, CommunityCategory, CommunityChannel, CommunityMember, CommunityRole, CommunityMessage, CommunityInvite, CommunityEvent, CommunityEventPayload,
  CommunityFileRecord, CommunityFileFolderRecord,
  DmSharedFileRecord, DmSharedFolderRecord, DmFileEventPayload,
  ChunkManifest, ChunkRef, FileManifestRecord, ReassembledFile,
  AccountMetadataPayload,
  MetadataEvent,
} from './types';

// File chunking
export { chunkFile, reassembleFile, getFileManifest } from './chunking';

// DM file sharing
export {
  uploadDmFile, getDmFiles, getDmFile, deleteDmFile, recordDmFileDownload, moveDmFile,
  createDmFolder, getDmFolders, deleteDmFolder, renameDmFolder,
  buildDmFileEventEnvelope, broadcastDmFileEvent,
} from './dm-files';

// Metadata sync
export { buildMetadataEnvelope, syncMetadataViaRelay } from './metadata';

// Main service class
export { UmbraService } from './service';

// Default export
export { UmbraService as default } from './service';
