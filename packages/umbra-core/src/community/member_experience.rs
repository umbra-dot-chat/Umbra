//! # Member Experience
//!
//! Custom status, notification settings, presence, and typing indicators.

use super::service::generate_id;
use crate::error::{Error, Result};
use crate::storage::{CommunityMemberStatusRecord, CommunityNotificationSettingRecord};

impl super::CommunityService {
    // ── Custom Status ───────────────────────────────────────────────────

    /// Set a custom status for a member in a community.
    pub fn set_member_status(
        &self,
        community_id: &str,
        member_did: &str,
        status_text: Option<&str>,
        status_emoji: Option<&str>,
        expires_at: Option<i64>,
    ) -> Result<CommunityMemberStatusRecord> {
        let now = crate::time::now_timestamp();
        self.db().set_member_status(
            community_id,
            member_did,
            status_text,
            status_emoji,
            expires_at,
            now,
        )?;

        Ok(CommunityMemberStatusRecord {
            community_id: community_id.to_string(),
            member_did: member_did.to_string(),
            status_text: status_text.map(|s| s.to_string()),
            status_emoji: status_emoji.map(|s| s.to_string()),
            expires_at,
            updated_at: now,
        })
    }

    /// Get a member's custom status.
    pub fn get_member_status(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Option<CommunityMemberStatusRecord>> {
        self.db().get_member_status(community_id, member_did)
    }

    /// Clear a member's custom status.
    pub fn clear_member_status(&self, community_id: &str, member_did: &str) -> Result<()> {
        self.db().clear_member_status(community_id, member_did)
    }

    // ── Notification Settings ───────────────────────────────────────────

    /// Set notification settings for a target (community, space, or channel).
    #[allow(clippy::too_many_arguments)]
    pub fn set_notification_settings(
        &self,
        community_id: &str,
        member_did: &str,
        target_type: &str,
        target_id: &str,
        mute_until: Option<i64>,
        suppress_everyone: bool,
        suppress_roles: bool,
        level: &str,
    ) -> Result<CommunityNotificationSettingRecord> {
        // Validate target_type
        if target_type != "community" && target_type != "space" && target_type != "channel" {
            return Err(Error::InvalidCommunityOperation(
                "target_type must be 'community', 'space', or 'channel'".to_string(),
            ));
        }
        // Validate level
        if level != "all" && level != "mentions" && level != "none" {
            return Err(Error::InvalidCommunityOperation(
                "level must be 'all', 'mentions', or 'none'".to_string(),
            ));
        }

        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().upsert_notification_setting(
            &id,
            community_id,
            member_did,
            target_type,
            target_id,
            mute_until,
            suppress_everyone,
            suppress_roles,
            level,
            now,
        )?;

        Ok(CommunityNotificationSettingRecord {
            id,
            community_id: community_id.to_string(),
            member_did: member_did.to_string(),
            target_type: target_type.to_string(),
            target_id: target_id.to_string(),
            mute_until,
            suppress_everyone,
            suppress_roles,
            level: level.to_string(),
            updated_at: now,
        })
    }

    /// Get all notification settings for a member in a community.
    pub fn get_notification_settings(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Vec<CommunityNotificationSettingRecord>> {
        self.db()
            .get_notification_settings(community_id, member_did)
    }

    /// Delete a notification setting.
    pub fn delete_notification_setting(&self, setting_id: &str) -> Result<()> {
        self.db().delete_notification_setting(setting_id)
    }
}
