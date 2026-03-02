//! WebSocket relay client for real-time messaging.
//!
//! Maintains a persistent WebSocket connection to the Umbra relay server.
//! Handles registration, message sending/receiving, offline message fetching,
//! and automatic reconnection with exponential backoff.

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message as WsMessage;

/// WebSocket URL for the relay server.
const RELAY_WS_URL: &str = "wss://relay.umbra.chat/ws";

/// Maximum reconnect delay (30 seconds).
const MAX_RECONNECT_DELAY: Duration = Duration::from_secs(30);

/// Ping interval to keep the connection alive.
const PING_INTERVAL: Duration = Duration::from_secs(30);

// ── Events sent from relay to the app ───────────────────────────────────

/// Events the relay client sends to the application.
#[derive(Debug)]
pub enum RelayEvent {
    /// Successfully connected and registered with the relay.
    Connected,
    /// Disconnected from the relay (will attempt reconnect).
    Disconnected,
    /// Received a message from another user.
    Message {
        from_did: String,
        payload: String,
        timestamp: Option<u64>,
    },
    /// Received offline messages that were queued while disconnected.
    OfflineMessages {
        messages: Vec<RelayMessage>,
    },
    /// An invite code was successfully resolved.
    InviteResolved {
        code: String,
        community_id: String,
        community_name: String,
        community_description: Option<String>,
        member_count: u32,
        invite_payload: String,
    },
    /// An invite code was not found.
    InviteNotFound {
        code: String,
    },
    /// An error occurred.
    Error(String),
}

/// A single message from the relay.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayMessage {
    pub from_did: String,
    pub payload: String,
    pub timestamp: Option<u64>,
}

// ── Commands sent from the app to the relay ─────────────────────────────

/// Commands the application can send to the relay client.
#[derive(Debug)]
enum RelayCommand {
    /// Send a message to a DID via the relay.
    Send { to_did: String, payload: String },
    /// Request offline messages from the relay.
    FetchOffline,
    /// Publish a community invite to the relay.
    PublishInvite {
        code: String,
        community_id: String,
        community_name: String,
        community_description: Option<String>,
        member_count: u32,
        max_uses: Option<i32>,
        expires_at: Option<i64>,
        invite_payload: String,
    },
    /// Resolve an invite code via the relay.
    ResolveInvite { code: String },
    /// Revoke a published invite.
    RevokeInvite { code: String },
    /// Shut down the relay connection.
    Shutdown,
}

// ── Relay wire protocol types ───────────────────────────────────────────

#[derive(Serialize)]
struct RegisterMsg {
    #[serde(rename = "type")]
    msg_type: String,
    did: String,
}

#[derive(Serialize)]
struct SendMsg {
    #[serde(rename = "type")]
    msg_type: String,
    to_did: String,
    payload: String,
}

#[derive(Serialize)]
struct FetchOfflineMsg {
    #[serde(rename = "type")]
    msg_type: String,
}

#[derive(Serialize)]
struct PingMsg {
    #[serde(rename = "type")]
    msg_type: String,
}

#[derive(Serialize)]
#[allow(dead_code)]
struct AckMsg {
    #[serde(rename = "type")]
    msg_type: String,
    id: String,
}

#[derive(Serialize)]
struct PublishInviteMsg {
    #[serde(rename = "type")]
    msg_type: String,
    code: String,
    community_id: String,
    community_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    community_description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    community_icon: Option<String>,
    member_count: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_uses: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    expires_at: Option<i64>,
    invite_payload: String,
}

#[derive(Serialize)]
struct ResolveInviteMsg {
    #[serde(rename = "type")]
    msg_type: String,
    code: String,
}

#[derive(Serialize)]
struct RevokeInviteMsg {
    #[serde(rename = "type")]
    msg_type: String,
    code: String,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct IncomingMsg {
    #[serde(rename = "type")]
    msg_type: String,
    #[serde(default)]
    from_did: Option<String>,
    #[serde(default)]
    payload: Option<String>,
    #[serde(default)]
    timestamp: Option<u64>,
    #[serde(default)]
    messages: Option<Vec<OfflineMsg>>,
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    message: Option<String>,
    // Invite-related fields
    #[serde(default)]
    code: Option<String>,
    #[serde(default)]
    community_id: Option<String>,
    #[serde(default)]
    community_name: Option<String>,
    #[serde(default)]
    community_description: Option<String>,
    #[serde(default)]
    member_count: Option<u32>,
    #[serde(default)]
    invite_payload: Option<String>,
}

#[derive(Deserialize, Clone)]
struct OfflineMsg {
    from_did: String,
    payload: String,
    timestamp: Option<u64>,
}

// ── Relay handle (app-facing API) ───────────────────────────────────────

/// Handle for communicating with the relay client task.
pub struct RelayHandle {
    cmd_tx: mpsc::UnboundedSender<RelayCommand>,
}

impl RelayHandle {
    /// Connect to the relay and start the background task.
    ///
    /// Returns a handle for sending commands and spawns a tokio task
    /// that maintains the connection, sending events via `event_tx`.
    pub fn connect(
        did: String,
        event_tx: mpsc::UnboundedSender<RelayEvent>,
    ) -> Self {
        let (cmd_tx, cmd_rx) = mpsc::unbounded_channel();

        tokio::spawn(relay_task(did, event_tx, cmd_rx));

        Self { cmd_tx }
    }

