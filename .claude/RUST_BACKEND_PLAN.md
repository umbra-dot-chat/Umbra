# Umbra Core: Rust Backend Architecture

## Overview

This document outlines the architecture for **Umbra Core**, a lightweight Rust backend that runs embedded within the Umbra app. The focus is on building a solid foundation for:

1. **Account Creation** - Cryptographic identity generation
2. **User Discovery** - Finding and connecting with other users
3. **Friend Requests** - Sending, receiving, and managing friend relationships
4. **Basic Encrypted Chat** - Real-time E2E encrypted messaging (online peers only)

Future phases will add **mesh networking** for offline message delivery, but the architecture will be designed with this in mind from the start.

---

## Design Principles

1. **Start Simple**: Online-only messaging first, mesh later
2. **Extensible**: Design data structures and protocols to support future mesh relay
3. **No Warp Dependencies**: Build our own focused implementation
4. **Cross-Platform**: Single Rust codebase for Web (WASM), iOS, and Android

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Umbra React Native App                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         UmbraService (TypeScript)                       │
│                    Platform-agnostic API for frontend                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
       ┌────────────┐        ┌────────────┐        ┌────────────┐
       │  Web WASM  │        │ iOS Native │        │  Android   │
       │ Web Worker │        │ UniFFI/JSI │        │ UniFFI/JNI │
       └────────────┘        └────────────┘        └────────────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           UMBRA CORE (Rust)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  Identity   │  │  Discovery  │  │   Friends   │  │   Messaging  │   │
│  │             │  │             │  │             │  │              │   │
│  │ - Keypair   │  │ - DHT       │  │ - Requests  │  │ - Encrypt    │   │
│  │ - DID       │  │ - Bootstrap │  │ - Accept    │  │ - Send/Recv  │   │
│  │ - Profile   │  │ - Announce  │  │ - Block     │  │ - Streams    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘   │
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────────┐ │
│  │   Crypto    │  │   Storage   │  │           Network               │ │
│  │             │  │             │  │                                 │ │
│  │ - X25519    │  │ - SQLite    │  │ - libp2p (Noise, Yamux)        │ │
│  │ - AES-GCM   │  │ - Encrypted │  │ - Direct connections           │ │
│  │ - Signing   │  │ - Platform  │  │ - [Future: Relay/Mesh]         │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Module Design

### 1. Identity Module

The identity module handles account creation and cryptographic identity.

#### Data Structures

```rust
/// A user's cryptographic identity
pub struct Identity {
    /// Ed25519 keypair for signing (also derives PeerId)
    signing_keypair: ed25519_dalek::SigningKey,

    /// X25519 keypair for encryption key exchange
    encryption_keypair: x25519_dalek::StaticSecret,

    /// Decentralized Identifier derived from public key
    /// Format: did:key:z6Mk...
    pub did: String,

    /// Human-readable display name
    pub display_name: String,

    /// Optional status message
    pub status: Option<String>,

    /// Avatar (stored as base64 or CID for future IPFS)
    pub avatar: Option<String>,

    /// When the identity was created
    pub created_at: i64,
}

/// Public portion of identity (shareable with others)
pub struct PublicIdentity {
    pub did: String,
    pub display_name: String,
    pub status: Option<String>,
    pub avatar: Option<String>,
    /// Ed25519 public key bytes for verification
    pub signing_public_key: [u8; 32],
    /// X25519 public key bytes for encryption
    pub encryption_public_key: [u8; 32],
}
```

#### API

```rust
/// Create a new identity with optional recovery phrase
/// If no phrase provided, generates a new random one and returns it
pub async fn create_identity(
    display_name: String,
    recovery_phrase: Option<String>,
) -> Result<(Identity, String), CoreError>;

/// Load existing identity from secure storage
pub async fn load_identity() -> Result<Option<Identity>, CoreError>;

/// Update profile information
pub async fn update_profile(update: ProfileUpdate) -> Result<(), CoreError>;

/// Export identity for backup (encrypted with passphrase)
pub async fn export_identity(passphrase: String) -> Result<Vec<u8>, CoreError>;

/// Import identity from backup
pub async fn import_identity(
    backup: Vec<u8>,
    passphrase: String,
) -> Result<Identity, CoreError>;

/// Get our public identity to share with others
pub fn get_public_identity() -> PublicIdentity;
```

#### Key Derivation

