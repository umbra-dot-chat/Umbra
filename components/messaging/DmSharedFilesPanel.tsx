/**
 * DmSharedFilesPanel — Right panel showing shared files in a DM conversation.
 *
 * Displays a flat list of files shared in the conversation with filter tabs
 * (All / Images / Documents / Media / Other).
 *
 * Uses the `useDmFiles` hook for data and real-time updates.
 */

import React, { useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useTheme, Text } from '@coexist/wisp-react-native';
import { useDmFiles } from '@/hooks/useDmFiles';
import type { DmFileFilter } from '@/hooks/useDmFiles';
import { getFileTypeIcon, formatFileSize } from '@/utils/fileIcons';
import { LockIcon } from '@/components/icons';
import type { DmSharedFileRecord } from '@umbra/service';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DmSharedFilesPanelProps {
  /** The DM conversation ID. */
  conversationId: string;
  /** Close the panel. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Filter tabs config
// ---------------------------------------------------------------------------

const FILTER_TABS: { key: DmFileFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'images', label: 'Images' },
  { key: 'documents', label: 'Docs' },
  { key: 'media', label: 'Media' },
  { key: 'other', label: 'Other' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DmSharedFilesPanel({ conversationId, onClose }: DmSharedFilesPanelProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const {
    files,
    isLoading,
    error,
    filter,
    setFilter,
    retry,
  } = useDmFiles(conversationId);

  const handleFilterChange = useCallback(
    (newFilter: DmFileFilter) => {
      setFilter(newFilter);
    },
    [setFilter],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.canvas }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        <Text size="md" weight="semibold" style={{ color: colors.text.primary }}>
          Shared Files
        </Text>
        <Text
          size="sm"
          weight="medium"
          onPress={onClose}
          style={{ color: colors.text.muted }}
        >
          Close
        </Text>
      </View>

      {/* Filter tabs */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 4,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        }}
      >
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleFilterChange(tab.key)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: filter === tab.key ? colors.accent.primary + '20' : 'transparent',
            }}
          >
            <Text
              size="xs"
              weight={filter === tab.key ? 'semibold' : 'regular'}
              style={{
                color: filter === tab.key ? colors.accent.primary : colors.text.muted,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text size="sm" style={{ color: colors.text.muted }}>Loading files...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text size="sm" style={{ color: colors.status.danger, marginBottom: 8 }}>
            Failed to load files
          </Text>
          <Text
            size="xs"
            weight="medium"
            onPress={retry}
            style={{ color: colors.accent.primary }}
          >
            Retry
          </Text>
        </View>
      ) : files.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Text size="sm" style={{ color: colors.text.muted }}>
            {filter === 'all' ? 'No shared files yet' : `No ${filter} found`}
          </Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// File row sub-component
// ---------------------------------------------------------------------------

function FileRow({ file }: { file: DmSharedFileRecord }) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const typeIcon = getFileTypeIcon(file.mimeType ?? 'application/octet-stream');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.subtle,
        gap: 10,
      }}
    >
      {/* File type icon */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          backgroundColor: typeIcon.color + '1A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size="md">{typeIcon.icon}</Text>
      </View>

      {/* File info */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          size="sm"
          weight="medium"
          numberOfLines={1}
          style={{ color: colors.text.primary }}
        >
          {file.filename}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
          <Text size="xs" style={{ color: colors.text.muted }}>
            {formatFileSize(file.fileSize)} · {new Date(file.createdAt).toLocaleDateString()}
          </Text>
          {file.isEncrypted && (
            <LockIcon size={10} color={colors.accent.primary} />
          )}
        </View>
      </View>
    </View>
  );
}
