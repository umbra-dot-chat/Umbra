//! # WASM Database
//!
//! SQLite database for WebAssembly using sql.js via JavaScript interop.
//!
//! This module provides the same `Database` API as `database.rs` but uses
//! `wasm_bindgen` to call into a JavaScript-side sql.js instance instead
//! of using `rusqlite` directly (which requires C compilation and won't
//! target `wasm32-unknown-unknown`).

use super::schema;
use crate::error::{Error, Result};
use serde_json::json;
use wasm_bindgen::prelude::*;

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
    fn sql_bridge_query_value(sql: &str, params_json: &str)
        -> std::result::Result<String, JsValue>;
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
        let version: Option<i32> = self
            .query_scalar_raw("SELECT version FROM schema_version LIMIT 1", "[]")
            .ok()
            .flatten();

        match version {
            None => {
                sql_bridge_execute_batch(schema::CREATE_TABLES).map_err(js_err)?;
                let params = json!([schema::SCHEMA_VERSION]).to_string();
                sql_bridge_execute("INSERT INTO schema_version (version) VALUES (?)", &params)
                    .map_err(js_err)?;
                tracing::info!(
                    "Database schema created (version {})",
                    schema::SCHEMA_VERSION
                );
            }
            Some(v) if v < schema::SCHEMA_VERSION => {
                tracing::info!(
                    "Schema version {} < current {}, running migrations",
                    v,
                    schema::SCHEMA_VERSION
                );
                self.run_migrations(v)?;
            }
            Some(v) => {
                tracing::debug!("Database schema version: {}", v);
            }
        }

        // Fixup: ensure metadata_json column exists on community_messages.
        // This handles databases that were created at v13+ via CREATE_TABLES
        // before the column was added to the base schema.
        let _ = sql_bridge_execute_batch(
            "ALTER TABLE community_messages ADD COLUMN metadata_json TEXT;"
        );

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
        if from_version < 5 {
            tracing::info!("Running migration v4 → v5 (call history)");
            sql_bridge_execute_batch(schema::MIGRATE_V4_TO_V5).map_err(js_err)?;
            tracing::info!("Migration v4 → v5 complete");
        }
        if from_version < 6 {
            tracing::info!("Running migration v5 → v6 (communities)");
            sql_bridge_execute_batch(schema::MIGRATE_V5_TO_V6).map_err(js_err)?;
            tracing::info!("Migration v5 → v6 complete");
        }
        if from_version < 7 {
            tracing::info!("Running migration v6 → v7 (timeouts, thread followers, member status, notification settings)");
            sql_bridge_execute_batch(schema::MIGRATE_V6_TO_V7).map_err(js_err)?;
            tracing::info!("Migration v6 → v7 complete");
        }
        if from_version < 8 {
            tracing::info!("Running migration v7 → v8 (categories)");
            sql_bridge_execute_batch(schema::MIGRATE_V7_TO_V8).map_err(js_err)?;
            tracing::info!("Migration v7 → v8 complete");
        }
        if from_version < 9 {
            tracing::info!("Running migration v8 → v9 (file chunks, manifests, DM files)");
            sql_bridge_execute_batch(schema::MIGRATE_V8_TO_V9).map_err(js_err)?;
            tracing::info!("Migration v8 → v9 complete");
        }
        if from_version < 10 {
            tracing::info!("Running migration v9 → v10 (transfer sessions, auto-versioning)");
            sql_bridge_execute_batch(schema::MIGRATE_V9_TO_V10).map_err(js_err)?;
            tracing::info!("Migration v9 → v10 complete");
        }
        if from_version < 11 {
            tracing::info!(
                "Running migration v10 → v11 (encryption metadata, re-encryption flags)"
            );
            sql_bridge_execute_batch(schema::MIGRATE_V10_TO_V11).map_err(js_err)?;
            tracing::info!("Migration v10 → v11 complete");
        }
        if from_version < 12 {
            tracing::info!("Running migration v11 → v12 (community seats)");
            sql_bridge_execute_batch(schema::MIGRATE_V11_TO_V12).map_err(js_err)?;
            tracing::info!("Migration v11 → v12 complete");
        }
        if from_version < 13 {
            tracing::info!("Running migration v12 → v13 (sticker packs, metadata, placements)");
            sql_bridge_execute_batch(schema::MIGRATE_V12_TO_V13).map_err(js_err)?;
            tracing::info!("Migration v12 → v13 complete");
        }
        if from_version < 14 {
            tracing::info!("Running migration v13 → v14 (friend avatars)");
            sql_bridge_execute_batch(schema::MIGRATE_V13_TO_V14).map_err(js_err)?;
            tracing::info!("Migration v13 → v14 complete");
        }
        if from_version < 15 {
            tracing::info!("Running migration v14 → v15 (friend request avatars)");
            sql_bridge_execute_batch(schema::MIGRATE_V14_TO_V15).map_err(js_err)?;
            tracing::info!("Migration v14 → v15 complete");
        }
        if from_version < 16 {
            tracing::info!("Running migration v15 → v16 (notifications table)");
            sql_bridge_execute_batch(schema::MIGRATE_V15_TO_V16).map_err(js_err)?;
            tracing::info!("Migration v15 → v16 complete");
        }
        if from_version < 17 {
            tracing::info!("Running migration v16 → v17 (community origin ID)");
            sql_bridge_execute_batch(schema::MIGRATE_V16_TO_V17).map_err(js_err)?;
            tracing::info!("Migration v16 → v17 complete");
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

    fn query_scalar_raw<T: serde::de::DeserializeOwned>(
        &self,
        sql: &str,
        params_json: &str,
    ) -> Result<Option<T>> {
        let json_str = sql_bridge_query_value(sql, params_json).map_err(js_err)?;
        if json_str == "null" || json_str.is_empty() {
            return Ok(None);
        }
        serde_json::from_str(&json_str)
            .map(Some)
            .map_err(|e| Error::DatabaseError(format!("Failed to parse scalar: {}", e)))
    }

    fn query_scalar<T: serde::de::DeserializeOwned>(
        &self,
        sql: &str,
        params: serde_json::Value,
    ) -> Result<Option<T>> {
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
            avatar: row["avatar"].as_str().map(|s| s.to_string()),
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
            encrypted_key: row["encrypted_key"]
                .as_str()
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
            encrypted_group_key: row["encrypted_group_key"]
                .as_str()
                .unwrap_or("")
                .to_string(),
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
            from_avatar: row["from_avatar"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            status: row["status"].as_str().unwrap_or("pending").to_string(),
        }
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
        self.add_friend_with_avatar(did, display_name, signing_key, encryption_key, status, None)
    }

    /// Add a new friend with optional avatar
    pub fn add_friend_with_avatar(
        &self,
        did: &str,
        display_name: &str,
        signing_key: &[u8; 32],
        encryption_key: &[u8; 32],
        status: Option<&str>,
        avatar: Option<&str>,
    ) -> Result<i64> {
        let now = crate::time::now_timestamp();
        self.exec(
            "INSERT INTO friends (did, display_name, signing_key, encryption_key, status, avatar, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            json!([did, display_name, hex::encode(signing_key), hex::encode(encryption_key), status, avatar, now, now]),
        )?;
        let id: Option<i64> = self.query_scalar("SELECT last_insert_rowid()", json!([]))?;
        Ok(id.unwrap_or(0))
    }

    /// Get a friend by DID
    pub fn get_friend(&self, did: &str) -> Result<Option<FriendRecord>> {
        let rows = self.query(
            "SELECT id, did, display_name, signing_key, encryption_key, status, avatar, created_at, updated_at FROM friends WHERE did = ?",
            json!([did]),
        )?;
        Ok(rows.first().map(Self::parse_friend))
    }

    /// Get all friends
    pub fn get_all_friends(&self) -> Result<Vec<FriendRecord>> {
        let rows = self.query(
            "SELECT id, did, display_name, signing_key, encryption_key, status, avatar, created_at, updated_at FROM friends ORDER BY display_name",
            json!([]),
        )?;
        Ok(rows.iter().map(Self::parse_friend).collect())
    }

    /// Remove a friend by DID
    pub fn remove_friend(&self, did: &str) -> Result<bool> {
        Ok(self.exec("DELETE FROM friends WHERE did = ?", json!([did]))? > 0)
    }

    /// Update a friend's profile
    pub fn update_friend(
        &self,
        did: &str,
        display_name: Option<&str>,
        status: Option<&str>,
    ) -> Result<bool> {
        let now = crate::time::now_timestamp();
        let affected = if let Some(name) = display_name {
            self.exec(
                "UPDATE friends SET display_name = ?, status = ?, updated_at = ? WHERE did = ?",
                json!([name, status, now, did]),
            )?
        } else {
            self.exec(
                "UPDATE friends SET status = ?, updated_at = ? WHERE did = ?",
                json!([status, now, did]),
            )?
        };
        Ok(affected > 0)
    }

    /// Update a friend's avatar
    pub fn update_friend_avatar(&self, did: &str, avatar: Option<&str>) -> Result<bool> {
        let now = crate::time::now_timestamp();
        let affected = self.exec(
            "UPDATE friends SET avatar = ?, updated_at = ? WHERE did = ?",
            json!([avatar, now, did]),
        )?;
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
    pub fn get_conversation_by_friend(
        &self,
        friend_did: &str,
    ) -> Result<Option<ConversationRecord>> {
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
    pub fn store_message(
        &self,
        id: &str,
        conversation_id: &str,
        sender_did: &str,
        content_encrypted: &[u8],
        nonce: &[u8],
        timestamp: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO messages (id, conversation_id, sender_did, content_encrypted, nonce, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            json!([id, conversation_id, sender_did, hex::encode(content_encrypted), hex::encode(nonce), timestamp]),
        )?;
        self.exec(
            "UPDATE conversations SET last_message_at = ? WHERE id = ?",
            json!([timestamp, conversation_id]),
        )?;
        Ok(())
    }

    /// Get messages for a conversation
    pub fn get_messages(
        &self,
        conversation_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<MessageRecord>> {
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
    pub fn get_thread_reply_counts(
        &self,
        message_ids: &[String],
    ) -> Result<std::collections::HashMap<String, i64>> {
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

    /// Mark a single message as sent (relay confirmed receipt).
    /// This is a logical status update — no DB column change needed.
    pub fn mark_message_sent(&self, _message_id: &str) -> Result<()> {
        Ok(())
    }

    /// Mark a single message as delivered
    pub fn mark_message_delivered(&self, message_id: &str) -> Result<bool> {
        Ok(self.exec(
            "UPDATE messages SET delivered = 1 WHERE id = ? AND delivered = 0",
            json!([message_id]),
        )? > 0)
    }

    /// Mark a single message as read
    pub fn mark_message_read(&self, message_id: &str) -> Result<bool> {
        Ok(self.exec(
            "UPDATE messages SET delivered = 1, read = 1 WHERE id = ? AND read = 0",
            json!([message_id]),
        )? > 0)
    }

    /// Mark messages as read
    pub fn mark_messages_read(&self, conversation_id: &str) -> Result<i32> {
        let count = self.exec(
            "UPDATE messages SET read = 1 WHERE conversation_id = ? AND read = 0",
            json!([conversation_id]),
        )?;
        self.exec(
            "UPDATE conversations SET unread_count = 0 WHERE id = ?",
            json!([conversation_id]),
        )?;
        Ok(count)
    }

    /// Increment unread count for a conversation
    pub fn increment_unread_count(&self, conversation_id: &str) -> Result<i32> {
        self.exec(
            "UPDATE conversations SET unread_count = unread_count + 1 WHERE id = ?",
            json!([conversation_id]),
        )
    }

    /// Update last_message_at timestamp for a conversation
    pub fn update_last_message_at(&self, conversation_id: &str, timestamp: i64) -> Result<i32> {
        self.exec(
            "UPDATE conversations SET last_message_at = ? WHERE id = ?",
            json!([timestamp, conversation_id]),
        )
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
    pub fn edit_message(
        &self,
        message_id: &str,
        new_content_encrypted: &[u8],
        new_nonce: &[u8],
        edited_at: i64,
    ) -> Result<i32> {
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
        self.exec(
            "UPDATE conversations SET last_message_at = ? WHERE id = ?",
            json!([timestamp, conversation_id]),
        )?;
        Ok(())
    }

    // ========================================================================
    // REACTION OPERATIONS
    // ========================================================================

    /// Add a reaction to a message
    pub fn add_reaction(
        &self,
        id: &str,
        message_id: &str,
        user_did: &str,
        emoji: &str,
        created_at: i64,
    ) -> Result<()> {
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
    pub fn create_group(
        &self,
        id: &str,
        name: &str,
        description: Option<&str>,
        created_by: &str,
        created_at: i64,
    ) -> Result<()> {
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
    pub fn update_group(
        &self,
        group_id: &str,
        name: &str,
        description: Option<&str>,
        updated_at: i64,
    ) -> Result<i32> {
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
    pub fn add_group_member(
        &self,
        group_id: &str,
        member_did: &str,
        display_name: Option<&str>,
        role: &str,
        joined_at: i64,
    ) -> Result<()> {
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
    pub fn store_group_key(
        &self,
        group_id: &str,
        key_version: i32,
        encrypted_key: &[u8],
        created_at: i64,
    ) -> Result<()> {
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
    pub fn get_group_key(
        &self,
        group_id: &str,
        key_version: i32,
    ) -> Result<Option<GroupKeyRecord>> {
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
        Ok(self.exec(
            "UPDATE group_invites SET status = ? WHERE id = ?",
            json!([status, id]),
        )? > 0)
    }

    // ========================================================================
    // FRIEND REQUEST OPERATIONS
    // ========================================================================

    /// Store a friend request
    /// Store a friend request (ignores duplicates by ID silently).
    /// Returns true if a new row was inserted, false if it was a duplicate.
    pub fn store_friend_request(&self, r: &FriendRequestRecord) -> Result<bool> {
        let rows = self.exec(
            "INSERT OR IGNORE INTO friend_requests (id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, from_avatar, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([r.id, r.from_did, r.to_did, r.direction, r.message, r.from_signing_key, r.from_encryption_key, r.from_display_name, r.from_avatar, r.created_at, r.status]),
        )?;
        Ok(rows > 0)
    }

    /// Check if there is already a pending request involving this DID in the given direction.
    pub fn has_pending_request(&self, did: &str, direction: &str) -> Result<bool> {
        let col = if direction == "outgoing" { "to_did" } else { "from_did" };
        let rows = self.query(
            &format!(
                "SELECT COUNT(*) as cnt FROM friend_requests WHERE {} = ? AND direction = ? AND status = 'pending'",
                col
            ),
            json!([did, direction]),
        )?;
        if let Some(row) = rows.first() {
            Ok(row["cnt"].as_i64().unwrap_or(0) > 0)
        } else {
            Ok(false)
        }
    }

    /// Get pending friend requests
    pub fn get_pending_requests(&self, direction: &str) -> Result<Vec<FriendRequestRecord>> {
        let rows = self.query(
            "SELECT id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, from_avatar, created_at, status
             FROM friend_requests WHERE status = 'pending' AND direction = ? ORDER BY created_at DESC",
            json!([direction]),
        )?;
        Ok(rows.iter().map(Self::parse_friend_request).collect())
    }

    /// Get a friend request by ID
    pub fn get_friend_request(&self, id: &str) -> Result<Option<FriendRequestRecord>> {
        let rows = self.query(
            "SELECT id, from_did, to_did, direction, message, from_signing_key, from_encryption_key, from_display_name, from_avatar, created_at, status
             FROM friend_requests WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_friend_request))
    }

    /// Update friend request status
    pub fn update_request_status(&self, id: &str, status: &str) -> Result<bool> {
        Ok(self.exec(
            "UPDATE friend_requests SET status = ? WHERE id = ?",
            json!([status, id]),
        )? > 0)
    }

    // ========================================================================
    // BLOCKED USERS OPERATIONS
    // ========================================================================

    /// Block a user
    pub fn block_user(&self, did: &str, reason: Option<&str>) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.exec(
            "INSERT OR REPLACE INTO blocked_users (did, blocked_at, reason) VALUES (?, ?, ?)",
            json!([did, now, reason]),
        )?;
        Ok(())
    }

    /// Unblock a user
    pub fn unblock_user(&self, did: &str) -> Result<bool> {
        Ok(self.exec("DELETE FROM blocked_users WHERE did = ?", json!([did]))? > 0)
    }

    /// Check if a user is blocked
    pub fn is_blocked(&self, did: &str) -> Result<bool> {
        let count: Option<i64> = self.query_scalar(
            "SELECT COUNT(*) FROM blocked_users WHERE did = ?",
            json!([did]),
        )?;
        Ok(count.unwrap_or(0) > 0)
    }

    /// Get all blocked users
    pub fn get_blocked_users(&self) -> Result<Vec<(String, i64, Option<String>)>> {
        let rows = self.query(
            "SELECT did, blocked_at, reason FROM blocked_users ORDER BY blocked_at DESC",
            json!([]),
        )?;
        Ok(rows
            .iter()
            .map(|r| {
                let did = r["did"].as_str().unwrap_or("").to_string();
                let blocked_at = r["blocked_at"].as_i64().unwrap_or(0);
                let reason = r["reason"].as_str().map(|s| s.to_string());
                (did, blocked_at, reason)
            })
            .collect())
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
        self.exec(
            "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
            json!([key, value, now]),
        )?;
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

        Ok(rows
            .iter()
            .filter_map(|r| r.get(0).and_then(|v| v.as_str().map(|s| s.to_string())))
            .collect())
    }

    /// Delete all KV entries for a plugin
    pub fn plugin_kv_delete_all(&self, plugin_id: &str) -> Result<i32> {
        self.exec(
            "DELETE FROM plugin_kv WHERE plugin_id = ?",
            json!([plugin_id]),
        )
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
            plugin_id: row
                .get(0)
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string(),
            manifest: row
                .get(1)
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string(),
            bundle: row
                .get(2)
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .to_string(),
            installed_at: row.get(3).and_then(|v| v.as_i64()).unwrap_or(0),
        }))
    }

    /// Delete a plugin bundle
    pub fn plugin_bundle_delete(&self, plugin_id: &str) -> Result<bool> {
        // Also clean up KV storage
        let _ = self.plugin_kv_delete_all(plugin_id);
        Ok(self.exec(
            "DELETE FROM plugin_bundles WHERE plugin_id = ?",
            json!([plugin_id]),
        )? > 0)
    }

    /// List all installed plugin bundles
    pub fn plugin_bundle_list(&self) -> Result<Vec<PluginBundleRecord>> {
        let rows = self.query(
            "SELECT plugin_id, manifest, bundle, installed_at FROM plugin_bundles ORDER BY installed_at DESC",
            json!([]),
        )?;

        Ok(rows
            .iter()
            .map(|row| PluginBundleRecord {
                plugin_id: row
                    .get(0)
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .to_string(),
                manifest: row
                    .get(1)
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .to_string(),
                bundle: String::new(),
                installed_at: row.get(3).and_then(|v| v.as_i64()).unwrap_or(0),
            })
            .collect())
    }

    // ========================================================================
    // CALL HISTORY OPERATIONS
    // ========================================================================

    /// Store a call record
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
        let now = crate::time::now_timestamp();
        self.exec(
            "INSERT INTO call_history (id, conversation_id, call_type, direction, status, participants_json, started_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, conversation_id, call_type, direction, status, participants, started_at, now]),
        )?;
        Ok(())
    }

    /// End a call record
    pub fn end_call_record(
        &self,
        id: &str,
        status: &str,
        ended_at: i64,
        duration_ms: i64,
    ) -> Result<bool> {
        let affected = self.exec(
            "UPDATE call_history SET status = ?, ended_at = ?, duration_ms = ? WHERE id = ?",
            json!([status, ended_at, duration_ms, id]),
        )?;
        Ok(affected > 0)
    }

    /// Get call history for a conversation
    pub fn get_call_history(
        &self,
        conversation_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CallHistoryRecord>> {
        let rows = self.query(
            "SELECT id, conversation_id, call_type, direction, status, participants_json, started_at, ended_at, duration_ms, created_at FROM call_history WHERE conversation_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?",
            json!([conversation_id, limit as i64, offset as i64]),
        )?;
        Ok(rows.iter().map(Self::parse_call_history).collect())
    }

    /// Get all call history
    pub fn get_all_call_history(
        &self,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CallHistoryRecord>> {
        let rows = self.query(
            "SELECT id, conversation_id, call_type, direction, status, participants_json, started_at, ended_at, duration_ms, created_at FROM call_history ORDER BY started_at DESC LIMIT ? OFFSET ?",
            json!([limit as i64, offset as i64]),
        )?;
        Ok(rows.iter().map(Self::parse_call_history).collect())
    }

    fn parse_call_history(row: &serde_json::Value) -> CallHistoryRecord {
        CallHistoryRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            conversation_id: row["conversation_id"].as_str().unwrap_or("").to_string(),
            call_type: row["call_type"].as_str().unwrap_or("").to_string(),
            direction: row["direction"].as_str().unwrap_or("").to_string(),
            status: row["status"].as_str().unwrap_or("").to_string(),
            participants: row["participants_json"]
                .as_str()
                .unwrap_or("[]")
                .to_string(),
            started_at: row["started_at"].as_i64().unwrap_or(0),
            ended_at: row["ended_at"].as_i64(),
            duration_ms: row["duration_ms"].as_i64(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }
    }

    // ========================================================================
    // NOTIFICATION OPERATIONS
    // ========================================================================

    /// Create a new notification
    pub fn create_notification(
        &self,
        id: &str,
        notification_type: &str,
        title: &str,
        description: Option<&str>,
        related_did: Option<&str>,
        related_id: Option<&str>,
        avatar: Option<&str>,
    ) -> Result<NotificationRecord> {
        let now = crate::time::now_timestamp_millis();
        self.exec(
            "INSERT INTO notifications (id, type, title, description, related_did, related_id, avatar, read, dismissed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)",
            json!([id, notification_type, title, description, related_did, related_id, avatar, now, now]),
        )?;
        Ok(NotificationRecord {
            id: id.to_string(),
            notification_type: notification_type.to_string(),
            title: title.to_string(),
            description: description.map(|s| s.to_string()),
            related_did: related_did.map(|s| s.to_string()),
            related_id: related_id.map(|s| s.to_string()),
            avatar: avatar.map(|s| s.to_string()),
            read: false,
            dismissed: false,
            action_taken: None,
            created_at: now,
            updated_at: now,
        })
    }

    /// Get notifications with optional filters
    pub fn get_notifications(
        &self,
        notification_type: Option<&str>,
        read: Option<bool>,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<NotificationRecord>> {
        let mut sql = String::from(
            "SELECT id, type, title, description, related_did, related_id, avatar, read, dismissed, action_taken, created_at, updated_at FROM notifications WHERE dismissed = 0"
        );
        let mut params: Vec<serde_json::Value> = Vec::new();

        if let Some(t) = notification_type {
            sql.push_str(" AND type = ?");
            params.push(json!(t));
        }
        if let Some(r) = read {
            sql.push_str(" AND read = ?");
            params.push(json!(if r { 1 } else { 0 }));
        }

        sql.push_str(" ORDER BY created_at DESC LIMIT ? OFFSET ?");
        params.push(json!(limit as i64));
        params.push(json!(offset as i64));

        let rows = self.query(&sql, serde_json::Value::Array(params))?;
        Ok(rows.iter().map(Self::parse_notification).collect())
    }

    /// Mark a single notification as read
    pub fn mark_notification_read(&self, id: &str) -> Result<bool> {
        let now = crate::time::now_timestamp_millis();
        let affected = self.exec(
            "UPDATE notifications SET read = 1, updated_at = ? WHERE id = ?",
            json!([now, id]),
        )?;
        Ok(affected > 0)
    }

    /// Mark all notifications as read, optionally filtered by type
    pub fn mark_all_notifications_read(&self, notification_type: Option<&str>) -> Result<i32> {
        let now = crate::time::now_timestamp_millis();
        match notification_type {
            Some(t) => self.exec(
                "UPDATE notifications SET read = 1, updated_at = ? WHERE read = 0 AND type = ?",
                json!([now, t]),
            ),
            None => self.exec(
                "UPDATE notifications SET read = 1, updated_at = ? WHERE read = 0",
                json!([now]),
            ),
        }
    }

    /// Dismiss (soft-delete) a notification
    pub fn dismiss_notification(&self, id: &str) -> Result<bool> {
        let now = crate::time::now_timestamp_millis();
        let affected = self.exec(
            "UPDATE notifications SET dismissed = 1, updated_at = ? WHERE id = ?",
            json!([now, id]),
        )?;
        Ok(affected > 0)
    }

    /// Get unread counts per category
    pub fn get_notification_unread_counts(&self) -> Result<serde_json::Value> {
        let rows = self.query(
            "SELECT type, COUNT(*) as cnt FROM notifications WHERE read = 0 AND dismissed = 0 GROUP BY type",
            json!([]),
        )?;

        let mut social = 0i64;
        let mut calls = 0i64;
        let mut mentions = 0i64;
        let mut system = 0i64;

        for row in &rows {
            let t = row["type"].as_str().unwrap_or("");
            let cnt = row["cnt"].as_i64().unwrap_or(0);
            match t {
                "friend_request_received" | "friend_request_accepted" | "friend_request_rejected"
                | "group_invite" | "community_invite" => social += cnt,
                "call_missed" | "call_completed" => calls += cnt,
                "mention" => mentions += cnt,
                "system" => system += cnt,
                _ => system += cnt,
            }
        }

        let all = social + calls + mentions + system;
        Ok(json!({
            "all": all,
            "social": social,
            "calls": calls,
            "mentions": mentions,
            "system": system,
        }))
    }

    fn parse_notification(row: &serde_json::Value) -> NotificationRecord {
        NotificationRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            notification_type: row["type"].as_str().unwrap_or("").to_string(),
            title: row["title"].as_str().unwrap_or("").to_string(),
            description: row["description"].as_str().map(|s| s.to_string()),
            related_did: row["related_did"].as_str().map(|s| s.to_string()),
            related_id: row["related_id"].as_str().map(|s| s.to_string()),
            avatar: row["avatar"].as_str().map(|s| s.to_string()),
            read: row["read"].as_i64().unwrap_or(0) != 0,
            dismissed: row["dismissed"].as_i64().unwrap_or(0) != 0,
            action_taken: row["action_taken"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    // ========================================================================
    // COMMUNITY OPERATIONS
    // ========================================================================

    // ── Community parse helpers ──────────────────────────────────────────

    fn parse_community(row: &serde_json::Value) -> CommunityRecord {
        CommunityRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().unwrap_or("").to_string(),
            description: row["description"].as_str().map(|s| s.to_string()),
            icon_url: row["icon_url"].as_str().map(|s| s.to_string()),
            banner_url: row["banner_url"].as_str().map(|s| s.to_string()),
            splash_url: row["splash_url"].as_str().map(|s| s.to_string()),
            accent_color: row["accent_color"].as_str().map(|s| s.to_string()),
            custom_css: row["custom_css"].as_str().map(|s| s.to_string()),
            owner_did: row["owner_did"].as_str().unwrap_or("").to_string(),
            vanity_url: row["vanity_url"].as_str().map(|s| s.to_string()),
            origin_community_id: row["origin_community_id"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_community_space(row: &serde_json::Value) -> CommunitySpaceRecord {
        CommunitySpaceRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().unwrap_or("").to_string(),
            position: row["position"].as_i64().unwrap_or(0) as i32,
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_community_category(row: &serde_json::Value) -> CommunityCategoryRecord {
        CommunityCategoryRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            space_id: row["space_id"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().unwrap_or("").to_string(),
            position: row["position"].as_i64().unwrap_or(0) as i32,
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_community_channel(row: &serde_json::Value) -> CommunityChannelRecord {
        CommunityChannelRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            space_id: row["space_id"].as_str().unwrap_or("").to_string(),
            category_id: row["category_id"].as_str().map(|s| s.to_string()),
            name: row["name"].as_str().unwrap_or("").to_string(),
            channel_type: row["type"].as_str().unwrap_or("text").to_string(),
            topic: row["topic"].as_str().map(|s| s.to_string()),
            position: row["position"].as_i64().unwrap_or(0) as i32,
            slow_mode_seconds: row["slow_mode_seconds"].as_i64().unwrap_or(0) as i32,
            e2ee_enabled: row["e2ee_enabled"].as_i64().unwrap_or(0) != 0,
            pin_limit: row["pin_limit"].as_i64().unwrap_or(50) as i32,
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_community_role(row: &serde_json::Value) -> CommunityRoleRecord {
        CommunityRoleRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().unwrap_or("").to_string(),
            color: row["color"].as_str().map(|s| s.to_string()),
            icon: row["icon"].as_str().map(|s| s.to_string()),
            badge: row["badge"].as_str().map(|s| s.to_string()),
            position: row["position"].as_i64().unwrap_or(0) as i32,
            hoisted: row["hoisted"].as_i64().unwrap_or(0) != 0,
            mentionable: row["mentionable"].as_i64().unwrap_or(0) != 0,
            is_preset: row["is_preset"].as_i64().unwrap_or(0) != 0,
            permissions_bitfield: row["permissions_bitfield"]
                .as_str()
                .unwrap_or("0")
                .to_string(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_community_member(row: &serde_json::Value) -> CommunityMemberRecord {
        CommunityMemberRecord {
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            member_did: row["member_did"].as_str().unwrap_or("").to_string(),
            nickname: row["nickname"].as_str().map(|s| s.to_string()),
            avatar_url: row["avatar_url"].as_str().map(|s| s.to_string()),
            bio: row["bio"].as_str().map(|s| s.to_string()),
            joined_at: row["joined_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_community_message(row: &serde_json::Value) -> CommunityMessageRecord {
        CommunityMessageRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
            sender_did: row["sender_did"].as_str().unwrap_or("").to_string(),
            content_encrypted: row["content_encrypted"]
                .as_str()
                .map(|s| hex::decode(s).unwrap_or_default()),
            content_plaintext: row["content_plaintext"].as_str().map(|s| s.to_string()),
            nonce: row["nonce"].as_str().map(|s| s.to_string()),
            key_version: row["key_version"].as_i64().map(|v| v as i32),
            is_e2ee: row["is_e2ee"].as_i64().unwrap_or(0) != 0,
            reply_to_id: row["reply_to_id"].as_str().map(|s| s.to_string()),
            thread_id: row["thread_id"].as_str().map(|s| s.to_string()),
            has_embed: row["has_embed"].as_i64().unwrap_or(0) != 0,
            has_attachment: row["has_attachment"].as_i64().unwrap_or(0) != 0,
            content_warning: row["content_warning"].as_str().map(|s| s.to_string()),
            edited_at: row["edited_at"].as_i64(),
            deleted_for_everyone: row["deleted_for_everyone"].as_i64().unwrap_or(0) != 0,
            created_at: row["created_at"].as_i64().unwrap_or(0),
            metadata_json: row["metadata_json"].as_str().map(|s| s.to_string()),
        }
    }

    fn parse_community_seat(row: &serde_json::Value) -> CommunitySeatRecord {
        CommunitySeatRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            platform: row["platform"].as_str().unwrap_or("").to_string(),
            platform_user_id: row["platform_user_id"].as_str().unwrap_or("").to_string(),
            platform_username: row["platform_username"].as_str().unwrap_or("").to_string(),
            nickname: row["nickname"].as_str().map(|s| s.to_string()),
            avatar_url: row["avatar_url"].as_str().map(|s| s.to_string()),
            role_ids_json: row["role_ids_json"].as_str().unwrap_or("[]").to_string(),
            claimed_by_did: row["claimed_by_did"].as_str().map(|s| s.to_string()),
            claimed_at: row["claimed_at"].as_i64(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }
    }

    fn parse_community_reaction(row: &serde_json::Value) -> CommunityReactionRecord {
        CommunityReactionRecord {
            message_id: row["message_id"].as_str().unwrap_or("").to_string(),
            member_did: row["member_did"].as_str().unwrap_or("").to_string(),
            emoji: row["emoji"].as_str().unwrap_or("").to_string(),
            is_custom: row["is_custom"].as_i64().unwrap_or(0) != 0,
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }
    }

    // ── Communities (Core) ──────────────────────────────────────────────

    /// Create a community record
    pub fn create_community_record(
        &self,
        id: &str,
        name: &str,
        description: Option<&str>,
        owner_did: &str,
        origin_community_id: Option<&str>,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO communities (id, name, description, owner_did, origin_community_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([id, name, description, owner_did, origin_community_id, created_at, created_at]),
        )?;
        Ok(())
    }

    /// Find a community by its origin (remote) community ID.
    pub fn find_community_by_origin(&self, origin_id: &str) -> Result<Option<String>> {
        let rows = self.query(
            "SELECT id FROM communities WHERE origin_community_id = ? LIMIT 1",
            json!([origin_id]),
        )?;
        if let Some(row) = rows.first() {
            Ok(row["id"].as_str().map(|s| s.to_string()))
        } else {
            Ok(None)
        }
    }

    /// Get a community by ID
    pub fn get_community(&self, id: &str) -> Result<Option<CommunityRecord>> {
        let rows = self.query(
            "SELECT id, name, description, icon_url, banner_url, splash_url, accent_color, custom_css, owner_did, vanity_url, origin_community_id, created_at, updated_at FROM communities WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_community))
    }

    /// Get communities a member belongs to
    pub fn get_communities_for_member(&self, member_did: &str) -> Result<Vec<CommunityRecord>> {
        let rows = self.query(
            "SELECT c.id, c.name, c.description, c.icon_url, c.banner_url, c.splash_url, c.accent_color, c.custom_css, c.owner_did, c.vanity_url, c.origin_community_id, c.created_at, c.updated_at FROM communities c INNER JOIN community_members cm ON c.id = cm.community_id WHERE cm.member_did = ? ORDER BY c.name",
            json!([member_did]),
        )?;
        Ok(rows.iter().map(Self::parse_community).collect())
    }

    /// Update a community
    pub fn update_community(
        &self,
        id: &str,
        name: Option<&str>,
        description: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        if let Some(name) = name {
            self.exec(
                "UPDATE communities SET name = ?, description = ?, updated_at = ? WHERE id = ?",
                json!([name, description, updated_at, id]),
            )?;
        } else {
            self.exec(
                "UPDATE communities SET description = ?, updated_at = ? WHERE id = ?",
                json!([description, updated_at, id]),
            )?;
        }
        Ok(())
    }

    /// Update community owner
    pub fn update_community_owner(
        &self,
        id: &str,
        new_owner_did: &str,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE communities SET owner_did = ?, updated_at = ? WHERE id = ?",
            json!([new_owner_did, updated_at, id]),
        )?;
        Ok(())
    }

    /// Delete a community
    pub fn delete_community(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM communities WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Update community branding
    #[allow(clippy::too_many_arguments)]
    pub fn update_community_branding(
        &self,
        id: &str,
        icon_url: Option<&str>,
        banner_url: Option<&str>,
        splash_url: Option<&str>,
        accent_color: Option<&str>,
        custom_css: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE communities SET icon_url = ?, banner_url = ?, splash_url = ?, accent_color = ?, custom_css = ?, updated_at = ? WHERE id = ?",
            json!([icon_url, banner_url, splash_url, accent_color, custom_css, updated_at, id]),
        )?;
        Ok(())
    }

    /// Update community vanity URL
    pub fn update_community_vanity_url(
        &self,
        id: &str,
        vanity_url: &str,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE communities SET vanity_url = ?, updated_at = ? WHERE id = ?",
            json!([vanity_url, updated_at, id]),
        )?;
        Ok(())
    }

    // ── Spaces ───────────────────────────────────────────────────────────

    /// Create a community space
    pub fn create_community_space(
        &self,
        id: &str,
        community_id: &str,
        name: &str,
        position: i32,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_spaces (id, community_id, name, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            json!([id, community_id, name, position, created_at, created_at]),
        )?;
        Ok(())
    }

    /// Get spaces for a community
    pub fn get_community_spaces(&self, community_id: &str) -> Result<Vec<CommunitySpaceRecord>> {
        let rows = self.query(
            "SELECT id, community_id, name, position, created_at, updated_at FROM community_spaces WHERE community_id = ? ORDER BY position",
            json!([community_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_space).collect())
    }

    /// Get a single space by ID
    pub fn get_community_space(&self, id: &str) -> Result<Option<CommunitySpaceRecord>> {
        let rows = self.query(
            "SELECT id, community_id, name, position, created_at, updated_at FROM community_spaces WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_community_space))
    }

    /// Update a space name
    pub fn update_community_space(&self, id: &str, name: &str, updated_at: i64) -> Result<()> {
        self.exec(
            "UPDATE community_spaces SET name = ?, updated_at = ? WHERE id = ?",
            json!([name, updated_at, id]),
        )?;
        Ok(())
    }

    /// Update a space position
    pub fn update_community_space_position(
        &self,
        id: &str,
        position: i32,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_spaces SET position = ?, updated_at = ? WHERE id = ?",
            json!([position, updated_at, id]),
        )?;
        Ok(())
    }

    /// Delete a space
    pub fn delete_community_space(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_spaces WHERE id = ?", json!([id]))?;
        Ok(())
    }

    // ── Category CRUD ────────────────────────────────────────────────

    /// Create a new category
    pub fn create_community_category(
        &self,
        id: &str,
        community_id: &str,
        space_id: &str,
        name: &str,
        position: i32,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_categories (id, community_id, space_id, name, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, space_id, name, position, created_at, created_at]),
        )?;
        Ok(())
    }

    /// Get categories for a space
    pub fn get_community_categories(&self, space_id: &str) -> Result<Vec<CommunityCategoryRecord>> {
        let rows = self.query(
            "SELECT id, community_id, space_id, name, position, created_at, updated_at FROM community_categories WHERE space_id = ? ORDER BY position",
            json!([space_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_category).collect())
    }

    /// Get all categories for a community (across all spaces)
    pub fn get_community_categories_by_community(
        &self,
        community_id: &str,
    ) -> Result<Vec<CommunityCategoryRecord>> {
        let rows = self.query(
            "SELECT id, community_id, space_id, name, position, created_at, updated_at FROM community_categories WHERE community_id = ? ORDER BY position",
            json!([community_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_category).collect())
    }

    /// Get a single category by ID
    pub fn get_community_category(&self, id: &str) -> Result<Option<CommunityCategoryRecord>> {
        let rows = self.query(
            "SELECT id, community_id, space_id, name, position, created_at, updated_at FROM community_categories WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_community_category))
    }

    /// Update a category name
    pub fn update_community_category(&self, id: &str, name: &str, updated_at: i64) -> Result<()> {
        self.exec(
            "UPDATE community_categories SET name = ?, updated_at = ? WHERE id = ?",
            json!([name, updated_at, id]),
        )?;
        Ok(())
    }

    /// Update a category position
    pub fn update_community_category_position(
        &self,
        id: &str,
        position: i32,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_categories SET position = ?, updated_at = ? WHERE id = ?",
            json!([position, updated_at, id]),
        )?;
        Ok(())
    }

    /// Delete a category (channels with this category_id will be set to NULL by ON DELETE SET NULL)
    pub fn delete_community_category(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_categories WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Update a channel's category assignment
    pub fn update_channel_category(
        &self,
        channel_id: &str,
        category_id: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_channels SET category_id = ?, updated_at = ? WHERE id = ?",
            json!([category_id, updated_at, channel_id]),
        )?;
        Ok(())
    }

    // ── Channels ─────────────────────────────────────────────────────────

    /// Create a community channel
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_channel(
        &self,
        id: &str,
        community_id: &str,
        space_id: &str,
        category_id: Option<&str>,
        name: &str,
        channel_type: &str,
        topic: Option<&str>,
        position: i32,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_channels (id, community_id, space_id, category_id, name, type, topic, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, space_id, category_id, name, channel_type, topic, position, created_at, created_at]),
        )?;
        Ok(())
    }

    /// Get channels for a community
    pub fn get_community_channels(
        &self,
        community_id: &str,
    ) -> Result<Vec<CommunityChannelRecord>> {
        let rows = self.query(
            "SELECT id, community_id, space_id, category_id, name, type, topic, position, slow_mode_seconds, e2ee_enabled, pin_limit, created_at, updated_at FROM community_channels WHERE community_id = ? ORDER BY position",
            json!([community_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_channel).collect())
    }

    /// Get channels by space
    pub fn get_community_channels_by_space(
        &self,
        space_id: &str,
    ) -> Result<Vec<CommunityChannelRecord>> {
        let rows = self.query(
            "SELECT id, community_id, space_id, category_id, name, type, topic, position, slow_mode_seconds, e2ee_enabled, pin_limit, created_at, updated_at FROM community_channels WHERE space_id = ? ORDER BY position",
            json!([space_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_channel).collect())
    }

    /// Get a single channel by ID
    pub fn get_community_channel(&self, id: &str) -> Result<Option<CommunityChannelRecord>> {
        let rows = self.query(
            "SELECT id, community_id, space_id, category_id, name, type, topic, position, slow_mode_seconds, e2ee_enabled, pin_limit, created_at, updated_at FROM community_channels WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_community_channel))
    }

    /// Update a channel
    pub fn update_community_channel(
        &self,
        id: &str,
        name: Option<&str>,
        topic: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        if let Some(name) = name {
            self.exec(
                "UPDATE community_channels SET name = ?, topic = ?, updated_at = ? WHERE id = ?",
                json!([name, topic, updated_at, id]),
            )?;
        } else {
            self.exec(
                "UPDATE community_channels SET topic = ?, updated_at = ? WHERE id = ?",
                json!([topic, updated_at, id]),
            )?;
        }
        Ok(())
    }

    /// Delete a channel
    pub fn delete_community_channel(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_channels WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Update channel slow mode
    pub fn update_channel_slow_mode(&self, id: &str, seconds: i32, updated_at: i64) -> Result<()> {
        self.exec(
            "UPDATE community_channels SET slow_mode_seconds = ?, updated_at = ? WHERE id = ?",
            json!([seconds, updated_at, id]),
        )?;
        Ok(())
    }

    /// Update channel position
    pub fn update_channel_position(&self, id: &str, position: i32, updated_at: i64) -> Result<()> {
        self.exec(
            "UPDATE community_channels SET position = ?, updated_at = ? WHERE id = ?",
            json!([position, updated_at, id]),
        )?;
        Ok(())
    }

    /// Update channel E2EE setting
    pub fn update_channel_e2ee(&self, id: &str, e2ee_enabled: bool, updated_at: i64) -> Result<()> {
        self.exec(
            "UPDATE community_channels SET e2ee_enabled = ?, updated_at = ? WHERE id = ?",
            json!([e2ee_enabled as i32, updated_at, id]),
        )?;
        Ok(())
    }

    // ── Roles ────────────────────────────────────────────────────────────

    /// Create a community role
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_role(
        &self,
        id: &str,
        community_id: &str,
        name: &str,
        color: Option<&str>,
        position: i32,
        hoisted: bool,
        mentionable: bool,
        is_preset: bool,
        permissions_bitfield: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_roles (id, community_id, name, color, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, name, color, position, hoisted as i32, mentionable as i32, is_preset as i32, permissions_bitfield, created_at, created_at]),
        )?;
        Ok(())
    }

    /// Get roles for a community
    pub fn get_community_roles(&self, community_id: &str) -> Result<Vec<CommunityRoleRecord>> {
        let rows = self.query(
            "SELECT id, community_id, name, color, icon, badge, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at FROM community_roles WHERE community_id = ? ORDER BY position",
            json!([community_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_role).collect())
    }

    /// Get the owner role for a community
    pub fn get_owner_role(&self, community_id: &str) -> Result<Option<CommunityRoleRecord>> {
        let rows = self.query(
            "SELECT id, community_id, name, color, icon, badge, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at FROM community_roles WHERE community_id = ? AND name = 'Owner' AND is_preset = 1",
            json!([community_id]),
        )?;
        Ok(rows.first().map(Self::parse_community_role))
    }

    /// Get the default member role
    pub fn get_member_role(&self, community_id: &str) -> Result<Option<CommunityRoleRecord>> {
        let rows = self.query(
            "SELECT id, community_id, name, color, icon, badge, position, hoisted, mentionable, is_preset, permissions_bitfield, created_at, updated_at FROM community_roles WHERE community_id = ? AND name = 'Member' AND is_preset = 1",
            json!([community_id]),
        )?;
        Ok(rows.first().map(Self::parse_community_role))
    }

    /// Update a role's permissions
    pub fn update_community_role_permissions(
        &self,
        role_id: &str,
        permissions_bitfield: &str,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_roles SET permissions_bitfield = ?, updated_at = ? WHERE id = ?",
            json!([permissions_bitfield, updated_at, role_id]),
        )?;
        Ok(())
    }

    /// Update a role
    #[allow(clippy::too_many_arguments)]
    pub fn update_community_role(
        &self,
        role_id: &str,
        name: Option<&str>,
        color: Option<&str>,
        hoisted: Option<bool>,
        mentionable: Option<bool>,
        position: Option<i32>,
        updated_at: i64,
    ) -> Result<()> {
        // Build dynamic SET clause
        let mut sets = Vec::new();
        let mut params: Vec<serde_json::Value> = Vec::new();
        sets.push("updated_at = ?");
        params.push(json!(updated_at));
        if let Some(v) = name {
            sets.push("name = ?");
            params.push(json!(v));
        }
        if let Some(v) = color {
            sets.push("color = ?");
            params.push(json!(v));
        }
        if let Some(v) = hoisted {
            sets.push("hoisted = ?");
            params.push(json!(v as i32));
        }
        if let Some(v) = mentionable {
            sets.push("mentionable = ?");
            params.push(json!(v as i32));
        }
        if let Some(v) = position {
            sets.push("position = ?");
            params.push(json!(v));
        }
        params.push(json!(role_id));
        let sql = format!(
            "UPDATE community_roles SET {} WHERE id = ?",
            sets.join(", ")
        );
        self.exec(&sql, serde_json::Value::Array(params))?;
        Ok(())
    }

    /// Delete a role
    pub fn delete_community_role(&self, role_id: &str) -> Result<()> {
        self.exec("DELETE FROM community_roles WHERE id = ?", json!([role_id]))?;
        Ok(())
    }

    // ── Role Assignments ─────────────────────────────────────────────────

    /// Assign a role to a member
    pub fn assign_community_role(
        &self,
        community_id: &str,
        member_did: &str,
        role_id: &str,
        assigned_at: i64,
        assigned_by: Option<&str>,
    ) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO community_member_roles (community_id, member_did, role_id, assigned_at, assigned_by) VALUES (?, ?, ?, ?, ?)",
            json!([community_id, member_did, role_id, assigned_at, assigned_by]),
        )?;
        Ok(())
    }

    /// Unassign a role from a member
    pub fn unassign_community_role(
        &self,
        community_id: &str,
        member_did: &str,
        role_id: &str,
    ) -> Result<()> {
        self.exec(
            "DELETE FROM community_member_roles WHERE community_id = ? AND member_did = ? AND role_id = ?",
            json!([community_id, member_did, role_id]),
        )?;
        Ok(())
    }

    /// Get roles for a specific member in a community
    pub fn get_member_community_roles(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Vec<CommunityRoleRecord>> {
        let rows = self.query(
            "SELECT r.id, r.community_id, r.name, r.color, r.icon, r.badge, r.position, r.hoisted, r.mentionable, r.is_preset, r.permissions_bitfield, r.created_at, r.updated_at FROM community_roles r INNER JOIN community_member_roles mr ON r.id = mr.role_id WHERE mr.community_id = ? AND mr.member_did = ? ORDER BY r.position",
            json!([community_id, member_did]),
        )?;
        Ok(rows.iter().map(Self::parse_community_role).collect())
    }

    // ── Members ──────────────────────────────────────────────────────────

    /// Add a member to a community
    pub fn add_community_member(
        &self,
        community_id: &str,
        member_did: &str,
        joined_at: i64,
        nickname: Option<&str>,
    ) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO community_members (community_id, member_did, nickname, joined_at) VALUES (?, ?, ?, ?)",
            json!([community_id, member_did, nickname, joined_at]),
        )?;
        Ok(())
    }

    /// Remove a member from a community
    pub fn remove_community_member(&self, community_id: &str, member_did: &str) -> Result<()> {
        self.exec(
            "DELETE FROM community_member_roles WHERE community_id = ? AND member_did = ?",
            json!([community_id, member_did]),
        )?;
        self.exec(
            "DELETE FROM community_members WHERE community_id = ? AND member_did = ?",
            json!([community_id, member_did]),
        )?;
        Ok(())
    }

    /// Get a specific community member
    pub fn get_community_member(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Option<CommunityMemberRecord>> {
        let rows = self.query(
            "SELECT community_id, member_did, nickname, avatar_url, bio, joined_at FROM community_members WHERE community_id = ? AND member_did = ?",
            json!([community_id, member_did]),
        )?;
        Ok(rows.first().map(Self::parse_community_member))
    }

    /// Get all members of a community
    pub fn get_community_members(&self, community_id: &str) -> Result<Vec<CommunityMemberRecord>> {
        let rows = self.query(
            "SELECT community_id, member_did, nickname, avatar_url, bio, joined_at FROM community_members WHERE community_id = ? ORDER BY joined_at",
            json!([community_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_member).collect())
    }

    /// Update a member's community profile
    pub fn update_community_member_profile(
        &self,
        community_id: &str,
        member_did: &str,
        nickname: Option<&str>,
        avatar_url: Option<&str>,
        bio: Option<&str>,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_members SET nickname = ?, avatar_url = ?, bio = ? WHERE community_id = ? AND member_did = ?",
            json!([nickname, avatar_url, bio, community_id, member_did]),
        )?;
        Ok(())
    }

    // ── Messages ─────────────────────────────────────────────────────────

    /// Store a community message
    #[allow(clippy::too_many_arguments)]
    pub fn store_community_message(
        &self,
        id: &str,
        channel_id: &str,
        sender_did: &str,
        content_encrypted: Option<&[u8]>,
        content_plaintext: Option<&str>,
        nonce: Option<&str>,
        key_version: Option<i32>,
        is_e2ee: bool,
        reply_to_id: Option<&str>,
        thread_id: Option<&str>,
        has_embed: bool,
        has_attachment: bool,
        content_warning: Option<&str>,
        created_at: i64,
        metadata_json: Option<&str>,
    ) -> Result<()> {
        let ct_hex = content_encrypted.map(hex::encode);
        self.exec(
            "INSERT INTO community_messages (id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, channel_id, sender_did, ct_hex, content_plaintext, nonce, key_version, is_e2ee as i32, reply_to_id, thread_id, has_embed as i32, has_attachment as i32, content_warning, created_at, metadata_json]),
        )?;
        Ok(())
    }

    /// Store a community message only if it doesn't already exist (INSERT OR IGNORE).
    /// Used for persisting messages received from the relay / bridge.
    #[allow(clippy::too_many_arguments)]
    pub fn store_community_message_if_not_exists(
        &self,
        id: &str,
        channel_id: &str,
        sender_did: &str,
        content_encrypted: Option<&[u8]>,
        content_plaintext: Option<&str>,
        nonce: Option<&str>,
        key_version: Option<i32>,
        is_e2ee: bool,
        reply_to_id: Option<&str>,
        thread_id: Option<&str>,
        has_embed: bool,
        has_attachment: bool,
        content_warning: Option<&str>,
        created_at: i64,
        metadata_json: Option<&str>,
    ) -> Result<()> {
        let ct_hex = content_encrypted.map(hex::encode);
        self.exec(
            "INSERT OR IGNORE INTO community_messages (id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, created_at, metadata_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, channel_id, sender_did, ct_hex, content_plaintext, nonce, key_version, is_e2ee as i32, reply_to_id, thread_id, has_embed as i32, has_attachment as i32, content_warning, created_at, metadata_json]),
        )?;
        Ok(())
    }

    /// Get community messages for a channel
    pub fn get_community_messages(
        &self,
        channel_id: &str,
        limit: usize,
        before_timestamp: Option<i64>,
    ) -> Result<Vec<CommunityMessageRecord>> {
        let rows = if let Some(before) = before_timestamp {
            self.query(
                "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at, metadata_json FROM community_messages WHERE channel_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?",
                json!([channel_id, before, limit as i64]),
            )?
        } else {
            self.query(
                "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at, metadata_json FROM community_messages WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?",
                json!([channel_id, limit as i64]),
            )?
        };
        let mut messages: Vec<CommunityMessageRecord> =
            rows.iter().map(Self::parse_community_message).collect();
        messages.reverse();
        Ok(messages)
    }

    /// Get a single community message
    pub fn get_community_message(&self, id: &str) -> Result<Option<CommunityMessageRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_community_message))
    }

    /// Edit a community message
    pub fn edit_community_message(
        &self,
        id: &str,
        content_plaintext: Option<&str>,
        content_encrypted: Option<&[u8]>,
        nonce: Option<&str>,
        edited_at: i64,
    ) -> Result<()> {
        let ct_hex = content_encrypted.map(hex::encode);
        self.exec(
            "UPDATE community_messages SET content_plaintext = ?, content_encrypted = ?, nonce = ?, edited_at = ? WHERE id = ?",
            json!([content_plaintext, ct_hex, nonce, edited_at, id]),
        )?;
        Ok(())
    }

    /// Delete a community message for everyone
    pub fn delete_community_message_for_everyone(&self, id: &str) -> Result<()> {
        self.exec(
            "UPDATE community_messages SET deleted_for_everyone = 1 WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    /// Delete a community message for the current user only
    pub fn delete_community_message_for_me(
        &self,
        message_id: &str,
        member_did: &str,
        deleted_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO community_deleted_messages (message_id, member_did, deleted_at) VALUES (?, ?, ?)",
            json!([message_id, member_did, deleted_at]),
        )?;
        Ok(())
    }

    /// Search community messages in a channel
    pub fn search_community_messages(
        &self,
        channel_id: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<CommunityMessageRecord>> {
        let like_query = format!("%{}%", query);
        let rows = self.query(
            "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE channel_id = ? AND content_plaintext LIKE ? ORDER BY created_at DESC LIMIT ?",
            json!([channel_id, like_query, limit as i64]),
        )?;
        Ok(rows.iter().map(Self::parse_community_message).collect())
    }

    /// Advanced community message search (multi-filter across channels)
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
        // Build dynamic WHERE clause
        let mut conditions = Vec::new();
        let mut param_values: Vec<serde_json::Value> = Vec::new();

        if !channel_ids.is_empty() {
            let placeholders: Vec<&str> = channel_ids.iter().map(|_| "?").collect();
            conditions.push(format!("channel_id IN ({})", placeholders.join(",")));
            for cid in channel_ids {
                param_values.push(json!(cid));
            }
        }

        conditions.push("deleted_for_everyone = 0".to_string());

        if let Some(q) = query {
            conditions.push("content_plaintext LIKE ?".to_string());
            param_values.push(json!(format!("%{}%", q)));
        }
        if let Some(did) = from_did {
            conditions.push("sender_did = ?".to_string());
            param_values.push(json!(did));
        }
        if let Some(ts) = before {
            conditions.push("created_at < ?".to_string());
            param_values.push(json!(ts));
        }
        if let Some(ts) = after {
            conditions.push("created_at > ?".to_string());
            param_values.push(json!(ts));
        }
        if let Some(true) = has_file {
            conditions.push("has_attachment = 1".to_string());
        }
        if let Some(true) = has_reaction {
            conditions
                .push("id IN (SELECT DISTINCT message_id FROM community_reactions)".to_string());
        }
        if let Some(true) = is_pinned {
            if !pinned_message_ids.is_empty() {
                let placeholders: Vec<&str> = pinned_message_ids.iter().map(|_| "?").collect();
                conditions.push(format!("id IN ({})", placeholders.join(",")));
                for pid in pinned_message_ids {
                    param_values.push(json!(pid));
                }
            }
        }

        param_values.push(json!(limit as i64));

        let where_clause = if conditions.is_empty() {
            String::new()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        let sql = format!(
            "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages {} ORDER BY created_at DESC LIMIT ?",
            where_clause
        );

        let rows = self.query(&sql, serde_json::Value::Array(param_values))?;
        Ok(rows.iter().map(Self::parse_community_message).collect())
    }

    // ── Reactions ────────────────────────────────────────────────────────

    /// Add a community reaction
    pub fn add_community_reaction(
        &self,
        message_id: &str,
        member_did: &str,
        emoji: &str,
        is_custom: bool,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO community_reactions (message_id, member_did, emoji, is_custom, created_at) VALUES (?, ?, ?, ?, ?)",
            json!([message_id, member_did, emoji, is_custom as i32, created_at]),
        )?;
        Ok(())
    }

    /// Remove a community reaction
    pub fn remove_community_reaction(
        &self,
        message_id: &str,
        member_did: &str,
        emoji: &str,
    ) -> Result<()> {
        self.exec(
            "DELETE FROM community_reactions WHERE message_id = ? AND member_did = ? AND emoji = ?",
            json!([message_id, member_did, emoji]),
        )?;
        Ok(())
    }

    /// Get reactions for a message
    pub fn get_community_reactions(
        &self,
        message_id: &str,
    ) -> Result<Vec<CommunityReactionRecord>> {
        let rows = self.query(
            "SELECT message_id, member_did, emoji, is_custom, created_at FROM community_reactions WHERE message_id = ? ORDER BY created_at",
            json!([message_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_reaction).collect())
    }

    // ── Read Receipts ────────────────────────────────────────────────────

    /// Update a read receipt
    pub fn update_read_receipt(
        &self,
        channel_id: &str,
        member_did: &str,
        last_read_message_id: &str,
        read_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO community_read_receipts (channel_id, member_did, last_read_message_id, read_at) VALUES (?, ?, ?, ?)",
            json!([channel_id, member_did, last_read_message_id, read_at]),
        )?;
        Ok(())
    }

    /// Get read receipts for a channel
    pub fn get_read_receipts(&self, channel_id: &str) -> Result<Vec<CommunityReadReceiptRecord>> {
        let rows = self.query(
            "SELECT channel_id, member_did, last_read_message_id, read_at FROM community_read_receipts WHERE channel_id = ?",
            json!([channel_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityReadReceiptRecord {
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                member_did: row["member_did"].as_str().unwrap_or("").to_string(),
                last_read_message_id: row["last_read_message_id"]
                    .as_str()
                    .unwrap_or("")
                    .to_string(),
                read_at: row["read_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    // ── Pins ─────────────────────────────────────────────────────────────

    /// Pin a community message
    pub fn pin_community_message(
        &self,
        channel_id: &str,
        message_id: &str,
        pinned_by: &str,
        pinned_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO community_pins (channel_id, message_id, pinned_by, pinned_at) VALUES (?, ?, ?, ?)",
            json!([channel_id, message_id, pinned_by, pinned_at]),
        )?;
        Ok(())
    }

    /// Unpin a community message
    pub fn unpin_community_message(&self, channel_id: &str, message_id: &str) -> Result<()> {
        self.exec(
            "DELETE FROM community_pins WHERE channel_id = ? AND message_id = ?",
            json!([channel_id, message_id]),
        )?;
        Ok(())
    }

    /// Get pinned messages for a channel
    pub fn get_community_pins(&self, channel_id: &str) -> Result<Vec<CommunityPinRecord>> {
        let rows = self.query(
            "SELECT channel_id, message_id, pinned_by, pinned_at FROM community_pins WHERE channel_id = ? ORDER BY pinned_at DESC",
            json!([channel_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityPinRecord {
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                message_id: row["message_id"].as_str().unwrap_or("").to_string(),
                pinned_by: row["pinned_by"].as_str().unwrap_or("").to_string(),
                pinned_at: row["pinned_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Get pin count for a channel
    pub fn get_community_pin_count(&self, channel_id: &str) -> Result<i32> {
        let count: Option<i64> = self.query_scalar(
            "SELECT COUNT(*) FROM community_pins WHERE channel_id = ?",
            json!([channel_id]),
        )?;
        Ok(count.unwrap_or(0) as i32)
    }

    /// Get pinned message IDs for a channel
    pub fn get_pinned_message_ids(&self, channel_id: &str) -> Result<Vec<String>> {
        let rows = self.query(
            "SELECT message_id FROM community_pins WHERE channel_id = ?",
            json!([channel_id]),
        )?;
        Ok(rows
            .iter()
            .filter_map(|r| r["message_id"].as_str().map(|s| s.to_string()))
            .collect())
    }

    // ── Bans ─────────────────────────────────────────────────────────────

    /// Create a ban record
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_ban(
        &self,
        community_id: &str,
        banned_did: &str,
        reason: Option<&str>,
        banned_by: &str,
        device_fingerprint: Option<&str>,
        expires_at: Option<i64>,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO community_bans (community_id, banned_did, reason, banned_by, device_fingerprint, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([community_id, banned_did, reason, banned_by, device_fingerprint, expires_at, created_at]),
        )?;
        Ok(())
    }

    /// Check if a user is banned
    pub fn is_community_banned(&self, community_id: &str, did: &str) -> Result<bool> {
        let count: Option<i64> = self.query_scalar(
            "SELECT COUNT(*) FROM community_bans WHERE community_id = ? AND banned_did = ?",
            json!([community_id, did]),
        )?;
        Ok(count.unwrap_or(0) > 0)
    }

    /// Remove a ban
    pub fn remove_community_ban(&self, community_id: &str, banned_did: &str) -> Result<()> {
        self.exec(
            "DELETE FROM community_bans WHERE community_id = ? AND banned_did = ?",
            json!([community_id, banned_did]),
        )?;
        Ok(())
    }

    /// Get all bans for a community
    pub fn get_community_bans(&self, community_id: &str) -> Result<Vec<CommunityBanRecord>> {
        let rows = self.query(
            "SELECT community_id, banned_did, reason, banned_by, device_fingerprint, expires_at, created_at FROM community_bans WHERE community_id = ? ORDER BY created_at DESC",
            json!([community_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityBanRecord {
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                banned_did: row["banned_did"].as_str().unwrap_or("").to_string(),
                reason: row["reason"].as_str().map(|s| s.to_string()),
                banned_by: row["banned_by"].as_str().unwrap_or("").to_string(),
                device_fingerprint: row["device_fingerprint"].as_str().map(|s| s.to_string()),
                expires_at: row["expires_at"].as_i64(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    // ── Invites ──────────────────────────────────────────────────────────

    /// Create a community invite
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_invite(
        &self,
        id: &str,
        community_id: &str,
        code: &str,
        vanity: bool,
        creator_did: &str,
        max_uses: Option<i32>,
        expires_at: Option<i64>,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_invites (id, community_id, code, vanity, creator_did, max_uses, use_count, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)",
            json!([id, community_id, code, vanity as i32, creator_did, max_uses, expires_at, created_at]),
        )?;
        Ok(())
    }

    /// Get an invite by code
    pub fn get_community_invite_by_code(
        &self,
        code: &str,
    ) -> Result<Option<CommunityInviteRecord>> {
        let rows = self.query(
            "SELECT id, community_id, code, vanity, creator_did, max_uses, use_count, expires_at, created_at FROM community_invites WHERE code = ?",
            json!([code]),
        )?;
        Ok(rows.first().map(|row| Self::parse_community_invite(row)))
    }

    /// Get an invite by ID
    pub fn get_community_invite(&self, id: &str) -> Result<Option<CommunityInviteRecord>> {
        let rows = self.query(
            "SELECT id, community_id, code, vanity, creator_did, max_uses, use_count, expires_at, created_at FROM community_invites WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(|row| Self::parse_community_invite(row)))
    }

    /// Get all invites for a community
    pub fn get_community_invites(&self, community_id: &str) -> Result<Vec<CommunityInviteRecord>> {
        let rows = self.query(
            "SELECT id, community_id, code, vanity, creator_did, max_uses, use_count, expires_at, created_at FROM community_invites WHERE community_id = ? ORDER BY created_at DESC",
            json!([community_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| Self::parse_community_invite(row))
            .collect())
    }

    /// Delete an invite
    pub fn delete_community_invite(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_invites WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Increment invite use count
    pub fn increment_invite_use_count(&self, id: &str) -> Result<()> {
        self.exec(
            "UPDATE community_invites SET use_count = use_count + 1 WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    fn parse_community_invite(row: &serde_json::Value) -> CommunityInviteRecord {
        CommunityInviteRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            code: row["code"].as_str().unwrap_or("").to_string(),
            vanity: row["vanity"].as_i64().unwrap_or(0) != 0,
            creator_did: row["creator_did"].as_str().unwrap_or("").to_string(),
            max_uses: row["max_uses"].as_i64().map(|v| v as i32),
            use_count: row["use_count"].as_i64().unwrap_or(0) as i32,
            expires_at: row["expires_at"].as_i64(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }
    }

    // ── Warnings ─────────────────────────────────────────────────────────

    /// Create a community warning
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_warning(
        &self,
        id: &str,
        community_id: &str,
        member_did: &str,
        reason: &str,
        warned_by: &str,
        expires_at: Option<i64>,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_warnings (id, community_id, member_did, reason, warned_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, member_did, reason, warned_by, expires_at, created_at]),
        )?;
        Ok(())
    }

    /// Get warnings for a specific member
    pub fn get_community_member_warnings(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Vec<CommunityWarningRecord>> {
        let rows = self.query(
            "SELECT id, community_id, member_did, reason, warned_by, expires_at, created_at FROM community_warnings WHERE community_id = ? AND member_did = ? ORDER BY created_at DESC",
            json!([community_id, member_did]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityWarningRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                member_did: row["member_did"].as_str().unwrap_or("").to_string(),
                reason: row["reason"].as_str().unwrap_or("").to_string(),
                warned_by: row["warned_by"].as_str().unwrap_or("").to_string(),
                expires_at: row["expires_at"].as_i64(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Get all warnings for a community
    pub fn get_community_warnings(
        &self,
        community_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CommunityWarningRecord>> {
        let rows = self.query(
            "SELECT id, community_id, member_did, reason, warned_by, expires_at, created_at FROM community_warnings WHERE community_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            json!([community_id, limit as i64, offset as i64]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityWarningRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                member_did: row["member_did"].as_str().unwrap_or("").to_string(),
                reason: row["reason"].as_str().unwrap_or("").to_string(),
                warned_by: row["warned_by"].as_str().unwrap_or("").to_string(),
                expires_at: row["expires_at"].as_i64(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Get active warning count for a member
    pub fn get_active_warning_count(
        &self,
        community_id: &str,
        member_did: &str,
        now: i64,
    ) -> Result<i32> {
        let count: Option<i64> = self.query_scalar(
            "SELECT COUNT(*) FROM community_warnings WHERE community_id = ? AND member_did = ? AND (expires_at IS NULL OR expires_at > ?)",
            json!([community_id, member_did, now]),
        )?;
        Ok(count.unwrap_or(0) as i32)
    }

    /// Delete a warning
    pub fn delete_community_warning(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_warnings WHERE id = ?", json!([id]))?;
        Ok(())
    }

    // ── Audit Log ────────────────────────────────────────────────────────

    /// Insert an audit log entry
    #[allow(clippy::too_many_arguments)]
    pub fn insert_audit_log(
        &self,
        id: &str,
        community_id: &str,
        actor_did: &str,
        action_type: &str,
        target_type: Option<&str>,
        target_id: Option<&str>,
        metadata_json: Option<&str>,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_audit_log (id, community_id, actor_did, action_type, target_type, target_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, actor_did, action_type, target_type, target_id, metadata_json, created_at]),
        )?;
        Ok(())
    }

    /// Get audit log entries
    pub fn get_audit_log(
        &self,
        community_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CommunityAuditLogRecord>> {
        let rows = self.query(
            "SELECT id, community_id, actor_did, action_type, target_type, target_id, metadata_json, content_detail, created_at FROM community_audit_log WHERE community_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            json!([community_id, limit as i64, offset as i64]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityAuditLogRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                actor_did: row["actor_did"].as_str().unwrap_or("").to_string(),
                action_type: row["action_type"].as_str().unwrap_or("").to_string(),
                target_type: row["target_type"].as_str().map(|s| s.to_string()),
                target_id: row["target_id"].as_str().map(|s| s.to_string()),
                metadata_json: row["metadata_json"].as_str().map(|s| s.to_string()),
                content_detail: row["content_detail"].as_str().map(|s| s.to_string()),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    // ── Threads ──────────────────────────────────────────────────────────

    /// Create a community thread
    pub fn create_community_thread(
        &self,
        id: &str,
        channel_id: &str,
        parent_message_id: &str,
        name: Option<&str>,
        created_by: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_threads (id, channel_id, parent_message_id, name, created_by, message_count, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
            json!([id, channel_id, parent_message_id, name, created_by, created_at]),
        )?;
        Ok(())
    }

    /// Get a thread by ID
    pub fn get_community_thread(&self, id: &str) -> Result<Option<CommunityThreadRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, parent_message_id, name, created_by, message_count, last_message_at, created_at FROM community_threads WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(|row| CommunityThreadRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
            parent_message_id: row["parent_message_id"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().map(|s| s.to_string()),
            created_by: row["created_by"].as_str().unwrap_or("").to_string(),
            message_count: row["message_count"].as_i64().unwrap_or(0) as i32,
            last_message_at: row["last_message_at"].as_i64(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }))
    }

    /// Get threads for a channel
    pub fn get_community_threads(&self, channel_id: &str) -> Result<Vec<CommunityThreadRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, parent_message_id, name, created_by, message_count, last_message_at, created_at FROM community_threads WHERE channel_id = ? ORDER BY last_message_at DESC",
            json!([channel_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityThreadRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                parent_message_id: row["parent_message_id"].as_str().unwrap_or("").to_string(),
                name: row["name"].as_str().map(|s| s.to_string()),
                created_by: row["created_by"].as_str().unwrap_or("").to_string(),
                message_count: row["message_count"].as_i64().unwrap_or(0) as i32,
                last_message_at: row["last_message_at"].as_i64(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Increment thread message count
    pub fn increment_thread_message_count(
        &self,
        thread_id: &str,
        last_message_at: i64,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_threads SET message_count = message_count + 1, last_message_at = ? WHERE id = ?",
            json!([last_message_at, thread_id]),
        )?;
        Ok(())
    }

    /// Get thread messages directly (messages with thread_id = given id)
    pub fn get_thread_messages_direct(
        &self,
        thread_id: &str,
        limit: usize,
        before_timestamp: Option<i64>,
    ) -> Result<Vec<CommunityMessageRecord>> {
        let rows = if let Some(before) = before_timestamp {
            self.query(
                "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE thread_id = ? AND created_at < ? ORDER BY created_at DESC LIMIT ?",
                json!([thread_id, before, limit as i64]),
            )?
        } else {
            self.query(
                "SELECT id, channel_id, sender_did, content_encrypted, content_plaintext, nonce, key_version, is_e2ee, reply_to_id, thread_id, has_embed, has_attachment, content_warning, edited_at, deleted_for_everyone, created_at FROM community_messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT ?",
                json!([thread_id, limit as i64]),
            )?
        };
        let mut messages: Vec<CommunityMessageRecord> =
            rows.iter().map(Self::parse_community_message).collect();
        messages.reverse();
        Ok(messages)
    }

    /// Follow a thread
    pub fn follow_thread(&self, thread_id: &str, member_did: &str, followed_at: i64) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO community_thread_followers (thread_id, member_did, followed_at) VALUES (?, ?, ?)",
            json!([thread_id, member_did, followed_at]),
        )?;
        Ok(())
    }

    /// Unfollow a thread
    pub fn unfollow_thread(&self, thread_id: &str, member_did: &str) -> Result<()> {
        self.exec(
            "DELETE FROM community_thread_followers WHERE thread_id = ? AND member_did = ?",
            json!([thread_id, member_did]),
        )?;
        Ok(())
    }

    /// Check if following a thread
    pub fn is_following_thread(&self, thread_id: &str, member_did: &str) -> Result<bool> {
        let count: Option<i64> = self.query_scalar(
            "SELECT COUNT(*) FROM community_thread_followers WHERE thread_id = ? AND member_did = ?",
            json!([thread_id, member_did]),
        )?;
        Ok(count.unwrap_or(0) > 0)
    }

    /// Get thread followers
    pub fn get_thread_followers(
        &self,
        thread_id: &str,
    ) -> Result<Vec<CommunityThreadFollowerRecord>> {
        let rows = self.query(
            "SELECT thread_id, member_did, followed_at FROM community_thread_followers WHERE thread_id = ?",
            json!([thread_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityThreadFollowerRecord {
                thread_id: row["thread_id"].as_str().unwrap_or("").to_string(),
                member_did: row["member_did"].as_str().unwrap_or("").to_string(),
                followed_at: row["followed_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    // ── Timeouts ─────────────────────────────────────────────────────────

    /// Create a community timeout
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_timeout(
        &self,
        id: &str,
        community_id: &str,
        member_did: &str,
        reason: Option<&str>,
        timeout_type: &str,
        issued_by: &str,
        expires_at: i64,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_timeouts (id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at]),
        )?;
        Ok(())
    }

    /// Get active timeouts for a member
    pub fn get_active_timeouts(
        &self,
        community_id: &str,
        member_did: &str,
        now: i64,
    ) -> Result<Vec<CommunityTimeoutRecord>> {
        let rows = self.query(
            "SELECT id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at FROM community_timeouts WHERE community_id = ? AND member_did = ? AND expires_at > ? ORDER BY created_at DESC",
            json!([community_id, member_did, now]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityTimeoutRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                member_did: row["member_did"].as_str().unwrap_or("").to_string(),
                reason: row["reason"].as_str().map(|s| s.to_string()),
                timeout_type: row["timeout_type"].as_str().unwrap_or("mute").to_string(),
                issued_by: row["issued_by"].as_str().unwrap_or("").to_string(),
                expires_at: row["expires_at"].as_i64().unwrap_or(0),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Get all timeouts for a community
    pub fn get_community_timeouts(
        &self,
        community_id: &str,
    ) -> Result<Vec<CommunityTimeoutRecord>> {
        let rows = self.query(
            "SELECT id, community_id, member_did, reason, timeout_type, issued_by, expires_at, created_at FROM community_timeouts WHERE community_id = ? ORDER BY created_at DESC",
            json!([community_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityTimeoutRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                member_did: row["member_did"].as_str().unwrap_or("").to_string(),
                reason: row["reason"].as_str().map(|s| s.to_string()),
                timeout_type: row["timeout_type"].as_str().unwrap_or("mute").to_string(),
                issued_by: row["issued_by"].as_str().unwrap_or("").to_string(),
                expires_at: row["expires_at"].as_i64().unwrap_or(0),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Remove a timeout
    pub fn remove_community_timeout(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_timeouts WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Check if a member is timed out
    pub fn is_member_timed_out(
        &self,
        community_id: &str,
        member_did: &str,
        timeout_type: &str,
        now: i64,
    ) -> Result<bool> {
        let count: Option<i64> = self.query_scalar(
            "SELECT COUNT(*) FROM community_timeouts WHERE community_id = ? AND member_did = ? AND timeout_type = ? AND expires_at > ?",
            json!([community_id, member_did, timeout_type, now]),
        )?;
        Ok(count.unwrap_or(0) > 0)
    }

    // ── Files ────────────────────────────────────────────────────────────

    /// Store a community file
    #[allow(clippy::too_many_arguments)]
    pub fn store_community_file(
        &self,
        id: &str,
        channel_id: &str,
        folder_id: Option<&str>,
        filename: &str,
        description: Option<&str>,
        file_size: i64,
        mime_type: Option<&str>,
        storage_chunks_json: &str,
        uploaded_by: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_files (id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)",
            json!([id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, created_at]),
        )?;
        Ok(())
    }

    /// Get files in a channel/folder
    pub fn get_community_files(
        &self,
        channel_id: &str,
        folder_id: Option<&str>,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CommunityFileRecord>> {
        let rows = if let Some(fid) = folder_id {
            self.query(
                "SELECT id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, previous_version_id, download_count, created_at FROM community_files WHERE channel_id = ? AND folder_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                json!([channel_id, fid, limit as i64, offset as i64]),
            )?
        } else {
            self.query(
                "SELECT id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, previous_version_id, download_count, created_at FROM community_files WHERE channel_id = ? AND folder_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?",
                json!([channel_id, limit as i64, offset as i64]),
            )?
        };
        Ok(rows
            .iter()
            .map(|row| CommunityFileRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                folder_id: row["folder_id"].as_str().map(|s| s.to_string()),
                filename: row["filename"].as_str().unwrap_or("").to_string(),
                description: row["description"].as_str().map(|s| s.to_string()),
                file_size: row["file_size"].as_i64().unwrap_or(0),
                mime_type: row["mime_type"].as_str().map(|s| s.to_string()),
                storage_chunks_json: row["storage_chunks_json"]
                    .as_str()
                    .unwrap_or("[]")
                    .to_string(),
                uploaded_by: row["uploaded_by"].as_str().unwrap_or("").to_string(),
                version: row["version"].as_i64().unwrap_or(1) as i32,
                previous_version_id: row["previous_version_id"].as_str().map(|s| s.to_string()),
                download_count: row["download_count"].as_i64().unwrap_or(0) as i32,
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Get a file by ID
    pub fn get_community_file(&self, id: &str) -> Result<Option<CommunityFileRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, previous_version_id, download_count, created_at FROM community_files WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(|row| CommunityFileRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
            folder_id: row["folder_id"].as_str().map(|s| s.to_string()),
            filename: row["filename"].as_str().unwrap_or("").to_string(),
            description: row["description"].as_str().map(|s| s.to_string()),
            file_size: row["file_size"].as_i64().unwrap_or(0),
            mime_type: row["mime_type"].as_str().map(|s| s.to_string()),
            storage_chunks_json: row["storage_chunks_json"]
                .as_str()
                .unwrap_or("[]")
                .to_string(),
            uploaded_by: row["uploaded_by"].as_str().unwrap_or("").to_string(),
            version: row["version"].as_i64().unwrap_or(1) as i32,
            previous_version_id: row["previous_version_id"].as_str().map(|s| s.to_string()),
            download_count: row["download_count"].as_i64().unwrap_or(0) as i32,
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }))
    }

    /// Delete a file
    pub fn delete_community_file(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_files WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Increment file download count
    pub fn increment_file_download_count(&self, id: &str) -> Result<()> {
        self.exec(
            "UPDATE community_files SET download_count = download_count + 1 WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    /// Create a file folder
    pub fn create_community_file_folder(
        &self,
        id: &str,
        channel_id: &str,
        parent_folder_id: Option<&str>,
        name: &str,
        created_by: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_file_folders (id, channel_id, parent_folder_id, name, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            json!([id, channel_id, parent_folder_id, name, created_by, created_at]),
        )?;
        Ok(())
    }

    /// Get file folders
    pub fn get_community_file_folders(
        &self,
        channel_id: &str,
        parent_folder_id: Option<&str>,
    ) -> Result<Vec<CommunityFileFolderRecord>> {
        let rows = if let Some(pid) = parent_folder_id {
            self.query(
                "SELECT id, channel_id, parent_folder_id, name, created_by, created_at FROM community_file_folders WHERE channel_id = ? AND parent_folder_id = ? ORDER BY name",
                json!([channel_id, pid]),
            )?
        } else {
            self.query(
                "SELECT id, channel_id, parent_folder_id, name, created_by, created_at FROM community_file_folders WHERE channel_id = ? AND parent_folder_id IS NULL ORDER BY name",
                json!([channel_id]),
            )?
        };
        Ok(rows
            .iter()
            .map(|row| CommunityFileFolderRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                parent_folder_id: row["parent_folder_id"].as_str().map(|s| s.to_string()),
                name: row["name"].as_str().unwrap_or("").to_string(),
                created_by: row["created_by"].as_str().unwrap_or("").to_string(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Delete a file folder
    pub fn delete_community_file_folder(&self, id: &str) -> Result<()> {
        self.exec(
            "DELETE FROM community_file_folders WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    // ── Auto-versioning ──────────────────────────────────────────────────

    /// Find an existing file with the same name in the same channel+folder.
    /// Returns the existing file's (id, version) if found.
    pub fn find_existing_community_file(
        &self,
        channel_id: &str,
        folder_id: Option<&str>,
        filename: &str,
    ) -> Result<Option<(String, i32)>> {
        let rows = if let Some(fid) = folder_id {
            self.query(
                "SELECT id, version FROM community_files WHERE channel_id = ? AND folder_id = ? AND filename = ? ORDER BY version DESC LIMIT 1",
                json!([channel_id, fid, filename]),
            )?
        } else {
            self.query(
                "SELECT id, version FROM community_files WHERE channel_id = ? AND folder_id IS NULL AND filename = ? ORDER BY version DESC LIMIT 1",
                json!([channel_id, filename]),
            )?
        };
        Ok(rows.first().map(|row| {
            (
                row["id"].as_str().unwrap_or("").to_string(),
                row["version"].as_i64().unwrap_or(1) as i32,
            )
        }))
    }

    /// Store a community file with auto-versioning.
    /// If a file with the same name already exists in the same channel+folder,
    /// the new file gets an incremented version and links to the previous version.
    #[allow(clippy::too_many_arguments)]
    pub fn store_community_file_versioned(
        &self,
        id: &str,
        channel_id: &str,
        folder_id: Option<&str>,
        filename: &str,
        description: Option<&str>,
        file_size: i64,
        mime_type: Option<&str>,
        storage_chunks_json: &str,
        uploaded_by: &str,
        created_at: i64,
    ) -> Result<i32> {
        // Check for existing file with same name
        let (version, prev_id) = if let Some((existing_id, existing_version)) =
            self.find_existing_community_file(channel_id, folder_id, filename)?
        {
            (existing_version + 1, Some(existing_id))
        } else {
            (1, None)
        };

        self.exec(
            "INSERT INTO community_files (id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, previous_version_id, download_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)",
            json!([id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, prev_id, created_at]),
        )?;

        Ok(version)
    }

    /// Get version history for a file (follows previous_version_id chain)
    pub fn get_file_version_history(&self, file_id: &str) -> Result<Vec<CommunityFileRecord>> {
        // Start from the given file and follow the version chain backwards
        let mut versions = Vec::new();
        let mut current_id = Some(file_id.to_string());

        while let Some(id) = current_id {
            if let Some(file) = self.get_community_file(&id)? {
                current_id = {
                    let rows = self.query(
                        "SELECT previous_version_id FROM community_files WHERE id = ?",
                        json!([id]),
                    )?;
                    rows.first()
                        .and_then(|row| row["previous_version_id"].as_str())
                        .map(|s| s.to_string())
                };
                versions.push(file);
            } else {
                break;
            }
        }

        Ok(versions)
    }

    /// Find an existing DM file with the same name in the same conversation+folder.
    pub fn find_existing_dm_file(
        &self,
        conversation_id: &str,
        folder_id: Option<&str>,
        filename: &str,
    ) -> Result<Option<(String, i32)>> {
        let rows = if let Some(fid) = folder_id {
            self.query(
                "SELECT id, version FROM dm_shared_files WHERE conversation_id = ? AND folder_id = ? AND filename = ? ORDER BY version DESC LIMIT 1",
                json!([conversation_id, fid, filename]),
            )?
        } else {
            self.query(
                "SELECT id, version FROM dm_shared_files WHERE conversation_id = ? AND folder_id IS NULL AND filename = ? ORDER BY version DESC LIMIT 1",
                json!([conversation_id, filename]),
            )?
        };
        Ok(rows.first().map(|row| {
            (
                row["id"].as_str().unwrap_or("").to_string(),
                row["version"].as_i64().unwrap_or(1) as i32,
            )
        }))
    }

    // ── File Re-encryption ────────────────────────────────────────────────

    /// Mark all community files in a channel for re-encryption after key rotation.
    pub fn mark_channel_files_for_reencryption(
        &self,
        channel_id: &str,
        new_key_version: i32,
    ) -> Result<u32> {
        let result = self.exec(
            "UPDATE community_files SET needs_reencryption = 1, key_version = ? WHERE channel_id = ? AND needs_reencryption = 0",
            json!([new_key_version, channel_id]),
        )?;
        Ok(result as u32)
    }

    /// Get community files that need re-encryption in a channel.
    pub fn get_files_needing_reencryption(
        &self,
        channel_id: &str,
        limit: usize,
    ) -> Result<Vec<CommunityFileRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, previous_version_id, download_count, created_at FROM community_files WHERE channel_id = ? AND needs_reencryption = 1 LIMIT ?",
            json!([channel_id, limit as i64]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityFileRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                folder_id: row["folder_id"].as_str().map(|s| s.to_string()),
                filename: row["filename"].as_str().unwrap_or("").to_string(),
                description: row["description"].as_str().map(|s| s.to_string()),
                file_size: row["file_size"].as_i64().unwrap_or(0),
                mime_type: row["mime_type"].as_str().map(|s| s.to_string()),
                storage_chunks_json: row["storage_chunks_json"]
                    .as_str()
                    .unwrap_or("[]")
                    .to_string(),
                uploaded_by: row["uploaded_by"].as_str().unwrap_or("").to_string(),
                version: row["version"].as_i64().unwrap_or(1) as i32,
                previous_version_id: row["previous_version_id"].as_str().map(|s| s.to_string()),
                download_count: row["download_count"].as_i64().unwrap_or(0) as i32,
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Clear the re-encryption flag after a file has been re-encrypted.
    pub fn clear_reencryption_flag(
        &self,
        file_id: &str,
        new_fingerprint: Option<&str>,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_files SET needs_reencryption = 0, encryption_fingerprint = ? WHERE id = ?",
            json!([new_fingerprint, file_id]),
        )?;
        Ok(())
    }

    /// Update the encryption fingerprint for a file (for key verification).
    pub fn update_file_encryption_fingerprint(
        &self,
        file_id: &str,
        fingerprint: &str,
        table: &str,
    ) -> Result<()> {
        let sql = format!(
            "UPDATE {} SET encryption_fingerprint = ? WHERE id = ?",
            table
        );
        self.exec(&sql, json!([fingerprint, file_id]))?;
        Ok(())
    }

    // ── Emoji & Stickers ─────────────────────────────────────────────────

    /// Create a custom emoji
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_emoji(
        &self,
        id: &str,
        community_id: &str,
        name: &str,
        image_url: &str,
        animated: bool,
        uploaded_by: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_emoji (id, community_id, name, image_url, animated, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, name, image_url, animated as i32, uploaded_by, created_at]),
        )?;
        Ok(())
    }

    /// Get all emoji for a community
    pub fn get_community_emoji(&self, community_id: &str) -> Result<Vec<CommunityEmojiRecord>> {
        let rows = self.query(
            "SELECT id, community_id, name, image_url, animated, uploaded_by, created_at FROM community_emoji WHERE community_id = ? ORDER BY name",
            json!([community_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityEmojiRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                name: row["name"].as_str().unwrap_or("").to_string(),
                image_url: row["image_url"].as_str().unwrap_or("").to_string(),
                animated: row["animated"].as_i64().unwrap_or(0) != 0,
                uploaded_by: row["uploaded_by"].as_str().unwrap_or("").to_string(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Rename a custom emoji
    pub fn rename_community_emoji(&self, id: &str, new_name: &str) -> Result<()> {
        self.exec(
            "UPDATE community_emoji SET name = ? WHERE id = ?",
            json!([new_name, id]),
        )?;
        Ok(())
    }

    /// Delete a custom emoji
    pub fn delete_community_emoji(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_emoji WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Create a custom sticker
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_sticker(
        &self,
        id: &str,
        community_id: &str,
        pack_id: Option<&str>,
        name: &str,
        image_url: &str,
        animated: bool,
        format: &str,
        uploaded_by: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_stickers (id, community_id, pack_id, name, image_url, animated, format, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, pack_id, name, image_url, animated as i32, format, uploaded_by, created_at]),
        )?;
        Ok(())
    }

    /// Get all stickers for a community
    pub fn get_community_stickers(
        &self,
        community_id: &str,
    ) -> Result<Vec<CommunityStickerRecord>> {
        let rows = self.query(
            "SELECT id, community_id, pack_id, name, image_url, animated, format, uploaded_by, created_at FROM community_stickers WHERE community_id = ? ORDER BY name",
            json!([community_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityStickerRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                pack_id: row["pack_id"].as_str().map(|s| s.to_string()),
                name: row["name"].as_str().unwrap_or("").to_string(),
                image_url: row["image_url"].as_str().unwrap_or("").to_string(),
                animated: row["animated"].as_i64().unwrap_or(0) != 0,
                format: row["format"].as_str().unwrap_or("png").to_string(),
                uploaded_by: row["uploaded_by"].as_str().unwrap_or("").to_string(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Delete a sticker
    pub fn delete_community_sticker(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_stickers WHERE id = ?", json!([id]))?;
        Ok(())
    }

    // ── Sticker Packs ───────────────────────────────────────────────────

    /// Create a sticker pack
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_sticker_pack(
        &self,
        id: &str,
        community_id: &str,
        name: &str,
        description: Option<&str>,
        cover_sticker_id: Option<&str>,
        created_by: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_sticker_packs (id, community_id, name, description, cover_sticker_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, name, description, cover_sticker_id, created_by, created_at]),
        )?;
        Ok(())
    }

    /// Get all sticker packs for a community
    pub fn get_community_sticker_packs(
        &self,
        community_id: &str,
    ) -> Result<Vec<CommunityStickerPackRecord>> {
        let rows = self.query(
            "SELECT id, community_id, name, description, cover_sticker_id, created_by, created_at FROM community_sticker_packs WHERE community_id = ? ORDER BY name",
            json!([community_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityStickerPackRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                name: row["name"].as_str().unwrap_or("").to_string(),
                description: row["description"].as_str().map(|s| s.to_string()),
                cover_sticker_id: row["cover_sticker_id"].as_str().map(|s| s.to_string()),
                created_by: row["created_by"].as_str().unwrap_or("").to_string(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Delete a sticker pack
    pub fn delete_community_sticker_pack(&self, id: &str) -> Result<()> {
        // First nullify pack_id on stickers referencing this pack
        self.exec(
            "UPDATE community_stickers SET pack_id = NULL WHERE pack_id = ?",
            json!([id]),
        )?;
        self.exec(
            "DELETE FROM community_sticker_packs WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    /// Rename a sticker pack
    pub fn rename_community_sticker_pack(&self, id: &str, new_name: &str) -> Result<()> {
        self.exec(
            "UPDATE community_sticker_packs SET name = ? WHERE id = ?",
            json!([new_name, id]),
        )?;
        Ok(())
    }

    // ── Webhooks ─────────────────────────────────────────────────────────

    /// Create a webhook
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_webhook(
        &self,
        id: &str,
        channel_id: &str,
        name: &str,
        avatar_url: Option<&str>,
        token: &str,
        creator_did: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO community_webhooks (id, channel_id, name, avatar_url, token, creator_did, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            json!([id, channel_id, name, avatar_url, token, creator_did, created_at]),
        )?;
        Ok(())
    }

    /// Get webhooks for a channel
    pub fn get_community_webhooks(&self, channel_id: &str) -> Result<Vec<CommunityWebhookRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, name, avatar_url, token, creator_did, created_at FROM community_webhooks WHERE channel_id = ? ORDER BY created_at",
            json!([channel_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityWebhookRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                name: row["name"].as_str().unwrap_or("").to_string(),
                avatar_url: row["avatar_url"].as_str().map(|s| s.to_string()),
                token: row["token"].as_str().unwrap_or("").to_string(),
                creator_did: row["creator_did"].as_str().unwrap_or("").to_string(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Get a webhook by ID
    pub fn get_community_webhook(&self, id: &str) -> Result<Option<CommunityWebhookRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, name, avatar_url, token, creator_did, created_at FROM community_webhooks WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(|row| CommunityWebhookRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().unwrap_or("").to_string(),
            avatar_url: row["avatar_url"].as_str().map(|s| s.to_string()),
            token: row["token"].as_str().unwrap_or("").to_string(),
            creator_did: row["creator_did"].as_str().unwrap_or("").to_string(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }))
    }

    /// Update a webhook
    pub fn update_community_webhook(
        &self,
        id: &str,
        name: Option<&str>,
        avatar_url: Option<&str>,
    ) -> Result<()> {
        self.exec(
            "UPDATE community_webhooks SET name = COALESCE(?, name), avatar_url = ? WHERE id = ?",
            json!([name, avatar_url, id]),
        )?;
        Ok(())
    }

    /// Delete a webhook
    pub fn delete_community_webhook(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM community_webhooks WHERE id = ?", json!([id]))?;
        Ok(())
    }

    // ── Channel Keys (E2EE) ──────────────────────────────────────────────

    /// Store a channel encryption key
    pub fn store_channel_key(
        &self,
        channel_id: &str,
        key_version: i32,
        encrypted_key: &[u8],
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO community_channel_keys (channel_id, key_version, encrypted_key, created_at) VALUES (?, ?, ?, ?)",
            json!([channel_id, key_version, hex::encode(encrypted_key), created_at]),
        )?;
        Ok(())
    }

    /// Get the latest channel key
    pub fn get_latest_channel_key(&self, channel_id: &str) -> Result<Option<ChannelKeyRecord>> {
        let rows = self.query(
            "SELECT channel_id, key_version, encrypted_key, created_at FROM community_channel_keys WHERE channel_id = ? ORDER BY key_version DESC LIMIT 1",
            json!([channel_id]),
        )?;
        Ok(rows.first().map(|row| ChannelKeyRecord {
            channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
            key_version: row["key_version"].as_i64().unwrap_or(0) as i32,
            encrypted_key: row["encrypted_key"]
                .as_str()
                .map(|s| hex::decode(s).unwrap_or_default())
                .unwrap_or_default(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }))
    }

    // ── Channel Permission Overrides ─────────────────────────────────────

    /// Set a channel permission override
    pub fn set_channel_permission_override(
        &self,
        id: &str,
        channel_id: &str,
        target_type: &str,
        target_id: &str,
        allow_bitfield: &str,
        deny_bitfield: &str,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO channel_permission_overrides (id, channel_id, target_type, target_id, allow_bitfield, deny_bitfield) VALUES (?, ?, ?, ?, ?, ?)",
            json!([id, channel_id, target_type, target_id, allow_bitfield, deny_bitfield]),
        )?;
        Ok(())
    }

    /// Remove a channel permission override
    pub fn remove_channel_permission_override(&self, id: &str) -> Result<()> {
        self.exec(
            "DELETE FROM channel_permission_overrides WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    /// Get channel permission overrides
    pub fn get_channel_permission_overrides(
        &self,
        channel_id: &str,
    ) -> Result<Vec<ChannelPermissionOverrideRecord>> {
        let rows = self.query(
            "SELECT id, channel_id, target_type, target_id, allow_bitfield, deny_bitfield FROM channel_permission_overrides WHERE channel_id = ?",
            json!([channel_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| ChannelPermissionOverrideRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                channel_id: row["channel_id"].as_str().unwrap_or("").to_string(),
                target_type: row["target_type"].as_str().unwrap_or("").to_string(),
                target_id: row["target_id"].as_str().unwrap_or("").to_string(),
                allow_bitfield: row["allow_bitfield"].as_str().unwrap_or("0").to_string(),
                deny_bitfield: row["deny_bitfield"].as_str().unwrap_or("0").to_string(),
            })
            .collect())
    }

    // ── Member Status ────────────────────────────────────────────────────

    /// Set a member's custom status
    pub fn set_member_status(
        &self,
        community_id: &str,
        member_did: &str,
        status_text: Option<&str>,
        status_emoji: Option<&str>,
        expires_at: Option<i64>,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO community_member_status (community_id, member_did, status_text, status_emoji, expires_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            json!([community_id, member_did, status_text, status_emoji, expires_at, updated_at]),
        )?;
        Ok(())
    }

    /// Get a member's status
    pub fn get_member_status(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Option<CommunityMemberStatusRecord>> {
        let rows = self.query(
            "SELECT community_id, member_did, status_text, status_emoji, expires_at, updated_at FROM community_member_status WHERE community_id = ? AND member_did = ?",
            json!([community_id, member_did]),
        )?;
        Ok(rows.first().map(|row| CommunityMemberStatusRecord {
            community_id: row["community_id"].as_str().unwrap_or("").to_string(),
            member_did: row["member_did"].as_str().unwrap_or("").to_string(),
            status_text: row["status_text"].as_str().map(|s| s.to_string()),
            status_emoji: row["status_emoji"].as_str().map(|s| s.to_string()),
            expires_at: row["expires_at"].as_i64(),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }))
    }

    /// Clear a member's status
    pub fn clear_member_status(&self, community_id: &str, member_did: &str) -> Result<()> {
        self.exec(
            "DELETE FROM community_member_status WHERE community_id = ? AND member_did = ?",
            json!([community_id, member_did]),
        )?;
        Ok(())
    }

    // ── Notification Settings ────────────────────────────────────────────

    /// Upsert a notification setting
    #[allow(clippy::too_many_arguments)]
    pub fn upsert_notification_setting(
        &self,
        id: &str,
        community_id: &str,
        member_did: &str,
        target_type: &str,
        target_id: &str,
        mute_until: Option<i64>,
        suppress_everyone: bool,
        suppress_roles: bool,
        level: &str,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO community_notification_settings (id, community_id, member_did, target_type, target_id, mute_until, suppress_everyone, suppress_roles, level, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, member_did, target_type, target_id, mute_until, suppress_everyone as i32, suppress_roles as i32, level, updated_at]),
        )?;
        Ok(())
    }

    /// Delete a notification setting
    pub fn delete_notification_setting(&self, id: &str) -> Result<()> {
        self.exec(
            "DELETE FROM community_notification_settings WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    /// Get notification settings for a member in a community
    pub fn get_notification_settings(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Vec<CommunityNotificationSettingRecord>> {
        let rows = self.query(
            "SELECT id, community_id, member_did, target_type, target_id, mute_until, suppress_everyone, suppress_roles, level, updated_at FROM community_notification_settings WHERE community_id = ? AND member_did = ?",
            json!([community_id, member_did]),
        )?;
        Ok(rows
            .iter()
            .map(|row| CommunityNotificationSettingRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                community_id: row["community_id"].as_str().unwrap_or("").to_string(),
                member_did: row["member_did"].as_str().unwrap_or("").to_string(),
                target_type: row["target_type"].as_str().unwrap_or("").to_string(),
                target_id: row["target_id"].as_str().unwrap_or("").to_string(),
                mute_until: row["mute_until"].as_i64(),
                suppress_everyone: row["suppress_everyone"].as_i64().unwrap_or(0) != 0,
                suppress_roles: row["suppress_roles"].as_i64().unwrap_or(0) != 0,
                level: row["level"].as_str().unwrap_or("all").to_string(),
                updated_at: row["updated_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    // ── Boost Nodes ──────────────────────────────────────────────────────

    /// Upsert a boost node
    #[allow(clippy::too_many_arguments)]
    pub fn upsert_boost_node(
        &self,
        id: &str,
        owner_did: &str,
        node_type: &str,
        node_public_key: &str,
        name: &str,
        enabled: bool,
        max_storage_bytes: i64,
        max_bandwidth_mbps: i32,
        auto_start: bool,
        prioritized_communities: Option<&str>,
        pairing_token: Option<&str>,
        remote_address: Option<&str>,
        created_at: i64,
        updated_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO boost_nodes (id, owner_did, node_type, node_public_key, name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities, pairing_token, remote_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, owner_did, node_type, node_public_key, name, enabled as i32, max_storage_bytes, max_bandwidth_mbps, auto_start as i32, prioritized_communities, pairing_token, remote_address, created_at, updated_at]),
        )?;
        Ok(())
    }

    /// Get a boost node by ID
    pub fn get_boost_node(&self, id: &str) -> Result<Option<BoostNodeRecord>> {
        let rows = self.query(
            "SELECT id, owner_did, node_type, node_public_key, name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities, pairing_token, remote_address, last_seen_at, created_at, updated_at FROM boost_nodes WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(Self::parse_boost_node))
    }

    /// Get all boost nodes for an owner
    pub fn get_boost_nodes(&self, owner_did: &str) -> Result<Vec<BoostNodeRecord>> {
        let rows = self.query(
            "SELECT id, owner_did, node_type, node_public_key, name, enabled, max_storage_bytes, max_bandwidth_mbps, auto_start, prioritized_communities, pairing_token, remote_address, last_seen_at, created_at, updated_at FROM boost_nodes WHERE owner_did = ? ORDER BY created_at",
            json!([owner_did]),
        )?;
        Ok(rows.iter().map(Self::parse_boost_node).collect())
    }

    /// Delete a boost node
    pub fn delete_boost_node(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM boost_nodes WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Update boost node last seen
    pub fn update_boost_node_last_seen(&self, id: &str, last_seen_at: i64) -> Result<()> {
        self.exec(
            "UPDATE boost_nodes SET last_seen_at = ?, updated_at = ? WHERE id = ?",
            json!([last_seen_at, last_seen_at, id]),
        )?;
        Ok(())
    }

    /// Update boost node config
    #[allow(clippy::too_many_arguments)]
    pub fn update_boost_node_config(
        &self,
        id: &str,
        name: Option<&str>,
        enabled: Option<bool>,
        max_storage_bytes: Option<i64>,
        max_bandwidth_mbps: Option<i32>,
        auto_start: Option<bool>,
        prioritized_communities: Option<&str>,
        updated_at: i64,
    ) -> Result<()> {
        let mut sets = Vec::new();
        let mut params: Vec<serde_json::Value> = Vec::new();
        if let Some(v) = name {
            sets.push("name = ?");
            params.push(json!(v));
        }
        if let Some(v) = enabled {
            sets.push("enabled = ?");
            params.push(json!(v as i32));
        }
        if let Some(v) = max_storage_bytes {
            sets.push("max_storage_bytes = ?");
            params.push(json!(v));
        }
        if let Some(v) = max_bandwidth_mbps {
            sets.push("max_bandwidth_mbps = ?");
            params.push(json!(v));
        }
        if let Some(v) = auto_start {
            sets.push("auto_start = ?");
            params.push(json!(v as i32));
        }
        if let Some(v) = prioritized_communities {
            sets.push("prioritized_communities = ?");
            params.push(json!(v));
        }
        sets.push("updated_at = ?");
        params.push(json!(updated_at));
        params.push(json!(id));
        if !sets.is_empty() {
            let sql = format!("UPDATE boost_nodes SET {} WHERE id = ?", sets.join(", "));
            self.exec(&sql, serde_json::Value::Array(params))?;
        }
        Ok(())
    }

    fn parse_boost_node(row: &serde_json::Value) -> BoostNodeRecord {
        BoostNodeRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            owner_did: row["owner_did"].as_str().unwrap_or("").to_string(),
            node_type: row["node_type"].as_str().unwrap_or("").to_string(),
            node_public_key: row["node_public_key"].as_str().unwrap_or("").to_string(),
            name: row["name"].as_str().unwrap_or("").to_string(),
            enabled: row["enabled"].as_i64().unwrap_or(0) != 0,
            max_storage_bytes: row["max_storage_bytes"].as_i64().unwrap_or(0),
            max_bandwidth_mbps: row["max_bandwidth_mbps"].as_i64().unwrap_or(0) as i32,
            auto_start: row["auto_start"].as_i64().unwrap_or(0) != 0,
            prioritized_communities: row["prioritized_communities"]
                .as_str()
                .map(|s| s.to_string()),
            pairing_token: row["pairing_token"].as_str().map(|s| s.to_string()),
            remote_address: row["remote_address"].as_str().map(|s| s.to_string()),
            last_seen_at: row["last_seen_at"].as_i64(),
            created_at: row["created_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }
    }

    // ── File Chunk Storage ───────────────────────────────────────────────

    /// Store a file chunk (data stored as base64 text in WASM)
    pub fn store_chunk(
        &self,
        chunk_id: &str,
        file_id: &str,
        chunk_index: i32,
        data: &[u8],
        size: i64,
        created_at: i64,
    ) -> Result<()> {
        use base64::Engine as _;
        let data_b64 = base64::engine::general_purpose::STANDARD.encode(data);
        self.exec(
            "INSERT OR REPLACE INTO file_chunks (chunk_id, file_id, chunk_index, data, size, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            json!([chunk_id, file_id, chunk_index, data_b64, size, created_at]),
        )?;
        Ok(())
    }

    /// Get a file chunk by ID
    pub fn get_chunk(&self, chunk_id: &str) -> Result<Option<FileChunkRecord>> {
        use base64::Engine as _;
        let rows = self.query(
            "SELECT chunk_id, file_id, chunk_index, data, size, created_at FROM file_chunks WHERE chunk_id = ?",
            json!([chunk_id]),
        )?;
        Ok(rows.first().map(|row| {
            let data_b64 = row["data"].as_str().unwrap_or("");
            let data = base64::engine::general_purpose::STANDARD
                .decode(data_b64)
                .unwrap_or_default();
            FileChunkRecord {
                chunk_id: row["chunk_id"].as_str().unwrap_or("").to_string(),
                file_id: row["file_id"].as_str().unwrap_or("").to_string(),
                chunk_index: row["chunk_index"].as_i64().unwrap_or(0) as i32,
                data,
                size: row["size"].as_i64().unwrap_or(0),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            }
        }))
    }

    /// Get all chunks for a file
    pub fn get_chunks_for_file(&self, file_id: &str) -> Result<Vec<FileChunkRecord>> {
        use base64::Engine as _;
        let rows = self.query(
            "SELECT chunk_id, file_id, chunk_index, data, size, created_at FROM file_chunks WHERE file_id = ? ORDER BY chunk_index",
            json!([file_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| {
                let data_b64 = row["data"].as_str().unwrap_or("");
                let data = base64::engine::general_purpose::STANDARD
                    .decode(data_b64)
                    .unwrap_or_default();
                FileChunkRecord {
                    chunk_id: row["chunk_id"].as_str().unwrap_or("").to_string(),
                    file_id: row["file_id"].as_str().unwrap_or("").to_string(),
                    chunk_index: row["chunk_index"].as_i64().unwrap_or(0) as i32,
                    data,
                    size: row["size"].as_i64().unwrap_or(0),
                    created_at: row["created_at"].as_i64().unwrap_or(0),
                }
            })
            .collect())
    }

    /// Delete all chunks for a file
    pub fn delete_chunks_for_file(&self, file_id: &str) -> Result<()> {
        self.exec(
            "DELETE FROM file_chunks WHERE file_id = ?",
            json!([file_id]),
        )?;
        Ok(())
    }

    /// Store a file manifest
    #[allow(clippy::too_many_arguments)]
    pub fn store_manifest(
        &self,
        file_id: &str,
        filename: &str,
        total_size: i64,
        chunk_size: i64,
        total_chunks: i32,
        chunks_json: &str,
        file_hash: &str,
        encrypted: bool,
        encryption_key_id: Option<&str>,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR REPLACE INTO file_manifests (file_id, filename, total_size, chunk_size, total_chunks, chunks_json, file_hash, encrypted, encryption_key_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([file_id, filename, total_size, chunk_size, total_chunks, chunks_json, file_hash, encrypted as i32, encryption_key_id, created_at]),
        )?;
        Ok(())
    }

    /// Get a file manifest by file_id
    pub fn get_manifest(&self, file_id: &str) -> Result<Option<FileManifestRecord>> {
        let rows = self.query(
            "SELECT file_id, filename, total_size, chunk_size, total_chunks, chunks_json, file_hash, encrypted, encryption_key_id, created_at FROM file_manifests WHERE file_id = ?",
            json!([file_id]),
        )?;
        Ok(rows.first().map(|row| FileManifestRecord {
            file_id: row["file_id"].as_str().unwrap_or("").to_string(),
            filename: row["filename"].as_str().unwrap_or("").to_string(),
            total_size: row["total_size"].as_i64().unwrap_or(0),
            chunk_size: row["chunk_size"].as_i64().unwrap_or(0),
            total_chunks: row["total_chunks"].as_i64().unwrap_or(0) as i32,
            chunks_json: row["chunks_json"].as_str().unwrap_or("[]").to_string(),
            file_hash: row["file_hash"].as_str().unwrap_or("").to_string(),
            encrypted: row["encrypted"].as_i64().unwrap_or(0) != 0,
            encryption_key_id: row["encryption_key_id"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }))
    }

    /// Delete a file manifest
    pub fn delete_manifest(&self, file_id: &str) -> Result<()> {
        self.exec(
            "DELETE FROM file_manifests WHERE file_id = ?",
            json!([file_id]),
        )?;
        Ok(())
    }

    // ── DM Shared Files ──────────────────────────────────────────────────

    /// Store a DM shared file
    #[allow(clippy::too_many_arguments)]
    pub fn store_dm_shared_file(
        &self,
        id: &str,
        conversation_id: &str,
        folder_id: Option<&str>,
        filename: &str,
        description: Option<&str>,
        file_size: i64,
        mime_type: Option<&str>,
        storage_chunks_json: &str,
        uploaded_by: &str,
        encrypted_metadata: Option<&str>,
        encryption_nonce: Option<&str>,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO dm_shared_files (id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, encrypted_metadata, encryption_nonce, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?, ?)",
            json!([id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, encrypted_metadata, encryption_nonce, created_at]),
        )?;
        Ok(())
    }

    /// Get DM shared files in a conversation (optionally within a folder)
    pub fn get_dm_shared_files(
        &self,
        conversation_id: &str,
        folder_id: Option<&str>,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<DmSharedFileRecord>> {
        let rows = if let Some(fid) = folder_id {
            self.query(
                "SELECT id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, encrypted_metadata, encryption_nonce, created_at FROM dm_shared_files WHERE conversation_id = ? AND folder_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
                json!([conversation_id, fid, limit as i64, offset as i64]),
            )?
        } else {
            self.query(
                "SELECT id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, encrypted_metadata, encryption_nonce, created_at FROM dm_shared_files WHERE conversation_id = ? AND folder_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?",
                json!([conversation_id, limit as i64, offset as i64]),
            )?
        };
        Ok(rows
            .iter()
            .map(|row| DmSharedFileRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                conversation_id: row["conversation_id"].as_str().unwrap_or("").to_string(),
                folder_id: row["folder_id"].as_str().map(|s| s.to_string()),
                filename: row["filename"].as_str().unwrap_or("").to_string(),
                description: row["description"].as_str().map(|s| s.to_string()),
                file_size: row["file_size"].as_i64().unwrap_or(0),
                mime_type: row["mime_type"].as_str().map(|s| s.to_string()),
                storage_chunks_json: row["storage_chunks_json"]
                    .as_str()
                    .unwrap_or("[]")
                    .to_string(),
                uploaded_by: row["uploaded_by"].as_str().unwrap_or("").to_string(),
                version: row["version"].as_i64().unwrap_or(1) as i32,
                download_count: row["download_count"].as_i64().unwrap_or(0) as i32,
                encrypted_metadata: row["encrypted_metadata"].as_str().map(|s| s.to_string()),
                encryption_nonce: row["encryption_nonce"].as_str().map(|s| s.to_string()),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Get a single DM shared file by ID
    pub fn get_dm_shared_file(&self, id: &str) -> Result<Option<DmSharedFileRecord>> {
        let rows = self.query(
            "SELECT id, conversation_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by, version, download_count, encrypted_metadata, encryption_nonce, created_at FROM dm_shared_files WHERE id = ?",
            json!([id]),
        )?;
        Ok(rows.first().map(|row| DmSharedFileRecord {
            id: row["id"].as_str().unwrap_or("").to_string(),
            conversation_id: row["conversation_id"].as_str().unwrap_or("").to_string(),
            folder_id: row["folder_id"].as_str().map(|s| s.to_string()),
            filename: row["filename"].as_str().unwrap_or("").to_string(),
            description: row["description"].as_str().map(|s| s.to_string()),
            file_size: row["file_size"].as_i64().unwrap_or(0),
            mime_type: row["mime_type"].as_str().map(|s| s.to_string()),
            storage_chunks_json: row["storage_chunks_json"]
                .as_str()
                .unwrap_or("[]")
                .to_string(),
            uploaded_by: row["uploaded_by"].as_str().unwrap_or("").to_string(),
            version: row["version"].as_i64().unwrap_or(1) as i32,
            download_count: row["download_count"].as_i64().unwrap_or(0) as i32,
            encrypted_metadata: row["encrypted_metadata"].as_str().map(|s| s.to_string()),
            encryption_nonce: row["encryption_nonce"].as_str().map(|s| s.to_string()),
            created_at: row["created_at"].as_i64().unwrap_or(0),
        }))
    }

    /// Increment download count for a DM shared file
    pub fn increment_dm_file_download_count(&self, id: &str) -> Result<()> {
        self.exec(
            "UPDATE dm_shared_files SET download_count = download_count + 1 WHERE id = ?",
            json!([id]),
        )?;
        Ok(())
    }

    /// Delete a DM shared file
    pub fn delete_dm_shared_file(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM dm_shared_files WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Move a DM shared file to a different folder
    pub fn move_dm_shared_file(&self, id: &str, target_folder_id: Option<&str>) -> Result<()> {
        self.exec(
            "UPDATE dm_shared_files SET folder_id = ? WHERE id = ?",
            json!([target_folder_id, id]),
        )?;
        Ok(())
    }

    // ── DM Shared Folders ────────────────────────────────────────────────

    /// Create a DM shared folder
    pub fn create_dm_shared_folder(
        &self,
        id: &str,
        conversation_id: &str,
        parent_folder_id: Option<&str>,
        name: &str,
        created_by: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT INTO dm_shared_folders (id, conversation_id, parent_folder_id, name, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            json!([id, conversation_id, parent_folder_id, name, created_by, created_at]),
        )?;
        Ok(())
    }

    /// Get DM shared folders
    pub fn get_dm_shared_folders(
        &self,
        conversation_id: &str,
        parent_folder_id: Option<&str>,
    ) -> Result<Vec<DmSharedFolderRecord>> {
        let rows = if let Some(pid) = parent_folder_id {
            self.query(
                "SELECT id, conversation_id, parent_folder_id, name, created_by, created_at FROM dm_shared_folders WHERE conversation_id = ? AND parent_folder_id = ? ORDER BY name",
                json!([conversation_id, pid]),
            )?
        } else {
            self.query(
                "SELECT id, conversation_id, parent_folder_id, name, created_by, created_at FROM dm_shared_folders WHERE conversation_id = ? AND parent_folder_id IS NULL ORDER BY name",
                json!([conversation_id]),
            )?
        };
        Ok(rows
            .iter()
            .map(|row| DmSharedFolderRecord {
                id: row["id"].as_str().unwrap_or("").to_string(),
                conversation_id: row["conversation_id"].as_str().unwrap_or("").to_string(),
                parent_folder_id: row["parent_folder_id"].as_str().map(|s| s.to_string()),
                name: row["name"].as_str().unwrap_or("").to_string(),
                created_by: row["created_by"].as_str().unwrap_or("").to_string(),
                created_at: row["created_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Delete a DM shared folder
    pub fn delete_dm_shared_folder(&self, id: &str) -> Result<()> {
        self.exec("DELETE FROM dm_shared_folders WHERE id = ?", json!([id]))?;
        Ok(())
    }

    /// Rename a DM shared folder
    pub fn rename_dm_shared_folder(&self, id: &str, name: &str) -> Result<()> {
        self.exec(
            "UPDATE dm_shared_folders SET name = ? WHERE id = ?",
            json!([name, id]),
        )?;
        Ok(())
    }

    // ========================================================================
    // TRANSFER SESSION METHODS (P2P file transfer state persistence)
    // ========================================================================

    /// Store a new transfer session
    pub fn store_transfer_session(
        &self,
        transfer_id: &str,
        file_id: &str,
        manifest_json: &str,
        direction: &str,
        peer_did: &str,
        total_chunks: i32,
        total_bytes: i64,
        transport_type: &str,
    ) -> Result<()> {
        let now = js_sys::Date::now() as i64;
        self.exec(
            "INSERT INTO transfer_sessions (transfer_id, file_id, manifest_json, direction, peer_did, state, chunks_completed, total_chunks, bytes_transferred, total_bytes, chunks_bitfield, transport_type, started_at, updated_at) VALUES (?, ?, ?, ?, ?, 'requesting', 0, ?, 0, ?, '', ?, ?, ?)",
            json!([transfer_id, file_id, manifest_json, direction, peer_did, total_chunks, total_bytes, transport_type, now, now]),
        )?;
        Ok(())
    }

    /// Get a transfer session by ID
    pub fn get_transfer_session(&self, transfer_id: &str) -> Result<Option<TransferSessionRecord>> {
        let rows = self.query(
            "SELECT transfer_id, file_id, manifest_json, direction, peer_did, state, chunks_completed, total_chunks, bytes_transferred, total_bytes, chunks_bitfield, transport_type, error, started_at, updated_at FROM transfer_sessions WHERE transfer_id = ?",
            json!([transfer_id]),
        )?;
        Ok(rows.first().map(|row| TransferSessionRecord {
            transfer_id: row["transfer_id"].as_str().unwrap_or("").to_string(),
            file_id: row["file_id"].as_str().unwrap_or("").to_string(),
            manifest_json: row["manifest_json"].as_str().unwrap_or("").to_string(),
            direction: row["direction"].as_str().unwrap_or("").to_string(),
            peer_did: row["peer_did"].as_str().unwrap_or("").to_string(),
            state: row["state"].as_str().unwrap_or("").to_string(),
            chunks_completed: row["chunks_completed"].as_i64().unwrap_or(0) as i32,
            total_chunks: row["total_chunks"].as_i64().unwrap_or(0) as i32,
            bytes_transferred: row["bytes_transferred"].as_i64().unwrap_or(0),
            total_bytes: row["total_bytes"].as_i64().unwrap_or(0),
            chunks_bitfield: row["chunks_bitfield"].as_str().unwrap_or("").to_string(),
            transport_type: row["transport_type"].as_str().unwrap_or("").to_string(),
            error: row["error"].as_str().map(|s| s.to_string()),
            started_at: row["started_at"].as_i64().unwrap_or(0),
            updated_at: row["updated_at"].as_i64().unwrap_or(0),
        }))
    }

    /// Get all incomplete (non-terminal) transfer sessions
    pub fn get_incomplete_transfers(&self) -> Result<Vec<TransferSessionRecord>> {
        let rows = self.query(
            "SELECT transfer_id, file_id, manifest_json, direction, peer_did, state, chunks_completed, total_chunks, bytes_transferred, total_bytes, chunks_bitfield, transport_type, error, started_at, updated_at FROM transfer_sessions WHERE state NOT IN ('completed', 'failed', 'cancelled') ORDER BY updated_at DESC",
            json!([]),
        )?;
        Ok(rows
            .iter()
            .map(|row| TransferSessionRecord {
                transfer_id: row["transfer_id"].as_str().unwrap_or("").to_string(),
                file_id: row["file_id"].as_str().unwrap_or("").to_string(),
                manifest_json: row["manifest_json"].as_str().unwrap_or("").to_string(),
                direction: row["direction"].as_str().unwrap_or("").to_string(),
                peer_did: row["peer_did"].as_str().unwrap_or("").to_string(),
                state: row["state"].as_str().unwrap_or("").to_string(),
                chunks_completed: row["chunks_completed"].as_i64().unwrap_or(0) as i32,
                total_chunks: row["total_chunks"].as_i64().unwrap_or(0) as i32,
                bytes_transferred: row["bytes_transferred"].as_i64().unwrap_or(0),
                total_bytes: row["total_bytes"].as_i64().unwrap_or(0),
                chunks_bitfield: row["chunks_bitfield"].as_str().unwrap_or("").to_string(),
                transport_type: row["transport_type"].as_str().unwrap_or("").to_string(),
                error: row["error"].as_str().map(|s| s.to_string()),
                started_at: row["started_at"].as_i64().unwrap_or(0),
                updated_at: row["updated_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    /// Update transfer session progress (chunk received/sent)
    pub fn update_transfer_progress(
        &self,
        transfer_id: &str,
        state: &str,
        chunks_completed: i32,
        bytes_transferred: i64,
        chunks_bitfield: &str,
    ) -> Result<()> {
        let now = js_sys::Date::now() as i64;
        self.exec(
            "UPDATE transfer_sessions SET state = ?, chunks_completed = ?, bytes_transferred = ?, chunks_bitfield = ?, updated_at = ? WHERE transfer_id = ?",
            json!([state, chunks_completed, bytes_transferred, chunks_bitfield, now, transfer_id]),
        )?;
        Ok(())
    }

    /// Update transfer session state with optional error
    pub fn update_transfer_state(
        &self,
        transfer_id: &str,
        state: &str,
        error: Option<&str>,
    ) -> Result<()> {
        let now = js_sys::Date::now() as i64;
        self.exec(
            "UPDATE transfer_sessions SET state = ?, error = ?, updated_at = ? WHERE transfer_id = ?",
            json!([state, error, now, transfer_id]),
        )?;
        Ok(())
    }

    /// Delete a transfer session
    pub fn delete_transfer_session(&self, transfer_id: &str) -> Result<()> {
        self.exec(
            "DELETE FROM transfer_sessions WHERE transfer_id = ?",
            json!([transfer_id]),
        )?;
        Ok(())
    }

    /// Get transfer sessions for a specific file
    pub fn get_transfers_for_file(&self, file_id: &str) -> Result<Vec<TransferSessionRecord>> {
        let rows = self.query(
            "SELECT transfer_id, file_id, manifest_json, direction, peer_did, state, chunks_completed, total_chunks, bytes_transferred, total_bytes, chunks_bitfield, transport_type, error, started_at, updated_at FROM transfer_sessions WHERE file_id = ? ORDER BY started_at DESC",
            json!([file_id]),
        )?;
        Ok(rows
            .iter()
            .map(|row| TransferSessionRecord {
                transfer_id: row["transfer_id"].as_str().unwrap_or("").to_string(),
                file_id: row["file_id"].as_str().unwrap_or("").to_string(),
                manifest_json: row["manifest_json"].as_str().unwrap_or("").to_string(),
                direction: row["direction"].as_str().unwrap_or("").to_string(),
                peer_did: row["peer_did"].as_str().unwrap_or("").to_string(),
                state: row["state"].as_str().unwrap_or("").to_string(),
                chunks_completed: row["chunks_completed"].as_i64().unwrap_or(0) as i32,
                total_chunks: row["total_chunks"].as_i64().unwrap_or(0) as i32,
                bytes_transferred: row["bytes_transferred"].as_i64().unwrap_or(0),
                total_bytes: row["total_bytes"].as_i64().unwrap_or(0),
                chunks_bitfield: row["chunks_bitfield"].as_str().unwrap_or("").to_string(),
                transport_type: row["transport_type"].as_str().unwrap_or("").to_string(),
                error: row["error"].as_str().map(|s| s.to_string()),
                started_at: row["started_at"].as_i64().unwrap_or(0),
                updated_at: row["updated_at"].as_i64().unwrap_or(0),
            })
            .collect())
    }

    // ── Community Seats ────────────────────────────────────────────────

    /// Create a single community seat
    #[allow(clippy::too_many_arguments)]
    pub fn create_community_seat(
        &self,
        id: &str,
        community_id: &str,
        platform: &str,
        platform_user_id: &str,
        platform_username: &str,
        nickname: Option<&str>,
        avatar_url: Option<&str>,
        role_ids_json: &str,
        created_at: i64,
    ) -> Result<()> {
        self.exec(
            "INSERT OR IGNORE INTO community_seats (id, community_id, platform, platform_user_id, platform_username, nickname, avatar_url, role_ids_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            json!([id, community_id, platform, platform_user_id, platform_username, nickname, avatar_url, role_ids_json, created_at]),
        )?;
        Ok(())
    }

    /// Bulk create community seats (for import)
    pub fn create_community_seats_batch(&self, seats: &[CommunitySeatRecord]) -> Result<usize> {
        let mut count = 0usize;
        for seat in seats {
            let result = self.exec(
                "INSERT OR IGNORE INTO community_seats (id, community_id, platform, platform_user_id, platform_username, nickname, avatar_url, role_ids_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                json!([seat.id, seat.community_id, seat.platform, seat.platform_user_id, seat.platform_username, seat.nickname, seat.avatar_url, seat.role_ids_json, seat.created_at]),
            )?;
            count += result as usize;
        }
        Ok(count)
    }

    /// Get all seats for a community
    pub fn get_community_seats(&self, community_id: &str) -> Result<Vec<CommunitySeatRecord>> {
        let rows = self.query(
            "SELECT id, community_id, platform, platform_user_id, platform_username, nickname, avatar_url, role_ids_json, claimed_by_did, claimed_at, created_at FROM community_seats WHERE community_id = ? ORDER BY platform_username",
            json!([community_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_seat).collect())
    }

    /// Get unclaimed seats for a community
    pub fn get_unclaimed_community_seats(
        &self,
        community_id: &str,
    ) -> Result<Vec<CommunitySeatRecord>> {
        let rows = self.query(
            "SELECT id, community_id, platform, platform_user_id, platform_username, nickname, avatar_url, role_ids_json, claimed_by_did, claimed_at, created_at FROM community_seats WHERE community_id = ? AND claimed_by_did IS NULL ORDER BY platform_username",
            json!([community_id]),
        )?;
        Ok(rows.iter().map(Self::parse_community_seat).collect())
    }

    /// Find a seat by platform and platform user ID
    pub fn find_community_seat_by_platform(
        &self,
        community_id: &str,
        platform: &str,
        platform_user_id: &str,
    ) -> Result<Option<CommunitySeatRecord>> {
        let rows = self.query(
            "SELECT id, community_id, platform, platform_user_id, platform_username, nickname, avatar_url, role_ids_json, claimed_by_did, claimed_at, created_at FROM community_seats WHERE community_id = ? AND platform = ? AND platform_user_id = ?",
            json!([community_id, platform, platform_user_id]),
        )?;
        Ok(rows.first().map(Self::parse_community_seat))
    }

    /// Get a seat by ID
    pub fn get_community_seat(&self, seat_id: &str) -> Result<Option<CommunitySeatRecord>> {
        let rows = self.query(
            "SELECT id, community_id, platform, platform_user_id, platform_username, nickname, avatar_url, role_ids_json, claimed_by_did, claimed_at, created_at FROM community_seats WHERE id = ?",
            json!([seat_id]),
        )?;
        Ok(rows.first().map(Self::parse_community_seat))
    }

    /// Claim a seat (set claimed_by_did and claimed_at)
    pub fn claim_community_seat(
        &self,
        seat_id: &str,
        claimed_by_did: &str,
        claimed_at: i64,
    ) -> Result<()> {
        let updated = self.exec(
            "UPDATE community_seats SET claimed_by_did = ?, claimed_at = ? WHERE id = ? AND claimed_by_did IS NULL",
            json!([claimed_by_did, claimed_at, seat_id]),
        )?;
        if updated == 0 {
            return Err(Error::DatabaseError(
                "Seat not found or already claimed".to_string(),
            ));
        }
        Ok(())
    }

    /// Delete a community seat
    pub fn delete_community_seat(&self, seat_id: &str) -> Result<()> {
        self.exec("DELETE FROM community_seats WHERE id = ?", json!([seat_id]))?;
        Ok(())
    }

    /// Count seats for a community (total and unclaimed)
    pub fn count_community_seats(&self, community_id: &str) -> Result<(i64, i64)> {
        let total: i64 = self
            .query_scalar(
                "SELECT COUNT(*) FROM community_seats WHERE community_id = ?",
                json!([community_id]),
            )?
            .unwrap_or(0);

        let unclaimed: i64 = self.query_scalar(
            "SELECT COUNT(*) FROM community_seats WHERE community_id = ? AND claimed_by_did IS NULL",
            json!([community_id]),
        )?.unwrap_or(0);

        Ok((total, unclaimed))
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
    /// Avatar (base64 image data or URL)
    pub avatar: Option<String>,
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
    /// Sender's avatar (base64 or URL)
    pub from_avatar: Option<String>,
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

// ============================================================================
// CALL HISTORY RECORD TYPE
// ============================================================================

/// A call history record from the database
#[derive(Debug, Clone)]
pub struct CallHistoryRecord {
    pub id: String,
    pub conversation_id: String,
    pub call_type: String,
    pub direction: String,
    pub status: String,
    pub participants: String,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub duration_ms: Option<i64>,
    pub created_at: i64,
}

// ============================================================================
// NOTIFICATION RECORD TYPE
// ============================================================================

/// A notification record from the database
#[derive(Debug, Clone)]
pub struct NotificationRecord {
    pub id: String,
    pub notification_type: String,
    pub title: String,
    pub description: Option<String>,
    pub related_did: Option<String>,
    pub related_id: Option<String>,
    pub avatar: Option<String>,
    pub read: bool,
    pub dismissed: bool,
    pub action_taken: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

// ============================================================================
// COMMUNITY RECORD TYPES
// ============================================================================

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
    pub origin_community_id: Option<String>,
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

/// A community category record (channel grouping within a space)
#[derive(Debug, Clone)]
pub struct CommunityCategoryRecord {
    pub id: String,
    pub community_id: String,
    pub space_id: String,
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
    pub category_id: Option<String>,
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
    pub metadata_json: Option<String>,
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

// ============================================================================
// PHASE 2-11 RECORD TYPES (previously missing from WASM build)
// ============================================================================

/// A community read receipt record
#[derive(Debug, Clone)]
pub struct CommunityReadReceiptRecord {
    pub channel_id: String,
    pub member_did: String,
    pub last_read_message_id: String,
    pub read_at: i64,
}

/// A community pin record
#[derive(Debug, Clone)]
pub struct CommunityPinRecord {
    pub channel_id: String,
    pub message_id: String,
    pub pinned_by: String,
    pub pinned_at: i64,
}

/// A community file record
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

/// A community file folder record
#[derive(Debug, Clone)]
pub struct CommunityFileFolderRecord {
    pub id: String,
    pub channel_id: String,
    pub parent_folder_id: Option<String>,
    pub name: String,
    pub created_by: String,
    pub created_at: i64,
}

/// A community emoji record
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

/// A community sticker record
#[derive(Debug, Clone)]
pub struct CommunityStickerRecord {
    pub id: String,
    pub community_id: String,
    pub pack_id: Option<String>,
    pub name: String,
    pub image_url: String,
    pub animated: bool,
    pub format: String,
    pub uploaded_by: String,
    pub created_at: i64,
}

/// A sticker pack record
#[derive(Debug, Clone)]
pub struct CommunityStickerPackRecord {
    pub id: String,
    pub community_id: String,
    pub name: String,
    pub description: Option<String>,
    pub cover_sticker_id: Option<String>,
    pub created_by: String,
    pub created_at: i64,
}

/// A community webhook record
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

/// A channel key record (E2EE)
#[derive(Debug, Clone)]
pub struct ChannelKeyRecord {
    pub channel_id: String,
    pub key_version: i32,
    pub encrypted_key: Vec<u8>,
    pub created_at: i64,
}

/// A community deleted message record
#[derive(Debug, Clone)]
pub struct CommunityDeletedMessageRecord {
    pub message_id: String,
    pub member_did: String,
    pub deleted_at: i64,
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

/// A community thread follower record
#[derive(Debug, Clone)]
pub struct CommunityThreadFollowerRecord {
    pub thread_id: String,
    pub member_did: String,
    pub followed_at: i64,
}

/// A community member status record
#[derive(Debug, Clone)]
pub struct CommunityMemberStatusRecord {
    pub community_id: String,
    pub member_did: String,
    pub status_text: Option<String>,
    pub status_emoji: Option<String>,
    pub expires_at: Option<i64>,
    pub updated_at: i64,
}

/// A community notification setting record
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

/// A community seat record (ghost member placeholder from platform import)
#[derive(Debug, Clone)]
pub struct CommunitySeatRecord {
    pub id: String,
    pub community_id: String,
    pub platform: String,
    pub platform_user_id: String,
    pub platform_username: String,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub role_ids_json: String,
    pub claimed_by_did: Option<String>,
    pub claimed_at: Option<i64>,
    pub created_at: i64,
}
