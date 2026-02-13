use crate::state::AppState;
use umbra_core::discovery::ConnectionInfo;

/// Get network status as JSON.
#[tauri::command]
pub async fn network_status(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let is_running = *state.network_running.read().await;
    let json = serde_json::json!({
        "is_running": is_running,
        "peer_count": 0,
        "listen_addresses": [],
    });
    Ok(json.to_string())
}

/// Start the network service.
///
/// On desktop, this uses native TCP + libp2p (not WebRTC).
/// For now this is a stub — full TCP networking will be wired
/// in a follow-up after the desktop build is working.
#[tauri::command]
pub async fn start_network(
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    *state.network_running.write().await = true;
    Ok(true)
}

/// Stop the network service.
#[tauri::command]
pub async fn stop_network(
    state: tauri::State<'_, AppState>,
) -> Result<bool, String> {
    *state.network_running.write().await = false;
    Ok(true)
}

/// Create a WebRTC offer (stub for desktop — WebRTC is browser-only).
#[tauri::command]
pub async fn create_offer(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;

    let json = serde_json::json!({
        "sdp": "desktop_native_tcp",
        "sdp_type": "offer",
        "ice_candidates": [],
        "did": identity.did_string(),
        "peer_id": "",
    });

    Ok(json.to_string())
}

/// Accept a WebRTC offer (stub for desktop).
#[tauri::command]
pub async fn accept_offer(
    _offer_json: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;

    let json = serde_json::json!({
        "sdp": "desktop_native_tcp_answer",
        "sdp_type": "answer",
        "ice_candidates": [],
        "did": identity.did_string(),
        "peer_id": "",
    });

    Ok(json.to_string())
}

/// Complete handshake (stub for desktop).
#[tauri::command]
pub async fn complete_handshake(
    _answer_json: String,
) -> Result<bool, String> {
    Ok(true)
}

/// Complete answerer (stub for desktop).
#[tauri::command]
pub async fn complete_answerer(
    _offerer_did: Option<String>,
    _offerer_peer_id: Option<String>,
) -> Result<bool, String> {
    Ok(true)
}

/// Get connection info for sharing.
#[tauri::command]
pub async fn get_connection_info(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;

    let json = serde_json::json!({
        "link": "",
        "json": "",
        "base64": "",
        "did": identity.did_string(),
        "peer_id": "",
        "addresses": [],
        "display_name": identity.profile().display_name,
    });

    Ok(json.to_string())
}

/// Parse connection info from string.
#[tauri::command]
pub async fn parse_connection_info(
    info: String,
) -> Result<String, String> {
    let connection_info = if info.starts_with("umbra://") {
        ConnectionInfo::from_link(&info)
    } else if info.starts_with('{') {
        ConnectionInfo::from_json(&info)
    } else {
        ConnectionInfo::from_base64(&info)
    };

    let ci = connection_info
        .map_err(|e| format!("Invalid connection info: {}", e))?;

    let json = serde_json::json!({
        "did": ci.did,
        "peer_id": ci.peer_id,
        "addresses": ci.addresses,
        "display_name": ci.display_name,
    });

    Ok(json.to_string())
}

// ── Relay stubs ────────────────────────────────────────────────────────

#[tauri::command]
pub async fn relay_connect(
    relay_url: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;
    let did = identity.did_string();

    let register_msg = serde_json::json!({
        "type": "register",
        "did": did,
    });

    let result = serde_json::json!({
        "connected": true,
        "relay_url": relay_url,
        "did": did,
        "register_message": register_msg.to_string(),
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn relay_disconnect() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn relay_create_session(
    relay_url: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;
    let did = identity.did_string();

    let offer_json = serde_json::json!({
        "sdp": "desktop_native_tcp",
        "sdp_type": "offer",
        "ice_candidates": [],
        "did": did,
        "peer_id": "",
    }).to_string();

    let create_session_msg = serde_json::json!({
        "type": "create_session",
        "offer_payload": offer_json,
    });

    let result = serde_json::json!({
        "relay_url": relay_url,
        "did": did,
        "peer_id": "",
        "offer_payload": offer_json,
        "create_session_message": create_session_msg.to_string(),
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn relay_accept_session(
    session_id: String,
    _offer_payload: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;
    let did = identity.did_string();

    let answer_json = serde_json::json!({
        "sdp": "desktop_native_tcp_answer",
        "sdp_type": "answer",
        "ice_candidates": [],
        "did": did,
        "peer_id": "",
    }).to_string();

    let join_session_msg = serde_json::json!({
        "type": "join_session",
        "session_id": session_id,
        "answer_payload": answer_json,
    });

    let result = serde_json::json!({
        "session_id": session_id,
        "answer_payload": answer_json,
        "join_session_message": join_session_msg.to_string(),
        "did": did,
        "peer_id": "",
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn relay_send(
    to_did: String,
    payload: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;
    let did = identity.did_string();

    let send_msg = serde_json::json!({
        "type": "send",
        "to_did": to_did,
        "payload": payload,
    });

    let result = serde_json::json!({
        "sent": true,
        "to_did": to_did,
        "from_did": did,
        "relay_message": send_msg.to_string(),
    });

    Ok(result.to_string())
}

#[tauri::command]
pub async fn relay_fetch_offline() -> Result<String, String> {
    let msg = serde_json::json!({
        "type": "fetch_offline",
    });
    Ok(msg.to_string())
}
