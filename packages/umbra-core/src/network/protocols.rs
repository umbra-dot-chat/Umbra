//! # Custom Protocols
//!
//! Umbra-specific application protocols built on libp2p.
//!
//! ## Protocol Overview
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                       UMBRA PROTOCOLS                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  /umbra/messaging/1.0.0                                                │
//! │  ──────────────────────                                                 │
//! │  Direct encrypted messaging between peers.                             │
//! │                                                                         │
//! │  Request:                                                              │
//! │    - message_id: UUID                                                  │
//! │    - encrypted_content: bytes (E2E encrypted)                         │
//! │    - nonce: bytes                                                      │
//! │    - timestamp: i64                                                    │
//! │                                                                         │
//! │  Response:                                                             │
//! │    - status: Delivered | Failed                                        │
//! │    - message_id: UUID (echo back)                                      │
//! │                                                                         │
//! │  /umbra/friends/1.0.0                                                  │
//! │  ────────────────────                                                   │
//! │  Friend request and acceptance protocol.                               │
//! │                                                                         │
//! │  Request:                                                              │
//! │    - request_type: Request | Accept | Reject                          │
//! │    - from_did: string                                                  │
//! │    - to_did: string                                                    │
//! │    - message: optional string                                          │
//! │    - public_keys: PublicKey                                            │
//! │                                                                         │
//! │  Response:                                                             │
//! │    - status: OK | Rejected | Error                                     │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use serde::{Deserialize, Serialize};

/// Protocol identifiers
pub mod protocol_ids {
    /// Messaging protocol
    pub const MESSAGING: &str = "/umbra/messaging/1.0.0";

    /// Friend request protocol
    pub const FRIENDS: &str = "/umbra/friends/1.0.0";

    /// Presence protocol (online/offline status)
    pub const PRESENCE: &str = "/umbra/presence/1.0.0";
}

// ============================================================================
// MESSAGING PROTOCOL
// ============================================================================

/// A message sent between peers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageRequest {
    /// Unique message ID
    pub message_id: String,
    /// Encrypted message content
    pub encrypted_content: Vec<u8>,
    /// AES-GCM nonce
    pub nonce: Vec<u8>,
    /// When the message was created (Unix timestamp ms)
    pub timestamp: i64,
}

/// Response to a message request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageResponse {
    /// The message ID being acknowledged
    pub message_id: String,
    /// Delivery status
    pub status: MessageDeliveryStatus,
}

/// Message delivery status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageDeliveryStatus {
    /// Message was delivered successfully
    Delivered,
    /// Message delivery failed
    Failed {
        /// Reason for failure
        reason: String,
    },
}

// ============================================================================
// FRIENDS PROTOCOL
// ============================================================================

/// Type of friend request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FriendRequestType {
    /// Initial friend request
    Request,
    /// Accept a friend request
    Accept,
    /// Reject a friend request
    Reject,
    /// Cancel a sent request
    Cancel,
}

/// A friend request sent between peers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FriendRequest {
    /// Type of request
    pub request_type: FriendRequestType,
    /// Sender's DID
    pub from_did: String,
    /// Sender's display name
    pub from_display_name: String,
    /// Sender's signing public key (hex)
    pub from_signing_key: String,
    /// Sender's encryption public key (hex)
    pub from_encryption_key: String,
    /// Recipient's DID
    pub to_did: String,
    /// Optional message with the request
    pub message: Option<String>,
    /// When this request was created
    pub timestamp: i64,
    /// Signature of the request (proves sender)
    pub signature: String,
}

/// Response to a friend request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FriendResponse {
    /// Original request ID
    pub request_id: String,
    /// Response status
    pub status: FriendResponseStatus,
    /// Responder's DID
    pub responder_did: String,
    /// Responder's display name (for Accept)
    pub responder_display_name: Option<String>,
    /// Responder's public keys (for Accept)
    pub responder_signing_key: Option<String>,
    /// Responder's encryption public key (for Accept)
    pub responder_encryption_key: Option<String>,
}

