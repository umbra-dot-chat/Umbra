# Umbra Communities — Comprehensive Feature Plan

## Table of Contents

1. [Overview](#overview)
2. [Architecture & Data Storage](#architecture--data-storage)
3. [Community Structure](#community-structure)
4. [Roles & Permissions](#roles--permissions)
5. [Channel Types](#channel-types)
6. [Messaging Features](#messaging-features)
7. [Voice & Video](#voice--video)
8. [Moderation System](#moderation-system)
9. [Member Management](#member-management)
10. [File Management](#file-management)
11. [Search](#search)
12. [Notifications](#notifications)
13. [Customization & Branding](#customization--branding)
14. [Integrations](#integrations)
15. [Privacy & Safety](#privacy--safety)
16. [Data Model (Schema)](#data-model-schema)
17. [Implementation Phases](#implementation-phases)

---

## Overview

Umbra Communities extends Umbra's existing P2P encrypted messaging platform to support large-scale community spaces. Communities are organized collections of channels within spaces, supporting text, voice, file sharing, announcements, and bulletin boards. The system preserves Umbra's privacy-first ethos while enabling communities of unlimited size through federated storage with user-contributed "boost nodes."

**All core logic MUST be written in Rust** for performance, safety, and cross-platform consistency. TypeScript/React is used only for UI rendering and thin service wrappers that call into the Rust layer via WASM (web) or FFI (native). The boost node is its own standalone Rust package (`umbra-boost-node`) that can run embedded in the app or as an independent binary.

### Key Design Decisions

| Decision | Choice |
|----------|--------|
| Naming | **Communities** |
| Max size | **Unlimited** (federated storage scales horizontally) |
| Structure | **Spaces** (one level deep) containing channels |
| Encryption | **E2EE optional per channel** (admin toggle) |
| Discovery | **Invite links only** (no public directory) |
| Events | **Not at launch** |
| Analytics | **None** (privacy-first, no member tracking) |
| Templates | **Not at launch** — new communities start with one of each channel type |
| Polls | **Not at launch** |
| Scheduling | **No message scheduling** |
| Boost system | **No boost mechanic** — all features available equally |
| **Core language** | **Rust** — all business logic, crypto, storage, networking, moderation in Rust |
| **UI language** | **TypeScript/React** — thin presentation layer only |
| **Boost node** | **Standalone Rust package** (`umbra-boost-node`) — embeddable or independent binary |

---

## Architecture & Data Storage

### Rust-First Implementation

All core community logic is implemented in Rust. The TypeScript layer is a thin UI shell.

#### What goes in Rust (`umbra-core`)

- Community CRUD (create, update, delete, settings)
- Space and channel management
- Role and permission system (bitfield computation, hierarchy checks, overrides)
- Message handling (encrypt, decrypt, store, retrieve, edit, delete)
- Thread management
- Member management (join, leave, kick, ban, timeout, warn)
- Search indexing and query execution
- Invite link generation, validation, and tracking
- AutoMod engine (keyword matching, spam detection, ML inference)
- Audit log recording and querying
- File chunking, hashing, and reassembly
- P2P seeding protocol (chunk distribution, peer coordination)
- E2EE key management (channel keys, rotation, ECDH distribution)
- Notification computation (permission checks, mention parsing)
- Read receipt tracking
- Typing indicator state
- Presence system state machine
- Webhook payload validation and routing
- All SQLite schema and queries

#### What goes in TypeScript (UI only)

- React components for rendering community UI
- Thin service wrapper (`umbra-service`) that calls WASM/FFI functions
- React hooks (`useCommunity`, `useCommunityChannels`, etc.) that wrap service calls
- Event dispatch/subscription for UI reactivity
- Voice/video WebRTC UI controls (actual media handling in Rust where possible)

#### What goes in the Boost Node package

- Everything needed to run a standalone storage node
- Can also be embedded as a library within `umbra-core` for in-app mode

### Package Structure

```
packages/
├── umbra-core/                    # Existing — extended with community module
│   ├── src/
│   │   ├── community/             # Community service (Rust) — IMPLEMENTED
│   │   │   ├── mod.rs             # Module root, public API re-exports
│   │   │   ├── service.rs         # Community CRUD, ownership transfer, audit log
│   │   │   ├── spaces.rs          # Space CRUD and reordering
│   │   │   ├── channels.rs        # Channel CRUD, type enforcement, reordering
│   │   │   ├── permissions.rs     # Permission bitfield engine (64-bit, BigInt)
│   │   │   ├── roles.rs           # Preset + custom roles, hierarchy
│   │   │   ├── members.rs         # Join/leave, kick/ban, profile, ban list
│   │   │   ├── invites.rs         # Invite links, vanity URLs, expiry, usage tracking
│   │   │   ├── messaging.rs       # Messages, reactions, read receipts, pins, E2EE keys, mentions
│   │   │   ├── threads.rs         # Threads, thread messages, search (channel + community)
│   │   │   ├── moderation.rs      # Warnings, escalation, keyword filters, ban evasion
│   │   │   ├── files.rs           # File upload/list/get/delete, folders
│   │   │   ├── customization.rs   # Branding, vanity URL, emoji, stickers
│   │   │   ├── integrations.rs    # Webhooks CRUD, channel overrides, custom roles
│   │   │   ├── boost_nodes.rs     # Boost node register/list/get/update/heartbeat/delete
│   │   │   └── member_experience.rs # Timeouts, thread follow, member status, notifications, advanced search, system messages
│   │   ├── storage/
│   │   │   └── schema.rs          # Schema v7 — 30+ community tables with migrations
│   │   ├── network/
│   │   │   └── protocols.rs       # P2P protocols
│   │   └── ffi/
│   │       └── wasm.rs            # 122 WASM bindings for all community functions
│   └── Cargo.toml
│
├── umbra-boost-node/              # PLANNED: Standalone Rust package (not yet built)
│   ├── Cargo.toml
│   └── src/                       # See Phase 11 for planned structure
│
├── umbra-wasm/                    # Existing — extended with community WASM bindings
│   ├── loader.ts                  # Community function type defs
│   └── tauri-backend.ts           # Tauri invoke stubs
│
└── umbra-service/                 # Existing — thin TS wrapper
    └── src/
        └── index.ts               # Community service methods (calls into WASM)
```

### Boost Node Package (`umbra-boost-node`)

The boost node is a **standalone Rust crate** that can operate in two modes:

```
┌─────────────────────────────────────────────────────────────────┐
│  umbra-boost-node                                                │
│                                                                  │
│  Mode 1: Embedded (library)                                      │
│  ─────────────────────────                                       │
│  • Imported as a dependency by umbra-core                       │
│  • Runs as a background task within the Umbra app               │
│  • Shares the app's tokio runtime                               │
│  • Controlled via umbra-core's service layer                    │
│  • use umbra_boost_node::EmbeddedNode;                          │
│                                                                  │
│  Mode 2: Standalone (binary)                                     │
│  ──────────────────────────                                      │
│  • Compiled as its own binary: `umbra-boost-node`               │
│  • Runs independently on a VPS, home server, Raspberry Pi       │
│  • Managed remotely from the Umbra app via Noise protocol       │
│  • Config via CLI args, env vars, or config file                │
│  • `cargo install umbra-boost-node` or download binary          │
│                                                                  │
│  Shared Core:                                                    │
│  • Encrypted chunk storage engine                               │
│  • P2P seeding protocol (libp2p)                                │
│  • Replication & redundancy management                          │
│  • Authentication (Ed25519 attestation)                         │
│  • Health monitoring & metrics                                  │
│  • Storage pruning (oldest-first when full)                     │
└─────────────────────────────────────────────────────────────────┘
```

**Cargo.toml structure:**
```toml
[package]
name = "umbra-boost-node"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "umbra-boost-node"
path = "src/main.rs"

[lib]
name = "umbra_boost_node"
path = "src/lib.rs"

[dependencies]
# Shared types from umbra-core (no circular dependency — use shared types crate or feature flags)
libp2p = { version = "0.54", features = ["tcp", "quic", "noise", "yamux", "kad", "identify", "request-response"] }
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.31", features = ["bundled"] }
ed25519-dalek = "2"
aes-gcm = "0.10"
blake3 = "1"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
clap = { version = "4", features = ["derive"] }  # CLI args for standalone mode
tracing = "0.1"
tracing-subscriber = "0.3"
```

### Design Principles

- **Relays are lightweight**: Relay nodes store small amounts of data (messages, metadata). They are NOT bulk storage for large files.
- **Members seed data**: Large files are chunked and seeded P2P across community members (like BitTorrent), with relay nodes caching hot/popular files temporarily.
- **Boost nodes extend capacity**: Members can run boost nodes from within the app to donate storage and bandwidth to the network.
- **All data on boost nodes is encrypted**: Boost node operators see only opaque encrypted blobs — zero visibility into content.
- **E2EE is optional per channel**: Admins choose per-channel. When E2EE is off, boost nodes CAN index content to support server-side search. When E2EE is on, only client-side search is possible.

### Storage Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMMUNITY STORAGE LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Layer 1: Federated Relay Nodes (Infrastructure)              │  │
│  │  ─────────────────────────────────────────────                  │  │
│  │  • Lightweight message queue and metadata storage             │  │
│  │  • 500MB storage cap per community (default)                  │  │
│  │  • Size-based rolling retention (oldest pruned when full)     │  │
│  │  • Cache hot/popular file chunks temporarily                  │  │
│  │  • Small files (<5MB) stored directly on relay                │  │
│  │  • Serve as message delivery queue for offline members        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Layer 2: P2P File Seeding (Member-contributed)               │  │
│  │  ──────────────────────────────────────────────                 │  │
│  │  • Large files chunked and distributed across members         │  │
│  │  • Members who download a file automatically seed it          │  │
│  │  • More seeders = faster downloads (BitTorrent-like)          │  │
│  │  • Chunks identified by content hash (deduplication)          │  │
│  │  • Relay nodes cache hot chunks for popular files             │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Layer 3: Boost Nodes (Dedicated member-contributed storage)  │  │
│  │  ────────────────────────────────────────────────               │  │
│  │  • Run from within the Umbra app                              │  │
│  │  • User selects specific communities to support               │  │
│  │  • Configurable storage limit (1GB, 5GB, 10GB, 50GB+)        │  │
│  │  • Configurable bandwidth allocation                          │  │
│  │  • Stores ONLY encrypted blobs (fully opaque to operator)     │  │
│  │  • Provides always-on availability for stored data            │  │
│  │  • Configurable replication factor (2-5 copies across nodes)  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Layer 4: Local Cache (Per-device)                            │  │
│  │  ──────────────────────────────                                │  │
│  │  • SQLite database with community data cache                  │  │
│  │  • Encrypted with user's storage key (AES-256-GCM)            │  │
│  │  • Progressive sync: relay window immediately, then backfill  │  │
│  │  • IndexedDB persistence on web (existing system)             │  │
│  │  • Acts as a seeder for files the user has downloaded         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Tiered File Availability

Different file sizes have different storage strategies:

| File Size | Storage Strategy | Availability |
|-----------|-----------------|-------------|
| **Small (<5MB)** | Stored directly on relay nodes | Always available (within relay cap) |
| **Medium (5MB-100MB)** | Chunked, relay-cached + P2P seeded | Available if relay has cache or seeders are online |
| **Large (>100MB)** | Chunked, P2P seeded only | Requires seeders or boost nodes to be online |

When **no seeders are online** for a file:
- **Small files**: Available from relay cache
- **Medium files**: May be in relay cache; if not, show "unavailable" with seeder count
- **Large files**: Show "unavailable — 0 seeders online" with estimated availability
- **Metadata + thumbnails**: Always available from relay (stored separately, small footprint)

### Message History Storage

**Size-based rolling window on relays**

- **Default relay cap**: 500MB per community
- Relay stores messages in FIFO order; when cap is reached, oldest messages are pruned
- Text messages are small (~1KB each), so 500MB holds ~500,000 messages
- File attachments stored separately (see tiered file availability above)
- **Channel metadata** (names, topics, settings) always retained regardless of cap

**Progressive sync for new members:**
1. **Immediately**: Get all messages within the relay's current rolling window
2. **Background sync**: Pull older message history from online peers and boost nodes
3. **On-demand**: Load older history as user scrolls up, fetching from available peers
4. **Boost node backfill**: If boost nodes are available, they serve as authoritative history source

### Data Redundancy

**Configurable replication factor (2-5 copies)**

- Community admin sets the desired replication factor
- Default: 3 copies across the network
- System distributes chunks to maintain the target replica count
- If a boost node goes offline, system re-replicates to maintain target count
- Relay nodes count as one replica for cached data
- Health monitoring alerts admin when redundancy falls below target

### Storage Overflow Handling

When a community's total storage exceeds what boost nodes and relays can hold:

1. **Warning**: Admin notified when approaching 80% capacity
2. **Oldest data pruned first**: When full, oldest messages and file chunks are pruned automatically
3. **Admin notification**: Clear notification showing what was pruned and current capacity
4. **Solution**: Community needs more boost node operators or the admin prunes old data manually

### Deletion Propagation

When a member deletes a message:

- **Best-effort deletion**: Delete request sent to all known nodes (relay + boost nodes)
- Cannot guarantee removal from every copy (P2P nature means some copies may persist)
- Relay nodes delete immediately upon receiving the request
- Boost nodes process deletion on next sync cycle
- Local caches on member devices respect deletion on next sync
- **"Delete for me"**: Only removes from the local device, no network propagation
- **"Delete for everyone"**: Propagates best-effort across the network

### E2EE vs Non-E2EE Channel Storage

| Aspect | E2EE Channel | Non-E2EE Channel |
|--------|-------------|------------------|
| **Content on relay** | Encrypted ciphertext only | Encrypted in transit, plaintext at rest on relay |
| **Content on boost nodes** | Encrypted blobs (opaque) | Optionally decryptable for indexing |
| **Server-side search** | Not possible | Supported (boost nodes can index content) |
| **Client-side search** | Supported (decrypt + search locally) | Supported |
| **Key management** | Channel key distributed via ECDH | No per-channel encryption key |
| **Key rotation** | On member removal | N/A |
| **Boost node visibility** | Zero (fully opaque) | Optional: can index for search |

### Boost Nodes — In-App Operation & Remote Management

Boost nodes run **inside the Umbra app itself** — no separate server software or terminal required. Users can also deploy standalone boost nodes on dedicated hardware (VPS, home server, Raspberry Pi) and manage them remotely from the app.

#### Running a Boost Node In-App

The Umbra app includes a built-in boost node that runs alongside normal app usage:

```
┌─────────────────────────────────────────────────────────────┐
│  Umbra App                                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Normal App (Chat, Communities, DMs)                 │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Boost Node (Background Service)                    │    │
│  │  • Stores encrypted chunks for selected communities │    │
│  │  • Serves data to requesting peers                  │    │
│  │  • Runs within configured resource limits           │    │
│  │  • Can be toggled on/off from Settings              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### Boost Node Authentication

Each boost node is **authenticated to the user's identity** via their existing Ed25519 keypair:

1. **Node registration**: When a user enables their boost node, it registers with the network using a signed attestation from the user's identity
2. **Node identity**: Each boost node gets a derived keypair (HKDF from master seed with context `"umbra-boost-node-v1"`)
3. **Remote authentication**: For standalone nodes, the user authenticates by signing a challenge from the app using their identity keypair
4. **Session tokens**: After authentication, the app receives a session token for ongoing remote management
5. **Multi-node support**: A user can run multiple boost nodes (in-app + standalone) all linked to the same identity

#### Configuration Options (Managed from App)

Whether the boost node runs in-app or on a remote server, all configuration is managed from the Umbra app UI:

- **Storage limit**: Maximum GB to donate (1GB, 5GB, 10GB, 50GB, custom)
- **Bandwidth limit**: Maximum upload bandwidth allocation (Mbps)
- **Community selection**: User picks specific communities to support from their community list
- **Auto-start**: Option to start boost node on app launch (in-app nodes)
- **Data visibility**: Fully opaque — operator sees ONLY encrypted blobs, never content
- **Resource scheduling**: Optional schedule for when the node is active (e.g., only overnight)

#### Remote Node Management

For standalone boost nodes deployed on dedicated hardware:

- **Pairing**: Scan QR code or enter pairing token to link a remote node to your app
- **Remote config**: Change storage limits, bandwidth, community selection from the app
- **Remote monitoring**: View node health, storage usage, uptime from the app
- **Remote restart**: Restart the node process from the app
- **Secure channel**: All management commands sent over authenticated encrypted channel (existing Noise protocol)

#### Boost Node Dashboard (In-App)

- Storage used / storage allocated (with visual bar)
- Bandwidth used (current + historical graph)
- Communities served (names only, not content)
- Chunks stored count
- Uptime statistics
- Network health contribution indicator
- Active peer connections
- For remote nodes: connection status, latency, last seen

### Admin Storage Dashboard

Community admins see a storage overview:

- **Total storage used** (messages + files + metadata)
- **Storage breakdown**: By channel, by file type, by time period
- **Active seeder count**: How many members are currently seeding files
- **Boost node count**: How many boost nodes serve this community
- **Redundancy health**: Whether replication targets are being met (green/yellow/red)
- **Relay usage**: How much of the 500MB relay cap is used
- **File availability**: Percentage of files available right now vs total

### Data Locality

**Not at launch** — data distributed globally across all available nodes. Data locality preferences (EU-only storage, etc.) deferred to a future compliance-focused update.

---

## Community Structure

### Hierarchy

```
Community
├── Settings & Branding
├── Roles & Permissions
├── Member Directory
├── Spaces (one level deep)
│   ├── Space A (e.g., "General")
│   │   ├── Text Channel
│   │   ├── Voice Channel
│   │   ├── File Sharing Channel
│   │   ├── Announcement Channel
│   │   └── Bulletin Board Channel
│   ├── Space B (e.g., "Development")
│   │   ├── Text Channel
│   │   └── Voice Channel
│   └── Space C (e.g., "Off-Topic")
│       └── Text Channel
└── Audit Log
```

### Spaces

- **One level of nesting**: Community → Spaces → Channels (no deeper)
- **UI**: Spaces displayed as **tabs** in the sidebar, channels listed under each space
- **Permissions**: Can be set at the space level, channels inherit with optional overrides
- **Default space**: Every community has at least one space (cannot be deleted)
- **Reordering**: Admins can reorder spaces and channels within spaces via drag-and-drop

### Default Community Setup

When a new community is created, it starts with:
- One default space ("General")
- One text channel (#general)
- One voice channel (General Voice)
- One file sharing channel (Files)
- One announcement channel (#announcements)
- One bulletin board channel (#rules)
- One welcome channel (#welcome) — auto-directed for new members

---

## Roles & Permissions

### Role System

**Custom roles with permission templates** — preset roles (Owner, Admin, Moderator, Member) plus unlimited custom roles created from scratch.

#### Preset Roles

| Role | Description | Deletable |
|------|-------------|-----------|
| **Owner** | Full control, can transfer ownership | No |
| **Admin** | Near-full control, cannot delete community or transfer ownership | No |
| **Moderator** | Moderation tools: kick, ban, mute, timeout, manage messages | No |
| **Member** | Default role for all members (@everyone equivalent) | No |

- Preset roles can be **renamed** and have their **permissions modified** but cannot be deleted
- The **Member** role acts as `@everyone` — all members have it automatically
- Admins can create **unlimited custom roles** from scratch

#### Role Properties

| Property | Description |
|----------|-------------|
| **Name** | Display name of the role |
| **Color** | Hex color for name display in chat and member list |
| **Icon** | Optional emoji or uploaded icon displayed next to the role |
| **Badge** | Small badge shown on member profiles |
| **Hoisted** | Whether the role is displayed as a separate group in the member list (optional per role) |
| **Mentionable** | Whether members can @mention this role |
| **Position** | Hierarchy position (higher = more authority) |

#### Role Hierarchy

- Roles are ordered by position; higher-positioned roles can manage lower ones
- Members can only assign/remove roles below their highest role
- Permission conflicts resolved by highest role's setting
- Owner role is always at the top and cannot be moved

#### Permission Categories

**General Permissions**
- View Channels
- Manage Channels
- Manage Spaces
- Manage Community
- Manage Roles
- Manage Custom Emoji & Stickers
- View Audit Log
- Manage Webhooks

**Membership Permissions**
- Create Invite Links
- Kick Members
- Ban Members
- Timeout Members
- Manage Nicknames (change other members' nicknames)

**Text Channel Permissions**
- Send Messages
- Send Messages in Threads
- Create Threads
- Embed Links
- Attach Files
- Add Reactions
- Use Custom Emoji
- Mention @everyone and @here
- Mention Roles
- Manage Messages (delete/pin others' messages)
- Manage Threads
- Use Slow Mode Bypass

**Voice Channel Permissions**
- Connect
- Speak
- Video
- Screen Share
- Mute Members
- Deafen Members
- Move Members
- Priority Speaker

**Announcement Channel Permissions**
- Post Announcements
- Manage Announcements

**Bulletin Board Permissions**
- Post to Bulletin Board
- Manage Bulletin Board

**File Channel Permissions**
- Upload Files
- Create Folders
- Manage Files (delete/move others' files)
- Download Files

#### Channel-Level Permission Overrides

Each channel can override role permissions:
- **Allow**: Explicitly grant a permission for a role in this channel
- **Deny**: Explicitly deny a permission for a role in this channel
- **Inherit**: Use the role's default permission (default)
- Per-member overrides also supported for individual users

---

## Channel Types

### 1. Text Channels

Standard chat channels for real-time messaging.

**Features:**
- Full markdown formatting
- Threads (any message can spawn a thread)
- Reactions (Unicode + custom emoji)
- Replies (quote-reply to specific messages)
- Pins (up to 50 pinned messages per channel)
- @mentions (@user, @role, @everyone, @here)
- Message editing and deletion (delete for self or delete for everyone)
- Read receipts (show up to 5 avatars, then show count)
- Typing indicators (show who's typing by name)
- Slow mode (configurable cooldown: 30s, 1m, 5m, 15m, 1h)
- Link previews + custom embeds
- Content warnings (spoiler tags per message)
- Channel topic with rich markdown formatting displayed in header
- E2EE toggle (optional per channel)

### 2. Voice Channels

Persistent, always-open voice rooms for audio/video communication.

**Features:**
- Persistent rooms — members join/leave freely
- Unlimited participants with adaptive quality
- Video support (webcam)
- Screen sharing with audio
- Session recording (with permission)
- Mute/deafen controls
- Priority speaker role
- Move members between voice channels
- Voice activity detection
- Push-to-talk support
- Channel topic displayed in header

### 3. File Sharing Channels

Dedicated channels for organized file management.

**Features:**
- Hierarchical folder structure (folders + subfolders)
- **Unlimited file sizes** (stored across federated nodes)
- Version history per file
- File search by name across the channel
- Folder-level permissions (inherit from channel)
- Upload with description/comment
- File preview (images, documents, code)
- Download tracking
- Drag-and-drop upload

### 4. Announcement Channels

Read-only channels for admin/mod broadcasts.

**Features:**
- Only members with "Post Announcements" permission can post
- All members can read
- Members can react to announcements
- Rich formatting support
- No cross-community following (not at launch)
- Announcement pinning

### 5. Bulletin Board Channels

Read-only channels for persistent reference information (rules, guidelines, resources).

**Features:**
- Only admins can post/edit content
- Content is persistent and organized (not a chat feed)
- Posts can be reordered by admins
- Rich markdown formatting for structured content
- Ideal for: community rules, FAQ, getting started guides, resource links

### 6. Welcome Channel

Special channel that new members are auto-directed to upon joining.

**Features:**
- First channel new members see
- Can contain welcome message, rules summary, role info
- Regular text channel functionality
- Auto-generated system message when new member joins

---

## Messaging Features

### Core Message Features

| Feature | Details |
|---------|---------|
| **Text** | Full markdown: bold, italic, strikethrough, code blocks, headers, lists, links, blockquotes |
| **Reactions** | Unicode emoji + community custom emoji reactions |
| **Replies** | Quote-reply to any message with context preview |
| **Threads** | Any message can spawn a full thread with own notification settings |
| **Pins** | Up to 50 pinned messages per channel, accessible via pinned messages panel |
| **Mentions** | @user, @role, @everyone (all members), @here (online members) — permission-controlled |
| **Editing** | Edit own messages, shows "(edited)" indicator |
| **Deletion** | "Delete for me" or "Delete for everyone" (if permitted by role) |
| **Embeds** | Auto link previews + custom rich embed cards |
| **Content Warnings** | Per-message spoiler/CW tags to hide sensitive content |
| **Custom Emoji** | Community-uploaded custom emoji usable in messages and reactions |
| **Stickers** | Community sticker packs |

### Read Receipts

- Show up to **5 member avatars** who have read the message
- If more than 5 have read, show avatars + **count** (e.g., "and 12 others")
- Per-channel read tracking
- Efficient: batch receipt updates, not per-message

### Typing Indicators

- Show **who is typing** by name in the channel
- Format: "Alice is typing..." / "Alice and Bob are typing..." / "3 people are typing..."
- Sent to all channel members regardless of focus state

### Message Formatting

Full markdown support:
- `**bold**` / `*italic*` / `~~strikethrough~~`
- `` `inline code` `` / ` ```code blocks``` ` with syntax highlighting
- `# Headers` (h1-h3)
- `- Bullet lists` / `1. Numbered lists`
- `> Blockquotes`
- `[links](url)`
- `||spoiler text||` (content warning)

---

## Voice & Video

### Voice Channels

- **Persistent rooms**: Always open, members join/leave freely
- **Unlimited participants**: Quality adapts based on participant count
- **Adaptive quality**: Bitrate adjusts dynamically
- **Push-to-talk**: Configurable hotkey
- **Voice activity detection**: Auto-detect when speaking

### Video

- **Webcam video**: Toggle camera on/off in voice channels
- **Multiple simultaneous video streams**: Grid/gallery view
- **Quality**: Adaptive based on bandwidth and participant count

### Screen Sharing

- **Full screen or window sharing**: Choose what to share
- **Audio sharing**: Include system audio with screen share
- **Multiple concurrent shares**: More than one person can share simultaneously

### Recording

- **Session recording**: Members with permission can record voice/video sessions
- **Recording indicator**: All participants see when recording is active
- **Recording consent**: Notification to all participants when recording starts
- **Storage**: Recordings stored in file sharing channels or locally

---

## Moderation System

### AutoMod (ML-Powered)

Full machine-learning-powered automatic moderation:

**Detection Capabilities:**
- **Toxicity detection**: ML model identifies toxic, hateful, or harassing content
- **Spam detection**: Pattern recognition for spam messages (repeated content, flooding)
- **Phishing/link detection**: Scan URLs against known malicious link databases
- **Keyword filters**: Custom keyword blocklists defined by admins

**Automatic Actions:**
- **Delete** the offending message
- **Timeout** the offending member (configurable duration)
- **Alert moderators** in a dedicated mod-alert channel

**Configuration:**
- Sensitivity levels (low/medium/high) for ML detection
- Custom keyword lists (exact match, wildcard, regex)
- Exempt roles (e.g., admins/mods bypass AutoMod)
- Per-channel AutoMod overrides
- Dedicated alert channel for mod review

### Manual Moderation Tools

| Tool | Description |
|------|-------------|
| **Kick** | Remove member from community (can rejoin via invite) |
| **Ban** | Permanent removal + device fingerprint tracking to prevent evasion |
| **Timeout** | Temporary restriction from posting (preset durations: 60s, 5min, 10min, 1hr, 1day, 1week) |
| **Mute** | Prevent member from sending messages in specific channels |
| **Warn** | Issue formal warning that accumulates on member's record |
| **Slow Mode** | Per-channel cooldown between messages (30s, 1m, 5m, 15m, 1h) |
| **Message Delete** | Delete individual messages or bulk delete |
| **Message Pin/Unpin** | Pin or unpin messages in channels |

### Warning/Strike System

Formal warning system with automatic escalation:

- Mods issue warnings with reason text
- Warnings accumulate on the member's record
- **Configurable auto-escalation thresholds:**
  - 3 warnings → automatic timeout (configurable duration)
  - 5 warnings → automatic ban (configurable)
  - Thresholds customizable by community admins
- Warning history viewable by mods
- Warnings can be cleared/removed by admins
- Warning expiry: configurable (e.g., warnings expire after 30 days)

### Ban System

- **Ban by DID**: Primary ban identifier
- **Device fingerprint tracking**: Prevent ban evasion via alt accounts
  - Tracks device characteristics to identify returning banned users
  - Alerts mods when a suspected ban evader joins
- **Ban reasons**: Required reason text for all bans
- **Ban duration**: Permanent or temporary (with expiry date)
- **Ban list management**: View, search, and manage all bans
- **Unban**: Admins can lift bans

### Audit Log

Comprehensive log of all administrative actions:

**Logged Actions:**
- Role changes (create, edit, delete, assign, remove)
- Channel changes (create, edit, delete, permission overrides)
- Member actions (kick, ban, unban, timeout, warn, mute)
- Message moderation (delete, pin, unpin)
- Community settings changes
- Space changes (create, edit, delete, reorder)
- AutoMod actions (with trigger details)
- Invite link creation/deletion
- Ownership transfers

**Detail Level: Configurable by admin**
- **Metadata only**: Who did what and when
- **Metadata + content**: Include deleted/edited message content
- **Metadata + content hash**: Include hash for verification without plaintext

**Retention: Configurable by admin**
- Options: 7 days, 30 days, 90 days, 1 year, forever
- Auto-purge old entries based on retention setting

---

## Member Management

### Joining

- **Invite links only**: No public discovery
- **Vanity URLs**: Custom short invite URLs (e.g., `umbra.app/join/mycommunity`)
- **Invite controls**: Expiration time, max uses, usage tracking
- **Invite tracking**: See which invite link brought which member
- **Welcome channel**: New members auto-directed to welcome channel
- **System join message**: Automated "X has joined the community" in welcome channel

### Member Directory

Full searchable member directory:
- **Search**: Search members by name, role, or DID
- **Sorting**: By role hierarchy, join date, or alphabetical
- **Role grouping**: Members grouped by hoisted roles
- **Status indicators**: Online, Idle, DND, Invisible, Offline
- **Custom status messages**: Members can set status text with emoji
- **Join date**: When the member joined the community
- **Role badges**: Visual badges for role indicators

### Community Profiles

Members have **community-specific profiles** separate from their global Umbra profile:

| Field | Scope |
|-------|-------|
| **Nickname** | Per-community (self-set, admin can override) |
| **Avatar** | Per-community (custom avatar override) |
| **Bio** | Per-community (custom bio text) |
| **Role display** | Shows roles held in this community |
| **Join date** | When they joined this community |
| **Status** | Global (shared across all communities) |

### Nickname System

- **Self-set**: Members can set their own community nickname
- **Admin override**: Admins/mods can change any member's nickname
- **Nickname change permission**: Configurable per role
- **Nickname displays**: Community nickname shown in chat, member list, and profiles

### Presence System

Full presence with status messages:

| Status | Icon | Description |
|--------|------|-------------|
| **Online** | Green circle | Actively using Umbra |
| **Idle** | Yellow crescent | No activity for 5+ minutes |
| **Do Not Disturb** | Red circle | Suppress all notifications |
| **Invisible** | Grey circle | Appear offline but can still use the app |
| **Offline** | Grey circle | Not connected |

- **Custom status**: Text + emoji status message (e.g., "Playing a game")
- **Status visible**: In member list, user profiles, and DM list

### Community DMs

- **DM with consent**: Members can send a DM request to anyone in a shared community
- **Recipient choice**: Accept or decline the DM request
- **No friend requirement**: Don't need to be friends to initiate a DM request
- **Block option**: Can block DM requests from specific members

### Leaving a Community

- **Confirmation dialog**: Warning about losing access
- **Data export option**: Export your messages before leaving
- **Immediate effect**: Once confirmed, access is revoked immediately
- **Rejoin**: Can rejoin via new invite link (unless banned)

### Ownership Transfer

- **Full transfer**: Owner can transfer ownership to any admin
- **Confirmation**: Double confirmation required (transfer is irreversible)
- **Previous owner**: Becomes an admin after transfer
- **Community-wide notification**: Optional notification to all members about ownership change

---

## File Management

### File Sharing Channels

Dedicated channel type for organized file storage:

**Structure:**
- Hierarchical folders and subfolders
- Drag-and-drop file upload
- Bulk upload support

**Features:**
- **Unlimited file sizes** (distributed across federated storage nodes)
- **Version history**: Track file changes over time
- **File search**: Search by filename across the channel
- **File preview**: Inline preview for images, documents, code files
- **Upload comments**: Add description/context when uploading
- **Download tracking**: See download count
- **Folder permissions**: Inherit from channel role permissions
- **Supported previews**: Images (PNG, JPG, GIF, WebP), Documents (PDF), Code (syntax highlighted), Video (playback), Audio (playback)

### File Storage Architecture

Files stored across federated nodes:
- **Chunked storage**: Large files split into encrypted chunks
- **Redundancy**: Chunks replicated across multiple nodes
- **Encryption**: Files encrypted at rest (E2EE if channel has E2EE enabled)
- **Deduplication**: Content-addressed storage to avoid duplicate data
- **Boost node contribution**: User-contributed storage nodes expand capacity

---

## Search

### Full-Text Search with Filters

Search across all accessible channels in a community:

**Search Filters:**
- `from:@username` — Messages from a specific member
- `in:#channel` — Messages in a specific channel
- `before:date` / `after:date` — Date range filtering
- `has:file` — Messages with file attachments
- `has:image` — Messages with images
- `has:link` — Messages with URLs
- `has:reaction` — Messages with reactions
- `has:embed` — Messages with embeds
- `is:pinned` — Pinned messages only

**Search Scope:**
- Search respects channel permissions (only searches channels the user can view)
- Results ranked by relevance
- Highlighted matching text in results
- Jump to message in context from search result

---

## Notifications

### Granular Notification Control

**Per-Community Settings:**
- All messages
- @mentions only (default)
- Nothing (muted)

**Per-Space Settings:**
- Override community-level setting for specific spaces

**Per-Channel Settings:**
- Override space/community-level setting for specific channels

**Mute Options:**
- Mute entire community
- Mute individual channels
- Duration: 15 minutes, 1 hour, 8 hours, 24 hours, until manually unmuted

**Mention Permissions:**
- @everyone requires permission
- @here requires permission
- @role mentions configurable per role
- @user mentions always allowed

**Notification Types:**
- Desktop push notifications
- Mobile push notifications
- Badge counts (unread indicators)
- Sound notifications (configurable)

---

## Customization & Branding

### Full Branding Suite

| Element | Description |
|---------|-------------|
| **Community Icon** | Square icon (static or animated) displayed in community list |
| **Banner** | Header banner image displayed at the top of the community |
| **Accent Color** | Primary color used for UI elements throughout the community |
| **Description** | Community description text (markdown supported) |
| **Splash Image** | Image shown on the invite page |
| **Custom CSS Themes** | Admin-defined CSS theme overrides for community-wide styling |

### Custom Emoji

- Admins upload custom emoji for the community
- Custom emoji usable in messages and reactions
- Emoji management panel for admins
- Emoji name and aliases

### Custom Stickers

- Sticker packs uploaded by admins
- Sticker picker in message composer
- Animated sticker support

---

## Integrations

### Incoming Webhooks

External services can post messages to community channels:

- **Webhook URL**: Unique URL per channel for posting
- **Webhook identity**: Custom name and avatar for webhook messages
- **Payload format**: JSON with text, embeds, and attachments
- **Webhook management**: Create, edit, delete webhooks (requires permission)
- **Rate limiting**: Prevent webhook abuse

**Designed for future bot platform expansion:**
- Webhook system architecture supports future bot accounts
- Event system internally structured for future event subscriptions
- Message format supports future slash commands
- Permission system includes bot-specific permission flags

---

## Privacy & Safety

### E2EE Per Channel

- **Channel-level toggle**: Admins enable/disable E2EE per channel
- **E2EE channels**: Messages encrypted with shared channel key (AES-256-GCM)
- **Non-E2EE channels**: Messages encrypted in transit (Noise protocol) and at rest on nodes
- **Key rotation**: Channel key rotated when members with access are removed
- **Key distribution**: Via ECDH key exchange through relay network

### Content Warnings

- **Per-message CW/spoiler tags**: Any member can tag their message with a content warning
- **Spoiler syntax**: `||spoiler text||` hides content behind a click-to-reveal
- **CW label**: Optional label describing the content warning
- **Not channel-level**: No NSFW channel marking, handled at message level

### Member Safety

- **Block members**: Block specific members from DMing you
- **DM consent**: DM requests require recipient approval
- **Report system**: Report messages or members to community mods
- **Device fingerprinting**: For ban evasion prevention only

---

## Data Model (Schema)

### New Tables

```sql
-- Core community table
CREATE TABLE communities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    splash_url TEXT,
    accent_color TEXT,
    custom_css TEXT,
    owner_did TEXT NOT NULL,
    vanity_url TEXT UNIQUE,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Spaces (one level of organization)
CREATE TABLE community_spaces (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id),
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Channels within spaces
CREATE TABLE community_channels (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id),
    space_id TEXT NOT NULL REFERENCES community_spaces(id),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('text', 'voice', 'files', 'announcement', 'bulletin', 'welcome')),
    topic TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    slow_mode_seconds INTEGER DEFAULT 0,
    e2ee_enabled INTEGER NOT NULL DEFAULT 0,
    pin_limit INTEGER NOT NULL DEFAULT 50,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Roles
CREATE TABLE community_roles (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id),
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    badge TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    hoisted INTEGER NOT NULL DEFAULT 0,
    mentionable INTEGER NOT NULL DEFAULT 0,
    is_preset INTEGER NOT NULL DEFAULT 0,
    permissions_bitfield TEXT NOT NULL DEFAULT '0',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Role assignments
CREATE TABLE community_member_roles (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    role_id TEXT NOT NULL REFERENCES community_roles(id),
    assigned_at INTEGER NOT NULL,
    assigned_by TEXT,
    PRIMARY KEY (community_id, member_did, role_id)
);

-- Channel permission overrides
CREATE TABLE channel_permission_overrides (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    target_type TEXT NOT NULL CHECK(target_type IN ('role', 'member')),
    target_id TEXT NOT NULL,
    allow_bitfield TEXT NOT NULL DEFAULT '0',
    deny_bitfield TEXT NOT NULL DEFAULT '0'
);

-- Community members
CREATE TABLE community_members (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    bio TEXT,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, member_did)
);

-- Community messages
CREATE TABLE community_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    sender_did TEXT NOT NULL,
    content_encrypted BLOB,
    content_plaintext TEXT,
    nonce TEXT,
    key_version INTEGER,
    is_e2ee INTEGER NOT NULL DEFAULT 0,
    reply_to_id TEXT,
    thread_id TEXT,
    has_embed INTEGER NOT NULL DEFAULT 0,
    has_attachment INTEGER NOT NULL DEFAULT 0,
    content_warning TEXT,
    edited_at INTEGER,
    deleted_for_everyone INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- Message reactions
CREATE TABLE community_reactions (
    message_id TEXT NOT NULL REFERENCES community_messages(id),
    member_did TEXT NOT NULL,
    emoji TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, member_did, emoji)
);

-- Read receipts
CREATE TABLE community_read_receipts (
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    member_did TEXT NOT NULL,
    last_read_message_id TEXT NOT NULL,
    read_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, member_did)
);

-- Message pins
CREATE TABLE community_pins (
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    message_id TEXT NOT NULL REFERENCES community_messages(id),
    pinned_by TEXT NOT NULL,
    pinned_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, message_id)
);

-- Threads
CREATE TABLE community_threads (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    parent_message_id TEXT NOT NULL REFERENCES community_messages(id),
    name TEXT,
    created_by TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    last_message_at INTEGER,
    created_at INTEGER NOT NULL
);

-- Invite links
CREATE TABLE community_invites (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id),
    code TEXT NOT NULL UNIQUE,
    vanity INTEGER NOT NULL DEFAULT 0,
    creator_did TEXT NOT NULL,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER,
    created_at INTEGER NOT NULL
);

-- Bans
CREATE TABLE community_bans (
    community_id TEXT NOT NULL,
    banned_did TEXT NOT NULL,
    reason TEXT,
    banned_by TEXT NOT NULL,
    device_fingerprint TEXT,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, banned_did)
);

-- Warnings
CREATE TABLE community_warnings (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    reason TEXT NOT NULL,
    warned_by TEXT NOT NULL,
    expires_at INTEGER,
    created_at INTEGER NOT NULL
);

-- Audit log
CREATE TABLE community_audit_log (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id),
    actor_did TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata_json TEXT,
    content_detail TEXT,
    created_at INTEGER NOT NULL
);

-- Custom emoji
CREATE TABLE community_emoji (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id),
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animated INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Custom stickers
CREATE TABLE community_stickers (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL REFERENCES communities(id),
    pack_id TEXT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animated INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- File sharing
CREATE TABLE community_files (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    folder_id TEXT,
    filename TEXT NOT NULL,
    description TEXT,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    storage_chunks_json TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    download_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);

-- File folders
CREATE TABLE community_file_folders (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    parent_folder_id TEXT REFERENCES community_file_folders(id),
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Webhooks
CREATE TABLE community_webhooks (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES community_channels(id),
    name TEXT NOT NULL,
    avatar_url TEXT,
    token TEXT NOT NULL UNIQUE,
    creator_did TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- Channel E2EE keys
CREATE TABLE community_channel_keys (
    channel_id TEXT NOT NULL,
    key_version INTEGER NOT NULL,
    encrypted_key BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, key_version)
);

-- Boost node configuration (local and remote nodes)
CREATE TABLE boost_nodes (
    id TEXT PRIMARY KEY,
    owner_did TEXT NOT NULL,
    node_type TEXT NOT NULL CHECK(node_type IN ('local', 'remote')),
    node_public_key TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT 'My Boost Node',
    enabled INTEGER NOT NULL DEFAULT 0,
    max_storage_bytes INTEGER NOT NULL DEFAULT 1073741824,
    max_bandwidth_mbps INTEGER NOT NULL DEFAULT 10,
    auto_start INTEGER NOT NULL DEFAULT 0,
    prioritized_communities TEXT,
    pairing_token TEXT,
    remote_address TEXT,
    last_seen_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Deleted messages (for "delete for me" tracking)
CREATE TABLE community_deleted_messages (
    message_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    deleted_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, member_did)
);
```

---

## Implementation Phases

> **Status key:** ✅ = implemented in Rust, 🔧 = partially implemented, 📋 = planned (not yet coded)

### Phase 1: Core Community Infrastructure ✅
**Foundation — must be built first**
**Language: Rust (100%) + thin TS wrappers**
**Status: COMPLETE — all Rust logic implemented**

**Rust (`packages/umbra-core/src/community/`):**
- `mod.rs` — module root, public API re-exports (`CommunityService`, `Permission`, `Permissions`, `RolePreset`, `MentionType`, `parse_mentions`)
- `service.rs` — community CRUD (create with default space/channels/roles, update, delete, ownership transfer, audit logging)
- `spaces.rs` — space CRUD and reordering by position
- `channels.rs` — channel CRUD with 6 types (text, voice, files, announcement, bulletin, welcome), type enforcement, reordering
- `members.rs` — join (with ban check, auto-assign role, welcome message), leave, kick, ban (with device fingerprint, expiry), unban, nickname, profile
- `roles.rs` — 4 preset roles (Owner/Admin/Moderator/Member) with colors, permissions, hierarchy, hoisted flags
- `permissions.rs` — 64-bit permission bitfield engine (34+ flags), administrator bypass, resolution with precedence (owner → roles → channel overrides)
- `invites.rs` — invite code generation, expiration, max uses, consumption (triggers join), vanity URL support

**Rust (`packages/umbra-core/src/storage/schema.rs`):**
- Schema v7 — 30+ community tables with migrations from v6
- All tables listed in the Data Model section

**Rust (`packages/umbra-core/src/ffi/wasm.rs`):**
- 122 WASM bindings covering all community functions

**Rust (`packages/umbra-core/src/network/protocols.rs`):**
- New libp2p protocols: `/umbra/community/1.0.0`

**TypeScript (thin wrappers only):**
- `packages/umbra-service/src/index.ts` — community service methods (calls WASM)
- `packages/umbra-wasm/loader.ts` — new function type defs
- `packages/umbra-wasm/tauri-backend.ts` — Tauri invoke stubs
- `hooks/useCommunity.ts` — React hook wrapping service
- `hooks/useCommunityChannels.ts` — React hook wrapping service
- `components/community/` — UI components (rendering only, in progress via Wisp)

### Phase 2: Messaging & Channels ✅
**Build on Phase 1 infrastructure**
**Language: Rust (core) + TS (UI)**
**Status: COMPLETE — Rust logic in `messaging.rs`**

**Rust (`packages/umbra-core/src/community/messaging.rs`):**
- Message creation with channel type enforcement (voice rejects text, announcement restricted to owner/admin/mod)
- Mute timeout checking (blocks sending while muted)
- Slow mode cooldown enforcement (per member per channel)
- E2EE support via `content_encrypted` field
- Reply/quote-reply linking via `reply_to_id`
- Content warning/spoiler tag handling via `content_warning` field
- Reaction handling (add/remove per emoji per member)
- Message pinning with configurable limit (default 50 per channel)
- Read receipt computation and storage (mark as read, get receipts)
- @mention parsing: `@everyone`, `@here`, `@role:ROLE_ID`, `@user:DID` (exported as `parse_mentions()`)
- Thread reply counter updates on send

**Rust (`packages/umbra-core/src/community/channels.rs`):**
- Announcement channel enforcement (post permission checks)
- Bulletin board channel enforcement (admin-only posting)
- Welcome channel system message generation on member join (via `members.rs`)

**TypeScript (UI only) — 📋 PLANNED:**
- Message rendering with markdown
- Reaction picker UI
- Typing indicator display
- Read receipt avatar display (5 avatars + count)
- Link preview rendering
- Embed card rendering

### Phase 3: Threads & Search ✅
**Threaded conversations and discoverability**
**Language: Rust (100% core logic)**
**Status: COMPLETE — Rust logic in `threads.rs` (search included here, no separate `search.rs`)**

**Rust (`packages/umbra-core/src/community/threads.rs`):**
- Thread creation from parent message with optional name
- Thread message storage (reuses messaging.rs with thread_id)
- Thread notification state (follow/unfollow per member, auto-follow on create)
- Thread message count and last activity tracking
- Thread follower queries
- `search_messages()` — search messages by content within a channel (plaintext only, not E2EE)
- Advanced search filters (via `member_experience.rs`)

**Note:** Search was consolidated into `threads.rs` rather than a separate `search.rs`. Full-text search index (SQLite FTS5), advanced filter parsing, and permission-aware search are planned for future enhancement.

### Phase 4: Roles & Permissions (Advanced) ✅
**Complete the permission system**
**Language: Rust (100% core logic)**
**Status: COMPLETE — Rust logic in `roles.rs`, `permissions.rs`, `integrations.rs`**

**Rust (`packages/umbra-core/src/community/roles.rs`):**
- 4 preset roles with hardcoded colors (Owner: #e74c3c, Admin: #e67e22, Moderator: #2ecc71, Member: #95a5a6)
- Role hierarchy ordering via position field
- Hoisted role flag (shown separately in member list)
- Custom role CRUD (via `integrations.rs`)

**Rust (`packages/umbra-core/src/community/permissions.rs`):**
- 34+ permission flags as single bits in u64
- Administrator permission (bit 63) bypasses all checks
- Permission resolution: owner bypass → role permissions → channel overrides (deny first, then allow)
- String/raw bitfield conversion

**Rust (`packages/umbra-core/src/community/integrations.rs`):**
- Channel-level permission overrides (allow/deny bitfields per role or member)
- `set_channel_override()` — set role or member overrides with allow/deny bitfields
- Override CRUD (get, delete)

### Phase 5: Moderation System ✅
**Protect communities**
**Language: Rust (100% core logic)**
**Status: COMPLETE — Rust logic in `moderation.rs`, `members.rs`, `service.rs` (no separate `automod.rs` or `audit.rs`)**

**Rust (`packages/umbra-core/src/community/moderation.rs`):**
- Warning/strike system (issue, accumulate, auto-escalation at configurable thresholds)
- Default thresholds: timeout at 3 active warnings, ban at 5
- Warning expiry handling (active vs expired warnings)
- `check_warning_escalation()` — recommends None / "timeout" / "ban" based on active count
- Keyword filter management for AutoMod (add/remove/list keywords)
- Owner protection (cannot warn owner)
- Paginated warning queries per member and per community

**Rust (`packages/umbra-core/src/community/members.rs`):**
- Kick, ban (with device fingerprint, optional reason, optional expiry), unban
- Ban evasion detection (device fingerprint stored with ban records, checked on join)
- Timeout enforcement (via `member_experience.rs` mute/timeout tracking)

**Rust (`packages/umbra-core/src/community/service.rs`):**
- Audit log recording for all admin/mod actions (integrated into every operation)
- Audit log querying and filtering

**Note:** AutoMod and audit logging were consolidated into `moderation.rs` and `service.rs` respectively, rather than separate `automod.rs` and `audit.rs` files. ML-powered toxicity scoring and advanced spam detection are planned for future enhancement.

### Phase 6: Voice & Video 📋
**Real-time communication**
**Language: Rust (media engine) + TS (WebRTC UI)**
**Status: PLANNED — permission flags defined, runtime not yet implemented**

**Rust (permissions defined in `permissions.rs`):**
- Voice permission flags: VoiceConnect, VoiceSpeak, VoiceStream, VoiceMuteMembers, VoiceDeafenMembers, VoiceMoveMembers
- Voice channel type supported in `channels.rs`

**Rust (planned):**
- Voice channel state management (who's connected, muted, deafened)
- Priority speaker enforcement
- Recording consent tracking and state
- Audio mixing/routing where possible (native platforms)

**TypeScript (WebRTC layer — planned):**
- WebRTC peer connection management (browser API)
- Video/screen share UI controls
- Audio visualizer and speaking indicators
- Recording UI and file handling

### Phase 7: File Management ✅
**Organized file sharing**
**Language: Rust (100% core logic)**
**Status: COMPLETE — Rust logic in `files.rs`**

**Rust (`packages/umbra-core/src/community/files.rs`):**
- File metadata management (filename, size, MIME type, version, description, storage_chunks_json)
- Folder hierarchy CRUD (create, list, rename, delete with parent_folder_id)
- File upload (store metadata with storage chunk references)
- File listing with pagination (in channel or folder)
- Download count tracking via `record_file_download()`
- File deletion with audit logging

**Rust (integrates with `umbra-boost-node` — 📋 PLANNED):**
- Chunk distribution to P2P seeders
- Chunk retrieval from seeders and boost nodes
- Relay cache coordination for hot chunks

### Phase 8: Member Experience ✅
**Polish the member journey**
**Language: Rust (core) + TS (UI)**
**Status: COMPLETE — Rust logic split across `members.rs` and `member_experience.rs`**

**Rust (`packages/umbra-core/src/community/members.rs`):**
- Community-specific profile storage (nickname, avatar URL, bio)
- Nickname enforcement (self-set + admin override permissions)
- Member directory queries
- Ownership transfer with role swapping (via `service.rs`)

**Rust (`packages/umbra-core/src/community/member_experience.rs`):**
- Custom status storage (text + emoji + optional expiration)
- Status CRUD: set, get, clear
- Notification settings per target (community/space/channel granularity)
- Mute until timestamp, suppress @everyone, suppress @roles, level (all/mentions/none)
- Presence tracking
- Typing indicator state
- Thread follow/unfollow integration
- System message generation
- Advanced member search

### Phase 9: Customization & Branding ✅
**Make communities unique**
**Language: Rust (storage) + TS (rendering)**
**Status: COMPLETE — Rust logic in `customization.rs`**

**Rust (`packages/umbra-core/src/community/customization.rs`):**
- Community branding: icon_url, banner_url, splash_url, accent_color, custom_css
- `update_branding()` — set all visual properties
- Custom emoji CRUD (create with image URL + animated flag, list, delete)
- Sticker support
- `set_vanity_url()` — custom vanity URL reservation and validation
- All operations audit logged

### Phase 10: Integrations & Advanced ✅
**Extensibility and polish**
**Language: Rust (100% core logic)**
**Status: COMPLETE — Rust logic in `integrations.rs`, `messaging.rs`, `member_experience.rs` (no separate `webhooks.rs`)**

**Rust (`packages/umbra-core/src/community/integrations.rs`):**
- Webhook CRUD (create with auto-generated token, get, list, update name/avatar, delete)
- Webhook per-channel configuration
- Custom role CRUD (beyond presets)
- Channel-level permission overrides (allow/deny bitfields)

**Rust (`packages/umbra-core/src/community/messaging.rs`):**
- Pin management (add, remove, enforce configurable pin limit per channel)
- Content warning system (message-level spoiler flags via `content_warning` field)

**Rust (`packages/umbra-core/src/community/member_experience.rs`):**
- Notification computation engine (per-community, per-space, per-channel settings)
- Mute, suppress @everyone/@roles, notification level

**Rust (`packages/umbra-core/src/community/invites.rs`):**
- Invite link controls (expiration, max uses, use count tracking)

### Phase 11: Boost Nodes & Federation 🔧
**Scale the infrastructure**
**Language: Rust (100%) — standalone package**
**Status: PARTIALLY IMPLEMENTED — boost node config/registration in `boost_nodes.rs`, standalone package PLANNED**

**Rust (`packages/umbra-core/src/community/boost_nodes.rs`) — ✅ IMPLEMENTED:**
- Boost node registration (local or remote type, with public key)
- Node CRUD: register, list, get, update config, delete
- Heartbeat tracking via `update_boost_node_heartbeat()`
- Configuration management: name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities
- Remote node support: pairing_token, remote_address
- Nodes disabled by default on creation

**New package: `packages/umbra-boost-node/` — 📋 PLANNED:**

**`src/lib.rs`** — Library mode (embedded in umbra-core for in-app boost node):
- `EmbeddedNode` struct for running within the app's tokio runtime
- Shared lifecycle with the Umbra app process

**`src/main.rs`** — Binary mode (standalone deployment):
- CLI entry point with clap argument parsing
- Config file support (TOML)
- Daemonization support
- Signal handling (graceful shutdown)

**`src/node.rs`** — Core node logic:
- Node lifecycle (start, stop, pause, resume)
- Community registration (which communities to serve)
- Chunk request handling (serve chunks to requesting peers)

**`src/storage.rs`** — Encrypted chunk storage:
- Content-addressed chunk store (BLAKE3 hash → encrypted blob)
- Storage quota enforcement
- LRU eviction when approaching storage limit
- Oldest-first pruning on overflow

**`src/seeding.rs`** — P2P seeding protocol:
- libp2p request-response protocol for chunk exchange
- Chunk availability announcements via DHT
- Peer discovery for chunk providers
- Download prioritization (rarest-first)

**`src/replication.rs`** — Data redundancy:
- Configurable replication factor (2-5 copies)
- Replication monitoring (track which chunks have how many copies)
- Re-replication trigger when a node goes offline
- Replication health reporting

**`src/auth.rs`** — Node authentication:
- Ed25519 keypair derivation (HKDF from master seed, context `"umbra-boost-node-v1"`)
- Signed attestation for node registration
- Challenge-response authentication for remote management
- Session token generation and validation

**`src/management.rs`** — Remote management API:
- Noise-protocol-encrypted management channel
- QR code / pairing token generation for linking
- Remote configuration updates (storage, bandwidth, communities)
- Remote health/metrics queries
- Remote restart command

**`src/config.rs`** — Node configuration:
- Storage limit (bytes)
- Bandwidth limit (Mbps)
- Prioritized community list
- Auto-start flag
- Resource scheduling (active hours)
- Listening address/port

**`src/health.rs`** — Health monitoring:
- Storage used / allocated
- Bandwidth current / historical
- Chunks stored count
- Active peer connections
- Uptime tracking
- Community-level breakdown

**`src/pruning.rs`** — Storage overflow handling:
- Oldest-data-first pruning strategy
- Admin notification generation when pruning occurs
- Capacity warning thresholds (80%, 90%, 100%)
- Manual prune API for admin-triggered cleanup

---

## Summary

Umbra Communities is a comprehensive, privacy-first community platform built on Umbra's existing P2P encrypted infrastructure.

### Core Architecture Principles

1. **Rust-first** — all business logic, crypto, storage, networking, and moderation written in Rust for speed and safety
2. **TypeScript for UI only** — React/React Native renders the interface, calls into Rust via WASM/FFI
3. **`umbra-boost-node` is a standalone Rust package** — runs embedded in the app or as an independent binary on dedicated hardware

### Key Differentiators

1. **E2EE optional per channel** — admins choose the right privacy/performance tradeoff
2. **Federated storage with boost nodes** — community members contribute to infrastructure
3. **No analytics, no tracking** — privacy-first by design
4. **Unlimited scale** — federated architecture grows horizontally
5. **Full moderation suite** — ML-powered AutoMod, warnings, bans with evasion prevention
6. **Rich messaging** — markdown, threads, reactions, embeds, custom emoji
7. **Voice + video + recording** — persistent channels with unlimited participants
8. **Organized file management** — folders, unlimited sizes, version history
9. **Invite-only** — communities are private, discoverable only via shared links
10. **Spaces** — one level of organizational nesting for channel grouping
11. **Boost node as standalone binary** — deploy on VPS, home server, or Raspberry Pi and manage from the app

---

## Frontend Requirements Tracking

As the Rust backend is built, a companion document **`docs/frontend_requirements.md`** is maintained with:
- Every WASM function signature the frontend needs to call
- Data types and JSON shapes returned by each function
- UI components that need to be built for each phase
- Event names and payloads the frontend should subscribe to

**If this implementation is interrupted or resumed in a new session**, the frontend requirements doc serves as the contract between backend and frontend. The backend can be built independently — the frontend just needs to implement the interfaces described in that document.
