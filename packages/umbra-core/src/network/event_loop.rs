//! # Network Event Loop
//!
//! The core event loop that drives the libp2p swarm.
//!
//! ## Event Loop Architecture
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                        EVENT LOOP                                       │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  ┌─────────────────┐                    ┌─────────────────────────┐    │
//! │  │  Command Rx     │───────────────────►│                         │    │
//! │  │  (from app)     │                    │                         │    │
//! │  └─────────────────┘                    │       Event Loop        │    │
//! │                                          │                         │    │
//! │  ┌─────────────────┐                    │  tokio::select! {       │    │
//! │  │  Swarm Events   │───────────────────►│    command = rx.recv()  │    │
//! │  │  (from network) │                    │    event = swarm.next() │    │
//! │  └─────────────────┘                    │  }                      │    │
//! │                                          │                         │    │
//! │                                          └───────────┬─────────────┘    │
//! │                                                      │                  │
//! │                                                      ▼                  │
//! │                                          ┌─────────────────────────┐    │
//! │                                          │  Event Broadcaster     │    │
//! │                                          │  (to subscribers)      │    │
//! │                                          └─────────────────────────┘    │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use std::collections::HashMap;
use std::sync::Arc;
use parking_lot::RwLock;
use tokio::sync::{mpsc, broadcast, oneshot};
use futures::StreamExt;

use libp2p::{
    swarm::SwarmEvent,
    identify, kad, ping,
    request_response,
    PeerId, Multiaddr, Swarm,
};

use crate::error::{Error, Result};
use super::{
    UmbraBehaviour, NetworkEvent, NetworkCommand, PeerInfo,
    codec::{UmbraRequest, UmbraResponse},
    protocols::{MessageResponse, MessageDeliveryStatus, FriendResponse, FriendResponseStatus},
};

/// Shared state for the event loop
pub struct EventLoopState {
    /// Connected peers
    pub connected_peers: Arc<RwLock<Vec<PeerInfo>>>,
    /// Listen addresses
    pub listen_addrs: Arc<RwLock<Vec<Multiaddr>>>,
    /// Pending DHT queries (query_id -> response channel)
    pub pending_queries: HashMap<kad::QueryId, oneshot::Sender<Result<Vec<Multiaddr>>>>,
    /// Addresses discovered for peers (before we have full info)
    pub discovered_addrs: HashMap<PeerId, Vec<Multiaddr>>,
}

impl EventLoopState {
    /// Create new event loop state
    pub fn new(
        connected_peers: Arc<RwLock<Vec<PeerInfo>>>,
        listen_addrs: Arc<RwLock<Vec<Multiaddr>>>,
    ) -> Self {
        Self {
            connected_peers,
            listen_addrs,
            pending_queries: HashMap::new(),
            discovered_addrs: HashMap::new(),
        }
    }
}

/// Run the network event loop
///
/// This function drives the libp2p swarm and handles:
/// - Commands from the application (connect, disconnect, send message, etc.)
/// - Events from the swarm (connections, messages, DHT updates)
///
/// # Arguments
/// * `swarm` - The libp2p swarm to drive
/// * `command_rx` - Channel to receive commands from the application
/// * `event_tx` - Broadcast channel to send events to subscribers
/// * `state` - Shared state for tracking peers and addresses
pub async fn run_event_loop(
    mut swarm: Swarm<UmbraBehaviour>,
    mut command_rx: mpsc::Receiver<NetworkCommand>,
    event_tx: broadcast::Sender<NetworkEvent>,
    mut state: EventLoopState,
) {
    tracing::info!("Network event loop starting");

    loop {
        tokio::select! {
            // Handle commands from the application
            command = command_rx.recv() => {
                match command {
                    Some(cmd) => {
                        let should_continue = handle_command(
                            cmd,
                            &mut swarm,
                            &event_tx,
                            &mut state,
                        ).await;

                        if !should_continue {
                            tracing::info!("Shutdown command received, exiting event loop");
                            break;
                        }
                    }
                    None => {
                        tracing::info!("Command channel closed, exiting event loop");
                        break;
                    }
                }
            }

            // Handle events from the swarm
            event = swarm.select_next_some() => {
                handle_swarm_event(event, &mut swarm, &event_tx, &mut state).await;
            }
        }
    }

    tracing::info!("Network event loop stopped");
}

