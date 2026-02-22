//! # Friends Module
//!
//! Friend relationship management including requests, acceptance, and blocking.
//!
//! ## Friend Request Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      FRIEND REQUEST FLOW                                │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Alice (Sender)                              Bob (Recipient)           │
//! │  ─────────────────────────────────────────────────────────────         │
//! │                                                                         │
//! │  1. Create Request                                                     │
//! │  ┌─────────────────────┐                                               │
//! │  │ FriendRequest {     │                                               │
//! │  │   id: uuid,         │                                               │
//! │  │   from: alice.did,  │                                               │
//! │  │   to: bob.did,      │                                               │
//! │  │   message: "Hi!",   │  ──────────────────────►                      │
//! │  │   signature: ...,   │                          2. Verify signature  │
//! │  │   created_at: now   │                          ┌─────────────────┐  │
//! │  │ }                   │                          │ Check:          │  │
//! │  └─────────────────────┘                          │ • Valid sig     │  │
//! │                                                   │ • Not blocked   │  │
//! │                                                   │ • Not duplicate │  │
//! │                                                   └─────────────────┘  │
//! │                                                            │           │
//! │                                                            ▼           │
//! │                                                   3. User Decision     │
//! │                                                   ┌─────────────────┐  │
//! │                                                   │ Accept / Reject │  │
//! │                                                   └────────┬────────┘  │
//! │                                                            │           │
//! │                         ◄────────────────────────────────  │           │
//! │  4. Receive Response                                       │           │
//! │  ┌─────────────────────┐                                   │           │
//! │  │ FriendResponse {    │                                   │           │
//! │  │   request_id: ...,  │                                   │           │
//! │  │   accepted: true,   │                                   │           │
//! │  │   responder: bob,   │                                   │           │
//! │  │   signature: ...    │                                   │           │
//! │  │ }                   │                                   │           │
//! │  └─────────────────────┘                                   │           │
//! │           │                                                │           │
//! │           ▼                                                ▼           │
//! │  5. If Accepted: Exchange Keys                                        │
//! │  ┌─────────────────────────────────────────────────────────────┐      │
//! │  │                                                             │      │
//! │  │  Alice stores Bob's X25519 public key                      │      │
//! │  │  Bob stores Alice's X25519 public key                      │      │
//! │  │                                                             │      │
//! │  │  Both can now derive shared secrets for E2E encryption     │      │
//! │  │                                                             │      │
//! │  └─────────────────────────────────────────────────────────────┘      │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Security Considerations
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                     FRIEND REQUEST SECURITY                             │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  1. Authentication (Ed25519 Signatures)                                │
//! │  ─────────────────────────────────────                                  │
//! │  Every request and response is signed with the sender's Ed25519       │
//! │  private key. This proves:                                            │
//! │  • The request came from the claimed DID                              │
//! │  • The request hasn't been tampered with                              │
//! │                                                                         │
//! │  2. Key Exchange (X25519)                                              │
//! │  ─────────────────────────                                              │
//! │  Friend requests include X25519 public keys, enabling:                │
//! │  • Immediate E2E encryption after acceptance                          │
//! │  • No additional key exchange protocol needed                         │
//! │                                                                         │
//! │  3. Replay Protection                                                  │
//! │  ────────────────────                                                   │
//! │  Each request includes:                                               │
//! │  • Unique request ID (UUID v4)                                        │
//! │  • Timestamp (checked for staleness)                                  │
//! │  • Target DID (prevents forwarding)                                   │
//! │                                                                         │
//! │  4. Blocking                                                           │
//! │  ──────────                                                             │
//! │  Users can block DIDs to:                                             │
//! │  • Automatically reject requests from blocked users                   │
//! │  • Prevent messages from reaching the user                            │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::crypto::{sign, verify, Signature};
use crate::error::{Error, Result};
use crate::identity::{Identity, PublicIdentity};
use crate::storage::{Database, FriendRequestRecord};

