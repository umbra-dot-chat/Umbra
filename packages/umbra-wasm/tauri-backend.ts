/**
 * Tauri Backend Adapter
 *
 * Implements the same UmbraWasmModule interface as the WASM loader,
 * but routes all calls through Tauri IPC (`invoke()`) to the native
 * Rust backend instead of wasm-bindgen.
 *
 * This allows the same service layer and hooks to work seamlessly
 * on both web (WASM) and desktop (Tauri native).
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
  return {
    // ── Initialization ─────────────────────────────────────────────
    umbra_wasm_init: () => {
      // Tracing is set up in the Rust backend automatically on startup
      invoke('init').catch((e: unknown) =>
        console.warn('[tauri-backend] init:', e)
      );
    },

    umbra_wasm_init_database: async () => {
      return invoke('init_database') as Promise<boolean>;
    },

    umbra_wasm_version: () => {
      // Sync in the interface — return placeholder; real version
      // is logged by the Rust backend at startup
      return '0.1.0 (desktop)';
    },

    // ── Identity ───────────────────────────────────────────────────
    umbra_wasm_identity_create: (display_name: string) => {
      return invoke('create_identity', { displayName: display_name })
        .then(ensureJsonString) as any;
    },

    umbra_wasm_identity_restore: (recovery_phrase: string, display_name: string) => {
      return invoke('restore_identity', {
        recoveryPhrase: recovery_phrase,
        displayName: display_name,
      }).then(ensureJsonString) as any;
    },

    umbra_wasm_identity_set: (json: string) => {
      // Return the promise so callers can await hydration completing
      return invoke('set_identity', { json }).catch((e: unknown) =>
        console.warn('[tauri-backend] set_identity:', e)
      ) as any;
    },

    umbra_wasm_identity_get_did: () => {
      return invoke('get_did').then(ensureJsonString) as any;
    },

    umbra_wasm_identity_get_profile: () => {
      return invoke('get_profile').then(ensureJsonString) as any;
    },

    umbra_wasm_identity_update_profile: (json: string) => {
      invoke('update_profile', { json }).catch((e: unknown) =>
        console.warn('[tauri-backend] update_profile:', e)
      );
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
      return invoke('send_friend_request', {
        did,
        message: message ?? null,
      }).then(ensureJsonString) as any;
    },

    umbra_wasm_friends_accept_request: (request_id: string) => {
      return invoke('accept_friend_request', { requestId: request_id })
        .then(ensureJsonString) as any;
    },

    umbra_wasm_friends_reject_request: (request_id: string) => {
      invoke('reject_friend_request', { requestId: request_id }).catch(
        (e: unknown) => console.warn('[tauri-backend] reject_friend_request:', e)
      );
    },

    umbra_wasm_friends_list: () => {
      return invoke('list_friends').then(ensureJsonString) as any;
    },

    umbra_wasm_friends_pending_requests: (direction: string) => {
      return invoke('pending_requests', { direction }).then(ensureJsonString) as any;
    },

    umbra_wasm_friends_remove: (did: string) => {
      return invoke('remove_friend', { did }) as any;
    },

    umbra_wasm_friends_block: (did: string, reason?: string) => {
      invoke('block_user', { did, reason: reason ?? null }).catch(
        (e: unknown) => console.warn('[tauri-backend] block_user:', e)
      );
    },

    umbra_wasm_friends_unblock: (did: string) => {
      return invoke('unblock_user', { did }) as any;
    },

    umbra_wasm_friends_store_incoming: (json: string) => {
      invoke('store_incoming_friend_request', { json }).catch(
        (e: unknown) => console.warn('[tauri-backend] store_incoming_friend_request:', e)
      );
    },

    umbra_wasm_friends_accept_from_relay: (json: string) => {
      return invoke('accept_friend_from_relay', { json }).then(ensureJsonString).catch(
        (e: unknown) => {
          console.warn('[tauri-backend] accept_friend_from_relay:', e);
          return JSON.stringify({ error: String(e) });
        }
      ) as any;
    },

    // ── Messaging (core) ───────────────────────────────────────────
    umbra_wasm_messaging_get_conversations: () => {
      return invoke('get_conversations').then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_create_dm_conversation: (friendDid: string) => {
      return invoke('create_dm_conversation', { friendDid }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_get_messages: (
      conversation_id: string,
      limit: number,
      offset: number
    ) => {
      return invoke('get_messages', {
        conversationId: conversation_id,
        limit,
        offset,
      }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_send: (
      conversation_id: string,
      content: string,
      reply_to_id?: string
    ) => {
      return invoke('send_message', {
        conversationId: conversation_id,
        content,
        replyToId: reply_to_id ?? null,
      }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_mark_read: (conversation_id: string) => {
      return invoke('mark_read', {
        conversationId: conversation_id,
      }) as any;
    },

    umbra_wasm_messaging_decrypt: (
      conversation_id: string,
      content_encrypted_b64: string,
      nonce_hex: string,
      sender_did: string,
      timestamp: number
    ) => {
      return invoke('decrypt_message', {
        conversationId: conversation_id,
        contentEncryptedB64: content_encrypted_b64,
        nonceHex: nonce_hex,
        senderDid: sender_did,
        timestamp,
      }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_store_incoming: (json: string) => {
      invoke('store_incoming_message', { json }).catch(
        (e: unknown) => console.warn('[tauri-backend] store_incoming_message:', e)
      );
    },

    // ── Messaging (extended — JSON args) ────────────────────────────
    umbra_wasm_messaging_edit: (json: string) => {
      return invoke('edit_message', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_delete: (json: string) => {
      return invoke('delete_message', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_pin: (json: string) => {
      return invoke('pin_message', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_unpin: (json: string) => {
      return invoke('unpin_message', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_add_reaction: (json: string) => {
      return invoke('add_reaction', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_remove_reaction: (json: string) => {
      return invoke('remove_reaction', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_forward: (json: string) => {
      return invoke('forward_message', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_get_thread: (json: string) => {
      return invoke('get_thread', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_reply_thread: (json: string) => {
      return invoke('reply_thread', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_messaging_get_pinned: (json: string) => {
      return invoke('get_pinned', { json }).then(ensureJsonString) as any;
    },

    // ── Groups ──────────────────────────────────────────────────────
    umbra_wasm_groups_create: (json: string) => {
      return invoke('groups_create', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_get: (groupId: string) => {
      return invoke('groups_get', { groupId }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_list: () => {
      return invoke('groups_list').then(ensureJsonString) as any;
    },

    umbra_wasm_groups_update: (json: string) => {
      return invoke('groups_update', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_delete: (groupId: string) => {
      return invoke('groups_delete', { groupId }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_add_member: (json: string) => {
      return invoke('groups_add_member', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_remove_member: (json: string) => {
      return invoke('groups_remove_member', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_get_members: (groupId: string) => {
      return invoke('groups_get_members', { groupId }).then(ensureJsonString) as any;
    },

    // ── Groups — Encryption ────────────────────────────────────────
    umbra_wasm_groups_generate_key: (groupId: string) => {
      return invoke('groups_generate_key', { groupId }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_rotate_key: (groupId: string) => {
      return invoke('groups_rotate_key', { groupId }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_import_key: (json: string) => {
      return invoke('groups_import_key', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_encrypt_message: (json: string) => {
      return invoke('groups_encrypt_message', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_decrypt_message: (json: string) => {
      return invoke('groups_decrypt_message', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_encrypt_key_for_member: (json: string) => {
      return invoke('groups_encrypt_key_for_member', { json }).then(ensureJsonString) as any;
    },

    // ── Groups — Invitations ───────────────────────────────────────
    umbra_wasm_groups_store_invite: (json: string) => {
      return invoke('groups_store_invite', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_get_pending_invites: () => {
      return invoke('groups_get_pending_invites').then(ensureJsonString) as any;
    },

    umbra_wasm_groups_accept_invite: (inviteId: string) => {
      return invoke('groups_accept_invite', { inviteId }).then(ensureJsonString) as any;
    },

    umbra_wasm_groups_decline_invite: (inviteId: string) => {
      return invoke('groups_decline_invite', { inviteId }).then(ensureJsonString) as any;
    },

    // ── Messaging — Delivery status ────────────────────────────────
    umbra_wasm_messaging_update_status: (json: string) => {
      return invoke('messaging_update_status', { json }).then(ensureJsonString) as any;
    },

    // ── Network ────────────────────────────────────────────────────
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
      return invoke('calls_store', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_calls_end: (json: string) => {
      return invoke('calls_end', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_calls_get_history: (json: string) => {
      return invoke('calls_get_history', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_calls_get_all_history: (json: string) => {
      return invoke('calls_get_all_history', { json }).then(ensureJsonString) as any;
    },

    // ── Events ─────────────────────────────────────────────────────
    umbra_wasm_subscribe_events: (callback: (event_json: string) => void) => {
      // TODO: Wire up Tauri event system (tauri::Emitter / listen)
      // For now, store the callback for when events are implemented
      console.debug('[tauri-backend] subscribe_events registered');
    },

    // ── Crypto ─────────────────────────────────────────────────────
    umbra_wasm_crypto_sign: (data: Uint8Array) => {
      // Tauri IPC serializes as JSON, so convert Uint8Array → number[]
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
      return invoke('crypto_encrypt_for_peer', { json }).then(ensureJsonString) as any;
    },

    umbra_wasm_crypto_decrypt_from_peer: (json: string) => {
      return invoke('crypto_decrypt_from_peer', { json }).then(ensureJsonString) as any;
    },

    // ── Plugin KV Storage (via Tauri IPC) ──────────────────────────
    umbra_wasm_plugin_kv_get: (pluginId: string, key: string) => {
      return invoke('plugin_kv_get', { pluginId, key }).then(ensureJsonString) as any;
    },

    umbra_wasm_plugin_kv_set: (pluginId: string, key: string, value: string) => {
      return invoke('plugin_kv_set', { pluginId, key, value }).then(ensureJsonString) as any;
    },

    umbra_wasm_plugin_kv_delete: (pluginId: string, key: string) => {
      return invoke('plugin_kv_delete', { pluginId, key }).then(ensureJsonString) as any;
    },

    umbra_wasm_plugin_kv_list: (pluginId: string, prefix: string) => {
      return invoke('plugin_kv_list', { pluginId, prefix }).then(ensureJsonString) as any;
    },

    // ── Plugin Bundle Storage (via Tauri IPC) ──────────────────────
    umbra_wasm_plugin_bundle_save: (pluginId: string, manifest: string, bundle: string) => {
      return invoke('plugin_bundle_save', { pluginId, manifest, bundle }).then(ensureJsonString) as any;
    },

    umbra_wasm_plugin_bundle_load: (pluginId: string) => {
      return invoke('plugin_bundle_load', { pluginId }).then(ensureJsonString) as any;
    },

    umbra_wasm_plugin_bundle_delete: (pluginId: string) => {
      return invoke('plugin_bundle_delete', { pluginId }).then(ensureJsonString) as any;
    },

    umbra_wasm_plugin_bundle_list: () => {
      return invoke('plugin_bundle_list').then(ensureJsonString) as any;
    },
  };
}
