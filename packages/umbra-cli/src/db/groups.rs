//! Group DM persistence — groups, members, and group messages.

use rusqlite::params;
use super::Db;

// ── Types ──────────────────────────────────────────────────────────────

/// A group stored in the database.
#[allow(dead_code)]
pub struct StoredGroup {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_by: String,
    pub created_at: i64,
}

/// A group member stored in the database.
#[allow(dead_code)]
pub struct StoredGroupMember {
    pub group_id: String,
    pub did: String,
    pub display_name: Option<String>,
    pub joined_at: i64,
}

/// A group message stored in the database.
#[allow(dead_code)]
pub struct StoredGroupMessage {
    pub id: String,
    pub group_id: String,
    pub sender_did: String,
    pub content: String,
    pub timestamp: i64,
    pub edited_at: Option<i64>,
    pub deleted: bool,
}

// ── Group CRUD ─────────────────────────────────────────────────────────

impl Db {
    /// Save a new group.
    pub fn save_group(
        &self,
        id: &str,
        name: &str,
        description: Option<&str>,
        created_by: &str,
        created_at: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO groups (id, name, description, created_by, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, name, description, created_by, created_at],
            )
            .map_err(|e| format!("Failed to save group: {e}"))?;
        Ok(())
    }

    /// Load all groups.
    pub fn load_groups(&self) -> Result<Vec<StoredGroup>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, name, description, created_by, created_at
                 FROM groups ORDER BY created_at DESC",
            )
            .map_err(|e| format!("Failed to prepare groups query: {e}"))?;

        let groups = stmt
            .query_map([], |row| {
                Ok(StoredGroup {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    created_by: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| format!("Failed to load groups: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(groups)
    }

    /// Load a single group by ID.
    #[allow(dead_code)]
    pub fn load_group(&self, id: &str) -> Result<Option<StoredGroup>, String> {
        let result = self
            .conn
            .query_row(
                "SELECT id, name, description, created_by, created_at
                 FROM groups WHERE id = ?1",
                params![id],
                |row| {
                    Ok(StoredGroup {
                        id: row.get(0)?,
                        name: row.get(1)?,
                        description: row.get(2)?,
                        created_by: row.get(3)?,
                        created_at: row.get(4)?,
                    })
                },
            );

        match result {
            Ok(group) => Ok(Some(group)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(format!("Failed to load group: {e}")),
        }
    }

    /// Delete a group and its members/messages.
    #[allow(dead_code)]
    pub fn delete_group(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM group_messages WHERE group_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete group messages: {e}"))?;
        self.conn
            .execute("DELETE FROM group_members WHERE group_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete group members: {e}"))?;
        self.conn
            .execute("DELETE FROM groups WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete group: {e}"))?;
        Ok(())
    }

    /// Update a group's name.
    #[allow(dead_code)]
    pub fn update_group_name(&self, id: &str, name: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE groups SET name = ?1 WHERE id = ?2",
                params![name, id],
            )
            .map_err(|e| format!("Failed to update group name: {e}"))?;
        Ok(())
    }

    // ── Group Members ──────────────────────────────────────────────────

    /// Add a member to a group.
    pub fn add_group_member(
        &self,
        group_id: &str,
        did: &str,
        display_name: Option<&str>,
        joined_at: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO group_members (group_id, did, display_name, joined_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![group_id, did, display_name, joined_at],
            )
            .map_err(|e| format!("Failed to add group member: {e}"))?;
        Ok(())
    }

    /// Remove a member from a group.
    pub fn remove_group_member(&self, group_id: &str, did: &str) -> Result<(), String> {
        self.conn
            .execute(
                "DELETE FROM group_members WHERE group_id = ?1 AND did = ?2",
                params![group_id, did],
            )
            .map_err(|e| format!("Failed to remove group member: {e}"))?;
        Ok(())
    }

    /// Load all members of a group.
    pub fn load_group_members(&self, group_id: &str) -> Result<Vec<StoredGroupMember>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT group_id, did, display_name, joined_at
                 FROM group_members WHERE group_id = ?1
                 ORDER BY joined_at ASC",
            )
            .map_err(|e| format!("Failed to prepare members query: {e}"))?;

        let members = stmt
            .query_map(params![group_id], |row| {
                Ok(StoredGroupMember {
                    group_id: row.get(0)?,
                    did: row.get(1)?,
                    display_name: row.get(2)?,
                    joined_at: row.get(3)?,
                })
            })
            .map_err(|e| format!("Failed to load group members: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(members)
    }

    /// Check if a DID is a member of a group.
    pub fn is_group_member(&self, group_id: &str, did: &str) -> Result<bool, String> {
        let count: i32 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM group_members WHERE group_id = ?1 AND did = ?2",
                params![group_id, did],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to check membership: {e}"))?;
        Ok(count > 0)
    }

    // ── Group Messages ─────────────────────────────────────────────────

    /// Save a group message.
    pub fn save_group_message(
        &self,
        id: &str,
        group_id: &str,
        sender_did: &str,
        content: &str,
        timestamp: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO group_messages
                    (id, group_id, sender_did, content, timestamp)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![id, group_id, sender_did, content, timestamp],
            )
            .map_err(|e| format!("Failed to save group message: {e}"))?;
        Ok(())
    }

    /// Load messages for a group, most recent last, limited to `limit`.
    pub fn load_group_messages(
        &self,
        group_id: &str,
        limit: usize,
    ) -> Result<Vec<StoredGroupMessage>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, group_id, sender_did, content, timestamp,
                        edited_at, deleted
                 FROM group_messages WHERE group_id = ?1
                 ORDER BY timestamp ASC
                 LIMIT ?2",
            )
            .map_err(|e| format!("Failed to prepare group messages query: {e}"))?;

        let messages = stmt
            .query_map(params![group_id, limit as i64], |row| {
                Ok(StoredGroupMessage {
                    id: row.get(0)?,
                    group_id: row.get(1)?,
                    sender_did: row.get(2)?,
                    content: row.get(3)?,
                    timestamp: row.get(4)?,
                    edited_at: row.get(5)?,
                    deleted: row.get::<_, i32>(6).unwrap_or(0) != 0,
                })
            })
            .map_err(|e| format!("Failed to load group messages: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(messages)
    }

    /// Update a group message's content.
    pub fn update_group_message_content(
        &self,
        id: &str,
        content: &str,
        edited_at: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE group_messages SET content = ?1, edited_at = ?2 WHERE id = ?3",
                params![content, edited_at, id],
            )
            .map_err(|e| format!("Failed to update group message: {e}"))?;
        Ok(())
    }

    /// Soft-delete a group message.
    pub fn soft_delete_group_message(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE group_messages SET deleted = 1 WHERE id = ?1",
                params![id],
            )
            .map_err(|e| format!("Failed to soft-delete group message: {e}"))?;
        Ok(())
    }

    /// Get the timestamp of the most recent message in a group.
    pub fn group_last_message_at(&self, group_id: &str) -> Option<i64> {
        self.conn
            .query_row(
                "SELECT MAX(timestamp) FROM group_messages WHERE group_id = ?1 AND deleted = 0",
                params![group_id],
                |row| row.get(0),
            )
            .ok()
            .flatten()
    }
}