/// Maximum age of a friend request before it's considered stale (7 days)
pub const MAX_REQUEST_AGE_SECS: i64 = 7 * 24 * 60 * 60;

/// A friend request to be sent or received
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FriendRequest {
    /// Unique ID for this request
    pub id: String,
    /// Who sent the request (public identity)
    pub from: PublicIdentity,
    /// Who it's for (DID)
    pub to_did: String,
    /// Optional message with the request
    pub message: Option<String>,
    /// When it was created (Unix timestamp)
    pub created_at: i64,
    /// Signature over the request data
    pub signature: Signature,
}

impl FriendRequest {
    /// Create a new signed friend request
    pub fn create(identity: &Identity, to_did: String, message: Option<String>) -> Result<Self> {
        // Validate we're not sending to ourselves
        if identity.did_string() == to_did {
            return Err(Error::CannotAddSelf);
        }

        let id = Uuid::new_v4().to_string();
        let created_at = crate::time::now_timestamp();

        // Create the data to sign (everything except the signature)
        let sign_data = FriendRequestSignData {
            id: id.clone(),
            from_did: identity.did_string(),
            to_did: to_did.clone(),
            message: message.clone(),
            created_at,
        };

        let serialized =
            bincode::serialize(&sign_data).map_err(|e| Error::SerializationError(e.to_string()))?;

        let signature = sign(&identity.keypair().signing, &serialized);

        Ok(Self {
            id,
            from: identity.public_identity(),
            to_did,
            message,
            created_at,
            signature,
        })
    }

    /// Verify the request signature
    pub fn verify(&self) -> Result<()> {
        let sign_data = FriendRequestSignData {
            id: self.id.clone(),
            from_did: self.from.did.clone(),
            to_did: self.to_did.clone(),
            message: self.message.clone(),
            created_at: self.created_at,
        };

        let serialized =
            bincode::serialize(&sign_data).map_err(|e| Error::SerializationError(e.to_string()))?;

        verify(&self.from.public_keys.signing, &serialized, &self.signature)?;

        // Also validate that the DID matches the public key
        self.from.validate_did()?;

        Ok(())
    }

    /// Check if this request has expired
    pub fn is_expired(&self) -> bool {
        let now = crate::time::now_timestamp();
        (now - self.created_at) > MAX_REQUEST_AGE_SECS
    }

    /// Encode to JSON
    pub fn to_json(&self) -> Result<String> {
        serde_json::to_string(self).map_err(|e| Error::SerializationError(e.to_string()))
    }

    /// Decode from JSON
    pub fn from_json(json: &str) -> Result<Self> {
        serde_json::from_str(json).map_err(|e| Error::DeserializationError(e.to_string()))
    }
}

/// Data that gets signed for a friend request
#[derive(Serialize, Deserialize)]
struct FriendRequestSignData {
    id: String,
    from_did: String,
    to_did: String,
    message: Option<String>,
    created_at: i64,
}

/// Response to a friend request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FriendResponse {
    /// ID of the request being responded to
    pub request_id: String,
    /// Whether the request was accepted
    pub accepted: bool,
    /// Responder's public identity (included if accepted)
    pub responder: Option<PublicIdentity>,
    /// When the response was created
    pub created_at: i64,
    /// Signature over the response
    pub signature: Signature,
}

impl FriendResponse {
    /// Create an acceptance response
    pub fn accept(request_id: String, identity: &Identity) -> Result<Self> {
        let created_at = crate::time::now_timestamp();

        let sign_data = FriendResponseSignData {
            request_id: request_id.clone(),
            accepted: true,
            responder_did: identity.did_string(),
            created_at,
        };

        let serialized =
            bincode::serialize(&sign_data).map_err(|e| Error::SerializationError(e.to_string()))?;

        let signature = sign(&identity.keypair().signing, &serialized);

        Ok(Self {
            request_id,
            accepted: true,
            responder: Some(identity.public_identity()),
            created_at,
            signature,
        })
    }

