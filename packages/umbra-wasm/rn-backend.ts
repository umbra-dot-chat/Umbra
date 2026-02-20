/**
 * React Native Backend Adapter
 *
 * Implements the UmbraWasmModule interface for React Native (iOS/Android).
 *
 * ## Architecture
 *
 * This adapter mirrors the Tauri backend pattern but routes calls to the
 * Expo Module (`expo-umbra-core`) which wraps the native Rust FFI.
 *
 * When the native module is linked (after compiling Rust with
 * `scripts/build-mobile.sh`), all operations go through native Rust.
 * Otherwise, stub implementations let the app boot for UI development.
 *
 * ## Phases
 *
 * 1. **Stub** — App boots, auth screen renders, operations throw
 * 2. **Native** — Expo Module calls native Rust via C FFI (identity, crypto, etc.)
 */

import type { UmbraWasmModule } from './loader';

// ─────────────────────────────────────────────────────────────────────────
// Native module interface (provided by expo-umbra-core)
// ─────────────────────────────────────────────────────────────────────────

import type { NativeUmbraCore } from '../../modules/expo-umbra-core/src';

/**
 * Try to load the native Expo module.
 * Returns null if not yet compiled and linked.
 */
function getNativeModule(): NativeUmbraCore | null {
  try {
    // Dynamic require to avoid hard crash if module isn't linked
    const { getExpoUmbraCore } = require('../../modules/expo-umbra-core/src');
    return getExpoUmbraCore();
  } catch {
    console.log('[rn-backend] expo-umbra-core not available — using stub backend');
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function notImplemented(method: string): never {
  throw new Error(
    `[rn-backend] ${method}() is not yet available on React Native. ` +
    `The native Rust backend (expo-umbra-core) needs to be built and linked.`
  );
}

function ensureJsonString(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

// ─────────────────────────────────────────────────────────────────────────
// Backend factory
// ─────────────────────────────────────────────────────────────────────────

/**
 * Create a React Native backend that implements UmbraWasmModule.
 *
 * If the native Expo Module is available, delegates to it.
 * Otherwise, provides stubs that let the app boot but throw
 * descriptive errors when operations are attempted.
 */
export function createReactNativeBackend(): UmbraWasmModule {
  const native = getNativeModule();

  // If native module is available, use it
  if (native) {
    return createNativeBackend(native);
  }

  // Otherwise, return stubs
  return createStubBackend();
}

// ─────────────────────────────────────────────────────────────────────────
// Stub backend — lets the app boot without native module
// ─────────────────────────────────────────────────────────────────────────

function createStubBackend(): UmbraWasmModule {
  return {
    // ── Initialization (no-ops so the app boots) ──────────────────────
    umbra_wasm_init: () => {
      console.log('[rn-backend] Init (stub — native module not yet linked)');
    },

    umbra_wasm_init_database: async () => {
      console.log('[rn-backend] Database init (stub — no persistence)');
      return true;
    },

    umbra_wasm_version: () => '0.1.0 (react-native-stub)',

    // ── Identity ──────────────────────────────────────────────────────
    umbra_wasm_identity_create: () => notImplemented('identity_create'),
    umbra_wasm_identity_restore: () => notImplemented('identity_restore'),
    umbra_wasm_identity_set: (_json: string) => {
      console.debug('[rn-backend] identity_set called (no-op stub)');
    },
    umbra_wasm_identity_get_did: () => notImplemented('identity_get_did'),
    umbra_wasm_identity_get_profile: () => notImplemented('identity_get_profile'),
    umbra_wasm_identity_update_profile: () => notImplemented('identity_update_profile'),

    // ── Discovery ────────────────────────────────────────────────────
    umbra_wasm_discovery_get_connection_info: () => notImplemented('discovery_get_connection_info'),
    umbra_wasm_discovery_parse_connection_info: () => notImplemented('discovery_parse_connection_info'),

    // ── Friends ──────────────────────────────────────────────────────
    umbra_wasm_friends_send_request: () => notImplemented('friends_send_request'),
    umbra_wasm_friends_accept_request: () => notImplemented('friends_accept_request'),
    umbra_wasm_friends_reject_request: () => notImplemented('friends_reject_request'),
    umbra_wasm_friends_list: () => notImplemented('friends_list'),
    umbra_wasm_friends_pending_requests: () => notImplemented('friends_pending_requests'),
    umbra_wasm_friends_remove: () => notImplemented('friends_remove'),
    umbra_wasm_friends_block: () => notImplemented('friends_block'),
    umbra_wasm_friends_unblock: () => notImplemented('friends_unblock'),
    umbra_wasm_friends_store_incoming: () => notImplemented('friends_store_incoming'),
    umbra_wasm_friends_accept_from_relay: () => notImplemented('friends_accept_from_relay'),
    umbra_wasm_friends_build_accept_ack: () => notImplemented('friends_build_accept_ack'),

    // ── Messaging (core) ─────────────────────────────────────────────
    umbra_wasm_messaging_get_conversations: () => notImplemented('messaging_get_conversations'),
    umbra_wasm_messaging_create_dm_conversation: () => notImplemented('messaging_create_dm_conversation'),
    umbra_wasm_messaging_get_messages: () => notImplemented('messaging_get_messages'),
    umbra_wasm_messaging_send: () => notImplemented('messaging_send'),
    umbra_wasm_messaging_mark_read: () => notImplemented('messaging_mark_read'),
    umbra_wasm_messaging_decrypt: () => notImplemented('messaging_decrypt'),
    umbra_wasm_messaging_store_incoming: () => notImplemented('messaging_store_incoming'),
    umbra_wasm_messaging_build_typing_envelope: () => notImplemented('messaging_build_typing_envelope'),
    umbra_wasm_messaging_build_receipt_envelope: () => notImplemented('messaging_build_receipt_envelope'),

    // ── Messaging (extended) ─────────────────────────────────────────
    umbra_wasm_messaging_edit: () => notImplemented('messaging_edit'),
    umbra_wasm_messaging_delete: () => notImplemented('messaging_delete'),
    umbra_wasm_messaging_pin: () => notImplemented('messaging_pin'),
    umbra_wasm_messaging_unpin: () => notImplemented('messaging_unpin'),
    umbra_wasm_messaging_add_reaction: () => notImplemented('messaging_add_reaction'),
    umbra_wasm_messaging_remove_reaction: () => notImplemented('messaging_remove_reaction'),
    umbra_wasm_messaging_forward: () => notImplemented('messaging_forward'),
    umbra_wasm_messaging_get_thread: () => notImplemented('messaging_get_thread'),
    umbra_wasm_messaging_reply_thread: () => notImplemented('messaging_reply_thread'),
    umbra_wasm_messaging_get_pinned: () => notImplemented('messaging_get_pinned'),

    // ── Groups ───────────────────────────────────────────────────────
    umbra_wasm_groups_create: () => notImplemented('groups_create'),
    umbra_wasm_groups_get: () => notImplemented('groups_get'),
    umbra_wasm_groups_list: () => notImplemented('groups_list'),
    umbra_wasm_groups_update: () => notImplemented('groups_update'),
    umbra_wasm_groups_delete: () => notImplemented('groups_delete'),
    umbra_wasm_groups_add_member: () => notImplemented('groups_add_member'),
    umbra_wasm_groups_remove_member: () => notImplemented('groups_remove_member'),
    umbra_wasm_groups_get_members: () => notImplemented('groups_get_members'),
    umbra_wasm_groups_generate_key: () => notImplemented('groups_generate_key'),
    umbra_wasm_groups_rotate_key: () => notImplemented('groups_rotate_key'),
    umbra_wasm_groups_import_key: () => notImplemented('groups_import_key'),
    umbra_wasm_groups_encrypt_message: () => notImplemented('groups_encrypt_message'),
    umbra_wasm_groups_decrypt_message: () => notImplemented('groups_decrypt_message'),
    umbra_wasm_groups_encrypt_key_for_member: () => notImplemented('groups_encrypt_key_for_member'),
    umbra_wasm_groups_store_invite: () => notImplemented('groups_store_invite'),
    umbra_wasm_groups_get_pending_invites: () => notImplemented('groups_get_pending_invites'),
    umbra_wasm_groups_accept_invite: () => notImplemented('groups_accept_invite'),
    umbra_wasm_groups_decline_invite: () => notImplemented('groups_decline_invite'),

    // ── Messaging — Delivery status ──────────────────────────────────
    umbra_wasm_messaging_update_status: () => notImplemented('messaging_update_status'),

    // ── Network ──────────────────────────────────────────────────────
    umbra_wasm_network_status: () => JSON.stringify({ connected: false, peers: 0 }),
    umbra_wasm_network_start: async () => false,
    umbra_wasm_network_stop: async () => true,
    umbra_wasm_network_create_offer: () => notImplemented('network_create_offer'),
    umbra_wasm_network_accept_offer: () => notImplemented('network_accept_offer'),
    umbra_wasm_network_complete_handshake: () => notImplemented('network_complete_handshake'),
    umbra_wasm_network_complete_answerer: () => notImplemented('network_complete_answerer'),

    // ── Relay ────────────────────────────────────────────────────────
    umbra_wasm_relay_connect: () => notImplemented('relay_connect'),
    umbra_wasm_relay_disconnect: async () => {},
    umbra_wasm_relay_create_session: () => notImplemented('relay_create_session'),
    umbra_wasm_relay_accept_session: () => notImplemented('relay_accept_session'),
    umbra_wasm_relay_send: () => notImplemented('relay_send'),
    umbra_wasm_relay_fetch_offline: async () => JSON.stringify([]),

    // ── Events ───────────────────────────────────────────────────────
    umbra_wasm_subscribe_events: (callback: (event_json: string) => void) => {
      console.log('[rn-backend] Event subscription registered (stub)');
      // When native module is linked, forward native events to this callback
    },

    // ── Calls ────────────────────────────────────────────────────────
    umbra_wasm_calls_store: () => notImplemented('calls_store'),
    umbra_wasm_calls_end: () => notImplemented('calls_end'),
    umbra_wasm_calls_get_history: () => JSON.stringify([]),
    umbra_wasm_calls_get_all_history: () => JSON.stringify([]),

    // ── Crypto ───────────────────────────────────────────────────────
    umbra_wasm_crypto_sign: () => notImplemented('crypto_sign'),
    umbra_wasm_crypto_verify: () => notImplemented('crypto_verify'),
    umbra_wasm_crypto_encrypt_for_peer: () => notImplemented('crypto_encrypt_for_peer'),
    umbra_wasm_crypto_decrypt_from_peer: () => notImplemented('crypto_decrypt_from_peer'),

    // ── File Encryption ──────────────────────────────────────────────
    umbra_wasm_file_derive_key: () => notImplemented('file_derive_key'),
    umbra_wasm_file_encrypt_chunk: () => notImplemented('file_encrypt_chunk'),
    umbra_wasm_file_decrypt_chunk: () => notImplemented('file_decrypt_chunk'),
    umbra_wasm_channel_file_derive_key: () => notImplemented('channel_file_derive_key'),
    umbra_wasm_compute_key_fingerprint: () => notImplemented('compute_key_fingerprint'),
    umbra_wasm_verify_key_fingerprint: () => notImplemented('verify_key_fingerprint'),
    umbra_wasm_mark_files_for_reencryption: () => notImplemented('mark_files_for_reencryption'),
    umbra_wasm_get_files_needing_reencryption: () => notImplemented('get_files_needing_reencryption'),
    umbra_wasm_clear_reencryption_flag: () => notImplemented('clear_reencryption_flag'),

    // ── Community — Core ─────────────────────────────────────────────
    umbra_wasm_community_create: () => notImplemented('community_create'),
    umbra_wasm_community_get: () => notImplemented('community_get'),
    umbra_wasm_community_get_mine: () => notImplemented('community_get_mine'),
    umbra_wasm_community_update: () => notImplemented('community_update'),
    umbra_wasm_community_delete: () => notImplemented('community_delete'),
    umbra_wasm_community_transfer_ownership: () => notImplemented('community_transfer_ownership'),
    umbra_wasm_community_update_branding: () => notImplemented('community_update_branding'),

    // ── Community — Spaces ───────────────────────────────────────────
    umbra_wasm_community_space_create: () => notImplemented('community_space_create'),
    umbra_wasm_community_space_list: () => notImplemented('community_space_list'),
    umbra_wasm_community_space_update: () => notImplemented('community_space_update'),
    umbra_wasm_community_space_reorder: () => notImplemented('community_space_reorder'),
    umbra_wasm_community_space_delete: () => notImplemented('community_space_delete'),

    // ── Community — Categories ───────────────────────────────────────
    umbra_wasm_community_category_create: () => notImplemented('community_category_create'),
    umbra_wasm_community_category_list: () => notImplemented('community_category_list'),
    umbra_wasm_community_category_list_all: () => notImplemented('community_category_list_all'),
    umbra_wasm_community_category_update: () => notImplemented('community_category_update'),
    umbra_wasm_community_category_reorder: () => notImplemented('community_category_reorder'),
    umbra_wasm_community_category_delete: () => notImplemented('community_category_delete'),
    umbra_wasm_community_channel_move_category: () => notImplemented('community_channel_move_category'),

    // ── Community — Channels ─────────────────────────────────────────
    umbra_wasm_community_channel_create: () => notImplemented('community_channel_create'),
    umbra_wasm_community_channel_list: () => notImplemented('community_channel_list'),
    umbra_wasm_community_channel_list_all: () => notImplemented('community_channel_list_all'),
    umbra_wasm_community_channel_get: () => notImplemented('community_channel_get'),
    umbra_wasm_community_channel_update: () => notImplemented('community_channel_update'),
    umbra_wasm_community_channel_set_slow_mode: () => notImplemented('community_channel_set_slow_mode'),
    umbra_wasm_community_channel_set_e2ee: () => notImplemented('community_channel_set_e2ee'),
    umbra_wasm_community_channel_delete: () => notImplemented('community_channel_delete'),
    umbra_wasm_community_channel_reorder: () => notImplemented('community_channel_reorder'),

    // ── Community — Members ──────────────────────────────────────────
    umbra_wasm_community_join: () => notImplemented('community_join'),
    umbra_wasm_community_leave: () => notImplemented('community_leave'),
    umbra_wasm_community_kick: () => notImplemented('community_kick'),
    umbra_wasm_community_ban: () => notImplemented('community_ban'),
    umbra_wasm_community_unban: () => notImplemented('community_unban'),
    umbra_wasm_community_member_list: () => notImplemented('community_member_list'),
    umbra_wasm_community_member_get: () => notImplemented('community_member_get'),
    umbra_wasm_community_member_update_profile: () => notImplemented('community_member_update_profile'),
    umbra_wasm_community_ban_list: () => notImplemented('community_ban_list'),

    // ── Community — Roles ────────────────────────────────────────────
    umbra_wasm_community_role_list: () => notImplemented('community_role_list'),
    umbra_wasm_community_member_roles: () => notImplemented('community_member_roles'),
    umbra_wasm_community_role_assign: () => notImplemented('community_role_assign'),
    umbra_wasm_community_role_unassign: () => notImplemented('community_role_unassign'),
    umbra_wasm_community_custom_role_create: () => notImplemented('community_custom_role_create'),
    umbra_wasm_community_role_update: () => notImplemented('community_role_update'),
    umbra_wasm_community_role_update_permissions: () => notImplemented('community_role_update_permissions'),
    umbra_wasm_community_role_delete: () => notImplemented('community_role_delete'),

    // ── Community — Invites ──────────────────────────────────────────
    umbra_wasm_community_invite_create: () => notImplemented('community_invite_create'),
    umbra_wasm_community_invite_use: () => notImplemented('community_invite_use'),
    umbra_wasm_community_invite_list: () => notImplemented('community_invite_list'),
    umbra_wasm_community_invite_delete: () => notImplemented('community_invite_delete'),
    umbra_wasm_community_invite_set_vanity: () => notImplemented('community_invite_set_vanity'),

    // ── Community — Messages ─────────────────────────────────────────
    umbra_wasm_community_message_send: () => notImplemented('community_message_send'),
    umbra_wasm_community_message_store_received: () => notImplemented('community_message_store_received'),
    umbra_wasm_community_message_list: () => notImplemented('community_message_list'),
    umbra_wasm_community_message_get: () => notImplemented('community_message_get'),
    umbra_wasm_community_message_edit: () => notImplemented('community_message_edit'),
    umbra_wasm_community_message_delete: () => notImplemented('community_message_delete'),

    // ── Community — Reactions ────────────────────────────────────────
    umbra_wasm_community_reaction_add: () => notImplemented('community_reaction_add'),
    umbra_wasm_community_reaction_remove: () => notImplemented('community_reaction_remove'),
    umbra_wasm_community_reaction_list: () => notImplemented('community_reaction_list'),

    // ── Community — Emoji ────────────────────────────────────────────
    umbra_wasm_community_emoji_create: () => notImplemented('community_emoji_create'),
    umbra_wasm_community_emoji_list: () => notImplemented('community_emoji_list'),
    umbra_wasm_community_emoji_delete: () => notImplemented('community_emoji_delete'),
    umbra_wasm_community_emoji_rename: () => notImplemented('community_emoji_rename'),

    // ── Community — Stickers ─────────────────────────────────────────
    umbra_wasm_community_sticker_create: () => notImplemented('community_sticker_create'),
    umbra_wasm_community_sticker_list: () => notImplemented('community_sticker_list'),
    umbra_wasm_community_sticker_delete: () => notImplemented('community_sticker_delete'),

    // ── Community — Sticker Packs ────────────────────────────────────
    umbra_wasm_community_sticker_pack_create: () => notImplemented('community_sticker_pack_create'),
    umbra_wasm_community_sticker_pack_list: () => notImplemented('community_sticker_pack_list'),
    umbra_wasm_community_sticker_pack_delete: () => notImplemented('community_sticker_pack_delete'),
    umbra_wasm_community_sticker_pack_rename: () => notImplemented('community_sticker_pack_rename'),

    // ── Community — Pins ─────────────────────────────────────────────
    umbra_wasm_community_pin_message: () => notImplemented('community_pin_message'),
    umbra_wasm_community_unpin_message: () => notImplemented('community_unpin_message'),
    umbra_wasm_community_pin_list: () => notImplemented('community_pin_list'),

    // ── Community — Threads ──────────────────────────────────────────
    umbra_wasm_community_thread_create: () => notImplemented('community_thread_create'),
    umbra_wasm_community_thread_get: () => notImplemented('community_thread_get'),
    umbra_wasm_community_thread_list: () => notImplemented('community_thread_list'),
    umbra_wasm_community_thread_messages: () => notImplemented('community_thread_messages'),

    // ── Community — Read Receipts ────────────────────────────────────
    umbra_wasm_community_mark_read: () => notImplemented('community_mark_read'),

    // ── Community — Files ────────────────────────────────────────────
    umbra_wasm_community_upload_file: () => notImplemented('community_upload_file'),
    umbra_wasm_community_get_files: () => notImplemented('community_get_files'),
    umbra_wasm_community_get_file: () => notImplemented('community_get_file'),
    umbra_wasm_community_delete_file: () => notImplemented('community_delete_file'),
    umbra_wasm_community_record_file_download: () => notImplemented('community_record_file_download'),
    umbra_wasm_community_create_folder: () => notImplemented('community_create_folder'),
    umbra_wasm_community_get_folders: () => notImplemented('community_get_folders'),
    umbra_wasm_community_delete_folder: () => notImplemented('community_delete_folder'),

    // ── DM — Files ───────────────────────────────────────────────────
    umbra_wasm_dm_upload_file: () => notImplemented('dm_upload_file'),
    umbra_wasm_dm_get_files: () => notImplemented('dm_get_files'),
    umbra_wasm_dm_get_file: () => notImplemented('dm_get_file'),
    umbra_wasm_dm_delete_file: () => notImplemented('dm_delete_file'),
    umbra_wasm_dm_record_file_download: () => notImplemented('dm_record_file_download'),
    umbra_wasm_dm_move_file: () => notImplemented('dm_move_file'),
    umbra_wasm_dm_create_folder: () => notImplemented('dm_create_folder'),
    umbra_wasm_dm_get_folders: () => notImplemented('dm_get_folders'),
    umbra_wasm_dm_delete_folder: () => notImplemented('dm_delete_folder'),
    umbra_wasm_dm_rename_folder: () => notImplemented('dm_rename_folder'),

    // ── Groups — Relay envelope builders ─────────────────────────────
    umbra_wasm_groups_send_invite: () => notImplemented('groups_send_invite'),
    umbra_wasm_groups_build_invite_accept_envelope: () => notImplemented('groups_build_invite_accept_envelope'),
    umbra_wasm_groups_build_invite_decline_envelope: () => notImplemented('groups_build_invite_decline_envelope'),
    umbra_wasm_groups_send_message: () => notImplemented('groups_send_message'),
    umbra_wasm_groups_remove_member_with_rotation: () => notImplemented('groups_remove_member_with_rotation'),

    // ── Relay envelope builders ──────────────────────────────────────
    umbra_wasm_community_build_event_relay_batch: () => notImplemented('community_build_event_relay_batch'),
    umbra_wasm_build_dm_file_event_envelope: () => notImplemented('build_dm_file_event_envelope'),
    umbra_wasm_build_metadata_envelope: () => notImplemented('build_metadata_envelope'),

    // ── File Chunking ────────────────────────────────────────────────
    umbra_wasm_chunk_file: () => notImplemented('chunk_file'),
    umbra_wasm_reassemble_file: () => notImplemented('reassemble_file'),
    umbra_wasm_get_file_manifest: () => notImplemented('get_file_manifest'),

    // ── File Transfer Control ────────────────────────────────────────
    umbra_wasm_transfer_initiate: () => notImplemented('transfer_initiate'),
    umbra_wasm_transfer_accept: () => notImplemented('transfer_accept'),
    umbra_wasm_transfer_pause: () => notImplemented('transfer_pause'),
    umbra_wasm_transfer_resume: () => notImplemented('transfer_resume'),
    umbra_wasm_transfer_cancel: () => notImplemented('transfer_cancel'),
    umbra_wasm_transfer_on_message: () => notImplemented('transfer_on_message'),
    umbra_wasm_transfer_list: () => JSON.stringify([]),
    umbra_wasm_transfer_get: () => notImplemented('transfer_get'),
    umbra_wasm_transfer_get_incomplete: () => JSON.stringify([]),
    umbra_wasm_transfer_chunks_to_send: () => notImplemented('transfer_chunks_to_send'),
    umbra_wasm_transfer_mark_chunk_sent: () => notImplemented('transfer_mark_chunk_sent'),

    // ── DHT ──────────────────────────────────────────────────────────
    umbra_wasm_dht_start_providing: () => notImplemented('dht_start_providing'),
    umbra_wasm_dht_get_providers: () => notImplemented('dht_get_providers'),
    umbra_wasm_dht_stop_providing: () => notImplemented('dht_stop_providing'),

    // ── Plugin Storage ───────────────────────────────────────────────
    umbra_wasm_plugin_kv_get: () => JSON.stringify({ value: null }),
    umbra_wasm_plugin_kv_set: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_kv_delete: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_kv_list: () => JSON.stringify({ keys: [] }),
    umbra_wasm_plugin_bundle_save: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_bundle_load: () => JSON.stringify({ error: 'not_found' }),
    umbra_wasm_plugin_bundle_delete: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_bundle_list: () => JSON.stringify({ plugins: [] }),

    // ── Community Seats ──────────────────────────────────────────────
    umbra_wasm_community_seat_list: () => notImplemented('community_seat_list'),
    umbra_wasm_community_seat_list_unclaimed: () => notImplemented('community_seat_list_unclaimed'),
    umbra_wasm_community_seat_find_match: () => notImplemented('community_seat_find_match'),
    umbra_wasm_community_seat_claim: () => notImplemented('community_seat_claim'),
    umbra_wasm_community_seat_delete: () => notImplemented('community_seat_delete'),
    umbra_wasm_community_seat_create_batch: () => notImplemented('community_seat_create_batch'),
    umbra_wasm_community_seat_count: () => notImplemented('community_seat_count'),

    // ── Community Audit Log ──────────────────────────────────────────
    umbra_wasm_community_audit_log_create_batch: () => notImplemented('community_audit_log_create_batch'),
    umbra_wasm_community_audit_log_list: () => notImplemented('community_audit_log_list'),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Native backend — delegates to Expo Module (expo-umbra-core)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Create a backend that delegates to the native Expo module.
 *
 * The native module exposes the 23 C FFI functions from Rust. Methods
 * that don't have a native FFI equivalent yet fall through to stubs.
 * As the C FFI is expanded (Phase 3), more methods will be wired up.
 */
function createNativeBackend(native: NativeUmbraCore): UmbraWasmModule {
  // Start with the stub backend, then override methods that have native support
  const stub = createStubBackend();

  return {
    ...stub,

    // ── Initialization ──────────────────────────────────────────────────
    umbra_wasm_init: () => {
      console.log('[rn-backend] Initializing native Rust backend...');
      native.init(getDocumentsPath());
    },

    umbra_wasm_init_database: async () => {
      // The native Rust backend initializes its own SQLite database
      // via rusqlite during init(). No separate step needed.
      return true;
    },

    umbra_wasm_version: () => {
      try {
        return native.version();
      } catch {
        return '0.1.0 (react-native)';
      }
    },

    // ── Identity ────────────────────────────────────────────────────────
    umbra_wasm_identity_create: (display_name: string) => {
      return ensureJsonString(native.identityCreate(display_name));
    },

    umbra_wasm_identity_restore: (recovery_phrase: string, display_name: string) => {
      return ensureJsonString(native.identityRestore(recovery_phrase, display_name));
    },

    umbra_wasm_identity_set: (_json: string) => {
      // identity_set is used to restore identity state without re-deriving keys.
      // On native, we use identityRestore instead. This is a compatibility no-op.
      console.debug('[rn-backend] identity_set called — no-op on native');
    },

    umbra_wasm_identity_get_did: () => {
      return native.identityGetDid();
    },

    umbra_wasm_identity_get_profile: () => {
      return ensureJsonString(native.identityGetProfile());
    },

    umbra_wasm_identity_update_profile: (json: string) => {
      return ensureJsonString(native.identityUpdateProfile(json));
    },

    // ── Network ─────────────────────────────────────────────────────────
    umbra_wasm_network_status: () => {
      try {
        return ensureJsonString(native.networkStatus());
      } catch {
        return JSON.stringify({ connected: false, peers: 0 });
      }
    },

    umbra_wasm_network_start: async () => {
      try {
        await native.networkStart(null);
        return true;
      } catch (e) {
        console.warn('[rn-backend] network_start failed:', e);
        return false;
      }
    },

    umbra_wasm_network_stop: async () => {
      try {
        await native.networkStop();
        return true;
      } catch (e) {
        console.warn('[rn-backend] network_stop failed:', e);
        return false;
      }
    },

    // ── Discovery ───────────────────────────────────────────────────────
    umbra_wasm_discovery_get_connection_info: () => {
      return ensureJsonString(native.discoveryGetConnectionInfo());
    },

    umbra_wasm_discovery_parse_connection_info: (info: string) => {
      // The native FFI uses discoveryConnectWithInfo which both parses AND connects.
      // For just parsing, we'd need a separate FFI function. For now, return the info.
      return info;
    },

    // ── Friends ─────────────────────────────────────────────────────────
    umbra_wasm_friends_send_request: (did: string, message?: string) => {
      return ensureJsonString(native.friendsSendRequest(did, message ?? null));
    },

    umbra_wasm_friends_accept_request: (request_id: string) => {
      return ensureJsonString(native.friendsAcceptRequest(request_id));
    },

    umbra_wasm_friends_reject_request: (request_id: string) => {
      return ensureJsonString(native.friendsRejectRequest(request_id));
    },

    umbra_wasm_friends_list: () => {
      return ensureJsonString(native.friendsList());
    },

    umbra_wasm_friends_pending_requests: () => {
      return ensureJsonString(native.friendsPendingRequests());
    },

    // ── Messaging ───────────────────────────────────────────────────────
    umbra_wasm_messaging_get_conversations: () => {
      return ensureJsonString(native.messagingGetConversations());
    },

    umbra_wasm_messaging_send: async (recipient_did: string, text: string) => {
      return ensureJsonString(await native.messagingSendText(recipient_did, text));
    },

    umbra_wasm_messaging_get_messages: (conversation_id: string, limit?: number, before_id?: string) => {
      return ensureJsonString(
        native.messagingGetMessages(conversation_id, limit ?? 50, before_id ?? null)
      );
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Get the app's documents directory for Rust storage.
 * On React Native, we use the default which lets the native side determine it.
 */
function getDocumentsPath(): string {
  // The Expo module's init() function determines the correct storage path
  // if we pass an empty/default value. This is handled natively.
  return '';
}
