/**
 * Ghost configuration — loaded from CLI args + environment variables.
 */

export interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export interface GhostConfig {
  /** Relay WebSocket URL */
  relayUrl: string;
  /** Ollama API base URL */
  ollamaUrl: string;
  /** LLM model name for chat */
  model: string;
  /** Embedding model name for RAG */
  embedModel: string;
  /** Bot language */
  language: 'en' | 'ko';
  /** Data directory for identity + DB */
  dataDir: string;
  /** Path to Umbra codebase for RAG */
  codebasePath: string;
  /** HTTP port for health/webhook endpoints */
  httpPort: number;
  /** Log level */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Enable call handling */
  callEnabled: boolean;
  /** Fake ring delay before answering (ms) */
  callRingDelayMs: number;
  /** Path to media config JSON */
  mediaConfigPath: string;
  /** Directory to cache downloaded media */
  mediaCacheDir: string;
  /** ICE servers for WebRTC */
  iceServers: IceServer[];
  /** How often to collect WebRTC stats (ms) */
  callStatsIntervalMs: number;
  /** How often to broadcast metadata via data channel (ms) */
  metadataBroadcastMs: number;
}

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;

export function loadConfig(opts: Record<string, string | undefined>): GhostConfig {
  return {
    relayUrl: opts.relay || process.env.RELAY_URL || 'wss://relay.umbra.chat/ws',
    ollamaUrl: opts.ollama || process.env.OLLAMA_URL || 'http://localhost:11434',
    model: opts.model || process.env.MODEL || 'llama3.1',
    embedModel: opts.embedModel || process.env.EMBED_MODEL || 'nomic-embed-text',
    language: (opts.language || process.env.LANGUAGE || 'en') as 'en' | 'ko',
    dataDir: opts.dataDir || process.env.DATA_DIR || './data',
    codebasePath: opts.codebasePath || process.env.CODEBASE_PATH || '../Umbra',
    httpPort: parseInt(opts.httpPort || process.env.HTTP_PORT || '3333', 10),
    logLevel: (opts.logLevel || process.env.LOG_LEVEL || 'info') as GhostConfig['logLevel'],
    callEnabled: (opts.callEnabled || process.env.CALL_ENABLED || 'true') === 'true',
    callRingDelayMs: parseInt(opts.callRingDelay || process.env.CALL_RING_DELAY || '2500', 10),
    mediaConfigPath: opts.mediaConfig || process.env.MEDIA_CONFIG || 'media.config.json',
    mediaCacheDir: opts.mediaCacheDir || process.env.MEDIA_CACHE_DIR || '',
    iceServers: DEFAULT_ICE_SERVERS,
    callStatsIntervalMs: 2000,
    metadataBroadcastMs: 2000,
  };
}

/** Simple leveled logger */
export function createLogger(config: GhostConfig) {
  const minLevel = LOG_LEVELS[config.logLevel];
  const lang = config.language.toUpperCase();

  return {
    debug: (...args: unknown[]) => {
      if (minLevel <= 0) console.log(`[${lang}] [DEBUG]`, ...args);
    },
    info: (...args: unknown[]) => {
      if (minLevel <= 1) console.log(`[${lang}] [INFO]`, ...args);
    },
    warn: (...args: unknown[]) => {
      if (minLevel <= 2) console.warn(`[${lang}] [WARN]`, ...args);
    },
    error: (...args: unknown[]) => {
      if (minLevel <= 3) console.error(`[${lang}] [ERROR]`, ...args);
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
