//! Server state management.
//!
//! Tracks online clients, offline message queues, and signaling sessions.
//! All data structures are concurrent (DashMap) for lock-free access.

use std::sync::Arc;

use chrono::Utc;
use dashmap::DashMap;
use tokio::sync::mpsc;
use uuid::Uuid;

use crate::federation::Federation;
use crate::protocol::{OfflineMessage, ServerMessage, SignalingSession};

/// Maximum number of offline messages to store per DID.
const DEFAULT_MAX_OFFLINE_PER_DID: usize = 1000;

/// Default session TTL in seconds (1 hour).
const DEFAULT_SESSION_TTL_SECS: i64 = 3600;

/// Default offline message TTL in seconds (7 days).
const DEFAULT_OFFLINE_TTL_SECS: i64 = 7 * 24 * 3600;

/// Server configuration.
#[derive(Debug, Clone)]
pub struct RelayConfig {
    pub port: u16,
    pub max_offline_per_did: usize,
    pub session_ttl_secs: i64,
    pub offline_ttl_secs: i64,
    /// Human-readable region label (e.g. "US East", "EU West")
    pub region: String,
    /// City or location description (e.g. "New York", "Frankfurt")
    pub location: String,
}

impl Default for RelayConfig {
    fn default() -> Self {
        Self {
            port: 8080,
            max_offline_per_did: DEFAULT_MAX_OFFLINE_PER_DID,
            session_ttl_secs: DEFAULT_SESSION_TTL_SECS,
            offline_ttl_secs: DEFAULT_OFFLINE_TTL_SECS,
            region: "US East".to_string(),
            location: "New York".to_string(),
        }
    }
}

/// A connected client's sender channel.
pub type ClientSender = mpsc::UnboundedSender<ServerMessage>;

/// Shared server state.
#[derive(Clone)]
pub struct RelayState {
    /// DID → sender channel for online clients.
    /// When a client connects and registers, their sender is stored here.
    /// When they disconnect, it's removed.
    pub online_clients: Arc<DashMap<String, ClientSender>>,

    /// DID → queued offline messages.
    /// Messages sent to offline peers are stored here until they reconnect
    /// and call FetchOffline.
    pub offline_queue: Arc<DashMap<String, Vec<OfflineMessage>>>,

    /// Session ID → signaling session.
    /// Used for single-scan friend adding flow.
    pub sessions: Arc<DashMap<String, SignalingSession>>,

    /// Server configuration.
    pub config: RelayConfig,

    /// Federation manager for relay-to-relay mesh networking.
    /// None if federation is disabled (no peer URLs configured).
    pub federation: Option<Federation>,
}

impl RelayState {
    /// Create a new relay state with the given configuration.
    pub fn new(config: RelayConfig) -> Self {
        Self {
            online_clients: Arc::new(DashMap::new()),
            offline_queue: Arc::new(DashMap::new()),
            sessions: Arc::new(DashMap::new()),
            config,
            federation: None,
        }
    }

    /// Create a new relay state with federation enabled.
    pub fn with_federation(config: RelayConfig, federation: Federation) -> Self {
        Self {
            online_clients: Arc::new(DashMap::new()),
            offline_queue: Arc::new(DashMap::new()),
            sessions: Arc::new(DashMap::new()),
            config,
            federation: Some(federation),
        }
    }

    // ── Client Management ─────────────────────────────────────────────────

    /// Register a client with their DID and sender channel.
    /// Broadcasts presence to federated peers if federation is enabled.
    pub fn register_client(&self, did: &str, sender: ClientSender) {
        tracing::info!(did = did, "Client registered");
        self.online_clients.insert(did.to_string(), sender);

        // Notify federated peers
        if let Some(ref fed) = self.federation {
            fed.broadcast_presence_online(did);
        }
    }

    /// Unregister a client when they disconnect.
    /// Broadcasts presence to federated peers if federation is enabled.
    pub fn unregister_client(&self, did: &str) {
        tracing::info!(did = did, "Client unregistered");
        self.online_clients.remove(did);

        // Notify federated peers
        if let Some(ref fed) = self.federation {
            fed.broadcast_presence_offline(did);
        }
    }

    /// Check if a client is currently online.
    pub fn is_online(&self, did: &str) -> bool {
        self.online_clients.contains_key(did)
    }

