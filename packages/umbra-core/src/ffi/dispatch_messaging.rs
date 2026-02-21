//! Messaging (DM) dispatch handlers.

use base64::Engine as _;
use super::dispatcher::{DResult, err, json_parse, require_str, ok_json, ok_success, deterministic_conversation_id};
use super::state::get_state;

/// Convert hex-encoded ciphertext to base64, matching the WASM path.
/// Falls back to original string if hex decoding fails.
fn hex_to_base64_safe(hex_str: &str) -> String {
    match hex::decode(hex_str) {
        Ok(bytes) => base64::engine::general_purpose::STANDARD.encode(&bytes),
        Err(_) => hex_str.to_string(),
    }
}

pub fn messaging_get_conversations() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let convs = db.get_all_conversations().map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = convs.iter().map(|c| serde_json::json!({
        "id": c.id, "friend_did": c.friend_did, "conv_type": c.conv_type,
        "group_id": c.group_id, "created_at": c.created_at,
        "last_message_at": c.last_message_at, "unread_count": c.unread_count,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn messaging_create_dm_conversation(args: &str) -> DResult {
    let data = json_parse(args)?;
    let friend_did = require_str(&data, "friend_did")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let our_did = identity.did_string();
    let conv_id = deterministic_conversation_id(&our_did, friend_did);
    let _friend = db.get_friend(friend_did).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(503, "Friend not found"))?;
    db.create_conversation(&conv_id, friend_did)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "conversation_id": conv_id }))
}

pub fn messaging_get_messages(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conv_id = require_str(&data, "conversation_id")?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let msgs = db.get_messages(conv_id, limit, offset).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = msgs.iter().map(|m| serde_json::json!({
        "id": m.id, "conversation_id": m.conversation_id,
        "sender_did": m.sender_did,
        "content_encrypted": hex_to_base64_safe(&m.content_encrypted),
        "nonce": m.nonce, "timestamp": m.timestamp,
        "delivered": m.delivered, "read": m.read,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn messaging_send(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conv_id = require_str(&data, "conversation_id")?;
    let content = require_str(&data, "content")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let msg_id = uuid::Uuid::new_v4().to_string();
    let sender_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();

    let conv = db.get_conversation(conv_id).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(700, "Conversation not found"))?;
    let friend_did = conv.friend_did.as_deref()
        .ok_or_else(|| err(700, "No friend_did on conversation"))?;

    let friend_rec = db.get_friend(friend_did).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(503, "Friend not found"))?;
    let friend_enc_bytes = hex::decode(&friend_rec.encryption_key)
        .map_err(|e| err(704, format!("Invalid key: {}", e)))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_enc_bytes.len() != 32 { return Err(err(704, "Key must be 32 bytes")); }
    friend_enc_key.copy_from_slice(&friend_enc_bytes);

    let aad = format!("{}{}{}", sender_did, friend_did, timestamp);
    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption, &friend_enc_key,
        conv_id.as_bytes(), content.as_bytes(), aad.as_bytes(),
    ).map_err(|e| err(704, format!("Encryption failed: {}", e)))?;

    db.store_message(&msg_id, conv_id, &sender_did, &ciphertext, &nonce.0, timestamp)
        .map_err(|e| err(e.code(), e))?;

    let ct_b64 = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
    let nonce_hex = hex::encode(&nonce.0);

    let relay_envelope = serde_json::json!({
        "envelope": "chat_message", "version": 1,
        "payload": {
            "messageId": msg_id, "conversationId": conv_id,
            "senderDid": sender_did, "contentEncrypted": ct_b64,
            "nonce": nonce_hex, "timestamp": timestamp,
        }
    });

    super::dispatcher::emit_event("message", &serde_json::json!({
        "type": "messageSent",
        "message": {
            "id": msg_id, "conversation_id": conv_id,
            "sender_did": sender_did,
            "content": { "type": "text", "text": content },
            "timestamp": timestamp, "status": "sent",
            "delivered": false, "read": false,
        }
    }));

    ok_json(serde_json::json!({
        "id": msg_id, "conversation_id": conv_id, "sender_did": sender_did,
        "friend_did": friend_did, "timestamp": timestamp,
        "delivered": false, "read": false,
        "content_encrypted": ct_b64, "nonce": nonce_hex,
        "relay_messages": [{ "to_did": friend_did, "payload": relay_envelope.to_string() }],
    }))
}

pub fn messaging_mark_read(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conv_id = require_str(&data, "conversation_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let count = db.mark_messages_read(conv_id).map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "conversationRead", "conversation_id": conv_id}));

    ok_json(serde_json::json!({ "marked_count": count }))
}

pub fn messaging_decrypt(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conv_id = require_str(&data, "conversation_id")?;
    let ct_b64 = require_str(&data, "content_encrypted_b64")?;
    let nonce_hex = require_str(&data, "nonce_hex")?;
    let sender_did = require_str(&data, "sender_did")?;
    let timestamp = data["timestamp"].as_i64().ok_or_else(|| err(2, "Missing timestamp"))?;

    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let conv = db.get_conversation(conv_id).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(700, "Conversation not found"))?;
    let friend_did = conv.friend_did.as_deref()
        .ok_or_else(|| err(700, "No friend_did"))?;
    let our_did = identity.did_string();

    let friend_rec = db.get_friend(friend_did).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(503, "Friend not found"))?;
    let fek_bytes = hex::decode(&friend_rec.encryption_key).map_err(|e| err(704, e))?;
    let mut fek = [0u8; 32];
    if fek_bytes.len() != 32 { return Err(err(704, "Key must be 32 bytes")); }
    fek.copy_from_slice(&fek_bytes);

    let ciphertext = base64::engine::general_purpose::STANDARD.decode(ct_b64)
        .map_err(|e| err(704, format!("Invalid base64: {}", e)))?;
    let nonce_bytes = hex::decode(nonce_hex).map_err(|e| err(704, e))?;
    if nonce_bytes.len() != 12 { return Err(err(704, "Nonce must be 12 bytes")); }
    let mut nonce_arr = [0u8; 12];
    nonce_arr.copy_from_slice(&nonce_bytes);
    let nonce = crate::crypto::Nonce(nonce_arr);

    let aad = format!("{}{}{}", sender_did, if sender_did == our_did { friend_did } else { &our_did }, timestamp);

    let plaintext = crate::crypto::decrypt_from_sender(
        &identity.keypair().encryption, &fek, conv_id.as_bytes(), &nonce, &ciphertext, aad.as_bytes(),
    ).map_err(|e| err(704, format!("Decryption failed: {}", e)))?;

    let text = String::from_utf8_lossy(&plaintext).to_string();
    ok_json(serde_json::json!(text))
}

