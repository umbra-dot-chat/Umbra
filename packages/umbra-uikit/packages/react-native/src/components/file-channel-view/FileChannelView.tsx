import React, { forwardRef, useMemo, useState } from 'react';
import { View, Text as RNText, Pressable, ScrollView } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileFolder {
  id: string;
  name: string;
  parentId?: string | null;
  children?: FileFolder[];
  fileCount?: number;
}

export interface FileEntry {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  thumbnail?: string;
  downloadCount?: number;
  version?: number;
}

export type FileViewMode = 'grid' | 'list';

export interface FileChannelViewProps {
  folders: FileFolder[];
  files: FileEntry[];
  currentFolderId?: string | null;
  viewMode?: FileViewMode;
  onViewModeChange?: (mode: FileViewMode) => void;
  onFolderClick?: (folderId: string) => void;
  onFileClick?: (fileId: string) => void;
  onUploadClick?: () => void;
  onCreateFolder?: () => void;
  breadcrumbPath?: Array<{ id: string; name: string }>;
  onBreadcrumbClick?: (folderId: string | null) => void;
  loading?: boolean;
  skeleton?: boolean;
  emptyText?: string;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '\u{1F5BC}';
  if (mimeType.startsWith('video/')) return '\u{1F3AC}';
  if (mimeType.startsWith('audio/')) return '\u{1F3B5}';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text'))
    return '\u{1F4C4}';
  return '\u{1F4CE}';
}

// ---------------------------------------------------------------------------
// FileChannelView
// ---------------------------------------------------------------------------

export const FileChannelView = forwardRef<View, FileChannelViewProps>(function FileChannelView(
  {
    folders,
    files,
    currentFolderId,
    viewMode = 'grid',
    onViewModeChange,
    onFolderClick,
    onFileClick,
    onUploadClick,
    onCreateFolder,
    breadcrumbPath,
    onBreadcrumbClick,
    loading = false,
    skeleton = false,
    emptyText = 'No files yet',
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const headerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: defaultSpacing.md,
    paddingVertical: defaultSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: tc.border.subtle,
  }), [tc]);

  const folderRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    paddingHorizontal: defaultSpacing.md,
    paddingVertical: defaultSpacing.xs,
    gap: defaultSpacing.sm,
  }), []);

  if (skeleton) {
    return (
      <View ref={ref} style={[{ flex: 1, backgroundColor: tc.background.canvas }, userStyle]}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={{
              height: 40,
              marginHorizontal: defaultSpacing.md,
              marginTop: defaultSpacing.sm,
              borderRadius: defaultRadii.md,
              backgroundColor: tc.border.subtle,
            }}
          />
        ))}
      </View>
    );
  }

  return (
    <View ref={ref} style={[{ flex: 1, backgroundColor: tc.background.canvas }, userStyle]} accessibilityRole="none">
      {/* Header */}
      <View style={headerStyle}>
        <View style={{ flex: 1 }}>
          {breadcrumbPath && breadcrumbPath.length > 0 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Pressable onPress={() => onBreadcrumbClick?.(null)}>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.secondary } as TextStyle}>
                  Root
                </RNText>
              </Pressable>
              {breadcrumbPath.map((seg) => (
                <React.Fragment key={seg.id}>
                  <RNText style={{ color: tc.text.muted } as TextStyle}> / </RNText>
                  <Pressable onPress={() => onBreadcrumbClick?.(seg.id)}>
                    <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary, fontWeight: '500' } as TextStyle}>
                      {seg.name}
                    </RNText>
                  </Pressable>
                </React.Fragment>
              ))}
            </View>
          ) : (
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary } as TextStyle}>
              All Files
            </RNText>
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: defaultSpacing.xs }}>
          {onUploadClick && (
            <Pressable
              onPress={onUploadClick}
              style={{
                paddingHorizontal: defaultSpacing.sm,
                paddingVertical: defaultSpacing['2xs'],
                backgroundColor: tc.accent.primary,
                borderRadius: defaultRadii.md,
              }}
            >
              <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.inverse } as TextStyle}>
                Upload
              </RNText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Folders */}
      {folders.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View style={folderRowStyle}>
            {folders.map((folder) => (
              <Pressable
                key={folder.id}
                onPress={() => onFolderClick?.(folder.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: defaultSpacing.sm,
                  paddingVertical: defaultSpacing['2xs'],
                  borderRadius: defaultRadii.md,
                  backgroundColor: currentFolderId === folder.id ? tc.accent.highlight : tc.background.surface,
                }}
              >
                <RNText>{currentFolderId === folder.id ? '\u{1F4C2}' : '\u{1F4C1}'}</RNText>
                <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary } as TextStyle}>
                  {folder.name}
                </RNText>
                {folder.fileCount != null && (
                  <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
                    {folder.fileCount}
                  </RNText>
                )}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Files */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: defaultSpacing.md, gap: defaultSpacing.sm }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: defaultSpacing['2xl'] }}>
            <RNText style={{ color: tc.text.muted } as TextStyle}>Loading...</RNText>
          </View>
        ) : files.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: defaultSpacing['2xl'] }}>
            <RNText style={{ fontSize: 28 }}>{'\u{1F4C2}'}</RNText>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.muted, marginTop: defaultSpacing.sm } as TextStyle}>
              {emptyText}
            </RNText>
          </View>
        ) : (
          files.map((file) => (
            <Pressable
              key={file.id}
              onPress={() => onFileClick?.(file.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: defaultSpacing.sm,
                padding: defaultSpacing.sm,
                borderRadius: defaultRadii.md,
                backgroundColor: tc.background.surface,
                borderWidth: 1,
                borderColor: tc.border.subtle,
              }}
            >
              <RNText style={{ fontSize: 22 }}>{getFileIcon(file.mimeType)}</RNText>
              <View style={{ flex: 1 }}>
                <RNText numberOfLines={1} style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary, fontWeight: '500' } as TextStyle}>
                  {file.name}
                </RNText>
                <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
                  {formatSize(file.size)} {'\u00B7'} {file.uploadedBy}
                </RNText>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
});

FileChannelView.displayName = 'FileChannelView';
