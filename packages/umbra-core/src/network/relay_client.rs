//! # Relay Client
//!
//! WebSocket client for connecting to an Umbra relay server.
//! Handles signaling relay, offline message delivery, and
//! single-scan friend adding sessions.
//!
//! ## Architecture
//!
//! The relay client maintains a WebSocket connection to the relay server
//! and provides methods for:
//!
//! - **Signaling**: Forward SDP offers/answers when direct exchange isn't possible
//! - **Offline messaging**: Queue encrypted messages for offline peers
//! - **Session management**: Create/join single-scan friend adding sessions
//!
//! All message payloads are opaque encrypted blobs — the relay never sees plaintext.

use serde::{Deserialize, Serialize};

/// Messages sent from client to relay server.
/// Must match the relay server's `ClientMessage` enum.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RelayClientMessage {
    /// Register this client's DID with the relay server.
    Register {
        /// The DID to register.
        did: String,
    },
    /// Forward a signaling payload to another peer via the relay.
    Signal {
        /// The recipient's DID.
        to_did: String,
        /// The opaque signaling payload.
        payload: String,
    },
    /// Send an encrypted message to another peer (may be queued if offline).
    Send {
        /// The recipient's DID.
        to_did: String,
        /// The encrypted message payload.
        payload: String,
    },
    /// Create a new single-scan friend-adding session.
    CreateSession {
        /// The SDP offer payload for the session.
        offer_payload: String,
    },
    /// Join an existing single-scan friend-adding session.
    JoinSession {
        /// The session identifier to join.
        session_id: String,
        /// The SDP answer payload.
        answer_payload: String,
    },
    /// Fetch any queued offline messages from the relay.
    FetchOffline,
    /// Keepalive ping to the relay server.
    Ping,
    /// Create a new call room for a group.
    CreateCallRoom {
        /// The group identifier for the call room.
        group_id: String,
    },
    /// Join an existing call room.
    JoinCallRoom {
        /// The room identifier to join.
        room_id: String,
    },
    /// Leave a call room.
    LeaveCallRoom {
        /// The room identifier to leave.
        room_id: String,
    },
    /// Send a call signaling payload to a peer in a room.
    CallSignal {
        /// The call room identifier.
        room_id: String,
        /// The recipient's DID.
        to_did: String,
        /// The signaling payload (SDP, ICE candidates, etc.).
        payload: String,
    },
    /// Forward a file transfer protocol message to a peer via the relay.
    /// The payload is a JSON-serialized `FileTransferMessage`.
    FileTransfer {
        /// The recipient's DID.
        to_did: String,
        /// JSON-serialized FileTransferMessage payload.
        payload: String,
    },
}

/// Messages received from the relay server.
/// Must match the relay server's `ServerMessage` enum.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RelayServerMessage {
    /// Confirmation that the client has been registered.
    Registered {
        /// The registered DID.
        did: String,
    },
    /// A forwarded signaling payload from another peer.
    Signal {
        /// The sender's DID.
        from_did: String,
        /// The opaque signaling payload.
        payload: String,
    },
    /// An incoming message from another peer.
    Message {
        /// The sender's DID.
        from_did: String,
        /// The encrypted message payload.
        payload: String,
        /// Unix timestamp of when the message was sent.
        timestamp: i64,
    },
    /// Confirmation that a session was created.
    SessionCreated {
        /// The newly created session identifier.
        session_id: String,
    },
    /// Notification that a peer joined a session.
    SessionJoined {
        /// The session identifier.
        session_id: String,
        /// The joining peer's DID.
        from_did: String,
        /// The SDP answer payload.
        answer_payload: String,
    },
    /// Notification of a session offer from another peer.
    SessionOffer {
        /// The session identifier.
        session_id: String,
        /// The offering peer's DID.
        from_did: String,
        /// The SDP offer payload.
        offer_payload: String,
    },
    /// A batch of offline messages that were queued while the client was away.
    OfflineMessages {
        /// The list of offline messages.
        messages: Vec<OfflineMessageData>,
    },
    /// Keepalive pong response from the relay server.
    Pong,
    /// An error message from the relay server.
    Error {
        /// The error description.
        message: String,
    },
    /// Acknowledgment of a previously sent message.
    Ack {
        /// The acknowledged message identifier.
        id: String,
    },
    /// Confirmation that a call room was created.
    CallRoomCreated {
        /// The new room identifier.
        room_id: String,
        /// The group identifier associated with the room.
        group_id: String,
    },
    /// Notification that a participant joined a call room.
    CallParticipantJoined {
        /// The call room identifier.
        room_id: String,
        /// The joining participant's DID.
        did: String,
    },
    /// Notification that a participant left a call room.
    CallParticipantLeft {
        /// The call room identifier.
        room_id: String,
        /// The departing participant's DID.
        did: String,
    },
    /// A forwarded call signaling payload from another participant.
    CallSignalForward {
        /// The call room identifier.
        room_id: String,
        /// The sender's DID.
        from_did: String,
        /// The signaling payload.
        payload: String,
    },
    /// A forwarded file transfer protocol message from another peer.
    FileTransferMessage {
        /// The sender's DID.
        from_did: String,
        /// JSON-serialized FileTransferMessage payload.
        payload: String,
    },
}

