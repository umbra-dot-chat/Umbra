//! # WASM Database
//!
//! SQLite database for WebAssembly using sql.js via JavaScript interop.
//!
//! This module provides the same `Database` API as `database.rs` but uses
//! `wasm_bindgen` to call into a JavaScript-side sql.js instance instead
//! of using `rusqlite` directly (which requires C compilation and won't
//! target `wasm32-unknown-unknown`).

use crate::error::{Error, Result};
use super::schema;
use wasm_bindgen::prelude::*;
use serde_json::json;

// ============================================================================
// JAVASCRIPT BRIDGE — extern functions provided by sql-bridge.ts
// ============================================================================

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_sql"], js_name = "init")]
    fn sql_bridge_init() -> bool;

    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_sql"], js_name = "execute", catch)]
    fn sql_bridge_execute(sql: &str, params_json: &str) -> std::result::Result<i32, JsValue>;

    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_sql"], js_name = "query", catch)]
    fn sql_bridge_query(sql: &str, params_json: &str) -> std::result::Result<String, JsValue>;

    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_sql"], js_name = "executeBatch", catch)]
    fn sql_bridge_execute_batch(sql: &str) -> std::result::Result<bool, JsValue>;

    #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_sql"], js_name = "queryValue", catch)]
    fn sql_bridge_query_value(sql: &str, params_json: &str) -> std::result::Result<String, JsValue>;
}

// ============================================================================
// HELPERS
// ============================================================================

fn js_err(e: JsValue) -> Error {
    let msg = e.as_string().unwrap_or_else(|| format!("{:?}", e));
    Error::DatabaseError(msg)
}

/// Database configuration
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    /// Path to the database file (ignored in WASM — always in-memory)
    pub path: Option<String>,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self { path: None }
    }
}

// ============================================================================
// DATABASE
// ============================================================================

/// The main database handle (WASM version)
pub struct Database {
    _initialized: bool,
}

impl Database {
    /// Open or create a database (WASM: always in-memory via sql.js)
    pub async fn open(_path: Option<&str>) -> Result<Self> {
        sql_bridge_init();
        let db = Self { _initialized: true };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        let version: Option<i32> = self.query_scalar_raw(
            "SELECT version FROM schema_version LIMIT 1", "[]",
        ).ok().flatten();

        match version {
            None => {
                sql_bridge_execute_batch(schema::CREATE_TABLES).map_err(js_err)?;
                let params = json!([schema::SCHEMA_VERSION]).to_string();
                sql_bridge_execute(
                    "INSERT INTO schema_version (version) VALUES (?)",
                    &params,
                ).map_err(js_err)?;
                tracing::info!("Database schema created (version {})", schema::SCHEMA_VERSION);
            }
            Some(v) if v < schema::SCHEMA_VERSION => {
                tracing::info!("Schema version {} < current {}, running migrations", v, schema::SCHEMA_VERSION);
                self.run_migrations(v)?;
            }
            Some(v) => {
                tracing::debug!("Database schema version: {}", v);
            }
        }
        Ok(())
    }

    /// Run incremental schema migrations from `from_version` to current.
    fn run_migrations(&self, from_version: i32) -> Result<()> {
        if from_version < 2 {
            tracing::info!("Running migration v1 → v2 (messaging features, groups, reactions)");
            sql_bridge_execute_batch(schema::MIGRATE_V1_TO_V2).map_err(js_err)?;
            tracing::info!("Migration v1 → v2 complete");
        }
        if from_version < 3 {
            tracing::info!("Running migration v2 → v3 (group keys, group invites)");
            sql_bridge_execute_batch(schema::MIGRATE_V2_TO_V3).map_err(js_err)?;
            tracing::info!("Migration v2 → v3 complete");
        }
        if from_version < 4 {
            tracing::info!("Running migration v3 → v4 (plugin KV storage, plugin bundles)");
            sql_bridge_execute_batch(schema::MIGRATE_V3_TO_V4).map_err(js_err)?;
            tracing::info!("Migration v3 → v4 complete");
        }
        Ok(())
    }

    // ── Internal helpers ─────────────────────────────────────────────────

    fn exec(&self, sql: &str, params: serde_json::Value) -> Result<i32> {
        let pj = params.to_string();
        sql_bridge_execute(sql, &pj).map_err(js_err)
    }

    fn query(&self, sql: &str, params: serde_json::Value) -> Result<Vec<serde_json::Value>> {
        let pj = params.to_string();
        let json_str = sql_bridge_query(sql, &pj).map_err(js_err)?;
        serde_json::from_str(&json_str)
            .map_err(|e| Error::DatabaseError(format!("Failed to parse query: {}", e)))
    }

