/**
 * FileChannelContent — Wraps the Wisp FileChannelView with Umbra hooks.
 *
 * Connects the Wisp design system FileChannelView component to Umbra's
 * community file CRUD service via the useCommunityFiles hook.
 *
 * Handles:
 * - File/folder listing with folder navigation
 * - File upload flow (pick → chunk → store → broadcast)
 * - Stub download flow (local reassembly or toast)
 * - Context menu actions (download, rename, move, delete)
 * - Detail panel for file inspection
 * - Folder creation with prompt dialog
 * - Community event broadcasting after CRUD operations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, Platform, Alert } from 'react-native';
import { useTheme, Text } from '@coexist/wisp-react-native';
import { useCommunityFiles } from '@/hooks/useCommunityFiles';
import { useCommunitySync } from '@/hooks/useCommunitySync';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { pickFile } from '@/utils/filePicker';
import { getFileTypeIcon, formatFileSize } from '@/utils/fileIcons';
import type { FileFolderNode } from '@/hooks/useCommunityFiles';
import type {
  CommunityFileRecord,
  CommunityFileFolderRecord,
} from '@umbra/service';

// ---------------------------------------------------------------------------
// Types adapted from Wisp for RN (subset of FileChannelView props)
// ---------------------------------------------------------------------------

interface FileEntryView {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount?: number;
  version?: number;
  folderId?: string | null;
}

interface FileFolderView {
  id: string;
  name: string;
  parentId?: string | null;
  children?: FileFolderView[];
  fileCount?: number;
  createdBy?: string;
  createdAt?: string;
}

type FileSortField = 'name' | 'size' | 'date' | 'type';
type FileSortDirection = 'asc' | 'desc';
type FileViewMode = 'grid' | 'list';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FileChannelContentProps {
  /** The community channel ID for file operations. */
  channelId: string;
  /** The community ID (for broadcasting events). */
  communityId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a CommunityFileRecord to a Wisp FileEntry shape. */
