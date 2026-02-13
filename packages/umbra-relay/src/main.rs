//! Umbra Relay Server
//!
//! A lightweight WebSocket relay server that provides:
//!
//! 1. **Signaling relay**: Forward SDP offers/answers between peers for WebRTC
//!    connection establishment when direct exchange isn't possible.
//!
//! 2. **Single-scan friend adding**: Alice creates a session with her offer,
//!    gets a link/QR code. Bob scans it, the relay forwards the SDP exchange
//!    automatically. No second scan needed.
//!
//! 3. **Offline message queue**: If a recipient is offline, the relay stores
//!    encrypted message blobs and delivers them when the peer reconnects.
//!
//! **Privacy**: The relay never sees plaintext content. All E2E encryption
//! happens client-side — the relay only handles opaque encrypted blobs.

mod federation;
mod handler;
mod protocol;
mod state;

use std::time::Duration;

use axum::{
    extract::{State, WebSocketUpgrade},
    http::Method,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use clap::Parser;
use serde_json::json;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use federation::Federation;
use state::{RelayConfig, RelayState};

// ── CLI Arguments ─────────────────────────────────────────────────────────────

#[derive(Parser, Debug)]
#[command(name = "umbra-relay", version, about = "Umbra P2P relay server")]
struct Args {
    /// Port to listen on
    #[arg(short, long, default_value_t = 8080, env = "RELAY_PORT")]
    port: u16,

    /// Maximum offline messages per DID
    #[arg(long, default_value_t = 1000, env = "MAX_OFFLINE_MESSAGES")]
    max_offline_messages: usize,

    /// Offline message TTL in days
    #[arg(long, default_value_t = 7, env = "OFFLINE_TTL_DAYS")]
    offline_ttl_days: i64,

    /// Session TTL in seconds
    #[arg(long, default_value_t = 3600, env = "SESSION_TTL_SECS")]
    session_ttl_secs: i64,

    /// Cleanup interval in seconds
    #[arg(long, default_value_t = 300, env = "CLEANUP_INTERVAL_SECS")]
    cleanup_interval_secs: u64,

    /// Server region label (e.g. "US East", "EU West")
    #[arg(long, default_value = "US East", env = "RELAY_REGION")]
    region: String,

    /// Server location / city (e.g. "New York", "Frankfurt")
    #[arg(long, default_value = "New York", env = "RELAY_LOCATION")]
    location: String,

    /// This relay's public WebSocket URL (for federation identity).
    /// Required when peers are configured.
    #[arg(long, env = "RELAY_PUBLIC_URL")]
    public_url: Option<String>,

    /// Peer relay WebSocket URLs to form a mesh with (comma-separated).
    /// Example: wss://relay2.example.com/ws,wss://relay3.example.com/ws
    #[arg(long, env = "RELAY_PEERS", value_delimiter = ',')]
    peers: Vec<String>,

    /// Relay ID — unique identifier for this relay instance.
    /// Defaults to a random UUID if not set.
    #[arg(long, env = "RELAY_ID")]
    relay_id: Option<String>,

    /// Presence heartbeat interval in seconds (how often to sync full
    /// presence with peers).
    #[arg(long, default_value_t = 30, env = "PRESENCE_HEARTBEAT_SECS")]
    presence_heartbeat_secs: u64,
}

// ── Entry Point ───────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "umbra_relay=info,tower_http=info".into()),
        )
        .init();

    let args = Args::parse();

    let config = RelayConfig {
        port: args.port,
        max_offline_per_did: args.max_offline_messages,
        session_ttl_secs: args.session_ttl_secs,
        offline_ttl_secs: args.offline_ttl_days * 24 * 3600,
        region: args.region,
        location: args.location,
    };

    // ── Federation Setup ──────────────────────────────────────────────────

    let peer_urls: Vec<String> = args
        .peers
        .into_iter()
        .filter(|url| !url.trim().is_empty())
        .collect();

    let state = if !peer_urls.is_empty() {
        let relay_id = args.relay_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        let public_url = args.public_url.unwrap_or_else(|| {
            format!("ws://0.0.0.0:{}/ws", args.port)
        });

        tracing::info!(
            relay_id = relay_id.as_str(),
            public_url = public_url.as_str(),
            peer_count = peer_urls.len(),
            "Federation enabled"
        );

        for peer in &peer_urls {
            tracing::info!(peer = peer.as_str(), "Configured peer relay");
        }

        let (inbound_tx, inbound_rx) = tokio::sync::mpsc::unbounded_channel();

        let federation = Federation::new(
            relay_id,
            public_url,
            config.region.clone(),
            config.location.clone(),
            peer_urls,
            inbound_tx,
        );

        let state = RelayState::with_federation(config, federation.clone());

        // Start federation connections
        federation.start();

        // Spawn federation inbound message handler
        let fed_state = state.clone();
        tokio::spawn(async move {
            handler::handle_federation_inbound(fed_state, inbound_rx).await;
        });

        // Spawn periodic presence heartbeat
        let heartbeat_state = state.clone();
        let heartbeat_interval = args.presence_heartbeat_secs;
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_secs(heartbeat_interval));
            loop {
                interval.tick().await;
                let dids = heartbeat_state.local_online_dids();
                if let Some(ref fed) = heartbeat_state.federation {
                    fed.broadcast_full_presence(dids);
                }
            }
        });

        state
    } else {
        tracing::info!("Federation disabled (no peers configured)");
        RelayState::new(config)
    };

    // Spawn periodic cleanup task
    let cleanup_state = state.clone();
    let cleanup_interval = args.cleanup_interval_secs;
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(cleanup_interval));
        loop {
            interval.tick().await;
            cleanup_state.cleanup_expired();
        }
    });

    // Build router
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/federation", get(federation_ws_handler))
        .route("/health", get(health_handler))
        .route("/stats", get(stats_handler))
        .route("/info", get(info_handler))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = format!("0.0.0.0:{}", args.port);
    tracing::info!("Umbra relay server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to bind address");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}

