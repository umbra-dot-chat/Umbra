/**
 * WASM Module Loader
 *
 * Handles loading and initializing the Umbra Core module.
 *
 * Supports two backends:
 *
 * ### Web (WASM) — default
 * 1. Load sql.js and create in-memory SQLite database
 * 2. Load the WASM module (wasm-bindgen init)
 * 3. Call umbra_wasm_init() to set up panic hooks + tracing
 * 4. Call umbra_wasm_init_database() to initialize the SQLite schema
 *
 * ### Desktop (Tauri) — auto-detected
 * 1. Detect Tauri runtime via `window.__TAURI_INTERNALS__`
 * 2. Load the Tauri IPC adapter (routes calls to native Rust backend)
 * 3. Call init + init_database via Tauri IPC
 * 4. No WASM or sql.js needed — native SQLite + Rust run in the Tauri process
 *
 * After initialization, all umbra_wasm_* functions are available regardless
 * of which backend is active.
 */

import { initSqlBridge, initSqlBridgeWithPersistence, enablePersistence } from './sql-bridge';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

/**
 * The raw WASM module interface — matches wasm-bindgen output.
 *
 * These are the functions exported from Rust via `#[wasm_bindgen]`.
 * Functions marked with `// stub` are provided as JavaScript wrappers
 * for features not yet implemented in the Rust WASM backend.
 */
export interface UmbraWasmModule {
  // Initialization
  umbra_wasm_init(): void;
  umbra_wasm_init_database(): Promise<boolean>;
  umbra_wasm_version(): string;

  // Identity
  umbra_wasm_identity_create(display_name: string): string;
  umbra_wasm_identity_restore(recovery_phrase: string, display_name: string): string;
  umbra_wasm_identity_set(json: string): void; // stub — for context hydration
  umbra_wasm_identity_get_did(): string;
  umbra_wasm_identity_get_profile(): string;
  umbra_wasm_identity_update_profile(json: string): void;

  // Discovery
  umbra_wasm_discovery_get_connection_info(): string;
  umbra_wasm_discovery_parse_connection_info(info: string): string;

  // Friends
  umbra_wasm_friends_send_request(did: string, message?: string): string;
  umbra_wasm_friends_accept_request(request_id: string): string;
  umbra_wasm_friends_reject_request(request_id: string): void;
  umbra_wasm_friends_list(): string;
  umbra_wasm_friends_pending_requests(direction: string): string;
  umbra_wasm_friends_remove(did: string): boolean;
  umbra_wasm_friends_block(did: string, reason?: string): void;
  umbra_wasm_friends_unblock(did: string): boolean;
  umbra_wasm_friends_store_incoming(json: string): void;
  umbra_wasm_friends_accept_from_relay(json: string): string;

  // Messaging (core — implemented in Rust WASM)
  umbra_wasm_messaging_get_conversations(): string;
  umbra_wasm_messaging_create_dm_conversation(friend_did: string): string;
  umbra_wasm_messaging_get_messages(conversation_id: string, limit: number, offset: number): string;
  umbra_wasm_messaging_send(conversation_id: string, content: string, reply_to_id?: string): string;
  umbra_wasm_messaging_mark_read(conversation_id: string): number;
  umbra_wasm_messaging_decrypt(conversation_id: string, content_encrypted_b64: string, nonce_hex: string, sender_did: string, timestamp: number | bigint): string;
  umbra_wasm_messaging_store_incoming(json: string): void;

  // Messaging (extended — implemented in Rust WASM, take JSON args)
  umbra_wasm_messaging_edit(json: string): string;
  umbra_wasm_messaging_delete(json: string): string;
  umbra_wasm_messaging_pin(json: string): string;
  umbra_wasm_messaging_unpin(json: string): string;
  umbra_wasm_messaging_add_reaction(json: string): string;
  umbra_wasm_messaging_remove_reaction(json: string): string;
  umbra_wasm_messaging_forward(json: string): string;
  umbra_wasm_messaging_get_thread(json: string): string;
  umbra_wasm_messaging_reply_thread(json: string): string;
  umbra_wasm_messaging_get_pinned(json: string): string;

  // Groups — CRUD (implemented in Rust WASM)
  umbra_wasm_groups_create(json: string): string;
  umbra_wasm_groups_get(group_id: string): string;
  umbra_wasm_groups_list(): string;
  umbra_wasm_groups_update(json: string): string;
  umbra_wasm_groups_delete(group_id: string): string;
  umbra_wasm_groups_add_member(json: string): string;
  umbra_wasm_groups_remove_member(json: string): string;
  umbra_wasm_groups_get_members(group_id: string): string;

  // Groups — Encryption (implemented in Rust WASM)
  umbra_wasm_groups_generate_key(group_id: string): string;
  umbra_wasm_groups_rotate_key(group_id: string): string;
  umbra_wasm_groups_import_key(json: string): string;
  umbra_wasm_groups_encrypt_message(json: string): string;
  umbra_wasm_groups_decrypt_message(json: string): string;
  umbra_wasm_groups_encrypt_key_for_member(json: string): string;

  // Groups — Invitations (implemented in Rust WASM)
  umbra_wasm_groups_store_invite(json: string): string;
  umbra_wasm_groups_get_pending_invites(): string;
  umbra_wasm_groups_accept_invite(invite_id: string): string;
  umbra_wasm_groups_decline_invite(invite_id: string): string;

  // Messaging — Delivery status (implemented in Rust WASM)
  umbra_wasm_messaging_update_status(json: string): string;

  // Network
  umbra_wasm_network_status(): string;
  umbra_wasm_network_start(): Promise<boolean>;
  umbra_wasm_network_stop(): Promise<boolean>;
  umbra_wasm_network_create_offer(): Promise<string>;
  umbra_wasm_network_accept_offer(offer_json: string): Promise<string>;
  umbra_wasm_network_complete_handshake(answer_json: string): Promise<boolean>;
  umbra_wasm_network_complete_answerer(offerer_did?: string, offerer_peer_id?: string): Promise<boolean>;

  // Relay
  umbra_wasm_relay_connect(relay_url: string): Promise<string>;
  umbra_wasm_relay_disconnect(): Promise<void>;
  umbra_wasm_relay_create_session(relay_url: string): Promise<string>;
  umbra_wasm_relay_accept_session(session_id: string, offer_payload: string): Promise<string>;
  umbra_wasm_relay_send(to_did: string, payload: string): Promise<string>;
  umbra_wasm_relay_fetch_offline(): Promise<string>;

