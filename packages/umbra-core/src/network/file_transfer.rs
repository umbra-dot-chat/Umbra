//! # P2P File Transfer Protocol
//!
//! Defines the types, messages, and state machine for P2P file transfers.
//!
//! ## Transfer Flow
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────────────────┐
//! │                     FILE TRANSFER PROTOCOL                              │
//! ├─────────────────────────────────────────────────────────────────────────┤
//! │                                                                         │
//! │  Sender                            Recipient                           │
//! │  ──────                            ─────────                           │
//! │                                                                         │
//! │  1. TransferRequest ──────────────►                                    │
//! │     (manifest, file_id)            2. Validate manifest               │
//! │                                                                         │
//! │                          ◄──────── 3. TransferAccept / TransferReject  │
//! │                                       (with chunk availability)        │
//! │                                                                         │
//! │  4. ChunkData ────────────────────►                                    │
//! │     (chunk_index, data, hash)      5. Verify chunk hash               │
//! │                                                                         │
//! │                          ◄──────── 6. ChunkAck                         │
//! │                                       (chunk_index, received)          │
//! │                                                                         │
//! │  7. Repeat 4-6 with adaptive       Window: 2 → 8 based on ACK        │
//! │     sliding window                  latency. Shrink on timeouts.      │
//! │                                                                         │
//! │  8. TransferComplete ─────────────►                                    │
//! │     (file_hash verified)           9. Verify full file hash           │
//! │                                                                         │
//! └─────────────────────────────────────────────────────────────────────────┘
//! ```

use crate::storage::chunking::ChunkManifest;
use serde::{Deserialize, Serialize};

// ============================================================================
// TRANSFER STATE
// ============================================================================

/// Current state of a file transfer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransferState {
    /// Transfer has been requested but not yet accepted.
    Requesting,
    /// Transfer accepted, negotiating transport (WebRTC vs relay).
    Negotiating,
    /// Actively transferring chunks.
    Transferring,
    /// Transfer paused by either party.
    Paused,
    /// Transfer completed successfully.
    Completed,
    /// Transfer failed with an error.
    Failed,
    /// Transfer cancelled by either party.
    Cancelled,
}

impl TransferState {
    /// Whether the transfer is in a terminal state.
    pub fn is_terminal(&self) -> bool {
        matches!(self, Self::Completed | Self::Failed | Self::Cancelled)
    }

    /// Whether the transfer is active (not terminal and not paused).
    pub fn is_active(&self) -> bool {
        matches!(
            self,
            Self::Requesting | Self::Negotiating | Self::Transferring
        )
    }
}

// ============================================================================
// TRANSFER DIRECTION & TRANSPORT
// ============================================================================

/// Direction of a file transfer relative to us.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransferDirection {
    /// We are sending the file.
    Upload,
    /// We are receiving the file.
    Download,
}

/// Transport layer being used for the transfer.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TransportType {
    /// Direct peer-to-peer via WebRTC DataChannel.
    WebRtcDirect,
    /// Relayed through the relay server.
    Relay,
    /// Via libp2p request-response (native only).
    Libp2p,
}

// ============================================================================
// TRANSFER SESSION
// ============================================================================

/// A tracked file transfer session.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferSession {
    /// Unique transfer identifier.
    pub transfer_id: String,
    /// The file being transferred.
    pub file_id: String,
    /// File manifest with chunk information.
    pub manifest: ChunkManifest,
    /// Upload or download.
    pub direction: TransferDirection,
    /// DID of the remote peer.
    pub peer_did: String,
    /// Current transfer state.
    pub state: TransferState,
    /// Number of chunks completed so far.
    pub chunks_completed: u32,
    /// Total bytes transferred so far.
    pub bytes_transferred: u64,
    /// Current transfer speed in bytes per second.
    pub speed_bps: u64,
    /// Unix timestamp (ms) when transfer started.
    pub started_at: i64,
    /// Unix timestamp (ms) when transfer was last updated.
    pub updated_at: i64,
    /// Transport being used.
    pub transport_type: TransportType,
    /// Error message if state is Failed.
    pub error: Option<String>,
    /// Bitfield of which chunks have been received/sent (for resume).
    /// Index `i` is `true` if chunk `i` is completed.
    pub chunks_bitfield: Vec<bool>,
}

impl TransferSession {
    /// Create a new transfer session for an outgoing upload.
    pub fn new_upload(
        transfer_id: String,
        file_id: String,
        manifest: ChunkManifest,
        peer_did: String,
        now_ms: i64,
    ) -> Self {
        let total_chunks = manifest.total_chunks as usize;
        Self {
            transfer_id,
            file_id,
            manifest,
            direction: TransferDirection::Upload,
            peer_did,
            state: TransferState::Requesting,
            chunks_completed: 0,
            bytes_transferred: 0,
            speed_bps: 0,
            started_at: now_ms,
            updated_at: now_ms,
            transport_type: TransportType::Relay, // default, updated during negotiation
            error: None,
            chunks_bitfield: vec![false; total_chunks],
        }
    }

    /// Create a new transfer session for an incoming download.
    pub fn new_download(
        transfer_id: String,
        file_id: String,
        manifest: ChunkManifest,
        peer_did: String,
        now_ms: i64,
    ) -> Self {
        let total_chunks = manifest.total_chunks as usize;
        Self {
            transfer_id,
            file_id,
            manifest,
            direction: TransferDirection::Download,
            peer_did,
            state: TransferState::Requesting,
            chunks_completed: 0,
            bytes_transferred: 0,
            speed_bps: 0,
            started_at: now_ms,
            updated_at: now_ms,
            transport_type: TransportType::Relay,
            error: None,
            chunks_bitfield: vec![false; total_chunks],
        }
    }

    /// Mark a chunk as completed.
    pub fn mark_chunk_completed(&mut self, chunk_index: u32, chunk_size: usize, now_ms: i64) {
        let idx = chunk_index as usize;
        if idx < self.chunks_bitfield.len() && !self.chunks_bitfield[idx] {
            self.chunks_bitfield[idx] = true;
            self.chunks_completed += 1;
            self.bytes_transferred += chunk_size as u64;
            self.updated_at = now_ms;
        }
    }

    /// Get the next chunk index that hasn't been completed yet.
    pub fn next_pending_chunk(&self) -> Option<u32> {
        self.chunks_bitfield
            .iter()
            .position(|&done| !done)
            .map(|i| i as u32)
    }

    /// Get a list of pending chunk indices.
    pub fn pending_chunks(&self) -> Vec<u32> {
        self.chunks_bitfield
            .iter()
            .enumerate()
            .filter(|(_, &done)| !done)
            .map(|(i, _)| i as u32)
            .collect()
    }

    /// Calculate progress as a percentage (0-100).
    pub fn progress_percent(&self) -> f64 {
        if self.manifest.total_chunks == 0 {
            return 100.0;
        }
        (self.chunks_completed as f64 / self.manifest.total_chunks as f64) * 100.0
    }

    /// Update the transfer speed based on recent chunk timing.
    pub fn update_speed(&mut self, chunk_size: usize, elapsed_ms: u64) {
        if elapsed_ms > 0 {
            self.speed_bps = (chunk_size as u64 * 1000) / elapsed_ms;
        }
    }
}

// ============================================================================
// TRANSFER PROTOCOL MESSAGES
// ============================================================================

/// Messages exchanged between peers during a file transfer.
///
/// Serialized as JSON for relay transport (kept simple for WASM interop).
/// For direct P2P/libp2p, these can be bincode-serialized.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum FileTransferMessage {
    /// Request to transfer a file to a peer.
    TransferRequest {
        /// Unique transfer ID.
        transfer_id: String,
        /// File identifier.
        file_id: String,
        /// Sender's DID.
        sender_did: String,
        /// File manifest (contains chunk list, sizes, hashes).
        manifest: ChunkManifest,
    },

    /// Accept an incoming transfer request.
    TransferAccept {
        /// The transfer ID being accepted.
        transfer_id: String,
        /// Which chunks the recipient already has (for resume).
        /// Indices of chunks already available locally.
        existing_chunks: Vec<u32>,
    },

    /// Reject an incoming transfer request.
    TransferReject {
        /// The transfer ID being rejected.
        transfer_id: String,
        /// Reason for rejection.
        reason: String,
    },

    /// A chunk of file data.
    ChunkData {
        /// The transfer ID.
        transfer_id: String,
        /// Zero-based chunk index.
        chunk_index: u32,
        /// Base64-encoded chunk data.
        data_b64: String,
        /// SHA-256 hash of the chunk (for verification).
        hash: String,
    },

    /// Acknowledge receipt of a chunk.
    ChunkAck {
        /// The transfer ID.
        transfer_id: String,
        /// The chunk index being acknowledged.
        chunk_index: u32,
        /// Whether the chunk was received and verified successfully.
        success: bool,
        /// Error message if success is false.
        error: Option<String>,
    },

    /// Request to pause a transfer.
    PauseTransfer {
        /// The transfer ID.
        transfer_id: String,
    },

    /// Request to resume a paused transfer.
    ResumeTransfer {
        /// The transfer ID.
        transfer_id: String,
        /// Updated chunk availability (for resume after disconnect).
        existing_chunks: Vec<u32>,
    },

    /// Cancel a transfer.
    CancelTransfer {
        /// The transfer ID.
        transfer_id: String,
        /// Reason for cancellation.
        reason: Option<String>,
    },

    /// Notify that the transfer is complete.
    TransferComplete {
        /// The transfer ID.
        transfer_id: String,
        /// SHA-256 of the reassembled file (final verification).
        file_hash: String,
    },

    /// Report which chunks are locally available (used for resume).
    ChunkAvailability {
        /// The transfer ID.
        transfer_id: String,
        /// Indices of chunks available locally.
        available_chunks: Vec<u32>,
    },
}