```
Recovery Phrase (BIP39 24 words)
         │
         ▼
    PBKDF2/Argon2
         │
         ▼
   Master Seed (32 bytes)
         │
    ┌────┴────┐
    ▼         ▼
 Ed25519   X25519
 Signing   Encryption
```

This allows deterministic key recovery from the phrase while having separate keys for signing (identity verification) and encryption (E2E messaging).

---

### 2. Discovery Module

The discovery module handles finding other users on the network.

#### Discovery Methods

**Phase 1 (Current Focus):**
1. **Direct Connection** - Connect via known address (QR code, shared link)
2. **DHT Lookup** - Find peer addresses by their DID
3. **Bootstrap Nodes** - Initial connection points to join the network

**Phase 2 (Future - Mesh):**
4. **mDNS** - Local network discovery
5. **Relay Discovery** - Find peers who can relay messages

#### Data Structures

```rust
/// How a peer can be reached
pub struct PeerAddress {
    pub peer_id: String,        // libp2p PeerId
    pub multiaddrs: Vec<String>, // /ip4/1.2.3.4/tcp/4001, /dns/..., etc.
    pub last_seen: i64,
    pub is_relay_capable: bool, // For future mesh support
}

/// Result of a discovery lookup
pub enum DiscoveryResult {
    /// Found the peer, here's how to reach them
    Found(PeerAddress),
    /// Peer exists but is currently offline
    Offline { last_seen: Option<i64> },
    /// No record of this peer
    NotFound,
}

/// Events from the discovery system
pub enum DiscoveryEvent {
    /// A peer we're interested in came online
    PeerOnline { did: String, addresses: Vec<String> },
    /// A peer went offline
    PeerOffline { did: String },
    /// Network connectivity changed
    NetworkStatus { connected: bool, peer_count: u32 },
}
```

#### API

```rust
/// Start the discovery service and connect to bootstrap nodes
pub async fn start_discovery(config: DiscoveryConfig) -> Result<(), CoreError>;

/// Look up a user by their DID
pub async fn lookup_peer(did: String) -> Result<DiscoveryResult, CoreError>;

/// Announce our presence to the network
pub async fn announce_presence() -> Result<(), CoreError>;

/// Subscribe to discovery events
pub fn subscribe_discovery_events() -> impl Stream<Item = DiscoveryEvent>;

/// Get our connection info to share (for QR codes, links)
pub fn get_connection_info() -> ConnectionInfo;

/// Connect directly to a peer via shared connection info
pub async fn connect_direct(info: ConnectionInfo) -> Result<(), CoreError>;
```

#### Bootstrap Strategy

```
App Start
    │
    ▼
┌─────────────────────────┐
│  Connect to Bootstrap   │  (Hardcoded list of reliable nodes)
│  Nodes                  │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Announce Self to DHT   │  (Publish: DID → PeerId + Multiaddrs)
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Lookup Friends from    │  (Check which friends are online)
│  Local Friend List      │
└─────────────────────────┘
    │
    ▼
┌─────────────────────────┐
│  Emit Online/Offline    │  (Frontend updates presence indicators)
│  Events                 │
└─────────────────────────┘
```

---

### 3. Friends Module

The friends module manages relationships between users.

#### Friend Request Flow

```
  Alice                                    Bob
    │                                       │
    │  1. Create FriendRequest             │
    │     (signed with Alice's key)        │
    │                                       │
    │  ──────── FriendRequest ──────────►  │
    │                                       │
    │                          2. Verify    │
    │                             signature │
    │                                       │
    │                          3. User sees │
    │                             request   │
    │                                       │
    │  ◄─────── FriendResponse ──────────  │
    │           (Accept/Reject)            │
    │                                       │
    │  4. If accepted, both add            │
    │     each other to friend list        │
    │                                       │
    │  ═══════ Encrypted Channel ═════════ │
    │     (X25519 key exchange)            │
```

#### Data Structures

