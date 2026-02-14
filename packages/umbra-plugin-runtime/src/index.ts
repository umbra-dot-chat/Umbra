/**
 * @umbra/plugin-runtime — Plugin infrastructure for the Umbra app.
 *
 * Provides the registry, loader, storage, sandbox, installer, and
 * marketplace client used by the PluginProvider context.
 *
 * @packageDocumentation
 */

// ── Registry ─────────────────────────────────────────────────────────────────
export { PluginRegistry } from './registry';
export type { RegistryChangeCallback } from './registry';

// ── Loader ───────────────────────────────────────────────────────────────────
export { PluginLoader, validateManifest } from './loader';
export type { ValidationResult } from './loader';

// ── Storage ──────────────────────────────────────────────────────────────────
export {
  PluginKVStoreImpl,
  PluginSQLStoreImpl,
  createPluginStorage,
} from './storage';
export type { PluginWasmStorage } from './storage';

// ── Sandbox ──────────────────────────────────────────────────────────────────
export {
  createSandboxedAPI,
  cleanupSubscriptions,
  PermissionDeniedError,
} from './sandbox';
export type { ServiceBridge } from './sandbox';

// ── Installer ────────────────────────────────────────────────────────────────
export { PluginInstaller } from './installer';
export type { BundleStorage, StoredBundle } from './installer';

// ── Marketplace ──────────────────────────────────────────────────────────────
export { MarketplaceClient } from './marketplace';
export type { MarketplaceListing, PluginRegistry as PluginRegistryJSON } from './marketplace';