    /// Send a message to a DID via the relay.
    pub fn send(&self, to_did: String, payload: String) {
        let _ = self.cmd_tx.send(RelayCommand::Send { to_did, payload });
    }

    /// Request offline messages from the relay.
    #[allow(dead_code)]
    pub fn fetch_offline(&self) {
        let _ = self.cmd_tx.send(RelayCommand::FetchOffline);
    }

    /// Publish a community invite to the relay for resolution.
    pub fn publish_invite(
        &self,
        code: String,
        community_id: String,
        community_name: String,
        community_description: Option<String>,
        member_count: u32,
        max_uses: Option<i32>,
        expires_at: Option<i64>,
        invite_payload: String,
    ) {
        let _ = self.cmd_tx.send(RelayCommand::PublishInvite {
            code,
            community_id,
            community_name,
            community_description,
            member_count,
            max_uses,
            expires_at,
            invite_payload,
        });
    }

    /// Resolve an invite code via the relay.
    pub fn resolve_invite(&self, code: String) {
        let _ = self.cmd_tx.send(RelayCommand::ResolveInvite { code });
    }

    /// Revoke a published invite.
    #[allow(dead_code)]
    pub fn revoke_invite(&self, code: String) {
        let _ = self.cmd_tx.send(RelayCommand::RevokeInvite { code });
    }