// ── Route Handlers ────────────────────────────────────────────────────────────

/// WebSocket upgrade handler for client connections.
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<RelayState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handler::handle_websocket(socket, state))
}

/// WebSocket upgrade handler for federation (relay-to-relay) connections.
async fn federation_ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<RelayState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handler::handle_federation_peer(socket, state))
}

/// Health check endpoint.
async fn health_handler() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "service": "umbra-relay",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

/// Statistics endpoint.
async fn stats_handler(State(state): State<RelayState>) -> impl IntoResponse {
    Json(json!({
        "online_clients": state.online_count(),
        "mesh_online_clients": state.mesh_online_count(),
        "offline_queue_size": state.offline_queue_size(),
        "active_sessions": state.sessions.len(),
        "connected_peers": state.connected_peers(),
        "federation_enabled": state.federation.is_some(),
    }))
}

/// Server info endpoint — returns metadata including region and location.
/// Also useful for client-side ping measurement (time the round-trip).
async fn info_handler(State(state): State<RelayState>) -> impl IntoResponse {
    Json(json!({
        "service": "umbra-relay",
        "version": env!("CARGO_PKG_VERSION"),
        "region": state.config.region,
        "location": state.config.location,
        "online_clients": state.online_count(),
        "mesh_online_clients": state.mesh_online_count(),
        "connected_peers": state.connected_peers(),
        "federation_enabled": state.federation.is_some(),
        "timestamp": chrono::Utc::now().timestamp_millis(),
    }))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_health_json_structure() {
        let json_val = json!({
            "status": "ok",
            "service": "umbra-relay",
            "version": env!("CARGO_PKG_VERSION"),
        });
        assert_eq!(json_val["status"], "ok");
        assert_eq!(json_val["service"], "umbra-relay");
    }

    #[test]
    fn test_default_config() {
        let config = RelayConfig::default();
        assert_eq!(config.port, 8080);
        assert_eq!(config.max_offline_per_did, 1000);
        assert_eq!(config.session_ttl_secs, 3600);
        assert_eq!(config.offline_ttl_secs, 7 * 24 * 3600);
        assert_eq!(config.region, "US East");
        assert_eq!(config.location, "New York");
    }

    #[tokio::test]
    async fn test_state_creation() {
        let state = RelayState::new(RelayConfig::default());
        assert_eq!(state.online_count(), 0);
        assert_eq!(state.offline_queue_size(), 0);
    }
}
