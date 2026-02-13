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

export { initSqlBridge, closeSqlBridge, getSqlDatabase, enablePersistence } from './sql-bridge';
export { initUmbraWasm, getWasm, isWasmReady } from './loader';
export type { UmbraWasmModule } from './loader';
export { EventBridge, eventBridge } from './event-bridge';
export type { EventDomain, UmbraEvent, EventListener, DomainListener } from './event-bridge';
export { clearDatabaseExport, clearAllDatabaseExports, listStoredDids } from './indexed-db';
