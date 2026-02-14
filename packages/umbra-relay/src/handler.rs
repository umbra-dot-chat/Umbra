//! WebSocket connection handler.
//!
//! Manages individual WebSocket connections: parsing client messages,
//! routing them through the relay state, and sending responses.

use axum::extract::ws::{Message, WebSocket};
use chrono::Utc;
use futures::{SinkExt, StreamExt};
use tokio::sync::mpsc;

use crate::protocol::{ClientMessage, PeerMessage, ServerMessage};
use crate::state::RelayState;

/// Handle a single WebSocket connection.
///
/// This function runs for the lifetime of the connection:
/// 1. Waits for a `Register` message to associate the connection with a DID
/// 2. Spawns a sender task to forward outbound messages
/// 3. Processes incoming messages until the connection closes
pub async fn handle_websocket(socket: WebSocket, state: RelayState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // Create the outbound channel for this client
    let (tx, mut rx) = mpsc::unbounded_channel::<ServerMessage>();

    // ── Step 1: Wait for Registration ─────────────────────────────────────

    let client_did = loop {
        match ws_receiver.next().await {
            Some(Ok(Message::Text(text))) => {
                match serde_json::from_str::<ClientMessage>(&text) {
                    Ok(ClientMessage::Register { did }) => {
                        if did.is_empty() || !did.starts_with("did:") {
                            let err = ServerMessage::Error {
                                message: "Invalid DID format".to_string(),
                            };
                            let _ = ws_sender
                                .send(Message::Text(serde_json::to_string(&err).unwrap().into()))
                                .await;
                            continue;
                        }

                        // Send registration confirmation
                        let ack = ServerMessage::Registered { did: did.clone() };
                        if ws_sender
                            .send(Message::Text(serde_json::to_string(&ack).unwrap().into()))
                            .await
                            .is_err()
                        {
                            return; // Connection closed
                        }

                        break did;
                    }
                    Ok(ClientMessage::Ping) => {
                        let pong = ServerMessage::Pong;
                        let _ = ws_sender
                            .send(Message::Text(serde_json::to_string(&pong).unwrap().into()))
                            .await;
                    }
                    Ok(_) => {
                        let err = ServerMessage::Error {
                            message: "Must register before sending other messages".to_string(),
                        };
                        let _ = ws_sender
                            .send(Message::Text(serde_json::to_string(&err).unwrap().into()))
                            .await;
                    }
                    Err(e) => {
                        tracing::warn!("Failed to parse client message: {}", e);
                        let err = ServerMessage::Error {
                            message: format!("Invalid message format: {}", e),
                        };
                        let _ = ws_sender
                            .send(Message::Text(serde_json::to_string(&err).unwrap().into()))
                            .await;
                    }
                }
            }
            Some(Ok(Message::Ping(data))) => {
                let _ = ws_sender.send(Message::Pong(data)).await;
            }
            Some(Ok(Message::Close(_))) | None => {
                return; // Connection closed before registration
            }
            _ => continue,
        }
    };

    // ── Step 2: Register Client ───────────────────────────────────────────

    state.register_client(&client_did, tx);
    tracing::info!(did = client_did.as_str(), "WebSocket registered");

    // ── Step 3: Spawn Sender Task ─────────────────────────────────────────

    let sender_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            match serde_json::to_string(&msg) {
                Ok(json) => {
                    if ws_sender.send(Message::Text(json.into())).await.is_err() {
                        break; // Connection closed
                    }
                }
                Err(e) => {
                    tracing::error!("Failed to serialize server message: {}", e);
                }
            }
        }
    });

    // ── Step 4: Process Messages ──────────────────────────────────────────

    while let Some(msg_result) = ws_receiver.next().await {
        match msg_result {
            Ok(Message::Text(text)) => {
                match serde_json::from_str::<ClientMessage>(&text) {
                    Ok(client_msg) => {
                        handle_client_message(&state, &client_did, client_msg).await;
                    }
                    Err(e) => {
                        tracing::warn!(
                            did = client_did.as_str(),
                            error = %e,
                            "Failed to parse client message"
                        );
                        state.send_to_client(
                            &client_did,
                            ServerMessage::Error {
                                message: format!("Invalid message format: {}", e),
                            },
                        );
                    }
                }
            }
            Ok(Message::Ping(_data)) => {
                // Axum handles ping/pong at the protocol level,
                // but if we need to respond manually:
                state.send_to_client(&client_did, ServerMessage::Pong);
            }
            Ok(Message::Close(_)) => {
                tracing::info!(did = client_did.as_str(), "Client sent close frame");
                break;
            }
            Err(e) => {
                tracing::warn!(
                    did = client_did.as_str(),
                    error = %e,
                    "WebSocket error"
                );
                break;
            }
            _ => {} // Binary, Pong — ignore
        }
    }

    // ── Step 5: Cleanup ───────────────────────────────────────────────────

    // Remove from any call rooms and notify remaining participants
    let affected_rooms = state.remove_from_all_call_rooms(&client_did);
    for (room_id, remaining) in &affected_rooms {
        for participant_did in remaining {
            state.send_to_client(
                participant_did,
                ServerMessage::CallParticipantLeft {
                    room_id: room_id.clone(),
                    did: client_did.clone(),
                },
            );
        }
    }

    state.unregister_client(&client_did);
    sender_task.abort();
    tracing::info!(did = client_did.as_str(), "WebSocket disconnected");
}

