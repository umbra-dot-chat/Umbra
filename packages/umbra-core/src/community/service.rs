//! # Community Service
//!
//! Core service struct for community CRUD operations.

use std::sync::Arc;
use crate::error::{Error, Result};
use crate::storage::Database;

/// The main community service — coordinates all community operations.
///
/// Holds a reference to the database and provides high-level methods
/// for creating, updating, and querying communities.
pub struct CommunityService {
    db: Arc<Database>,
}

impl CommunityService {
    /// Create a new community service backed by the given database.
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    /// Get a reference to the underlying database.
    pub(crate) fn db(&self) -> &Database {
        &self.db
    }

    /// Create a new community with default spaces and roles.
    ///
    /// This is the primary entry point for community creation. It:
    /// 1. Creates the community record
    /// 2. Creates a default "General" space
    /// 3. Creates a default "general" text channel and "welcome" channel
    /// 4. Creates preset roles (Owner, Admin, Moderator, Member)
    /// 5. Adds the creator as owner
    /// 6. Logs the creation in the audit log
    pub fn create_community(
        &self,
        name: &str,
        description: Option<&str>,
        owner_did: &str,
        owner_nickname: Option<&str>,
    ) -> Result<CommunityCreateResult> {
        let now = crate::time::now_timestamp();
        let community_id = generate_id();

        // 1. Create community record
        self.db().create_community_record(
            &community_id,
            name,
            description,
            owner_did,
            now,
        )?;

        // 2. Create default space
        let space_id = generate_id();
        self.db().create_community_space(
            &space_id,
            &community_id,
            "General",
            0,
            now,
        )?;

        // 3. Create default category
        let category_id = generate_id();
        self.db().create_community_category(
            &category_id,
            &community_id,
            &space_id,
            "General",
            0,
            now,
        )?;

        // 4. Create default channels (assigned to the default category)
        let welcome_channel_id = generate_id();
        self.db().create_community_channel(
            &welcome_channel_id,
            &community_id,
            &space_id,
            Some(&category_id),
            "welcome",
            "welcome",
            None,
            0,
            now,
        )?;

        let general_channel_id = generate_id();
        self.db().create_community_channel(
            &general_channel_id,
            &community_id,
            &space_id,
            Some(&category_id),
            "general",
            "text",
            None,
            1,
            now,
        )?;

        // 5. Create preset roles
        let role_ids = super::roles::create_preset_roles(self.db(), &community_id, now)?;

        // 6. Add creator as member with owner role
        self.db().add_community_member(
            &community_id,
            owner_did,
            now,
            owner_nickname,
        )?;
        self.db().assign_community_role(
            &community_id,
            owner_did,
            &role_ids.owner,
            now,
            None,
        )?;

        // 7. Audit log
        self.db().insert_audit_log(
            &generate_id(),
            &community_id,
            owner_did,
            "community_create",
            Some("community"),
            Some(&community_id),
            None,
            now,
        )?;

        Ok(CommunityCreateResult {
            community_id,
            space_id,
            welcome_channel_id,
            general_channel_id,
            role_ids,
        })
    }

    /// Get a community by ID.
    pub fn get_community(&self, id: &str) -> Result<crate::storage::CommunityRecord> {
        self.db().get_community(id)?
            .ok_or(Error::CommunityNotFound)
    }

    /// Get all communities the user is a member of.
    pub fn get_my_communities(&self, member_did: &str) -> Result<Vec<crate::storage::CommunityRecord>> {
        self.db().get_communities_for_member(member_did)
    }

    /// Update a community's name and/or description.
    pub fn update_community(
        &self,
        id: &str,
        name: Option<&str>,
        description: Option<&str>,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();

        self.db().update_community(id, name, description, now)?;

        self.db().insert_audit_log(
            &generate_id(),
            id,
            actor_did,
            "community_update",
            Some("community"),
            Some(id),
            None,
            now,
        )?;

        Ok(())
    }

    /// Delete a community (owner only).
    pub fn delete_community(&self, id: &str, actor_did: &str) -> Result<()> {
        let community = self.get_community(id)?;
        if community.owner_did != actor_did {
            return Err(Error::InsufficientPermissions(
                "Only the owner can delete a community".to_string(),
            ));
        }

        self.db().delete_community(id)?;
        Ok(())
    }

    /// Transfer community ownership.
    pub fn transfer_ownership(
        &self,
        community_id: &str,
        current_owner_did: &str,
        new_owner_did: &str,
    ) -> Result<()> {
        let community = self.get_community(community_id)?;
        if community.owner_did != current_owner_did {
            return Err(Error::InsufficientPermissions(
                "Only the owner can transfer ownership".to_string(),
            ));
        }

        let now = crate::time::now_timestamp();
        self.db().update_community_owner(community_id, new_owner_did, now)?;

        // Swap owner roles
        let owner_role = self.db().get_owner_role(community_id)?;
        if let Some(role) = owner_role {
            self.db().unassign_community_role(community_id, current_owner_did, &role.id)?;
            self.db().assign_community_role(community_id, new_owner_did, &role.id, now, Some(current_owner_did))?;
        }

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            current_owner_did,
            "ownership_transfer",
            Some("member"),
            Some(new_owner_did),
            None,
            now,
        )?;

        Ok(())
    }
}

/// Result of creating a new community.
#[derive(Debug, Clone)]
pub struct CommunityCreateResult {
    /// The new community's ID
    pub community_id: String,
    /// The default space ID
    pub space_id: String,
    /// The welcome channel ID
    pub welcome_channel_id: String,
    /// The general text channel ID
    pub general_channel_id: String,
    /// The preset role IDs
    pub role_ids: super::roles::PresetRoleIds,
}

/// Generate a unique ID (UUID v4 hex).
pub(crate) fn generate_id() -> String {
    // Use the platform-aware time module (js_sys::Date on WASM, chrono on native)
    let timestamp = crate::time::now_timestamp_millis() as u64;

    // Simple unique ID: timestamp + random suffix
    // In production this uses a proper UUID but we avoid adding a dependency
    let random_part: u64 = {
        #[cfg(not(target_arch = "wasm32"))]
        {
            use std::collections::hash_map::RandomState;
            use std::hash::{BuildHasher, Hasher};
            let s = RandomState::new();
            let mut h = s.build_hasher();
            h.write_u64(timestamp);
            h.finish()
        }
        #[cfg(target_arch = "wasm32")]
        {
            // On WASM, use js_sys::Math::random for better uniqueness
            (js_sys::Math::random() * u64::MAX as f64) as u64
        }
    };

    format!("{:016x}{:016x}", timestamp, random_part)
}