/// Handle a command from the application
///
/// Returns `false` if the event loop should stop (shutdown command).
async fn handle_command(
    command: NetworkCommand,
    swarm: &mut Swarm<UmbraBehaviour>,
    event_tx: &broadcast::Sender<NetworkEvent>,
    state: &mut EventLoopState,
) -> bool {
    tracing::debug!("Handling command: {:?}", command);

    match command {
        NetworkCommand::Connect(addr) => {
            tracing::info!("Dialing address: {}", addr);
            if let Err(e) = swarm.dial(addr.clone()) {
                tracing::error!("Failed to dial {}: {}", addr, e);
                let _ = event_tx.send(NetworkEvent::ConnectionFailed {
                    peer_id: None,
                    address: addr,
                    error: e.to_string(),
                });
            }
        }

        NetworkCommand::Disconnect(peer_id) => {
            tracing::info!("Disconnecting from peer: {}", peer_id);
            let _ = swarm.disconnect_peer_id(peer_id);
        }

        NetworkCommand::SendMessage { peer_id, message } => {
            // Deserialize the message bytes into an UmbraRequest and send via request-response
            match bincode::deserialize::<UmbraRequest>(&message) {
                Ok(request) => {
                    tracing::debug!("Sending request to peer {}: {:?}", peer_id, std::mem::discriminant(&request));
                    let _request_id = swarm.behaviour_mut().send_request(&peer_id, request);
                }
                Err(e) => {
                    tracing::error!("Failed to deserialize outbound message: {}", e);
                    let _ = event_tx.send(NetworkEvent::MessageFailed {
                        peer_id,
                        message_id: "deserialization-error".to_string(),
                        error: format!("Failed to deserialize message: {}", e),
                    });
                }
            }
        }

        NetworkCommand::FindPeer { peer_id, response_tx } => {
            tracing::info!("Finding peer: {}", peer_id);
            let query_id = swarm.behaviour_mut().find_peer(peer_id);
            if let Some(tx) = response_tx {
                state.pending_queries.insert(query_id, tx);
            }
        }

        NetworkCommand::Bootstrap => {
            tracing::info!("Bootstrapping DHT");
            match swarm.behaviour_mut().bootstrap() {
                Ok(query_id) => {
                    tracing::debug!("Bootstrap query started: {:?}", query_id);
                }
                Err(e) => {
                    tracing::warn!("Failed to bootstrap: {:?}", e);
                }
            }
        }

        NetworkCommand::AddPeerAddress { peer_id, addr } => {
            tracing::debug!("Adding address for peer {}: {}", peer_id, addr);
            swarm.behaviour_mut().add_peer(peer_id, vec![addr]);
        }

        NetworkCommand::Shutdown => {
            tracing::info!("Shutdown requested");
            return false;
        }
    }

    true
}

