//! Friends dispatch handlers.

use super::dispatcher::{
    deterministic_conversation_id, err, json_parse, ok_json, ok_success, require_str, DResult,
};
use super::state::get_state;
use crate::friends::FriendRequest;
use crate::storage::FriendRequestRecord;

pub fn friends_send_request(args: &str) -> DResult {
    let data = json_parse(args)?;
    let did = require_str(&data, "did")?;
    let message = data["message"].as_str().map(|s| s.to_string());
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();

    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let database = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let request = FriendRequest::create(identity, did.to_string(), message.clone())
        .map_err(|e| err(e.code(), e))?;

    let record = FriendRequestRecord {
        id: request.id.clone(),
        from_did: request.from.did.clone(),
        to_did: request.to_did.clone(),
        direction: "outgoing".to_string(),
        message: request.message.clone(),
        from_signing_key: Some(hex::encode(&request.from.public_keys.signing)),
        from_encryption_key: Some(hex::encode(&request.from.public_keys.encryption)),
        from_display_name: Some(request.from.display_name.clone()),
        from_avatar: request.from.avatar.clone(),
        created_at: request.created_at,
        status: "pending".to_string(),
    };
    database
        .store_friend_request(&record)
        .map_err(|e| err(e.code(), e))?;

    let relay_envelope = serde_json::json!({
        "envelope": "friend_request", "version": 1,
        "payload": {
            "id": request.id, "fromDid": request.from.did,
            "fromDisplayName": request.from.display_name,
            "fromAvatar": request.from.avatar,
            "fromSigningKey": hex::encode(&request.from.public_keys.signing),
            "fromEncryptionKey": hex::encode(&request.from.public_keys.encryption),
            "message": request.message, "createdAt": request.created_at,
        }
    });

    super::dispatcher::emit_event(
        "friend",
        &serde_json::json!({"type": "friendRequestSent", "request_id": request.id, "to_did": request.to_did}),
    );

    ok_json(serde_json::json!({
        "id": request.id, "to_did": request.to_did,
        "from_did": request.from.did,
        "from_signing_key": hex::encode(&request.from.public_keys.signing),
        "from_encryption_key": hex::encode(&request.from.public_keys.encryption),
        "from_display_name": request.from.display_name,
        "message": request.message, "created_at": request.created_at,
        "relay_messages": [{ "to_did": request.to_did, "payload": relay_envelope.to_string() }],
    }))
}

pub fn friends_store_incoming(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let record = FriendRequestRecord {
        id: data["id"].as_str().unwrap_or("").to_string(),
        from_did: data["from_did"].as_str().unwrap_or("").to_string(),
        to_did: data["to_did"].as_str().unwrap_or("").to_string(),
        direction: "incoming".to_string(),
        message: data["message"].as_str().map(|s| s.to_string()),
        from_signing_key: data["from_signing_key"].as_str().map(|s| s.to_string()),
        from_encryption_key: data["from_encryption_key"].as_str().map(|s| s.to_string()),
        from_display_name: data["from_display_name"].as_str().map(|s| s.to_string()),
        from_avatar: data["from_avatar"].as_str().map(|s| s.to_string()),
        created_at: data["created_at"].as_i64().unwrap_or(0),
        status: "pending".to_string(),
    };
    db.store_friend_request(&record)
        .map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event(
        "friend",
        &serde_json::json!({"type": "friendRequestReceived", "request_id": record.id, "from_did": record.from_did}),
    );

    ok_success()
}

