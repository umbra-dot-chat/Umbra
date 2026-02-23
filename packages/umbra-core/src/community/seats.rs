//! # Community Seats
//!
//! Ghost member placeholders from platform imports (e.g., Discord).
//! Seats represent imported members that real users can claim by linking
//! their platform account. Claiming a seat auto-joins the community and
//! assigns the original roles.
//!
//! Platform-agnostic: works with Discord, GitHub, Steam, etc.

use super::service::generate_id;
use crate::error::{Error, Result};
use crate::storage::CommunitySeatRecord;

impl super::CommunityService {
    /// Get all seats for a community.
    pub fn get_community_seats(&self, community_id: &str) -> Result<Vec<CommunitySeatRecord>> {
        self.db().get_community_seats(community_id)
    }

    /// Get unclaimed seats for a community.
    pub fn get_unclaimed_seats(&self, community_id: &str) -> Result<Vec<CommunitySeatRecord>> {
        self.db().get_unclaimed_community_seats(community_id)
    }

    /// Find a seat matching a platform account.
    pub fn find_seat_by_platform(
        &self,
        community_id: &str,
        platform: &str,
        platform_user_id: &str,
    ) -> Result<Option<CommunitySeatRecord>> {
        self.db()
            .find_community_seat_by_platform(community_id, platform, platform_user_id)
    }

    /// Claim a seat: auto-join the community and assign the original roles.
    ///
    /// This is the core flow for ghost member → real member transition:
    /// 1. Verify the seat exists and is unclaimed
    /// 2. Join the community (with ban check, default role, welcome message)
    /// 3. Parse role_ids_json and assign each role
    /// 4. Mark the seat as claimed
    /// 5. Audit log the action
    pub fn claim_seat(&self, seat_id: &str, claimer_did: &str) -> Result<CommunitySeatRecord> {
        // 1. Get the seat and verify it's unclaimed
        let seat = self
            .db()
            .get_community_seat(seat_id)?
            .ok_or_else(|| Error::InvalidCommunityOperation("Seat not found".to_string()))?;

        if seat.claimed_by_did.is_some() {
            return Err(Error::InvalidCommunityOperation(
                "Seat already claimed".to_string(),
            ));
        }

        let now = crate::time::now_timestamp();

        // 2. Join the community (reuses existing flow: ban check, default role, welcome)
        // If already a member, that's fine — just assign the extra roles
        let already_member = self
            .db()
            .get_community_member(&seat.community_id, claimer_did)?
            .is_some();
        if !already_member {
            self.join_community(&seat.community_id, claimer_did, seat.nickname.as_deref())?;
        }

        // 3. Parse role_ids_json and assign each role
        if let Ok(role_ids) = serde_json::from_str::<Vec<String>>(&seat.role_ids_json) {
            for role_id in &role_ids {
                // Best-effort: skip roles that no longer exist
                let _ = self.db().assign_community_role(
                    &seat.community_id,
                    claimer_did,
                    role_id,
                    now,
                    Some("seat_claim"),
                );
            }
        }

        // 4. Mark the seat as claimed
        self.db().claim_community_seat(seat_id, claimer_did, now)?;

        // 5. Audit log
        self.db().insert_audit_log(
            &generate_id(),
            &seat.community_id,
            claimer_did,
            "seat_claimed",
            Some("seat"),
            Some(seat_id),
            Some(
                &serde_json::json!({
                    "platform": seat.platform,
                    "platform_username": seat.platform_username,
                })
                .to_string(),
            ),
            now,
        )?;

        // Return the updated seat
        self.db().get_community_seat(seat_id)?.ok_or_else(|| {
            Error::InvalidCommunityOperation("Seat disappeared after claim".to_string())
        })
    }

    /// Delete a seat (admin action).
    pub fn delete_seat(&self, seat_id: &str, actor_did: &str) -> Result<()> {
        let seat = self
            .db()
            .get_community_seat(seat_id)?
            .ok_or_else(|| Error::InvalidCommunityOperation("Seat not found".to_string()))?;

        let now = crate::time::now_timestamp();
        self.db().delete_community_seat(seat_id)?;

        self.db().insert_audit_log(
            &generate_id(),
            &seat.community_id,
            actor_did,
            "seat_deleted",
            Some("seat"),
            Some(seat_id),
            Some(
                &serde_json::json!({
                    "platform": seat.platform,
                    "platform_username": seat.platform_username,
                })
                .to_string(),
            ),
            now,
        )?;

        Ok(())
    }

    /// Create seats in batch (for import).
    ///
    /// Takes a list of seat data and creates them all. Returns the count of seats created.
    pub fn create_seats_batch(&self, community_id: &str, seats: Vec<SeatInput>) -> Result<usize> {
        let now = crate::time::now_timestamp();

        let records: Vec<CommunitySeatRecord> = seats
            .into_iter()
            .map(|s| CommunitySeatRecord {
                id: generate_id(),
                community_id: community_id.to_string(),
                platform: s.platform,
                platform_user_id: s.platform_user_id,
                platform_username: s.platform_username,
                nickname: s.nickname,
                avatar_url: s.avatar_url,
                role_ids_json: serde_json::to_string(&s.role_ids)
                    .unwrap_or_else(|_| "[]".to_string()),
                claimed_by_did: None,
                claimed_at: None,
                created_at: now,
            })
            .collect();

        self.db().create_community_seats_batch(&records)
    }

    /// Count seats for a community (total, unclaimed).
    pub fn count_seats(&self, community_id: &str) -> Result<(i64, i64)> {
        self.db().count_community_seats(community_id)
    }
}

/// Input data for creating a seat (used by batch import).
#[allow(missing_docs)]
#[derive(Debug, Clone)]
pub struct SeatInput {
    pub platform: String,
    pub platform_user_id: String,
    pub platform_username: String,
    pub nickname: Option<String>,
    pub avatar_url: Option<String>,
    pub role_ids: Vec<String>,
}
