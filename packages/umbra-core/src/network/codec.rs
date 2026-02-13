//! # Request-Response Codec
//!
//! Codec for the Umbra request-response protocol.
//!
//! Serializes `UmbraRequest` / `UmbraResponse` enums using bincode
//! over the `/umbra/rpc/1.0.0` protocol.

use async_trait::async_trait;
use futures::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
use libp2p::{request_response, StreamProtocol};
use serde::{Deserialize, Serialize};

use super::protocols::{
    FriendRequest, FriendResponse, MessageRequest, MessageResponse, PresenceAnnouncement,
};

/// Maximum message size (64 KiB)
const MAX_MESSAGE_SIZE: usize = 64 * 1024;

/// Protocol identifier for the Umbra RPC protocol
pub const UMBRA_RPC_PROTOCOL: &str = "/umbra/rpc/1.0.0";

// ============================================================================
// REQUEST / RESPONSE TYPES
// ============================================================================

/// Umbrella request type sent over the wire
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UmbraRequest {
    /// Send an encrypted message
    Message(MessageRequest),
    /// Send a friend request
    Friend(FriendRequest),
    /// Announce presence status
    Presence(PresenceAnnouncement),
}

/// Umbrella response type sent over the wire
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UmbraResponse {
    /// Response to a message
    Message(MessageResponse),
    /// Response to a friend request
    Friend(FriendResponse),
    /// Simple acknowledgment
    Ack,
}

// ============================================================================
// CODEC
// ============================================================================

/// Codec for serializing/deserializing Umbra requests and responses.
///
/// Uses bincode for compact binary serialization. Messages are length-prefixed
/// with a 4-byte big-endian u32.
#[derive(Debug, Clone, Default)]
pub struct UmbraCodec;

impl UmbraCodec {
    pub fn protocol() -> StreamProtocol {
        StreamProtocol::new(UMBRA_RPC_PROTOCOL)
    }
}

#[async_trait]
impl request_response::Codec for UmbraCodec {
    type Protocol = StreamProtocol;
    type Request = UmbraRequest;
    type Response = UmbraResponse;

    async fn read_request<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Request>
    where
        T: AsyncRead + Unpin + Send,
    {
        read_length_prefixed::<T, UmbraRequest>(io).await
    }

    async fn read_response<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
    ) -> std::io::Result<Self::Response>
    where
        T: AsyncRead + Unpin + Send,
    {
        read_length_prefixed::<T, UmbraResponse>(io).await
    }

    async fn write_request<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
        request: Self::Request,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        write_length_prefixed(io, &request).await
    }

    async fn write_response<T>(
        &mut self,
        _protocol: &Self::Protocol,
        io: &mut T,
        response: Self::Response,
    ) -> std::io::Result<()>
    where
        T: AsyncWrite + Unpin + Send,
    {
        write_length_prefixed(io, &response).await
    }
}

// ============================================================================
// LENGTH-PREFIXED HELPERS
// ============================================================================

/// Read a length-prefixed bincode message from a stream
async fn read_length_prefixed<T, M>(io: &mut T) -> std::io::Result<M>
where
    T: AsyncRead + Unpin + Send,
    M: for<'de> Deserialize<'de>,
{
    // Read 4-byte length prefix (big-endian u32)
    let mut len_buf = [0u8; 4];
    io.read_exact(&mut len_buf).await?;
    let len = u32::from_be_bytes(len_buf) as usize;

    if len > MAX_MESSAGE_SIZE {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!("Message too large: {} bytes (max {})", len, MAX_MESSAGE_SIZE),
        ));
    }

    // Read the message bytes
    let mut buf = vec![0u8; len];
    io.read_exact(&mut buf).await?;

    // Deserialize with bincode
    bincode::deserialize(&buf).map_err(|e| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!("Failed to deserialize: {}", e),
        )
    })
}