pub fn messaging_store_incoming(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let msg_id = require_str(&data, "message_id")?;
    let conv_id = require_str(&data, "conversation_id")?;
    let sender_did = require_str(&data, "sender_did")?;
    let ct_b64 = require_str(&data, "content_encrypted")?;
    let nonce_hex = require_str(&data, "nonce")?;
    let timestamp = data["timestamp"].as_i64().ok_or_else(|| err(2, "Missing timestamp"))?;

    let ciphertext = base64::engine::general_purpose::STANDARD.decode(ct_b64)
        .map_err(|e| err(704, format!("Invalid base64: {}", e)))?;
    let nonce_bytes = hex::decode(nonce_hex).map_err(|e| err(704, e))?;

    db.store_message(msg_id, conv_id, sender_did, &ciphertext, &nonce_bytes, timestamp)
        .map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event("message", &serde_json::json!({
        "type": "messageReceived",
        "message": {
            "id": msg_id, "conversation_id": conv_id,
            "sender_did": sender_did,
            "content_encrypted": ct_b64, "nonce": nonce_hex,
            "status": "delivered",
            "timestamp": timestamp,
            "delivered": true, "read": false,
        }
    }));

    ok_success()
}

pub fn messaging_build_typing_envelope(args: &str) -> DResult {
    let data = json_parse(args)?;
    let to_did = require_str(&data, "to_did")?;
    let conv_id = require_str(&data, "conversation_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;

    let envelope = serde_json::json!({
        "envelope": "typing_indicator", "version": 1,
        "payload": { "conversationId": conv_id, "senderDid": identity.did_string() }
    });
    ok_json(serde_json::json!({ "to_did": to_did, "payload": envelope.to_string() }))
}

pub fn messaging_build_receipt_envelope(args: &str) -> DResult {
    let data = json_parse(args)?;
    let to_did = require_str(&data, "to_did")?;
    let msg_id = require_str(&data, "message_id")?;
    let receipt_type = data["receipt_type"].as_str().unwrap_or("delivered");
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;

    let envelope = serde_json::json!({
        "envelope": "delivery_receipt", "version": 1,
        "payload": { "messageId": msg_id, "senderDid": identity.did_string(), "type": receipt_type }
    });
    ok_json(serde_json::json!({ "to_did": to_did, "payload": envelope.to_string() }))
}

pub fn messaging_edit(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let new_text = require_str(&data, "new_text")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let message = db.get_message(msg_id).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(700, "Message not found"))?;

    let our_did = identity.did_string();
    if message.sender_did != our_did { return Err(err(403, "Not the sender")); }

    let conv = db.get_conversation(&message.conversation_id).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(700, "Conversation not found"))?;
    let friend_did = conv.friend_did.as_deref().ok_or_else(|| err(700, "No friend_did"))?;

    let friend_rec = db.get_friend(friend_did).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(503, "Friend not found"))?;
    let fek_bytes = hex::decode(&friend_rec.encryption_key).map_err(|e| err(704, e))?;
    let mut fek = [0u8; 32];
    if fek_bytes.len() != 32 { return Err(err(704, "Key must be 32 bytes")); }
    fek.copy_from_slice(&fek_bytes);

    let edited_at = crate::time::now_timestamp_millis();
    let aad = format!("{}{}{}", our_did, friend_did, edited_at);
    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption, &fek, message.conversation_id.as_bytes(),
        new_text.as_bytes(), aad.as_bytes(),
    ).map_err(|e| err(704, format!("Encryption failed: {}", e)))?;

    db.edit_message(msg_id, &ciphertext, &nonce.0, edited_at).map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "messageEdited", "message_id": msg_id, "edited_at": edited_at}));

    ok_json(serde_json::json!({
        "message_id": msg_id, "edited_at": edited_at,
        "content_encrypted": base64::engine::general_purpose::STANDARD.encode(&ciphertext),
        "nonce": hex::encode(&nonce.0),
    }))
}

