//! # Network Behaviour
//!
//! Combined libp2p behaviour for Umbra's protocols.
//!
//! ## Behaviour Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                       UMBRA BEHAVIOUR                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Composed of multiple sub-behaviours:                                  │
//! │                                                                         │
//! │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
//! │  │  Identify   │  │    Ping     │  │  Kademlia   │  │   Request   │   │
//! │  │             │  │             │  │    DHT      │  │  Response   │   │
//! │  │ Exchange    │  │ Keepalive   │  │             │  │             │   │
//! │  │ peer info   │  │ detection   │  │ Peer        │  │ Messaging   │   │
//! │  │             │  │             │  │ discovery   │  │ protocol    │   │
//! │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use libp2p::{
    identify, kad, ping,
    request_response::{self, ProtocolSupport},
    swarm::NetworkBehaviour,
    PeerId,
};
use std::time::Duration;

use super::codec::{UmbraCodec, UmbraRequest, UmbraResponse};

/// Protocol version for identification
pub const PROTOCOL_VERSION: &str = "/umbra/1.0.0";

/// Agent version for identification
pub const AGENT_VERSION: &str = concat!("umbra-core/", env!("CARGO_PKG_VERSION"));

/// Combined behaviour for Umbra
///
/// This composes all the libp2p behaviours we need:
/// - Identify: Exchange peer information on connect
/// - Ping: Keep connections alive and detect dead peers
/// - Kademlia: DHT for peer discovery
/// - Request-Response: RPC-style messaging (messages, friend requests, presence)
#[derive(NetworkBehaviour)]
pub struct UmbraBehaviour {
    /// Identify protocol - exchanges peer info on connect
    pub identify: identify::Behaviour,

    /// Ping protocol - keepalive and latency measurement
    pub ping: ping::Behaviour,

    /// Kademlia DHT - peer discovery and routing
    pub kademlia: kad::Behaviour<kad::store::MemoryStore>,

    /// Request-Response protocol - Umbra messaging, friend requests, presence
    pub request_response: request_response::Behaviour<UmbraCodec>,
}

impl UmbraBehaviour {
    /// Create a new Umbra behaviour
    pub fn new(local_peer_id: PeerId, local_public_key: libp2p::identity::PublicKey) -> Self {
        // Identify configuration
        let identify_config = identify::Config::new(PROTOCOL_VERSION.to_string(), local_public_key)
            .with_agent_version(AGENT_VERSION.to_string())
            .with_interval(Duration::from_secs(60));

        let identify = identify::Behaviour::new(identify_config);

        // Ping configuration
        let ping_config = ping::Config::new()
            .with_interval(Duration::from_secs(30))
            .with_timeout(Duration::from_secs(20));

        let ping = ping::Behaviour::new(ping_config);

        // Kademlia configuration
        let store = kad::store::MemoryStore::new(local_peer_id);
        let mut kademlia_config = kad::Config::new(
            libp2p::StreamProtocol::try_from_owned("/umbra/kad/1.0.0".to_string())
                .expect("valid protocol name"),
        );

        kademlia_config
            .set_query_timeout(Duration::from_secs(60))
            .set_record_ttl(Some(Duration::from_secs(24 * 60 * 60))) // 24 hours
            .set_replication_factor(
                std::num::NonZeroUsize::new(20).expect("replication factor > 0"),
            );

        let kademlia = kad::Behaviour::with_config(local_peer_id, store, kademlia_config);

        // Request-Response configuration
        let rr_config =
            request_response::Config::default().with_request_timeout(Duration::from_secs(30));

        let request_response = request_response::Behaviour::new(
            [(UmbraCodec::protocol(), ProtocolSupport::Full)],
            rr_config,
        );

        Self {
            identify,
            ping,
            kademlia,
            request_response,
        }
    }

    /// Add a peer to the DHT routing table
    pub fn add_peer(&mut self, peer_id: PeerId, addrs: Vec<libp2p::Multiaddr>) {
        for addr in addrs {
            self.kademlia.add_address(&peer_id, addr);
        }
    }

