use rusqlite::{params, OptionalExtension};
use super::Db;

// ── Types ──────────────────────────────────────────────────────────────

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

// ── Identity ─────────────────────────────────────────────────────────

impl Db {
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
}