/// Handle a parsed client message.
async fn handle_client_message(state: &RelayState, from_did: &str, msg: ClientMessage) {
    match msg {
        ClientMessage::Register { .. } => {
            // Already registered — ignore duplicate registrations
            state.send_to_client(
                from_did,
                ServerMessage::Error {
                    message: "Already registered".to_string(),
                },
            );
        }

        ClientMessage::Signal { to_did, payload } => {
            handle_signal(state, from_did, &to_did, &payload);
        }

        ClientMessage::Send { to_did, payload } => {
            handle_send(state, from_did, &to_did, &payload);
        }

        ClientMessage::CreateSession { offer_payload } => {
            handle_create_session(state, from_did, &offer_payload);
        }

        ClientMessage::JoinSession {
            session_id,
            answer_payload,
        } => {
            handle_join_session(state, from_did, &session_id, &answer_payload);
        }

        ClientMessage::FetchOffline => {
            handle_fetch_offline(state, from_did);
        }

        ClientMessage::Ping => {
            state.send_to_client(from_did, ServerMessage::Pong);
        }

        ClientMessage::CreateCallRoom { group_id } => {
            handle_create_call_room(state, from_did, &group_id);
        }

        ClientMessage::JoinCallRoom { room_id } => {
            handle_join_call_room(state, from_did, &room_id);
        }

        ClientMessage::LeaveCallRoom { room_id } => {
            handle_leave_call_room(state, from_did, &room_id);
        }

        ClientMessage::CallSignal {
            room_id,
            to_did,
            payload,
        } => {
            handle_call_signal(state, from_did, &room_id, &to_did, &payload);
        }
    }
}

// ── Message Handlers ──────────────────────────────────────────────────────────

/// Forward a signaling payload (SDP offer/answer) to a peer.
/// Tries local delivery first, then federation, then offline queue.
fn handle_signal(state: &RelayState, from_did: &str, to_did: &str, payload: &str) {
    tracing::debug!(
        from = from_did,
        to = to_did,
        "Forwarding signal"
    );

    // Try local + federation routing
    if state.route_signal(from_did, to_did, payload) {
        return;
    }

    // Peer is unreachable — queue for later delivery
    state.queue_offline_message(to_did, from_did, payload, Utc::now().timestamp());

    state.send_to_client(
        from_did,
        ServerMessage::Ack {
            id: format!("signal_queued_{}", to_did),
        },
    );

    tracing::debug!(
        to = to_did,
        "Signal target offline, queued for later delivery"
    );
}

