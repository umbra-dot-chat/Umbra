//! # Network Events
//!
//! Events emitted by the network layer for the application to handle.

use libp2p::{PeerId, Multiaddr};

/// Events emitted by the network service
#[derive(Debug, Clone)]
pub enum NetworkEvent {
    /// We started listening on an address
    Listening {
        /// The address we're listening on
        address: Multiaddr,
    },

    /// A new peer connected
    PeerConnected {
        /// The connected peer's ID
        peer_id: PeerId,
        /// Their known addresses
        addresses: Vec<Multiaddr>,
    },

    /// A peer disconnected
    PeerDisconnected {
        /// The disconnected peer's ID
        peer_id: PeerId,
        /// Reason for disconnection
        reason: Option<String>,
    },

    /// Connection to a peer failed
    ConnectionFailed {
        /// The peer we tried to connect to
        peer_id: Option<PeerId>,
        /// The address we tried
        address: Multiaddr,
        /// Error message
        error: String,
    },

    /// We received a message from a peer
    MessageReceived {
        /// Who sent the message
        peer_id: PeerId,
        /// The message data
        message: Vec<u8>,
    },

    /// A message was successfully delivered
    MessageDelivered {
        /// Who the message was sent to
        peer_id: PeerId,
        /// Message identifier (for correlation)
        message_id: String,
    },

    /// Message delivery failed
    MessageFailed {
        /// Who we tried to send to
        peer_id: PeerId,
        /// Message identifier
        message_id: String,
        /// Error message
        error: String,
    },

    /// Peer info updated via Identify protocol
    PeerIdentified {
        /// The identified peer
        peer_id: PeerId,
        /// Their DID (from agent version)
        did: Option<String>,
        /// Observed addresses
        addresses: Vec<Multiaddr>,
    },

    /// DHT routing table updated
    DhtUpdated {
        /// Number of peers in our routing table
        peer_count: usize,
    },

    /// We discovered a new peer via DHT
    PeerDiscovered {
        /// The discovered peer
        peer_id: PeerId,
        /// Their addresses
        addresses: Vec<Multiaddr>,
    },
}

impl NetworkEvent {
    /// Get the peer ID associated with this event, if any
    pub fn peer_id(&self) -> Option<PeerId> {
        match self {
            Self::PeerConnected { peer_id, .. } => Some(*peer_id),
            Self::PeerDisconnected { peer_id, .. } => Some(*peer_id),
            Self::ConnectionFailed { peer_id, .. } => *peer_id,
            Self::MessageReceived { peer_id, .. } => Some(*peer_id),
            Self::MessageDelivered { peer_id, .. } => Some(*peer_id),
            Self::MessageFailed { peer_id, .. } => Some(*peer_id),
            Self::PeerIdentified { peer_id, .. } => Some(*peer_id),
            Self::PeerDiscovered { peer_id, .. } => Some(*peer_id),
            _ => None,
        }
    }

    /// Check if this is a connection-related event
    pub fn is_connection_event(&self) -> bool {
        matches!(
            self,
            Self::PeerConnected { .. }
                | Self::PeerDisconnected { .. }
                | Self::ConnectionFailed { .. }
        )
    }

    /// Check if this is a message-related event
    pub fn is_message_event(&self) -> bool {
        matches!(
            self,
            Self::MessageReceived { .. }
                | Self::MessageDelivered { .. }
                | Self::MessageFailed { .. }
        )
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_event_peer_id() {
        let peer_id = PeerId::random();

        let event = NetworkEvent::PeerConnected {
            peer_id,
            addresses: vec![],
        };
        assert_eq!(event.peer_id(), Some(peer_id));

        let event = NetworkEvent::Listening {
            address: "/ip4/127.0.0.1/tcp/4001".parse().unwrap(),
        };
        assert_eq!(event.peer_id(), None);
    }

    #[test]
    fn test_event_categorization() {
        let peer_id = PeerId::random();

        let event = NetworkEvent::PeerConnected {
            peer_id,
            addresses: vec![],
        };
        assert!(event.is_connection_event());
        assert!(!event.is_message_event());

        let event = NetworkEvent::MessageReceived {
            peer_id,
            message: vec![],
        };
        assert!(!event.is_connection_event());
        assert!(event.is_message_event());
    }

    #[test]
    fn test_all_connection_events() {
        let peer_id = PeerId::random();
        let addr: Multiaddr = "/ip4/127.0.0.1/tcp/4001".parse().unwrap();

        let connection_events = vec![
            NetworkEvent::PeerConnected {
                peer_id,
                addresses: vec![addr.clone()],
            },
            NetworkEvent::PeerDisconnected {
                peer_id,
                reason: Some("timeout".to_string()),
            },
            NetworkEvent::ConnectionFailed {
                peer_id: Some(peer_id),
                address: addr.clone(),
                error: "refused".to_string(),
            },
        ];

        for event in &connection_events {
            assert!(event.is_connection_event(), "Should be connection event: {:?}", event);
            assert!(!event.is_message_event(), "Should not be message event: {:?}", event);
        }
    }

    #[test]
    fn test_all_message_events() {
        let peer_id = PeerId::random();

        let message_events = vec![
            NetworkEvent::MessageReceived {
                peer_id,
                message: vec![1, 2, 3],
            },
            NetworkEvent::MessageDelivered {
                peer_id,
                message_id: "msg-1".to_string(),
            },
            NetworkEvent::MessageFailed {
                peer_id,
                message_id: "msg-2".to_string(),
                error: "test error".to_string(),
            },
        ];

        for event in &message_events {
            assert!(event.is_message_event(), "Should be message event: {:?}", event);
            assert!(!event.is_connection_event(), "Should not be connection event: {:?}", event);
        }
    }

    #[test]
    fn test_non_categorized_events() {
        let peer_id = PeerId::random();

        let other_events = vec![
            NetworkEvent::Listening {
                address: "/ip4/127.0.0.1/tcp/4001".parse().unwrap(),
            },
            NetworkEvent::PeerIdentified {
                peer_id,
                did: Some("did:key:z6MkTest".to_string()),
                addresses: vec![],
            },
            NetworkEvent::DhtUpdated { peer_count: 5 },
            NetworkEvent::PeerDiscovered {
                peer_id,
                addresses: vec![],
            },
        ];

        for event in &other_events {
            assert!(!event.is_connection_event());
            assert!(!event.is_message_event());
        }
    }

    #[test]
    fn test_connection_failed_without_peer_id() {
        let addr: Multiaddr = "/ip4/10.0.0.1/tcp/8080".parse().unwrap();

        let event = NetworkEvent::ConnectionFailed {
            peer_id: None,
            address: addr,
            error: "connection refused".to_string(),
        };

        assert_eq!(event.peer_id(), None);
        assert!(event.is_connection_event());
    }

    #[test]
    fn test_peer_disconnected_with_reason() {
        let peer_id = PeerId::random();

        let event = NetworkEvent::PeerDisconnected {
            peer_id,
            reason: Some("Keep-alive timeout".to_string()),
        };
        assert_eq!(event.peer_id(), Some(peer_id));

        let event_no_reason = NetworkEvent::PeerDisconnected {
            peer_id,
            reason: None,
        };
        assert_eq!(event_no_reason.peer_id(), Some(peer_id));
    }

    #[test]
    fn test_dht_updated_has_no_peer_id() {
        let event = NetworkEvent::DhtUpdated { peer_count: 42 };
        assert_eq!(event.peer_id(), None);
    }
}