```rust
/// A friend request
pub struct FriendRequest {
    /// Unique ID for this request
    pub id: String,
    /// Who sent the request
    pub from: PublicIdentity,
    /// Who it's for (our DID)
    pub to_did: String,
    /// Optional message
    pub message: Option<String>,
    /// When it was created
    pub created_at: i64,
    /// Signature proving it's from `from`
    pub signature: Vec<u8>,
}

/// Response to a friend request
pub struct FriendResponse {
    pub request_id: String,
    pub accepted: bool,
    /// Responder's public identity (for key exchange)
    pub responder: PublicIdentity,
    pub signature: Vec<u8>,
}

/// A confirmed friendship
pub struct Friend {
    pub did: String,
    pub display_name: String,
    pub status: Option<String>,
    pub avatar: Option<String>,
    /// Their public keys for encryption
    pub encryption_public_key: [u8; 32],
    pub signing_public_key: [u8; 32],
    /// When friendship was established
    pub added_at: i64,
    /// Current online status
    pub online: bool,
    /// Last time we saw them online
    pub last_seen: Option<i64>,
}

/// Friend-related events
pub enum FriendEvent {
    /// Someone sent us a friend request
    RequestReceived(FriendRequest),
    /// Someone accepted our request
    RequestAccepted { did: String, friend: Friend },
    /// Someone rejected our request
    RequestRejected { did: String },
    /// A friend came online
    FriendOnline { did: String },
    /// A friend went offline
    FriendOffline { did: String },
    /// A friend updated their profile
    FriendUpdated { did: String, friend: Friend },
}
```

#### API

```rust
/// Send a friend request to a user
pub async fn send_friend_request(
    to_did: String,
    message: Option<String>,
) -> Result<FriendRequest, CoreError>;

/// Get all pending incoming friend requests
pub async fn get_incoming_requests() -> Result<Vec<FriendRequest>, CoreError>;

/// Get all pending outgoing friend requests
pub async fn get_outgoing_requests() -> Result<Vec<FriendRequest>, CoreError>;

/// Accept a friend request
pub async fn accept_friend_request(request_id: String) -> Result<Friend, CoreError>;

/// Reject a friend request
pub async fn reject_friend_request(request_id: String) -> Result<(), CoreError>;

/// Cancel an outgoing friend request
pub async fn cancel_friend_request(request_id: String) -> Result<(), CoreError>;

/// Get all friends
pub async fn get_friends() -> Result<Vec<Friend>, CoreError>;

/// Remove a friend
pub async fn remove_friend(did: String) -> Result<(), CoreError>;

/// Block a user (prevents requests and messages)
pub async fn block_user(did: String) -> Result<(), CoreError>;

/// Unblock a user
pub async fn unblock_user(did: String) -> Result<(), CoreError>;

/// Get blocked users
pub async fn get_blocked_users() -> Result<Vec<String>, CoreError>;

/// Subscribe to friend events
pub fn subscribe_friend_events() -> impl Stream<Item = FriendEvent>;
```

---

### 4. Messaging Module

The messaging module handles real-time encrypted chat between online friends.

#### Encryption Protocol

For each conversation, we use **Double Ratchet** (simplified for v1):

```
Alice's X25519 Private + Bob's X25519 Public
                    │
                    ▼
            Shared Secret (X25519 ECDH)
                    │
                    ▼
            HKDF Key Derivation
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
    Encryption Key      Authentication Key
    (AES-256-GCM)       (HMAC-SHA256)
```

**V1 (Simple):** Static shared secret per friend pair
**V2 (Future):** Full Double Ratchet with forward secrecy

#### Data Structures

```rust
/// A message in a conversation
pub struct Message {
    /// Unique message ID (UUID)
    pub id: String,
    /// Conversation this belongs to
    pub conversation_id: String,
    /// Sender's DID
    pub sender_did: String,
    /// Message content (plaintext after decryption)
    pub content: MessageContent,
    /// Unix timestamp when sent
    pub sent_at: i64,
    /// Whether we've read it
    pub read: bool,
    /// Delivery status
    pub status: MessageStatus,
}

pub enum MessageContent {
    Text(String),
    // Future: Image, File, etc.
}

pub enum MessageStatus {
    /// Message is being sent
    Sending,
    /// Message sent but not confirmed delivered
    Sent,
    /// Message delivered to recipient's device
    Delivered,
    /// Recipient has read the message
    Read,
    /// Failed to send (peer offline, etc.)
    Failed { reason: String },
}

/// A conversation with a friend
pub struct Conversation {
    /// Unique conversation ID (derived from both DIDs)
    pub id: String,
    /// Friend we're chatting with
    pub friend_did: String,
    /// Last message preview
    pub last_message: Option<Message>,
    /// Unread message count
    pub unread_count: u32,
    /// When conversation was last active
    pub last_activity: i64,
}

/// Message-related events
pub enum MessageEvent {
    /// We sent a message
    MessageSent { message: Message },
    /// We received a message
    MessageReceived { message: Message },
    /// Message status updated
    MessageStatusChanged { message_id: String, status: MessageStatus },
    /// Friend is typing
    TypingStarted { conversation_id: String, did: String },
    /// Friend stopped typing
    TypingStopped { conversation_id: String, did: String },
}
```

