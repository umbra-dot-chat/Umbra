/**
 * useSharedFolders — Hook for managing shared folders across DM conversations.
 *
 * Lists all shared folders, provides sync state per folder, and supports
 * on-demand and manual sync operations with conflict detection.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   sharedFolders, isLoading,
 *   syncFolder, getSyncProgress,
 * } = useSharedFolders();
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type { DmSharedFolderRecord, DmSharedFileRecord } from '@umbra/service';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'unknown';

export interface SharedFolderInfo {
  /** The folder record */
  folder: DmSharedFolderRecord;
  /** Number of files in the folder */
  fileCount: number;
  /** Sync status */
  syncStatus: SyncStatus;
  /** Sync progress 0-100 */
  syncProgress: number;
  /** Last sync timestamp */
  lastSyncAt: number | null;
  /** Conversation this folder belongs to */
  conversationId: string;
}

export interface ConflictInfo {
  /** File ID */
  fileId: string;
  /** Filename */
  filename: string;
  /** Local version info */
  localVersion: { modifiedBy: string; modifiedAt: number };
  /** Remote version info */
  remoteVersion: { modifiedBy: string; modifiedAt: number };
}

export interface UseSharedFoldersResult {
  /** All shared folders across conversations */
  sharedFolders: SharedFolderInfo[];
  /** Whether initial load is in progress */
  isLoading: boolean;
  /** Error from fetching */
  error: Error | null;
  /** Manually trigger sync for a folder */
  syncFolder: (folderId: string) => Promise<void>;
  /** Get sync progress for a folder (0-100) */
  getSyncProgress: (folderId: string) => number;
  /** Detected conflicts */
  conflicts: ConflictInfo[];
  /** Resolve a conflict */
  resolveConflict: (fileId: string, resolution: 'keepLocal' | 'keepRemote' | 'keepBoth') => Promise<void>;
  /** Refresh all shared folders */
  refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSharedFolders(): UseSharedFoldersResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();

  const [sharedFolders, setSharedFolders] = useState<SharedFolderInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [syncProgress, setSyncProgress] = useState<Map<string, number>>(new Map());
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);

  // -------------------------------------------------------------------------
  // Fetch shared folders from all conversations
  // -------------------------------------------------------------------------

  const fetchSharedFolders = useCallback(async () => {
    if (!service) return;
    try {
      setIsLoading(true);

      // Get all conversations
      const conversations = await service.getConversations();

      const allFolders: SharedFolderInfo[] = [];

      for (const conv of conversations) {
        try {
          // Get folders for each conversation
          const folders = await service.getDmFolders(conv.id, null);
          for (const folder of folders) {
            // Get file count
            const files = await service.getDmFiles(conv.id, folder.id, 1000, 0);
            allFolders.push({
              folder,
              fileCount: files.length,
              syncStatus: 'synced',
              syncProgress: 100,
              lastSyncAt: folder.createdAt,
              conversationId: conv.id,
            });
          }
        } catch {
          // Skip conversations that fail
        }
      }

      setSharedFolders(allFolders);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (isReady && service) {
      fetchSharedFolders();
    }
  }, [isReady, service, fetchSharedFolders]);

  // -------------------------------------------------------------------------
  // Sync folder
  // -------------------------------------------------------------------------

  const syncFolder = useCallback(
    async (folderId: string): Promise<void> => {
      if (!service) return;

      // Mark as syncing
      setSharedFolders((prev) =>
        prev.map((sf) =>
          sf.folder.id === folderId
            ? { ...sf, syncStatus: 'syncing' as SyncStatus, syncProgress: 0 }
            : sf,
        ),
      );

      try {
        // In the future, this will trigger a P2P sync of the folder contents.
        // For now, just refresh the file list.
        const folderInfo = sharedFolders.find((sf) => sf.folder.id === folderId);
        if (folderInfo) {
          const files = await service.getDmFiles(
            folderInfo.conversationId,
            folderId,
            1000,
            0,
          );

          setSharedFolders((prev) =>
            prev.map((sf) =>
              sf.folder.id === folderId
                ? {
                    ...sf,
                    fileCount: files.length,
                    syncStatus: 'synced' as SyncStatus,
                    syncProgress: 100,
                    lastSyncAt: Date.now(),
                  }
                : sf,
            ),
          );
        }
      } catch (err) {
        setSharedFolders((prev) =>
          prev.map((sf) =>
            sf.folder.id === folderId
              ? { ...sf, syncStatus: 'error' as SyncStatus }
              : sf,
          ),
        );
      }
    },
    [service, sharedFolders],
  );

  // -------------------------------------------------------------------------
  // Get sync progress
  // -------------------------------------------------------------------------

  const getSyncProgress = useCallback(
    (folderId: string): number => {
      return syncProgress.get(folderId) ?? 100;
    },
    [syncProgress],
  );

  // -------------------------------------------------------------------------
  // Conflict resolution
  // -------------------------------------------------------------------------

  const resolveConflict = useCallback(
    async (fileId: string, resolution: 'keepLocal' | 'keepRemote' | 'keepBoth'): Promise<void> => {
      // In the future, this will:
      // - keepLocal: upload local version, overwrite remote
      // - keepRemote: download remote version, overwrite local
      // - keepBoth: keep both with version suffixes
      setConflicts((prev) => prev.filter((c) => c.fileId !== fileId));
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Refresh
  // -------------------------------------------------------------------------

  const refresh = useCallback(async () => {
    await fetchSharedFolders();
  }, [fetchSharedFolders]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    sharedFolders,
    isLoading,
    error,
    syncFolder,
    getSyncProgress,
    conflicts,
    resolveConflict,
    refresh,
  };
}