pub fn friends_accept_from_relay(args: &str) -> DResult {
    let data = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    // Accept both field name conventions:
    //   WASM path sends:       from_did, from_display_name, from_signing_key, from_encryption_key
    //   Dispatcher path sends: friend_did, display_name, signing_key, encryption_key
    let friend_did = data["from_did"]
        .as_str()
        .or_else(|| data["friend_did"].as_str())
        .ok_or_else(|| err(2, "Missing from_did or friend_did"))?;
    let display_name = data["from_display_name"]
        .as_str()
        .or_else(|| data["display_name"].as_str())
        .unwrap_or("Unknown");
    let signing_key = data["from_signing_key"]
        .as_str()
        .or_else(|| data["signing_key"].as_str())
        .ok_or_else(|| err(2, "Missing from_signing_key or signing_key"))?;
    let encryption_key = data["from_encryption_key"]
        .as_str()
        .or_else(|| data["encryption_key"].as_str())
        .ok_or_else(|| err(2, "Missing from_encryption_key or encryption_key"))?;
    let avatar = data["from_avatar"]
        .as_str()
        .or_else(|| data["avatar"].as_str());

    let sk_bytes =
        hex::decode(signing_key).map_err(|e| err(704, format!("Invalid signing key: {}", e)))?;
    let ek_bytes = hex::decode(encryption_key)
        .map_err(|e| err(704, format!("Invalid encryption key: {}", e)))?;
    if sk_bytes.len() != 32 || ek_bytes.len() != 32 {
        return Err(err(704, "Keys must be 32 bytes"));
    }
    let mut sk = [0u8; 32];
    sk.copy_from_slice(&sk_bytes);
    let mut ek = [0u8; 32];
    ek.copy_from_slice(&ek_bytes);
    db.add_friend_with_avatar(friend_did, display_name, &sk, &ek, None, avatar)
        .map_err(|e| err(e.code(), e))?;

    let our_did = identity.did_string();
    let conv_id = deterministic_conversation_id(&our_did, friend_did);
    // Use best-effort create — conversation may already exist
    let _ = db.create_conversation(&conv_id, friend_did);

    // Clean up the outgoing request (mark as accepted) so it disappears
    // from the pending list. Best-effort — request may not exist if
    // friendship was initiated via P2P.
    if let Ok(outgoing) = db.get_pending_requests("outgoing") {
        for req in &outgoing {
            if req.to_did == friend_did {
                let _ = db.update_request_status(&req.id, "accepted");
                break;
            }
        }
    }

    super::dispatcher::emit_event(
        "friend",
        &serde_json::json!({"type": "friendAdded", "friend_did": friend_did, "conversation_id": conv_id}),
    );

    ok_json(serde_json::json!({ "friend_did": friend_did, "conversation_id": conv_id }))
}