impl FileTransferMessage {
    /// Get the transfer ID from any message variant.
    pub fn transfer_id(&self) -> &str {
        match self {
            Self::TransferRequest { transfer_id, .. } => transfer_id,
            Self::TransferAccept { transfer_id, .. } => transfer_id,
            Self::TransferReject { transfer_id, .. } => transfer_id,
            Self::ChunkData { transfer_id, .. } => transfer_id,
            Self::ChunkAck { transfer_id, .. } => transfer_id,
            Self::PauseTransfer { transfer_id } => transfer_id,
            Self::ResumeTransfer { transfer_id, .. } => transfer_id,
            Self::CancelTransfer { transfer_id, .. } => transfer_id,
            Self::TransferComplete { transfer_id, .. } => transfer_id,
            Self::ChunkAvailability { transfer_id, .. } => transfer_id,
        }
    }
}

// ============================================================================
// TRANSFER EVENTS (emitted to the application layer)
// ============================================================================

/// Events emitted by the transfer manager for the UI/application layer.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum TransferEvent {
    /// A new incoming transfer request was received.
    IncomingRequest {
        transfer_id: String,
        file_id: String,
        filename: String,
        total_size: u64,
        total_chunks: u32,
        from_did: String,
    },

    /// Transfer state changed.
    StateChanged {
        transfer_id: String,
        from_state: TransferState,
        to_state: TransferState,
    },

    /// Transfer progress update.
    Progress {
        transfer_id: String,
        chunks_completed: u32,
        total_chunks: u32,
        bytes_transferred: u64,
        total_bytes: u64,
        speed_bps: u64,
        transport_type: TransportType,
    },

    /// Transfer completed successfully.
    Completed {
        transfer_id: String,
        file_id: String,
        filename: String,
        total_size: u64,
    },

    /// Transfer failed.
    Failed {
        transfer_id: String,
        file_id: String,
        error: String,
    },
}

// ============================================================================
// ADAPTIVE FLOW CONTROL
// ============================================================================

/// Adaptive sliding window for flow control.
///
/// Starts with a small window and grows based on successful ACKs.
/// Shrinks on timeouts (TCP-like congestion avoidance).
#[derive(Debug, Clone)]
pub struct FlowControl {
    /// Current window size (number of in-flight chunks).
    pub window_size: u32,
    /// Minimum window size.
    pub min_window: u32,
    /// Maximum window size.
    pub max_window: u32,
    /// Number of consecutive successful ACKs.
    pub consecutive_acks: u32,
    /// Number of consecutive timeouts.
    pub consecutive_timeouts: u32,
    /// Rolling average RTT in milliseconds.
    pub avg_rtt_ms: u64,
    /// Number of RTT samples.
    rtt_samples: u32,
}

impl FlowControl {
    /// Create a new flow control with default parameters.
    pub fn new() -> Self {
        Self {
            window_size: 2,
            min_window: 1,
            max_window: 8,
            consecutive_acks: 0,
            consecutive_timeouts: 0,
            avg_rtt_ms: 0,
            rtt_samples: 0,
        }
    }

    /// Record a successful ACK and potentially grow the window.
    pub fn on_ack(&mut self, rtt_ms: u64) {
        self.consecutive_acks += 1;
        self.consecutive_timeouts = 0;

        // Update rolling average RTT
        self.rtt_samples += 1;
        if self.rtt_samples == 1 {
            self.avg_rtt_ms = rtt_ms;
        } else {
            // Exponential moving average (alpha = 0.125, like TCP)
            self.avg_rtt_ms = (self.avg_rtt_ms * 7 + rtt_ms) / 8;
        }

        // Grow window: after 4 consecutive ACKs, increase by 1
        if self.consecutive_acks >= 4 && self.window_size < self.max_window {
            self.window_size += 1;
            self.consecutive_acks = 0;
        }
    }

    /// Record a timeout and shrink the window.
    pub fn on_timeout(&mut self) {
        self.consecutive_timeouts += 1;
        self.consecutive_acks = 0;

        // Halve the window on timeout (TCP-like)
        self.window_size = (self.window_size / 2).max(self.min_window);
    }

    /// Get the current number of chunks that can be in-flight.
    pub fn available_slots(&self, in_flight: u32) -> u32 {
        self.window_size.saturating_sub(in_flight)
    }
}

impl Default for FlowControl {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// CONCURRENT TRANSFER LIMITS
// ============================================================================

/// Configuration for concurrent transfer limits.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransferLimits {
    /// Maximum concurrent uploads.
    pub max_uploads: u32,
    /// Maximum concurrent downloads.
    pub max_downloads: u32,
}

impl Default for TransferLimits {
    fn default() -> Self {
        Self {
            max_uploads: 3,
            max_downloads: 3,
        }
    }
}

// ============================================================================
// TRANSPORT CONFIG — Transport selection and fallback
// ============================================================================

/// Configuration for transport selection and fallback behavior.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransportConfig {
    /// Timeout in milliseconds to wait for direct WebRTC connection before
    /// falling back to relay. Default: 2000ms.
    pub webrtc_timeout_ms: u64,
    /// Whether to prefer direct connections over relay when available.
    /// Default: true.
    pub prefer_direct: bool,
}

impl Default for TransportConfig {
    fn default() -> Self {
        Self {
            webrtc_timeout_ms: 2000,
            prefer_direct: true,
        }
    }
}

impl TransportConfig {
    /// Select the best transport type for a given peer.
    ///
    /// Decision logic:
    /// - If `prefer_direct` is true and peer has an active libp2p connection, use `Libp2p`
    /// - On native platforms with direct connectivity, use `Libp2p`
    /// - On WASM/browser with WebRTC available, use `WebRtcDirect`
    /// - Otherwise fall back to `Relay`
    ///
    /// The `is_peer_directly_reachable` parameter should be `true` if the
    /// swarm currently has an established connection to the peer.
    pub fn select_transport(
        &self,
        is_peer_directly_reachable: bool,
        is_wasm: bool,
    ) -> TransportType {
        if self.prefer_direct && is_peer_directly_reachable {
            if is_wasm {
                TransportType::WebRtcDirect
            } else {
                TransportType::Libp2p
            }
        } else {
            TransportType::Relay
        }
    }
}

// ============================================================================
// SPEED TRACKER (rolling average over last N chunks)
// ============================================================================

/// Tracks transfer speed using a rolling window of recent chunk timings.
#[derive(Debug, Clone)]
pub struct SpeedTracker {
    /// Recent chunk sizes and their transfer times (bytes, elapsed_ms).
    samples: Vec<(usize, u64)>,
    /// Maximum number of samples to keep.
    max_samples: usize,
}

impl SpeedTracker {
    /// Create a new speed tracker with a rolling window.
    pub fn new(max_samples: usize) -> Self {
        Self {
            samples: Vec::with_capacity(max_samples),
            max_samples,
        }
    }

    /// Record a chunk transfer timing.
    pub fn record(&mut self, chunk_bytes: usize, elapsed_ms: u64) {
        if self.samples.len() >= self.max_samples {
            self.samples.remove(0);
        }
        self.samples.push((chunk_bytes, elapsed_ms));
    }

    /// Calculate the current speed in bytes per second.
    pub fn speed_bps(&self) -> u64 {
        if self.samples.is_empty() {
            return 0;
        }
        let total_bytes: u64 = self.samples.iter().map(|(b, _)| *b as u64).sum();
        let total_ms: u64 = self.samples.iter().map(|(_, ms)| *ms).sum();
        if total_ms == 0 {
            return 0;
        }
        (total_bytes * 1000) / total_ms
    }