pub fn messaging_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let deleted_at = crate::time::now_timestamp_millis();
    db.delete_message(msg_id, deleted_at).map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "messageDeleted", "message_id": msg_id}));

    ok_json(serde_json::json!({ "message_id": msg_id, "deleted_at": deleted_at }))
}

pub fn messaging_pin(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let pinned_at = crate::time::now_timestamp_millis();
    let pinned_by = identity.did_string();
    db.pin_message(msg_id, &pinned_by, pinned_at).map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "messagePinned", "message_id": msg_id}));

    ok_json(serde_json::json!({ "message_id": msg_id, "pinned_by": pinned_by, "pinned_at": pinned_at }))
}

pub fn messaging_unpin(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    db.unpin_message(msg_id).map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "messageUnpinned", "message_id": msg_id}));

    ok_json(serde_json::json!({ "message_id": msg_id }))
}

pub fn messaging_add_reaction(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let emoji = require_str(&data, "emoji")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let reactor_did = identity.did_string();
    let reaction_id = uuid::Uuid::new_v4().to_string();
    db.add_reaction(&reaction_id, msg_id, &reactor_did, emoji).map_err(|e| err(e.code(), e))?;
    let reactions = db.get_reactions(msg_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = reactions.iter().map(|r| serde_json::json!({
        "id": r.id, "message_id": r.message_id, "user_did": r.user_did,
        "emoji": r.emoji, "created_at": r.created_at,
    })).collect();

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "reactionAdded", "message_id": msg_id, "emoji": emoji}));

    ok_json(serde_json::json!({ "reactions": arr }))
}

pub fn messaging_remove_reaction(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let emoji = require_str(&data, "emoji")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let reactor_did = identity.did_string();
    db.remove_reaction(msg_id, &reactor_did, emoji).map_err(|e| err(e.code(), e))?;
    let reactions = db.get_reactions(msg_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = reactions.iter().map(|r| serde_json::json!({
        "id": r.id, "message_id": r.message_id, "user_did": r.user_did,
        "emoji": r.emoji, "created_at": r.created_at,
    })).collect();

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "reactionRemoved", "message_id": msg_id, "emoji": emoji}));

    ok_json(serde_json::json!({ "reactions": arr }))
}

