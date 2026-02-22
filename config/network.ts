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
  'wss://relay.umbra.chat/ws',
  'wss://seoul.relay.umbra.chat/ws',
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
      'turn:turn.umbra.chat:3478?transport=udp',
      'turn:turn.umbra.chat:3478?transport=tcp',
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

// ─── TURN Credential Resolution ──────────────────────────────────────────────

/** Cached TURN credentials (shared across all CallManager instances). */
let _turnCredsCache: { username: string; credential: string; expiresAt: number } | null = null;

/**
 * Resolve TURN credentials for WebRTC calls.
 *
 * Tries in order:
 * 1. Return cached credentials if still valid (> 1 hour remaining)
 * 2. Fetch from relay server `/turn-credentials` endpoint
 * 3. Generate locally from EXPO_PUBLIC_TURN_SECRET env var
 *
 * Returns null if no TURN credentials are available.
 */
export async function resolveTurnCredentials(): Promise<{ username: string; credential: string } | null> {
  // Return cached if still valid (1 hour buffer before expiry)
  if (_turnCredsCache && _turnCredsCache.expiresAt - Date.now() > 60 * 60 * 1000) {
    return { username: _turnCredsCache.username, credential: _turnCredsCache.credential };
  }

  // Try fetching from relay server
  for (const wsUrl of DEFAULT_RELAY_SERVERS) {
    try {
      const httpUrl = wsUrl
        .replace('wss://', 'https://')
        .replace('ws://', 'http://')
        .replace(/\/ws\/?$/, '/turn-credentials');
      const res = await fetch(httpUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data.username && data.credential) {
          const ttl = data.ttl ?? 86400;
          _turnCredsCache = {
            username: data.username,
            credential: data.credential,
            expiresAt: Date.now() + ttl * 1000,
          };
          console.log('[TURN] Credentials fetched from relay');
          return { username: data.username, credential: data.credential };
        }
      }
    } catch {
      // Relay endpoint not available, try next
    }
  }

  // Fall back to local secret from env var
  const secret =
    (typeof process !== 'undefined' && (process.env as any)?.EXPO_PUBLIC_TURN_SECRET) || null;
  if (secret) {
    const creds = await generateTurnCredentials(secret);
    _turnCredsCache = {
      ...creds,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    };
    console.log('[TURN] Credentials generated from env secret');
    return creds;
  }

  console.warn('[TURN] No TURN credentials available — remote calls may fail on restrictive NATs');
  return null;
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

  /** Max reconnect attempts before giving up (per server) */
  maxReconnectAttempts: 5,

  /** Keep-alive ping interval (ms) — should be less than server idle timeout */
  keepAliveInterval: 25_000,

  /** Maximum backoff delay cap (ms) */
  maxBackoffDelay: 30_000,
} as const;
