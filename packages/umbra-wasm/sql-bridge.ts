/**
 * SQL Bridge — JavaScript side of the WASM database abstraction.
 *
 * This module loads sql.js (SQLite compiled to WASM via Emscripten) and
 * exposes a small set of functions on `globalThis.__umbra_sql` that the
 * Rust WASM database code calls through `#[wasm_bindgen]` extern blocks.
 *
 * ## Architecture
 *
 * Rust wasm_database.rs  --wasm_bindgen-->  globalThis.__umbra_sql.*
 *                                                      |
 *                                                      v
 *                                                   sql.js
 *                                              (SQLite, persisted via IndexedDB)
 *
 * ## Persistence
 *
 * On every write (execute/executeBatch), the database is exported to a
 * Uint8Array and saved to IndexedDB (async fire-and-forget). On init,
 * the database is restored from IndexedDB if a previous export exists.
 */

import { saveDatabaseExport, loadDatabaseExport } from './indexed-db';

// Debug tracer — lazy import to avoid circular dependency issues at init time.
// tracer.ts imports getSqlBridgeStats() from this file; we import emit/isDebugActive from tracer.
let _tracerModule: typeof import('./tracer') | null = null;
function _tracer(): typeof import('./tracer') | null {
  if (_tracerModule) return _tracerModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _tracerModule = require('./tracer');
    return _tracerModule;
  } catch {
    return null;
  }
}

// Debug bridge
const _dbg = (): any => (globalThis as any).__umbra_logger_instance;
const SQL_SRC = 'sql-bridge';

// SQL operation counters for WASM memory leak diagnosis
let _sqlExecuteCount = 0;
let _sqlQueryCount = 0;
let _sqlExportCount = 0;

/** Get SQL bridge operation stats for memory leak diagnosis. */
export function getSqlBridgeStats(): { executes: number; queries: number; exports: number } {
  return { executes: _sqlExecuteCount, queries: _sqlQueryCount, exports: _sqlExportCount };
}

// sql.js types — we keep these lightweight to avoid a hard dep on @types/sql.js
interface SqlJsDatabase {
  run(sql: string, params?: any[]): void;
  exec(sql: string): { columns: string[]; values: any[][] }[];
  getRowsModified(): number;
  export(): Uint8Array;
}

interface SqlJsStatic {
  Database: new (data?: ArrayLike<number>) => SqlJsDatabase;
}

let db: SqlJsDatabase | null = null;
let sqlJsPromise: Promise<SqlJsStatic> | null = null;

/** The DID of the current identity, used for per-DID IndexedDB isolation. */
let currentDid: string | null = null;

/** Whether persistence is enabled (requires a DID). */
let persistenceEnabled = false;

/**
 * Load the sql.js library. Call once at startup.
 *
 * By default, tries to `import("sql.js")`. The caller can also pre-set
 * `globalThis.__umbra_sql_factory` to a custom factory function.
 */