    /// Create a rejection response
    pub fn reject(request_id: String, identity: &Identity) -> Result<Self> {
        let created_at = crate::time::now_timestamp();

        let sign_data = FriendResponseSignData {
            request_id: request_id.clone(),
            accepted: false,
            responder_did: identity.did_string(),
            created_at,
        };

        let serialized =
            bincode::serialize(&sign_data).map_err(|e| Error::SerializationError(e.to_string()))?;

        let signature = sign(&identity.keypair().signing, &serialized);

        Ok(Self {
            request_id,
            accepted: false,
            responder: None,
            created_at,
            signature,
        })
    }

    /// Verify the response signature
    pub fn verify(&self, expected_did: &str) -> Result<()> {
        // For acceptance, use the responder's public key
        // For rejection, we need the original recipient's key (which we may not have)
        if !self.accepted {
            // For rejections, we can't verify without the key
            return Ok(());
        }

        let responder = self.responder.as_ref().ok_or(Error::InvalidFriendRequest(
            "Acceptance must include responder identity".into(),
        ))?;

        // Verify DID matches expected
        if responder.did != expected_did {
            return Err(Error::InvalidFriendRequest("Responder DID mismatch".into()));
        }

        let sign_data = FriendResponseSignData {
            request_id: self.request_id.clone(),
            accepted: self.accepted,
            responder_did: responder.did.clone(),
            created_at: self.created_at,
        };

        let serialized =
            bincode::serialize(&sign_data).map_err(|e| Error::SerializationError(e.to_string()))?;

        verify(&responder.public_keys.signing, &serialized, &self.signature)?;

        // Validate the DID
        responder.validate_did()?;

        Ok(())
    }

    /// Encode to JSON
    pub fn to_json(&self) -> Result<String> {
        serde_json::to_string(self).map_err(|e| Error::SerializationError(e.to_string()))
    }

    /// Decode from JSON
    pub fn from_json(json: &str) -> Result<Self> {
        serde_json::from_str(json).map_err(|e| Error::DeserializationError(e.to_string()))
    }
}

/// Data that gets signed for a friend response
#[derive(Serialize, Deserialize)]
struct FriendResponseSignData {
    request_id: String,
    accepted: bool,
    responder_did: String,
    created_at: i64,
}

/// A confirmed friend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Friend {
    /// Friend's DID
    pub did: String,
    /// Display name
    pub display_name: String,
    /// Status message
    pub status: Option<String>,
    /// Avatar (base64 or IPFS CID)
    pub avatar: Option<String>,
    /// Their X25519 public key for encryption
    pub encryption_public_key: [u8; 32],
    /// Their Ed25519 public key for verification
    pub signing_public_key: [u8; 32],
    /// When friendship was established
    pub added_at: i64,
    /// Current online status
    pub online: bool,
    /// Last seen timestamp
    pub last_seen: Option<i64>,
}

impl Friend {
    /// Create from a PublicIdentity
    pub fn from_public_identity(identity: &PublicIdentity) -> Self {
        Self {
            did: identity.did.clone(),
            display_name: identity.display_name.clone(),
            status: identity.status.clone(),
            avatar: identity.avatar.clone(),
            encryption_public_key: identity.public_keys.encryption,
            signing_public_key: identity.public_keys.signing,
            added_at: crate::time::now_timestamp(),
            online: false,
            last_seen: None,
        }
    }

    /// Verify a signature from this friend
    pub fn verify_signature(&self, message: &[u8], signature: &Signature) -> Result<()> {
        verify(&self.signing_public_key, message, signature)
    }
}

/// Status of a friend request
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RequestStatus {
    /// Waiting for response
    Pending,
    /// Request was accepted
    Accepted,
    /// Request was rejected
    Rejected,
    /// Request was cancelled by sender
    Cancelled,
    /// Request expired
    Expired,
}

