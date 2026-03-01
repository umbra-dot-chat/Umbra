//! Community messaging dispatch handlers:
//! messages, reactions, pins, threads, read receipts.

use super::dispatcher::{
    community_msg_json, community_service, emit_event, err, json_parse, ok_json, ok_success,
    require_str, thread_json, DResult,
};

// ── Messages ────────────────────────────────────────────────────────────────

pub fn community_message_send(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let sender_did = require_str(&data, "sender_did")?;
    let content = require_str(&data, "content")?;
    let reply_to_id = data["reply_to_id"].as_str();
    let thread_id = data["thread_id"].as_str();
    let content_warning = data["content_warning"].as_str();
    let metadata_json = data["metadata_json"].as_str();
    let svc = community_service()?;
    let msg = svc
        .send_message(
            channel_id,
            sender_did,
            content,
            reply_to_id,
            thread_id,
            content_warning,
            metadata_json,
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityMessageSent", "message_id": msg.id}),
    );
    ok_json(community_msg_json(&msg))
}

pub fn community_message_store_received(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let channel_id = require_str(&data, "channel_id")?;
    let sender_did = require_str(&data, "sender_did")?;
    let content = require_str(&data, "content")?;
    let created_at = data["created_at"]
        .as_i64()
        .unwrap_or_else(|| crate::time::now_timestamp());
    let metadata_json = data["metadata_json"].as_str();
    let svc = community_service()?;
    svc.store_received_message(
        id,
        channel_id,
        sender_did,
        content,
        created_at,
        metadata_json,
    )
    .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityMessageReceived", "message_id": id}),
    );
    ok_success()
}

pub fn community_message_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let limit = data["limit"].as_u64().unwrap_or(50) as usize;
    let before_timestamp = data["before_timestamp"].as_i64();
    let svc = community_service()?;
    let msgs = svc
        .get_messages(channel_id, limit, before_timestamp)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = msgs.iter().map(community_msg_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_message_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    let msg = svc.get_message(id).map_err(|e| err(e.code(), e))?;
    ok_json(community_msg_json(&msg))
}

pub fn community_message_edit(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let new_content = require_str(&data, "new_content")?;
    let editor_did = require_str(&data, "editor_did")?;
    let svc = community_service()?;
    svc.edit_message(id, new_content, editor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityMessageEdited", "message_id": id}),
    );
    ok_success()
}

pub fn community_message_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    svc.delete_message_for_everyone(id)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityMessageDeleted", "message_id": id}),
    );
    ok_success()
}

// ── Reactions ───────────────────────────────────────────────────────────────

pub fn community_reaction_add(args: &str) -> DResult {
    let data = json_parse(args)?;
    let message_id = require_str(&data, "message_id")?;
    let member_did = require_str(&data, "member_did")?;
    let emoji = require_str(&data, "emoji")?;
    let is_custom = data["is_custom"].as_bool().unwrap_or(false);
    let svc = community_service()?;
    svc.add_reaction(message_id, member_did, emoji, is_custom)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityReactionAdded", "message_id": message_id}),
    );
    ok_success()
}

pub fn community_reaction_remove(args: &str) -> DResult {
    let data = json_parse(args)?;
    let message_id = require_str(&data, "message_id")?;
    let member_did = require_str(&data, "member_did")?;
    let emoji = require_str(&data, "emoji")?;
    let svc = community_service()?;
    svc.remove_reaction(message_id, member_did, emoji)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityReactionRemoved", "message_id": message_id}),
    );
    ok_success()
}

pub fn community_reaction_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let message_id = require_str(&data, "message_id")?;
    let svc = community_service()?;
    let reactions = svc
        .get_reactions(message_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = reactions
        .iter()
        .map(|r| {
            serde_json::json!({
                "message_id": r.message_id, "member_did": r.member_did,
                "emoji": r.emoji, "is_custom": r.is_custom, "created_at": r.created_at,
            })
        })
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Pins ────────────────────────────────────────────────────────────────────

pub fn community_pin_message(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let message_id = require_str(&data, "message_id")?;
    let pinned_by = require_str(&data, "pinned_by")?;
    let svc = community_service()?;
    svc.pin_message(channel_id, message_id, pinned_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityMessagePinned", "message_id": message_id}),
    );
    ok_success()
}

pub fn community_unpin_message(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let message_id = require_str(&data, "message_id")?;
    let svc = community_service()?;
    svc.unpin_message(channel_id, message_id)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityMessageUnpinned", "message_id": message_id}),
    );
    ok_success()
}

