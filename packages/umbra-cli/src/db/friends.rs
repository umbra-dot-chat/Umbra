use rusqlite::params;
use super::Db;

// ── Types ──────────────────────────────────────────────────────────────

/// A friend stored in the database.
#[allow(dead_code)]
pub struct StoredFriend {
    pub did: String,
    pub display_name: String,
    pub username: Option<String>,
    pub encryption_key: Option<String>,
    pub signing_key: Option<String>,
}

/// A friend request stored in the database.
#[allow(dead_code)]
pub struct StoredFriendRequest {
    pub id: String,
    pub did: String,
    pub display_name: String,
    pub username: Option<String>,
    pub direction: String,
    pub status: String,
    pub created_at: i64,
    pub encryption_key: Option<String>,
    pub signing_key: Option<String>,
}

/// A blocked user stored in the database.
#[allow(dead_code)]
pub struct StoredBlockedUser {
    pub did: String,
    pub display_name: Option<String>,
    pub username: Option<String>,
}

// ── Friends ─────────────────────────────────────────────────────────

impl Db {
    /// Load all friends, ordered by most recently added first.
    pub fn load_friends(&self) -> Result<Vec<StoredFriend>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT did, display_name, username, encryption_key, signing_key
                 FROM friends ORDER BY added_at DESC",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let friends = stmt
            .query_map([], |row| {
                Ok(StoredFriend {
                    did: row.get(0)?,
                    display_name: row.get(1)?,
                    username: row.get(2)?,
                    encryption_key: row.get(3)?,
                    signing_key: row.get(4)?,
                })
            })
            .map_err(|e| format!("Failed to load friends: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(friends)
    }

    /// Save a friend. Ignores duplicates (INSERT OR IGNORE).
    pub fn save_friend(
        &self,
        did: &str,
        display_name: &str,
        username: Option<&str>,
    ) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn
            .execute(
                "INSERT OR IGNORE INTO friends (did, display_name, username, added_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![did, display_name, username, now],
            )
            .map_err(|e| format!("Failed to save friend: {e}"))?;
        Ok(())
    }