function toFileEntry(record: CommunityFileRecord): FileEntryView {
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
function toFolderView(record: CommunityFileFolderRecord): FileFolderView {
  return {
    id: record.id,
    name: record.name,
    parentId: record.parentFolderId ?? null,
    createdBy: record.createdBy,
    createdAt: new Date(record.createdAt).toISOString(),
  };
}

/** Convert the folder tree to Wisp FileFolder shape. */
function toFolderTreeView(nodes: FileFolderNode[]): FileFolderView[] {
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

/** Prompt user for folder name — web uses window.prompt, mobile uses Alert.prompt. */
function promptFolderName(): Promise<string | null> {
  if (Platform.OS === 'web') {
    const name = window.prompt('Enter folder name:');
    return Promise.resolve(name && name.trim() ? name.trim() : null);
  }
  return new Promise((resolve) => {
    Alert.prompt(
      'New Folder',
      'Enter folder name:',
      [
        { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
        { text: 'Create', onPress: (text?: string) => resolve(text && text.trim() ? text.trim() : null) },
      ],
      'plain-text',
      '',
    );
  });
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FileChannelContent({ channelId, communityId }: FileChannelContentProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const { service } = useUmbra();
  const { identity } = useAuth();
  const { syncEvent } = useCommunitySync(communityId);

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
    retry,
  } = useCommunityFiles(channelId);

  // Local UI state
  const [viewMode, setViewMode] = useState<FileViewMode>('grid');
  const [sortBy, setSortBy] = useState<FileSortField>('name');
  const [sortDirection, setSortDirection] = useState<FileSortDirection>('asc');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [detailFileId, setDetailFileId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Transform data for display
  const fileEntries = useMemo(() => files.map(toFileEntry), [files]);
  const subfolderEntries = useMemo(() => folders.map(toFolderView), [folders]);
  const detailFile = useMemo(
    () => (detailFileId ? fileEntries.find((f) => f.id === detailFileId) ?? null : null),
    [detailFileId, fileEntries],
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

  const handleCreateFolder = useCallback(async () => {
    const name = await promptFolderName();
    if (!name) return;
    const folder = await createFolder(name);
    if (folder) {
      syncEvent({ type: 'folderCreated', channelId, folderId: folder.id });
    }
  }, [createFolder, syncEvent, channelId]);

  // ---- Upload handler ----

  const handleUpload = useCallback(async () => {
    if (!service || isUploading) return;
    setUploadError(null);

    try {
      const picked = await pickFile();
      if (!picked) return; // User cancelled

      setIsUploading(true);

      // 1. Generate a file ID and chunk the file
      const fileId = crypto.randomUUID();
      const manifest = await service.chunkFile(
        fileId,
        picked.filename,
        picked.dataBase64,
      );

      // 2. Store the file record via the hook (includes chunk manifest JSON)
      const record = await uploadFile(
        picked.filename,
        picked.size,
        picked.mimeType,
        JSON.stringify(manifest),
      );

      if (record) {
        // 3. Broadcast the upload event to other community members
        syncEvent({
          type: 'fileUploaded',
          channelId,
          fileId: record.id,
          senderDid: identity?.did ?? '',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
      console.error('[FileChannelContent] Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  }, [service, isUploading, uploadFile, syncEvent, channelId, identity?.did]);

  const handleFileClick = useCallback((fileId: string) => {
    setDetailFileId((prev) => (prev === fileId ? null : fileId));
  }, []);

  const handleFileDelete = useCallback(
    async (fileIds: string[]) => {
      for (const id of fileIds) {
        await deleteFile(id);
        syncEvent({ type: 'fileDeleted', channelId, fileId: id });
      }
      setSelectedFileIds(new Set());
      setDetailFileId(null);
    },
    [deleteFile, syncEvent, channelId],
  );

  const handleFolderDelete = useCallback(
    async (folderId: string) => {
      await deleteFolder(folderId);
      syncEvent({ type: 'folderDeleted', channelId, folderId });
      setSelectedFolderIds(new Set());
    },
    [deleteFolder, syncEvent, channelId],
  );

  const handleFileDownload = useCallback(
    async (fileId: string) => {
      if (!service) return;
      await recordDownload(fileId);

      try {
        // Try local reassembly from stored chunks
        const reassembled = await service.reassembleFile(fileId);
        if (reassembled && reassembled.dataB64) {
          if (Platform.OS === 'web') {
            const file = files.find((f) => f.id === fileId);
            triggerWebDownload(
              reassembled.dataB64,
              reassembled.filename,
              file?.mimeType ?? 'application/octet-stream',
            );
          } else {
            // Mobile: would use expo-file-system or share sheet
            console.log('[FileChannelContent] Mobile download not yet implemented');
          }
        }
      } catch {
        // Chunks not available locally — P2P download not yet built
        if (Platform.OS === 'web') {
          window.alert('P2P file download coming soon. File chunks are not available locally.');
        } else {
          Alert.alert('Download unavailable', 'P2P file download coming soon.');
        }
      }
    },
    [service, recordDownload, files],
  );

  const handleSortChange = useCallback((field: FileSortField, direction: FileSortDirection) => {
    setSortBy(field);
    setSortDirection(direction);
  }, []);

  // ---- Render ----

  // For React Native, we render a simplified file channel view
  // since the full Wisp FileChannelView is web-only (uses HTML/CSS).
  // This provides the core file browsing experience on mobile.

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.canvas }}>
      {/* Toolbar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        {/* Breadcrumbs */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
          <Text
            size="sm"
            weight="medium"
            onPress={() => handleBreadcrumbClick(null)}
            style={{
              color: currentFolderId ? colors.accent.primary : colors.text.primary,
            }}
          >
            Files
          </Text>
          {breadcrumbPath.map((crumb) => (
            <React.Fragment key={crumb.id}>
              <Text size="sm" style={{ color: colors.text.muted }}>/</Text>
              <Text
                size="sm"
                weight="medium"
                onPress={() => handleBreadcrumbClick(crumb.id)}
                style={{
                  color:
                    crumb.id === currentFolderId
                      ? colors.text.primary
                      : colors.accent.primary,
                }}
              >
                {crumb.name}
              </Text>
            </React.Fragment>
          ))}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Text
            size="xs"
            weight="medium"
            onPress={isUploading ? undefined : handleUpload}
            style={{
              color: isUploading ? colors.text.muted : colors.accent.primary,
              paddingHorizontal: 8,
              paddingVertical: 4,
              opacity: isUploading ? 0.6 : 1,
            }}
          >
            {isUploading ? 'Uploading...' : '+ Upload'}
          </Text>
          <Text
            size="xs"
            weight="medium"
            onPress={handleCreateFolder}
            style={{
              color: colors.accent.primary,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            + Folder
          </Text>
          <Text
            size="xs"
            weight="medium"
            onPress={refresh}
            style={{
              color: colors.text.muted,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            Refresh
          </Text>
        </View>
      </View>

      {/* Upload error banner */}
      {uploadError && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.status.danger + '1A',
          }}
        >
          <Text size="xs" style={{ color: colors.status.danger, flex: 1 }}>
            Upload failed: {uploadError}
          </Text>
          <Text
            size="xs"
            weight="medium"
            onPress={() => setUploadError(null)}
            style={{ color: colors.status.danger, marginLeft: 8 }}
          >
            Dismiss
          </Text>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text size="sm" style={{ color: colors.text.muted }}>Loading files...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text size="sm" style={{ color: colors.status.danger, marginBottom: 12 }}>
            Failed to load files: {error.message}
          </Text>
          <Text
            size="sm"
            weight="medium"
            onPress={retry}
            style={{ color: colors.accent.primary }}
          >
            Retry
          </Text>
        </View>
      ) : subfolderEntries.length === 0 && fileEntries.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <Text size="lg" weight="semibold" style={{ color: colors.text.primary, marginBottom: 8 }}>
            No files yet
          </Text>
          <Text size="sm" style={{ color: colors.text.muted, textAlign: 'center', maxWidth: 300 }}>
            Upload files or create folders to get started. Files shared here are available to all community members.
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>
          {/* Folders */}
          {subfolderEntries.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                size="xs"
                weight="semibold"
                style={{ color: colors.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Folders
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {subfolderEntries.map((folder) => (
                  <View
                    key={folder.id}
                    onTouchEnd={() => handleFolderClick(folder.id)}
                    style={{
                      backgroundColor: colors.background.raised,
                      borderRadius: 8,
                      padding: 12,
                      width: 140,
                      borderWidth: selectedFolderIds.has(folder.id) ? 2 : 1,
                      borderColor: selectedFolderIds.has(folder.id)
                        ? colors.accent.primary
                        : colors.border.subtle,
                    }}
                  >
                    <Text size="lg" style={{ marginBottom: 4 }}>
                      {'\uD83D\uDCC1'}
                    </Text>
                    <Text size="sm" weight="medium" numberOfLines={1} style={{ color: colors.text.primary }}>
                      {folder.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Files */}
          {sortedFiles.length > 0 && (
            <View>
              <Text
                size="xs"
                weight="semibold"
                style={{ color: colors.text.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                Files
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {sortedFiles.map((file) => (
                  <View
                    key={file.id}
                    onTouchEnd={() => handleFileClick(file.id)}
                    style={{
                      backgroundColor: colors.background.raised,
                      borderRadius: 8,
                      padding: 12,
                      width: 140,
                      borderWidth: selectedFileIds.has(file.id) ? 2 : 1,
                      borderColor: selectedFileIds.has(file.id)
                        ? colors.accent.primary
                        : colors.border.subtle,
                    }}
                  >
                    <Text size="lg" style={{ marginBottom: 4 }}>
                      {getFileTypeIcon(file.mimeType).icon}
                    </Text>
                    <Text size="sm" weight="medium" numberOfLines={1} style={{ color: colors.text.primary }}>
                      {file.name}
                    </Text>
                    <Text size="xs" style={{ color: colors.text.muted, marginTop: 2 }}>
                      {formatFileSize(file.size)}
                    </Text>
                    {file.downloadCount !== undefined && file.downloadCount > 0 && (
                      <Text size="xs" style={{ color: colors.text.muted, marginTop: 1 }}>
                        {file.downloadCount} download{file.downloadCount !== 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Detail panel (simple bottom sheet style) */}
      {detailFile && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border.subtle,
            backgroundColor: colors.background.surface,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text size="md" weight="semibold" style={{ color: colors.text.primary }}>
              {detailFile.name}
            </Text>
            <Text
              size="xs"
              weight="medium"
              onPress={() => setDetailFileId(null)}
              style={{ color: colors.text.muted }}
            >
              Close
            </Text>
          </View>
          <View style={{ gap: 4 }}>
            <Text size="xs" style={{ color: colors.text.muted }}>
              Size: {formatFileSize(detailFile.size)}
            </Text>
            <Text size="xs" style={{ color: colors.text.muted }}>
              Type: {detailFile.mimeType}
            </Text>
            <Text size="xs" style={{ color: colors.text.muted }}>
              Uploaded: {new Date(detailFile.uploadedAt).toLocaleDateString()}
            </Text>
            {detailFile.downloadCount !== undefined && (
              <Text size="xs" style={{ color: colors.text.muted }}>
                Downloads: {detailFile.downloadCount}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <Text
              size="sm"
              weight="medium"
              onPress={() => handleFileDownload(detailFile.id)}
              style={{ color: colors.accent.primary }}
            >
              Download
            </Text>
            <Text
              size="sm"
              weight="medium"
              onPress={() => handleFileDelete([detailFile.id])}
              style={{ color: colors.status.danger }}
            >
              Delete
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
