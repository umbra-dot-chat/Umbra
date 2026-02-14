/**
 * PluginRegistry — Central registry of installed and active plugins.
 *
 * Tracks plugin instances, manages enable/disable lifecycle, and maintains
 * the slot → component map consumed by SlotRenderer.
 */

import type {
  PluginManifest,
  PluginModule,
  PluginInstance,
  PluginAPI,
  SlotName,
  SlotEntry,
} from '@umbra/plugin-sdk';

/** Callback signature for registry change subscriptions */
export type RegistryChangeCallback = () => void;

export class PluginRegistry {
  private plugins: Map<string, PluginInstance> = new Map();
  private slotMap: Map<SlotName, SlotEntry[]> = new Map();
  private listeners: Set<RegistryChangeCallback> = new Set();

  // ── Registration ─────────────────────────────────────────────────────────

  /**
   * Register a plugin with its loaded module.
   * Plugin starts in 'installed' state (not yet enabled).
   */
  register(manifest: PluginManifest, module: PluginModule): void {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin "${manifest.id}" is already registered.`);
    }

    this.plugins.set(manifest.id, {
      manifest,
      module,
      state: 'installed',
    });

    this.notify();
  }

  /**
   * Unregister a plugin. Must be disabled first.
   */
  unregister(pluginId: string): void {
    const instance = this.plugins.get(pluginId);
    if (!instance) return;

    if (instance.state === 'enabled') {
      this.disable(pluginId);
    }

    this.plugins.delete(pluginId);
    this.notify();
  }

  // ── Enable / Disable ────────────────────────────────────────────────────

  /**
   * Enable a plugin: call activate() and register its slot components.
   */
  async enable(pluginId: string, api: PluginAPI): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin "${pluginId}" not found.`);
    }
    if (instance.state === 'enabled') return;

    try {
      // Call plugin's activate lifecycle
      await instance.module.activate(api);

      // Register slot components
      for (const reg of instance.manifest.slots) {
        const Component = instance.module.components[reg.component];
        if (!Component) {
          console.warn(
            `Plugin "${pluginId}" slot "${reg.slot}" references unknown component "${reg.component}".`
          );
          continue;
        }

        const entry: SlotEntry = {
          pluginId,
          Component,
          priority: reg.priority ?? 100,
        };

        const existing = this.slotMap.get(reg.slot) ?? [];
        existing.push(entry);
        // Sort by priority (lower first)
        existing.sort((a, b) => a.priority - b.priority);
        this.slotMap.set(reg.slot, existing);
      }

      instance.state = 'enabled';
      instance.error = undefined;
    } catch (err: any) {
      instance.state = 'error';
      instance.error = err?.message ?? String(err);
      console.error(`Failed to enable plugin "${pluginId}":`, err);
    }

    this.notify();
  }

  /**
   * Disable a plugin: call deactivate() and remove its slot components.
   */
  async disable(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) return;
    if (instance.state !== 'enabled') return;

    try {
      await instance.module.deactivate?.();
    } catch (err) {
      console.error(`Error during deactivation of plugin "${pluginId}":`, err);
    }

    // Remove from all slots
    for (const [slot, entries] of this.slotMap) {
      const filtered = entries.filter((e) => e.pluginId !== pluginId);
      if (filtered.length > 0) {
        this.slotMap.set(slot, filtered);
      } else {
        this.slotMap.delete(slot);
      }
    }

    instance.state = 'disabled';
    this.notify();
  }

  // ── Queries ─────────────────────────────────────────────────────────────

  /** Get all slot components for a given slot name. */
  getSlotComponents(slot: SlotName): SlotEntry[] {
    return this.slotMap.get(slot) ?? [];
  }

  /** Get a single plugin by ID. */
  getPlugin(id: string): PluginInstance | undefined {
    return this.plugins.get(id);
  }

  /** Get all registered plugins. */
  getAllPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  /** Get only enabled plugins. */
  getEnabledPlugins(): PluginInstance[] {
    return this.getAllPlugins().filter((p) => p.state === 'enabled');
  }

  /** Check if a plugin is registered. */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  // ── Subscriptions ───────────────────────────────────────────────────────

  /** Subscribe to registry changes. Returns unsubscribe function. */
  onChange(cb: RegistryChangeCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify(): void {
    for (const cb of this.listeners) {
      try {
        cb();
      } catch (err) {
        console.error('PluginRegistry listener error:', err);
      }
    }
  }
}