impl RequestStatus {
    /// Convert to database string
    pub fn as_str(&self) -> &'static str {
        match self {
            RequestStatus::Pending => "pending",
            RequestStatus::Accepted => "accepted",
            RequestStatus::Rejected => "rejected",
            RequestStatus::Cancelled => "cancelled",
            RequestStatus::Expired => "expired",
        }
    }

    /// Parse from database string
    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(RequestStatus::Pending),
            "accepted" => Some(RequestStatus::Accepted),
            "rejected" => Some(RequestStatus::Rejected),
            "cancelled" => Some(RequestStatus::Cancelled),
            "expired" => Some(RequestStatus::Expired),
            _ => None,
        }
    }
}

/// Direction of a friend request
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RequestDirection {
    /// Request we sent
    Outgoing,
    /// Request we received
    Incoming,
}

impl RequestDirection {
    /// Convert to database string
    pub fn as_str(&self) -> &'static str {
        match self {
            RequestDirection::Outgoing => "outgoing",
            RequestDirection::Incoming => "incoming",
        }
    }
}

/// Service for managing friend relationships
pub struct FriendsService {
    /// Current user's identity
    identity: Arc<Identity>,
    /// Database for persistence
    database: Arc<Database>,
    /// Cached friends list
    friends_cache: Arc<RwLock<Vec<Friend>>>,
    /// Pending outgoing requests
    outgoing_requests: Arc<RwLock<Vec<FriendRequest>>>,
    /// Pending incoming requests
    incoming_requests: Arc<RwLock<Vec<FriendRequest>>>,
}

