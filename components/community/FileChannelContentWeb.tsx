/**
 * FileChannelContentWeb — Web-specific wrapper around Wisp React FileChannelView.
 *
 * Uses the full Wisp FileChannelView component with HTML5 drag-and-drop support.
 * This component is used on web only; mobile uses the RN FileChannelContent.
 *
 * Connects to the same useCommunityFiles hook for data, and adds:
 * - Native HTML5 drag-and-drop for OS file imports
 * - Full Wisp FileChannelView with folder tree, breadcrumbs, sorting, detail panel
 * - File context menus
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  FileChannelView,
} from '@coexist/wisp-react-native/src/components/file-channel-view';
import {
  FileDetailPanel,
} from '@coexist/wisp-react-native/src/components/file-detail-panel';
import type {
  FileEntry,
  FileFolder,
  FileViewMode,
  FileSortField,
  FileSortDirection,
} from '@coexist/wisp-core/types/FileChannelView.types';
import { useCommunityFiles } from '@/hooks/useCommunityFiles';
import { useCommunitySync } from '@/hooks/useCommunitySync';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { canUploadFiles, canManageFiles } from '@/utils/permissions';
import { InputDialog } from '@/components/community/InputDialog';
import type {
  CommunityFileRecord,
  CommunityFileFolderRecord,
  CommunityRole,
} from '@umbra/service';
import type { FileFolderNode } from '@/hooks/useCommunityFiles';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FileChannelContentWebProps {
  /** The community channel ID for file operations. */
  channelId: string;
  /** The community ID (for broadcasting events). */
  communityId: string;
  /** Roles assigned to the current user in this community. */
  myRoles?: CommunityRole[];
  /** Whether the current user is the community owner. */
  isOwner?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a CommunityFileRecord to a Wisp FileEntry shape. */
function toFileEntry(record: CommunityFileRecord): FileEntry {
  return {
    id: record.id,
    name: record.filename,
    size: record.fileSize,
    mimeType: record.mimeType ?? 'application/octet-stream',
    uploadedBy: record.uploadedBy,
    uploadedAt: new Date(record.createdAt).toISOString(),
    downloadCount: record.downloadCount,
    version: record.version,
    folderId: record.folderId,
  };
}

/** Convert a CommunityFileFolderRecord to a Wisp FileFolder shape. */
function toFolderView(record: CommunityFileFolderRecord): FileFolder {
  return {
    id: record.id,
    name: record.name,
    parentId: record.parentFolderId ?? null,
    createdBy: record.createdBy,
    createdAt: new Date(record.createdAt).toISOString(),
  };
}

/** Convert the folder tree to Wisp FileFolder shape. */
function toFolderTreeView(nodes: FileFolderNode[]): FileFolder[] {
  return nodes.map((node) => ({
    id: node.id,
    name: node.name,
    parentId: node.parentId,
    children: toFolderTreeView(node.children),
    fileCount: node.fileCount,
    createdBy: node.createdBy,
    createdAt: node.createdAt,
  }));
}

