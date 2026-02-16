//! # Invite Link System
//!
//! Invite codes with optional expiration, max uses, and vanity URLs.

use crate::error::{Error, Result};
use crate::storage::CommunityInviteRecord;
use super::service::generate_id;

impl super::CommunityService {
    /// Create an invite link for a community.
    pub fn create_invite(
        &self,
        community_id: &str,
        creator_did: &str,
        max_uses: Option<i32>,
        expires_at: Option<i64>,
    ) -> Result<CommunityInviteRecord> {
        let now = crate::time::now_timestamp();
        let invite_id = generate_id();
        let code = generate_invite_code();

        self.db().create_community_invite(
            &invite_id,
            community_id,
            &code,
            false, // not vanity
            creator_did,
            max_uses,
            expires_at,
            now,
        )?;

        self.db().insert_audit_log(
            &generate_id(),
            community_id,
            creator_did,
            "invite_create",
            Some("invite"),
            Some(&invite_id),
            None,
            now,
        )?;

        Ok(CommunityInviteRecord {
            id: invite_id,
            community_id: community_id.to_string(),
            code,
            vanity: false,
            creator_did: creator_did.to_string(),
            max_uses,
            use_count: 0,
            expires_at,
            created_at: now,
        })
    }

    /// Use an invite code to join a community.
    pub fn use_invite(
        &self,
        code: &str,
        member_did: &str,
    ) -> Result<String> {
        let invite = self.db().get_community_invite_by_code(code)?
            .ok_or(Error::InviteNotFound)?;

        let now = crate::time::now_timestamp();

        // Check expiration
        if let Some(expires_at) = invite.expires_at {
            if now > expires_at {
                return Err(Error::InviteExpired);
            }
        }

        // Check max uses
        if let Some(max_uses) = invite.max_uses {
            if invite.use_count >= max_uses {
                return Err(Error::InviteMaxUsesReached);
            }
        }

        // Join the community
        self.join_community(&invite.community_id, member_did)?;

        // Increment use count
        self.db().increment_invite_use_count(&invite.id)?;

        Ok(invite.community_id)
    }

    /// Get all invites for a community.
    pub fn get_invites(&self, community_id: &str) -> Result<Vec<CommunityInviteRecord>> {
        self.db().get_community_invites(community_id)
    }

    /// Delete an invite.
    pub fn delete_invite(
        &self,
        invite_id: &str,
        actor_did: &str,
    ) -> Result<()> {
        let invite = self.db().get_community_invite(invite_id)?
            .ok_or(Error::InviteNotFound)?;

        let now = crate::time::now_timestamp();
        self.db().delete_community_invite(invite_id)?;

        self.db().insert_audit_log(
            &generate_id(),
            &invite.community_id,
            actor_did,
            "invite_delete",
            Some("invite"),
            Some(invite_id),
            None,
            now,
        )?;

        Ok(())
    }

    /// Set a vanity invite code for a community.
    pub fn set_vanity_invite(
        &self,
        community_id: &str,
        vanity_code: &str,
        creator_did: &str,
    ) -> Result<CommunityInviteRecord> {
        let now = crate::time::now_timestamp();
        let invite_id = generate_id();

        self.db().create_community_invite(
            &invite_id,
            community_id,
            vanity_code,
            true, // vanity
            creator_did,
            None, // no max uses
            None, // no expiration
            now,
        )?;

        Ok(CommunityInviteRecord {
            id: invite_id,
            community_id: community_id.to_string(),
            code: vanity_code.to_string(),
            vanity: true,
            creator_did: creator_did.to_string(),
            max_uses: None,
            use_count: 0,
            expires_at: None,
            created_at: now,
        })
    }
}

/// Generate a random invite code (8 alphanumeric chars).
fn generate_invite_code() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    use std::collections::hash_map::RandomState;
    use std::hash::{BuildHasher, Hasher};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();

    let s = RandomState::new();
    let mut h = s.build_hasher();
    h.write_u128(timestamp);
    let hash = h.finish();

    // Convert to alphanumeric (base36-ish)
    const CHARS: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
    let mut code = String::with_capacity(8);
    let mut val = hash;
    for _ in 0..8 {
        code.push(CHARS[(val % 36) as usize] as char);
        val /= 36;
    }
    code
}
