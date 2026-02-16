//! # Customization & Branding
//!
//! Community branding, custom emoji, stickers, and vanity URLs.

use crate::error::{Error, Result};
use crate::storage::{CommunityEmojiRecord, CommunityStickerRecord};
use super::service::generate_id;

impl super::CommunityService {
    // ── Branding ────────────────────────────────────────────────────────

    /// Update community branding (icon, banner, splash, accent color, CSS).
    #[allow(clippy::too_many_arguments)]
    pub fn update_branding(
        &self,
        community_id: &str,
        icon_url: Option<&str>,
        banner_url: Option<&str>,
        splash_url: Option<&str>,
        accent_color: Option<&str>,
        custom_css: Option<&str>,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_community_branding(
            community_id, icon_url, banner_url, splash_url,
            accent_color, custom_css, now,
        )?;

        self.db().insert_audit_log(
            &generate_id(), community_id, actor_did, "branding_update",
            Some("community"), Some(community_id), None, now,
        )?;

        Ok(())
    }

    /// Set a vanity URL for a community.
    pub fn set_vanity_url(
        &self,
        community_id: &str,
        vanity_url: &str,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_community_vanity_url(community_id, vanity_url, now)?;

        self.db().insert_audit_log(
            &generate_id(), community_id, actor_did, "vanity_url_update",
            Some("community"), Some(community_id),
            Some(&serde_json::json!({"vanity_url": vanity_url}).to_string()),
            now,
        )?;

        Ok(())
    }

    // ── Custom Emoji ────────────────────────────────────────────────────

    /// Create a custom emoji.
    pub fn create_emoji(
        &self,
        community_id: &str,
        name: &str,
        image_url: &str,
        animated: bool,
        uploaded_by: &str,
    ) -> Result<CommunityEmojiRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().create_community_emoji(
            &id, community_id, name, image_url, animated, uploaded_by, now,
        )?;

        self.db().insert_audit_log(
            &generate_id(), community_id, uploaded_by, "emoji_create",
            Some("emoji"), Some(&id),
            Some(&serde_json::json!({"name": name}).to_string()),
            now,
        )?;

        Ok(CommunityEmojiRecord {
            id,
            community_id: community_id.to_string(),
            name: name.to_string(),
            image_url: image_url.to_string(),
            animated,
            uploaded_by: uploaded_by.to_string(),
            created_at: now,
        })
    }

    /// Get all custom emoji for a community.
    pub fn get_emoji(&self, community_id: &str) -> Result<Vec<CommunityEmojiRecord>> {
        self.db().get_community_emoji(community_id)
    }

    /// Delete a custom emoji.
    pub fn delete_emoji(&self, emoji_id: &str, actor_did: &str) -> Result<()> {
        self.db().delete_community_emoji(emoji_id)?;
        let _ = actor_did; // acknowledged for future audit log
        Ok(())
    }

    // ── Custom Stickers ─────────────────────────────────────────────────

    /// Create a custom sticker.
    #[allow(clippy::too_many_arguments)]
    pub fn create_sticker(
        &self,
        community_id: &str,
        pack_id: Option<&str>,
        name: &str,
        image_url: &str,
        animated: bool,
        uploaded_by: &str,
    ) -> Result<CommunityStickerRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().create_community_sticker(
            &id, community_id, pack_id, name, image_url, animated, uploaded_by, now,
        )?;

        Ok(CommunityStickerRecord {
            id,
            community_id: community_id.to_string(),
            pack_id: pack_id.map(|s| s.to_string()),
            name: name.to_string(),
            image_url: image_url.to_string(),
            animated,
            uploaded_by: uploaded_by.to_string(),
            created_at: now,
        })
    }

    /// Get all stickers for a community.
    pub fn get_stickers(&self, community_id: &str) -> Result<Vec<CommunityStickerRecord>> {
        self.db().get_community_stickers(community_id)
    }

    /// Delete a custom sticker.
    pub fn delete_sticker(&self, sticker_id: &str) -> Result<()> {
        self.db().delete_community_sticker(sticker_id)
    }
}