  // Events
  umbra_wasm_subscribe_events(callback: (event_json: string) => void): void;

  // Calls
  umbra_wasm_calls_store(json: string): string;
  umbra_wasm_calls_end(json: string): string;
  umbra_wasm_calls_get_history(json: string): string;
  umbra_wasm_calls_get_all_history(json: string): string;

  // Crypto
  umbra_wasm_crypto_sign(data: Uint8Array): Uint8Array;
  umbra_wasm_crypto_verify(public_key_hex: string, data: Uint8Array, signature: Uint8Array): boolean;
  umbra_wasm_crypto_encrypt_for_peer(json: string): string;
  umbra_wasm_crypto_decrypt_from_peer(json: string): string;

  // File Encryption (E2EE)
  umbra_wasm_file_derive_key(json: string): string;
  umbra_wasm_file_encrypt_chunk(json: string): string;
  umbra_wasm_file_decrypt_chunk(json: string): string;
  umbra_wasm_channel_file_derive_key(json: string): string;
  umbra_wasm_compute_key_fingerprint(json: string): string;
  umbra_wasm_verify_key_fingerprint(json: string): string;
  umbra_wasm_mark_files_for_reencryption(json: string): string;
  umbra_wasm_get_files_needing_reencryption(json: string): string;
  umbra_wasm_clear_reencryption_flag(json: string): string;

  // Community — Core
  umbra_wasm_community_create(json: string): string;
  umbra_wasm_community_get(community_id: string): string;
  umbra_wasm_community_get_mine(member_did: string): string;
  umbra_wasm_community_update(json: string): string;
  umbra_wasm_community_delete(json: string): string;
  umbra_wasm_community_transfer_ownership(json: string): string;

  // Community — Spaces
  umbra_wasm_community_space_create(json: string): string;
  umbra_wasm_community_space_list(community_id: string): string;
  umbra_wasm_community_space_update(json: string): string;
  umbra_wasm_community_space_reorder(json: string): string;
  umbra_wasm_community_space_delete(json: string): string;

  // Community — Categories
  umbra_wasm_community_category_create(json: string): string;
  umbra_wasm_community_category_list(space_id: string): string;
  umbra_wasm_community_category_list_all(community_id: string): string;
  umbra_wasm_community_category_update(json: string): string;
  umbra_wasm_community_category_reorder(json: string): string;
  umbra_wasm_community_category_delete(json: string): string;
  umbra_wasm_community_channel_move_category(json: string): string;

  // Community — Channels
  umbra_wasm_community_channel_create(json: string): string;
  umbra_wasm_community_channel_list(space_id: string): string;
  umbra_wasm_community_channel_list_all(community_id: string): string;
  umbra_wasm_community_channel_get(channel_id: string): string;
  umbra_wasm_community_channel_update(json: string): string;
  umbra_wasm_community_channel_set_slow_mode(json: string): string;
  umbra_wasm_community_channel_set_e2ee(json: string): string;
  umbra_wasm_community_channel_delete(json: string): string;
  umbra_wasm_community_channel_reorder(json: string): string;

  // Community — Members
  umbra_wasm_community_join(json: string): string;
  umbra_wasm_community_leave(json: string): string;
  umbra_wasm_community_kick(json: string): string;
  umbra_wasm_community_ban(json: string): string;
  umbra_wasm_community_unban(json: string): string;
  umbra_wasm_community_member_list(community_id: string): string;
  umbra_wasm_community_member_get(community_id: string, member_did: string): string;
  umbra_wasm_community_member_update_profile(json: string): string;
  umbra_wasm_community_ban_list(community_id: string): string;

  // Community — Roles
  umbra_wasm_community_role_list(community_id: string): string;
  umbra_wasm_community_member_roles(community_id: string, member_did: string): string;
  umbra_wasm_community_role_assign(json: string): string;
  umbra_wasm_community_role_unassign(json: string): string;
  umbra_wasm_community_custom_role_create(json: string): string;
  umbra_wasm_community_role_update(json: string): string;
  umbra_wasm_community_role_update_permissions(json: string): string;
  umbra_wasm_community_role_delete(json: string): string;

  // Community — Invites
  umbra_wasm_community_invite_create(json: string): string;
  umbra_wasm_community_invite_use(json: string): string;
  umbra_wasm_community_invite_list(community_id: string): string;
  umbra_wasm_community_invite_delete(json: string): string;
  umbra_wasm_community_invite_set_vanity(json: string): string;

  // Community — Messages
  umbra_wasm_community_message_send(json: string): string;
  umbra_wasm_community_message_list(json: string): string;
  umbra_wasm_community_message_get(message_id: string): string;
  umbra_wasm_community_message_edit(json: string): string;
  umbra_wasm_community_message_delete(message_id: string): string;

  // Community — Reactions
  umbra_wasm_community_reaction_add(json: string): string;
  umbra_wasm_community_reaction_remove(json: string): string;
  umbra_wasm_community_reaction_list(message_id: string): string;

  // Community — Pins
  umbra_wasm_community_pin_message(json: string): string;
  umbra_wasm_community_unpin_message(json: string): string;
  umbra_wasm_community_pin_list(channel_id: string): string;

  // Community — Threads
  umbra_wasm_community_thread_create(json: string): string;
  umbra_wasm_community_thread_get(thread_id: string): string;
  umbra_wasm_community_thread_list(channel_id: string): string;
  umbra_wasm_community_thread_messages(json: string): string;

  // Community — Read Receipts
  umbra_wasm_community_mark_read(json: string): string;

  // Community — Files (real WASM)
  umbra_wasm_community_upload_file(json: string): string;
  umbra_wasm_community_get_files(json: string): string;
  umbra_wasm_community_get_file(json: string): string;
  umbra_wasm_community_delete_file(json: string): string;
  umbra_wasm_community_record_file_download(json: string): string;
  umbra_wasm_community_create_folder(json: string): string;
  umbra_wasm_community_get_folders(json: string): string;
  umbra_wasm_community_delete_folder(json: string): string;

  // DM — Files (real WASM)
  umbra_wasm_dm_upload_file(json: string): string;
  umbra_wasm_dm_get_files(json: string): string;
  umbra_wasm_dm_get_file(json: string): string;
  umbra_wasm_dm_delete_file(json: string): string;
  umbra_wasm_dm_record_file_download(json: string): string;
  umbra_wasm_dm_move_file(json: string): string;
  umbra_wasm_dm_create_folder(json: string): string;
  umbra_wasm_dm_get_folders(json: string): string;
  umbra_wasm_dm_delete_folder(json: string): string;
  umbra_wasm_dm_rename_folder(json: string): string;

