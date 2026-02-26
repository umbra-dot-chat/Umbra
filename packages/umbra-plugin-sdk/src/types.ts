/**
 * @umbra/plugin-sdk — Core types for the Umbra plugin system.
 *
 * This module defines the manifest schema, permission model, slot system,
 * and the PluginAPI surface that every plugin receives on activation.
 *
 * @packageDocumentation
 */

// =============================================================================
// MANIFEST
// =============================================================================

/**
 * JSON manifest bundled with every plugin.
 *
 * Validated by the runtime before a plugin is loaded.
 */
export interface PluginManifest {
  /** Reverse-domain plugin ID, e.g. "com.example.translator" */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Semver version string */
  version: string;
  /** Short description (shown in marketplace) */
  description: string;
  /** Plugin author */
  author: { name: string; url?: string };
  /** Icon URL or path relative to plugin bundle root */
  icon?: string;
  /** Supported platforms */
  platforms: PluginPlatform[];
  /** Required permissions */
  permissions: PluginPermission[];
  /** UI slot registrations */
  slots: SlotRegistration[];
  /** JS bundle entry point relative to plugin root */
  entryPoint: string;
  /** Optional WASM module path relative to plugin root */
  wasmModule?: string;
  /** Minimum Umbra app version required */
  minAppVersion?: string;
  /** Storage requirements */
  storage?: {
    /** Plugin needs KV store */
    kv?: boolean;
    /** Plugin needs SQL tables (name list only; plugin creates schema) */
    sql?: { tables: string[] };
  };
}

// =============================================================================
// PERMISSIONS
// =============================================================================

/** Supported target platforms */
export type PluginPlatform = 'web' | 'desktop' | 'mobile';

/**
 * Fine-grained permission tokens.
 *
 * The runtime checks these before proxying API calls to the service layer.
 */
export type PluginPermission =
  | 'messages:read'
  | 'messages:write'
  | 'friends:read'
  | 'conversations:read'
  | 'storage:kv'
  | 'storage:sql'
  | 'network:local'
  | 'notifications'
  | 'commands'
  | 'voice:read'
  | 'shortcuts';

// =============================================================================
// SLOTS
// =============================================================================

/**
 * Named injection points throughout the Umbra UI.
 *
 * Plugins register React components for one or more slots.
 */
export type SlotName =
  | 'settings-tab'
  | 'sidebar-section'
  | 'message-actions'
  | 'chat-toolbar'
  | 'chat-header'
  | 'message-decorator'
  | 'right-panel'
  | 'command-palette'
  | 'voice-call-controls'
  | 'voice-call-header'
  | 'voice-call-overlay';

/** Manifest entry binding a component export to a slot. */
export interface SlotRegistration {
  /** Target slot */
  slot: SlotName;
  /** Name of the exported React component from the entry point */
  component: string;
  /** Render priority — lower numbers render first (default 100) */
  priority?: number;
}

// =============================================================================
// PLUGIN MODULE
// =============================================================================

/**
 * Shape of the object exported by a plugin's JS bundle.
 *
 * The runtime calls `activate()` when the plugin is enabled and
 * `deactivate()` when it is disabled or uninstalled.
 */
export interface PluginModule {
  /** Called when the plugin is enabled. Receives the sandboxed API. */
  activate(api: PluginAPI): void | Promise<void>;
  /** Called when the plugin is disabled or uninstalled. */
  deactivate?(): void | Promise<void>;
  /** Map of component name → React component (referenced by SlotRegistration) */
  components: Record<string, React.ComponentType<any>>;
}

/** Runtime state for an installed plugin. */
export interface PluginInstance {
  manifest: PluginManifest;
  module: PluginModule;
  state: 'installed' | 'enabled' | 'disabled' | 'error';
  error?: string;
}

/** Entry in the slot map, linking a plugin to a component. */
export interface SlotEntry {
  pluginId: string;
  Component: React.ComponentType<any>;
  priority: number;
}

// =============================================================================
// PLUGIN API
// =============================================================================

/**
 * The sandboxed API surface passed to `PluginModule.activate()`.
 *
 * All methods respect the plugin's declared permissions. Calling a method
 * without the required permission throws a `PermissionDeniedError`.
 */
export interface PluginAPI {
  /** This plugin's manifest ID */
  readonly pluginId: string;

  // ── Identity ───────────────────────────────────────────────────────────────
  /** Get the current user's DID */
  getMyDid(): string;
  /** Get the current user's profile */
  getMyProfile(): { name: string; avatar?: string };

  // ── Event subscriptions (read-only) ────────────────────────────────────────
  /** Subscribe to message events. Returns unsubscribe function. */
  onMessage(cb: (event: MessageEventPayload) => void): () => void;
  /** Subscribe to friend events. Returns unsubscribe function. */
  onFriend(cb: (event: FriendEventPayload) => void): () => void;
  /** Subscribe to conversation events. Returns unsubscribe function. */
  onConversation(cb: (event: ConversationEventPayload) => void): () => void;