    fn query_scalar_raw<T: serde::de::DeserializeOwned>(&self, sql: &str, params_json: &str) -> Result<Option<T>> {
        let json_str = sql_bridge_query_value(sql, params_json).map_err(js_err)?;
        if json_str == "null" || json_str.is_empty() {
            return Ok(None);
        }
        serde_json::from_str(&json_str)
            .map(Some)
            .map_err(|e| Error::DatabaseError(format!("Failed to parse scalar: {}", e)))
    }

    fn query_scalar<T: serde::de::DeserializeOwned>(&self, sql: &str, params: serde_json::Value) -> Result<Option<T>> {
        self.query_scalar_raw(sql, &params.to_string())
    }

    // ── Row parsing ─────────────────────────────────────────────────────

    fn parse_friend(row: &serde_json::Value) -> FriendRecord {
        FriendRecord {
            id: row["id"].as_i64().unwrap_or(0),
            did: row["did"].as_str().unwrap_or("").to_string(),
            display_name: row["display_name"].as_str().unwrap_or("").to_string(),
            signing_key: row["signing_key"].as_str().unwrap_or("").to_string(),
            encryption_key: row["encryption_key"].as_str().unwrap_or("").to_string(),
            status: row["status"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_conversation(row: &serde_json::Value) -> ConversationRecord {
        ConversationRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            friend_did: row["friend_did"].as_str().map(|s| s.to_string()),
            conv_type: row["type"].as_str().unwrap_or("dm").to_string(),
            group_id: row["group_id"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            last_message_at: row["last_message_at"].as_i64(),
            unread_count: row["unread_count"].as_i64().unwrap_or(0) as i32,
        }
    }

    fn parse_message(row: &serde_json::Value) -> MessageRecord {
        MessageRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            conversation_id: row["conversation_id"].as_str().unwrap_or("").to_string(),
            sender_did: row["sender_did"].as_str().unwrap_or("").to_string(),
            content_encrypted: row["content_encrypted"].as_str().unwrap_or("").to_string(),
            nonce: row["nonce"].as_str().unwrap_or("").to_string(),
            timestamp: row["timestamp"].as_i64().unwrap_or(0),
            delivered: row["delivered"].as_i64().unwrap_or(0) != 0,
            read: row["read"].as_i64().unwrap_or(0) != 0,
            edited: row["edited"].as_i64().unwrap_or(0) != 0,
            edited_at: row["edited_at"].as_i64(),
            deleted: row["deleted"].as_i64().unwrap_or(0) != 0,
            deleted_at: row["deleted_at"].as_i64(),
            pinned: row["pinned"].as_i64().unwrap_or(0) != 0,
            pinned_by: row["pinned_by"].as_str().map(|s| s.to_string()),
            pinned_at: row["pinned_at"].as_i64(),
            reply_to_id: row["reply_to_id"].as_str().map(|s| s.to_string()),
            thread_id: row["thread_id"].as_str().map(|s| s.to_string()),
            forwarded_from: row["forwarded_from"].as_str().map(|s| s.to_string()),
        }
    }

    fn parse_reaction(row: &serde_json::Value) -> ReactionRecord {
        ReactionRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            message_id: row["message_id"].as_str().unwrap_or("").to_string(),
            user_did: row["user_did"].as_str().unwrap_or("").to_string(),
            emoji: row["emoji"].as_str().unwrap_or("").to_string(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_group(row: &serde_json::Value) -> GroupRecord {
        GroupRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().unwrap_or("").to_string(),
            description: row["description"].as_str().map(|s| s.to_string()),
            avatar: row["avatar"].as_str().map(|s| s.to_string()),
            created_by: row["created_by"].as_str().unwrap_or("").to_string(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_group_member(row: &serde_json::Value) -> GroupMemberRecord {
        GroupMemberRecord {
            group_id: row["group_id"].as_str().unwrap_or("").to_string(),
            member_did: row["member_did"].as_str().unwrap_or("").to_string(),
            display_name: row["display_name"].as_str().map(|s| s.to_string()),
            role: row["role"].as_str().unwrap_or("member").to_string(),
            joined_at: row["joined_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_group_key(row: &serde_json::Value) -> GroupKeyRecord {
        GroupKeyRecord {
            group_id: row["group_id"].as_str().unwrap_or("").to_string(),
            key_version: row["key_version"].as_i64().unwrap_or(0) as i32,
            encrypted_key: row["encrypted_key"].as_str()
                .map(|s| hex::decode(s).unwrap_or_default())
                .unwrap_or_default(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_group_invite(row: &serde_json::Value) -> GroupInviteRecord {
        GroupInviteRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            group_id: row["group_id"].as_str().unwrap_or("").to_string(),
            group_name: row["group_name"].as_str().unwrap_or("").to_string(),
            description: row["description"].as_str().map(|s| s.to_string()),
            inviter_did: row["inviter_did"].as_str().unwrap_or("").to_string(),
            inviter_name: row["inviter_name"].as_str().unwrap_or("").to_string(),
            encrypted_group_key: row["encrypted_group_key"].as_str().unwrap_or("").to_string(),
            nonce: row["nonce"].as_str().unwrap_or("").to_string(),
            members_json: row["members_json"].as_str().unwrap_or("[]").to_string(),
            status: row["status"].as_str().unwrap_or("pending").to_string(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_friend_request(row: &serde_json::Value) -> FriendRequestRecord {
        FriendRequestRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            from_did: row["from_did"].as_str().unwrap_or("").to_string(),
            to_did: row["to_did"].as_str().unwrap_or("").to_string(),
            direction: row["direction"].as_str().unwrap_or("").to_string(),
            message: row["message"].as_str().map(|s| s.to_string()),
            from_signing_key: row["from_signing_key"].as_str().map(|s| s.to_string()),
            from_encryption_key: row["from_encryption_key"].as_str().map(|s| s.to_string()),
            from_display_name: row["from_display_name"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            status: row["status"].as_str().unwrap_or("pending").to_string(),
        }
    }

    // ========================================================================
    // FRIEND OPERATIONS
    // ========================================================================

    /// Add a new friend to the database
    pub fn add_friend(&self, did: &str, display_name: &str, signing_key: &[u8; 32],
                      encryption_key: &[u8; 32], status: Option<&str>) -> Result<i64> {
        let now = crate::time::now_timestamp();
        self.exec(
            "INSERT INTO friends (did, display_name, signing_key, encryption_key, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([did, display_name, hex::encode(signing_key), hex::encode(encryption_key), status, now, now]),
        )?;
        let id: Option<i64> = self.query_scalar("SELECT last_insert_rowid()", json!([]))?;
        Ok(id.unwrap_or(0))
    }

    /// Get a friend by DID
    pub fn get_friend(&self, did: &str) -> Result<Option<FriendRecord>> {
        let rows = self.query(
            "SELECT id, did, display_name, signing_key, encryption_key, status, created_at, updated_at FROM friends WHERE did = ?",
            json!([did]),
        )?;
        Ok(rows.first().map(Self::parse_friend))
    }

    /// Get all friends
    pub fn get_all_friends(&self) -> Result<Vec<FriendRecord>> {
        let rows = self.query(
            "SELECT id, did, display_name, signing_key, encryption_key, status, created_at, updated_at FROM friends ORDER BY display_name",
            json!([]),
        )?;
        Ok(rows.iter().map(Self::parse_friend).collect())
    }

    /// Remove a friend by DID
    pub fn remove_friend(&self, did: &str) -> Result<bool> {
        Ok(self.exec("DELETE FROM friends WHERE did = ?", json!([did]))? > 0)
    }

    /// Update a friend's profile
    pub fn update_friend(&self, did: &str, display_name: Option<&str>, status: Option<&str>) -> Result<bool> {
        let now = crate::time::now_timestamp();
        let affected = if let Some(name) = display_name {
            self.exec("UPDATE friends SET display_name = ?, status = ?, updated_at = ? WHERE did = ?",
                json!([name, status, now, did]))?
        } else {
            self.exec("UPDATE friends SET status = ?, updated_at = ? WHERE did = ?",
                json!([status, now, did]))?
        };
        Ok(affected > 0)
    }

    // ========================================================================
    // CONVERSATION OPERATIONS
    // ========================================================================

    /// Create a new conversation (idempotent — ignores if already exists)
    pub fn create_conversation(&self, id: &str, friend_did: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.exec("INSERT OR IGNORE INTO conversations (id, friend_did, created_at, unread_count) VALUES (?, ?, ?, 0)",
            json!([id, friend_did, now]))?;
        Ok(())
    }

    /// Get a conversation by ID
    pub fn get_conversation(&self, id: &str) -> Result<Option<ConversationRecord>> {
        let rows = self.query(
            "SELECT id, friend_did, type, group_id, created_at, last_message_at, unread_count FROM conversations WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_conversation))
    }

    /// Get conversation by friend DID
    pub fn get_conversation_by_friend(&self, friend_did: &str) -> Result<Option<ConversationRecord>> {
        let rows = self.query(
            "SELECT id, friend_did, type, group_id, created_at, last_message_at, unread_count FROM conversations WHERE friend_did = ?",
            json!([friend_did]),
        )?;
        Ok(rows.first().map(Self::parse_conversation))
    }

    /// Get all conversations sorted by last message
    pub fn get_all_conversations(&self) -> Result<Vec<ConversationRecord>> {
        let rows = self.query(
            "SELECT id, friend_did, type, group_id, created_at, last_message_at, unread_count FROM conversations ORDER BY last_message_at DESC",
            json!([]),
        )?;
        Ok(rows.iter().map(Self::parse_conversation).collect())
    }

    // ========================================================================
    // MESSAGE OPERATIONS
    // ========================================================================

    /// Store an encrypted message
    pub fn store_message(&self, id: &str, conversation_id: &str, sender_did: &str,
                         content_encrypted: &[u8], nonce: &[u8], timestamp: i64) -> Result<()> {
        self.exec(
            "INSERT INTO messages (id, conversation_id, sender_did, content_encrypted, nonce, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            json!([id, conversation_id, sender_did, hex::encode(content_encrypted), hex::encode(nonce), timestamp]),
        )?;
        self.exec("UPDATE conversations SET last_message_at = ? WHERE id = ?",
            json!([timestamp, conversation_id]))?;
        Ok(())
    }

    /// Get messages for a conversation
    pub fn get_messages(&self, conversation_id: &str, limit: usize, offset: usize) -> Result<Vec<MessageRecord>> {
        let rows = self.query(
            "SELECT id, conversation_id, sender_did, content_encrypted, nonce, timestamp, delivered, read, \
             edited, edited_at, deleted, deleted_at, pinned, pinned_by, pinned_at, reply_to_id, thread_id, forwarded_from \
             FROM messages WHERE conversation_id = ? AND thread_id IS NULL ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            json!([conversation_id, limit as i64, offset as i64]),
        )?;
        let mut messages: Vec<MessageRecord> = rows.iter().map(Self::parse_message).collect();
        messages.reverse();
        Ok(messages)
    }

    /// Get the thread reply count for a list of message IDs
    pub fn get_thread_reply_counts(&self, message_ids: &[String]) -> Result<std::collections::HashMap<String, i64>> {
        let mut counts = std::collections::HashMap::new();
        for id in message_ids {
            let rows = self.query(
                "SELECT COUNT(*) as cnt FROM messages WHERE thread_id = ?",
                json!([id]),
            )?;
            if let Some(row) = rows.first() {
                let cnt = row.get("cnt").and_then(|v| v.as_i64()).unwrap_or(0);
                if cnt > 0 {
                    counts.insert(id.clone(), cnt);
                }
            }
        }
        Ok(counts)
    }

    /// Mark a single message as delivered
    pub fn mark_message_delivered(&self, message_id: &str) -> Result<bool> {
        Ok(self.exec("UPDATE messages SET delivered = 1 WHERE id = ? AND delivered = 0",
            json!([message_id]))? > 0)
    }

    /// Mark a single message as read
    pub fn mark_message_read(&self, message_id: &str) -> Result<bool> {
        Ok(self.exec("UPDATE messages SET delivered = 1, read = 1 WHERE id = ? AND read = 0",
            json!([message_id]))? > 0)
    }

    /// Mark messages as read
    pub fn mark_messages_read(&self, conversation_id: &str) -> Result<i32> {
        let count = self.exec("UPDATE messages SET read = 1 WHERE conversation_id = ? AND read = 0",
            json!([conversation_id]))?;
        self.exec("UPDATE conversations SET unread_count = 0 WHERE id = ?",
            json!([conversation_id]))?;
        Ok(count)
    }

    /// Get a single message by ID
    pub fn get_message(&self, message_id: &str) -> Result<Option<MessageRecord>> {
        let rows = self.query(
            "SELECT id, conversation_id, sender_did, content_encrypted, nonce, timestamp, delivered, read, \
             edited, edited_at, deleted, deleted_at, pinned, pinned_by, pinned_at, reply_to_id, thread_id, forwarded_from \
             FROM messages WHERE id = ?",
            json!([message_id]),
        )?;
        Ok(rows.first().map(Self::parse_message))
    }

    /// Edit a message — update encrypted content
    pub fn edit_message(&self, message_id: &str, new_content_encrypted: &[u8], new_nonce: &[u8], edited_at: i64) -> Result<i32> {
        let ct_hex = hex::encode(new_content_encrypted);
        let nonce_hex = hex::encode(new_nonce);
        self.exec(
            "UPDATE messages SET content_encrypted = ?, nonce = ?, edited = 1, edited_at = ? WHERE id = ?",
            json!([ct_hex, nonce_hex, edited_at, message_id]),
        )
    }

    /// Soft-delete a message
    pub fn delete_message(&self, message_id: &str, deleted_at: i64) -> Result<i32> {
        self.exec(
            "UPDATE messages SET deleted = 1, deleted_at = ? WHERE id = ?",
            json!([deleted_at, message_id]),
        )
    }

    /// Pin a message
    pub fn pin_message(&self, message_id: &str, pinned_by: &str, pinned_at: i64) -> Result<i32> {
        self.exec(
            "UPDATE messages SET pinned = 1, pinned_by = ?, pinned_at = ? WHERE id = ?",
            json!([pinned_by, pinned_at, message_id]),
        )
    }

    /// Unpin a message
    pub fn unpin_message(&self, message_id: &str) -> Result<i32> {
        self.exec(
            "UPDATE messages SET pinned = 0, pinned_by = NULL, pinned_at = NULL WHERE id = ?",
            json!([message_id]),
        )
    }

    /// Get pinned messages for a conversation
    pub fn get_pinned_messages(&self, conversation_id: &str) -> Result<Vec<MessageRecord>> {
        let rows = self.query(
            "SELECT id, conversation_id, sender_did, content_encrypted, nonce, timestamp, delivered, read, \
             edited, edited_at, deleted, deleted_at, pinned, pinned_by, pinned_at, reply_to_id, thread_id, forwarded_from \
             FROM messages WHERE conversation_id = ? AND pinned = 1 ORDER BY pinned_at DESC",
            json!([conversation_id]),
        )?;
        Ok(rows.iter().map(Self::parse_message).collect())
    }

    /// Get thread replies (messages with a given thread_id)
    pub fn get_thread_messages(&self, thread_id: &str) -> Result<Vec<MessageRecord>> {
        let rows = self.query(
            "SELECT id, conversation_id, sender_did, content_encrypted, nonce, timestamp, delivered, read, \
             edited, edited_at, deleted, deleted_at, pinned, pinned_by, pinned_at, reply_to_id, thread_id, forwarded_from \
             FROM messages WHERE thread_id = ? OR id = ? ORDER BY timestamp ASC",
            json!([thread_id, thread_id]),
        )?;
        Ok(rows.iter().map(Self::parse_message).collect())
    }

    /// Store a message with optional threading/forwarding fields
    pub fn store_message_extended(
        &self,
        id: &str,
        conversation_id: &str,
        sender_did: &str,
        content_encrypted: &[u8],
        nonce: &[u8],
        timestamp: i64,
        reply_to_id: Option<&str>,
        thread_id: Option<&str>,
        forwarded_from: Option<&str>,
    ) -> Result<()> {
        let ct_hex = hex::encode(content_encrypted);
        let nonce_hex = hex::encode(nonce);
        self.exec(
            "INSERT INTO messages (id, conversation_id, sender_did, content_encrypted, nonce, timestamp, \
             reply_to_id, thread_id, forwarded_from) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, conversation_id, sender_did, ct_hex, nonce_hex, timestamp,
                   reply_to_id, thread_id, forwarded_from]),
        )?;
        // Update last_message_at
        self.exec("UPDATE conversations SET last_message_at = ? WHERE id = ?",
            json!([timestamp, conversation_id]))?;
        Ok(())
    }

    // ========================================================================
    // REACTION OPERATIONS
    // ========================================================================

    /// Add a reaction to a message
    pub fn add_reaction(&self, id: &str, message_id: &str, user_did: &str, emoji: &str, created_at: i64) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO reactions (id, message_id, user_did, emoji, created_at) VALUES (?, ?, ?, ?, ?)",
            json!([id, message_id, user_did, emoji, created_at]),
        )?;
        Ok(())
    }

    /// Remove a reaction
    pub fn remove_reaction(&self, message_id: &str, user_did: &str, emoji: &str) -> Result<i32> {
        self.exec(
            "DELETE FROM reactions WHERE message_id = ? AND user_did = ? AND emoji = ?",
            json!([message_id, user_did, emoji]),
        )
    }

    /// Get all reactions for a message
    pub fn get_reactions(&self, message_id: &str) -> Result<Vec<ReactionRecord>> {
        let rows = self.query(
            "SELECT id, message_id, user_did, emoji, created_at FROM reactions WHERE message_id = ? ORDER BY created_at ASC",
            json!([message_id]),
        )?;
        Ok(rows.iter().map(Self::parse_reaction).collect())
    }

    // ========================================================================
    // GROUP OPERATIONS
    // ========================================================================

    /// Create a new group
    pub fn create_group(&self, id: &str, name: &str, description: Option<&str>, created_by: &str, created_at: i64) -> Result<()> {
        self.exec(
            "INSERT INTO groups (id, name, description, avatar, created_by, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?, ?)",
            json!([id, name, description, created_by, created_at, created_at]),
        )?;
        Ok(())
    }

    /// Get a group by ID
    pub fn get_group(&self, group_id: &str) -> Result<Option<GroupRecord>> {
        let rows = self.query(
            "SELECT id, name, description, avatar, created_by, created_at, updated_at FROM groups WHERE id = ?",
            json!([group_id]),
        )?;
        Ok(rows.first().map(Self::parse_group))
    }

    /// Get all groups
    pub fn get_all_groups(&self) -> Result<Vec<GroupRecord>> {
        let rows = self.query(
            "SELECT id, name, description, avatar, created_by, created_at, updated_at FROM groups ORDER BY updated_at DESC",
            json!([]),
        )?;
        Ok(rows.iter().map(Self::parse_group).collect())
    }

    /// Update a group
    pub fn update_group(&self, group_id: &str, name: &str, description: Option<&str>, updated_at: i64) -> Result<i32> {
        self.exec(
            "UPDATE groups SET name = ?, description = ?, updated_at = ? WHERE id = ?",
            json!([name, description, updated_at, group_id]),
        )
    }

    /// Delete a group
    pub fn delete_group(&self, group_id: &str) -> Result<i32> {
        self.exec("DELETE FROM groups WHERE id = ?", json!([group_id]))
    }

    /// Add a member to a group
    pub fn add_group_member(&self, group_id: &str, member_did: &str, display_name: Option<&str>, role: &str, joined_at: i64) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO group_members (group_id, member_did, display_name, role, joined_at) VALUES (?, ?, ?, ?, ?)",
            json!([group_id, member_did, display_name, role, joined_at]),
        )?;
        Ok(())
    }

    /// Remove a member from a group
    pub fn remove_group_member(&self, group_id: &str, member_did: &str) -> Result<i32> {
        self.exec(
            "DELETE FROM group_members WHERE group_id = ? AND member_did = ?",
            json!([group_id, member_did]),
        )
    }

    /// Get all members of a group
    pub fn get_group_members(&self, group_id: &str) -> Result<Vec<GroupMemberRecord>> {
        let rows = self.query(
            "SELECT group_id, member_did, display_name, role, joined_at FROM group_members WHERE group_id = ? ORDER BY joined_at ASC",
            json!([group_id]),
        )?;
        Ok(rows.iter().map(Self::parse_group_member).collect())
    }

    /// Create a group conversation
    pub fn create_group_conversation(&self, conv_id: &str, group_id: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.exec(
            "INSERT OR IGNORE INTO conversations (id, friend_did, type, group_id, created_at, unread_count) VALUES (?, NULL, 'group', ?, ?, 0)",
            json!([conv_id, group_id, now]),
        )?;
        Ok(())
    }

    /// Get conversation by group ID
    pub fn get_conversation_by_group(&self, group_id: &str) -> Result<Option<ConversationRecord>> {
        let rows = self.query(
            "SELECT id, friend_did, type, group_id, created_at, last_message_at, unread_count FROM conversations WHERE group_id = ?",
            json!([group_id]),
        )?;
        Ok(rows.first().map(Self::parse_conversation))
    }

    // ========================================================================
    // GROUP KEY OPERATIONS
    // ========================================================================

    /// Store a group encryption key
    pub fn store_group_key(&self, group_id: &str, key_version: i32, encrypted_key: &[u8], created_at: i64) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO group_keys (group_id, key_version, encrypted_key, created_at) VALUES (?, ?, ?, ?)",
            json!([group_id, key_version, hex::encode(encrypted_key), created_at]),
        )?;
        Ok(())
    }

    /// Get the latest group key version
    pub fn get_latest_group_key(&self, group_id: &str) -> Result<Option<GroupKeyRecord>> {
        let rows = self.query(
            "SELECT group_id, key_version, encrypted_key, created_at FROM group_keys WHERE group_id = ? ORDER BY key_version DESC LIMIT 1",
            json!([group_id]),
        )?;
        Ok(rows.first().map(Self::parse_group_key))
    }

    /// Get a specific group key version
    pub fn get_group_key(&self, group_id: &str, key_version: i32) -> Result<Option<GroupKeyRecord>> {
        let rows = self.query(
            "SELECT group_id, key_version, encrypted_key, created_at FROM group_keys WHERE group_id = ? AND key_version = ?",
            json!([group_id, key_version]),
        )?;
        Ok(rows.first().map(Self::parse_group_key))
    }

    // ========================================================================
    // GROUP INVITE OPERATIONS
    // ========================================================================

    /// Store a group invite
    pub fn store_group_invite(&self, invite: &GroupInviteRecord) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO group_invites (id, group_id, group_name, description, inviter_did, inviter_name, encrypted_group_key, nonce, members_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([invite.id, invite.group_id, invite.group_name, invite.description, invite.inviter_did, invite.inviter_name, invite.encrypted_group_key, invite.nonce, invite.members_json, invite.status, invite.created_at]),
        )?;
        Ok(())
    }

    /// Get pending group invites
    pub fn get_pending_group_invites(&self) -> Result<Vec<GroupInviteRecord>> {
        let rows = self.query(
            "SELECT id, group_id, group_name, description, inviter_did, inviter_name, encrypted_group_key, nonce, members_json, status, created_at FROM group_invites WHERE status = 'pending' ORDER BY created_at DESC",
            json!([]),
        )?;
        Ok(rows.iter().map(Self::parse_group_invite).collect())
    }

    /// Get a group invite by ID
    pub fn get_group_invite(&self, id: &str) -> Result<Option<GroupInviteRecord>> {
        let rows = self.query(
            "SELECT id, group_id, group_name, description, inviter_did, inviter_name, encrypted_group_key, nonce, members_json, status, created_at FROM group_invites WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_group_invite))
    }

    /// Update group invite status
    pub fn update_group_invite_status(&self, id: &str, status: &str) -> Result<bool> {
        Ok(self.exec("UPDATE group_invites SET status = ? WHERE id = ?", json!([status, id]))? > 0)
    }

    // ========================================================================
    // FRIEND REQUEST OPERATIONS
    // ========================================================================

    /// Store a friend request
    pub fn store_friend_request(&self, r: &FriendRequestRecord) -> Result<()> {
        self.exec(
            "INSERT INTO friend_requests (id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([r.id, r.from_did, r.to_did, r.direction, r.message, r.from_signing_key, r.from_encryption_key, r.from_display_name, r.created_at, r.status]),
        )?;
        Ok(())
    }

    /// Get pending friend requests
    pub fn get_pending_requests(&self, direction: &str) -> Result<Vec<FriendRequestRecord>> {
        let rows = self.query(
            "SELECT id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, created_at, status
             FROM friend_requests WHERE status = 'pending' AND direction = ? ORDER BY created_at DESC",
            json!([direction]),
        )?;
        Ok(rows.iter().map(Self::parse_friend_request).collect())
    }

    /// Get a friend request by ID
    pub fn get_friend_request(&self, id: &str) -> Result<Option<FriendRequestRecord>> {
        let rows = self.query(
            "SELECT id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, created_at, status
             FROM friend_requests WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_friend_request))
    }

    /// Update friend request status
    pub fn update_request_status(&self, id: &str, status: &str) -> Result<bool> {
        Ok(self.exec("UPDATE friend_requests SET status = ? WHERE id = ?", json!([status, id]))? > 0)
    }

    // ========================================================================
    // BLOCKED USERS OPERATIONS
    // ========================================================================

    /// Block a user
    pub fn block_user(&self, did: &str, reason: Option<&str>) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.exec("INSERT OR REPLACE INTO blocked_users (did, blocked_at, reason) VALUES (?, ?, ?)",
            json!([did, now, reason]))?;
        Ok(())
    }

    /// Unblock a user
    pub fn unblock_user(&self, did: &str) -> Result<bool> {
        Ok(self.exec("DELETE FROM blocked_users WHERE did = ?", json!([did]))? > 0)
    }

    /// Check if a user is blocked
    pub fn is_blocked(&self, did: &str) -> Result<bool> {
        let count: Option<i64> = self.query_scalar("SELECT COUNT(*) FROM blocked_users WHERE did = ?", json!([did]))?;
        Ok(count.unwrap_or(0) > 0)
    }

    // ========================================================================
    // SETTINGS OPERATIONS
    // ========================================================================

    /// Get a setting value
    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        self.query_scalar("SELECT value FROM settings WHERE key = ?", json!([key]))
    }

    /// Set a setting value
    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.exec("INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
            json!([key, value, now]))?;
        Ok(())
    }

    /// Delete a setting
    pub fn delete_setting(&self, key: &str) -> Result<bool> {
        Ok(self.exec("DELETE FROM settings WHERE key = ?", json!([key]))? > 0)
    }

    // ── Plugin KV Storage ─────────────────────────────────────────────────

    /// Get a plugin KV value
    pub fn plugin_kv_get(&self, plugin_id: &str, key: &str) -> Result<Option<String>> {
        self.query_scalar(
            "SELECT value FROM plugin_kv WHERE plugin_id = ? AND key = ?",
            json!([plugin_id, key]),
        )
    }

    /// Set a plugin KV value (upsert)
    pub fn plugin_kv_set(&self, plugin_id: &str, key: &str, value: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.exec(
            "INSERT OR REPLACE INTO plugin_kv (plugin_id, key, value, updated_at) VALUES (?, ?, ?, ?)",
            json!([plugin_id, key, value, now]),
        )?;
        Ok(())
    }

    /// Delete a plugin KV entry
    pub fn plugin_kv_delete(&self, plugin_id: &str, key: &str) -> Result<bool> {
        Ok(self.exec(
            "DELETE FROM plugin_kv WHERE plugin_id = ? AND key = ?",
            json!([plugin_id, key]),
        )? > 0)
    }

    /// List plugin KV keys (optionally filtered by prefix)
    pub fn plugin_kv_list(&self, plugin_id: &str, prefix: &str) -> Result<Vec<String>> {
        let rows = if prefix.is_empty() {
            self.query(
                "SELECT key FROM plugin_kv WHERE plugin_id = ? ORDER BY key",
                json!([plugin_id]),
            )?
        } else {
            let like_pattern = format!("{}%", prefix);
            self.query(
                "SELECT key FROM plugin_kv WHERE plugin_id = ? AND key LIKE ? ORDER BY key",
                json!([plugin_id, like_pattern]),
            )?
        };

        Ok(rows.iter().filter_map(|r| r.get(0).and_then(|v| v.as_str().map(|s| s.to_string()))).collect())
    }

    /// Delete all KV entries for a plugin
    pub fn plugin_kv_delete_all(&self, plugin_id: &str) -> Result<i32> {
        self.exec("DELETE FROM plugin_kv WHERE plugin_id = ?", json!([plugin_id]))
    }

    // ── Plugin Bundle Storage ─────────────────────────────────────────────

    /// Save a plugin bundle (upsert)
    pub fn plugin_bundle_save(&self, plugin_id: &str, manifest: &str, bundle: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.exec(
            "INSERT OR REPLACE INTO plugin_bundles (plugin_id, manifest, bundle, installed_at) VALUES (?, ?, ?, ?)",
            json!([plugin_id, manifest, bundle, now]),
        )?;
        Ok(())
    }

    /// Load a plugin bundle by ID
    pub fn plugin_bundle_load(&self, plugin_id: &str) -> Result<Option<PluginBundleRecord>> {
        let rows = self.query(
            "SELECT plugin_id, manifest, bundle, installed_at FROM plugin_bundles WHERE plugin_id = ?",
            json!([plugin_id]),
        )?;

        if rows.is_empty() {
            return Ok(None);
        }

        let row = &rows[0];
        Ok(Some(PluginBundleRecord {
            plugin_id: row.get(0).and_then(|v| v.as_str()).unwrap_or_default().to_string(),
            manifest: row.get(1).and_then(|v| v.as_str()).unwrap_or_default().to_string(),
            bundle: row.get(2).and_then(|v| v.as_str()).unwrap_or_default().to_string(),
            installed_at: row.get(3).and_then(|v| v.as_i64()).unwrap_or(0),
        }))
    }

    /// Delete a plugin bundle
    pub fn plugin_bundle_delete(&self, plugin_id: &str) -> Result<bool> {
        // Also clean up KV storage
        let _ = self.plugin_kv_delete_all(plugin_id);
        Ok(self.exec("DELETE FROM plugin_bundles WHERE plugin_id = ?", json!([plugin_id]))? > 0)
    }

    /// List all installed plugin bundles
    pub fn plugin_bundle_list(&self) -> Result<Vec<PluginBundleRecord>> {
        let rows = self.query(
            "SELECT plugin_id, manifest, bundle, installed_at FROM plugin_bundles ORDER BY installed_at DESC",
            json!([]),
        )?;

        Ok(rows.iter().map(|row| {
            PluginBundleRecord {
                plugin_id: row.get(0).and_then(|v| v.as_str()).unwrap_or_default().to_string(),
                manifest: row.get(1).and_then(|v| v.as_str()).unwrap_or_default().to_string(),
                bundle: String::new(), // Don't return full bundle in list (can be large)
                installed_at: row.get(3).and_then(|v| v.as_i64()).unwrap_or(0),
            }
        }).collect())
    }
}

// ============================================================================
// RECORD TYPES (identical to native — must match exactly)
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
    /// Whether this message has been edited
    pub edited: bool,
    /// When it was edited
    pub edited_at: Option<i64>,
    /// Whether this message has been deleted
    pub deleted: bool,
    /// When it was deleted
    pub deleted_at: Option<i64>,
    /// Whether this message is pinned
    pub pinned: bool,
    /// Who pinned it
    pub pinned_by: Option<String>,
    /// When it was pinned
    pub pinned_at: Option<i64>,
    /// ID of message this replies to
    pub reply_to_id: Option<String>,
    /// Thread ID (parent message ID)
    pub thread_id: Option<String>,
    /// Original message ID if forwarded
    pub forwarded_from: Option<String>,
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
    /// Emoji
    pub emoji: String,
    /// Created timestamp
    pub created_at: i64,
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
    /// Avatar URL/data
    pub avatar: Option<String>,
    /// DID of creator
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
    /// Display name in this group
    pub display_name: Option<String>,
    /// Role: "admin" or "member"
    pub role: String,
    /// When they joined
    pub joined_at: i64,
}

/// A group encryption key record
#[derive(Debug, Clone)]
pub struct GroupKeyRecord {
    /// Group ID
    pub group_id: String,
    /// Key version number (increments on rotation)
    pub key_version: i32,
    /// Encrypted key data
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
