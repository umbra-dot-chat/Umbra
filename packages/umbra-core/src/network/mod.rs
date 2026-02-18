//! # Network Module
//!
//! P2P networking layer built on libp2p.
//!
//! ## Network Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                         NETWORK STACK                                   │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                    Application Protocols                        │   │
//! │  │                                                                 │   │
//! │  │  /umbra/friends/1.0.0   - Friend request protocol              │   │
//! │  │  /umbra/messaging/1.0.0 - Message exchange protocol            │   │
//! │  │  /umbra/presence/1.0.0  - Online presence protocol             │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                              │                                          │
//! │                              ▼                                          │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                      libp2p Core                                │   │
//! │  │                                                                 │   │
//! │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │   │
//! │  │  │   Noise     │  │   Yamux     │  │     Kademlia DHT    │     │   │
//! │  │  │  Protocol   │  │   (Mux)     │  │     (Discovery)     │     │   │
//! │  │  │             │  │             │  │                     │     │   │
//! │  │  │ Encryption  │  │ Multiplexes │  │ Peer discovery and  │     │   │
//! │  │  │ handshake   │  │ streams     │  │ routing             │     │   │
//! │  │  └─────────────┘  └─────────────┘  └─────────────────────┘     │   │
//! │  │                                                                 │   │
//! │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │   │
//! │  │  │  Identify   │  │    Ping     │  │  Request-Response   │     │   │
//! │  │  │             │  │             │  │                     │     │   │
//! │  │  │ Exchange    │  │ Keepalive   │  │ RPC-style messages  │     │   │
//! │  │  │ peer info   │  │             │  │                     │     │   │
//! │  │  └─────────────┘  └─────────────┘  └─────────────────────┘     │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                              │                                          │
//! │                              ▼                                          │
//! │  ┌─────────────────────────────────────────────────────────────────┐   │
//! │  │                      Transport Layer                            │   │
//! │  │                                                                 │   │
//! │  │  Native (iOS/Android/Desktop):                                 │   │
//! │  │  • TCP                                                         │   │
//! │  │  • QUIC (when available)                                       │   │
//! │  │                                                                 │   │
//! │  │  Web (Browser):                                                │   │
//! │  │  • WebSocket                                                   │   │
//! │  │  • WebRTC (peer-to-peer)                                       │   │
//! │  │                                                                 │   │
//! │  └─────────────────────────────────────────────────────────────────┘   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```
//!
//! ## Connection Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                      PEER CONNECTION FLOW                               │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  1. Transport Connection (TCP/QUIC/WebSocket)                          │
//! │     └─► Establishes raw byte stream                                    │
//! │                                                                         │
//! │  2. Noise Handshake (XX pattern)                                       │
//! │     └─► Authenticates both peers using Ed25519 keys                    │
//! │     └─► Establishes encrypted channel                                  │
//! │                                                                         │
//! │  3. Stream Multiplexing (Yamux)                                        │
//! │     └─► Allows multiple streams over single connection                 │
//! │                                                                         │
//! │  4. Protocol Negotiation                                               │
//! │     └─► Peers agree on which protocols to use                          │
//! │                                                                         │
//! │  5. Application Protocols                                              │
//! │     └─► /umbra/messaging/1.0.0, etc.                                   │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

mod behaviour;
pub mod codec;
mod events;
pub mod file_transfer;
mod peer;
pub mod protocols;
pub mod relay_client;
#[cfg(target_arch = "wasm32")]
pub mod webrtc_transport;

pub use behaviour::UmbraBehaviour;
pub use codec::{UmbraCodec, UmbraRequest, UmbraResponse};
pub use events::NetworkEvent;
pub use file_transfer::{
    FileTransferMessage, FlowControl, SpeedTracker, TransferDirection,
    TransferEvent, TransferLimits, TransferManager, TransferSession,
    TransferState, TransportType,
};
pub use peer::{PeerInfo, PeerState};

mod event_loop;

use std::sync::Arc;
use std::time::Duration;
use parking_lot::RwLock;
use tokio::sync::{mpsc, broadcast, oneshot};

#[cfg(not(target_arch = "wasm32"))]
use tokio::task::JoinHandle;

use libp2p::{
    identity::Keypair as Libp2pKeypair,
    PeerId, Multiaddr, Swarm, SwarmBuilder,
    noise, yamux,
};

