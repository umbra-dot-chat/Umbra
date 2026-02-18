//! # Integrations
//!
//! Webhooks, notification settings, and advanced channel features.

use crate::error::{Error, Result};
use crate::storage::{CommunityWebhookRecord, ChannelPermissionOverrideRecord};
use super::service::generate_id;

impl super::CommunityService {
    // ── Webhooks ────────────────────────────────────────────────────────

    /// Create a webhook for a channel.
    pub fn create_webhook(
        &self,
        channel_id: &str,
        name: &str,
        avatar_url: Option<&str>,
        creator_did: &str,
    ) -> Result<CommunityWebhookRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();
        let token = generate_webhook_token();

        self.db().create_community_webhook(
            &id, channel_id, name, avatar_url, &token, creator_did, now,
        )?;

        // Audit log — need channel to get community
        if let Some(channel) = self.db().get_community_channel(channel_id)? {
            self.db().insert_audit_log(
                &generate_id(), &channel.community_id, creator_did, "webhook_create",
                Some("webhook"), Some(&id),
                Some(&serde_json::json!({"name": name}).to_string()),
                now,
            )?;
        }

        Ok(CommunityWebhookRecord {
            id,
            channel_id: channel_id.to_string(),
            name: name.to_string(),
            avatar_url: avatar_url.map(|s| s.to_string()),
            token,
            creator_did: creator_did.to_string(),
            created_at: now,
        })
    }

    /// Get webhooks for a channel.
    pub fn get_webhooks(&self, channel_id: &str) -> Result<Vec<CommunityWebhookRecord>> {
        self.db().get_community_webhooks(channel_id)
    }

    /// Get a webhook by ID.
    pub fn get_webhook(&self, id: &str) -> Result<CommunityWebhookRecord> {
        self.db().get_community_webhook(id)?
            .ok_or(Error::InvalidCommunityOperation("Webhook not found".to_string()))
    }

    /// Update a webhook's name and/or avatar.
    pub fn update_webhook(
        &self,
        id: &str,
        name: Option<&str>,
        avatar_url: Option<&str>,
    ) -> Result<()> {
        self.db().update_community_webhook(id, name, avatar_url)
    }

    /// Delete a webhook.
    pub fn delete_webhook(&self, id: &str, actor_did: &str) -> Result<()> {
        let webhook = self.get_webhook(id)?;
        self.db().delete_community_webhook(id)?;

        if let Some(channel) = self.db().get_community_channel(&webhook.channel_id)? {
            let now = crate::time::now_timestamp();
            self.db().insert_audit_log(
                &generate_id(), &channel.community_id, actor_did, "webhook_delete",
                Some("webhook"), Some(id), None, now,
            )?;
        }

        Ok(())
    }

    // ── Channel Permission Overrides (Advanced Roles Phase 4) ───────────

    /// Set a permission override for a role or member on a channel.
    pub fn set_channel_override(
        &self,
        channel_id: &str,
        target_type: &str,
        target_id: &str,
        allow_bitfield: &str,
        deny_bitfield: &str,
        actor_did: &str,
    ) -> Result<()> {
        let id = generate_id();
        self.db().set_channel_permission_override(
            &id, channel_id, target_type, target_id, allow_bitfield, deny_bitfield,
        )?;

        if let Some(channel) = self.db().get_community_channel(channel_id)? {
            let now = crate::time::now_timestamp();
            self.db().insert_audit_log(
                &generate_id(), &channel.community_id, actor_did, "permission_override_set",
                Some("channel"), Some(channel_id),
                Some(&serde_json::json!({
                    "target_type": target_type,
                    "target_id": target_id,
                }).to_string()),
                now,
            )?;
        }

        Ok(())
    }

    /// Get all permission overrides for a channel.
    pub fn get_channel_overrides(
        &self,
        channel_id: &str,
    ) -> Result<Vec<ChannelPermissionOverrideRecord>> {
        self.db().get_channel_permission_overrides(channel_id)
    }

    /// Remove a permission override.
    pub fn remove_channel_override(&self, override_id: &str) -> Result<()> {
        self.db().remove_channel_permission_override(override_id)
    }

    // ── Custom Role Management (Phase 4) ────────────────────────────────

    /// Create a custom role.
    #[allow(clippy::too_many_arguments)]
    pub fn create_custom_role(
        &self,
        community_id: &str,
        name: &str,
        color: Option<&str>,
        position: i32,
        hoisted: bool,
        mentionable: bool,
        permissions_bitfield: &str,
        actor_did: &str,
    ) -> Result<crate::storage::CommunityRoleRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().create_community_role(
            &id, community_id, name, color, position, hoisted, mentionable,
            false, // not preset
            permissions_bitfield, now,
        )?;

        self.db().insert_audit_log(
            &generate_id(), community_id, actor_did, "role_create",
            Some("role"), Some(&id),
            Some(&serde_json::json!({"name": name}).to_string()),
            now,
        )?;

        Ok(crate::storage::CommunityRoleRecord {
            id,
            community_id: community_id.to_string(),
            name: name.to_string(),
            color: color.map(|s| s.to_string()),
            icon: None,
            badge: None,
            position,
            hoisted,
            mentionable,
            is_preset: false,
            permissions_bitfield: permissions_bitfield.to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    /// Update a role's properties.
    #[allow(clippy::too_many_arguments)]
    pub fn update_role(
        &self,
        role_id: &str,
        name: Option<&str>,
        color: Option<&str>,
        hoisted: Option<bool>,
        mentionable: Option<bool>,
        position: Option<i32>,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_community_role(role_id, name, color, hoisted, mentionable, position, now)?;
        let _ = actor_did; // for future audit
        Ok(())
    }

    /// Update a role's permission bitfield.
    pub fn update_role_permissions(
        &self,
        role_id: &str,
        permissions_bitfield: &str,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_community_role_permissions(role_id, permissions_bitfield, now)?;
        let _ = actor_did;
        Ok(())
    }

    /// Delete a custom role (preset roles cannot be deleted).
    pub fn delete_role(&self, role_id: &str, actor_did: &str) -> Result<()> {
        self.db().delete_community_role(role_id)?;
        let _ = actor_did;
        Ok(())
    }
}

/// Generate a random webhook token (32-char hex).
fn generate_webhook_token() -> String {
    let timestamp = crate::time::now_timestamp_millis() as u64;

    let (hash1, hash2): (u64, u64) = {
        #[cfg(not(target_arch = "wasm32"))]
        {
            use std::collections::hash_map::RandomState;
            use std::hash::{BuildHasher, Hasher};
            let s = RandomState::new();
            let mut h = s.build_hasher();
            h.write_u64(timestamp);
            let h1 = h.finish();

            let s2 = RandomState::new();
            let mut h2 = s2.build_hasher();
            h2.write_u64(timestamp.wrapping_add(1));
            let h2_val = h2.finish();
            (h1, h2_val)
        }
        #[cfg(target_arch = "wasm32")]
        {
            let h1 = (js_sys::Math::random() * u64::MAX as f64) as u64;
            let h2 = (js_sys::Math::random() * u64::MAX as f64) as u64;
            (h1, h2)
        }
    };

    format!("{:016x}{:016x}", hash1, hash2)
}