  // ── Messages (requires messages:read / messages:write) ─────────────────────
  /** Get messages for a conversation. Requires `messages:read`. */
  getMessages(conversationId: string, limit?: number): Promise<PluginMessage[]>;
  /** Send a text message. Requires `messages:write`. */
  sendMessage(conversationId: string, text: string): Promise<void>;

  // ── Friends (requires friends:read) ────────────────────────────────────────
  /** Get the friends list. Requires `friends:read`. */
  getFriends(): Promise<PluginFriend[]>;

  // ── Conversations (requires conversations:read) ────────────────────────────
  /** Get conversations. Requires `conversations:read`. */
  getConversations(): Promise<PluginConversation[]>;

  // ── Storage ────────────────────────────────────────────────────────────────
  /** Namespaced KV store. Requires `storage:kv`. */
  kv: PluginKVStore;
  /** Namespaced SQL executor. Requires `storage:sql`. Undefined if not requested. */
  sql?: PluginSQLStore;

  // ── UI ─────────────────────────────────────────────────────────────────────
  /** Show a toast notification. Requires `notifications`. */
  showToast(message: string, type?: 'info' | 'success' | 'error'): void;
  /** Open a named panel (right-panel slot). */
  openPanel(panelId: string, props?: Record<string, any>): void;

  // ── Commands ───────────────────────────────────────────────────────────────
  /** Register a command palette entry. Requires `commands`. Returns unregister fn. */
  registerCommand(cmd: PluginCommand): () => void;

  // ── Voice (requires voice:read) ──────────────────────────────────────────
  /** Whether the user is currently in a voice call or voice channel. */
  isInVoiceCall(): boolean;
  /** Get current voice participants with display names. */
  getVoiceParticipants(): Array<{ did: string; displayName: string }>;
  /** Get a remote participant's audio stream by DID. */
  getVoiceStream(did: string): MediaStream | null;
  /** Get the local user's audio stream. */
  getLocalVoiceStream(): MediaStream | null;
  /** Get the screen share audio stream, if any. */
  getScreenShareStream(): MediaStream | null;
  /** Subscribe to participant join/leave events. Returns unsubscribe fn. */
  onVoiceParticipant(cb: (event: VoiceParticipantEvent) => void): () => void;

  // ── Call room signaling (for broadcasting plugin data) ───────────────────
  /** Send a custom signal payload to all call participants. */
  sendCallSignal(payload: any): void;
  /** Subscribe to custom call signal events. Returns unsubscribe fn. */
  onCallSignal(cb: (event: any) => void): () => void;

  // ── Shortcuts (requires shortcuts) ───────────────────────────────────────
  /** Register a keyboard shortcut. Returns unregister fn. */
  registerShortcut(shortcut: PluginShortcut): () => void;
}

// =============================================================================
// API SUB-TYPES
// =============================================================================

/** Simplified message type exposed to plugins */
export interface PluginMessage {
  id: string;
  conversationId: string;
  senderDid: string;
  text: string;
  timestamp: number;
  edited?: boolean;
  deleted?: boolean;
  pinned?: boolean;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
}

/** Simplified friend type exposed to plugins */
export interface PluginFriend {
  did: string;
  displayName: string;
  status?: string;
  avatar?: string;
  online?: boolean;
}

/** Simplified conversation type exposed to plugins */
export interface PluginConversation {
  id: string;
  type: 'dm' | 'group';
  friendDid?: string;
  groupId?: string;
  unreadCount: number;
  lastMessageAt?: number;
}

/** KV store interface */
export interface PluginKVStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

/** SQL store interface */
export interface PluginSQLStore {
  execute(query: string, params?: any[]): Promise<any>;
}

/** Command palette entry */
export interface PluginCommand {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  onSelect: () => void;
}

// ── Event payload types (subset of full service events) ──────────────────────

export interface MessageEventPayload {
  type: string;
  messageId?: string;
  conversationId?: string;
  senderDid?: string;
  text?: string;
  timestamp?: number;
}

export interface FriendEventPayload {
  type: string;
  did?: string;
}

export interface ConversationEventPayload {
  type: string;
  conversationId?: string;
}

// ── Voice types ──────────────────────────────────────────────────────────────

export interface VoiceParticipantEvent {
  type: 'joined' | 'left';
  did: string;
  displayName: string;
}

// ── Shortcut types ───────────────────────────────────────────────────────────

export interface PluginShortcut {
  id: string;
  label: string;
  /** Key combo string, e.g. "ctrl+shift+r" */
  keys: string;
  onTrigger: () => void;
  /** Category for grouping in settings UI */
  category?: string;
}
