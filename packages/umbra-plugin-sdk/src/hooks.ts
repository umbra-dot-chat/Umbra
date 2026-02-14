/**
 * React hooks for plugin authors.
 *
 * These hooks are consumed inside plugin slot components to access
 * the sandboxed API, scoped storage, and slot-specific props.
 */

import { createContext, useContext } from 'react';
import type { PluginAPI, PluginKVStore } from './types';

// =============================================================================
// CONTEXTS (set by the runtime, consumed by plugins)
// =============================================================================

/** @internal — injected by PluginProvider / SlotRenderer */
export const PluginAPIContext = createContext<PluginAPI | null>(null);

/** @internal — injected by SlotRenderer with per-slot props */
export const SlotPropsContext = createContext<Record<string, any>>({});

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Access the sandboxed PluginAPI from within a plugin component.
 *
 * @throws If called outside a plugin context.
 *
 * @example
 * ```tsx
 * function MyPluginPanel() {
 *   const api = usePluginAPI();
 *   const friends = await api.getFriends();
 * }
 * ```
 */
export function usePluginAPI(): PluginAPI {
  const api = useContext(PluginAPIContext);
  if (!api) {
    throw new Error(
      'usePluginAPI() must be called from within a plugin component rendered by SlotRenderer.'
    );
  }
  return api;
}

/**
 * Convenience hook for scoped KV storage.
 *
 * Equivalent to `usePluginAPI().kv` but with a clearer intent.
 */
export function usePluginStorage(): PluginKVStore {
  const api = usePluginAPI();
  return api.kv;
}

/**
 * Access the props passed to the current slot.
 *
 * Each slot type passes different props:
 * - `message-actions`: `{ message, conversationId }`
 * - `message-decorator`: `{ message, conversationId }`
 * - `chat-toolbar`: `{ conversationId }`
 * - `chat-header`: `{ conversationId, friendName }`
 * - `sidebar-section`: `{}`
 * - `settings-tab`: `{}`
 * - `right-panel`: `{ conversationId }`
 * - `command-palette`: `{ onClose }`
 *
 * @example
 * ```tsx
 * function TranslateButton() {
 *   const { message } = useSlotProps<{ message: PluginMessage }>();
 *   // ...
 * }
 * ```
 */
export function useSlotProps<T = Record<string, any>>(): T {
  return useContext(SlotPropsContext) as T;
}
