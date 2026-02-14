/**
 * Message Translator — Plugin entry point.
 *
 * This file is the main export for the translator plugin. The Umbra runtime calls:
 *  - activate(api)   — when the plugin is enabled
 *  - deactivate()    — when the plugin is disabled or uninstalled
 *  - components      — maps component names to React components for UI slots
 *
 * The component names must match those declared in manifest.json `slots[].component`.
 */

import type { PluginAPI } from '@umbra/plugin-sdk';
import { targetLang, setTargetLang } from './state';
import { TranslateAction } from './components/TranslateAction';
import { TranslationDecorator } from './components/TranslationDecorator';

/** Stored reference to the plugin API (available after activation) */
let api: PluginAPI | null = null;

/** Cleanup functions for subscriptions registered during activate() */
const cleanups: (() => void)[] = [];

/**
 * Called when the plugin is enabled.
 *
 * - Stores the API reference for later use
 * - Loads the saved target language from KV storage (defaults to 'es')
 * - Registers a "Translator: Set Language" command in the command palette
 */
export async function activate(pluginApi: PluginAPI): Promise<void> {
  api = pluginApi;

  // Restore persisted target language (default: 'es')
  const savedLang = await api.kv.get('target_lang');
  if (savedLang) {
    setTargetLang(savedLang);
  }

  // Register a command to display / change the target language
  const unregister = api.registerCommand({
    id: 'translator:set-language',
    label: 'Translator: Set Language',
    description: 'Show the current translation target language',
    onSelect: () => {
      api?.showToast(
        `Translation target language: ${targetLang}`,
        'info'
      );
    },
  });
  cleanups.push(unregister);

  console.log(`[Translator] Activated — target language: ${targetLang}`);
}

/**
 * Called when the plugin is disabled or uninstalled.
 * Cleans up registered commands and subscriptions.
 */
export function deactivate(): void {
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch {
      /* ignore */
    }
  }
  cleanups.length = 0;
  api = null;
  console.log('[Translator] Deactivated');
}

/**
 * Exported React components, keyed by the names used in manifest.json slots.
 *
 * - TranslateAction   -> message-actions slot
 * - TranslationDecorator -> message-decorator slot
 */
export const components = {
  TranslateAction,
  TranslationDecorator,
};
