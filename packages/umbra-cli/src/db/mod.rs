//! Lightweight SQLite persistence for CLI identity data.
//!
//! Stores the user's recovery phrase and metadata in a single-row table
//! at `~/.umbra/cli.db`. On startup the app can restore the identity
//! from the stored phrase and skip the onboarding flow.

mod identity;
mod friends;
mod messages;
mod groups;
mod community;

pub use identity::StoredIdentity;
pub use friends::{StoredFriend, StoredFriendRequest, StoredBlockedUser};
pub use messages::{StoredMessage, StoredConversation, StoredReaction};
pub use groups::{StoredGroup, StoredGroupMember, StoredGroupMessage};
pub use community::{
    StoredCommunity, StoredSpace, StoredCategory, StoredChannel,
    StoredCommunityMember, StoredCommunityRole, StoredMemberRole,
    StoredCommunityMessage, StoredCommunityInvite,
};

use std::path::{Path, PathBuf};
use rusqlite::Connection;

// ── Types ──────────────────────────────────────────────────────────────

/// Lightweight SQLite wrapper for CLI persistence.
pub struct Db {
    conn: Connection,
}

// ── Default path ───────────────────────────────────────────────────────

/// Return the default database path: `~/.umbra/cli.db`.
pub fn default_db_path() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join(".umbra")
        .join("cli.db")
}

// ── Implementation ─────────────────────────────────────────────────────

impl Db {
    /// Open or create the database at the given path.
    ///
    /// Creates parent directories if they don't exist and runs
    /// schema migration on first open.
    pub fn open(path: &Path) -> Result<Self, String> {
        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {e}"))?;
        }

        let conn = Connection::open(path)
            .map_err(|e| format!("Failed to open database: {e}"))?;

        // Enable WAL mode for better concurrent access
        conn.execute_batch("PRAGMA journal_mode=WAL;")
            .map_err(|e| format!("Failed to set WAL mode: {e}"))?;

        let db = Self { conn };
        db.migrate()?;

