/**
 * Debug Tracer — captures WASM calls, SQL queries, network events, and memory snapshots.
 *
 * Sends trace events via WebSocket to a debug TUI on port 9999.
 * Zero overhead when debug mode is not active.
 *
 * ## Activation (any of these):
 * 1. Auto-detect: WebSocket to ws://localhost:9999 connects successfully
 * 2. localStorage.__umbra_debug === '1'
 * 3. URL contains ?debug=1 or &debug=1
 *
 * ## Verbose mode:
 * localStorage.__umbra_debug_verbose === '1' — includes argPreview in events.
 */

import { getSqlBridgeStats } from './sql-bridge';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

export interface TraceEvent {
  seq: number;
  ts: number;
  cat: 'wasm' | 'sql' | 'net' | 'mem' | 'err';
  fn: string;
  argBytes: number;
  argPreview?: string;
  durMs: number;
  memBefore: number;
  memAfter: number;
  memGrowth: number;
  sqlContext?: string;
  clientId?: string;
  err?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const WS_URL = 'ws://localhost:9999';
const RECONNECT_INTERVAL_MS = 5000;
const RING_BUFFER_MAX = 10_000;
const MEMORY_MONITOR_INTERVAL_MS = 2000;
const IDB_STORE_NAME = 'umbra_trace_events';
const IDB_DB_NAME = 'umbra_debug_tracer';

// ─────────────────────────────────────────────────────────────────────────
// Module state
// ─────────────────────────────────────────────────────────────────────────

let _active = false;
let _verbose = false;
let _seq = 0;
let _clientId: string = '';
let _transport: DebugTransport | null = null;
let _memoryMonitorTimer: ReturnType<typeof setInterval> | null = null;
let _firstSnapshot = true;

/** Current WASM function context for SQL correlation. */
let _traceContext: string | undefined;

// ─────────────────────────────────────────────────────────────────────────
// DebugTransport
// ─────────────────────────────────────────────────────────────────────────

class DebugTransport {
  private _ws: WebSocket | null = null;
  private _connected = false;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _ringBuffer: TraceEvent[] = [];
  private _disposed = false;

  constructor() {
    this._connect();
    this._installBeforeUnload();
  }

  isConnected(): boolean {
    return this._connected;
  }

  send(event: TraceEvent): void {
    if (this._connected && this._ws && this._ws.readyState === WebSocket.OPEN) {
      try {
        this._ws.send(JSON.stringify(event));
      } catch {
        this._pushToRing(event);
      }
    } else {
      this._pushToRing(event);
    }
  }

  dispose(): void {
    this._disposed = true;
    if (this._reconnectTimer !== null) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    if (this._ws) {
      this._ws.onopen = null;
      this._ws.onclose = null;
      this._ws.onerror = null;
      this._ws.onmessage = null;
      try { this._ws.close(); } catch { /* ignore */ }
      this._ws = null;
    }
    this._connected = false;
  }

  private _connect(): void {
    if (this._disposed) return;
    try {
      const ws = new WebSocket(WS_URL);
      this._ws = ws;

      ws.onopen = () => {
        this._connected = true;
        // Flush ring buffer to the newly connected WS
        this._flushRingToWs();
      };

      ws.onclose = () => {
        this._connected = false;
        this._ws = null;
        this._scheduleReconnect();
      };

      ws.onerror = () => {
        // onclose will fire after onerror
      };
    } catch {
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect(): void {
    if (this._disposed) return;
    if (this._reconnectTimer !== null) return;
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      this._connect();
    }, RECONNECT_INTERVAL_MS);
  }

  private _pushToRing(event: TraceEvent): void {
    this._ringBuffer.push(event);
    if (this._ringBuffer.length > RING_BUFFER_MAX) {
      this._ringBuffer.shift();
    }
  }

  private _flushRingToWs(): void {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) return;
    const events = this._ringBuffer.splice(0);
    for (const event of events) {
      try {
        this._ws.send(JSON.stringify(event));
      } catch {
        // Re-push failed events
        this._ringBuffer.unshift(event);
        break;
      }
    }
  }