    /// Reset the tracker.
    pub fn reset(&mut self) {
        self.samples.clear();
    }
}

impl Default for SpeedTracker {
    fn default() -> Self {
        Self::new(10)
    }
}

// ============================================================================
// TRANSFER MANAGER — Central Coordinator
// ============================================================================

/// Central coordinator for P2P file transfers.
///
/// Manages all active transfer sessions, enforces concurrent limits,
/// handles incoming protocol messages, and emits events to the
/// application layer.
pub struct TransferManager {
    /// Active transfer sessions keyed by transfer_id.
    sessions: std::collections::HashMap<String, TransferSession>,
    /// Flow control state per transfer.
    flow_controls: std::collections::HashMap<String, FlowControl>,
    /// Speed tracker per transfer.
    speed_trackers: std::collections::HashMap<String, SpeedTracker>,
    /// In-flight chunk timestamps for RTT calculation (transfer_id -> chunk_index -> sent_at_ms).
    in_flight: std::collections::HashMap<String, std::collections::HashMap<u32, i64>>,
    /// Concurrent transfer limits.
    limits: TransferLimits,
    /// Transport selection configuration.
    transport_config: TransportConfig,
    /// Queue of pending transfers waiting for a slot (transfer_id, priority).
    /// Lower priority number = higher priority. Smaller files get priority.
    queue: Vec<(String, u64)>,
    /// Accumulated events to be emitted (drained by the caller).
    pending_events: Vec<TransferEvent>,
}

impl TransferManager {
    /// Create a new transfer manager with default limits.
    pub fn new() -> Self {
        Self {
            sessions: std::collections::HashMap::new(),
            flow_controls: std::collections::HashMap::new(),
            speed_trackers: std::collections::HashMap::new(),
            in_flight: std::collections::HashMap::new(),
            limits: TransferLimits::default(),
            transport_config: TransportConfig::default(),
            queue: Vec::new(),
            pending_events: Vec::new(),
        }
    }

    /// Create a new transfer manager with custom limits.
    pub fn with_limits(limits: TransferLimits) -> Self {
        Self {
            limits,
            ..Self::new()
        }
    }

    /// Set the transport configuration.
    pub fn set_transport_config(&mut self, config: TransportConfig) {
        self.transport_config = config;
    }

    /// Get the current transport configuration.
    pub fn transport_config(&self) -> &TransportConfig {
        &self.transport_config
    }

    /// Select the best transport for a peer based on connectivity status.
    ///
    /// This checks the current `TransportConfig` and whether the peer is
    /// directly reachable to determine if we should use direct libp2p/WebRTC
    /// or fall back to relay.
    pub fn select_transport(&self, is_peer_directly_reachable: bool) -> TransportType {
        let is_wasm = cfg!(target_arch = "wasm32");
        self.transport_config
            .select_transport(is_peer_directly_reachable, is_wasm)
    }

    /// Get a reference to a transfer session by ID.
    pub fn get_session(&self, transfer_id: &str) -> Option<&TransferSession> {
        self.sessions.get(transfer_id)
    }

    /// Get a mutable reference to a transfer session by ID.
    pub fn get_session_mut(&mut self, transfer_id: &str) -> Option<&mut TransferSession> {
        self.sessions.get_mut(transfer_id)
    }

    /// List all active (non-terminal) sessions.
    pub fn active_sessions(&self) -> Vec<&TransferSession> {
        self.sessions
            .values()
            .filter(|s| !s.state.is_terminal())
            .collect()
    }

    /// List all sessions (including completed/failed/cancelled).
    pub fn all_sessions(&self) -> Vec<&TransferSession> {
        self.sessions.values().collect()
    }

    /// Count active uploads.
    pub fn active_upload_count(&self) -> u32 {
        self.sessions
            .values()
            .filter(|s| s.direction == TransferDirection::Upload && s.state.is_active())
            .count() as u32
    }

    /// Count active downloads.
    pub fn active_download_count(&self) -> u32 {
        self.sessions
            .values()
            .filter(|s| s.direction == TransferDirection::Download && s.state.is_active())
            .count() as u32
    }

    /// Drain pending events (returns all accumulated events and clears the buffer).
    pub fn drain_events(&mut self) -> Vec<TransferEvent> {
        std::mem::take(&mut self.pending_events)
    }

    // ── Initiate Transfers ──────────────────────────────────────────────

    /// Initiate a new outgoing file transfer.
    /// Returns the transfer_id and the message to send to the peer.
    pub fn initiate_transfer(
        &mut self,
        file_id: String,
        peer_did: String,
        manifest: ChunkManifest,
        now_ms: i64,
    ) -> Result<(String, FileTransferMessage), String> {
        // Check concurrent upload limits
        if self.active_upload_count() >= self.limits.max_uploads {
            // Add to queue instead
            let transfer_id = format!("tx-{}", now_ms);
            let priority = manifest.total_size; // smaller files = higher priority
            self.queue.push((transfer_id.clone(), priority));
            return Err(format!(
                "Upload limit reached ({}/{}). Transfer queued.",
                self.active_upload_count(),
                self.limits.max_uploads
            ));
        }

        let transfer_id = format!("tx-{}", now_ms);
        let session = TransferSession::new_upload(
            transfer_id.clone(),
            file_id.clone(),
            manifest.clone(),
            peer_did.clone(),
            now_ms,
        );

        let msg = FileTransferMessage::TransferRequest {
            transfer_id: transfer_id.clone(),
            file_id,
            sender_did: peer_did,
            manifest,
        };

        self.sessions.insert(transfer_id.clone(), session);
        self.flow_controls
            .insert(transfer_id.clone(), FlowControl::new());
        self.speed_trackers
            .insert(transfer_id.clone(), SpeedTracker::default());
        self.in_flight
            .insert(transfer_id.clone(), std::collections::HashMap::new());

        Ok((transfer_id, msg))
    }

    /// Accept an incoming transfer request.
    /// Returns the message to send back and the session.
    pub fn accept_transfer(
        &mut self,
        transfer_id: &str,
        existing_chunks: Vec<u32>,
        now_ms: i64,
    ) -> Result<FileTransferMessage, String> {
        // Check state and direction before mutable borrow
        {
            let session = self
                .sessions
                .get(transfer_id)
                .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

            if session.state != TransferState::Requesting {
                return Err(format!(
                    "Cannot accept transfer in state {:?}",
                    session.state
                ));
            }

            // Check download limits
            if session.direction == TransferDirection::Download
                && self.active_download_count() >= self.limits.max_downloads
            {
                return Err(format!(
                    "Download limit reached ({}/{})",
                    self.active_download_count(),
                    self.limits.max_downloads
                ));
            }
        }

        let session = self.sessions.get_mut(transfer_id).unwrap();
        let old_state = session.state;
        session.state = TransferState::Negotiating;
        session.updated_at = now_ms;

        // Mark existing chunks as completed
        for &idx in &existing_chunks {
            if let Some(chunk_ref) = session.manifest.chunks.get(idx as usize) {
                session.mark_chunk_completed(idx, chunk_ref.size, now_ms);
            }
        }

        self.pending_events.push(TransferEvent::StateChanged {
            transfer_id: transfer_id.to_string(),
            from_state: old_state,
            to_state: TransferState::Negotiating,
        });

        Ok(FileTransferMessage::TransferAccept {
            transfer_id: transfer_id.to_string(),
            existing_chunks,
        })
    }

    /// Reject an incoming transfer request.
    pub fn reject_transfer(
        &mut self,
        transfer_id: &str,
        reason: String,
        now_ms: i64,
    ) -> Result<FileTransferMessage, String> {
        let session = self
            .sessions
            .get_mut(transfer_id)
            .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

        let old_state = session.state;
        session.state = TransferState::Cancelled;
        session.error = Some(reason.clone());
        session.updated_at = now_ms;

        self.pending_events.push(TransferEvent::StateChanged {
            transfer_id: transfer_id.to_string(),
            from_state: old_state,
            to_state: TransferState::Cancelled,
        });

        Ok(FileTransferMessage::TransferReject {
            transfer_id: transfer_id.to_string(),
            reason,
        })
    }

    // ── Pause / Resume / Cancel ─────────────────────────────────────────