        // Set file permissions to owner-only on Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let perms = std::fs::Permissions::from_mode(0o600);
            let _ = std::fs::set_permissions(path, perms);
        }

        Ok(db)
    }

    /// Run schema migration — creates tables if they don't exist.
    fn migrate(&self) -> Result<(), String> {
        self.conn
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS identity (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    recovery_phrase TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    did TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    username TEXT,
                    linked_platform TEXT,
                    linked_username TEXT,
                    discoverable INTEGER NOT NULL DEFAULT 1
                );

                CREATE TABLE IF NOT EXISTS friends (
                    did TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    username TEXT,
                    added_at INTEGER NOT NULL,
                    encryption_key TEXT,
                    signing_key TEXT
                );

                CREATE TABLE IF NOT EXISTS friend_requests (
                    id TEXT PRIMARY KEY,
                    did TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    username TEXT,
                    direction TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS blocked_users (
                    did TEXT PRIMARY KEY,
                    display_name TEXT,
                    username TEXT,
                    blocked_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    friend_did TEXT NOT NULL,
                    last_message_at INTEGER,
                    unread_count INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    sender_did TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    delivered INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
                );

                CREATE INDEX IF NOT EXISTS idx_messages_conv_time
                    ON messages(conversation_id, timestamp);",
            )
            .map_err(|e| format!("Migration failed: {e}"))?;

        // Run additive migrations for existing databases (add columns if missing)
        let _ = self.conn.execute_batch(
            "ALTER TABLE friends ADD COLUMN encryption_key TEXT;",
        );
        let _ = self.conn.execute_batch(
            "ALTER TABLE friends ADD COLUMN signing_key TEXT;",
        );
        let _ = self.conn.execute_batch(
            "ALTER TABLE friend_requests ADD COLUMN encryption_key TEXT;",
        );
        let _ = self.conn.execute_batch(
            "ALTER TABLE friend_requests ADD COLUMN signing_key TEXT;",
        );

        // Phase 1: DM messaging polish columns
        let _ = self.conn.execute_batch(
            "ALTER TABLE messages ADD COLUMN edited_at INTEGER;",
        );
        let _ = self.conn.execute_batch(
            "ALTER TABLE messages ADD COLUMN deleted INTEGER NOT NULL DEFAULT 0;",
        );
        let _ = self.conn.execute_batch(
            "ALTER TABLE messages ADD COLUMN status TEXT NOT NULL DEFAULT 'sent';",
        );
        let _ = self.conn.execute_batch(
            "ALTER TABLE messages ADD COLUMN reply_to_id TEXT;",
        );

        // Phase 1: Reactions table
        self.conn
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS reactions (
                    id TEXT PRIMARY KEY,
                    message_id TEXT NOT NULL,
                    sender_did TEXT NOT NULL,
                    emoji TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    UNIQUE(message_id, sender_did, emoji)
                );

                CREATE TABLE IF NOT EXISTS pinned_messages (
                    id TEXT PRIMARY KEY,
                    conversation_id TEXT NOT NULL,
                    message_id TEXT NOT NULL,
                    pinned_by TEXT NOT NULL,
                    pinned_at INTEGER NOT NULL,
                    UNIQUE(conversation_id, message_id)
                );",
            )
            .map_err(|e| format!("Phase 1 migration failed: {e}"))?;

        // Phase 2: Group DM tables
        self.conn
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS groups (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_by TEXT NOT NULL,
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS group_members (
                    group_id TEXT NOT NULL,
                    did TEXT NOT NULL,
                    display_name TEXT,
                    joined_at INTEGER NOT NULL,
                    PRIMARY KEY (group_id, did)
                );

                CREATE TABLE IF NOT EXISTS group_messages (
                    id TEXT PRIMARY KEY,
                    group_id TEXT NOT NULL,
                    sender_did TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    edited_at INTEGER,
                    deleted INTEGER NOT NULL DEFAULT 0
                );

                CREATE INDEX IF NOT EXISTS idx_group_messages_time
                    ON group_messages(group_id, timestamp);",
            )
            .map_err(|e| format!("Phase 2 migration failed: {e}"))?;

        // Phase 3: Community tables
        self.conn
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS communities (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_by TEXT NOT NULL,
                    created_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS community_spaces (
                    id TEXT PRIMARY KEY,
                    community_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    position INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (community_id) REFERENCES communities(id)
                );

                CREATE TABLE IF NOT EXISTS community_categories (
                    id TEXT PRIMARY KEY,
                    space_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    position INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (space_id) REFERENCES community_spaces(id)
                );

                CREATE TABLE IF NOT EXISTS community_channels (
                    id TEXT PRIMARY KEY,
                    category_id TEXT NOT NULL,
                    community_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    channel_type TEXT NOT NULL DEFAULT 'text',
                    position INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (category_id) REFERENCES community_categories(id),
                    FOREIGN KEY (community_id) REFERENCES communities(id)
                );

                CREATE TABLE IF NOT EXISTS community_members (
                    community_id TEXT NOT NULL,
                    did TEXT NOT NULL,
                    display_name TEXT,
                    joined_at INTEGER NOT NULL,
                    PRIMARY KEY (community_id, did)
                );

                CREATE TABLE IF NOT EXISTS community_roles (
                    id TEXT PRIMARY KEY,
                    community_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    permissions INTEGER NOT NULL DEFAULT 0,
                    position INTEGER NOT NULL DEFAULT 0,
                    color TEXT,
                    FOREIGN KEY (community_id) REFERENCES communities(id)
                );

                CREATE TABLE IF NOT EXISTS member_roles (
                    community_id TEXT NOT NULL,
                    did TEXT NOT NULL,
                    role_id TEXT NOT NULL,
                    PRIMARY KEY (community_id, did, role_id)
                );

                CREATE TABLE IF NOT EXISTS community_messages (
                    id TEXT PRIMARY KEY,
                    channel_id TEXT NOT NULL,
                    sender_did TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    edited_at INTEGER,
                    deleted INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY (channel_id) REFERENCES community_channels(id)
                );

                CREATE INDEX IF NOT EXISTS idx_community_messages_time
                    ON community_messages(channel_id, timestamp);",
            )
            .map_err(|e| format!("Phase 3 migration failed: {e}"))?;

        // Phase 5: Community bans table
        self.conn
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS community_bans (
                    community_id TEXT NOT NULL,
                    did TEXT NOT NULL,
                    banned_by TEXT NOT NULL,
                    reason TEXT,
                    banned_at INTEGER NOT NULL,
                    PRIMARY KEY (community_id, did)
                );",
            )
            .map_err(|e| format!("Phase 5 migration failed: {e}"))?;

        // Phase 6: Community invites table
        self.conn
            .execute_batch(
                "CREATE TABLE IF NOT EXISTS community_invites (
                    id TEXT PRIMARY KEY,
                    community_id TEXT NOT NULL,
                    code TEXT NOT NULL UNIQUE,
                    creator_did TEXT NOT NULL,
                    max_uses INTEGER,
                    use_count INTEGER NOT NULL DEFAULT 0,
                    expires_at INTEGER,
                    created_at INTEGER NOT NULL
                );",
            )
            .map_err(|e| format!("Phase 6 migration failed: {e}"))?;

        Ok(())
    }
}