#### API

```rust
/// Get or create a conversation with a friend
pub async fn get_conversation(friend_did: String) -> Result<Conversation, CoreError>;

/// Get all conversations
pub async fn get_conversations() -> Result<Vec<Conversation>, CoreError>;

/// Send a message to a friend
/// Returns immediately with Sending status, updates via events
pub async fn send_message(
    conversation_id: String,
    content: MessageContent,
) -> Result<Message, CoreError>;

/// Get messages in a conversation (paginated)
pub async fn get_messages(
    conversation_id: String,
    before: Option<i64>,  // Cursor for pagination
    limit: u32,
) -> Result<Vec<Message>, CoreError>;

/// Mark messages as read
pub async fn mark_as_read(
    conversation_id: String,
    up_to_message_id: String,
) -> Result<(), CoreError>;

/// Send typing indicator
pub async fn send_typing_indicator(conversation_id: String) -> Result<(), CoreError>;

/// Subscribe to message events
pub fn subscribe_message_events() -> impl Stream<Item = MessageEvent>;
```

#### Wire Protocol

Messages sent over libp2p use a simple envelope:

```rust
/// Encrypted message envelope sent over the wire
struct MessageEnvelope {
    /// Protocol version
    version: u8,
    /// Message type
    msg_type: EnvelopeType,
    /// Encrypted payload
    ciphertext: Vec<u8>,
    /// Nonce for AES-GCM
    nonce: [u8; 12],
    /// Sender's signature over (msg_type || ciphertext || nonce)
    signature: Vec<u8>,
}

enum EnvelopeType {
    ChatMessage = 1,
    TypingIndicator = 2,
    ReadReceipt = 3,
    FriendRequest = 10,
    FriendResponse = 11,
    // Future: mesh relay types
    RelayedMessage = 100,
}
```

---

### 5. Storage Module

Local encrypted storage for persistence across sessions.

#### What We Store

| Data | Storage | Encryption |
|------|---------|------------|
| Identity (private keys) | Platform secure storage | Yes (Keychain/Keystore) |
| Friends list | SQLite | Yes (app-level key) |
| Messages | SQLite | Yes (per-conversation key) |
| Pending requests | SQLite | Yes (app-level key) |
| Settings | SQLite | No (non-sensitive) |

#### API

```rust
/// Initialize storage (called on app start)
pub async fn init_storage(encryption_key: &[u8]) -> Result<(), CoreError>;

/// Securely store identity (uses platform secure storage)
pub async fn store_identity(identity: &Identity) -> Result<(), CoreError>;

/// Load identity from secure storage
pub async fn load_identity() -> Result<Option<Identity>, CoreError>;

// Other storage operations are internal to each module
```

---

### 6. Network Module (libp2p)

The networking layer built on libp2p.

#### Protocol Stack

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│  (Friend Requests, Messages, Discovery) │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Custom Protocols                │
│  /umbra/friends/1.0.0                   │
│  /umbra/messaging/1.0.0                 │
│  /umbra/presence/1.0.0                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│              libp2p                     │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │  Noise  │ │  Yamux  │ │   DHT    │  │
│  │(encrypt)│ │ (mux)   │ │(Kademlia)│  │
│  └─────────┘ └─────────┘ └──────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│            Transport                    │
│  TCP / WebSocket / WebRTC              │
│  (platform-dependent)                   │
└─────────────────────────────────────────┘
```

#### Transport by Platform

| Platform | Primary Transport | Notes |
|----------|------------------|-------|
| iOS/Android | TCP + QUIC | Direct connections when possible |
| Web | WebSocket + WebRTC | Browser limitations |
| All | Circuit Relay v2 | For NAT traversal (future) |

---

## Future: Mesh Networking for Offline Messages

The current design is **prepared** for mesh networking but doesn't implement it yet. Here's how it will work:

### Concept

When Bob is offline, Alice's message can be stored by mutual friends who are online. When Bob comes online, he retrieves the message from whoever has it.

```
Alice ───[Bob offline]───X───► Bob

Alice ───► Carol (mutual friend, online) ───► Bob (when online)
           └── Stores encrypted message