/** Trigger a file download on web via Blob + anchor tag. */
function triggerWebDownload(base64Data: string, filename: string, mimeType: string) {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Read a dropped File into base64. */
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] ?? result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FileChannelContentWeb({
  channelId,
  communityId,
  myRoles = [],
  isOwner = false,
}: FileChannelContentWebProps) {
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { syncEvent } = useCommunitySync(communityId);

  // Permission checks
  const allowUpload = canUploadFiles(myRoles, isOwner);
  const allowManage = canManageFiles(myRoles, isOwner);

  const {
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
  } = useCommunityFiles(channelId);

  // Local UI state
  const [viewMode, setViewMode] = useState<FileViewMode>('grid');
  const [sortBy, setSortBy] = useState<FileSortField>('name');
  const [sortDirection, setSortDirection] = useState<FileSortDirection>('asc');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [detailFileId, setDetailFileId] = useState<string | null>(null);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogSubmitting, setFolderDialogSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>('');

  // Data transforms
  const fileEntries = useMemo(() => files.map(toFileEntry), [files]);
  const subfolderEntries = useMemo(() => folders.map(toFolderView), [folders]);
  const folderTreeEntries = useMemo(
    () => toFolderTreeView(folderTree),
    [folderTree],
  );

  // Sort files
  const sortedFiles = useMemo(() => {
    const sorted = [...fileEntries];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'size':
          cmp = a.size - b.size;
          break;
        case 'date':
          cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'type':
          cmp = a.mimeType.localeCompare(b.mimeType);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [fileEntries, sortBy, sortDirection]);

  const detailFile = useMemo(
    () => (detailFileId ? fileEntries.find((f) => f.id === detailFileId) ?? null : null),
    [detailFileId, fileEntries],
  );

  // ---- Handlers ----

  const handleFolderClick = useCallback(
    (folderId: string) => {
      navigateToFolder(folderId);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setDetailFileId(null);
    },
    [navigateToFolder],
  );

  const handleBreadcrumbClick = useCallback(
    (folderId: string | null) => {
      navigateToFolder(folderId);
      setSelectedFileIds(new Set());
      setSelectedFolderIds(new Set());
      setDetailFileId(null);
    },
    [navigateToFolder],
  );

  const handleCreateFolder = useCallback(() => {
    setFolderDialogOpen(true);
  }, []);

  const handleFolderDialogSubmit = useCallback(async (name: string) => {
    if (!name?.trim()) return;
    setFolderDialogSubmitting(true);
    try {
      const folder = await createFolder(name.trim());
      if (folder) {
        syncEvent({ type: 'folderCreated', channelId, folderId: folder.id });
      }
      setFolderDialogOpen(false);
    } finally {
      setFolderDialogSubmitting(false);
    }
  }, [createFolder, syncEvent, channelId]);

  const handleUploadClick = useCallback(() => {
    if (!service || isUploading) return;
    // Use hidden file input for web
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = async () => {
      const droppedFiles = input.files;
      if (!droppedFiles || droppedFiles.length === 0) return;
      await processFileUploads(Array.from(droppedFiles));
    };
    input.click();
  }, [service, isUploading]);

  /** Core upload logic shared between file picker and drag-and-drop. */
  const processFileUploads = useCallback(
    async (nativeFiles: File[]) => {
      if (!service) return;
      setIsUploading(true);
      setUploadProgress(0);

      try {
        for (let i = 0; i < nativeFiles.length; i++) {
          const file = nativeFiles[i];
          setUploadFileName(file.name);
          setUploadProgress(Math.round(((i) / nativeFiles.length) * 100));

          const dataBase64 = await readFileAsBase64(file);
          const fileId = crypto.randomUUID();
          const manifest = await service.chunkFile(fileId, file.name, dataBase64);

          const record = await uploadFile(
            file.name,
            file.size,
            file.type || 'application/octet-stream',
            JSON.stringify(manifest),
          );

          if (record) {
            syncEvent({
              type: 'fileUploaded',
              channelId,
              fileId: record.id,
              senderDid: identity?.did ?? '',
            });
          }
        }
        setUploadProgress(100);
      } catch (err) {
        console.error('[FileChannelContentWeb] Upload failed:', err);
        setToastMessage(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadFileName('');
      }
    },
    [service, uploadFile, syncEvent, channelId, identity?.did],
  );

  const handleFileClick = useCallback((fileId: string) => {
    setDetailFileId((prev) => (prev === fileId ? null : fileId));
  }, []);

  const handleFileDelete = useCallback(
    async (fileIds: string[]) => {
      if (!allowManage) return;
      for (const id of fileIds) {
        await deleteFile(id);
        syncEvent({ type: 'fileDeleted', channelId, fileId: id });
      }
      setSelectedFileIds(new Set());
      setDetailFileId(null);
    },
    [allowManage, deleteFile, syncEvent, channelId],
  );

  const handleFolderDelete = useCallback(
    async (folderId: string) => {
      if (!allowManage) return;
      await deleteFolder(folderId);
      syncEvent({ type: 'folderDeleted', channelId, folderId });
      setSelectedFolderIds(new Set());
    },
    [allowManage, deleteFolder, syncEvent, channelId],
  );

  const handleFileDownload = useCallback(
    async (fileId: string) => {
      if (!service) return;
      await recordDownload(fileId);

      try {
        const reassembled = await service.reassembleFile(fileId);
        if (reassembled && reassembled.dataB64) {
          const file = files.find((f) => f.id === fileId);
          triggerWebDownload(
            reassembled.dataB64,
            reassembled.filename,
            file?.mimeType ?? 'application/octet-stream',
          );
        }
      } catch {
        setToastMessage('P2P file download coming soon. File chunks are not available locally.');
      }
    },
    [service, recordDownload, files],
  );

  const handleSortChange = useCallback((field: FileSortField, direction: FileSortDirection) => {
    setSortBy(field);
    setSortDirection(direction);
  }, []);

  // ---- HTML5 Drag-and-drop handlers ----

  const handleFileDrop = useCallback(
    async (droppedFiles: File[], targetFolderId: string | null) => {
      if (!allowUpload || !service) return;
      await processFileUploads(droppedFiles);
    },
    [allowUpload, service, processFileUploads],
  );

  // ---- Render ----

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Web-only props (subfolders, sort, selection, detail panel, drag-drop) are
         passed through to the full Wisp web FileChannelView at runtime. The RN type
         definition is narrower so we spread via `any` to avoid type errors. */}
      <FileChannelView
        {...({
          folders: folderTreeEntries,
          files: sortedFiles,
          subfolders: subfolderEntries,
          currentFolderId,
          viewMode,
          onViewModeChange: setViewMode,
          onFolderClick: handleFolderClick,
          onFileClick: handleFileClick,
          onUploadClick: allowUpload ? handleUploadClick : undefined,
          onCreateFolder: allowManage ? handleCreateFolder : undefined,
          breadcrumbPath,
          onBreadcrumbClick: handleBreadcrumbClick,
          loading: isLoading,
          emptyText: 'No files yet — click Upload to add files',
          selectedFileIds,
          selectedFolderIds,
          onFileSelectionChange: setSelectedFileIds,
          onFolderSelectionChange: setSelectedFolderIds,
          onFileDownload: handleFileDownload,
          onFileDelete: allowManage ? handleFileDelete : undefined,
          onFolderDelete: allowManage ? handleFolderDelete : undefined,
          onFileDrop: allowUpload ? handleFileDrop : undefined,
          showDetailPanel: !!detailFile,
          detailFile,
          onDetailPanelClose: () => setDetailFileId(null),
          sortBy,
          sortDirection,
          onSortChange: handleSortChange,
          uploading: isUploading,
          uploadProgress,
          currentUploadFileName: uploadFileName,
        } as any)}
      />

      {/* Create folder dialog */}
      {/* Create folder dialog */}
      <InputDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        title="Create Folder"
        label="Folder Name"
        placeholder="e.g. Documents, Images..."
        submitLabel="Create"
        submitting={folderDialogSubmitting}
        onSubmit={handleFolderDialogSubmit}
      />

      {/* Toast notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1a1a2e',
            color: '#e0e0e0',
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid #333',
            zIndex: 10000,
            maxWidth: 480,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ flex: 1 }}>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              fontSize: 16,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
