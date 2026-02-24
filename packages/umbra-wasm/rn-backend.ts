/**
 * React Native Backend Adapter
 *
 * Implements the UmbraWasmModule interface for React Native (iOS/Android).
 *
 * ## Architecture
 *
 * Routes calls through the Expo Module (`expo-umbra-core`) which wraps
 * the native Rust FFI. Core methods (identity, network) use direct
 * native bindings. Everything else routes through `native.call(method, args)`
 * which hits the Rust dispatcher (`umbra_call` → `dispatcher.rs`).
 *
 * When the native module is not linked, falls back to stubs that let
 * the app boot for UI development.
 */

import type { UmbraWasmModule } from './loader';
import type { NativeUmbraCore } from '../../modules/expo-umbra-core/src';

// ─────────────────────────────────────────────────────────────────────────
// Native module loader
// ─────────────────────────────────────────────────────────────────────────

function getNativeModule(): NativeUmbraCore | null {
  try {
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

/**
 * Check a native result string for error-as-JSON responses.
 *
 * Since we changed processResult() in Swift to return JSON error objects
 * instead of throwing NSError (which caused Hermes heap corruption via
 * NSException → TurboModule bridge race), we now need to detect these
 * error responses on the JS side and throw proper JS errors.
 *
 * Error format: {"error": true, "error_code": N, "error_message": "..."}
 */
function checkNativeResult(result: string, context?: string): string {
  // Fast path: most successful responses don't start with {"error"
  if (!result || typeof result !== 'string') return result ?? '';
  if (!result.startsWith('{"error')) return result;

  try {
    const parsed = JSON.parse(result);
    if (parsed && parsed.error === true) {
      const code = parsed.error_code ?? 0;
      const message = parsed.error_message ?? 'Unknown native error';
      const err = new Error(`[native${context ? `:${context}` : ''}] ${message}`);
      (err as any).code = code;
      (err as any).nativeErrorCode = code;
      throw err;
    }
  } catch (e) {
    // If it's already our error, re-throw
    if (e instanceof Error && (e as any).nativeErrorCode !== undefined) throw e;
    // Otherwise it's not valid JSON or not an error object — return as-is
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────
// Backend factory
// ─────────────────────────────────────────────────────────────────────────

export function createReactNativeBackend(): UmbraWasmModule {
  const native = getNativeModule();

  if (native) {
    console.log('[rn-backend] Native Expo module detected — using native Rust backend');
    return createNativeBackend(native);
  }

  console.log('[rn-backend] No native module — using stub backend');
  return createStubBackend();
}

// ─────────────────────────────────────────────────────────────────────────
// Native backend — routes all methods through Rust FFI
// ─────────────────────────────────────────────────────────────────────────

function createNativeBackend(native: NativeUmbraCore): UmbraWasmModule {
  /**
   * Route a method through the generic Rust dispatcher.
   * `native.call(method, args)` → Swift `umbra_call` → Rust `dispatch()`.
   *
   * native.call() is an AsyncFunction (returns a Promise) because Swift
   * Expo Modules use `AsyncFunction`. We must await the result before
   * checking for error-as-JSON responses.
   *
   * Returns `any` to satisfy UmbraWasmModule interface which expects
   * synchronous strings — downstream parseWasm() handles both strings
   * and promises via `await`.
   */
  const call = (method: string, args: Record<string, any> = {}): any => {
    return native.call(method, JSON.stringify(args)).then(
      (result: string) => checkNativeResult(result, method)
    );
  };

  return {
    // ── Initialization ──────────────────────────────────────────────────
    umbra_wasm_init: () => {
      try {
        // Pass empty string to use the platform-default storage path.
        // Note: "init" is reserved in Swift, so the native function is
        // named "initialize" to avoid Expo Modules type coercion issues.
        const result = native.initialize('');
        // processResult() now returns error-as-JSON instead of throwing
        checkNativeResult(result, 'init');
        console.log('[rn-backend] Native Rust backend initialized');
      } catch (e: any) {
        // Rust returns error code 101 if already initialized — that's fine,
        // it means a previous HMR cycle or double-mount already ran init.
        const msg = e?.message ?? String(e);
        if (msg.includes('Already initialized') || msg.includes('101')) {
          console.log('[rn-backend] Native backend already initialized (OK)');
        } else {
          console.error('[rn-backend] Native init failed:', e);
        }
      }
    },

    umbra_wasm_init_database: async () => {
      try {
        const result = native.initDatabase();
        checkNativeResult(result, 'initDatabase');
        console.log('[rn-backend] Database initialized');
        return true;
      } catch (e: any) {
        console.error('[rn-backend] Database init failed:', e);
        return false;
      }
    },

    umbra_wasm_version: () => {
      try { return native.version(); } catch { return '0.1.0 (react-native)'; }
    },

    // ── Identity (direct native calls) ──────────────────────────────────
    umbra_wasm_identity_create: (display_name: string) =>
      checkNativeResult(ensureJsonString(native.identityCreate(display_name)), 'identityCreate'),

    umbra_wasm_identity_restore: (recovery_phrase: string, display_name: string) =>
      checkNativeResult(ensureJsonString(native.identityRestore(recovery_phrase, display_name)), 'identityRestore'),

    umbra_wasm_identity_set: (_json: string) => {
      console.debug('[rn-backend] identity_set — no-op on native');
    },

    umbra_wasm_identity_get_did: () => checkNativeResult(native.identityGetDid(), 'identityGetDid'),
    umbra_wasm_identity_get_profile: () => checkNativeResult(ensureJsonString(native.identityGetProfile()), 'identityGetProfile'),
    umbra_wasm_identity_update_profile: (json: string) => checkNativeResult(ensureJsonString(native.identityUpdateProfile(json)), 'identityUpdateProfile'),

    // ── Discovery (direct native calls) ─────────────────────────────────
    umbra_wasm_discovery_get_connection_info: () => checkNativeResult(ensureJsonString(native.discoveryGetConnectionInfo()), 'discoveryGetConnectionInfo'),
    umbra_wasm_discovery_parse_connection_info: (info: string) => info,

    // ── Friends (via dispatcher) ────────────────────────────────────────
    umbra_wasm_friends_send_request: (did: string, message?: string) =>
      call('friends_send_request', { did, message }),
    umbra_wasm_friends_accept_request: (request_id: string) =>
      call('friends_accept_request', { request_id }),
    umbra_wasm_friends_reject_request: (request_id: string) =>
      call('friends_reject_request', { request_id }),
    umbra_wasm_friends_list: () => call('friends_list'),
    umbra_wasm_friends_pending_requests: (direction?: string) =>
      call('friends_pending_requests', { direction: direction ?? 'incoming' }),
    umbra_wasm_friends_remove: (did: string) => call('friends_remove', { did }),
    umbra_wasm_friends_block: (did: string, reason?: string) => call('friends_block', { did, reason }),
    umbra_wasm_friends_unblock: (did: string) => call('friends_unblock', { did }),
    umbra_wasm_friends_store_incoming: (json: string) => call('friends_store_incoming', JSON.parse(json)),
    umbra_wasm_friends_accept_from_relay: (json: string) => call('friends_accept_from_relay', JSON.parse(json)),
    umbra_wasm_friends_build_accept_ack: (json: string) => call('friends_build_accept_ack', JSON.parse(json)),

    // ── Messaging (via dispatcher) ──────────────────────────────────────
    umbra_wasm_messaging_get_conversations: () => call('messaging_get_conversations'),
    umbra_wasm_messaging_create_dm_conversation: (friend_did: string) =>
      call('messaging_create_dm_conversation', { friend_did }),
    umbra_wasm_messaging_get_messages: (conversation_id: string, limit?: number, offset?: any) =>
      call('messaging_get_messages', { conversation_id, limit: limit ?? 50, offset: offset ?? 0 }),
    umbra_wasm_messaging_send: (conversation_id: string, content: string) =>
      call('messaging_send', { conversation_id, content }),
    umbra_wasm_messaging_mark_read: (conversation_id: string) =>
      call('messaging_mark_read', { conversation_id }),
    umbra_wasm_messaging_decrypt: (conversation_id: string, content_encrypted_b64: string, nonce_hex: string, sender_did: string, timestamp: number) =>
      call('messaging_decrypt', { conversation_id, content_encrypted_b64, nonce_hex, sender_did, timestamp }),
    umbra_wasm_messaging_store_incoming: (json: string) => call('messaging_store_incoming', JSON.parse(json)),
    umbra_wasm_messaging_build_typing_envelope: (json: string) => call('messaging_build_typing_envelope', JSON.parse(json)),
    umbra_wasm_messaging_build_receipt_envelope: (json: string) => call('messaging_build_receipt_envelope', JSON.parse(json)),

    // ── Messaging Extended (via dispatcher) ─────────────────────────────
    umbra_wasm_messaging_edit: (json: string) => call('messaging_edit', JSON.parse(json)),
    umbra_wasm_messaging_delete: (json: string) => call('messaging_delete', JSON.parse(json)),
    umbra_wasm_messaging_pin: (json: string) => call('messaging_pin', JSON.parse(json)),
    umbra_wasm_messaging_unpin: (json: string) => call('messaging_unpin', JSON.parse(json)),
    umbra_wasm_messaging_add_reaction: (json: string) => call('messaging_add_reaction', JSON.parse(json)),
    umbra_wasm_messaging_remove_reaction: (json: string) => call('messaging_remove_reaction', JSON.parse(json)),
    umbra_wasm_messaging_forward: (json: string) => call('messaging_forward', JSON.parse(json)),
    umbra_wasm_messaging_get_thread: (json: string) => call('messaging_get_thread', JSON.parse(json)),
    umbra_wasm_messaging_reply_thread: (json: string) => call('messaging_reply_thread', JSON.parse(json)),
    umbra_wasm_messaging_get_pinned: (json: string) => call('messaging_get_pinned', JSON.parse(json)),
    umbra_wasm_messaging_update_status: (json: string) => call('messaging_update_status', JSON.parse(json)),

    // ── Groups (via dispatcher) ─────────────────────────────────────────
    umbra_wasm_groups_create: (json: string) => call('groups_create', JSON.parse(json)),
    umbra_wasm_groups_get: (group_id: string) => call('groups_get', { group_id }),
    umbra_wasm_groups_list: () => call('groups_list'),
    umbra_wasm_groups_update: (json: string) => call('groups_update', JSON.parse(json)),
    umbra_wasm_groups_delete: (group_id: string) => call('groups_delete', { group_id }),
    umbra_wasm_groups_add_member: (json: string) => call('groups_add_member', JSON.parse(json)),
    umbra_wasm_groups_remove_member: (json: string) => call('groups_remove_member', JSON.parse(json)),
    umbra_wasm_groups_get_members: (group_id: string) => call('groups_get_members', { group_id }),
    umbra_wasm_groups_generate_key: (group_id: string) => call('groups_generate_key', { group_id }),
    umbra_wasm_groups_rotate_key: (group_id: string) => call('groups_rotate_key', { group_id }),
    umbra_wasm_groups_import_key: (json: string) => call('groups_import_key', JSON.parse(json)),
    umbra_wasm_groups_encrypt_message: (json: string) => call('groups_encrypt_message', JSON.parse(json)),
    umbra_wasm_groups_decrypt_message: (json: string) => call('groups_decrypt_message', JSON.parse(json)),
    umbra_wasm_groups_encrypt_key_for_member: (json: string) => call('groups_encrypt_key_for_member', JSON.parse(json)),
    umbra_wasm_groups_store_invite: (json: string) => call('groups_store_invite', JSON.parse(json)),
    umbra_wasm_groups_get_pending_invites: () => call('groups_get_pending_invites'),
    umbra_wasm_groups_accept_invite: (invite_id: string) => call('groups_accept_invite', { invite_id }),
    umbra_wasm_groups_decline_invite: (invite_id: string) => call('groups_decline_invite', { invite_id }),

    // ── Network (direct native calls) ───────────────────────────────────
    umbra_wasm_network_status: () => {
      try {
        const result = ensureJsonString(native.networkStatus());
        return checkNativeResult(result, 'networkStatus');
      } catch { return JSON.stringify({ is_running: false, peer_count: 0, listen_addresses: [] }); }
    },
    umbra_wasm_network_start: async () => {
      try {
        const result = await native.networkStart(null);
        checkNativeResult(result, 'networkStart');
        return true;
      } catch (e) { console.warn('[rn-backend] network_start failed:', e); return false; }
    },
    umbra_wasm_network_stop: async () => {
      try {
        const result = await native.networkStop();
        checkNativeResult(result, 'networkStop');
        return true;
      } catch (e) { console.warn('[rn-backend] network_stop failed:', e); return false; }
    },
    umbra_wasm_network_create_offer: () => call('network_create_offer'),
    umbra_wasm_network_accept_offer: (offer: string) => call('network_accept_offer', { offer }),
    umbra_wasm_network_complete_handshake: (answer: string) => call('network_complete_handshake', { answer }),
    umbra_wasm_network_complete_answerer: () => call('network_complete_answerer'),

    // ── Relay (via dispatcher) ──────────────────────────────────────────
    umbra_wasm_relay_connect: (relay_url: string) => call('relay_connect', { relay_url }),
    umbra_wasm_relay_disconnect: async () => {},
    umbra_wasm_relay_create_session: (relay_url: string) => call('relay_create_session', { relay_url }),
    umbra_wasm_relay_accept_session: (session_id: string, offer_payload: string) =>
      call('relay_accept_session', { session_id, offer_payload }),
    umbra_wasm_relay_send: (to_did: string, payload: string) => call('relay_send', { to_did, payload }),
    umbra_wasm_relay_fetch_offline: async () => JSON.stringify({ type: 'fetch_offline' }),

    // ── Events ──────────────────────────────────────────────────────────
    umbra_wasm_subscribe_events: (callback: (event_json: string) => void) => {
      try {
        const { addUmbraCoreEventListener } = require('../../modules/expo-umbra-core/src');
        const sub = addUmbraCoreEventListener((event: { type: string; data: string }) => {
          // event.data is the full JSON string from Rust's emit_event
          callback(event.data);
        });
        if (sub) {
          console.log('[rn-backend] Event subscription wired to native events');
        } else {
          console.warn('[rn-backend] Event subscription: native emitter not available');
        }
      } catch (e) {
        console.warn('[rn-backend] Failed to wire native events:', e);
      }
    },

    // ── Calls (via dispatcher) ──────────────────────────────────────────
    umbra_wasm_calls_store: (json: string) => call('calls_store', JSON.parse(json)),
    umbra_wasm_calls_end: (json: string) => call('calls_end', JSON.parse(json)),
    umbra_wasm_calls_get_history: (json: string) => call('calls_get_history', JSON.parse(json)),
    umbra_wasm_calls_get_all_history: (json?: string) => call('calls_get_all_history', json ? JSON.parse(json) : {}),

    // ── Notifications (via dispatcher) ───────────────────────────────────
    umbra_wasm_notifications_create: (json: string) => call('notifications_create', JSON.parse(json)),
    umbra_wasm_notifications_get: (json: string) => call('notifications_get', JSON.parse(json)),
    umbra_wasm_notifications_mark_read: (json: string) => call('notifications_mark_read', JSON.parse(json)),
    umbra_wasm_notifications_mark_all_read: (json: string) => call('notifications_mark_all_read', JSON.parse(json)),
    umbra_wasm_notifications_dismiss: (json: string) => call('notifications_dismiss', JSON.parse(json)),
    umbra_wasm_notifications_unread_counts: (json: string) => call('notifications_unread_counts', JSON.parse(json)),

    // ── Crypto (via dispatcher) ─────────────────────────────────────────
    umbra_wasm_crypto_sign: (data: any) => call('crypto_sign', { data }),
    umbra_wasm_crypto_verify: (public_key_hex: string, data: any, signature: any) =>
      call('crypto_verify', { public_key_hex, data, signature }),
    umbra_wasm_crypto_encrypt_for_peer: (json: string) => call('crypto_encrypt_for_peer', JSON.parse(json)),
    umbra_wasm_crypto_decrypt_from_peer: (json: string) => call('crypto_decrypt_from_peer', JSON.parse(json)),

    // ── File Encryption (via dispatcher) ────────────────────────────────
    umbra_wasm_file_derive_key: (json: string) => call('file_derive_key', JSON.parse(json)),
    umbra_wasm_file_encrypt_chunk: (json: string) => call('file_encrypt_chunk', JSON.parse(json)),
    umbra_wasm_file_decrypt_chunk: (json: string) => call('file_decrypt_chunk', JSON.parse(json)),
    umbra_wasm_channel_file_derive_key: (json: string) => call('channel_file_derive_key', JSON.parse(json)),
    umbra_wasm_compute_key_fingerprint: (json: string) => call('compute_key_fingerprint', JSON.parse(json)),
    umbra_wasm_verify_key_fingerprint: (json: string) => call('verify_key_fingerprint', JSON.parse(json)),
    umbra_wasm_mark_files_for_reencryption: (json: string) => call('mark_files_for_reencryption', JSON.parse(json)),
    umbra_wasm_get_files_needing_reencryption: (json: string) => call('get_files_needing_reencryption', JSON.parse(json)),
    umbra_wasm_clear_reencryption_flag: (json: string) => call('clear_reencryption_flag', JSON.parse(json)),

    // ── Community — Core (via dispatcher) ───────────────────────────────
    umbra_wasm_community_create: (json: string) => call('community_create', JSON.parse(json)),
    umbra_wasm_community_get: (community_id: string) => call('community_get', { community_id }),
    umbra_wasm_community_get_mine: (member_did: string) => call('community_get_mine', { member_did }),
    umbra_wasm_community_update: (json: string) => call('community_update', JSON.parse(json)),
    umbra_wasm_community_delete: (json: string) => call('community_delete', JSON.parse(json)),
    umbra_wasm_community_transfer_ownership: (json: string) => call('community_transfer_ownership', JSON.parse(json)),
    umbra_wasm_community_update_branding: (json: string) => call('community_update_branding', JSON.parse(json)),

    // ── Community — Spaces (via dispatcher) ─────────────────────────────
    umbra_wasm_community_space_create: (json: string) => call('community_space_create', JSON.parse(json)),
    umbra_wasm_community_space_list: (community_id: string) => call('community_space_list', { community_id }),
    umbra_wasm_community_space_update: (json: string) => call('community_space_update', JSON.parse(json)),
    umbra_wasm_community_space_reorder: (json: string) => call('community_space_reorder', JSON.parse(json)),
    umbra_wasm_community_space_delete: (json: string) => call('community_space_delete', JSON.parse(json)),

    // ── Community — Categories (via dispatcher) ─────────────────────────
    umbra_wasm_community_category_create: (json: string) => call('community_category_create', JSON.parse(json)),
    umbra_wasm_community_category_list: (space_id: string) => call('community_category_list', { space_id }),
    umbra_wasm_community_category_list_all: (community_id: string) => call('community_category_list_all', { community_id }),
    umbra_wasm_community_category_update: (json: string) => call('community_category_update', JSON.parse(json)),
    umbra_wasm_community_category_reorder: (json: string) => call('community_category_reorder', JSON.parse(json)),
    umbra_wasm_community_category_delete: (json: string) => call('community_category_delete', JSON.parse(json)),
    umbra_wasm_community_channel_move_category: (json: string) => call('community_channel_move_category', JSON.parse(json)),

    // ── Community — Channels (via dispatcher) ───────────────────────────
    umbra_wasm_community_channel_create: (json: string) => call('community_channel_create', JSON.parse(json)),
    umbra_wasm_community_channel_list: (space_id: string) => call('community_channel_list', { space_id }),
    umbra_wasm_community_channel_list_all: (community_id: string) => call('community_channel_list_all', { community_id }),
    umbra_wasm_community_channel_get: (channel_id: string) => call('community_channel_get', { channel_id }),
    umbra_wasm_community_channel_update: (json: string) => call('community_channel_update', JSON.parse(json)),
    umbra_wasm_community_channel_set_slow_mode: (json: string) => call('community_channel_set_slow_mode', JSON.parse(json)),
    umbra_wasm_community_channel_set_e2ee: (json: string) => call('community_channel_set_e2ee', JSON.parse(json)),
    umbra_wasm_community_channel_delete: (json: string) => call('community_channel_delete', JSON.parse(json)),
    umbra_wasm_community_channel_reorder: (json: string) => call('community_channel_reorder', JSON.parse(json)),

    // ── Community — Members (via dispatcher) ────────────────────────────
    umbra_wasm_community_join: (json: string) => call('community_join', JSON.parse(json)),
    umbra_wasm_community_leave: (json: string) => call('community_leave', JSON.parse(json)),
    umbra_wasm_community_kick: (json: string) => call('community_kick', JSON.parse(json)),
    umbra_wasm_community_ban: (json: string) => call('community_ban', JSON.parse(json)),
    umbra_wasm_community_unban: (json: string) => call('community_unban', JSON.parse(json)),
    umbra_wasm_community_member_list: (community_id: string) => call('community_member_list', { community_id }),
    umbra_wasm_community_member_get: (community_id: string, member_did: string) =>
      call('community_member_get', { community_id, member_did }),
    umbra_wasm_community_member_update_profile: (json: string) => call('community_member_update_profile', JSON.parse(json)),
    umbra_wasm_community_ban_list: (community_id: string) => call('community_ban_list', { community_id }),

    // ── Community — Roles (via dispatcher) ──────────────────────────────
    umbra_wasm_community_role_list: (community_id: string) => call('community_role_list', { community_id }),
    umbra_wasm_community_member_roles: (community_id: string, member_did: string) =>
      call('community_member_roles', { community_id, member_did }),
    umbra_wasm_community_role_assign: (json: string) => call('community_role_assign', JSON.parse(json)),
    umbra_wasm_community_role_unassign: (json: string) => call('community_role_unassign', JSON.parse(json)),
    umbra_wasm_community_custom_role_create: (json: string) => call('community_custom_role_create', JSON.parse(json)),
    umbra_wasm_community_role_update: (json: string) => call('community_role_update', JSON.parse(json)),
    umbra_wasm_community_role_update_permissions: (json: string) => call('community_role_update_permissions', JSON.parse(json)),
    umbra_wasm_community_role_delete: (json: string) => call('community_role_delete', JSON.parse(json)),

    // ── Community — Invites (via dispatcher) ────────────────────────────
    umbra_wasm_community_invite_create: (json: string) => call('community_invite_create', JSON.parse(json)),
    umbra_wasm_community_invite_use: (json: string) => call('community_invite_use', JSON.parse(json)),
    umbra_wasm_community_invite_list: (community_id: string) => call('community_invite_list', { community_id }),
    umbra_wasm_community_invite_delete: (json: string) => call('community_invite_delete', JSON.parse(json)),
    umbra_wasm_community_invite_set_vanity: (json: string) => call('community_invite_set_vanity', JSON.parse(json)),

    // ── Community — Messages (via dispatcher) ───────────────────────────
    umbra_wasm_community_message_send: (json: string) => call('community_message_send', JSON.parse(json)),
    umbra_wasm_community_message_store_received: (json: string) => call('community_message_store_received', JSON.parse(json)),
    umbra_wasm_community_message_list: (json: string) => call('community_message_list', JSON.parse(json)),
    umbra_wasm_community_message_get: (message_id: string) => call('community_message_get', { message_id }),
    umbra_wasm_community_message_edit: (json: string) => call('community_message_edit', JSON.parse(json)),
    umbra_wasm_community_message_delete: (message_id: string) => call('community_message_delete', { message_id }),

    // ── Community — Reactions (via dispatcher) ──────────────────────────
    umbra_wasm_community_reaction_add: (json: string) => call('community_reaction_add', JSON.parse(json)),
    umbra_wasm_community_reaction_remove: (json: string) => call('community_reaction_remove', JSON.parse(json)),
    umbra_wasm_community_reaction_list: (message_id: string) => call('community_reaction_list', { message_id }),

    // ── Community — Emoji (via dispatcher) ──────────────────────────────
    umbra_wasm_community_emoji_create: (json: string) => call('community_emoji_create', JSON.parse(json)),
    umbra_wasm_community_emoji_list: (community_id: string) => call('community_emoji_list', { community_id }),
    umbra_wasm_community_emoji_delete: (json: string) => call('community_emoji_delete', JSON.parse(json)),
    umbra_wasm_community_emoji_rename: (json: string) => call('community_emoji_rename', JSON.parse(json)),

    // ── Community — Stickers (via dispatcher) ───────────────────────────
    umbra_wasm_community_sticker_create: (json: string) => call('community_sticker_create', JSON.parse(json)),
    umbra_wasm_community_sticker_list: (community_id: string) => call('community_sticker_list', { community_id }),
    umbra_wasm_community_sticker_delete: (sticker_id: string) => call('community_sticker_delete', { sticker_id }),

    // ── Community — Sticker Packs (via dispatcher) ──────────────────────
    umbra_wasm_community_sticker_pack_create: (json: string) => call('community_sticker_pack_create', JSON.parse(json)),
    umbra_wasm_community_sticker_pack_list: (community_id: string) => call('community_sticker_pack_list', { community_id }),
    umbra_wasm_community_sticker_pack_delete: (pack_id: string) => call('community_sticker_pack_delete', { pack_id }),
    umbra_wasm_community_sticker_pack_rename: (json: string) => call('community_sticker_pack_rename', JSON.parse(json)),

    // ── Community — Pins (via dispatcher) ───────────────────────────────
    umbra_wasm_community_pin_message: (json: string) => call('community_pin_message', JSON.parse(json)),
    umbra_wasm_community_unpin_message: (json: string) => call('community_unpin_message', JSON.parse(json)),
    umbra_wasm_community_pin_list: (channel_id: string) => call('community_pin_list', { channel_id }),

    // ── Community — Threads (via dispatcher) ────────────────────────────
    umbra_wasm_community_thread_create: (json: string) => call('community_thread_create', JSON.parse(json)),
    umbra_wasm_community_thread_get: (thread_id: string) => call('community_thread_get', { thread_id }),
    umbra_wasm_community_thread_list: (channel_id: string) => call('community_thread_list', { channel_id }),
    umbra_wasm_community_thread_messages: (json: string) => call('community_thread_messages', JSON.parse(json)),

    // ── Community — Read Receipts (via dispatcher) ──────────────────────
    umbra_wasm_community_mark_read: (json: string) => call('community_mark_read', JSON.parse(json)),

    // ── Community — Files (via dispatcher) ──────────────────────────────
    umbra_wasm_community_upload_file: (json: string) => call('community_upload_file', JSON.parse(json)),
    umbra_wasm_community_get_files: (json: string) => call('community_get_files', JSON.parse(json)),
    umbra_wasm_community_get_file: (file_id: string) => call('community_get_file', { file_id }),
    umbra_wasm_community_delete_file: (json: string) => call('community_delete_file', JSON.parse(json)),
    umbra_wasm_community_record_file_download: (file_id: string) => call('community_record_file_download', { file_id }),
    umbra_wasm_community_create_folder: (json: string) => call('community_create_folder', JSON.parse(json)),
    umbra_wasm_community_get_folders: (json: string) => call('community_get_folders', JSON.parse(json)),
    umbra_wasm_community_delete_folder: (folder_id: string) => call('community_delete_folder', { folder_id }),

    // ── DM — Files (via dispatcher) ─────────────────────────────────────
    umbra_wasm_dm_upload_file: (json: string) => call('dm_upload_file', JSON.parse(json)),
    umbra_wasm_dm_get_files: (json: string) => call('dm_get_files', JSON.parse(json)),
    umbra_wasm_dm_get_file: (file_id: string) => call('dm_get_file', { file_id }),
    umbra_wasm_dm_delete_file: (json: string) => call('dm_delete_file', JSON.parse(json)),
    umbra_wasm_dm_record_file_download: (file_id: string) => call('dm_record_file_download', { file_id }),
    umbra_wasm_dm_move_file: (json: string) => call('dm_move_file', JSON.parse(json)),
    umbra_wasm_dm_create_folder: (json: string) => call('dm_create_folder', JSON.parse(json)),
    umbra_wasm_dm_get_folders: (json: string) => call('dm_get_folders', JSON.parse(json)),
    umbra_wasm_dm_delete_folder: (folder_id: string) => call('dm_delete_folder', { folder_id }),
    umbra_wasm_dm_rename_folder: (json: string) => call('dm_rename_folder', JSON.parse(json)),

    // ── Groups — Relay (via dispatcher) ─────────────────────────────────
    umbra_wasm_groups_send_invite: (json: string) => call('groups_send_invite', JSON.parse(json)),
    umbra_wasm_groups_build_invite_accept_envelope: (json: string) => call('groups_build_invite_accept_envelope', JSON.parse(json)),
    umbra_wasm_groups_build_invite_decline_envelope: (json: string) => call('groups_build_invite_decline_envelope', JSON.parse(json)),
    umbra_wasm_groups_send_message: (json: string) => call('groups_send_message', JSON.parse(json)),
    umbra_wasm_groups_remove_member_with_rotation: (json: string) => call('groups_remove_member_with_rotation', JSON.parse(json)),

    // ── Relay Envelope Builders (via dispatcher) ────────────────────────
    umbra_wasm_community_build_event_relay_batch: (json: string) => call('community_build_event_relay_batch', JSON.parse(json)),
    umbra_wasm_build_dm_file_event_envelope: (json: string) => call('build_dm_file_event_envelope', JSON.parse(json)),
    umbra_wasm_build_metadata_envelope: (json: string) => call('build_metadata_envelope', JSON.parse(json)),

    // ── File Chunking (via dispatcher) ──────────────────────────────────
    umbra_wasm_chunk_file: (json: string) => call('chunk_file', JSON.parse(json)),
    umbra_wasm_reassemble_file: (json: string) => call('reassemble_file', JSON.parse(json)),
    umbra_wasm_get_file_manifest: (file_id: string) => call('get_file_manifest', { file_id }),

    // ── File Transfer Control ───────────────────────────────────────────
    umbra_wasm_transfer_initiate: (json: string) => call('transfer_initiate', JSON.parse(json)),
    umbra_wasm_transfer_accept: (json: string) => call('transfer_accept', JSON.parse(json)),
    umbra_wasm_transfer_pause: (transfer_id: string) => call('transfer_pause', { transfer_id }),
    umbra_wasm_transfer_resume: (transfer_id: string) => call('transfer_resume', { transfer_id }),
    umbra_wasm_transfer_cancel: (transfer_id: string) => call('transfer_cancel', { transfer_id }),
    umbra_wasm_transfer_on_message: (json: string) => call('transfer_on_message', JSON.parse(json)),
    umbra_wasm_transfer_list: () => { try { return call('transfer_list'); } catch { return JSON.stringify([]); } },
    umbra_wasm_transfer_get: (transfer_id: string) => call('transfer_get', { transfer_id }),
    umbra_wasm_transfer_get_incomplete: () => { try { return call('transfer_get_incomplete'); } catch { return JSON.stringify([]); } },
    umbra_wasm_transfer_chunks_to_send: (transfer_id: string) => call('transfer_chunks_to_send', { transfer_id }),
    umbra_wasm_transfer_mark_chunk_sent: (json: string) => call('transfer_mark_chunk_sent', JSON.parse(json)),

    // ── DHT (via dispatcher) ────────────────────────────────────────────
    umbra_wasm_dht_start_providing: (json: string) => call('dht_start_providing', JSON.parse(json)),
    umbra_wasm_dht_get_providers: (json: string) => call('dht_get_providers', JSON.parse(json)),
    umbra_wasm_dht_stop_providing: (json: string) => call('dht_stop_providing', JSON.parse(json)),

    // ── Plugin Storage (via dispatcher) ─────────────────────────────────
    umbra_wasm_plugin_kv_get: (plugin_id: string, key: string) => call('plugin_kv_get', { plugin_id, key }),
    umbra_wasm_plugin_kv_set: (plugin_id: string, key: string, value: string) => call('plugin_kv_set', { plugin_id, key, value }),
    umbra_wasm_plugin_kv_delete: (plugin_id: string, key: string) => call('plugin_kv_delete', { plugin_id, key }),
    umbra_wasm_plugin_kv_list: (plugin_id: string, prefix: string) => call('plugin_kv_list', { plugin_id, prefix }),
    umbra_wasm_plugin_bundle_save: (plugin_id: string, manifest: string, bundle: string) =>
      call('plugin_bundle_save', { plugin_id, manifest, bundle }),
    umbra_wasm_plugin_bundle_load: (plugin_id: string) => call('plugin_bundle_load', { plugin_id }),
    umbra_wasm_plugin_bundle_delete: (plugin_id: string) => call('plugin_bundle_delete', { plugin_id }),
    umbra_wasm_plugin_bundle_list: () => call('plugin_bundle_list'),

    // ── Community Seats (via dispatcher) ────────────────────────────────
    umbra_wasm_community_seat_list: (community_id: string) => call('community_seat_list', { community_id }),
    umbra_wasm_community_seat_list_unclaimed: (community_id: string) => call('community_seat_list_unclaimed', { community_id }),
    umbra_wasm_community_seat_find_match: (json: string) => call('community_seat_find_match', JSON.parse(json)),
    umbra_wasm_community_seat_claim: (json: string) => call('community_seat_claim', JSON.parse(json)),
    umbra_wasm_community_seat_delete: (json: string) => call('community_seat_delete', JSON.parse(json)),
    umbra_wasm_community_seat_create_batch: (json: string) => call('community_seat_create_batch', JSON.parse(json)),
    umbra_wasm_community_seat_count: (community_id: string) => call('community_seat_count', { community_id }),

    // ── Community Audit Log (via dispatcher) ────────────────────────────
    umbra_wasm_community_audit_log_create_batch: (json: string) => call('community_audit_log_create_batch', JSON.parse(json)),
    umbra_wasm_community_audit_log_list: (json: string) => call('community_audit_log_list', JSON.parse(json)),
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Stub backend — lets the app boot without native module
// ─────────────────────────────────────────────────────────────────────────

function createStubBackend(): UmbraWasmModule {
  return {
    umbra_wasm_init: () => { console.log('[rn-backend] Init (stub)'); },
    umbra_wasm_init_database: async () => true,
    umbra_wasm_version: () => '0.1.0 (react-native-stub)',
    umbra_wasm_identity_create: () => notImplemented('identity_create'),
    umbra_wasm_identity_restore: () => notImplemented('identity_restore'),
    umbra_wasm_identity_set: () => {},
    umbra_wasm_identity_get_did: () => notImplemented('identity_get_did'),
    umbra_wasm_identity_get_profile: () => notImplemented('identity_get_profile'),
    umbra_wasm_identity_update_profile: () => notImplemented('identity_update_profile'),
    umbra_wasm_discovery_get_connection_info: () => notImplemented('discovery_get_connection_info'),
    umbra_wasm_discovery_parse_connection_info: () => notImplemented('discovery_parse_connection_info'),
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
    umbra_wasm_messaging_get_conversations: () => notImplemented('messaging_get_conversations'),
    umbra_wasm_messaging_create_dm_conversation: () => notImplemented('messaging_create_dm_conversation'),
    umbra_wasm_messaging_get_messages: () => notImplemented('messaging_get_messages'),
    umbra_wasm_messaging_send: () => notImplemented('messaging_send'),
    umbra_wasm_messaging_mark_read: () => notImplemented('messaging_mark_read'),
    umbra_wasm_messaging_decrypt: () => notImplemented('messaging_decrypt'),
    umbra_wasm_messaging_store_incoming: () => notImplemented('messaging_store_incoming'),
    umbra_wasm_messaging_build_typing_envelope: () => notImplemented('messaging_build_typing_envelope'),
    umbra_wasm_messaging_build_receipt_envelope: () => notImplemented('messaging_build_receipt_envelope'),
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
    umbra_wasm_messaging_update_status: () => notImplemented('messaging_update_status'),
    umbra_wasm_network_status: () => JSON.stringify({ connected: false, peers: 0 }),
    umbra_wasm_network_start: async () => false,
    umbra_wasm_network_stop: async () => true,
    umbra_wasm_network_create_offer: () => notImplemented('network_create_offer'),
    umbra_wasm_network_accept_offer: () => notImplemented('network_accept_offer'),
    umbra_wasm_network_complete_handshake: () => notImplemented('network_complete_handshake'),
    umbra_wasm_network_complete_answerer: () => notImplemented('network_complete_answerer'),
    umbra_wasm_relay_connect: () => notImplemented('relay_connect'),
    umbra_wasm_relay_disconnect: async () => {},
    umbra_wasm_relay_create_session: () => notImplemented('relay_create_session'),
    umbra_wasm_relay_accept_session: () => notImplemented('relay_accept_session'),
    umbra_wasm_relay_send: () => notImplemented('relay_send'),
    umbra_wasm_relay_fetch_offline: async () => JSON.stringify({ type: 'fetch_offline' }),
    umbra_wasm_subscribe_events: () => { console.log('[rn-backend] Event subscription (stub)'); },
    umbra_wasm_calls_store: () => notImplemented('calls_store'),
    umbra_wasm_calls_end: () => notImplemented('calls_end'),
    umbra_wasm_calls_get_history: () => JSON.stringify([]),
    umbra_wasm_calls_get_all_history: () => JSON.stringify([]),
    umbra_wasm_notifications_create: () => notImplemented('notifications_create'),
    umbra_wasm_notifications_get: () => JSON.stringify([]),
    umbra_wasm_notifications_mark_read: () => JSON.stringify({ success: true }),
    umbra_wasm_notifications_mark_all_read: () => JSON.stringify({ success: true, count: 0 }),
    umbra_wasm_notifications_dismiss: () => JSON.stringify({ success: true }),
    umbra_wasm_notifications_unread_counts: () => JSON.stringify({ all: 0, social: 0, calls: 0, mentions: 0, system: 0 }),
    umbra_wasm_crypto_sign: () => notImplemented('crypto_sign'),
    umbra_wasm_crypto_verify: () => notImplemented('crypto_verify'),
    umbra_wasm_crypto_encrypt_for_peer: () => notImplemented('crypto_encrypt_for_peer'),
    umbra_wasm_crypto_decrypt_from_peer: () => notImplemented('crypto_decrypt_from_peer'),
    umbra_wasm_file_derive_key: () => notImplemented('file_derive_key'),
    umbra_wasm_file_encrypt_chunk: () => notImplemented('file_encrypt_chunk'),
    umbra_wasm_file_decrypt_chunk: () => notImplemented('file_decrypt_chunk'),
    umbra_wasm_channel_file_derive_key: () => notImplemented('channel_file_derive_key'),
    umbra_wasm_compute_key_fingerprint: () => notImplemented('compute_key_fingerprint'),
    umbra_wasm_verify_key_fingerprint: () => notImplemented('verify_key_fingerprint'),
    umbra_wasm_mark_files_for_reencryption: () => notImplemented('mark_files_for_reencryption'),
    umbra_wasm_get_files_needing_reencryption: () => notImplemented('get_files_needing_reencryption'),
    umbra_wasm_clear_reencryption_flag: () => notImplemented('clear_reencryption_flag'),
    umbra_wasm_community_create: () => notImplemented('community_create'),
    umbra_wasm_community_get: () => notImplemented('community_get'),
    umbra_wasm_community_get_mine: () => notImplemented('community_get_mine'),
    umbra_wasm_community_update: () => notImplemented('community_update'),
    umbra_wasm_community_delete: () => notImplemented('community_delete'),
    umbra_wasm_community_transfer_ownership: () => notImplemented('community_transfer_ownership'),
    umbra_wasm_community_update_branding: () => notImplemented('community_update_branding'),
    umbra_wasm_community_space_create: () => notImplemented('community_space_create'),
    umbra_wasm_community_space_list: () => notImplemented('community_space_list'),
    umbra_wasm_community_space_update: () => notImplemented('community_space_update'),
    umbra_wasm_community_space_reorder: () => notImplemented('community_space_reorder'),
    umbra_wasm_community_space_delete: () => notImplemented('community_space_delete'),
    umbra_wasm_community_category_create: () => notImplemented('community_category_create'),
    umbra_wasm_community_category_list: () => notImplemented('community_category_list'),
    umbra_wasm_community_category_list_all: () => notImplemented('community_category_list_all'),
    umbra_wasm_community_category_update: () => notImplemented('community_category_update'),
    umbra_wasm_community_category_reorder: () => notImplemented('community_category_reorder'),
    umbra_wasm_community_category_delete: () => notImplemented('community_category_delete'),
    umbra_wasm_community_channel_move_category: () => notImplemented('community_channel_move_category'),
    umbra_wasm_community_channel_create: () => notImplemented('community_channel_create'),
    umbra_wasm_community_channel_list: () => notImplemented('community_channel_list'),
    umbra_wasm_community_channel_list_all: () => notImplemented('community_channel_list_all'),
    umbra_wasm_community_channel_get: () => notImplemented('community_channel_get'),
    umbra_wasm_community_channel_update: () => notImplemented('community_channel_update'),
    umbra_wasm_community_channel_set_slow_mode: () => notImplemented('community_channel_set_slow_mode'),
    umbra_wasm_community_channel_set_e2ee: () => notImplemented('community_channel_set_e2ee'),
    umbra_wasm_community_channel_delete: () => notImplemented('community_channel_delete'),
    umbra_wasm_community_channel_reorder: () => notImplemented('community_channel_reorder'),
    umbra_wasm_community_join: () => notImplemented('community_join'),
    umbra_wasm_community_leave: () => notImplemented('community_leave'),
    umbra_wasm_community_kick: () => notImplemented('community_kick'),
    umbra_wasm_community_ban: () => notImplemented('community_ban'),
    umbra_wasm_community_unban: () => notImplemented('community_unban'),
    umbra_wasm_community_member_list: () => notImplemented('community_member_list'),
    umbra_wasm_community_member_get: () => notImplemented('community_member_get'),
    umbra_wasm_community_member_update_profile: () => notImplemented('community_member_update_profile'),
    umbra_wasm_community_ban_list: () => notImplemented('community_ban_list'),
    umbra_wasm_community_role_list: () => notImplemented('community_role_list'),
    umbra_wasm_community_member_roles: () => notImplemented('community_member_roles'),
    umbra_wasm_community_role_assign: () => notImplemented('community_role_assign'),
    umbra_wasm_community_role_unassign: () => notImplemented('community_role_unassign'),
    umbra_wasm_community_custom_role_create: () => notImplemented('community_custom_role_create'),
    umbra_wasm_community_role_update: () => notImplemented('community_role_update'),
    umbra_wasm_community_role_update_permissions: () => notImplemented('community_role_update_permissions'),
    umbra_wasm_community_role_delete: () => notImplemented('community_role_delete'),
    umbra_wasm_community_invite_create: () => notImplemented('community_invite_create'),
    umbra_wasm_community_invite_use: () => notImplemented('community_invite_use'),
    umbra_wasm_community_invite_list: () => notImplemented('community_invite_list'),
    umbra_wasm_community_invite_delete: () => notImplemented('community_invite_delete'),
    umbra_wasm_community_invite_set_vanity: () => notImplemented('community_invite_set_vanity'),
    umbra_wasm_community_message_send: () => notImplemented('community_message_send'),
    umbra_wasm_community_message_store_received: () => notImplemented('community_message_store_received'),
    umbra_wasm_community_message_list: () => notImplemented('community_message_list'),
    umbra_wasm_community_message_get: () => notImplemented('community_message_get'),
    umbra_wasm_community_message_edit: () => notImplemented('community_message_edit'),
    umbra_wasm_community_message_delete: () => notImplemented('community_message_delete'),
    umbra_wasm_community_reaction_add: () => notImplemented('community_reaction_add'),
    umbra_wasm_community_reaction_remove: () => notImplemented('community_reaction_remove'),
    umbra_wasm_community_reaction_list: () => notImplemented('community_reaction_list'),
    umbra_wasm_community_emoji_create: () => notImplemented('community_emoji_create'),
    umbra_wasm_community_emoji_list: () => notImplemented('community_emoji_list'),
    umbra_wasm_community_emoji_delete: () => notImplemented('community_emoji_delete'),
    umbra_wasm_community_emoji_rename: () => notImplemented('community_emoji_rename'),
    umbra_wasm_community_sticker_create: () => notImplemented('community_sticker_create'),
    umbra_wasm_community_sticker_list: () => notImplemented('community_sticker_list'),
    umbra_wasm_community_sticker_delete: () => notImplemented('community_sticker_delete'),
    umbra_wasm_community_sticker_pack_create: () => notImplemented('community_sticker_pack_create'),
    umbra_wasm_community_sticker_pack_list: () => notImplemented('community_sticker_pack_list'),
    umbra_wasm_community_sticker_pack_delete: () => notImplemented('community_sticker_pack_delete'),
    umbra_wasm_community_sticker_pack_rename: () => notImplemented('community_sticker_pack_rename'),
    umbra_wasm_community_pin_message: () => notImplemented('community_pin_message'),
    umbra_wasm_community_unpin_message: () => notImplemented('community_unpin_message'),
    umbra_wasm_community_pin_list: () => notImplemented('community_pin_list'),
    umbra_wasm_community_thread_create: () => notImplemented('community_thread_create'),
    umbra_wasm_community_thread_get: () => notImplemented('community_thread_get'),
    umbra_wasm_community_thread_list: () => notImplemented('community_thread_list'),
    umbra_wasm_community_thread_messages: () => notImplemented('community_thread_messages'),
    umbra_wasm_community_mark_read: () => notImplemented('community_mark_read'),
    umbra_wasm_community_upload_file: () => notImplemented('community_upload_file'),
    umbra_wasm_community_get_files: () => notImplemented('community_get_files'),
    umbra_wasm_community_get_file: () => notImplemented('community_get_file'),
    umbra_wasm_community_delete_file: () => notImplemented('community_delete_file'),
    umbra_wasm_community_record_file_download: () => notImplemented('community_record_file_download'),
    umbra_wasm_community_create_folder: () => notImplemented('community_create_folder'),
    umbra_wasm_community_get_folders: () => notImplemented('community_get_folders'),
    umbra_wasm_community_delete_folder: () => notImplemented('community_delete_folder'),
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
    umbra_wasm_groups_send_invite: () => notImplemented('groups_send_invite'),
    umbra_wasm_groups_build_invite_accept_envelope: () => notImplemented('groups_build_invite_accept_envelope'),
    umbra_wasm_groups_build_invite_decline_envelope: () => notImplemented('groups_build_invite_decline_envelope'),
    umbra_wasm_groups_send_message: () => notImplemented('groups_send_message'),
    umbra_wasm_groups_remove_member_with_rotation: () => notImplemented('groups_remove_member_with_rotation'),
    umbra_wasm_community_build_event_relay_batch: () => notImplemented('community_build_event_relay_batch'),
    umbra_wasm_build_dm_file_event_envelope: () => notImplemented('build_dm_file_event_envelope'),
    umbra_wasm_build_metadata_envelope: () => notImplemented('build_metadata_envelope'),
    umbra_wasm_chunk_file: () => notImplemented('chunk_file'),
    umbra_wasm_reassemble_file: () => notImplemented('reassemble_file'),
    umbra_wasm_get_file_manifest: () => notImplemented('get_file_manifest'),
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
    umbra_wasm_dht_start_providing: () => notImplemented('dht_start_providing'),
    umbra_wasm_dht_get_providers: () => notImplemented('dht_get_providers'),
    umbra_wasm_dht_stop_providing: () => notImplemented('dht_stop_providing'),
    umbra_wasm_plugin_kv_get: () => JSON.stringify({ value: null }),
    umbra_wasm_plugin_kv_set: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_kv_delete: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_kv_list: () => JSON.stringify({ keys: [] }),
    umbra_wasm_plugin_bundle_save: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_bundle_load: () => JSON.stringify({ error: 'not_found' }),
    umbra_wasm_plugin_bundle_delete: () => JSON.stringify({ ok: true }),
    umbra_wasm_plugin_bundle_list: () => JSON.stringify({ plugins: [] }),
    umbra_wasm_community_seat_list: () => notImplemented('community_seat_list'),
    umbra_wasm_community_seat_list_unclaimed: () => notImplemented('community_seat_list_unclaimed'),
    umbra_wasm_community_seat_find_match: () => notImplemented('community_seat_find_match'),
    umbra_wasm_community_seat_claim: () => notImplemented('community_seat_claim'),
    umbra_wasm_community_seat_delete: () => notImplemented('community_seat_delete'),
    umbra_wasm_community_seat_create_batch: () => notImplemented('community_seat_create_batch'),
    umbra_wasm_community_seat_count: () => notImplemented('community_seat_count'),
    umbra_wasm_community_audit_log_create_batch: () => notImplemented('community_audit_log_create_batch'),
    umbra_wasm_community_audit_log_list: () => notImplemented('community_audit_log_list'),
  };
}
