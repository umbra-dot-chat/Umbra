//! # Messaging Module
//!
//! End-to-end encrypted messaging between friends.
//!
//! ## Message Encryption Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      MESSAGE ENCRYPTION                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Sender (Alice)                                                        │
//! │  ─────────────────────────────────────────────────────────────         │
//! │                                                                         │
//! │  Input: "Hello Bob!"                                                   │
//! │                                                                         │
//! │  1. Get shared secret                                                  │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  alice_x25519_private × bob_x25519_public = shared_secret  │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  2. Derive encryption key                                              │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  HKDF(shared_secret, conversation_id) = encryption_key     │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  3. Encrypt message                                                    │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  AES-256-GCM(                                               │       │
//! │  │    key = encryption_key,                                   │       │
//! │  │    nonce = random_12_bytes,                                │       │
//! │  │    plaintext = "Hello Bob!",                               │       │
//! │  │    aad = sender_did || recipient_did || timestamp          │       │
//! │  │  )                                                         │       │
//! │  │  → ciphertext + 16-byte auth tag                          │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  4. Sign envelope                                                      │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  Ed25519_sign(                                              │       │
//! │  │    alice_signing_key,                                      │       │
//! │  │    envelope_data                                           │       │
//! │  │  )                                                         │       │
//! │  │  → 64-byte signature                                       │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  Output: MessageEnvelope                                               │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Message Decryption Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      MESSAGE DECRYPTION                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Recipient (Bob)                                                       │
//! │  ─────────────────────────────────────────────────────────────         │
//! │                                                                         │
//! │  Input: MessageEnvelope from Alice                                     │
//! │                                                                         │
//! │  1. Verify signature                                                   │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  Ed25519_verify(                                            │       │
//! │  │    alice_public_key,                                       │       │
//! │  │    envelope_data,                                          │       │
//! │  │    signature                                               │       │
//! │  │  ) → OK or REJECT                                         │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  2. Compute shared secret                                              │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  bob_x25519_private × alice_x25519_public = shared_secret  │       │
//! │  │  (Same secret as Alice computed - ECDH property)           │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  3. Derive encryption key                                              │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  HKDF(shared_secret, conversation_id) = encryption_key     │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  4. Decrypt message                                                    │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │  AES-256-GCM_decrypt(                                       │       │
//! │  │    key = encryption_key,                                   │       │
//! │  │    nonce = from_envelope,                                  │       │
//! │  │    ciphertext = from_envelope,                             │       │
//! │  │    aad = sender_did || recipient_did || timestamp          │       │
//! │  │  ) → "Hello Bob!"                                          │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Wire Protocol
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      MESSAGE ENVELOPE FORMAT                            │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  MessageEnvelope (JSON serialized)                                     │
//! │  ─────────────────────────────────                                      │
//! │  {                                                                      │
//! │    "version": 1,                    // Protocol version                 │
//! │    "id": "uuid-v4",                 // Unique message ID                │
//! │    "msg_type": "ChatMessage",       // Type of message                  │
//! │    "sender_did": "did:key:...",     // Sender's DID                     │
//! │    "recipient_did": "did:key:...",  // Recipient's DID                  │
//! │    "conversation_id": "...",        // Conversation identifier          │
//! │    "timestamp": 1234567890,         // Unix timestamp (ms)              │
//! │    "nonce": "base64...",            // 12-byte nonce (base64)           │
//! │    "ciphertext": "base64...",       // Encrypted content (base64)       │
//! │    "signature": "hex..."            // Ed25519 signature (hex)          │
//! │  }                                                                      │
//! │                                                                         │
//! │  Message Types:                                                        │
//! │  • ChatMessage     - Regular text message                              │
//! │  • TypingIndicator - User is typing                                    │
//! │  • ReadReceipt     - Message was read                                  │
//! │  • DeliveryReceipt - Message was delivered                             │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use serde::{Deserialize, Serialize};
use std::sync::Arc;
use parking_lot::RwLock;
use uuid::Uuid;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};

use crate::crypto::{
    encrypt, decrypt, sign, verify,
    SharedSecret, Signature, Nonce, NONCE_SIZE,
};
use crate::error::{Error, Result};
use crate::identity::Identity;
use crate::friends::Friend;
use crate::storage::Database;

/// Current message protocol version
pub const MESSAGE_PROTOCOL_VERSION: u8 = 1;

/// Maximum message content size (64KB)
pub const MAX_MESSAGE_SIZE: usize = 64 * 1024;