    /// Bootstrap the DHT by connecting to known peers
    pub fn bootstrap(&mut self) -> Result<kad::QueryId, kad::NoKnownPeers> {
        self.kademlia.bootstrap()
    }

    /// Find a peer on the DHT
    pub fn find_peer(&mut self, peer_id: PeerId) -> kad::QueryId {
        self.kademlia.get_closest_peers(peer_id)
    }

    /// Send a request to a peer via the request-response protocol
    pub fn send_request(
        &mut self,
        peer_id: &PeerId,
        request: UmbraRequest,
    ) -> request_response::OutboundRequestId {
        self.request_response.send_request(peer_id, request)
    }

    /// Send a response back on a request-response channel
    #[allow(clippy::result_large_err)]
    pub fn send_response(
        &mut self,
        channel: request_response::ResponseChannel<UmbraResponse>,
        response: UmbraResponse,
    ) -> Result<(), UmbraResponse> {
        self.request_response.send_response(channel, response)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use libp2p::identity::Keypair;

    #[test]
    fn test_protocol_version() {
        assert!(PROTOCOL_VERSION.starts_with("/umbra/"));
    }

    #[test]
    fn test_agent_version() {
        assert!(AGENT_VERSION.starts_with("umbra-core/"));
    }

    #[test]
    fn test_behaviour_creation() {
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());
        let public_key = keypair.public();

        let behaviour = UmbraBehaviour::new(peer_id, public_key);
        // Behaviour should be created successfully with all sub-behaviours
        // The request_response behaviour is included
        let _ = &behaviour.request_response;
    }

    #[test]
    fn test_behaviour_has_request_response() {
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());
        let public_key = keypair.public();

        let _behaviour = UmbraBehaviour::new(peer_id, public_key);
        // If this compiles, the request_response field exists
    }

    #[test]
    fn test_behaviour_add_peer() {
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());
        let public_key = keypair.public();

        let mut behaviour = UmbraBehaviour::new(peer_id, public_key);

        // Add a peer with addresses
        let other_peer = PeerId::random();
        let addr: libp2p::Multiaddr = "/ip4/127.0.0.1/tcp/4001".parse().unwrap();

        behaviour.add_peer(other_peer, vec![addr]);
        // Should not panic — address is added to the DHT routing table
    }

    #[test]
    fn test_behaviour_add_peer_multiple_addrs() {
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());
        let public_key = keypair.public();

        let mut behaviour = UmbraBehaviour::new(peer_id, public_key);

        let other_peer = PeerId::random();
        let addrs: Vec<libp2p::Multiaddr> = vec![
            "/ip4/127.0.0.1/tcp/4001".parse().unwrap(),
            "/ip4/192.168.1.1/tcp/4001".parse().unwrap(),
        ];

        behaviour.add_peer(other_peer, addrs);
        // Should add both addresses without error
    }

    #[test]
    fn test_behaviour_send_request() {
        let keypair = Keypair::generate_ed25519();
        let peer_id = PeerId::from(keypair.public());
        let public_key = keypair.public();

        let mut behaviour = UmbraBehaviour::new(peer_id, public_key);

        // Create a request
        use crate::network::codec::UmbraRequest;
        use crate::network::protocols::MessageRequest;

        let request = UmbraRequest::Message(MessageRequest {
            message_id: "test-123".to_string(),
            encrypted_content: vec![1, 2, 3],
            nonce: vec![0; 12],
            timestamp: 0,
        });

        let other_peer = PeerId::random();
        let _request_id = behaviour.send_request(&other_peer, request);
        // Should return a request ID without panicking
    }

    #[test]
    fn test_behaviour_deterministic_from_same_keypair() {
        let keypair = Keypair::generate_ed25519();
        let peer_id1 = PeerId::from(keypair.public());
        let peer_id2 = PeerId::from(keypair.public());
        assert_eq!(peer_id1, peer_id2, "Same keypair should give same PeerId");
    }
}
