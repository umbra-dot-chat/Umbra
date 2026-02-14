/**
 * PluginInstaller — Download, validate, persist, and remove plugin bundles.
 *
 * Storage strategy:
 * - Web: Plugin bundles stored in SQLite via WASM (plugin_bundles table)
 * - Desktop (Tauri): Plugin bundles stored in app data directory via Tauri FS API
 */

import type { PluginManifest } from '@umbra/plugin-sdk';
import { validateManifest } from './loader';
import type { MarketplaceListing } from './marketplace';

/** Minimal WASM interface for bundle persistence */
export interface BundleStorage {
  umbra_wasm_plugin_bundle_save(pluginId: string, manifest: string, bundle: string): string | Promise<string>;
  umbra_wasm_plugin_bundle_load(pluginId: string): string | Promise<string>;
  umbra_wasm_plugin_bundle_delete(pluginId: string): string | Promise<string>;
  umbra_wasm_plugin_bundle_list(): string | Promise<string>;
}

/** Stored plugin bundle data */
export interface StoredBundle {
  pluginId: string;
  manifest: PluginManifest;
  bundleCode: string;
  installedAt: string;
}

export class PluginInstaller {
  constructor(private storage: BundleStorage) {}

  /**
   * Download and install a plugin from a marketplace listing.
   *
   * 1. Fetch the bundle from the download URL
   * 2. Extract and validate the manifest
   * 3. Persist the bundle to local storage
   */
  async install(listing: MarketplaceListing): Promise<PluginManifest> {
    // 1. Download the bundle
    const response = await fetch(listing.downloadUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download plugin "${listing.id}": HTTP ${response.status}`
      );
    }

    const bundleText = await response.text();

    // 2. Parse the bundle to extract the manifest
    // Bundle format: The manifest is embedded as a JSON comment or
    // we fetch it separately. For simplicity, we use the listing's metadata.
    const manifest: PluginManifest = {
      id: listing.id,
      name: listing.name,
      version: listing.version,
      description: listing.description,
      author: listing.author,
      icon: listing.icon,
      platforms: listing.platforms,
      permissions: listing.permissions ?? [],
      slots: listing.slots ?? [],
      entryPoint: 'bundle.js',
      storage: listing.storage,
    };

    // 3. Validate
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(
        `Invalid plugin manifest for "${listing.id}": ${validation.errors.join(', ')}`
      );
    }

    // 4. Persist to local storage
    await this.storage.umbra_wasm_plugin_bundle_save(
      manifest.id,
      JSON.stringify(manifest),
      bundleText
    );

    return manifest;
  }

  /**
   * Install a plugin from a raw bundle string + manifest.
   * Used by dev mode "Load Dev Plugin" flow.
   */
  async installFromBundle(
    manifest: PluginManifest,
    bundleCode: string
  ): Promise<void> {
    const validation = validateManifest(manifest);
    if (!validation.valid) {
      throw new Error(
        `Invalid plugin manifest: ${validation.errors.join(', ')}`
      );
    }

    await this.storage.umbra_wasm_plugin_bundle_save(
      manifest.id,
      JSON.stringify(manifest),
      bundleCode
    );
  }

  /**
   * Uninstall a plugin — remove bundle and all storage.
   */
  async uninstall(pluginId: string): Promise<void> {
    await this.storage.umbra_wasm_plugin_bundle_delete(pluginId);
  }

  /**
   * Load a stored bundle from local storage.
   */
  async loadBundle(pluginId: string): Promise<StoredBundle | null> {
    try {
      const result = await this.storage.umbra_wasm_plugin_bundle_load(pluginId);
      const parsed = JSON.parse(result);

      if (!parsed || parsed.error) return null;

      return {
        pluginId: parsed.plugin_id ?? parsed.pluginId ?? pluginId,
        manifest: typeof parsed.manifest === 'string'
          ? JSON.parse(parsed.manifest)
          : parsed.manifest,
        bundleCode: parsed.bundle ?? parsed.bundleCode ?? '',
        installedAt: parsed.installed_at ?? parsed.installedAt ?? '',
      };
    } catch {
      return null;
    }
  }

  /**
   * List all installed plugin IDs and manifests.
   */
  async getInstalled(): Promise<PluginManifest[]> {
    try {
      const result = await this.storage.umbra_wasm_plugin_bundle_list();
      const parsed = JSON.parse(result);

      if (!Array.isArray(parsed.plugins)) return [];

      return parsed.plugins.map((p: any) => {
        const manifest = typeof p.manifest === 'string'
          ? JSON.parse(p.manifest)
          : p.manifest;
        return manifest as PluginManifest;
      });
    } catch {
      return [];
    }
  }
}