/// A message in a conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// Unique message ID (UUID)
    pub id: String,
    /// Conversation this belongs to
    pub conversation_id: String,
    /// Sender's DID
    pub sender_did: String,
    /// Recipient's DID
    pub recipient_did: String,
    /// Message content (plaintext after decryption)
    pub content: MessageContent,
    /// Unix timestamp when sent (milliseconds)
    pub timestamp: i64,
    /// Whether we've read it
    pub read: bool,
    /// Delivery status
    pub status: MessageStatus,
}

impl Message {
    /// Create a new outgoing message
    pub fn new(
        conversation_id: String,
        sender_did: String,
        recipient_did: String,
        content: MessageContent,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            conversation_id,
            sender_did,
            recipient_did,
            content,
            timestamp: crate::time::now_timestamp_millis(),
            read: true, // Sender has "read" their own message
            status: MessageStatus::Sending,
        }
    }

    /// Check if this message is from us
    pub fn is_outgoing(&self, our_did: &str) -> bool {
        self.sender_did == our_did
    }
}

/// Message content types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum MessageContent {
    /// Plain text message
    Text(String),
    /// Typing indicator (content is empty)
    Typing,
    /// Read receipt (references message ID)
    ReadReceipt {
        /// The ID of the message that was read
        message_id: String,
    },
    /// Delivery receipt (references message ID)
    DeliveryReceipt {
        /// The ID of the message that was delivered
        message_id: String,
    },
}

impl MessageContent {
    /// Create a text message
    pub fn text(s: impl Into<String>) -> Self {
        Self::Text(s.into())
    }

    /// Get the text content if this is a text message
    pub fn as_text(&self) -> Option<&str> {
        match self {
            Self::Text(s) => Some(s),
            _ => None,
        }
    }

    /// Check if this is a control message (not user-visible)
    pub fn is_control(&self) -> bool {
        matches!(
            self,
            Self::Typing | Self::ReadReceipt { .. } | Self::DeliveryReceipt { .. }
        )
    }
}

/// Message delivery status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum MessageStatus {
    /// Message is being sent
    Sending,
    /// Message sent but not confirmed delivered
    Sent,
    /// Message delivered to recipient's device
    Delivered,
    /// Recipient has read the message
    Read,
    /// Failed to send
    Failed {
        /// Reason for failure
        reason: String,
    },
}

impl MessageStatus {
    /// Convert to database string
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Sending => "sending",
            Self::Sent => "sent",
            Self::Delivered => "delivered",
            Self::Read => "read",
            Self::Failed { .. } => "failed",
        }
    }
}

/// Message type identifier for the wire protocol
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum MessageType {
    /// Regular chat message
    ChatMessage,
    /// Typing indicator
    TypingIndicator,
    /// Read receipt
    ReadReceipt,
    /// Delivery receipt
    DeliveryReceipt,
}

impl MessageType {
    /// Get the numeric type code
    pub fn code(&self) -> u8 {
        match self {
            Self::ChatMessage => 1,
            Self::TypingIndicator => 2,
            Self::ReadReceipt => 3,
            Self::DeliveryReceipt => 4,
        }
    }

    /// Parse from numeric code
    pub fn from_code(code: u8) -> Option<Self> {
        match code {
            1 => Some(Self::ChatMessage),
            2 => Some(Self::TypingIndicator),
            3 => Some(Self::ReadReceipt),
            4 => Some(Self::DeliveryReceipt),
            _ => None,
        }
    }
}

/// Encrypted message envelope for wire transmission
///
/// This is what gets sent over the network. It contains all the
/// metadata needed for decryption plus the encrypted content.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageEnvelope {
    /// Protocol version
    pub version: u8,
    /// Unique message ID
    pub id: String,
    /// Type of message
    pub msg_type: MessageType,
    /// Sender's DID
    pub sender_did: String,
    /// Recipient's DID
    pub recipient_did: String,
    /// Conversation ID
    pub conversation_id: String,
    /// Unix timestamp (milliseconds)
    pub timestamp: i64,
    /// AES-GCM nonce (base64 encoded)
    pub nonce: String,
    /// Encrypted content (base64 encoded)
    pub ciphertext: String,
    /// Ed25519 signature over envelope data (hex encoded)
    pub signature: String,
}