  // File Chunking (real WASM)
  umbra_wasm_chunk_file(json: string): string;
  umbra_wasm_reassemble_file(json: string): string;
  umbra_wasm_get_file_manifest(json: string): string;

  // File Transfer Control (real WASM)
  umbra_wasm_transfer_initiate(json: string): string;
  umbra_wasm_transfer_accept(json: string): string;
  umbra_wasm_transfer_pause(transfer_id: string): string;
  umbra_wasm_transfer_resume(transfer_id: string): string;
  umbra_wasm_transfer_cancel(json: string): string;
  umbra_wasm_transfer_on_message(json: string): string;
  umbra_wasm_transfer_list(): string;
  umbra_wasm_transfer_get(transfer_id: string): string;
  umbra_wasm_transfer_get_incomplete(): string;
  umbra_wasm_transfer_chunks_to_send(transfer_id: string): string;
  umbra_wasm_transfer_mark_chunk_sent(json: string): string;

  // Plugin Storage — KV
  umbra_wasm_plugin_kv_get(plugin_id: string, key: string): string;
  umbra_wasm_plugin_kv_set(plugin_id: string, key: string, value: string): string;
  umbra_wasm_plugin_kv_delete(plugin_id: string, key: string): string;
  umbra_wasm_plugin_kv_list(plugin_id: string, prefix: string): string;

  // Plugin Storage — Bundles
  umbra_wasm_plugin_bundle_save(plugin_id: string, manifest: string, bundle: string): string;
  umbra_wasm_plugin_bundle_load(plugin_id: string): string;
  umbra_wasm_plugin_bundle_delete(plugin_id: string): string;
  umbra_wasm_plugin_bundle_list(): string;
}

// ─────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────

let wasmModule: UmbraWasmModule | null = null;
let initPromise: Promise<UmbraWasmModule> | null = null;

// ─────────────────────────────────────────────────────────────────────────
// Tauri Detection
// ─────────────────────────────────────────────────────────────────────────

/**
 * Detect if we're running inside a Tauri desktop app.
 *
 * Tauri injects `window.__TAURI_INTERNALS__` before any JS executes,
 * so this check is synchronous and reliable.
 */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as any).__TAURI_INTERNALS__
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Initialize the Umbra module.
 *
 * - On desktop (Tauri): loads the Tauri IPC adapter and initializes via
 *   native Rust backend. No WASM or sql.js needed.
 * - On web: loads sql.js, the WASM binary, and initializes everything.
 *
 * Safe to call multiple times — subsequent calls return the cached module.
 *
 * @param did - Optional DID for IndexedDB persistence. When provided,
 *   the database is restored from IndexedDB on init and auto-saved on
 *   every write. When omitted, the database is in-memory only.
 * @returns The initialized module interface
 */
export async function initUmbraWasm(did?: string): Promise<UmbraWasmModule> {
  if (wasmModule) return wasmModule;

  if (!initPromise) {
    initPromise = doInit(did).catch((err) => {
      // Clear the cached promise so subsequent attempts can retry
      initPromise = null;
      throw err;
    });
  }

  return initPromise;
}

/**
 * Get the module if already initialized.
 * Returns null if not yet loaded.
 */
export function getWasm(): UmbraWasmModule | null {
  return wasmModule;
}

/**
 * Check if the module is loaded and ready.
 */
export function isWasmReady(): boolean {
  return wasmModule !== null;
}

/**
 * Enable IndexedDB persistence for an already-initialized database.
 *
 * Call this after creating a new identity (when the DID first becomes
 * available). The database was initialized without persistence, and
 * this enables it retroactively.
 *
 * @param did - The DID of the newly created identity
 */
export { enablePersistence } from './sql-bridge';

// ─────────────────────────────────────────────────────────────────────────
// Internal
// ─────────────────────────────────────────────────────────────────────────

async function doInit(did?: string): Promise<UmbraWasmModule> {
  if (isTauri()) {
    return doInitTauri();
  }
  return doInitWasm(did);
}

/**
 * Initialize via Tauri IPC (desktop path).
 *
 * No WASM binary or sql.js needed — the native Rust backend handles
 * everything including SQLite via the filesystem.
 */
async function doInitTauri(): Promise<UmbraWasmModule> {
  console.log('[umbra] Initializing Tauri desktop backend...');

  // Access invoke() directly from Tauri's injected global.
  // We avoid importing @tauri-apps/api/core because Metro either bundles
  // it into the web build (causing "unknown module" errors) or, with
  // webpackIgnore, leaves a bare specifier the browser can't resolve.
  // __TAURI_INTERNALS__ is always available when isTauri() returns true.
  const internals = (window as any).__TAURI_INTERNALS__;
  if (!internals?.invoke) {
    throw new Error('[umbra] Tauri internals not available');
  }
  const invoke = internals.invoke.bind(internals) as (
    cmd: string,
    args?: Record<string, unknown>,
  ) => Promise<unknown>;

  // Create the Tauri adapter
  const { createTauriBackend } = await import('./tauri-backend');
  const backend = createTauriBackend(invoke);

  // Initialize (panic hooks + tracing already set up by Rust main())
  console.log('[umbra] Calling init via Tauri IPC...');
  backend.umbra_wasm_init();

  // Initialize the database schema (native SQLite on disk)
  console.log('[umbra] Initializing database via Tauri IPC...');
  await backend.umbra_wasm_init_database();

  wasmModule = backend;
  console.log(`[umbra] Desktop backend ready! Version: ${backend.umbra_wasm_version()}`);

  return backend;
}

/**
 * Initialize via WASM (web browser path).
 *
 * Loads sql.js for in-memory SQLite, then the wasm-bindgen WASM binary.
 */