#[cfg(not(target_arch = "wasm32"))]
use libp2p::tcp;

use crate::error::{Error, Result};
use crate::crypto::KeyPair;

pub use event_loop::run_event_loop;

/// Network configuration
#[derive(Debug, Clone)]
pub struct NetworkConfig {
    /// Listen addresses (e.g., "/ip4/0.0.0.0/tcp/0")
    pub listen_addrs: Vec<String>,
    /// Bootstrap peer addresses
    pub bootstrap_peers: Vec<String>,
    /// Enable DHT for peer discovery
    pub enable_dht: bool,
    /// Enable relay for NAT traversal
    pub enable_relay: bool,
    /// Relay server URL (e.g., "wss://relay.umbra.app/ws")
    pub relay_url: Option<String>,
}

impl Default for NetworkConfig {
    fn default() -> Self {
        Self {
            listen_addrs: vec!["/ip4/0.0.0.0/tcp/0".to_string()],
            bootstrap_peers: vec![],
            enable_dht: true,
            enable_relay: false,
            relay_url: None,
        }
    }
}

/// Network service handle
///
/// This is the main interface for interacting with the P2P network.
pub struct NetworkService {
    /// Our local peer ID
    peer_id: PeerId,
    /// Our libp2p keypair (needed for swarm creation)
    libp2p_keypair: Libp2pKeypair,
    /// Network configuration
    config: NetworkConfig,
    /// Our listen addresses
    listen_addrs: Arc<RwLock<Vec<Multiaddr>>>,
    /// Connected peers
    connected_peers: Arc<RwLock<Vec<PeerInfo>>>,
    /// Command sender for the event loop
    command_tx: mpsc::Sender<NetworkCommand>,
    /// Command receiver (taken when starting the event loop)
    command_rx: Arc<RwLock<Option<mpsc::Receiver<NetworkCommand>>>>,
    /// Event broadcaster for subscribers
    event_tx: broadcast::Sender<NetworkEvent>,
    /// Is the service running?
    running: Arc<RwLock<bool>>,
    /// Handle to the event loop task (native only — WASM uses spawn_local)
    #[cfg(not(target_arch = "wasm32"))]
    event_loop_handle: Arc<RwLock<Option<JoinHandle<()>>>>,
}

/// Commands sent to the network service
pub enum NetworkCommand {
    /// Connect to a peer
    Connect(Multiaddr),
    /// Disconnect from a peer
    Disconnect(PeerId),
    /// Send a message to a peer
    SendMessage {
        /// Target peer ID
        peer_id: PeerId,
        /// Message payload
        message: Vec<u8>,
    },
    /// Find a peer on the DHT
    FindPeer {
        /// The peer ID to find
        peer_id: PeerId,
        /// Channel to send the response (addresses found)
        response_tx: Option<oneshot::Sender<Result<Vec<Multiaddr>>>>,
    },
    /// Bootstrap the DHT by querying known peers
    Bootstrap,
    /// Add a known address for a peer to the DHT
    AddPeerAddress {
        /// The peer ID
        peer_id: PeerId,
        /// The address to add
        addr: Multiaddr,
    },
    /// Shutdown the service
    Shutdown,
}

impl std::fmt::Debug for NetworkCommand {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Connect(addr) => f.debug_tuple("Connect").field(addr).finish(),
            Self::Disconnect(peer_id) => f.debug_tuple("Disconnect").field(peer_id).finish(),
            Self::SendMessage { peer_id, message } => f
                .debug_struct("SendMessage")
                .field("peer_id", peer_id)
                .field("message_len", &message.len())
                .finish(),
            Self::FindPeer { peer_id, .. } => f
                .debug_struct("FindPeer")
                .field("peer_id", peer_id)
                .finish(),
            Self::Bootstrap => write!(f, "Bootstrap"),
            Self::AddPeerAddress { peer_id, addr } => f
                .debug_struct("AddPeerAddress")
                .field("peer_id", peer_id)
                .field("addr", addr)
                .finish(),
            Self::Shutdown => write!(f, "Shutdown"),
        }
    }
}

