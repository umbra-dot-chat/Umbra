/**
 * PluginStorage — Namespaced KV and SQL storage for plugins.
 *
 * Each plugin gets its own key namespace (`plugin:{pluginId}:{key}`)
 * and optional SQL tables prefixed with `plugin_{sanitizedId}_`.
 *
 * Storage is backed by the Rust WASM SQLite database through
 * dedicated FFI functions.
 */

import type { PluginKVStore, PluginSQLStore } from '@umbra/plugin-sdk';

/** Minimal WASM module interface for plugin storage operations */
export interface PluginWasmStorage {
  umbra_wasm_plugin_kv_get(pluginId: string, key: string): string | Promise<string>;
  umbra_wasm_plugin_kv_set(pluginId: string, key: string, value: string): string | Promise<string>;
  umbra_wasm_plugin_kv_delete(pluginId: string, key: string): string | Promise<string>;
  umbra_wasm_plugin_kv_list(pluginId: string, prefix: string): string | Promise<string>;
  umbra_wasm_plugin_sql_execute?(pluginId: string, query: string, params: string): string | Promise<string>;
}

/**
 * Namespaced KV store implementation backed by WASM SQLite.
 */
export class PluginKVStoreImpl implements PluginKVStore {
  constructor(
    private pluginId: string,
    private wasm: PluginWasmStorage
  ) {}

  async get(key: string): Promise<string | null> {
    try {
      const result = await this.wasm.umbra_wasm_plugin_kv_get(this.pluginId, key);
      const parsed = JSON.parse(result);
      return parsed.value ?? null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string): Promise<void> {
    await this.wasm.umbra_wasm_plugin_kv_set(this.pluginId, key, value);
  }

  async delete(key: string): Promise<void> {
    await this.wasm.umbra_wasm_plugin_kv_delete(this.pluginId, key);
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const result = await this.wasm.umbra_wasm_plugin_kv_list(this.pluginId, prefix ?? '');
      const parsed = JSON.parse(result);
      return Array.isArray(parsed.keys) ? parsed.keys : [];
    } catch {
      return [];
    }
  }
}

/**
 * Namespaced SQL store implementation.
 *
 * Plugins can only create/query tables prefixed with `plugin_{sanitizedId}_`.
 * The runtime validates queries before execution.
 */
export class PluginSQLStoreImpl implements PluginSQLStore {
  private tablePrefix: string;

  constructor(
    private pluginId: string,
    private wasm: PluginWasmStorage
  ) {
    // Sanitize plugin ID for use as table prefix
    this.tablePrefix = `plugin_${pluginId.replace(/[^a-z0-9]/g, '_')}_`;
  }

  async execute(query: string, params?: any[]): Promise<any> {
    if (!this.wasm.umbra_wasm_plugin_sql_execute) {
      throw new Error('SQL storage is not available.');
    }

    // Basic safety check: ensure queries only reference plugin-prefixed tables
    // This is a first-pass check; the Rust side does additional validation
    this.validateQuery(query);

    const paramsJson = JSON.stringify(params ?? []);
    const result = await this.wasm.umbra_wasm_plugin_sql_execute(
      this.pluginId,
      query,
      paramsJson
    );
    return JSON.parse(result);
  }

  /** Get the table prefix this plugin must use. */
  getTablePrefix(): string {
    return this.tablePrefix;
  }

  private validateQuery(query: string): void {
    // Normalize whitespace
    const normalized = query.replace(/\s+/g, ' ').trim().toLowerCase();

    // Check for dangerous operations
    const dangerous = ['drop database', 'drop table plugin_kv', 'drop table plugin_bundles'];
    for (const d of dangerous) {
      if (normalized.includes(d)) {
        throw new Error(`Forbidden SQL operation: ${d}`);
      }
    }

    // For CREATE TABLE, INSERT, UPDATE, DELETE, SELECT — ensure table names
    // reference only plugin-prefixed tables (basic check)
    const tablePattern = /(?:from|into|update|table)\s+([a-z_][a-z0-9_]*)/gi;
    let match;
    while ((match = tablePattern.exec(query)) !== null) {
      const tableName = match[1].toLowerCase();
      // Allow plugin-prefixed tables and sqlite_master (for introspection)
      if (
        !tableName.startsWith(this.tablePrefix) &&
        tableName !== 'sqlite_master'
      ) {
        throw new Error(
          `Plugin "${this.pluginId}" can only access tables prefixed with "${this.tablePrefix}". ` +
          `Got: "${tableName}".`
        );
      }
    }
  }
}

/**
 * Factory function to create storage instances for a plugin.
 */
export function createPluginStorage(
  pluginId: string,
  wasm: PluginWasmStorage,
  options?: { sql?: boolean }
): { kv: PluginKVStore; sql?: PluginSQLStore } {
  const kv = new PluginKVStoreImpl(pluginId, wasm);
  const sql = options?.sql ? new PluginSQLStoreImpl(pluginId, wasm) : undefined;
  return { kv, sql };
}
