//! Community persistence — communities, spaces, categories, channels, members, roles.

use rusqlite::params;
use crate::db::Db;

// ── Stored types ────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct StoredCommunity {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_by: String,
    pub created_at: i64,
}

#[derive(Debug, Clone)]
pub struct StoredSpace {
    pub id: String,
    pub community_id: String,
    pub name: String,
    pub position: i32,
}

#[derive(Debug, Clone)]
pub struct StoredCategory {
    pub id: String,
    pub space_id: String,
    pub name: String,
    pub position: i32,
}

#[derive(Debug, Clone)]
pub struct StoredChannel {
    pub id: String,
    pub category_id: String,
    pub community_id: String,
    pub name: String,
    pub channel_type: String,
    pub position: i32,
}

#[derive(Debug, Clone)]
pub struct StoredCommunityMember {
    pub community_id: String,
    pub did: String,
    pub display_name: Option<String>,
    pub joined_at: i64,
}

#[derive(Debug, Clone)]
pub struct StoredCommunityRole {
    pub id: String,
    pub community_id: String,
    pub name: String,
    pub permissions: i64,
    pub position: i32,
    pub color: Option<String>,
}

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct StoredMemberRole {
    pub community_id: String,
    pub did: String,
    pub role_id: String,
}

#[derive(Debug, Clone)]
pub struct StoredCommunityInvite {
    pub id: String,
    pub community_id: String,
    pub code: String,
    pub creator_did: String,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub expires_at: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Clone)]
pub struct StoredCommunityMessage {
    pub id: String,
    pub channel_id: String,
    pub sender_did: String,
    pub content: String,
    pub timestamp: i64,
    pub edited_at: Option<i64>,
    pub deleted: bool,
}

// ── Implementation ──────────────────────────────────────────────────────

#[allow(dead_code)]
impl Db {
    // ── Community CRUD ──────────────────────────────────────────────────

