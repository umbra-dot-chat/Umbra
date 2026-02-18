/**
 * Files Page — Top-level Files hub accessible from the navigation rail.
 *
 * Sections:
 * - Active Transfers: current uploads/downloads across all contexts
 * - Shared Folders: grid of shared folder cards from DM conversations
 * - Community Files: quick links to community file channels
 * - Storage: usage meter with cleanup actions
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text, Button, useTheme } from '@coexist/wisp-react-native';
import { useFileTransfer } from '@/hooks/useFileTransfer';
import { useSharedFolders } from '@/hooks/useSharedFolders';
import { useStorageManager } from '@/hooks/useStorageManager';
import { useUploadProgress } from '@/hooks/useUploadProgress';
import { useCommunities } from '@/hooks/useCommunities';
import { useConversations } from '@/hooks/useConversations';
import { useFriends } from '@/hooks/useFriends';
import { useUmbra } from '@/contexts/UmbraContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import {
  FolderIcon,
  FileTextIcon,
  DownloadIcon,
  PlusIcon,
} from '@/components/icons';

// ---------------------------------------------------------------------------
// Section: Active Transfers Bar
// ---------------------------------------------------------------------------

function ActiveTransfersSection() {
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
    <View style={{ marginBottom: 24 }}>
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
        Active Transfers ({activeTransfers.length})
      </Text>

      <View
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
            <View
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
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: transfer.direction === 'upload'
                    ? theme.colors.accent.primary + '20'
                    : '#10b98120',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DownloadIcon
                  size={16}
                  color={transfer.direction === 'upload'
                    ? theme.colors.accent.primary
                    : '#10b981'}
                />
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text size="sm" weight="medium" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
                  {transfer.filename}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Text size="xs" style={{ color: theme.colors.text.muted }}>
                    {progress}% &middot; {formatBytes(transfer.speedBps)}/s
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 4,
                      backgroundColor: theme.colors.background.sunken,
                    }}
                  >
                    <Text size="xs" style={{ color: theme.colors.text.muted }}>
                      {transfer.transportType === 'webrtc' ? 'Direct' : transfer.transportType === 'relay' ? 'Relay' : 'P2P'}
                    </Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: theme.colors.border.subtle,
                    marginTop: 6,
                  }}
                >
                  <View
                    style={{
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: theme.colors.accent.primary,
                      width: `${progress}%`,
                    }}
                  />
                </View>
              </View>

              {/* Controls */}
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {transfer.state === 'transferring' && (
                  <Button
                    variant="tertiary"
                    size="xs"
                    onPress={() => pauseTransfer(transfer.transferId)}
                  >
                    Pause
                  </Button>
                )}
                {transfer.state === 'paused' && (
                  <Button
                    variant="tertiary"
                    size="xs"
                    onPress={() => resumeTransfer(transfer.transferId)}
                  >
                    Resume
                  </Button>
                )}
                <Button
                  variant="tertiary"
                  size="xs"
                  onPress={() => cancelTransfer(transfer.transferId)}
                >
                  Cancel
                </Button>
              </View>
            </View>
          );
        })}
      </View>

      {/* Speed summary */}
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        {totalUploadSpeed > 0 && (
          <Text size="xs" style={{ color: theme.colors.text.muted }}>
            Upload: {formatBytes(totalUploadSpeed)}/s
          </Text>
        )}
        {totalDownloadSpeed > 0 && (
          <Text size="xs" style={{ color: theme.colors.text.muted }}>
            Download: {formatBytes(totalDownloadSpeed)}/s
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section: Shared Folders Grid
// ---------------------------------------------------------------------------

function SharedFoldersSection() {
  const { theme } = useTheme();
  const { sharedFolders, isLoading, syncFolder } = useSharedFolders();

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text
          size="sm"
          weight="semibold"
          style={{
            color: theme.colors.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Shared Folders
        </Text>
      </View>

      {isLoading ? (
        <Text size="sm" style={{ color: theme.colors.text.muted }}>
          Loading shared folders...
        </Text>
      ) : sharedFolders.length === 0 ? (
        <View
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
            No shared folders yet
          </Text>
          <Text size="xs" style={{ color: theme.colors.text.muted, marginTop: 4, textAlign: 'center' }}>
            Create a shared folder from a DM conversation to start sharing files with friends.
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {sharedFolders.map((sf) => (
            <SharedFolderCard
              key={sf.folder.id}
              folder={sf}
              onSync={() => syncFolder(sf.folder.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function SharedFolderCard({
  folder,
  onSync,
}: {
  folder: ReturnType<typeof useSharedFolders>['sharedFolders'][0];
  onSync: () => void;
}) {
  const { theme } = useTheme();

  const syncColor = useMemo(() => {
    switch (folder.syncStatus) {
      case 'synced': return '#10b981';
      case 'syncing': return theme.colors.accent.primary;
      case 'error': return '#ef4444';
      case 'offline': return theme.colors.text.muted;
      default: return theme.colors.text.muted;
    }
  }, [folder.syncStatus, theme]);

  return (
    <Pressable
      onPress={onSync}
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <FolderIcon size={20} color={syncColor} />
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: syncColor,
          }}
        />
      </View>

      <Text size="sm" weight="medium" style={{ color: theme.colors.text.primary }} numberOfLines={1}>
        {folder.folder.name}
      </Text>

      <Text size="xs" style={{ color: theme.colors.text.muted, marginTop: 4 }}>
        {folder.fileCount} file{folder.fileCount !== 1 ? 's' : ''}
      </Text>

      {folder.syncStatus === 'syncing' && (
        <View
          style={{
            height: 3,
            borderRadius: 2,
            backgroundColor: theme.colors.border.subtle,
            marginTop: 8,
          }}
        >
          <View
            style={{
              height: 3,
              borderRadius: 2,
              backgroundColor: theme.colors.accent.primary,
              width: `${folder.syncProgress}%`,
            }}
          />
        </View>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Section: Community Files Quick Access
// ---------------------------------------------------------------------------

function CommunityFilesSection() {
  const { theme } = useTheme();
  const { communities } = useCommunities();
  const router = useRouter();

  if (communities.length === 0) return null;

  return (
    <View style={{ marginBottom: 24 }}>
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
        Community Files
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                backgroundColor: community.accentColor ?? theme.colors.accent.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size="xs" weight="bold" style={{ color: '#fff' }}>
                {community.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text size="sm" style={{ color: theme.colors.text.primary }}>
              {community.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Section: Storage Usage
// ---------------------------------------------------------------------------

function StorageSection() {
  const { theme } = useTheme();
  const {
    storageUsage,
    isLoading,
    smartCleanup,
    cleanupSuggestions,
    isCleaningUp,
    lastCleanupResult,
    formatBytes,
  } = useStorageManager();

  if (isLoading) {
    return (
      <View style={{ marginBottom: 24 }}>
        <Text size="sm" style={{ color: theme.colors.text.muted }}>
          Loading storage info...
        </Text>
      </View>
    );
  }

  if (!storageUsage) return null;

  // Default limit: 2GB (matches DEFAULT_RULES.maxTotalBytes in storage-manager.ts)
  const limitBytes = 2 * 1024 * 1024 * 1024;
  const usagePercent = limitBytes > 0
    ? Math.round((storageUsage.total / limitBytes) * 100)
    : 0;

  return (
    <View style={{ marginBottom: 24 }}>
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
        Storage
      </Text>

      <View
        style={{
          borderRadius: 12,
          backgroundColor: theme.colors.background.surface,
          borderWidth: 1,
          borderColor: theme.colors.border.subtle,
          padding: 16,
        }}
      >
        {/* Usage bar */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text size="sm" weight="medium" style={{ color: theme.colors.text.primary }}>
            {formatBytes(storageUsage.total)} used
          </Text>
          <Text size="sm" style={{ color: theme.colors.text.muted }}>
            {formatBytes(limitBytes)} total
          </Text>
        </View>

        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.border.subtle,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: usagePercent > 90
                ? '#ef4444'
                : usagePercent > 70
                  ? '#f59e0b'
                  : theme.colors.accent.primary,
              width: `${Math.min(usagePercent, 100)}%`,
            }}
          />
        </View>

        {/* Breakdown */}
        {storageUsage.byContext && (
          <View style={{ gap: 4, marginBottom: 12 }}>
            {Object.entries(storageUsage.byContext).map(([context, bytes]) => (
              <View key={context} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text size="xs" style={{ color: theme.colors.text.muted }}>
                  {context}
                </Text>
                <Text size="xs" style={{ color: theme.colors.text.muted }}>
                  {formatBytes(bytes as number)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Cleanup suggestions */}
        {cleanupSuggestions.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text size="xs" weight="medium" style={{ color: theme.colors.text.secondary, marginBottom: 4 }}>
              Suggestions
            </Text>
            {cleanupSuggestions.slice(0, 3).map((s, i) => (
              <Text key={i} size="xs" style={{ color: theme.colors.text.muted, marginTop: 2 }}>
                &bull; {s.description} ({formatBytes(s.bytesReclaimable)})
              </Text>
            ))}
          </View>
        )}

        {/* Cleanup button */}
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onPress={smartCleanup}
          disabled={isCleaningUp}
        >
          {isCleaningUp ? 'Cleaning up...' : 'Smart Cleanup'}
        </Button>

        {lastCleanupResult && (
          <Text size="xs" style={{ color: theme.colors.text.muted, marginTop: 8, textAlign: 'center' }}>
            Last cleanup freed {formatBytes(lastCleanupResult.bytesFreed)}
          </Text>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Files Page
// ---------------------------------------------------------------------------

export default function FilesPage() {
  const { theme } = useTheme();
  const { service } = useUmbra();
  const { identity } = useAuth();
  const myDid = identity?.did ?? '';
  const { hasActiveUploads, uploadRingProgress } = useUploadProgress();
  const { conversations } = useConversations();
  const { friends } = useFriends();
  const { refresh: refreshFolders } = useSharedFolders();

  // Build a friend DID → display name map
  const friendNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const f of friends) {
      map[f.did] = f.displayName;
    }
    return map;
  }, [friends]);

  // DM conversations for the "create shared folder" flow
  const dmConversations = useMemo(
    () => conversations.filter((c) => c.type !== 'group' && c.friendDid),
    [conversations],
  );

  // Create shared folder from the Files page
  const handleCreateSharedFolder = useCallback(async () => {
    if (!service) return;

    // Step 1: prompt for folder name
    const name = typeof window !== 'undefined'
      ? window.prompt('Shared folder name:')
      : null;
    if (!name?.trim()) return;

    // Step 2: select a contact/conversation
    // For now, use a simple prompt approach. A full dialog would be better.
    const contactOptions = dmConversations.map(
      (c) => `${friendNameMap[c.friendDid!] || c.friendDid!.slice(0, 16)} (${c.id.slice(0, 8)}...)`
    ).join('\n');

    if (dmConversations.length === 0) {
      if (typeof window !== 'undefined') {
        window.alert('No DM conversations available. Start a conversation with a friend first.');
      }
      return;
    }

    const indexStr = typeof window !== 'undefined'
      ? window.prompt(
          `Select a contact (enter number 1-${dmConversations.length}):\n\n` +
          dmConversations.map(
            (c, i) => `${i + 1}. ${friendNameMap[c.friendDid!] || c.friendDid!.slice(0, 16)}`
          ).join('\n')
        )
      : null;

    if (!indexStr) return;
    const idx = parseInt(indexStr, 10) - 1;
    if (idx < 0 || idx >= dmConversations.length) return;

    const conv = dmConversations[idx];

    try {
      await service.createDmFolder(conv.id, null, name.trim(), myDid);
      await refreshFolders();
      console.log('[FilesPage] Shared folder created:', name.trim());
    } catch (err) {
      console.error('[FilesPage] Failed to create shared folder:', err);
    }
  }, [service, myDid, dmConversations, friendNameMap, refreshFolders]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border.subtle,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <FolderIcon size={24} color={theme.colors.text.primary} />
          <Text size="lg" weight="bold" style={{ color: theme.colors.text.primary }}>
            Files
          </Text>
          {hasActiveUploads && (
            <View
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
            </View>
          )}
        </View>
        <Button
          variant="primary"
          size="sm"
          onPress={handleCreateSharedFolder}
          iconLeft={<PlusIcon size={16} color="#fff" />}
        >
          New Shared Folder
        </Button>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <ActiveTransfersSection />
        <SharedFoldersSection />
        <CommunityFilesSection />
        <StorageSection />
      </ScrollView>
    </View>
  );
}
