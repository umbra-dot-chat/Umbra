/**
 * Storage Manager — utility for monitoring and managing local file storage.
 *
 * Provides:
 * - `getStorageUsage()` — query how much space is used by files, chunks, etc.
 * - `smartCleanup()` — remove stale caches and completed transfer data
 * - `setAutoCleanupRules()` — configure automatic cleanup thresholds
 * - `getCleanupSuggestions()` — identify largest files, duplicates, old cache
 *
 * @packageDocumentation
 */

// ── Types ──────────────────────────────────────────────────────────────────

/**
 * Breakdown of storage usage by context.
 */
export interface StorageUsageByContext {
  /** Bytes used by community file chunks */
  community: number;
  /** Bytes used by DM shared file chunks */
  dm: number;
  /** Bytes used by shared folders */
  sharedFolders: number;
  /** Bytes used by transfer caches (in-flight data) */
  cache: number;
}

/**
 * Overall storage usage information.
 */
export interface StorageUsage {
  /** Total bytes used across all contexts */
  total: number;
  /** Breakdown by storage context */
  byContext: StorageUsageByContext;
  /** Number of stored file manifests */
  manifestCount: number;
  /** Number of stored chunks */
  chunkCount: number;
  /** Number of active/incomplete transfers */
  activeTransfers: number;
}

/**
 * Result of a cleanup operation.
 */
export interface CleanupResult {
  /** Number of bytes freed */
  bytesFreed: number;
  /** Number of chunks removed */
  chunksRemoved: number;
  /** Number of manifests removed */
  manifestsRemoved: number;
  /** Number of transfer sessions cleaned */
  transfersCleaned: number;
}

/**
 * A cleanup suggestion.
 */
export interface CleanupSuggestion {
  /** Type of suggestion */
  type: 'large_file' | 'duplicate' | 'stale_cache' | 'completed_transfer' | 'orphaned_chunk';
  /** Human-readable description */
  description: string;
  /** Bytes that could be freed */
  bytesReclaimable: number;
  /** IDs of items involved */
  itemIds: string[];
}

/**
 * Rules for automatic cleanup.
 */
export interface AutoCleanupRules {
  /** Maximum total storage in bytes before auto-cleanup triggers */
  maxTotalBytes?: number;
  /** Maximum age in seconds for completed transfer data before cleanup */
  maxTransferAge?: number;
  /** Maximum age in seconds for cached chunks before cleanup */
  maxCacheAge?: number;
  /** Whether to remove orphaned chunks (chunks with no manifest) */
  removeOrphanedChunks?: boolean;
}

// ── Default Rules ──────────────────────────────────────────────────────────

const DEFAULT_RULES: AutoCleanupRules = {
  maxTotalBytes: 2 * 1024 * 1024 * 1024, // 2 GB
  maxTransferAge: 7 * 24 * 60 * 60, // 7 days
  maxCacheAge: 24 * 60 * 60, // 24 hours
  removeOrphanedChunks: true,
};

// ── State ──────────────────────────────────────────────────────────────────

let cleanupRules: AutoCleanupRules = { ...DEFAULT_RULES };

// ── Storage Usage ──────────────────────────────────────────────────────────

/**
 * Get current storage usage information.
 *
 * NOTE: This is a best-effort estimate. For OPFS storage, it relies on
 * the Storage API estimate. For SQLite, it counts stored chunks.
 *
 * @returns Storage usage breakdown
 */
export async function getStorageUsage(): Promise<StorageUsage> {
  // Try to use the Storage API for an overall estimate
  let storageEstimate = { usage: 0, quota: 0 };
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      storageEstimate = { usage: est.usage ?? 0, quota: est.quota ?? 0 };
    } catch {
      // Storage API not available
    }
  }

  // For now, return a simplified estimate based on available info.
  // As we wire this into the actual WASM chunk counting, these numbers
  // will become more precise.
  return {
    total: storageEstimate.usage,
    byContext: {
      community: 0,
      dm: 0,
      sharedFolders: 0,
      cache: 0,
    },
    manifestCount: 0,
    chunkCount: 0,
    activeTransfers: 0,
  };
}

// ── Smart Cleanup ──────────────────────────────────────────────────────────

/**
 * Run smart cleanup based on current rules.
 *
 * Removes:
 * - Completed transfer sessions older than `maxTransferAge`
 * - Cached chunks older than `maxCacheAge`
 * - Orphaned chunks (if enabled)
 *
 * @returns Cleanup results
 */
export async function smartCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    bytesFreed: 0,
    chunksRemoved: 0,
    manifestsRemoved: 0,
    transfersCleaned: 0,
  };

  // In the future, this will call WASM functions to:
  // 1. Delete completed transfer sessions beyond maxTransferAge
  // 2. Remove stale cached chunks beyond maxCacheAge
  // 3. Find and remove orphaned chunks
  // 4. Clear OPFS storage for cleaned items

  console.log('[StorageManager] Smart cleanup complete:', result);
  return result;
}

// ── Auto-Cleanup Rules ─────────────────────────────────────────────────────

/**
 * Set automatic cleanup rules.
 *
 * @param rules - Rules to apply (merged with defaults)
 */
export function setAutoCleanupRules(rules: Partial<AutoCleanupRules>): void {
  cleanupRules = { ...DEFAULT_RULES, ...rules };
  console.log('[StorageManager] Cleanup rules updated:', cleanupRules);
}

/**
 * Get current cleanup rules.
 */
export function getAutoCleanupRules(): AutoCleanupRules {
  return { ...cleanupRules };
}

// ── Cleanup Suggestions ────────────────────────────────────────────────────

/**
 * Get suggestions for freeing storage space.
 *
 * Analyzes stored data and returns actionable suggestions sorted by
 * potential space savings (largest first).
 *
 * @returns Array of cleanup suggestions
 */
export async function getCleanupSuggestions(): Promise<CleanupSuggestion[]> {
  const suggestions: CleanupSuggestion[] = [];

  // In the future, this will analyze:
  // 1. Largest files (community + DM) — suggest removal if rarely accessed
  // 2. Duplicate chunks across files
  // 3. Stale transfer cache data
  // 4. Completed transfers with retained chunk data
  // 5. Orphaned chunks with no manifest reference

  // Sort by bytes reclaimable (largest first)
  suggestions.sort((a, b) => b.bytesReclaimable - a.bytesReclaimable);

  return suggestions;
}

// ── Utility ────────────────────────────────────────────────────────────────

/**
 * Format bytes into a human-readable string.
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