    /// Pause a transfer.
    pub fn pause_transfer(
        &mut self,
        transfer_id: &str,
        now_ms: i64,
    ) -> Result<FileTransferMessage, String> {
        let session = self
            .sessions
            .get_mut(transfer_id)
            .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

        if !session.state.is_active() {
            return Err(format!(
                "Cannot pause transfer in state {:?}",
                session.state
            ));
        }

        let old_state = session.state;
        session.state = TransferState::Paused;
        session.updated_at = now_ms;

        // Clear in-flight tracking
        self.in_flight.remove(transfer_id);

        self.pending_events.push(TransferEvent::StateChanged {
            transfer_id: transfer_id.to_string(),
            from_state: old_state,
            to_state: TransferState::Paused,
        });

        Ok(FileTransferMessage::PauseTransfer {
            transfer_id: transfer_id.to_string(),
        })
    }

    /// Resume a paused transfer.
    pub fn resume_transfer(
        &mut self,
        transfer_id: &str,
        now_ms: i64,
    ) -> Result<FileTransferMessage, String> {
        let session = self
            .sessions
            .get_mut(transfer_id)
            .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

        if session.state != TransferState::Paused {
            return Err(format!(
                "Cannot resume transfer in state {:?}",
                session.state
            ));
        }

        let old_state = session.state;
        session.state = TransferState::Transferring;
        session.updated_at = now_ms;

        // Reset flow control for fresh start
        self.flow_controls
            .insert(transfer_id.to_string(), FlowControl::new());
        self.in_flight
            .insert(transfer_id.to_string(), std::collections::HashMap::new());

        let existing: Vec<u32> = session
            .chunks_bitfield
            .iter()
            .enumerate()
            .filter(|(_, &done)| done)
            .map(|(i, _)| i as u32)
            .collect();

        self.pending_events.push(TransferEvent::StateChanged {
            transfer_id: transfer_id.to_string(),
            from_state: old_state,
            to_state: TransferState::Transferring,
        });

        Ok(FileTransferMessage::ResumeTransfer {
            transfer_id: transfer_id.to_string(),
            existing_chunks: existing,
        })
    }

    /// Cancel a transfer.
    pub fn cancel_transfer(
        &mut self,
        transfer_id: &str,
        reason: Option<String>,
        now_ms: i64,
    ) -> Result<FileTransferMessage, String> {
        let session = self
            .sessions
            .get_mut(transfer_id)
            .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

        if session.state.is_terminal() {
            return Err(format!(
                "Cannot cancel transfer in terminal state {:?}",
                session.state
            ));
        }

        let old_state = session.state;
        session.state = TransferState::Cancelled;
        session.error = reason.clone();
        session.updated_at = now_ms;

        // Clean up tracking
        self.flow_controls.remove(transfer_id);
        self.speed_trackers.remove(transfer_id);
        self.in_flight.remove(transfer_id);

        self.pending_events.push(TransferEvent::StateChanged {
            transfer_id: transfer_id.to_string(),
            from_state: old_state,
            to_state: TransferState::Cancelled,
        });

        // Try to start a queued transfer
        self.try_start_queued();

        Ok(FileTransferMessage::CancelTransfer {
            transfer_id: transfer_id.to_string(),
            reason,
        })
    }

    // ── Message Handling ────────────────────────────────────────────────

    /// Handle an incoming transfer protocol message.
    /// Returns optional response message to send back.
    pub fn on_message(
        &mut self,
        from_did: &str,
        message: FileTransferMessage,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        match message {
            FileTransferMessage::TransferRequest {
                transfer_id,
                file_id,
                sender_did,
                manifest,
            } => self.handle_transfer_request(transfer_id, file_id, sender_did, manifest, now_ms),

            FileTransferMessage::TransferAccept {
                transfer_id,
                existing_chunks,
            } => self.handle_transfer_accept(&transfer_id, existing_chunks, now_ms),

            FileTransferMessage::TransferReject {
                transfer_id,
                reason,
            } => self.handle_transfer_reject(&transfer_id, &reason, now_ms),

            FileTransferMessage::ChunkData {
                transfer_id,
                chunk_index,
                data_b64,
                hash,
            } => self.handle_chunk_data(&transfer_id, chunk_index, &data_b64, &hash, now_ms),

            FileTransferMessage::ChunkAck {
                transfer_id,
                chunk_index,
                success,
                error,
            } => self.handle_chunk_ack(&transfer_id, chunk_index, success, error, now_ms),

            FileTransferMessage::PauseTransfer { transfer_id } => {
                self.handle_pause(&transfer_id, now_ms)
            }

            FileTransferMessage::ResumeTransfer {
                transfer_id,
                existing_chunks,
            } => self.handle_resume(&transfer_id, existing_chunks, now_ms),

            FileTransferMessage::CancelTransfer {
                transfer_id,
                reason,
            } => self.handle_cancel(&transfer_id, reason, from_did, now_ms),

            FileTransferMessage::TransferComplete {
                transfer_id,
                file_hash,
            } => self.handle_transfer_complete(&transfer_id, &file_hash, now_ms),

            FileTransferMessage::ChunkAvailability {
                transfer_id,
                available_chunks,
            } => self.handle_chunk_availability(&transfer_id, available_chunks, now_ms),
        }
    }

    // ── Get Next Chunks to Send ─────────────────────────────────────────

    /// Get the next chunk indices to send for a transfer (respects flow control window).
    pub fn chunks_to_send(&self, transfer_id: &str) -> Vec<u32> {
        let session = match self.sessions.get(transfer_id) {
            Some(s) if s.state == TransferState::Transferring => s,
            _ => return Vec::new(),
        };

        let fc = match self.flow_controls.get(transfer_id) {
            Some(fc) => fc,
            None => return Vec::new(),
        };

        let in_flight_count = self
            .in_flight
            .get(transfer_id)
            .map(|m| m.len() as u32)
            .unwrap_or(0);

        let available = fc.available_slots(in_flight_count);
        if available == 0 {
            return Vec::new();
        }

        session
            .pending_chunks()
            .into_iter()
            .filter(|idx| {
                // Skip chunks that are already in-flight
                self.in_flight
                    .get(transfer_id)
                    .map(|m| !m.contains_key(idx))
                    .unwrap_or(true)
            })
            .take(available as usize)
            .collect()
    }

    /// Record that a chunk was sent (for RTT tracking).
    pub fn mark_chunk_sent(&mut self, transfer_id: &str, chunk_index: u32, sent_at_ms: i64) {
        self.in_flight
            .entry(transfer_id.to_string())
            .or_default()
            .insert(chunk_index, sent_at_ms);
    }

    /// Remove completed/terminal sessions.
    pub fn clear_completed(&mut self) {
        let to_remove: Vec<String> = self
            .sessions
            .iter()
            .filter(|(_, s)| s.state.is_terminal())
            .map(|(id, _)| id.clone())
            .collect();

        for id in &to_remove {
            self.sessions.remove(id);
            self.flow_controls.remove(id);
            self.speed_trackers.remove(id);
            self.in_flight.remove(id);
        }
    }

    // ── Private Message Handlers ────────────────────────────────────────

    fn handle_transfer_request(
        &mut self,
        transfer_id: String,
        file_id: String,
        sender_did: String,
        manifest: ChunkManifest,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        // Create a download session for the incoming request
        let session = TransferSession::new_download(
            transfer_id.clone(),
            file_id.clone(),
            manifest.clone(),
            sender_did.clone(),
            now_ms,
        );

        self.sessions.insert(transfer_id.clone(), session);
        self.flow_controls
            .insert(transfer_id.clone(), FlowControl::new());
        self.speed_trackers
            .insert(transfer_id.clone(), SpeedTracker::default());
        self.in_flight
            .insert(transfer_id.clone(), std::collections::HashMap::new());

        // Emit incoming request event
        self.pending_events.push(TransferEvent::IncomingRequest {
            transfer_id: transfer_id.clone(),
            file_id,
            filename: manifest.filename.clone(),
            total_size: manifest.total_size,
            total_chunks: manifest.total_chunks,
            from_did: sender_did,
        });

        // Don't auto-accept — let the application layer decide
        Ok(None)
    }

    fn handle_transfer_accept(
        &mut self,
        transfer_id: &str,
        existing_chunks: Vec<u32>,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        let session = self
            .sessions
            .get_mut(transfer_id)
            .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

        let old_state = session.state;
        session.state = TransferState::Transferring;
        session.updated_at = now_ms;

        // Mark chunks the recipient already has as completed
        for &idx in &existing_chunks {
            if let Some(chunk_ref) = session.manifest.chunks.get(idx as usize) {
                session.mark_chunk_completed(idx, chunk_ref.size, now_ms);
            }
        }

        self.pending_events.push(TransferEvent::StateChanged {
            transfer_id: transfer_id.to_string(),
            from_state: old_state,
            to_state: TransferState::Transferring,
        });

        Ok(None)
    }