/// Friend response status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FriendResponseStatus {
    /// Request acknowledged
    Ok,
    /// Request accepted
    Accepted,
    /// Request rejected
    Rejected,
    /// Already friends
    AlreadyFriends,
    /// Blocked by recipient
    Blocked,
    /// Error processing request
    Error {
        /// Error message
        message: String,
    },
}

// ============================================================================
// PRESENCE PROTOCOL
// ============================================================================

/// Presence announcement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PresenceAnnouncement {
    /// The announcing peer's DID
    pub did: String,
    /// Online status
    pub status: OnlineStatus,
    /// Custom status message
    pub message: Option<String>,
    /// When this announcement was made
    pub timestamp: i64,
}

/// Online status
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, PartialEq, Eq)]
pub enum OnlineStatus {
    /// User is online and active
    #[default]
    Online,
    /// User is online but idle
    Away,
    /// User is busy
    DoNotDisturb,
    /// User is offline
    Offline,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_request_serialization() {
        let request = MessageRequest {
            message_id: "test-123".to_string(),
            encrypted_content: vec![1, 2, 3, 4],
            nonce: vec![0; 12],
            timestamp: 1234567890,
        };

        let json = serde_json::to_string(&request).unwrap();
        let restored: MessageRequest = serde_json::from_str(&json).unwrap();

        assert_eq!(request.message_id, restored.message_id);
        assert_eq!(request.encrypted_content, restored.encrypted_content);
    }

    #[test]
    fn test_friend_request_types() {
        let request = FriendRequest {
            request_type: FriendRequestType::Request,
            from_did: "did:key:z6Mk...".to_string(),
            from_display_name: "Alice".to_string(),
            from_signing_key: "abc123".to_string(),
            from_encryption_key: "def456".to_string(),
            to_did: "did:key:z6Mn...".to_string(),
            message: Some("Let's be friends!".to_string()),
            timestamp: 1234567890,
            signature: "sig123".to_string(),
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("Request"));
    }

    #[test]
    fn test_online_status_default() {
        assert_eq!(OnlineStatus::default(), OnlineStatus::Online);
    }

