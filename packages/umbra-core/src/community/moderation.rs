//! # Moderation System
//!
//! Warnings, timeouts, AutoMod keyword filtering, and audit log extensions.

use crate::error::{Error, Result};
use crate::storage::CommunityWarningRecord;
use super::service::generate_id;

/// Default warning thresholds for auto-escalation.
pub const DEFAULT_TIMEOUT_THRESHOLD: i32 = 3;
pub const DEFAULT_BAN_THRESHOLD: i32 = 5;

impl super::CommunityService {
    // ── Warnings ────────────────────────────────────────────────────────

    /// Issue a warning to a member.
    pub fn warn_member(
        &self,
        community_id: &str,
        member_did: &str,
        reason: &str,
        warned_by: &str,
        expires_at: Option<i64>,
    ) -> Result<CommunityWarningRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        // Prevent warning the owner
        let community = self.get_community(community_id)?;
        if community.owner_did == member_did {
            return Err(Error::CannotModifyOwner);
        }

        self.db().create_community_warning(
            &id, community_id, member_did, reason, warned_by, expires_at, now,
        )?;

        // Audit log
        self.db().insert_audit_log(
            &generate_id(), community_id, warned_by, "member_warn",
            Some("member"), Some(member_did),
            Some(&serde_json::json!({"reason": reason}).to_string()),
            now,
        )?;