impl MessageEnvelope {
    /// Create an encrypted envelope from a message
    pub fn encrypt(
        message: &Message,
        sender_identity: &Identity,
        recipient_encryption_key: &[u8; 32],
    ) -> Result<Self> {
        // Validate message size
        let content_bytes = bincode::serialize(&message.content)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        if content_bytes.len() > MAX_MESSAGE_SIZE {
            return Err(Error::InvalidMessageContent(format!(
                "Message too large: {} bytes (max {})",
                content_bytes.len(),
                MAX_MESSAGE_SIZE
            )));
        }

        // Compute shared secret using ECDH
        let dh_output = sender_identity
            .keypair()
            .encryption
            .diffie_hellman(recipient_encryption_key);

        let shared_secret = SharedSecret::from_bytes(dh_output);

        // Derive encryption key for this conversation
        let encryption_key = shared_secret
            .derive_key(message.conversation_id.as_bytes())
            .map_err(|e| Error::KeyExchangeFailed(e.to_string()))?;

        // Build additional authenticated data (AAD)
        let aad = build_aad(
            &message.sender_did,
            &message.recipient_did,
            message.timestamp,
        );

        // Encrypt the content
        let (nonce, ciphertext) = encrypt(&encryption_key, &content_bytes, &aad)?;

        // Create the data to sign (everything except signature)
        let sign_data = EnvelopeSignData {
            version: MESSAGE_PROTOCOL_VERSION,
            id: message.id.clone(),
            msg_type: content_to_msg_type(&message.content),
            sender_did: message.sender_did.clone(),
            recipient_did: message.recipient_did.clone(),
            conversation_id: message.conversation_id.clone(),
            timestamp: message.timestamp,
            nonce: BASE64.encode(nonce.as_bytes()),
            ciphertext: BASE64.encode(&ciphertext),
        };

        let sign_bytes = bincode::serialize(&sign_data)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        // Sign the envelope
        let signature = sign(&sender_identity.keypair().signing, &sign_bytes);

        Ok(Self {
            version: MESSAGE_PROTOCOL_VERSION,
            id: message.id.clone(),
            msg_type: sign_data.msg_type,
            sender_did: message.sender_did.clone(),
            recipient_did: message.recipient_did.clone(),
            conversation_id: message.conversation_id.clone(),
            timestamp: message.timestamp,
            nonce: sign_data.nonce,
            ciphertext: sign_data.ciphertext,
            signature: signature.to_hex(),
        })
    }

    /// Decrypt an envelope and verify its authenticity
    pub fn decrypt(
        &self,
        recipient_identity: &Identity,
        sender: &Friend,
    ) -> Result<Message> {
        // Verify protocol version
        if self.version != MESSAGE_PROTOCOL_VERSION {
            return Err(Error::ProtocolError(format!(
                "Unsupported message protocol version: {} (expected {})",
                self.version, MESSAGE_PROTOCOL_VERSION
            )));
        }

        // Verify sender DID matches friend
        if self.sender_did != sender.did {
            return Err(Error::InvalidMessageContent(
                "Sender DID mismatch".into()
            ));
        }

        // Verify recipient is us
        if self.recipient_did != recipient_identity.did_string() {
            return Err(Error::InvalidMessageContent(
                "Message not for us".into()
            ));
        }

        // Verify signature
        let signature = Signature::from_hex(&self.signature)?;

        let sign_data = EnvelopeSignData {
            version: self.version,
            id: self.id.clone(),
            msg_type: self.msg_type,
            sender_did: self.sender_did.clone(),
            recipient_did: self.recipient_did.clone(),
            conversation_id: self.conversation_id.clone(),
            timestamp: self.timestamp,
            nonce: self.nonce.clone(),
            ciphertext: self.ciphertext.clone(),
        };

        let sign_bytes = bincode::serialize(&sign_data)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        verify(&sender.signing_public_key, &sign_bytes, &signature)?;

        // Decode base64 fields
        let nonce_bytes = BASE64.decode(&self.nonce)
            .map_err(|e| Error::DeserializationError(format!("Invalid nonce: {}", e)))?;

        let ciphertext = BASE64.decode(&self.ciphertext)
            .map_err(|e| Error::DeserializationError(format!("Invalid ciphertext: {}", e)))?;

        // Parse nonce
        let nonce_array: [u8; NONCE_SIZE] = nonce_bytes.try_into()
            .map_err(|_| Error::DeserializationError("Invalid nonce length".into()))?;
        let nonce = Nonce::from_bytes(nonce_array);

        // Compute shared secret using ECDH
        let dh_output = recipient_identity
            .keypair()
            .encryption
            .diffie_hellman(&sender.encryption_public_key);

        let shared_secret = SharedSecret::from_bytes(dh_output);

        // Derive encryption key for this conversation
        let encryption_key = shared_secret
            .derive_key(self.conversation_id.as_bytes())
            .map_err(|e| Error::KeyExchangeFailed(e.to_string()))?;

        // Build AAD
        let aad = build_aad(&self.sender_did, &self.recipient_did, self.timestamp);

        // Decrypt
        let plaintext = decrypt(&encryption_key, &nonce, &ciphertext, &aad)?;

        // Deserialize content
        let content: MessageContent = bincode::deserialize(&plaintext)
            .map_err(|e| Error::DeserializationError(format!("Invalid message content: {}", e)))?;

        Ok(Message {
            id: self.id.clone(),
            conversation_id: self.conversation_id.clone(),
            sender_did: self.sender_did.clone(),
            recipient_did: self.recipient_did.clone(),
            content,
            timestamp: self.timestamp,
            read: false,
            status: MessageStatus::Delivered,
        })
    }

