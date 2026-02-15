//! # Database
//!
//! SQLite database wrapper with encryption support.
//!
//! ## Database Operations
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      DATABASE OPERATIONS                                │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────┐                                                   │
//! │  │   Application   │                                                   │
//! │  └────────┬────────┘                                                   │
//! │           │                                                             │
//! │           ▼                                                             │
//! │  ┌─────────────────┐                                                   │
//! │  │    Database     │  High-level API                                   │
//! │  │   (this file)   │  - Friend management                              │
//! │  │                 │  - Message storage                                │
//! │  │                 │  - Settings                                       │
//! │  └────────┬────────┘                                                   │
//! │           │                                                             │
//! │           ▼                                                             │
//! │  ┌─────────────────┐                                                   │
//! │  │    rusqlite     │  SQLite wrapper                                   │
//! │  │                 │  - Connection pooling                             │
//! │  │                 │  - Prepared statements                            │
//! │  └────────┬────────┘                                                   │
//! │           │                                                             │
//! │           ▼                                                             │
//! │  ┌─────────────────┐                                                   │
//! │  │   SQLite DB     │  Storage                                          │
//! │  │   (file or      │  - In-memory for tests                            │
//! │  │    memory)      │  - File for production                            │
//! │  └─────────────────┘                                                   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use rusqlite::{Connection, params};
use parking_lot::Mutex;
use std::sync::Arc;

use crate::error::{Error, Result};
use super::schema;

/// Database configuration
#[derive(Debug, Clone, Default)]
pub struct DatabaseConfig {
    /// Path to the database file
    pub path: Option<String>,
}

/// The main database handle
///
/// This wraps a SQLite connection and provides high-level methods
/// for storing and retrieving Umbra data.
pub struct Database {
    /// The underlying SQLite connection
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    /// Open or create a database
    ///
    /// If path is None, creates an in-memory database (useful for testing).
    pub async fn open(path: Option<&str>) -> Result<Self> {
        let conn = match path {
            Some(p) => Connection::open(p)
                .map_err(|e| Error::DatabaseError(format!("Failed to open database: {}", e)))?,
            None => Connection::open_in_memory()
                .map_err(|e| Error::DatabaseError(format!("Failed to create in-memory database: {}", e)))?,
        };

        let db = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        // Initialize schema
        db.init_schema()?;

        Ok(db)
    }

    /// Initialize the database schema
    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock();

        // Check current schema version
        let version: Option<i32> = conn
            .query_row(
                "SELECT version FROM schema_version LIMIT 1",
                [],
                |row| row.get(0),
            )
            .ok();

        match version {
            None => {
                // Fresh database, create all tables
                conn.execute_batch(schema::CREATE_TABLES)
                    .map_err(|e| Error::DatabaseError(format!("Failed to create tables: {}", e)))?;

                // Set schema version
                conn.execute(
                    "INSERT INTO schema_version (version) VALUES (?)",
                    params![schema::SCHEMA_VERSION],
                )
                .map_err(|e| Error::DatabaseError(format!("Failed to set schema version: {}", e)))?;

                tracing::info!("Database schema created (version {})", schema::SCHEMA_VERSION);
            }
            Some(v) if v < schema::SCHEMA_VERSION => {
                tracing::info!(
                    "Database schema version {} is older than current {}, running migrations",
                    v,
                    schema::SCHEMA_VERSION
                );

                if v < 2 {
                    tracing::info!("Running migration v1 → v2");
                    conn.execute_batch(schema::MIGRATE_V1_TO_V2)
                        .map_err(|e| Error::DatabaseError(format!("Migration v1→v2 failed: {}", e)))?;
                }
                if v < 3 {
                    tracing::info!("Running migration v2 → v3");
                    conn.execute_batch(schema::MIGRATE_V2_TO_V3)
                        .map_err(|e| Error::DatabaseError(format!("Migration v2→v3 failed: {}", e)))?;
                }
                if v < 4 {
                    tracing::info!("Running migration v3 → v4 (plugin KV, plugin bundles)");
                    conn.execute_batch(schema::MIGRATE_V3_TO_V4)
                        .map_err(|e| Error::DatabaseError(format!("Migration v3→v4 failed: {}", e)))?;
                }
                if v < 5 {
                    tracing::info!("Running migration v4 → v5 (call history)");
                    conn.execute_batch(schema::MIGRATE_V4_TO_V5)
                        .map_err(|e| Error::DatabaseError(format!("Migration v4→v5 failed: {}", e)))?;
                }

                tracing::info!("All migrations complete (now at version {})", schema::SCHEMA_VERSION);
            }
            Some(v) => {
                tracing::debug!("Database schema version: {}", v);
            }
        }

