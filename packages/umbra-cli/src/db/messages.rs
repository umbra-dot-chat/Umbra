use rusqlite::params;
use super::Db;

// ── Types ──────────────────────────────────────────────────────────────

/// A message stored in the database.
#[allow(dead_code)]
pub struct StoredMessage {
    pub id: String,
    pub conversation_id: String,
    pub sender_did: String,
    pub content: String,
    pub timestamp: i64,
    pub delivered: bool,
    pub edited_at: Option<i64>,
    pub deleted: bool,
    pub status: String,
}

/// A conversation stored in the database.
#[allow(dead_code)]
pub struct StoredConversation {
    pub id: String,
    pub friend_did: String,
    pub last_message_at: Option<i64>,
    pub unread_count: i32,
}

/// A reaction stored in the database.
#[allow(dead_code)]
pub struct StoredReaction {
    pub id: String,
    pub message_id: String,
    pub sender_did: String,
    pub emoji: String,
    pub created_at: i64,
}

// ── Conversations ───────────────────────────────────────────────────

impl Db {
    /// Ensure a conversation exists (create if not present).
    pub fn ensure_conversation(&self, id: &str, friend_did: &str) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO conversations (id, friend_did, unread_count)
                 VALUES (?1, ?2, 0)",
                params![id, friend_did],
            )
            .map_err(|e| format!("Failed to ensure conversation: {e}"))?;
        Ok(())
    }

    /// Update the last message timestamp for a conversation.
    pub fn update_conversation_timestamp(&self, id: &str, timestamp: i64) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE conversations SET last_message_at = ?1 WHERE id = ?2",
                params![timestamp, id],
            )
            .map_err(|e| format!("Failed to update conversation timestamp: {e}"))?;
        Ok(())
    }

    /// Increment the unread count for a conversation.
    pub fn increment_unread(&self, conv_id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE conversations SET unread_count = unread_count + 1 WHERE id = ?1",
                params![conv_id],
            )
            .map_err(|e| format!("Failed to increment unread: {e}"))?;
        Ok(())
    }

    /// Clear the unread count for a conversation.
    pub fn clear_unread(&self, conv_id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE conversations SET unread_count = 0 WHERE id = ?1",
                params![conv_id],
            )
            .map_err(|e| format!("Failed to clear unread: {e}"))?;
        Ok(())
    }

    // ── Messages ────────────────────────────────────────────────────────

    /// Save a message. Ignores duplicates (INSERT OR IGNORE).
    pub fn save_message(
        &self,
        id: &str,
        conversation_id: &str,
        sender_did: &str,
        content: &str,
        timestamp: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO messages (id, conversation_id, sender_did, content, timestamp)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, conversation_id, sender_did, content, timestamp],
            )
            .map_err(|e| format!("Failed to save message: {e}"))?;
        Ok(())
    }

    /// Load messages for a conversation, most recent last, limited to `limit`.
    pub fn load_messages(
        &self,
        conversation_id: &str,
        limit: usize,
    ) -> Result<Vec<StoredMessage>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, conversation_id, sender_did, content, timestamp, delivered,
                        edited_at, deleted, status
                 FROM messages WHERE conversation_id = ?1
                 ORDER BY timestamp ASC
                 LIMIT ?2",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let messages = stmt
            .query_map(params![conversation_id, limit as i64], |row| {
                Ok(StoredMessage {
                    id: row.get(0)?,
                    conversation_id: row.get(1)?,
                    sender_did: row.get(2)?,
                    content: row.get(3)?,
                    timestamp: row.get(4)?,
                    delivered: row.get::<_, i32>(5)? != 0,
                    edited_at: row.get(6)?,
                    deleted: row.get::<_, i32>(7).unwrap_or(0) != 0,
                    status: row.get::<_, String>(8).unwrap_or_else(|_| "sent".to_string()),
                })
            })
            .map_err(|e| format!("Failed to load messages: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(messages)
    }

    /// Get the total unread count across all conversations.
    #[allow(dead_code)]
    pub fn total_unread(&self) -> i32 {
        self.conn
            .query_row(
                "SELECT COALESCE(SUM(unread_count), 0) FROM conversations",
                [],
                |row| row.get(0),
            )
            .unwrap_or(0)
    }

    // ── Phase 1: Message editing/deletion ────────────────────────────────

    /// Update the content of a message and set its edited_at timestamp.
    pub fn update_message_content(
        &self,
        id: &str,
        content: &str,
        edited_at: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE messages SET content = ?1, edited_at = ?2 WHERE id = ?3",
                params![content, edited_at, id],
            )
            .map_err(|e| format!("Failed to update message content: {e}"))?;
        Ok(())
    }

    /// Soft-delete a message (mark as deleted without removing from DB).
    pub fn soft_delete_message(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE messages SET deleted = 1 WHERE id = ?1",
                params![id],
            )
            .map_err(|e| format!("Failed to soft-delete message: {e}"))?;
        Ok(())
    }

    /// Update the delivery status of a message.
    pub fn update_message_status(&self, id: &str, status: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE messages SET status = ?1 WHERE id = ?2",
                params![status, id],
            )
            .map_err(|e| format!("Failed to update message status: {e}"))?;
        Ok(())
    }

    /// Search messages by content (LIKE), optionally filtered by conversation.
    #[allow(dead_code)]
    pub fn search_messages(
        &self,
        query: &str,
        conversation_id: Option<&str>,
        limit: usize,
    ) -> Result<Vec<StoredMessage>, String> {
        let like_pattern = format!("%{query}%");

        if let Some(conv_id) = conversation_id {
            let mut stmt = self
                .conn
                .prepare(
                    "SELECT id, conversation_id, sender_did, content, timestamp, delivered,
                            edited_at, deleted, status
                     FROM messages
                     WHERE conversation_id = ?1 AND content LIKE ?2 AND deleted = 0
                     ORDER BY timestamp DESC
                     LIMIT ?3",
                )
                .map_err(|e| format!("Failed to prepare search: {e}"))?;

            let messages = stmt
                .query_map(params![conv_id, like_pattern, limit as i64], |row| {
                    Ok(StoredMessage {
                        id: row.get(0)?,
                        conversation_id: row.get(1)?,
                        sender_did: row.get(2)?,
                        content: row.get(3)?,
                        timestamp: row.get(4)?,
                        delivered: row.get::<_, i32>(5)? != 0,
                        edited_at: row.get(6)?,
                        deleted: row.get::<_, i32>(7).unwrap_or(0) != 0,
                        status: row.get::<_, String>(8).unwrap_or_else(|_| "sent".to_string()),
                    })
                })
                .map_err(|e| format!("Failed to search messages: {e}"))?
                .filter_map(|r| r.ok())
                .collect();

            Ok(messages)
        } else {
            let mut stmt = self
                .conn
                .prepare(
                    "SELECT id, conversation_id, sender_did, content, timestamp, delivered,
                            edited_at, deleted, status
                     FROM messages
                     WHERE content LIKE ?1 AND deleted = 0
                     ORDER BY timestamp DESC
                     LIMIT ?2",
                )
                .map_err(|e| format!("Failed to prepare search: {e}"))?;

            let messages = stmt
                .query_map(params![like_pattern, limit as i64], |row| {
                    Ok(StoredMessage {
                        id: row.get(0)?,
                        conversation_id: row.get(1)?,
                        sender_did: row.get(2)?,
                        content: row.get(3)?,
                        timestamp: row.get(4)?,
                        delivered: row.get::<_, i32>(5)? != 0,
                        edited_at: row.get(6)?,
                        deleted: row.get::<_, i32>(7).unwrap_or(0) != 0,
                        status: row.get::<_, String>(8).unwrap_or_else(|_| "sent".to_string()),
                    })
                })
                .map_err(|e| format!("Failed to search messages: {e}"))?
                .filter_map(|r| r.ok())
                .collect();

            Ok(messages)
        }
    }

    // ── Phase 1: Reactions ───────────────────────────────────────────────

    /// Add a reaction to a message.
    pub fn add_reaction(
        &self,
        message_id: &str,
        sender_did: &str,
        emoji: &str,
    ) -> Result<(), String> {
        let id = uuid::Uuid::new_v4().to_string();
        let created_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn
            .execute(
                "INSERT OR IGNORE INTO reactions (id, message_id, sender_did, emoji, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, message_id, sender_did, emoji, created_at],
            )
            .map_err(|e| format!("Failed to add reaction: {e}"))?;
        Ok(())
    }

    /// Remove a reaction from a message.
    pub fn remove_reaction(
        &self,
        message_id: &str,
        sender_did: &str,
        emoji: &str,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "DELETE FROM reactions WHERE message_id = ?1 AND sender_did = ?2 AND emoji = ?3",
                params![message_id, sender_did, emoji],
            )
            .map_err(|e| format!("Failed to remove reaction: {e}"))?;
        Ok(())
    }

    /// Load all reactions for a message.
    pub fn load_reactions(&self, message_id: &str) -> Result<Vec<StoredReaction>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, message_id, sender_did, emoji, created_at
                 FROM reactions WHERE message_id = ?1
                 ORDER BY created_at ASC",
            )
            .map_err(|e| format!("Failed to prepare reactions query: {e}"))?;

        let reactions = stmt
            .query_map(params![message_id], |row| {
                Ok(StoredReaction {
                    id: row.get(0)?,
                    message_id: row.get(1)?,
                    sender_did: row.get(2)?,
                    emoji: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| format!("Failed to load reactions: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(reactions)
    }

    // ── Phase 1: Pinned messages ─────────────────────────────────────────

    /// Pin a message in a conversation.
    pub fn pin_message(
        &self,
        conv_id: &str,
        msg_id: &str,
        pinned_by: &str,
    ) -> Result<(), String> {
        let id = uuid::Uuid::new_v4().to_string();
        let pinned_at = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn
            .execute(
                "INSERT OR IGNORE INTO pinned_messages (id, conversation_id, message_id, pinned_by, pinned_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, conv_id, msg_id, pinned_by, pinned_at],
            )
            .map_err(|e| format!("Failed to pin message: {e}"))?;
        Ok(())
    }

    /// Unpin a message in a conversation.
    pub fn unpin_message(&self, conv_id: &str, msg_id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "DELETE FROM pinned_messages WHERE conversation_id = ?1 AND message_id = ?2",
                params![conv_id, msg_id],
            )
            .map_err(|e| format!("Failed to unpin message: {e}"))?;
        Ok(())
    }

    /// Check if a message is pinned in a conversation.
    pub fn is_pinned(&self, conv_id: &str, msg_id: &str) -> Result<bool, String> {
        let count: i32 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM pinned_messages
                 WHERE conversation_id = ?1 AND message_id = ?2",
                params![conv_id, msg_id],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to check pin: {e}"))?;
        Ok(count > 0)
    }

    /// Load all pinned message IDs for a conversation.
    pub fn load_pinned_messages(&self, conv_id: &str) -> Result<Vec<String>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT message_id FROM pinned_messages
                 WHERE conversation_id = ?1 ORDER BY pinned_at ASC",
            )
            .map_err(|e| format!("Failed to prepare pinned query: {e}"))?;

        let ids = stmt
            .query_map(params![conv_id], |row| row.get(0))
            .map_err(|e| format!("Failed to load pinned messages: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(ids)
    }
}
