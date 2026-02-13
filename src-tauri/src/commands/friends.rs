use crate::state::AppState;
use umbra_core::friends::FriendRequest;
use umbra_core::storage::FriendRequestRecord;

/// Send a friend request.
///
/// Creates a signed friend request, stores it in the database,
/// and sends it over the P2P network if connected.
///
/// Returns JSON: { "id": "...", "to_did": "...", "from_did": "...", "created_at": ... }
#[tauri::command]
pub async fn send_friend_request(
    did: String,
    message: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;

    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let request = FriendRequest::create(identity, did.clone(), message)
        .map_err(|e| e.to_string())?;

    let record = FriendRequestRecord {
        id: request.id.clone(),
        from_did: request.from.did.clone(),
        to_did: request.to_did.clone(),
        direction: "outgoing".to_string(),
        message: request.message.clone(),
        from_signing_key: Some(hex::encode(&request.from.public_keys.signing)),
        from_encryption_key: Some(hex::encode(&request.from.public_keys.encryption)),
        from_display_name: Some(request.from.display_name.clone()),
        created_at: request.created_at,
        status: "pending".to_string(),
    };

    database.store_friend_request(&record)
        .map_err(|e| e.to_string())?;

    // TODO: Send over native TCP network if connected

    let json = serde_json::json!({
        "id": request.id,
        "to_did": request.to_did,
        "from_did": request.from.did,
        "from_signing_key": hex::encode(&request.from.public_keys.signing),
        "from_encryption_key": hex::encode(&request.from.public_keys.encryption),
        "from_display_name": request.from.display_name,
        "message": request.message,
        "created_at": request.created_at,
    });

    Ok(json.to_string())
}

/// Accept a friend request.
///
/// Returns JSON: { "request_id", "status", "conversation_id", "friend_did" }
#[tauri::command]
pub async fn accept_friend_request(
    request_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let request_record = database.get_friend_request(&request_id)
        .map_err(|e| format!("Failed to look up request: {}", e))?
        .ok_or("Friend request not found")?;

    database.update_request_status(&request_id, "accepted")
        .map_err(|e| e.to_string())?;

    let signing_key_hex = request_record.from_signing_key.as_ref()
        .ok_or("Request missing sender's signing key")?;
    let encryption_key_hex = request_record.from_encryption_key.as_ref()
        .ok_or("Request missing sender's encryption key")?;
    let display_name = request_record.from_display_name.as_deref().unwrap_or("Unknown");

    let signing_key_bytes = hex::decode(signing_key_hex)
        .map_err(|e| format!("Invalid signing key hex: {}", e))?;
    let encryption_key_bytes = hex::decode(encryption_key_hex)
        .map_err(|e| format!("Invalid encryption key hex: {}", e))?;

    if signing_key_bytes.len() != 32 || encryption_key_bytes.len() != 32 {
        return Err("Keys must be 32 bytes".to_string());
    }

    let mut signing_key = [0u8; 32];
    signing_key.copy_from_slice(&signing_key_bytes);
    let mut encryption_key = [0u8; 32];
    encryption_key.copy_from_slice(&encryption_key_bytes);

    let friend_did = &request_record.from_did;

    database.add_friend(friend_did, display_name, &signing_key, &encryption_key, None)
        .map_err(|e| format!("Failed to add friend: {}", e))?;

    let conversation_id = uuid::Uuid::new_v4().to_string();
    database.create_conversation(&conversation_id, friend_did)
        .map_err(|e| format!("Failed to create conversation: {}", e))?;

    let json = serde_json::json!({
        "request_id": request_id,
        "status": "accepted",
        "conversation_id": conversation_id,
        "friend_did": friend_did,
    });

    Ok(json.to_string())
}

/// Reject a friend request.
#[tauri::command]
pub async fn reject_friend_request(
    request_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    database.update_request_status(&request_id, "rejected")
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Get list of friends as JSON array.
#[tauri::command]
pub async fn list_friends(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let friends = database.get_all_friends()
        .map_err(|e| e.to_string())?;

    let friends_json: Vec<serde_json::Value> = friends.iter().map(|f| {
        serde_json::json!({
            "did": f.did,
            "display_name": f.display_name,
            "status": f.status,
            "signing_key": f.signing_key,
            "encryption_key": f.encryption_key,
            "created_at": f.created_at,
            "updated_at": f.updated_at,
        })
    }).collect();

    Ok(serde_json::to_string(&friends_json).unwrap_or_default())
}

/// Get pending friend requests as JSON array.
#[tauri::command]
pub async fn pending_requests(
    direction: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    let requests = database.get_pending_requests(&direction)
        .map_err(|e| e.to_string())?;

    let requests_json: Vec<serde_json::Value> = requests.iter().map(|r| {
        serde_json::json!({
            "id": r.id,
            "from_did": r.from_did,
            "to_did": r.to_did,
            "direction": r.direction,
            "message": r.message,
            "from_signing_key": r.from_signing_key,
            "from_encryption_key": r.from_encryption_key,
            "from_display_name": r.from_display_name,
            "created_at": r.created_at,
            "status": r.status,
        })
    }).collect();

    Ok(serde_json::to_string(&requests_json).unwrap_or_default())
}

/// Remove a friend by DID.
#[tauri::command]
pub async fn remove_friend(
    did: String,
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    database.remove_friend(&did)
        .map_err(|e| e.to_string())
}

/// Block a user by DID.
#[tauri::command]
pub async fn block_user(
    did: String,
    reason: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    database.block_user(&did, reason.as_deref())
        .map_err(|e| e.to_string())
}

/// Unblock a user by DID.
#[tauri::command]
pub async fn unblock_user(
    did: String,
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    let db_guard = state.database.read().await;
    let database = db_guard.as_ref()
        .ok_or("Database not initialized")?;

    database.unblock_user(&did)
        .map_err(|e| e.to_string())
}