async function doInitWasm(did?: string): Promise<UmbraWasmModule> {
  console.log('[umbra-wasm] Initializing...');

  // Step 1: Initialize sql.js bridge (must happen before WASM DB init)
  // If a DID is provided, enable IndexedDB persistence (restore from saved state)
  if (did) {
    console.log('[umbra-wasm] Loading sql.js with IndexedDB persistence...');
    await initSqlBridgeWithPersistence(did);
  } else {
    console.log('[umbra-wasm] Loading sql.js (in-memory, no persistence)...');
    await initSqlBridge();
  }

  // Step 2: Load the real compiled WASM module
  //
  // The wasm-bindgen JS glue + .wasm binary are served from public/ as static
  // assets (not bundled by Metro — Metro can't handle wasm-bindgen output).
  //
  // Files in public/:
  //   /umbra_core.js       — wasm-bindgen glue (ES module)
  //   /umbra_core_bg.wasm  — compiled WASM binary
  //
  // After `wasm-pack build`, run the copy step:
  //   cp packages/umbra-wasm/pkg/umbra_core.js public/
  //   cp packages/umbra-wasm/pkg/umbra_core_bg.wasm public/
  //
  console.log('[umbra-wasm] Loading WASM module...');
  let wasmPkg: any;

  try {
    // Dynamic import from the public directory (served at root by Expo web).
    // This bypasses Metro bundling entirely — the browser loads the ES module
    // directly, which is exactly what wasm-bindgen expects.
    // @ts-expect-error — runtime URL import from public directory, not a real module
    wasmPkg = await import(/* webpackIgnore: true */ '/umbra_core.js');

    // Initialize the WASM binary with an explicit URL to avoid import.meta.url
    // issues. The wasm-bindgen init function accepts a URL/string path.
    if (typeof wasmPkg.default === 'function') {
      await wasmPkg.default('/umbra_core_bg.wasm');
    }
  } catch (err) {
    const msg =
      'Failed to load WASM module. Ensure WASM is compiled and copied to public/.\n' +
      'Run: npm run build:wasm\n' +
      `Error: ${err instanceof Error ? err.message : err}`;
    console.error('[umbra-wasm]', msg);
    throw new Error(msg);
  }

  // Step 3: Build the module interface with real WASM + JS stubs for
  // extended features not yet in Rust
  const wasm = buildModule(wasmPkg);

  // Step 4: Initialize Umbra (panic hooks, tracing)
  console.log('[umbra-wasm] Calling umbra_wasm_init()...');
  wasm.umbra_wasm_init();

  // Step 5: Initialize the database schema
  console.log('[umbra-wasm] Initializing database...');
  await wasm.umbra_wasm_init_database();

  wasmModule = wasm;
  console.log(`[umbra-wasm] Ready! Version: ${wasm.umbra_wasm_version()}`);

  return wasm;
}

/**
 * Build the UmbraWasmModule by mapping real WASM exports and adding
 * JS-side stubs for features not yet implemented in Rust.
 */
