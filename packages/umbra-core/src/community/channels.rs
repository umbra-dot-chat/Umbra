//! # Channel Management
//!
//! Channel CRUD within spaces. Supports text, voice, files,
//! announcement, bulletin, and welcome channel types.

use crate::error::{Error, Result};
use crate::storage::CommunityChannelRecord;
use super::service::generate_id;

/// Valid channel types.
pub const CHANNEL_TYPES: &[&str] = &["text", "voice", "files", "announcement", "bulletin", "welcome"];

impl super::CommunityService {
    /// Create a new channel in a space.
    pub fn create_channel(
        &self,
        community_id: &str,
        space_id: &str,
        name: &str,
        channel_type: &str,
        topic: Option<&str>,
        position: i32,
        actor_did: &str,
    ) -> Result<CommunityChannelRecord> {
        if !CHANNEL_TYPES.contains(&channel_type) {
            return Err(Error::InvalidCommunityOperation(
                format!("Invalid channel type: {}", channel_type),
            ));
        }

        let now = crate::time::now_timestamp();
        let channel_id = generate_id();

        self.db().create_community_channel(
            &channel_id,
            community_id,
            space_id,
            name,
            channel_type,
            topic,
            position,
            now,
        )?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "channel_create",
            Some("channel"),
            Some(&channel_id),
            None,
            now,
        )?;

        Ok(CommunityChannelRecord {
            id: channel_id,
            community_id: community_id.to_string(),
            space_id: space_id.to_string(),
            name: name.to_string(),
            channel_type: channel_type.to_string(),
            topic: topic.map(|s| s.to_string()),
            position,
            slow_mode_seconds: 0,
            e2ee_enabled: false,
            pin_limit: 50,
            created_at: now,
            updated_at: now,
        })
    }

    /// Get all channels in a space.
    pub fn get_channels(&self, space_id: &str) -> Result<Vec<CommunityChannelRecord>> {
        self.db().get_community_channels_by_space(space_id)
    }

    /// Get all channels in a community (across all spaces).
    pub fn get_all_channels(&self, community_id: &str) -> Result<Vec<CommunityChannelRecord>> {
        self.db().get_community_channels(community_id)
    }

    /// Get a single channel by ID.
    pub fn get_channel(&self, channel_id: &str) -> Result<CommunityChannelRecord> {
        self.db().get_community_channel(channel_id)?
            .ok_or(Error::ChannelNotFound)
    }

    /// Update a channel's name and/or topic.
    pub fn update_channel(
        &self,
        channel_id: &str,
        name: Option<&str>,
        topic: Option<&str>,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        let channel = self.get_channel(channel_id)?;

        self.db().update_community_channel(channel_id, name, topic, now)?;

        self.db().insert_audit_log(
            &generate_id(),
            &channel.community_id,
            actor_did,
            "channel_update",
            Some("channel"),
            Some(channel_id),
            None,
            now,
        )?;

        Ok(())
    }

    /// Set slow mode for a channel (seconds between messages per user, 0 = off).
    pub fn set_slow_mode(
        &self,
        channel_id: &str,
        seconds: i32,
        _actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_channel_slow_mode(channel_id, seconds, now)
    }

    /// Toggle E2EE for a channel.
    pub fn set_channel_e2ee(
        &self,
        channel_id: &str,
        enabled: bool,
        _actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_channel_e2ee(channel_id, enabled, now)
    }

    /// Delete a channel.
    pub fn delete_channel(
        &self,
        channel_id: &str,
        actor_did: &str,
    ) -> Result<()> {
        let channel = self.get_channel(channel_id)?;
        let now = crate::time::now_timestamp();

        self.db().delete_community_channel(channel_id)?;

        self.db().insert_audit_log(
            &generate_id(),
            &channel.community_id,
            actor_did,
            "channel_delete",
            Some("channel"),
            Some(channel_id),
            None,
            now,
        )?;

        Ok(())
    }

    /// Reorder channels within a space.
    pub fn reorder_channels(
        &self,
        _space_id: &str,
        channel_ids: &[String],
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        for (position, channel_id) in channel_ids.iter().enumerate() {
            self.db().update_channel_position(channel_id, position as i32, now)?;
        }
        Ok(())
    }
}