    /// Serialize to JSON
    pub fn to_json(&self) -> Result<String> {
        serde_json::to_string(self)
            .map_err(|e| Error::SerializationError(e.to_string()))
    }

    /// Deserialize from JSON
    pub fn from_json(json: &str) -> Result<Self> {
        serde_json::from_str(json)
            .map_err(|e| Error::DeserializationError(e.to_string()))
    }
}

/// Data that gets signed for an envelope
#[derive(Serialize, Deserialize)]
struct EnvelopeSignData {
    version: u8,
    id: String,
    msg_type: MessageType,
    sender_did: String,
    recipient_did: String,
    conversation_id: String,
    timestamp: i64,
    nonce: String,
    ciphertext: String,
}

/// Build additional authenticated data for AES-GCM
fn build_aad(sender_did: &str, recipient_did: &str, timestamp: i64) -> Vec<u8> {
    let mut aad = Vec::new();
    aad.extend_from_slice(sender_did.as_bytes());
    aad.push(b'|');
    aad.extend_from_slice(recipient_did.as_bytes());
    aad.push(b'|');
    aad.extend_from_slice(&timestamp.to_be_bytes());
    aad
}

/// Convert message content to message type
fn content_to_msg_type(content: &MessageContent) -> MessageType {
    match content {
        MessageContent::Text(_) => MessageType::ChatMessage,
        MessageContent::Typing => MessageType::TypingIndicator,
        MessageContent::ReadReceipt { .. } => MessageType::ReadReceipt,
        MessageContent::DeliveryReceipt { .. } => MessageType::DeliveryReceipt,
    }
}

/// A conversation with a friend or group
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    /// Unique conversation ID
    pub id: String,
    /// Friend we're chatting with (None for groups)
    pub friend_did: Option<String>,
    /// Conversation type: "dm" or "group"
    pub conv_type: String,
    /// Group ID (None for DMs)
    pub group_id: Option<String>,
    /// Friend's display name (for convenience)
    pub friend_name: String,
    /// Last message preview (text only)
    pub last_message_preview: Option<String>,
    /// Last message timestamp
    pub last_message_at: Option<i64>,
    /// Unread message count
    pub unread_count: u32,
    /// When conversation was created
    pub created_at: i64,
}

impl Conversation {
    /// Create a new DM conversation with a friend
    pub fn new(friend: &Friend) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            friend_did: Some(friend.did.clone()),
            conv_type: "dm".to_string(),
            group_id: None,
            friend_name: friend.display_name.clone(),
            last_message_preview: None,
            last_message_at: None,
            unread_count: 0,
            created_at: crate::time::now_timestamp(),
        }
    }

    /// Generate a deterministic conversation ID from two DIDs
    ///
    /// This ensures both parties derive the same conversation ID.
    pub fn generate_id(did1: &str, did2: &str) -> String {
        use sha2::{Sha256, Digest};

        // Sort DIDs to ensure consistent ordering
        let (first, second) = if did1 < did2 {
            (did1, did2)
        } else {
            (did2, did1)
        };

        let mut hasher = Sha256::new();
        hasher.update(first.as_bytes());
        hasher.update(b"|");
        hasher.update(second.as_bytes());

        let hash = hasher.finalize();
        hex::encode(&hash[..16]) // Use first 16 bytes (32 hex chars)
    }
}

