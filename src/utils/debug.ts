/**
 * Umbra Debug Logging Infrastructure
 *
 * 6-level structured logger with category filtering, ring buffer,
 * crash guard, render loop detection, throughput metrics, and
 * performance timeline integration.
 *
 * Tree-shaken in production via __DEV__ guards at call sites.
 * Singleton lives on window.__debug to survive HMR.
 *
 * Console commands:
 *   __debug.help()                  Show all available commands
 *   __debug.enableAll()             Enable all log categories
 *   __debug.enable('service')       Enable specific category
 *   __debug.disable('render')       Disable specific category
 *   __debug.setLevel('warn')        Set minimum log level
 *   __debug.dump()                  Dump ring buffer (last 500 entries)
 *   __debug.entries()               Get ring buffer as array
 *   __debug.clear()                 Clear ring buffer
 *   __debug.downloadJson()          Download ring buffer as .json
 *   __debug.downloadTxt()           Download ring buffer as .txt
 *   __debug.renderCounts()          Show render count stats
 *   __debug.resetRenderCounts()     Reset render counters
 *   __debug.stats()                 Show per-category throughput stats
 *   __debug.filterSource('Chat')    Only show logs from matching source
 *   __debug.clearFilter()           Clear source filter
 *   __debug.snapshot()              Capture full app state snapshot
 *   __debug.startLongTasks()        Start long task detection
 *   __debug.stopLongTasks()         Stop long task detection
 *   __debug.time('label')           Start timer, returns stop fn
 *
 * Categories (layer):  render, service, network, state, lifecycle, perf
 * Categories (feature): conversations, messages, friends, sync, auth, plugins
 * Levels: trace, debug, info, warn, error, fatal
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/** Web Vitals metrics */
export interface WebVitalsData {
  /** Interaction to Next Paint (ms) */
  inp: number | null;
  /** Cumulative Layout Shift */
  cls: number;
  /** Largest Contentful Paint (ms) */
  lcp: number | null;
  /** First Contentful Paint (ms) */
  fcp: number | null;
}

/** Performance budget thresholds */
export interface PerfBudgets {
  /** Max component render duration (ms) — default 16 */
  renderMs: number;
  /** Max WASM call duration (ms) — default 100 */
  wasmMs: number;
  /** Max heap usage percent — default 80 */
  heapPct: number;
  /** Max relay message size (bytes) — default 1_000_000 */
  messageSizeBytes: number;
  /** Max component renders/sec — default 60 */
  renderRatePerSec: number;
}

/** Persisted to localStorage every heartbeat — survives OOM crashes */
export interface CrashVitals {
  /** Wall-clock timestamp */
  ts: number;
  /** JS heap used bytes */
  heap: number;
  /** JS heap limit bytes */
  heapLimit: number;
  /** Total DOM node count */
  domNodes: number;
  /** DOM nodes added since last heartbeat */
  domDelta: number;
  /** UmbraService listener counts by type */
  listenerCounts: Record<string, number>;
  /** Global addEventListener/removeEventListener balance */
  globalListenerBalance: number;
  /** Per-component render counts */
  renderCounts: Record<string, number>;
  /** Total renders in last 2s window */
  renderRate: number;
  /** Per-component render rates (renders/sec) */
  renderRates: Record<string, number>;
  /** Message events dispatched in last heartbeat window */
  messageEventRate: number;
  /** "Not a known friend" failures since boot */
  nonFriendFailures: number;
  /** GC pressure: heap delta since last heartbeat */
  heapDelta: number;
  /** Most recent error/warning message */
  lastError: string | null;
  /** Heartbeat sequence number */
  heartbeatSeq: number;
  /** Web Vitals at time of crash */
  webVitals?: WebVitalsData;
  /** Budget violations at time of crash */
  budgetViolations?: string[];
}

// Layer categories
// Feature categories
export type LogCategory =
  | 'render'        // Component renders & re-renders
  | 'service'       // UmbraService / WASM FFI calls
  | 'network'       // Relay, WebSocket, event dispatch
  | 'state'         // State changes, context updates
  | 'lifecycle'     // Init, hydration, mount/unmount
  | 'perf'          // Performance, long tasks, timing
  | 'conversations' // Conversation list fetches, subscriptions
  | 'messages'      // Message send/receive/edit/delete
  | 'friends'       // Friend requests, list, block/unblock
  | 'sync'          // Cross-device sync, KV operations
  | 'auth'          // Authentication, identity, PIN
  | 'plugins'       // Plugin loading, lifecycle, commands
  | 'call'          // Voice/video calls, WebRTC
  | 'groups'        // Group chat operations
  | 'community';    // Community channels, roles, settings

export interface LogEntry {
  /** performance.now() for relative timing */
  t: number;
  /** Date.now() wall clock */
  ts: number;
  /** Log level */
  level: LogLevel;
  /** Category tag */
  cat: LogCategory;
  /** Source component/hook/file (optional) */
  src?: string;
  /** Log message */
  msg: string;
  /** Serialized data (JSON.stringify, truncated at 500 chars) */
  data?: string;
  /** Stack trace (auto on error + fatal) */
  stack?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5,
};

const ALL_CATEGORIES: LogCategory[] = [
  'render', 'service', 'network', 'state', 'lifecycle', 'perf',
  'conversations', 'messages', 'friends', 'sync', 'auth', 'plugins',
  'call', 'groups', 'community',
];

// Standard severity colors
const LEVEL_COLORS: Record<LogLevel, string> = {
  trace: 'color: #9e9e9e',                                   // gray
  debug: 'color: #00bcd4',                                   // cyan
  info:  'color: #4caf50',                                   // green
  warn:  'color: #ff9800',                                   // orange
  error: 'color: #f44336',                                   // red
  fatal: 'color: #fff; background: #f44336; padding: 1px 4px; border-radius: 2px', // white-on-red
};

// Console method mapping (trace → console.debug, fatal → console.error)
const LEVEL_CONSOLE: Record<LogLevel, 'debug' | 'info' | 'warn' | 'error'> = {
  trace: 'debug', debug: 'debug', info: 'info', warn: 'warn', error: 'error', fatal: 'error',
};

// ─── Ring Buffer ────────────────────────────────────────────────────────────

class RingBuffer {
  private buf: (LogEntry | null)[];
  private head = 0;
  private count = 0;
  private readonly cap: number;
  private readonly key: string;