/// Send an encrypted message to a peer (or queue it for offline delivery).
/// Tries local delivery first, then federation, then offline queue.
fn handle_send(state: &RelayState, from_did: &str, to_did: &str, payload: &str) {
    let timestamp = Utc::now().timestamp();

    // Try local + federation routing
    if !state.route_message(from_did, to_did, payload, timestamp) {
        // Peer is unreachable — queue for later delivery
        state.queue_offline_message(to_did, from_did, payload, timestamp);

        tracing::debug!(
            from = from_did,
            to = to_did,
            "Message target offline, queued for later delivery"
        );
    }

    // Acknowledge receipt
    state.send_to_client(
        from_did,
        ServerMessage::Ack {
            id: format!("msg_{}_{}", to_did, timestamp),
        },
    );
}

/// Create a signaling session for single-scan friend adding.
fn handle_create_session(state: &RelayState, creator_did: &str, offer_payload: &str) {
    let session_id = state.create_session(creator_did, offer_payload);

    state.send_to_client(
        creator_did,
        ServerMessage::SessionCreated {
            session_id,
        },
    );
}

/// Join an existing signaling session.
/// Routes the answer to the creator through federation if they're on another relay.
fn handle_join_session(
    state: &RelayState,
    joiner_did: &str,
    session_id: &str,
    answer_payload: &str,
) {
    // Look up the session
    let session = match state.get_session(session_id) {
        Some(session) => session,
        None => {
            state.send_to_client(
                joiner_did,
                ServerMessage::Error {
                    message: format!("Session '{}' not found or expired", session_id),
                },
            );
            return;
        }
    };

    // Send the offer to the joiner
    state.send_to_client(
        joiner_did,
        ServerMessage::SessionOffer {
            session_id: session_id.to_string(),
            from_did: session.creator_did.clone(),
            offer_payload: session.offer_payload.clone(),
        },
    );

    // Try to deliver the answer to the session creator
    // First try local, then federation
    let answer_sent = state.send_to_client(
        &session.creator_did,
        ServerMessage::SessionJoined {
            session_id: session_id.to_string(),
            from_did: joiner_did.to_string(),
            answer_payload: answer_payload.to_string(),
        },
    );

    if !answer_sent {
        // Try federation
        let fed_sent = if let Some(ref fed) = state.federation {
            fed.forward_session_join(
                &session.creator_did,
                session_id,
                joiner_did,
                answer_payload,
            )
        } else {
            false
        };

        if !fed_sent {
            // Creator unreachable — queue the answer
            state.queue_offline_message(
                &session.creator_did,
                joiner_did,
                answer_payload,
                Utc::now().timestamp(),
            );
        }
    }

    // Mark session as consumed
    state.consume_session(session_id);
}

/// Deliver all queued offline messages.
fn handle_fetch_offline(state: &RelayState, did: &str) {
    let messages = state.drain_offline_messages(did);

    tracing::debug!(
        did = did,
        count = messages.len(),
        "Delivering offline messages"
    );

    state.send_to_client(
        did,
        ServerMessage::OfflineMessages { messages },
    );
}

// ── Call Room Handlers ────────────────────────────────────────────────────────

/// Create a new call room for group calling.
fn handle_create_call_room(state: &RelayState, creator_did: &str, group_id: &str) {
    let room_id = state.create_call_room(group_id, creator_did);

    state.send_to_client(
        creator_did,
        ServerMessage::CallRoomCreated {
            room_id,
            group_id: group_id.to_string(),
        },
    );
}

/// Join an existing call room and notify all participants.
fn handle_join_call_room(state: &RelayState, joiner_did: &str, room_id: &str) {
    match state.join_call_room(room_id, joiner_did) {
        Some(existing_participants) => {
            // Notify all existing participants that someone joined
            for participant_did in &existing_participants {
                state.send_to_client(
                    participant_did,
                    ServerMessage::CallParticipantJoined {
                        room_id: room_id.to_string(),
                        did: joiner_did.to_string(),
                    },
                );
            }

            // Send ack to the joiner
            state.send_to_client(
                joiner_did,
                ServerMessage::Ack {
                    id: format!("call_room_joined_{}", room_id),
                },
            );
        }
        None => {
            state.send_to_client(
                joiner_did,
                ServerMessage::Error {
                    message: format!("Call room '{}' not found or full", room_id),
                },
            );
        }
    }
}

