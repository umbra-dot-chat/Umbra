//! # Database Schema
//!
//! SQL schema definitions for the Umbra database.
//!
//! ## Schema Overview
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         DATABASE SCHEMA                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────┐    ┌─────────────────┐      ┌─────────────────┐    │
//! │  │    friends      │    │  conversations  │      │    messages     │    │
//! │  ├─────────────────┤    ├─────────────────┤      ├─────────────────┤    │
//! │  │ id              │    │ id              │      │ id              │    │
//! │  │ did             │◄───│ friend_did      │      │ conversation_id │───►│
//! │  │ display_name    │    │ created_at      │      │ sender_did      │    │
//! │  │ signing_key     │    │ last_message_at │      │ content_enc     │    │
//! │  │ encryption_key  │    │ unread_count    │      │ nonce           │    │
//! │  │ status          │    └─────────────────┘      │ timestamp       │    │
//! │  │ created_at      │                             │ delivered       │    │
//! │  │ updated_at      │                             │ read            │    │
//! │  └─────────────────┘                             └─────────────────┘    │
//! │                                                                         │
//! │  ┌─────────────────┐    ┌─────────────────┐      ┌─────────────────┐    │
//! │  │ friend_requests │    │  blocked_users  │      │    settings     │    │
//! │  ├─────────────────┤    ├─────────────────┤      ├─────────────────┤    │
//! │  │ id              │    │ did             │      │ key             │    │
//! │  │ from_did        │    │ blocked_at      │      │ value           │    │
//! │  │ to_did          │    │ reason          │      │ updated_at      │    │
//! │  │ direction       │    └─────────────────┘      └─────────────────┘    │
//! │  │ message         │                                                    │
//! │  │ created_at      │                                                    │
//! │  │ status          │                                                    │
//! │  └─────────────────┘                                                    │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

/// Current schema version
pub const SCHEMA_VERSION: i32 = 4;

/// SQL to create all tables
pub const CREATE_TABLES: &str = r#"
-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY
);

-- Friends table
-- Stores accepted friends with their public keys
CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Decentralized Identifier (did:key:...)
    did TEXT NOT NULL UNIQUE,
    -- Display name (may be updated by the friend)
    display_name TEXT NOT NULL,
    -- Ed25519 public key (hex encoded, 64 chars)
    signing_key TEXT NOT NULL,
    -- X25519 public key (hex encoded, 64 chars)
    encryption_key TEXT NOT NULL,
    -- Optional status message
    status TEXT,
    -- When this friend was added
    created_at INTEGER NOT NULL,
    -- Last profile update
    updated_at INTEGER NOT NULL,
    -- Index for fast DID lookups
    CONSTRAINT did_format CHECK (did LIKE 'did:key:%')
);
CREATE INDEX IF NOT EXISTS idx_friends_did ON friends(did);

-- Conversations table
-- Stores conversation metadata (DMs and groups)
CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    -- The friend's DID for DMs (NULL for groups)
    friend_did TEXT,
    -- Conversation type: 'dm' or 'group'
    type TEXT NOT NULL DEFAULT 'dm',
    -- Group ID (NULL for DMs)
    group_id TEXT,
    -- When the conversation was created
    created_at INTEGER NOT NULL,
    -- Last message timestamp (for sorting)
    last_message_at INTEGER,
    -- Number of unread messages
    unread_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_conversations_friend ON conversations(friend_did);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_group ON conversations(group_id);

-- Messages table
-- Stores encrypted message content with editing, deletion, pinning, threading
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    -- Which conversation this belongs to
    conversation_id TEXT NOT NULL,
    -- Who sent this message (could be us or the friend)
    sender_did TEXT NOT NULL,
    -- Encrypted message content (hex encoded)
    content_encrypted TEXT NOT NULL,
    -- AES-GCM nonce (hex encoded, 24 chars for 12 bytes)
    nonce TEXT NOT NULL,
    -- When the message was sent (Unix timestamp ms)
    timestamp INTEGER NOT NULL,
    -- Has this been delivered to the recipient?
    delivered INTEGER NOT NULL DEFAULT 0,
    -- Has this been read by the recipient?
    read INTEGER NOT NULL DEFAULT 0,
    -- Editing support
    edited INTEGER NOT NULL DEFAULT 0,
    edited_at INTEGER,
    -- Soft deletion support
    deleted INTEGER NOT NULL DEFAULT 0,
    deleted_at INTEGER,
    -- Pinning support
    pinned INTEGER NOT NULL DEFAULT 0,
    pinned_by TEXT,
    pinned_at INTEGER,
    -- Threading / reply support
    reply_to_id TEXT,
    thread_id TEXT,
    -- Forwarding support
    forwarded_from TEXT,
    -- Reference to conversations table
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(conversation_id, pinned) WHERE pinned = 1;

-- Reactions table
-- Many-to-many: users can react to messages with emoji
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_did TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    UNIQUE(message_id, user_did, emoji)
);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);

-- Groups table
-- Stores group metadata
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Group members table
-- Tracks which DIDs belong to which groups
CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, member_did),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_group_members_did ON group_members(member_did);

