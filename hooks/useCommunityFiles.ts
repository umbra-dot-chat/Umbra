/**
 * useCommunityFiles — Hook for files and folders in a community file channel.
 *
 * Fetches files and folders from the Umbra service, manages navigation
 * state (current folder, breadcrumbs), and provides CRUD operations.
 * Subscribes to community events for real-time file/folder updates.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   files, folders, isLoading, currentFolderId,
 *   navigateToFolder, uploadFile, createFolder, deleteFile, deleteFolder,
 * } = useCommunityFiles(channelId);
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type {
  CommunityFileRecord,
  CommunityFileFolderRecord,
  CommunityEvent,
} from '@umbra/service';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// FileFolder shape for the tree view (matches Wisp FileFolder type)
// ---------------------------------------------------------------------------

export interface FileFolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children: FileFolderNode[];
  fileCount?: number;
  createdBy?: string;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface UseCommunityFilesResult {
  /** Files in the current folder */
  files: CommunityFileRecord[];
  /** Subfolders in the current folder */
  folders: CommunityFileFolderRecord[];
  /** Full folder tree for the sidebar tree view */
  folderTree: FileFolderNode[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from fetching */
  error: Error | null;
  /** Currently selected folder id (null = root) */
  currentFolderId: string | null;
  /** Navigate into a folder */
  navigateToFolder: (folderId: string | null) => void;
  /** Breadcrumb path from root to current folder */
  breadcrumbPath: Array<{ id: string; name: string }>;
  /** Upload a file record */
  uploadFile: (
    filename: string,
    fileSize: number,
    mimeType: string | null,
    storageChunksJson: string,
    description?: string | null,
  ) => Promise<CommunityFileRecord | null>;
  /** Create a folder */
  createFolder: (name: string) => Promise<CommunityFileFolderRecord | null>;
  /** Delete a file */
  deleteFile: (fileId: string) => Promise<void>;
  /** Delete a folder */
  deleteFolder: (folderId: string) => Promise<void>;
  /** Record a file download */
  recordDownload: (fileId: string) => Promise<void>;
  /** Refresh files and folders */
  refresh: () => Promise<void>;
  /** Retry after an error (clears error + refreshes) */
  retry: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCommunityFiles(channelId: string | null): UseCommunityFilesResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();

  const [files, setFiles] = useState<CommunityFileRecord[]>([]);
  const [folders, setFolders] = useState<CommunityFileFolderRecord[]>([]);
  const [allFolders, setAllFolders] = useState<CommunityFileFolderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Fetch helpers
  // -------------------------------------------------------------------------

  const fetchFilesAndFolders = useCallback(
    async (folderId: string | null) => {
      if (!service || !channelId) return;
      try {
        setIsLoading(true);
        const [fileResults, folderResults, allFolderResults] = await Promise.all([
          service.getCommunityFiles(channelId, folderId, PAGE_SIZE, 0),
          service.getCommunityFolders(channelId, folderId),
          service.getCommunityFolders(channelId, null),
        ]);
        setFiles(fileResults);
        setFolders(folderResults);
        setAllFolders(allFolderResults);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    },
    [service, channelId],
  );

  // -------------------------------------------------------------------------
  // Initial fetch + folder changes
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isReady && service && channelId) {
      fetchFilesAndFolders(currentFolderId);
    }
  }, [isReady, service, channelId, currentFolderId, fetchFilesAndFolders]);

  // Reset state when channel changes
  useEffect(() => {
    if (!channelId) {
      setFiles([]);
      setFolders([]);
      setAllFolders([]);
      setCurrentFolderId(null);
      setIsLoading(false);
    }
  }, [channelId]);

  // -------------------------------------------------------------------------
  // Community event subscription — real-time updates
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!service || !channelId) return;

    const unsubscribe = service.onCommunityEvent((event: CommunityEvent) => {
      switch (event.type) {
        case 'fileUploaded':
          if (event.channelId === channelId) {
            fetchFilesAndFolders(currentFolderId);
          }
          break;

        case 'fileDeleted':
          if (event.channelId === channelId) {
            setFiles((prev) => prev.filter((f) => f.id !== event.fileId));
          }
          break;

        case 'folderCreated':
          if (event.channelId === channelId) {
            fetchFilesAndFolders(currentFolderId);
          }
          break;

        case 'folderDeleted':
          if (event.channelId === channelId) {
            setFolders((prev) => prev.filter((f) => f.id !== event.folderId));
            setAllFolders((prev) => prev.filter((f) => f.id !== event.folderId));
            // If we're inside the deleted folder, go back to root
            if (currentFolderId === event.folderId) {
              setCurrentFolderId(null);
            }
          }
          break;

        case 'fileMoved':
          if (event.channelId === channelId) {
            fetchFilesAndFolders(currentFolderId);
          }
          break;
      }
    });

    return unsubscribe;
  }, [service, channelId, currentFolderId, fetchFilesAndFolders]);

  // -------------------------------------------------------------------------
  // Build folder tree (for sidebar TreeView)
  // -------------------------------------------------------------------------

  const folderTree = useMemo<FileFolderNode[]>(() => {
    const map = new Map<string, FileFolderNode>();

    // Create nodes
    for (const folder of allFolders) {
      map.set(folder.id, {
        id: folder.id,
        name: folder.name,
        parentId: folder.parentFolderId ?? null,
        children: [],
        createdBy: folder.createdBy,
        createdAt: folder.createdAt ? new Date(folder.createdAt).toISOString() : undefined,
      });
    }

    // Build tree
    const roots: FileFolderNode[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }, [allFolders]);

  // -------------------------------------------------------------------------
  // Breadcrumb path
  // -------------------------------------------------------------------------

  const breadcrumbPath = useMemo<Array<{ id: string; name: string }>>(() => {
    if (!currentFolderId) return [];

    const path: Array<{ id: string; name: string }> = [];
    let current = allFolders.find((f) => f.id === currentFolderId);

    while (current) {
      path.unshift({ id: current.id, name: current.name });
      current = current.parentFolderId
        ? allFolders.find((f) => f.id === current!.parentFolderId)
        : undefined;
    }

    return path;
  }, [currentFolderId, allFolders]);

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
  }, []);

  // -------------------------------------------------------------------------
  // CRUD operations
  // -------------------------------------------------------------------------

  const uploadFile = useCallback(
    async (
      filename: string,
      fileSize: number,
      mimeType: string | null,
      storageChunksJson: string,
      description?: string | null,
    ): Promise<CommunityFileRecord | null> => {
      if (!service || !channelId || !identity?.did) return null;
      try {
        const record = await service.uploadCommunityFile(
          channelId,
          currentFolderId,
          filename,
          description ?? null,
          fileSize,
          mimeType,
          storageChunksJson,
          identity.did,
        );
        // Optimistically add
        setFiles((prev) => [record, ...prev]);
        return record;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, channelId, identity?.did, currentFolderId],
  );

  const createFolder = useCallback(
    async (name: string): Promise<CommunityFileFolderRecord | null> => {
      if (!service || !channelId || !identity?.did) return null;
      try {
        const folder = await service.createCommunityFolder(
          channelId,
          currentFolderId,
          name,
          identity.did,
        );
        // Optimistically add
        setFolders((prev) => [folder, ...prev]);
        setAllFolders((prev) => [...prev, folder]);
        return folder;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, channelId, identity?.did, currentFolderId],
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.deleteCommunityFile(fileId, identity.did);
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, identity?.did],
  );

  const deleteFolder = useCallback(
    async (folderId: string): Promise<void> => {
      if (!service) return;
      try {
        await service.deleteCommunityFolder(folderId);
        setFolders((prev) => prev.filter((f) => f.id !== folderId));
        setAllFolders((prev) => prev.filter((f) => f.id !== folderId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const recordDownload = useCallback(
    async (fileId: string): Promise<void> => {
      if (!service) return;
      try {
        await service.recordCommunityFileDownload(fileId);
        // Update download count locally
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, downloadCount: f.downloadCount + 1 } : f,
          ),
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service],
  );

  const refresh = useCallback(async () => {
    await fetchFilesAndFolders(currentFolderId);
  }, [fetchFilesAndFolders, currentFolderId]);

  const retry = useCallback(async () => {
    setError(null);
    await fetchFilesAndFolders(currentFolderId);
  }, [fetchFilesAndFolders, currentFolderId]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    files,
    folders,
    folderTree,
    isLoading,
    error,
    currentFolderId,
    navigateToFolder,
    breadcrumbPath,
    uploadFile,
    createFolder,
    deleteFile,
    deleteFolder,
    recordDownload,
    refresh,
    retry,
  };
}
