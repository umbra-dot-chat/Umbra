/**
 * @umbra/wasm — TypeScript bindings for the Umbra Core WASM module.
 *
 * This package re-exports the wasm-bindgen generated bindings with
 * proper TypeScript types and provides initialization helpers.
 *
 * ## Usage
 *
 * ```ts
 * import { initUmbraWasm, wasm } from '@umbra/wasm';
 *
 * // Initialize (loads WASM + sql.js)
 * await initUmbraWasm();
 *
 * // Create identity
 * const result = wasm.umbra_wasm_identity_create("Alice");
 * const { did, recovery_phrase } = JSON.parse(result);
 * ```
 */

export { initUmbraWasm, getWasm, isWasmReady, enablePersistence, isReactNative } from './loader';
export type { UmbraWasmModule } from './loader';
export { EventBridge, eventBridge } from './event-bridge';
export type { EventDomain, UmbraEvent, EventListener, DomainListener } from './event-bridge';

// ─────────────────────────────────────────────────────────────────────────
// Web-only exports (sql-bridge + indexed-db)
//
// These are wrapped in functions to avoid statically importing sql.js,
// which breaks React Native (JSC has no WebAssembly support).
// On native, these are no-ops / return empty results.
// ─────────────────────────────────────────────────────────────────────────

import { isReactNative } from './loader';

export async function initSqlBridge(): Promise<void> {
  if (isReactNative()) return;
  const mod = await import('./sql-bridge');
  return mod.initSqlBridge();
}

export function closeSqlBridge(): void {
  if (isReactNative()) return;
  // Fire-and-forget dynamic import for cleanup
  import('./sql-bridge').then((mod) => mod.closeSqlBridge());
}

export function getSqlDatabase(): any {
  if (isReactNative()) return null;
  // This is sync in the original — we need a sync fallback.
  // On web, sql-bridge is already loaded by the time this is called.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('./sql-bridge');
    return mod.getSqlDatabase();
  } catch {
    return null;
  }
}

export async function clearDatabaseExport(did: string): Promise<void> {
  if (isReactNative()) return;
  const mod = await import('./indexed-db');
  return mod.clearDatabaseExport(did);
}

export async function clearAllDatabaseExports(): Promise<void> {
  if (isReactNative()) return;
  const mod = await import('./indexed-db');
  return mod.clearAllDatabaseExports();
}

export async function listStoredDids(): Promise<string[]> {
  if (isReactNative()) return [];
  const mod = await import('./indexed-db');
  return mod.listStoredDids();
}