function buildModule(wasmPkg: any): UmbraWasmModule {
  // Event callback for stubs
  let eventCallback: ((json: string) => void) | null = null;

  function emitStub(domain: string, data: Record<string, unknown>) {
    if (eventCallback) {
      eventCallback(JSON.stringify({ domain, data }));
    }
  }

  return {
    // ── Real WASM exports (delegated directly) ──────────────────────

    // Initialization
    umbra_wasm_init: () => wasmPkg.umbra_wasm_init(),
    umbra_wasm_init_database: () => wasmPkg.umbra_wasm_init_database(),
    umbra_wasm_version: () => wasmPkg.umbra_wasm_version(),

    // Identity
    umbra_wasm_identity_create: (dn: string) => wasmPkg.umbra_wasm_identity_create(dn),
    umbra_wasm_identity_restore: (phrase: string, dn: string) =>
      wasmPkg.umbra_wasm_identity_restore(phrase, dn),
    umbra_wasm_identity_get_did: () => wasmPkg.umbra_wasm_identity_get_did(),
    umbra_wasm_identity_get_profile: () => wasmPkg.umbra_wasm_identity_get_profile(),
    umbra_wasm_identity_update_profile: (json: string) =>
      wasmPkg.umbra_wasm_identity_update_profile(json),

    // Identity set — stub for context hydration (not in Rust WASM)
    // The context checks `typeof w.umbra_wasm_identity_set === 'function'`
    // before calling, so this is safe as a no-op.
    umbra_wasm_identity_set: (_json: string) => {
      // No-op: real WASM manages identity via create/restore
      console.debug('[umbra-wasm] identity_set called (no-op — use create or restore)');
    },

    // Discovery
    umbra_wasm_discovery_get_connection_info: () =>
      wasmPkg.umbra_wasm_discovery_get_connection_info(),
    umbra_wasm_discovery_parse_connection_info: (info: string) =>
      wasmPkg.umbra_wasm_discovery_parse_connection_info(info),

    // Friends
    umbra_wasm_friends_send_request: (did: string, msg?: string) =>
      wasmPkg.umbra_wasm_friends_send_request(did, msg ?? null),
    umbra_wasm_friends_accept_request: (id: string) =>
      wasmPkg.umbra_wasm_friends_accept_request(id),
    umbra_wasm_friends_reject_request: (id: string) =>
      wasmPkg.umbra_wasm_friends_reject_request(id),
    umbra_wasm_friends_list: () => wasmPkg.umbra_wasm_friends_list(),
    umbra_wasm_friends_pending_requests: (dir: string) =>
      wasmPkg.umbra_wasm_friends_pending_requests(dir),
    umbra_wasm_friends_remove: (did: string) => wasmPkg.umbra_wasm_friends_remove(did),
    umbra_wasm_friends_block: (did: string, reason?: string) =>
      wasmPkg.umbra_wasm_friends_block(did, reason ?? null),
    umbra_wasm_friends_unblock: (did: string) => wasmPkg.umbra_wasm_friends_unblock(did),
    umbra_wasm_friends_store_incoming: (json: string) =>
      wasmPkg.umbra_wasm_friends_store_incoming(json),
    umbra_wasm_friends_accept_from_relay: (json: string) =>
      wasmPkg.umbra_wasm_friends_accept_from_relay(json),

    // Messaging (core — real WASM)
    umbra_wasm_messaging_get_conversations: () =>
      wasmPkg.umbra_wasm_messaging_get_conversations(),
    umbra_wasm_messaging_create_dm_conversation: (friendDid: string) =>
      wasmPkg.umbra_wasm_messaging_create_dm_conversation(friendDid),
    umbra_wasm_messaging_get_messages: (cid: string, limit: number, offset: number) =>
      wasmPkg.umbra_wasm_messaging_get_messages(cid, limit, offset),
    umbra_wasm_messaging_send: (cid: string, content: string, _replyToId?: string) =>
      wasmPkg.umbra_wasm_messaging_send(cid, content),
    umbra_wasm_messaging_mark_read: (cid: string) =>
      wasmPkg.umbra_wasm_messaging_mark_read(cid),
    umbra_wasm_messaging_decrypt: (cid: string, contentB64: string, nonceHex: string, senderDid: string, timestamp: number | bigint) =>
      wasmPkg.umbra_wasm_messaging_decrypt(cid, contentB64, nonceHex, senderDid, typeof timestamp === 'bigint' ? timestamp : BigInt(timestamp)),
    umbra_wasm_messaging_store_incoming: (json: string) =>
      wasmPkg.umbra_wasm_messaging_store_incoming(json),

    // ── Extended messaging (real WASM — take JSON args) ────────────
    umbra_wasm_messaging_edit: (json: string) =>
      wasmPkg.umbra_wasm_messaging_edit(json),
    umbra_wasm_messaging_delete: (json: string) =>
      wasmPkg.umbra_wasm_messaging_delete(json),
    umbra_wasm_messaging_pin: (json: string) =>
      wasmPkg.umbra_wasm_messaging_pin(json),
    umbra_wasm_messaging_unpin: (json: string) =>
      wasmPkg.umbra_wasm_messaging_unpin(json),
    umbra_wasm_messaging_add_reaction: (json: string) =>
      wasmPkg.umbra_wasm_messaging_add_reaction(json),
    umbra_wasm_messaging_remove_reaction: (json: string) =>
      wasmPkg.umbra_wasm_messaging_remove_reaction(json),
    umbra_wasm_messaging_forward: (json: string) =>
      wasmPkg.umbra_wasm_messaging_forward(json),
    umbra_wasm_messaging_get_thread: (json: string) =>
      wasmPkg.umbra_wasm_messaging_get_thread(json),
    umbra_wasm_messaging_reply_thread: (json: string) =>
      wasmPkg.umbra_wasm_messaging_reply_thread(json),
    umbra_wasm_messaging_get_pinned: (json: string) =>
      wasmPkg.umbra_wasm_messaging_get_pinned(json),

    // ── Groups — CRUD (real WASM) ──────────────────────────────────
    umbra_wasm_groups_create: (json: string) =>
      wasmPkg.umbra_wasm_groups_create(json),
    umbra_wasm_groups_get: (groupId: string) =>
      wasmPkg.umbra_wasm_groups_get(groupId),
    umbra_wasm_groups_list: () =>
      wasmPkg.umbra_wasm_groups_list(),
    umbra_wasm_groups_update: (json: string) =>
      wasmPkg.umbra_wasm_groups_update(json),
    umbra_wasm_groups_delete: (groupId: string) =>
      wasmPkg.umbra_wasm_groups_delete(groupId),
    umbra_wasm_groups_add_member: (json: string) =>
      wasmPkg.umbra_wasm_groups_add_member(json),
    umbra_wasm_groups_remove_member: (json: string) =>
      wasmPkg.umbra_wasm_groups_remove_member(json),
    umbra_wasm_groups_get_members: (groupId: string) =>
      wasmPkg.umbra_wasm_groups_get_members(groupId),

    // ── Groups — Encryption (real WASM) ─────────────────────────────
    umbra_wasm_groups_generate_key: (groupId: string) =>
      wasmPkg.umbra_wasm_groups_generate_key(groupId),
    umbra_wasm_groups_rotate_key: (groupId: string) =>
      wasmPkg.umbra_wasm_groups_rotate_key(groupId),
    umbra_wasm_groups_import_key: (json: string) =>
      wasmPkg.umbra_wasm_groups_import_key(json),
    umbra_wasm_groups_encrypt_message: (json: string) =>
      wasmPkg.umbra_wasm_groups_encrypt_message(json),
    umbra_wasm_groups_decrypt_message: (json: string) =>
      wasmPkg.umbra_wasm_groups_decrypt_message(json),
    umbra_wasm_groups_encrypt_key_for_member: (json: string) =>
      wasmPkg.umbra_wasm_groups_encrypt_key_for_member(json),

    // ── Groups — Invitations (real WASM) ─────────────────────────────
    umbra_wasm_groups_store_invite: (json: string) =>
      wasmPkg.umbra_wasm_groups_store_invite(json),
    umbra_wasm_groups_get_pending_invites: () =>
      wasmPkg.umbra_wasm_groups_get_pending_invites(),
    umbra_wasm_groups_accept_invite: (inviteId: string) =>
      wasmPkg.umbra_wasm_groups_accept_invite(inviteId),
    umbra_wasm_groups_decline_invite: (inviteId: string) =>
      wasmPkg.umbra_wasm_groups_decline_invite(inviteId),

    // ── Messaging — Delivery status (real WASM) ─────────────────────
    umbra_wasm_messaging_update_status: (json: string) =>
      wasmPkg.umbra_wasm_messaging_update_status(json),

    // ── Network (real WASM) ─────────────────────────────────────────
    umbra_wasm_network_status: () => wasmPkg.umbra_wasm_network_status(),
    umbra_wasm_network_start: () => wasmPkg.umbra_wasm_network_start(),
    umbra_wasm_network_stop: () => wasmPkg.umbra_wasm_network_stop(),
    umbra_wasm_network_create_offer: () => wasmPkg.umbra_wasm_network_create_offer(),
    umbra_wasm_network_accept_offer: (offerJson: string) =>
      wasmPkg.umbra_wasm_network_accept_offer(offerJson),
    umbra_wasm_network_complete_handshake: (answerJson: string) =>
      wasmPkg.umbra_wasm_network_complete_handshake(answerJson),
    umbra_wasm_network_complete_answerer: (offererDid?: string, offererPeerId?: string) =>
      wasmPkg.umbra_wasm_network_complete_answerer(offererDid, offererPeerId),

    // ── Relay (real WASM) ────────────────────────────────────────────
    umbra_wasm_relay_connect: (relayUrl: string) =>
      wasmPkg.umbra_wasm_relay_connect(relayUrl),
    umbra_wasm_relay_disconnect: () =>
      wasmPkg.umbra_wasm_relay_disconnect(),
    umbra_wasm_relay_create_session: (relayUrl: string) =>
      wasmPkg.umbra_wasm_relay_create_session(relayUrl),
    umbra_wasm_relay_accept_session: (sessionId: string, offerPayload: string) =>
      wasmPkg.umbra_wasm_relay_accept_session(sessionId, offerPayload),
    umbra_wasm_relay_send: (toDid: string, payload: string) =>
      wasmPkg.umbra_wasm_relay_send(toDid, payload),
    umbra_wasm_relay_fetch_offline: () =>
      wasmPkg.umbra_wasm_relay_fetch_offline(),

    // ── Calls (real WASM) ───────────────────────────────────────────
    umbra_wasm_calls_store: (json: string) =>
      wasmPkg.umbra_wasm_calls_store(json),
    umbra_wasm_calls_end: (json: string) =>
      wasmPkg.umbra_wasm_calls_end(json),
    umbra_wasm_calls_get_history: (json: string) =>
      wasmPkg.umbra_wasm_calls_get_history(json),
    umbra_wasm_calls_get_all_history: (json: string) =>
      wasmPkg.umbra_wasm_calls_get_all_history(json),

    // ── Events (real WASM) ──────────────────────────────────────────
    umbra_wasm_subscribe_events: (callback: (event_json: string) => void) => {
      eventCallback = callback;
      wasmPkg.umbra_wasm_subscribe_events(callback);
    },

    // ── Crypto (real WASM) ──────────────────────────────────────────
    umbra_wasm_crypto_sign: (data: Uint8Array) => wasmPkg.umbra_wasm_crypto_sign(data),
    umbra_wasm_crypto_verify: (pk: string, data: Uint8Array, sig: Uint8Array) =>
      wasmPkg.umbra_wasm_crypto_verify(pk, data, sig),
    umbra_wasm_crypto_encrypt_for_peer: (json: string) =>
      wasmPkg.umbra_wasm_crypto_encrypt_for_peer(json),
    umbra_wasm_crypto_decrypt_from_peer: (json: string) =>
      wasmPkg.umbra_wasm_crypto_decrypt_from_peer(json),

    // ── File Encryption (E2EE) ──────────────────────────────────────
    umbra_wasm_file_derive_key: (json: string) =>
      wasmPkg.umbra_wasm_file_derive_key(json),
    umbra_wasm_file_encrypt_chunk: (json: string) =>
      wasmPkg.umbra_wasm_file_encrypt_chunk(json),
    umbra_wasm_file_decrypt_chunk: (json: string) =>
      wasmPkg.umbra_wasm_file_decrypt_chunk(json),
    umbra_wasm_channel_file_derive_key: (json: string) =>
      wasmPkg.umbra_wasm_channel_file_derive_key(json),
    umbra_wasm_compute_key_fingerprint: (json: string) =>
      wasmPkg.umbra_wasm_compute_key_fingerprint(json),
    umbra_wasm_verify_key_fingerprint: (json: string) =>
      wasmPkg.umbra_wasm_verify_key_fingerprint(json),
    umbra_wasm_mark_files_for_reencryption: (json: string) =>
      wasmPkg.umbra_wasm_mark_files_for_reencryption(json),
    umbra_wasm_get_files_needing_reencryption: (json: string) =>
      wasmPkg.umbra_wasm_get_files_needing_reencryption(json),
    umbra_wasm_clear_reencryption_flag: (json: string) =>
      wasmPkg.umbra_wasm_clear_reencryption_flag(json),

    // ── Community (real WASM) ──────────────────────────────────────
    umbra_wasm_community_create: (json: string) =>
      wasmPkg.umbra_wasm_community_create(json),
    umbra_wasm_community_get: (communityId: string) =>
      wasmPkg.umbra_wasm_community_get(communityId),
    umbra_wasm_community_get_mine: (memberDid: string) =>
      wasmPkg.umbra_wasm_community_get_mine(memberDid),
    umbra_wasm_community_update: (json: string) =>
      wasmPkg.umbra_wasm_community_update(json),
    umbra_wasm_community_delete: (json: string) =>
      wasmPkg.umbra_wasm_community_delete(json),
    umbra_wasm_community_transfer_ownership: (json: string) =>
      wasmPkg.umbra_wasm_community_transfer_ownership(json),

    // Community — Spaces
    umbra_wasm_community_space_create: (json: string) =>
      wasmPkg.umbra_wasm_community_space_create(json),
    umbra_wasm_community_space_list: (communityId: string) =>
      wasmPkg.umbra_wasm_community_space_list(communityId),
    umbra_wasm_community_space_update: (json: string) =>
      wasmPkg.umbra_wasm_community_space_update(json),
    umbra_wasm_community_space_reorder: (json: string) =>
      wasmPkg.umbra_wasm_community_space_reorder(json),
    umbra_wasm_community_space_delete: (json: string) =>
      wasmPkg.umbra_wasm_community_space_delete(json),

    // Community — Categories
    umbra_wasm_community_category_create: (json: string) =>
      wasmPkg.umbra_wasm_community_category_create(json),
    umbra_wasm_community_category_list: (spaceId: string) =>
      wasmPkg.umbra_wasm_community_category_list(spaceId),
    umbra_wasm_community_category_list_all: (communityId: string) =>
      wasmPkg.umbra_wasm_community_category_list_all(communityId),
    umbra_wasm_community_category_update: (json: string) =>
      wasmPkg.umbra_wasm_community_category_update(json),
    umbra_wasm_community_category_reorder: (json: string) =>
      wasmPkg.umbra_wasm_community_category_reorder(json),
    umbra_wasm_community_category_delete: (json: string) =>
      wasmPkg.umbra_wasm_community_category_delete(json),
    umbra_wasm_community_channel_move_category: (json: string) =>
      wasmPkg.umbra_wasm_community_channel_move_category(json),

    // Community — Channels
    umbra_wasm_community_channel_create: (json: string) =>
      wasmPkg.umbra_wasm_community_channel_create(json),
    umbra_wasm_community_channel_list: (spaceId: string) =>
      wasmPkg.umbra_wasm_community_channel_list(spaceId),
    umbra_wasm_community_channel_list_all: (communityId: string) =>
      wasmPkg.umbra_wasm_community_channel_list_all(communityId),
    umbra_wasm_community_channel_get: (channelId: string) =>
      wasmPkg.umbra_wasm_community_channel_get(channelId),
    umbra_wasm_community_channel_update: (json: string) =>
      wasmPkg.umbra_wasm_community_channel_update(json),
    umbra_wasm_community_channel_set_slow_mode: (json: string) =>
      wasmPkg.umbra_wasm_community_channel_set_slow_mode(json),
    umbra_wasm_community_channel_set_e2ee: (json: string) =>
      wasmPkg.umbra_wasm_community_channel_set_e2ee(json),
    umbra_wasm_community_channel_delete: (json: string) =>
      wasmPkg.umbra_wasm_community_channel_delete(json),
    umbra_wasm_community_channel_reorder: (json: string) =>
      wasmPkg.umbra_wasm_community_channel_reorder(json),

    // Community — Members
    umbra_wasm_community_join: (json: string) =>
      wasmPkg.umbra_wasm_community_join(json),
    umbra_wasm_community_leave: (json: string) =>
      wasmPkg.umbra_wasm_community_leave(json),
    umbra_wasm_community_kick: (json: string) =>
      wasmPkg.umbra_wasm_community_kick(json),
    umbra_wasm_community_ban: (json: string) =>
      wasmPkg.umbra_wasm_community_ban(json),
    umbra_wasm_community_unban: (json: string) =>
      wasmPkg.umbra_wasm_community_unban(json),
    umbra_wasm_community_member_list: (communityId: string) =>
      wasmPkg.umbra_wasm_community_member_list(communityId),
    umbra_wasm_community_member_get: (communityId: string, memberDid: string) =>
      wasmPkg.umbra_wasm_community_member_get(communityId, memberDid),
    umbra_wasm_community_member_update_profile: (json: string) =>
      wasmPkg.umbra_wasm_community_member_update_profile(json),
    umbra_wasm_community_ban_list: (communityId: string) =>
      wasmPkg.umbra_wasm_community_ban_list(communityId),

    // Community — Roles
    umbra_wasm_community_role_list: (communityId: string) =>
      wasmPkg.umbra_wasm_community_role_list(communityId),
    umbra_wasm_community_member_roles: (communityId: string, memberDid: string) =>
      wasmPkg.umbra_wasm_community_member_roles(communityId, memberDid),
    umbra_wasm_community_role_assign: (json: string) =>
      wasmPkg.umbra_wasm_community_role_assign(json),
    umbra_wasm_community_role_unassign: (json: string) =>
      wasmPkg.umbra_wasm_community_role_unassign(json),
    umbra_wasm_community_custom_role_create: (json: string) =>
      wasmPkg.umbra_wasm_community_custom_role_create(json),
    umbra_wasm_community_role_update: (json: string) =>
      wasmPkg.umbra_wasm_community_role_update(json),
    umbra_wasm_community_role_update_permissions: (json: string) =>
      wasmPkg.umbra_wasm_community_role_update_permissions(json),
    umbra_wasm_community_role_delete: (json: string) =>
      wasmPkg.umbra_wasm_community_role_delete(json),

    // Community — Invites
    umbra_wasm_community_invite_create: (json: string) =>
      wasmPkg.umbra_wasm_community_invite_create(json),
    umbra_wasm_community_invite_use: (json: string) =>
      wasmPkg.umbra_wasm_community_invite_use(json),
    umbra_wasm_community_invite_list: (communityId: string) =>
      wasmPkg.umbra_wasm_community_invite_list(communityId),
    umbra_wasm_community_invite_delete: (json: string) =>
      wasmPkg.umbra_wasm_community_invite_delete(json),
    umbra_wasm_community_invite_set_vanity: (json: string) =>
      wasmPkg.umbra_wasm_community_invite_set_vanity(json),

    // Community — Messages
    umbra_wasm_community_message_send: (json: string) =>
      wasmPkg.umbra_wasm_community_message_send(json),
    umbra_wasm_community_message_list: (json: string) =>
      wasmPkg.umbra_wasm_community_message_list(json),
    umbra_wasm_community_message_get: (messageId: string) =>
      wasmPkg.umbra_wasm_community_message_get(messageId),
    umbra_wasm_community_message_edit: (json: string) =>
      wasmPkg.umbra_wasm_community_message_edit(json),
    umbra_wasm_community_message_delete: (messageId: string) =>
      wasmPkg.umbra_wasm_community_message_delete(messageId),

    // Community — Reactions
    umbra_wasm_community_reaction_add: (json: string) =>
      wasmPkg.umbra_wasm_community_reaction_add(json),
    umbra_wasm_community_reaction_remove: (json: string) =>
      wasmPkg.umbra_wasm_community_reaction_remove(json),
    umbra_wasm_community_reaction_list: (messageId: string) =>
      wasmPkg.umbra_wasm_community_reaction_list(messageId),

    // Community — Pins
    umbra_wasm_community_pin_message: (json: string) =>
      wasmPkg.umbra_wasm_community_pin_message(json),
    umbra_wasm_community_unpin_message: (json: string) =>
      wasmPkg.umbra_wasm_community_unpin_message(json),
    umbra_wasm_community_pin_list: (channelId: string) =>
      wasmPkg.umbra_wasm_community_pin_list(channelId),

    // Community — Threads
    umbra_wasm_community_thread_create: (json: string) =>
      wasmPkg.umbra_wasm_community_thread_create(json),
    umbra_wasm_community_thread_get: (threadId: string) =>
      wasmPkg.umbra_wasm_community_thread_get(threadId),
    umbra_wasm_community_thread_list: (channelId: string) =>
      wasmPkg.umbra_wasm_community_thread_list(channelId),
    umbra_wasm_community_thread_messages: (json: string) =>
      wasmPkg.umbra_wasm_community_thread_messages(json),

    // Community — Read Receipts
    umbra_wasm_community_mark_read: (json: string) =>
      wasmPkg.umbra_wasm_community_mark_read(json),

    // ── Community — Files (real WASM) ──────────────────────────────
    umbra_wasm_community_upload_file: (json: string) =>
      wasmPkg.umbra_wasm_community_upload_file(json),
    umbra_wasm_community_get_files: (json: string) =>
      wasmPkg.umbra_wasm_community_get_files(json),
    umbra_wasm_community_get_file: (json: string) =>
      wasmPkg.umbra_wasm_community_get_file(json),
    umbra_wasm_community_delete_file: (json: string) =>
      wasmPkg.umbra_wasm_community_delete_file(json),
    umbra_wasm_community_record_file_download: (json: string) =>
      wasmPkg.umbra_wasm_community_record_file_download(json),
    umbra_wasm_community_create_folder: (json: string) =>
      wasmPkg.umbra_wasm_community_create_folder(json),
    umbra_wasm_community_get_folders: (json: string) =>
      wasmPkg.umbra_wasm_community_get_folders(json),
    umbra_wasm_community_delete_folder: (json: string) =>
      wasmPkg.umbra_wasm_community_delete_folder(json),

    // ── DM — Files (real WASM) ──────────────────────────────────────
    umbra_wasm_dm_upload_file: (json: string) =>
      wasmPkg.umbra_wasm_dm_upload_file(json),
    umbra_wasm_dm_get_files: (json: string) =>
      wasmPkg.umbra_wasm_dm_get_files(json),
    umbra_wasm_dm_get_file: (json: string) =>
      wasmPkg.umbra_wasm_dm_get_file(json),
    umbra_wasm_dm_delete_file: (json: string) =>
      wasmPkg.umbra_wasm_dm_delete_file(json),
    umbra_wasm_dm_record_file_download: (json: string) =>
      wasmPkg.umbra_wasm_dm_record_file_download(json),
    umbra_wasm_dm_move_file: (json: string) =>
      wasmPkg.umbra_wasm_dm_move_file(json),
    umbra_wasm_dm_create_folder: (json: string) =>
      wasmPkg.umbra_wasm_dm_create_folder(json),
    umbra_wasm_dm_get_folders: (json: string) =>
      wasmPkg.umbra_wasm_dm_get_folders(json),
    umbra_wasm_dm_delete_folder: (json: string) =>
      wasmPkg.umbra_wasm_dm_delete_folder(json),
    umbra_wasm_dm_rename_folder: (json: string) =>
      wasmPkg.umbra_wasm_dm_rename_folder(json),

    // ── File Chunking (real WASM) ───────────────────────────────────
    umbra_wasm_chunk_file: (json: string) =>
      wasmPkg.umbra_wasm_chunk_file(json),
    umbra_wasm_reassemble_file: (json: string) =>
      wasmPkg.umbra_wasm_reassemble_file(json),
    umbra_wasm_get_file_manifest: (json: string) =>
      wasmPkg.umbra_wasm_get_file_manifest(json),

    // ── File Transfer Control (real WASM) ────────────────────────────
    umbra_wasm_transfer_initiate: (json: string) =>
      wasmPkg.umbra_wasm_transfer_initiate(json),
    umbra_wasm_transfer_accept: (json: string) =>
      wasmPkg.umbra_wasm_transfer_accept(json),
    umbra_wasm_transfer_pause: (transfer_id: string) =>
      wasmPkg.umbra_wasm_transfer_pause(transfer_id),
    umbra_wasm_transfer_resume: (transfer_id: string) =>
      wasmPkg.umbra_wasm_transfer_resume(transfer_id),
    umbra_wasm_transfer_cancel: (json: string) =>
      wasmPkg.umbra_wasm_transfer_cancel(json),
    umbra_wasm_transfer_on_message: (json: string) =>
      wasmPkg.umbra_wasm_transfer_on_message(json),
    umbra_wasm_transfer_list: () =>
      wasmPkg.umbra_wasm_transfer_list(),
    umbra_wasm_transfer_get: (transfer_id: string) =>
      wasmPkg.umbra_wasm_transfer_get(transfer_id),
    umbra_wasm_transfer_get_incomplete: () =>
      wasmPkg.umbra_wasm_transfer_get_incomplete(),
    umbra_wasm_transfer_chunks_to_send: (transfer_id: string) =>
      wasmPkg.umbra_wasm_transfer_chunks_to_send(transfer_id),
    umbra_wasm_transfer_mark_chunk_sent: (json: string) =>
      wasmPkg.umbra_wasm_transfer_mark_chunk_sent(json),

    // ── Plugin KV Storage (JS stub — persists via localStorage) ──────
    umbra_wasm_plugin_kv_get: (pluginId: string, key: string): string => {
      try {
        const storeKey = `plugin_kv:${pluginId}:${key}`;
        const value = localStorage.getItem(storeKey);
        return JSON.stringify(value !== null ? { value } : { value: null });
      } catch { return JSON.stringify({ value: null }); }
    },
    umbra_wasm_plugin_kv_set: (pluginId: string, key: string, value: string): string => {
      try {
        const storeKey = `plugin_kv:${pluginId}:${key}`;
        localStorage.setItem(storeKey, value);
        return JSON.stringify({ ok: true });
      } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
    umbra_wasm_plugin_kv_delete: (pluginId: string, key: string): string => {
      try {
        const storeKey = `plugin_kv:${pluginId}:${key}`;
        localStorage.removeItem(storeKey);
        return JSON.stringify({ ok: true });
      } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
    umbra_wasm_plugin_kv_list: (pluginId: string, prefix: string): string => {
      try {
        const storePrefix = `plugin_kv:${pluginId}:${prefix}`;
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(storePrefix)) {
            keys.push(k.replace(`plugin_kv:${pluginId}:`, ''));
          }
        }
        return JSON.stringify({ keys });
      } catch { return JSON.stringify({ keys: [] }); }
    },

    // ── Plugin Bundle Storage (JS stub — persists via localStorage) ──
    umbra_wasm_plugin_bundle_save: (pluginId: string, manifest: string, bundle: string): string => {
      try {
        const entry = {
          plugin_id: pluginId,
          manifest,
          bundle,
          installed_at: new Date().toISOString(),
        };
        localStorage.setItem(`plugin_bundle:${pluginId}`, JSON.stringify(entry));
        // Also update the bundle index
        const indexKey = 'plugin_bundle_index';
        const index: string[] = JSON.parse(localStorage.getItem(indexKey) ?? '[]');
        if (!index.includes(pluginId)) {
          index.push(pluginId);
          localStorage.setItem(indexKey, JSON.stringify(index));
        }
        return JSON.stringify({ ok: true });
      } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
    umbra_wasm_plugin_bundle_load: (pluginId: string): string => {
      try {
        const raw = localStorage.getItem(`plugin_bundle:${pluginId}`);
        if (!raw) return JSON.stringify({ error: 'not_found' });
        return raw;
      } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
    umbra_wasm_plugin_bundle_delete: (pluginId: string): string => {
      try {
        localStorage.removeItem(`plugin_bundle:${pluginId}`);
        // Update index
        const indexKey = 'plugin_bundle_index';
        const index: string[] = JSON.parse(localStorage.getItem(indexKey) ?? '[]');
        localStorage.setItem(indexKey, JSON.stringify(index.filter(id => id !== pluginId)));
        // Clean up KV entries for this plugin
        const kvPrefix = `plugin_kv:${pluginId}:`;
        const toRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(kvPrefix)) toRemove.push(k);
        }
        for (const k of toRemove) localStorage.removeItem(k);
        return JSON.stringify({ ok: true });
      } catch (e: any) { return JSON.stringify({ error: e.message }); }
    },
    umbra_wasm_plugin_bundle_list: (): string => {
      try {
        const indexKey = 'plugin_bundle_index';
        const index: string[] = JSON.parse(localStorage.getItem(indexKey) ?? '[]');
        const plugins = index.map(id => {
          const raw = localStorage.getItem(`plugin_bundle:${id}`);
          if (!raw) return null;
          try { return JSON.parse(raw); } catch { return null; }
        }).filter(Boolean);
        return JSON.stringify({ plugins });
      } catch { return JSON.stringify({ plugins: [] }); }
    },
  };
}