```

### Data Structure Preparation

```rust
/// Future: A message that can be relayed through mesh
pub struct MeshMessage {
    /// The actual message envelope
    pub envelope: MessageEnvelope,
    /// Intended recipient DID
    pub to_did: String,
    /// Message expiry (don't relay forever)
    pub expires_at: i64,
    /// How many hops this message has taken
    pub hop_count: u8,
    /// Max hops allowed
    pub max_hops: u8,
}
```

### Why This Design Supports Mesh

1. **Message IDs are UUIDs**: Deduplication across relays
2. **Messages are E2E encrypted**: Relays can't read content
3. **Signed envelopes**: Can verify sender through relay chain
4. **Friend relationships**: Natural relay candidates
5. **DHT presence**: Know who's online to route through

---

## TypeScript API Surface

The frontend sees a clean, platform-agnostic API:

```typescript
// services/UmbraCore.ts

interface UmbraCore {
  // Identity
  createIdentity(displayName: string, recoveryPhrase?: string): Promise<{ identity: Identity; recoveryPhrase: string }>;
  loadIdentity(): Promise<Identity | null>;
  updateProfile(update: ProfileUpdate): Promise<void>;
  getPublicIdentity(): PublicIdentity;

  // Discovery
  startNetwork(): Promise<void>;
  stopNetwork(): Promise<void>;
  lookupPeer(did: string): Promise<DiscoveryResult>;
  getConnectionInfo(): ConnectionInfo;
  connectDirect(info: ConnectionInfo): Promise<void>;
  onDiscoveryEvent(callback: (event: DiscoveryEvent) => void): () => void;

  // Friends
  sendFriendRequest(toDid: string, message?: string): Promise<FriendRequest>;
  getIncomingRequests(): Promise<FriendRequest[]>;
  getOutgoingRequests(): Promise<FriendRequest[]>;
  acceptFriendRequest(requestId: string): Promise<Friend>;
  rejectFriendRequest(requestId: string): Promise<void>;
  getFriends(): Promise<Friend[]>;
  removeFriend(did: string): Promise<void>;
  blockUser(did: string): Promise<void>;
  onFriendEvent(callback: (event: FriendEvent) => void): () => void;

  // Messaging
  getConversations(): Promise<Conversation[]>;
  getConversation(friendDid: string): Promise<Conversation>;
  sendMessage(conversationId: string, content: string): Promise<Message>;
  getMessages(conversationId: string, before?: number, limit?: number): Promise<Message[]>;
  markAsRead(conversationId: string, upToMessageId: string): Promise<void>;
  sendTypingIndicator(conversationId: string): Promise<void>;
  onMessageEvent(callback: (event: MessageEvent) => void): () => void;
}
```

---

## Package Structure

```
Umbra/
├── packages/
│   └── umbra-core/                    # Rust core library
│       ├── Cargo.toml
│       ├── uniffi.toml
│       ├── src/
│       │   ├── lib.rs                 # FFI exports
│       │   ├── error.rs               # Error types
│       │   ├── identity/
│       │   │   ├── mod.rs
│       │   │   ├── keypair.rs         # Key generation/derivation
│       │   │   └── profile.rs         # Profile management
│       │   ├── discovery/
│       │   │   ├── mod.rs
│       │   │   ├── dht.rs             # DHT operations
│       │   │   └── bootstrap.rs       # Bootstrap node handling
│       │   ├── friends/
│       │   │   ├── mod.rs
│       │   │   ├── request.rs         # Friend request logic
│       │   │   └── relationship.rs    # Friend management
│       │   ├── messaging/
│       │   │   ├── mod.rs
│       │   │   ├── conversation.rs    # Conversation management
│       │   │   ├── encryption.rs      # Message encryption
│       │   │   └── protocol.rs        # Wire protocol
│       │   ├── storage/
│       │   │   ├── mod.rs
│       │   │   ├── sqlite.rs          # SQLite operations
│       │   │   └── secure.rs          # Platform secure storage
│       │   └── network/
│       │       ├── mod.rs
│       │       ├── swarm.rs           # libp2p swarm management
│       │       ├── protocols.rs       # Custom protocol handlers
│       │       └── transport.rs       # Platform-specific transports
│       │
│       └── bindings/                  # Generated bindings
│           ├── swift/
│           ├── kotlin/
│           └── wasm/
│
├── packages/
│   └── umbra-native/                  # React Native native module
│       ├── package.json
│       ├── src/index.ts
│       ├── ios/
│       └── android/
│
├── packages/
│   └── umbra-web/                     # Web WASM wrapper
│       ├── package.json
│       ├── src/
│       │   ├── index.ts
│       │   └── worker.ts
│       └── pkg/                       # wasm-pack output
│
└── services/
    └── UmbraService.ts                # Frontend service layer