pub fn friends_accept_request(args: &str) -> DResult {
    let data = json_parse(args)?;
    let request_id = require_str(&data, "request_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;

    let req = db
        .get_friend_request(request_id)
        .map_err(|e| err(e.code(), e))?
        .ok_or_else(|| err(603, "Request not found"))?;

    let friend_did = &req.from_did;
    let display_name = req.from_display_name.as_deref().unwrap_or("Unknown");
    let signing_key = req.from_signing_key.as_deref().unwrap_or("");
    let encryption_key = req.from_encryption_key.as_deref().unwrap_or("");

    let sk_bytes =
        hex::decode(signing_key).map_err(|e| err(704, format!("Invalid signing key: {}", e)))?;
    let ek_bytes = hex::decode(encryption_key)
        .map_err(|e| err(704, format!("Invalid encryption key: {}", e)))?;
    if sk_bytes.len() != 32 || ek_bytes.len() != 32 {
        return Err(err(704, "Keys must be 32 bytes"));
    }
    let mut sk = [0u8; 32];
    sk.copy_from_slice(&sk_bytes);
    let mut ek = [0u8; 32];
    ek.copy_from_slice(&ek_bytes);
    db.add_friend_with_avatar(
        friend_did,
        display_name,
        &sk,
        &ek,
        None,
        req.from_avatar.as_deref(),
    )
    .map_err(|e| err(e.code(), e))?;
    db.update_request_status(request_id, "accepted")
        .map_err(|e| err(e.code(), e))?;

    let our_did = identity.did_string();
    let conv_id = deterministic_conversation_id(&our_did, friend_did);
    db.create_conversation(&conv_id, friend_did)
        .map_err(|e| err(e.code(), e))?;

    let our_signing = hex::encode(&identity.keypair().signing.public_bytes());
    let our_enc = hex::encode(&identity.keypair().encryption.public_bytes());
    let relay_envelope = serde_json::json!({
        "envelope": "friend_accept", "version": 1,
        "payload": {
            "requestId": request_id, "fromDid": our_did,
            "fromDisplayName": identity.profile().display_name,
            "fromAvatar": identity.profile().avatar,
            "fromSigningKey": our_signing, "fromEncryptionKey": our_enc,
        }
    });

    super::dispatcher::emit_event(
        "friend",
        &serde_json::json!({"type": "friendAdded", "request_id": request_id, "friend_did": friend_did, "conversation_id": conv_id}),
    );

    ok_json(serde_json::json!({
        "request_id": request_id, "status": "accepted",
        "conversation_id": conv_id, "friend_did": friend_did,
        "relay_messages": [{ "to_did": friend_did, "payload": relay_envelope.to_string() }],
    }))
}

pub fn friends_build_accept_ack(args: &str) -> DResult {
    let data = json_parse(args)?;
    // Accept both field name conventions:
    //   WASM path sends: accepter_did (the DID to send the ack to)
    //   Dispatcher may also receive: to_did
    let to_did = data["accepter_did"]
        .as_str()
        .or_else(|| data["to_did"].as_str())
        .ok_or_else(|| err(2, "Missing accepter_did or to_did"))?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let identity = state
        .identity
        .as_ref()
        .ok_or_else(|| err(200, "No identity loaded"))?;

    let envelope = serde_json::json!({
        "envelope": "friend_accept_ack", "version": 1,
        "payload": { "fromDid": identity.did_string(), "toDid": to_did }
    });
    ok_json(serde_json::json!({ "to_did": to_did, "payload": envelope.to_string() }))
}

pub fn friends_reject_request(args: &str) -> DResult {
    let data = json_parse(args)?;
    let request_id = require_str(&data, "request_id")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    db.update_request_status(request_id, "rejected")
        .map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event(
        "friend",
        &serde_json::json!({"type": "friendRequestRejected", "request_id": request_id}),
    );

    ok_success()
}

pub fn friends_list() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let friends = db.get_all_friends().map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = friends
        .iter()
        .map(|f| {
            serde_json::json!({
                "did": f.did, "display_name": f.display_name,
                "signing_key": f.signing_key, "encryption_key": f.encryption_key,
                "status": f.status, "avatar": f.avatar, "created_at": f.created_at,
            })
        })
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn friends_pending_requests(args: &str) -> DResult {
    let data = json_parse(args)?;
    let direction = data["direction"].as_str().unwrap_or("incoming");
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let reqs = db
        .get_pending_requests(direction)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = reqs.iter().map(|r| serde_json::json!({
        "id": r.id, "from_did": r.from_did, "to_did": r.to_did,
        "direction": r.direction, "message": r.message,
        "from_signing_key": r.from_signing_key, "from_encryption_key": r.from_encryption_key,
        "from_display_name": r.from_display_name, "from_avatar": r.from_avatar,
        "created_at": r.created_at,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn friends_remove(args: &str) -> DResult {
    let data = json_parse(args)?;
    let did = require_str(&data, "did")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let removed = db.remove_friend(did).map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event(
        "friend",
        &serde_json::json!({"type": "friendRemoved", "did": did}),
    );

    ok_json(serde_json::json!({ "removed": removed }))
}

pub fn friends_block(args: &str) -> DResult {
    let data = json_parse(args)?;
    let did = require_str(&data, "did")?;
    let reason = data["reason"].as_str();
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    db.block_user(did, reason).map_err(|e| err(e.code(), e))?;

    super::dispatcher::emit_event(
        "friend",
        &serde_json::json!({"type": "userBlocked", "did": did}),
    );

    ok_success()
}

pub fn friends_unblock(args: &str) -> DResult {
    let data = json_parse(args)?;
    let did = require_str(&data, "did")?;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let unblocked = db.unblock_user(did).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "unblocked": unblocked }))
}
