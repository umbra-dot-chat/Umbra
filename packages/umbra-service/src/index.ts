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
  PublicKeys,
  PublicIdentity,
  Identity,
  ProfileUpdate,
  CreateIdentityResult,
  ConnectionInfo,
  DiscoveryResult,
  DiscoveryEvent,
  FriendRequest,
  Friend,
  FriendEvent,
  MessageContent,
  MessageReaction,
  ReplyTo,
  MessageAttachment,
  MessageStatus,
  Message,
  Conversation,
  Group,
  GroupMember,
  MessageEvent,
  NetworkStatus,
  RelayStatus,
  RelaySession,
  RelayAcceptResult,
  RelayEvent,
  RelayEnvelope,
  FriendRequestPayload,
  FriendResponsePayload,
  ChatMessagePayload,
  GroupInvitePayload,
  GroupInviteResponsePayload,
  GroupMessagePayload,
  GroupKeyRotationPayload,
  GroupMemberRemovedPayload,
  FriendAcceptAckPayload,
  TypingIndicatorPayload,
  MessageStatusPayload,
  PendingGroupInvite,
  GroupEvent,
  InitConfig,
} from './types';

// Main service class
export { UmbraService } from './service';

// Default export
export { UmbraService as default } from './service';
