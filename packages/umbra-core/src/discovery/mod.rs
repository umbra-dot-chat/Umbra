//! # Discovery Module
//!
//! Peer discovery and presence management for the Umbra P2P network.
//!
//! ## Discovery Methods
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                       DISCOVERY METHODS                                 │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  1. Bootstrap Nodes                                                    │
//! │  ─────────────────────                                                  │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  Hardcoded list of reliable nodes for initial connection   │       │
//! │  │                                                             │       │
//! │  │  App Start → Connect to bootstrap → Join DHT network       │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  2. DHT (Kademlia) Lookup                                              │
//! │  ──────────────────────────                                             │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  Query: DID → PeerId + Multiaddresses                      │       │
//! │  │                                                             │       │
//! │  │  Process:                                                  │       │
//! │  │  1. Parse DID to extract Ed25519 public key               │       │
//! │  │  2. Convert public key to PeerId                          │       │
//! │  │  3. Query DHT for peer's addresses                        │       │
//! │  │  4. Return connection info for direct connection          │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  3. Direct Connection (QR Code / Link)                                 │
//! │  ─────────────────────────────────────                                  │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  User A generates connection info:                         │       │
//! │  │  {                                                         │       │
//! │  │    "did": "did:key:z6Mk...",                               │       │
//! │  │    "peer_id": "12D3Koo...",                                │       │
//! │  │    "addrs": ["/ip4/1.2.3.4/tcp/4001"],                     │       │
//! │  │    "display_name": "Alice"                                 │       │
//! │  │  }                                                         │       │
//! │  │                                                             │       │
//! │  │  User B scans QR / opens link → Connects directly          │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! │  [Future] 4. mDNS (Local Network)                                      │
//! │  ─────────────────────────────────                                      │
//! │  ┌─────────────────────────────────────────────────────────────┐       │
//! │  │                                                             │       │
//! │  │  Discover peers on the same local network                  │       │
//! │  │  without internet access                                   │       │
//! │  │                                                             │       │
//! │  └─────────────────────────────────────────────────────────────┘       │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Connection Info Format
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                    CONNECTION INFO STRUCTURE                            │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ConnectionInfo (JSON-serializable for QR/links)                       │
//! │  ───────────────────────────────────────────────                        │
//! │  {                                                                      │
//! │    "version": 1,                    // Protocol version                 │
//! │    "did": "did:key:z6Mk...",        // User's DID                       │
//! │    "peer_id": "12D3Koo...",         // libp2p PeerId                    │
//! │    "addresses": [                   // Where to reach them              │
//! │      "/ip4/192.168.1.100/tcp/4001",                                     │
//! │      "/ip4/1.2.3.4/tcp/4001"                                            │
//! │    ],                                                                   │
//! │    "display_name": "Alice",         // Human-readable name              │
//! │    "timestamp": 1704067200          // When generated (for expiry)      │
//! │  }                                                                      │
//! │                                                                         │
//! │  Encoding options:                                                      │
//! │  • JSON → Base64 URL-safe for links                                    │
//! │  • JSON → QR code                                                       │
//! │  • Compact binary → smaller QR                                          │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## DHT Announcement
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      DHT ANNOUNCEMENT FLOW                              │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  When a user comes online:                                              │
//! │                                                                         │
//! │  1. Connect to bootstrap nodes                                          │
//! │     └─► Establishes initial DHT connectivity                            │
//! │                                                                         │
//! │  2. Bootstrap DHT routing table                                         │
//! │     └─► Discovers nearby peers in keyspace                              │
//! │                                                                         │
//! │  3. Announce presence (provide record)                                  │
//! │     └─► Key: SHA256(DID)                                                │
//! │     └─► Value: PeerId + Current addresses                               │
//! │                                                                         │
//! │  4. Periodic re-announcement                                            │
//! │     └─► Every 30 minutes to stay discoverable                           │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use libp2p::{Multiaddr, PeerId};
use parking_lot::RwLock;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::str::FromStr;
use std::sync::Arc;

use crate::error::{Error, Result};
use crate::identity::{Did, Identity};
use crate::network::{did_to_peer_id, NetworkService};

