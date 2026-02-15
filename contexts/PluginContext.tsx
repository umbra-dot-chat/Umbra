/**
 * PluginContext — Root provider for the Umbra plugin system.
 *
 * Sits between UmbraProvider and HelpProvider in the provider tree.
 * Manages plugin lifecycle: loading installed plugins on mount,
 * enabling/disabling, and providing the slot registry to the UI.
 *
 * ## Usage
 *
 * ```tsx
 * <UmbraProvider>
 *   <PluginProvider>
 *     <HelpProvider>
 *       <App />
 *     </HelpProvider>
 *   </PluginProvider>
 * </UmbraProvider>
 * ```
 *
 * Consume in components:
 * ```tsx
 * const { getSlotComponents, installPlugin, enablePlugin } = usePlugins();
 * ```
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { getWasm } from '@umbra/wasm';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Expose React globally for plugin bundles.
//
// Plugin bundles are loaded via dynamic import() from blob URLs, which run
// in a separate module scope with no access to the app's bundled React.
// They access React via `window.React || globalThis.React`.
// ─────────────────────────────────────────────────────────────────────────────
if (typeof globalThis !== 'undefined' && !(globalThis as any).React) {
  (globalThis as any).React = React;
}
if (typeof window !== 'undefined' && !(window as any).React) {
  (window as any).React = React;
}

import type {
  SlotName,
  SlotEntry,
  PluginManifest,
  PluginAPI,
  PluginCommand,
  PluginMessage,
  PluginFriend,
  PluginConversation,
  MessageEventPayload,
  FriendEventPayload,
  ConversationEventPayload,
} from '@umbra/plugin-sdk';

import {
  PluginRegistry,
  PluginLoader,
  PluginInstaller,
  MarketplaceClient,
  createPluginStorage,
  createSandboxedAPI,
} from '@umbra/plugin-runtime';
import type { ServiceBridge } from '@umbra/plugin-runtime';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface PluginContextValue {
  /** Whether plugins are still loading on mount */
  isLoading: boolean;
  /** The plugin registry instance */
  registry: PluginRegistry;
  /** Marketplace client */
  marketplace: MarketplaceClient;
  /** Install a plugin from a URL */
  installPlugin(downloadUrl: string, listing?: any): Promise<void>;
  /** Uninstall a plugin by ID */
  uninstallPlugin(id: string): Promise<void>;
  /** Enable a plugin */
  enablePlugin(id: string): Promise<void>;
  /** Disable a plugin */
  disablePlugin(id: string): Promise<void>;
  /** Get slot components for a named slot */
  getSlotComponents(slot: SlotName): SlotEntry[];
  /** Number of enabled plugins (for reactivity) */
  enabledCount: number;
  /** Plugin-registered commands */
  pluginCommands: PluginCommand[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const PluginContext = createContext<PluginContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function PluginProvider({ children }: { children: React.ReactNode }) {
  const { isReady, service } = useUmbra();
  const { identity } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [enabledCount, setEnabledCount] = useState(0);
  const [pluginCommands, setPluginCommands] = useState<PluginCommand[]>([]);

  // Stable references
  const registryRef = useRef(new PluginRegistry());
  const loaderRef = useRef(new PluginLoader());
  const marketplaceRef = useRef(new MarketplaceClient());
  const commandsRef = useRef<Map<string, PluginCommand[]>>(new Map());

  const registry = registryRef.current;
  const loader = loaderRef.current;
  const marketplace = marketplaceRef.current;

  // Subscribe to registry changes for reactivity
  useEffect(() => {
    const unsub = registry.onChange(() => {
      setEnabledCount(registry.getEnabledPlugins().length);
    });
    return unsub;
  }, [registry]);

  // ── Service bridge (connects plugins to UmbraService) ──────────────────

  const createServiceBridge = useCallback((): ServiceBridge | null => {
    if (!service || !identity) return null;

    return {
      getMyDid: () => identity.did,
      getMyProfile: () => ({
        name: identity.displayName ?? 'Anonymous',
        avatar: identity.avatar,
      }),

      onMessage: (cb: (event: MessageEventPayload) => void) => {
        return service.onMessageEvent((event: any) => {
          cb({
            type: event.type,
            messageId: event.messageId ?? event.id,
            conversationId: event.conversationId,
            senderDid: event.senderDid,
            text: event.text ?? event.content?.text,
            timestamp: event.timestamp,
          });
        });
      },
      onFriend: (cb: (event: FriendEventPayload) => void) => {
        return service.onFriendEvent((event: any) => {
          cb({ type: event.type, did: event.did });
        });
      },
      onConversation: (cb: (event: ConversationEventPayload) => void) => {
        return service.onMessageEvent((event: any) => {
          if (event.type === 'conversationCreated' || event.type === 'conversationUpdated') {
            cb({ type: event.type, conversationId: event.conversationId });
          }
        });
      },

      getMessages: async (conversationId, limit) => {
        const messages = await service.getMessages(conversationId, { limit: limit ?? 50, offset: 0 });
        return messages.map((m: any): PluginMessage => ({
          id: m.id,
          conversationId: m.conversationId,
          senderDid: m.senderDid,
          text: m.content?.text ?? '',
          timestamp: m.timestamp,
          edited: m.edited,
          deleted: m.deleted,
          pinned: m.pinned,
          reactions: m.reactions?.map((r: any) => ({
            emoji: r.emoji,
            count: r.count,
            users: r.users,
          })),
        }));
      },
      sendMessage: async (conversationId, text) => {
        await service.sendMessage(conversationId, text);
      },

      getFriends: async () => {
        const friends = await service.getFriends();
        return friends.map((f: any): PluginFriend => ({
          did: f.did,
          displayName: f.displayName,
          status: f.status,
          avatar: f.avatar,
          online: f.online,
        }));
      },

      getConversations: async () => {
        const convs = await service.getConversations();
        return convs.map((c: any): PluginConversation => ({
          id: c.id,
          type: c.type,
          friendDid: c.friendDid,
          groupId: c.groupId,
          unreadCount: c.unreadCount,
          lastMessageAt: c.lastMessageAt,
        }));
      },

      showToast: (message, type) => {
        // TODO: Wire to ToastProvider when context is available
        console.log(`[Plugin Toast] [${type ?? 'info'}] ${message}`);
      },
      openPanel: (_panelId, _props) => {
        // TODO: Wire to right panel system
        console.log(`[Plugin] openPanel: ${_panelId}`);
      },

      registerCommand: (pluginId: string, cmd: PluginCommand) => {
        const existing = commandsRef.current.get(pluginId) ?? [];
        existing.push(cmd);
        commandsRef.current.set(pluginId, existing);
        updateCommands();
        return () => {
          const cmds = commandsRef.current.get(pluginId) ?? [];
          commandsRef.current.set(
            pluginId,
            cmds.filter((c) => c.id !== cmd.id)
          );
          updateCommands();
        };
      },
    };
  }, [service, identity]);

  const updateCommands = useCallback(() => {
    const all: PluginCommand[] = [];
    for (const cmds of commandsRef.current.values()) {
      all.push(...cmds);
    }
    setPluginCommands(all);
  }, []);

  // ── Plugin state persistence helpers ──────────────────────────────────
  // Uses the WASM KV store with a system-level plugin ID to track
  // which plugins the user has explicitly enabled or disabled.

  const SYSTEM_PLUGIN_ID = '__umbra_system__';

  const savePluginState = useCallback(async (pluginId: string, state: 'enabled' | 'disabled') => {
    try {
      const wasm = getWasm();
      if (!wasm) return;
      (wasm as any).umbra_wasm_plugin_kv_set(SYSTEM_PLUGIN_ID, `plugin_state:${pluginId}`, state);
    } catch (err) {
      console.warn(`Failed to save plugin state for "${pluginId}":`, err);
    }
  }, []);

  const loadPluginState = useCallback(async (pluginId: string): Promise<'enabled' | 'disabled' | null> => {
    try {
      const wasm = getWasm();
      if (!wasm) return null;
      const result = (wasm as any).umbra_wasm_plugin_kv_get(SYSTEM_PLUGIN_ID, `plugin_state:${pluginId}`);
      const parsed = JSON.parse(result);
      const value = parsed.value ?? null;
      if (value === 'enabled' || value === 'disabled') return value;
      return null;
    } catch {
      return null;
    }
  }, []);

  const removePluginState = useCallback(async (pluginId: string) => {
    try {
      const wasm = getWasm();
      if (!wasm) return;
      (wasm as any).umbra_wasm_plugin_kv_delete(SYSTEM_PLUGIN_ID, `plugin_state:${pluginId}`);
    } catch {
      // ignore
    }
  }, []);

  // ── Create sandboxed API for a plugin ──────────────────────────────────

  const createAPIForPlugin = useCallback(
    (manifest: PluginManifest): PluginAPI | null => {
      const bridge = createServiceBridge();
      if (!bridge) return null;

      const wasm = getWasm();
      if (!wasm) return null;

      const storage = createPluginStorage(manifest.id, wasm as any, {
        sql: !!manifest.storage?.sql,
      });

      return createSandboxedAPI(manifest, bridge, storage);
    },
    [createServiceBridge]
  );

  // ── Load installed plugins on mount ────────────────────────────────────

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    async function loadInstalled() {
      try {
        const wasm = getWasm();
        if (!wasm) return;

        const installer = new PluginInstaller(wasm as any);
        const manifests = await installer.getInstalled();

        for (const manifest of manifests) {
          if (cancelled) break;

          try {
            const stored = await installer.loadBundle(manifest.id);
            if (!stored || !stored.bundleCode) continue;

            const module = await loader.loadFromBundle(manifest.id, stored.bundleCode);
            registry.register(manifest, module);

            // Check saved state — default to 'enabled' for new installs
            const savedState = await loadPluginState(manifest.id);
            const shouldEnable = savedState !== 'disabled';

            if (shouldEnable) {
              const api = createAPIForPlugin(manifest);
              if (api) {
                await registry.enable(manifest.id, api);
              }
            }
          } catch (err) {
            console.error(`Failed to load plugin "${manifest.id}":`, err);
          }
        }
      } catch (err) {
        console.error('Failed to load installed plugins:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadInstalled();
    return () => { cancelled = true; };
  }, [isReady, registry, loader, createAPIForPlugin, loadPluginState]);

  // ── Plugin lifecycle methods ───────────────────────────────────────────

  const installPlugin = useCallback(
    async (downloadUrl: string, listing?: any) => {
      const wasm = getWasm();
      if (!wasm) throw new Error('WASM not ready');

      const installer = new PluginInstaller(wasm as any);

      // If listing provided, use it; otherwise create minimal listing
      const manifest = await installer.install(listing ?? {
        id: `dev.plugin.${Date.now()}`,
        name: 'Dev Plugin',
        description: '',
        author: { name: 'Developer' },
        version: '0.0.1',
        downloadUrl,
        size: 0,
        downloads: 0,
        tags: [],
        platforms: ['web', 'desktop'],
      });

      // Load and register
      const stored = await installer.loadBundle(manifest.id);
      if (!stored) throw new Error('Failed to load installed bundle');

      const module = await loader.loadFromBundle(manifest.id, stored.bundleCode);
      registry.register(manifest, module);

      // Auto-enable and persist state
      const api = createAPIForPlugin(manifest);
      if (api) {
        await registry.enable(manifest.id, api);
        await savePluginState(manifest.id, 'enabled');
      }
    },
    [registry, loader, createAPIForPlugin, savePluginState]
  );

  const uninstallPlugin = useCallback(
    async (id: string) => {
      // Disable first
      await registry.disable(id);
      registry.unregister(id);

      // Remove from storage
      const wasm = getWasm();
      if (wasm) {
        const installer = new PluginInstaller(wasm as any);
        await installer.uninstall(id);
      }

      // Remove saved state
      await removePluginState(id);

      // Clear commands
      commandsRef.current.delete(id);
      updateCommands();

      loader.invalidateCache(id);
    },
    [registry, loader, updateCommands, removePluginState]
  );

  const enablePlugin = useCallback(
    async (id: string) => {
      const instance = registry.getPlugin(id);
      if (!instance) throw new Error(`Plugin "${id}" not found`);

      const api = createAPIForPlugin(instance.manifest);
      if (!api) throw new Error('Service not ready');

      await registry.enable(id, api);
      await savePluginState(id, 'enabled');
    },
    [registry, createAPIForPlugin, savePluginState]
  );

  const disablePlugin = useCallback(
    async (id: string) => {
      await registry.disable(id);
      await savePluginState(id, 'disabled');
      commandsRef.current.delete(id);
      updateCommands();
    },
    [registry, updateCommands, savePluginState]
  );

  const getSlotComponents = useCallback(
    (slot: SlotName): SlotEntry[] => {
      return registry.getSlotComponents(slot);
    },
    // Re-evaluate when enabledCount changes (after enable/disable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registry, enabledCount]
  );

  // ── Context value ──────────────────────────────────────────────────────

  const value = useMemo<PluginContextValue>(
    () => ({
      isLoading,
      registry,
      marketplace,
      installPlugin,
      uninstallPlugin,
      enablePlugin,
      disablePlugin,
      getSlotComponents,
      enabledCount,
      pluginCommands,
    }),
    [
      isLoading,
      registry,
      marketplace,
      installPlugin,
      uninstallPlugin,
      enablePlugin,
      disablePlugin,
      getSlotComponents,
      enabledCount,
      pluginCommands,
    ]
  );

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function usePlugins(): PluginContextValue {
  const ctx = useContext(PluginContext);
  if (!ctx) {
    throw new Error('usePlugins must be used within a PluginProvider');
  }
  return ctx;
}