```

---

## Implementation Phases

### Phase 1: Identity & Crypto Foundation
- [ ] Set up Rust workspace with uniffi
- [ ] Implement key generation (Ed25519 + X25519)
- [ ] Implement BIP39 recovery phrase
- [ ] Implement DID derivation
- [ ] Platform secure storage integration
- [ ] Basic React Native bindings (iOS first)

### Phase 2: Networking & Discovery
- [ ] libp2p swarm setup
- [ ] Bootstrap node connection
- [ ] DHT announce/lookup
- [ ] Connection info sharing (QR/link)
- [ ] Direct peer connection
- [ ] Presence events

### Phase 3: Friends System
- [ ] Friend request creation/signing
- [ ] Request transmission over libp2p
- [ ] Accept/reject flow
- [ ] Friends list persistence
- [ ] Block list
- [ ] Online status tracking

### Phase 4: Basic Messaging
- [ ] X25519 key exchange per friend
- [ ] Message encryption (AES-256-GCM)
- [ ] Message sending/receiving
- [ ] Conversation management
- [ ] Message persistence
- [ ] Typing indicators
- [ ] Read receipts

### Phase 5: Web Support
- [ ] WASM compilation
- [ ] Web Worker bridge
- [ ] WebSocket/WebRTC transports
- [ ] Browser testing

### Phase 6: Polish & Umbra Integration
- [ ] Replace mock data in Umbra
- [ ] Error handling refinement
- [ ] Performance optimization
- [ ] Cross-platform testing

### Future Phases (Not in Initial Scope)
- [ ] Mesh relay for offline messages
- [ ] Group chats
- [ ] File sharing
- [ ] Voice/video calls

---

## Dependencies

### Rust (Cargo.toml)

```toml
[package]
name = "umbra-core"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib", "staticlib"]

[dependencies]
# Crypto
ed25519-dalek = { version = "2.1", features = ["rand_core"] }
x25519-dalek = { version = "2.0", features = ["static_secrets"] }
aes-gcm = "0.10"
sha2 = "0.10"
hkdf = "0.12"
rand = "0.8"

# Identity
bip39 = "2.0"

# Networking
libp2p = { version = "0.54", features = [
    "tokio",
    "noise",
    "yamux",
    "kad",
    "identify",
    "ping",
    "request-response",
    "macros",
] }

# Async
tokio = { version = "1", features = ["rt-multi-thread", "sync", "macros"] }
futures = "0.3"
async-trait = "0.1"

# Storage
rusqlite = { version = "0.31", features = ["bundled"] }

# Serialization
serde = { version = "1", features = ["derive"] }
serde_json = "1"
bincode = "1.3"

# FFI
uniffi = "0.29"

# Error handling
thiserror = "1.0"

# Utilities
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
tracing = "0.1"

# WASM (conditional)
[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "0.2"
wasm-bindgen-futures = "0.4"
js-sys = "0.3"
web-sys = { version = "0.3", features = ["console"] }
getrandom = { version = "0.2", features = ["js"] }
libp2p = { version = "0.54", features = [
    "wasm-bindgen",
    "noise",
    "yamux",
    "kad",
    "identify",
    "ping",
    "request-response",
] }
```

---

## Open Questions

1. **Bootstrap Nodes**: Who runs them? Self-hosted? Community?
   - Start with a few Satellite-operated nodes
   - Design for community-run nodes later

2. **NAT Traversal**: How do we handle peers behind NAT?
   - Phase 1: Rely on one peer having open ports
   - Phase 2: Circuit Relay v2 for universal connectivity

3. **Key Backup UX**: How do users backup their recovery phrase?
   - Show phrase once on creation
   - Allow re-export (with password)
   - Future: encrypted cloud backup?

4. **Rate Limiting**: How to prevent spam friend requests?
   - Local rate limiting
   - Future: proof-of-work for requests from unknowns?

---

## References

- [libp2p](https://libp2p.io/) - Networking stack
- [UniFFI](https://mozilla.github.io/uniffi-rs/) - Rust FFI bindings
- [uniffi-bindgen-react-native](https://jhugman.github.io/uniffi-bindgen-react-native/)
- [Double Ratchet Algorithm](https://signal.org/docs/specifications/doubleratchet/)
- [DID Key Method](https://w3c-ccg.github.io/did-method-key/)