    /// Send a message to an online client. Returns true if sent successfully.
    pub fn send_to_client(&self, did: &str, message: ServerMessage) -> bool {
        if let Some(sender) = self.online_clients.get(did) {
            sender.send(message).is_ok()
        } else {
            false
        }
    }

    /// Check if a DID is reachable — either locally connected or on a federated peer.
    pub fn is_reachable(&self, did: &str) -> bool {
        if self.online_clients.contains_key(did) {
            return true;
        }
        if let Some(ref fed) = self.federation {
            return fed.find_peer_for_did(did).is_some();
        }
        false
    }

    /// Send a signaling payload to a DID, routing through federation if needed.
    /// Returns true if the signal was delivered or forwarded.
    pub fn route_signal(&self, from_did: &str, to_did: &str, payload: &str) -> bool {
        // Try local delivery first
        let local_msg = ServerMessage::Signal {
            from_did: from_did.to_string(),
            payload: payload.to_string(),
        };
        if self.send_to_client(to_did, local_msg) {
            return true;
        }

        // Try federation
        if let Some(ref fed) = self.federation {
            return fed.forward_signal(from_did, to_did, payload);
        }

        false
    }

    /// Send an encrypted message to a DID, routing through federation if needed.
    /// Returns true if delivered locally, false if offline (may have been forwarded).
    pub fn route_message(
        &self,
        from_did: &str,
        to_did: &str,
        payload: &str,
        timestamp: i64,
    ) -> bool {
        // Try local delivery first
        let local_msg = ServerMessage::Message {
            from_did: from_did.to_string(),
            payload: payload.to_string(),
            timestamp,
        };
        if self.send_to_client(to_did, local_msg) {
            return true;
        }

        // Try federation
        if let Some(ref fed) = self.federation {
            if fed.forward_message(from_did, to_did, payload, timestamp) {
                return true;
            }
        }

        false
    }

    /// Get the number of currently connected clients.
    pub fn online_count(&self) -> usize {
        self.online_clients.len()
    }

    /// Get the total number of reachable clients across the mesh.
    pub fn mesh_online_count(&self) -> usize {
        let local = self.online_clients.len();
        let remote = self
            .federation
            .as_ref()
            .map(|f| f.remote_did_count())
            .unwrap_or(0);
        local + remote
    }

    /// Get the number of connected federated peers.
    pub fn connected_peers(&self) -> usize {
        self.federation
            .as_ref()
            .map(|f| f.connected_peer_count())
            .unwrap_or(0)
    }

    /// Get the list of locally connected DIDs (for presence broadcasting).
    pub fn local_online_dids(&self) -> Vec<String> {
        self.online_clients
            .iter()
            .map(|entry| entry.key().clone())
            .collect()
    }

    // ── Offline Message Queue ─────────────────────────────────────────────

    /// Queue a message for offline delivery.
    /// Returns false if the queue is full.
    pub fn queue_offline_message(
        &self,
        to_did: &str,
        from_did: &str,
        payload: &str,
        timestamp: i64,
    ) -> bool {
        let message = OfflineMessage {
            id: Uuid::new_v4().to_string(),
            from_did: from_did.to_string(),
            payload: payload.to_string(),
            timestamp,
            queued_at: Utc::now(),
        };

        let mut queue = self.offline_queue.entry(to_did.to_string()).or_default();

        if queue.len() >= self.config.max_offline_per_did {
            tracing::warn!(
                to_did = to_did,
                queue_size = queue.len(),
                "Offline queue full for DID, dropping oldest message"
            );
            // Remove oldest message to make room
            if !queue.is_empty() {
                queue.remove(0);
            }
        }

        queue.push(message);
        tracing::debug!(
            to_did = to_did,
            from_did = from_did,
            "Queued offline message"
        );
        true
    }

    /// Drain all offline messages for a DID.
    /// Returns the messages and removes them from the queue.
    pub fn drain_offline_messages(&self, did: &str) -> Vec<OfflineMessage> {
        if let Some((_, messages)) = self.offline_queue.remove(did) {
            let now = Utc::now().timestamp();
            // Filter out expired messages
            messages
                .into_iter()
                .filter(|m| now - m.queued_at.timestamp() < self.config.offline_ttl_secs)
                .collect()
        } else {
            Vec::new()
        }
    }

