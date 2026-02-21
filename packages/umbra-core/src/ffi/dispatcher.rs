//! # FFI Dispatcher
//!
//! Generic JSON-RPC style dispatcher that routes method names to Rust service calls.
//! Called from `umbra_call(method, args)` in c_api.rs.
//!
//! Handler implementations live in domain sub-modules:
//!   - `dispatch_identity`  — identity_* methods
//!   - `dispatch_friends`   — friends_* methods
//!   - `dispatch_messaging` — messaging_* methods (DM)
//!   - `dispatch_groups`    — groups_* methods (CRUD, encryption, invitations)
//!   - `dispatch_stubs`     — 501 placeholders (network, crypto, transfers, etc.)
//!
//! Returns `Ok(json_string)` on success, `Err((error_code, message))` on failure.

use base64::Engine as _;
use sha2::{Sha256, Digest};

use super::state::get_state;
use crate::community::CommunityService;

pub type DResult = Result<String, (i32, String)>;

// ============================================================================
// HELPERS  (pub(super) so domain modules can use them)
// ============================================================================

pub fn err(code: i32, msg: impl ToString) -> (i32, String) {
    (code, msg.to_string())
}

pub fn json_parse(args: &str) -> Result<serde_json::Value, (i32, String)> {
    serde_json::from_str(args).map_err(|e| err(1, format!("Invalid JSON: {}", e)))
}

pub fn require_str<'a>(data: &'a serde_json::Value, field: &str) -> Result<&'a str, (i32, String)> {
    data[field].as_str().ok_or_else(|| err(2, format!("Missing {}", field)))
}

pub fn ok_json(v: serde_json::Value) -> DResult {
    Ok(v.to_string())
}

pub fn ok_success() -> DResult {
    Ok(r#"{"success":true}"#.to_string())
}

pub fn deterministic_conversation_id(did_a: &str, did_b: &str) -> String {
    let mut dids = [did_a, did_b];
    dids.sort();
    let input = format!("{}|{}", dids[0], dids[1]);
    let hash = Sha256::digest(input.as_bytes());
    format!("{:x}", hash)
}

pub fn community_service() -> Result<CommunityService, (i32, String)> {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    Ok(CommunityService::new(db.clone()))
}

pub fn dm_file_service() -> Result<crate::messaging::files::DmFileService, (i32, String)> {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    Ok(crate::messaging::files::DmFileService::new(db.clone()))
}

pub fn emit_event(domain: &str, data: &serde_json::Value) {
    let json = serde_json::json!({ "domain": domain, "data": data });
    super::events::emit_event(domain, &json.to_string());
}

// JSON converters for records
pub fn community_msg_json(m: &crate::storage::CommunityMessageRecord) -> serde_json::Value {
    let ct_b64 = m.content_encrypted.as_ref().map(|b| base64::engine::general_purpose::STANDARD.encode(b));
    serde_json::json!({
        "id": m.id, "channel_id": m.channel_id, "sender_did": m.sender_did,
        "content_encrypted_b64": ct_b64, "content": m.content_plaintext,
        "nonce": m.nonce, "key_version": m.key_version, "is_e2ee": m.is_e2ee,
        "reply_to_id": m.reply_to_id, "thread_id": m.thread_id,
        "has_embed": m.has_embed, "has_attachment": m.has_attachment,
        "content_warning": m.content_warning,
        "edited": m.edited_at.is_some(), "edited_at": m.edited_at,
        "pinned": false, "deleted_for_everyone": m.deleted_for_everyone,
        "created_at": m.created_at, "metadata_json": m.metadata_json,
        "thread_reply_count": 0,
    })
}

pub fn thread_json(t: &crate::storage::CommunityThreadRecord) -> serde_json::Value {
    serde_json::json!({
        "id": t.id, "channel_id": t.channel_id,
        "parent_message_id": t.parent_message_id, "name": t.name,
        "created_by": t.created_by, "message_count": t.message_count,
        "last_message_at": t.last_message_at, "created_at": t.created_at,
    })
}

pub fn community_file_json(f: &crate::storage::CommunityFileRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id, "channel_id": f.channel_id, "folder_id": f.folder_id,
        "filename": f.filename, "description": f.description,
        "file_size": f.file_size, "mime_type": f.mime_type,
        "storage_chunks_json": f.storage_chunks_json, "uploaded_by": f.uploaded_by,
        "version": f.version, "previous_version_id": f.previous_version_id,
        "download_count": f.download_count, "created_at": f.created_at,
    })
}