/// Handle a swarm event from the network
async fn handle_swarm_event(
    event: SwarmEvent<super::behaviour::UmbraBehaviourEvent>,
    swarm: &mut Swarm<UmbraBehaviour>,
    event_tx: &broadcast::Sender<NetworkEvent>,
    state: &mut EventLoopState,
) {
    match event {
        // ====================================================================
        // Connection Events
        // ====================================================================
        SwarmEvent::NewListenAddr { address, .. } => {
            tracing::info!("Listening on: {}", address);
            state.listen_addrs.write().push(address.clone());
            let _ = event_tx.send(NetworkEvent::Listening { address });
        }

        SwarmEvent::ConnectionEstablished {
            peer_id,
            endpoint,
            num_established,
            ..
        } => {
            let addr = endpoint.get_remote_address().clone();
            tracing::info!(
                "Connected to {} via {} (connections: {})",
                peer_id,
                addr,
                num_established
            );

            // Add to connected peers if this is the first connection
            if num_established.get() == 1 {
                let peer_info = PeerInfo::connected(peer_id, vec![addr.clone()]);
                state.connected_peers.write().push(peer_info);
            }

            let _ = event_tx.send(NetworkEvent::PeerConnected {
                peer_id,
                addresses: vec![addr],
            });
        }

        SwarmEvent::ConnectionClosed {
            peer_id,
            num_established,
            cause,
            ..
        } => {
            let reason = cause.map(|c| c.to_string());
            tracing::info!(
                "Disconnected from {} (remaining: {}): {:?}",
                peer_id,
                num_established,
                reason
            );

            // Remove from connected peers if no connections remain
            if num_established == 0 {
                state.connected_peers.write().retain(|p| p.peer_id != peer_id);
            }

            let _ = event_tx.send(NetworkEvent::PeerDisconnected {
                peer_id,
                reason,
            });
        }

        SwarmEvent::OutgoingConnectionError { peer_id, error, .. } => {
            tracing::warn!("Outgoing connection error to {:?}: {}", peer_id, error);
            // Note: We can't emit ConnectionFailed here easily because we don't have the address
            // The error handling is done at the dial site
        }

        SwarmEvent::IncomingConnectionError { send_back_addr, error, .. } => {
            tracing::warn!("Incoming connection error from {}: {}", send_back_addr, error);
        }

        // ====================================================================
        // Behaviour Events
        // ====================================================================
        SwarmEvent::Behaviour(behaviour_event) => {
            match behaviour_event {
                // ----------------------------------------------------------------
                // Identify Events
                // ----------------------------------------------------------------
                super::behaviour::UmbraBehaviourEvent::Identify(identify::Event::Received {
                    peer_id,
                    info,
                    ..
                }) => {
                    tracing::debug!(
                        "Identified peer {}: {} ({})",
                        peer_id,
                        info.agent_version,
                        info.protocol_version
                    );

                    // Update peer info with identify data
                    let mut peers = state.connected_peers.write();
                    if let Some(peer) = peers.iter_mut().find(|p| p.peer_id == peer_id) {
                        peer.agent_version = Some(info.agent_version.clone());
                        peer.protocol_version = Some(info.protocol_version.clone());
                        peer.addresses = info.listen_addrs.clone();
                    }

                    // Add addresses to Kademlia for future discovery
                    for addr in &info.listen_addrs {
                        swarm.behaviour_mut().kademlia.add_address(&peer_id, addr.clone());
                    }

                    let _ = event_tx.send(NetworkEvent::PeerIdentified {
                        peer_id,
                        did: None, // DID extraction would require parsing agent_version
                        addresses: info.listen_addrs,
                    });
                }

                super::behaviour::UmbraBehaviourEvent::Identify(identify::Event::Sent { peer_id, .. }) => {
                    tracing::debug!("Sent identify to {}", peer_id);
                }

                super::behaviour::UmbraBehaviourEvent::Identify(identify::Event::Pushed { peer_id, .. }) => {
                    tracing::debug!("Pushed identify info to {}", peer_id);
                }

                super::behaviour::UmbraBehaviourEvent::Identify(identify::Event::Error { peer_id, error, .. }) => {
                    tracing::warn!("Identify error with {}: {}", peer_id, error);
                }

                // ----------------------------------------------------------------
                // Ping Events
                // ----------------------------------------------------------------
                super::behaviour::UmbraBehaviourEvent::Ping(ping::Event {
                    peer,
                    result,
                    ..
                }) => {
                    match result {
                        Ok(duration) => {
                            let latency_ms = duration.as_millis() as u32;
                            tracing::trace!("Ping to {}: {}ms", peer, latency_ms);

                            // Update peer latency
                            let mut peers = state.connected_peers.write();
                            if let Some(peer_info) = peers.iter_mut().find(|p| p.peer_id == peer) {
                                peer_info.latency_ms = Some(latency_ms);
                            }
                        }
                        Err(e) => {
                            tracing::debug!("Ping failed to {}: {}", peer, e);
                        }
                    }
                }

                // ----------------------------------------------------------------
                // Kademlia Events
                // ----------------------------------------------------------------
                super::behaviour::UmbraBehaviourEvent::Kademlia(kad::Event::OutboundQueryProgressed {
                    id,
                    result,
                    ..
                }) => {
                    handle_kademlia_query_progress(id, result, swarm, event_tx, state);
                }

                super::behaviour::UmbraBehaviourEvent::Kademlia(kad::Event::RoutingUpdated {
                    peer,
                    addresses,
                    ..
                }) => {
                    tracing::debug!(
                        "DHT routing updated: {} ({} addresses)",
                        peer,
                        addresses.len()
                    );

                    // Count peers in routing table
                    let peer_count = swarm.behaviour_mut().kademlia.kbuckets()
                        .fold(0, |acc, bucket| acc + bucket.num_entries());

                    let _ = event_tx.send(NetworkEvent::DhtUpdated { peer_count });
                }

                super::behaviour::UmbraBehaviourEvent::Kademlia(kad::Event::InboundRequest { request }) => {
                    tracing::trace!("DHT inbound request: {:?}", request);
                }

                // ----------------------------------------------------------------
                // Request-Response Events
                // ----------------------------------------------------------------
                super::behaviour::UmbraBehaviourEvent::RequestResponse(
                    request_response::Event::Message { peer, message, .. }
                ) => {
                    match message {
                        // Inbound request from a peer
                        request_response::Message::Request { request, channel, .. } => {
                            tracing::info!("Received request from peer {}: {:?}", peer, std::mem::discriminant(&request));
                            handle_inbound_request(peer, request, channel, swarm, event_tx);
                        }
                        // Response to our outbound request
                        request_response::Message::Response { response, request_id, .. } => {
                            tracing::debug!("Received response from peer {} for request {:?}: {:?}", peer, request_id, std::mem::discriminant(&response));
                            handle_inbound_response(peer, response, event_tx);
                        }
                    }
                }

                super::behaviour::UmbraBehaviourEvent::RequestResponse(
                    request_response::Event::OutboundFailure { peer, error, request_id, .. }
                ) => {
                    tracing::warn!("Outbound request {:?} to {} failed: {}", request_id, peer, error);
                    let _ = event_tx.send(NetworkEvent::MessageFailed {
                        peer_id: peer,
                        message_id: format!("{:?}", request_id),
                        error: error.to_string(),
                    });
                }

                super::behaviour::UmbraBehaviourEvent::RequestResponse(
                    request_response::Event::InboundFailure { peer, error, request_id, .. }
                ) => {
                    tracing::warn!("Inbound request {:?} from {} failed: {}", request_id, peer, error);
                }

                super::behaviour::UmbraBehaviourEvent::RequestResponse(
                    request_response::Event::ResponseSent { peer, request_id, .. }
                ) => {
                    tracing::debug!("Response sent to {} for request {:?}", peer, request_id);
                }

                _ => {
                    // Other behaviour events we don't need to handle
                }
            }
        }

        // ====================================================================
        // Other Events
        // ====================================================================
        SwarmEvent::ExpiredListenAddr { address, .. } => {
            tracing::info!("Listen address expired: {}", address);
            state.listen_addrs.write().retain(|a| a != &address);
        }

        SwarmEvent::ListenerError { listener_id, error } => {
            tracing::error!("Listener {:?} error: {}", listener_id, error);
        }

        SwarmEvent::ListenerClosed { listener_id, reason, .. } => {
            tracing::info!("Listener {:?} closed: {:?}", listener_id, reason);
        }

        SwarmEvent::Dialing { peer_id: Some(peer_id), .. } => {
            tracing::debug!("Dialing peer: {}", peer_id);
        }

        SwarmEvent::Dialing { peer_id: None, .. } => {}

        _ => {
            // Catch-all for any other events
        }
    }
}