  private _installBeforeUnload(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeunload', () => {
      if (this._ringBuffer.length === 0) return;
      this._flushRingToIdb();
    });
  }

  private _flushRingToIdb(): void {
    if (this._ringBuffer.length === 0) return;
    try {
      const request = indexedDB.open(IDB_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const idb = request.result;
        if (!idb.objectStoreNames.contains(IDB_STORE_NAME)) {
          idb.createObjectStore(IDB_STORE_NAME, { keyPath: 'seq' });
        }
      };
      request.onsuccess = () => {
        const idb = request.result;
        try {
          const tx = idb.transaction(IDB_STORE_NAME, 'readwrite');
          const store = tx.objectStore(IDB_STORE_NAME);
          for (const event of this._ringBuffer) {
            store.put(event);
          }
          this._ringBuffer = [];
        } catch { /* best effort */ }
      };
    } catch { /* best effort */ }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Activation detection
// ─────────────────────────────────────────────────────────────────────────

function _checkLocalStorageFlag(): boolean {
  try {
    return typeof localStorage !== 'undefined' &&
      localStorage.getItem('__umbra_debug') === '1';
  } catch {
    return false;
  }
}

function _checkUrlParam(): boolean {
  try {
    if (typeof window === 'undefined' || !window.location) return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === '1';
  } catch {
    return false;
  }
}

function _checkVerbose(): boolean {
  try {
    return typeof localStorage !== 'undefined' &&
      localStorage.getItem('__umbra_debug_verbose') === '1';
  } catch {
    return false;
  }
}

function _generateClientId(): string {
  const arr = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < 8; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

// ─────────────────────────────────────────────────────────────────────────
// Memory monitor
// ─────────────────────────────────────────────────────────────────────────

function _startMemoryMonitor(): void {
  if (_memoryMonitorTimer !== null) return;

  _memoryMonitorTimer = setInterval(() => {
    if (!_active) return;

    const perfMem = (performance as any).memory;
    const jsHeapUsed = perfMem?.usedJSHeapSize ?? 0;
    const jsHeapTotal = perfMem?.totalJSHeapSize ?? 0;

    // WASM module memories
    const wasmMemories: Array<{ label: string; bytes: number }> = [];
    const capturedMemories = (globalThis as any).__umbra_wasm_memories;
    if (Array.isArray(capturedMemories)) {
      for (const entry of capturedMemories) {
        try {
          const bytes = entry.memory?.buffer?.byteLength ?? 0;
          wasmMemories.push({ label: entry.label ?? 'unknown', bytes });
        } catch { /* detached buffer */ }
      }
    }

    // memory.grow stats
    const allocFn = (globalThis as any).__umbra_wasm_alloc_stats;
    const allocStats = typeof allocFn === 'function' ? allocFn() : null;

    // DOM node count
    let domNodes = 0;
    try {
      if (typeof document !== 'undefined') {
        domNodes = document.querySelectorAll('*').length;
      }
    } catch { /* SSR or no DOM */ }

    // Active WS connections + bufferedAmount
    const wsStatsFn = (globalThis as any).__umbra_ws_debug_stats;
    const wsStats = typeof wsStatsFn === 'function' ? wsStatsFn() : null;

    // SQL bridge stats
    let sqlStats: { executes: number; queries: number; exports: number } | null = null;
    try {
      sqlStats = getSqlBridgeStats();
    } catch { /* not initialized */ }

    // Build the preview string for argPreview
    const parts: string[] = [
      `jsHeap=${(jsHeapUsed / 1024 / 1024).toFixed(1)}/${(jsHeapTotal / 1024 / 1024).toFixed(1)}MB`,
    ];
    for (const wm of wasmMemories) {
      const shortLabel = wm.label.includes('sql') ? 'sql.js'
        : wm.label.includes('umbra_core') ? 'umbra-core'
        : wm.label.split('/').pop()?.split('?')[0] ?? wm.label;
      parts.push(`${shortLabel}=${(wm.bytes / 1024 / 1024).toFixed(1)}MB`);
    }
    if (allocStats) {
      parts.push(`grows=${allocStats.growCount}`);
    }
    parts.push(`dom=${domNodes}`);
    if (wsStats) {
      parts.push(`ws=${wsStats.activeCount ?? 0} buf=${wsStats.bufferedAmount ?? 0}`);
    }
    if (sqlStats) {
      parts.push(`sql:exec=${sqlStats.executes} q=${sqlStats.queries} exp=${sqlStats.exports}`);
    }

    const preview = parts.join(' ');

    // Build event
    const event: Partial<TraceEvent> = {
      cat: 'mem',
      fn: 'memory_snapshot',
      argBytes: 0,
      durMs: 0,
      memBefore: jsHeapUsed,
      memAfter: jsHeapUsed,
      memGrowth: 0,
    };

    // Include system info only on first snapshot
    if (_firstSnapshot) {
      _firstSnapshot = false;
      const sysInfo = typeof navigator !== 'undefined'
        ? `${navigator.userAgent} | devMem=${(navigator as any).deviceMemory ?? '?'}GB`
        : 'no-navigator';
      event.argPreview = `[SYSTEM] ${sysInfo} | ${preview}`;
    } else {
      event.argPreview = preview;
    }

    emit(event);
  }, MEMORY_MONITOR_INTERVAL_MS);
}

function _stopMemoryMonitor(): void {
  if (_memoryMonitorTimer !== null) {
    clearInterval(_memoryMonitorTimer);
    _memoryMonitorTimer = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Initialize the debug tracer. Call once at startup.
 *
 * Checks activation conditions (WS auto-detect, localStorage flag, URL param).
 * When active, starts the WebSocket transport and memory monitor.
 * When inactive, all tracing is no-op with zero overhead.
 */
export function initTracer(): void {
  // Check activation conditions
  const flagActive = _checkLocalStorageFlag() || _checkUrlParam();

  _verbose = _checkVerbose();
  _clientId = _generateClientId();

  if (flagActive) {
    // Explicit flag — activate immediately
    _activate();
    return;
  }

  // Auto-detect: try connecting to WS. If it connects, activate.
  try {
    const probe = new WebSocket(WS_URL);
    const probeTimeout = setTimeout(() => {
      try { probe.close(); } catch { /* ignore */ }
    }, 2000);

    probe.onopen = () => {
      clearTimeout(probeTimeout);
      probe.close();
      _activate();
    };

    probe.onerror = () => {
      clearTimeout(probeTimeout);
      // No debug TUI running — stay inactive (zero overhead)
    };

    probe.onclose = () => {
      clearTimeout(probeTimeout);
    };
  } catch {
    // WebSocket not available — no-op
  }
}

function _activate(): void {
  if (_active) return;
  _active = true;
  _transport = new DebugTransport();
  _startMemoryMonitor();
  console.log(`[tracer] Debug tracer ACTIVE (clientId=${_clientId}, verbose=${_verbose})`);
}

/**
 * Emit a trace event. No-op when debug is not active.
 */
export function emit(partial: Partial<TraceEvent>): void {
  if (!_active || !_transport) return;

  const event: TraceEvent = {
    seq: _seq++,
    ts: performance.now(),
    cat: partial.cat ?? 'wasm',
    fn: partial.fn ?? '',
    argBytes: partial.argBytes ?? 0,
    durMs: partial.durMs ?? 0,
    memBefore: partial.memBefore ?? 0,
    memAfter: partial.memAfter ?? 0,
    memGrowth: partial.memGrowth ?? 0,
    clientId: _clientId,
  };

  if (partial.argPreview !== undefined) event.argPreview = partial.argPreview;
  if (partial.sqlContext !== undefined) event.sqlContext = partial.sqlContext;
  if (partial.err !== undefined) event.err = partial.err;
  if (_traceContext !== undefined && event.sqlContext === undefined) {
    event.sqlContext = _traceContext;
  }

  _transport.send(event);
}

/**
 * Check whether debug tracing is currently active.
 */
export function isDebugActive(): boolean {
  return _active;
}

/**
 * Get the tracer transport and clientId, or null if not active.
 */
export function getTracer(): { transport: DebugTransport; clientId: string } | null {
  if (!_active || !_transport) return null;
  return { transport: _transport, clientId: _clientId };
}

/**
 * Set the current WASM function context for SQL correlation.
 * SQL events emitted while a context is set will include sqlContext.
 */
export function setTraceContext(fnName: string): void {
  _traceContext = fnName;
}

/**
 * Clear the current WASM function context.
 */
export function clearTraceContext(): void {
  _traceContext = undefined;
}

/**
 * Check if verbose mode is active (includes argPreview in events).
 */
export function isVerbose(): boolean {
  return _verbose;
}

// ─────────────────────────────────────────────────────────────────────────
// Rust trace bridge poller
// ─────────────────────────────────────────────────────────────────────────

/** Rust TraceEvent shape returned by umbra_wasm_flush_trace_events(). */
interface RustTraceEvent {
  level: string;
  target: string;
  message: string;
  fields: string;
  timestamp_ms: number;
}

const RUST_POLL_INTERVAL_MS = 500;
let _rustPollTimer: ReturnType<typeof setInterval> | null = null;
let _flushFn: (() => string) | null = null;

/**
 * Start polling the Rust tracing ring buffer for events.
 *
 * Call this after WASM init when debug mode is active. Provide the
 * `umbra_wasm_flush_trace_events` function from the WASM module.
 * Events are converted to TraceEvents and sent to the debug TUI
 * via the existing WebSocket transport.
 *
 * No-op when debug is not active or already polling.
 */
export function startRustTracePoller(flushTraceEvents: () => string): void {
  if (!_active || _rustPollTimer !== null) return;
  _flushFn = flushTraceEvents;

  _rustPollTimer = setInterval(() => {
    if (!_active || !_flushFn) return;

    let json: string;
    try {
      json = _flushFn();
    } catch {
      return; // WASM not ready or function unavailable
    }

    if (json === '[]' || !json) return;

    let events: RustTraceEvent[];
    try {
      events = JSON.parse(json);
    } catch {
      return; // Malformed JSON
    }

    for (const re of events) {
      const preview = re.fields
        ? `[${re.level}] ${re.target}: ${re.message} { ${re.fields} }`
        : `[${re.level}] ${re.target}: ${re.message}`;

      emit({
        cat: 'wasm',
        fn: `rust::${re.target}`,
        argBytes: 0,
        durMs: 0,
        memBefore: 0,
        memAfter: 0,
        memGrowth: 0,
        argPreview: preview,
      });
    }
  }, RUST_POLL_INTERVAL_MS);

  console.log('[tracer] Rust trace bridge poller started (500ms interval)');
}

/**
 * Stop the Rust trace bridge poller.
 */
export function stopRustTracePoller(): void {
  if (_rustPollTimer !== null) {
    clearInterval(_rustPollTimer);
    _rustPollTimer = null;
  }
  _flushFn = null;
}