  constructor(capacity = 500, persistKey = '__umbra_ring_buffer__') {
    this.cap = capacity;
    this.key = persistKey;
    this.buf = new Array(capacity).fill(null);

    // Restore from sessionStorage (survives page refresh, not tab close)
    try {
      const saved = sessionStorage.getItem(this.key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.buf?.length === capacity) {
          this.buf = parsed.buf;
          this.head = parsed.head;
          this.count = parsed.count;
        }
      }
    } catch { /* ignore */ }
  }

  push(entry: LogEntry) {
    this.buf[this.head] = entry;
    this.head = (this.head + 1) % this.cap;
    this.count = Math.min(this.count + 1, this.cap);
  }

  getEntries(): LogEntry[] {
    const result: LogEntry[] = [];
    const start = this.count < this.cap ? 0 : this.head;
    for (let i = 0; i < this.count; i++) {
      const idx = (start + i) % this.cap;
      const entry = this.buf[idx];
      if (entry) result.push(entry);
    }
    return result;
  }

  persist() {
    try {
      sessionStorage.setItem(this.key, JSON.stringify({
        buf: this.buf, head: this.head, count: this.count,
      }));
    } catch { /* ignore */ }
  }

  /** Format entries as human-readable text with absolute + delta timestamps */
  dump(): string {
    const entries = this.getEntries();
    if (entries.length === 0) return '(ring buffer empty)';
    let prevT = entries[0].t;
    return entries
      .map(e => {
        const abs = formatAbsTime(e.ts);
        const delta = (e.t - prevT).toFixed(0);
        prevT = e.t;
        const lvl = e.level.toUpperCase().padEnd(5);
        const cat = e.cat.padEnd(13);
        const src = e.src ? `[${e.src}] ` : '';
        const data = e.data ? ` | ${e.data}` : '';
        const stack = e.stack ? `\n    ${e.stack.split('\n').slice(1, 3).join('\n    ')}` : '';
        return `${abs} (+${delta}ms) ${lvl} [${cat}] ${src}${e.msg}${data}${stack}`;
      })
      .join('\n');
  }

  clear() {
    this.buf = new Array(this.cap).fill(null);
    this.head = 0;
    this.count = 0;
    try { sessionStorage.removeItem(this.key); } catch { /* ignore */ }
  }

  get size() { return this.count; }
}

// ─── Logger ─────────────────────────────────────────────────────────────────

class DebugLogger {
  private enabled = new Set<LogCategory>();
  private minLevel: LogLevel = 'info';
  private ring: RingBuffer;
  private renderCounts = new Map<string, number>();
  private _loafObserver: PerformanceObserver | null = null;
  private _heartbeatId: any = null;
  private _persistId: any = null;
  private _lastLogT = 0;
  private _sourceFilter: string | null = null;

  // Per-category throughput counters
  private _catCounts = new Map<LogCategory, number>();
  private _catWindowStart = performance.now();
  private _totalCount = 0;

  // Render rate: rolling window of timestamps per component
  private _renderWindow = new Map<string, number[]>();

  // Vitals: last known DOM count for delta calculation
  private _lastDomNodes = 0;
  private _lastHeapBytes = 0;
  private _lastError: string | null = null;

  // MutationObserver for real-time DOM tracking
  private _mutationObserver: MutationObserver | null = null;
  private _domMutationAdds = 0;
  private _domMutationRemoves = 0;

  // TUI WebSocket bridge
  private _tuiWs: WebSocket | null = null;
  private _tuiReconnectId: any = null;

  // High-frequency trace buffer (hot-path perf, no console output)
  private traceRing: RingBuffer;

  // Web Vitals
  private _webVitals: WebVitalsData = { inp: null, cls: 0, lcp: null, fcp: null };

  // React Profiler stats
  private _profilerStats = new Map<string, { count: number; totalMs: number; maxMs: number; mounts: number; updates: number }>();

  // Performance budgets
  private _budgets: PerfBudgets = {
    renderMs: 16,
    wasmMs: 100,
    heapPct: 80,
    messageSizeBytes: 1_000_000,
    renderRatePerSec: 60,
  };
  private _budgetViolations: string[] = [];

  constructor() {
    this.ring = new RingBuffer(500);
    this.traceRing = new RingBuffer(2000);

    // Enable all categories by default in dev mode
    ALL_CATEGORIES.forEach(c => this.enabled.add(c));

    // Load persisted config (overrides defaults)
    try {
      const saved = localStorage.getItem('__umbra_debug_config__');
      if (saved) {
        const cfg = JSON.parse(saved);
        if (cfg.categories) this.enabled = new Set(cfg.categories);
        if (cfg.minLevel && LOG_LEVELS[cfg.minLevel as LogLevel] !== undefined) {
          this.minLevel = cfg.minLevel;
        }
      }
    } catch { /* ignore */ }

    // Auto-persist ring buffer on errors + unload
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('error', () => this.ring.persist());
      window.addEventListener('unhandledrejection', () => this.ring.persist());
      window.addEventListener('beforeunload', () => this.ring.persist());

      // ── Main-thread heartbeat (2s) ──
      // Logs vitals and persists CrashVitals to localStorage every heartbeat.
      // If the heartbeat stops appearing, the main thread is frozen or crashed.
      let heartbeatCount = 0;
      this._heartbeatId = setInterval(() => {
        heartbeatCount++;
        const mem = (performance as any).memory;
        const heapBytes = mem ? mem.usedJSHeapSize : 0;
        const heapLimit = mem ? mem.jsHeapSizeLimit : 0;
        const heap = mem ? `${(heapBytes / 1024 / 1024).toFixed(1)}MB` : '?';
        const heapPct = heapLimit > 0 ? ((heapBytes / heapLimit) * 100).toFixed(0) : '?';
        const heapDelta = heapBytes - this._lastHeapBytes;
        this._lastHeapBytes = heapBytes;

        // WASM linear memory
        let wasmMem = '?';
        try {
          const wasmInstance = (globalThis as any).__umbra_wasm_memory;
          if (wasmInstance?.buffer) {
            wasmMem = `${(wasmInstance.buffer.byteLength / 1024 / 1024).toFixed(1)}MB`;
          }
        } catch { /* ignore */ }

        // DOM node count
        const domNodes = typeof document !== 'undefined' ? document.querySelectorAll('*').length : 0;
        const domDelta = domNodes - this._lastDomNodes;
        this._lastDomNodes = domNodes;

        // UmbraService listener counts (if exposed on globalThis)
        const svcListeners: Record<string, number> = {};
        try {
          const svc = (globalThis as any).__umbra_service;
          if (svc?.getListenerCounts) {
            Object.assign(svcListeners, svc.getListenerCounts());
          }
        } catch { /* ignore */ }

        // Render rate: total renders/sec across all components
        const now = performance.now();
        let totalRenderRate = 0;
        const componentRates: Record<string, number> = {};
        for (const [comp, timestamps] of this._renderWindow) {
          // Trim entries older than 2s
          while (timestamps.length > 0 && timestamps[0] < now - 2000) timestamps.shift();
          const rate = timestamps.length / 2; // renders per second
          if (rate > 0) componentRates[comp] = Math.round(rate * 10) / 10;
          totalRenderRate += rate;
        }

        // Message event rate (reset counter)
        const msgRate = _messageEventCount;
        _messageEventCount = 0;

        // Check heap budget
        if (heapLimit > 0) {
          const heapPctNum = (heapBytes / heapLimit) * 100;
          this.checkBudget('heap', heapPctNum);
        }

        // Check render rate budgets
        for (const [comp, rate] of Object.entries(componentRates)) {
          this.checkBudget('renderRate', rate, comp);
        }

        // Build and persist CrashVitals
        const vitals: CrashVitals = {
          ts: Date.now(),
          heap: heapBytes,
          heapLimit,
          domNodes,
          domDelta,
          listenerCounts: svcListeners,
          globalListenerBalance: _globalListenerBalance,
          renderCounts: Object.fromEntries(this.renderCounts),
          renderRate: Math.round(totalRenderRate * 10) / 10,
          renderRates: componentRates,
          messageEventRate: msgRate,
          nonFriendFailures: _nonFriendFailures,
          heapDelta,
          lastError: this._lastError,
          heartbeatSeq: heartbeatCount,
          webVitals: { ...this._webVitals },
          budgetViolations: this._budgetViolations.slice(-10),
        };

        // Persist to localStorage (synchronous — survives OOM)
        try {
          localStorage.setItem(VITALS_KEY, JSON.stringify(vitals));
        } catch { /* quota exceeded — ignore */ }

        // Send to TUI if connected
        this._sendVitalsToTui(vitals);

        // Console heartbeat (compact)
        const listenerStr = Object.keys(svcListeners).length > 0
          ? ` | listeners=${JSON.stringify(svcListeners)}`
          : '';
        const hotRenders = Object.entries(componentRates)
          .filter(([, r]) => r > 2)
          .map(([c, r]) => `${c}=${r}/s`)
          .join(',');
        console.log(
          `[HEARTBEAT #${heartbeatCount}] heap=${heap}(${heapPct}%) | dom=${domNodes}(${domDelta >= 0 ? '+' : ''}${domDelta}) | wasm=${wasmMem} | renders=${totalRenderRate.toFixed(0)}/s${hotRenders ? ` [${hotRenders}]` : ''} | msgs=${msgRate}/2s | gListeners=${_globalListenerBalance}${listenerStr}`,
        );

        // Warn on dangerous thresholds
        if (heapLimit > 0 && heapBytes / heapLimit > 0.85) {
          this._log('fatal', 'perf', `HEAP CRITICAL: ${heap} / ${(heapLimit / 1024 / 1024).toFixed(0)}MB (${heapPct}%)`, undefined, 'heartbeat');
        }
        if (domNodes > 10000) {
          this._log('error', 'perf', `DOM BLOAT: ${domNodes} nodes`, undefined, 'heartbeat');
        }
        if (_globalListenerBalance > 500) {
          this._log('warn', 'perf', `LISTENER LEAK? globalBalance=${_globalListenerBalance}`, undefined, 'heartbeat');
        }
      }, 2000) as any;

      // ── MutationObserver for real-time DOM growth ──
      if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
        this._mutationObserver = new MutationObserver((mutations) => {
          for (const m of mutations) {
            this._domMutationAdds += m.addedNodes.length;
            this._domMutationRemoves += m.removedNodes.length;
          }
        });
        this._mutationObserver.observe(document.documentElement, {
          childList: true,
          subtree: true,
        });
      }

