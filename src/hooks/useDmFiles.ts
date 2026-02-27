/**
 * useDmFiles — Hook for shared files in a DM/group conversation.
 *
 * Provides a flat file list with type-based filtering, CRUD operations,
 * and real-time updates via DM file event subscription.
 *
 * ## Usage
 *
 * ```tsx
 * const {
 *   files, isLoading, error, filter, setFilter,
 *   uploadFile, deleteFile, moveFile, recordDownload,
 * } = useDmFiles(conversationId);
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import type {
  DmSharedFileRecord,
  DmFileEventPayload,
} from '@umbra/service';

const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Filter types
// ---------------------------------------------------------------------------

export type DmFileFilter = 'all' | 'images' | 'documents' | 'media' | 'other';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'];
const DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument', 'text/plain', 'text/csv', 'application/json'];
const MEDIA_TYPES = ['audio/', 'video/'];

function matchesFilter(file: DmSharedFileRecord, filter: DmFileFilter): boolean {
  if (filter === 'all') return true;
  const mime = file.mimeType ?? '';
  switch (filter) {
    case 'images':
      return IMAGE_TYPES.some((t) => mime.startsWith(t));
    case 'documents':
      return DOCUMENT_TYPES.some((t) => mime.startsWith(t));
    case 'media':
      return MEDIA_TYPES.some((t) => mime.startsWith(t));
    case 'other':
      return (
        !IMAGE_TYPES.some((t) => mime.startsWith(t)) &&
        !DOCUMENT_TYPES.some((t) => mime.startsWith(t)) &&
        !MEDIA_TYPES.some((t) => mime.startsWith(t))
      );
  }
}

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface UseDmFilesResult {
  /** All files in the conversation (filtered by current filter) */
  files: DmSharedFileRecord[];
  /** Whether the initial load is in progress */
  isLoading: boolean;
  /** Error from fetching */
  error: Error | null;
  /** Current type filter */
  filter: DmFileFilter;
  /** Set the type filter */
  setFilter: (filter: DmFileFilter) => void;
  /** Upload a file record */
  uploadFile: (
    filename: string,
    fileSize: number,
    mimeType: string | null,
    storageChunksJson: string,
    description?: string | null,
  ) => Promise<DmSharedFileRecord | null>;
  /** Delete a file */
  deleteFile: (fileId: string) => Promise<void>;
  /** Move a file to a different folder */
  moveFile: (fileId: string, targetFolderId: string | null) => Promise<void>;
  /** Record a file download */
  recordDownload: (fileId: string) => Promise<void>;
  /** Refresh files */
  refresh: () => Promise<void>;
  /** Retry after an error */
  retry: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDmFiles(conversationId: string | null): UseDmFilesResult {
  const { service, isReady } = useUmbra();
  const { identity } = useAuth();

  const [allFiles, setAllFiles] = useState<DmSharedFileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<DmFileFilter>('all');

  // -------------------------------------------------------------------------
  // Fetch
  // -------------------------------------------------------------------------

  const fetchFiles = useCallback(async () => {
    if (!service || !conversationId) return;
    try {
      setIsLoading(true);
      // Fetch all files in conversation (flat list, no folder filtering)
      const results = await service.getDmFiles(conversationId, null, PAGE_SIZE, 0);
      setAllFiles(results);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [service, conversationId]);

  // -------------------------------------------------------------------------
  // Initial fetch
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (isReady && service && conversationId) {
      fetchFiles();
    }
  }, [isReady, service, conversationId, fetchFiles]);

  // Reset state when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setAllFiles([]);
      setFilter('all');
      setIsLoading(false);
    }
  }, [conversationId]);

  // -------------------------------------------------------------------------
  // DM file event subscription — real-time updates
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!service || !conversationId) return;

    const unsubscribe = service.onDmFileEvent((event: DmFileEventPayload) => {
      if (event.conversationId !== conversationId) return;

      const evt = event.event;
      if (evt.type === 'fileUploaded') {
        setAllFiles((prev) => [evt.file, ...prev]);
      } else if (evt.type === 'fileDeleted') {
        setAllFiles((prev) => prev.filter((f) => f.id !== evt.fileId));
      } else if (evt.type === 'fileMoved') {
        fetchFiles();
      }
    });

    return unsubscribe;
  }, [service, conversationId, fetchFiles]);

  // -------------------------------------------------------------------------
  // Filtered files
  // -------------------------------------------------------------------------

  const files = useMemo(() => {
    return allFiles.filter((f) => matchesFilter(f, filter));
  }, [allFiles, filter]);

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
    ): Promise<DmSharedFileRecord | null> => {
      if (!service || !conversationId || !identity?.did) return null;
      try {
        const record = await service.uploadDmFile(
          conversationId,
          null, // folderId — flat list for DM files
          filename,
          description ?? null,
          fileSize,
          mimeType,
          storageChunksJson,
          identity.did,
        );
        // Optimistically add
        setAllFiles((prev) => [record, ...prev]);
        setError(null);
        return record;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      }
    },
    [service, conversationId, identity?.did],
  );

  const deleteFile = useCallback(
    async (fileId: string): Promise<void> => {
      if (!service || !identity?.did) return;
      try {
        await service.deleteDmFile(fileId, identity.did);
        setAllFiles((prev) => prev.filter((f) => f.id !== fileId));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    },
    [service, identity?.did],
  );

  const moveFile = useCallback(
    async (fileId: string, targetFolderId: string | null): Promise<void> => {
      if (!service) return;
      try {
        await service.moveDmFile(fileId, targetFolderId);
        setError(null);
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
        await service.recordDmFileDownload(fileId);
        setAllFiles((prev) =>
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
    await fetchFiles();
  }, [fetchFiles]);

  const retry = useCallback(async () => {
    setError(null);
    await fetchFiles();
  }, [fetchFiles]);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    files,
    isLoading,
    error,
    filter,
    setFilter,
    uploadFile,
    deleteFile,
    moveFile,
    recordDownload,
    refresh,
    retry,
  };
}
