//! # Peer Management
//!
//! Types and utilities for managing peer information.

use libp2p::{Multiaddr, PeerId};
use serde::{Deserialize, Serialize};

/// State of a peer connection
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum PeerState {
    /// Not connected
    #[default]
    Disconnected,
    /// Connection in progress
    Connecting,
    /// Connected and ready
    Connected,
    /// Connection failed
    Failed,
}

/// Information about a connected peer
#[derive(Debug, Clone)]
pub struct PeerInfo {
    /// The peer's ID
    pub peer_id: PeerId,
    /// Known addresses for this peer
    pub addresses: Vec<Multiaddr>,
    /// Connection state
    pub state: PeerState,
    /// The peer's DID (if known via Identify)
    pub did: Option<String>,
    /// The peer's display name (if known)
    pub display_name: Option<String>,
    /// The peer's agent version (from Identify protocol)
    pub agent_version: Option<String>,
    /// The peer's protocol version (from Identify protocol)
    pub protocol_version: Option<String>,
    /// Measured latency to this peer in milliseconds
    pub latency_ms: Option<u32>,
    /// When we connected to this peer
    pub connected_at: Option<i64>,
    /// Last activity timestamp
    pub last_seen: Option<i64>,
}

impl PeerInfo {
    /// Create a new PeerInfo for a connecting peer
    pub fn connecting(peer_id: PeerId, addresses: Vec<Multiaddr>) -> Self {
        Self {
            peer_id,
            addresses,
            state: PeerState::Connecting,
            did: None,
            display_name: None,
            agent_version: None,
            protocol_version: None,
            latency_ms: None,
            connected_at: None,
            last_seen: None,
        }
    }

    /// Create a new PeerInfo for a connected peer
    pub fn connected(peer_id: PeerId, addresses: Vec<Multiaddr>) -> Self {
        let now = crate::time::now_timestamp();
        Self {
            peer_id,
            addresses,
            state: PeerState::Connected,
            did: None,
            display_name: None,
            agent_version: None,
            protocol_version: None,
            latency_ms: None,
            connected_at: Some(now),
            last_seen: Some(now),
        }
    }

    /// Update the last seen timestamp
    pub fn touch(&mut self) {
        self.last_seen = Some(crate::time::now_timestamp());
    }

    /// Mark as disconnected
    pub fn disconnect(&mut self) {
        self.state = PeerState::Disconnected;
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_peer_state_default() {
        assert_eq!(PeerState::default(), PeerState::Disconnected);
    }

    #[test]
    fn test_peer_info_connecting() {
        let peer_id = PeerId::random();
        let info = PeerInfo::connecting(peer_id, vec![]);
        assert_eq!(info.state, PeerState::Connecting);
        assert!(info.connected_at.is_none());
    }

    #[test]
    fn test_peer_info_connected() {
        let peer_id = PeerId::random();
        let info = PeerInfo::connected(peer_id, vec![]);
        assert_eq!(info.state, PeerState::Connected);
        assert!(info.connected_at.is_some());
    }

    #[test]
    fn test_peer_info_touch() {
        let peer_id = PeerId::random();
        let mut info = PeerInfo::connected(peer_id, vec![]);
        let original_last_seen = info.last_seen;

        // Small delay to ensure timestamp changes
        std::thread::sleep(std::time::Duration::from_millis(10));

        info.touch();

        // last_seen should be updated or equal (if within same second)
        assert!(info.last_seen >= original_last_seen);
    }
}