pub fn community_folder_json(f: &crate::storage::CommunityFileFolderRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id, "channel_id": f.channel_id,
        "parent_folder_id": f.parent_folder_id, "name": f.name,
        "created_by": f.created_by, "created_at": f.created_at,
    })
}

pub fn dm_file_json(f: &crate::storage::DmSharedFileRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id, "conversation_id": f.conversation_id, "folder_id": f.folder_id,
        "filename": f.filename, "description": f.description,
        "file_size": f.file_size, "mime_type": f.mime_type,
        "storage_chunks_json": f.storage_chunks_json, "uploaded_by": f.uploaded_by,
        "version": f.version, "download_count": f.download_count,
        "encrypted_metadata": f.encrypted_metadata, "encryption_nonce": f.encryption_nonce,
        "created_at": f.created_at,
    })
}

pub fn dm_folder_json(f: &crate::storage::DmSharedFolderRecord) -> serde_json::Value {
    serde_json::json!({
        "id": f.id, "conversation_id": f.conversation_id,
        "parent_folder_id": f.parent_folder_id, "name": f.name,
        "created_by": f.created_by, "created_at": f.created_at,
    })
}

pub fn webhook_json(w: &crate::storage::CommunityWebhookRecord) -> serde_json::Value {
    serde_json::json!({
        "id": w.id, "channel_id": w.channel_id, "name": w.name,
        "avatar_url": w.avatar_url, "token": w.token,
        "creator_did": w.creator_did, "created_at": w.created_at,
    })
}

pub fn warning_json(w: &crate::storage::CommunityWarningRecord) -> serde_json::Value {
    serde_json::json!({
        "id": w.id, "community_id": w.community_id, "member_did": w.member_did,
        "reason": w.reason, "warned_by": w.warned_by,
        "expires_at": w.expires_at, "created_at": w.created_at,
    })
}

pub fn seat_json(s: &crate::storage::CommunitySeatRecord) -> serde_json::Value {
    serde_json::json!({
        "id": s.id, "communityId": s.community_id, "platform": s.platform,
        "platformUserId": s.platform_user_id, "platformUsername": s.platform_username,
        "nickname": s.nickname, "avatarUrl": s.avatar_url,
        "roleIds": serde_json::from_str::<Vec<String>>(&s.role_ids_json).unwrap_or_default(),
        "claimedByDid": s.claimed_by_did, "claimedAt": s.claimed_at,
        "createdAt": s.created_at,
    })
}

pub fn boost_node_json(n: &crate::storage::BoostNodeRecord) -> serde_json::Value {
    serde_json::json!({
        "id": n.id, "owner_did": n.owner_did, "node_type": n.node_type,
        "node_public_key": n.node_public_key, "name": n.name,
        "enabled": n.enabled, "max_storage_bytes": n.max_storage_bytes,
        "max_bandwidth_mbps": n.max_bandwidth_mbps, "auto_start": n.auto_start,
        "prioritized_communities": n.prioritized_communities,
        "pairing_token": n.pairing_token, "remote_address": n.remote_address,
        "last_seen_at": n.last_seen_at, "created_at": n.created_at,
        "updated_at": n.updated_at,
    })
}

// ============================================================================
// MAIN DISPATCHER
// ============================================================================

