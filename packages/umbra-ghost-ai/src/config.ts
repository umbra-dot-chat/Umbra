/**
 * Ghost configuration — loaded from CLI args + environment variables.
 */

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