/// Messaging service for sending and receiving encrypted messages
pub struct MessagingService {
    /// Current user's identity
    identity: Arc<Identity>,
    /// Database for persistence
    database: Arc<Database>,
    /// Cached conversations
    conversations: Arc<RwLock<Vec<Conversation>>>,
    /// Message outbox (messages waiting to be sent)
    outbox: Arc<RwLock<Vec<MessageEnvelope>>>,
}

impl MessagingService {
    /// Create a new messaging service
    pub fn new(identity: Arc<Identity>, database: Arc<Database>) -> Self {
        Self {
            identity,
            database,
            conversations: Arc::new(RwLock::new(Vec::new())),
            outbox: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Load conversations from database
    pub fn load(&self) -> Result<()> {
        let records = self.database.get_all_conversations()?;
        let mut conversations = Vec::new();

        for record in records {
            conversations.push(Conversation {
                id: record.id,
                friend_did: record.friend_did,
                conv_type: record.conv_type,
                group_id: record.group_id,
                friend_name: String::new(), // Would need to look up
                last_message_preview: None,
                last_message_at: record.last_message_at,
                unread_count: record.unread_count as u32,
                created_at: record.created_at,
            });
        }

        *self.conversations.write() = conversations;

        tracing::info!("Loaded {} conversations", self.conversations.read().len());
        Ok(())
    }

    /// Get or create a conversation with a friend
    pub fn get_or_create_conversation(&self, friend: &Friend) -> Result<Conversation> {
        // Generate deterministic conversation ID
        let conv_id = Conversation::generate_id(
            &self.identity.did_string(),
            &friend.did,
        );

        // Check if we already have this conversation
        {
            let conversations = self.conversations.read();
            if let Some(conv) = conversations.iter().find(|c| c.id == conv_id) {
                return Ok(conv.clone());
            }
        }

        // Create new conversation
        let mut conversation = Conversation::new(friend);
        conversation.id = conv_id.clone();

        // Store in database
        self.database.create_conversation(&conv_id, &friend.did)?;

        // Cache it
        self.conversations.write().push(conversation.clone());

        tracing::info!("Created conversation {} with {}", conv_id, friend.did);
        Ok(conversation)
    }

    /// Create an encrypted message to send
    pub fn create_message(
        &self,
        friend: &Friend,
        content: MessageContent,
    ) -> Result<(Message, MessageEnvelope)> {
        // Get or create conversation
        let conversation = self.get_or_create_conversation(friend)?;

        // Create the message
        let message = Message::new(
            conversation.id.clone(),
            self.identity.did_string(),
            friend.did.clone(),
            content,
        );

        // Encrypt it
        let envelope = MessageEnvelope::encrypt(
            &message,
            &self.identity,
            &friend.encryption_public_key,
        )?;

        // Store in database
        self.store_message(&message)?;

        // Add to outbox
        self.outbox.write().push(envelope.clone());

        Ok((message, envelope))
    }

    /// Send a text message
    pub fn send_text(&self, friend: &Friend, text: &str) -> Result<(Message, MessageEnvelope)> {
        self.create_message(friend, MessageContent::Text(text.to_string()))
    }

    /// Send a typing indicator
    pub fn send_typing(&self, friend: &Friend) -> Result<MessageEnvelope> {
        let conversation = self.get_or_create_conversation(friend)?;

        let message = Message::new(
            conversation.id,
            self.identity.did_string(),
            friend.did.clone(),
            MessageContent::Typing,
        );

        // Typing indicators are not stored, just encrypted and sent
        MessageEnvelope::encrypt(&message, &self.identity, &friend.encryption_public_key)
    }

    /// Send a read receipt
    pub fn send_read_receipt(
        &self,
        friend: &Friend,
        message_id: &str,
    ) -> Result<MessageEnvelope> {
        let conversation = self.get_or_create_conversation(friend)?;

        let message = Message::new(
            conversation.id,
            self.identity.did_string(),
            friend.did.clone(),
            MessageContent::ReadReceipt {
                message_id: message_id.to_string(),
            },
        );

        MessageEnvelope::encrypt(&message, &self.identity, &friend.encryption_public_key)
    }

    /// Handle a received message envelope
    pub fn receive_message(
        &self,
        envelope: &MessageEnvelope,
        sender: &Friend,
    ) -> Result<Option<Message>> {
        // Decrypt and verify
        let message = envelope.decrypt(&self.identity, sender)?;

        // Handle based on content type
        match &message.content {
            MessageContent::Text(_) => {
                // Store the message
                self.store_message(&message)?;

                // Update conversation
                self.update_conversation_from_message(&message)?;

                Ok(Some(message))
            }
            MessageContent::Typing => {
                // Don't store typing indicators
                Ok(None)
            }
            MessageContent::ReadReceipt { message_id } => {
                // Update the referenced message status
                self.mark_message_read(message_id)?;
                Ok(None)
            }
            MessageContent::DeliveryReceipt { message_id } => {
                // Update the referenced message status
                self.mark_message_delivered(message_id)?;
                Ok(None)
            }
        }
    }

    /// Get messages for a conversation
    pub fn get_messages(
        &self,
        conversation_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<Message>> {
        let records = self.database.get_messages(conversation_id, limit, offset)?;
        let mut messages = Vec::new();

        for record in records {
            // Decrypt stored content
            let _ciphertext = hex::decode(&record.content_encrypted)
                .map_err(|e| Error::DatabaseError(format!("Invalid ciphertext: {}", e)))?;

            let _nonce_bytes = hex::decode(&record.nonce)
                .map_err(|e| Error::DatabaseError(format!("Invalid nonce: {}", e)))?;

            // For stored messages, we'd need to re-derive the key or store decrypted
            // For now, return with placeholder content
            // In production, messages would be stored decrypted locally
            messages.push(Message {
                id: record.id,
                conversation_id: record.conversation_id,
                sender_did: record.sender_did,
                recipient_did: self.identity.did_string(), // Assume we're the recipient
                content: MessageContent::Text("[encrypted]".to_string()),
                timestamp: record.timestamp,
                read: record.read,
                status: if record.delivered {
                    MessageStatus::Delivered
                } else {
                    MessageStatus::Sent
                },
            });
        }

        Ok(messages)
    }

    /// Get all conversations
    pub fn get_conversations(&self) -> Vec<Conversation> {
        self.conversations.read().clone()
    }

    /// Get a specific conversation
    pub fn get_conversation(&self, id: &str) -> Option<Conversation> {
        self.conversations.read().iter()
            .find(|c| c.id == id)
            .cloned()
    }

    /// Get conversation by friend DID
    pub fn get_conversation_by_friend(&self, friend_did: &str) -> Option<Conversation> {
        self.conversations.read().iter()
            .find(|c| c.friend_did.as_deref() == Some(friend_did))
            .cloned()
    }

    /// Mark messages as read
    pub fn mark_conversation_read(&self, conversation_id: &str) -> Result<()> {
        self.database.mark_messages_read(conversation_id)?;

        // Update cache
        let mut conversations = self.conversations.write();
        if let Some(conv) = conversations.iter_mut().find(|c| c.id == conversation_id) {
            conv.unread_count = 0;
        }

        Ok(())
    }

    /// Get pending outgoing envelopes
    pub fn get_outbox(&self) -> Vec<MessageEnvelope> {
        self.outbox.read().clone()
    }

    /// Remove a sent envelope from outbox
    pub fn clear_from_outbox(&self, message_id: &str) {
        self.outbox.write().retain(|e| e.id != message_id);
    }

    /// Update message status to sent
    pub fn mark_message_sent(&self, message_id: &str) -> Result<()> {
        // Would update database here
        tracing::debug!("Message {} marked as sent", message_id);
        Ok(())
    }

    /// Update message status to delivered
    fn mark_message_delivered(&self, message_id: &str) -> Result<()> {
        tracing::debug!("Message {} marked as delivered", message_id);
        Ok(())
    }

    /// Update message status to read
    fn mark_message_read(&self, message_id: &str) -> Result<()> {
        tracing::debug!("Message {} marked as read", message_id);
        Ok(())
    }

    // Private helper methods

    fn store_message(&self, message: &Message) -> Result<()> {
        // Serialize content for storage
        let content_bytes = bincode::serialize(&message.content)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        // For local storage, we store the plaintext (already decrypted)
        // In production, you might want to encrypt with a local storage key
        self.database.store_message(
            &message.id,
            &message.conversation_id,
            &message.sender_did,
            &content_bytes,
            &[0u8; 12], // Placeholder nonce for stored messages
            message.timestamp,
        )?;

        Ok(())
    }

    fn update_conversation_from_message(&self, message: &Message) -> Result<()> {
        let mut conversations = self.conversations.write();

        if let Some(conv) = conversations.iter_mut()
            .find(|c| c.id == message.conversation_id)
        {
            conv.last_message_at = Some(message.timestamp);

            if let MessageContent::Text(text) = &message.content {
                // Truncate preview
                conv.last_message_preview = Some(
                    if text.len() > 50 {
                        format!("{}...", &text[..50])
                    } else {
                        text.clone()
                    }
                );
            }

            if !message.is_outgoing(&self.identity.did_string()) {
                conv.unread_count += 1;
            }
        }

        Ok(())
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::identity::Identity;
    use crate::friends::Friend;

    fn create_test_identity(name: &str) -> Identity {
        let (identity, _) = Identity::create(name.to_string()).unwrap();
        identity
    }

    fn create_test_friend(identity: &Identity) -> Friend {
        Friend::from_public_identity(&identity.public_identity())
    }

    #[test]
    fn test_message_creation() {
        let message = Message::new(
            "conv-123".to_string(),
            "did:key:alice".to_string(),
            "did:key:bob".to_string(),
            MessageContent::Text("Hello!".to_string()),
        );

        assert!(!message.id.is_empty());
        assert_eq!(message.conversation_id, "conv-123");
        assert!(message.is_outgoing("did:key:alice"));
        assert!(!message.is_outgoing("did:key:bob"));
    }

    #[test]
    fn test_message_content_types() {
        let text = MessageContent::Text("Hello".to_string());
        assert_eq!(text.as_text(), Some("Hello"));
        assert!(!text.is_control());

        let typing = MessageContent::Typing;
        assert_eq!(typing.as_text(), None);
        assert!(typing.is_control());

        let receipt = MessageContent::ReadReceipt {
            message_id: "msg-123".to_string(),
        };
        assert!(receipt.is_control());
    }

    #[test]
    fn test_message_status() {
        assert_eq!(MessageStatus::Sending.as_str(), "sending");
        assert_eq!(MessageStatus::Sent.as_str(), "sent");
        assert_eq!(MessageStatus::Delivered.as_str(), "delivered");
        assert_eq!(MessageStatus::Read.as_str(), "read");
    }

    #[test]
    fn test_message_type_codes() {
        assert_eq!(MessageType::ChatMessage.code(), 1);
        assert_eq!(MessageType::from_code(1), Some(MessageType::ChatMessage));
        assert_eq!(MessageType::from_code(99), None);
    }

    #[test]
    fn test_conversation_id_generation() {
        let id1 = Conversation::generate_id("did:key:alice", "did:key:bob");
        let id2 = Conversation::generate_id("did:key:bob", "did:key:alice");

        // Should be the same regardless of order
        assert_eq!(id1, id2);

        // Different pairs should have different IDs
        let id3 = Conversation::generate_id("did:key:alice", "did:key:charlie");
        assert_ne!(id1, id3);
    }

    #[test]
    fn test_envelope_encryption_decryption() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let alice_friend = create_test_friend(&alice);
        let bob_friend = create_test_friend(&bob);

        // Alice sends a message to Bob
        let message = Message::new(
            "conv-123".to_string(),
            alice.did_string(),
            bob.did_string(),
            MessageContent::Text("Hello Bob!".to_string()),
        );

        // Encrypt with Bob's public key
        let envelope = MessageEnvelope::encrypt(
            &message,
            &alice,
            &bob_friend.encryption_public_key,
        ).unwrap();

        assert_eq!(envelope.version, MESSAGE_PROTOCOL_VERSION);
        assert_eq!(envelope.sender_did, alice.did_string());
        assert_eq!(envelope.recipient_did, bob.did_string());

        // Bob decrypts with Alice's public key
        let decrypted = envelope.decrypt(&bob, &alice_friend).unwrap();

        assert_eq!(decrypted.id, message.id);
        assert_eq!(decrypted.content, message.content);
        assert_eq!(decrypted.sender_did, alice.did_string());
    }

    #[test]
    fn test_envelope_tamper_detection() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let alice_friend = create_test_friend(&alice);
        let bob_friend = create_test_friend(&bob);

        let message = Message::new(
            "conv-123".to_string(),
            alice.did_string(),
            bob.did_string(),
            MessageContent::Text("Hello!".to_string()),
        );

        let mut envelope = MessageEnvelope::encrypt(
            &message,
            &alice,
            &bob_friend.encryption_public_key,
        ).unwrap();

        // Tamper with the timestamp
        envelope.timestamp += 1000;

        // Decryption should fail (signature verification)
        let result = envelope.decrypt(&bob, &alice_friend);
        assert!(result.is_err());
    }

    #[test]
    fn test_envelope_wrong_recipient() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");
        let charlie = create_test_identity("Charlie");

        let alice_friend = create_test_friend(&alice);
        let bob_friend = create_test_friend(&bob);

        let message = Message::new(
            "conv-123".to_string(),
            alice.did_string(),
            bob.did_string(),
            MessageContent::Text("Hello!".to_string()),
        );

        let envelope = MessageEnvelope::encrypt(
            &message,
            &alice,
            &bob_friend.encryption_public_key,
        ).unwrap();

        // Charlie tries to decrypt (not the intended recipient)
        let result = envelope.decrypt(&charlie, &alice_friend);
        assert!(result.is_err());
    }

    #[test]
    fn test_envelope_json_roundtrip() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");
        let bob_friend = create_test_friend(&bob);

        let message = Message::new(
            "conv-123".to_string(),
            alice.did_string(),
            bob.did_string(),
            MessageContent::Text("Hello!".to_string()),
        );

        let envelope = MessageEnvelope::encrypt(
            &message,
            &alice,
            &bob_friend.encryption_public_key,
        ).unwrap();

        let json = envelope.to_json().unwrap();
        let restored = MessageEnvelope::from_json(&json).unwrap();

        assert_eq!(envelope.id, restored.id);
        assert_eq!(envelope.ciphertext, restored.ciphertext);
        assert_eq!(envelope.signature, restored.signature);
    }

