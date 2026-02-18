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
                if v < 6 {
                    tracing::info!("Running migration v5 → v6 (communities)");
                    conn.execute_batch(schema::MIGRATE_V5_TO_V6)
                        .map_err(|e| Error::DatabaseError(format!("Migration v5→v6 failed: {}", e)))?;
                }
                if v < 7 {
                    tracing::info!("Running migration v6 → v7 (timeouts, thread followers, member status, notifications)");
                    conn.execute_batch(schema::MIGRATE_V6_TO_V7)
                        .map_err(|e| Error::DatabaseError(format!("Migration v6→v7 failed: {}", e)))?;
                }
                if v < 8 {
                    tracing::info!("Running migration v7 → v8 (categories)");
                    conn.execute_batch(schema::MIGRATE_V7_TO_V8)
                        .map_err(|e| Error::DatabaseError(format!("Migration v7→v8 failed: {}", e)))?;
                }
                if v < 9 {
                    tracing::info!("Running migration v8 → v9 (file chunks, manifests, DM files)");
                    conn.execute_batch(schema::MIGRATE_V8_TO_V9)
                        .map_err(|e| Error::DatabaseError(format!("Migration v8→v9 failed: {}", e)))?;
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

    // ========================================================================
    // COMMUNITY OPERATIONS
    // ========================================================================

    /// Create a community record
    pub fn create_community_record(
        &self,
        id: &str,
        name: &str,
        description: Option<&str>,
        owner_did: &str,
        created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO communities (id, name, description, owner_did, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)",
            params![id, name, description, owner_did, created_at, created_at],
        )
        .map_err(|e| Error::DatabaseError(format!("Failed to create community: {}", e)))?;
        Ok(())
    }

    /// Get a community by ID
    pub fn get_community(&self, id: &str) -> Result<Option<CommunityRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, name, description, icon_url, banner_url, splash_url, accent_color, custom_css, owner_did, vanity_url, created_at, updated_at
             FROM communities WHERE id = ?",
            params![id],
            |row| Ok(CommunityRecord {
                id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
                icon_url: row.get(3)?, banner_url: row.get(4)?, splash_url: row.get(5)?,
                accent_color: row.get(6)?, custom_css: row.get(7)?, owner_did: row.get(8)?,
                vanity_url: row.get(9)?, created_at: row.get(10)?, updated_at: row.get(11)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(format!("Failed to get community: {}", e))),
        }
    }

    /// Get communities a member belongs to
    pub fn get_communities_for_member(&self, member_did: &str) -> Result<Vec<CommunityRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT c.id, c.name, c.description, c.icon_url, c.banner_url, c.splash_url, c.accent_color, c.custom_css, c.owner_did, c.vanity_url, c.created_at, c.updated_at
             FROM communities c
             INNER JOIN community_members cm ON c.id = cm.community_id
             WHERE cm.member_did = ?
             ORDER BY c.name",
        ).map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt.query_map(params![member_did], |row| Ok(CommunityRecord {
            id: row.get(0)?, name: row.get(1)?, description: row.get(2)?,
            icon_url: row.get(3)?, banner_url: row.get(4)?, splash_url: row.get(5)?,
            accent_color: row.get(6)?, custom_css: row.get(7)?, owner_did: row.get(8)?,
            vanity_url: row.get(9)?, created_at: row.get(10)?, updated_at: row.get(11)?,
        })).map_err(|e| Error::DatabaseError(format!("Failed to query communities: {}", e)))?;

        let mut communities = Vec::new();
        for row in rows {
            communities.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?);
        }
        Ok(communities)
    }

    /// Update a community
    pub fn update_community(&self, id: &str, name: Option<&str>, description: Option<&str>, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        if let Some(name) = name {
            conn.execute(
                "UPDATE communities SET name = ?, description = ?, updated_at = ? WHERE id = ?",
                params![name, description, updated_at, id],
            ).map_err(|e| Error::DatabaseError(format!("Failed to update community: {}", e)))?;
        } else {
            conn.execute(
                "UPDATE communities SET description = ?, updated_at = ? WHERE id = ?",
                params![description, updated_at, id],
            ).map_err(|e| Error::DatabaseError(format!("Failed to update community: {}", e)))?;
        }
        Ok(())
    }

    /// Update community owner
    pub fn update_community_owner(&self, id: &str, new_owner_did: &str, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE communities SET owner_did = ?, updated_at = ? WHERE id = ?",
            params![new_owner_did, updated_at, id],
        ).map_err(|e| Error::DatabaseError(format!("Failed to update community owner: {}", e)))?;
        Ok(())
    }

    /// Delete a community (CASCADE will clean up children)
    pub fn delete_community(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM communities WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(format!("Failed to delete community: {}", e)))?;
        Ok(())
    }

    // ── Spaces ───────────────────────────────────────────────────────────

    /// Create a community space
    pub fn create_community_space(&self, id: &str, community_id: &str, name: &str, position: i32, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_spaces (id, community_id, name, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            params![id, community_id, name, position, created_at, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create space: {}", e)))?;
        Ok(())
    }

    /// Get spaces for a community
    pub fn get_community_spaces(&self, community_id: &str) -> Result<Vec<CommunitySpaceRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, name, position, created_at, updated_at FROM community_spaces WHERE community_id = ? ORDER BY position",
        ).map_err(|e| Error::DatabaseError(format!("Failed to prepare query: {}", e)))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunitySpaceRecord {
            id: row.get(0)?, community_id: row.get(1)?, name: row.get(2)?,
            position: row.get(3)?, created_at: row.get(4)?, updated_at: row.get(5)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut spaces = Vec::new();
        for row in rows { spaces.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(spaces)
    }

    /// Get a single space by ID
    pub fn get_community_space(&self, id: &str) -> Result<Option<CommunitySpaceRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, community_id, name, position, created_at, updated_at FROM community_spaces WHERE id = ?",
            params![id],
            |row| Ok(CommunitySpaceRecord {
                id: row.get(0)?, community_id: row.get(1)?, name: row.get(2)?,
                position: row.get(3)?, created_at: row.get(4)?, updated_at: row.get(5)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Update a space name
    pub fn update_community_space(&self, id: &str, name: &str, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE community_spaces SET name = ?, updated_at = ? WHERE id = ?", params![name, updated_at, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Update a space position
    pub fn update_community_space_position(&self, id: &str, position: i32, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE community_spaces SET position = ?, updated_at = ? WHERE id = ?", params![position, updated_at, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete a space
    pub fn delete_community_space(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_spaces WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Channels ─────────────────────────────────────────────────────────

    /// Create a community channel
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_channel(
        &self, id: &str, community_id: &str, space_id: &str, name: &str,
        channel_type: &str, topic: Option<&str>, position: i32, created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_channels (id, community_id, space_id, name, type, topic, position, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, space_id, name, channel_type, topic, position, created_at, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create channel: {}", e)))?;
        Ok(())
    }

    /// Get channels for a community
    pub fn get_community_channels(&self, community_id: &str) -> Result<Vec<CommunityChannelRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, space_id, name, type, topic, position, slow_mode_seconds, e2ee_enabled, pin_limit, created_at, updated_at
             FROM community_channels WHERE community_id = ? ORDER BY position",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityChannelRecord {
            id: row.get(0)?, community_id: row.get(1)?, space_id: row.get(2)?,
            name: row.get(3)?, channel_type: row.get(4)?, topic: row.get(5)?,
            position: row.get(6)?, slow_mode_seconds: row.get(7)?,
            e2ee_enabled: row.get::<_, i32>(8)? != 0, pin_limit: row.get(9)?,
            created_at: row.get(10)?, updated_at: row.get(11)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut channels = Vec::new();
        for row in rows { channels.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(channels)
    }

    /// Get channels by space
    pub fn get_community_channels_by_space(&self, space_id: &str) -> Result<Vec<CommunityChannelRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, space_id, name, type, topic, position, slow_mode_seconds, e2ee_enabled, pin_limit, created_at, updated_at
             FROM community_channels WHERE space_id = ? ORDER BY position",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![space_id], |row| Ok(CommunityChannelRecord {
            id: row.get(0)?, community_id: row.get(1)?, space_id: row.get(2)?,
            name: row.get(3)?, channel_type: row.get(4)?, topic: row.get(5)?,
            position: row.get(6)?, slow_mode_seconds: row.get(7)?,
            e2ee_enabled: row.get::<_, i32>(8)? != 0, pin_limit: row.get(9)?,
            created_at: row.get(10)?, updated_at: row.get(11)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut channels = Vec::new();
        for row in rows { channels.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(channels)
    }

    /// Get a single channel by ID
    pub fn get_community_channel(&self, id: &str) -> Result<Option<CommunityChannelRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, community_id, space_id, name, type, topic, position, slow_mode_seconds, e2ee_enabled, pin_limit, created_at, updated_at
             FROM community_channels WHERE id = ?",
            params![id],
            |row| Ok(CommunityChannelRecord {
                id: row.get(0)?, community_id: row.get(1)?, space_id: row.get(2)?,
                name: row.get(3)?, channel_type: row.get(4)?, topic: row.get(5)?,
                position: row.get(6)?, slow_mode_seconds: row.get(7)?,
                e2ee_enabled: row.get::<_, i32>(8)? != 0, pin_limit: row.get(9)?,
                created_at: row.get(10)?, updated_at: row.get(11)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Update channel name/topic
    pub fn update_community_channel(&self, id: &str, name: Option<&str>, topic: Option<&str>, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        if let Some(name) = name {
            conn.execute(
                "UPDATE community_channels SET name = ?, topic = ?, updated_at = ? WHERE id = ?",
                params![name, topic, updated_at, id],
            ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        } else {
            conn.execute(
                "UPDATE community_channels SET topic = ?, updated_at = ? WHERE id = ?",
                params![topic, updated_at, id],
            ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        }
        Ok(())
    }

    /// Update channel slow mode
    pub fn update_channel_slow_mode(&self, id: &str, seconds: i32, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE community_channels SET slow_mode_seconds = ?, updated_at = ? WHERE id = ?", params![seconds, updated_at, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Update channel E2EE setting
    pub fn update_channel_e2ee(&self, id: &str, enabled: bool, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE community_channels SET e2ee_enabled = ?, updated_at = ? WHERE id = ?", params![enabled as i32, updated_at, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Update channel position
    pub fn update_channel_position(&self, id: &str, position: i32, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE community_channels SET position = ?, updated_at = ? WHERE id = ?", params![position, updated_at, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete a channel
    pub fn delete_community_channel(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_channels WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Roles ────────────────────────────────────────────────────────────

    /// Create a community role
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_role(
        &self, id: &str, community_id: &str, name: &str, color: Option<&str>,
        position: i32, hoisted: bool, mentionable: bool, is_preset: bool,
        permissions_bitfield: &str, created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_roles (id, community_id, name, color, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, name, color, position, hoisted as i32, mentionable as i32, is_preset as i32, permissions_bitfield, created_at, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create role: {}", e)))?;
        Ok(())
    }

    /// Get all roles for a community
    pub fn get_community_roles(&self, community_id: &str) -> Result<Vec<CommunityRoleRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, name, color, icon, badge, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at
             FROM community_roles WHERE community_id = ? ORDER BY position DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityRoleRecord {
            id: row.get(0)?, community_id: row.get(1)?, name: row.get(2)?,
            color: row.get(3)?, icon: row.get(4)?, badge: row.get(5)?,
            position: row.get(6)?, hoisted: row.get::<_, i32>(7)? != 0,
            mentionable: row.get::<_, i32>(8)? != 0, is_preset: row.get::<_, i32>(9)? != 0,
            permissions_bitfield: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut roles = Vec::new();
        for row in rows { roles.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(roles)
    }

    /// Get the owner role for a community
    pub fn get_owner_role(&self, community_id: &str) -> Result<Option<CommunityRoleRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, community_id, name, color, icon, badge, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at
             FROM community_roles WHERE community_id = ? AND is_preset = 1 AND name = 'Owner'",
            params![community_id],
            |row| Ok(CommunityRoleRecord {
                id: row.get(0)?, community_id: row.get(1)?, name: row.get(2)?,
                color: row.get(3)?, icon: row.get(4)?, badge: row.get(5)?,
                position: row.get(6)?, hoisted: row.get::<_, i32>(7)? != 0,
                mentionable: row.get::<_, i32>(8)? != 0, is_preset: row.get::<_, i32>(9)? != 0,
                permissions_bitfield: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Get the default member role for a community
    pub fn get_member_role(&self, community_id: &str) -> Result<Option<CommunityRoleRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, community_id, name, color, icon, badge, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at
             FROM community_roles WHERE community_id = ? AND is_preset = 1 AND name = 'Member'",
            params![community_id],
            |row| Ok(CommunityRoleRecord {
                id: row.get(0)?, community_id: row.get(1)?, name: row.get(2)?,
                color: row.get(3)?, icon: row.get(4)?, badge: row.get(5)?,
                position: row.get(6)?, hoisted: row.get::<_, i32>(7)? != 0,
                mentionable: row.get::<_, i32>(8)? != 0, is_preset: row.get::<_, i32>(9)? != 0,
                permissions_bitfield: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Assign a role to a member
    pub fn assign_community_role(&self, community_id: &str, member_did: &str, role_id: &str, assigned_at: i64, assigned_by: Option<&str>) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO community_member_roles (community_id, member_did, role_id, assigned_at, assigned_by) VALUES (?, ?, ?, ?, ?)",
            params![community_id, member_did, role_id, assigned_at, assigned_by],
        ).map_err(|e| Error::DatabaseError(format!("Failed to assign role: {}", e)))?;
        Ok(())
    }

    /// Unassign a role from a member
    pub fn unassign_community_role(&self, community_id: &str, member_did: &str, role_id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM community_member_roles WHERE community_id = ? AND member_did = ? AND role_id = ?",
            params![community_id, member_did, role_id],
        ).map_err(|e| Error::DatabaseError(format!("Failed to unassign role: {}", e)))?;
        Ok(())
    }

    /// Get roles assigned to a member in a community
    pub fn get_member_community_roles(&self, community_id: &str, member_did: &str) -> Result<Vec<CommunityRoleRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT r.id, r.community_id, r.name, r.color, r.icon, r.badge, r.position, r.hoisted, r.mentionable, r.is_preset, r.permissions_bitfield, r.created_at, r.updated_at
             FROM community_roles r
             INNER JOIN community_member_roles mr ON r.id = mr.role_id
             WHERE mr.community_id = ? AND mr.member_did = ?
             ORDER BY r.position DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id, member_did], |row| Ok(CommunityRoleRecord {
            id: row.get(0)?, community_id: row.get(1)?, name: row.get(2)?,
            color: row.get(3)?, icon: row.get(4)?, badge: row.get(5)?,
            position: row.get(6)?, hoisted: row.get::<_, i32>(7)? != 0,
            mentionable: row.get::<_, i32>(8)? != 0, is_preset: row.get::<_, i32>(9)? != 0,
            permissions_bitfield: row.get(10)?, created_at: row.get(11)?, updated_at: row.get(12)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut roles = Vec::new();
        for row in rows { roles.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(roles)
    }

    // ── Members ──────────────────────────────────────────────────────────

    /// Add a member to a community
    pub fn add_community_member(&self, community_id: &str, member_did: &str, joined_at: i64, nickname: Option<&str>) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO community_members (community_id, member_did, nickname, joined_at) VALUES (?, ?, ?, ?)",
            params![community_id, member_did, nickname, joined_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to add member: {}", e)))?;
        Ok(())
    }

    /// Remove a member from a community
    pub fn remove_community_member(&self, community_id: &str, member_did: &str) -> Result<()> {
        let conn = self.conn.lock();
        // Also remove role assignments
        conn.execute(
            "DELETE FROM community_member_roles WHERE community_id = ? AND member_did = ?",
            params![community_id, member_did],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        conn.execute(
            "DELETE FROM community_members WHERE community_id = ? AND member_did = ?",
            params![community_id, member_did],
        ).map_err(|e| Error::DatabaseError(format!("Failed to remove member: {}", e)))?;
        Ok(())
    }

    /// Get a specific community member
    pub fn get_community_member(&self, community_id: &str, member_did: &str) -> Result<Option<CommunityMemberRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT community_id, member_did, nickname, avatar_url, bio, joined_at FROM community_members WHERE community_id = ? AND member_did = ?",
            params![community_id, member_did],
            |row| Ok(CommunityMemberRecord {
                community_id: row.get(0)?, member_did: row.get(1)?, nickname: row.get(2)?,
                avatar_url: row.get(3)?, bio: row.get(4)?, joined_at: row.get(5)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Get all members of a community
    pub fn get_community_members(&self, community_id: &str) -> Result<Vec<CommunityMemberRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT community_id, member_did, nickname, avatar_url, bio, joined_at FROM community_members WHERE community_id = ? ORDER BY joined_at",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityMemberRecord {
            community_id: row.get(0)?, member_did: row.get(1)?, nickname: row.get(2)?,
            avatar_url: row.get(3)?, bio: row.get(4)?, joined_at: row.get(5)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut members = Vec::new();
        for row in rows { members.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(members)
    }

    /// Update a member's community profile
    pub fn update_community_member_profile(&self, community_id: &str, member_did: &str, nickname: Option<&str>, avatar_url: Option<&str>, bio: Option<&str>) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE community_members SET nickname = ?, avatar_url = ?, bio = ? WHERE community_id = ? AND member_did = ?",
            params![nickname, avatar_url, bio, community_id, member_did],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Bans ─────────────────────────────────────────────────────────────

    /// Create a ban record
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_ban(&self, community_id: &str, banned_did: &str, reason: Option<&str>, banned_by: &str, device_fingerprint: Option<&str>, expires_at: Option<i64>, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR REPLACE INTO community_bans (community_id, banned_did, reason, banned_by, device_fingerprint, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![community_id, banned_did, reason, banned_by, device_fingerprint, expires_at, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create ban: {}", e)))?;
        Ok(())
    }

    /// Check if a user is banned
    pub fn is_community_banned(&self, community_id: &str, did: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM community_bans WHERE community_id = ? AND banned_did = ?",
            params![community_id, did],
            |row| row.get(0),
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(count > 0)
    }

    /// Remove a ban
    pub fn remove_community_ban(&self, community_id: &str, banned_did: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM community_bans WHERE community_id = ? AND banned_did = ?",
            params![community_id, banned_did],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get all bans for a community
    pub fn get_community_bans(&self, community_id: &str) -> Result<Vec<CommunityBanRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT community_id, banned_did, reason, banned_by, device_fingerprint, expires_at, created_at FROM community_bans WHERE community_id = ? ORDER BY created_at DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityBanRecord {
            community_id: row.get(0)?, banned_did: row.get(1)?, reason: row.get(2)?,
            banned_by: row.get(3)?, device_fingerprint: row.get(4)?,
            expires_at: row.get(5)?, created_at: row.get(6)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut bans = Vec::new();
        for row in rows { bans.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(bans)
    }

    // ── Invites ──────────────────────────────────────────────────────────

    /// Create a community invite
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_invite(&self, id: &str, community_id: &str, code: &str, vanity: bool, creator_did: &str, max_uses: Option<i32>, expires_at: Option<i64>, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_invites (id, community_id, code, vanity, creator_did, max_uses, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, code, vanity as i32, creator_did, max_uses, expires_at, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create invite: {}", e)))?;
        Ok(())
    }

    /// Get an invite by code
    pub fn get_community_invite_by_code(&self, code: &str) -> Result<Option<CommunityInviteRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, community_id, code, vanity, creator_did, max_uses, use_count, expires_at, created_at FROM community_invites WHERE code = ?",
            params![code],
            |row| Ok(CommunityInviteRecord {
                id: row.get(0)?, community_id: row.get(1)?, code: row.get(2)?,
                vanity: row.get::<_, i32>(3)? != 0, creator_did: row.get(4)?,
                max_uses: row.get(5)?, use_count: row.get(6)?,
                expires_at: row.get(7)?, created_at: row.get(8)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Get an invite by ID
    pub fn get_community_invite(&self, id: &str) -> Result<Option<CommunityInviteRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, community_id, code, vanity, creator_did, max_uses, use_count, expires_at, created_at FROM community_invites WHERE id = ?",
            params![id],
            |row| Ok(CommunityInviteRecord {
                id: row.get(0)?, community_id: row.get(1)?, code: row.get(2)?,
                vanity: row.get::<_, i32>(3)? != 0, creator_did: row.get(4)?,
                max_uses: row.get(5)?, use_count: row.get(6)?,
                expires_at: row.get(7)?, created_at: row.get(8)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Get all invites for a community
    pub fn get_community_invites(&self, community_id: &str) -> Result<Vec<CommunityInviteRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, code, vanity, creator_did, max_uses, use_count, expires_at, created_at FROM community_invites WHERE community_id = ? ORDER BY created_at DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityInviteRecord {
            id: row.get(0)?, community_id: row.get(1)?, code: row.get(2)?,
            vanity: row.get::<_, i32>(3)? != 0, creator_did: row.get(4)?,
            max_uses: row.get(5)?, use_count: row.get(6)?,
            expires_at: row.get(7)?, created_at: row.get(8)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut invites = Vec::new();
        for row in rows { invites.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(invites)
    }

    /// Increment invite use count
    pub fn increment_invite_use_count(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE community_invites SET use_count = use_count + 1 WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete an invite
    pub fn delete_community_invite(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_invites WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Audit Log ────────────────────────────────────────────────────────

    /// Insert an audit log entry
    #[allow(clippy::too_many_arguments)]
    pub fn insert_audit_log(
        &self, id: &str, community_id: &str, actor_did: &str, action_type: &str,
        target_type: Option<&str>, target_id: Option<&str>, metadata_json: Option<&str>, created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_audit_log (id, community_id, actor_did, action_type, target_type, target_id, metadata_json, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, actor_did, action_type, target_type, target_id, metadata_json, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to insert audit log: {}", e)))?;
        Ok(())
    }

    /// Get audit log entries for a community
    pub fn get_audit_log(&self, community_id: &str, limit: usize, offset: usize) -> Result<Vec<CommunityAuditLogRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, actor_did, action_type, target_type, target_id, metadata_json, content_detail, created_at
             FROM community_audit_log WHERE community_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id, limit as i64, offset as i64], |row| Ok(CommunityAuditLogRecord {
            id: row.get(0)?, community_id: row.get(1)?, actor_did: row.get(2)?,
            action_type: row.get(3)?, target_type: row.get(4)?, target_id: row.get(5)?,
            metadata_json: row.get(6)?, content_detail: row.get(7)?, created_at: row.get(8)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut entries = Vec::new();
        for row in rows { entries.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(entries)
    }

    // ── Community Messages (Phase 2) ────────────────────────────────────

    /// Store a community message
    #[allow(clippy::too_many_arguments)]
    pub fn store_community_message(
        &self, id: &str, channel_id: &str, sender_did: &str,
        content_encrypted: Option<&[u8]>, content_plaintext: Option<&str>,
        nonce: Option<&str>, key_version: Option<i32>, is_e2ee: bool,
        reply_to_id: Option<&str>, thread_id: Option<&str>,
        has_embed: bool, has_attachment: bool, content_warning: Option<&str>,
        created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_messages (id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee as i32, reply_to_id, thread_id, has_embed as i32, has_attachment as i32, content_warning, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to store community message: {}", e)))?;
        Ok(())
    }

    /// Get messages for a channel
    pub fn get_community_messages(&self, channel_id: &str, limit: usize, before_timestamp: Option<i64>) -> Result<Vec<CommunityMessageRecord>> {
        let conn = self.conn.lock();
        let (sql, params_vec): (&str, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(before) = before_timestamp {
            ("SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE channel_id = ? AND created_at < ? AND deleted_for_everyone = 0 ORDER BY created_at DESC LIMIT ?",
             vec![Box::new(channel_id.to_string()), Box::new(before), Box::new(limit as i64)])
        } else {
            ("SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE channel_id = ? AND deleted_for_everyone = 0 ORDER BY created_at DESC LIMIT ?",
             vec![Box::new(channel_id.to_string()), Box::new(limit as i64)])
        };

        let mut stmt = conn.prepare(sql).map_err(|e| Error::DatabaseError(e.to_string()))?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), |row| Ok(CommunityMessageRecord {
            id: row.get(0)?, channel_id: row.get(1)?, sender_did: row.get(2)?,
            content_encrypted: row.get(3)?, content_plaintext: row.get(4)?,
            nonce: row.get(5)?, key_version: row.get(6)?,
            is_e2ee: row.get::<_, i32>(7)? != 0, reply_to_id: row.get(8)?,
            thread_id: row.get(9)?, has_embed: row.get::<_, i32>(10)? != 0,
            has_attachment: row.get::<_, i32>(11)? != 0, content_warning: row.get(12)?,
            edited_at: row.get(13)?, deleted_for_everyone: row.get::<_, i32>(14)? != 0,
            created_at: row.get(15)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut messages = Vec::new();
        for row in rows { messages.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        messages.reverse(); // Chronological order
        Ok(messages)
    }

    /// Get a single community message
    pub fn get_community_message(&self, id: &str) -> Result<Option<CommunityMessageRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE id = ?",
            params![id],
            |row| Ok(CommunityMessageRecord {
                id: row.get(0)?, channel_id: row.get(1)?, sender_did: row.get(2)?,
                content_encrypted: row.get(3)?, content_plaintext: row.get(4)?,
                nonce: row.get(5)?, key_version: row.get(6)?,
                is_e2ee: row.get::<_, i32>(7)? != 0, reply_to_id: row.get(8)?,
                thread_id: row.get(9)?, has_embed: row.get::<_, i32>(10)? != 0,
                has_attachment: row.get::<_, i32>(11)? != 0, content_warning: row.get(12)?,
                edited_at: row.get(13)?, deleted_for_everyone: row.get::<_, i32>(14)? != 0,
                created_at: row.get(15)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Edit a message (update plaintext content)
    pub fn edit_community_message(&self, id: &str, content_plaintext: Option<&str>, content_encrypted: Option<&[u8]>, nonce: Option<&str>, edited_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE community_messages SET content_plaintext = ?, content_encrypted = ?, nonce = ?, edited_at = ? WHERE id = ?",
            params![content_plaintext, content_encrypted, nonce, edited_at, id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Soft-delete a message (for everyone)
    pub fn delete_community_message_for_everyone(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE community_messages SET deleted_for_everyone = 1, content_plaintext = NULL, content_encrypted = NULL WHERE id = ?",
            params![id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete a message for a specific member only
    pub fn delete_community_message_for_me(&self, message_id: &str, member_did: &str, deleted_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO community_deleted_messages (message_id, member_did, deleted_at) VALUES (?, ?, ?)",
            params![message_id, member_did, deleted_at],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Reactions (Phase 2) ─────────────────────────────────────────────

    /// Add a reaction to a message
    pub fn add_community_reaction(&self, message_id: &str, member_did: &str, emoji: &str, is_custom: bool, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO community_reactions (message_id, member_did, emoji, is_custom, created_at) VALUES (?, ?, ?, ?, ?)",
            params![message_id, member_did, emoji, is_custom as i32, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to add reaction: {}", e)))?;
        Ok(())
    }

    /// Remove a reaction from a message
    pub fn remove_community_reaction(&self, message_id: &str, member_did: &str, emoji: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM community_reactions WHERE message_id = ? AND member_did = ? AND emoji = ?",
            params![message_id, member_did, emoji],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get all reactions for a message
    pub fn get_community_reactions(&self, message_id: &str) -> Result<Vec<CommunityReactionRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT message_id, member_did, emoji, is_custom, created_at FROM community_reactions WHERE message_id = ? ORDER BY created_at",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![message_id], |row| Ok(CommunityReactionRecord {
            message_id: row.get(0)?, member_did: row.get(1)?, emoji: row.get(2)?,
            is_custom: row.get::<_, i32>(3)? != 0, created_at: row.get(4)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut reactions = Vec::new();
        for row in rows { reactions.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(reactions)
    }

    // ── Read Receipts (Phase 2) ─────────────────────────────────────────

    /// Update a read receipt for a member in a channel
    pub fn update_read_receipt(&self, channel_id: &str, member_did: &str, last_read_message_id: &str, read_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR REPLACE INTO community_read_receipts (channel_id, member_did, last_read_message_id, read_at) VALUES (?, ?, ?, ?)",
            params![channel_id, member_did, last_read_message_id, read_at],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get read receipts for a channel
    pub fn get_read_receipts(&self, channel_id: &str) -> Result<Vec<CommunityReadReceiptRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT channel_id, member_did, last_read_message_id, read_at FROM community_read_receipts WHERE channel_id = ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![channel_id], |row| Ok(CommunityReadReceiptRecord {
            channel_id: row.get(0)?, member_did: row.get(1)?,
            last_read_message_id: row.get(2)?, read_at: row.get(3)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut receipts = Vec::new();
        for row in rows { receipts.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(receipts)
    }

    // ── Pins (Phase 2 / Phase 10) ──────────────────────────────────────

    /// Pin a message
    pub fn pin_community_message(&self, channel_id: &str, message_id: &str, pinned_by: &str, pinned_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO community_pins (channel_id, message_id, pinned_by, pinned_at) VALUES (?, ?, ?, ?)",
            params![channel_id, message_id, pinned_by, pinned_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to pin message: {}", e)))?;
        Ok(())
    }

    /// Unpin a message
    pub fn unpin_community_message(&self, channel_id: &str, message_id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM community_pins WHERE channel_id = ? AND message_id = ?",
            params![channel_id, message_id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get pinned messages for a channel
    pub fn get_community_pins(&self, channel_id: &str) -> Result<Vec<CommunityPinRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT channel_id, message_id, pinned_by, pinned_at FROM community_pins WHERE channel_id = ? ORDER BY pinned_at DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![channel_id], |row| Ok(CommunityPinRecord {
            channel_id: row.get(0)?, message_id: row.get(1)?,
            pinned_by: row.get(2)?, pinned_at: row.get(3)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut pins = Vec::new();
        for row in rows { pins.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(pins)
    }

    /// Get pin count for a channel
    pub fn get_community_pin_count(&self, channel_id: &str) -> Result<i32> {
        let conn = self.conn.lock();
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM community_pins WHERE channel_id = ?",
            params![channel_id], |row| row.get(0),
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(count)
    }

    // ── Threads (Phase 3) ───────────────────────────────────────────────

    /// Create a thread from a parent message
    pub fn create_community_thread(&self, id: &str, channel_id: &str, parent_message_id: &str, name: Option<&str>, created_by: &str, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_threads (id, channel_id, parent_message_id, name, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            params![id, channel_id, parent_message_id, name, created_by, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create thread: {}", e)))?;
        // Link the parent message to the thread
        conn.execute(
            "UPDATE community_messages SET thread_id = ? WHERE id = ?",
            params![id, parent_message_id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get a thread by ID
    pub fn get_community_thread(&self, id: &str) -> Result<Option<CommunityThreadRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, channel_id, parent_message_id, name, created_by, message_count, last_message_at, created_at FROM community_threads WHERE id = ?",
            params![id],
            |row| Ok(CommunityThreadRecord {
                id: row.get(0)?, channel_id: row.get(1)?, parent_message_id: row.get(2)?,
                name: row.get(3)?, created_by: row.get(4)?, message_count: row.get(5)?,
                last_message_at: row.get(6)?, created_at: row.get(7)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Get all threads in a channel
    pub fn get_community_threads(&self, channel_id: &str) -> Result<Vec<CommunityThreadRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, channel_id, parent_message_id, name, created_by, message_count, last_message_at, created_at FROM community_threads WHERE channel_id = ? ORDER BY last_message_at DESC NULLS LAST, created_at DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![channel_id], |row| Ok(CommunityThreadRecord {
            id: row.get(0)?, channel_id: row.get(1)?, parent_message_id: row.get(2)?,
            name: row.get(3)?, created_by: row.get(4)?, message_count: row.get(5)?,
            last_message_at: row.get(6)?, created_at: row.get(7)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut threads = Vec::new();
        for row in rows { threads.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(threads)
    }

    /// Increment thread message count and update last_message_at
    pub fn increment_thread_message_count(&self, thread_id: &str, timestamp: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE community_threads SET message_count = message_count + 1, last_message_at = ? WHERE id = ?",
            params![timestamp, thread_id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Channel Permission Overrides (Phase 4) ─────────────────────────

    /// Set a channel permission override
    pub fn set_channel_permission_override(
        &self, id: &str, channel_id: &str, target_type: &str, target_id: &str,
        allow_bitfield: &str, deny_bitfield: &str,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR REPLACE INTO channel_permission_overrides (id, channel_id, target_type, target_id, allow_bitfield, deny_bitfield) VALUES (?, ?, ?, ?, ?, ?)",
            params![id, channel_id, target_type, target_id, allow_bitfield, deny_bitfield],
        ).map_err(|e| Error::DatabaseError(format!("Failed to set permission override: {}", e)))?;
        Ok(())
    }

    /// Get all permission overrides for a channel
    pub fn get_channel_permission_overrides(&self, channel_id: &str) -> Result<Vec<ChannelPermissionOverrideRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, channel_id, target_type, target_id, allow_bitfield, deny_bitfield FROM channel_permission_overrides WHERE channel_id = ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![channel_id], |row| Ok(ChannelPermissionOverrideRecord {
            id: row.get(0)?, channel_id: row.get(1)?, target_type: row.get(2)?,
            target_id: row.get(3)?, allow_bitfield: row.get(4)?, deny_bitfield: row.get(5)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut overrides = Vec::new();
        for row in rows { overrides.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(overrides)
    }

    /// Remove a channel permission override
    pub fn remove_channel_permission_override(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM channel_permission_overrides WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Update a role's permissions
    pub fn update_community_role_permissions(&self, role_id: &str, permissions_bitfield: &str, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE community_roles SET permissions_bitfield = ?, updated_at = ? WHERE id = ?",
            params![permissions_bitfield, updated_at, role_id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Update a role's properties (name, color, etc)
    #[allow(clippy::too_many_arguments)]
    pub fn update_community_role(
        &self, role_id: &str, name: Option<&str>, color: Option<&str>,
        hoisted: Option<bool>, mentionable: Option<bool>, position: Option<i32>, updated_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        // Build dynamic update query
        let mut updates = vec!["updated_at = ?"];
        let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(updated_at)];

        if let Some(n) = name { updates.push("name = ?"); param_values.push(Box::new(n.to_string())); }
        if let Some(c) = color { updates.push("color = ?"); param_values.push(Box::new(c.to_string())); }
        if let Some(h) = hoisted { updates.push("hoisted = ?"); param_values.push(Box::new(h as i32)); }
        if let Some(m) = mentionable { updates.push("mentionable = ?"); param_values.push(Box::new(m as i32)); }
        if let Some(p) = position { updates.push("position = ?"); param_values.push(Box::new(p)); }

        let sql = format!("UPDATE community_roles SET {} WHERE id = ?", updates.join(", "));
        param_values.push(Box::new(role_id.to_string()));

        let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
        conn.execute(&sql, params_refs.as_slice())
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete a custom role (not presets)
    pub fn delete_community_role(&self, role_id: &str) -> Result<()> {
        let conn = self.conn.lock();
        // Remove role assignments first
        conn.execute("DELETE FROM community_member_roles WHERE role_id = ?", params![role_id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        // Remove channel overrides for this role
        conn.execute("DELETE FROM channel_permission_overrides WHERE target_type = 'role' AND target_id = ?", params![role_id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        conn.execute("DELETE FROM community_roles WHERE id = ? AND is_preset = 0", params![role_id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Warnings (Phase 5) ──────────────────────────────────────────────

    /// Create a warning
    pub fn create_community_warning(&self, id: &str, community_id: &str, member_did: &str, reason: &str, warned_by: &str, expires_at: Option<i64>, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_warnings (id, community_id, member_did, reason, warned_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, member_did, reason, warned_by, expires_at, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create warning: {}", e)))?;
        Ok(())
    }

    /// Get warnings for a member in a community
    pub fn get_community_member_warnings(&self, community_id: &str, member_did: &str) -> Result<Vec<CommunityWarningRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, member_did, reason, warned_by, expires_at, created_at FROM community_warnings WHERE community_id = ? AND member_did = ? ORDER BY created_at DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id, member_did], |row| Ok(CommunityWarningRecord {
            id: row.get(0)?, community_id: row.get(1)?, member_did: row.get(2)?,
            reason: row.get(3)?, warned_by: row.get(4)?, expires_at: row.get(5)?, created_at: row.get(6)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut warnings = Vec::new();
        for row in rows { warnings.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(warnings)
    }

    /// Get all warnings for a community
    pub fn get_community_warnings(&self, community_id: &str, limit: usize, offset: usize) -> Result<Vec<CommunityWarningRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, member_did, reason, warned_by, expires_at, created_at FROM community_warnings WHERE community_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id, limit as i64, offset as i64], |row| Ok(CommunityWarningRecord {
            id: row.get(0)?, community_id: row.get(1)?, member_did: row.get(2)?,
            reason: row.get(3)?, warned_by: row.get(4)?, expires_at: row.get(5)?, created_at: row.get(6)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut warnings = Vec::new();
        for row in rows { warnings.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(warnings)
    }

    /// Get active (non-expired) warning count for a member
    pub fn get_active_warning_count(&self, community_id: &str, member_did: &str, now: i64) -> Result<i32> {
        let conn = self.conn.lock();
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM community_warnings WHERE community_id = ? AND member_did = ? AND (expires_at IS NULL OR expires_at > ?)",
            params![community_id, member_did, now],
            |row| row.get(0),
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(count)
    }

    /// Delete a warning
    pub fn delete_community_warning(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_warnings WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Files (Phase 7) ─────────────────────────────────────────────────

    /// Store a file record
    #[allow(clippy::too_many_arguments)]
    pub fn store_community_file(
        &self, id: &str, channel_id: &str, folder_id: Option<&str>,
        filename: &str, description: Option<&str>, file_size: i64,
        mime_type: Option<&str>, storage_chunks_json: &str, uploaded_by: &str, created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_files (id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to store file: {}", e)))?;
        Ok(())
    }

    /// Get files in a channel
    pub fn get_community_files(&self, channel_id: &str, folder_id: Option<&str>, limit: usize, offset: usize) -> Result<Vec<CommunityFileRecord>> {
        let conn = self.conn.lock();
        let (sql, params_vec): (&str, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(fid) = folder_id {
            ("SELECT id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, created_at FROM community_files WHERE channel_id = ? AND folder_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
             vec![Box::new(channel_id.to_string()), Box::new(fid.to_string()), Box::new(limit as i64), Box::new(offset as i64)])
        } else {
            ("SELECT id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, created_at FROM community_files WHERE channel_id = ? AND folder_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?",
             vec![Box::new(channel_id.to_string()), Box::new(limit as i64), Box::new(offset as i64)])
        };

        let mut stmt = conn.prepare(sql).map_err(|e| Error::DatabaseError(e.to_string()))?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), |row| Ok(CommunityFileRecord {
            id: row.get(0)?, channel_id: row.get(1)?, folder_id: row.get(2)?,
            filename: row.get(3)?, description: row.get(4)?, file_size: row.get(5)?,
            mime_type: row.get(6)?, storage_chunks_json: row.get(7)?, uploaded_by: row.get(8)?,
            version: row.get(9)?, previous_version_id: None, download_count: row.get(10)?, created_at: row.get(11)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut files = Vec::new();
        for row in rows { files.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(files)
    }

    /// Get a file by ID
    pub fn get_community_file(&self, id: &str) -> Result<Option<CommunityFileRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, created_at FROM community_files WHERE id = ?",
            params![id],
            |row| Ok(CommunityFileRecord {
                id: row.get(0)?, channel_id: row.get(1)?, folder_id: row.get(2)?,
                filename: row.get(3)?, description: row.get(4)?, file_size: row.get(5)?,
                mime_type: row.get(6)?, storage_chunks_json: row.get(7)?, uploaded_by: row.get(8)?,
                version: row.get(9)?, previous_version_id: None, download_count: row.get(10)?, created_at: row.get(11)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Increment download count
    pub fn increment_file_download_count(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE community_files SET download_count = download_count + 1 WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete a file
    pub fn delete_community_file(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_files WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Create a folder
    pub fn create_community_file_folder(&self, id: &str, channel_id: &str, parent_folder_id: Option<&str>, name: &str, created_by: &str, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_file_folders (id, channel_id, parent_folder_id, name, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            params![id, channel_id, parent_folder_id, name, created_by, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create folder: {}", e)))?;
        Ok(())
    }

    /// Get folders in a channel (optionally within a parent folder)
    pub fn get_community_file_folders(&self, channel_id: &str, parent_folder_id: Option<&str>) -> Result<Vec<CommunityFileFolderRecord>> {
        let conn = self.conn.lock();
        let (sql, params_vec): (&str, Vec<Box<dyn rusqlite::types::ToSql>>) = if let Some(pid) = parent_folder_id {
            ("SELECT id, channel_id, parent_folder_id, name, created_by, created_at FROM community_file_folders WHERE channel_id = ? AND parent_folder_id = ? ORDER BY name",
             vec![Box::new(channel_id.to_string()), Box::new(pid.to_string())])
        } else {
            ("SELECT id, channel_id, parent_folder_id, name, created_by, created_at FROM community_file_folders WHERE channel_id = ? AND parent_folder_id IS NULL ORDER BY name",
             vec![Box::new(channel_id.to_string())])
        };

        let mut stmt = conn.prepare(sql).map_err(|e| Error::DatabaseError(e.to_string()))?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), |row| Ok(CommunityFileFolderRecord {
            id: row.get(0)?, channel_id: row.get(1)?, parent_folder_id: row.get(2)?,
            name: row.get(3)?, created_by: row.get(4)?, created_at: row.get(5)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut folders = Vec::new();
        for row in rows { folders.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(folders)
    }

    /// Delete a folder (cascades to subfolders and contained files)
    pub fn delete_community_file_folder(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_file_folders WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Emoji (Phase 9) ─────────────────────────────────────────────────

    /// Create a custom emoji
    pub fn create_community_emoji(&self, id: &str, community_id: &str, name: &str, image_url: &str, animated: bool, uploaded_by: &str, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_emoji (id, community_id, name, image_url, animated, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, name, image_url, animated as i32, uploaded_by, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create emoji: {}", e)))?;
        Ok(())
    }

    /// Get all emoji for a community
    pub fn get_community_emoji(&self, community_id: &str) -> Result<Vec<CommunityEmojiRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, name, image_url, animated, uploaded_by, created_at FROM community_emoji WHERE community_id = ? ORDER BY name",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityEmojiRecord {
            id: row.get(0)?, community_id: row.get(1)?, name: row.get(2)?,
            image_url: row.get(3)?, animated: row.get::<_, i32>(4)? != 0,
            uploaded_by: row.get(5)?, created_at: row.get(6)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut emojis = Vec::new();
        for row in rows { emojis.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(emojis)
    }

    /// Delete a custom emoji
    pub fn delete_community_emoji(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_emoji WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Create a custom sticker
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_sticker(&self, id: &str, community_id: &str, pack_id: Option<&str>, name: &str, image_url: &str, animated: bool, uploaded_by: &str, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_stickers (id, community_id, pack_id, name, image_url, animated, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, pack_id, name, image_url, animated as i32, uploaded_by, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create sticker: {}", e)))?;
        Ok(())
    }

    /// Get all stickers for a community
    pub fn get_community_stickers(&self, community_id: &str) -> Result<Vec<CommunityStickerRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, pack_id, name, image_url, animated, uploaded_by, created_at FROM community_stickers WHERE community_id = ? ORDER BY name",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityStickerRecord {
            id: row.get(0)?, community_id: row.get(1)?, pack_id: row.get(2)?,
            name: row.get(3)?, image_url: row.get(4)?, animated: row.get::<_, i32>(5)? != 0,
            uploaded_by: row.get(6)?, created_at: row.get(7)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut stickers = Vec::new();
        for row in rows { stickers.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(stickers)
    }

    /// Delete a custom sticker
    pub fn delete_community_sticker(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_stickers WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Webhooks (Phase 10) ─────────────────────────────────────────────

    /// Create a webhook
    pub fn create_community_webhook(&self, id: &str, channel_id: &str, name: &str, avatar_url: Option<&str>, token: &str, creator_did: &str, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_webhooks (id, channel_id, name, avatar_url, token, creator_did, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            params![id, channel_id, name, avatar_url, token, creator_did, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create webhook: {}", e)))?;
        Ok(())
    }

    /// Get webhooks for a channel
    pub fn get_community_webhooks(&self, channel_id: &str) -> Result<Vec<CommunityWebhookRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, channel_id, name, avatar_url, token, creator_did, created_at FROM community_webhooks WHERE channel_id = ? ORDER BY created_at",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![channel_id], |row| Ok(CommunityWebhookRecord {
            id: row.get(0)?, channel_id: row.get(1)?, name: row.get(2)?,
            avatar_url: row.get(3)?, token: row.get(4)?,
            creator_did: row.get(5)?, created_at: row.get(6)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut webhooks = Vec::new();
        for row in rows { webhooks.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(webhooks)
    }

    /// Get a webhook by ID
    pub fn get_community_webhook(&self, id: &str) -> Result<Option<CommunityWebhookRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, channel_id, name, avatar_url, token, creator_did, created_at FROM community_webhooks WHERE id = ?",
            params![id],
            |row| Ok(CommunityWebhookRecord {
                id: row.get(0)?, channel_id: row.get(1)?, name: row.get(2)?,
                avatar_url: row.get(3)?, token: row.get(4)?,
                creator_did: row.get(5)?, created_at: row.get(6)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Update a webhook
    pub fn update_community_webhook(&self, id: &str, name: Option<&str>, avatar_url: Option<&str>) -> Result<()> {
        let conn = self.conn.lock();
        if let Some(n) = name {
            conn.execute("UPDATE community_webhooks SET name = ? WHERE id = ?", params![n, id])
                .map_err(|e| Error::DatabaseError(e.to_string()))?;
        }
        if let Some(a) = avatar_url {
            conn.execute("UPDATE community_webhooks SET avatar_url = ? WHERE id = ?", params![a, id])
                .map_err(|e| Error::DatabaseError(e.to_string()))?;
        }
        Ok(())
    }

    /// Delete a webhook
    pub fn delete_community_webhook(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_webhooks WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Channel Keys (Phase 2 E2EE) ────────────────────────────────────

    /// Store a channel encryption key
    pub fn store_channel_key(&self, channel_id: &str, key_version: i32, encrypted_key: &[u8], created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_channel_keys (channel_id, key_version, encrypted_key, created_at) VALUES (?, ?, ?, ?)",
            params![channel_id, key_version, encrypted_key, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to store channel key: {}", e)))?;
        Ok(())
    }

    /// Get the latest key version for a channel
    pub fn get_latest_channel_key(&self, channel_id: &str) -> Result<Option<ChannelKeyRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT channel_id, key_version, encrypted_key, created_at FROM community_channel_keys WHERE channel_id = ? ORDER BY key_version DESC LIMIT 1",
            params![channel_id],
            |row| Ok(ChannelKeyRecord {
                channel_id: row.get(0)?, key_version: row.get(1)?,
                encrypted_key: row.get(2)?, created_at: row.get(3)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    // ── Boost Nodes (Phase 11) ──────────────────────────────────────────

    /// Create or update a boost node
    #[allow(clippy::too_many_arguments)]
    pub fn upsert_boost_node(
        &self, id: &str, owner_did: &str, node_type: &str, node_public_key: &str,
        name: &str, enabled: bool, max_storage_bytes: i64, max_bandwidth_mbps: i32,
        auto_start: bool, prioritized_communities: Option<&str>,
        pairing_token: Option<&str>, remote_address: Option<&str>, created_at: i64, updated_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR REPLACE INTO boost_nodes (id, owner_did, node_type, node_public_key, name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities, pairing_token, remote_address, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, owner_did, node_type, node_public_key, name, enabled as i32, max_storage_bytes, max_bandwidth_mbps, auto_start as i32, prioritized_communities, pairing_token, remote_address, created_at, updated_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to upsert boost node: {}", e)))?;
        Ok(())
    }

    /// Get all boost nodes for a user
    pub fn get_boost_nodes(&self, owner_did: &str) -> Result<Vec<BoostNodeRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, owner_did, node_type, node_public_key, name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities, pairing_token, remote_address, last_seen_at, created_at, updated_at FROM boost_nodes WHERE owner_did = ? ORDER BY created_at",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![owner_did], |row| Ok(BoostNodeRecord {
            id: row.get(0)?, owner_did: row.get(1)?, node_type: row.get(2)?,
            node_public_key: row.get(3)?, name: row.get(4)?,
            enabled: row.get::<_, i32>(5)? != 0, max_storage_bytes: row.get(6)?,
            max_bandwidth_mbps: row.get(7)?, auto_start: row.get::<_, i32>(8)? != 0,
            prioritized_communities: row.get(9)?, pairing_token: row.get(10)?,
            remote_address: row.get(11)?, last_seen_at: row.get(12)?,
            created_at: row.get(13)?, updated_at: row.get(14)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut nodes = Vec::new();
        for row in rows { nodes.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(nodes)
    }

    /// Get a boost node by ID
    pub fn get_boost_node(&self, id: &str) -> Result<Option<BoostNodeRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT id, owner_did, node_type, node_public_key, name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities, pairing_token, remote_address, last_seen_at, created_at, updated_at FROM boost_nodes WHERE id = ?",
            params![id],
            |row| Ok(BoostNodeRecord {
                id: row.get(0)?, owner_did: row.get(1)?, node_type: row.get(2)?,
                node_public_key: row.get(3)?, name: row.get(4)?,
                enabled: row.get::<_, i32>(5)? != 0, max_storage_bytes: row.get(6)?,
                max_bandwidth_mbps: row.get(7)?, auto_start: row.get::<_, i32>(8)? != 0,
                prioritized_communities: row.get(9)?, pairing_token: row.get(10)?,
                remote_address: row.get(11)?, last_seen_at: row.get(12)?,
                created_at: row.get(13)?, updated_at: row.get(14)?,
            }),
        );
        match result {
            Ok(r) => Ok(Some(r)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Update boost node configuration
    pub fn update_boost_node_config(
        &self, id: &str, name: Option<&str>, enabled: Option<bool>,
        max_storage_bytes: Option<i64>, max_bandwidth_mbps: Option<i32>,
        auto_start: Option<bool>, prioritized_communities: Option<&str>, updated_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        let mut updates = vec!["updated_at = ?"];
        let mut param_values: Vec<Box<dyn rusqlite::types::ToSql>> = vec![Box::new(updated_at)];

        if let Some(n) = name { updates.push("name = ?"); param_values.push(Box::new(n.to_string())); }
        if let Some(e) = enabled { updates.push("enabled = ?"); param_values.push(Box::new(e as i32)); }
        if let Some(s) = max_storage_bytes { updates.push("max_storage_bytes = ?"); param_values.push(Box::new(s)); }
        if let Some(b) = max_bandwidth_mbps { updates.push("max_bandwidth_mbps = ?"); param_values.push(Box::new(b)); }
        if let Some(a) = auto_start { updates.push("auto_start = ?"); param_values.push(Box::new(a as i32)); }
        if let Some(p) = prioritized_communities { updates.push("prioritized_communities = ?"); param_values.push(Box::new(p.to_string())); }

        let sql = format!("UPDATE boost_nodes SET {} WHERE id = ?", updates.join(", "));
        param_values.push(Box::new(id.to_string()));
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = param_values.iter().map(|p| p.as_ref()).collect();
        conn.execute(&sql, params_refs.as_slice())
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Update boost node last seen timestamp
    pub fn update_boost_node_last_seen(&self, id: &str, last_seen_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE boost_nodes SET last_seen_at = ? WHERE id = ?", params![last_seen_at, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete a boost node
    pub fn delete_boost_node(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM boost_nodes WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Community Branding Update (Phase 9) ────────────────────────────

    /// Update community branding fields
    #[allow(clippy::too_many_arguments)]
    pub fn update_community_branding(
        &self, id: &str, icon_url: Option<&str>, banner_url: Option<&str>,
        splash_url: Option<&str>, accent_color: Option<&str>, custom_css: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE communities SET icon_url = ?, banner_url = ?, splash_url = ?, accent_color = ?, custom_css = ?, updated_at = ? WHERE id = ?",
            params![icon_url, banner_url, splash_url, accent_color, custom_css, updated_at, id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Update community vanity URL
    pub fn update_community_vanity_url(&self, id: &str, vanity_url: &str, updated_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "UPDATE communities SET vanity_url = ?, updated_at = ? WHERE id = ?",
            params![vanity_url, updated_at, id],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Search (Phase 3) ────────────────────────────────────────────────

    /// Search messages in a channel by content (plaintext only)
    pub fn search_community_messages(&self, channel_id: &str, query: &str, limit: usize) -> Result<Vec<CommunityMessageRecord>> {
        let conn = self.conn.lock();
        let like_query = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE channel_id = ? AND content_plaintext LIKE ? AND deleted_for_everyone = 0 ORDER BY created_at DESC LIMIT ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![channel_id, like_query, limit as i64], |row| Ok(CommunityMessageRecord {
            id: row.get(0)?, channel_id: row.get(1)?, sender_did: row.get(2)?,
            content_encrypted: row.get(3)?, content_plaintext: row.get(4)?,
            nonce: row.get(5)?, key_version: row.get(6)?,
            is_e2ee: row.get::<_, i32>(7)? != 0, reply_to_id: row.get(8)?,
            thread_id: row.get(9)?, has_embed: row.get::<_, i32>(10)? != 0,
            has_attachment: row.get::<_, i32>(11)? != 0, content_warning: row.get(12)?,
            edited_at: row.get(13)?, deleted_for_everyone: row.get::<_, i32>(14)? != 0,
            created_at: row.get(15)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut messages = Vec::new();
        for row in rows { messages.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(messages)
    }

    // ── Timeouts (Phase 5 Gap Fill) ────────────────────────────────────

    /// Create a timeout for a member
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_timeout(
        &self, id: &str, community_id: &str, member_did: &str,
        reason: Option<&str>, timeout_type: &str, issued_by: &str,
        expires_at: i64, created_at: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_timeouts (id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get active timeouts for a member in a community
    pub fn get_active_timeouts(&self, community_id: &str, member_did: &str, now: i64) -> Result<Vec<CommunityTimeoutRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at FROM community_timeouts WHERE community_id = ? AND member_did = ? AND expires_at > ? ORDER BY created_at DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id, member_did, now], |row| Ok(CommunityTimeoutRecord {
            id: row.get(0)?, community_id: row.get(1)?, member_did: row.get(2)?,
            reason: row.get(3)?, timeout_type: row.get(4)?, issued_by: row.get(5)?,
            expires_at: row.get(6)?, created_at: row.get(7)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(results)
    }

    /// Get all timeouts for a community
    pub fn get_community_timeouts(&self, community_id: &str) -> Result<Vec<CommunityTimeoutRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at FROM community_timeouts WHERE community_id = ? ORDER BY created_at DESC",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id], |row| Ok(CommunityTimeoutRecord {
            id: row.get(0)?, community_id: row.get(1)?, member_did: row.get(2)?,
            reason: row.get(3)?, timeout_type: row.get(4)?, issued_by: row.get(5)?,
            expires_at: row.get(6)?, created_at: row.get(7)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(results)
    }

    /// Remove a timeout by ID
    pub fn remove_community_timeout(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_timeouts WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Check if a member has an active timeout of a given type
    pub fn is_member_timed_out(&self, community_id: &str, member_did: &str, timeout_type: &str, now: i64) -> Result<bool> {
        let conn = self.conn.lock();
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM community_timeouts WHERE community_id = ? AND member_did = ? AND timeout_type = ? AND expires_at > ?",
            params![community_id, member_did, timeout_type, now],
            |row| row.get(0),
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(count > 0)
    }

    // ── Thread Followers (Phase 3 Gap Fill) ────────────────────────────

    /// Follow a thread
    pub fn follow_thread(&self, thread_id: &str, member_did: &str, now: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR IGNORE INTO community_thread_followers (thread_id, member_did, followed_at) VALUES (?, ?, ?)",
            params![thread_id, member_did, now],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Unfollow a thread
    pub fn unfollow_thread(&self, thread_id: &str, member_did: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM community_thread_followers WHERE thread_id = ? AND member_did = ?",
            params![thread_id, member_did],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get followers of a thread
    pub fn get_thread_followers(&self, thread_id: &str) -> Result<Vec<CommunityThreadFollowerRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT thread_id, member_did, followed_at FROM community_thread_followers WHERE thread_id = ? ORDER BY followed_at",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![thread_id], |row| Ok(CommunityThreadFollowerRecord {
            thread_id: row.get(0)?, member_did: row.get(1)?, followed_at: row.get(2)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(results)
    }

    /// Check if a member is following a thread
    pub fn is_following_thread(&self, thread_id: &str, member_did: &str) -> Result<bool> {
        let conn = self.conn.lock();
        let count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM community_thread_followers WHERE thread_id = ? AND member_did = ?",
            params![thread_id, member_did],
            |row| row.get(0),
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(count > 0)
    }

    // ── Member Status (Phase 8 Gap Fill) ───────────────────────────────

    /// Set or update a member's custom status
    pub fn set_member_status(
        &self, community_id: &str, member_did: &str,
        status_text: Option<&str>, status_emoji: Option<&str>,
        expires_at: Option<i64>, now: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_member_status (community_id, member_did, status_text, status_emoji, expires_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(community_id, member_did) DO UPDATE SET status_text = excluded.status_text, status_emoji = excluded.status_emoji, expires_at = excluded.expires_at, updated_at = excluded.updated_at",
            params![community_id, member_did, status_text, status_emoji, expires_at, now],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get a member's custom status
    pub fn get_member_status(&self, community_id: &str, member_did: &str) -> Result<Option<CommunityMemberStatusRecord>> {
        let conn = self.conn.lock();
        let result = conn.query_row(
            "SELECT community_id, member_did, status_text, status_emoji, expires_at, updated_at FROM community_member_status WHERE community_id = ? AND member_did = ?",
            params![community_id, member_did],
            |row| Ok(CommunityMemberStatusRecord {
                community_id: row.get(0)?, member_did: row.get(1)?,
                status_text: row.get(2)?, status_emoji: row.get(3)?,
                expires_at: row.get(4)?, updated_at: row.get(5)?,
            }),
        );
        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Clear a member's custom status
    pub fn clear_member_status(&self, community_id: &str, member_did: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "DELETE FROM community_member_status WHERE community_id = ? AND member_did = ?",
            params![community_id, member_did],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Notification Settings (Phase 8 Gap Fill) ───────────────────────

    /// Upsert notification settings for a target (community, space, or channel)
    #[allow(clippy::too_many_arguments)]
    pub fn upsert_notification_setting(
        &self, id: &str, community_id: &str, member_did: &str,
        target_type: &str, target_id: &str,
        mute_until: Option<i64>, suppress_everyone: bool, suppress_roles: bool,
        level: &str, now: i64,
    ) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO community_notification_settings (id, community_id, member_did, target_type, target_id, mute_until, suppress_everyone, suppress_roles, level, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(community_id, member_did, target_type, target_id) DO UPDATE SET mute_until = excluded.mute_until, suppress_everyone = excluded.suppress_everyone, suppress_roles = excluded.suppress_roles, level = excluded.level, updated_at = excluded.updated_at",
            params![id, community_id, member_did, target_type, target_id, mute_until, suppress_everyone as i32, suppress_roles as i32, level, now],
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Get all notification settings for a member in a community
    pub fn get_notification_settings(&self, community_id: &str, member_did: &str) -> Result<Vec<CommunityNotificationSettingRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, community_id, member_did, target_type, target_id, mute_until, suppress_everyone, suppress_roles, level, updated_at FROM community_notification_settings WHERE community_id = ? AND member_did = ? ORDER BY target_type, target_id",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![community_id, member_did], |row| Ok(CommunityNotificationSettingRecord {
            id: row.get(0)?, community_id: row.get(1)?, member_did: row.get(2)?,
            target_type: row.get(3)?, target_id: row.get(4)?, mute_until: row.get(5)?,
            suppress_everyone: row.get::<_, i32>(6)? != 0, suppress_roles: row.get::<_, i32>(7)? != 0,
            level: row.get(8)?, updated_at: row.get(9)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(results)
    }

    /// Delete a notification setting
    pub fn delete_notification_setting(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM community_notification_settings WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── Advanced Search (Phase 3 Gap Fill) ─────────────────────────────

    /// Advanced search for community messages with filters
    #[allow(clippy::too_many_arguments)]
    pub fn search_community_messages_advanced(
        &self,
        channel_ids: &[String],
        query: Option<&str>,
        from_did: Option<&str>,
        before: Option<i64>,
        after: Option<i64>,
        has_file: Option<bool>,
        has_reaction: Option<bool>,
        is_pinned: Option<bool>,
        pinned_message_ids: &[String],
        limit: usize,
    ) -> Result<Vec<CommunityMessageRecord>> {
        let conn = self.conn.lock();

        let mut conditions = Vec::new();
        let mut param_values: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

        // Channel filter
        if !channel_ids.is_empty() {
            let placeholders: Vec<String> = channel_ids.iter().enumerate().map(|(_, _)| "?".to_string()).collect();
            conditions.push(format!("channel_id IN ({})", placeholders.join(",")));
            for cid in channel_ids {
                param_values.push(Box::new(cid.clone()));
            }
        }

        // Not deleted
        conditions.push("deleted_for_everyone = 0".to_string());

        // Content query (LIKE)
        if let Some(q) = query {
            conditions.push("content_plaintext LIKE ?".to_string());
            param_values.push(Box::new(format!("%{}%", q)));
        }

        // From user
        if let Some(did) = from_did {
            conditions.push("sender_did = ?".to_string());
            param_values.push(Box::new(did.to_string()));
        }

        // Before timestamp
        if let Some(ts) = before {
            conditions.push("created_at < ?".to_string());
            param_values.push(Box::new(ts));
        }

        // After timestamp
        if let Some(ts) = after {
            conditions.push("created_at > ?".to_string());
            param_values.push(Box::new(ts));
        }

        // Has file
        if let Some(true) = has_file {
            conditions.push("has_attachment = 1".to_string());
        }

        // Has reaction (we check via subquery)
        if let Some(true) = has_reaction {
            conditions.push("id IN (SELECT DISTINCT message_id FROM community_reactions)".to_string());
        }

        // Is pinned
        if let Some(true) = is_pinned {
            if !pinned_message_ids.is_empty() {
                let placeholders: Vec<String> = pinned_message_ids.iter().map(|_| "?".to_string()).collect();
                conditions.push(format!("id IN ({})", placeholders.join(",")));
                for pid in pinned_message_ids {
                    param_values.push(Box::new(pid.clone()));
                }
            } else {
                // No pinned messages exist, return empty
                return Ok(Vec::new());
            }
        }

        let where_clause = if conditions.is_empty() {
            "1=1".to_string()
        } else {
            conditions.join(" AND ")
        };

        let sql = format!(
            "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE {} ORDER BY created_at DESC LIMIT ?",
            where_clause
        );
        param_values.push(Box::new(limit as i64));

        let params: Vec<&dyn rusqlite::ToSql> = param_values.iter().map(|v| v.as_ref()).collect();
        let mut stmt = conn.prepare(&sql).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params.as_slice(), |row| Ok(CommunityMessageRecord {
            id: row.get(0)?, channel_id: row.get(1)?, sender_did: row.get(2)?,
            content_encrypted: row.get(3)?, content_plaintext: row.get(4)?,
            nonce: row.get(5)?, key_version: row.get(6)?,
            is_e2ee: row.get::<_, i32>(7)? != 0, reply_to_id: row.get(8)?,
            thread_id: row.get(9)?, has_embed: row.get::<_, i32>(10)? != 0,
            has_attachment: row.get::<_, i32>(11)? != 0, content_warning: row.get(12)?,
            edited_at: row.get(13)?, deleted_for_everyone: row.get::<_, i32>(14)? != 0,
            created_at: row.get(15)?,
        })).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(results)
    }

    /// Get all pinned message IDs for a channel (helper for search)
    pub fn get_pinned_message_ids(&self, channel_id: &str) -> Result<Vec<String>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT message_id FROM community_pins WHERE channel_id = ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![channel_id], |row| {
            row.get::<_, String>(0)
        }).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut results = Vec::new();
        for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(results)
    }

    /// Get thread messages directly (without filtering all channel messages)
    pub fn get_thread_messages_direct(
        &self, thread_id: &str, limit: usize, before_timestamp: Option<i64>,
    ) -> Result<Vec<CommunityMessageRecord>> {
        let conn = self.conn.lock();

        fn parse_msg_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<CommunityMessageRecord> {
            Ok(CommunityMessageRecord {
                id: row.get(0)?, channel_id: row.get(1)?, sender_did: row.get(2)?,
                content_encrypted: row.get(3)?, content_plaintext: row.get(4)?,
                nonce: row.get(5)?, key_version: row.get(6)?,
                is_e2ee: row.get::<_, i32>(7)? != 0, reply_to_id: row.get(8)?,
                thread_id: row.get(9)?, has_embed: row.get::<_, i32>(10)? != 0,
                has_attachment: row.get::<_, i32>(11)? != 0, content_warning: row.get(12)?,
                edited_at: row.get(13)?, deleted_for_everyone: row.get::<_, i32>(14)? != 0,
                created_at: row.get(15)?,
            })
        }

        let mut results = Vec::new();
        if let Some(before) = before_timestamp {
            let mut stmt = conn.prepare(
                "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE thread_id = ? AND deleted_for_everyone = 0 AND created_at < ? ORDER BY created_at DESC LIMIT ?",
            ).map_err(|e| Error::DatabaseError(e.to_string()))?;
            let rows = stmt.query_map(params![thread_id, before, limit as i64], parse_msg_row)
                .map_err(|e| Error::DatabaseError(e.to_string()))?;
            for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        } else {
            let mut stmt = conn.prepare(
                "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE thread_id = ? AND deleted_for_everyone = 0 ORDER BY created_at DESC LIMIT ?",
            ).map_err(|e| Error::DatabaseError(e.to_string()))?;
            let rows = stmt.query_map(params![thread_id, limit as i64], parse_msg_row)
                .map_err(|e| Error::DatabaseError(e.to_string()))?;
            for row in rows { results.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        }
        Ok(results)
    }

    // ========================================================================
    // FILE CHUNK STORAGE
    // ========================================================================

    /// Store a file chunk
    pub fn store_chunk(&self, chunk_id: &str, file_id: &str, chunk_index: i32, data: &[u8], size: i64, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR REPLACE INTO file_chunks (chunk_id, file_id, chunk_index, data, size, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            params![chunk_id, file_id, chunk_index, data, size, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to store chunk: {}", e)))?;
        Ok(())
    }

    /// Get a file chunk by ID
    pub fn get_chunk(&self, chunk_id: &str) -> Result<Option<FileChunkRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT chunk_id, file_id, chunk_index, data, size, created_at FROM file_chunks WHERE chunk_id = ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let result = stmt.query_row(params![chunk_id], |row| {
            Ok(FileChunkRecord {
                chunk_id: row.get(0)?,
                file_id: row.get(1)?,
                chunk_index: row.get(2)?,
                data: row.get(3)?,
                size: row.get(4)?,
                created_at: row.get(5)?,
            })
        });

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Get all chunks for a file, ordered by chunk_index
    pub fn get_chunks_for_file(&self, file_id: &str) -> Result<Vec<FileChunkRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT chunk_id, file_id, chunk_index, data, size, created_at FROM file_chunks WHERE file_id = ? ORDER BY chunk_index",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let rows = stmt.query_map(params![file_id], |row| {
            Ok(FileChunkRecord {
                chunk_id: row.get(0)?,
                file_id: row.get(1)?,
                chunk_index: row.get(2)?,
                data: row.get(3)?,
                size: row.get(4)?,
                created_at: row.get(5)?,
            })
        }).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut chunks = Vec::new();
        for row in rows { chunks.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(chunks)
    }

    /// Delete all chunks for a file
    pub fn delete_chunks_for_file(&self, file_id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM file_chunks WHERE file_id = ?", params![file_id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Store a file manifest
    pub fn store_manifest(&self, file_id: &str, filename: &str, total_size: i64, chunk_size: i64, total_chunks: i32, chunks_json: &str, file_hash: &str, encrypted: bool, encryption_key_id: Option<&str>, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT OR REPLACE INTO file_manifests (file_id, filename, total_size, chunk_size, total_chunks, chunks_json, file_hash, encrypted, encryption_key_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![file_id, filename, total_size, chunk_size, total_chunks, chunks_json, file_hash, encrypted as i32, encryption_key_id, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to store manifest: {}", e)))?;
        Ok(())
    }

    /// Get a file manifest by file_id
    pub fn get_manifest(&self, file_id: &str) -> Result<Option<FileManifestRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT file_id, filename, total_size, chunk_size, total_chunks, chunks_json, file_hash, encrypted, encryption_key_id, created_at FROM file_manifests WHERE file_id = ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let result = stmt.query_row(params![file_id], |row| {
            Ok(FileManifestRecord {
                file_id: row.get(0)?,
                filename: row.get(1)?,
                total_size: row.get(2)?,
                chunk_size: row.get(3)?,
                total_chunks: row.get(4)?,
                chunks_json: row.get(5)?,
                file_hash: row.get(6)?,
                encrypted: row.get::<_, i32>(7)? != 0,
                encryption_key_id: row.get(8)?,
                created_at: row.get(9)?,
            })
        });

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Delete a file manifest
    pub fn delete_manifest(&self, file_id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM file_manifests WHERE file_id = ?", params![file_id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ========================================================================
    // DM SHARED FILES
    // ========================================================================

    /// Store a DM shared file
    #[allow(clippy::too_many_arguments)]
    pub fn store_dm_shared_file(&self, id: &str, conversation_id: &str, folder_id: Option<&str>, filename: &str, description: Option<&str>, file_size: i64, mime_type: Option<&str>, storage_chunks_json: &str, uploaded_by: &str, encrypted_metadata: Option<&str>, encryption_nonce: Option<&str>, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO dm_shared_files (id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, encrypted_metadata, encryption_nonce, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, encrypted_metadata, encryption_nonce, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to store DM file: {}", e)))?;
        Ok(())
    }

    /// Get DM shared files in a conversation (optionally within a folder)
    pub fn get_dm_shared_files(&self, conversation_id: &str, folder_id: Option<&str>, limit: usize, offset: usize) -> Result<Vec<DmSharedFileRecord>> {
        let conn = self.conn.lock();
        let (sql, params_vec): (&str, Vec<Box<dyn rusqlite::types::ToSql>>) =
            if let Some(fid) = folder_id {
                ("SELECT id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, encrypted_metadata, encryption_nonce, created_at FROM dm_shared_files WHERE conversation_id = ? AND folder_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                 vec![Box::new(conversation_id.to_string()), Box::new(fid.to_string()), Box::new(limit as i64), Box::new(offset as i64)])
            } else {
                ("SELECT id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, encrypted_metadata, encryption_nonce, created_at FROM dm_shared_files WHERE conversation_id = ? AND folder_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?",
                 vec![Box::new(conversation_id.to_string()), Box::new(limit as i64), Box::new(offset as i64)])
            };

        let mut stmt = conn.prepare(sql).map_err(|e| Error::DatabaseError(e.to_string()))?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            Ok(DmSharedFileRecord {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                folder_id: row.get(2)?,
                filename: row.get(3)?,
                description: row.get(4)?,
                file_size: row.get(5)?,
                mime_type: row.get(6)?,
                storage_chunks_json: row.get(7)?,
                uploaded_by: row.get(8)?,
                version: row.get(9)?,
                download_count: row.get(10)?,
                encrypted_metadata: row.get(11)?,
                encryption_nonce: row.get(12)?,
                created_at: row.get(13)?,
            })
        }).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut files = Vec::new();
        for row in rows { files.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(files)
    }

    /// Get a single DM shared file by ID
    pub fn get_dm_shared_file(&self, id: &str) -> Result<Option<DmSharedFileRecord>> {
        let conn = self.conn.lock();
        let mut stmt = conn.prepare(
            "SELECT id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, encrypted_metadata, encryption_nonce, created_at FROM dm_shared_files WHERE id = ?",
        ).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let result = stmt.query_row(params![id], |row| {
            Ok(DmSharedFileRecord {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                folder_id: row.get(2)?,
                filename: row.get(3)?,
                description: row.get(4)?,
                file_size: row.get(5)?,
                mime_type: row.get(6)?,
                storage_chunks_json: row.get(7)?,
                uploaded_by: row.get(8)?,
                version: row.get(9)?,
                download_count: row.get(10)?,
                encrypted_metadata: row.get(11)?,
                encryption_nonce: row.get(12)?,
                created_at: row.get(13)?,
            })
        });

        match result {
            Ok(record) => Ok(Some(record)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(Error::DatabaseError(e.to_string())),
        }
    }

    /// Increment download count for a DM shared file
    pub fn increment_dm_file_download_count(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE dm_shared_files SET download_count = download_count + 1 WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Delete a DM shared file
    pub fn delete_dm_shared_file(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM dm_shared_files WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Move a DM shared file to a different folder
    pub fn move_dm_shared_file(&self, id: &str, target_folder_id: Option<&str>) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE dm_shared_files SET folder_id = ? WHERE id = ?", params![target_folder_id, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    // ── DM Shared Folders ────────────────────────────────────────────────

    /// Create a DM shared folder
    pub fn create_dm_shared_folder(&self, id: &str, conversation_id: &str, parent_folder_id: Option<&str>, name: &str, created_by: &str, created_at: i64) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute(
            "INSERT INTO dm_shared_folders (id, conversation_id, parent_folder_id, name, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            params![id, conversation_id, parent_folder_id, name, created_by, created_at],
        ).map_err(|e| Error::DatabaseError(format!("Failed to create DM folder: {}", e)))?;
        Ok(())
    }

    /// Get DM shared folders in a conversation (optionally within a parent folder)
    pub fn get_dm_shared_folders(&self, conversation_id: &str, parent_folder_id: Option<&str>) -> Result<Vec<DmSharedFolderRecord>> {
        let conn = self.conn.lock();
        let (sql, params_vec): (&str, Vec<Box<dyn rusqlite::types::ToSql>>) =
            if let Some(pid) = parent_folder_id {
                ("SELECT id, conversation_id, parent_folder_id, name, created_by, created_at FROM dm_shared_folders WHERE conversation_id = ? AND parent_folder_id = ? ORDER BY name",
                 vec![Box::new(conversation_id.to_string()), Box::new(pid.to_string())])
            } else {
                ("SELECT id, conversation_id, parent_folder_id, name, created_by, created_at FROM dm_shared_folders WHERE conversation_id = ? AND parent_folder_id IS NULL ORDER BY name",
                 vec![Box::new(conversation_id.to_string())])
            };

        let mut stmt = conn.prepare(sql).map_err(|e| Error::DatabaseError(e.to_string()))?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            Ok(DmSharedFolderRecord {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                parent_folder_id: row.get(2)?,
                name: row.get(3)?,
                created_by: row.get(4)?,
                created_at: row.get(5)?,
            })
        }).map_err(|e| Error::DatabaseError(e.to_string()))?;

        let mut folders = Vec::new();
        for row in rows { folders.push(row.map_err(|e| Error::DatabaseError(e.to_string()))?); }
        Ok(folders)
    }

    /// Delete a DM shared folder
    pub fn delete_dm_shared_folder(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("DELETE FROM dm_shared_folders WHERE id = ?", params![id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
    }

    /// Rename a DM shared folder
    pub fn rename_dm_shared_folder(&self, id: &str, name: &str) -> Result<()> {
        let conn = self.conn.lock();
        conn.execute("UPDATE dm_shared_folders SET name = ? WHERE id = ?", params![name, id])
            .map_err(|e| Error::DatabaseError(e.to_string()))?;
        Ok(())
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

/// A community record from the database
#[derive(Debug, Clone)]
pub struct CommunityRecord {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon_url: Option<String>,
    pub banner_url: Option<String>,
    pub splash_url: Option<String>,
    pub accent_color: Option<String>,
    pub custom_css: Option<String>,
    pub owner_did: String,
    pub vanity_url: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// A community space record
#[derive(Debug, Clone)]
pub struct CommunitySpaceRecord {
    pub id: String,
    pub community_id: String,
    pub name: String,
    pub position: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

/// A community channel record
#[derive(Debug, Clone)]
pub struct CommunityChannelRecord {
    pub id: String,
    pub community_id: String,
    pub space_id: String,
    pub name: String,
    pub channel_type: String,
    pub topic: Option<String>,
    pub position: i32,
    pub slow_mode_seconds: i32,
    pub e2ee_enabled: bool,
    pub pin_limit: i32,
    pub created_at: i64,
    pub updated_at: i64,
}

/// A community role record
#[derive(Debug, Clone)]
pub struct CommunityRoleRecord {
    pub id: String,
    pub community_id: String,
    pub name: String,
    pub color: Option<String>,
    pub icon: Option<String>,
    pub badge: Option<String>,
    pub position: i32,
    pub hoisted: bool,
    pub mentionable: bool,
    pub is_preset: bool,
    pub permissions_bitfield: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// A community member-role assignment record
#[derive(Debug, Clone)]
pub struct CommunityMemberRoleRecord {
    pub community_id: String,
    pub member_did: String,
    pub role_id: String,
    pub assigned_at: i64,
    pub assigned_by: Option<String>,
}

/// A channel permission override record
#[derive(Debug, Clone)]
pub struct ChannelPermissionOverrideRecord {
    pub id: String,
    pub channel_id: String,
    pub target_type: String,
    pub target_id: String,
    pub allow_bitfield: String,
    pub deny_bitfield: String,
}

/// A community member record
#[derive(Debug, Clone)]
pub struct CommunityMemberRecord {
    pub community_id: String,
    pub member_did: String,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub joined_at: i64,
}

/// A community message record
#[derive(Debug, Clone)]
pub struct CommunityMessageRecord {
    pub id: String,
    pub channel_id: String,
    pub sender_did: String,
    pub content_encrypted: Option<Vec<u8>>,
    pub content_plaintext: Option<String>,
    pub nonce: Option<String>,
    pub key_version: Option<i32>,
    pub is_e2ee: bool,
    pub reply_to_id: Option<String>,
    pub thread_id: Option<String>,
    pub has_embed: bool,
    pub has_attachment: bool,
    pub content_warning: Option<String>,
    pub edited_at: Option<i64>,
    pub deleted_for_everyone: bool,
    pub created_at: i64,
}

/// A community reaction record
#[derive(Debug, Clone)]
pub struct CommunityReactionRecord {
    pub message_id: String,
    pub member_did: String,
    pub emoji: String,
    pub is_custom: bool,
    pub created_at: i64,
}

/// A community invite record
#[derive(Debug, Clone)]
pub struct CommunityInviteRecord {
    pub id: String,
    pub community_id: String,
    pub code: String,
    pub vanity: bool,
    pub creator_did: String,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub expires_at: Option<i64>,
    pub created_at: i64,
}

/// A community ban record
#[derive(Debug, Clone)]
pub struct CommunityBanRecord {
    pub community_id: String,
    pub banned_did: String,
    pub reason: Option<String>,
    pub banned_by: String,
    pub device_fingerprint: Option<String>,
    pub expires_at: Option<i64>,
    pub created_at: i64,
}

/// A community warning record
#[derive(Debug, Clone)]
pub struct CommunityWarningRecord {
    pub id: String,
    pub community_id: String,
    pub member_did: String,
    pub reason: String,
    pub warned_by: String,
    pub expires_at: Option<i64>,
    pub created_at: i64,
}

/// A community audit log entry
#[derive(Debug, Clone)]
pub struct CommunityAuditLogRecord {
    pub id: String,
    pub community_id: String,
    pub actor_did: String,
    pub action_type: String,
    pub target_type: Option<String>,
    pub target_id: Option<String>,
    pub metadata_json: Option<String>,
    pub content_detail: Option<String>,
    pub created_at: i64,
}

/// A community thread record
#[derive(Debug, Clone)]
pub struct CommunityThreadRecord {
    pub id: String,
    pub channel_id: String,
    pub parent_message_id: String,
    pub name: Option<String>,
    pub created_by: String,
    pub message_count: i32,
    pub last_message_at: Option<i64>,
    pub created_at: i64,
}

/// A read receipt record
#[derive(Debug, Clone)]
pub struct CommunityReadReceiptRecord {
    pub channel_id: String,
    pub member_did: String,
    pub last_read_message_id: String,
    pub read_at: i64,
}

/// A pin record
#[derive(Debug, Clone)]
pub struct CommunityPinRecord {
    pub channel_id: String,
    pub message_id: String,
    pub pinned_by: String,
    pub pinned_at: i64,
}

/// A file record
#[derive(Debug, Clone)]
pub struct CommunityFileRecord {
    pub id: String,
    pub channel_id: String,
    pub folder_id: Option<String>,
    pub filename: String,
    pub description: Option<String>,
    pub file_size: i64,
    pub mime_type: Option<String>,
    pub storage_chunks_json: String,
    pub uploaded_by: String,
    pub version: i32,
    pub previous_version_id: Option<String>,
    pub download_count: i32,
    pub created_at: i64,
}

/// A file folder record
#[derive(Debug, Clone)]
pub struct CommunityFileFolderRecord {
    pub id: String,
    pub channel_id: String,
    pub parent_folder_id: Option<String>,
    pub name: String,
    pub created_by: String,
    pub created_at: i64,
}

/// A custom emoji record
#[derive(Debug, Clone)]
pub struct CommunityEmojiRecord {
    pub id: String,
    pub community_id: String,
    pub name: String,
    pub image_url: String,
    pub animated: bool,
    pub uploaded_by: String,
    pub created_at: i64,
}

/// A custom sticker record
#[derive(Debug, Clone)]
pub struct CommunityStickerRecord {
    pub id: String,
    pub community_id: String,
    pub pack_id: Option<String>,
    pub name: String,
    pub image_url: String,
    pub animated: bool,
    pub uploaded_by: String,
    pub created_at: i64,
}

/// A webhook record
#[derive(Debug, Clone)]
pub struct CommunityWebhookRecord {
    pub id: String,
    pub channel_id: String,
    pub name: String,
    pub avatar_url: Option<String>,
    pub token: String,
    pub creator_did: String,
    pub created_at: i64,
}

/// A channel encryption key record
#[derive(Debug, Clone)]
pub struct ChannelKeyRecord {
    pub channel_id: String,
    pub key_version: i32,
    pub encrypted_key: Vec<u8>,
    pub created_at: i64,
}

/// A deleted message tracking record
#[derive(Debug, Clone)]
pub struct CommunityDeletedMessageRecord {
    pub message_id: String,
    pub member_did: String,
    pub deleted_at: i64,
}

/// A boost node record
#[derive(Debug, Clone)]
pub struct BoostNodeRecord {
    pub id: String,
    pub owner_did: String,
    pub node_type: String,
    pub node_public_key: String,
    pub name: String,
    pub enabled: bool,
    pub max_storage_bytes: i64,
    pub max_bandwidth_mbps: i32,
    pub auto_start: bool,
    pub prioritized_communities: Option<String>,
    pub pairing_token: Option<String>,
    pub remote_address: Option<String>,
    pub last_seen_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// A community timeout record
#[derive(Debug, Clone)]
pub struct CommunityTimeoutRecord {
    pub id: String,
    pub community_id: String,
    pub member_did: String,
    pub reason: Option<String>,
    pub timeout_type: String,
    pub issued_by: String,
    pub expires_at: i64,
    pub created_at: i64,
}

/// A thread follower record
#[derive(Debug, Clone)]
pub struct CommunityThreadFollowerRecord {
    pub thread_id: String,
    pub member_did: String,
    pub followed_at: i64,
}

/// A member status record (custom status text + emoji)
#[derive(Debug, Clone)]
pub struct CommunityMemberStatusRecord {
    pub community_id: String,
    pub member_did: String,
    pub status_text: Option<String>,
    pub status_emoji: Option<String>,
    pub expires_at: Option<i64>,
    pub updated_at: i64,
}

/// A notification settings record
#[derive(Debug, Clone)]
pub struct CommunityNotificationSettingRecord {
    pub id: String,
    pub community_id: String,
    pub member_did: String,
    pub target_type: String,
    pub target_id: String,
    pub mute_until: Option<i64>,
    pub suppress_everyone: bool,
    pub suppress_roles: bool,
    pub level: String,
    pub updated_at: i64,
}

/// A file chunk record (local chunk storage for P2P transfer)
#[derive(Debug, Clone)]
pub struct FileChunkRecord {
    pub chunk_id: String,
    pub file_id: String,
    pub chunk_index: i32,
    pub data: Vec<u8>,
    pub size: i64,
    pub created_at: i64,
}

/// A file manifest record (describes how a file was chunked)
#[derive(Debug, Clone)]
pub struct FileManifestRecord {
    pub file_id: String,
    pub filename: String,
    pub total_size: i64,
    pub chunk_size: i64,
    pub total_chunks: i32,
    pub chunks_json: String,
    pub file_hash: String,
    pub encrypted: bool,
    pub encryption_key_id: Option<String>,
    pub created_at: i64,
}

/// A DM shared file record
#[derive(Debug, Clone)]
pub struct DmSharedFileRecord {
    pub id: String,
    pub conversation_id: String,
    pub folder_id: Option<String>,
    pub filename: String,
    pub description: Option<String>,
    pub file_size: i64,
    pub mime_type: Option<String>,
    pub storage_chunks_json: String,
    pub uploaded_by: String,
    pub version: i32,
    pub download_count: i32,
    pub encrypted_metadata: Option<String>,
    pub encryption_nonce: Option<String>,
    pub created_at: i64,
}

/// A DM shared folder record
#[derive(Debug, Clone)]
pub struct DmSharedFolderRecord {
    pub id: String,
    pub conversation_id: String,
    pub parent_folder_id: Option<String>,
    pub name: String,
    pub created_by: String,
    pub created_at: i64,
}

/// A transfer session record (P2P file transfer state for resume support)
#[derive(Debug, Clone)]
pub struct TransferSessionRecord {
    pub transfer_id: String,
    pub file_id: String,
    pub manifest_json: String,
    pub direction: String,
    pub peer_did: String,
    pub state: String,
    pub chunks_completed: i32,
    pub total_chunks: i32,
    pub bytes_transferred: i64,
    pub total_bytes: i64,
    pub chunks_bitfield: String,
    pub transport_type: String,
    pub error: Option<String>,
    pub started_at: i64,
    pub updated_at: i64,
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
