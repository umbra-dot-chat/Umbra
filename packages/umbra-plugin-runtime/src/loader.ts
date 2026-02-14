/**
 * PluginLoader — Fetches, validates, and instantiates plugin bundles.
 *
 * Supports loading from:
 * - Local storage (IndexedDB / Tauri FS) for installed plugins
 * - URL for dev mode hot reload
 */

import type { PluginManifest, PluginModule } from '@umbra/plugin-sdk';

// =============================================================================
// VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const REQUIRED_MANIFEST_FIELDS: (keyof PluginManifest)[] = [
  'id',
  'name',
  'version',
  'description',
  'author',
  'platforms',
  'permissions',
  'slots',
  'entryPoint',
];

/**
 * Validate a plugin manifest against the expected schema.
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: ['Manifest is not an object.'] };
  }

  const m = manifest as Record<string, unknown>;

  for (const field of REQUIRED_MANIFEST_FIELDS) {
    if (m[field] === undefined || m[field] === null) {
      errors.push(`Missing required field: "${field}".`);
    }
  }

  if (typeof m.id === 'string' && !/^[a-z0-9.-]+$/.test(m.id)) {
    errors.push('Plugin ID must contain only lowercase letters, numbers, dots, and hyphens.');
  }

  if (typeof m.version === 'string' && !/^\d+\.\d+\.\d+/.test(m.version)) {
    errors.push('Version must be a valid semver string (e.g. "1.0.0").');
  }

  if (Array.isArray(m.platforms)) {
    for (const p of m.platforms) {
      if (p !== 'web' && p !== 'desktop') {
        errors.push(`Invalid platform: "${p}". Must be "web" or "desktop".`);
      }
    }
  }

  if (Array.isArray(m.slots)) {
    const validSlots = new Set([
      'settings-tab',
      'sidebar-section',
      'message-actions',
      'chat-toolbar',
      'chat-header',
      'message-decorator',
      'right-panel',
      'command-palette',
    ]);
    for (const s of m.slots) {
      if (typeof s === 'object' && s && typeof (s as any).slot === 'string') {
        if (!validSlots.has((s as any).slot)) {
          errors.push(`Invalid slot name: "${(s as any).slot}".`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// LOADER
// =============================================================================

export class PluginLoader {
  private moduleCache: Map<string, PluginModule> = new Map();

  /**
   * Load a plugin from a JS bundle string (from IndexedDB or filesystem).
   *
   * The bundle is evaluated as a self-contained module that exports
   * `{ activate, deactivate, components }`.
   */
  async loadFromBundle(pluginId: string, bundleCode: string): Promise<PluginModule> {
    // Check cache
    const cached = this.moduleCache.get(pluginId);
    if (cached) return cached;

    try {
      // Create a blob URL and dynamically import
      const blob = new Blob([bundleCode], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);

      try {
        const mod = await import(/* webpackIgnore: true */ url);
        const pluginModule = this.extractPluginModule(mod);
        this.moduleCache.set(pluginId, pluginModule);
        return pluginModule;
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      throw new Error(`Failed to load plugin "${pluginId}" from bundle: ${err.message}`);
    }
  }

  /**
   * Load a plugin from a URL (for dev mode / hot reload).
   *
   * Adds a cache-busting query parameter to force fresh imports.
   */
  async loadFromUrl(url: string): Promise<PluginModule> {
    try {
      const cacheBust = `?t=${Date.now()}`;
      const mod = await import(/* webpackIgnore: true */ `${url}${cacheBust}`);
      return this.extractPluginModule(mod);
    } catch (err: any) {
      throw new Error(`Failed to load plugin from URL "${url}": ${err.message}`);
    }
  }

  /**
   * Invalidate cached module (for hot reload).
   */
  invalidateCache(pluginId: string): void {
    this.moduleCache.delete(pluginId);
  }

  /**
   * Clear all cached modules.
   */
  clearCache(): void {
    this.moduleCache.clear();
  }

  // ── Dev Hot Reload ────────────────────────────────────────────────────

  private hotReloadTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  /**
   * Start polling a dev URL for changes. When the bundle changes,
   * the `onReload` callback is invoked with the new module.
   *
   * Returns a cleanup function that stops polling.
   */
  startHotReload(
    pluginId: string,
    url: string,
    onReload: (module: PluginModule) => void,
    intervalMs = 2000
  ): () => void {
    // Stop any existing hot reload for this plugin
    this.stopHotReload(pluginId);

    let lastHash = '';

    const poll = async () => {
      try {
        const cacheBust = `?t=${Date.now()}`;
        const response = await fetch(`${url}${cacheBust}`);
        if (!response.ok) return;

        const text = await response.text();
        // Simple hash to detect changes
        const hash = String(text.length) + ':' + text.slice(0, 200) + text.slice(-200);

        if (lastHash && hash !== lastHash) {
          console.log(`[HotReload] Change detected for "${pluginId}", reloading...`);
          this.invalidateCache(pluginId);
          const mod = await this.loadFromUrl(url);
          onReload(mod);
        }
        lastHash = hash;
      } catch {
        // Ignore fetch errors during hot reload polling
      }
    };

    // Initial load to set hash baseline
    poll();

    const timer = setInterval(poll, intervalMs);
    this.hotReloadTimers.set(pluginId, timer);

    return () => this.stopHotReload(pluginId);
  }

  /**
   * Stop hot reload polling for a plugin.
   */
  stopHotReload(pluginId: string): void {
    const timer = this.hotReloadTimers.get(pluginId);
    if (timer) {
      clearInterval(timer);
      this.hotReloadTimers.delete(pluginId);
    }
  }

  /**
   * Stop all hot reload watchers.
   */
  stopAllHotReload(): void {
    for (const [id] of this.hotReloadTimers) {
      this.stopHotReload(id);
    }
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private extractPluginModule(mod: any): PluginModule {
    // Handle both default export and named exports
    const source = mod.default ?? mod;

    const activate = source.activate;
    if (typeof activate !== 'function') {
      throw new Error('Plugin bundle must export an "activate" function.');
    }

    const components = source.components;
    if (!components || typeof components !== 'object') {
      throw new Error('Plugin bundle must export a "components" object.');
    }

    return {
      activate,
      deactivate: typeof source.deactivate === 'function' ? source.deactivate : undefined,
      components,
    };
  }
}
