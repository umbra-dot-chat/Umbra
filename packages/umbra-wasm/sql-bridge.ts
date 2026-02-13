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
// Persistence — async fire-and-forget save after each write
// ─────────────────────────────────────────────────────────────────────────

/**
 * Schedule an async save of the database to IndexedDB.
 *
 * This is fire-and-forget: it exports the database to a Uint8Array and
 * stores it in IndexedDB without blocking the caller.
 */
function scheduleSave(): void {
  if (!persistenceEnabled || !currentDid || !db) return;

  // Capture values synchronously so they're consistent
  const did = currentDid;
  const data = db.export();

  // Fire-and-forget — no await, no blocking
  saveDatabaseExport(did, data).catch((err) => {
    console.warn('[sql-bridge] Failed to persist database:', err);
  });
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

    const params = JSON.parse(paramsJson);
    db.run(sql, params);
    const rowsModified = db.getRowsModified();

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

    return JSON.stringify(results);
  },

  /**
   * Execute a batch of SQL statements (for schema creation).
   * @returns true on success
   */
  executeBatch(sql: string): boolean {
    if (!db) throw new Error("Database not initialized");

    // sql.js exec() runs multiple statements
    db.exec(sql);

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

    return result;
  },
};

// Attach to globalThis immediately so Rust can call these
(globalThis as any).__umbra_sql = bridge;

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