impl FriendsService {
    /// Create a new friends service
    pub fn new(identity: Arc<Identity>, database: Arc<Database>) -> Self {
        Self {
            identity,
            database,
            friends_cache: Arc::new(RwLock::new(Vec::new())),
            outgoing_requests: Arc::new(RwLock::new(Vec::new())),
            incoming_requests: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Load friends and requests from database
    pub fn load(&self) -> Result<()> {
        // Load friends
        let friend_records = self.database.get_all_friends()?;
        let mut friends = Vec::new();

        for record in friend_records {
            let signing_key = hex::decode(&record.signing_key)
                .map_err(|e| Error::DatabaseError(format!("Invalid signing key: {}", e)))?;
            let encryption_key = hex::decode(&record.encryption_key)
                .map_err(|e| Error::DatabaseError(format!("Invalid encryption key: {}", e)))?;

            let signing_key: [u8; 32] = signing_key
                .try_into()
                .map_err(|_| Error::DatabaseError("Invalid signing key length".into()))?;
            let encryption_key: [u8; 32] = encryption_key
                .try_into()
                .map_err(|_| Error::DatabaseError("Invalid encryption key length".into()))?;

            friends.push(Friend {
                did: record.did,
                display_name: record.display_name,
                status: record.status,
                avatar: None,
                encryption_public_key: encryption_key,
                signing_public_key: signing_key,
                added_at: record.created_at,
                online: false,
                last_seen: None,
            });
        }

        *self.friends_cache.write() = friends;

        // Load pending requests
        let outgoing_records = self.database.get_pending_requests("outgoing")?;
        let incoming_records = self.database.get_pending_requests("incoming")?;

        // Note: The full FriendRequest data would need to be stored
        // For now, we just clear the caches (they'll be populated via network)
        self.outgoing_requests.write().clear();
        self.incoming_requests.write().clear();

        tracing::info!(
            "Loaded {} friends, {} outgoing requests, {} incoming requests",
            self.friends_cache.read().len(),
            outgoing_records.len(),
            incoming_records.len()
        );

        Ok(())
    }

    /// Create and store a new friend request
    pub fn create_request(&self, to_did: &str, message: Option<String>) -> Result<FriendRequest> {
        // Check if already friends
        if self.is_friend(to_did) {
            return Err(Error::AlreadyFriends);
        }

        // Check if blocked
        if self.database.is_blocked(to_did)? {
            return Err(Error::UserBlocked);
        }

        // Check for existing pending request
        if self.has_pending_request(to_did) {
            return Err(Error::RequestPending);
        }

        // Create the request
        let request = FriendRequest::create(&self.identity, to_did.to_string(), message)?;

        // Store in database
        let record = FriendRequestRecord {
            id: request.id.clone(),
            from_did: request.from.did.clone(),
            to_did: request.to_did.clone(),
            direction: "outgoing".to_string(),
            message: request.message.clone(),
            from_signing_key: Some(hex::encode(request.from.public_keys.signing)),
            from_encryption_key: Some(hex::encode(request.from.public_keys.encryption)),
            from_display_name: Some(request.from.display_name.clone()),
            from_avatar: request.from.avatar.clone(),
            created_at: request.created_at,
            status: "pending".to_string(),
        };

        self.database.store_friend_request(&record)?;

        // Cache the request
        self.outgoing_requests.write().push(request.clone());

        tracing::info!("Created friend request to {}", to_did);
        Ok(request)
    }

    /// Handle an incoming friend request
    pub fn handle_incoming_request(&self, request: FriendRequest) -> Result<()> {
        // Verify the request signature
        request.verify()?;

        // Check if it's for us
        if request.to_did != self.identity.did_string() {
            return Err(Error::InvalidFriendRequest("Request is not for us".into()));
        }

        // Check if expired
        if request.is_expired() {
            return Err(Error::InvalidFriendRequest("Request has expired".into()));
        }

        // Check if already friends
        if self.is_friend(&request.from.did) {
            return Err(Error::AlreadyFriends);
        }

        // Check if blocked
        if self.database.is_blocked(&request.from.did)? {
            return Err(Error::UserBlocked);
        }

        // Store in database
        let record = FriendRequestRecord {
            id: request.id.clone(),
            from_did: request.from.did.clone(),
            to_did: request.to_did.clone(),
            direction: "incoming".to_string(),
            message: request.message.clone(),
            from_signing_key: Some(hex::encode(request.from.public_keys.signing)),
            from_encryption_key: Some(hex::encode(request.from.public_keys.encryption)),
            from_display_name: Some(request.from.display_name.clone()),
            from_avatar: request.from.avatar.clone(),
            created_at: request.created_at,
            status: "pending".to_string(),
        };

        self.database.store_friend_request(&record)?;

        // Cache the request
        self.incoming_requests.write().push(request.clone());

        tracing::info!("Received friend request from {}", request.from.did);
        Ok(())
    }

    /// Accept a friend request
    pub fn accept_request(&self, request_id: &str) -> Result<(Friend, FriendResponse)> {
        // Find the request
        let request = self
            .get_incoming_request(request_id)?
            .ok_or(Error::RequestNotFound)?;

        // Create the friend
        let friend = Friend::from_public_identity(&request.from);

        // Store friend in database
        self.database.add_friend(
            &friend.did,
            &friend.display_name,
            &friend.signing_public_key,
            &friend.encryption_public_key,
            friend.status.as_deref(),
        )?;

        // Update request status
        self.database
            .update_request_status(request_id, "accepted")?;

        // Create response
        let response = FriendResponse::accept(request_id.to_string(), &self.identity)?;

        // Update caches
        self.friends_cache.write().push(friend.clone());
        self.incoming_requests
            .write()
            .retain(|r| r.id != request_id);

        // Create conversation for this friend
        let conversation_id = Uuid::new_v4().to_string();
        self.database
            .create_conversation(&conversation_id, &friend.did)?;

        tracing::info!("Accepted friend request from {}", friend.did);
        Ok((friend, response))
    }

    /// Reject a friend request
    pub fn reject_request(&self, request_id: &str) -> Result<FriendResponse> {
        // Find the request
        let _request = self
            .get_incoming_request(request_id)?
            .ok_or(Error::RequestNotFound)?;

        // Update request status
        self.database
            .update_request_status(request_id, "rejected")?;

        // Create response
        let response = FriendResponse::reject(request_id.to_string(), &self.identity)?;

        // Update cache
        self.incoming_requests
            .write()
            .retain(|r| r.id != request_id);

        tracing::info!("Rejected friend request {}", request_id);
        Ok(response)
    }

    /// Handle a response to our friend request
    pub fn handle_response(&self, response: FriendResponse) -> Result<Option<Friend>> {
        // Find our outgoing request
        let request = self
            .get_outgoing_request(&response.request_id)?
            .ok_or(Error::RequestNotFound)?;

        // Verify the response (for acceptances)
        response.verify(&request.to_did)?;

        if response.accepted {
            // Get the responder's identity
            let responder = response
                .responder
                .as_ref()
                .ok_or(Error::InvalidFriendRequest(
                    "Acceptance missing responder".into(),
                ))?;

            // Create the friend
            let friend = Friend::from_public_identity(responder);

            // Store friend in database
            self.database.add_friend(
                &friend.did,
                &friend.display_name,
                &friend.signing_public_key,
                &friend.encryption_public_key,
                friend.status.as_deref(),
            )?;

            // Update request status
            self.database
                .update_request_status(&response.request_id, "accepted")?;

            // Update caches
            self.friends_cache.write().push(friend.clone());
            self.outgoing_requests
                .write()
                .retain(|r| r.id != response.request_id);

            // Create conversation for this friend
            let conversation_id = Uuid::new_v4().to_string();
            self.database
                .create_conversation(&conversation_id, &friend.did)?;

            tracing::info!("Friend request to {} was accepted", friend.did);
            Ok(Some(friend))
        } else {
            // Request was rejected
            self.database
                .update_request_status(&response.request_id, "rejected")?;
            self.outgoing_requests
                .write()
                .retain(|r| r.id != response.request_id);

            tracing::info!("Friend request {} was rejected", response.request_id);
            Ok(None)
        }
    }

    /// Cancel an outgoing request
    pub fn cancel_request(&self, request_id: &str) -> Result<()> {
        // Verify the request exists and is ours
        let _request = self
            .get_outgoing_request(request_id)?
            .ok_or(Error::RequestNotFound)?;

        // Update status
        self.database
            .update_request_status(request_id, "cancelled")?;

        // Update cache
        self.outgoing_requests
            .write()
            .retain(|r| r.id != request_id);

        tracing::info!("Cancelled friend request {}", request_id);
        Ok(())
    }

    /// Remove a friend
    pub fn remove_friend(&self, did: &str) -> Result<()> {
        if !self.is_friend(did) {
            return Err(Error::NotFriends);
        }

        // Remove from database
        self.database.remove_friend(did)?;

        // Update cache
        self.friends_cache.write().retain(|f| f.did != did);

        tracing::info!("Removed friend {}", did);
        Ok(())
    }

    /// Block a user
    pub fn block_user(&self, did: &str, reason: Option<&str>) -> Result<()> {
        // If they're a friend, remove them
        if self.is_friend(did) {
            self.remove_friend(did)?;
        }

        // Block in database
        self.database.block_user(did, reason)?;

        // Remove any pending requests from this user
        self.incoming_requests.write().retain(|r| r.from.did != did);

        tracing::info!("Blocked user {}", did);
        Ok(())
    }

    /// Unblock a user
    pub fn unblock_user(&self, did: &str) -> Result<()> {
        self.database.unblock_user(did)?;
        tracing::info!("Unblocked user {}", did);
        Ok(())
    }

    /// Check if a user is blocked
    pub fn is_blocked(&self, did: &str) -> Result<bool> {
        self.database.is_blocked(did)
    }

    /// Get all friends
    pub fn get_friends(&self) -> Vec<Friend> {
        self.friends_cache.read().clone()
    }

    /// Get a friend by DID
    pub fn get_friend(&self, did: &str) -> Option<Friend> {
        self.friends_cache
            .read()
            .iter()
            .find(|f| f.did == did)
            .cloned()
    }

    /// Check if someone is a friend
    pub fn is_friend(&self, did: &str) -> bool {
        self.friends_cache.read().iter().any(|f| f.did == did)
    }

    /// Get pending incoming requests
    pub fn get_incoming_requests(&self) -> Vec<FriendRequest> {
        self.incoming_requests.read().clone()
    }

    /// Get pending outgoing requests
    pub fn get_outgoing_requests(&self) -> Vec<FriendRequest> {
        self.outgoing_requests.read().clone()
    }

    /// Check if there's a pending request involving this DID
    pub fn has_pending_request(&self, did: &str) -> bool {
        let outgoing = self.outgoing_requests.read();
        let incoming = self.incoming_requests.read();

        outgoing.iter().any(|r| r.to_did == did) || incoming.iter().any(|r| r.from.did == did)
    }

    // Helper methods

    fn get_incoming_request(&self, id: &str) -> Result<Option<FriendRequest>> {
        Ok(self
            .incoming_requests
            .read()
            .iter()
            .find(|r| r.id == id)
            .cloned())
    }

    fn get_outgoing_request(&self, id: &str) -> Result<Option<FriendRequest>> {
        Ok(self
            .outgoing_requests
            .read()
            .iter()
            .find(|r| r.id == id)
            .cloned())
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_identity(name: &str) -> Identity {
        let (identity, _) = Identity::create(name.to_string()).unwrap();
        identity
    }

    #[test]
    fn test_friend_request_creation() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let request = FriendRequest::create(
            &alice,
            bob.did_string(),
            Some("Let's be friends!".to_string()),
        )
        .unwrap();

        assert_eq!(request.from.did, alice.did_string());
        assert_eq!(request.to_did, bob.did_string());
        assert_eq!(request.message, Some("Let's be friends!".to_string()));
        assert!(!request.id.is_empty());
    }

    #[test]
    fn test_friend_request_verification() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let request = FriendRequest::create(&alice, bob.did_string(), None).unwrap();

        // Verification should succeed
        assert!(request.verify().is_ok());
    }

    #[test]
    fn test_friend_request_tampered() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let mut request = FriendRequest::create(&alice, bob.did_string(), None).unwrap();

        // Tamper with the message
        request.message = Some("Tampered!".to_string());

        // Verification should fail
        assert!(request.verify().is_err());
    }

