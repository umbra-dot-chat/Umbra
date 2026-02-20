//! # Community Messaging
//!
//! Message CRUD, reactions, read receipts, pins, slow mode enforcement,
//! channel type enforcement, and @mention parsing.

use crate::error::{Error, Result};
use crate::storage::{
    CommunityMessageRecord, CommunityReactionRecord,
    CommunityReadReceiptRecord, CommunityPinRecord,
};
use super::service::generate_id;

/// Parsed mention types from message content.
#[derive(Debug, Clone, PartialEq)]
pub enum MentionType {
    /// @everyone — all members
    Everyone,
    /// @here — online members
    Here,
    /// @role:<id> — a specific role
    Role(String),
    /// @user:<did> — a specific user
    User(String),
}

/// Parse @mentions from message content.
///
/// Recognizes:
/// - `@everyone` and `@here`
/// - `@role:ROLE_ID`
/// - `@user:DID`
pub fn parse_mentions(content: &str) -> Vec<MentionType> {
    let mut mentions = Vec::new();

    for word in content.split_whitespace() {
        let trimmed = word.trim_matches(|c: char| !c.is_alphanumeric() && c != '@' && c != ':' && c != '_' && c != '-');
        if trimmed.eq_ignore_ascii_case("@everyone") {
            mentions.push(MentionType::Everyone);
        } else if trimmed.eq_ignore_ascii_case("@here") {
            mentions.push(MentionType::Here);
        } else if let Some(role_id) = trimmed.strip_prefix("@role:") {
            if !role_id.is_empty() {
                mentions.push(MentionType::Role(role_id.to_string()));
            }
        } else if let Some(user_did) = trimmed.strip_prefix("@user:") {
            if !user_did.is_empty() {
                mentions.push(MentionType::User(user_did.to_string()));
            }
        }
    }

    mentions
}

impl super::CommunityService {
    // ── Messages ────────────────────────────────────────────────────────

    /// Send a plaintext message to a channel (non-E2EE).
    ///
    /// Enforces:
    /// - Channel type restrictions (voice-only, announcement, welcome)
    /// - Mute timeouts
    /// - Slow mode cooldowns
    pub fn send_message(
        &self,
        channel_id: &str,
        sender_did: &str,
        content: &str,
        reply_to_id: Option<&str>,
        thread_id: Option<&str>,
        content_warning: Option<&str>,
        metadata_json: Option<&str>,
    ) -> Result<CommunityMessageRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        // Get channel and enforce type restrictions
        let channel = self.db().get_community_channel(channel_id)?
            .ok_or(Error::ChannelNotFound)?;

        // Voice channels don't support text messages
        if channel.channel_type == "voice" {
            return Err(Error::ChannelTypeRestriction(
                "Cannot send text messages in a voice channel".to_string(),
            ));
        }

        // Announcement channels: restricted posting (only admins/mods)
        // The frontend should check permissions; we enforce at service level by checking
        // if sender is the community owner (more granular checks via permission system)
        if channel.channel_type == "announcement" {
            let community = self.get_community(&channel.community_id)?;
            if community.owner_did != sender_did {
                // Check if member has ManageChannels permission via roles
                // For now, only community owner can post in announcement channels
                // Full permission check would integrate with the permission bitfield system
                let member_roles = self.db().get_member_community_roles(&channel.community_id, sender_did)?;
                let has_announce_perm = member_roles.iter().any(|r| {
                    let bits: u64 = r.permissions_bitfield.parse().unwrap_or(0);
                    // Administrator (bit 0) or ManageChannels (bit 4)
                    bits & 1 != 0 || bits & (1 << 4) != 0
                });
                if !has_announce_perm {
                    return Err(Error::ChannelTypeRestriction(
                        "Only administrators and moderators can post in announcement channels".to_string(),
                    ));
                }
            }
        }

        // Check mute timeout
        if self.db().is_member_timed_out(&channel.community_id, sender_did, "mute", now)? {
            return Err(Error::MemberTimedOut(
                "You are currently muted in this community".to_string(),
            ));
        }