pub fn messaging_forward(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let target_conv_id = require_str(&data, "target_conversation_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let msg = db.get_message(msg_id).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(700, "Message not found"))?;

    let new_id = uuid::Uuid::new_v4().to_string();
    let timestamp = crate::time::now_timestamp_millis();
    let ct_bytes = hex::decode(&msg.content_encrypted).map_err(|e| err(704, format!("Invalid content: {}", e)))?;
    let nonce_bytes = hex::decode(&msg.nonce).map_err(|e| err(704, format!("Invalid nonce: {}", e)))?;
    db.store_message(&new_id, target_conv_id, &msg.sender_did,
        &ct_bytes, &nonce_bytes, timestamp)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "new_message_id": new_id, "target_conversation_id": target_conv_id }))
}

pub fn messaging_get_thread(_args: &str) -> DResult {
    // Native DB doesn't have DM thread queries — replies use reply_to_id on individual messages
    Ok("[]".to_string())
}

pub fn messaging_reply_thread(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conv_id = require_str(&data, "conversation_id")?;
    let thread_id = require_str(&data, "thread_id")?;
    let content = require_str(&data, "content")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;

    let msg_id = uuid::Uuid::new_v4().to_string();
    let sender_did = identity.did_string();
    let timestamp = crate::time::now_timestamp_millis();

    let conv = db.get_conversation(conv_id).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(700, "Conversation not found"))?;
    let friend_did = conv.friend_did.as_deref().ok_or_else(|| err(700, "No friend_did"))?;

    let friend_rec = db.get_friend(friend_did).map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(503, "Friend not found"))?;
    let fek_bytes = hex::decode(&friend_rec.encryption_key).map_err(|e| err(704, e))?;
    let mut fek = [0u8; 32];
    if fek_bytes.len() != 32 { return Err(err(704, "Key must be 32 bytes")); }
    fek.copy_from_slice(&fek_bytes);

    let aad = format!("{}{}{}", sender_did, friend_did, timestamp);
    let (nonce, ciphertext) = crate::crypto::encrypt_for_recipient(
        &identity.keypair().encryption, &fek, conv_id.as_bytes(),
        content.as_bytes(), aad.as_bytes(),
    ).map_err(|e| err(704, e))?;

    db.store_message(&msg_id, conv_id, &sender_did, &ciphertext, &nonce.0, timestamp)
        .map_err(|e| err(e.code(), e))?;
    db.set_message_reply(&msg_id, thread_id)
        .map_err(|e| err(e.code(), e))?;

    let ct_b64 = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
    let nonce_hex = hex::encode(&nonce.0);
    let relay_envelope = serde_json::json!({
        "envelope": "chat_message", "version": 1,
        "payload": {
            "messageId": msg_id, "conversationId": conv_id,
            "senderDid": sender_did, "contentEncrypted": ct_b64,
            "nonce": nonce_hex, "timestamp": timestamp, "threadId": thread_id,
        }
    });

    ok_json(serde_json::json!({
        "id": msg_id, "conversation_id": conv_id, "sender_did": sender_did,
        "friend_did": friend_did, "timestamp": timestamp, "thread_id": thread_id,
        "content_encrypted": ct_b64, "nonce": nonce_hex,
        "relay_messages": [{ "to_did": friend_did, "payload": relay_envelope.to_string() }],
    }))
}

pub fn messaging_get_pinned(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conv_id = require_str(&data, "conversation_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    let pins = db.get_pinned_messages(conv_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = pins.iter().map(|m| serde_json::json!({
        "id": m.id, "conversation_id": m.conversation_id,
        "sender_did": m.sender_did, "content_encrypted": m.content_encrypted,
        "nonce": m.nonce, "timestamp": m.timestamp,
        "delivered": m.delivered, "read": m.read,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn messaging_update_status(args: &str) -> DResult {
    let data = json_parse(args)?;
    let msg_id = require_str(&data, "message_id")?;
    let status = require_str(&data, "status")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state.database.as_ref().ok_or_else(|| err(400, "Database not initialized"))?;
    match status {
        "sent" => { db.mark_message_sent(msg_id).map_err(|e| err(e.code(), e))?; }
        "delivered" => { db.mark_message_delivered(msg_id).map_err(|e| err(e.code(), e))?; }
        "read" => { db.mark_message_read(msg_id).map_err(|e| err(e.code(), e))?; }
        _ => return Err(err(2, format!("Unknown status: {}", status))),
    }

    super::dispatcher::emit_event("message", &serde_json::json!({"type": "messageStatusUpdated", "message_id": msg_id, "status": status}));

    ok_success()
}