impl NetworkService {
    /// Create a new network service
    ///
    /// Takes the user's identity keypair to derive the libp2p peer identity.
    pub async fn new(keypair: &KeyPair, config: NetworkConfig) -> Result<Self> {
        // Convert our Ed25519 signing key to libp2p format
        let libp2p_keypair = Self::convert_keypair(keypair)?;
        let peer_id = PeerId::from(libp2p_keypair.public());

        tracing::info!("Network service created with PeerId: {}", peer_id);

        // Create command channel (for sending commands to the event loop)
        let (command_tx, command_rx) = mpsc::channel(256);

        // Create event broadcast channel (for subscribers)
        let (event_tx, _) = broadcast::channel(256);

        Ok(Self {
            peer_id,
            libp2p_keypair,
            config,
            listen_addrs: Arc::new(RwLock::new(vec![])),
            connected_peers: Arc::new(RwLock::new(vec![])),
            command_tx,
            command_rx: Arc::new(RwLock::new(Some(command_rx))),
            event_tx,
            running: Arc::new(RwLock::new(false)),
            #[cfg(not(target_arch = "wasm32"))]
            event_loop_handle: Arc::new(RwLock::new(None)),
        })
    }

    /// Subscribe to network events
    ///
    /// Returns a receiver that will receive all network events.
    /// Multiple subscribers are supported.
    pub fn subscribe(&self) -> broadcast::Receiver<NetworkEvent> {
        self.event_tx.subscribe()
    }

    /// Convert our keypair to libp2p format
    fn convert_keypair(keypair: &KeyPair) -> Result<Libp2pKeypair> {
        // Get the Ed25519 secret key bytes (seed)
        let secret_bytes = keypair.signing.secret_bytes();

        // Create libp2p Ed25519 SecretKey from the seed
        // libp2p uses the 32-byte seed format
        let ed25519_secret = libp2p::identity::ed25519::SecretKey::try_from_bytes(
            secret_bytes
        ).map_err(|e| Error::InvalidKey(format!("Failed to convert keypair: {}", e)))?;

        let ed25519_keypair = libp2p::identity::ed25519::Keypair::from(ed25519_secret);

        Ok(Libp2pKeypair::from(ed25519_keypair))
    }

    /// Build the libp2p swarm (native: TCP + DNS + Tokio)
    #[cfg(not(target_arch = "wasm32"))]
    fn build_swarm(keypair: Libp2pKeypair, _config: &NetworkConfig) -> Result<Swarm<UmbraBehaviour>> {
        let peer_id = PeerId::from(keypair.public());
        let public_key = keypair.public();

        let swarm = SwarmBuilder::with_existing_identity(keypair)
            .with_tokio()
            .with_tcp(
                tcp::Config::default(),
                noise::Config::new,
                yamux::Config::default,
            )
            .map_err(|e| Error::TransportError(format!("Failed to configure TCP: {}", e)))?
            .with_dns()
            .map_err(|e| Error::TransportError(format!("Failed to configure DNS: {}", e)))?
            .with_behaviour(|_key| {
                Ok(UmbraBehaviour::new(peer_id, public_key.clone()))
            })
            .map_err(|e| Error::ProtocolError(format!("Failed to create behaviour: {}", e)))?
            .with_swarm_config(|cfg| {
                cfg.with_idle_connection_timeout(Duration::from_secs(60))
            })
            .build();

        Ok(swarm)
    }

    /// Build the libp2p swarm (WASM: wasm-bindgen + WebRTC transport)
    ///
    /// Uses our custom WebRTC transport for browser-to-browser P2P.
    /// Connections are established via out-of-band signaling (QR code /
    /// connection link exchange). The swarm provides the full libp2p
    /// protocol stack (Identify, Ping, Kademlia, Request-Response)
    /// on top of the WebRTC data channel.
    ///
    /// Returns both the swarm and a `WebRtcConnectionInjector` that must
    /// be stored separately. The injector is used by the FFI signaling
    /// functions to push completed WebRTC connections into the swarm.
    #[cfg(target_arch = "wasm32")]
    fn build_swarm(keypair: Libp2pKeypair, _config: &NetworkConfig) -> Result<(Swarm<UmbraBehaviour>, webrtc_transport::WebRtcConnectionInjector)> {
        let peer_id = PeerId::from(keypair.public());
        let public_key = keypair.public();

        let (transport, injector) = webrtc_transport::create_transport();

        let swarm = SwarmBuilder::with_existing_identity(keypair)
            .with_wasm_bindgen()
            .with_other_transport(|_key| Ok(transport))
            .expect("WebRTC transport creation is infallible")
            .with_behaviour(|_key| {
                Ok(UmbraBehaviour::new(peer_id, public_key.clone()))
            })
            .map_err(|e| Error::ProtocolError(format!("Failed to create behaviour: {}", e)))?
            .with_swarm_config(|cfg: libp2p::swarm::Config| {
                cfg.with_idle_connection_timeout(Duration::from_secs(120))
            })
            .build();

        Ok((swarm, injector))
    }