async function loadSqlJs(): Promise<SqlJsStatic> {
  // Allow the host to supply a custom sql.js factory
  const customFactory = (globalThis as any).__umbra_sql_factory;
  if (typeof customFactory === "function") {
    return customFactory();
  }

  // Dynamic import — works in both Node (for tests) and bundlers
  const initSqlJs = (await import("sql.js")).default;
  return initSqlJs({
    // In a web/Expo context, Metro cannot serve the sql-wasm.wasm binary from
    // node_modules. We use the jsDelivr CDN which mirrors npm packages. The host
    // can override this by setting globalThis.__umbra_sql_wasm_url before init.
    locateFile: (filename: string) => {
      const customUrl = (globalThis as any).__umbra_sql_wasm_url;
      if (customUrl) return customUrl;

      // In Node.js (tests), sql.js can resolve files from its own dist/
      if (typeof process !== "undefined" && process.versions?.node) {
        return filename;
      }

      // Web environment: use CDN to serve the WASM binary
      if (filename === "sql-wasm.wasm") {
        return "https://cdn.jsdelivr.net/npm/sql.js@1.13.0/dist/sql-wasm.wasm";
      }

      return filename;
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Persistence — debounced save after writes
// ─────────────────────────────────────────────────────────────────────────

/** Timer ID for debounced saves. */
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/** Whether a save is currently in-flight. */
let saveInFlight = false;

/** Whether another save was requested while one was in-flight. */
let savePending = false;

/** Timestamp of last successful doSave() — used for max-wait cap. */
let lastSaveTime = 0;

/**
 * Schedule a debounced save of the database to IndexedDB.
 *
 * During bulk operations (e.g. importing 10k seats), hundreds of writes
 * happen in quick succession. Instead of exporting + saving on every
 * single write (which allocates a full-size Uint8Array each time and
 * causes OOM), we debounce: wait 5s after the last write, then save
 * once. WASM linear memory never shrinks, so each db.export() call
 * permanently grows the WASM heap via the Uint8Array allocation.
 *
 * Max-wait cap: if writes are continuous (e.g. group chat with bots),
 * the debounce would slide indefinitely. We force a save after 30s
 * regardless, so the database is persisted at least every 30s.
 */
function scheduleSave(): void {
  if (!persistenceEnabled || !currentDid || !db) return;

  const now = Date.now();
  const timeSinceLastSave = now - lastSaveTime;

  // Max-wait cap: force save if 30s+ since last persist
  if (lastSaveTime > 0 && timeSinceLastSave >= 30_000) {
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    doSave();
    return;
  }

  // Clear any existing timer — restart the debounce window
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;
    doSave();
  }, 5000);
}

/** Actually export and persist the database. */
function doSave(): void {
  if (!persistenceEnabled || !currentDid || !db) return;
  if (saveInFlight) {
    // A save is already running — flag that we need another one after it finishes
    savePending = true;
    return;
  }

  saveInFlight = true;
  savePending = false;
  lastSaveTime = Date.now();

  try {
    const did = currentDid;
    _sqlExportCount++;
    console.log(`[sql-bridge] db.export() #${_sqlExportCount} starting (after ${_sqlExecuteCount} executes, ${_sqlQueryCount} queries)`);
    const t0 = performance.now();
    const data = db.export();
    const durMs = performance.now() - t0;
    console.log(`[sql-bridge] db.export() #${_sqlExportCount} done: ${(data.byteLength / 1024).toFixed(0)}KB`);

    // Emit trace event for debug TUI
    const tracer = _tracer();
    if (tracer?.isDebugActive()) {
      tracer.emit({
        cat: 'sql',
        fn: 'db_export',
        argBytes: data.byteLength,
        durMs,
        memBefore: 0,
        memAfter: 0,
        memGrowth: 0,
        argPreview: `export #${_sqlExportCount} ${(data.byteLength / 1024).toFixed(0)}KB`,
      });
    }

    saveDatabaseExport(did, data)
      .catch((err) => {
        console.warn('[sql-bridge] Failed to persist database:', err);
      })
      .finally(() => {
        saveInFlight = false;
        // If more writes came in while we were saving, save again
        if (savePending) {
          savePending = false;
          doSave();
        }
      });
  } catch (err) {
    saveInFlight = false;
    console.warn('[sql-bridge] Failed to export database:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Bridge API — attached to globalThis.__umbra_sql
//
// These are the functions that Rust's wasm_database.rs calls via
// #[wasm_bindgen(js_namespace = ["globalThis", "__umbra_sql"])].
// ─────────────────────────────────────────────────────────────────────────

const bridge = {
  /**
   * Initialize the sql.js database.
   * Returns `true` synchronously. The actual async loading should have
   * already been done by calling `initSqlBridge()` before any Rust calls.
   */
  init(): boolean {
    if (!db) {
      console.warn(
        "[sql-bridge] init() called but sql.js not loaded yet. " +
          "Call initSqlBridge() first."
      );
      return false;
    }
    return true;
  },

  /**
   * Execute a SQL statement (INSERT, UPDATE, DELETE, CREATE, etc.)
   * @param sql  - SQL string with `?` placeholders
   * @param paramsJson - JSON-encoded array of bind values
   * @returns Number of rows affected
   */
  execute(sql: string, paramsJson: string): number {
    if (!db) throw new Error("Database not initialized");

    _sqlExecuteCount++;
    const t0 = performance.now();
    const params = JSON.parse(paramsJson);
    db.run(sql, params);
    const rowsModified = db.getRowsModified();
    const durMs = performance.now() - t0;
    _dbg()?.trace('service', `sql EXECUTE: ${sql.slice(0, 60)}… → ${rowsModified} rows`, undefined, SQL_SRC);

    // Emit trace event for debug TUI
    const tracer = _tracer();
    if (tracer?.isDebugActive()) {
      tracer.emit({
        cat: 'sql',
        fn: 'execute',
        argBytes: sql.length + paramsJson.length,
        durMs,
        memBefore: 0,
        memAfter: 0,
        memGrowth: 0,
        argPreview: tracer.isVerbose() ? `${sql.slice(0, 150)} | rows=${rowsModified}` : undefined,
      });
    }

    // Log every 50th execute for memory tracking during offline processing
    if (_sqlExecuteCount % 50 === 0) {
      console.log(`[sql-bridge] EXECUTE #${_sqlExecuteCount}: ${sql.slice(0, 40)}…`);
    }

    // Persist after every write
    scheduleSave();

    return rowsModified;
  },

  /**
   * Execute a SQL query (SELECT) and return results as JSON.
   * @returns JSON string: array of objects, each key = column name
   */
  query(sql: string, paramsJson: string): string {
    if (!db) throw new Error("Database not initialized");

    _sqlQueryCount++;
    const t0 = performance.now();
    const params = JSON.parse(paramsJson);

    // sql.js exec() doesn't support params, so we need to use
    // a prepared statement approach
    const stmt = (db as any).prepare(sql);
    stmt.bind(params);

    const results: Record<string, any>[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    stmt.free();

    const durMs = performance.now() - t0;
    _dbg()?.trace('service', `sql QUERY: ${sql.slice(0, 60)}… → ${results.length} rows`, undefined, SQL_SRC);

    // Emit trace event for debug TUI
    const tracer = _tracer();
    if (tracer?.isDebugActive()) {
      const resultJson = JSON.stringify(results);
      tracer.emit({
        cat: 'sql',
        fn: 'query',
        argBytes: sql.length + paramsJson.length,
        durMs,
        memBefore: 0,
        memAfter: 0,
        memGrowth: 0,
        argPreview: tracer.isVerbose() ? `${sql.slice(0, 150)} | rows=${results.length}` : undefined,
      });
      return resultJson;
    }

    return JSON.stringify(results);
  },

  /**
   * Execute a batch of SQL statements (for schema creation).
   * @returns true on success
   */
  executeBatch(sql: string): boolean {
    if (!db) throw new Error("Database not initialized");

    const t0 = performance.now();
    // sql.js exec() runs multiple statements
    db.exec(sql);
    const durMs = performance.now() - t0;

    // Emit trace event for debug TUI
    const tracer = _tracer();
    if (tracer?.isDebugActive()) {
      tracer.emit({
        cat: 'sql',
        fn: 'executeBatch',
        argBytes: sql.length,
        durMs,
        memBefore: 0,
        memAfter: 0,
        memGrowth: 0,
        argPreview: tracer.isVerbose() ? sql.slice(0, 200) : undefined,
      });
    }

    // Persist after batch writes (schema creation, migrations)
    scheduleSave();

    return true;
  },

  /**
   * Query for a single value (first column of first row).
   * @returns JSON string of the value, or "null" if no rows
   */
  queryValue(sql: string, paramsJson: string): string {
    if (!db) throw new Error("Database not initialized");

    const t0 = performance.now();
    const params = JSON.parse(paramsJson);

    const stmt = (db as any).prepare(sql);
    stmt.bind(params);

    let result = "null";
    if (stmt.step()) {
      const row = stmt.get();
      if (row && row.length > 0 && row[0] !== null && row[0] !== undefined) {
        result = JSON.stringify(row[0]);
      }
    }
    stmt.free();

    const durMs = performance.now() - t0;

    // Emit trace event for debug TUI
    const tracer = _tracer();
    if (tracer?.isDebugActive()) {
      tracer.emit({
        cat: 'sql',
        fn: 'queryValue',
        argBytes: sql.length + paramsJson.length,
        durMs,
        memBefore: 0,
        memAfter: 0,
        memGrowth: 0,
        argPreview: tracer.isVerbose() ? `${sql.slice(0, 150)} | result=${result.slice(0, 50)}` : undefined,
      });
    }

    return result;
  },
};

// Attach to globalThis immediately so Rust can call these
(globalThis as any).__umbra_sql = bridge;

// ─────────────────────────────────────────────────────────────────────────
// Page unload safety — flush pending saves before the page is discarded
// ─────────────────────────────────────────────────────────────────────────

if (typeof globalThis.addEventListener === 'function') {
  // 'pagehide' fires reliably on all modern browsers (including mobile Safari)
  // where 'beforeunload' may be suppressed. We cancel the debounce timer
  // and synchronously export the database, then kick off the IndexedDB write.
  // The browser gives us a short window to start the async operation.
  globalThis.addEventListener('pagehide', () => {
    if (!persistenceEnabled || !currentDid || !db) return;
    // Cancel the debounce — we're saving now
    if (saveTimer !== null) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    try {
      const data = db.export();
      // Fire-and-forget — the browser may or may not finish this
      saveDatabaseExport(currentDid, data).catch(() => {});
    } catch {
      // Best effort — page is closing
    }
  });

  // Also listen to visibilitychange to flush when the tab is hidden
  // (e.g. user switches tabs, which on mobile may lead to termination)
  globalThis.document?.addEventListener?.('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && saveTimer !== null) {
      // A save is pending — flush it now while we still have time
      clearTimeout(saveTimer);
      saveTimer = null;
      doSave();
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Public initialization functions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Initialize the SQL bridge by loading sql.js and creating an in-memory
 * database. Call this once at application startup, before calling any
 * Rust WASM database functions.
 *
 * This is the non-persistent variant — database is lost on page refresh.
 * Used when no DID is available (new user, first visit).
 *
 * @example
 * ```ts
 * import { initSqlBridge } from '@umbra/wasm/sql-bridge';
 * await initSqlBridge();
 * // Now safe to call umbra_wasm_init_database() from Rust
 * ```
 */
export async function initSqlBridge(): Promise<void> {
  if (db) return; // Already initialized

  if (!sqlJsPromise) {
    sqlJsPromise = loadSqlJs();
  }

  try {
    const SQL = await sqlJsPromise;
    db = new SQL.Database();
    persistenceEnabled = false;
    currentDid = null;

    // Re-attach bridge in case globalThis was cleared
    (globalThis as any).__umbra_sql = bridge;

    console.log("[sql-bridge] SQLite database initialized (in-memory, no persistence)");
  } catch (err) {
    // Clear the cached promise so subsequent attempts can retry
    sqlJsPromise = null;
    throw err;
  }
}

/**
 * Initialize the SQL bridge with IndexedDB persistence.
 *
 * Attempts to restore a previously saved database from IndexedDB for the
 * given DID. If found, the database is restored from the binary export.
 * If not found, a fresh in-memory database is created.
 *
 * After initialization, every write (execute/executeBatch) will trigger
 * an async fire-and-forget save to IndexedDB.
 *
 * @param did - The DID of the current identity, used for IndexedDB isolation
 *
 * @example
 * ```ts
 * import { initSqlBridgeWithPersistence } from '@umbra/wasm/sql-bridge';
 * await initSqlBridgeWithPersistence('did:key:z6Mk...');
 * // Database is now persistent — survives page refreshes
 * ```
 */
export async function initSqlBridgeWithPersistence(did: string): Promise<void> {
  if (db) return; // Already initialized

  if (!sqlJsPromise) {
    sqlJsPromise = loadSqlJs();
  }

  try {
    const SQL = await sqlJsPromise;

    // Try to restore from IndexedDB
    const exported = await loadDatabaseExport(did);

    if (exported) {
      db = new SQL.Database(exported);
      console.log(`[sql-bridge] SQLite database restored from IndexedDB (DID: ${did.slice(0, 20)}...)`);
    } else {
      db = new SQL.Database();
      console.log(`[sql-bridge] SQLite database initialized (fresh, DID: ${did.slice(0, 20)}...)`);
    }

    currentDid = did;
    persistenceEnabled = true;

    // Re-attach bridge in case globalThis was cleared
    (globalThis as any).__umbra_sql = bridge;
  } catch (err) {
    // Clear the cached promise so subsequent attempts can retry
    sqlJsPromise = null;
    throw err;
  }
}

/**
 * Enable persistence for an already-initialized database.
 *
 * This is useful when the database was initially created without a DID
 * (during identity creation), and the DID becomes available afterward.
 * It immediately triggers a save of the current database state.
 *
 * @param did - The DID to associate with this database
 */
export function enablePersistence(did: string): void {
  if (!db) {
    console.warn('[sql-bridge] Cannot enable persistence — database not initialized');
    return;
  }

  currentDid = did;
  persistenceEnabled = true;

  // Immediately save the current state
  scheduleSave();

  console.log(`[sql-bridge] Persistence enabled (DID: ${did.slice(0, 20)}...)`);
}

/**
 * Get the raw sql.js database instance for advanced operations.
 * Returns null if not initialized.
 */
export function getSqlDatabase(): SqlJsDatabase | null {
  return db;
}

/**
 * Close and destroy the database. After this, `initSqlBridge()` must
 * be called again before any database operations.
 */
export function closeSqlBridge(): void {
  if (db) {
    (db as any).close();
    db = null;
  }
  sqlJsPromise = null;
  currentDid = null;
  persistenceEnabled = false;
}

/**
 * Force-flush any pending database save, then close.
 *
 * Used before account switching to ensure no data is lost. Unlike
 * `closeSqlBridge()`, this awaits all in-flight persistence operations
 * and does one final export before tearing down.
 */
export async function flushAndCloseSqlBridge(): Promise<void> {
  // Cancel any pending debounced save timer
  if (saveTimer !== null) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }

  // Wait for any in-flight save to finish
  if (saveInFlight) {
    await new Promise<void>((resolve) => {
      const check = setInterval(() => {
        if (!saveInFlight) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  // Do one final synchronous export + await the persistence write
  if (persistenceEnabled && currentDid && db) {
    try {
      const data = db.export();
      await saveDatabaseExport(currentDid, data);
    } catch (err) {
      console.warn('[sql-bridge] Final flush failed:', err);
    }
  }

  // Now tear down
  closeSqlBridge();
}
