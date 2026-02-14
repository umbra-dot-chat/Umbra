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
 * ICE servers for WebRTC call connections.
 * Includes public STUN and self-hosted TURN.
 */
export const ICE_SERVERS: IceServerConfig[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: [
      'turn:turn.deepspaceshipping.co:3478?transport=udp',
      'turn:turn.deepspaceshipping.co:3478?transport=tcp',
    ],
    // Credentials are generated dynamically via generateTurnCredentials()
  },
];

export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Generate time-limited TURN credentials using HMAC-SHA1.
 *
 * The relay server shares a static secret with coturn.
 * Credentials expire after `ttlSeconds` (default 24h).
 */
export async function generateTurnCredentials(
  secret: string,
  ttlSeconds = 86400,
): Promise<{ username: string; credential: string }> {
  const timestamp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const username = `${timestamp}:umbra`;

  // HMAC-SHA1 via Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(username));

  // Base64-encode the signature
  const credential = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return { username, credential };
}

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