/// Leave a call room and notify remaining participants.
fn handle_leave_call_room(state: &RelayState, leaver_did: &str, room_id: &str) {
    let remaining = state.leave_call_room(room_id, leaver_did);

    // Notify remaining participants
    for participant_did in &remaining {
        state.send_to_client(
            participant_did,
            ServerMessage::CallParticipantLeft {
                room_id: room_id.to_string(),
                did: leaver_did.to_string(),
            },
        );
    }
}

/// Forward a call signaling payload to a specific participant within a room.
fn handle_call_signal(
    state: &RelayState,
    from_did: &str,
    room_id: &str,
    to_did: &str,
    payload: &str,
) {
    // Verify both sender and target are in the room
    if !state.is_in_call_room(room_id, from_did) {
        state.send_to_client(
            from_did,
            ServerMessage::Error {
                message: "You are not in this call room".to_string(),
            },
        );
        return;
    }

    if !state.is_in_call_room(room_id, to_did) {
        state.send_to_client(
            from_did,
            ServerMessage::Error {
                message: format!("Target '{}' is not in this call room", to_did),
            },
        );
        return;
    }

    state.send_to_client(
        to_did,
        ServerMessage::CallSignalForward {
            room_id: room_id.to_string(),
            from_did: from_did.to_string(),
            payload: payload.to_string(),
        },
    );
}

// ── Federation Peer Connection Handler ────────────────────────────────────────