use super::dispatch_identity;
use super::dispatch_friends;
use super::dispatch_messaging;
use super::dispatch_community;
use super::dispatch_community_msg;
use super::dispatch_community_ext;
use super::dispatch_dm_files;
use super::dispatch_secure_store;
use super::dispatch_groups;
use super::dispatch_stubs;

pub fn dispatch(method: &str, args: &str) -> DResult {
    match method {
        // ── Identity ────────────────────────────────────────────────
        "identity_create" => dispatch_identity::identity_create(args),
        "identity_restore" => dispatch_identity::identity_restore(args),
        "identity_get_did" => dispatch_identity::identity_get_did(),
        "identity_get_profile" => dispatch_identity::identity_get_profile(),
        "identity_update_profile" => dispatch_identity::identity_update_profile(args),

        // ── Friends ─────────────────────────────────────────────────
        "friends_send_request" => dispatch_friends::friends_send_request(args),
        "friends_store_incoming" => dispatch_friends::friends_store_incoming(args),
        "friends_accept_from_relay" => dispatch_friends::friends_accept_from_relay(args),
        "friends_accept_request" => dispatch_friends::friends_accept_request(args),
        "friends_build_accept_ack" => dispatch_friends::friends_build_accept_ack(args),
        "friends_reject_request" => dispatch_friends::friends_reject_request(args),
        "friends_list" => dispatch_friends::friends_list(),
        "friends_pending_requests" => dispatch_friends::friends_pending_requests(args),
        "friends_remove" => dispatch_friends::friends_remove(args),
        "friends_block" => dispatch_friends::friends_block(args),
        "friends_unblock" => dispatch_friends::friends_unblock(args),

        // ── Messaging (DM) ──────────────────────────────────────────
        "messaging_get_conversations" => dispatch_messaging::messaging_get_conversations(),
        "messaging_create_dm_conversation" => dispatch_messaging::messaging_create_dm_conversation(args),
        "messaging_get_messages" => dispatch_messaging::messaging_get_messages(args),
        "messaging_send" => dispatch_messaging::messaging_send(args),
        "messaging_mark_read" => dispatch_messaging::messaging_mark_read(args),
        "messaging_decrypt" => dispatch_messaging::messaging_decrypt(args),
        "messaging_store_incoming" => dispatch_messaging::messaging_store_incoming(args),
        "messaging_build_typing_envelope" => dispatch_messaging::messaging_build_typing_envelope(args),
        "messaging_build_receipt_envelope" => dispatch_messaging::messaging_build_receipt_envelope(args),
        "messaging_edit" => dispatch_messaging::messaging_edit(args),
        "messaging_delete" => dispatch_messaging::messaging_delete(args),
        "messaging_pin" => dispatch_messaging::messaging_pin(args),
        "messaging_unpin" => dispatch_messaging::messaging_unpin(args),
        "messaging_add_reaction" => dispatch_messaging::messaging_add_reaction(args),
        "messaging_remove_reaction" => dispatch_messaging::messaging_remove_reaction(args),
        "messaging_forward" => dispatch_messaging::messaging_forward(args),
        "messaging_get_thread" => dispatch_messaging::messaging_get_thread(args),
        "messaging_reply_thread" => dispatch_messaging::messaging_reply_thread(args),
        "messaging_get_pinned" => dispatch_messaging::messaging_get_pinned(args),
        "messaging_update_status" => dispatch_messaging::messaging_update_status(args),

        // ── Groups ─────────────────────────────────────────────────
        "groups_create" => dispatch_groups::groups_create(args),
        "groups_get" => dispatch_groups::groups_get(args),
        "groups_list" => dispatch_groups::groups_list(),
        "groups_update" => dispatch_groups::groups_update(args),
        "groups_delete" => dispatch_groups::groups_delete(args),
        "groups_add_member" => dispatch_groups::groups_add_member(args),
        "groups_remove_member" => dispatch_groups::groups_remove_member(args),
        "groups_get_members" => dispatch_groups::groups_get_members(args),
        "groups_generate_key" => dispatch_groups::groups_generate_key(args),
        "groups_rotate_key" => dispatch_groups::groups_rotate_key(args),
        "groups_import_key" => dispatch_groups::groups_import_key(args),
        "groups_encrypt_message" => dispatch_groups::groups_encrypt_message(args),
        "groups_decrypt_message" => dispatch_groups::groups_decrypt_message(args),
        "groups_encrypt_key_for_member" => dispatch_groups::groups_encrypt_key_for_member_handler(args),
        "groups_store_invite" => dispatch_groups::groups_store_invite(args),
        "groups_get_pending_invites" => dispatch_groups::groups_get_pending_invites(),
        "groups_accept_invite" => dispatch_groups::groups_accept_invite(args),
        "groups_decline_invite" => dispatch_groups::groups_decline_invite(args),
        "groups_send_invite" => dispatch_groups::groups_send_invite(args),
        "groups_build_invite_accept_envelope" => dispatch_groups::groups_build_invite_accept_envelope(args),
        "groups_build_invite_decline_envelope" => dispatch_groups::groups_build_invite_decline_envelope(args),
        "groups_send_message" => dispatch_groups::groups_send_message(args),
        "groups_remove_member_with_rotation" => dispatch_groups::groups_remove_member_with_rotation(args),

        // ── Network ─────────────────────────────────────────────────
        "network_status" => dispatch_stubs::network_status(),

        // ── Relay ───────────────────────────────────────────────────
        "relay_connect" => dispatch_stubs::relay_connect(args),
        "relay_create_session" => dispatch_stubs::relay_create_session(args),
        "relay_accept_session" => dispatch_stubs::relay_accept_session(args),
        "relay_send" => dispatch_stubs::relay_send(args),

        // ── Crypto ──────────────────────────────────────────────────
        "crypto_sign" => dispatch_stubs::crypto_sign(args),
        "crypto_verify" => dispatch_stubs::crypto_verify(args),
        "crypto_encrypt_for_peer" => dispatch_stubs::crypto_encrypt_for_peer(args),
        "crypto_decrypt_from_peer" => dispatch_stubs::crypto_decrypt_from_peer(args),

        // ── Calls ───────────────────────────────────────────────────
        "calls_store" => dispatch_stubs::calls_store(args),
        "calls_end" => dispatch_stubs::calls_end(args),
        "calls_get_history" => dispatch_stubs::calls_get_history(args),
        "calls_get_all_history" => dispatch_stubs::calls_get_all_history(args),

        // ── Plugin Storage ──────────────────────────────────────────
        "plugin_kv_get" => dispatch_stubs::plugin_kv_get(args),
        "plugin_kv_set" => dispatch_stubs::plugin_kv_set(args),
        "plugin_kv_delete" => dispatch_stubs::plugin_kv_delete(args),
        "plugin_kv_list" => dispatch_stubs::plugin_kv_list(args),
        "plugin_bundle_save" => dispatch_stubs::plugin_bundle_save(args),
        "plugin_bundle_load" => dispatch_stubs::plugin_bundle_load(args),
        "plugin_bundle_delete" => dispatch_stubs::plugin_bundle_delete(args),
        "plugin_bundle_list" => dispatch_stubs::plugin_bundle_list(),

        // ── File Encryption ─────────────────────────────────────────
        "file_derive_key" => dispatch_stubs::file_derive_key(args),
        "file_encrypt_chunk" => dispatch_stubs::file_encrypt_chunk(args),
        "file_decrypt_chunk" => dispatch_stubs::file_decrypt_chunk(args),
        "channel_file_derive_key" => dispatch_stubs::channel_file_derive_key(args),
        "compute_key_fingerprint" => dispatch_stubs::compute_key_fingerprint(args),
        "verify_key_fingerprint" => dispatch_stubs::verify_key_fingerprint(args),

        // ── File Chunking ───────────────────────────────────────────
        "chunk_file" => dispatch_stubs::chunk_file(args),
        "reassemble_file" => dispatch_stubs::reassemble_file(args),
        "get_file_manifest" => dispatch_stubs::get_file_manifest(args),

        // ── Relay Envelope Builders ─────────────────────────────────
        "community_build_event_relay_batch" => dispatch_stubs::community_build_event_relay_batch(args),
        "build_dm_file_event_envelope" => dispatch_stubs::build_dm_file_event_envelope(args),
        "build_metadata_envelope" => dispatch_stubs::build_metadata_envelope(args),

        // ── Community — Core ────────────────────────────────────────
        "community_create" => dispatch_community::community_create(args),
        "community_get" => dispatch_community::community_get(args),
        "community_get_mine" => dispatch_community::community_get_mine(args),
        "community_update" => dispatch_community::community_update(args),
        "community_delete" => dispatch_community::community_delete(args),
        "community_transfer_ownership" => dispatch_community::community_transfer_ownership(args),
        "community_update_branding" => dispatch_community::community_update_branding(args),

        // ── Community — Spaces ──────────────────────────────────────
        "community_space_create" => dispatch_community::community_space_create(args),
        "community_space_list" => dispatch_community::community_space_list(args),
        "community_space_update" => dispatch_community::community_space_update(args),
        "community_space_reorder" => dispatch_community::community_space_reorder(args),
        "community_space_delete" => dispatch_community::community_space_delete(args),

        // ── Community — Categories ──────────────────────────────────
        "community_category_create" => dispatch_community::community_category_create(args),
        "community_category_list" => dispatch_community::community_category_list(args),
        "community_category_list_all" => dispatch_community::community_category_list_all(args),
        "community_category_update" => dispatch_community::community_category_update(args),
        "community_category_reorder" => dispatch_community::community_category_reorder(args),
        "community_category_delete" => dispatch_community::community_category_delete(args),
        "community_channel_move_category" => dispatch_community::community_channel_move_category(args),

        // ── Community — Channels ────────────────────────────────────
        "community_channel_create" => dispatch_community::community_channel_create(args),
        "community_channel_list" => dispatch_community::community_channel_list(args),
        "community_channel_list_all" => dispatch_community::community_channel_list_all(args),
        "community_channel_get" => dispatch_community::community_channel_get(args),
        "community_channel_update" => dispatch_community::community_channel_update(args),
        "community_channel_set_slow_mode" => dispatch_community::community_channel_set_slow_mode(args),
        "community_channel_set_e2ee" => dispatch_community::community_channel_set_e2ee(args),
        "community_channel_delete" => dispatch_community::community_channel_delete(args),
        "community_channel_reorder" => dispatch_community::community_channel_reorder(args),

        // ── Community — Members ─────────────────────────────────────
        "community_join" => dispatch_community::community_join(args),
        "community_leave" => dispatch_community::community_leave(args),
        "community_kick" => dispatch_community::community_kick(args),
        "community_ban" => dispatch_community::community_ban(args),
        "community_unban" => dispatch_community::community_unban(args),
        "community_member_list" => dispatch_community::community_member_list(args),
        "community_member_get" => dispatch_community::community_member_get(args),
        "community_member_update_profile" => dispatch_community::community_member_update_profile(args),
        "community_ban_list" => dispatch_community::community_ban_list(args),

        // ── Community — Roles ───────────────────────────────────────
        "community_role_list" => dispatch_community::community_role_list(args),
        "community_member_roles" => dispatch_community::community_member_roles(args),
        "community_role_assign" => dispatch_community::community_role_assign(args),
        "community_role_unassign" => dispatch_community::community_role_unassign(args),
        "community_custom_role_create" => dispatch_community::community_custom_role_create(args),
        "community_role_update" => dispatch_community::community_role_update(args),
        "community_role_update_permissions" => dispatch_community::community_role_update_permissions(args),
        "community_role_delete" => dispatch_community::community_role_delete(args),

        // ── Community — Invites ─────────────────────────────────────
        "community_invite_create" => dispatch_community::community_invite_create(args),
        "community_invite_use" => dispatch_community::community_invite_use(args),
        "community_invite_list" => dispatch_community::community_invite_list(args),
        "community_invite_delete" => dispatch_community::community_invite_delete(args),
        "community_invite_set_vanity" => dispatch_community::community_invite_set_vanity(args),

        // ── Community — Messages ────────────────────────────────────
        "community_message_send" => dispatch_community_msg::community_message_send(args),
        "community_message_store_received" => dispatch_community_msg::community_message_store_received(args),
        "community_message_list" => dispatch_community_msg::community_message_list(args),
        "community_message_get" => dispatch_community_msg::community_message_get(args),
        "community_message_edit" => dispatch_community_msg::community_message_edit(args),
        "community_message_delete" => dispatch_community_msg::community_message_delete(args),

        // ── Community — Reactions ───────────────────────────────────
        "community_reaction_add" => dispatch_community_msg::community_reaction_add(args),
        "community_reaction_remove" => dispatch_community_msg::community_reaction_remove(args),
        "community_reaction_list" => dispatch_community_msg::community_reaction_list(args),

        // ── Community — Emoji ───────────────────────────────────────
        "community_emoji_create" => dispatch_community_ext::community_emoji_create(args),
        "community_emoji_list" => dispatch_community_ext::community_emoji_list(args),
        "community_emoji_delete" => dispatch_community_ext::community_emoji_delete(args),
        "community_emoji_rename" => dispatch_community_ext::community_emoji_rename(args),

        // ── Community — Stickers ────────────────────────────────────
        "community_sticker_create" => dispatch_community_ext::community_sticker_create(args),
        "community_sticker_list" => dispatch_community_ext::community_sticker_list(args),
        "community_sticker_delete" => dispatch_community_ext::community_sticker_delete(args),

        // ── Community — Sticker Packs ───────────────────────────────
        "community_sticker_pack_create" => dispatch_community_ext::community_sticker_pack_create(args),
        "community_sticker_pack_list" => dispatch_community_ext::community_sticker_pack_list(args),
        "community_sticker_pack_delete" => dispatch_community_ext::community_sticker_pack_delete(args),
        "community_sticker_pack_rename" => dispatch_community_ext::community_sticker_pack_rename(args),

        // ── Community — Pins ────────────────────────────────────────
        "community_pin_message" => dispatch_community_msg::community_pin_message(args),
        "community_unpin_message" => dispatch_community_msg::community_unpin_message(args),
        "community_pin_list" => dispatch_community_msg::community_pin_list(args),

        // ── Community — Threads ─────────────────────────────────────
        "community_thread_create" => dispatch_community_msg::community_thread_create(args),
        "community_thread_get" => dispatch_community_msg::community_thread_get(args),
        "community_thread_list" => dispatch_community_msg::community_thread_list(args),
        "community_thread_messages" => dispatch_community_msg::community_thread_messages(args),

        // ── Community — Read Receipts ───────────────────────────────
        "community_mark_read" => dispatch_community_msg::community_mark_read(args),

        // ── Community — Files ───────────────────────────────────────
        "community_upload_file" => dispatch_community_ext::community_upload_file(args),
        "community_get_files" => dispatch_community_ext::community_get_files(args),
        "community_get_file" => dispatch_community_ext::community_get_file(args),
        "community_delete_file" => dispatch_community_ext::community_delete_file(args),
        "community_record_file_download" => dispatch_community_ext::community_record_file_download(args),
        "community_create_folder" => dispatch_community_ext::community_create_folder(args),
        "community_get_folders" => dispatch_community_ext::community_get_folders(args),
        "community_delete_folder" => dispatch_community_ext::community_delete_folder(args),

        // ── DM — Files ──────────────────────────────────────────────
        "dm_upload_file" => dispatch_dm_files::dm_upload_file(args),
        "dm_get_files" => dispatch_dm_files::dm_get_files(args),
        "dm_get_file" => dispatch_dm_files::dm_get_file(args),
        "dm_delete_file" => dispatch_dm_files::dm_delete_file(args),
        "dm_record_file_download" => dispatch_dm_files::dm_record_file_download(args),
        "dm_move_file" => dispatch_dm_files::dm_move_file(args),
        "dm_create_folder" => dispatch_dm_files::dm_create_folder(args),
        "dm_get_folders" => dispatch_dm_files::dm_get_folders(args),
        "dm_delete_folder" => dispatch_dm_files::dm_delete_folder(args),
        "dm_rename_folder" => dispatch_dm_files::dm_rename_folder(args),

        // ── Community — Seats ───────────────────────────────────────
        "community_seat_list" => dispatch_community_ext::community_seat_list(args),
        "community_seat_list_unclaimed" => dispatch_community_ext::community_seat_list_unclaimed(args),
        "community_seat_find_match" => dispatch_community_ext::community_seat_find_match(args),
        "community_seat_claim" => dispatch_community_ext::community_seat_claim(args),
        "community_seat_delete" => dispatch_community_ext::community_seat_delete(args),
        "community_seat_create_batch" => dispatch_community_ext::community_seat_create_batch(args),
        "community_seat_count" => dispatch_community_ext::community_seat_count(args),

        // ── Community — Audit Log ───────────────────────────────────
        "community_audit_log_create_batch" => dispatch_community_ext::community_audit_log_create_batch(args),
        "community_audit_log_list" => dispatch_community_ext::community_audit_log_list(args),

        // ── DHT ─────────────────────────────────────────────────────
        "dht_start_providing" => dispatch_stubs::dht_start_providing(args),
        "dht_get_providers" => dispatch_stubs::dht_get_providers(args),
        "dht_stop_providing" => dispatch_stubs::dht_stop_providing(args),

        // ── Secure Store ───────────────────────────────────────────
        "secure_store" => dispatch_secure_store::secure_store(args),
        "secure_retrieve" => dispatch_secure_store::secure_retrieve(args),
        "secure_delete" => dispatch_secure_store::secure_delete(args),
        "secure_exists" => dispatch_secure_store::secure_exists(args),

        // ── Network — WebRTC (N/A on native) ──────────────────────
        "network_create_offer" => dispatch_stubs::network_create_offer(),
        "network_accept_offer" => dispatch_stubs::network_accept_offer(args),
        "network_complete_handshake" => dispatch_stubs::network_complete_handshake(args),
        "network_complete_answerer" => dispatch_stubs::network_complete_answerer(),

        // ── File Transfer ─────────────────────────────────────────
        "transfer_initiate" => dispatch_stubs::transfer_initiate(args),
        "transfer_accept" => dispatch_stubs::transfer_accept(args),
        "transfer_pause" => dispatch_stubs::transfer_pause(args),
        "transfer_resume" => dispatch_stubs::transfer_resume(args),
        "transfer_cancel" => dispatch_stubs::transfer_cancel(args),
        "transfer_on_message" => dispatch_stubs::transfer_on_message(args),
        "transfer_list" => dispatch_stubs::transfer_list(),
        "transfer_get" => dispatch_stubs::transfer_get(args),
        "transfer_get_incomplete" => dispatch_stubs::transfer_get_incomplete(),
        "transfer_chunks_to_send" => dispatch_stubs::transfer_chunks_to_send(args),
        "transfer_mark_chunk_sent" => dispatch_stubs::transfer_mark_chunk_sent(args),

        // ── File Reencryption ─────────────────────────────────────
        "mark_files_for_reencryption" => dispatch_stubs::mark_files_for_reencryption(args),
        "get_files_needing_reencryption" => dispatch_stubs::get_files_needing_reencryption(args),
        "clear_reencryption_flag" => dispatch_stubs::clear_reencryption_flag(args),

        _ => Err(err(404, format!("Unknown method: {}", method))),
    }
}