      // ── Auto-start long task detection ──
      this.startLongTaskDetection();

      // ── Web Vitals tracking ──
      this._startWebVitals();

      // ── Auto-persist ring buffer every 5s ──
      this._persistId = setInterval(() => {
        this.ring.persist();
      }, 5000) as any;
    }
  }

  // ── Category management ──────────────────────────────────────────────

  enable(...cats: LogCategory[]) {
    cats.forEach(c => this.enabled.add(c));
    this._persistConfig();
    return this;
  }

  disable(...cats: LogCategory[]) {
    cats.forEach(c => this.enabled.delete(c));
    this._persistConfig();
    return this;
  }

  enableAll() {
    ALL_CATEGORIES.forEach(c => this.enabled.add(c));
    this._persistConfig();
    console.log(
      '%c[Umbra Debug]%c All categories enabled. Level: %c' + this.minLevel,
      'color: #6366f1; font-weight: bold', 'color: inherit',
      'color: #ff9800; font-weight: bold',
    );
    return this;
  }

  disableAll() {
    this.enabled.clear();
    this._persistConfig();
    return this;
  }

  setLevel(level: LogLevel) {
    if (LOG_LEVELS[level] === undefined) {
      console.error(`Invalid level "${level}". Use: trace, debug, info, warn, error, fatal`);
      return this;
    }
    this.minLevel = level;
    this._persistConfig();
    console.log(
      '%c[Umbra Debug]%c Level set to: %c' + level,
      'color: #6366f1; font-weight: bold', 'color: inherit',
      'color: #ff9800; font-weight: bold',
    );
    return this;
  }

  isEnabled(cat: LogCategory): boolean {
    return this.enabled.has(cat);
  }

  // ── Source filtering ─────────────────────────────────────────────────

  filterSource(source: string) {
    this._sourceFilter = source;
    console.log(
      `%c[Umbra Debug]%c Source filter: "${source}"`,
      'color: #6366f1; font-weight: bold', 'color: inherit',
    );
    return this;
  }

  clearFilter() {
    this._sourceFilter = null;
    console.log(
      '%c[Umbra Debug]%c Source filter cleared',
      'color: #6366f1; font-weight: bold', 'color: inherit',
    );
    return this;
  }

  // ── Logging methods ──────────────────────────────────────────────────

  trace(cat: LogCategory, msg: string, data?: any, src?: string) { this._log('trace', cat, msg, data, src); }
  debug(cat: LogCategory, msg: string, data?: any, src?: string) { this._log('debug', cat, msg, data, src); }
  info(cat: LogCategory, msg: string, data?: any, src?: string)  { this._log('info', cat, msg, data, src); }
  warn(cat: LogCategory, msg: string, data?: any, src?: string)  { this._log('warn', cat, msg, data, src); }
  error(cat: LogCategory, msg: string, data?: any, src?: string) { this._log('error', cat, msg, data, src); }
  fatal(cat: LogCategory, msg: string, data?: any, src?: string) { this._log('fatal', cat, msg, data, src); }

  // ── Render tracking ──────────────────────────────────────────────────

  /** Call at the top of a component to track render counts + render rate. */
  trackRender(componentName: string) {
    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);

    // Rolling 2s window for rate calculation
    const now = performance.now();
    let timestamps = this._renderWindow.get(componentName);
    if (!timestamps) {
      timestamps = [];
      this._renderWindow.set(componentName, timestamps);
    }
    timestamps.push(now);
    // Trim entries older than 2s
    while (timestamps.length > 0 && timestamps[0] < now - 2000) timestamps.shift();

    // Render storm detection: >10 renders/sec = 20+ entries in 2s window
    if (timestamps.length > 20) {
      const rate = (timestamps.length / 2).toFixed(1);
      this._log('fatal', 'render', `RENDER STORM: ${componentName} at ${rate}/sec (${count} total)`, undefined, componentName);
    } else if (count > 50 && count % 10 === 0) {
      this._log('error', 'render', `RENDER LOOP? ${componentName} rendered ${count} times`, undefined, componentName);
    } else if (count > 20 && count % 5 === 0) {
      this._log('warn', 'render', `${componentName} rendered ${count} times`, undefined, componentName);
    }

    this._log('trace', 'render', `${componentName} render #${count}`, undefined, componentName);
  }

  showRenderCounts() {
    const sorted = [...this.renderCounts.entries()].sort((a, b) => b[1] - a[1]);
    console.table(sorted.map(([name, count]) => ({ component: name, renders: count })));
    return sorted;
  }

  resetRenderCounts() {
    this.renderCounts.clear();
    console.log('%c[Umbra Debug]%c Render counts reset', 'color: #6366f1; font-weight: bold', 'color: inherit');
  }

  // ── Throughput metrics ───────────────────────────────────────────────

  showStats() {
    const elapsed = (performance.now() - this._catWindowStart) / 1000;
    const rows = ALL_CATEGORIES
      .map(cat => {
        const count = this._catCounts.get(cat) || 0;
        return { category: cat, count, 'events/sec': (count / elapsed).toFixed(1) };
      })
      .filter(r => r.count > 0);
    rows.push({ category: 'TOTAL' as any, count: this._totalCount, 'events/sec': (this._totalCount / elapsed).toFixed(1) });
    console.table(rows);
    console.log(`Window: ${elapsed.toFixed(1)}s`);
    return rows;
  }

  resetStats() {
    this._catCounts.clear();
    this._totalCount = 0;
    this._catWindowStart = performance.now();
  }

  // ── External event tracking ────────────────────────────────────────────

  /** Call from service.dispatchMessageEvent to track message throughput */
  trackMessageEvent() {
    _messageEventCount++;
  }

  /** Call when a "not a known friend" WASM error occurs */
  trackNonFriendFailure(senderDid?: string) {
    _nonFriendFailures++;
    if (_nonFriendFailures <= 3 || _nonFriendFailures % 10 === 0) {
      this._log('warn', 'messages',
        `Non-friend message rejected (#${_nonFriendFailures})`,
        { sender: senderDid?.slice(0, 20) },
        'WASM',
      );
    }
  }

  /** Get current non-friend failure count */
  get nonFriendFailureCount() { return _nonFriendFailures; }

  /** Get current global listener balance */
  get globalListenerBalance() { return _globalListenerBalance; }

  /** Get last persisted CrashVitals (from previous session) */
  getLastCrashVitals(): CrashVitals | null {
    try {
      const raw = localStorage.getItem(VITALS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  // ── TUI WebSocket Bridge ────────────────────────────────────────────────

  /** Connect to the umbra-debug TUI via WebSocket */
  connectToTui(port = 9999) {
    if (typeof WebSocket === 'undefined') return;
    if (this._tuiWs?.readyState === WebSocket.OPEN) {
      console.log('%c[TUI] Already connected', 'color: #6366f1');
      return;
    }

    try {
      const ws = new WebSocket(`ws://localhost:${port}`);
      ws.onopen = () => {
        console.log(`%c[TUI] Connected to ws://localhost:${port}`, 'color: #4caf50; font-weight: bold');
        // Send hello with browser info
        ws.send(JSON.stringify({
          seq: 0,
          ts: performance.now(),
          cat: 'browser',
          fn: 'hello',
          argBytes: 0,
          durMs: 0,
          memBefore: 0,
          memAfter: 0,
          memGrowth: 0,
          meta: {
            clientId: 'browser',
            userAgent: navigator.userAgent,
            deviceMemory: (navigator as any).deviceMemory,
            heapLimit: (performance as any).memory?.jsHeapSizeLimit,
          },
        }));
        this._tuiWs = ws;
      };
      ws.onclose = () => {
        this._tuiWs = null;
        console.log('%c[TUI] Disconnected', 'color: #ff9800');
      };
      ws.onerror = () => {
        // Silently fail — TUI may not be running
        this._tuiWs = null;
      };
    } catch { /* ignore */ }
  }

  /** Disconnect from TUI */
  disconnectTui() {
    if (this._tuiReconnectId) {
      clearInterval(this._tuiReconnectId);
      this._tuiReconnectId = null;
    }
    this._tuiWs?.close();
    this._tuiWs = null;
  }

  /** Auto-connect to TUI (retries every 10s) */
  autoConnectTui(port = 9999) {
    this.connectToTui(port);
    this._tuiReconnectId = setInterval(() => {
      if (!this._tuiWs || this._tuiWs.readyState !== WebSocket.OPEN) {
        this.connectToTui(port);
      }
    }, 10_000) as any;
  }

  /** Stream individual log entries to TUI in real-time */
  private _sendLogToTui(entry: LogEntry) {
    if (!this._tuiWs || this._tuiWs.readyState !== WebSocket.OPEN) return;
    try {
      this._tuiWs.send(JSON.stringify({
        seq: this._totalCount,
        ts: entry.t,
        cat: entry.cat,
        fn: entry.msg.slice(0, 120),
        argBytes: 0,
        durMs: 0,
        memBefore: 0,
        memAfter: 0,
        memGrowth: 0,
        meta: {
          level: entry.level,
          src: entry.src || '',
          data: entry.data?.slice(0, 200) || '',
          stack: entry.stack?.slice(0, 300) || '',
        },
      }));
    } catch { /* ignore send failures */ }
  }

  /** Send vitals to TUI as a TraceEvent (called from heartbeat) */
  private _sendVitalsToTui(vitals: CrashVitals) {
    if (!this._tuiWs || this._tuiWs.readyState !== WebSocket.OPEN) return;
    try {
      this._tuiWs.send(JSON.stringify({
        seq: vitals.heartbeatSeq,
        ts: performance.now(),
        cat: 'browser',
        fn: 'heartbeat',
        argBytes: vitals.domNodes,
        durMs: 0,
        memBefore: vitals.heap - vitals.heapDelta,
        memAfter: vitals.heap,
        memGrowth: vitals.heapDelta,
        meta: {
          domNodes: vitals.domNodes,
          renderRate: vitals.renderRate,
          msgRate: vitals.messageEventRate,
          listeners: vitals.globalListenerBalance,
          nonFriendFails: vitals.nonFriendFailures,
          heapPct: vitals.heapLimit > 0 ? ((vitals.heap / vitals.heapLimit) * 100).toFixed(0) : '?',
        },
      }));
    } catch { /* ignore send failures */ }
  }

  /** Export ring buffer as Chrome Trace Event format for chrome://tracing */
  exportChromeTrace(): string {
    const entries = this.ring.getEntries();
    const events = entries.map((e, i) => ({
      name: e.msg.slice(0, 80),
      cat: e.cat,
      ph: 'i', // instant event
      ts: e.t * 1000, // microseconds
      pid: 1,
      tid: 1,
      args: {
        level: e.level,
        src: e.src,
        data: e.data,
      },
    }));
    return JSON.stringify({ traceEvents: events });
  }

  /** Download ring buffer as Chrome Trace format */
  downloadChromeTrace() {
    const json = this.exportChromeTrace();
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `umbra-trace-${formatFileTimestamp()}.json`);
    console.log('%c[Umbra Debug]%c Downloaded Chrome trace', 'color: #6366f1; font-weight: bold', 'color: inherit');
  }

  // ── Timing (with performance.mark/measure integration) ───────────────

  time(label: string): () => number {
    const start = performance.now();
    const markStart = `umbra:${label}:start`;
    const markEnd = `umbra:${label}:end`;
    try { performance.mark(markStart); } catch { /* ignore */ }
    return () => {
      const dur = performance.now() - start;
      try {
        performance.mark(markEnd);
        performance.measure(`umbra:${label}`, markStart, markEnd);
      } catch { /* ignore */ }
      if (dur > 100) {
        this._log('warn', 'perf', `${label}: ${dur.toFixed(1)}ms (SLOW)`, { duration: dur });
      } else {
        this._log('debug', 'perf', `${label}: ${dur.toFixed(1)}ms`, { duration: dur });
      }
      return dur;
    };
  }

  /**
   * High-frequency perf trace — writes to trace buffer + TUI stream only.
   * NO console output. Use for hot-path instrumentation (parseMessageContent, etc).
   */
  tracePerf(cat: LogCategory, msg: string, durationMs: number, src?: string) {
    const entry: LogEntry = {
      t: performance.now(),
      ts: Date.now(),
      level: durationMs > 50 ? 'warn' : 'trace',
      cat,
      msg: `${msg} dur=${durationMs.toFixed(1)}ms`,
      src,
    };
    this.traceRing.push(entry);
    this._sendLogToTui(entry);
  }

  /** Get trace buffer entries (for __debug console) */
  getTraceEntries(): LogEntry[] {
    return this.traceRing.getEntries();
  }

  /** Get trace stats: count per category, avg/max duration from trace buffer */
  getTraceStats(): Record<string, { count: number; avgMs: number; maxMs: number }> {
    const entries = this.traceRing.getEntries();
    const stats: Record<string, { count: number; totalMs: number; maxMs: number }> = {};
    for (const e of entries) {
      const m = e.msg.match(/dur=([\d.]+)ms/);
      if (!m) continue;
      const dur = parseFloat(m[1]);
      if (!stats[e.cat]) stats[e.cat] = { count: 0, totalMs: 0, maxMs: 0 };
      stats[e.cat].count++;
      stats[e.cat].totalMs += dur;
      if (dur > stats[e.cat].maxMs) stats[e.cat].maxMs = dur;
    }
    const result: Record<string, { count: number; avgMs: number; maxMs: number }> = {};
    for (const [cat, s] of Object.entries(stats)) {
      result[cat] = { count: s.count, avgMs: s.totalMs / s.count, maxMs: s.maxMs };
    }
    return result;
  }

  // ── Long task / Long Animation Frame detection ───────────────────────

  startLongTaskDetection() {
    if (typeof PerformanceObserver === 'undefined') return;
    if (this._loafObserver) return; // already running

    try {
      // Try Long Animation Frames (Chrome 123+)
      this._loafObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const loaf = entry as any;
          const scripts = loaf.scripts
            ?.map((s: any) => `${s.invoker || 'unknown'}(${s.duration?.toFixed(0)}ms)`)
            .slice(0, 5) || [];
          this._log('warn', 'perf',
            `Long frame: ${loaf.duration.toFixed(0)}ms (blocking: ${loaf.blockingDuration?.toFixed(0) ?? '?'}ms)`,
            { scripts },
          );
        }
      });
      this._loafObserver.observe({ type: 'long-animation-frame', buffered: true });
      this._log('info', 'perf', 'Long Animation Frame detection active');
    } catch {
      try {
        this._loafObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this._log('warn', 'perf', `Long task: ${entry.duration.toFixed(0)}ms`);
          }
        });
        this._loafObserver.observe({ type: 'longtask', buffered: true });
        this._log('info', 'perf', 'Long Task detection active (fallback)');
      } catch { /* ignore */ }
    }
  }

  stopLongTaskDetection() {
    this._loafObserver?.disconnect();
    this._loafObserver = null;
  }

  // ── Web Vitals ────────────────────────────────────────────────────────

  /** Start tracking Web Vitals via PerformanceObserver */
  private _startWebVitals() {
    if (typeof PerformanceObserver === 'undefined') return;

    // INP — Interaction to Next Paint
    try {
      const inpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const dur = (entry as any).duration ?? entry.duration;
          if (this._webVitals.inp === null || dur > this._webVitals.inp) {
            this._webVitals.inp = dur;
          }
        }
      });
      inpObs.observe({ type: 'event', buffered: true, durationThreshold: 40 } as any);
    } catch { /* unsupported */ }

    // CLS — Cumulative Layout Shift
    try {
      const clsObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            this._webVitals.cls += (entry as any).value ?? 0;
          }
        }
      });
      clsObs.observe({ type: 'layout-shift', buffered: true } as any);
    } catch { /* unsupported */ }

    // LCP — Largest Contentful Paint
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          this._webVitals.lcp = entries[entries.length - 1].startTime;
        }
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true } as any);
    } catch { /* unsupported */ }

    // FCP — First Contentful Paint
    try {
      const fcpObs = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this._webVitals.fcp = entry.startTime;
          }
        }
      });
      fcpObs.observe({ type: 'paint', buffered: true } as any);
    } catch { /* unsupported */ }
  }

  /** Get current Web Vitals snapshot */
  getWebVitals(): WebVitalsData {
    return { ...this._webVitals };
  }

  // ── React Profiler Integration ────────────────────────────────────────

  /**
   * Callback for React <Profiler onRender={dbg.onProfilerRender}>
   * Tracks per-component commit timing and warns on slow commits.
   */
  onProfilerRender = (
    id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number,
  ) => {
    // Update per-component stats
    let stats = this._profilerStats.get(id);
    if (!stats) {
      stats = { count: 0, totalMs: 0, maxMs: 0, mounts: 0, updates: 0 };
      this._profilerStats.set(id, stats);
    }
    stats.count++;
    stats.totalMs += actualDuration;
    if (actualDuration > stats.maxMs) stats.maxMs = actualDuration;
    if (phase === 'mount') stats.mounts++;
    else stats.updates++;

    // Feed into trace buffer for TUI visibility
    this.tracePerf('render', `profiler ${id} ${phase} actual=${actualDuration.toFixed(1)}ms base=${baseDuration.toFixed(1)}ms`, actualDuration, 'Profiler');

    // Warn on slow commits
    if (actualDuration > this._budgets.renderMs) {
      this._log('warn', 'perf', `Slow commit: ${id} ${phase} took ${actualDuration.toFixed(1)}ms (budget: ${this._budgets.renderMs}ms)`, { baseDuration: baseDuration.toFixed(1) }, 'Profiler');
      this._recordBudgetViolation(`render: ${id} ${actualDuration.toFixed(1)}ms > ${this._budgets.renderMs}ms`);
    }
  };

  /** Get React Profiler stats for all tracked components */
  getProfilerStats(): Record<string, { count: number; avgMs: number; maxMs: number; mounts: number; updates: number }> {
    const result: Record<string, { count: number; avgMs: number; maxMs: number; mounts: number; updates: number }> = {};
    for (const [id, s] of this._profilerStats) {
      result[id] = { count: s.count, avgMs: s.totalMs / s.count, maxMs: s.maxMs, mounts: s.mounts, updates: s.updates };
    }
    return result;
  }

  // ── Performance Budgets ───────────────────────────────────────────────

  /** Set performance budget thresholds (partial update) */
  setBudgets(partial: Partial<PerfBudgets>) {
    Object.assign(this._budgets, partial);
    console.log('%c[Umbra Debug]%c Budgets updated:', 'color: #6366f1; font-weight: bold', 'color: inherit', this._budgets);
  }

  /** Get current performance budgets */
  getBudgets(): PerfBudgets {
    return { ...this._budgets };
  }

  /** Get recent budget violations */
  getBudgetViolations(): string[] {
    return [...this._budgetViolations];
  }

  /** Check a value against a budget and warn if exceeded */
  checkBudget(type: 'render' | 'wasm' | 'heap' | 'messageSize' | 'renderRate', value: number, context?: string) {
    let threshold: number;
    let label: string;
    switch (type) {
      case 'render': threshold = this._budgets.renderMs; label = `render ${context || ''}`; break;
      case 'wasm': threshold = this._budgets.wasmMs; label = `wasm ${context || ''}`; break;
      case 'heap': threshold = this._budgets.heapPct; label = 'heap'; break;
      case 'messageSize': threshold = this._budgets.messageSizeBytes; label = `message ${context || ''}`; break;
      case 'renderRate': threshold = this._budgets.renderRatePerSec; label = `renderRate ${context || ''}`; break;
    }
    if (value > threshold) {
      const msg = `BUDGET EXCEEDED: ${label} ${value.toFixed(1)} > ${threshold}`;
      this._log('warn', 'perf', msg, undefined, 'Budget');
      this._recordBudgetViolation(msg);
    }
  }

  private _recordBudgetViolation(msg: string) {
    this._budgetViolations.push(`${formatAbsTime(Date.now())} ${msg}`);
    // Keep last 100 violations
    if (this._budgetViolations.length > 100) this._budgetViolations.shift();
  }

  // ── Ring buffer access ───────────────────────────────────────────────

  dump() {
    const d = this.ring.dump();
    console.log(d);
    return d;
  }

  entries() { return this.ring.getEntries(); }

  clearBuffer() {
    this.ring.clear();
    console.log('%c[Umbra Debug]%c Ring buffer cleared', 'color: #6366f1; font-weight: bold', 'color: inherit');
  }

  // ── Export / Download ────────────────────────────────────────────────

  downloadJson() {
    const entries = this.ring.getEntries();
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `umbra-debug-${formatFileTimestamp()}.json`);
    console.log(`%c[Umbra Debug]%c Downloaded ${entries.length} entries as JSON`, 'color: #6366f1; font-weight: bold', 'color: inherit');
  }

  downloadTxt() {
    const text = this.ring.dump();
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `umbra-debug-${formatFileTimestamp()}.txt`);
    console.log(`%c[Umbra Debug]%c Downloaded as TXT`, 'color: #6366f1; font-weight: bold', 'color: inherit');
  }

  // ── Snapshot ─────────────────────────────────────────────────────────

  /** Capture a point-in-time snapshot of app state + ring buffer */
  snapshot(stateGetter?: () => Record<string, any>) {
    const snap: Record<string, any> = {
      timestamp: new Date().toISOString(),
      url: typeof location !== 'undefined' ? location.href : 'unknown',
      ringBufferSize: this.ring.size,
      renderCounts: Object.fromEntries(this.renderCounts),
      enabledCategories: [...this.enabled],
      minLevel: this.minLevel,
      throughput: this._getStatsRaw(),
    };

    // JS heap if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const mem = (performance as any).memory;
      snap.heap = {
        usedJSHeapSize: `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
        totalJSHeapSize: `${(mem.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
        jsHeapSizeLimit: `${(mem.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB`,
      };
    }

    // Caller-provided state
    if (stateGetter) {
      try { snap.appState = stateGetter(); } catch (e) { snap.appState = `Error: ${e}`; }
    }

    snap.ringBuffer = this.ring.getEntries();

    console.log('%c[Umbra Debug] Snapshot captured', 'color: #6366f1; font-weight: bold', snap);
    return snap;
  }

  // ── Internal ─────────────────────────────────────────────────────────

  private _log(level: LogLevel, cat: LogCategory, msg: string, data?: any, src?: string) {
    const now = performance.now();
    const nowTs = Date.now();

    // Throughput tracking
    this._catCounts.set(cat, (this._catCounts.get(cat) || 0) + 1);
    this._totalCount++;

    // Build entry — always serialized for ring buffer
    const entry: LogEntry = {
      t: now,
      ts: nowTs,
      level,
      cat,
      msg,
      src,
      data: data !== undefined ? safeStringify(data) : undefined,
    };

    // Stack traces on error + fatal
    if (level === 'error' || level === 'fatal') {
      entry.stack = new Error().stack;
      // Track last error for CrashVitals
      this._lastError = `[${cat}] ${msg}`.slice(0, 200);
    }

    // Always push to ring buffer regardless of enabled state
    this.ring.push(entry);

    // Stream to TUI WebSocket in real-time
    this._sendLogToTui(entry);

    // Console output gating
    if (!this.enabled.has(cat)) return;
    if (LOG_LEVELS[level] < LOG_LEVELS[this.minLevel]) return;
    if (this._sourceFilter && src && !src.includes(this._sourceFilter)) return;

    // Format: 14:23:05.123 (+42ms) [INFO ] [service      ] message | data
    const abs = formatAbsTime(nowTs);
    const delta = this._lastLogT > 0 ? (now - this._lastLogT).toFixed(0) : '0';
    this._lastLogT = now;
    const lvl = level.toUpperCase().padEnd(5);
    const catStr = cat.padEnd(13);
    const srcStr = src ? `[${src}] ` : '';
    const dataStr = entry.data ? ` | ${entry.data}` : '';

    const formatted = `%c${abs} (+${delta}ms) [${lvl}] [${catStr}] ${srcStr}${msg}${dataStr}`;
    const consoleFn = LEVEL_CONSOLE[level];
    console[consoleFn](formatted, LEVEL_COLORS[level]);

    // Auto-persist on fatal
    if (level === 'fatal') {
      this.ring.persist();
    }
  }

  private _getStatsRaw() {
    const elapsed = (performance.now() - this._catWindowStart) / 1000;
    const result: Record<string, { count: number; perSec: string }> = {};
    for (const cat of ALL_CATEGORIES) {
      const count = this._catCounts.get(cat) || 0;
      if (count > 0) result[cat] = { count, perSec: (count / elapsed).toFixed(1) };
    }
    return result;
  }

  private _persistConfig() {
    try {
      localStorage.setItem('__umbra_debug_config__', JSON.stringify({
        categories: [...this.enabled],
        minLevel: this.minLevel,
      }));
    } catch { /* ignore */ }
  }
}

