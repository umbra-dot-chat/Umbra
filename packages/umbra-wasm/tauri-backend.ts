/**
 * Tauri Backend Adapter
 *
 * Implements the same UmbraWasmModule interface as the WASM loader,
 * but routes most calls through a single `umbra_call` Tauri IPC command
 * which forwards to the FFI dispatcher in umbra-core.
 *
 * This means business-logic changes can be shipped via frontend OTA
 * without rebuilding the native binary, as long as the dispatcher
 * in the linked umbra-core library handles the method.
 *
 * A handful of methods that rely on Tauri-side state (identity hydration,
 * network start/stop, relay WebSocket) still use dedicated Tauri commands.
 */

import type { UmbraWasmModule } from './loader';

/**
 * Ensure a Tauri IPC result is a JSON string.
 *
 * Tauri's `invoke()` automatically deserializes JSON strings into
 * JavaScript objects. But the `UmbraWasmModule` interface expects
 * raw JSON strings (matching wasm-bindgen output) so that
 * `parseWasm()` in the service layer can `JSON.parse()` them.
 *
 * If `invoke` returned an object, re-serialize it. If it returned
 * a primitive string (e.g. a DID), return it as-is.
 */
function ensureJsonString(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

/**
 * Create a Tauri backend that implements UmbraWasmModule.
 *
 * The `invoke` function is passed in from the caller (loaded via
 * dynamic import of @tauri-apps/api/core) so we don't need to
 * worry about lazy initialization inside individual methods.
 */
export function createTauriBackend(
  invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
): UmbraWasmModule {
  // ── Helper: route through the FFI dispatcher ──────────────────────
  //
  // All methods that follow the pattern "take a dispatcher method name
  // and a JSON args string" are routed through this single call.
  const call = (method: string, args: string = '{}'): Promise<string> =>
    invoke('umbra_call', { method, args }).then(ensureJsonString);

  // fire-and-forget variant (logs errors instead of throwing)
  const callQuiet = (method: string, args: string = '{}'): void => {
    call(method, args).catch((e: unknown) =>
      console.warn(`[tauri-backend] ${method}:`, e)
    );
  };

  return {
    // ── Initialization ─────────────────────────────────────────────
    // These still use dedicated Tauri commands because they manage
    // Tauri-side AppState (separate from the FFI dispatcher state).
    umbra_wasm_init: () => {
      // Initialize the FFI dispatcher state + database
      invoke('init_ffi_state').catch((e: unknown) =>
        console.warn('[tauri-backend] init_ffi_state:', e)
      );
      // Also init the legacy Tauri-side state (tracing etc.)
      invoke('init').catch((e: unknown) =>
        console.warn('[tauri-backend] init:', e)
      );
    },

    umbra_wasm_init_database: async () => {
      return invoke('init_database') as Promise<boolean>;
    },

    umbra_wasm_version: () => {
      return '0.1.0 (desktop)';
    },

    // ── Identity ───────────────────────────────────────────────────
    // Identity create/restore go through the dispatcher so the
    // identity is stored in FfiState (which the dispatcher reads).
    // We also hydrate Tauri-side AppState via set_identity.
    umbra_wasm_identity_create: (display_name: string) => {
      return call('identity_create', JSON.stringify({ display_name })) as any;
    },

    umbra_wasm_identity_restore: (recovery_phrase: string, display_name: string) => {
      return call('identity_restore', JSON.stringify({ recovery_phrase, display_name })) as any;
    },

    umbra_wasm_identity_set: (json: string) => {
      // Hydrate Tauri-side AppState (for network commands that need it)
      invoke('set_identity', { json }).catch((e: unknown) =>
        console.warn('[tauri-backend] set_identity:', e)
      );
      // Also tell the dispatcher about the identity
      // (set_identity in dispatcher is handled via identity_create/restore)
    },

    umbra_wasm_identity_get_did: () => {
      return call('identity_get_did') as any;
    },

    umbra_wasm_identity_get_profile: () => {
      return call('identity_get_profile') as any;
    },

    umbra_wasm_identity_update_profile: (json: string) => {
      callQuiet('identity_update_profile', json);
    },

    // ── Discovery ──────────────────────────────────────────────────
    umbra_wasm_discovery_get_connection_info: () => {
      return invoke('get_connection_info').then(ensureJsonString) as any;
    },

    umbra_wasm_discovery_parse_connection_info: (info: string) => {
      return invoke('parse_connection_info', { info }).then(ensureJsonString) as any;
    },

    // ── Friends ────────────────────────────────────────────────────
    umbra_wasm_friends_send_request: (did: string, message?: string) => {
      return call('friends_send_request', JSON.stringify({ did, message: message ?? null })) as any;
    },

    umbra_wasm_friends_accept_request: (request_id: string) => {
      return call('friends_accept_request', JSON.stringify({ request_id })) as any;
    },

    umbra_wasm_friends_reject_request: (request_id: string) => {
      callQuiet('friends_reject_request', JSON.stringify({ request_id }));
    },

    umbra_wasm_friends_list: () => {
      return call('friends_list') as any;
    },

    umbra_wasm_friends_pending_requests: (direction: string) => {
      return call('friends_pending_requests', JSON.stringify({ direction })) as any;
    },

    umbra_wasm_friends_remove: (did: string) => {
      return call('friends_remove', JSON.stringify({ did })) as any;
    },

    umbra_wasm_friends_block: (did: string, reason?: string) => {
      callQuiet('friends_block', JSON.stringify({ did, reason: reason ?? null }));
    },

    umbra_wasm_friends_unblock: (did: string) => {
      return call('friends_unblock', JSON.stringify({ did })) as any;
    },

    umbra_wasm_friends_get_blocked: () => {
      return call('friends_get_blocked') as any;
    },

    umbra_wasm_friends_store_incoming: (json: string) => {
      callQuiet('friends_store_incoming', json);
    },

    umbra_wasm_friends_accept_from_relay: (json: string) => {
      return call('friends_accept_from_relay', json).catch(
        (e: unknown) => {
          console.warn('[tauri-backend] friends_accept_from_relay:', e);
          return JSON.stringify({ error: String(e) });
        }
      ) as any;
    },

    umbra_wasm_friends_build_accept_ack: (json: string) => {
      return call('friends_build_accept_ack', json) as any;
    },

    // ── Messaging (core) ───────────────────────────────────────────
    umbra_wasm_messaging_get_conversations: () => {
      return call('messaging_get_conversations') as any;
    },

    umbra_wasm_messaging_create_dm_conversation: (friendDid: string) => {
      return call('messaging_create_dm_conversation', JSON.stringify({ friend_did: friendDid })) as any;
    },

    umbra_wasm_messaging_get_messages: (
      conversation_id: string,
      limit: number,
      offset: number
    ) => {
      return call('messaging_get_messages', JSON.stringify({ conversation_id, limit, offset })) as any;
    },

    umbra_wasm_messaging_send: (
      conversation_id: string,
      content: string,
      reply_to_id?: string
    ) => {
      return call('messaging_send', JSON.stringify({
        conversation_id,
        content,
        reply_to_id: reply_to_id ?? null,
      })) as any;
    },

    umbra_wasm_messaging_mark_read: (conversation_id: string) => {
      return call('messaging_mark_read', JSON.stringify({ conversation_id })) as any;
    },

    umbra_wasm_messaging_decrypt: (
      conversation_id: string,
      content_encrypted_b64: string,
      nonce_hex: string,
      sender_did: string,
      timestamp: number
    ) => {
      return call('messaging_decrypt', JSON.stringify({
        conversation_id,
        content_encrypted_b64,
        nonce_hex,
        sender_did,
        timestamp,
      })) as any;
    },

    umbra_wasm_messaging_store_incoming: (json: string) => {
      callQuiet('messaging_store_incoming', json);
    },

    umbra_wasm_messaging_build_typing_envelope: (json: string) => {
      return call('messaging_build_typing_envelope', json) as any;
    },

    umbra_wasm_messaging_build_receipt_envelope: (json: string) => {
      return call('messaging_build_receipt_envelope', json) as any;
    },

    // ── Messaging (extended — JSON args) ────────────────────────────
    umbra_wasm_messaging_edit: (json: string) => {
      return call('messaging_edit', json) as any;
    },

    umbra_wasm_messaging_delete: (json: string) => {
      return call('messaging_delete', json) as any;
    },

    umbra_wasm_messaging_pin: (json: string) => {
      return call('messaging_pin', json) as any;
    },

    umbra_wasm_messaging_unpin: (json: string) => {
      return call('messaging_unpin', json) as any;
    },

    umbra_wasm_messaging_add_reaction: (json: string) => {
      return call('messaging_add_reaction', json) as any;
    },

    umbra_wasm_messaging_remove_reaction: (json: string) => {
      return call('messaging_remove_reaction', json) as any;
    },

    umbra_wasm_messaging_forward: (json: string) => {
      return call('messaging_forward', json) as any;
    },

    umbra_wasm_messaging_get_thread: (json: string) => {
      return call('messaging_get_thread', json) as any;
    },

    umbra_wasm_messaging_reply_thread: (json: string) => {
      return call('messaging_reply_thread', json) as any;
    },

    umbra_wasm_messaging_get_pinned: (json: string) => {
      return call('messaging_get_pinned', json) as any;
    },

    // ── Groups ──────────────────────────────────────────────────────
    umbra_wasm_groups_create: (json: string) => {
      return call('groups_create', json) as any;
    },

    umbra_wasm_groups_get: (groupId: string) => {
      return call('groups_get', JSON.stringify({ group_id: groupId })) as any;
    },

    umbra_wasm_groups_list: () => {
      return call('groups_list') as any;
    },

    umbra_wasm_groups_update: (json: string) => {
      return call('groups_update', json) as any;
    },

    umbra_wasm_groups_delete: (groupId: string) => {
      return call('groups_delete', JSON.stringify({ group_id: groupId })) as any;
    },

    umbra_wasm_groups_add_member: (json: string) => {
      return call('groups_add_member', json) as any;
    },

    umbra_wasm_groups_remove_member: (json: string) => {
      return call('groups_remove_member', json) as any;
    },

    umbra_wasm_groups_get_members: (groupId: string) => {
      return call('groups_get_members', JSON.stringify({ group_id: groupId })) as any;
    },

    // ── Groups — Encryption ────────────────────────────────────────
    umbra_wasm_groups_generate_key: (groupId: string) => {
      return call('groups_generate_key', JSON.stringify({ group_id: groupId })) as any;
    },

    umbra_wasm_groups_rotate_key: (groupId: string) => {
      return call('groups_rotate_key', JSON.stringify({ group_id: groupId })) as any;
    },

    umbra_wasm_groups_import_key: (json: string) => {
      return call('groups_import_key', json) as any;
    },

    umbra_wasm_groups_encrypt_message: (json: string) => {
      return call('groups_encrypt_message', json) as any;
    },

    umbra_wasm_groups_decrypt_message: (json: string) => {
      return call('groups_decrypt_message', json) as any;
    },

    umbra_wasm_groups_encrypt_key_for_member: (json: string) => {
      return call('groups_encrypt_key_for_member', json) as any;
    },

    // ── Groups — Invitations ───────────────────────────────────────
    umbra_wasm_groups_store_invite: (json: string) => {
      return call('groups_store_invite', json) as any;
    },

    umbra_wasm_groups_get_pending_invites: () => {
      return call('groups_get_pending_invites') as any;
    },

    umbra_wasm_groups_accept_invite: (inviteId: string) => {
      return call('groups_accept_invite', JSON.stringify({ invite_id: inviteId })) as any;
    },

    umbra_wasm_groups_decline_invite: (inviteId: string) => {
      return call('groups_decline_invite', JSON.stringify({ invite_id: inviteId })) as any;
    },

    // ── Messaging — Delivery status ────────────────────────────────
    umbra_wasm_messaging_update_status: (json: string) => {
      return call('messaging_update_status', json) as any;
    },

    // ── Network ────────────────────────────────────────────────────
    // Network commands stay as dedicated Tauri commands because they
    // manage Tauri-side state (WebRTC, relay WebSocket connections).
    umbra_wasm_network_status: () => {
      return invoke('network_status').then(ensureJsonString) as any;
    },

    umbra_wasm_network_start: () => {
      return invoke('start_network') as Promise<boolean>;
    },

    umbra_wasm_network_stop: () => {
      return invoke('stop_network') as Promise<boolean>;
    },

    umbra_wasm_network_create_offer: () => {
      return invoke('create_offer').then(ensureJsonString) as Promise<string>;
    },

    umbra_wasm_network_accept_offer: (offer_json: string) => {
      return invoke('accept_offer', { offerJson: offer_json })
        .then(ensureJsonString) as Promise<string>;
    },

    umbra_wasm_network_complete_handshake: (answer_json: string) => {
      return invoke('complete_handshake', {
        answerJson: answer_json,
      }) as Promise<boolean>;
    },

    umbra_wasm_network_complete_answerer: (
      offerer_did?: string,
      offerer_peer_id?: string
    ) => {
      return invoke('complete_answerer', {
        offererDid: offerer_did ?? null,
        offererPeerId: offerer_peer_id ?? null,
      }) as Promise<boolean>;
    },

    // ── Relay ──────────────────────────────────────────────────────
    // Relay commands stay as dedicated Tauri commands (WebSocket state)
    umbra_wasm_relay_connect: (relay_url: string) => {
      return invoke('relay_connect', { relayUrl: relay_url })
        .then(ensureJsonString) as Promise<string>;
    },

    umbra_wasm_relay_disconnect: () => {
      return invoke('relay_disconnect') as Promise<void>;
    },

    umbra_wasm_relay_create_session: (relay_url: string) => {
      return invoke('relay_create_session', {
        relayUrl: relay_url,
      }).then(ensureJsonString) as Promise<string>;
    },

    umbra_wasm_relay_accept_session: (
      session_id: string,
      offer_payload: string
    ) => {
      return invoke('relay_accept_session', {
        sessionId: session_id,
        offerPayload: offer_payload,
      }).then(ensureJsonString) as Promise<string>;
    },

    umbra_wasm_relay_send: (to_did: string, payload: string) => {
      return invoke('relay_send', {
        toDid: to_did,
        payload,
      }).then(ensureJsonString) as Promise<string>;
    },

    umbra_wasm_relay_fetch_offline: () => {
      return invoke('relay_fetch_offline').then(ensureJsonString) as Promise<string>;
    },

    // ── Calls ──────────────────────────────────────────────────────
    umbra_wasm_calls_store: (json: string) => {
      return call('calls_store', json) as any;
    },

    umbra_wasm_calls_end: (json: string) => {
      return call('calls_end', json) as any;
    },

    umbra_wasm_calls_get_history: (json: string) => {
      return call('calls_get_history', json) as any;
    },

    umbra_wasm_calls_get_all_history: (json: string) => {
      return call('calls_get_all_history', json) as any;
    },

    // ── Notifications ───────────────────────────────────────────────
    umbra_wasm_notifications_create: (json: string) => {
      return call('notifications_create', json) as any;
    },
    umbra_wasm_notifications_get: (json: string) => {
      return call('notifications_get', json) as any;
    },
    umbra_wasm_notifications_mark_read: (json: string) => {
      return call('notifications_mark_read', json) as any;
    },
    umbra_wasm_notifications_mark_all_read: (json: string) => {
      return call('notifications_mark_all_read', json) as any;
    },
    umbra_wasm_notifications_dismiss: (json: string) => {
      return call('notifications_dismiss', json) as any;
    },
    umbra_wasm_notifications_unread_counts: (json: string) => {
      return call('notifications_unread_counts', json) as any;
    },

    // ── Events ─────────────────────────────────────────────────────
    umbra_wasm_subscribe_events: (callback: (event_json: string) => void) => {
      // TODO: Wire up Tauri event system (tauri::Emitter / listen)
      console.debug('[tauri-backend] subscribe_events registered');
    },

    // ── Crypto ─────────────────────────────────────────────────────
    // Sign/verify stay as dedicated Tauri commands because they pass
    // Uint8Array which needs special serialization (Array.from).
    umbra_wasm_crypto_sign: (data: Uint8Array) => {
      return invoke('sign', { data: Array.from(data) }) as any;
    },

    umbra_wasm_crypto_verify: (
      public_key_hex: string,
      data: Uint8Array,
      signature: Uint8Array
    ) => {
      return invoke('verify', {
        publicKeyHex: public_key_hex,
        data: Array.from(data),
        signature: Array.from(signature),
      }) as any;
    },

    umbra_wasm_crypto_encrypt_for_peer: (json: string) => {
      return call('crypto_encrypt_for_peer', json) as any;
    },

    umbra_wasm_crypto_decrypt_from_peer: (json: string) => {
      return call('crypto_decrypt_from_peer', json) as any;
    },

    // ── Plugin KV Storage ──────────────────────────────────────────
    umbra_wasm_plugin_kv_get: (pluginId: string, key: string) => {
      return call('plugin_kv_get', JSON.stringify({ plugin_id: pluginId, key })) as any;
    },

    umbra_wasm_plugin_kv_set: (pluginId: string, key: string, value: string) => {
      return call('plugin_kv_set', JSON.stringify({ plugin_id: pluginId, key, value })) as any;
    },

    umbra_wasm_plugin_kv_delete: (pluginId: string, key: string) => {
      return call('plugin_kv_delete', JSON.stringify({ plugin_id: pluginId, key })) as any;
    },

    umbra_wasm_plugin_kv_list: (pluginId: string, prefix: string) => {
      return call('plugin_kv_list', JSON.stringify({ plugin_id: pluginId, prefix })) as any;
    },

    // ── Plugin Bundle Storage ──────────────────────────────────────
    umbra_wasm_plugin_bundle_save: (pluginId: string, manifest: string, bundle: string) => {
      return call('plugin_bundle_save', JSON.stringify({ plugin_id: pluginId, manifest, bundle })) as any;
    },

    umbra_wasm_plugin_bundle_load: (pluginId: string) => {
      return call('plugin_bundle_load', JSON.stringify({ plugin_id: pluginId })) as any;
    },

    umbra_wasm_plugin_bundle_delete: (pluginId: string) => {
      return call('plugin_bundle_delete', JSON.stringify({ plugin_id: pluginId })) as any;
    },

    umbra_wasm_plugin_bundle_list: () => {
      return call('plugin_bundle_list') as any;
    },

    // ── Community — Core ────────────────────────────────────────────
    umbra_wasm_community_create: (json: string) => {
      return call('community_create', json) as any;
    },
    umbra_wasm_community_find_by_origin: (originId: string) => {
      return call('community_find_by_origin', JSON.stringify({ origin_id: originId })) as any;
    },
    umbra_wasm_community_get: (communityId: string) => {
      return call('community_get', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_get_mine: (memberDid: string) => {
      return call('community_get_mine', JSON.stringify({ member_did: memberDid })) as any;
    },
    umbra_wasm_community_update: (json: string) => {
      return call('community_update', json) as any;
    },
    umbra_wasm_community_delete: (json: string) => {
      return call('community_delete', json) as any;
    },
    umbra_wasm_community_transfer_ownership: (json: string) => {
      return call('community_transfer_ownership', json) as any;
    },
    umbra_wasm_community_update_branding: (json: string) => {
      return call('community_update_branding', json) as any;
    },

    // ── Community — Spaces ──────────────────────────────────────────
    umbra_wasm_community_space_create: (json: string) => {
      return call('community_space_create', json) as any;
    },
    umbra_wasm_community_space_list: (communityId: string) => {
      return call('community_space_list', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_space_update: (json: string) => {
      return call('community_space_update', json) as any;
    },
    umbra_wasm_community_space_reorder: (json: string) => {
      return call('community_space_reorder', json) as any;
    },
    umbra_wasm_community_space_delete: (json: string) => {
      return call('community_space_delete', json) as any;
    },

    // ── Community — Categories ──────────────────────────────────────
    umbra_wasm_community_category_create: (json: string) => {
      return call('community_category_create', json) as any;
    },
    umbra_wasm_community_category_list: (spaceId: string) => {
      return call('community_category_list', JSON.stringify({ space_id: spaceId })) as any;
    },
    umbra_wasm_community_category_list_all: (communityId: string) => {
      return call('community_category_list_all', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_category_update: (json: string) => {
      return call('community_category_update', json) as any;
    },
    umbra_wasm_community_category_reorder: (json: string) => {
      return call('community_category_reorder', json) as any;
    },
    umbra_wasm_community_category_delete: (json: string) => {
      return call('community_category_delete', json) as any;
    },
    umbra_wasm_community_channel_move_category: (json: string) => {
      return call('community_channel_move_category', json) as any;
    },

    // ── Community — Channels ────────────────────────────────────────
    umbra_wasm_community_channel_create: (json: string) => {
      return call('community_channel_create', json) as any;
    },
    umbra_wasm_community_channel_list: (spaceId: string) => {
      return call('community_channel_list', JSON.stringify({ space_id: spaceId })) as any;
    },
    umbra_wasm_community_channel_list_all: (communityId: string) => {
      return call('community_channel_list_all', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_channel_get: (channelId: string) => {
      return call('community_channel_get', JSON.stringify({ channel_id: channelId })) as any;
    },
    umbra_wasm_community_channel_update: (json: string) => {
      return call('community_channel_update', json) as any;
    },
    umbra_wasm_community_channel_set_slow_mode: (json: string) => {
      return call('community_channel_set_slow_mode', json) as any;
    },
    umbra_wasm_community_channel_set_e2ee: (json: string) => {
      return call('community_channel_set_e2ee', json) as any;
    },
    umbra_wasm_community_channel_delete: (json: string) => {
      return call('community_channel_delete', json) as any;
    },
    umbra_wasm_community_channel_reorder: (json: string) => {
      return call('community_channel_reorder', json) as any;
    },

    // ── Community — Members ─────────────────────────────────────────
    umbra_wasm_community_join: (json: string) => {
      return call('community_join', json) as any;
    },
    umbra_wasm_community_leave: (json: string) => {
      return call('community_leave', json) as any;
    },
    umbra_wasm_community_kick: (json: string) => {
      return call('community_kick', json) as any;
    },
    umbra_wasm_community_ban: (json: string) => {
      return call('community_ban', json) as any;
    },
    umbra_wasm_community_unban: (json: string) => {
      return call('community_unban', json) as any;
    },
    umbra_wasm_community_member_list: (communityId: string) => {
      return call('community_member_list', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_member_get: (communityId: string, memberDid: string) => {
      return call('community_member_get', JSON.stringify({ community_id: communityId, member_did: memberDid })) as any;
    },
    umbra_wasm_community_member_update_profile: (json: string) => {
      return call('community_member_update_profile', json) as any;
    },
    umbra_wasm_community_ban_list: (communityId: string) => {
      return call('community_ban_list', JSON.stringify({ community_id: communityId })) as any;
    },

    // ── Community — Roles ───────────────────────────────────────────
    umbra_wasm_community_role_list: (communityId: string) => {
      return call('community_role_list', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_member_roles: (communityId: string, memberDid: string) => {
      return call('community_member_roles', JSON.stringify({ community_id: communityId, member_did: memberDid })) as any;
    },
    umbra_wasm_community_role_assign: (json: string) => {
      return call('community_role_assign', json) as any;
    },
    umbra_wasm_community_role_unassign: (json: string) => {
      return call('community_role_unassign', json) as any;
    },
    umbra_wasm_community_custom_role_create: (json: string) => {
      return call('community_custom_role_create', json) as any;
    },
    umbra_wasm_community_role_update: (json: string) => {
      return call('community_role_update', json) as any;
    },
    umbra_wasm_community_role_update_permissions: (json: string) => {
      return call('community_role_update_permissions', json) as any;
    },
    umbra_wasm_community_role_delete: (json: string) => {
      return call('community_role_delete', json) as any;
    },

    // ── Community — Invites ─────────────────────────────────────────
    umbra_wasm_community_invite_create: (json: string) => {
      return call('community_invite_create', json) as any;
    },
    umbra_wasm_community_invite_use: (json: string) => {
      return call('community_invite_use', json) as any;
    },
    umbra_wasm_community_invite_list: (communityId: string) => {
      return call('community_invite_list', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_invite_delete: (json: string) => {
      return call('community_invite_delete', json) as any;
    },
    umbra_wasm_community_invite_set_vanity: (json: string) => {
      return call('community_invite_set_vanity', json) as any;
    },

    // ── Community — Messages ────────────────────────────────────────
    umbra_wasm_community_message_send: (json: string) => {
      return call('community_message_send', json) as any;
    },
    umbra_wasm_community_message_store_received: (json: string) => {
      return call('community_message_store_received', json) as any;
    },
    umbra_wasm_community_message_list: (json: string) => {
      return call('community_message_list', json) as any;
    },
    umbra_wasm_community_message_get: (messageId: string) => {
      return call('community_message_get', JSON.stringify({ message_id: messageId })) as any;
    },
    umbra_wasm_community_message_edit: (json: string) => {
      return call('community_message_edit', json) as any;
    },
    umbra_wasm_community_message_delete: (messageId: string) => {
      return call('community_message_delete', JSON.stringify({ message_id: messageId })) as any;
    },

    // ── Community — Reactions ───────────────────────────────────────
    umbra_wasm_community_reaction_add: (json: string) => {
      return call('community_reaction_add', json) as any;
    },
    umbra_wasm_community_reaction_remove: (json: string) => {
      return call('community_reaction_remove', json) as any;
    },
    umbra_wasm_community_reaction_list: (messageId: string) => {
      return call('community_reaction_list', JSON.stringify({ message_id: messageId })) as any;
    },

    // ── Community — Emoji ───────────────────────────────────────────
    umbra_wasm_community_emoji_create: (json: string) => {
      return call('community_emoji_create', json) as any;
    },
    umbra_wasm_community_emoji_list: (communityId: string) => {
      return call('community_emoji_list', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_emoji_delete: (json: string) => {
      return call('community_emoji_delete', json) as any;
    },
    umbra_wasm_community_emoji_rename: (json: string) => {
      return call('community_emoji_rename', json) as any;
    },

    // ── Community — Stickers ─────────────────────────────────────────
    umbra_wasm_community_sticker_create: (json: string) => {
      return call('community_sticker_create', json) as any;
    },
    umbra_wasm_community_sticker_list: (communityId: string) => {
      return call('community_sticker_list', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_sticker_delete: (stickerId: string) => {
      return call('community_sticker_delete', JSON.stringify({ sticker_id: stickerId })) as any;
    },

    // ── Community — Sticker Packs ─────────────────────────────────────
    umbra_wasm_community_sticker_pack_create: (json: string) => {
      return call('community_sticker_pack_create', json) as any;
    },
    umbra_wasm_community_sticker_pack_list: (communityId: string) => {
      return call('community_sticker_pack_list', JSON.stringify({ community_id: communityId })) as any;
    },
    umbra_wasm_community_sticker_pack_delete: (packId: string) => {
      return call('community_sticker_pack_delete', JSON.stringify({ pack_id: packId })) as any;
    },
    umbra_wasm_community_sticker_pack_rename: (json: string) => {
      return call('community_sticker_pack_rename', json) as any;
    },

    // ── Community — Pins ────────────────────────────────────────────
    umbra_wasm_community_pin_message: (json: string) => {
      return call('community_pin_message', json) as any;
    },
    umbra_wasm_community_unpin_message: (json: string) => {
      return call('community_unpin_message', json) as any;
    },
    umbra_wasm_community_pin_list: (channelId: string) => {
      return call('community_pin_list', JSON.stringify({ channel_id: channelId })) as any;
    },

    // ── Community — Threads ─────────────────────────────────────────
    umbra_wasm_community_thread_create: (json: string) => {
      return call('community_thread_create', json) as any;
    },
    umbra_wasm_community_thread_get: (threadId: string) => {
      return call('community_thread_get', JSON.stringify({ thread_id: threadId })) as any;
    },
    umbra_wasm_community_thread_list: (channelId: string) => {
      return call('community_thread_list', JSON.stringify({ channel_id: channelId })) as any;
    },
    umbra_wasm_community_thread_messages: (json: string) => {
      return call('community_thread_messages', json) as any;
    },

    // ── Community — Read Receipts ───────────────────────────────────
    umbra_wasm_community_mark_read: (json: string) => {
      return call('community_mark_read', json) as any;
    },

    // ── Community — Files ──────────────────────────────────────────
    umbra_wasm_community_upload_file: (json: string) => {
      return call('community_upload_file', json) as any;
    },
    umbra_wasm_community_get_files: (json: string) => {
      return call('community_get_files', json) as any;
    },
    umbra_wasm_community_get_file: (json: string) => {
      return call('community_get_file', json) as any;
    },
    umbra_wasm_community_delete_file: (json: string) => {
      return call('community_delete_file', json) as any;
    },
    umbra_wasm_community_record_file_download: (json: string) => {
      return call('community_record_file_download', json) as any;
    },
    umbra_wasm_community_create_folder: (json: string) => {
      return call('community_create_folder', json) as any;
    },
    umbra_wasm_community_get_folders: (json: string) => {
      return call('community_get_folders', json) as any;
    },
    umbra_wasm_community_delete_folder: (json: string) => {
      return call('community_delete_folder', json) as any;
    },

    // ── DM — Files ────────────────────────────────────────────────
    umbra_wasm_dm_upload_file: (json: string) => {
      return call('dm_upload_file', json) as any;
    },
    umbra_wasm_dm_get_files: (json: string) => {
      return call('dm_get_files', json) as any;
    },
    umbra_wasm_dm_get_file: (json: string) => {
      return call('dm_get_file', json) as any;
    },
    umbra_wasm_dm_delete_file: (json: string) => {
      return call('dm_delete_file', json) as any;
    },
    umbra_wasm_dm_record_file_download: (json: string) => {
      return call('dm_record_file_download', json) as any;
    },
    umbra_wasm_dm_move_file: (json: string) => {
      return call('dm_move_file', json) as any;
    },
    umbra_wasm_dm_create_folder: (json: string) => {
      return call('dm_create_folder', json) as any;
    },
    umbra_wasm_dm_get_folders: (json: string) => {
      return call('dm_get_folders', json) as any;
    },
    umbra_wasm_dm_delete_folder: (json: string) => {
      return call('dm_delete_folder', json) as any;
    },
    umbra_wasm_dm_rename_folder: (json: string) => {
      return call('dm_rename_folder', json) as any;
    },

    // ── Groups — Relay envelope builders ────────────────────────
    umbra_wasm_groups_send_invite: (json: string) => {
      return call('groups_send_invite', json) as any;
    },
    umbra_wasm_groups_build_invite_accept_envelope: (json: string) => {
      return call('groups_build_invite_accept_envelope', json) as any;
    },
    umbra_wasm_groups_build_invite_decline_envelope: (json: string) => {
      return call('groups_build_invite_decline_envelope', json) as any;
    },
    umbra_wasm_groups_send_message: (json: string) => {
      return call('groups_send_message', json) as any;
    },
    umbra_wasm_groups_remove_member_with_rotation: (json: string) => {
      return call('groups_remove_member_with_rotation', json) as any;
    },

    // ── Relay envelope builders ───────────────────────────────────
    umbra_wasm_community_build_event_relay_batch: (json: string) => {
      return call('community_build_event_relay_batch', json) as any;
    },
    umbra_wasm_build_dm_file_event_envelope: (json: string) => {
      return call('build_dm_file_event_envelope', json) as any;
    },
    umbra_wasm_build_metadata_envelope: (json: string) => {
      return call('build_metadata_envelope', json) as any;
    },

    // ── File Chunking ─────────────────────────────────────────────
    umbra_wasm_chunk_file: (json: string) => {
      return call('chunk_file', json) as any;
    },
    umbra_wasm_reassemble_file: (json: string) => {
      return call('reassemble_file', json) as any;
    },
    umbra_wasm_get_file_manifest: (json: string) => {
      return call('get_file_manifest', json) as any;
    },

    // ── File Transfer ───────────────────────────────────────────────
    umbra_wasm_transfer_initiate: (json: string) => {
      return call('transfer_initiate', json) as any;
    },
    umbra_wasm_transfer_accept: (json: string) => {
      return call('transfer_accept', json) as any;
    },
    umbra_wasm_transfer_pause: (transfer_id: string) => {
      return call('transfer_pause', JSON.stringify({ transfer_id })) as any;
    },
    umbra_wasm_transfer_resume: (transfer_id: string) => {
      return call('transfer_resume', JSON.stringify({ transfer_id })) as any;
    },
    umbra_wasm_transfer_cancel: (json: string) => {
      return call('transfer_cancel', json) as any;
    },
    umbra_wasm_transfer_on_message: (json: string) => {
      return call('transfer_on_message', json) as any;
    },
    umbra_wasm_transfer_list: () => {
      return call('transfer_list') as any;
    },
    umbra_wasm_transfer_get: (transfer_id: string) => {
      return call('transfer_get', JSON.stringify({ transfer_id })) as any;
    },
    umbra_wasm_transfer_get_incomplete: () => {
      return call('transfer_get_incomplete') as any;
    },
    umbra_wasm_transfer_chunks_to_send: (transfer_id: string) => {
      return call('transfer_chunks_to_send', JSON.stringify({ transfer_id })) as any;
    },
    umbra_wasm_transfer_mark_chunk_sent: (json: string) => {
      return call('transfer_mark_chunk_sent', json) as any;
    },

    // ── DHT — Content Discovery ────────────────────────────────────────
    umbra_wasm_dht_start_providing: (json: string) => {
      return call('dht_start_providing', json) as any;
    },
    umbra_wasm_dht_get_providers: (json: string) => {
      return call('dht_get_providers', json) as any;
    },
    umbra_wasm_dht_stop_providing: (json: string) => {
      return call('dht_stop_providing', json) as any;
    },

    // ── File Encryption (E2EE) ────────────────────────────────────────
    umbra_wasm_file_derive_key: (json: string) => {
      return call('file_derive_key', json) as any;
    },
    umbra_wasm_file_encrypt_chunk: (json: string) => {
      return call('file_encrypt_chunk', json) as any;
    },
    umbra_wasm_file_decrypt_chunk: (json: string) => {
      return call('file_decrypt_chunk', json) as any;
    },
    umbra_wasm_channel_file_derive_key: (json: string) => {
      return call('channel_file_derive_key', json) as any;
    },
    umbra_wasm_compute_key_fingerprint: (json: string) => {
      return call('compute_key_fingerprint', json) as any;
    },
    umbra_wasm_verify_key_fingerprint: (json: string) => {
      return call('verify_key_fingerprint', json) as any;
    },
    umbra_wasm_mark_files_for_reencryption: (json: string) => {
      return call('mark_files_for_reencryption', json) as any;
    },
    umbra_wasm_get_files_needing_reencryption: (json: string) => {
      return call('get_files_needing_reencryption', json) as any;
    },
    umbra_wasm_clear_reencryption_flag: (json: string) => {
      return call('clear_reencryption_flag', json) as any;
    },

    // ── Community Seats (Ghost Member Placeholders) ────────────────────
    umbra_wasm_community_seat_list: (community_id: string) => {
      return call('community_seat_list', JSON.stringify({ community_id })) as any;
    },
    umbra_wasm_community_seat_list_unclaimed: (community_id: string) => {
      return call('community_seat_list_unclaimed', JSON.stringify({ community_id })) as any;
    },
    umbra_wasm_community_seat_find_match: (json: string) => {
      return call('community_seat_find_match', json) as any;
    },
    umbra_wasm_community_seat_claim: (json: string) => {
      return call('community_seat_claim', json) as any;
    },
    umbra_wasm_community_seat_delete: (json: string) => {
      return call('community_seat_delete', json) as any;
    },
    umbra_wasm_community_seat_create_batch: (json: string) => {
      return call('community_seat_create_batch', json) as any;
    },
    umbra_wasm_community_seat_count: (community_id: string) => {
      return call('community_seat_count', JSON.stringify({ community_id })) as any;
    },

    // ── Community Audit Log ─────────────────────────────────────────────
    umbra_wasm_community_audit_log_create_batch: (json: string) => {
      return call('community_audit_log_create_batch', json) as any;
    },
    umbra_wasm_community_audit_log_list: (json: string) => {
      return call('community_audit_log_list', json) as any;
    },
  };
}