    /// Start the network service (native only — uses tokio::spawn)
    ///
    /// This creates the libp2p swarm and spawns the event loop task.
    #[cfg(not(target_arch = "wasm32"))]
    pub async fn start(&self) -> Result<()> {
        {
            let running = self.running.read();
            if *running {
                return Err(Error::ProtocolError("Network service already running".into()));
            }
        }

        tracing::info!("Network service starting...");

        // Take the command receiver (we can only start once)
        let command_rx = self.command_rx.write().take()
            .ok_or_else(|| Error::ProtocolError("Network service can only be started once".into()))?;

        // Build the swarm
        let swarm = Self::build_swarm(self.libp2p_keypair.clone(), &self.config)?;

        // Create the event loop state
        let state = event_loop::EventLoopState::new(
            self.connected_peers.clone(),
            self.listen_addrs.clone(),
        );

        // Clone necessary data for the event loop
        let event_tx = self.event_tx.clone();
        let config = self.config.clone();

        // Spawn the event loop
        let handle = tokio::spawn(async move {
            // The event loop will start listening and handle the swarm
            run_swarm_with_listeners(swarm, command_rx, event_tx, state, config).await;
        });

        // Store the handle
        *self.event_loop_handle.write() = Some(handle);
        *self.running.write() = true;

        tracing::info!("Network service started");
        Ok(())
    }

    /// Start the network service (WASM — uses wasm_bindgen_futures::spawn_local)
    ///
    /// Returns the `WebRtcConnectionInjector` which must be stored by the caller
    /// so that signaling functions can inject completed WebRTC connections into
    /// the swarm.
    #[cfg(target_arch = "wasm32")]
    pub async fn start(&self) -> Result<webrtc_transport::WebRtcConnectionInjector> {
        {
            let running = self.running.read();
            if *running {
                return Err(Error::ProtocolError("Network service already running".into()));
            }
        }

        tracing::info!("Network service starting (WASM)...");

        // Take the command receiver (we can only start once)
        let command_rx = self.command_rx.write().take()
            .ok_or_else(|| Error::ProtocolError("Network service can only be started once".into()))?;

        // Build the swarm — returns both swarm and connection injector
        let (swarm, injector) = Self::build_swarm(self.libp2p_keypair.clone(), &self.config)?;

        // Create the event loop state
        let state = event_loop::EventLoopState::new(
            self.connected_peers.clone(),
            self.listen_addrs.clone(),
        );

        let event_tx = self.event_tx.clone();
        let config = self.config.clone();

        // Spawn the event loop on the WASM micro-task queue
        wasm_bindgen_futures::spawn_local(async move {
            run_swarm_with_listeners(swarm, command_rx, event_tx, state, config).await;
        });

        *self.running.write() = true;

        tracing::info!("Network service started (WASM)");
        Ok(injector)
    }

    /// Stop the network service (native)
    #[cfg(not(target_arch = "wasm32"))]
    pub async fn stop(&self) -> Result<()> {
        {
            let running = self.running.read();
            if !*running {
                return Ok(());
            }
        }

        tracing::info!("Stopping network service...");

        // Send shutdown command
        let _ = self.command_tx.send(NetworkCommand::Shutdown).await;

        // Wait for the event loop to finish
        let handle = self.event_loop_handle.write().take();
        if let Some(handle) = handle {
            let _ = handle.await;
        }

        *self.running.write() = false;

        tracing::info!("Network service stopped");
        Ok(())
    }

    /// Stop the network service (WASM)
    #[cfg(target_arch = "wasm32")]
    pub async fn stop(&self) -> Result<()> {
        {
            let running = self.running.read();
            if !*running {
                return Ok(());
            }
        }

        tracing::info!("Stopping network service (WASM)...");

        // Send shutdown command — the spawned event loop will receive and exit
        let _ = self.command_tx.send(NetworkCommand::Shutdown).await;

        *self.running.write() = false;

        tracing::info!("Network service stopped (WASM)");
        Ok(())
    }