    #[test]
    fn test_message_too_large() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");
        let bob_friend = create_test_friend(&bob);

        // Create a message that's too large
        let large_content = "x".repeat(MAX_MESSAGE_SIZE + 1000);

        let message = Message::new(
            "conv-123".to_string(),
            alice.did_string(),
            bob.did_string(),
            MessageContent::Text(large_content),
        );

        let result = MessageEnvelope::encrypt(
            &message,
            &alice,
            &bob_friend.encryption_public_key,
        );

        assert!(result.is_err());
    }

    #[test]
    fn test_build_aad() {
        let aad = build_aad("did:key:alice", "did:key:bob", 1234567890);

        assert!(aad.contains(&b'|'));
        assert!(aad.len() > 20); // Should contain both DIDs and timestamp
    }

    #[tokio::test]
    async fn test_messaging_service_basic() {
        let alice = Arc::new(create_test_identity("Alice"));
        let database = Arc::new(Database::open(None).await.unwrap());

        let service = MessagingService::new(alice.clone(), database);

        assert!(service.get_conversations().is_empty());
        assert!(service.get_outbox().is_empty());
    }

    #[tokio::test]
    async fn test_messaging_service_create_conversation() {
        let alice = Arc::new(create_test_identity("Alice"));
        let bob = create_test_identity("Bob");
        let bob_friend = create_test_friend(&bob);

        let database = Arc::new(Database::open(None).await.unwrap());

        // Add bob as friend first
        database.add_friend(
            &bob_friend.did,
            &bob_friend.display_name,
            &bob_friend.signing_public_key,
            &bob_friend.encryption_public_key,
            None,
        ).unwrap();

        let service = MessagingService::new(alice.clone(), database);

        let conv = service.get_or_create_conversation(&bob_friend).unwrap();

        assert!(!conv.id.is_empty());
        assert_eq!(conv.friend_did, Some(bob_friend.did.clone()));

        // Getting again should return the same conversation
        let conv2 = service.get_or_create_conversation(&bob_friend).unwrap();
        assert_eq!(conv.id, conv2.id);
    }

    #[tokio::test]
    async fn test_messaging_service_send_text() {
        let alice = Arc::new(create_test_identity("Alice"));
        let bob = create_test_identity("Bob");
        let bob_friend = create_test_friend(&bob);

        let database = Arc::new(Database::open(None).await.unwrap());
        database.add_friend(
            &bob_friend.did,
            &bob_friend.display_name,
            &bob_friend.signing_public_key,
            &bob_friend.encryption_public_key,
            None,
        ).unwrap();

        let service = MessagingService::new(alice.clone(), database);

        let (message, envelope) = service.send_text(&bob_friend, "Hello Bob!").unwrap();

        assert_eq!(message.sender_did, alice.did_string());
        assert_eq!(message.recipient_did, bob_friend.did);
        assert_eq!(message.content, MessageContent::Text("Hello Bob!".to_string()));

        // Envelope should be in outbox
        assert_eq!(service.get_outbox().len(), 1);
        assert_eq!(service.get_outbox()[0].id, envelope.id);
    }
}