    #[test]
    fn test_cannot_add_self() {
        let alice = create_test_identity("Alice");

        let result = FriendRequest::create(&alice, alice.did_string(), None);

        assert!(matches!(result, Err(Error::CannotAddSelf)));
    }

    #[test]
    fn test_friend_response_accept() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let request = FriendRequest::create(&alice, bob.did_string(), None).unwrap();

        let response = FriendResponse::accept(request.id.clone(), &bob).unwrap();

        assert!(response.accepted);
        assert!(response.responder.is_some());
        assert_eq!(response.request_id, request.id);
    }

    #[test]
    fn test_friend_response_verification() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let request = FriendRequest::create(&alice, bob.did_string(), None).unwrap();

        let response = FriendResponse::accept(request.id.clone(), &bob).unwrap();

        // Verify with expected DID
        assert!(response.verify(&bob.did_string()).is_ok());

        // Verify with wrong DID should fail
        assert!(response.verify(&alice.did_string()).is_err());
    }

    #[test]
    fn test_friend_from_public_identity() {
        let alice = create_test_identity("Alice");
        let public = alice.public_identity();

        let friend = Friend::from_public_identity(&public);

        assert_eq!(friend.did, public.did);
        assert_eq!(friend.display_name, "Alice");
        assert_eq!(friend.signing_public_key, public.public_keys.signing);
        assert_eq!(friend.encryption_public_key, public.public_keys.encryption);
    }

    #[test]
    fn test_request_expiry() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let mut request = FriendRequest::create(&alice, bob.did_string(), None).unwrap();

        // Not expired when fresh
        assert!(!request.is_expired());

        // Manually set old timestamp
        request.created_at = crate::time::now_timestamp() - (MAX_REQUEST_AGE_SECS + 1);
        assert!(request.is_expired());
    }

    #[test]
    fn test_request_json_roundtrip() {
        let alice = create_test_identity("Alice");
        let bob = create_test_identity("Bob");

        let request =
            FriendRequest::create(&alice, bob.did_string(), Some("Hi!".to_string())).unwrap();

        let json = request.to_json().unwrap();
        let restored = FriendRequest::from_json(&json).unwrap();

        assert_eq!(request.id, restored.id);
        assert_eq!(request.from.did, restored.from.did);
        assert_eq!(request.message, restored.message);
    }

    #[test]
    fn test_request_status() {
        assert_eq!(RequestStatus::Pending.as_str(), "pending");
        assert_eq!(RequestStatus::Accepted.as_str(), "accepted");
        assert_eq!(
            RequestStatus::parse("pending"),
            Some(RequestStatus::Pending)
        );
        assert_eq!(RequestStatus::parse("invalid"), None);
    }

    #[tokio::test]
    async fn test_friends_service_basic() {
        let alice = Arc::new(create_test_identity("Alice"));
        let database = Arc::new(Database::open(None).await.unwrap());

        let service = FriendsService::new(alice.clone(), database);

        // Should start empty
        assert!(service.get_friends().is_empty());
        assert!(service.get_incoming_requests().is_empty());
        assert!(service.get_outgoing_requests().is_empty());
    }

    #[tokio::test]
    async fn test_friends_service_create_request() {
        let alice = Arc::new(create_test_identity("Alice"));
        let bob = create_test_identity("Bob");
        let database = Arc::new(Database::open(None).await.unwrap());

        let service = FriendsService::new(alice.clone(), database);

        let request = service
            .create_request(&bob.did_string(), Some("Hi Bob!".to_string()))
            .unwrap();

        assert_eq!(request.to_did, bob.did_string());
        assert!(service.has_pending_request(&bob.did_string()));
    }

    #[tokio::test]
    async fn test_friends_service_handle_incoming() {
        let alice = create_test_identity("Alice");
        let bob = Arc::new(create_test_identity("Bob"));
        let database = Arc::new(Database::open(None).await.unwrap());

        let service = FriendsService::new(bob.clone(), database);

        // Create request from Alice
        let request =
            FriendRequest::create(&alice, bob.did_string(), Some("Hi!".to_string())).unwrap();

        // Handle it
        service.handle_incoming_request(request.clone()).unwrap();

        // Should have pending request
        assert_eq!(service.get_incoming_requests().len(), 1);
    }

    #[tokio::test]
    async fn test_friends_service_accept_request() {
        let alice = create_test_identity("Alice");
        let bob = Arc::new(create_test_identity("Bob"));
        let database = Arc::new(Database::open(None).await.unwrap());

        let service = FriendsService::new(bob.clone(), database);

        // Create and handle incoming request
        let request = FriendRequest::create(&alice, bob.did_string(), None).unwrap();
        service.handle_incoming_request(request.clone()).unwrap();

        // Accept it
        let (friend, response) = service.accept_request(&request.id).unwrap();

        assert_eq!(friend.did, alice.did_string());
        assert!(response.accepted);
        assert!(service.is_friend(&alice.did_string()));
        assert!(service.get_incoming_requests().is_empty());
    }

    #[tokio::test]
    async fn test_friends_service_block() {
        let alice = Arc::new(create_test_identity("Alice"));
        let database = Arc::new(Database::open(None).await.unwrap());

        let service = FriendsService::new(alice.clone(), database);

        let bad_did = "did:key:z6MkBadUser123";

        service.block_user(bad_did, Some("Spam")).unwrap();

        assert!(service.is_blocked(bad_did).unwrap());

        service.unblock_user(bad_did).unwrap();

        assert!(!service.is_blocked(bad_did).unwrap());
    }
}