        Ok(CommunityWarningRecord {
            id,
            community_id: community_id.to_string(),
            member_did: member_did.to_string(),
            reason: reason.to_string(),
            warned_by: warned_by.to_string(),
            expires_at,
            created_at: now,
        })
    }

    /// Get warnings for a specific member.
    pub fn get_member_warnings(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Vec<CommunityWarningRecord>> {
        self.db().get_community_member_warnings(community_id, member_did)
    }

    /// Get all warnings for a community (paginated).
    pub fn get_all_warnings(
        &self,
        community_id: &str,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CommunityWarningRecord>> {
        self.db().get_community_warnings(community_id, limit, offset)
    }

    /// Get the count of active (non-expired) warnings for a member.
    pub fn get_active_warning_count(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<i32> {
        let now = crate::time::now_timestamp();
        self.db().get_active_warning_count(community_id, member_did, now)
    }

    /// Delete a warning.
    pub fn delete_warning(&self, warning_id: &str, actor_did: &str) -> Result<()> {
        self.db().delete_community_warning(warning_id)?;

        // We don't know community_id from just warning_id, so skip audit log here
        let _ = actor_did; // acknowledged
        Ok(())
    }

    /// Check if a member has exceeded warning thresholds and return recommended action.
    ///
    /// Returns: None (no action), Some("timeout") if >= timeout_threshold,
    /// Some("ban") if >= ban_threshold.
    pub fn check_warning_escalation(
        &self,
        community_id: &str,
        member_did: &str,
        timeout_threshold: Option<i32>,
        ban_threshold: Option<i32>,
    ) -> Result<Option<&'static str>> {
        let count = self.get_active_warning_count(community_id, member_did)?;
        let ban_thresh = ban_threshold.unwrap_or(DEFAULT_BAN_THRESHOLD);
        let timeout_thresh = timeout_threshold.unwrap_or(DEFAULT_TIMEOUT_THRESHOLD);

        if count >= ban_thresh {
            Ok(Some("ban"))
        } else if count >= timeout_thresh {
            Ok(Some("timeout"))
        } else {
            Ok(None)
        }
    }

    // ── Keyword Filter (AutoMod) ────────────────────────────────────────

    /// Check if a message content matches any keyword filter patterns.
    ///
    /// `filters` is a list of (pattern, action) tuples where action is
    /// "delete", "warn", or "timeout".
    ///
    /// Returns the action to take, or None if no match.
    pub fn check_keyword_filter(
        &self,
        content: &str,
        filters: &[(&str, &str)],
    ) -> Option<String> {
        let content_lower = content.to_lowercase();
        for (pattern, action) in filters {
            let pattern_lower = pattern.to_lowercase();
            if pattern_lower.contains('*') {
                // Wildcard matching: convert to simple prefix/suffix check
                let parts: Vec<&str> = pattern_lower.split('*').collect();
                let matches = if parts.len() == 2 {
                    let prefix = parts[0];
                    let suffix = parts[1];
                    (prefix.is_empty() || content_lower.starts_with(prefix))
                        && (suffix.is_empty() || content_lower.ends_with(suffix))
                } else {
                    content_lower.contains(&pattern_lower.replace('*', ""))
                };
                if matches {
                    return Some(action.to_string());
                }
            } else {
                // Exact substring match
                if content_lower.contains(&pattern_lower) {
                    return Some(action.to_string());
                }
            }
        }
        None
    }

    // ── Timeouts ─────────────────────────────────────────────────────────

    /// Timeout a member (mute or restrict).
    #[allow(clippy::too_many_arguments)]
    pub fn timeout_member(
        &self,
        community_id: &str,
        member_did: &str,
        reason: Option<&str>,
        timeout_type: &str,
        duration_seconds: i64,
        issued_by: &str,
    ) -> Result<crate::storage::CommunityTimeoutRecord> {
        // Validate timeout_type
        if timeout_type != "mute" && timeout_type != "restrict" {
            return Err(Error::InvalidCommunityOperation(
                "timeout_type must be 'mute' or 'restrict'".to_string(),
            ));
        }

        let community = self.get_community(community_id)?;
        if community.owner_did == member_did {
            return Err(Error::CannotModifyOwner);
        }

        let now = crate::time::now_timestamp();
        let id = generate_id();
        let expires_at = now + duration_seconds;

        self.db().create_community_timeout(
            &id, community_id, member_did, reason, timeout_type, issued_by, expires_at, now,
        )?;

        self.db().insert_audit_log(
            &generate_id(), community_id, issued_by, "member_timeout",
            Some("member"), Some(member_did),
            Some(&serde_json::json!({"reason": reason, "type": timeout_type, "duration_seconds": duration_seconds}).to_string()),
            now,
        )?;

        Ok(crate::storage::CommunityTimeoutRecord {
            id,
            community_id: community_id.to_string(),
            member_did: member_did.to_string(),
            reason: reason.map(|s| s.to_string()),
            timeout_type: timeout_type.to_string(),
            issued_by: issued_by.to_string(),
            expires_at,
            created_at: now,
        })
    }

    /// Remove a timeout early.
    pub fn remove_timeout(&self, timeout_id: &str, actor_did: &str) -> Result<()> {
        self.db().remove_community_timeout(timeout_id)?;
        let _ = actor_did; // acknowledged — would need timeout record for full audit log
        Ok(())
    }

    /// Get active timeouts for a member.
    pub fn get_active_timeouts(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Vec<crate::storage::CommunityTimeoutRecord>> {
        let now = crate::time::now_timestamp();
        self.db().get_active_timeouts(community_id, member_did, now)
    }

    /// Get all timeouts for a community (active and expired).
    pub fn get_community_timeouts(
        &self,
        community_id: &str,
    ) -> Result<Vec<crate::storage::CommunityTimeoutRecord>> {
        self.db().get_community_timeouts(community_id)
    }

    /// Check if a member is currently muted (has active 'mute' timeout).
    pub fn is_member_muted(&self, community_id: &str, member_did: &str) -> Result<bool> {
        let now = crate::time::now_timestamp();
        self.db().is_member_timed_out(community_id, member_did, "mute", now)
    }

    // ── Ban Evasion Detection ───────────────────────────────────────────

    /// Check if a device fingerprint matches any banned member's fingerprint.
    /// Returns the banned DID if a match is found.
    pub fn check_ban_evasion(
        &self,
        community_id: &str,
        device_fingerprint: &str,
    ) -> Result<Option<String>> {
        let bans = self.get_bans(community_id)?;
        for ban in &bans {
            if let Some(ref fp) = ban.device_fingerprint {
                if fp == device_fingerprint {
                    return Ok(Some(ban.banned_did.clone()));
                }
            }
        }
        Ok(None)
    }
}
