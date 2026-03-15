/**
 * PluginSandbox — Permission-gated API proxy.
 *
 * Creates a PluginAPI instance for a plugin that enforces its
 * declared permissions. Methods that require a permission the
 * plugin doesn't have will throw PermissionDeniedError.
 */

import type {
  PluginManifest,
  PluginPermission,
  PluginAPI,
  PluginKVStore,
  PluginSQLStore,
  PluginCommand,
  PluginSlashCommand,
  PluginShortcut,
  TextTransform,
  PluginMessage,
  PluginFriend,
  PluginConversation,
  MessageEventPayload,
  FriendEventPayload,
  ConversationEventPayload,
  VoiceParticipantEvent,
} from '@umbra/plugin-sdk';

// =============================================================================
// ERROR
// =============================================================================

export class PermissionDeniedError extends Error {
  constructor(pluginId: string, permission: PluginPermission, method: string) {
    super(
      `Plugin "${pluginId}" requires permission "${permission}" to call ${method}(). ` +
      `Add "${permission}" to the permissions array in your manifest.json.`
    );
    this.name = 'PermissionDeniedError';
  }
}

// =============================================================================
// SERVICE BRIDGE — interface that the app's PluginContext must satisfy
// =============================================================================

/**
 * Bridge to the host application's service layer.
 *
 * Implemented by PluginContext, which has access to UmbraService,
 * auth state, and the toast/panel APIs.
 */
export interface ServiceBridge {
  // Identity
  getMyDid(): string;
  getMyProfile(): { name: string; avatar?: string };

  // Events
  onMessage(cb: (event: MessageEventPayload) => void): () => void;
  onFriend(cb: (event: FriendEventPayload) => void): () => void;
  onConversation(cb: (event: ConversationEventPayload) => void): () => void;

  // Messages
  getMessages(conversationId: string, limit?: number): Promise<PluginMessage[]>;
  sendMessage(conversationId: string, text: string): Promise<void>;

  // Friends
  getFriends(): Promise<PluginFriend[]>;

  // Conversations
  getConversations(): Promise<PluginConversation[]>;

  // UI
  showToast(message: string, type?: 'info' | 'success' | 'error'): void;
  openPanel(panelId: string, props?: Record<string, any>): void;

  // Commands
  registerCommand(pluginId: string, cmd: PluginCommand): () => void;
  registerSlashCommand(pluginId: string, cmd: PluginSlashCommand): () => void;

  // Voice
  isInVoiceCall(): boolean;
  getVoiceParticipants(): Array<{ did: string; displayName: string }>;
  getVoiceStream(did: string): MediaStream | null;
  getLocalVoiceStream(): MediaStream | null;
  getScreenShareStream(): MediaStream | null;
  onVoiceParticipant(cb: (event: VoiceParticipantEvent) => void): () => void;

  // Call signaling
  sendCallSignal(payload: any): void;
  onCallSignal(cb: (event: any) => void): () => void;

  // Text transforms
  registerTextTransform(pluginId: string, transform: TextTransform): () => void;

  // Shortcuts
  registerShortcut(pluginId: string, shortcut: PluginShortcut): () => void;
}

// =============================================================================
// SANDBOX FACTORY
// =============================================================================

/**
 * Create a sandboxed PluginAPI for a specific plugin.
 *
 * Every API method is gated behind the plugin's declared permissions.
 */