        Ok(())
    }

    // ========================================================================
    // FRIEND OPERATIONS
    // ========================================================================

    /// Add a new friend to the database
    pub fn add_friend(
        &self,
        did: &str,
        display_name: &str,
        signing_key: &[u8; 32],
        encryption_key: &[u8; 32],
        status: Option<&str>,
    ) -> Result<i64> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();

        conn.execute(
            "INSERT INTO friends (did, display_name, signing_key, encryption_key, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![
                did,
                display_name,
                hex::encode(signing_key),
                hex::encode(encryption_key),
                status,
                now,
                now,
            ],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to add friend: {}", e)))?;

        Ok(conn.last_insert_rowid())
    }

    /// Get a friend by DID
    pub fn get_friend(&self, did: &str) -> Result<Option<FriendRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT id, did, display_name, signing_key, encryption_key, status, created_at, updated_at
             FROM friends WHERE did = ?",
            params![did],
            |row| {
                Ok(FriendRecord {
                    id: row.get(0)?,
                    did: row.get(1)?,
                    display_name: row.get(2)?,
                    signing_key: row.get(3)?,
                    encryption_key: row.get(4)?,
                    status: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get friend: {}", e))),
        }
    }

    /// Get all friends
    pub fn get_all_friends(&self) -> Result<Vec<FriendRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, did, display_name, signing_key, encryption_key, status, created_at, updated_at
                 FROM friends ORDER BY display_name",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(FriendRecord {
                    id: row.get(0)?,
                    did: row.get(1)?,
                    display_name: row.get(2)?,
                    signing_key: row.get(3)?,
                    encryption_key: row.get(4)?,
                    status: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query friends: {}", e)))?;

        let mut friends = Vec::new();
        for row in rows {
            friends.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read friend: {}", e)))?);
        }

        Ok(friends)
    }

    /// Remove a friend by DID
    pub fn remove_friend(&self, did: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute("DELETE FROM friends WHERE did = ?", params![did])
            .map_err(|e| Error::DatabaseError(format!("Failed to remove friend: {}", e)))?;

        Ok(rows > 0)
    }

    /// Update a friend's profile
    pub fn update_friend(&self, did: &str, display_name: Option<&str>, status: Option<&str>) -> Result<bool> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();

        let mut updates = Vec::new();
        let mut values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        if let Some(name) = display_name {
            updates.push("display_name = ?");
            values.push(Box::new(name.to_string()));
        }

        // Handle status (can be Some(value) or explicitly None to clear)
        updates.push("status = ?");
        values.push(Box::new(status.map(|s| s.to_string())));

        updates.push("updated_at = ?");
        values.push(Box::new(now));

        if updates.is_empty() {
            return Ok(false);
        }

        let sql = format!("UPDATE friends SET {} WHERE did = ?", updates.join(", "));
        values.push(Box::new(did.to_string()));

        let params: Vec<&dyn rusqlite::ToSql> = values.iter().map(|v| v.as_ref()).collect();

        let rows = conn
            .execute(&sql, params.as_slice())
            .map_err(|e| Error::DatabaseError(format!("Failed to update friend: {}", e)))?;

        Ok(rows > 0)
    }

    // ========================================================================
    // CONVERSATION OPERATIONS
    // ========================================================================

    /// Create a new DM conversation
    pub fn create_conversation(&self, id: &str, friend_did: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();

        conn.execute(
            "INSERT OR IGNORE INTO conversations (id, friend_did, type, created_at, unread_count)
             VALUES (?, ?, 'dm', ?, 0)",
            params![id, friend_did, now],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to create conversation: {}", e)))?;

        Ok(())
    }

    /// Create a group conversation
    pub fn create_group_conversation(&self, id: &str, group_id: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();

        conn.execute(
            "INSERT OR IGNORE INTO conversations (id, type, group_id, created_at, unread_count)
             VALUES (?, 'group', ?, ?, 0)",
            params![id, group_id, now],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to create group conversation: {}", e)))?;

        Ok(())
    }

    /// Get a conversation by ID
    pub fn get_conversation(&self, id: &str) -> Result<Option<ConversationRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT id, friend_did, type, group_id, created_at, last_message_at, unread_count
             FROM conversations WHERE id = ?",
            params![id],
            |row| {
                Ok(ConversationRecord {
                    id: row.get(0)?,
                    friend_did: row.get(1)?,
                    conv_type: row.get(2)?,
                    group_id: row.get(3)?,
                    created_at: row.get(4)?,
                    last_message_at: row.get(5)?,
                    unread_count: row.get(6)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get conversation: {}", e))),
        }
    }

    /// Get conversation by friend DID
    pub fn get_conversation_by_friend(&self, friend_did: &str) -> Result<Option<ConversationRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT id, friend_did, type, group_id, created_at, last_message_at, unread_count
             FROM conversations WHERE friend_did = ?",
            params![friend_did],
            |row| {
                Ok(ConversationRecord {
                    id: row.get(0)?,
                    friend_did: row.get(1)?,
                    conv_type: row.get(2)?,
                    group_id: row.get(3)?,
                    created_at: row.get(4)?,
                    last_message_at: row.get(5)?,
                    unread_count: row.get(6)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get conversation: {}", e))),
        }
    }

    /// Get all conversations sorted by last message
    pub fn get_all_conversations(&self) -> Result<Vec<ConversationRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, friend_did, type, group_id, created_at, last_message_at, unread_count
                 FROM conversations ORDER BY last_message_at DESC NULLS LAST",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(ConversationRecord {
                    id: row.get(0)?,
                    friend_did: row.get(1)?,
                    conv_type: row.get(2)?,
                    group_id: row.get(3)?,
                    created_at: row.get(4)?,
                    last_message_at: row.get(5)?,
                    unread_count: row.get(6)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query conversations: {}", e)))?;

        let mut conversations = Vec::new();
        for row in rows {
            conversations.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read conversation: {}", e)))?);
        }

        Ok(conversations)
    }

    // ========================================================================
    // MESSAGE OPERATIONS
    // ========================================================================

    /// Store an encrypted message
    pub fn store_message(
        &self,
        id: &str,
        conversation_id: &str,
        sender_did: &str,
        content_encrypted: &[u8],
        nonce: &[u8],
        timestamp: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();

        conn.execute(
            "INSERT INTO messages (id, conversation_id, sender_did, content_encrypted, nonce, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![
                id,
                conversation_id,
                sender_did,
                hex::encode(content_encrypted),
                hex::encode(nonce),
                timestamp,
            ],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to store message: {}", e)))?;

        // Update conversation's last_message_at
        conn.execute(
            "UPDATE conversations SET last_message_at = ? WHERE id = ?",
            params![timestamp, conversation_id],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to update conversation: {}", e)))?;

        Ok(())
    }

    /// Get messages for a conversation
    pub fn get_messages(&self, conversation_id: &str, limit: usize, offset: usize) -> Result<Vec<MessageRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, conversation_id, sender_did, content_encrypted, nonce, timestamp, delivered, read
                 FROM messages WHERE conversation_id = ?
                 ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map(params![conversation_id, limit as i64, offset as i64], |row| {
                Ok(MessageRecord {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    sender_did: row.get(2)?,
                    content_encrypted: row.get(3)?,
                    nonce: row.get(4)?,
                    timestamp: row.get(5)?,
                    delivered: row.get(6)?,
                    read: row.get(7)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query messages: {}", e)))?;

        let mut messages = Vec::new();
        for row in rows {
            messages.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read message: {}", e)))?);
        }

        // Reverse to get chronological order
        messages.reverse();

        Ok(messages)
    }

    /// Get a single message by ID
    pub fn get_message(&self, id: &str) -> Result<Option<MessageRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT id, conversation_id, sender_did, content_encrypted, nonce, timestamp, delivered, read
             FROM messages WHERE id = ?",
            params![id],
            |row| {
                Ok(MessageRecord {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    sender_did: row.get(2)?,
                    content_encrypted: row.get(3)?,
                    nonce: row.get(4)?,
                    timestamp: row.get(5)?,
                    delivered: row.get(6)?,
                    read: row.get(7)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get message: {}", e))),
        }
    }

    /// Edit a message's encrypted content
    pub fn edit_message(&self, id: &str, new_content: &[u8], new_nonce: &[u8], edited_at: i64) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET content_encrypted = ?, nonce = ?, edited = 1, edited_at = ? WHERE id = ?",
                params![hex::encode(new_content), hex::encode(new_nonce), edited_at, id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to edit message: {}", e)))?;

        Ok(rows > 0)
    }

    /// Soft-delete a message
    pub fn delete_message(&self, id: &str, deleted_at: i64) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET deleted = 1, deleted_at = ? WHERE id = ?",
                params![deleted_at, id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to delete message: {}", e)))?;

        Ok(rows > 0)
    }

    /// Pin a message
    pub fn pin_message(&self, id: &str, pinned_by: &str, pinned_at: i64) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET pinned = 1, pinned_by = ?, pinned_at = ? WHERE id = ?",
                params![pinned_by, pinned_at, id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to pin message: {}", e)))?;

        Ok(rows > 0)
    }

    /// Unpin a message
    pub fn unpin_message(&self, id: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET pinned = 0, pinned_by = NULL, pinned_at = NULL WHERE id = ?",
                params![id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to unpin message: {}", e)))?;

        Ok(rows > 0)
    }

    /// Get pinned messages for a conversation
    pub fn get_pinned_messages(&self, conversation_id: &str) -> Result<Vec<MessageRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, conversation_id, sender_did, content_encrypted, nonce, timestamp, delivered, read
                 FROM messages WHERE conversation_id = ? AND pinned = 1
                 ORDER BY pinned_at DESC",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map(params![conversation_id], |row| {
                Ok(MessageRecord {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    sender_did: row.get(2)?,
                    content_encrypted: row.get(3)?,
                    nonce: row.get(4)?,
                    timestamp: row.get(5)?,
                    delivered: row.get(6)?,
                    read: row.get(7)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query pinned messages: {}", e)))?;

        let mut messages = Vec::new();
        for row in rows {
            messages.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read message: {}", e)))?);
        }
        Ok(messages)
    }

    /// Add a reaction to a message
    pub fn add_reaction(&self, id: &str, message_id: &str, user_did: &str, emoji: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();

        conn.execute(
            "INSERT OR IGNORE INTO reactions (id, message_id, user_did, emoji, created_at)
             VALUES (?, ?, ?, ?, ?)",
            params![id, message_id, user_did, emoji, now],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to add reaction: {}", e)))?;

        Ok(())
    }

    /// Remove a reaction from a message
    pub fn remove_reaction(&self, message_id: &str, user_did: &str, emoji: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "DELETE FROM reactions WHERE message_id = ? AND user_did = ? AND emoji = ?",
                params![message_id, user_did, emoji],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to remove reaction: {}", e)))?;

        Ok(rows > 0)
    }

    /// Get reactions for a message
    pub fn get_reactions(&self, message_id: &str) -> Result<Vec<ReactionRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, message_id, user_did, emoji, created_at
                 FROM reactions WHERE message_id = ? ORDER BY created_at",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map(params![message_id], |row| {
                Ok(ReactionRecord {
                    id: row.get(0)?,
                    message_id: row.get(1)?,
                    user_did: row.get(2)?,
                    emoji: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query reactions: {}", e)))?;

        let mut reactions = Vec::new();
        for row in rows {
            reactions.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read reaction: {}", e)))?);
        }
        Ok(reactions)
    }

    /// Update reply_to_id on a message (threading)
    pub fn set_message_reply(&self, message_id: &str, reply_to_id: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET reply_to_id = ? WHERE id = ?",
                params![reply_to_id, message_id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to set reply: {}", e)))?;

        Ok(rows > 0)
    }

    /// Set forwarded_from on a message
    pub fn set_message_forwarded(&self, message_id: &str, forwarded_from: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET forwarded_from = ? WHERE id = ?",
                params![forwarded_from, message_id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to set forwarded: {}", e)))?;

        Ok(rows > 0)
    }

    /// Mark a single message as delivered
    pub fn mark_message_delivered(&self, message_id: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET delivered = 1 WHERE id = ? AND delivered = 0",
                params![message_id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to mark delivered: {}", e)))?;
        Ok(rows > 0)
    }

    /// Mark a single message as read
    pub fn mark_message_read(&self, message_id: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE messages SET delivered = 1, read = 1 WHERE id = ? AND read = 0",
                params![message_id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to mark read: {}", e)))?;
        Ok(rows > 0)
    }

    /// Mark messages as read
    pub fn mark_messages_read(&self, conversation_id: &str) -> Result<i32> {
        let conn = self.conn.lock();

        let count = conn
            .execute(
                "UPDATE messages SET read = 1 WHERE conversation_id = ? AND read = 0",
                params![conversation_id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to mark messages read: {}", e)))?;

        // Reset unread count
        conn.execute(
            "UPDATE conversations SET unread_count = 0 WHERE id = ?",
            params![conversation_id],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to reset unread count: {}", e)))?;

        Ok(count as i32)
    }

    // ========================================================================
    // GROUP OPERATIONS
    // ========================================================================

    /// Create a new group
    pub fn create_group(
        &self,
        id: &str,
        name: &str,
        description: Option<&str>,
        created_by: &str,
        created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();

        conn.execute(
            "INSERT INTO groups (id, name, description, created_by, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![id, name, description, created_by, created_at, created_at],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to create group: {}", e)))?;

        Ok(())
    }

    /// Get a group by ID
    pub fn get_group(&self, id: &str) -> Result<Option<GroupRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT id, name, description, avatar, created_by, created_at, updated_at
             FROM groups WHERE id = ?",
            params![id],
            |row| {
                Ok(GroupRecord {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    avatar: row.get(3)?,
                    created_by: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get group: {}", e))),
        }
    }

    /// Get all groups
    pub fn get_all_groups(&self) -> Result<Vec<GroupRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, name, description, avatar, created_by, created_at, updated_at
                 FROM groups ORDER BY created_at DESC",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(GroupRecord {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    avatar: row.get(3)?,
                    created_by: row.get(4)?,
                    created_at: row.get(5)?,
                    updated_at: row.get(6)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query groups: {}", e)))?;

        let mut groups = Vec::new();
        for row in rows {
            groups.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read group: {}", e)))?);
        }

        Ok(groups)
    }

    /// Update a group's name and description
    pub fn update_group(&self, id: &str, name: &str, description: Option<&str>, updated_at: i64) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE groups SET name = ?, description = ?, updated_at = ? WHERE id = ?",
                params![name, description, updated_at, id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to update group: {}", e)))?;

        Ok(rows > 0)
    }

    /// Delete a group and its members (CASCADE should handle members)
    pub fn delete_group(&self, id: &str) -> Result<bool> {
        let conn = self.conn.lock();

        // Delete members first (in case CASCADE doesn't work on all platforms)
        conn.execute("DELETE FROM group_members WHERE group_id = ?", params![id])
            .map_err(|e| Error::DatabaseError(format!("Failed to delete group members: {}", e)))?;

        let rows = conn
            .execute("DELETE FROM groups WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(format!("Failed to delete group: {}", e)))?;

        Ok(rows > 0)
    }

    /// Add a member to a group
    pub fn add_group_member(
        &self,
        group_id: &str,
        member_did: &str,
        display_name: Option<&str>,
        role: &str,
        joined_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();

        conn.execute(
            "INSERT OR REPLACE INTO group_members (group_id, member_did, display_name, role, joined_at)
             VALUES (?, ?, ?, ?, ?)",
            params![group_id, member_did, display_name, role, joined_at],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to add group member: {}", e)))?;

        Ok(())
    }

    /// Remove a member from a group
    pub fn remove_group_member(&self, group_id: &str, member_did: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "DELETE FROM group_members WHERE group_id = ? AND member_did = ?",
                params![group_id, member_did],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to remove group member: {}", e)))?;

        Ok(rows > 0)
    }

    /// Get all members of a group
    pub fn get_group_members(&self, group_id: &str) -> Result<Vec<GroupMemberRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT group_id, member_did, display_name, role, joined_at
                 FROM group_members WHERE group_id = ? ORDER BY joined_at",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map(params![group_id], |row| {
                Ok(GroupMemberRecord {
                    group_id: row.get(0)?,
                    member_did: row.get(1)?,
                    display_name: row.get(2)?,
                    role: row.get(3)?,
                    joined_at: row.get(4)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query group members: {}", e)))?;

        let mut members = Vec::new();
        for row in rows {
            members.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read member: {}", e)))?);
        }

        Ok(members)
    }

    // ========================================================================
    // GROUP KEY OPERATIONS
    // ========================================================================

    /// Store a group encryption key
    pub fn store_group_key(
        &self,
        group_id: &str,
        key_version: i32,
        encrypted_key: &[u8],
        created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();

        conn.execute(
            "INSERT OR REPLACE INTO group_keys (group_id, key_version, encrypted_key, created_at)
             VALUES (?, ?, ?, ?)",
            params![group_id, key_version, encrypted_key, created_at],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to store group key: {}", e)))?;

        Ok(())
    }

    /// Get the latest group key version
    pub fn get_latest_group_key(&self, group_id: &str) -> Result<Option<GroupKeyRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT group_id, key_version, encrypted_key, created_at
             FROM group_keys WHERE group_id = ?
             ORDER BY key_version DESC LIMIT 1",
            params![group_id],
            |row| {
                Ok(GroupKeyRecord {
                    group_id: row.get(0)?,
                    key_version: row.get(1)?,
                    encrypted_key: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get group key: {}", e))),
        }
    }

    /// Get a specific group key version
    pub fn get_group_key(&self, group_id: &str, key_version: i32) -> Result<Option<GroupKeyRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT group_id, key_version, encrypted_key, created_at
             FROM group_keys WHERE group_id = ? AND key_version = ?",
            params![group_id, key_version],
            |row| {
                Ok(GroupKeyRecord {
                    group_id: row.get(0)?,
                    key_version: row.get(1)?,
                    encrypted_key: row.get(2)?,
                    created_at: row.get(3)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get group key: {}", e))),
        }
    }

    // ========================================================================
    // GROUP INVITE OPERATIONS
    // ========================================================================

    /// Store a group invite
    pub fn store_group_invite(&self, invite: &GroupInviteRecord) -> Result<()> {
        let conn = self.conn.lock();

        conn.execute(
            "INSERT OR REPLACE INTO group_invites
             (id, group_id, group_name, description, inviter_did, inviter_name,
              encrypted_group_key, nonce, members_json, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                invite.id,
                invite.group_id,
                invite.group_name,
                invite.description,
                invite.inviter_did,
                invite.inviter_name,
                invite.encrypted_group_key,
                invite.nonce,
                invite.members_json,
                invite.status,
                invite.created_at,
            ],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to store group invite: {}", e)))?;

        Ok(())
    }

    /// Get pending group invites
    pub fn get_pending_group_invites(&self) -> Result<Vec<GroupInviteRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, group_id, group_name, description, inviter_did, inviter_name,
                        encrypted_group_key, nonce, members_json, status, created_at
                 FROM group_invites WHERE status = 'pending'
                 ORDER BY created_at DESC",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(GroupInviteRecord {
                    id: row.get(0)?,
                    group_id: row.get(1)?,
                    group_name: row.get(2)?,
                    description: row.get(3)?,
                    inviter_did: row.get(4)?,
                    inviter_name: row.get(5)?,
                    encrypted_group_key: row.get(6)?,
                    nonce: row.get(7)?,
                    members_json: row.get(8)?,
                    status: row.get(9)?,
                    created_at: row.get(10)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query invites: {}", e)))?;

        let mut invites = Vec::new();
        for row in rows {
            invites.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read invite: {}", e)))?);
        }
        Ok(invites)
    }

    /// Get a group invite by ID
    pub fn get_group_invite(&self, id: &str) -> Result<Option<GroupInviteRecord>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT id, group_id, group_name, description, inviter_did, inviter_name,
                    encrypted_group_key, nonce, members_json, status, created_at
             FROM group_invites WHERE id = ?",
            params![id],
            |row| {
                Ok(GroupInviteRecord {
                    id: row.get(0)?,
                    group_id: row.get(1)?,
                    group_name: row.get(2)?,
                    description: row.get(3)?,
                    inviter_did: row.get(4)?,
                    inviter_name: row.get(5)?,
                    encrypted_group_key: row.get(6)?,
                    nonce: row.get(7)?,
                    members_json: row.get(8)?,
                    status: row.get(9)?,
                    created_at: row.get(10)?,
                })
            },
        );

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get invite: {}", e))),
        }
    }

    /// Update group invite status
    pub fn update_group_invite_status(&self, id: &str, status: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE group_invites SET status = ? WHERE id = ?",
                params![status, id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to update invite: {}", e)))?;

        Ok(rows > 0)
    }

    // ========================================================================
    // FRIEND REQUEST OPERATIONS
    // ========================================================================

    /// Store a friend request
    pub fn store_friend_request(&self, request: &FriendRequestRecord) -> Result<()> {
        let conn = self.conn.lock();

        conn.execute(
            "INSERT INTO friend_requests
             (id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, created_at, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                request.id,
                request.from_did,
                request.to_did,
                request.direction,
                request.message,
                request.from_signing_key,
                request.from_encryption_key,
                request.from_display_name,
                request.created_at,
                request.status,
            ],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to store friend request: {}", e)))?;

        Ok(())
    }

    /// Get pending friend requests
    pub fn get_pending_requests(&self, direction: &str) -> Result<Vec<FriendRequestRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, created_at, status
                 FROM friend_requests WHERE status = 'pending' AND direction = ?
                 ORDER BY created_at DESC",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map(params![direction], |row| {
                Ok(FriendRequestRecord {
                    id: row.get(0)?,
                    from_did: row.get(1)?,
                    to_did: row.get(2)?,
                    direction: row.get(3)?,
                    message: row.get(4)?,
                    from_signing_key: row.get(5)?,
                    from_encryption_key: row.get(6)?,
                    from_display_name: row.get(7)?,
                    created_at: row.get(8)?,
                    status: row.get(9)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query requests: {}", e)))?;

        let mut requests = Vec::new();
        for row in rows {
            requests.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read request: {}", e)))?);
        }

        Ok(requests)
    }

    /// Get a friend request by ID
    pub fn get_friend_request(&self, id: &str) -> Result<Option<FriendRequestRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, created_at, status
                 FROM friend_requests WHERE id = ?",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let mut rows = stmt
            .query_map(params![id], |row| {
                Ok(FriendRequestRecord {
                    id: row.get(0)?,
                    from_did: row.get(1)?,
                    to_did: row.get(2)?,
                    direction: row.get(3)?,
                    message: row.get(4)?,
                    from_signing_key: row.get(5)?,
                    from_encryption_key: row.get(6)?,
                    from_display_name: row.get(7)?,
                    created_at: row.get(8)?,
                    status: row.get(9)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query request: {}", e)))?;

        match rows.next() {
            Some(row) => Ok(Some(row.map_err(|e| Error::DatabaseError(format!("Failed to read request: {}", e)))?)),
            None => Ok(None),
        }
    }

    /// Update friend request status
    pub fn update_request_status(&self, id: &str, status: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "UPDATE friend_requests SET status = ? WHERE id = ?",
                params![status, id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to update request: {}", e)))?;

        Ok(rows > 0)
    }

    // ========================================================================
    // BLOCKED USERS OPERATIONS
    // ========================================================================

    /// Block a user
    pub fn block_user(&self, did: &str, reason: Option<&str>) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();

        conn.execute(
            "INSERT OR REPLACE INTO blocked_users (did, blocked_at, reason) VALUES (?, ?, ?)",
            params![did, now, reason],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to block user: {}", e)))?;

        Ok(())
    }

    /// Unblock a user
    pub fn unblock_user(&self, did: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute("DELETE FROM blocked_users WHERE did = ?", params![did])
            .map_err(|e| Error::DatabaseError(format!("Failed to unblock user: {}", e)))?;

        Ok(rows > 0)
    }

    /// Check if a user is blocked
    pub fn is_blocked(&self, did: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let count: i32 = conn
            .query_row(
                "SELECT COUNT(*) FROM blocked_users WHERE did = ?",
                params![did],
                |row| row.get(0),
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to check blocked status: {}", e)))?;

        Ok(count > 0)
    }

    // ========================================================================
    // SETTINGS OPERATIONS
    // ========================================================================

    /// Get a setting value
    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock();

        let result = conn.query_row(
            "SELECT value FROM settings WHERE key = ?",
            params![key],
            |row| row.get(0),
        );

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get setting: {}", e))),
        }
    }

    /// Set a setting value
    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();

        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
            params![key, value, now],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to set setting: {}", e)))?;

        Ok(())
    }

    /// Delete a setting
    pub fn delete_setting(&self, key: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute("DELETE FROM settings WHERE key = ?", params![key])
            .map_err(|e| Error::DatabaseError(format!("Failed to delete setting: {}", e)))?;

        Ok(rows > 0)
    }

    // ── Plugin KV Storage ─────────────────────────────────────────────────

    /// Get a plugin KV value
    pub fn plugin_kv_get(&self, plugin_id: &str, key: &str) -> Result<Option<String>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT value FROM plugin_kv WHERE plugin_id = ? AND key = ?",
            params![plugin_id, key],
            |row| row.get(0),
        );
        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get plugin KV: {}", e))),
        }
    }

    /// Set a plugin KV value (upsert)
    pub fn plugin_kv_set(&self, plugin_id: &str, key: &str, value: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();
        conn.execute(
            "INSERT OR REPLACE INTO plugin_kv (plugin_id, key, value, updated_at) VALUES (?, ?, ?, ?)",
            params![plugin_id, key, value, now],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to set plugin KV: {}", e)))?;
        Ok(())
    }

    /// Delete a plugin KV entry
    pub fn plugin_kv_delete(&self, plugin_id: &str, key: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let rows = conn
            .execute(
                "DELETE FROM plugin_kv WHERE plugin_id = ? AND key = ?",
                params![plugin_id, key],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to delete plugin KV: {}", e)))?;
        Ok(rows > 0)
    }

    /// List plugin KV keys (optionally filtered by prefix)
    pub fn plugin_kv_list(&self, plugin_id: &str, prefix: &str) -> Result<Vec<String>> {
        let conn = self.conn.lock();
        if prefix.is_empty() {
            let mut stmt = conn
                .prepare("SELECT key FROM plugin_kv WHERE plugin_id = ? ORDER BY key")
                .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;
            let rows = stmt
                .query_map(params![plugin_id], |row| row.get(0))
                .map_err(|e| Error::DatabaseError(format!("Failed to query plugin KV keys: {}", e)))?;
            let mut keys = Vec::new();
            for row in rows {
                keys.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?);
            }
            Ok(keys)
        } else {
            let like_pattern = format!("{}%", prefix);
            let mut stmt = conn
                .prepare("SELECT key FROM plugin_kv WHERE plugin_id = ? AND key LIKE ? ORDER BY key")
                .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;
            let rows = stmt
                .query_map(params![plugin_id, like_pattern], |row| row.get(0))
                .map_err(|e| Error::DatabaseError(format!("Failed to query plugin KV keys: {}", e)))?;
            let mut keys = Vec::new();
            for row in rows {
                keys.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?);
            }
            Ok(keys)
        }
    }

    /// Delete all KV entries for a plugin
    pub fn plugin_kv_delete_all(&self, plugin_id: &str) -> Result<usize> {
        let conn = self.conn.lock();
        let rows = conn
            .execute("DELETE FROM plugin_kv WHERE plugin_id = ?", params![plugin_id])
            .map_err(|e| Error::DatabaseError(format!("Failed to delete plugin KV: {}", e)))?;
        Ok(rows)
    }

    // ── Plugin Bundle Storage ─────────────────────────────────────────────

    /// Save a plugin bundle (upsert)
    pub fn plugin_bundle_save(&self, plugin_id: &str, manifest: &str, bundle: &str) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp();
        conn.execute(
            "INSERT OR REPLACE INTO plugin_bundles (plugin_id, manifest, bundle, installed_at) VALUES (?, ?, ?, ?)",
            params![plugin_id, manifest, bundle, now],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to save plugin bundle: {}", e)))?;
        Ok(())
    }

    /// Load a plugin bundle by ID
    pub fn plugin_bundle_load(&self, plugin_id: &str) -> Result<Option<PluginBundleRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT plugin_id, manifest, bundle, installed_at FROM plugin_bundles WHERE plugin_id = ?",
            params![plugin_id],
            |row| {
                Ok(PluginBundleRecord {
                    plugin_id: row.get(0)?,
                    manifest: row.get(1)?,
                    bundle: row.get(2)?,
                    installed_at: row.get(3)?,
                })
            },
        );
        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to load plugin bundle: {}", e))),
        }
    }

    /// Delete a plugin bundle and its KV data
    pub fn plugin_bundle_delete(&self, plugin_id: &str) -> Result<bool> {
        let _ = self.plugin_kv_delete_all(plugin_id);
        let conn = self.conn.lock();
        let rows = conn
            .execute("DELETE FROM plugin_bundles WHERE plugin_id = ?", params![plugin_id])
            .map_err(|e| Error::DatabaseError(format!("Failed to delete plugin bundle: {}", e)))?;
        Ok(rows > 0)
    }

    /// List all installed plugin bundles (manifests only, no bundle code)
    pub fn plugin_bundle_list(&self) -> Result<Vec<PluginBundleRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare("SELECT plugin_id, manifest, '', installed_at FROM plugin_bundles ORDER BY installed_at DESC")
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;
        let rows = stmt
            .query_map([], |row| {
                Ok(PluginBundleRecord {
                    plugin_id: row.get(0)?,
                    manifest: row.get(1)?,
                    bundle: row.get(2)?,
                    installed_at: row.get(3)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to list plugin bundles: {}", e)))?;
        let mut bundles = Vec::new();
        for row in rows {
            bundles.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?);
        }
        Ok(bundles)
    }

    // ========================================================================
    // CALL HISTORY OPERATIONS
    // ========================================================================

    /// Store a new call record
    #[allow(clippy::too_many_arguments)]
    pub fn store_call_record(
        &self,
        id: &str,
        conversation_id: &str,
        call_type: &str,
        direction: &str,
        status: &str,
        participants: &str,
        started_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        let now = crate::time::now_timestamp_millis();

        conn.execute(
            "INSERT INTO call_history (id, conversation_id, call_type, direction, status, participants, started_at, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                id,
                conversation_id,
                call_type,
                direction,
                status,
                participants,
                started_at,
                now,
            ],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to store call record: {}", e)))?;

        Ok(())
    }

    /// End a call record by updating its status, ended_at, and duration_ms
    pub fn end_call_record(
        &self,
        id: &str,
        status: &str,
        ended_at: i64,
        duration_ms: i64,
    ) -> Result<bool> {
        let conn = self.conn.lock();

        let rows = conn
            .execute(
                "UPDATE call_history SET status = ?, ended_at = ?, duration_ms = ? WHERE id = ?",
                params![status, ended_at, duration_ms, id],
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to end call record: {}", e)))?;

        Ok(rows > 0)
    }

    /// Get call history for a specific conversation
    pub fn get_call_history(
        &self,
        conversation_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CallHistoryRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, conversation_id, call_type, direction, status, participants, started_at, ended_at, duration_ms, created_at
                 FROM call_history WHERE conversation_id = ?
                 ORDER BY started_at DESC LIMIT ? OFFSET ?",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map(params![conversation_id, limit as i64, offset as i64], |row| {
                Ok(CallHistoryRecord {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    call_type: row.get(2)?,
                    direction: row.get(3)?,
                    status: row.get(4)?,
                    participants: row.get(5)?,
                    started_at: row.get(6)?,
                    ended_at: row.get(7)?,
                    duration_ms: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query call history: {}", e)))?;

        let mut records = Vec::new();
        for row in rows {
            records.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read call record: {}", e)))?);
        }

        Ok(records)
    }

    /// Get all call history across all conversations
    pub fn get_all_call_history(
        &self,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CallHistoryRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn
            .prepare(
                "SELECT id, conversation_id, call_type, direction, status, participants, started_at, ended_at, duration_ms, created_at
                 FROM call_history
                 ORDER BY started_at DESC LIMIT ? OFFSET ?",
            )
            .map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt
            .query_map(params![limit as i64, offset as i64], |row| {
                Ok(CallHistoryRecord {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    call_type: row.get(2)?,
                    direction: row.get(3)?,
                    status: row.get(4)?,
                    participants: row.get(5)?,
                    started_at: row.get(6)?,
                    ended_at: row.get(7)?,
                    duration_ms: row.get(8)?,
                    created_at: row.get(9)?,
                })
            })
            .map_err(|e| Error::DatabaseError(format!("Failed to query all call history: {}", e)))?;

        let mut records = Vec::new();
        for row in rows {
            records.push(row.map_err(|e| Error::DatabaseError(format!("Failed to read call record: {}", e)))?);
        }

        Ok(records)
    }
}

// ============================================================================
// RECORD TYPES
// ============================================================================

/// A friend record from the database
#[derive(Debug, Clone)]
pub struct FriendRecord {
    /// Database ID
    pub id: i64,
    /// DID
    pub did: String,
    /// Display name
    pub display_name: String,
    /// Signing key (hex)
    pub signing_key: String,
    /// Encryption key (hex)
    pub encryption_key: String,
    /// Status message
    pub status: Option<String>,
    /// Created timestamp
    pub created_at: i64,
    /// Updated timestamp
    pub updated_at: i64,
}

/// A conversation record from the database
#[derive(Debug, Clone)]
pub struct ConversationRecord {
    /// Conversation ID
    pub id: String,
    /// Friend's DID (None for group conversations)
    pub friend_did: Option<String>,
    /// Conversation type: "dm" or "group"
    pub conv_type: String,
    /// Group ID (None for DM conversations)
    pub group_id: Option<String>,
    /// Created timestamp
    pub created_at: i64,
    /// Last message timestamp
    pub last_message_at: Option<i64>,
    /// Unread message count
    pub unread_count: i32,
}

/// A message record from the database
#[derive(Debug, Clone)]
pub struct MessageRecord {
    /// Message ID
    pub id: String,
    /// Conversation ID
    pub conversation_id: String,
    /// Sender's DID
    pub sender_did: String,
    /// Encrypted content (hex)
    pub content_encrypted: String,
    /// Nonce (hex)
    pub nonce: String,
    /// Timestamp
    pub timestamp: i64,
    /// Delivered flag
    pub delivered: bool,
    /// Read flag
    pub read: bool,
}

/// A group record from the database
#[derive(Debug, Clone)]
pub struct GroupRecord {
    /// Group ID
    pub id: String,
    /// Group name
    pub name: String,
    /// Group description
    pub description: Option<String>,
    /// Group avatar (auto-generated or custom)
    pub avatar: Option<String>,
    /// DID of the creator
    pub created_by: String,
    /// Created timestamp
    pub created_at: i64,
    /// Updated timestamp
    pub updated_at: i64,
}

/// A group member record from the database
#[derive(Debug, Clone)]
pub struct GroupMemberRecord {
    /// Group ID
    pub group_id: String,
    /// Member's DID
    pub member_did: String,
    /// Member's display name
    pub display_name: Option<String>,
    /// Role: "admin" or "member"
    pub role: String,
    /// When the member joined
    pub joined_at: i64,
}

/// A group encryption key record
#[derive(Debug, Clone)]
pub struct GroupKeyRecord {
    /// Group ID
    pub group_id: String,
    /// Key version number (increments on rotation)
    pub key_version: i32,
    /// Encrypted key data (encrypted with owner's key-wrapping key)
    pub encrypted_key: Vec<u8>,
    /// When the key was created
    pub created_at: i64,
}

/// A group invite record
#[derive(Debug, Clone)]
pub struct GroupInviteRecord {
    /// Invite ID
    pub id: String,
    /// Group ID being invited to
    pub group_id: String,
    /// Group name
    pub group_name: String,
    /// Group description
    pub description: Option<String>,
    /// DID of the person who invited
    pub inviter_did: String,
    /// Display name of the inviter
    pub inviter_name: String,
    /// Encrypted group key for this invitee
    pub encrypted_group_key: String,
    /// Nonce for key decryption
    pub nonce: String,
    /// JSON list of current members
    pub members_json: String,
    /// Status: "pending", "accepted", "declined"
    pub status: String,
    /// Created timestamp
    pub created_at: i64,
}

/// A reaction record from the database
#[derive(Debug, Clone)]
pub struct ReactionRecord {
    /// Reaction ID
    pub id: String,
    /// Message ID
    pub message_id: String,
    /// User's DID
    pub user_did: String,
    /// Emoji string
    pub emoji: String,
    /// Created timestamp
    pub created_at: i64,
}

/// A friend request record from the database
#[derive(Debug, Clone)]
pub struct FriendRequestRecord {
    /// Request ID
    pub id: String,
    /// Sender's DID
    pub from_did: String,
    /// Recipient's DID
    pub to_did: String,
    /// Direction: "incoming" or "outgoing"
    pub direction: String,
    /// Optional message
    pub message: Option<String>,
    /// Sender's signing key (hex)
    pub from_signing_key: Option<String>,
    /// Sender's encryption key (hex)
    pub from_encryption_key: Option<String>,
    /// Sender's display name
    pub from_display_name: Option<String>,
    /// Created timestamp
    pub created_at: i64,
    /// Status
    pub status: String,
}

/// A plugin bundle record from the database
#[derive(Debug, Clone)]
pub struct PluginBundleRecord {
    /// Plugin ID (reverse-domain, e.g. "com.example.translator")
    pub plugin_id: String,
    /// JSON-encoded plugin manifest
    pub manifest: String,
    /// JS bundle source code
    pub bundle: String,
    /// When the plugin was installed
    pub installed_at: i64,
}

/// A call history record from the database
#[derive(Debug, Clone)]
pub struct CallHistoryRecord {
    /// Call ID
    pub id: String,
    /// Conversation ID
    pub conversation_id: String,
    /// Call type: "voice" or "video"
    pub call_type: String,
    /// Direction: "incoming" or "outgoing"
    pub direction: String,
    /// Status: "active", "completed", "missed", "declined", "cancelled"
    pub status: String,
    /// JSON array of participant DIDs
    pub participants: String,
    /// When the call started (Unix timestamp ms)
    pub started_at: i64,
    /// When the call ended (Unix timestamp ms)
    pub ended_at: Option<i64>,
    /// Call duration in milliseconds
    pub duration_ms: Option<i64>,
    /// When the record was created (Unix timestamp ms)
    pub created_at: i64,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_database_creation() {
        let db = Database::open(None).await.unwrap();
        assert!(db.get_all_friends().unwrap().is_empty());
    }

    #[tokio::test]
    async fn test_friend_operations() {
        let db = Database::open(None).await.unwrap();

        // Add a friend
        let signing_key = [1u8; 32];
        let encryption_key = [2u8; 32];
        let id = db
            .add_friend(
                "did:key:z6MkTest",
                "Alice",
                &signing_key,
                &encryption_key,
                Some("Available"),
            )
            .unwrap();
        assert!(id > 0);

        // Get the friend
        let friend = db.get_friend("did:key:z6MkTest").unwrap().unwrap();
        assert_eq!(friend.display_name, "Alice");
        assert_eq!(friend.status, Some("Available".to_string()));

        // Update the friend
        db.update_friend("did:key:z6MkTest", Some("Alice Updated"), None)
            .unwrap();
        let friend = db.get_friend("did:key:z6MkTest").unwrap().unwrap();
        assert_eq!(friend.display_name, "Alice Updated");

        // Get all friends
        let friends = db.get_all_friends().unwrap();
        assert_eq!(friends.len(), 1);

        // Remove the friend
        let removed = db.remove_friend("did:key:z6MkTest").unwrap();
        assert!(removed);

        // Verify removal
        let friend = db.get_friend("did:key:z6MkTest").unwrap();
        assert!(friend.is_none());
    }

    #[tokio::test]
    async fn test_conversation_operations() {
        let db = Database::open(None).await.unwrap();

        // Add a friend first
        let signing_key = [1u8; 32];
        let encryption_key = [2u8; 32];
        db.add_friend("did:key:z6MkTest", "Alice", &signing_key, &encryption_key, None)
            .unwrap();

        // Create conversation
        db.create_conversation("conv-1", "did:key:z6MkTest").unwrap();

        // Get conversation
        let conv = db.get_conversation("conv-1").unwrap().unwrap();
        assert_eq!(conv.friend_did, Some("did:key:z6MkTest".to_string()));
        assert_eq!(conv.conv_type, "dm");
        assert_eq!(conv.unread_count, 0);

        // Get by friend
        let conv = db
            .get_conversation_by_friend("did:key:z6MkTest")
            .unwrap()
            .unwrap();
        assert_eq!(conv.id, "conv-1");
    }

    #[tokio::test]
    async fn test_message_operations() {
        let db = Database::open(None).await.unwrap();

        // Setup
        let signing_key = [1u8; 32];
        let encryption_key = [2u8; 32];
        db.add_friend("did:key:z6MkTest", "Alice", &signing_key, &encryption_key, None)
            .unwrap();
        db.create_conversation("conv-1", "did:key:z6MkTest").unwrap();

        // Store messages
        let content = b"encrypted message content";
        let nonce = [0u8; 12];

        db.store_message("msg-1", "conv-1", "did:key:z6MkMe", content, &nonce, 1000)
            .unwrap();
        db.store_message("msg-2", "conv-1", "did:key:z6MkTest", content, &nonce, 2000)
            .unwrap();

        // Get messages
        let messages = db.get_messages("conv-1", 10, 0).unwrap();
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].id, "msg-1"); // Chronological order
        assert_eq!(messages[1].id, "msg-2");

        // Check conversation was updated
        let conv = db.get_conversation("conv-1").unwrap().unwrap();
        assert_eq!(conv.last_message_at, Some(2000));
    }

    #[tokio::test]
    async fn test_settings() {
        let db = Database::open(None).await.unwrap();

        // Set a setting
        db.set_setting("theme", "dark").unwrap();

        // Get the setting
        let value = db.get_setting("theme").unwrap();
        assert_eq!(value, Some("dark".to_string()));

        // Update the setting
        db.set_setting("theme", "light").unwrap();
        let value = db.get_setting("theme").unwrap();
        assert_eq!(value, Some("light".to_string()));

        // Delete the setting
        let deleted = db.delete_setting("theme").unwrap();
        assert!(deleted);

        // Verify deletion
        let value = db.get_setting("theme").unwrap();
        assert!(value.is_none());
    }

    #[tokio::test]
    async fn test_blocked_users() {
        let db = Database::open(None).await.unwrap();

        // Block a user
        db.block_user("did:key:z6MkBad", Some("Spam")).unwrap();

        // Check blocked status
        assert!(db.is_blocked("did:key:z6MkBad").unwrap());
        assert!(!db.is_blocked("did:key:z6MkGood").unwrap());

        // Unblock
        let unblocked = db.unblock_user("did:key:z6MkBad").unwrap();
        assert!(unblocked);
        assert!(!db.is_blocked("did:key:z6MkBad").unwrap());
    }

    #[tokio::test]
    async fn test_store_and_get_call_history() {
        let db = Database::open(None).await.unwrap();

        // Setup: create a friend and conversation
        let signing_key = [1u8; 32];
        let encryption_key = [2u8; 32];
        db.add_friend("did:key:z6MkTest", "Alice", &signing_key, &encryption_key, None)
            .unwrap();
        db.create_conversation("conv-1", "did:key:z6MkTest").unwrap();

        // Store a call record
        db.store_call_record(
            "call-1",
            "conv-1",
            "voice",
            "outgoing",
            "active",
            "[\"did:key:z6MkTest\"]",
            1000,
        )
        .unwrap();

        // Store another call record
        db.store_call_record(
            "call-2",
            "conv-1",
            "video",
            "incoming",
            "active",
            "[\"did:key:z6MkTest\"]",
            2000,
        )
        .unwrap();

        // Get call history for the conversation
        let history = db.get_call_history("conv-1", 10, 0).unwrap();
        assert_eq!(history.len(), 2);
        // Ordered by started_at DESC
        assert_eq!(history[0].id, "call-2");
        assert_eq!(history[1].id, "call-1");
        assert_eq!(history[0].call_type, "video");
        assert_eq!(history[1].call_type, "voice");
        assert_eq!(history[0].direction, "incoming");
        assert_eq!(history[1].direction, "outgoing");
        assert_eq!(history[0].status, "active");
        assert_eq!(history[1].participants, "[\"did:key:z6MkTest\"]");
    }

    #[tokio::test]
    async fn test_end_call_record() {
        let db = Database::open(None).await.unwrap();

        // Setup
        let signing_key = [1u8; 32];
        let encryption_key = [2u8; 32];
        db.add_friend("did:key:z6MkTest", "Alice", &signing_key, &encryption_key, None)
            .unwrap();
        db.create_conversation("conv-1", "did:key:z6MkTest").unwrap();

        // Store a call record
        db.store_call_record(
            "call-1",
            "conv-1",
            "voice",
            "outgoing",
            "active",
            "[]",
            1000,
        )
        .unwrap();

        // End the call
        let updated = db.end_call_record("call-1", "completed", 6000, 5000).unwrap();
        assert!(updated);

        // Verify the update
        let history = db.get_call_history("conv-1", 10, 0).unwrap();
        assert_eq!(history.len(), 1);
        assert_eq!(history[0].status, "completed");
        assert_eq!(history[0].ended_at, Some(6000));
        assert_eq!(history[0].duration_ms, Some(5000));
    }

    #[tokio::test]
    async fn test_end_call_record_not_found() {
        let db = Database::open(None).await.unwrap();

        // Ending a non-existent call should return false
        let updated = db.end_call_record("nonexistent", "completed", 6000, 5000).unwrap();
        assert!(!updated);
    }

    #[tokio::test]
    async fn test_get_all_call_history() {
        let db = Database::open(None).await.unwrap();

        // Setup: two conversations
        let signing_key = [1u8; 32];
        let encryption_key = [2u8; 32];
        db.add_friend("did:key:z6MkAlice", "Alice", &signing_key, &encryption_key, None)
            .unwrap();
        db.add_friend("did:key:z6MkBob", "Bob", &signing_key, &encryption_key, None)
            .unwrap();
        db.create_conversation("conv-1", "did:key:z6MkAlice").unwrap();
        db.create_conversation("conv-2", "did:key:z6MkBob").unwrap();

        // Store calls across different conversations
        db.store_call_record("call-1", "conv-1", "voice", "outgoing", "completed", "[]", 1000)
            .unwrap();
        db.store_call_record("call-2", "conv-2", "video", "incoming", "completed", "[]", 2000)
            .unwrap();
        db.store_call_record("call-3", "conv-1", "voice", "incoming", "missed", "[]", 3000)
            .unwrap();

        // Get all call history
        let all_history = db.get_all_call_history(10, 0).unwrap();
        assert_eq!(all_history.len(), 3);
        // Ordered by started_at DESC
        assert_eq!(all_history[0].id, "call-3");
        assert_eq!(all_history[1].id, "call-2");
        assert_eq!(all_history[2].id, "call-1");

        // Test with limit
        let limited = db.get_all_call_history(2, 0).unwrap();
        assert_eq!(limited.len(), 2);

        // Test with offset
        let offset_history = db.get_all_call_history(10, 1).unwrap();
        assert_eq!(offset_history.len(), 2);
        assert_eq!(offset_history[0].id, "call-2");

        // Get history for single conversation
        let conv1_history = db.get_call_history("conv-1", 10, 0).unwrap();
        assert_eq!(conv1_history.len(), 2);
        let conv2_history = db.get_call_history("conv-2", 10, 0).unwrap();
        assert_eq!(conv2_history.len(), 1);
    }
}