// ─── Vitals Persistence Keys ─────────────────────────────────────────────────

const VITALS_KEY = '__umbra_vitals__';
const VITALS_HISTORY_KEY = '__umbra_vitals_history__'; // IndexedDB key (future)

// ─── Global addEventListener Monkey-Patch ────────────────────────────────────
// Tracks the balance of addEventListener vs removeEventListener calls globally.
// A rising balance indicates listener leaks.

let _globalListenerBalance = 0;

if (typeof window !== 'undefined' && typeof EventTarget !== 'undefined') {
  const origAdd = EventTarget.prototype.addEventListener;
  const origRemove = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function (
    this: EventTarget,
    ...args: Parameters<typeof origAdd>
  ) {
    _globalListenerBalance++;
    return origAdd.apply(this, args);
  };

  EventTarget.prototype.removeEventListener = function (
    this: EventTarget,
    ...args: Parameters<typeof origRemove>
  ) {
    _globalListenerBalance--;
    return origRemove.apply(this, args);
  };
}

// ─── Message Event Rate Tracking ─────────────────────────────────────────────
// Incremented externally via dbg.trackMessageEvent(), reset each heartbeat.

let _messageEventCount = 0;

// ─── Non-Friend Failure Tracking ─────────────────────────────────────────────
// Incremented externally via dbg.trackNonFriendFailure()