    fn handle_transfer_reject(
        &mut self,
        transfer_id: &str,
        reason: &str,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        let session = self
            .sessions
            .get_mut(transfer_id)
            .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

        let old_state = session.state;
        session.state = TransferState::Failed;
        session.error = Some(format!("Rejected: {}", reason));
        session.updated_at = now_ms;

        self.pending_events.push(TransferEvent::StateChanged {
            transfer_id: transfer_id.to_string(),
            from_state: old_state,
            to_state: TransferState::Failed,
        });
        self.pending_events.push(TransferEvent::Failed {
            transfer_id: transfer_id.to_string(),
            file_id: session.file_id.clone(),
            error: format!("Transfer rejected: {}", reason),
        });

        self.try_start_queued();
        Ok(None)
    }

    fn handle_chunk_data(
        &mut self,
        transfer_id: &str,
        chunk_index: u32,
        data_b64: &str,
        expected_hash: &str,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        use base64::{engine::general_purpose::STANDARD, Engine as _};
        use sha2::{Digest, Sha256};

        let session = self
            .sessions
            .get_mut(transfer_id)
            .ok_or_else(|| format!("Transfer {} not found", transfer_id))?;

        if session.state != TransferState::Transferring {
            return Ok(None); // Ignore chunks if not in transferring state
        }

        // Decode and verify chunk
        let data = STANDARD
            .decode(data_b64)
            .map_err(|e| format!("Base64 decode error: {}", e))?;
        let actual_hash = hex::encode(Sha256::digest(&data));

        if actual_hash != expected_hash {
            // Send negative ACK
            return Ok(Some(FileTransferMessage::ChunkAck {
                transfer_id: transfer_id.to_string(),
                chunk_index,
                success: false,
                error: Some(format!(
                    "Hash mismatch: expected {}, got {}",
                    expected_hash, actual_hash
                )),
            }));
        }

        // Mark chunk as completed
        session.mark_chunk_completed(chunk_index, data.len(), now_ms);

        // Update speed tracker
        if let Some(tracker) = self.speed_trackers.get_mut(transfer_id) {
            // Use a reasonable estimate for elapsed time (chunk size / avg speed, or 100ms default)
            tracker.record(data.len(), 100);
            session.speed_bps = tracker.speed_bps();
        }

        // Emit progress event
        self.pending_events.push(TransferEvent::Progress {
            transfer_id: transfer_id.to_string(),
            chunks_completed: session.chunks_completed,
            total_chunks: session.manifest.total_chunks,
            bytes_transferred: session.bytes_transferred,
            total_bytes: session.manifest.total_size,
            speed_bps: session.speed_bps,
            transport_type: session.transport_type,
        });

        // Check if transfer is complete
        if session.chunks_completed == session.manifest.total_chunks {
            let old_state = session.state;
            session.state = TransferState::Completed;
            session.updated_at = now_ms;

            self.pending_events.push(TransferEvent::StateChanged {
                transfer_id: transfer_id.to_string(),
                from_state: old_state,
                to_state: TransferState::Completed,
            });
            self.pending_events.push(TransferEvent::Completed {
                transfer_id: transfer_id.to_string(),
                file_id: session.file_id.clone(),
                filename: session.manifest.filename.clone(),
                total_size: session.manifest.total_size,
            });

            self.try_start_queued();
        }

        // Send ACK
        Ok(Some(FileTransferMessage::ChunkAck {
            transfer_id: transfer_id.to_string(),
            chunk_index,
            success: true,
            error: None,
        }))
    }

    fn handle_chunk_ack(
        &mut self,
        transfer_id: &str,
        chunk_index: u32,
        success: bool,
        error: Option<String>,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        // Calculate RTT
        let rtt_ms = if let Some(flight_map) = self.in_flight.get_mut(transfer_id) {
            if let Some(sent_at) = flight_map.remove(&chunk_index) {
                Some((now_ms - sent_at) as u64)
            } else {
                None
            }
        } else {
            None
        };

        if success {
            // Update flow control with RTT
            if let (Some(fc), Some(rtt)) = (self.flow_controls.get_mut(transfer_id), rtt_ms) {
                fc.on_ack(rtt);
            }

            // Mark chunk completed on sender side
            if let Some(session) = self.sessions.get_mut(transfer_id) {
                if let Some(chunk_ref) = session.manifest.chunks.get(chunk_index as usize) {
                    let chunk_size = chunk_ref.size;
                    session.mark_chunk_completed(chunk_index, chunk_size, now_ms);

                    // Update speed
                    if let (Some(tracker), Some(rtt)) =
                        (self.speed_trackers.get_mut(transfer_id), rtt_ms)
                    {
                        tracker.record(chunk_size, rtt);
                        session.speed_bps = tracker.speed_bps();
                    }

                    // Emit progress
                    self.pending_events.push(TransferEvent::Progress {
                        transfer_id: transfer_id.to_string(),
                        chunks_completed: session.chunks_completed,
                        total_chunks: session.manifest.total_chunks,
                        bytes_transferred: session.bytes_transferred,
                        total_bytes: session.manifest.total_size,
                        speed_bps: session.speed_bps,
                        transport_type: session.transport_type,
                    });

                    // Check completion
                    if session.chunks_completed == session.manifest.total_chunks {
                        let old_state = session.state;
                        session.state = TransferState::Completed;
                        session.updated_at = now_ms;

                        self.pending_events.push(TransferEvent::StateChanged {
                            transfer_id: transfer_id.to_string(),
                            from_state: old_state,
                            to_state: TransferState::Completed,
                        });
                        self.pending_events.push(TransferEvent::Completed {
                            transfer_id: transfer_id.to_string(),
                            file_id: session.file_id.clone(),
                            filename: session.manifest.filename.clone(),
                            total_size: session.manifest.total_size,
                        });

                        // Send transfer complete message
                        return Ok(Some(FileTransferMessage::TransferComplete {
                            transfer_id: transfer_id.to_string(),
                            file_hash: session.manifest.file_hash.clone(),
                        }));
                    }
                }
            }
        } else {
            // Negative ACK — record timeout in flow control
            if let Some(fc) = self.flow_controls.get_mut(transfer_id) {
                fc.on_timeout();
            }
        }

        Ok(None)
    }

    fn handle_pause(
        &mut self,
        transfer_id: &str,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        if let Some(session) = self.sessions.get_mut(transfer_id) {
            if session.state.is_active() {
                let old_state = session.state;
                session.state = TransferState::Paused;
                session.updated_at = now_ms;
                self.in_flight.remove(transfer_id);

                self.pending_events.push(TransferEvent::StateChanged {
                    transfer_id: transfer_id.to_string(),
                    from_state: old_state,
                    to_state: TransferState::Paused,
                });
            }
        }
        Ok(None)
    }

    fn handle_resume(
        &mut self,
        transfer_id: &str,
        existing_chunks: Vec<u32>,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        if let Some(session) = self.sessions.get_mut(transfer_id) {
            if session.state == TransferState::Paused {
                let old_state = session.state;
                session.state = TransferState::Transferring;
                session.updated_at = now_ms;

                // Update chunk availability from peer
                for &idx in &existing_chunks {
                    if let Some(chunk_ref) = session.manifest.chunks.get(idx as usize) {
                        session.mark_chunk_completed(idx, chunk_ref.size, now_ms);
                    }
                }

                self.flow_controls
                    .insert(transfer_id.to_string(), FlowControl::new());
                self.in_flight
                    .insert(transfer_id.to_string(), std::collections::HashMap::new());

                self.pending_events.push(TransferEvent::StateChanged {
                    transfer_id: transfer_id.to_string(),
                    from_state: old_state,
                    to_state: TransferState::Transferring,
                });
            }
        }
        Ok(None)
    }

    fn handle_cancel(
        &mut self,
        transfer_id: &str,
        reason: Option<String>,
        _from_did: &str,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        if let Some(session) = self.sessions.get_mut(transfer_id) {
            if !session.state.is_terminal() {
                let old_state = session.state;
                session.state = TransferState::Cancelled;
                session.error = reason;
                session.updated_at = now_ms;

                self.flow_controls.remove(transfer_id);
                self.speed_trackers.remove(transfer_id);
                self.in_flight.remove(transfer_id);

                self.pending_events.push(TransferEvent::StateChanged {
                    transfer_id: transfer_id.to_string(),
                    from_state: old_state,
                    to_state: TransferState::Cancelled,
                });

                self.try_start_queued();
            }
        }
        Ok(None)
    }