    /// Get the number of queued offline messages across all DIDs.
    pub fn offline_queue_size(&self) -> usize {
        self.offline_queue
            .iter()
            .map(|entry| entry.value().len())
            .sum()
    }

    // ── Signaling Sessions ────────────────────────────────────────────────

    /// Create a new signaling session for single-scan friend adding.
    /// Returns the session ID. Replicates the session to federated peers.
    pub fn create_session(&self, creator_did: &str, offer_payload: &str) -> String {
        let session_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        let session = SignalingSession {
            id: session_id.clone(),
            creator_did: creator_did.to_string(),
            offer_payload: offer_payload.to_string(),
            created_at: now,
            consumed: false,
        };

        tracing::info!(
            session_id = session_id.as_str(),
            creator_did = creator_did,
            "Created signaling session"
        );
        self.sessions.insert(session_id.clone(), session);

        // Replicate to federated peers so the session can be joined from any relay
        if let Some(ref fed) = self.federation {
            fed.replicate_session(&session_id, creator_did, offer_payload, now.timestamp());
        }

        session_id
    }

    /// Import a signaling session replicated from a peer relay.
    pub fn import_session(
        &self,
        session_id: &str,
        creator_did: &str,
        offer_payload: &str,
        created_at: i64,
    ) {
        // Don't overwrite if we already have it
        if self.sessions.contains_key(session_id) {
            return;
        }

        let session = SignalingSession {
            id: session_id.to_string(),
            creator_did: creator_did.to_string(),
            offer_payload: offer_payload.to_string(),
            created_at: chrono::DateTime::from_timestamp(created_at, 0)
                .unwrap_or_else(Utc::now),
            consumed: false,
        };

        tracing::debug!(
            session_id = session_id,
            creator_did = creator_did,
            "Imported federated session"
        );
        self.sessions.insert(session_id.to_string(), session);
    }

    /// Look up a signaling session by ID.
    /// Returns None if the session doesn't exist, is expired, or was already consumed.
    pub fn get_session(&self, session_id: &str) -> Option<SignalingSession> {
        if let Some(session) = self.sessions.get(session_id) {
            let now = Utc::now().timestamp();
            let age = now - session.created_at.timestamp();

            if age > self.config.session_ttl_secs {
                tracing::debug!(session_id = session_id, "Session expired");
                drop(session);
                self.sessions.remove(session_id);
                return None;
            }

            if session.consumed {
                tracing::debug!(session_id = session_id, "Session already consumed");
                return None;
            }

            Some(session.clone())
        } else {
            None
        }
    }

    /// Mark a session as consumed (used).
    pub fn consume_session(&self, session_id: &str) -> bool {
        if let Some(mut session) = self.sessions.get_mut(session_id) {
            session.consumed = true;
            true
        } else {
            false
        }
    }