pub fn community_pin_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let svc = community_service()?;
    let pins = svc.get_pins(channel_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = pins
        .iter()
        .map(|p| {
            serde_json::json!({
                "channel_id": p.channel_id, "message_id": p.message_id,
                "pinned_by": p.pinned_by, "pinned_at": p.pinned_at,
            })
        })
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Threads ─────────────────────────────────────────────────────────────────

pub fn community_thread_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let parent_message_id = require_str(&data, "parent_message_id")?;
    let name = data["name"].as_str();
    let created_by = require_str(&data, "created_by")?;
    let svc = community_service()?;
    let thread = svc
        .create_thread(channel_id, parent_message_id, name, created_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityThreadCreated", "thread_id": thread.id}),
    );
    ok_json(thread_json(&thread))
}

pub fn community_thread_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    let thread = svc.get_thread(id).map_err(|e| err(e.code(), e))?;
    ok_json(thread_json(&thread))
}

pub fn community_thread_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let svc = community_service()?;
    let threads = svc.get_threads(channel_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = threads.iter().map(thread_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_thread_messages(args: &str) -> DResult {
    let data = json_parse(args)?;
    let thread_id = require_str(&data, "thread_id")?;
    let limit = data["limit"].as_u64().unwrap_or(50) as usize;
    let before_timestamp = data["before_timestamp"].as_i64();
    let svc = community_service()?;
    let msgs = svc
        .get_thread_messages(thread_id, limit, before_timestamp)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = msgs.iter().map(community_msg_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Read Receipts ───────────────────────────────────────────────────────────

pub fn community_mark_read(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let member_did = require_str(&data, "member_did")?;
    let last_read_message_id = require_str(&data, "last_read_message_id")?;
    let svc = community_service()?;
    svc.mark_read(channel_id, member_did, last_read_message_id)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "communityRead"}));
    ok_success()
}

// ── Read Receipts (list) ────────────────────────────────────────────────────

pub fn community_read_receipts(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let svc = community_service()?;
    let receipts = svc
        .get_read_receipts(channel_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = receipts
        .iter()
        .map(|r| serde_json::json!({
            "channel_id": r.channel_id, "member_did": r.member_did,
            "last_read_message_id": r.last_read_message_id, "read_at": r.read_at,
        }))
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Encrypted Messages ──────────────────────────────────────────────────────

pub fn community_message_send_encrypted(args: &str) -> DResult {
    use base64::Engine as _;
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let sender_did = require_str(&data, "sender_did")?;
    let content_b64 = require_str(&data, "content_encrypted_b64")?;
    let nonce = require_str(&data, "nonce")?;
    let key_version = data["key_version"]
        .as_i64()
        .ok_or_else(|| err(2, "Missing key_version"))? as i32;
    let reply_to_id = data["reply_to_id"].as_str();
    let thread_id = data["thread_id"].as_str();
    let encrypted_bytes = base64::engine::general_purpose::STANDARD
        .decode(content_b64)
        .map_err(|e| err(3, format!("Invalid base64: {}", e)))?;
    let svc = community_service()?;
    let id = svc
        .send_encrypted_message(
            channel_id, sender_did, &encrypted_bytes,
            nonce, key_version, reply_to_id, thread_id,
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "communityMessageSent",
            "channel_id": channel_id,
            "message_id": id,
            "sender_did": sender_did,
            "is_e2ee": true,
        }),
    );
    ok_json(serde_json::json!({"message_id": id}))
}

pub fn community_message_delete_for_me(args: &str) -> DResult {
    let data = json_parse(args)?;
    let message_id = require_str(&data, "message_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    svc.delete_message_for_me(message_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

// ── System Messages ─────────────────────────────────────────────────────────

pub fn community_send_system_message(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let content = require_str(&data, "content")?;
    let svc = community_service()?;
    let msg = svc
        .send_system_message(channel_id, content)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "systemMessage",
            "channel_id": channel_id,
            "message_id": msg.id,
        }),
    );
    ok_json(community_msg_json(&msg))
}

// ── Channel Keys ────────────────────────────────────────────────────────────

pub fn community_channel_key_store(args: &str) -> DResult {
    use base64::Engine as _;
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let key_version = data["key_version"]
        .as_i64()
        .ok_or_else(|| err(2, "Missing key_version"))? as i32;
    let encrypted_key_b64 = require_str(&data, "encrypted_key_b64")?;
    let key_bytes = base64::engine::general_purpose::STANDARD
        .decode(encrypted_key_b64)
        .map_err(|e| err(3, format!("Invalid base64: {}", e)))?;
    let svc = community_service()?;
    svc.store_channel_key(channel_id, key_version, &key_bytes)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_channel_key_latest(args: &str) -> DResult {
    use base64::Engine as _;
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let svc = community_service()?;
    let key = svc
        .get_latest_channel_key(channel_id)
        .map_err(|e| err(e.code(), e))?;
    match key {
        Some(k) => {
            let b64 = base64::engine::general_purpose::STANDARD.encode(&k.encrypted_key);
            ok_json(serde_json::json!({
                "channel_id": k.channel_id, "key_version": k.key_version,
                "encrypted_key_b64": b64, "created_at": k.created_at,
            }))
        }
        None => ok_json(serde_json::json!(null)),
    }
}
