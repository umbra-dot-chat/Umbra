//! # Member Management
//!
//! Join, leave, kick, ban, and member profile operations.

use super::service::generate_id;
use crate::error::{Error, Result};
use crate::storage::{CommunityBanRecord, CommunityMemberRecord, CommunityRoleRecord};

impl super::CommunityService {
    /// Add a member to a community (join).
    pub fn join_community(
        &self,
        community_id: &str,
        member_did: &str,
        nickname: Option<&str>,
    ) -> Result<()> {
        // Check if banned
        if self.db().is_community_banned(community_id, member_did)? {
            return Err(Error::BannedFromCommunity);
        }

        // Check if already a member
        if self
            .db()
            .get_community_member(community_id, member_did)?
            .is_some()
        {
            return Err(Error::AlreadyMember);
        }

        let now = crate::time::now_timestamp();
        self.db()
            .add_community_member(community_id, member_did, now, nickname)?;

        // Assign default member role
        let member_role = self.db().get_member_role(community_id)?;
        if let Some(role) = member_role {
            self.db()
                .assign_community_role(community_id, member_did, &role.id, now, None)?;
        }

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            member_did,
            "member_join",
            Some("member"),
            Some(member_did),
            None,
            now,
        )?;

        // Send welcome message in the welcome channel (if one exists)
        let channels = self.db().get_community_channels(community_id)?;
        if let Some(welcome_channel) = channels.iter().find(|c| c.channel_type == "welcome") {
            let display = nickname.unwrap_or(member_did);
            let welcome_content = format!("Welcome to the community, {}!", display);
            // Best-effort: don't fail the join if welcome message fails
            let _ = self.send_system_message(&welcome_channel.id, &welcome_content);
        }

        Ok(())
    }

    /// Remove self from a community (leave).
    pub fn leave_community(&self, community_id: &str, member_did: &str) -> Result<()> {
        let community = self.get_community(community_id)?;
        if community.owner_did == member_did {
            return Err(Error::InvalidCommunityOperation(
                "Owner cannot leave. Transfer ownership first.".to_string(),
            ));
        }

        let now = crate::time::now_timestamp();
        self.db()
            .remove_community_member(community_id, member_did)?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            member_did,
            "member_leave",
            Some("member"),
            Some(member_did),
            None,
            now,
        )?;

        Ok(())
    }

    /// Kick a member from a community.
    pub fn kick_member(&self, community_id: &str, target_did: &str, actor_did: &str) -> Result<()> {
        let community = self.get_community(community_id)?;
        if community.owner_did == target_did {
            return Err(Error::CannotModifyOwner);
        }

        let now = crate::time::now_timestamp();
        self.db()
            .remove_community_member(community_id, target_did)?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "member_kick",
            Some("member"),
            Some(target_did),
            None,
            now,
        )?;

        Ok(())
    }

    /// Ban a member from a community.
    pub fn ban_member(
        &self,
        community_id: &str,
        target_did: &str,
        reason: Option<&str>,
        expires_at: Option<i64>,
        device_fingerprint: Option<&str>,
        actor_did: &str,
    ) -> Result<()> {
        let community = self.get_community(community_id)?;
        if community.owner_did == target_did {
            return Err(Error::CannotModifyOwner);
        }

        let now = crate::time::now_timestamp();

        // Remove from community first
        self.db()
            .remove_community_member(community_id, target_did)?;

        // Create ban record
        self.db().create_community_ban(
            community_id,
            target_did,
            reason,
            actor_did,
            device_fingerprint,
            expires_at,
            now,
        )?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "member_ban",
            Some("member"),
            Some(target_did),
            None,
            now,
        )?;

        Ok(())
    }

    /// Unban a member.
    pub fn unban_member(
        &self,
        community_id: &str,
        target_did: &str,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().remove_community_ban(community_id, target_did)?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "member_unban",
            Some("member"),
            Some(target_did),
            None,
            now,
        )?;

        Ok(())
    }

    /// Get all members of a community.
    pub fn get_members(&self, community_id: &str) -> Result<Vec<CommunityMemberRecord>> {
        self.db().get_community_members(community_id)
    }

    /// Get a single member record.
    pub fn get_member(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<CommunityMemberRecord> {
        self.db()
            .get_community_member(community_id, member_did)?
            .ok_or(Error::NotMember)
    }

    /// Update a member's community profile (nickname, avatar, bio).
    pub fn update_member_profile(
        &self,
        community_id: &str,
        member_did: &str,
        nickname: Option<&str>,
        avatar_url: Option<&str>,
        bio: Option<&str>,
    ) -> Result<()> {
        self.db().update_community_member_profile(
            community_id,
            member_did,
            nickname,
            avatar_url,
            bio,
        )
    }

    /// Get all bans for a community.
    pub fn get_bans(&self, community_id: &str) -> Result<Vec<CommunityBanRecord>> {
        self.db().get_community_bans(community_id)
    }

    /// Assign a role to a member.
    pub fn assign_role(
        &self,
        community_id: &str,
        member_did: &str,
        role_id: &str,
        actor_did: &str,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db()
            .assign_community_role(community_id, member_did, role_id, now, Some(actor_did))?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "role_assign",
            Some("member"),
            Some(member_did),
            None,
            now,
        )?;

        Ok(())
    }

    /// Unassign a role from a member.
    pub fn unassign_role(
        &self,
        community_id: &str,
        member_did: &str,
        role_id: &str,
        actor_did: &str,
    ) -> Result<()> {
        self.db()
            .unassign_community_role(community_id, member_did, role_id)?;

        let now = crate::time::now_timestamp();
        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            actor_did,
            "role_unassign",
            Some("member"),
            Some(member_did),
            None,
            now,
        )?;

        Ok(())
    }

    /// Get all roles for a community.
    pub fn get_roles(&self, community_id: &str) -> Result<Vec<CommunityRoleRecord>> {
        self.db().get_community_roles(community_id)
    }

    /// Get the roles assigned to a specific member.
    pub fn get_member_roles(
        &self,
        community_id: &str,
        member_did: &str,
    ) -> Result<Vec<CommunityRoleRecord>> {
        self.db()
            .get_member_community_roles(community_id, member_did)
    }
}