    pub fn save_community(&self, community: &StoredCommunity) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO communities (id, name, description, created_by, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![
                    community.id,
                    community.name,
                    community.description,
                    community.created_by,
                    community.created_at,
                ],
            )
            .map_err(|e| format!("Failed to save community: {e}"))?;
        Ok(())
    }

    pub fn load_communities(&self) -> Result<Vec<StoredCommunity>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, description, created_by, created_at FROM communities ORDER BY created_at DESC")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map([], |row| {
                Ok(StoredCommunity {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    created_by: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn load_community(&self, id: &str) -> Result<Option<StoredCommunity>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, name, description, created_by, created_at FROM communities WHERE id = ?1")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let mut rows = stmt
            .query_map(params![id], |row| {
                Ok(StoredCommunity {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    created_by: row.get(3)?,
                    created_at: row.get(4)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        match rows.next() {
            Some(Ok(c)) => Ok(Some(c)),
            _ => Ok(None),
        }
    }

    pub fn delete_community(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM community_messages WHERE channel_id IN (SELECT id FROM community_channels WHERE community_id = ?1)", params![id])
            .map_err(|e| format!("Failed to delete messages: {e}"))?;
        self.conn
            .execute("DELETE FROM community_channels WHERE community_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete channels: {e}"))?;
        self.conn
            .execute("DELETE FROM community_categories WHERE space_id IN (SELECT id FROM community_spaces WHERE community_id = ?1)", params![id])
            .map_err(|e| format!("Failed to delete categories: {e}"))?;
        self.conn
            .execute("DELETE FROM community_spaces WHERE community_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete spaces: {e}"))?;
        self.conn
            .execute("DELETE FROM member_roles WHERE community_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete member roles: {e}"))?;
        self.conn
            .execute("DELETE FROM community_roles WHERE community_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete roles: {e}"))?;
        self.conn
            .execute("DELETE FROM community_members WHERE community_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete members: {e}"))?;
        self.conn
            .execute("DELETE FROM communities WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete community: {e}"))?;
        Ok(())
    }

    pub fn update_community_name(&self, id: &str, name: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE communities SET name = ?2 WHERE id = ?1",
                params![id, name],
            )
            .map_err(|e| format!("Failed to update community name: {e}"))?;
        Ok(())
    }

    // ── Spaces ──────────────────────────────────────────────────────────

    pub fn save_space(&self, space: &StoredSpace) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_spaces (id, community_id, name, position)
                 VALUES (?1, ?2, ?3, ?4)",
                params![space.id, space.community_id, space.name, space.position],
            )
            .map_err(|e| format!("Failed to save space: {e}"))?;
        Ok(())
    }

    pub fn load_spaces(&self, community_id: &str) -> Result<Vec<StoredSpace>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, community_id, name, position FROM community_spaces WHERE community_id = ?1 ORDER BY position")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![community_id], |row| {
                Ok(StoredSpace {
                    id: row.get(0)?,
                    community_id: row.get(1)?,
                    name: row.get(2)?,
                    position: row.get(3)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn delete_space(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM community_channels WHERE category_id IN (SELECT id FROM community_categories WHERE space_id = ?1)", params![id])
            .map_err(|e| format!("Failed to delete channels: {e}"))?;
        self.conn
            .execute("DELETE FROM community_categories WHERE space_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete categories: {e}"))?;
        self.conn
            .execute("DELETE FROM community_spaces WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete space: {e}"))?;
        Ok(())
    }

    // ── Categories ──────────────────────────────────────────────────────

    pub fn save_category(&self, cat: &StoredCategory) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_categories (id, space_id, name, position)
                 VALUES (?1, ?2, ?3, ?4)",
                params![cat.id, cat.space_id, cat.name, cat.position],
            )
            .map_err(|e| format!("Failed to save category: {e}"))?;
        Ok(())
    }

    pub fn load_categories(&self, space_id: &str) -> Result<Vec<StoredCategory>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, space_id, name, position FROM community_categories WHERE space_id = ?1 ORDER BY position")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![space_id], |row| {
                Ok(StoredCategory {
                    id: row.get(0)?,
                    space_id: row.get(1)?,
                    name: row.get(2)?,
                    position: row.get(3)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    // ── Channels ────────────────────────────────────────────────────────

    pub fn save_channel(&self, ch: &StoredChannel) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_channels (id, category_id, community_id, name, channel_type, position)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![ch.id, ch.category_id, ch.community_id, ch.name, ch.channel_type, ch.position],
            )
            .map_err(|e| format!("Failed to save channel: {e}"))?;
        Ok(())
    }

    pub fn load_channels(&self, community_id: &str) -> Result<Vec<StoredChannel>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, category_id, community_id, name, channel_type, position FROM community_channels WHERE community_id = ?1 ORDER BY position")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![community_id], |row| {
                Ok(StoredChannel {
                    id: row.get(0)?,
                    category_id: row.get(1)?,
                    community_id: row.get(2)?,
                    name: row.get(3)?,
                    channel_type: row.get(4)?,
                    position: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn load_channels_by_category(&self, category_id: &str) -> Result<Vec<StoredChannel>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, category_id, community_id, name, channel_type, position FROM community_channels WHERE category_id = ?1 ORDER BY position")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![category_id], |row| {
                Ok(StoredChannel {
                    id: row.get(0)?,
                    category_id: row.get(1)?,
                    community_id: row.get(2)?,
                    name: row.get(3)?,
                    channel_type: row.get(4)?,
                    position: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn delete_channel(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM community_messages WHERE channel_id = ?1", params![id])
            .map_err(|e| format!("Failed to delete messages: {e}"))?;
        self.conn
            .execute("DELETE FROM community_channels WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete channel: {e}"))?;
        Ok(())
    }

    // ── Members ─────────────────────────────────────────────────────────

    pub fn add_community_member(&self, member: &StoredCommunityMember) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_members (community_id, did, display_name, joined_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![member.community_id, member.did, member.display_name, member.joined_at],
            )
            .map_err(|e| format!("Failed to add member: {e}"))?;
        Ok(())
    }

    pub fn remove_community_member(&self, community_id: &str, did: &str) -> Result<(), String> {
        self.conn
            .execute(
                "DELETE FROM member_roles WHERE community_id = ?1 AND did = ?2",
                params![community_id, did],
            )
            .map_err(|e| format!("Failed to remove member roles: {e}"))?;
        self.conn
            .execute(
                "DELETE FROM community_members WHERE community_id = ?1 AND did = ?2",
                params![community_id, did],
            )
            .map_err(|e| format!("Failed to remove member: {e}"))?;
        Ok(())
    }

    pub fn load_community_members(&self, community_id: &str) -> Result<Vec<StoredCommunityMember>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT community_id, did, display_name, joined_at FROM community_members WHERE community_id = ?1 ORDER BY joined_at")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![community_id], |row| {
                Ok(StoredCommunityMember {
                    community_id: row.get(0)?,
                    did: row.get(1)?,
                    display_name: row.get(2)?,
                    joined_at: row.get(3)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn community_member_count(&self, community_id: &str) -> usize {
        self.conn
            .query_row(
                "SELECT COUNT(*) FROM community_members WHERE community_id = ?1",
                params![community_id],
                |row| row.get::<_, usize>(0),
            )
            .unwrap_or(0)
    }

    pub fn is_community_member(&self, community_id: &str, did: &str) -> bool {
        self.conn
            .query_row(
                "SELECT COUNT(*) FROM community_members WHERE community_id = ?1 AND did = ?2",
                params![community_id, did],
                |row| row.get::<_, usize>(0),
            )
            .unwrap_or(0)
            > 0
    }

    // ── Roles ───────────────────────────────────────────────────────────

    pub fn save_role(&self, role: &StoredCommunityRole) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_roles (id, community_id, name, permissions, position, color)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![role.id, role.community_id, role.name, role.permissions, role.position, role.color],
            )
            .map_err(|e| format!("Failed to save role: {e}"))?;
        Ok(())
    }

    pub fn load_roles(&self, community_id: &str) -> Result<Vec<StoredCommunityRole>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT id, community_id, name, permissions, position, color FROM community_roles WHERE community_id = ?1 ORDER BY position")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![community_id], |row| {
                Ok(StoredCommunityRole {
                    id: row.get(0)?,
                    community_id: row.get(1)?,
                    name: row.get(2)?,
                    permissions: row.get(3)?,
                    position: row.get(4)?,
                    color: row.get(5)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn assign_role(&self, community_id: &str, did: &str, role_id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR IGNORE INTO member_roles (community_id, did, role_id) VALUES (?1, ?2, ?3)",
                params![community_id, did, role_id],
            )
            .map_err(|e| format!("Failed to assign role: {e}"))?;
        Ok(())
    }

    pub fn remove_role_assignment(&self, community_id: &str, did: &str, role_id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "DELETE FROM member_roles WHERE community_id = ?1 AND did = ?2 AND role_id = ?3",
                params![community_id, did, role_id],
            )
            .map_err(|e| format!("Failed to remove role: {e}"))?;
        Ok(())
    }

    pub fn load_member_roles(&self, community_id: &str, did: &str) -> Result<Vec<String>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT role_id FROM member_roles WHERE community_id = ?1 AND did = ?2")
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![community_id, did], |row| row.get::<_, String>(0))
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    // ── Invites ─────────────────────────────────────────────────────────

    pub fn save_invite(&self, invite: &StoredCommunityInvite) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_invites (id, community_id, code, creator_did, max_uses, use_count, expires_at, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                params![
                    invite.id, invite.community_id, invite.code, invite.creator_did,
                    invite.max_uses, invite.use_count, invite.expires_at, invite.created_at,
                ],
            )
            .map_err(|e| format!("Failed to save invite: {e}"))?;
        Ok(())
    }

    pub fn load_invites(&self, community_id: &str) -> Result<Vec<StoredCommunityInvite>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, community_id, code, creator_did, max_uses, use_count, expires_at, created_at
                 FROM community_invites WHERE community_id = ?1 ORDER BY created_at DESC",
            )
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![community_id], |row| {
                Ok(StoredCommunityInvite {
                    id: row.get(0)?,
                    community_id: row.get(1)?,
                    code: row.get(2)?,
                    creator_did: row.get(3)?,
                    max_uses: row.get(4)?,
                    use_count: row.get(5)?,
                    expires_at: row.get(6)?,
                    created_at: row.get(7)?,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn delete_invite(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM community_invites WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete invite: {e}"))?;
        Ok(())
    }

    pub fn delete_invite_by_code(&self, code: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM community_invites WHERE code = ?1", params![code])
            .map_err(|e| format!("Failed to delete invite: {e}"))?;
        Ok(())
    }

    // ── Bans ────────────────────────────────────────────────────────────

    pub fn ban_member(&self, community_id: &str, did: &str, banned_by: &str, reason: Option<&str>) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        // Remove from members first
        let _ = self.remove_community_member(community_id, did);
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_bans (community_id, did, banned_by, reason, banned_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)",
                params![community_id, did, banned_by, reason, now],
            )
            .map_err(|e| format!("Failed to ban member: {e}"))?;
        Ok(())
    }

    pub fn unban_member(&self, community_id: &str, did: &str) -> Result<(), String> {
        self.conn
            .execute(
                "DELETE FROM community_bans WHERE community_id = ?1 AND did = ?2",
                params![community_id, did],
            )
            .map_err(|e| format!("Failed to unban member: {e}"))?;
        Ok(())
    }

    pub fn is_banned(&self, community_id: &str, did: &str) -> bool {
        self.conn
            .query_row(
                "SELECT COUNT(*) FROM community_bans WHERE community_id = ?1 AND did = ?2",
                params![community_id, did],
                |row| row.get::<_, usize>(0),
            )
            .unwrap_or(0)
            > 0
    }

    // ── Community messages ──────────────────────────────────────────────

    pub fn save_community_message(&self, msg: &StoredCommunityMessage) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO community_messages (id, channel_id, sender_did, content, timestamp, edited_at, deleted)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    msg.id,
                    msg.channel_id,
                    msg.sender_did,
                    msg.content,
                    msg.timestamp,
                    msg.edited_at,
                    msg.deleted as i32,
                ],
            )
            .map_err(|e| format!("Failed to save community message: {e}"))?;
        Ok(())
    }

    pub fn load_community_messages(&self, channel_id: &str, limit: usize) -> Result<Vec<StoredCommunityMessage>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, channel_id, sender_did, content, timestamp, edited_at, deleted
                 FROM community_messages
                 WHERE channel_id = ?1
                 ORDER BY timestamp ASC
                 LIMIT ?2",
            )
            .map_err(|e| format!("Failed to prepare: {e}"))?;

        let rows = stmt
            .query_map(params![channel_id, limit as i64], |row| {
                Ok(StoredCommunityMessage {
                    id: row.get(0)?,
                    channel_id: row.get(1)?,
                    sender_did: row.get(2)?,
                    content: row.get(3)?,
                    timestamp: row.get(4)?,
                    edited_at: row.get(5)?,
                    deleted: row.get::<_, i32>(6)? != 0,
                })
            })
            .map_err(|e| format!("Failed to query: {e}"))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("Row error: {e}"))?);
        }
        Ok(result)
    }

    pub fn update_community_message_content(&self, id: &str, content: &str, edited_at: i64) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE community_messages SET content = ?2, edited_at = ?3 WHERE id = ?1",
                params![id, content, edited_at],
            )
            .map_err(|e| format!("Failed to update message: {e}"))?;
        Ok(())
    }

    pub fn soft_delete_community_message(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE community_messages SET deleted = 1 WHERE id = ?1",
                params![id],
            )
            .map_err(|e| format!("Failed to delete message: {e}"))?;
        Ok(())
    }
}
