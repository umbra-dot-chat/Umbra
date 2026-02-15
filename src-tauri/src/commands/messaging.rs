use crate::state::AppState;

/// Get conversations list as JSON array.
#[tauri::command]
pub async fn get_conversations(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let conversations = database.get_all_conversations()
        .map_err(|e| e.to_string())?;

    let conv_json: Vec<serde_json::Value> = conversations.iter().map(|c| {
        serde_json::json!({
            "id": c.id,
            "friend_did": c.friend_did,
            "created_at": c.created_at,
            "last_message_at": c.last_message_at,
            "unread_count": c.unread_count,
        })
    }).collect();

    Ok(serde_json::to_string(&conv_json).unwrap_or_default())
}

/// Get messages for a conversation as JSON array.
#[tauri::command]
pub async fn get_messages(
    conversation_id: String,
    limit: i32,
    offset: i32,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let limit = if limit <= 0 { 50 } else { limit as usize };
    let offset = if offset < 0 { 0 } else { offset as usize };

    let messages = database.get_messages(&conversation_id, limit, offset)
        .map_err(|e| e.to_string())?;

    let messages_json: Vec<serde_json::Value> = messages.iter().map(|m| {
        serde_json::json!({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_did": m.sender_did,
            "content_encrypted": m.content_encrypted,
            "nonce": m.nonce,
            "timestamp": m.timestamp,
            "delivered": m.delivered,
            "read": m.read,
        })
    }).collect();

    Ok(serde_json::to_string(&messages_json).unwrap_or_default())
}

/// Send a message in a conversation.
///
/// Encrypts with AES-256-GCM using X25519 ECDH shared secret,
/// stores locally, sends over P2P network if connected.
#[tauri::command]
pub async fn send_message(
    conversation_id: String,
    content: String,
    _reply_to_id: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;

    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let message_id = uuid::Uuid::new_v4().to_string();
    let sender_did = identity.did_string();
    let timestamp = umbra_core::time::now_timestamp_millis();

    // Look up the conversation
    let conversation = database.get_conversation(&conversation_id)
        .map_err(|e| format!("Failed to get conversation: {}", e))?
        .ok_or("Conversation not found")?;

    let friend_did = conversation.friend_did.as_deref()
        .ok_or("Conversation has no friend DID")?;

    // Look up the friend's encryption key
    let friend_record = database.get_friend(friend_did)
        .map_err(|e| format!("Failed to get friend: {}", e))?
        .ok_or("Friend not found — cannot encrypt message")?;

    let friend_encryption_key_bytes = hex::decode(&friend_record.encryption_key)
        .map_err(|e| format!("Invalid friend encryption key: {}", e))?;
    let mut friend_enc_key = [0u8; 32];
    if friend_encryption_key_bytes.len() != 32 {
        return Err("Friend encryption key must be 32 bytes".to_string());
    }
    friend_enc_key.copy_from_slice(&friend_encryption_key_bytes);

    // Encrypt content using X25519 ECDH + AES-256-GCM
    let aad = format!("{}{}{}", sender_did, friend_did, timestamp);
    let (nonce, ciphertext) = umbra_core::crypto::encrypt_for_recipient(
        &identity.keypair().encryption,
        &friend_enc_key,
        conversation_id.as_bytes(),
        content.as_bytes(),
        aad.as_bytes(),
    ).map_err(|e| format!("Encryption failed: {}", e))?;

    // Store encrypted message locally
    database.store_message(
        &message_id,
        &conversation_id,
        &sender_did,
        &ciphertext,
        &nonce.0,
        timestamp,
    ).map_err(|e| format!("Failed to store message: {}", e))?;

    // TODO: Send over native TCP network if connected

    let json = serde_json::json!({
        "id": message_id,
        "conversation_id": conversation_id,
        "sender_did": sender_did,
        "timestamp": timestamp,
        "delivered": false,
        "read": false,
    });

    Ok(json.to_string())
}

/// Mark all messages in a conversation as read.
#[tauri::command]
pub async fn mark_read(
    conversation_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<i32, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    database.mark_messages_read(&conversation_id)
        .map_err(|e| e.to_string())
}

// ── Extended messaging stubs ──────────────────────────────────────────────
// Not yet implemented in the Rust core — return empty/no-op results.

#[tauri::command]
pub async fn edit_message(message_id: String, _new_text: String) -> Result<String, String> {
    Ok(serde_json::json!({ "id": message_id, "edited": false }).to_string())
}

#[tauri::command]
pub async fn delete_message(_message_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn pin_message(message_id: String) -> Result<String, String> {
    Ok(serde_json::json!({ "id": message_id, "pinned": false }).to_string())
}

#[tauri::command]
pub async fn unpin_message(_message_id: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn add_reaction(_message_id: String, _emoji: String) -> Result<String, String> {
    Ok("[]".to_string())
}

#[tauri::command]
pub async fn remove_reaction(_message_id: String, _emoji: String) -> Result<String, String> {
    Ok("[]".to_string())
}

#[tauri::command]
pub async fn forward_message(_message_id: String, _target_conversation_id: String) -> Result<String, String> {
    Ok("{}".to_string())
}

#[tauri::command]
pub async fn get_thread(_parent_id: String) -> Result<String, String> {
    Ok("[]".to_string())
}

#[tauri::command]
pub async fn reply_thread(_parent_id: String, _text: String) -> Result<String, String> {
    Ok("{}".to_string())
}

#[tauri::command]
pub async fn get_pinned(_conversation_id: String) -> Result<String, String> {
    Ok("[]".to_string())
}
