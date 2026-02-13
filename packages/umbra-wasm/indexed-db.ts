/**
 * IndexedDB Persistence — Stores sql.js database exports for offline persistence.
 *
 * Each DID (identity) gets its own IndexedDB database, keyed by `umbra-db-{did}`.
 * The sql.js in-memory SQLite database is exported as a Uint8Array and stored
 * in IndexedDB so it survives page refreshes.
 *
 * ## Architecture
 *
 * ```
 * sql.js (in-memory) --export()--> Uint8Array --IndexedDB--> persistent storage
 *                                                              |
 * sql.js (restored) <--new Database(data)-- Uint8Array <-------+
 * ```
 */

// ─────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────

const DB_PREFIX = 'umbra-db-';
const STORE_NAME = 'exports';
const EXPORT_KEY = 'latest';
const IDB_VERSION = 1;

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Check if IndexedDB is available in the current environment.
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Open (or create) an IndexedDB database for a specific DID.
 *
 * @param did - The DID to scope the database to
 * @returns The opened IDBDatabase instance
 */
function openUmbraDB(did: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const dbName = `${DB_PREFIX}${did}`;
    const request = indexedDB.open(dbName, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error(`Failed to open IndexedDB: ${dbName}`));
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────

/**
 * Save a sql.js database export to IndexedDB.
 *
 * Called after every database write (async fire-and-forget).
 * Stores the full database binary under the key "latest".
 *
 * @param did - The DID this database belongs to
 * @param data - The Uint8Array from sql.js `db.export()`
 */
export async function saveDatabaseExport(did: string, data: Uint8Array): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return; // Silently skip if IndexedDB unavailable
  }

  try {
    const db = await openUmbraDB(did);
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(data, EXPORT_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);

      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch (err) {
    console.warn('[indexed-db] Failed to save database export:', err);
  }
}

/**
 * Load a previously saved database export from IndexedDB.
 *
 * @param did - The DID to load the database for
 * @returns The Uint8Array database binary, or null if none exists
 */
export async function loadDatabaseExport(did: string): Promise<Uint8Array | null> {
  if (!isIndexedDBAvailable()) {
    return null;
  }

  try {
    const db = await openUmbraDB(did);
    const result = await new Promise<Uint8Array | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(EXPORT_KEY);

      request.onsuccess = () => {
        const value = request.result;
        if (value instanceof Uint8Array) {
          resolve(value);
        } else if (value) {
          // Handle ArrayBuffer or other typed array forms
          resolve(new Uint8Array(value));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);

      tx.oncomplete = () => db.close();
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
    return result;
  } catch (err) {
    console.warn('[indexed-db] Failed to load database export:', err);
    return null;
  }
}

/**
 * Clear the persisted database export for a specific DID.
 *
 * Used for selective data wipe or when switching identities.
 *
 * @param did - The DID whose data should be cleared
 */
export async function clearDatabaseExport(did: string): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    const dbName = `${DB_PREFIX}${did}`;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        console.warn('[indexed-db] Database deletion blocked:', dbName);
        resolve(); // Don't fail, just warn
      };
    });
  } catch (err) {
    console.warn('[indexed-db] Failed to clear database export:', err);
  }
}

/**
 * Clear ALL Umbra IndexedDB databases across all identities.
 *
 * Used for full data wipe. Iterates through all IndexedDB databases
 * and deletes ones matching the Umbra prefix.
 */
export async function clearAllDatabaseExports(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    return;
  }

  try {
    // Modern browsers support indexedDB.databases()
    if (typeof indexedDB.databases === 'function') {
      const databases = await indexedDB.databases();
      const umbraDbs = databases.filter((db) => db.name?.startsWith(DB_PREFIX));

      await Promise.all(
        umbraDbs.map(
          (db) =>
            new Promise<void>((resolve) => {
              if (!db.name) {
                resolve();
                return;
              }
              const request = indexedDB.deleteDatabase(db.name);
              request.onsuccess = () => resolve();
              request.onerror = () => {
                console.warn('[indexed-db] Failed to delete:', db.name);
                resolve(); // Don't block on individual failures
              };
              request.onblocked = () => resolve();
            })
        )
      );
    } else {
      console.warn('[indexed-db] indexedDB.databases() not available — cannot enumerate databases');
    }
  } catch (err) {
    console.warn('[indexed-db] Failed to clear all database exports:', err);
  }
}

/**
 * List all DIDs that have stored database exports.
 *
 * Used for the identity switch dialog to show which old identities
 * have data that could be kept or deleted.
 *
 * @returns Array of DID strings that have persisted data
 */
export async function listStoredDids(): Promise<string[]> {
  if (!isIndexedDBAvailable()) {
    return [];
  }

  try {
    if (typeof indexedDB.databases === 'function') {
      const databases = await indexedDB.databases();
      return databases
        .filter((db) => db.name?.startsWith(DB_PREFIX))
        .map((db) => db.name!.slice(DB_PREFIX.length));
    }
    return [];
  } catch (err) {
    console.warn('[indexed-db] Failed to list stored DIDs:', err);
    return [];
  }
}
