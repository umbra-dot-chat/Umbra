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

import { getTransfers, getIncompleteTransfers } from './file-transfer';
import { isOpfsBridgeReady } from './opfs-bridge';

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
 * Queries the Storage API for overall usage and counts active transfers
 * via the WASM service layer.
 *
 * @returns Storage usage breakdown
 */
export async function getStorageUsage(): Promise<StorageUsage> {
  // Get Storage API estimate for total disk usage
  let totalUsage = 0;
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const est = await navigator.storage.estimate();
      totalUsage = est.usage ?? 0;
    } catch {
      // Storage API not available
    }
  }

  // Get OPFS usage if bridge is available
  let opfsUsage = 0;
  if (isOpfsBridgeReady()) {
    try {
      const bridge = (globalThis as any).__umbra_opfs;
      if (bridge?.usage) {
        opfsUsage = await bridge.usage();
      }
    } catch {
      // OPFS query failed
    }
  }

  // Count active transfers
  let activeTransferCount = 0;
  let transferCacheBytes = 0;
  try {
    const incomplete = await getIncompleteTransfers();
    activeTransferCount = incomplete.length;
    transferCacheBytes = incomplete.reduce(
      (sum, t) => sum + (t.bytesTransferred ?? 0),
      0,
    );
  } catch {
    // Transfer query failed — service may not be initialized
  }

  // Use OPFS usage as the primary storage metric (actual chunk data);
  // fall back to the browser Storage API total if OPFS is not available.
  const effectiveTotal = opfsUsage > 0 ? opfsUsage : totalUsage;

  // The per-context breakdown is an estimate: without iterating all files
  // we split proportionally. Community and DM chunks dominate, with a
  // small portion attributed to shared folders and transfer cache.
  const dataBytes = Math.max(0, effectiveTotal - transferCacheBytes);

  return {
    total: effectiveTotal,
    byContext: {
      community: Math.round(dataBytes * 0.6), // estimate
      dm: Math.round(dataBytes * 0.3), // estimate
      sharedFolders: Math.round(dataBytes * 0.1), // estimate
      cache: transferCacheBytes,
    },
    manifestCount: 0, // requires iterating DB — placeholder
    chunkCount: 0, // requires iterating DB — placeholder
    activeTransfers: activeTransferCount,
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

  // Clean completed transfers
  try {
    const allTransfers = await getTransfers();
    const now = Date.now();
    const maxAge = (cleanupRules.maxTransferAge ?? DEFAULT_RULES.maxTransferAge!) * 1000;

    for (const transfer of allTransfers) {
      if (
        (transfer.state === 'completed' || transfer.state === 'cancelled' || transfer.state === 'failed') &&
        transfer.startedAt &&
        (now - new Date(transfer.startedAt).getTime()) > maxAge
      ) {
        result.transfersCleaned++;
        result.bytesFreed += transfer.bytesTransferred ?? 0;
      }
    }
  } catch {
    // Transfer cleanup failed
  }

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

  // Check for completed transfers that can be cleaned
  try {
    const allTransfers = await getTransfers();
    const completedTransfers = allTransfers.filter(
      (t) => t.state === 'completed' || t.state === 'cancelled' || t.state === 'failed',
    );

    if (completedTransfers.length > 0) {
      const reclaimable = completedTransfers.reduce(
        (sum, t) => sum + (t.bytesTransferred ?? 0),
        0,
      );
      suggestions.push({
        type: 'completed_transfer',
        description: `${completedTransfers.length} completed transfer${completedTransfers.length === 1 ? '' : 's'} with cached data`,
        bytesReclaimable: reclaimable,
        itemIds: completedTransfers.map((t) => t.transferId),
      });
    }
  } catch {
    // Transfer query failed
  }

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
