//! Lightweight SQLite persistence for CLI identity data.
//!
//! Stores the user's recovery phrase and metadata in a single-row table
//! at `~/.umbra/cli.db`. On startup the app can restore the identity
//! from the stored phrase and skip the onboarding flow.

use std::path::{Path, PathBuf};
use rusqlite::{Connection, params, OptionalExtension};

// ── Types ──────────────────────────────────────────────────────────────

/// A friend stored in the database.
#[allow(dead_code)]
pub struct StoredFriend {
    pub did: String,
    pub display_name: String,
    pub username: Option<String>,
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
}

/// A blocked user stored in the database.
#[allow(dead_code)]
pub struct StoredBlockedUser {
    pub did: String,
    pub display_name: Option<String>,
    pub username: Option<String>,
}

/// All identity fields stored in the database.
#[allow(dead_code)]
pub struct StoredIdentity {
    pub recovery_phrase: String,
    pub display_name: String,
    pub did: String,
    pub created_at: i64,
    pub username: Option<String>,
    pub linked_platform: Option<String>,
    pub linked_username: Option<String>,
    pub discoverable: bool,
}

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
                    added_at INTEGER NOT NULL
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
                );",
            )
            .map_err(|e| format!("Migration failed: {e}"))
    }

    /// Load the stored identity, if one exists.
    pub fn load_identity(&self) -> Result<Option<StoredIdentity>, String> {
        self.conn
            .query_row(
                "SELECT recovery_phrase, display_name, did, created_at,
                        username, linked_platform, linked_username, discoverable
                 FROM identity WHERE id = 1",
                [],
                |row| {
                    Ok(StoredIdentity {
                        recovery_phrase: row.get(0)?,
                        display_name: row.get(1)?,
                        did: row.get(2)?,
                        created_at: row.get(3)?,
                        username: row.get(4)?,
                        linked_platform: row.get(5)?,
                        linked_username: row.get(6)?,
                        discoverable: row.get::<_, i32>(7)? != 0,
                    })
                },
            )
            .optional()
            .map_err(|e| format!("Failed to load identity: {e}"))
    }

    /// Save a new identity after onboarding.
    pub fn save_identity(
        &self,
        recovery_phrase: &str,
        display_name: &str,
        did: &str,
        created_at: i64,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "INSERT OR REPLACE INTO identity
                    (id, recovery_phrase, display_name, did, created_at)
                 VALUES (1, ?1, ?2, ?3, ?4)",
                params![recovery_phrase, display_name, did, created_at],
            )
            .map_err(|e| format!("Failed to save identity: {e}"))?;
        Ok(())
    }

    /// Update the username after registration.
    pub fn update_username(&self, username: &str) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE identity SET username = ?1 WHERE id = 1",
                params![username],
            )
            .map_err(|e| format!("Failed to update username: {e}"))?;
        Ok(())
    }

    /// Update the linked platform account after OAuth import.
    pub fn update_linked_account(
        &self,
        platform: &str,
        username: &str,
    ) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE identity SET linked_platform = ?1, linked_username = ?2 WHERE id = 1",
                params![platform, username],
            )
            .map_err(|e| format!("Failed to update linked account: {e}"))?;
        Ok(())
    }

    /// Update the discoverable setting.
    pub fn update_discoverable(&self, discoverable: bool) -> Result<(), String> {
        self.conn
            .execute(
                "UPDATE identity SET discoverable = ?1 WHERE id = 1",
                params![discoverable as i32],
            )
            .map_err(|e| format!("Failed to update discovery setting: {e}"))?;
        Ok(())
    }

    /// Delete the stored identity (for future "log out" / reset).
    #[allow(dead_code)]
    pub fn clear_identity(&self) -> Result<(), String> {
        self.conn
            .execute("DELETE FROM identity WHERE id = 1", [])
            .map_err(|e| format!("Failed to clear identity: {e}"))?;
        Ok(())
    }

    // ── Friends ─────────────────────────────────────────────────────────

    /// Load all friends, ordered by most recently added first.
    pub fn load_friends(&self) -> Result<Vec<StoredFriend>, String> {
        let mut stmt = self
            .conn
            .prepare("SELECT did, display_name, username FROM friends ORDER BY added_at DESC")
            .map_err(|e| format!("Failed to prepare query: {e}"))?;

        let friends = stmt
            .query_map([], |row| {
                Ok(StoredFriend {
                    did: row.get(0)?,
                    display_name: row.get(1)?,
                    username: row.get(2)?,
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

    /// Load friend requests by direction ("incoming" or "outgoing").
    pub fn load_friend_requests(&self, direction: &str) -> Result<Vec<StoredFriendRequest>, String> {
        let mut stmt = self
            .conn
            .prepare(
                "SELECT id, did, display_name, username, direction, status, created_at
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