    /// Shut down the relay connection gracefully.
    #[allow(dead_code)]
    pub fn shutdown(&self) {
        let _ = self.cmd_tx.send(RelayCommand::Shutdown);
    }
}

// ── Background relay task ───────────────────────────────────────────────

async fn relay_task(
    did: String,
    event_tx: mpsc::UnboundedSender<RelayEvent>,
    mut cmd_rx: mpsc::UnboundedReceiver<RelayCommand>,
) {
    let mut reconnect_delay = Duration::from_secs(2);

    loop {
        match connect_and_run(&did, &event_tx, &mut cmd_rx).await {
            Ok(should_shutdown) => {
                if should_shutdown {
                    return;
                }
            }
            Err(e) => {
                let _ = event_tx.send(RelayEvent::Error(format!("Relay error: {e}")));
            }
        }

        let _ = event_tx.send(RelayEvent::Disconnected);

        // Exponential backoff reconnect
        sleep(reconnect_delay).await;
        reconnect_delay = (reconnect_delay * 2).min(MAX_RECONNECT_DELAY);
    }
}

/// Connect to the relay, register, and run the message loop.
/// Returns Ok(true) if shutdown was requested, Ok(false) for reconnect.
async fn connect_and_run(
    did: &str,
    event_tx: &mpsc::UnboundedSender<RelayEvent>,
    cmd_rx: &mut mpsc::UnboundedReceiver<RelayCommand>,
) -> Result<bool, String> {
    let (ws_stream, _) = connect_async(RELAY_WS_URL)
        .await
        .map_err(|e| format!("WebSocket connect failed: {e}"))?;

    let (mut write, mut read) = ws_stream.split();

    // Register with our DID
    let register = serde_json::to_string(&RegisterMsg {
        msg_type: "register".into(),
        did: did.to_string(),
    })
    .map_err(|e| format!("Serialize error: {e}"))?;

    write
        .send(WsMessage::Text(register))
        .await
        .map_err(|e| format!("Send register failed: {e}"))?;

    // Fetch offline messages
    let fetch = serde_json::to_string(&FetchOfflineMsg {
        msg_type: "fetch_offline".into(),
    })
    .map_err(|e| format!("Serialize error: {e}"))?;

    write
        .send(WsMessage::Text(fetch))
        .await
        .map_err(|e| format!("Send fetch_offline failed: {e}"))?;

    let _ = event_tx.send(RelayEvent::Connected);

    // Create a ping interval
    let mut ping_interval = tokio::time::interval(PING_INTERVAL);
    ping_interval.tick().await; // consume the immediate first tick

    loop {
        tokio::select! {
            // Read from WebSocket
            msg = read.next() => {
                match msg {
                    Some(Ok(WsMessage::Text(text))) => {
                        handle_incoming_message(&text, event_tx);
                    }
                    Some(Ok(WsMessage::Close(_))) | None => {
                        return Ok(false); // reconnect
                    }
                    Some(Err(e)) => {
                        return Err(format!("WebSocket read error: {e}"));
                    }
                    _ => {} // Binary, Ping, Pong — ignore
                }
            }

            // Process commands from the app
            cmd = cmd_rx.recv() => {
                match cmd {
                    Some(RelayCommand::Send { to_did, payload }) => {
                        let msg = serde_json::to_string(&SendMsg {
                            msg_type: "send".into(),
                            to_did,
                            payload,
                        })
                        .unwrap_or_default();

                        if write.send(WsMessage::Text(msg)).await.is_err() {
                            return Ok(false); // reconnect
                        }
                    }
                    Some(RelayCommand::FetchOffline) => {
                        let msg = serde_json::to_string(&FetchOfflineMsg {
                            msg_type: "fetch_offline".into(),
                        })
                        .unwrap_or_default();

                        if write.send(WsMessage::Text(msg)).await.is_err() {
                            return Ok(false);
                        }
                    }
                    Some(RelayCommand::PublishInvite {
                        code, community_id, community_name, community_description,
                        member_count, max_uses, expires_at, invite_payload,
                    }) => {
                        let msg = serde_json::to_string(&PublishInviteMsg {
                            msg_type: "publish_invite".into(),
                            code,
                            community_id,
                            community_name,
                            community_description,
                            community_icon: None,
                            member_count,
                            max_uses,
                            expires_at,
                            invite_payload,
                        })
                        .unwrap_or_default();

                        if write.send(WsMessage::Text(msg)).await.is_err() {
                            return Ok(false);
                        }
                    }
                    Some(RelayCommand::ResolveInvite { code }) => {
                        let msg = serde_json::to_string(&ResolveInviteMsg {
                            msg_type: "resolve_invite".into(),
                            code,
                        })
                        .unwrap_or_default();

                        if write.send(WsMessage::Text(msg)).await.is_err() {
                            return Ok(false);
                        }
                    }
                    Some(RelayCommand::RevokeInvite { code }) => {
                        let msg = serde_json::to_string(&RevokeInviteMsg {
                            msg_type: "revoke_invite".into(),
                            code,
                        })
                        .unwrap_or_default();

                        if write.send(WsMessage::Text(msg)).await.is_err() {
                            return Ok(false);
                        }
                    }
                    Some(RelayCommand::Shutdown) => {
                        let _ = write.close().await;
                        return Ok(true); // shutdown
                    }
                    None => {
                        // All senders dropped — shut down
                        let _ = write.close().await;
                        return Ok(true);
                    }
                }
            }

            // Periodic ping to keep connection alive
            _ = ping_interval.tick() => {
                let ping = serde_json::to_string(&PingMsg {
                    msg_type: "ping".into(),
                })
                .unwrap_or_default();

                if write.send(WsMessage::Text(ping)).await.is_err() {
                    return Ok(false); // reconnect
                }
            }
        }
    }
}

/// Parse and dispatch an incoming relay message.
fn handle_incoming_message(
    text: &str,
    event_tx: &mpsc::UnboundedSender<RelayEvent>,
) {
    let msg: IncomingMsg = match serde_json::from_str(text) {
        Ok(m) => m,
        Err(_) => return,
    };

    match msg.msg_type.as_str() {
        "message" => {
            if let (Some(from_did), Some(payload)) = (msg.from_did, msg.payload) {
                let _ = event_tx.send(RelayEvent::Message {
                    from_did,
                    payload,
                    timestamp: msg.timestamp,
                });
            }
        }
        "offline_messages" => {
            if let Some(messages) = msg.messages {
                let relay_msgs: Vec<RelayMessage> = messages
                    .into_iter()
                    .map(|m| RelayMessage {
                        from_did: m.from_did,
                        payload: m.payload,
                        timestamp: m.timestamp,
                    })
                    .collect();
                let _ = event_tx.send(RelayEvent::OfflineMessages {
                    messages: relay_msgs,
                });
            }
        }
        "invite_resolved" => {
            if let Some(code) = msg.code {
                let _ = event_tx.send(RelayEvent::InviteResolved {
                    code,
                    community_id: msg.community_id.unwrap_or_default(),
                    community_name: msg.community_name.unwrap_or_else(|| "Unknown".into()),
                    community_description: msg.community_description,
                    member_count: msg.member_count.unwrap_or(0),
                    invite_payload: msg.invite_payload.unwrap_or_default(),
                });
            }
        }
        "invite_not_found" => {
            if let Some(code) = msg.code {
                let _ = event_tx.send(RelayEvent::InviteNotFound { code });
            }
        }
        "ack" | "pong" | "registered" => {
            // Expected responses — no action needed
        }
        "error" => {
            if let Some(message) = msg.message {
                let _ = event_tx.send(RelayEvent::Error(message));
            }
        }
        _ => {
            // Unknown message type — ignore
        }
    }
}