    fn handle_transfer_complete(
        &mut self,
        transfer_id: &str,
        file_hash: &str,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        if let Some(session) = self.sessions.get_mut(transfer_id) {
            // Verify final file hash matches
            if session.manifest.file_hash != file_hash {
                let old_state = session.state;
                session.state = TransferState::Failed;
                session.error = Some(format!(
                    "Final hash mismatch: expected {}, got {}",
                    session.manifest.file_hash, file_hash
                ));
                session.updated_at = now_ms;

                self.pending_events.push(TransferEvent::Failed {
                    transfer_id: transfer_id.to_string(),
                    file_id: session.file_id.clone(),
                    error: "Final file hash mismatch".to_string(),
                });
            } else if session.state != TransferState::Completed {
                let old_state = session.state;
                session.state = TransferState::Completed;
                session.updated_at = now_ms;

                self.pending_events.push(TransferEvent::StateChanged {
                    transfer_id: transfer_id.to_string(),
                    from_state: old_state,
                    to_state: TransferState::Completed,
                });
                self.pending_events.push(TransferEvent::Completed {
                    transfer_id: transfer_id.to_string(),
                    file_id: session.file_id.clone(),
                    filename: session.manifest.filename.clone(),
                    total_size: session.manifest.total_size,
                });
            }

            self.try_start_queued();
        }
        Ok(None)
    }

    fn handle_chunk_availability(
        &mut self,
        transfer_id: &str,
        available_chunks: Vec<u32>,
        now_ms: i64,
    ) -> Result<Option<FileTransferMessage>, String> {
        if let Some(session) = self.sessions.get_mut(transfer_id) {
            for &idx in &available_chunks {
                if let Some(chunk_ref) = session.manifest.chunks.get(idx as usize) {
                    session.mark_chunk_completed(idx, chunk_ref.size, now_ms);
                }
            }
        }
        Ok(None)
    }

    // ── Queue Management ────────────────────────────────────────────────

    fn try_start_queued(&mut self) {
        // Sort queue by priority (smallest files first)
        self.queue.sort_by_key(|(_, priority)| *priority);

        // Nothing to do if queue is empty
        if self.queue.is_empty() {
            return;
        }

        // Check if we have capacity for uploads
        let upload_capacity = self
            .limits
            .max_uploads
            .saturating_sub(self.active_upload_count());
        let download_capacity = self
            .limits
            .max_downloads
            .saturating_sub(self.active_download_count());

        if upload_capacity == 0 && download_capacity == 0 {
            return;
        }

        // Move queued items to active (handled externally by the app layer checking queue state)
        // The actual transfer initiation happens at the app layer when it polls the queue
    }
}

impl Default for TransferManager {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use crate::storage::chunking::ChunkRef;

    fn test_manifest() -> ChunkManifest {
        ChunkManifest {
            file_id: "file-123".to_string(),
            filename: "test.txt".to_string(),
            total_size: 1024,
            chunk_size: 256,
            total_chunks: 4,
            chunks: vec![
                ChunkRef {
                    chunk_id: "c1".to_string(),
                    chunk_index: 0,
                    size: 256,
                    hash: "h1".to_string(),
                },
                ChunkRef {
                    chunk_id: "c2".to_string(),
                    chunk_index: 1,
                    size: 256,
                    hash: "h2".to_string(),
                },
                ChunkRef {
                    chunk_id: "c3".to_string(),
                    chunk_index: 2,
                    size: 256,
                    hash: "h3".to_string(),
                },
                ChunkRef {
                    chunk_id: "c4".to_string(),
                    chunk_index: 3,
                    size: 256,
                    hash: "h4".to_string(),
                },
            ],
            file_hash: "filehash".to_string(),
        }
    }

    #[test]
    fn test_transfer_state_terminal() {
        assert!(!TransferState::Requesting.is_terminal());
        assert!(!TransferState::Negotiating.is_terminal());
        assert!(!TransferState::Transferring.is_terminal());
        assert!(!TransferState::Paused.is_terminal());
        assert!(TransferState::Completed.is_terminal());
        assert!(TransferState::Failed.is_terminal());
        assert!(TransferState::Cancelled.is_terminal());
    }

    #[test]
    fn test_transfer_state_active() {
        assert!(TransferState::Requesting.is_active());
        assert!(TransferState::Negotiating.is_active());
        assert!(TransferState::Transferring.is_active());
        assert!(!TransferState::Paused.is_active());
        assert!(!TransferState::Completed.is_active());
        assert!(!TransferState::Failed.is_active());
        assert!(!TransferState::Cancelled.is_active());
    }

    #[test]
    fn test_session_new_upload() {
        let manifest = test_manifest();
        let session = TransferSession::new_upload(
            "tx-1".to_string(),
            "file-123".to_string(),
            manifest,
            "did:key:z6MkBob".to_string(),
            1000,
        );

        assert_eq!(session.transfer_id, "tx-1");
        assert_eq!(session.direction, TransferDirection::Upload);
        assert_eq!(session.state, TransferState::Requesting);
        assert_eq!(session.chunks_completed, 0);
        assert_eq!(session.chunks_bitfield.len(), 4);
        assert!(session.chunks_bitfield.iter().all(|&b| !b));
    }

    #[test]
    fn test_session_new_download() {
        let manifest = test_manifest();
        let session = TransferSession::new_download(
            "tx-2".to_string(),
            "file-123".to_string(),
            manifest,
            "did:key:z6MkAlice".to_string(),
            2000,
        );

        assert_eq!(session.direction, TransferDirection::Download);
        assert_eq!(session.state, TransferState::Requesting);
    }

    #[test]
    fn test_session_mark_chunk_completed() {
        let manifest = test_manifest();
        let mut session = TransferSession::new_download(
            "tx-3".to_string(),
            "file-123".to_string(),
            manifest,
            "did:key:z6MkAlice".to_string(),
            1000,
        );

        session.mark_chunk_completed(0, 256, 1100);
        assert_eq!(session.chunks_completed, 1);
        assert_eq!(session.bytes_transferred, 256);
        assert!(session.chunks_bitfield[0]);
        assert!(!session.chunks_bitfield[1]);

        // Marking same chunk again should be idempotent
        session.mark_chunk_completed(0, 256, 1200);
        assert_eq!(session.chunks_completed, 1);
        assert_eq!(session.bytes_transferred, 256);

        session.mark_chunk_completed(2, 256, 1300);
        assert_eq!(session.chunks_completed, 2);
        assert_eq!(session.bytes_transferred, 512);
    }

    #[test]
    fn test_session_next_pending_chunk() {
        let manifest = test_manifest();
        let mut session = TransferSession::new_download(
            "tx-4".to_string(),
            "file-123".to_string(),
            manifest,
            "did:key:z6MkAlice".to_string(),
            1000,
        );

        assert_eq!(session.next_pending_chunk(), Some(0));

        session.mark_chunk_completed(0, 256, 1100);
        assert_eq!(session.next_pending_chunk(), Some(1));

        session.mark_chunk_completed(1, 256, 1200);
        session.mark_chunk_completed(2, 256, 1300);
        session.mark_chunk_completed(3, 256, 1400);
        assert_eq!(session.next_pending_chunk(), None);
    }

    #[test]
    fn test_session_pending_chunks() {
        let manifest = test_manifest();
        let mut session = TransferSession::new_download(
            "tx-5".to_string(),
            "file-123".to_string(),
            manifest,
            "did:key:z6MkAlice".to_string(),
            1000,
        );

        assert_eq!(session.pending_chunks(), vec![0, 1, 2, 3]);

        session.mark_chunk_completed(0, 256, 1100);
        session.mark_chunk_completed(2, 256, 1200);
        assert_eq!(session.pending_chunks(), vec![1, 3]);
    }

    #[test]
    fn test_session_progress_percent() {
        let manifest = test_manifest();
        let mut session = TransferSession::new_download(
            "tx-6".to_string(),
            "file-123".to_string(),
            manifest,
            "did:key:z6MkAlice".to_string(),
            1000,
        );

        assert_eq!(session.progress_percent(), 0.0);

        session.mark_chunk_completed(0, 256, 1100);
        assert_eq!(session.progress_percent(), 25.0);

        session.mark_chunk_completed(1, 256, 1200);
        assert_eq!(session.progress_percent(), 50.0);

        session.mark_chunk_completed(2, 256, 1300);
        session.mark_chunk_completed(3, 256, 1400);
        assert_eq!(session.progress_percent(), 100.0);
    }

    #[test]
    fn test_flow_control_initial() {
        let fc = FlowControl::new();
        assert_eq!(fc.window_size, 2);
        assert_eq!(fc.min_window, 1);
        assert_eq!(fc.max_window, 8);
    }