/// Current connection info protocol version
pub const CONNECTION_INFO_VERSION: u8 = 1;

/// Default DHT record TTL (24 hours in seconds)
pub const DHT_RECORD_TTL_SECS: u64 = 24 * 60 * 60;

/// Re-announcement interval (30 minutes in seconds)
pub const REANNOUNCE_INTERVAL_SECS: u64 = 30 * 60;

/// Configuration for the discovery service
#[derive(Debug, Clone)]
pub struct DiscoveryConfig {
    /// Bootstrap nodes to connect to
    pub bootstrap_nodes: Vec<String>,
    /// Enable DHT-based discovery
    pub enable_dht: bool,
    /// Enable mDNS for local discovery (future)
    pub enable_mdns: bool,
    /// Auto-announce presence on DHT
    pub auto_announce: bool,
}

impl Default for DiscoveryConfig {
    fn default() -> Self {
        Self {
            bootstrap_nodes: vec![],
            enable_dht: true,
            enable_mdns: false,
            auto_announce: true,
        }
    }
}

/// Connection information for sharing via QR code or link
///
/// This contains everything needed to connect to a peer directly
/// without requiring DHT lookup.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionInfo {
    /// Protocol version for forward compatibility
    pub version: u8,
    /// User's DID
    pub did: String,
    /// libp2p PeerId (base58 encoded)
    pub peer_id: String,
    /// Multiaddresses where the peer can be reached
    pub addresses: Vec<String>,
    /// Human-readable display name
    pub display_name: String,
    /// When this info was generated (Unix timestamp)
    pub timestamp: i64,
}

impl ConnectionInfo {
    /// Create connection info from an identity and network service
    pub fn from_identity(identity: &Identity, network: &NetworkService) -> Self {
        Self {
            version: CONNECTION_INFO_VERSION,
            did: identity.did_string(),
            peer_id: network.peer_id().to_string(),
            addresses: network
                .listen_addrs()
                .iter()
                .map(|a| a.to_string())
                .collect(),
            display_name: identity.profile().display_name.clone(),
            timestamp: crate::time::now_timestamp(),
        }
    }

    /// Create connection info manually (for testing or offline generation)
    pub fn new(did: String, peer_id: String, addresses: Vec<String>, display_name: String) -> Self {
        Self {
            version: CONNECTION_INFO_VERSION,
            did,
            peer_id,
            addresses,
            display_name,
            timestamp: crate::time::now_timestamp(),
        }
    }

    /// Encode to JSON string
    pub fn to_json(&self) -> Result<String> {
        serde_json::to_string(self).map_err(|e| Error::SerializationError(e.to_string()))
    }

    /// Encode to URL-safe base64 (for sharing links)
    pub fn to_base64(&self) -> Result<String> {
        let json = self.to_json()?;
        Ok(URL_SAFE_NO_PAD.encode(json.as_bytes()))
    }

    /// Decode from JSON string
    pub fn from_json(json: &str) -> Result<Self> {
        serde_json::from_str(json).map_err(|e| Error::DeserializationError(e.to_string()))
    }

    /// Decode from URL-safe base64
    pub fn from_base64(encoded: &str) -> Result<Self> {
        let decoded = URL_SAFE_NO_PAD
            .decode(encoded)
            .map_err(|e| Error::DeserializationError(format!("Invalid base64: {}", e)))?;

        let json = String::from_utf8(decoded)
            .map_err(|e| Error::DeserializationError(format!("Invalid UTF-8: {}", e)))?;

        Self::from_json(&json)
    }

    /// Generate a shareable link (umbra:// protocol)
    pub fn to_link(&self) -> Result<String> {
        let encoded = self.to_base64()?;
        Ok(format!("umbra://connect/{}", encoded))
    }

    /// Parse a shareable link
    pub fn from_link(link: &str) -> Result<Self> {
        const PREFIX: &str = "umbra://connect/";

        if !link.starts_with(PREFIX) {
            return Err(Error::DeserializationError(
                "Invalid link format: must start with 'umbra://connect/'".into(),
            ));
        }

        let encoded = &link[PREFIX.len()..];
        Self::from_base64(encoded)
    }