let _nonFriendFailures = 0;

// ─── Crash Guard ────────────────────────────────────────────────────────────

const CRASH_KEY = '__umbra_crash_count__';
const CRASH_TIME_KEY = '__umbra_crash_time__';
const SAFE_MODE_KEY = '__umbra_safe_mode__';
const MAX_CRASHES = 3;
const CRASH_WINDOW_MS = 30_000;

export function initCrashGuard(): { isSafeMode: boolean; crashCount: number } {
  try {
    // ── Post-crash report: read vitals from previous session ──
    const prevVitals = dbg.getLastCrashVitals();
    if (prevVitals) {
      const deathTime = new Date(prevVitals.ts);
      const heapMB = (prevVitals.heap / 1024 / 1024).toFixed(0);
      const limitMB = (prevVitals.heapLimit / 1024 / 1024).toFixed(0);
      const heapPct = prevVitals.heapLimit > 0
        ? ((prevVitals.heap / prevVitals.heapLimit) * 100).toFixed(0)
        : '?';
      const oomLikely = prevVitals.heapLimit > 0 && prevVitals.heap / prevVitals.heapLimit > 0.8;

      const hotRenders = Object.entries(prevVitals.renderRates || {})
        .filter(([, r]) => r > 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([c, r]) => `    ${c}=${r}/sec`)
        .join('\n');

      const listeners = Object.entries(prevVitals.listenerCounts || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');

      console.log(
        `%c\n${'═'.repeat(55)}\n  CRASH REPORT — Previous session died at ${formatAbsTime(prevVitals.ts)}\n${'═'.repeat(55)}%c\n` +
        `  Heap: ${heapMB}MB / ${limitMB}MB (${heapPct}%${oomLikely ? ' — OOM LIKELY' : ''})\n` +
        `  Heap delta: ${prevVitals.heapDelta >= 0 ? '+' : ''}${(prevVitals.heapDelta / 1024 / 1024).toFixed(1)}MB/2s\n` +
        `  DOM nodes: ${prevVitals.domNodes} (${prevVitals.domDelta >= 0 ? '+' : ''}${prevVitals.domDelta}/2s)\n` +
        `  Service listeners: ${listeners || 'unknown'}\n` +
        `  Global listener balance: ${prevVitals.globalListenerBalance}\n` +
        `  Render rate: ${prevVitals.renderRate}/sec\n` +
        (hotRenders ? `  Hot components:\n${hotRenders}\n` : '') +
        `  Message event rate: ${prevVitals.messageEventRate}/2s\n` +
        `  Non-friend failures: ${prevVitals.nonFriendFailures}\n` +
        `  Last error: ${prevVitals.lastError || 'none'}\n` +
        `  Heartbeat #: ${prevVitals.heartbeatSeq}\n` +
        `  Time of death: ${deathTime.toLocaleTimeString()}\n` +
        `${'═'.repeat(55)}\n`,
        'color: #f44336; font-weight: bold; font-size: 14px',
        'color: #ff9800',
      );

      // Also push to ring buffer so it shows up in __debug.dump()
      dbg.fatal('lifecycle', `CRASH REPORT: heap=${heapMB}MB(${heapPct}%) dom=${prevVitals.domNodes} renders=${prevVitals.renderRate}/s lastErr=${prevVitals.lastError || 'none'}`, undefined, 'CrashGuard');
    }

    const now = Date.now();
    const lastCrashTime = parseInt(localStorage.getItem(CRASH_TIME_KEY) || '0', 10);
    let crashCount = parseInt(localStorage.getItem(CRASH_KEY) || '0', 10);

    if (now - lastCrashTime > CRASH_WINDOW_MS) {
      crashCount = 0;
    }

    crashCount++;
    localStorage.setItem(CRASH_KEY, String(crashCount));
    localStorage.setItem(CRASH_TIME_KEY, String(now));

    const isSafeMode = crashCount >= MAX_CRASHES;

    if (isSafeMode) {
      localStorage.setItem(SAFE_MODE_KEY, 'true');
      console.warn(`[CrashGuard] Safe mode triggered after ${crashCount} crashes in ${CRASH_WINDOW_MS / 1000}s`);
    }

    return { isSafeMode, crashCount };
  } catch {
    return { isSafeMode: false, crashCount: 0 };
  }
}

export function markBootSuccess() {
  setTimeout(() => {
    try {
      localStorage.setItem(CRASH_KEY, '0');
      localStorage.removeItem(SAFE_MODE_KEY);
    } catch { /* ignore */ }
  }, 5000);
}

export function clearSafeMode() {
  try {
    localStorage.removeItem(CRASH_KEY);
    localStorage.removeItem(CRASH_TIME_KEY);
    localStorage.removeItem(SAFE_MODE_KEY);
  } catch { /* ignore */ }
}

export function isInSafeMode(): boolean {
  try {
    return localStorage.getItem(SAFE_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function safeStringify(obj: any): string {
  try {
    const s = JSON.stringify(obj);
    return s.length > 500 ? s.slice(0, 500) + '...' : s;
  } catch {
    return String(obj);
  }
}

function formatAbsTime(ts: number): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function formatFileTimestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Singleton (HMR-safe via window global) ─────────────────────────────────

function getOrCreateLogger(): DebugLogger {
  if (typeof window !== 'undefined' && (window as any).__umbra_logger_instance) {
    return (window as any).__umbra_logger_instance;
  }
  const logger = new DebugLogger();
  if (typeof window !== 'undefined') {
    (window as any).__umbra_logger_instance = logger;
  }
  return logger;
}

export const dbg = getOrCreateLogger();

// ─── Console API ────────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  (window as any).__debug = {
    // Categories
    enable: (...cats: LogCategory[]) => dbg.enable(...cats),
    disable: (...cats: LogCategory[]) => dbg.disable(...cats),
    enableAll: () => dbg.enableAll(),
    disableAll: () => dbg.disableAll(),

    // Levels
    setLevel: (l: LogLevel) => dbg.setLevel(l),

    // Source filter
    filterSource: (s: string) => dbg.filterSource(s),
    clearFilter: () => dbg.clearFilter(),

    // Ring buffer
    dump: () => dbg.dump(),
    entries: () => dbg.entries(),
    clear: () => dbg.clearBuffer(),
    downloadJson: () => dbg.downloadJson(),
    downloadTxt: () => dbg.downloadTxt(),

    // Render tracking
    renderCounts: () => dbg.showRenderCounts(),
    resetRenderCounts: () => dbg.resetRenderCounts(),

    // Throughput
    stats: () => dbg.showStats(),
    resetStats: () => dbg.resetStats(),

    // Snapshot
    snapshot: (stateGetter?: () => Record<string, any>) => dbg.snapshot(stateGetter),

    // Long tasks
    startLongTasks: () => dbg.startLongTaskDetection(),
    stopLongTasks: () => dbg.stopLongTaskDetection(),

    // Timing
    time: (label: string) => dbg.time(label),

    // Crash diagnostics
    vitals: () => dbg.getLastCrashVitals(),
    listenerBalance: () => dbg.globalListenerBalance,
    nonFriendFailures: () => dbg.nonFriendFailureCount,

    // TUI bridge
    connectTui: (port?: number) => dbg.connectToTui(port),
    autoConnectTui: (port?: number) => dbg.autoConnectTui(port),
    disconnectTui: () => dbg.disconnectTui(),

    // Export
    downloadChromeTrace: () => dbg.downloadChromeTrace(),

    // Trace buffer (high-frequency perf)
    traceEntries: () => dbg.getTraceEntries(),
    traceStats: () => {
      const stats = dbg.getTraceStats();
      console.table(stats);
      return stats;
    },

    // Web Vitals
    webVitals: () => {
      const v = dbg.getWebVitals();
      console.log(
        `%c[Web Vitals]%c INP=${v.inp?.toFixed(0) ?? '—'}ms | CLS=${v.cls.toFixed(3)} | LCP=${v.lcp?.toFixed(0) ?? '—'}ms | FCP=${v.fcp?.toFixed(0) ?? '—'}ms`,
        'color: #6366f1; font-weight: bold', 'color: inherit',
      );
      return v;
    },

    // React Profiler
    profilerStats: () => {
      const stats = dbg.getProfilerStats();
      console.table(stats);
      return stats;
    },

    // Performance budgets
    budgets: () => dbg.getBudgets(),
    setBudgets: (partial: Partial<PerfBudgets>) => dbg.setBudgets(partial),
    budgetViolations: () => {
      const v = dbg.getBudgetViolations();
      v.forEach(msg => console.log(`  ${msg}`));
      return v;
    },

    // Help
    help: () => {
      console.log(`
%c┌─────────────────────────────────────────┐
│         Umbra Debug Tools               │
└─────────────────────────────────────────┘%c

%cCategories%c (layer):   render, service, network, state, lifecycle, perf
%cCategories%c (feature): conversations, messages, friends, sync, auth, plugins, call, groups, community
%cLevels%c:              trace, debug, info, warn, error, fatal

%cCommands:%c
  __debug.enableAll()              Enable all categories
  __debug.enable('service')        Enable one category
  __debug.disable('render')        Disable one category
  __debug.disableAll()             Disable all categories
  __debug.setLevel('warn')         Set minimum log level

  __debug.filterSource('ChatArea') Only show logs from matching source
  __debug.clearFilter()            Clear source filter

  __debug.dump()                   Print ring buffer (last 500 entries)
  __debug.entries()                Get entries as array
  __debug.clear()                  Clear ring buffer
  __debug.downloadJson()           Download as .json file
  __debug.downloadTxt()            Download as .txt file

  __debug.renderCounts()           Show component render counts
  __debug.resetRenderCounts()      Reset render counters
  __debug.stats()                  Per-category throughput table
  __debug.resetStats()             Reset throughput counters

  __debug.snapshot()               Capture full state + buffer snapshot
  __debug.startLongTasks()         Start long frame detection
  __debug.stopLongTasks()          Stop long frame detection
  __debug.time('label')            Start timer (returns stop function)

  __debug.vitals()                 Show last CrashVitals (prev session)
  __debug.listenerBalance()        Global addEventListener balance
  __debug.nonFriendFailures()      Non-friend message rejection count

  __debug.connectTui(9999)         Connect to umbra-debug TUI
  __debug.autoConnectTui(9999)     Auto-reconnect to TUI (10s retry)
  __debug.disconnectTui()          Disconnect from TUI
  __debug.downloadChromeTrace()    Export as Chrome trace format

  __debug.traceEntries()           Get high-freq trace buffer entries
  __debug.traceStats()             Per-category trace timing stats

  __debug.webVitals()              Show Web Vitals (INP, CLS, LCP, FCP)
  __debug.profilerStats()          React Profiler commit stats
  __debug.budgets()                Show performance budget thresholds
  __debug.setBudgets({renderMs:10})  Configure budget thresholds
  __debug.budgetViolations()       Show recent budget violations
`,
        'color: #6366f1; font-weight: bold',
        'color: inherit',
        'color: #ff9800; font-weight: bold', 'color: inherit',
        'color: #ff9800; font-weight: bold', 'color: inherit',
        'color: #ff9800; font-weight: bold', 'color: inherit',
        'color: #4caf50; font-weight: bold', 'color: inherit',
      );
    },
  };

  // Increase stack trace depth in dev
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    Error.stackTraceLimit = 50;
  }
}