/// Handle Kademlia query progress
fn handle_kademlia_query_progress(
    query_id: kad::QueryId,
    result: kad::QueryResult,
    _swarm: &mut Swarm<UmbraBehaviour>,
    event_tx: &broadcast::Sender<NetworkEvent>,
    state: &mut EventLoopState,
) {
    match result {
        kad::QueryResult::GetClosestPeers(Ok(kad::GetClosestPeersOk { key: _, peers })) => {
            tracing::debug!("GetClosestPeers success: found {} peers", peers.len());

            // Collect addresses for discovered peers
            let mut addresses: Vec<Multiaddr> = Vec::new();
            for peer_info in &peers {
                let peer_id = peer_info.peer_id;
                if let Some(addrs) = state.discovered_addrs.get(&peer_id) {
                    addresses.extend(addrs.clone());
                }

                // Also emit PeerDiscovered events
                let _ = event_tx.send(NetworkEvent::PeerDiscovered {
                    peer_id,
                    addresses: state.discovered_addrs.get(&peer_id).cloned().unwrap_or_default(),
                });
            }

            // Send response if there's a waiting channel
            if let Some(response_tx) = state.pending_queries.remove(&query_id) {
                let _ = response_tx.send(Ok(addresses));
            }
        }

        kad::QueryResult::GetClosestPeers(Err(e)) => {
            tracing::warn!("GetClosestPeers error: {:?}", e);

            // Send error response if there's a waiting channel
            if let Some(response_tx) = state.pending_queries.remove(&query_id) {
                let _ = response_tx.send(Err(Error::DhtError(format!("{:?}", e))));
            }
        }

        kad::QueryResult::Bootstrap(Ok(kad::BootstrapOk { num_remaining, .. })) => {
            if num_remaining == 0 {
                tracing::info!("DHT bootstrap complete");
            } else {
                tracing::debug!("DHT bootstrap progress: {} remaining", num_remaining);
            }
        }

        kad::QueryResult::Bootstrap(Err(e)) => {
            tracing::warn!("DHT bootstrap error: {:?}", e);
        }

        kad::QueryResult::GetProviders(Ok(result)) => {
            tracing::debug!("GetProviders result: {:?}", result);
        }

        kad::QueryResult::GetProviders(Err(e)) => {
            tracing::warn!("GetProviders error: {:?}", e);
        }

        kad::QueryResult::GetRecord(Ok(result)) => {
            tracing::debug!("GetRecord result: {:?}", result);
        }

        kad::QueryResult::GetRecord(Err(e)) => {
            tracing::warn!("GetRecord error: {:?}", e);
        }

        kad::QueryResult::PutRecord(Ok(result)) => {
            tracing::debug!("PutRecord success: {:?}", result.key);
        }

        kad::QueryResult::PutRecord(Err(e)) => {
            tracing::warn!("PutRecord error: {:?}", e);
        }

        _ => {
            // Handle any other query results
        }
    }
}