    #[test]
    fn test_flow_control_grow_on_acks() {
        let mut fc = FlowControl::new();
        assert_eq!(fc.window_size, 2);

        // 4 consecutive ACKs → window grows by 1
        fc.on_ack(50);
        fc.on_ack(50);
        fc.on_ack(50);
        fc.on_ack(50);
        assert_eq!(fc.window_size, 3);

        // 4 more → grows again
        fc.on_ack(50);
        fc.on_ack(50);
        fc.on_ack(50);
        fc.on_ack(50);
        assert_eq!(fc.window_size, 4);
    }

    #[test]
    fn test_flow_control_max_window() {
        let mut fc = FlowControl::new();
        fc.window_size = 8; // at max

        fc.on_ack(50);
        fc.on_ack(50);
        fc.on_ack(50);
        fc.on_ack(50);
        assert_eq!(fc.window_size, 8); // shouldn't exceed max
    }

    #[test]
    fn test_flow_control_shrink_on_timeout() {
        let mut fc = FlowControl::new();
        fc.window_size = 6;

        fc.on_timeout();
        assert_eq!(fc.window_size, 3); // halved

        fc.on_timeout();
        assert_eq!(fc.window_size, 1); // halved, clamped to min

        fc.on_timeout();
        assert_eq!(fc.window_size, 1); // stays at min
    }

    #[test]
    fn test_flow_control_available_slots() {
        let fc = FlowControl::new();
        assert_eq!(fc.available_slots(0), 2);
        assert_eq!(fc.available_slots(1), 1);
        assert_eq!(fc.available_slots(2), 0);
        assert_eq!(fc.available_slots(5), 0); // saturating
    }

    #[test]
    fn test_flow_control_rtt_tracking() {
        let mut fc = FlowControl::new();
        fc.on_ack(100);
        assert_eq!(fc.avg_rtt_ms, 100);

        fc.on_ack(60);
        // EMA: (100 * 7 + 60) / 8 = 95
        assert_eq!(fc.avg_rtt_ms, 95);
    }

    #[test]
    fn test_transfer_message_serialization_roundtrip() {
        let manifest = test_manifest();
        let msg = FileTransferMessage::TransferRequest {
            transfer_id: "tx-1".to_string(),
            file_id: "file-123".to_string(),
            sender_did: "did:key:z6MkAlice".to_string(),
            manifest,
        };

        let json = serde_json::to_string(&msg).unwrap();
        let restored: FileTransferMessage = serde_json::from_str(&json).unwrap();
        assert_eq!(restored.transfer_id(), "tx-1");
    }

    #[test]
    fn test_transfer_message_chunk_data_roundtrip() {
        let msg = FileTransferMessage::ChunkData {
            transfer_id: "tx-1".to_string(),
            chunk_index: 3,
            data_b64: "SGVsbG8gV29ybGQ=".to_string(),
            hash: "abc123".to_string(),
        };

        let json = serde_json::to_string(&msg).unwrap();
        let restored: FileTransferMessage = serde_json::from_str(&json).unwrap();

        match restored {
            FileTransferMessage::ChunkData {
                chunk_index,
                data_b64,
                ..
            } => {
                assert_eq!(chunk_index, 3);
                assert_eq!(data_b64, "SGVsbG8gV29ybGQ=");
            }
            _ => panic!("Expected ChunkData"),
        }
    }

    #[test]
    fn test_transfer_message_all_variants() {
        let messages: Vec<FileTransferMessage> = vec![
            FileTransferMessage::TransferRequest {
                transfer_id: "t1".to_string(),
                file_id: "f1".to_string(),
                sender_did: "did:key:z6MkA".to_string(),
                manifest: test_manifest(),
            },
            FileTransferMessage::TransferAccept {
                transfer_id: "t1".to_string(),
                existing_chunks: vec![0, 2],
            },
            FileTransferMessage::TransferReject {
                transfer_id: "t1".to_string(),
                reason: "not enough space".to_string(),
            },
            FileTransferMessage::ChunkData {
                transfer_id: "t1".to_string(),
                chunk_index: 0,
                data_b64: "AAAA".to_string(),
                hash: "h1".to_string(),
            },
            FileTransferMessage::ChunkAck {
                transfer_id: "t1".to_string(),
                chunk_index: 0,
                success: true,
                error: None,
            },
            FileTransferMessage::PauseTransfer {
                transfer_id: "t1".to_string(),
            },
            FileTransferMessage::ResumeTransfer {
                transfer_id: "t1".to_string(),
                existing_chunks: vec![0],
            },
            FileTransferMessage::CancelTransfer {
                transfer_id: "t1".to_string(),
                reason: Some("user cancelled".to_string()),
            },
            FileTransferMessage::TransferComplete {
                transfer_id: "t1".to_string(),
                file_hash: "filehash".to_string(),
            },
            FileTransferMessage::ChunkAvailability {
                transfer_id: "t1".to_string(),
                available_chunks: vec![0, 1, 2, 3],
            },
        ];

        for msg in &messages {
            let json = serde_json::to_string(msg).unwrap();
            let restored: FileTransferMessage = serde_json::from_str(&json).unwrap();
            assert_eq!(msg.transfer_id(), restored.transfer_id());
        }
    }