    /// Check if the network service is running
    pub fn is_running(&self) -> bool {
        *self.running.read()
    }

    /// Get our local peer ID
    pub fn peer_id(&self) -> PeerId {
        self.peer_id
    }

    /// Get our listen addresses
    pub fn listen_addrs(&self) -> Vec<Multiaddr> {
        self.listen_addrs.read().clone()
    }

    /// Get connected peers
    pub fn connected_peers(&self) -> Vec<PeerInfo> {
        self.connected_peers.read().clone()
    }

    /// Check if we're connected to a specific peer
    pub fn is_connected(&self, peer_id: &PeerId) -> bool {
        self.connected_peers
            .read()
            .iter()
            .any(|p| &p.peer_id == peer_id)
    }

    /// Connect to a peer by multiaddr
    pub async fn connect(&self, addr: Multiaddr) -> Result<()> {
        self.command_tx
            .send(NetworkCommand::Connect(addr))
            .await
            .map_err(|_| Error::ProtocolError("Failed to send connect command".into()))?;
        Ok(())
    }

    /// Disconnect from a peer
    pub async fn disconnect(&self, peer_id: PeerId) -> Result<()> {
        self.command_tx
            .send(NetworkCommand::Disconnect(peer_id))
            .await
            .map_err(|_| Error::ProtocolError("Failed to send disconnect command".into()))?;
        Ok(())
    }

    /// Send a message to a peer
    pub async fn send_message(&self, peer_id: PeerId, message: Vec<u8>) -> Result<()> {
        if !self.is_connected(&peer_id) {
            return Err(Error::PeerNotFound(peer_id.to_string()));
        }

        self.command_tx
            .send(NetworkCommand::SendMessage { peer_id, message })
            .await
            .map_err(|_| Error::ProtocolError("Failed to send message command".into()))?;

        Ok(())
    }

    /// Find a peer on the DHT (native only — uses tokio::time::timeout)
    ///
    /// Returns the addresses of the peer if found.
    #[cfg(not(target_arch = "wasm32"))]
    pub async fn find_peer(&self, peer_id: PeerId) -> Result<Vec<Multiaddr>> {
        let (tx, rx) = oneshot::channel();

        self.command_tx
            .send(NetworkCommand::FindPeer {
                peer_id,
                response_tx: Some(tx),
            })
            .await
            .map_err(|_| Error::ProtocolError("Failed to send find peer command".into()))?;

        // Wait for the response with a timeout
        match tokio::time::timeout(Duration::from_secs(30), rx).await {
            Ok(Ok(result)) => result,
            Ok(Err(_)) => Err(Error::DhtError("Response channel closed".into())),
            Err(_) => Err(Error::Timeout("DHT lookup timed out".into())),
        }
    }

    /// Find a peer on the DHT (WASM — no timeout, just await)
    #[cfg(target_arch = "wasm32")]
    pub async fn find_peer(&self, peer_id: PeerId) -> Result<Vec<Multiaddr>> {
        let (tx, rx) = oneshot::channel();

        self.command_tx
            .send(NetworkCommand::FindPeer {
                peer_id,
                response_tx: Some(tx),
            })
            .await
            .map_err(|_| Error::ProtocolError("Failed to send find peer command".into()))?;

        match rx.await {
            Ok(result) => result,
            Err(_) => Err(Error::DhtError("Response channel closed".into())),
        }
    }

    /// Bootstrap the DHT
    pub async fn bootstrap(&self) -> Result<()> {
        self.command_tx
            .send(NetworkCommand::Bootstrap)
            .await
            .map_err(|_| Error::ProtocolError("Failed to send bootstrap command".into()))?;
        Ok(())
    }

    /// Add a known address for a peer
    pub async fn add_peer_address(&self, peer_id: PeerId, addr: Multiaddr) -> Result<()> {
        self.command_tx
            .send(NetworkCommand::AddPeerAddress { peer_id, addr })
            .await
            .map_err(|_| Error::ProtocolError("Failed to send add peer address command".into()))?;
        Ok(())
    }
}

