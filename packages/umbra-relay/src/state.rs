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
use crate::protocol::{CallRoom, OfflineMessage, ServerMessage, SignalingSession};

/// Maximum number of offline messages to store per DID.
const DEFAULT_MAX_OFFLINE_PER_DID: usize = 1000;

/// Default session TTL in seconds (1 hour).
const DEFAULT_SESSION_TTL_SECS: i64 = 3600;

/// Default offline message TTL in seconds (7 days).
const DEFAULT_OFFLINE_TTL_SECS: i64 = 7 * 24 * 3600;

/// Default maximum participants per call room.
const DEFAULT_MAX_CALL_PARTICIPANTS: usize = 50;

/// Default call room TTL in seconds (4 hours).
const DEFAULT_CALL_ROOM_TTL_SECS: i64 = 4 * 3600;

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

    /// Room ID → call room.
    /// Tracks active group call rooms and their participants.
    pub call_rooms: Arc<DashMap<String, CallRoom>>,

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
            call_rooms: Arc::new(DashMap::new()),
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
            call_rooms: Arc::new(DashMap::new()),
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

    // ── Call Room Management ──────────────────────────────────────────────

    /// Create a new call room for group calling.
    /// Returns the room ID.
    pub fn create_call_room(&self, group_id: &str, creator_did: &str) -> String {
        let room_id = Uuid::new_v4().to_string();

        let room = CallRoom {
            room_id: room_id.clone(),
            group_id: group_id.to_string(),
            creator_did: creator_did.to_string(),
            participants: vec![creator_did.to_string()],
            max_participants: DEFAULT_MAX_CALL_PARTICIPANTS,
            created_at: Utc::now(),
        };

        tracing::info!(
            room_id = room_id.as_str(),
            group_id = group_id,
            creator = creator_did,
            "Created call room"
        );
        self.call_rooms.insert(room_id.clone(), room);
        room_id
    }

    /// Join an existing call room. Returns the list of existing participants
    /// (before joining) so the joiner can establish connections with them.
    /// Returns None if the room doesn't exist or is full.
    pub fn join_call_room(&self, room_id: &str, did: &str) -> Option<Vec<String>> {
        let mut room = self.call_rooms.get_mut(room_id)?;

        if room.participants.len() >= room.max_participants {
            tracing::warn!(room_id = room_id, "Call room full");
            return None;
        }

        // Don't add duplicate participants
        if room.participants.contains(&did.to_string()) {
            return Some(room.participants.clone());
        }

        let existing = room.participants.clone();
        room.participants.push(did.to_string());

        tracing::info!(
            room_id = room_id,
            did = did,
            participant_count = room.participants.len(),
            "Participant joined call room"
        );

        Some(existing)
    }

    /// Leave a call room. Returns the remaining participants.
    /// Removes the room if it becomes empty.
    pub fn leave_call_room(&self, room_id: &str, did: &str) -> Vec<String> {
        let remaining = if let Some(mut room) = self.call_rooms.get_mut(room_id) {
            room.participants.retain(|p| p != did);
            let remaining = room.participants.clone();
            drop(room);
            remaining
        } else {
            return Vec::new();
        };

        tracing::info!(
            room_id = room_id,
            did = did,
            remaining = remaining.len(),
            "Participant left call room"
        );

        // Remove empty rooms
        if remaining.is_empty() {
            self.call_rooms.remove(room_id);
            tracing::debug!(room_id = room_id, "Removed empty call room");
        }

        remaining
    }

    /// Get the participants in a call room.
    pub fn get_call_room_participants(&self, room_id: &str) -> Option<Vec<String>> {
        self.call_rooms.get(room_id).map(|r| r.participants.clone())
    }

    /// Check if a DID is in a call room.
    pub fn is_in_call_room(&self, room_id: &str, did: &str) -> bool {
        self.call_rooms
            .get(room_id)
            .map(|r| r.participants.contains(&did.to_string()))
            .unwrap_or(false)
    }

    /// Remove a disconnected client from all call rooms they're in.
    /// Returns room_id → remaining participants for rooms they were in.
    pub fn remove_from_all_call_rooms(&self, did: &str) -> Vec<(String, Vec<String>)> {
        let mut affected = Vec::new();
        let room_ids: Vec<String> = self
            .call_rooms
            .iter()
            .filter(|r| r.participants.contains(&did.to_string()))
            .map(|r| r.room_id.clone())
            .collect();

        for room_id in room_ids {
            let remaining = self.leave_call_room(&room_id, did);
            affected.push((room_id, remaining));
        }

        affected
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

        // Clean expired call rooms
        let expired_rooms: Vec<String> = self
            .call_rooms
            .iter()
            .filter(|entry| now - entry.created_at.timestamp() > DEFAULT_CALL_ROOM_TTL_SECS)
            .map(|entry| entry.room_id.clone())
            .collect();

        for room_id in &expired_rooms {
            self.call_rooms.remove(room_id);
        }

        if !expired_rooms.is_empty() {
            tracing::debug!(
                count = expired_rooms.len(),
                "Cleaned up expired call rooms"
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

    // ── Call Room Tests ──────────────────────────────────────────────

    #[test]
    fn test_create_call_room() {
        let state = RelayState::new(test_config());
        let room_id = state.create_call_room("group-1", "did:key:z6MkAlice");
        assert!(!room_id.is_empty());

        let participants = state.get_call_room_participants(&room_id).unwrap();
        assert_eq!(participants.len(), 1);
        assert_eq!(participants[0], "did:key:z6MkAlice");
    }

    #[test]
    fn test_join_call_room() {
        let state = RelayState::new(test_config());
        let room_id = state.create_call_room("group-1", "did:key:z6MkAlice");

        let existing = state.join_call_room(&room_id, "did:key:z6MkBob").unwrap();
        assert_eq!(existing.len(), 1);
        assert_eq!(existing[0], "did:key:z6MkAlice");

        let participants = state.get_call_room_participants(&room_id).unwrap();
        assert_eq!(participants.len(), 2);
    }

    #[test]
    fn test_join_call_room_no_duplicates() {
        let state = RelayState::new(test_config());
        let room_id = state.create_call_room("group-1", "did:key:z6MkAlice");

        state.join_call_room(&room_id, "did:key:z6MkAlice");
        let participants = state.get_call_room_participants(&room_id).unwrap();
        assert_eq!(participants.len(), 1);
    }

    #[test]
    fn test_leave_call_room() {
        let state = RelayState::new(test_config());
        let room_id = state.create_call_room("group-1", "did:key:z6MkAlice");
        state.join_call_room(&room_id, "did:key:z6MkBob");

        let remaining = state.leave_call_room(&room_id, "did:key:z6MkAlice");
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0], "did:key:z6MkBob");
    }

    #[test]
    fn test_leave_call_room_removes_empty() {
        let state = RelayState::new(test_config());
        let room_id = state.create_call_room("group-1", "did:key:z6MkAlice");

        state.leave_call_room(&room_id, "did:key:z6MkAlice");
        assert!(state.get_call_room_participants(&room_id).is_none());
    }

    #[test]
    fn test_is_in_call_room() {
        let state = RelayState::new(test_config());
        let room_id = state.create_call_room("group-1", "did:key:z6MkAlice");

        assert!(state.is_in_call_room(&room_id, "did:key:z6MkAlice"));
        assert!(!state.is_in_call_room(&room_id, "did:key:z6MkBob"));
    }

    #[test]
    fn test_remove_from_all_call_rooms() {
        let state = RelayState::new(test_config());
        let room1 = state.create_call_room("group-1", "did:key:z6MkAlice");
        let room2 = state.create_call_room("group-2", "did:key:z6MkAlice");
        state.join_call_room(&room1, "did:key:z6MkBob");

        let affected = state.remove_from_all_call_rooms("did:key:z6MkAlice");
        assert_eq!(affected.len(), 2);

        // Room 1 should still have Bob
        let p1 = state.get_call_room_participants(&room1).unwrap();
        assert_eq!(p1.len(), 1);
        assert_eq!(p1[0], "did:key:z6MkBob");

        // Room 2 should be removed (was empty after Alice left)
        assert!(state.get_call_room_participants(&room2).is_none());
    }

    #[test]
    fn test_join_nonexistent_room() {
        let state = RelayState::new(test_config());
        assert!(state.join_call_room("nonexistent", "did:key:z6MkAlice").is_none());
    }
}