// ============================================================================
// REQUEST-RESPONSE HANDLERS
// ============================================================================

/// Handle an inbound request from a peer
fn handle_inbound_request(
    peer: PeerId,
    request: UmbraRequest,
    channel: request_response::ResponseChannel<UmbraResponse>,
    swarm: &mut Swarm<UmbraBehaviour>,
    event_tx: &broadcast::Sender<NetworkEvent>,
) {
    match request {
        UmbraRequest::Message(msg_request) => {
            tracing::info!(
                "Received message {} from peer {}",
                msg_request.message_id,
                peer
            );

            // Emit the MessageReceived event for the application layer to handle
            // (decryption + DB storage happens in the FFI/application layer)
            let _ = event_tx.send(NetworkEvent::MessageReceived {
                peer_id: peer,
                message: bincode::serialize(&msg_request).unwrap_or_default(),
            });

            // Send delivery confirmation back
            let response = UmbraResponse::Message(MessageResponse {
                message_id: msg_request.message_id,
                status: MessageDeliveryStatus::Delivered,
            });

            if let Err(e) = swarm.behaviour_mut().send_response(channel, response) {
                tracing::warn!("Failed to send message delivery response: {:?}", std::mem::discriminant(&e));
            }
        }

        UmbraRequest::Friend(friend_request) => {
            tracing::info!(
                "Received friend request from {} ({})",
                friend_request.from_display_name,
                friend_request.from_did,
            );

            // Emit as a raw message event for the application layer
            let _ = event_tx.send(NetworkEvent::MessageReceived {
                peer_id: peer,
                message: bincode::serialize(&UmbraRequest::Friend(friend_request)).unwrap_or_default(),
            });

            // Acknowledge receipt
            let response = UmbraResponse::Friend(FriendResponse {
                request_id: String::new(), // Will be set by the app layer
                status: FriendResponseStatus::Ok,
                responder_did: String::new(),
                responder_display_name: None,
                responder_signing_key: None,
                responder_encryption_key: None,
            });

            if let Err(e) = swarm.behaviour_mut().send_response(channel, response) {
                tracing::warn!("Failed to send friend request response: {:?}", std::mem::discriminant(&e));
            }
        }

        UmbraRequest::Presence(announcement) => {
            tracing::debug!(
                "Received presence from {}: {:?}",
                announcement.did,
                announcement.status,
            );

            // Emit as a network event
            let _ = event_tx.send(NetworkEvent::PeerIdentified {
                peer_id: peer,
                did: Some(announcement.did),
                addresses: vec![],
            });

            // Acknowledge
            if let Err(e) = swarm.behaviour_mut().send_response(channel, UmbraResponse::Ack) {
                tracing::warn!("Failed to send presence ack: {:?}", std::mem::discriminant(&e));
            }
        }
    }
}

