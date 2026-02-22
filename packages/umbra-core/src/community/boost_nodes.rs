//! # Boost Nodes
//!
//! Boost node CRUD and configuration management.
//! The actual node runtime is in the separate `umbra-boost-node` crate.

use super::service::generate_id;
use crate::error::{Error, Result};
use crate::storage::BoostNodeRecord;

impl super::CommunityService {
    // ── Boost Node CRUD ─────────────────────────────────────────────────

    /// Register a new boost node.
    #[allow(clippy::too_many_arguments)]
    pub fn register_boost_node(
        &self,
        owner_did: &str,
        node_type: &str,
        node_public_key: &str,
        name: &str,
        max_storage_bytes: i64,
        max_bandwidth_mbps: i32,
        auto_start: bool,
        prioritized_communities: Option<&str>,
        pairing_token: Option<&str>,
        remote_address: Option<&str>,
    ) -> Result<BoostNodeRecord> {
        if node_type != "local" && node_type != "remote" {
            return Err(Error::InvalidCommunityOperation(
                "node_type must be 'local' or 'remote'".to_string(),
            ));
        }

        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().upsert_boost_node(
            &id,
            owner_did,
            node_type,
            node_public_key,
            name,
            false, // not enabled initially
            max_storage_bytes,
            max_bandwidth_mbps,
            auto_start,
            prioritized_communities,
            pairing_token,
            remote_address,
            now,
            now,
        )?;

        Ok(BoostNodeRecord {
            id,
            owner_did: owner_did.to_string(),
            node_type: node_type.to_string(),
            node_public_key: node_public_key.to_string(),
            name: name.to_string(),
            enabled: false,
            max_storage_bytes,
            max_bandwidth_mbps,
            auto_start,
            prioritized_communities: prioritized_communities.map(|s| s.to_string()),
            pairing_token: pairing_token.map(|s| s.to_string()),
            remote_address: remote_address.map(|s| s.to_string()),
            last_seen_at: None,
            created_at: now,
            updated_at: now,
        })
    }

    /// Get all boost nodes for a user.
    pub fn get_boost_nodes(&self, owner_did: &str) -> Result<Vec<BoostNodeRecord>> {
        self.db().get_boost_nodes(owner_did)
    }

    /// Get a specific boost node.
    pub fn get_boost_node(&self, id: &str) -> Result<BoostNodeRecord> {
        self.db()
            .get_boost_node(id)?
            .ok_or(Error::InvalidCommunityOperation(
                "Boost node not found".to_string(),
            ))
    }

    /// Update boost node configuration.
    #[allow(clippy::too_many_arguments)]
    pub fn update_boost_node(
        &self,
        id: &str,
        name: Option<&str>,
        enabled: Option<bool>,
        max_storage_bytes: Option<i64>,
        max_bandwidth_mbps: Option<i32>,
        auto_start: Option<bool>,
        prioritized_communities: Option<&str>,
    ) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_boost_node_config(
            id,
            name,
            enabled,
            max_storage_bytes,
            max_bandwidth_mbps,
            auto_start,
            prioritized_communities,
            now,
        )
    }

    /// Update boost node last seen timestamp (heartbeat).
    pub fn update_boost_node_heartbeat(&self, id: &str) -> Result<()> {
        let now = crate::time::now_timestamp();
        self.db().update_boost_node_last_seen(id, now)
    }

    /// Delete a boost node.
    pub fn delete_boost_node(&self, id: &str) -> Result<()> {
        self.db().delete_boost_node(id)
    }
}