/// Helper function to set up listeners and run the event loop
async fn run_swarm_with_listeners(
    mut swarm: Swarm<UmbraBehaviour>,
    command_rx: mpsc::Receiver<NetworkCommand>,
    event_tx: broadcast::Sender<NetworkEvent>,
    state: event_loop::EventLoopState,
    config: NetworkConfig,
) {
    // Start listening on configured addresses
    for addr_str in &config.listen_addrs {
        match addr_str.parse::<Multiaddr>() {
            Ok(addr) => {
                match swarm.listen_on(addr.clone()) {
                    Ok(_) => {
                        tracing::info!("Listening on: {}", addr);
                    }
                    Err(e) => {
                        tracing::error!("Failed to listen on {}: {}", addr, e);
                    }
                }
            }
            Err(e) => {
                tracing::error!("Invalid listen address '{}': {}", addr_str, e);
            }
        }
    }

    // On WASM, start a WebRTC "listener" so the swarm polls our transport.
    // Without this, Transport::poll() is never called and injected
    // connections are never picked up by the swarm.
    #[cfg(target_arch = "wasm32")]
    {
        let webrtc_addr: Multiaddr = "/memory/0".parse()
            .expect("/memory/0 is a valid multiaddr");
        match swarm.listen_on(webrtc_addr) {
            Ok(_) => tracing::info!("WebRTC transport listener started"),
            Err(e) => tracing::error!("Failed to start WebRTC listener: {}", e),
        }
    }

    // Add bootstrap peers to the DHT
    for peer_str in &config.bootstrap_peers {
        if let Ok(addr) = peer_str.parse::<Multiaddr>() {
            // Extract peer ID from the address if possible
            if let Some(libp2p::multiaddr::Protocol::P2p(peer_id)) = addr.iter().last() {
                swarm.behaviour_mut().add_peer(peer_id, vec![addr.clone()]);
                tracing::debug!("Added bootstrap peer: {}", peer_id);
            }
        }
    }

    // Bootstrap the DHT if enabled and we have peers
    if config.enable_dht && !config.bootstrap_peers.is_empty() {
        match swarm.behaviour_mut().bootstrap() {
            Ok(_) => tracing::debug!("DHT bootstrap initiated"),
            Err(e) => tracing::warn!("Failed to initiate DHT bootstrap: {:?}", e),
        }
    }

    // Run the event loop
    event_loop::run_event_loop(swarm, command_rx, event_tx, state).await;
}

/// Convert a DID to a PeerId
///
/// DIDs are derived from Ed25519 public keys, so we can extract the public key
/// and create a PeerId from it.
pub fn did_to_peer_id(did: &str) -> Result<PeerId> {
    use crate::identity::Did;

    let did = Did::parse(did)?;
    let public_key_bytes = did.public_key()?;

    let ed25519_pubkey = libp2p::identity::ed25519::PublicKey::try_from_bytes(&public_key_bytes)
        .map_err(|e| Error::InvalidKey(format!("Invalid public key: {}", e)))?;

    let libp2p_pubkey = libp2p::identity::PublicKey::from(ed25519_pubkey);

    Ok(PeerId::from(libp2p_pubkey))
}

