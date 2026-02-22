//! # Spaces Management
//!
//! Spaces are one level of organization within a community.
//! Each space contains channels and has a position for ordering.

use super::service::generate_id;
use crate::error::{Error, Result};
use crate::storage::CommunitySpaceRecord;

impl super::CommunityService {
    /// Create a new space in a community.
    pub fn create_space(
        &self,
        community_id: &str,
        name: &str,
        position: i32,
        actor_did: &str,
    ) -> Result<CommunitySpaceRecord> {
        let now = crate::time::now_timestamp();
        let space_id = generate_id();

        self.db()
            .create_community_space(&space_id, community_id, name, position, now)?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "space_create",
            Some("space"),
            Some(&space_id),
            None,
            now,
        )?;

        Ok(CommunitySpaceRecord {
            id: space_id,
            community_id: community_id.to_string(),
            name: name.to_string(),
            position,
            created_at: now,
            updated_at: now,
        })
    }

    /// Get all spaces in a community, ordered by position.
    pub fn get_spaces(&self, community_id: &str) -> Result<Vec<CommunitySpaceRecord>> {
        self.db().get_community_spaces(community_id)
    }

    /// Update a space's name.
    pub fn update_space(&self, space_id: &str, name: &str, actor_did: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        let space = self
            .db()
            .get_community_space(space_id)?
            .ok_or(Error::SpaceNotFound)?;

        self.db().update_community_space(space_id, name, now)?;

        self.db().insert_audit_log(
            &generate_id(),
            &space.community_id,
            actor_did,
            "space_update",
            Some("space"),
            Some(space_id),
            None,
            now,
        )?;

        Ok(())
    }

    /// Reorder spaces in a community.
    pub fn reorder_spaces(
        &self,
        community_id: &str,
        space_ids: &[String],
        _actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        for (position, space_id) in space_ids.iter().enumerate() {
            self.db()
                .update_community_space_position(space_id, position as i32, now)?;
        }

        // Audit log for reorder is optional (too noisy)
        let _ = community_id;
        Ok(())
    }

    /// Delete a space and all its channels.
    pub fn delete_space(&self, space_id: &str, actor_did: &str) -> Result<()> {
        let space = self
            .db()
            .get_community_space(space_id)?
            .ok_or(Error::SpaceNotFound)?;

        let now = crate::time::now_timestamp();
        self.db().delete_community_space(space_id)?;

        self.db().insert_audit_log(
            &generate_id(),
            &space.community_id,
            actor_did,
            "space_delete",
            Some("space"),
            Some(space_id),
            None,
            now,
        )?;

        Ok(())
    }
}
