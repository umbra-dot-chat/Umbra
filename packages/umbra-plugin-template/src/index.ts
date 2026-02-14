/**
 * Plugin entry point.
 *
 * This file is the main export for your plugin. The Umbra runtime calls:
 *  - activate(api)   — when the plugin is enabled
 *  - deactivate()    — when the plugin is disabled or uninstalled
 *  - components      — maps component names to React components for UI slots
 *
 * The component names must match those declared in manifest.json `slots[].component`.
 */

import type { PluginAPI } from '@umbra/plugin-sdk';
import { SidebarWidget } from './components/SidebarWidget';
import { MyPanel } from './components/MyPanel';

/** Stored reference to the plugin API (available after activation) */
let api: PluginAPI | null = null;

/** Cleanup functions for subscriptions registered during activate() */
const cleanups: (() => void)[] = [];

/**
 * Called when the plugin is enabled.
 * Use this to:
 * - Subscribe to events (messages, friends, conversations)
 * - Register commands in the command palette
 * - Set up persistent state from storage
 */
export async function activate(pluginApi: PluginAPI): Promise<void> {
  api = pluginApi;

  // Example: Register a command in the palette
  const unregister = api.registerCommand({
    id: 'my-plugin:hello',
    label: 'My Plugin: Say Hello',
    description: 'Shows a greeting notification',
    onSelect: () => {
      api?.showToast('Hello from My Plugin!', 'info');
    },
  });
  cleanups.push(unregister);

  // Example: Read persisted state
  const savedCount = await api.kv.get('visit_count');
  const count = savedCount ? parseInt(savedCount, 10) + 1 : 1;
  await api.kv.set('visit_count', String(count));

  console.log(`[MyPlugin] Activated! Visit count: ${count}`);
}

/**
 * Called when the plugin is disabled or uninstalled.
 * Clean up subscriptions, timers, and any resources.
 */
export function deactivate(): void {
  for (const cleanup of cleanups) {
    try { cleanup(); } catch { /* ignore */ }
  }
  cleanups.length = 0;
  api = null;
  console.log('[MyPlugin] Deactivated');
}

/**
 * Exported React components, keyed by the names used in manifest.json slots.
 *
 * Each component receives the slot-specific props from SlotRenderer.
 * For example, `message-decorator` components receive `{ message, conversationId }`.
 */
export const components = {
  SidebarWidget,
  MyPanel,
};