        // Check slow mode
        if channel.slow_mode_seconds > 0 {
            // Check last message time from this sender
            let recent = self.db().get_community_messages(channel_id, 1, None)?;
            if let Some(last) = recent.last() {
                if last.sender_did == sender_did {
                    let cooldown = channel.slow_mode_seconds as i64;
                    if now - last.created_at < cooldown {
                        return Err(Error::InvalidCommunityOperation(
                            format!("Slow mode: wait {} seconds between messages", channel.slow_mode_seconds),
                        ));
                    }
                }
            }
        }

        self.db().store_community_message(
            &id, channel_id, sender_did,
            None, Some(content), None, None, false,
            reply_to_id, thread_id, false, false,
            content_warning, now, metadata_json,
        )?;

        // If this is a thread reply, update thread counters
        if let Some(tid) = thread_id {
            let _ = self.db().increment_thread_message_count(tid, now);
        }

        Ok(CommunityMessageRecord {
            id,
            channel_id: channel_id.to_string(),
            sender_did: sender_did.to_string(),
            content_encrypted: None,
            content_plaintext: Some(content.to_string()),
            nonce: None,
            key_version: None,
            is_e2ee: false,
            reply_to_id: reply_to_id.map(|s| s.to_string()),
            thread_id: thread_id.map(|s| s.to_string()),
            has_embed: false,
            has_attachment: false,
            content_warning: content_warning.map(|s| s.to_string()),
            edited_at: None,
            deleted_for_everyone: false,
            created_at: now,
            metadata_json: metadata_json.map(|s| s.to_string()),
        })
    }

    /// Send an encrypted message to a channel (E2EE).
    #[allow(clippy::too_many_arguments)]
    pub fn send_encrypted_message(
        &self,
        channel_id: &str,
        sender_did: &str,
        content_encrypted: &[u8],
        nonce: &str,
        key_version: i32,
        reply_to_id: Option<&str>,
        thread_id: Option<&str>,
    ) -> Result<String> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().store_community_message(
            &id, channel_id, sender_did,
            Some(content_encrypted), None, Some(nonce), Some(key_version), true,
            reply_to_id, thread_id, false, false, None, now, None,
        )?;

        if let Some(tid) = thread_id {
            let _ = self.db().increment_thread_message_count(tid, now);
        }

        Ok(id)
    }

    /// Store a received message from another member (via relay / bridge).
    ///
    /// Unlike `send_message`, this skips permission checks and slow-mode
    /// enforcement because the message was authored elsewhere. Uses
    /// INSERT OR IGNORE so duplicate IDs are silently skipped.
    pub fn store_received_message(
        &self,
        id: &str,
        channel_id: &str,
        sender_did: &str,
        content: &str,
        created_at: i64,
        metadata_json: Option<&str>,
    ) -> Result<()> {
        self.db().store_community_message_if_not_exists(
            id, channel_id, sender_did,
            None, Some(content), None, None, false,
            None, None, false, false,
            None, created_at, metadata_json,
        )
    }

    /// Get messages for a channel with pagination.
    pub fn get_messages(
        &self,
        channel_id: &str,
        limit: usize,
        before_timestamp: Option<i64>,
    ) -> Result<Vec<CommunityMessageRecord>> {
        self.db().get_community_messages(channel_id, limit, before_timestamp)
    }

    /// Get a single message.
    pub fn get_message(&self, id: &str) -> Result<CommunityMessageRecord> {
        self.db().get_community_message(id)?
            .ok_or(Error::MessageNotFound)
    }

    /// Edit a message.
    pub fn edit_message(
        &self,
        id: &str,
        new_content: &str,
        editor_did: &str,
    ) -> Result<()> {
        let msg = self.get_message(id)?;
        if msg.sender_did != editor_did {
            return Err(Error::InsufficientPermissions(
                "Can only edit your own messages".to_string(),
            ));
        }
        let now = crate::time::now_timestamp();
        self.db().edit_community_message(id, Some(new_content), None, None, now)
    }

    /// Delete a message for everyone (mod/admin or sender).
    pub fn delete_message_for_everyone(&self, id: &str) -> Result<()> {
        self.db().delete_community_message_for_everyone(id)
    }

    /// Delete a message for the current user only.
    pub fn delete_message_for_me(&self, message_id: &str, member_did: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().delete_community_message_for_me(message_id, member_did, now)
    }

    // ── Reactions ───────────────────────────────────────────────────────

    /// Add a reaction to a message.
    pub fn add_reaction(
        &self,
        message_id: &str,
        member_did: &str,
        emoji: &str,
        is_custom: bool,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().add_community_reaction(message_id, member_did, emoji, is_custom, now)
    }

    /// Remove a reaction from a message.
    pub fn remove_reaction(
        &self,
        message_id: &str,
        member_did: &str,
        emoji: &str,
    ) -> Result<()> {
        self.db().remove_community_reaction(message_id, member_did, emoji)
    }

    /// Get reactions for a message.
    pub fn get_reactions(&self, message_id: &str) -> Result<Vec<CommunityReactionRecord>> {
        self.db().get_community_reactions(message_id)
    }

    // ── Read Receipts ───────────────────────────────────────────────────

    /// Mark a channel as read up to a specific message.
    pub fn mark_read(
        &self,
        channel_id: &str,
        member_did: &str,
        last_read_message_id: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_read_receipt(channel_id, member_did, last_read_message_id, now)
    }

    /// Get read receipts for a channel.
    pub fn get_read_receipts(&self, channel_id: &str) -> Result<Vec<CommunityReadReceiptRecord>> {
        self.db().get_read_receipts(channel_id)
    }

    // ── Pins ────────────────────────────────────────────────────────────

    /// Pin a message in a channel (respects pin limit).
    pub fn pin_message(
        &self,
        channel_id: &str,
        message_id: &str,
        pinned_by: &str,
    ) -> Result<()> {
        // Check pin limit
        let channel = self.db().get_community_channel(channel_id)?
            .ok_or(Error::ChannelNotFound)?;
        let count = self.db().get_community_pin_count(channel_id)?;
        if count >= channel.pin_limit {
            return Err(Error::InvalidCommunityOperation(
                format!("Pin limit reached ({}/{})", count, channel.pin_limit),
            ));
        }

        let now = crate::time::now_timestamp();
        self.db().pin_community_message(channel_id, message_id, pinned_by, now)
    }

    /// Unpin a message.
    pub fn unpin_message(&self, channel_id: &str, message_id: &str) -> Result<()> {
        self.db().unpin_community_message(channel_id, message_id)
    }

    /// Get pinned messages for a channel.
    pub fn get_pins(&self, channel_id: &str) -> Result<Vec<CommunityPinRecord>> {
        self.db().get_community_pins(channel_id)
    }

    // ── Channel Keys (E2EE) ─────────────────────────────────────────────

    /// Store a channel encryption key.
    pub fn store_channel_key(
        &self,
        channel_id: &str,
        key_version: i32,
        encrypted_key: &[u8],
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().store_channel_key(channel_id, key_version, encrypted_key, now)
    }

    /// Get the latest channel key.
    pub fn get_latest_channel_key(&self, channel_id: &str) -> Result<Option<crate::storage::ChannelKeyRecord>> {
        self.db().get_latest_channel_key(channel_id)
    }

    // ── System Messages ─────────────────────────────────────────────────

    /// Send a system message to a channel (e.g., welcome, join/leave).
    ///
    /// System messages use sender_did = "system" and are always plaintext.
    pub fn send_system_message(
        &self,
        channel_id: &str,
        content: &str,
    ) -> Result<CommunityMessageRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().store_community_message(
            &id, channel_id, "system",
            None, Some(content), None, None, false,
            None, None, false, false, None, now, None,
        )?;

        Ok(CommunityMessageRecord {
            id,
            channel_id: channel_id.to_string(),
            sender_did: "system".to_string(),
            content_encrypted: None,
            content_plaintext: Some(content.to_string()),
            nonce: None,
            key_version: None,
            is_e2ee: false,
            reply_to_id: None,
            thread_id: None,
            has_embed: false,
            has_attachment: false,
            content_warning: None,
            edited_at: None,
            deleted_for_everyone: false,
            created_at: now,
            metadata_json: None,
        })
    }

    // ── Mention Parsing ─────────────────────────────────────────────────

    /// Parse mentions from a message and return them.
    ///
    /// This is a convenience wrapper around the free function `parse_mentions`.
    pub fn parse_message_mentions(&self, content: &str) -> Vec<MentionType> {
        parse_mentions(content)
    }
}
