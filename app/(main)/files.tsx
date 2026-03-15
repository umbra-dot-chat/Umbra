/**
 * Files Page — Top-level Files hub accessible from the navigation rail.
 *
 * Sections:
 * - Active Transfers: current uploads/downloads across all contexts
 * - Shared Folders: grid of shared folder cards from DM conversations
 * - Community Files: quick links to community file channels
 * - Storage: usage meter with cleanup actions
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Text, Button, AnimatedCounter, useTheme, Box, ScrollArea } from '@coexist/wisp-react-native';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { useSharedFolders } from '@/hooks/useSharedFolders';
import { useStorageManager } from '@/hooks/useStorageManager';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { useCommunities } from '@/hooks/useCommunities';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  FolderIcon,
  FileTextIcon,
  DownloadIcon,
  PlusIcon,
  LockIcon,
} from '@/components/ui';
import { pickFile, pickFileHandle } from '@/utils/filePicker';
import { MobileBackButton } from '@/components/ui/MobileBackButton';
import { dbg } from '@/utils/debug';

const SRC = 'FilesPage';

// ---------------------------------------------------------------------------
// Section: Active Transfers Bar
// ---------------------------------------------------------------------------

function ActiveTransfersSection() {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const {
    activeTransfers,
    totalUploadSpeed,
    totalDownloadSpeed,
    hasActiveTransfers,
    pauseTransfer,
    resumeTransfer,
    cancelTransfer,
  } = useFileTransfer();

  const { formatBytes } = useStorageManager();

  if (!hasActiveTransfers) return null;

  return (
    <Box style={{ marginBottom: 24 }}>
      <Text
        size="sm"
        weight="semibold"
        style={{
          color: theme.colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        {t('activeTransfers', { count: activeTransfers.length })}
      </Text>

      <Box
        style={{
          borderRadius: 12,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          overflow: 'hidden',
        }}
      >
        {activeTransfers.map((transfer, index) => {
          const progress =
            transfer.totalBytes > 0
              ? Math.round((transfer.bytesTransferred / transfer.totalBytes) * 100)
              : transfer.totalChunks > 0
                ? Math.round((transfer.chunksCompleted / transfer.totalChunks) * 100)
                : 0;

          return (
            <Box
              key={transfer.transferId}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                gap: 12,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: theme.colors.border.subtle,
              }}
            >
              {/* Direction icon */}
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: transfer.direction === 'upload'
                    ? theme.colors.accent.primary + '20'
                    : theme.colors.status.success + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DownloadIcon
                  size={16}
                  color={transfer.direction === 'upload'
                    ? theme.colors.accent.primary
                    : theme.colors.status.success}
                />
              </Box>

              {/* Info */}
              <Box style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                  {transfer.filename}
                </Text>
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text size="xs" style={{ color: theme.colors.text.muted }}>
                      {progress}% &middot;{' '}
                    </Text>
                    <AnimatedCounter
                      value={transfer.speedBps}
                      duration={400}
                      formatValue={(v) => `${formatBytes(Math.round(v))}/s`}
                      style={{ fontSize: 11, color: theme.colors.text.muted }}
                    />
                  </Box>
                  <Box
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 4,
                      backgroundColor: theme.colors.background.sunken,
                    }}
                  >
                    <Text size="xs" style={{ color: theme.colors.text.muted }}>
                      {transfer.transportType === 'webrtc' ? t('direct') : transfer.transportType === 'relay' ? t('relay') : t('p2p')}
                    </Text>
                  </Box>
                </Box>

                {/* Progress bar */}
                <Box
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: theme.colors.border.subtle,
                    marginTop: 6,
                  }}
                >
                  <Box
                    style={{
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: theme.colors.accent.primary,
                      width: `${progress}%`,
                    }}
                  />
                </Box>
              </Box>

              {/* Controls */}
              <Box style={{ flexDirection: 'row', gap: 4 }}>
                {transfer.state === 'transferring' && (
                  <Button
                    variant="tertiary"
                    size="xs"
                    onPress={() => pauseTransfer(transfer.transferId)}
                  >
                    {t('pause')}
                  </Button>
                )}
                {transfer.state === 'paused' && (
                  <Button
                    variant="tertiary"
                    size="xs"
                    onPress={() => resumeTransfer(transfer.transferId)}
                  >
                    {t('resume')}
                  </Button>
                )}
                <Button
                  variant="tertiary"
                  size="xs"
                  onPress={() => cancelTransfer(transfer.transferId)}
                >
                  {t('cancel')}
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Speed summary — odometer-style animated counter */}
      <Box style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        {totalUploadSpeed > 0 && (
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text size="xs" style={{ color: theme.colors.text.muted }}>{t('upload')}:</Text>
            <AnimatedCounter
              value={totalUploadSpeed}
              duration={400}
              formatValue={(v) => `${formatBytes(Math.round(v))}/s`}
              style={{ fontSize: 11, color: theme.colors.text.muted }}
            />
          </Box>
        )}
        {totalDownloadSpeed > 0 && (
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text size="xs" style={{ color: theme.colors.text.muted }}>{t('download')}:</Text>
            <AnimatedCounter
              value={totalDownloadSpeed}
              duration={400}
              formatValue={(v) => `${formatBytes(Math.round(v))}/s`}
              style={{ fontSize: 11, color: theme.colors.text.muted }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Section: Shared Folders Grid
// ---------------------------------------------------------------------------

function SharedFoldersSection({
  openFolderId,
  onOpenFolder,
  onCloseFolder,
}: {
  openFolderId: string | null;
  onOpenFolder: (folderId: string) => void;
  onCloseFolder: () => void;
}) {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const { sharedFolders, isLoading, syncFolder } = useSharedFolders();

  // If a folder is open, show the detail view
  const openFolder = openFolderId
    ? sharedFolders.find((sf) => sf.folder.id === openFolderId)
    : null;

  if (openFolder) {
    return (
      <FolderDetailView
        folder={openFolder}
        onBack={onCloseFolder}
        onSync={() => syncFolder(openFolder.folder.id)}
      />
    );
  }

  return (
    <Box style={{ marginBottom: 24 }}>
      <Box style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text
          size="sm"
          weight="semibold"
          style={{
            color: theme.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {t('sharedFolders')}
        </Text>
      </Box>

      {isLoading ? (
        <Text size="sm" style={{ color: theme.colors.text.muted }}>
          {t('loadingSharedFolders')}
        </Text>
      ) : sharedFolders.length === 0 ? (
        <Box
          style={{
            borderRadius: 12,
            backgroundColor: theme.colors.background.surface,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <FolderIcon size={32} color={theme.colors.text.muted} />
          <Text size="sm" style={{ color: theme.colors.text.muted, marginTop: 8 }}>
            {t('noSharedFoldersYet')}
          </Text>
          <Text size="xs" style={{ color: theme.colors.text.muted, marginTop: 4, textAlign: 'center' }}>
            {t('noSharedFoldersDesc')}
          </Text>
        </Box>
      ) : (
        <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {sharedFolders.map((sf) => (
            <SharedFolderCard
              key={sf.folder.id}
              folder={sf}
              onPress={() => onOpenFolder(sf.folder.id)}
              onSync={() => syncFolder(sf.folder.id)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function SharedFolderCard({
  folder,
  onPress,
  onSync,
}: {
  folder: ReturnType<typeof useSharedFolders>['sharedFolders'][0];
  onPress: () => void;
  onSync: () => void;
}) {
  const { theme } = useTheme();

  const syncColor = useMemo(() => {
    switch (folder.syncStatus) {
      case 'synced': return theme.colors.status.success;
      case 'syncing': return theme.colors.accent.primary;
      case 'error': return theme.colors.status.danger;
      case 'offline': return theme.colors.text.muted;
      default: return theme.colors.text.muted;
    }
  }, [folder.syncStatus, theme]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        width: 180,
        borderRadius: 12,
        backgroundColor: pressed
          ? theme.colors.background.sunken
          : theme.colors.background.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        padding: 16,
      })}
    >
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <FolderIcon size={20} color={syncColor} />
        <Box
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: syncColor,
          }}
        />
      </Box>

      <Text size="sm" weight="medium" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
        {folder.folder.name}
      </Text>

      <Text size="xs" style={{ color: theme.colors.text.muted, marginTop: 4 }}>
        {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
      </Text>

      {folder.syncStatus === 'syncing' && (
        <Box
          style={{
            height: 3,
            borderRadius: 2,
            backgroundColor: theme.colors.border.subtle,
            marginTop: 8,
          }}
        >
          <Box
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: theme.colors.accent.primary,
              width: `${folder.syncProgress}%`,
            }}
          />
        </Box>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Folder Detail View — shows files inside a shared folder
// ---------------------------------------------------------------------------

function FolderDetailView({
  folder,
  onBack,
  onSync,
}: {
  folder: ReturnType<typeof useSharedFolders>['sharedFolders'][0];
  onBack: () => void;
  onSync: () => void;
}) {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const { service } = useUmbra();
  const { identity } = useAuth();
  const myDid = identity?.did ?? '';
  const { formatBytes } = useStorageManager();
  const [files, setFiles] = useState<any[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dropZoneRef = useRef<View>(null);

  // Load files for this folder
  const refreshFiles = useCallback(async () => {
    if (!service) return;
    try {
      const result = await service.getDmFiles(folder.conversationId, folder.folder.id, 1000, 0);
      setFiles(result);
    } catch (err) {
      dbg.error('service', 'Failed to load files', { error: (err as Error)?.message ?? String(err) }, SRC);
    }
  }, [service, folder.conversationId, folder.folder.id]);

  useEffect(() => {
    if (!service) return;
    let cancelled = false;
    (async () => {
      setLoadingFiles(true);
      await refreshFiles();
      if (!cancelled) setLoadingFiles(false);
    })();
    return () => { cancelled = true; };
  }, [service, refreshFiles]);

  // Subscribe to DM file events so uploads from DmSharedFilesPanel (or relay) stay in sync
  useEffect(() => {
    if (!service) return;
    const unsubscribe = service.onDmFileEvent((event) => {
      if (event.conversationId !== folder.conversationId) return;
      const evt = event.event;
      if (evt.type === 'fileUploaded') {
        // Only add if the file belongs to this folder
        if (evt.file.folderId === folder.folder.id) {
          setFiles((prev) => {
            if (prev.some((f) => f.id === evt.file.id)) return prev;
            return [evt.file, ...prev];
          });
        }
      } else if (evt.type === 'fileDeleted') {
        setFiles((prev) => prev.filter((f) => f.id !== evt.fileId));
      } else if (evt.type === 'fileMoved') {
        refreshFiles();
      }
    });
    return unsubscribe;
  }, [service, folder.conversationId, folder.folder.id, refreshFiles]);

  // Shared upload logic — processes native File objects (from picker or drag-and-drop)
  // Dispatches a local DmFileEvent so useDmFiles (DmSharedFilesPanel) stays in sync.
  const processFileUpload = useCallback(async (nativeFile: File) => {
    if (!service || !myDid) return;
    try {
      const buffer = await nativeFile.arrayBuffer();
      const fileId = crypto.randomUUID();
      const manifest = await service.chunkFileBytes(fileId, nativeFile.name, new Uint8Array(buffer));
      const record = await service.uploadDmFile(
        folder.conversationId,
        folder.folder.id,
        nativeFile.name,
        '',
        nativeFile.size,
        nativeFile.type || 'application/octet-stream',
        JSON.stringify(manifest),
        myDid,
      );
      // Dispatch local event so other consumers (e.g. DmSharedFilesPanel) stay in sync
      service.dispatchDmFileEvent({
        conversationId: folder.conversationId,
        senderDid: myDid,
        timestamp: Date.now(),
        event: { type: 'fileUploaded', file: record },
      });
    } catch (err) {
      dbg.error('service', 'Upload failed', { error: (err as Error)?.message ?? String(err) }, SRC);
      throw err;
    }
  }, [service, myDid, folder.conversationId, folder.folder.id]);

  // Upload button handler — uses file picker
  const handleUploadClick = useCallback(async () => {
    if (!service || isUploading) return;
    const picked = await pickFile();
    if (!picked) return;

    setIsUploading(true);
    try {
      // Convert PickedFile to a native File for the shared upload logic
      const binaryStr = atob(picked.dataBase64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const nativeFile = new File([bytes], picked.filename, { type: picked.mimeType });
      await processFileUpload(nativeFile);
      await refreshFiles();
      setToastMessage(`Uploaded ${picked.filename}`);
    } catch {
      setToastMessage('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [service, isUploading, processFileUpload, refreshFiles]);

  // Drag-and-drop (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = dropZoneRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = e.dataTransfer?.files;
      if (!droppedFiles || droppedFiles.length === 0) return;

      setIsUploading(true);
      let uploadCount = 0;
      try {
        for (let i = 0; i < droppedFiles.length; i++) {
          await processFileUpload(droppedFiles[i]);
          uploadCount++;
        }
        await refreshFiles();
        setToastMessage(`Uploaded ${uploadCount} file${uploadCount !== 1 ? 's' : ''}`);
      } catch {
        setToastMessage(`Uploaded ${uploadCount} file${uploadCount !== 1 ? 's' : ''}, some failed.`);
        await refreshFiles();
      } finally {
        setIsUploading(false);
      }
    };

    node.addEventListener('dragover', handleDragOver);
    node.addEventListener('dragleave', handleDragLeave);
    node.addEventListener('drop', handleDrop);
    return () => {
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('dragleave', handleDragLeave);
      node.removeEventListener('drop', handleDrop);
    };
  }, [processFileUpload, refreshFiles]);

  // Stub download handler
  const handleDownload = useCallback(async (fileId: string, filename: string) => {
    if (!service) return;
    try {
      const result = await service.reassembleFile(fileId);
      if (result && typeof window !== 'undefined') {
        const binaryStr = atob(result.dataB64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setToastMessage('File not available locally. P2P download coming soon.');
    }
  }, [service]);

  const syncStatusLabel = folder.syncStatus === 'synced' ? 'Synced'
    : folder.syncStatus === 'syncing' ? 'Syncing...'
    : folder.syncStatus === 'error' ? 'Sync Error'
    : folder.syncStatus === 'offline' ? 'Offline'
    : 'Unknown';

  return (
    <Box ref={dropZoneRef} style={{ marginBottom: 24 }}>
      {/* Header with back button + upload button */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Button variant="tertiary" size="sm" onPress={onBack}>
          {t('back')}
        </Button>
        <FolderIcon size={20} color={theme.colors.text.primary} />
        <Text size="md" weight="bold" style={{ color: theme.colors.text.primary, flex: 1 }}>
          {folder.folder.name}
        </Text>
        <Box
          style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 6,
            backgroundColor: folder.syncStatus === 'synced' ? theme.colors.status.success + '20' : theme.colors.background.sunken,
          }}
        >
          <Text size="xs" style={{ color: folder.syncStatus === 'synced' ? theme.colors.status.success : theme.colors.text.muted }}>
            {syncStatusLabel}
          </Text>
        </Box>
        <Button
          variant="secondary"
          size="xs"
          onPress={handleUploadClick}
          disabled={isUploading}
          iconLeft={<PlusIcon size={14} />}
        >
          {isUploading ? t('uploading') : t('upload')}
        </Button>
        <Button variant="secondary" size="xs" onPress={onSync}>
          {t('syncNow')}
        </Button>
      </Box>

      {/* Drag-and-drop overlay — aurora gradient */}
      {isDragOver && (
        <Box
          style={{
            borderRadius: 12,
            borderWidth: 2,
            borderColor: 'transparent',
            padding: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            overflow: 'hidden',
            position: 'relative',
            ...(Platform.OS === 'web' ? {
              background: `linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08), rgba(59,130,246,0.12))`,
              border: '2px dashed',
              borderImage: 'linear-gradient(135deg, #8B5CF6, #EC4899, #3B82F6) 1',
              animation: 'wisp-aurora-drift 3s ease-in-out infinite alternate',
            } as any : {
              backgroundColor: theme.colors.accent.primary + '10',
              borderColor: theme.colors.accent.primary,
              borderStyle: 'dashed',
            }),
          }}
        >
          <PlusIcon size={32} color={theme.colors.accent.primary} />
          <Text size="sm" weight="medium" style={{ color: theme.colors.accent.primary, marginTop: 8 }}>
            {t('dropFilesToUpload')}
          </Text>
        </Box>
      )}

      {/* File list */}
      {loadingFiles ? (
        <Text size="sm" style={{ color: theme.colors.text.muted }}>{t('loadingFiles')}</Text>
      ) : files.length === 0 && !isDragOver ? (
        <Box
          style={{
            borderRadius: 12,
            backgroundColor: theme.colors.background.surface,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            padding: 24,
            alignItems: 'center',
          }}
        >
          <FileTextIcon size={32} color={theme.colors.text.muted} />
          <Text size="sm" style={{ color: theme.colors.text.muted, marginTop: 8 }}>
            {t('noFilesInFolder')}
          </Text>
          <Text size="xs" style={{ color: theme.colors.text.muted, marginTop: 4, textAlign: 'center' }}>
            {t('noFilesDesc')}
          </Text>
        </Box>
      ) : files.length > 0 ? (
        <Box
          style={{
            borderRadius: 12,
            backgroundColor: theme.colors.background.surface,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            overflow: 'hidden',
          }}
        >
          {files.map((file, index) => (
            <Pressable
              key={file.id}
              onPress={() => handleDownload(file.id, file.filename)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                gap: 12,
                borderTopWidth: index > 0 ? 1 : 0,
                borderTopColor: theme.colors.border.subtle,
                backgroundColor: pressed ? theme.colors.background.sunken : 'transparent',
              })}
            >
              <FileTextIcon size={20} color={theme.colors.text.secondary} />
              <Box style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                  {file.filename}
                </Text>
                <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text size="xs" style={{ color: theme.colors.text.muted }}>
                    {formatBytes(file.fileSize)} &middot; v{file.version}
                  </Text>
                  {file.isEncrypted && (
                    <LockIcon size={10} color={theme.colors.accent.primary} />
                  )}
                </Box>
              </Box>
              <DownloadIcon size={16} color={theme.colors.text.muted} />
            </Pressable>
          ))}
        </Box>
      ) : null}

      {/* Toast notification */}
      {toastMessage && (
        <Box
          style={{
            position: 'absolute' as any,
            bottom: 24,
            left: '50%' as any,
            transform: [{ translateX: -200 }] as any,
            backgroundColor: theme.colors.background.raised,
            padding: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.colors.border.subtle,
            maxWidth: 400,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            zIndex: 10000,
          }}
        >
          <Text size="sm" style={{ color: theme.colors.text.secondary, flex: 1 }}>{toastMessage}</Text>
          <Text size="sm" onPress={() => setToastMessage(null)} style={{ color: theme.colors.text.muted, padding: 4 }}>✕</Text>
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Section: Community Files Quick Access
// ---------------------------------------------------------------------------

function CommunityFilesSection() {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const { communities } = useCommunities();
  const router = useRouter();

  if (communities.length === 0) return null;

  return (
    <Box style={{ marginBottom: 24 }}>
      <Text
        size="sm"
        weight="semibold"
        style={{
          color: theme.colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        {t('communityFiles')}
      </Text>

      <Box style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {communities.map((community) => (
          <Pressable
            key={community.id}
            onPress={() => router.push(`/community/${community.id}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: pressed
                ? theme.colors.background.sunken
                : theme.colors.background.surface,
              borderWidth: 1,
              borderColor: theme.colors.border.subtle,
            })}
          >
            <Box
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                backgroundColor: community.accentColor ?? theme.colors.accent.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size="xs" weight="bold" style={{ color: theme.colors.text.inverse }}>
                {community.name.charAt(0).toUpperCase()}
              </Text>
            </Box>
            <Text size="sm" style={{ color: theme.colors.text.primary }}>
              {community.name}
            </Text>
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Section: Storage Usage
// ---------------------------------------------------------------------------

// Inject CSS keyframes for the storage bar gradient animation (web only, once)
let storageBarKeyframesInjected = false;
function injectStorageBarKeyframes(): void {
  if (storageBarKeyframesInjected || Platform.OS !== 'web' || typeof document === 'undefined') return;
  storageBarKeyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = '@keyframes umbra-storage-bar-gradient{0%{background-position:0% 50%}100%{background-position:200% 50%}}';
  document.head.appendChild(style);
}

function StorageSection() {
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const {
    storageUsage,
    isLoading,
    smartCleanup,
    cleanupSuggestions,
    isCleaningUp,
    lastCleanupResult,
    autoCleanupRules,
    setAutoCleanupRules,
    formatBytes,
  } = useStorageManager();
  const [showRules, setShowRules] = useState(false);

  // Inject CSS keyframes for animated gradient progress bar (web only)
  useEffect(() => {
    injectStorageBarKeyframes();
  }, []);

  if (isLoading) {
    return (
      <Box style={{ marginBottom: 24 }}>
        <Text size="sm" style={{ color: theme.colors.text.muted }}>
          Loading storage info...
        </Text>
      </Box>
    );
  }

  if (!storageUsage) return null;

  // Default limit: 2GB (matches DEFAULT_RULES.maxTotalBytes in storage-manager.ts)
  const limitBytes = 2 * 1024 * 1024 * 1024;
  const usagePercent = limitBytes > 0
    ? Math.round((storageUsage.total / limitBytes) * 100)
    : 0;

  return (
    <Box style={{ marginBottom: 24 }}>
      <Text
        size="sm"
        weight="semibold"
        style={{
          color: theme.colors.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 12,
        }}
      >
        {t('storage')}
      </Text>

      <Box
        style={{
          borderRadius: 12,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: 16,
        }}
      >
        {/* Usage bar */}
        <Box style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text size="sm" weight="medium" style={{ color: theme.colors.text.primary }}>
            {formatBytes(storageUsage.total)} {t('used')}
          </Text>
          <Text size="sm" style={{ color: theme.colors.text.muted }}>
            {formatBytes(limitBytes)} {t('total')}
          </Text>
        </Box>

        <Box
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.border.subtle,
            marginBottom: 12,
            overflow: 'hidden',
          }}
        >
          <Box
            style={{
              height: 8,
              borderRadius: 4,
              width: `${Math.min(usagePercent, 100)}%`,
              ...(usagePercent > 90
                ? { backgroundColor: theme.colors.status.danger }
                : usagePercent > 70
                  ? { backgroundColor: theme.colors.status.warning }
                  : Platform.OS === 'web'
                    ? {
                        backgroundImage: 'linear-gradient(90deg, #8B5CF6, #EC4899, #3B82F6, #8B5CF6)',
                        backgroundSize: '200% 100%',
                        animationName: 'umbra-storage-bar-gradient',
                        animationDuration: '3000ms',
                        animationTimingFunction: 'linear',
                        animationIterationCount: 'infinite',
                      } as any
                    : { backgroundColor: theme.colors.accent.primary }),
            }}
          />
        </Box>

        {/* Breakdown */}
        {storageUsage.byContext && (
          <Box style={{ gap: 4, marginBottom: 12 }}>
            {Object.entries(storageUsage.byContext).map(([context, bytes]) => (
              <Box key={context} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text size="xs" style={{ color: theme.colors.text.muted }}>
                  {context}
                </Text>
                <Text size="xs" style={{ color: theme.colors.text.muted }}>
                  {formatBytes(bytes as number)}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Cleanup suggestions */}
        {cleanupSuggestions.length > 0 && (
          <Box style={{ marginBottom: 12 }}>
            <Text size="xs" weight="medium" style={{ color: theme.colors.text.secondary, marginBottom: 4 }}>
              {t('suggestions')}
            </Text>
            {cleanupSuggestions.slice(0, 3).map((s, i) => (
              <Text key={i} size="xs" style={{ color: theme.colors.text.muted, marginTop: 2 }}>
                &bull; {s.description} ({formatBytes(s.bytesReclaimable)})
              </Text>
            ))}
          </Box>
        )}

        {/* Cleanup button */}
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onPress={smartCleanup}
          disabled={isCleaningUp}
        >
          {isCleaningUp ? t('cleaningUp') : t('smartCleanup')}
        </Button>

        {lastCleanupResult && (
          <Text size="xs" style={{ color: theme.colors.text.muted, marginTop: 8, textAlign: 'center' }}>
            {t('lastCleanupFreed', { size: formatBytes(lastCleanupResult.bytesFreed) })}
          </Text>
        )}

        {/* Auto-cleanup rules toggle */}
        <Button
          variant="tertiary"
          size="xs"
          onPress={() => setShowRules((prev) => !prev)}
          style={{ marginTop: 12, alignSelf: 'flex-start' }}
        >
          {showRules ? t('hide') : t('show')} {t('autoCleanupRules')}
        </Button>

        {showRules && (
          <Box style={{ marginTop: 8, gap: 8 }}>
            <AutoCleanupRuleRow
              label={t('maxStorage')}
              value={autoCleanupRules.maxTotalBytes
                ? formatBytes(autoCleanupRules.maxTotalBytes)
                : t('unlimited')}
              options={[
                { label: '1 GB', value: 1 * 1024 * 1024 * 1024 },
                { label: '2 GB', value: 2 * 1024 * 1024 * 1024 },
                { label: '5 GB', value: 5 * 1024 * 1024 * 1024 },
                { label: '10 GB', value: 10 * 1024 * 1024 * 1024 },
              ]}
              onSelect={(v) => setAutoCleanupRules({ maxTotalBytes: v })}
            />
            <AutoCleanupRuleRow
              label={t('deleteOldTransfers')}
              value={autoCleanupRules.maxTransferAge
                ? `${Math.round(autoCleanupRules.maxTransferAge / 86400)} days`
                : t('never')}
              options={[
                { label: '1 day', value: 86400 },
                { label: '7 days', value: 604800 },
                { label: '30 days', value: 2592000 },
              ]}
              onSelect={(v) => setAutoCleanupRules({ maxTransferAge: v })}
            />
            <AutoCleanupRuleRow
              label={t('clearCacheAfter')}
              value={autoCleanupRules.maxCacheAge
                ? `${Math.round(autoCleanupRules.maxCacheAge / 3600)} hours`
                : t('never')}
              options={[
                { label: '1 hour', value: 3600 },
                { label: '24 hours', value: 86400 },
                { label: '7 days', value: 604800 },
              ]}
              onSelect={(v) => setAutoCleanupRules({ maxCacheAge: v })}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Auto-Cleanup Rule Row
// ---------------------------------------------------------------------------

function AutoCleanupRuleRow({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: string;
  options: { label: string; value: number }[];
  onSelect: (value: number) => void;
}) {
  const { theme } = useTheme();

  return (
    <Box>
      <Box style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text size="xs" style={{ color: theme.colors.text.secondary }}>
          {label}
        </Text>
        <Text size="xs" weight="medium" style={{ color: theme.colors.text.primary }}>
          {value}
        </Text>
      </Box>
      <Box style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={({ pressed }) => ({
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 4,
              backgroundColor: pressed
                ? theme.colors.accent.primary + '30'
                : theme.colors.background.sunken,
            })}
          >
            <Text size="xs" style={{ color: theme.colors.text.muted }}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main Files Page
// ---------------------------------------------------------------------------

export default function FilesPage() {
  if (__DEV__) dbg.trackRender('FilesPage');
  const { t } = useTranslation('common');
  const { theme } = useTheme();
  const router = useRouter();
  const { hasActiveUploads, uploadRingProgress } = useUploadProgress();
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);

  return (
    <Box style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      {/* Header */}
      <Box
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.subtle,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MobileBackButton onPress={() => router.back()} label={t('sidebar:backToConversations')} />
          <FolderIcon size={24} color={theme.colors.text.primary} />
          <Text size="lg" weight="bold" style={{ color: theme.colors.text.primary }}>
            {t('files')}
          </Text>
          {hasActiveUploads && (
            <Box
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                backgroundColor: theme.colors.accent.primary + '20',
              }}
            >
              <Text size="xs" weight="medium" style={{ color: theme.colors.accent.primary }}>
                {uploadRingProgress}%
              </Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Content */}
      <ScrollArea
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ActiveTransfersSection />
        <SharedFoldersSection
          openFolderId={openFolderId}
          onOpenFolder={setOpenFolderId}
          onCloseFolder={() => setOpenFolderId(null)}
        />
        {!openFolderId && <CommunityFilesSection />}
        {!openFolderId && <StorageSection />}
      </ScrollArea>
    </Box>
  );
}