    /// Save a friend with encryption and signing keys.
    pub fn save_friend_with_keys(
        &self,
        did: &str,
        display_name: &str,
        username: Option<&str>,
        encryption_key: Option<&str>,
        signing_key: Option<&str>,
    ) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn
            .execute(
                "INSERT OR IGNORE INTO friends (did, display_name, username, added_at, encryption_key, signing_key)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![did, display_name, username, now, encryption_key, signing_key],
            )
            .map_err(|e| format!("Failed to save friend: {e}"))?;
        Ok(())
    }

    /// Remove a friend by DID.
    pub fn remove_friend(&self, did: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM friends WHERE did = ?1", params![did])
            .map_err(|e| format!("Failed to remove friend: {e}"))?;
        Ok(())
    }

    // ── Friend Requests ──────────────────────────────────────────────────

    /// Save a friend request.
    pub fn save_friend_request(
        &self,
        id: &str,
        did: &str,
        display_name: &str,
        username: Option<&str>,
        direction: &str,
    ) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn
            .execute(
                "INSERT OR IGNORE INTO friend_requests (id, did, display_name, username, direction, status, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6)",
                params![id, did, display_name, username, direction, now],
            )
            .map_err(|e| format!("Failed to save friend request: {e}"))?;
        Ok(())
    }

    /// Save a friend request with encryption and signing keys.
    pub fn save_friend_request_with_keys(
        &self,
        id: &str,
        did: &str,
        display_name: &str,
        username: Option<&str>,
        direction: &str,
        encryption_key: Option<&str>,
        signing_key: Option<&str>,
    ) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn
            .execute(
                "INSERT OR IGNORE INTO friend_requests (id, did, display_name, username, direction, status, created_at, encryption_key, signing_key)
                 VALUES (?1, ?2, ?3, ?4, ?5, 'pending', ?6, ?7, ?8)",
                params![id, did, display_name, username, direction, now, encryption_key, signing_key],
            )
            .map_err(|e| format!("Failed to save friend request: {e}"))?;
        Ok(())
    }

    /// Load friend requests by direction ("incoming" or "outgoing").
    pub fn load_friend_requests(&self, direction: &str) -> Result<Vec<StoredFriendRequest>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, did, display_name, username, direction, status, created_at, encryption_key, signing_key
                 FROM friend_requests WHERE direction = ?1 AND status = 'pending'
                 ORDER BY created_at DESC",
            )
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let requests = stmt
            .query_map(params![direction], |row| {
                Ok(StoredFriendRequest {
                    id: row.get(0)?,
                    did: row.get(1)?,
                    display_name: row.get(2)?,
                    username: row.get(3)?,
                    direction: row.get(4)?,
                    status: row.get(5)?,
                    created_at: row.get(6)?,
                    encryption_key: row.get(7)?,
                    signing_key: row.get(8)?,
                })
            })
            .map_err(|e| format!("Failed to load friend requests: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(requests)
    }

    /// Delete a friend request by ID.
    pub fn delete_friend_request(&self, id: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM friend_requests WHERE id = ?1", params![id])
            .map_err(|e| format!("Failed to delete friend request: {e}"))?;
        Ok(())
    }

    /// Delete all pending friend requests for a DID (used when blocking).
    pub fn delete_requests_for_did(&self, did: &str) -> Result<(), String> {
        self.conn
            .execute(
                "DELETE FROM friend_requests WHERE did = ?1 AND status = 'pending'",
                params![did],
            )
            .map_err(|e| format!("Failed to delete requests for DID: {e}"))?;
        Ok(())
    }

    /// Check if there is already a pending request for a DID.
    pub fn has_pending_request(&self, did: &str) -> Result<bool, String> {
        let count: i32 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM friend_requests WHERE did = ?1 AND status = 'pending'",
                params![did],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to check pending request: {e}"))?;
        Ok(count > 0)
    }

    // ── Blocked Users ────────────────────────────────────────────────────

    /// Block a user.
    pub fn block_user(
        &self,
        did: &str,
        display_name: Option<&str>,
        username: Option<&str>,
    ) -> Result<(), String> {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        self.conn
            .execute(
                "INSERT OR REPLACE INTO blocked_users (did, display_name, username, blocked_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![did, display_name, username, now],
            )
            .map_err(|e| format!("Failed to block user: {e}"))?;

        // Also clean up any pending requests
        let _ = self.delete_requests_for_did(did);
        // Also remove from friends if present
        let _ = self.remove_friend(did);

        Ok(())
    }

    /// Unblock a user.
    pub fn unblock_user(&self, did: &str) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM blocked_users WHERE did = ?1", params![did])
            .map_err(|e| format!("Failed to unblock user: {e}"))?;
        Ok(())
    }

    /// Load all blocked users.
    pub fn load_blocked_users(&self) -> Result<Vec<StoredBlockedUser>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT did, display_name, username FROM blocked_users ORDER BY blocked_at DESC")
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let blocked = stmt
            .query_map([], |row| {
                Ok(StoredBlockedUser {
                    did: row.get(0)?,
                    display_name: row.get(1)?,
                    username: row.get(2)?,
                })
            })
            .map_err(|e| format!("Failed to load blocked users: {e}"))?
            .filter_map(|r| r.ok())
            .collect();

        Ok(blocked)
    }

    /// Check if a user is blocked.
    pub fn is_blocked(&self, did: &str) -> Result<bool, String> {
        let count: i32 = self
            .conn
            .query_row(
                "SELECT COUNT(*) FROM blocked_users WHERE did = ?1",
                params![did],
                |row| row.get(0),
            )
            .map_err(|e| format!("Failed to check blocked status: {e}"))?;
        Ok(count > 0)
    }
}
