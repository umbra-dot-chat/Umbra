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

use serde::{Deserialize, Serialize};
use crate::storage::chunking::ChunkManifest;

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
        matches!(self, Self::Requesting | Self::Negotiating | Self::Transferring)
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
                ChunkRef { chunk_id: "c1".to_string(), chunk_index: 0, size: 256, hash: "h1".to_string() },
                ChunkRef { chunk_id: "c2".to_string(), chunk_index: 1, size: 256, hash: "h2".to_string() },
                ChunkRef { chunk_id: "c3".to_string(), chunk_index: 2, size: 256, hash: "h3".to_string() },
                ChunkRef { chunk_id: "c4".to_string(), chunk_index: 3, size: 256, hash: "h4".to_string() },
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
            FileTransferMessage::ChunkData { chunk_index, data_b64, .. } => {
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
}