-- Group encryption keys table
-- Stores AES-256-GCM keys (encrypted with owner's key-wrapping key)
-- Key version increments on rotation (member removal)
CREATE TABLE IF NOT EXISTS group_keys (
    group_id TEXT NOT NULL,
    key_version INTEGER NOT NULL,
    encrypted_key BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, key_version),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Group invites table
-- Stores pending/accepted/declined group invitations
CREATE TABLE IF NOT EXISTS group_invites (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    group_name TEXT NOT NULL,
    description TEXT,
    inviter_did TEXT NOT NULL,
    inviter_name TEXT NOT NULL,
    encrypted_group_key TEXT NOT NULL,
    nonce TEXT NOT NULL,
    members_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_group_invites_status ON group_invites(status);
CREATE INDEX IF NOT EXISTS idx_group_invites_group ON group_invites(group_id);

-- Friend requests table
-- Stores pending friend requests (both sent and received)
CREATE TABLE IF NOT EXISTS friend_requests (
    id TEXT PRIMARY KEY,
    -- Who sent the request
    from_did TEXT NOT NULL,
    -- Who the request is for
    to_did TEXT NOT NULL,
    -- Direction: 'incoming' or 'outgoing'
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    -- Optional message with the request
    message TEXT,
    -- Public keys of the sender (for incoming requests)
    from_signing_key TEXT,
    from_encryption_key TEXT,
    from_display_name TEXT,
    -- When the request was created
    created_at INTEGER NOT NULL,
    -- Status: 'pending', 'accepted', 'rejected', 'cancelled'
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status, direction);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_did);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_did);

-- Blocked users table
-- Stores blocked DIDs
CREATE TABLE IF NOT EXISTS blocked_users (
    did TEXT PRIMARY KEY,
    -- When they were blocked
    blocked_at INTEGER NOT NULL,
    -- Optional reason
    reason TEXT
);

-- Settings table
-- Key-value store for user preferences
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    -- JSON-encoded value
    value TEXT NOT NULL,
    -- Last update timestamp
    updated_at INTEGER NOT NULL
);
"#;

/// Migration SQL from schema version 1 → 2
///
/// Adds messaging features (edit, delete, pin, thread, forward),
/// reactions table, groups and group_members tables, and
/// extends conversations with type and group_id columns.
pub const MIGRATE_V1_TO_V2: &str = r#"
-- Extend messages table with new columns
ALTER TABLE messages ADD COLUMN edited INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN edited_at INTEGER;
ALTER TABLE messages ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN deleted_at INTEGER;
ALTER TABLE messages ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN pinned_by TEXT;
ALTER TABLE messages ADD COLUMN pinned_at INTEGER;
ALTER TABLE messages ADD COLUMN reply_to_id TEXT;
ALTER TABLE messages ADD COLUMN thread_id TEXT;
ALTER TABLE messages ADD COLUMN forwarded_from TEXT;

-- Add indexes for new message columns
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON messages(conversation_id, pinned) WHERE pinned = 1;

-- Extend conversations table with type and group_id
ALTER TABLE conversations ADD COLUMN type TEXT NOT NULL DEFAULT 'dm';
ALTER TABLE conversations ADD COLUMN group_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conversations_group ON conversations(group_id);

-- Reactions table (many-to-many)
CREATE TABLE IF NOT EXISTS reactions (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    user_did TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    UNIQUE(message_id, user_did, emoji)
);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON reactions(message_id);

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
    group_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, member_did),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_group_members_did ON group_members(member_did);

-- Update schema version
UPDATE schema_version SET version = 2;
"#;

/// Migration SQL from schema version 2 → 3
///
/// Adds group_keys table for shared group encryption and
/// group_invites table for the invite-accept flow.
pub const MIGRATE_V2_TO_V3: &str = r#"
-- Group encryption keys table
CREATE TABLE IF NOT EXISTS group_keys (
    group_id TEXT NOT NULL,
    key_version INTEGER NOT NULL,
    encrypted_key BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, key_version),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
);

-- Group invites table
CREATE TABLE IF NOT EXISTS group_invites (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    group_name TEXT NOT NULL,
    description TEXT,
    inviter_did TEXT NOT NULL,
    inviter_name TEXT NOT NULL,
    encrypted_group_key TEXT NOT NULL,
    nonce TEXT NOT NULL,
    members_json TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_group_invites_status ON group_invites(status);
CREATE INDEX IF NOT EXISTS idx_group_invites_group ON group_invites(group_id);

-- Update schema version
UPDATE schema_version SET version = 3;
"#;

/// Migration SQL from schema version 3 → 4
///
/// Adds plugin KV storage and plugin bundle storage tables
/// for the Umbra plugin/extension system.
pub const MIGRATE_V3_TO_V4: &str = r#"
-- Plugin key-value storage (namespaced per plugin)
CREATE TABLE IF NOT EXISTS plugin_kv (
    plugin_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (plugin_id, key)
);
CREATE INDEX IF NOT EXISTS idx_plugin_kv_plugin ON plugin_kv(plugin_id);

-- Plugin bundle storage (for web platform; desktop uses filesystem)
CREATE TABLE IF NOT EXISTS plugin_bundles (
    plugin_id TEXT PRIMARY KEY,
    manifest TEXT NOT NULL,
    bundle TEXT NOT NULL,
    installed_at INTEGER NOT NULL
);

-- Update schema version
UPDATE schema_version SET version = 4;
"#;

/// SQL to drop all tables (for testing/reset)
pub const DROP_TABLES: &str = r#"
DROP TABLE IF EXISTS plugin_bundles;
DROP TABLE IF EXISTS plugin_kv;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS blocked_users;
DROP TABLE IF EXISTS friend_requests;
DROP TABLE IF EXISTS group_invites;
DROP TABLE IF EXISTS group_keys;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS schema_version;
"#;
