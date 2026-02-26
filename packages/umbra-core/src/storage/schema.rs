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
//! │  ┌─────────────────┐                                                    │
//! │  │  call_history   │                                                    │
//! │  ├─────────────────┤                                                    │
//! │  │ id              │                                                    │
//! │  │ conversation_id │                                                    │
//! │  │ call_type       │                                                    │
//! │  │ direction       │                                                    │
//! │  │ status          │                                                    │
//! │  │ participants    │                                                    │
//! │  │ started_at      │                                                    │
//! │  │ ended_at        │                                                    │
//! │  │ duration_ms     │                                                    │
//! │  │ created_at      │                                                    │
//! │  └─────────────────┘                                                    │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

/// Current schema version
pub const SCHEMA_VERSION: i32 = 17;

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
    -- Avatar (base64-encoded image data or URL)
    avatar TEXT,
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
    from_avatar TEXT,
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

-- Call history table
-- Stores voice/video call records
CREATE TABLE IF NOT EXISTS call_history (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    call_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    participants TEXT NOT NULL DEFAULT '[]',
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration_ms INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_call_history_conversation ON call_history(conversation_id, started_at DESC);

-- Notifications (unified notification system)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    related_did TEXT,
    related_id TEXT,
    avatar TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    dismissed INTEGER NOT NULL DEFAULT 0,
    action_taken TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_dismissed ON notifications(dismissed) WHERE dismissed = 0;

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

-- =========================================================================
-- COMMUNITY TABLES
-- =========================================================================

-- Core community table
CREATE TABLE IF NOT EXISTS communities (
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
    origin_community_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_communities_owner ON communities(owner_did);
CREATE INDEX IF NOT EXISTS idx_communities_origin ON communities(origin_community_id);

-- Spaces (one level of organization within a community)
CREATE TABLE IF NOT EXISTS community_spaces (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_spaces_community ON community_spaces(community_id, position);

-- Categories within spaces (user-named channel groupings)
CREATE TABLE IF NOT EXISTS community_categories (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    space_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES community_spaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_categories_space ON community_categories(space_id, position);

-- Channels within spaces (optionally assigned to a category)
CREATE TABLE IF NOT EXISTS community_channels (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    space_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('text', 'voice', 'files', 'announcement', 'bulletin', 'welcome', 'forum')),
    topic TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    slow_mode_seconds INTEGER DEFAULT 0,
    e2ee_enabled INTEGER NOT NULL DEFAULT 0,
    pin_limit INTEGER NOT NULL DEFAULT 50,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES community_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES community_categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_community_channels_space ON community_channels(space_id, position);
CREATE INDEX IF NOT EXISTS idx_community_channels_community ON community_channels(community_id);

-- Roles
CREATE TABLE IF NOT EXISTS community_roles (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
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
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_roles_community ON community_roles(community_id, position);

-- Role assignments (many-to-many: members ↔ roles)
CREATE TABLE IF NOT EXISTS community_member_roles (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at INTEGER NOT NULL,
    assigned_by TEXT,
    PRIMARY KEY (community_id, member_did, role_id),
    FOREIGN KEY (role_id) REFERENCES community_roles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_member_roles_member ON community_member_roles(community_id, member_did);

-- Channel permission overrides (per-role or per-member)
CREATE TABLE IF NOT EXISTS channel_permission_overrides (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('role', 'member')),
    target_id TEXT NOT NULL,
    allow_bitfield TEXT NOT NULL DEFAULT '0',
    deny_bitfield TEXT NOT NULL DEFAULT '0',
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_channel_perm_overrides_channel ON channel_permission_overrides(channel_id);

-- Community members
CREATE TABLE IF NOT EXISTS community_members (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    bio TEXT,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, member_did),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_members_did ON community_members(member_did);

-- Community messages
CREATE TABLE IF NOT EXISTS community_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
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
    created_at INTEGER NOT NULL,
    metadata_json TEXT,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON community_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_sender ON community_messages(sender_did);
CREATE INDEX IF NOT EXISTS idx_community_messages_thread ON community_messages(thread_id);

-- Community message reactions
CREATE TABLE IF NOT EXISTS community_reactions (
    message_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    emoji TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, member_did, emoji),
    FOREIGN KEY (message_id) REFERENCES community_messages(id) ON DELETE CASCADE
);

-- Read receipts
CREATE TABLE IF NOT EXISTS community_read_receipts (
    channel_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    last_read_message_id TEXT NOT NULL,
    read_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, member_did),
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);

-- Message pins
CREATE TABLE IF NOT EXISTS community_pins (
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    pinned_by TEXT NOT NULL,
    pinned_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, message_id),
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES community_messages(id) ON DELETE CASCADE
);

-- Threads
CREATE TABLE IF NOT EXISTS community_threads (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    parent_message_id TEXT NOT NULL,
    name TEXT,
    created_by TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    last_message_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES community_messages(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_threads_channel ON community_threads(channel_id);

-- Invite links
CREATE TABLE IF NOT EXISTS community_invites (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    vanity INTEGER NOT NULL DEFAULT 0,
    creator_did TEXT NOT NULL,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_invites_code ON community_invites(code);
CREATE INDEX IF NOT EXISTS idx_community_invites_community ON community_invites(community_id);

-- Bans
CREATE TABLE IF NOT EXISTS community_bans (
    community_id TEXT NOT NULL,
    banned_did TEXT NOT NULL,
    reason TEXT,
    banned_by TEXT NOT NULL,
    device_fingerprint TEXT,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, banned_did),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);

-- Warnings
CREATE TABLE IF NOT EXISTS community_warnings (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    reason TEXT NOT NULL,
    warned_by TEXT NOT NULL,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_warnings_member ON community_warnings(community_id, member_did);

-- Audit log
CREATE TABLE IF NOT EXISTS community_audit_log (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    actor_did TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata_json TEXT,
    content_detail TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_community ON community_audit_log(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_actor ON community_audit_log(actor_did);

-- Custom emoji
CREATE TABLE IF NOT EXISTS community_emoji (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animated INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_emoji_community ON community_emoji(community_id);

-- Custom stickers
CREATE TABLE IF NOT EXISTS community_stickers (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    pack_id TEXT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animated INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_stickers_community ON community_stickers(community_id);

-- File sharing
CREATE TABLE IF NOT EXISTS community_files (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    folder_id TEXT,
    filename TEXT NOT NULL,
    description TEXT,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    storage_chunks_json TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    previous_version_id TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    needs_reencryption INTEGER NOT NULL DEFAULT 0,
    key_version INTEGER NOT NULL DEFAULT 1,
    encryption_fingerprint TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_files_channel ON community_files(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_files_folder ON community_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_community_files_reencrypt ON community_files(needs_reencryption) WHERE needs_reencryption = 1;

-- File folders
CREATE TABLE IF NOT EXISTS community_file_folders (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    parent_folder_id TEXT,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES community_file_folders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_file_folders_channel ON community_file_folders(channel_id);

-- Webhooks
CREATE TABLE IF NOT EXISTS community_webhooks (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    token TEXT NOT NULL UNIQUE,
    creator_did TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_webhooks_channel ON community_webhooks(channel_id);

-- Channel E2EE keys (versioned for rotation)
CREATE TABLE IF NOT EXISTS community_channel_keys (
    channel_id TEXT NOT NULL,
    key_version INTEGER NOT NULL,
    encrypted_key BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, key_version),
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);

-- Boost node configuration (local and remote nodes)
CREATE TABLE IF NOT EXISTS boost_nodes (
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
CREATE INDEX IF NOT EXISTS idx_boost_nodes_owner ON boost_nodes(owner_did);

-- Deleted messages tracking (for "delete for me" per-user)
CREATE TABLE IF NOT EXISTS community_deleted_messages (
    message_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    deleted_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, member_did)
);

-- Timeouts (temporary mute/restrict a member)
CREATE TABLE IF NOT EXISTS community_timeouts (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    reason TEXT,
    timeout_type TEXT NOT NULL DEFAULT 'mute' CHECK(timeout_type IN ('mute', 'restrict')),
    issued_by TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_timeouts_member ON community_timeouts(community_id, member_did);
CREATE INDEX IF NOT EXISTS idx_community_timeouts_expires ON community_timeouts(expires_at);

-- Thread followers (subscribe/unsubscribe from thread notifications)
CREATE TABLE IF NOT EXISTS community_thread_followers (
    thread_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    followed_at INTEGER NOT NULL,
    PRIMARY KEY (thread_id, member_did),
    FOREIGN KEY (thread_id) REFERENCES community_threads(id) ON DELETE CASCADE
);

-- Member status (custom status text + emoji)
CREATE TABLE IF NOT EXISTS community_member_status (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    status_text TEXT,
    status_emoji TEXT,
    expires_at INTEGER,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, member_did),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);

-- Notification settings (per-community, per-space, or per-channel)
CREATE TABLE IF NOT EXISTS community_notification_settings (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('community', 'space', 'channel')),
    target_id TEXT NOT NULL,
    mute_until INTEGER,
    suppress_everyone INTEGER NOT NULL DEFAULT 0,
    suppress_roles INTEGER NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'all' CHECK(level IN ('all', 'mentions', 'none')),
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    UNIQUE(community_id, member_did, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_community_notification_settings_member ON community_notification_settings(community_id, member_did);

-- File chunk storage (local chunks for P2P transfer)
CREATE TABLE IF NOT EXISTS file_chunks (
    chunk_id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    data BLOB NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_file_chunks_file ON file_chunks(file_id);

-- File manifests (describe how a file was chunked)
CREATE TABLE IF NOT EXISTS file_manifests (
    file_id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    total_size INTEGER NOT NULL,
    chunk_size INTEGER NOT NULL,
    total_chunks INTEGER NOT NULL,
    chunks_json TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    encrypted INTEGER NOT NULL DEFAULT 0,
    encryption_key_id TEXT,
    previous_version_id TEXT,
    key_version INTEGER NOT NULL DEFAULT 1,
    encryption_fingerprint TEXT,
    created_at INTEGER NOT NULL
);

-- DM shared files
CREATE TABLE IF NOT EXISTS dm_shared_files (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    folder_id TEXT,
    filename TEXT NOT NULL,
    description TEXT,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    storage_chunks_json TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    download_count INTEGER NOT NULL DEFAULT 0,
    encrypted_metadata TEXT,
    encryption_nonce TEXT,
    needs_reencryption INTEGER NOT NULL DEFAULT 0,
    key_version INTEGER NOT NULL DEFAULT 1,
    encryption_fingerprint TEXT,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dm_shared_files_conversation ON dm_shared_files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_shared_files_folder ON dm_shared_files(folder_id);

-- DM shared folders
CREATE TABLE IF NOT EXISTS dm_shared_folders (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    parent_folder_id TEXT,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (parent_folder_id) REFERENCES dm_shared_folders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dm_shared_folders_conversation ON dm_shared_folders(conversation_id);

-- Transfer sessions (P2P file transfer state persistence for resume)
CREATE TABLE IF NOT EXISTS transfer_sessions (
    transfer_id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    manifest_json TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('upload', 'download')),
    peer_did TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'requesting',
    chunks_completed INTEGER NOT NULL DEFAULT 0,
    total_chunks INTEGER NOT NULL,
    bytes_transferred INTEGER NOT NULL DEFAULT 0,
    total_bytes INTEGER NOT NULL,
    chunks_bitfield TEXT NOT NULL DEFAULT '',
    transport_type TEXT NOT NULL DEFAULT 'relay',
    error TEXT,
    started_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transfer_sessions_file ON transfer_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_transfer_sessions_state ON transfer_sessions(state);

-- Community seats (ghost member placeholders from platform imports)
CREATE TABLE IF NOT EXISTS community_seats (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_user_id TEXT NOT NULL,
    platform_username TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    role_ids_json TEXT NOT NULL DEFAULT '[]',
    claimed_by_did TEXT,
    claimed_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    UNIQUE(community_id, platform, platform_user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_seats_community ON community_seats(community_id);
CREATE INDEX IF NOT EXISTS idx_community_seats_unclaimed ON community_seats(community_id, claimed_by_did) WHERE claimed_by_did IS NULL;
CREATE INDEX IF NOT EXISTS idx_community_seats_platform ON community_seats(platform, platform_user_id);
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

/// Migration SQL from schema version 4 → 5
///
/// Adds call_history table for voice/video call records.
pub const MIGRATE_V4_TO_V5: &str = r#"
-- Call history table
CREATE TABLE IF NOT EXISTS call_history (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    call_type TEXT NOT NULL,
    direction TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    participants TEXT NOT NULL DEFAULT '[]',
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    duration_ms INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_call_history_conversation ON call_history(conversation_id, started_at DESC);

-- Update schema version
UPDATE schema_version SET version = 5;
"#;

/// Migration SQL from schema version 5 → 6
///
/// Adds all community infrastructure tables: communities, spaces, channels,
/// roles, members, messages, reactions, threads, invites, bans, warnings,
/// audit log, emoji, stickers, files, webhooks, channel keys, and boost nodes.
pub const MIGRATE_V5_TO_V6: &str = r#"
-- Core community table
CREATE TABLE IF NOT EXISTS communities (
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
    origin_community_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_communities_owner ON communities(owner_did);
CREATE INDEX IF NOT EXISTS idx_communities_origin ON communities(origin_community_id);

-- Spaces
CREATE TABLE IF NOT EXISTS community_spaces (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_spaces_community ON community_spaces(community_id, position);

-- Categories
CREATE TABLE IF NOT EXISTS community_categories (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    space_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES community_spaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_categories_space ON community_categories(space_id, position);

-- Channels
CREATE TABLE IF NOT EXISTS community_channels (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    space_id TEXT NOT NULL,
    category_id TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('text', 'voice', 'files', 'announcement', 'bulletin', 'welcome', 'forum')),
    topic TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    slow_mode_seconds INTEGER DEFAULT 0,
    e2ee_enabled INTEGER NOT NULL DEFAULT 0,
    pin_limit INTEGER NOT NULL DEFAULT 50,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES community_spaces(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES community_categories(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_community_channels_space ON community_channels(space_id, position);
CREATE INDEX IF NOT EXISTS idx_community_channels_community ON community_channels(community_id);

-- Roles
CREATE TABLE IF NOT EXISTS community_roles (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
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
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_roles_community ON community_roles(community_id, position);

-- Role assignments
CREATE TABLE IF NOT EXISTS community_member_roles (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at INTEGER NOT NULL,
    assigned_by TEXT,
    PRIMARY KEY (community_id, member_did, role_id),
    FOREIGN KEY (role_id) REFERENCES community_roles(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_member_roles_member ON community_member_roles(community_id, member_did);

-- Channel permission overrides
CREATE TABLE IF NOT EXISTS channel_permission_overrides (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('role', 'member')),
    target_id TEXT NOT NULL,
    allow_bitfield TEXT NOT NULL DEFAULT '0',
    deny_bitfield TEXT NOT NULL DEFAULT '0',
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_channel_perm_overrides_channel ON channel_permission_overrides(channel_id);

-- Community members
CREATE TABLE IF NOT EXISTS community_members (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    bio TEXT,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, member_did),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_members_did ON community_members(member_did);

-- Community messages
CREATE TABLE IF NOT EXISTS community_messages (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
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
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_messages_channel ON community_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_messages_sender ON community_messages(sender_did);
CREATE INDEX IF NOT EXISTS idx_community_messages_thread ON community_messages(thread_id);

-- Community reactions
CREATE TABLE IF NOT EXISTS community_reactions (
    message_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    emoji TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, member_did, emoji),
    FOREIGN KEY (message_id) REFERENCES community_messages(id) ON DELETE CASCADE
);

-- Read receipts
CREATE TABLE IF NOT EXISTS community_read_receipts (
    channel_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    last_read_message_id TEXT NOT NULL,
    read_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, member_did),
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);

-- Message pins
CREATE TABLE IF NOT EXISTS community_pins (
    channel_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    pinned_by TEXT NOT NULL,
    pinned_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, message_id),
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES community_messages(id) ON DELETE CASCADE
);

-- Threads
CREATE TABLE IF NOT EXISTS community_threads (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    parent_message_id TEXT NOT NULL,
    name TEXT,
    created_by TEXT NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    last_message_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES community_messages(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_threads_channel ON community_threads(channel_id);

-- Invite links
CREATE TABLE IF NOT EXISTS community_invites (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    vanity INTEGER NOT NULL DEFAULT 0,
    creator_did TEXT NOT NULL,
    max_uses INTEGER,
    use_count INTEGER NOT NULL DEFAULT 0,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_invites_code ON community_invites(code);
CREATE INDEX IF NOT EXISTS idx_community_invites_community ON community_invites(community_id);

-- Bans
CREATE TABLE IF NOT EXISTS community_bans (
    community_id TEXT NOT NULL,
    banned_did TEXT NOT NULL,
    reason TEXT,
    banned_by TEXT NOT NULL,
    device_fingerprint TEXT,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, banned_did),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);

-- Warnings
CREATE TABLE IF NOT EXISTS community_warnings (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    reason TEXT NOT NULL,
    warned_by TEXT NOT NULL,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_warnings_member ON community_warnings(community_id, member_did);

-- Audit log
CREATE TABLE IF NOT EXISTS community_audit_log (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    actor_did TEXT NOT NULL,
    action_type TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    metadata_json TEXT,
    content_detail TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_community ON community_audit_log(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_audit_log_actor ON community_audit_log(actor_did);

-- Custom emoji
CREATE TABLE IF NOT EXISTS community_emoji (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animated INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_emoji_community ON community_emoji(community_id);

-- Custom stickers
CREATE TABLE IF NOT EXISTS community_stickers (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    pack_id TEXT,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    animated INTEGER NOT NULL DEFAULT 0,
    uploaded_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_stickers_community ON community_stickers(community_id);

-- File sharing
CREATE TABLE IF NOT EXISTS community_files (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    folder_id TEXT,
    filename TEXT NOT NULL,
    description TEXT,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    storage_chunks_json TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    previous_version_id TEXT,
    download_count INTEGER NOT NULL DEFAULT 0,
    needs_reencryption INTEGER NOT NULL DEFAULT 0,
    key_version INTEGER NOT NULL DEFAULT 1,
    encryption_fingerprint TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_files_channel ON community_files(channel_id);
CREATE INDEX IF NOT EXISTS idx_community_files_folder ON community_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_community_files_reencrypt ON community_files(needs_reencryption) WHERE needs_reencryption = 1;

-- File folders
CREATE TABLE IF NOT EXISTS community_file_folders (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    parent_folder_id TEXT,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_folder_id) REFERENCES community_file_folders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_file_folders_channel ON community_file_folders(channel_id);

-- Webhooks
CREATE TABLE IF NOT EXISTS community_webhooks (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    token TEXT NOT NULL UNIQUE,
    creator_did TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_webhooks_channel ON community_webhooks(channel_id);

-- Channel E2EE keys
CREATE TABLE IF NOT EXISTS community_channel_keys (
    channel_id TEXT NOT NULL,
    key_version INTEGER NOT NULL,
    encrypted_key BLOB NOT NULL,
    created_at INTEGER NOT NULL,
    PRIMARY KEY (channel_id, key_version),
    FOREIGN KEY (channel_id) REFERENCES community_channels(id) ON DELETE CASCADE
);

-- Boost node configuration
CREATE TABLE IF NOT EXISTS boost_nodes (
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
CREATE INDEX IF NOT EXISTS idx_boost_nodes_owner ON boost_nodes(owner_did);

-- Deleted messages tracking
CREATE TABLE IF NOT EXISTS community_deleted_messages (
    message_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    deleted_at INTEGER NOT NULL,
    PRIMARY KEY (message_id, member_did)
);

-- Update schema version
UPDATE schema_version SET version = 6;
"#;

/// Migration SQL from schema version 6 → 7
///
/// Adds community timeouts, thread followers, member status, and notification settings.
pub const MIGRATE_V6_TO_V7: &str = r#"
-- Timeouts
CREATE TABLE IF NOT EXISTS community_timeouts (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    reason TEXT,
    timeout_type TEXT NOT NULL DEFAULT 'mute' CHECK(timeout_type IN ('mute', 'restrict')),
    issued_by TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_timeouts_member ON community_timeouts(community_id, member_did);
CREATE INDEX IF NOT EXISTS idx_community_timeouts_expires ON community_timeouts(expires_at);

-- Thread followers
CREATE TABLE IF NOT EXISTS community_thread_followers (
    thread_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    followed_at INTEGER NOT NULL,
    PRIMARY KEY (thread_id, member_did),
    FOREIGN KEY (thread_id) REFERENCES community_threads(id) ON DELETE CASCADE
);

-- Member status
CREATE TABLE IF NOT EXISTS community_member_status (
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    status_text TEXT,
    status_emoji TEXT,
    expires_at INTEGER,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (community_id, member_did),
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);

-- Notification settings
CREATE TABLE IF NOT EXISTS community_notification_settings (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    member_did TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('community', 'space', 'channel')),
    target_id TEXT NOT NULL,
    mute_until INTEGER,
    suppress_everyone INTEGER NOT NULL DEFAULT 0,
    suppress_roles INTEGER NOT NULL DEFAULT 0,
    level TEXT NOT NULL DEFAULT 'all' CHECK(level IN ('all', 'mentions', 'none')),
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    UNIQUE(community_id, member_did, target_type, target_id)
);
CREATE INDEX IF NOT EXISTS idx_community_notification_settings_member ON community_notification_settings(community_id, member_did);

-- Update schema version
UPDATE schema_version SET version = 7;
"#;

/// Migration from v7 to v8.
///
/// Adds community categories (user-named channel groupings within spaces)
/// and adds category_id to channels.
pub const MIGRATE_V7_TO_V8: &str = r#"
-- Categories within spaces (user-named channel groupings)
CREATE TABLE IF NOT EXISTS community_categories (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    space_id TEXT NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    FOREIGN KEY (space_id) REFERENCES community_spaces(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_categories_space ON community_categories(space_id, position);

-- Add category_id to channels (nullable — uncategorized channels have NULL)
ALTER TABLE community_channels ADD COLUMN category_id TEXT REFERENCES community_categories(id) ON DELETE SET NULL;

UPDATE schema_version SET version = 8;
"#;

/// Migration from v8 to v9.
///
/// Adds file chunk storage, file manifests, DM shared files, and DM shared folders.
pub const MIGRATE_V8_TO_V9: &str = r#"
-- File chunk storage (local chunks for P2P transfer)
CREATE TABLE IF NOT EXISTS file_chunks (
    chunk_id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    data BLOB NOT NULL,
    size INTEGER NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_file_chunks_file ON file_chunks(file_id);

-- File manifests (describe how a file was chunked)
CREATE TABLE IF NOT EXISTS file_manifests (
    file_id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    total_size INTEGER NOT NULL,
    chunk_size INTEGER NOT NULL,
    total_chunks INTEGER NOT NULL,
    chunks_json TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    encrypted INTEGER NOT NULL DEFAULT 0,
    encryption_key_id TEXT,
    previous_version_id TEXT,
    key_version INTEGER NOT NULL DEFAULT 1,
    encryption_fingerprint TEXT,
    created_at INTEGER NOT NULL
);

-- DM shared files
CREATE TABLE IF NOT EXISTS dm_shared_files (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    folder_id TEXT,
    filename TEXT NOT NULL,
    description TEXT,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    storage_chunks_json TEXT NOT NULL,
    uploaded_by TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    download_count INTEGER NOT NULL DEFAULT 0,
    encrypted_metadata TEXT,
    encryption_nonce TEXT,
    needs_reencryption INTEGER NOT NULL DEFAULT 0,
    key_version INTEGER NOT NULL DEFAULT 1,
    encryption_fingerprint TEXT,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dm_shared_files_conversation ON dm_shared_files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_dm_shared_files_folder ON dm_shared_files(folder_id);

-- DM shared folders
CREATE TABLE IF NOT EXISTS dm_shared_folders (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    parent_folder_id TEXT,
    name TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (parent_folder_id) REFERENCES dm_shared_folders(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_dm_shared_folders_conversation ON dm_shared_folders(conversation_id);

UPDATE schema_version SET version = 9;
"#;

/// Migration from v9 to v10.
///
/// Adds transfer_sessions table for P2P file transfer resume,
/// and adds previous_version_id to file_manifests for auto-versioning.
pub const MIGRATE_V9_TO_V10: &str = r#"
-- Transfer sessions (P2P file transfer state persistence for resume)
CREATE TABLE IF NOT EXISTS transfer_sessions (
    transfer_id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    manifest_json TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('upload', 'download')),
    peer_did TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'requesting',
    chunks_completed INTEGER NOT NULL DEFAULT 0,
    total_chunks INTEGER NOT NULL,
    bytes_transferred INTEGER NOT NULL DEFAULT 0,
    total_bytes INTEGER NOT NULL,
    chunks_bitfield TEXT NOT NULL DEFAULT '',
    transport_type TEXT NOT NULL DEFAULT 'relay',
    error TEXT,
    started_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_transfer_sessions_file ON transfer_sessions(file_id);
CREATE INDEX IF NOT EXISTS idx_transfer_sessions_state ON transfer_sessions(state);

-- Add auto-versioning support to file_manifests
ALTER TABLE file_manifests ADD COLUMN previous_version_id TEXT;

-- Add auto-versioning support to community_files
ALTER TABLE community_files ADD COLUMN previous_version_id TEXT;

UPDATE schema_version SET version = 10;
"#;

/// Migration from v10 to v11.
///
/// Adds encryption metadata for on-access re-encryption support.
/// - `needs_reencryption` flag: marks files that need re-encryption after key rotation
/// - `key_version` field: tracks which key version was used to encrypt the file
/// - `encryption_fingerprint`: stores the key fingerprint for verification
pub const MIGRATE_V10_TO_V11: &str = r#"
-- Add on-access re-encryption support to community_files
ALTER TABLE community_files ADD COLUMN needs_reencryption INTEGER NOT NULL DEFAULT 0;
ALTER TABLE community_files ADD COLUMN key_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE community_files ADD COLUMN encryption_fingerprint TEXT;

-- Add encryption metadata to dm_shared_files
ALTER TABLE dm_shared_files ADD COLUMN needs_reencryption INTEGER NOT NULL DEFAULT 0;
ALTER TABLE dm_shared_files ADD COLUMN key_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE dm_shared_files ADD COLUMN encryption_fingerprint TEXT;

-- Add encryption metadata to file_manifests
ALTER TABLE file_manifests ADD COLUMN key_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE file_manifests ADD COLUMN encryption_fingerprint TEXT;

-- Index for efficient queries of files needing re-encryption
CREATE INDEX IF NOT EXISTS idx_community_files_reencrypt ON community_files(needs_reencryption) WHERE needs_reencryption = 1;
CREATE INDEX IF NOT EXISTS idx_dm_shared_files_reencrypt ON dm_shared_files(needs_reencryption) WHERE needs_reencryption = 1;

UPDATE schema_version SET version = 11;
"#;

/// Migration from v11 to v12.
///
/// Adds community_seats table for ghost member placeholders from platform imports.
/// Seats represent imported members that real users can claim by linking their platform account.
pub const MIGRATE_V11_TO_V12: &str = r#"
-- Community seats (ghost member placeholders from platform imports)
CREATE TABLE IF NOT EXISTS community_seats (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    platform_user_id TEXT NOT NULL,
    platform_username TEXT NOT NULL,
    nickname TEXT,
    avatar_url TEXT,
    role_ids_json TEXT NOT NULL DEFAULT '[]',
    claimed_by_did TEXT,
    claimed_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE,
    UNIQUE(community_id, platform, platform_user_id)
);
CREATE INDEX IF NOT EXISTS idx_community_seats_community ON community_seats(community_id);
CREATE INDEX IF NOT EXISTS idx_community_seats_unclaimed ON community_seats(community_id, claimed_by_did) WHERE claimed_by_did IS NULL;
CREATE INDEX IF NOT EXISTS idx_community_seats_platform ON community_seats(platform, platform_user_id);

UPDATE schema_version SET version = 12;
"#;

/// Migration v12 → v13:
/// - community_sticker_packs table
/// - metadata_json on community_messages (for text effects)
/// - sticker_placements table (iMessage-style sticker placement)
/// - format column on community_stickers
pub const MIGRATE_V12_TO_V13: &str = r#"
-- Sticker packs for grouping community stickers
CREATE TABLE IF NOT EXISTS community_sticker_packs (
    id TEXT PRIMARY KEY,
    community_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_sticker_id TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_community_sticker_packs_community ON community_sticker_packs(community_id);

-- Add format column to community_stickers (gif, apng, lottie, png, webp)
ALTER TABLE community_stickers ADD COLUMN format TEXT NOT NULL DEFAULT 'png';

-- Add metadata_json to community_messages for text effects
ALTER TABLE community_messages ADD COLUMN metadata_json TEXT;

-- Sticker placements (iMessage-style sticker placement on messages)
CREATE TABLE IF NOT EXISTS sticker_placements (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    sticker_id TEXT NOT NULL,
    placed_by TEXT NOT NULL,
    x_offset REAL NOT NULL DEFAULT 0.5,
    y_offset REAL NOT NULL DEFAULT 0.5,
    scale REAL NOT NULL DEFAULT 1.0,
    rotation REAL NOT NULL DEFAULT 0.0,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sticker_placements_channel_message ON sticker_placements(channel_id, message_id);

UPDATE schema_version SET version = 13;
"#;

/// Migration v13 → v14:
/// - Add avatar column to friends table for profile picture sync
pub const MIGRATE_V13_TO_V14: &str = r#"
-- Add avatar column to friends table (base64 image data or URL)
ALTER TABLE friends ADD COLUMN avatar TEXT;

UPDATE schema_version SET version = 14;
"#;

/// Migration v14 → v15:
/// - Add from_avatar column to friend_requests table for profile picture sync
pub const MIGRATE_V14_TO_V15: &str = r#"
-- Add avatar column to friend_requests table
ALTER TABLE friend_requests ADD COLUMN from_avatar TEXT;

UPDATE schema_version SET version = 15;
"#;

/// Migration v15 → v16:
/// - Add notifications table for persisted notification records
pub const MIGRATE_V15_TO_V16: &str = r#"
-- Notifications table for the unified notification system
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    related_did TEXT,
    related_id TEXT,
    avatar TEXT,
    read INTEGER NOT NULL DEFAULT 0,
    dismissed INTEGER NOT NULL DEFAULT 0,
    action_taken TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_dismissed ON notifications(dismissed) WHERE dismissed = 0;

UPDATE schema_version SET version = 16;
"#;

/// Migration v16 → v17: add origin_community_id for cross-peer community deduplication.
pub const MIGRATE_V16_TO_V17: &str = r#"
ALTER TABLE communities ADD COLUMN origin_community_id TEXT;
CREATE INDEX IF NOT EXISTS idx_communities_origin ON communities(origin_community_id);

UPDATE schema_version SET version = 17;
"#;

/// SQL to drop all tables (for testing/reset)
#[allow(dead_code)]
pub const DROP_TABLES: &str = r#"
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS sticker_placements;
DROP TABLE IF EXISTS community_sticker_packs;
DROP TABLE IF EXISTS community_seats;
DROP TABLE IF EXISTS transfer_sessions;
DROP TABLE IF EXISTS dm_shared_folders;
DROP TABLE IF EXISTS dm_shared_files;
DROP TABLE IF EXISTS file_manifests;
DROP TABLE IF EXISTS file_chunks;
DROP TABLE IF EXISTS community_notification_settings;
DROP TABLE IF EXISTS community_member_status;
DROP TABLE IF EXISTS community_thread_followers;
DROP TABLE IF EXISTS community_timeouts;
DROP TABLE IF EXISTS community_deleted_messages;
DROP TABLE IF EXISTS boost_nodes;
DROP TABLE IF EXISTS community_channel_keys;
DROP TABLE IF EXISTS community_webhooks;
DROP TABLE IF EXISTS community_file_folders;
DROP TABLE IF EXISTS community_files;
DROP TABLE IF EXISTS community_stickers;
DROP TABLE IF EXISTS community_emoji;
DROP TABLE IF EXISTS community_audit_log;
DROP TABLE IF EXISTS community_warnings;
DROP TABLE IF EXISTS community_bans;
DROP TABLE IF EXISTS community_invites;
DROP TABLE IF EXISTS community_threads;
DROP TABLE IF EXISTS community_pins;
DROP TABLE IF EXISTS community_read_receipts;
DROP TABLE IF EXISTS community_reactions;
DROP TABLE IF EXISTS community_messages;
DROP TABLE IF EXISTS community_members;
DROP TABLE IF EXISTS channel_permission_overrides;
DROP TABLE IF EXISTS community_member_roles;
DROP TABLE IF EXISTS community_roles;
DROP TABLE IF EXISTS community_channels;
DROP TABLE IF EXISTS community_categories;
DROP TABLE IF EXISTS community_spaces;
DROP TABLE IF EXISTS communities;
DROP TABLE IF EXISTS call_history;
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

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_create_tables_sql_is_valid() {
        let conn = Connection::open_in_memory().unwrap();
        // CREATE_TABLES should execute without errors
        conn.execute_batch(CREATE_TABLES).unwrap();
        // Set schema version so we can verify it later
        conn.execute(
            "INSERT INTO schema_version (version) VALUES (?)",
            rusqlite::params![SCHEMA_VERSION],
        )
        .unwrap();

        let version: i32 = conn
            .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(version, SCHEMA_VERSION);
    }

    #[test]
    fn test_call_history_table_exists_after_create() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(CREATE_TABLES).unwrap();
        conn.execute(
            "INSERT INTO schema_version (version) VALUES (?)",
            rusqlite::params![SCHEMA_VERSION],
        )
        .unwrap();

        // Verify the call_history table exists by inserting a row
        // First we need a conversation for the foreign key
        conn.execute(
            "INSERT INTO conversations (id, type, created_at, unread_count) VALUES ('conv-1', 'dm', 1000, 0)",
            [],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO call_history (id, conversation_id, call_type, direction, status, participants, started_at, created_at)
             VALUES ('call-1', 'conv-1', 'voice', 'outgoing', 'active', '[]', 1000, 1000)",
            [],
        )
        .unwrap();

        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM call_history", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_migrate_v4_to_v5_sql_is_valid() {
        let conn = Connection::open_in_memory().unwrap();
        // Simulate a v4 database by running CREATE_TABLES minus call_history,
        // but it's simpler to just create the schema_version table and run migration
        conn.execute_batch(CREATE_TABLES).unwrap();
        conn.execute("INSERT INTO schema_version (version) VALUES (4)", [])
            .unwrap();

        // Drop call_history so we can test the migration creates it
        conn.execute_batch("DROP TABLE IF EXISTS call_history;")
            .unwrap();

        // Run the migration
        conn.execute_batch(MIGRATE_V4_TO_V5).unwrap();

        let version: i32 = conn
            .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(version, 5);

        // Verify call_history table was created
        conn.execute(
            "INSERT INTO conversations (id, type, created_at, unread_count) VALUES ('conv-1', 'dm', 1000, 0)",
            [],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO call_history (id, conversation_id, call_type, direction, status, participants, started_at, created_at)
             VALUES ('call-1', 'conv-1', 'video', 'incoming', 'completed', '[\"did:key:z6Mk1\"]', 1000, 1000)",
            [],
        )
        .unwrap();

        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM call_history", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_migrate_v5_to_v6_sql_is_valid() {
        let conn = Connection::open_in_memory().unwrap();
        // Create a v5 database
        conn.execute_batch(CREATE_TABLES).unwrap();
        conn.execute("INSERT INTO schema_version (version) VALUES (5)", [])
            .unwrap();

        // Drop all community tables so we can test the migration creates them
        conn.execute_batch(
            "DROP TABLE IF EXISTS community_deleted_messages;
             DROP TABLE IF EXISTS boost_nodes;
             DROP TABLE IF EXISTS community_channel_keys;
             DROP TABLE IF EXISTS community_webhooks;
             DROP TABLE IF EXISTS community_file_folders;
             DROP TABLE IF EXISTS community_files;
             DROP TABLE IF EXISTS community_stickers;
             DROP TABLE IF EXISTS community_emoji;
             DROP TABLE IF EXISTS community_audit_log;
             DROP TABLE IF EXISTS community_warnings;
             DROP TABLE IF EXISTS community_bans;
             DROP TABLE IF EXISTS community_invites;
             DROP TABLE IF EXISTS community_threads;
             DROP TABLE IF EXISTS community_pins;
             DROP TABLE IF EXISTS community_read_receipts;
             DROP TABLE IF EXISTS community_reactions;
             DROP TABLE IF EXISTS community_messages;
             DROP TABLE IF EXISTS community_members;
             DROP TABLE IF EXISTS channel_permission_overrides;
             DROP TABLE IF EXISTS community_member_roles;
             DROP TABLE IF EXISTS community_roles;
             DROP TABLE IF EXISTS community_channels;
             DROP TABLE IF EXISTS community_categories;
             DROP TABLE IF EXISTS community_spaces;
             DROP TABLE IF EXISTS communities;",
        )
        .unwrap();

        // Run the migration
        conn.execute_batch(MIGRATE_V5_TO_V6).unwrap();

        let version: i32 = conn
            .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(version, 6);

        // Verify communities table was created
        conn.execute(
            "INSERT INTO communities (id, name, owner_did, created_at, updated_at)
             VALUES ('comm-1', 'Test Community', 'did:key:z6MkOwner', 1000, 1000)",
            [],
        )
        .unwrap();

        // Verify spaces
        conn.execute(
            "INSERT INTO community_spaces (id, community_id, name, position, created_at, updated_at)
             VALUES ('space-1', 'comm-1', 'General', 0, 1000, 1000)",
            [],
        )
        .unwrap();

        // Verify channels
        conn.execute(
            "INSERT INTO community_channels (id, community_id, space_id, name, type, position, created_at, updated_at)
             VALUES ('chan-1', 'comm-1', 'space-1', 'general', 'text', 0, 1000, 1000)",
            [],
        )
        .unwrap();

        // Verify roles
        conn.execute(
            "INSERT INTO community_roles (id, community_id, name, position, permissions_bitfield, created_at, updated_at)
             VALUES ('role-1', 'comm-1', 'Admin', 0, '255', 1000, 1000)",
            [],
        )
        .unwrap();

        // Verify members
        conn.execute(
            "INSERT INTO community_members (community_id, member_did, joined_at)
             VALUES ('comm-1', 'did:key:z6MkMember', 1000)",
            [],
        )
        .unwrap();

        // Verify boost_nodes
        conn.execute(
            "INSERT INTO boost_nodes (id, owner_did, node_type, node_public_key, created_at, updated_at)
             VALUES ('node-1', 'did:key:z6MkOwner', 'local', 'abcdef', 1000, 1000)",
            [],
        )
        .unwrap();

        let count: i32 = conn
            .query_row("SELECT COUNT(*) FROM communities", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_migrate_v6_to_v7_sql_is_valid() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(CREATE_TABLES).unwrap();
        conn.execute("INSERT INTO schema_version (version) VALUES (6)", [])
            .unwrap();

        // Drop v7 tables so we can test the migration creates them
        conn.execute_batch(
            "DROP TABLE IF EXISTS community_notification_settings;
             DROP TABLE IF EXISTS community_member_status;
             DROP TABLE IF EXISTS community_thread_followers;
             DROP TABLE IF EXISTS community_timeouts;",
        )
        .unwrap();

        // Run the migration
        conn.execute_batch(MIGRATE_V6_TO_V7).unwrap();

        let version: i32 = conn
            .query_row("SELECT version FROM schema_version LIMIT 1", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(version, 7);

        // Verify timeouts table
        conn.execute(
            "INSERT INTO communities (id, name, owner_did, created_at, updated_at) VALUES ('comm-1', 'Test', 'did:key:z6MkOwner', 1000, 1000)",
            [],
        ).unwrap();

        conn.execute(
            "INSERT INTO community_timeouts (id, community_id, member_did, timeout_type, issued_by, expires_at, created_at)
             VALUES ('to-1', 'comm-1', 'did:key:z6MkMember', 'mute', 'did:key:z6MkMod', 9999999, 1000)",
            [],
        ).unwrap();

        // Verify thread_followers table
        conn.execute(
            "INSERT INTO community_spaces (id, community_id, name, position, created_at, updated_at)
             VALUES ('space-1', 'comm-1', 'General', 0, 1000, 1000)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO community_channels (id, community_id, space_id, name, type, position, created_at, updated_at)
             VALUES ('chan-1', 'comm-1', 'space-1', 'general', 'text', 0, 1000, 1000)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO community_messages (id, channel_id, sender_did, is_e2ee, created_at)
             VALUES ('msg-1', 'chan-1', 'did:key:z6MkMember', 0, 1000)",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO community_threads (id, channel_id, parent_message_id, created_by, created_at)
             VALUES ('thread-1', 'chan-1', 'msg-1', 'did:key:z6MkMember', 1000)",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO community_thread_followers (thread_id, member_did, followed_at)
             VALUES ('thread-1', 'did:key:z6MkMember', 1000)",
            [],
        )
        .unwrap();

        // Verify member_status table
        conn.execute(
            "INSERT INTO community_member_status (community_id, member_did, status_text, status_emoji, updated_at)
             VALUES ('comm-1', 'did:key:z6MkMember', 'Busy coding', '💻', 1000)",
            [],
        ).unwrap();

        // Verify notification_settings table
        conn.execute(
            "INSERT INTO community_notification_settings (id, community_id, member_did, target_type, target_id, level, updated_at)
             VALUES ('ns-1', 'comm-1', 'did:key:z6MkMember', 'community', 'comm-1', 'mentions', 1000)",
            [],
        ).unwrap();

        // Verify counts
        let timeout_count: i32 = conn
            .query_row("SELECT COUNT(*) FROM community_timeouts", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(timeout_count, 1);
        let follower_count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM community_thread_followers",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(follower_count, 1);
        let status_count: i32 = conn
            .query_row("SELECT COUNT(*) FROM community_member_status", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(status_count, 1);
        let notif_count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM community_notification_settings",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(notif_count, 1);
    }

    #[test]
    fn test_drop_tables_includes_call_history() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(CREATE_TABLES).unwrap();
        conn.execute(
            "INSERT INTO schema_version (version) VALUES (?)",
            rusqlite::params![SCHEMA_VERSION],
        )
        .unwrap();

        // DROP_TABLES should execute without errors
        conn.execute_batch(DROP_TABLES).unwrap();

        // Verify call_history table is gone
        let result = conn.execute("SELECT 1 FROM call_history", []);
        assert!(result.is_err());
    }
}