    /// Validate the connection info
    pub fn validate(&self) -> Result<()> {
        // Check version
        if self.version != CONNECTION_INFO_VERSION {
            return Err(Error::ProtocolError(format!(
                "Unsupported connection info version: {} (expected {})",
                self.version, CONNECTION_INFO_VERSION
            )));
        }

        // Validate DID format
        Did::parse(&self.did)?;

        // Validate PeerId format
        PeerId::from_str(&self.peer_id)
            .map_err(|e| Error::InvalidKey(format!("Invalid PeerId: {}", e)))?;

        // Validate addresses
        for addr in &self.addresses {
            addr.parse::<Multiaddr>().map_err(|e| {
                Error::ProtocolError(format!("Invalid multiaddr '{}': {}", addr, e))
            })?;
        }

        Ok(())
    }

    /// Get the PeerId as a libp2p type
    pub fn peer_id_parsed(&self) -> Result<PeerId> {
        PeerId::from_str(&self.peer_id)
            .map_err(|e| Error::InvalidKey(format!("Invalid PeerId: {}", e)))
    }

    /// Get parsed multiaddresses
    pub fn addresses_parsed(&self) -> Result<Vec<Multiaddr>> {
        self.addresses
            .iter()
            .map(|a| {
                a.parse::<Multiaddr>()
                    .map_err(|e| Error::ProtocolError(format!("Invalid multiaddr: {}", e)))
            })
            .collect()
    }

    /// Check if this connection info has expired
    pub fn is_expired(&self, max_age_secs: i64) -> bool {
        let now = crate::time::now_timestamp();
        (now - self.timestamp) > max_age_secs
    }
}

/// Peer information discovered via DHT or direct connection
#[derive(Debug, Clone)]
pub struct DiscoveredPeer {
    /// The peer's DID
    pub did: String,
    /// libp2p PeerId
    pub peer_id: PeerId,
    /// Known addresses for this peer
    pub addresses: Vec<Multiaddr>,
    /// Display name (if known)
    pub display_name: Option<String>,
    /// When this peer was discovered
    pub discovered_at: i64,
    /// How this peer was discovered
    pub source: DiscoverySource,
}

/// How a peer was discovered
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DiscoverySource {
    /// Discovered via DHT lookup
    Dht,
    /// Direct connection info (QR/link)
    Direct,
    /// Local network mDNS
    Mdns,
    /// Bootstrap node
    Bootstrap,
}

/// Discovery service for finding and announcing peers
pub struct DiscoveryService {
    /// Configuration
    config: DiscoveryConfig,
    /// Network service reference
    network: Arc<NetworkService>,
    /// Our identity
    identity: Arc<Identity>,
    /// Recently discovered peers
    discovered_peers: Arc<RwLock<Vec<DiscoveredPeer>>>,
    /// Is the service running?
    running: Arc<RwLock<bool>>,
}

impl DiscoveryService {
    /// Create a new discovery service
    pub fn new(
        identity: Arc<Identity>,
        network: Arc<NetworkService>,
        config: DiscoveryConfig,
    ) -> Self {
        Self {
            config,
            network,
            identity,
            discovered_peers: Arc::new(RwLock::new(Vec::new())),
            running: Arc::new(RwLock::new(false)),
        }
    }

    /// Start the discovery service
    pub async fn start(&self) -> Result<()> {
        {
            let mut running = self.running.write();
            if *running {
                return Err(Error::ProtocolError(
                    "Discovery service already running".into(),
                ));
            }
            *running = true;
        }

        tracing::info!("Discovery service starting...");

        // Connect to bootstrap nodes
        for addr_str in &self.config.bootstrap_nodes {
            match addr_str.parse::<Multiaddr>() {
                Ok(addr) => {
                    tracing::info!("Connecting to bootstrap node: {}", addr);
                    if let Err(e) = self.network.connect(addr).await {
                        tracing::warn!("Failed to connect to bootstrap node: {}", e);
                    }
                }
                Err(e) => {
                    tracing::warn!("Invalid bootstrap address '{}': {}", addr_str, e);
                }
            }
        }

        tracing::info!("Discovery service started");
        Ok(())
    }