/// Handle an inbound WebSocket connection from a peer relay.
///
/// This is the server-side handler for when another relay connects to us
/// via the `/federation` endpoint. It mirrors the outbound connection logic
/// in `federation.rs` — both sides exchange Hello, PresenceSync, and forward
/// messages bidirectionally.
pub async fn handle_federation_peer(socket: WebSocket, state: RelayState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    let federation = match &state.federation {
        Some(fed) => fed.clone(),
        None => {
            tracing::warn!("Federation connection rejected: federation not enabled");
            let err = serde_json::to_string(&ServerMessage::Error {
                message: "Federation not enabled on this relay".to_string(),
            })
            .unwrap();
            let _ = ws_sender.send(Message::Text(err.into())).await;
            return;
        }
    };

    // Send our Hello
    let hello = PeerMessage::Hello {
        relay_id: federation.relay_id.clone(),
        relay_url: federation.relay_url.clone(),
        region: federation.region.clone(),
        location: federation.location.clone(),
    };
    if let Ok(json) = serde_json::to_string(&hello) {
        if ws_sender.send(Message::Text(json.into())).await.is_err() {
            return;
        }
    }

    // Send our current presence
    let presence = PeerMessage::PresenceSync {
        relay_id: federation.relay_id.clone(),
        online_dids: state.local_online_dids(),
    };
    if let Ok(json) = serde_json::to_string(&presence) {
        if ws_sender.send(Message::Text(json.into())).await.is_err() {
            return;
        }
    }

    // Create sender channel for this inbound peer
    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<PeerMessage>();
    let mut peer_url: Option<String> = None;

    // Spawn sender task
    let sender_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if let Ok(json) = serde_json::to_string(&msg) {
                if ws_sender.send(Message::Text(json.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Process incoming messages from peer
    while let Some(msg_result) = ws_receiver.next().await {
        match msg_result {
            Ok(Message::Text(text)) => {
                match serde_json::from_str::<PeerMessage>(&text) {
                    Ok(peer_msg) => {
                        // Capture peer URL from Hello
                        if let PeerMessage::Hello { ref relay_url, .. } = peer_msg {
                            peer_url = Some(relay_url.clone());
                            // Register this inbound peer's sender
                            federation
                                .peer_senders
                                .insert(relay_url.clone(), tx.clone());
                        }

                        let url = peer_url.as_deref().unwrap_or("unknown");
                        federation.handle_peer_message(url, peer_msg);
                    }
                    Err(e) => {
                        tracing::warn!(error = %e, "Failed to parse federation message");
                    }
                }
            }
            Ok(Message::Close(_)) => break,
            Err(e) => {
                tracing::warn!(error = %e, "Federation peer WebSocket error");
                break;
            }
            _ => {}
        }
    }

    // Cleanup
    if let Some(ref url) = peer_url {
        federation.peer_senders.remove(url);
        federation.remove_peer_presence_pub(url);
        tracing::info!(peer = url.as_str(), "Federation peer disconnected");
    }
    sender_task.abort();
}

// ── Federation Inbound Handler ───────────────────────────────────────────────

/// Handle a message forwarded from a federated peer relay.
///
/// This runs in a background task and processes messages that arrive from
/// peer relays via the federation inbound channel. It delivers them to
/// locally-connected clients.
pub async fn handle_federation_inbound(
    state: RelayState,
    mut rx: tokio::sync::mpsc::UnboundedReceiver<PeerMessage>,
) {
    while let Some(msg) = rx.recv().await {
        match msg {
            PeerMessage::ForwardSignal {
                from_did,
                to_did,
                payload,
            } => {
                tracing::debug!(
                    from = from_did.as_str(),
                    to = to_did.as_str(),
                    "Delivering federated signal"
                );

                let server_msg = ServerMessage::Signal {
                    from_did,
                    payload,
                };
                if !state.send_to_client(&to_did, server_msg) {
                    // Target went offline between routing lookup and delivery
                    tracing::debug!(to = to_did.as_str(), "Federated signal target offline");
                }
            }

            PeerMessage::ForwardMessage {
                from_did,
                to_did,
                payload,
                timestamp,
            } => {
                tracing::debug!(
                    from = from_did.as_str(),
                    to = to_did.as_str(),
                    "Delivering federated message"
                );

                let server_msg = ServerMessage::Message {
                    from_did: from_did.clone(),
                    payload: payload.clone(),
                    timestamp,
                };
                if !state.send_to_client(&to_did, server_msg) {
                    // Target went offline — queue locally
                    state.queue_offline_message(&to_did, &from_did, &payload, timestamp);
                }
            }

            PeerMessage::ForwardSessionJoin {
                session_id,
                joiner_did,
                answer_payload,
            } => {
                tracing::debug!(
                    session_id = session_id.as_str(),
                    joiner = joiner_did.as_str(),
                    "Delivering federated session join"
                );

                // Look up the session to find the creator
                if let Some(session) = state.get_session(&session_id) {
                    let answer_sent = state.send_to_client(
                        &session.creator_did,
                        ServerMessage::SessionJoined {
                            session_id: session_id.clone(),
                            from_did: joiner_did.clone(),
                            answer_payload: answer_payload.clone(),
                        },
                    );

                    if !answer_sent {
                        state.queue_offline_message(
                            &session.creator_did,
                            &joiner_did,
                            &answer_payload,
                            Utc::now().timestamp(),
                        );
                    }

                    state.consume_session(&session_id);
                }
            }

            PeerMessage::SessionSync {
                session_id,
                creator_did,
                offer_payload,
                created_at,
            } => {
                tracing::debug!(
                    session_id = session_id.as_str(),
                    creator = creator_did.as_str(),
                    "Importing federated session"
                );

                state.import_session(&session_id, &creator_did, &offer_payload, created_at);
            }

            PeerMessage::ForwardOffline {
                to_did,
                from_did,
                payload,
                timestamp,
            } => {
                tracing::debug!(
                    from = from_did.as_str(),
                    to = to_did.as_str(),
                    "Queuing federated offline message"
                );

                state.queue_offline_message(&to_did, &from_did, &payload, timestamp);
            }

            // Presence messages are handled by the federation module directly
            _ => {}
        }
    }
}
