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
    Register {
        did: String,
    },
    Signal {
        to_did: String,
        payload: String,
    },
    Send {
        to_did: String,
        payload: String,
    },
    CreateSession {
        offer_payload: String,
    },
    JoinSession {
        session_id: String,
        answer_payload: String,
    },
    FetchOffline,
    Ping,
    CreateCallRoom {
        group_id: String,
    },
    JoinCallRoom {
        room_id: String,
    },
    LeaveCallRoom {
        room_id: String,
    },
    CallSignal {
        room_id: String,
        to_did: String,
        payload: String,
    },
}

/// Messages received from the relay server.
/// Must match the relay server's `ServerMessage` enum.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RelayServerMessage {
    Registered {
        did: String,
    },
    Signal {
        from_did: String,
        payload: String,
    },
    Message {
        from_did: String,
        payload: String,
        timestamp: i64,
    },
    SessionCreated {
        session_id: String,
    },
    SessionJoined {
        session_id: String,
        from_did: String,
        answer_payload: String,
    },
    SessionOffer {
        session_id: String,
        from_did: String,
        offer_payload: String,
    },
    OfflineMessages {
        messages: Vec<OfflineMessageData>,
    },
    Pong,
    Error {
        message: String,
    },
    Ack {
        id: String,
    },
    CallRoomCreated {
        room_id: String,
        group_id: String,
    },
    CallParticipantJoined {
        room_id: String,
        did: String,
    },
    CallParticipantLeft {
        room_id: String,
        did: String,
    },
    CallSignalForward {
        room_id: String,
        from_did: String,
        payload: String,
    },
}

/// An offline message received from the relay.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineMessageData {
    pub id: String,
    pub from_did: String,
    pub payload: String,
    pub timestamp: i64,
}

/// Relay connection status.
#[derive(Debug, Clone, PartialEq)]
pub enum RelayStatus {
    Disconnected,
    Connecting,
    Connected,
    Registered,
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
            RelayServerMessage::Message { from_did, payload, timestamp } => {
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
            RelayServerMessage::SessionJoined { session_id, from_did, answer_payload } => {
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
            RelayServerMessage::SessionOffer { session_id, from_did, offer_payload } => {
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
            RelayClientMessage::Register { did: "did:key:z6MkTest".to_string() },
            RelayClientMessage::Signal { to_did: "did:key:z6MkBob".to_string(), payload: "offer".to_string() },
            RelayClientMessage::Send { to_did: "did:key:z6MkBob".to_string(), payload: "msg".to_string() },
            RelayClientMessage::CreateSession { offer_payload: "offer".to_string() },
            RelayClientMessage::JoinSession { session_id: "s1".to_string(), answer_payload: "answer".to_string() },
            RelayClientMessage::FetchOffline,
            RelayClientMessage::Ping,
            RelayClientMessage::CreateCallRoom { group_id: "group-1".to_string() },
            RelayClientMessage::JoinCallRoom { room_id: "room-1".to_string() },
            RelayClientMessage::LeaveCallRoom { room_id: "room-1".to_string() },
            RelayClientMessage::CallSignal { room_id: "room-1".to_string(), to_did: "did:key:z6MkBob".to_string(), payload: "sdp".to_string() },
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
        let json = r#"{"type":"call_participant_joined","room_id":"room-1","did":"did:key:z6MkAlice"}"#;
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
            RelayServerMessage::CallSignalForward { room_id, from_did, payload } => {
                assert_eq!(room_id, "room-1");
                assert_eq!(from_did, "did:key:z6MkAlice");
                assert_eq!(payload, "sdp_offer");
            }
            _ => panic!("Wrong variant"),
        }
    }
}