    #[test]
    fn test_message_response_serialization() {
        let response = MessageResponse {
            message_id: "msg-delivered".to_string(),
            status: MessageDeliveryStatus::Delivered,
        };

        let json = serde_json::to_string(&response).unwrap();
        let restored: MessageResponse = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.message_id, "msg-delivered");
        assert!(matches!(restored.status, MessageDeliveryStatus::Delivered));
    }

    #[test]
    fn test_message_delivery_status_failed() {
        let status = MessageDeliveryStatus::Failed {
            reason: "Peer offline".to_string(),
        };

        let json = serde_json::to_string(&status).unwrap();
        let restored: MessageDeliveryStatus = serde_json::from_str(&json).unwrap();

        match restored {
            MessageDeliveryStatus::Failed { reason } => {
                assert_eq!(reason, "Peer offline");
            }
            _ => panic!("Expected Failed variant"),
        }
    }

    #[test]
    fn test_friend_request_all_types() {
        let types = vec![
            FriendRequestType::Request,
            FriendRequestType::Accept,
            FriendRequestType::Reject,
            FriendRequestType::Cancel,
        ];

        for request_type in types {
            let json = serde_json::to_string(&request_type).unwrap();
            let restored: FriendRequestType = serde_json::from_str(&json).unwrap();
            // Just verify it roundtrips without error
            let _ = format!("{:?}", restored);
        }
    }

    #[test]
    fn test_friend_response_statuses() {
        let statuses = vec![
            FriendResponseStatus::Ok,
            FriendResponseStatus::Accepted,
            FriendResponseStatus::Rejected,
            FriendResponseStatus::AlreadyFriends,
            FriendResponseStatus::Blocked,
            FriendResponseStatus::Error {
                message: "test error".to_string(),
            },
        ];

        for status in statuses {
            let json = serde_json::to_string(&status).unwrap();
            let _: FriendResponseStatus = serde_json::from_str(&json).unwrap();
        }
    }

    #[test]
    fn test_friend_response_full_roundtrip() {
        let response = FriendResponse {
            request_id: "req-abc".to_string(),
            status: FriendResponseStatus::Accepted,
            responder_did: "did:key:z6MkBob".to_string(),
            responder_display_name: Some("Bob".to_string()),
            responder_signing_key: Some("key1".to_string()),
            responder_encryption_key: Some("key2".to_string()),
        };

        let json = serde_json::to_string(&response).unwrap();
        let restored: FriendResponse = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.request_id, "req-abc");
        assert_eq!(restored.responder_did, "did:key:z6MkBob");
        assert_eq!(restored.responder_display_name, Some("Bob".to_string()));
        assert!(matches!(restored.status, FriendResponseStatus::Accepted));
    }

    #[test]
    fn test_presence_announcement_roundtrip() {
        let announcement = PresenceAnnouncement {
            did: "did:key:z6MkAlice".to_string(),
            status: OnlineStatus::DoNotDisturb,
            message: Some("In a meeting".to_string()),
            timestamp: 1234567890,
        };

        let json = serde_json::to_string(&announcement).unwrap();
        let restored: PresenceAnnouncement = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.did, "did:key:z6MkAlice");
        assert_eq!(restored.status, OnlineStatus::DoNotDisturb);
        assert_eq!(restored.message, Some("In a meeting".to_string()));
        assert_eq!(restored.timestamp, 1234567890);
    }

    #[test]
    fn test_all_online_statuses() {
        let statuses = vec![
            OnlineStatus::Online,
            OnlineStatus::Away,
            OnlineStatus::DoNotDisturb,
            OnlineStatus::Offline,
        ];

        for status in statuses {
            let json = serde_json::to_string(&status).unwrap();
            let restored: OnlineStatus = serde_json::from_str(&json).unwrap();
            assert_eq!(status, restored);
        }
    }

    #[test]
    fn test_protocol_ids() {
        assert_eq!(protocol_ids::MESSAGING, "/umbra/messaging/1.0.0");
        assert_eq!(protocol_ids::FRIENDS, "/umbra/friends/1.0.0");
        assert_eq!(protocol_ids::PRESENCE, "/umbra/presence/1.0.0");
    }

    #[test]
    fn test_friend_request_no_message() {
        let request = FriendRequest {
            request_type: FriendRequestType::Request,
            from_did: "did:key:z6MkAlice".to_string(),
            from_display_name: "Alice".to_string(),
            from_signing_key: "signing123".to_string(),
            from_encryption_key: "encrypt456".to_string(),
            to_did: "did:key:z6MkBob".to_string(),
            message: None,
            timestamp: 1234567890,
            signature: "sig789".to_string(),
        };

        let json = serde_json::to_string(&request).unwrap();
        let restored: FriendRequest = serde_json::from_str(&json).unwrap();

        assert!(restored.message.is_none());
        assert_eq!(restored.from_signing_key, "signing123");
        assert_eq!(restored.from_encryption_key, "encrypt456");
    }

    #[test]
    fn test_bincode_message_request_roundtrip() {
        // Test with bincode (what we actually use over the wire)
        let request = MessageRequest {
            message_id: "msg-bin-test".to_string(),
            encrypted_content: vec![0xDE, 0xAD, 0xBE, 0xEF],
            nonce: vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            timestamp: i64::MAX,
        };

        let bytes = bincode::serialize(&request).unwrap();
        let restored: MessageRequest = bincode::deserialize(&bytes).unwrap();

        assert_eq!(restored.message_id, "msg-bin-test");
        assert_eq!(restored.encrypted_content, vec![0xDE, 0xAD, 0xBE, 0xEF]);
        assert_eq!(restored.nonce.len(), 12);
        assert_eq!(restored.timestamp, i64::MAX);
    }
}