    /// Stop the discovery service
    pub async fn stop(&self) -> Result<()> {
        let mut running = self.running.write();
        if !*running {
            return Ok(());
        }
        *running = false;

        tracing::info!("Discovery service stopped");
        Ok(())
    }

    /// Generate connection info for sharing
    pub fn generate_connection_info(&self) -> ConnectionInfo {
        ConnectionInfo::from_identity(&self.identity, &self.network)
    }

    /// Lookup a peer by DID via DHT
    ///
    /// This queries the DHT for a peer's connection information.
    pub async fn lookup_peer(&self, did: &str) -> Result<Option<DiscoveredPeer>> {
        // Parse and validate the DID
        let _parsed_did = Did::parse(did)?;

        // Convert DID to PeerId
        let peer_id = did_to_peer_id(did)?;

        tracing::debug!("Looking up peer: {} -> {}", did, peer_id);

        // Check if we already have this peer cached
        {
            let peers = self.discovered_peers.read();
            if let Some(peer) = peers.iter().find(|p| p.did == did) {
                // Return cached result if not too old (5 minutes)
                let now = crate::time::now_timestamp();
                if (now - peer.discovered_at) < 300 {
                    tracing::debug!("Returning cached peer info for {}", did);
                    return Ok(Some(peer.clone()));
                }
            }
        }

        tracing::info!("Performing DHT lookup for {} (PeerId: {})", did, peer_id);

        // Query the DHT through the network service
        match self.network.find_peer(peer_id).await {
            Ok(addresses) => {
                if addresses.is_empty() {
                    tracing::debug!("No addresses found for peer {}", peer_id);
                    return Ok(None);
                }

                tracing::info!("Found {} addresses for peer {}", addresses.len(), peer_id);

                let peer = DiscoveredPeer {
                    did: did.to_string(),
                    peer_id,
                    addresses: addresses.clone(),
                    display_name: None,
                    discovered_at: crate::time::now_timestamp(),
                    source: DiscoverySource::Dht,
                };

                // Cache the discovered peer
                self.discovered_peers.write().push(peer.clone());

                Ok(Some(peer))
            }
            Err(Error::Timeout(_)) => {
                tracing::debug!("DHT lookup timed out for {}", did);
                Ok(None)
            }
            Err(e) => {
                tracing::warn!("DHT lookup failed for {}: {}", did, e);
                Err(e)
            }
        }
    }

    /// Connect to a peer using connection info
    pub async fn connect_with_info(&self, info: &ConnectionInfo) -> Result<DiscoveredPeer> {
        // Validate the connection info
        info.validate()?;

        let peer_id = info.peer_id_parsed()?;
        let addresses = info.addresses_parsed()?;

        tracing::info!(
            "Connecting to {} ({}) via {} addresses",
            info.display_name,
            peer_id,
            addresses.len()
        );

        // Try each address
        let mut last_error = None;
        for addr in &addresses {
            match self.network.connect(addr.clone()).await {
                Ok(_) => {
                    let peer = DiscoveredPeer {
                        did: info.did.clone(),
                        peer_id,
                        addresses: addresses.clone(),
                        display_name: Some(info.display_name.clone()),
                        discovered_at: crate::time::now_timestamp(),
                        source: DiscoverySource::Direct,
                    };

                    // Cache the peer
                    self.discovered_peers.write().push(peer.clone());

                    return Ok(peer);
                }
                Err(e) => {
                    tracing::debug!("Failed to connect via {}: {}", addr, e);
                    last_error = Some(e);
                }
            }
        }

        Err(last_error.unwrap_or_else(|| Error::ConnectionFailed("No addresses to try".into())))
    }

    /// Get all discovered peers
    pub fn discovered_peers(&self) -> Vec<DiscoveredPeer> {
        self.discovered_peers.read().clone()
    }

    /// Clear discovered peers cache
    pub fn clear_cache(&self) {
        self.discovered_peers.write().clear();
    }

    /// Compute DHT key for a DID
    ///
    /// We use SHA256(DID) as the DHT key for announcing/looking up peers.
    pub fn did_to_dht_key(did: &str) -> [u8; 32] {
        let mut hasher = Sha256::new();
        hasher.update(did.as_bytes());
        hasher.finalize().into()
    }