export function createSandboxedAPI(
  manifest: PluginManifest,
  bridge: ServiceBridge,
  storage: { kv: PluginKVStore; sql?: PluginSQLStore }
): PluginAPI {
  const perms = new Set<PluginPermission>(manifest.permissions);
  const pluginId = manifest.id;

  function requirePermission(perm: PluginPermission, method: string): void {
    if (!perms.has(perm)) {
      throw new PermissionDeniedError(pluginId, perm, method);
    }
  }

  // Track subscriptions so we can clean up on deactivate
  const subscriptions: Array<() => void> = [];

  const api: PluginAPI = {
    pluginId,

    // ── Identity (no permission needed) ────────────────────────────────
    getMyDid: () => bridge.getMyDid(),
    getMyProfile: () => bridge.getMyProfile(),

    // ── Events (no permission needed for subscribing) ──────────────────
    onMessage: (cb: (event: MessageEventPayload) => void) => {
      const unsub = bridge.onMessage(cb);
      subscriptions.push(unsub);
      return unsub;
    },
    onFriend: (cb: (event: FriendEventPayload) => void) => {
      const unsub = bridge.onFriend(cb);
      subscriptions.push(unsub);
      return unsub;
    },
    onConversation: (cb: (event: ConversationEventPayload) => void) => {
      const unsub = bridge.onConversation(cb);
      subscriptions.push(unsub);
      return unsub;
    },

    // ── Messages ───────────────────────────────────────────────────────
    getMessages: async (conversationId: string, limit?: number) => {
      requirePermission('messages:read', 'getMessages');
      return bridge.getMessages(conversationId, limit);
    },
    sendMessage: async (conversationId: string, text: string) => {
      requirePermission('messages:write', 'sendMessage');
      return bridge.sendMessage(conversationId, text);
    },

    // ── Friends ────────────────────────────────────────────────────────
    getFriends: async () => {
      requirePermission('friends:read', 'getFriends');
      return bridge.getFriends();
    },

    // ── Conversations ──────────────────────────────────────────────────
    getConversations: async () => {
      requirePermission('conversations:read', 'getConversations');
      return bridge.getConversations();
    },

    // ── Storage ────────────────────────────────────────────────────────
    kv: {
      get: async (key: string) => {
        requirePermission('storage:kv', 'kv.get');
        return storage.kv.get(key);
      },
      set: async (key: string, value: string) => {
        requirePermission('storage:kv', 'kv.set');
        return storage.kv.set(key, value);
      },
      delete: async (key: string) => {
        requirePermission('storage:kv', 'kv.delete');
        return storage.kv.delete(key);
      },
      list: async (prefix?: string) => {
        requirePermission('storage:kv', 'kv.list');
        return storage.kv.list(prefix);
      },
    },

    sql: storage.sql
      ? {
          execute: async (query: string, params?: any[]) => {
            requirePermission('storage:sql', 'sql.execute');
            return storage.sql!.execute(query, params);
          },
        }
      : undefined,

    // ── UI ──────────────────────────────────────────────────────────────
    showToast: (message: string, type?: 'info' | 'success' | 'error') => {
      requirePermission('notifications', 'showToast');
      bridge.showToast(message, type);
    },
    openPanel: (panelId: string, props?: Record<string, any>) => {
      bridge.openPanel(panelId, props);
    },

    // ── Commands ────────────────────────────────────────────────────────
    registerCommand: (cmd: PluginCommand) => {
      requirePermission('commands', 'registerCommand');
      const unsub = bridge.registerCommand(pluginId, cmd);
      subscriptions.push(unsub);
      return unsub;
    },
    registerSlashCommand: (cmd: PluginSlashCommand) => {
      requirePermission('commands', 'registerSlashCommand');
      const unsub = bridge.registerSlashCommand(pluginId, cmd);
      subscriptions.push(unsub);
      return unsub;
    },

    // ── Voice ─────────────────────────────────────────────────────────
    isInVoiceCall: () => {
      requirePermission('voice:read', 'isInVoiceCall');
      return bridge.isInVoiceCall();
    },
    getVoiceParticipants: () => {
      requirePermission('voice:read', 'getVoiceParticipants');
      return bridge.getVoiceParticipants();
    },
    getVoiceStream: (did: string) => {
      requirePermission('voice:read', 'getVoiceStream');
      return bridge.getVoiceStream(did);
    },
    getLocalVoiceStream: () => {
      requirePermission('voice:read', 'getLocalVoiceStream');
      return bridge.getLocalVoiceStream();
    },
    getScreenShareStream: () => {
      requirePermission('voice:read', 'getScreenShareStream');
      return bridge.getScreenShareStream();
    },
    onVoiceParticipant: (cb: (event: VoiceParticipantEvent) => void) => {
      requirePermission('voice:read', 'onVoiceParticipant');
      const unsub = bridge.onVoiceParticipant(cb);
      subscriptions.push(unsub);
      return unsub;
    },

    // ── Call signaling ────────────────────────────────────────────────
    sendCallSignal: (payload: any) => {
      requirePermission('voice:read', 'sendCallSignal');
      bridge.sendCallSignal(payload);
    },
    onCallSignal: (cb: (event: any) => void) => {
      requirePermission('voice:read', 'onCallSignal');
      const unsub = bridge.onCallSignal(cb);
      subscriptions.push(unsub);
      return unsub;
    },

    // ── Text transforms ────────────────────────────────────────────────
    registerTextTransform: (transform: TextTransform) => {
      requirePermission('commands', 'registerTextTransform');
      const unsub = bridge.registerTextTransform(pluginId, transform);
      subscriptions.push(unsub);
      return unsub;
    },

    // ── Shortcuts ─────────────────────────────────────────────────────
    registerShortcut: (shortcut: PluginShortcut) => {
      requirePermission('shortcuts', 'registerShortcut');
      const unsub = bridge.registerShortcut(pluginId, shortcut);
      subscriptions.push(unsub);
      return unsub;
    },
  };

  return api;
}

/**
 * Clean up all event subscriptions created by a plugin's API instance.
 * Called during deactivation.
 */
export function cleanupSubscriptions(subscriptions: Array<() => void>): void {
  for (const unsub of subscriptions) {
    try {
      unsub();
    } catch {
      // Swallow cleanup errors
    }
  }
  subscriptions.length = 0;
}
