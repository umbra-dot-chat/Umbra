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
  | 'plugins';      // Plugin loading, lifecycle, commands

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
  private minLevel: LogLevel = 'trace';
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

  constructor() {
    this.ring = new RingBuffer(500);

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
    if (typeof window !== 'undefined') {
      window.addEventListener('error', () => this.ring.persist());
      window.addEventListener('unhandledrejection', () => this.ring.persist());
      window.addEventListener('beforeunload', () => this.ring.persist());

      // ── Main-thread heartbeat ──
      // Logs every 2s so we can see exactly when the main thread blocks.
      // If the heartbeat stops appearing in console logs, the thread is frozen.
      let heartbeatCount = 0;
      this._heartbeatId = setInterval(() => {
        heartbeatCount++;
        const mem = (performance as any).memory;
        const heap = mem ? `${(mem.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : '?';
        console.log(`[HEARTBEAT #${heartbeatCount}] alive | heap=${heap} | renders=${JSON.stringify(Object.fromEntries([...this.renderCounts.entries()].filter(([, v]) => v > 5)))}`);
      }, 2000) as any;

      // ── Auto-start long task detection ──
      this.startLongTaskDetection();

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

  /** Call at the top of a component to track render counts. Warn at 20, error at 50. */
  trackRender(componentName: string) {
    const count = (this.renderCounts.get(componentName) || 0) + 1;
    this.renderCounts.set(componentName, count);

    if (count > 50 && count % 10 === 0) {
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
    }

    // Always push to ring buffer regardless of enabled state
    this.ring.push(entry);

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

// ─── Crash Guard ────────────────────────────────────────────────────────────

const CRASH_KEY = '__umbra_crash_count__';
const CRASH_TIME_KEY = '__umbra_crash_time__';
const SAFE_MODE_KEY = '__umbra_safe_mode__';
const MAX_CRASHES = 3;
const CRASH_WINDOW_MS = 30_000;

export function initCrashGuard(): { isSafeMode: boolean; crashCount: number } {
  try {
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

    // Help
    help: () => {
      console.log(`
%c┌─────────────────────────────────────────┐
│         Umbra Debug Tools               │
└─────────────────────────────────────────┘%c

%cCategories%c (layer):   render, service, network, state, lifecycle, perf
%cCategories%c (feature): conversations, messages, friends, sync, auth, plugins
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