/// Write a length-prefixed bincode message to a stream
async fn write_length_prefixed<T, M>(io: &mut T, msg: &M) -> std::io::Result<()>
where
    T: AsyncWrite + Unpin + Send,
    M: Serialize,
{
    let bytes = bincode::serialize(msg).map_err(|e| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!("Failed to serialize: {}", e),
        )
    })?;

    if bytes.len() > MAX_MESSAGE_SIZE {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidData,
            format!(
                "Serialized message too large: {} bytes (max {})",
                bytes.len(),
                MAX_MESSAGE_SIZE
            ),
        ));
    }

    // Write 4-byte length prefix
    let len = (bytes.len() as u32).to_be_bytes();
    io.write_all(&len).await?;

    // Write the message bytes
    io.write_all(&bytes).await?;
    io.flush().await?;

    Ok(())
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::protocols::{MessageDeliveryStatus, FriendRequestType};

    #[test]
    fn test_umbra_request_message_roundtrip() {
        let request = UmbraRequest::Message(MessageRequest {
            message_id: "msg-123".to_string(),
            encrypted_content: vec![1, 2, 3, 4, 5],
            nonce: vec![0; 12],
            timestamp: 1234567890,
        });

        let bytes = bincode::serialize(&request).unwrap();
        let restored: UmbraRequest = bincode::deserialize(&bytes).unwrap();

        match restored {
            UmbraRequest::Message(msg) => {
                assert_eq!(msg.message_id, "msg-123");
                assert_eq!(msg.encrypted_content, vec![1, 2, 3, 4, 5]);
            }
            _ => panic!("Expected Message variant"),
        }
    }

    #[test]
    fn test_umbra_response_message_roundtrip() {
        let response = UmbraResponse::Message(MessageResponse {
            message_id: "msg-456".to_string(),
            status: MessageDeliveryStatus::Delivered,
        });

        let bytes = bincode::serialize(&response).unwrap();
        let restored: UmbraResponse = bincode::deserialize(&bytes).unwrap();

        match restored {
            UmbraResponse::Message(msg) => {
                assert_eq!(msg.message_id, "msg-456");
                assert!(matches!(msg.status, MessageDeliveryStatus::Delivered));
            }
            _ => panic!("Expected Message variant"),
        }
    }

    #[test]
    fn test_umbra_request_friend_roundtrip() {
        let request = UmbraRequest::Friend(FriendRequest {
            request_type: FriendRequestType::Request,
            from_did: "did:key:z6MkAlice".to_string(),
            from_display_name: "Alice".to_string(),
            from_signing_key: "abc123".to_string(),
            from_encryption_key: "def456".to_string(),
            to_did: "did:key:z6MkBob".to_string(),
            message: Some("Hey Bob!".to_string()),
            timestamp: 1234567890,
            signature: "sig123".to_string(),
        });

        let bytes = bincode::serialize(&request).unwrap();
        let restored: UmbraRequest = bincode::deserialize(&bytes).unwrap();

        match restored {
            UmbraRequest::Friend(req) => {
                assert_eq!(req.from_did, "did:key:z6MkAlice");
                assert_eq!(req.to_did, "did:key:z6MkBob");
                assert_eq!(req.message, Some("Hey Bob!".to_string()));
            }
            _ => panic!("Expected Friend variant"),
        }
    }

    #[test]
    fn test_umbra_response_ack_roundtrip() {
        let response = UmbraResponse::Ack;

        let bytes = bincode::serialize(&response).unwrap();
        let restored: UmbraResponse = bincode::deserialize(&bytes).unwrap();

        assert!(matches!(restored, UmbraResponse::Ack));
    }

    #[tokio::test]
    async fn test_codec_read_write_request() {
        let request = UmbraRequest::Message(MessageRequest {
            message_id: "test-msg".to_string(),
            encrypted_content: vec![10, 20, 30],
            nonce: vec![0; 12],
            timestamp: 9999999,
        });

        // Write to a buffer
        let mut buf = Vec::new();
        write_length_prefixed(&mut buf, &request).await.unwrap();

        // Read back
        let mut cursor = futures::io::Cursor::new(buf);
        let restored: UmbraRequest = read_length_prefixed(&mut cursor).await.unwrap();

        match restored {
            UmbraRequest::Message(msg) => {
                assert_eq!(msg.message_id, "test-msg");
            }
            _ => panic!("Expected Message variant"),
        }
    }

    #[tokio::test]
    async fn test_codec_read_write_response() {
        let response = UmbraResponse::Message(MessageResponse {
            message_id: "resp-msg".to_string(),
            status: MessageDeliveryStatus::Failed {
                reason: "peer offline".to_string(),
            },
        });

        let mut buf = Vec::new();
        write_length_prefixed(&mut buf, &response).await.unwrap();

        let mut cursor = futures::io::Cursor::new(buf);
        let restored: UmbraResponse = read_length_prefixed(&mut cursor).await.unwrap();

        match restored {
            UmbraResponse::Message(msg) => {
                assert_eq!(msg.message_id, "resp-msg");
                match msg.status {
                    MessageDeliveryStatus::Failed { reason } => {
                        assert_eq!(reason, "peer offline");
                    }
                    _ => panic!("Expected Failed status"),
                }
            }
            _ => panic!("Expected Message variant"),
        }
    }

    #[tokio::test]
    async fn test_codec_read_write_presence() {
        use crate::network::protocols::{PresenceAnnouncement, OnlineStatus};

        let request = UmbraRequest::Presence(PresenceAnnouncement {
            did: "did:key:z6MkTest".to_string(),
            status: OnlineStatus::Away,
            message: Some("Be right back".to_string()),
            timestamp: 1234567890,
        });

        let mut buf = Vec::new();
        write_length_prefixed(&mut buf, &request).await.unwrap();

        let mut cursor = futures::io::Cursor::new(buf);
        let restored: UmbraRequest = read_length_prefixed(&mut cursor).await.unwrap();

        match restored {
            UmbraRequest::Presence(p) => {
                assert_eq!(p.did, "did:key:z6MkTest");
                assert_eq!(p.status, OnlineStatus::Away);
                assert_eq!(p.message, Some("Be right back".to_string()));
            }
            _ => panic!("Expected Presence variant"),
        }
    }

    #[tokio::test]
    async fn test_codec_read_write_friend_response() {
        use crate::network::protocols::{FriendResponse, FriendResponseStatus};

        let response = UmbraResponse::Friend(FriendResponse {
            request_id: "req-123".to_string(),
            status: FriendResponseStatus::Accepted,
            responder_did: "did:key:z6MkBob".to_string(),
            responder_display_name: Some("Bob".to_string()),
            responder_signing_key: Some("signing-key-hex".to_string()),
            responder_encryption_key: Some("encryption-key-hex".to_string()),
        });

        let mut buf = Vec::new();
        write_length_prefixed(&mut buf, &response).await.unwrap();

        let mut cursor = futures::io::Cursor::new(buf);
        let restored: UmbraResponse = read_length_prefixed(&mut cursor).await.unwrap();

        match restored {
            UmbraResponse::Friend(f) => {
                assert_eq!(f.request_id, "req-123");
                assert!(matches!(f.status, FriendResponseStatus::Accepted));
                assert_eq!(f.responder_did, "did:key:z6MkBob");
                assert_eq!(f.responder_display_name, Some("Bob".to_string()));
                assert!(f.responder_signing_key.is_some());
                assert!(f.responder_encryption_key.is_some());
            }
            _ => panic!("Expected Friend variant"),
        }
    }

    #[tokio::test]
    async fn test_codec_rejects_oversized_message() {
        // Create a message that exceeds MAX_MESSAGE_SIZE when serialized
        let big_content = vec![42u8; MAX_MESSAGE_SIZE + 1];
        let request = UmbraRequest::Message(MessageRequest {
            message_id: "big-msg".to_string(),
            encrypted_content: big_content,
            nonce: vec![0; 12],
            timestamp: 0,
        });

        let mut buf = Vec::new();
        let result = write_length_prefixed(&mut buf, &request).await;
        assert!(result.is_err(), "Should reject oversized messages");
        assert!(result.unwrap_err().to_string().contains("too large"));
    }

    #[tokio::test]
    async fn test_codec_rejects_corrupt_length_prefix() {
        // Write a length prefix that claims more data than available
        let mut buf = Vec::new();
        let len: u32 = 1000; // Claims 1000 bytes
        buf.extend_from_slice(&len.to_be_bytes());
        buf.extend_from_slice(&[1, 2, 3]); // Only 3 bytes of actual data

        let mut cursor = futures::io::Cursor::new(buf);
        let result: std::io::Result<UmbraRequest> = read_length_prefixed(&mut cursor).await;
        assert!(result.is_err(), "Should fail on truncated data");
    }

    #[tokio::test]
    async fn test_codec_empty_message() {
        let response = UmbraResponse::Ack;

        let mut buf = Vec::new();
        write_length_prefixed(&mut buf, &response).await.unwrap();

        // Verify the buffer has a length prefix + serialized data
        assert!(buf.len() > 4, "Should have at least length prefix + data");

        let mut cursor = futures::io::Cursor::new(buf);
        let restored: UmbraResponse = read_length_prefixed(&mut cursor).await.unwrap();
        assert!(matches!(restored, UmbraResponse::Ack));
    }

    #[test]
    fn test_protocol_string() {
        let protocol = UmbraCodec::protocol();
        assert_eq!(protocol.as_ref(), UMBRA_RPC_PROTOCOL);
        assert_eq!(protocol.as_ref(), "/umbra/rpc/1.0.0");
    }
}
