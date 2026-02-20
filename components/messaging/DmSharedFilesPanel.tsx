/**
 * DmSharedFilesPanel — Right panel showing shared files in a DM conversation.
 *
 * Displays a flat list of files shared in the conversation with filter tabs
 * (All / Images / Documents / Media / Other).
 *
 * Also provides "New Folder" and "Upload File" actions.
 *
 * Uses the `useDmFiles` hook for data and real-time updates.
 */

import React, { useCallback } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Button, useTheme, Text } from '@coexist/wisp-react-native';
import { useDmFiles } from '@/hooks/useDmFiles';
import type { DmFileFilter } from '@/hooks/useDmFiles';
import { getFileTypeIcon, formatFileSize } from '@/utils/fileIcons';
import { LockIcon, FolderIcon, PlusIcon } from '@/components/icons';
import type { DmSharedFileRecord } from '@umbra/service';
import Svg, { Line } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DmSharedFilesPanelProps {
  /** The DM conversation ID. */
  conversationId: string;
  /** Close the panel. */
  onClose: () => void;
  /** Create a shared folder for this conversation. */
  onCreateFolder?: () => void;
  /** Upload/attach a file to this conversation. */
  onUploadFile?: () => void;
}

// ---------------------------------------------------------------------------
// SVG Close Icon (matches MemberList / PinnedMessages)
// ---------------------------------------------------------------------------

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
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

export function DmSharedFilesPanel({ conversationId, onClose, onCreateFolder, onUploadFile }: DmSharedFilesPanelProps) {
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
      {/* Header — matches MemberList / PinnedMessages style */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: defaultSpacing.sm,
          paddingHorizontal: defaultSpacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
          minHeight: 56,
        }}
      >
        <Text
          style={{
            fontSize: defaultTypography.sizes.sm.fontSize,
            lineHeight: defaultTypography.sizes.sm.lineHeight,
            fontWeight: String(defaultTypography.weights.semibold) as any,
            color: colors.text.primary,
          }}
        >
          Shared Files
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close shared files"
          onPress={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: defaultRadii.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CloseIcon size={16} color={colors.text.muted} />
        </Pressable>
      </View>

      {/* Action buttons — New Folder + Upload */}
      {(onCreateFolder || onUploadFile) && (
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: defaultSpacing.md,
            paddingVertical: defaultSpacing.sm,
            gap: defaultSpacing.xs,
            borderBottomWidth: 1,
            borderBottomColor: colors.border.subtle,
          }}
        >
          {onCreateFolder && (
            <Button
              variant="secondary"
              size="xs"
              onPress={onCreateFolder}
              iconLeft={<FolderIcon size={14} color={colors.text.secondary} />}
            >
              New Folder
            </Button>
          )}
          {onUploadFile && (
            <Button
              variant="secondary"
              size="xs"
              onPress={onUploadFile}
              iconLeft={<PlusIcon size={14} color={colors.text.secondary} />}
            >
              Upload
            </Button>
          )}
        </View>
      )}

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
