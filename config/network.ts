/**
 * Network Configuration
 *
 * Default relay servers and network settings for Umbra.
 */

/**
 * Default relay servers for signaling and offline messaging.
 * These are tried in order if the primary fails.
 */
export const DEFAULT_RELAY_SERVERS = [
  'wss://relay.deepspaceshipping.co/ws',
  'wss://seoul.relay.deepspaceshipping.co/ws',
] as const;

/**
 * The primary relay server URL
 */
export const PRIMARY_RELAY_URL = DEFAULT_RELAY_SERVERS[0];

/**
 * Bootstrap peers for DHT discovery (if enabled)
 */
export const BOOTSTRAP_PEERS: string[] = [
  // Add bootstrap node multiaddresses here when available
  // e.g., '/ip4/1.2.3.4/tcp/4001/p2p/QmPeerId...'
];

/**
 * Network configuration defaults
 */
export const NETWORK_CONFIG = {
  /** Enable DHT-based peer discovery */
  enableDht: false,

  /** Enable relay server for signaling and offline messages */
  enableRelay: true,

  /** Auto-connect to relay on app start */
  autoConnectRelay: true,

  /** Timeout for network operations (ms) */
  timeout: 30000,

  /** Reconnect delay on disconnect (ms) */
  reconnectDelay: 5000,

  /** Max reconnect attempts before giving up */
  maxReconnectAttempts: 5,
} as const;
