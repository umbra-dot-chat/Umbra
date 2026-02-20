//! # Customization & Branding
//!
//! Community branding, custom emoji, stickers, sticker packs, and vanity URLs.

use crate::error::Result;
use crate::storage::{CommunityEmojiRecord, CommunityStickerRecord, CommunityStickerPackRecord};
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

    /// Rename a custom emoji.
    pub fn rename_emoji(&self, emoji_id: &str, new_name: &str) -> Result<()> {
        self.db().rename_community_emoji(emoji_id, new_name)
    }

    /// Delete a custom emoji.
    pub fn delete_emoji(&self, emoji_id: &str, _actor_did: &str) -> Result<()> {
        self.db().delete_community_emoji(emoji_id)
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
        format: &str,
        uploaded_by: &str,
    ) -> Result<CommunityStickerRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().create_community_sticker(
            &id, community_id, pack_id, name, image_url, animated, format, uploaded_by, now,
        )?;

        self.db().insert_audit_log(
            &generate_id(), community_id, uploaded_by, "sticker_create",
            Some("sticker"), Some(&id),
            Some(&serde_json::json!({"name": name, "format": format}).to_string()),
            now,
        )?;

        Ok(CommunityStickerRecord {
            id,
            community_id: community_id.to_string(),
            pack_id: pack_id.map(|s| s.to_string()),
            name: name.to_string(),
            image_url: image_url.to_string(),
            animated,
            format: format.to_string(),
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

    // ── Sticker Packs ───────────────────────────────────────────────────

    /// Create a sticker pack.
    #[allow(clippy::too_many_arguments)]
    pub fn create_sticker_pack(
        &self,
        community_id: &str,
        name: &str,
        description: Option<&str>,
        cover_sticker_id: Option<&str>,
        created_by: &str,
    ) -> Result<CommunityStickerPackRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().create_community_sticker_pack(
            &id, community_id, name, description, cover_sticker_id, created_by, now,
        )?;

        self.db().insert_audit_log(
            &generate_id(), community_id, created_by, "sticker_pack_create",
            Some("sticker_pack"), Some(&id),
            Some(&serde_json::json!({"name": name}).to_string()),
            now,
        )?;

        Ok(CommunityStickerPackRecord {
            id,
            community_id: community_id.to_string(),
            name: name.to_string(),
            description: description.map(|s| s.to_string()),
            cover_sticker_id: cover_sticker_id.map(|s| s.to_string()),
            created_by: created_by.to_string(),
            created_at: now,
        })
    }

    /// Get all sticker packs for a community.
    pub fn get_sticker_packs(&self, community_id: &str) -> Result<Vec<CommunityStickerPackRecord>> {
        self.db().get_community_sticker_packs(community_id)
    }

    /// Delete a sticker pack.
    pub fn delete_sticker_pack(&self, pack_id: &str) -> Result<()> {
        self.db().delete_community_sticker_pack(pack_id)
    }

    /// Rename a sticker pack.
    pub fn rename_sticker_pack(&self, pack_id: &str, new_name: &str) -> Result<()> {
        self.db().rename_community_sticker_pack(pack_id, new_name)
    }
}