/// Handle an inbound response to our outbound request
fn handle_inbound_response(
    peer: PeerId,
    response: UmbraResponse,
    event_tx: &broadcast::Sender<NetworkEvent>,
) {
    match response {
        UmbraResponse::Message(msg_response) => {
            match &msg_response.status {
                MessageDeliveryStatus::Delivered => {
                    tracing::info!("Message {} delivered to {}", msg_response.message_id, peer);
                    let _ = event_tx.send(NetworkEvent::MessageDelivered {
                        peer_id: peer,
                        message_id: msg_response.message_id,
                    });
                }
                MessageDeliveryStatus::Failed { reason } => {
                    tracing::warn!(
                        "Message {} failed to deliver to {}: {}",
                        msg_response.message_id,
                        peer,
                        reason
                    );
                    let _ = event_tx.send(NetworkEvent::MessageFailed {
                        peer_id: peer,
                        message_id: msg_response.message_id,
                        error: reason.clone(),
                    });
                }
            }
        }

        UmbraResponse::Friend(friend_response) => {
            tracing::info!(
                "Friend response from {}: {:?}",
                peer,
                friend_response.status,
            );
            // The application layer will handle this via the network event subscription
        }

        UmbraResponse::Ack => {
            tracing::debug!("Ack received from {}", peer);
        }
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::network::protocols::{MessageRequest, MessageDeliveryStatus, FriendRequestType};

    #[test]
    fn test_event_loop_state_creation() {
        let connected = Arc::new(RwLock::new(Vec::new()));
        let listen = Arc::new(RwLock::new(Vec::new()));

        let state = EventLoopState::new(connected.clone(), listen.clone());

        assert!(state.pending_queries.is_empty());
        assert!(state.discovered_addrs.is_empty());
    }

    #[test]
    fn test_event_loop_state_shares_arc() {
        let connected = Arc::new(RwLock::new(Vec::new()));
        let listen = Arc::new(RwLock::new(Vec::new()));

        let _state = EventLoopState::new(connected.clone(), listen.clone());

        // State should share the same Arc — push to connected externally
        let peer_id = PeerId::random();
        connected.write().push(PeerInfo::connected(peer_id, vec![]));

        assert_eq!(connected.read().len(), 1);
        assert_eq!(connected.read()[0].peer_id, peer_id);
    }

    #[test]
    fn test_network_command_debug_format() {
        let peer_id = PeerId::random();

        let commands = vec![
            NetworkCommand::Bootstrap,
            NetworkCommand::Shutdown,
            NetworkCommand::Disconnect(peer_id),
            NetworkCommand::Connect("/ip4/127.0.0.1/tcp/4001".parse().unwrap()),
            NetworkCommand::SendMessage {
                peer_id,
                message: vec![1, 2, 3, 4, 5],
            },
            NetworkCommand::FindPeer {
                peer_id,
                response_tx: None,
            },
            NetworkCommand::AddPeerAddress {
                peer_id,
                addr: "/ip4/127.0.0.1/tcp/4001".parse().unwrap(),
            },
        ];

        for cmd in commands {
            let debug_str = format!("{:?}", cmd);
            assert!(!debug_str.is_empty(), "Debug should produce non-empty string");
        }
    }

    #[test]
    fn test_inbound_message_serialized_correctly() {
        // Verify that MessageRequest can be serialized to bytes
        // (this is how it travels over the wire in handle_inbound_request)
        let msg_request = MessageRequest {
            message_id: "msg-test-inbound".to_string(),
            encrypted_content: vec![10, 20, 30, 40],
            nonce: vec![0; 12],
            timestamp: 1234567890,
        };

        let bytes = bincode::serialize(&msg_request).unwrap();
        assert!(!bytes.is_empty());

        let restored: MessageRequest = bincode::deserialize(&bytes).unwrap();
        assert_eq!(restored.message_id, "msg-test-inbound");
        assert_eq!(restored.encrypted_content, vec![10, 20, 30, 40]);
    }

    #[test]
    fn test_umbra_request_friend_serialization_for_event() {
        // The event loop serializes the full UmbraRequest::Friend for events
        use crate::network::protocols::FriendRequest;

        let friend_req = FriendRequest {
            request_type: FriendRequestType::Request,
            from_did: "did:key:z6MkAlice".to_string(),
            from_display_name: "Alice".to_string(),
            from_signing_key: "signing-key".to_string(),
            from_encryption_key: "encryption-key".to_string(),
            to_did: "did:key:z6MkBob".to_string(),
            message: Some("Hello!".to_string()),
            timestamp: 1234567890,
            signature: "sig".to_string(),
        };

        let request = UmbraRequest::Friend(friend_req);
        let bytes = bincode::serialize(&request).unwrap();
        assert!(!bytes.is_empty());

        let restored: UmbraRequest = bincode::deserialize(&bytes).unwrap();
        match restored {
            UmbraRequest::Friend(f) => {
                assert_eq!(f.from_did, "did:key:z6MkAlice");
                assert_eq!(f.to_did, "did:key:z6MkBob");
            }
            _ => panic!("Expected Friend variant"),
        }
    }

    #[test]
    fn test_message_delivery_response_variants() {
        // Verify both response statuses used by handle_inbound_request
        let delivered = UmbraResponse::Message(MessageResponse {
            message_id: "msg-1".to_string(),
            status: MessageDeliveryStatus::Delivered,
        });

        let failed = UmbraResponse::Message(MessageResponse {
            message_id: "msg-2".to_string(),
            status: MessageDeliveryStatus::Failed {
                reason: "test failure".to_string(),
            },
        });

        // Both should serialize correctly
        let d_bytes = bincode::serialize(&delivered).unwrap();
        let f_bytes = bincode::serialize(&failed).unwrap();

        let d_restored: UmbraResponse = bincode::deserialize(&d_bytes).unwrap();
        let f_restored: UmbraResponse = bincode::deserialize(&f_bytes).unwrap();

        match d_restored {
            UmbraResponse::Message(m) => {
                assert!(matches!(m.status, MessageDeliveryStatus::Delivered));
            }
            _ => panic!("Expected Message variant"),
        }

        match f_restored {
            UmbraResponse::Message(m) => {
                match m.status {
                    MessageDeliveryStatus::Failed { reason } => {
                        assert_eq!(reason, "test failure");
                    }
                    _ => panic!("Expected Failed variant"),
                }
            }
            _ => panic!("Expected Message variant"),
        }
    }
}