    /// Remove expired sessions and offline messages.
    /// Called periodically by the cleanup task.
    pub fn cleanup_expired(&self) {
        let now = Utc::now().timestamp();

        // Clean expired sessions
        let expired_sessions: Vec<String> = self
            .sessions
            .iter()
            .filter(|entry| now - entry.created_at.timestamp() > self.config.session_ttl_secs)
            .map(|entry| entry.key().clone())
            .collect();

        for session_id in &expired_sessions {
            self.sessions.remove(session_id);
        }

        if !expired_sessions.is_empty() {
            tracing::debug!(
                count = expired_sessions.len(),
                "Cleaned up expired sessions"
            );
        }

        // Clean expired offline messages
        let mut cleaned_messages = 0usize;
        let mut empty_queues = Vec::new();

        for mut entry in self.offline_queue.iter_mut() {
            let before = entry.value().len();
            entry.value_mut().retain(|m| {
                now - m.queued_at.timestamp() < self.config.offline_ttl_secs
            });
            cleaned_messages += before - entry.value().len();

            if entry.value().is_empty() {
                empty_queues.push(entry.key().clone());
            }
        }

        for did in &empty_queues {
            self.offline_queue.remove(did);
        }

        if cleaned_messages > 0 {
            tracing::debug!(
                count = cleaned_messages,
                "Cleaned up expired offline messages"
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> RelayConfig {
        RelayConfig {
            port: 8080,
            max_offline_per_did: 5,
            session_ttl_secs: 60,
            offline_ttl_secs: 300,
            region: "Test".to_string(),
            location: "Test City".to_string(),
        }
    }

    #[test]
    fn test_register_and_unregister_client() {
        let state = RelayState::new(test_config());
        let (tx, _rx) = mpsc::unbounded_channel();

        state.register_client("did:key:z6MkAlice", tx);
        assert!(state.is_online("did:key:z6MkAlice"));
        assert_eq!(state.online_count(), 1);

        state.unregister_client("did:key:z6MkAlice");
        assert!(!state.is_online("did:key:z6MkAlice"));
        assert_eq!(state.online_count(), 0);
    }

    #[test]
    fn test_send_to_online_client() {
        let state = RelayState::new(test_config());
        let (tx, mut rx) = mpsc::unbounded_channel();

        state.register_client("did:key:z6MkAlice", tx);

        let sent = state.send_to_client(
            "did:key:z6MkAlice",
            ServerMessage::Pong,
        );
        assert!(sent);

        let msg = rx.try_recv().unwrap();
        match msg {
            ServerMessage::Pong => {}
            _ => panic!("Expected Pong"),
        }
    }

    #[test]
    fn test_send_to_offline_client_returns_false() {
        let state = RelayState::new(test_config());
        let sent = state.send_to_client("did:key:z6MkNobody", ServerMessage::Pong);
        assert!(!sent);
    }

    #[test]
    fn test_queue_and_drain_offline_messages() {
        let state = RelayState::new(test_config());

        state.queue_offline_message("did:key:z6MkBob", "did:key:z6MkAlice", "hello", 1000);
        state.queue_offline_message("did:key:z6MkBob", "did:key:z6MkAlice", "world", 2000);

        assert_eq!(state.offline_queue_size(), 2);

        let messages = state.drain_offline_messages("did:key:z6MkBob");
        assert_eq!(messages.len(), 2);
        assert_eq!(messages[0].payload, "hello");
        assert_eq!(messages[1].payload, "world");

        // Should be empty after drain
        let messages = state.drain_offline_messages("did:key:z6MkBob");
        assert!(messages.is_empty());
        assert_eq!(state.offline_queue_size(), 0);
    }

    #[test]
    fn test_offline_queue_limit() {
        let state = RelayState::new(test_config());

        // Queue 6 messages (limit is 5)
        for i in 0..6 {
            state.queue_offline_message(
                "did:key:z6MkBob",
                "did:key:z6MkAlice",
                &format!("msg-{}", i),
                i as i64,
            );
        }

        let messages = state.drain_offline_messages("did:key:z6MkBob");
        assert_eq!(messages.len(), 5);
        // Oldest should have been dropped
        assert_eq!(messages[0].payload, "msg-1");
        assert_eq!(messages[4].payload, "msg-5");
    }

    #[test]
    fn test_create_and_get_session() {
        let state = RelayState::new(test_config());

        let session_id = state.create_session("did:key:z6MkAlice", "{\"sdp\":\"offer\"}");
        assert!(!session_id.is_empty());

        let session = state.get_session(&session_id).unwrap();
        assert_eq!(session.creator_did, "did:key:z6MkAlice");
        assert_eq!(session.offer_payload, "{\"sdp\":\"offer\"}");
        assert!(!session.consumed);
    }

    #[test]
    fn test_consume_session() {
        let state = RelayState::new(test_config());

        let session_id = state.create_session("did:key:z6MkAlice", "offer");

        assert!(state.consume_session(&session_id));

        // Should not be retrievable after consumption
        assert!(state.get_session(&session_id).is_none());
    }

    #[test]
    fn test_nonexistent_session() {
        let state = RelayState::new(test_config());
        assert!(state.get_session("nonexistent").is_none());
    }

    #[test]
    fn test_cleanup_removes_expired_sessions() {
        let state = RelayState::new(RelayConfig {
            session_ttl_secs: -1, // Expire immediately
            ..test_config()
        });

        let session_id = state.create_session("did:key:z6MkAlice", "offer");
        assert!(state.sessions.contains_key(&session_id));

        state.cleanup_expired();
        assert!(!state.sessions.contains_key(&session_id));
    }

    #[test]
    fn test_drain_offline_with_no_messages() {
        let state = RelayState::new(test_config());
        let messages = state.drain_offline_messages("did:key:z6MkNobody");
        assert!(messages.is_empty());
    }
}
