/**
 * @umbra/plugin-sdk — Public API for Umbra plugin authors.
 *
 * ## Quick Start
 *
 * ```typescript
 * import type { PluginManifest, PluginModule, PluginAPI } from '@umbra/plugin-sdk';
 * import { usePluginAPI, usePluginStorage, useSlotProps } from '@umbra/plugin-sdk';
 * import { PluginPanel, PluginAction } from '@umbra/plugin-sdk';
 * ```
 *
 * @packageDocumentation
 */

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  PluginManifest,
  PluginPlatform,
  PluginPermission,
  SlotName,
  SlotRegistration,
  PluginModule,
  PluginInstance,
  SlotEntry,
  PluginAPI,
  PluginMessage,
  PluginFriend,
  PluginConversation,
  PluginKVStore,
  PluginSQLStore,
  PluginCommand,
  MessageEventPayload,
  FriendEventPayload,
  ConversationEventPayload,
} from './types';

// ── Hooks ────────────────────────────────────────────────────────────────────
export { usePluginAPI, usePluginStorage, useSlotProps } from './hooks';

// ── Contexts (for runtime internal use) ──────────────────────────────────────
export { PluginAPIContext, SlotPropsContext } from './hooks';

// ── Components ───────────────────────────────────────────────────────────────
export { PluginPanel, PluginAction } from './components';
export type { PluginPanelProps, PluginActionProps } from './components';
