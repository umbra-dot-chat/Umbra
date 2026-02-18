//! # Category Management
//!
//! Category CRUD within spaces. Categories are user-named groupings
//! that organize channels within a space.

use crate::error::{Error, Result};
use crate::storage::CommunityCategoryRecord;
use super::service::generate_id;

impl super::CommunityService {
    /// Create a new category in a space.
    pub fn create_category(
        &self,
        community_id: &str,
        space_id: &str,
        name: &str,
        position: i32,
        actor_did: &str,
    ) -> Result<CommunityCategoryRecord> {
        let now = crate::time::now_timestamp();
        let category_id = generate_id();

        self.db().create_community_category(
            &category_id,
            community_id,
            space_id,
            name,
            position,
            now,
        )?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "category_create",
            Some("category"),
            Some(&category_id),
            None,
            now,
        )?;

        Ok(CommunityCategoryRecord {
            id: category_id,
            community_id: community_id.to_string(),
            space_id: space_id.to_string(),
            name: name.to_string(),
            position,
            created_at: now,
            updated_at: now,
        })
    }

    /// Get all categories in a space, ordered by position.
    pub fn get_categories(&self, space_id: &str) -> Result<Vec<CommunityCategoryRecord>> {
        self.db().get_community_categories(space_id)
    }

    /// Get all categories in a community (across all spaces).
    pub fn get_all_categories(&self, community_id: &str) -> Result<Vec<CommunityCategoryRecord>> {
        self.db().get_community_categories_by_community(community_id)
    }

    /// Update a category's name.
    pub fn update_category(
        &self,
        category_id: &str,
        name: &str,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        let category = self.db().get_community_category(category_id)?
            .ok_or(Error::CategoryNotFound)?;

        self.db().update_community_category(category_id, name, now)?;

        self.db().insert_audit_log(
            &generate_id(),
            &category.community_id,
            actor_did,
            "category_update",
            Some("category"),
            Some(category_id),
            None,
            now,
        )?;

        Ok(())
    }

    /// Reorder categories in a space.
    pub fn reorder_categories(
        &self,
        _space_id: &str,
        category_ids: &[String],
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        for (position, category_id) in category_ids.iter().enumerate() {
            self.db().update_community_category_position(category_id, position as i32, now)?;
        }
        Ok(())
    }

    /// Delete a category. Channels in this category will have their
    /// category_id set to NULL (uncategorized).
    pub fn delete_category(
        &self,
        category_id: &str,
        actor_did: &str,
    ) -> Result<()> {
        let category = self.db().get_community_category(category_id)?
            .ok_or(Error::CategoryNotFound)?;

        let now = crate::time::now_timestamp();
        self.db().delete_community_category(category_id)?;

        self.db().insert_audit_log(
            &generate_id(),
            &category.community_id,
            actor_did,
            "category_delete",
            Some("category"),
            Some(category_id),
            None,
            now,
        )?;

        Ok(())
    }

    /// Move a channel to a different category (or uncategorize it).
    pub fn move_channel_to_category(
        &self,
        channel_id: &str,
        category_id: Option<&str>,
        actor_did: &str,
    ) -> Result<()> {
        let channel = self.get_channel(channel_id)?;
        let now = crate::time::now_timestamp();

        self.db().update_channel_category(channel_id, category_id, now)?;

        self.db().insert_audit_log(
            &generate_id(),
            &channel.community_id,
            actor_did,
            "channel_move_category",
            Some("channel"),
            Some(channel_id),
            None,
            now,
        )?;

        Ok(())
    }
}