    /// Check if the service is running
    pub fn is_running(&self) -> bool {
        *self.running.read()
    }
}

/// Helper to parse a connection link and extract connection info
pub fn parse_connection_link(link: &str) -> Result<ConnectionInfo> {
    ConnectionInfo::from_link(link)
}

/// Helper to generate a connection link from an identity and network
pub fn generate_connection_link(identity: &Identity, network: &NetworkService) -> Result<String> {
    let info = ConnectionInfo::from_identity(identity, network);
    info.to_link()
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_connection_info() -> ConnectionInfo {
        ConnectionInfo::new(
            "did:key:z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5Y5yCCpREH5Y5yC".to_string(),
            "12D3KooWGzh7bPVdRtQKDyNJrCwANqgBQxmXLCqf7MBwxwGE1234".to_string(),
            vec!["/ip4/192.168.1.100/tcp/4001".to_string()],
            "Alice".to_string(),
        )
    }

    #[test]
    fn test_connection_info_json_roundtrip() {
        let info = create_test_connection_info();

        let json = info.to_json().unwrap();
        let restored = ConnectionInfo::from_json(&json).unwrap();

        assert_eq!(info.did, restored.did);
        assert_eq!(info.peer_id, restored.peer_id);
        assert_eq!(info.display_name, restored.display_name);
    }

    #[test]
    fn test_connection_info_base64_roundtrip() {
        let info = create_test_connection_info();

        let encoded = info.to_base64().unwrap();
        let restored = ConnectionInfo::from_base64(&encoded).unwrap();

        assert_eq!(info.did, restored.did);
        assert_eq!(info.peer_id, restored.peer_id);
    }

    #[test]
    fn test_connection_info_link_roundtrip() {
        let info = create_test_connection_info();

        let link = info.to_link().unwrap();
        assert!(link.starts_with("umbra://connect/"));

        let restored = ConnectionInfo::from_link(&link).unwrap();
        assert_eq!(info.did, restored.did);
    }

    #[test]
    fn test_connection_info_invalid_link() {
        let result = ConnectionInfo::from_link("https://example.com/invalid");
        assert!(result.is_err());
    }

    #[test]
    fn test_connection_info_expiry() {
        let mut info = create_test_connection_info();

        // Not expired with recent timestamp
        assert!(!info.is_expired(3600));

        // Set old timestamp
        info.timestamp = crate::time::now_timestamp() - 7200; // 2 hours ago
        assert!(info.is_expired(3600)); // Expired after 1 hour
    }

    #[test]
    fn test_did_to_dht_key_deterministic() {
        let did = "did:key:z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5Y5yC";

        let key1 = DiscoveryService::did_to_dht_key(did);
        let key2 = DiscoveryService::did_to_dht_key(did);

        assert_eq!(key1, key2);
    }

    #[test]
    fn test_did_to_dht_key_different_dids() {
        let did1 = "did:key:z6MkhaXgBZDvotDUGRy7K9L7M2yvCpREH5Y5yC";
        let did2 = "did:key:z6MknGc3ocHs3zdPiJbnaaqDi58NGb4pk1Sp";

        let key1 = DiscoveryService::did_to_dht_key(did1);
        let key2 = DiscoveryService::did_to_dht_key(did2);

        assert_ne!(key1, key2);
    }

    #[test]
    fn test_discovery_config_default() {
        let config = DiscoveryConfig::default();

        assert!(config.bootstrap_nodes.is_empty());
        assert!(config.enable_dht);
        assert!(!config.enable_mdns);
        assert!(config.auto_announce);
    }

    #[test]
    fn test_discovery_source_serialization() {
        let source = DiscoverySource::Dht;
        let json = serde_json::to_string(&source).unwrap();
        assert_eq!(json, "\"Dht\"");

        let restored: DiscoverySource = serde_json::from_str(&json).unwrap();
        assert_eq!(restored, DiscoverySource::Dht);
    }

    #[test]
    fn test_connection_info_version() {
        let info = create_test_connection_info();
        assert_eq!(info.version, CONNECTION_INFO_VERSION);
    }
}