    #[test]
    fn test_transfer_event_serialization() {
        let event = TransferEvent::Progress {
            transfer_id: "tx-1".to_string(),
            chunks_completed: 3,
            total_chunks: 10,
            bytes_transferred: 768,
            total_bytes: 2560,
            speed_bps: 256000,
            transport_type: TransportType::Relay,
        };

        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("\"type\":\"progress\""));
        assert!(json.contains("\"chunks_completed\":3"));
    }

    #[test]
    fn test_transfer_limits_default() {
        let limits = TransferLimits::default();
        assert_eq!(limits.max_uploads, 3);
        assert_eq!(limits.max_downloads, 3);
    }

    #[test]
    fn test_session_update_speed() {
        let manifest = test_manifest();
        let mut session = TransferSession::new_upload(
            "tx-7".to_string(),
            "file-123".to_string(),
            manifest,
            "did:key:z6MkBob".to_string(),
            1000,
        );

        session.update_speed(256 * 1024, 1000); // 256KB in 1 second
        assert_eq!(session.speed_bps, 256 * 1024); // 256 KB/s
    }

    // ── Speed Tracker Tests ─────────────────────────────────────────────

    #[test]
    fn test_speed_tracker_empty() {
        let tracker = SpeedTracker::default();
        assert_eq!(tracker.speed_bps(), 0);
    }

    #[test]
    fn test_speed_tracker_single_sample() {
        let mut tracker = SpeedTracker::new(10);
        tracker.record(1024, 100); // 1KB in 100ms = 10KB/s
        assert_eq!(tracker.speed_bps(), 10240);
    }

    #[test]
    fn test_speed_tracker_rolling_window() {
        let mut tracker = SpeedTracker::new(3);
        tracker.record(1000, 100);
        tracker.record(2000, 100);
        tracker.record(3000, 100);
        // Total: 6000 bytes / 300ms = 20000 bytes/s
        assert_eq!(tracker.speed_bps(), 20000);

        // Add one more, oldest drops off
        tracker.record(4000, 100);
        // Now: 2000+3000+4000 = 9000 bytes / 300ms = 30000 bytes/s
        assert_eq!(tracker.speed_bps(), 30000);
    }

    // ── TransferManager Tests ───────────────────────────────────────────

    #[test]
    fn test_manager_new() {
        let mgr = TransferManager::new();
        assert_eq!(mgr.active_upload_count(), 0);
        assert_eq!(mgr.active_download_count(), 0);
        assert!(mgr.all_sessions().is_empty());
    }

    #[test]
    fn test_manager_initiate_transfer() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        let result = mgr.initiate_transfer(
            "file-123".to_string(),
            "did:key:z6MkBob".to_string(),
            manifest,
            1000,
        );

        assert!(result.is_ok());
        let (transfer_id, msg) = result.unwrap();
        assert!(transfer_id.starts_with("tx-"));
        assert_eq!(mgr.active_upload_count(), 1);

        match msg {
            FileTransferMessage::TransferRequest { file_id, .. } => {
                assert_eq!(file_id, "file-123");
            }
            _ => panic!("Expected TransferRequest"),
        }
    }

    #[test]
    fn test_manager_concurrent_limit() {
        let limits = TransferLimits {
            max_uploads: 2,
            max_downloads: 2,
        };
        let mut mgr = TransferManager::with_limits(limits);

        // First two uploads succeed
        let r1 =
            mgr.initiate_transfer("f1".to_string(), "peer1".to_string(), test_manifest(), 1000);
        assert!(r1.is_ok());
        let r2 =
            mgr.initiate_transfer("f2".to_string(), "peer2".to_string(), test_manifest(), 2000);
        assert!(r2.is_ok());

        // Third upload should be queued (returns Err)
        let r3 =
            mgr.initiate_transfer("f3".to_string(), "peer3".to_string(), test_manifest(), 3000);
        assert!(r3.is_err());
        assert!(r3.unwrap_err().contains("Upload limit reached"));
    }

    #[test]
    fn test_manager_incoming_request() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        let msg = FileTransferMessage::TransferRequest {
            transfer_id: "tx-100".to_string(),
            file_id: "file-123".to_string(),
            sender_did: "did:key:z6MkAlice".to_string(),
            manifest,
        };

        let result = mgr.on_message("did:key:z6MkAlice", msg, 1000);
        assert!(result.is_ok());
        assert!(result.unwrap().is_none()); // No auto-accept

        // Session should exist as download
        let session = mgr.get_session("tx-100").unwrap();
        assert_eq!(session.direction, TransferDirection::Download);
        assert_eq!(session.state, TransferState::Requesting);

        // Should have emitted IncomingRequest event
        let events = mgr.drain_events();
        assert_eq!(events.len(), 1);
        match &events[0] {
            TransferEvent::IncomingRequest { transfer_id, .. } => {
                assert_eq!(transfer_id, "tx-100");
            }
            _ => panic!("Expected IncomingRequest event"),
        }
    }

    #[test]
    fn test_manager_accept_transfer() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        // Create incoming request
        let msg = FileTransferMessage::TransferRequest {
            transfer_id: "tx-200".to_string(),
            file_id: "file-123".to_string(),
            sender_did: "did:key:z6MkAlice".to_string(),
            manifest,
        };
        mgr.on_message("did:key:z6MkAlice", msg, 1000).unwrap();
        mgr.drain_events(); // clear

        // Accept with some existing chunks
        let result = mgr.accept_transfer("tx-200", vec![0, 2], 2000);
        assert!(result.is_ok());

        let session = mgr.get_session("tx-200").unwrap();
        assert_eq!(session.state, TransferState::Negotiating);
        assert_eq!(session.chunks_completed, 2); // chunks 0 and 2 already had

        let events = mgr.drain_events();
        assert_eq!(events.len(), 1);
        match &events[0] {
            TransferEvent::StateChanged {
                from_state,
                to_state,
                ..
            } => {
                assert_eq!(*from_state, TransferState::Requesting);
                assert_eq!(*to_state, TransferState::Negotiating);
            }
            _ => panic!("Expected StateChanged event"),
        }
    }

    #[test]
    fn test_manager_pause_resume() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        let (tid, _) = mgr
            .initiate_transfer("file-123".to_string(), "peer1".to_string(), manifest, 1000)
            .unwrap();

        // Move to transferring state
        mgr.sessions.get_mut(&tid).unwrap().state = TransferState::Transferring;

        // Pause
        let pause_result = mgr.pause_transfer(&tid, 2000);
        assert!(pause_result.is_ok());
        assert_eq!(mgr.get_session(&tid).unwrap().state, TransferState::Paused);

        // Resume
        let resume_result = mgr.resume_transfer(&tid, 3000);
        assert!(resume_result.is_ok());
        assert_eq!(
            mgr.get_session(&tid).unwrap().state,
            TransferState::Transferring
        );
    }

    #[test]
    fn test_manager_cancel_transfer() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        let (tid, _) = mgr
            .initiate_transfer("file-123".to_string(), "peer1".to_string(), manifest, 1000)
            .unwrap();

        let result = mgr.cancel_transfer(&tid, Some("user cancelled".to_string()), 2000);
        assert!(result.is_ok());

        let session = mgr.get_session(&tid).unwrap();
        assert_eq!(session.state, TransferState::Cancelled);
        assert_eq!(session.error.as_deref(), Some("user cancelled"));
    }

    #[test]
    fn test_manager_chunks_to_send() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        let (tid, _) = mgr
            .initiate_transfer("file-123".to_string(), "peer1".to_string(), manifest, 1000)
            .unwrap();

        // Not in transferring state yet — should return empty
        assert!(mgr.chunks_to_send(&tid).is_empty());

        // Move to transferring
        mgr.sessions.get_mut(&tid).unwrap().state = TransferState::Transferring;

        // Should return up to window_size (2) chunks
        let chunks = mgr.chunks_to_send(&tid);
        assert_eq!(chunks.len(), 2);
        assert_eq!(chunks, vec![0, 1]);

        // Mark chunks as in-flight
        mgr.mark_chunk_sent(&tid, 0, 1000);
        mgr.mark_chunk_sent(&tid, 1, 1000);

        // Now no more slots available (window=2, in_flight=2)
        let chunks = mgr.chunks_to_send(&tid);
        assert!(chunks.is_empty());
    }

    #[test]
    fn test_manager_clear_completed() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        let (tid, _) = mgr
            .initiate_transfer("file-123".to_string(), "peer1".to_string(), manifest, 1000)
            .unwrap();
        mgr.sessions.get_mut(&tid).unwrap().state = TransferState::Completed;

        assert_eq!(mgr.all_sessions().len(), 1);
        mgr.clear_completed();
        assert_eq!(mgr.all_sessions().len(), 0);
    }

    #[test]
    fn test_manager_reject_transfer() {
        let mut mgr = TransferManager::new();
        let manifest = test_manifest();

        // Create incoming request
        let msg = FileTransferMessage::TransferRequest {
            transfer_id: "tx-300".to_string(),
            file_id: "file-123".to_string(),
            sender_did: "did:key:z6MkAlice".to_string(),
            manifest,
        };
        mgr.on_message("did:key:z6MkAlice", msg, 1000).unwrap();
        mgr.drain_events();

        // Reject
        let result = mgr.reject_transfer("tx-300", "no space".to_string(), 2000);
        assert!(result.is_ok());

        let session = mgr.get_session("tx-300").unwrap();
        assert_eq!(session.state, TransferState::Cancelled);
    }

    // ── TransportConfig Tests ─────────────────────────────────────────────

    #[test]
    fn test_transport_config_defaults() {
        let config = TransportConfig::default();
        assert_eq!(config.webrtc_timeout_ms, 2000);
        assert!(config.prefer_direct);
    }

    #[test]
    fn test_transport_selection_direct_peer_native() {
        let config = TransportConfig::default();
        // On native (is_wasm = false), directly reachable peer → Libp2p
        let transport = config.select_transport(true, false);
        assert_eq!(transport, TransportType::Libp2p);
    }

    #[test]
    fn test_transport_selection_direct_peer_wasm() {
        let config = TransportConfig::default();
        // On WASM (is_wasm = true), directly reachable peer → WebRtcDirect
        let transport = config.select_transport(true, true);
        assert_eq!(transport, TransportType::WebRtcDirect);
    }

    #[test]
    fn test_transport_selection_unreachable_peer() {
        let config = TransportConfig::default();
        // Peer not directly reachable → Relay (regardless of platform)
        let transport = config.select_transport(false, false);
        assert_eq!(transport, TransportType::Relay);

        let transport = config.select_transport(false, true);
        assert_eq!(transport, TransportType::Relay);
    }

    #[test]
    fn test_transport_selection_prefer_relay() {
        let config = TransportConfig {
            webrtc_timeout_ms: 2000,
            prefer_direct: false,
        };
        // When prefer_direct is false, always use Relay
        let transport = config.select_transport(true, false);
        assert_eq!(transport, TransportType::Relay);

        let transport = config.select_transport(true, true);
        assert_eq!(transport, TransportType::Relay);
    }

    #[test]
    fn test_manager_select_transport() {
        let mgr = TransferManager::new();
        // Default config prefers direct
        let transport = mgr.select_transport(true);
        // On native test runner, should be Libp2p (not wasm32)
        assert_eq!(transport, TransportType::Libp2p);

        let transport = mgr.select_transport(false);
        assert_eq!(transport, TransportType::Relay);
    }

    #[test]
    fn test_manager_set_transport_config() {
        let mut mgr = TransferManager::new();
        assert!(mgr.transport_config().prefer_direct);

        mgr.set_transport_config(TransportConfig {
            webrtc_timeout_ms: 5000,
            prefer_direct: false,
        });

        assert!(!mgr.transport_config().prefer_direct);
        assert_eq!(mgr.transport_config().webrtc_timeout_ms, 5000);

        // With prefer_direct=false, always relay
        let transport = mgr.select_transport(true);
        assert_eq!(transport, TransportType::Relay);
    }

    #[test]
    fn test_transport_config_serialization() {
        let config = TransportConfig {
            webrtc_timeout_ms: 3000,
            prefer_direct: true,
        };

        let json = serde_json::to_string(&config).unwrap();
        let restored: TransportConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.webrtc_timeout_ms, 3000);
        assert!(restored.prefer_direct);
    }
}