/// Convert a PeerId to a DID
///
/// This only works for Ed25519-based PeerIds.
pub fn peer_id_to_did(_peer_id: &PeerId) -> Result<String> {
    // PeerId encoding: <multihash of public key>
    // For Ed25519: identity hash (no hashing, raw key)
    // We need to extract the public key from the PeerId

    // This is a bit tricky because PeerId doesn't directly expose the public key
    // We would need the full peer info from the Identify protocol

    // For now, return an error indicating this requires the Identify protocol
    Err(Error::InvalidDid(
        "Converting PeerId to DID requires Identify protocol data".into()
    ))
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_config_default() {
        let config = NetworkConfig::default();
        assert!(!config.listen_addrs.is_empty());
        assert!(config.enable_dht);
    }

    #[tokio::test]
    async fn test_network_service_creation() {
        let seed = [1u8; 32];
        let keypair = KeyPair::from_seed(&seed).unwrap();
        let config = NetworkConfig::default();

        let service = NetworkService::new(&keypair, config).await.unwrap();

        // Verify PeerId is deterministic from keypair
        let service2 = NetworkService::new(&keypair, NetworkConfig::default()).await.unwrap();
        assert_eq!(service.peer_id(), service2.peer_id());
    }

    #[test]
    fn test_did_to_peer_id() {
        use crate::identity::Identity;

        let (identity, _) = Identity::create("Test".to_string()).unwrap();
        let did = identity.did_string();

        let peer_id = did_to_peer_id(&did).unwrap();

        // PeerId should be derived from the same public key
        assert!(!peer_id.to_string().is_empty());
    }

    #[test]
    fn test_did_to_peer_id_deterministic() {
        use crate::identity::Identity;

        let (identity, _) = Identity::create("Alice".to_string()).unwrap();
        let did = identity.did_string();

        let peer_id1 = did_to_peer_id(&did).unwrap();
        let peer_id2 = did_to_peer_id(&did).unwrap();

        assert_eq!(peer_id1, peer_id2, "Same DID should always produce same PeerId");
    }

    #[test]
    fn test_did_to_peer_id_different_identities() {
        use crate::identity::Identity;

        let (identity1, _) = Identity::create("Alice".to_string()).unwrap();
        let (identity2, _) = Identity::create("Bob".to_string()).unwrap();

        let peer_id1 = did_to_peer_id(&identity1.did_string()).unwrap();
        let peer_id2 = did_to_peer_id(&identity2.did_string()).unwrap();

        assert_ne!(peer_id1, peer_id2, "Different identities should have different PeerIds");
    }

    #[test]
    fn test_did_to_peer_id_invalid_did() {
        let result = did_to_peer_id("not-a-valid-did");
        assert!(result.is_err(), "Invalid DID should return error");
    }

    #[test]
    fn test_peer_id_to_did_returns_error() {
        // Current implementation returns an error
        let peer_id = PeerId::random();
        let result = peer_id_to_did(&peer_id);
        assert!(result.is_err());
    }

    #[test]
    fn test_network_config_custom() {
        let config = NetworkConfig {
            listen_addrs: vec![
                "/ip4/0.0.0.0/tcp/8080".to_string(),
                "/ip4/0.0.0.0/tcp/8081".to_string(),
            ],
            bootstrap_peers: vec![
                "/ip4/1.2.3.4/tcp/4001/p2p/12D3KooWExample".to_string(),
            ],
            enable_dht: false,
            enable_relay: true,
            relay_url: Some("wss://relay.umbra.app/ws".to_string()),
        };

        assert_eq!(config.listen_addrs.len(), 2);
        assert_eq!(config.bootstrap_peers.len(), 1);
        assert!(!config.enable_dht);
        assert!(config.enable_relay);
    }

    #[tokio::test]
    async fn test_network_service_not_running_initially() {
        let seed = [42u8; 32];
        let keypair = KeyPair::from_seed(&seed).unwrap();
        let config = NetworkConfig::default();

        let service = NetworkService::new(&keypair, config).await.unwrap();

        assert!(!service.is_running());
        assert!(service.connected_peers().is_empty());
        assert!(service.listen_addrs().is_empty());
    }

    #[tokio::test]
    async fn test_network_service_peer_id_from_keypair() {
        let seed = [7u8; 32];
        let keypair = KeyPair::from_seed(&seed).unwrap();

        let service = NetworkService::new(&keypair, NetworkConfig::default()).await.unwrap();

        // PeerId should be deterministic from the seed
        let peer_id = service.peer_id();
        assert!(!peer_id.to_string().is_empty());

        // Creating another service with the same keypair should give the same peer ID
        let service2 = NetworkService::new(&keypair, NetworkConfig::default()).await.unwrap();
        assert_eq!(service.peer_id(), service2.peer_id());
    }

    #[tokio::test]
    async fn test_network_service_subscribe() {
        let seed = [99u8; 32];
        let keypair = KeyPair::from_seed(&seed).unwrap();

        let service = NetworkService::new(&keypair, NetworkConfig::default()).await.unwrap();

        // Should be able to subscribe multiple times
        let _rx1 = service.subscribe();
        let _rx2 = service.subscribe();
    }

    #[tokio::test]
    async fn test_network_service_is_not_connected_to_random_peer() {
        let seed = [11u8; 32];
        let keypair = KeyPair::from_seed(&seed).unwrap();

        let service = NetworkService::new(&keypair, NetworkConfig::default()).await.unwrap();

        let random_peer = PeerId::random();
        assert!(!service.is_connected(&random_peer));
    }
}