/// An offline message received from the relay.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineMessageData {
    /// Unique message identifier.
    pub id: String,
    /// The sender's DID.
    pub from_did: String,
    /// The encrypted message payload.
    pub payload: String,
    /// Unix timestamp of when the message was originally sent.
    pub timestamp: i64,
}

/// Relay connection status.
#[derive(Debug, Clone, PartialEq)]
pub enum RelayStatus {
    /// Not connected to the relay server.
    Disconnected,
    /// Currently establishing a connection.
    Connecting,
    /// WebSocket connection established but not yet registered.
    Connected,
    /// Registered with the relay server and ready for operations.
    Registered,
    /// Connection is in an error state.
    Error(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_relay_client_message_serialization() {
        let msg = RelayClientMessage::Register {
            did: "did:key:z6MkTest".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"register\""));
        assert!(json.contains("did:key:z6MkTest"));
    }

    #[test]
    fn test_relay_client_message_signal() {
        let msg = RelayClientMessage::Signal {
            to_did: "did:key:z6MkBob".to_string(),
            payload: "{\"sdp\":\"...\"}".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"signal\""));
    }

    #[test]
    fn test_relay_client_message_send() {
        let msg = RelayClientMessage::Send {
            to_did: "did:key:z6MkBob".to_string(),
            payload: "encrypted_data".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"send\""));
    }

    #[test]
    fn test_relay_client_message_create_session() {
        let msg = RelayClientMessage::CreateSession {
            offer_payload: "offer_sdp".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"create_session\""));
    }

    #[test]
    fn test_relay_client_message_join_session() {
        let msg = RelayClientMessage::JoinSession {
            session_id: "sess-123".to_string(),
            answer_payload: "answer_sdp".to_string(),
        };
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"join_session\""));
    }

    #[test]
    fn test_relay_client_message_fetch_offline() {
        let msg = RelayClientMessage::FetchOffline;
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"fetch_offline\""));
    }

    #[test]
    fn test_relay_client_message_ping() {
        let msg = RelayClientMessage::Ping;
        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("\"type\":\"ping\""));
    }

    #[test]
    fn test_relay_server_message_registered() {
        let json = r#"{"type":"registered","did":"did:key:z6MkTest"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::Registered { did } => {
                assert_eq!(did, "did:key:z6MkTest");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_signal() {
        let json = r#"{"type":"signal","from_did":"did:key:z6MkAlice","payload":"sdp_data"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::Signal { from_did, payload } => {
                assert_eq!(from_did, "did:key:z6MkAlice");
                assert_eq!(payload, "sdp_data");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_message() {
        let json = r#"{"type":"message","from_did":"did:key:z6MkAlice","payload":"encrypted","timestamp":12345}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::Message {
                from_did,
                payload,
                timestamp,
            } => {
                assert_eq!(from_did, "did:key:z6MkAlice");
                assert_eq!(payload, "encrypted");
                assert_eq!(timestamp, 12345);
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_session_created() {
        let json = r#"{"type":"session_created","session_id":"sess-abc"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::SessionCreated { session_id } => {
                assert_eq!(session_id, "sess-abc");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_session_joined() {
        let json = r#"{"type":"session_joined","session_id":"sess-abc","from_did":"did:key:z6MkBob","answer_payload":"answer"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::SessionJoined {
                session_id,
                from_did,
                answer_payload,
            } => {
                assert_eq!(session_id, "sess-abc");
                assert_eq!(from_did, "did:key:z6MkBob");
                assert_eq!(answer_payload, "answer");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_session_offer() {
        let json = r#"{"type":"session_offer","session_id":"sess-abc","from_did":"did:key:z6MkAlice","offer_payload":"offer"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::SessionOffer {
                session_id,
                from_did,
                offer_payload,
            } => {
                assert_eq!(session_id, "sess-abc");
                assert_eq!(from_did, "did:key:z6MkAlice");
                assert_eq!(offer_payload, "offer");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_offline_messages() {
        let json = r#"{"type":"offline_messages","messages":[{"id":"msg-1","from_did":"did:key:z6MkAlice","payload":"encrypted","timestamp":1000}]}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::OfflineMessages { messages } => {
                assert_eq!(messages.len(), 1);
                assert_eq!(messages[0].id, "msg-1");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_error() {
        let json = r#"{"type":"error","message":"Something went wrong"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::Error { message } => {
                assert_eq!(message, "Something went wrong");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_pong() {
        let json = r#"{"type":"pong"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::Pong => {}
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_status_equality() {
        assert_eq!(RelayStatus::Disconnected, RelayStatus::Disconnected);
        assert_eq!(RelayStatus::Connected, RelayStatus::Connected);
        assert_ne!(RelayStatus::Connected, RelayStatus::Disconnected);
    }

    #[test]
    fn test_all_client_messages_round_trip() {
        let messages = vec![
            RelayClientMessage::Register {
                did: "did:key:z6MkTest".to_string(),
            },
            RelayClientMessage::Signal {
                to_did: "did:key:z6MkBob".to_string(),
                payload: "offer".to_string(),
            },
            RelayClientMessage::Send {
                to_did: "did:key:z6MkBob".to_string(),
                payload: "msg".to_string(),
            },
            RelayClientMessage::CreateSession {
                offer_payload: "offer".to_string(),
            },
            RelayClientMessage::JoinSession {
                session_id: "s1".to_string(),
                answer_payload: "answer".to_string(),
            },
            RelayClientMessage::FetchOffline,
            RelayClientMessage::Ping,
            RelayClientMessage::CreateCallRoom {
                group_id: "group-1".to_string(),
            },
            RelayClientMessage::JoinCallRoom {
                room_id: "room-1".to_string(),
            },
            RelayClientMessage::LeaveCallRoom {
                room_id: "room-1".to_string(),
            },
            RelayClientMessage::CallSignal {
                room_id: "room-1".to_string(),
                to_did: "did:key:z6MkBob".to_string(),
                payload: "sdp".to_string(),
            },
        ];

        for msg in messages {
            let json = serde_json::to_string(&msg).unwrap();
            let parsed: RelayClientMessage = serde_json::from_str(&json).unwrap();
            let json2 = serde_json::to_string(&parsed).unwrap();
            assert_eq!(json, json2, "Round-trip failed for message: {:?}", msg);
        }
    }

    #[test]
    fn test_relay_server_message_call_room_created() {
        let json = r#"{"type":"call_room_created","room_id":"room-123","group_id":"group-abc"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::CallRoomCreated { room_id, group_id } => {
                assert_eq!(room_id, "room-123");
                assert_eq!(group_id, "group-abc");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_call_participant_joined() {
        let json =
            r#"{"type":"call_participant_joined","room_id":"room-1","did":"did:key:z6MkAlice"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::CallParticipantJoined { room_id, did } => {
                assert_eq!(room_id, "room-1");
                assert_eq!(did, "did:key:z6MkAlice");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_call_participant_left() {
        let json = r#"{"type":"call_participant_left","room_id":"room-1","did":"did:key:z6MkBob"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::CallParticipantLeft { room_id, did } => {
                assert_eq!(room_id, "room-1");
                assert_eq!(did, "did:key:z6MkBob");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_relay_server_message_call_signal_forward() {
        let json = r#"{"type":"call_signal_forward","room_id":"room-1","from_did":"did:key:z6MkAlice","payload":"sdp_offer"}"#;
        let msg: RelayServerMessage = serde_json::from_str(json).unwrap();
        match msg {
            RelayServerMessage::CallSignalForward {
                room_id,
                from_did,
                payload,
            } => {
                assert_eq!(room_id, "room-1");
                assert_eq!(from_did, "did:key:z6MkAlice");
                assert_eq!(payload, "sdp_offer");
            }
            _ => panic!("Wrong variant"),
        }
    }
}
