import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable, ScrollView, Modal } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadingFile {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export interface FileUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onPickFile?: () => void;
  uploadingFiles?: UploadingFile[];
  onCancelUpload?: (fileId: string) => void;
  onRetryUpload?: (fileId: string) => void;
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  title?: string;
  targetFolderName?: string;
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

function getStatusLabel(status: UploadingFile['status']): string {
  switch (status) {
    case 'complete': return 'Complete';
    case 'error': return 'Failed';
    case 'uploading': return 'Uploading';
    default: return 'Pending';
  }
}

function getStatusColor(status: UploadingFile['status'], tc: any): string {
  switch (status) {
    case 'complete': return tc.status.success;
    case 'error': return tc.status.error;
    case 'uploading': return tc.accent.primary;
    default: return tc.text.muted;
  }
}

// ---------------------------------------------------------------------------
// FileUploadDialog
// ---------------------------------------------------------------------------

export const FileUploadDialog = forwardRef<View, FileUploadDialogProps>(function FileUploadDialog(
  {
    open,
    onClose,
    onPickFile,
    uploadingFiles = [],
    onCancelUpload,
    onRetryUpload,
    accept,
    maxSize,
    multiple = true,
    title = 'Upload Files',
    targetFolderName,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const completedCount = uploadingFiles.filter((f) => f.status === 'complete').length;
  const totalCount = uploadingFiles.length;

  const dialogStyle = useMemo<ViewStyle>(() => ({
    backgroundColor: tc.background.base,
    borderRadius: defaultRadii.xl,
    borderWidth: 1,
    borderColor: tc.border.subtle,
    padding: defaultSpacing.lg,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    gap: defaultSpacing.md,
  }), [tc]);

  const btnStyle = useMemo<ViewStyle>(() => ({
    paddingHorizontal: defaultSpacing.sm,
    paddingVertical: defaultSpacing['2xs'],
    borderRadius: defaultRadii.md,
    borderWidth: 1,
    borderColor: tc.border.subtle,
  }), [tc]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
        <View ref={ref} style={[dialogStyle, userStyle]} accessibilityRole="none">
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <RNText style={{ fontSize: defaultTypography.sizes.lg.fontSize, fontWeight: '600', color: tc.text.primary } as TextStyle}>
              {title}
            </RNText>
            <Pressable onPress={onClose} accessibilityLabel="Close">
              <RNText style={{ fontSize: 18, color: tc.text.muted } as TextStyle}>{'\u2715'}</RNText>
            </Pressable>
          </View>

          {/* Folder label */}
          {targetFolderName && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: defaultSpacing['2xs'], backgroundColor: tc.background.raised, borderRadius: defaultRadii.md }}>
              <RNText>{'\u{1F4C1}'}</RNText>
              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary } as TextStyle}>
                Uploading to: {targetFolderName}
              </RNText>
            </View>
          )}

          {/* Pick file button */}
          <Pressable
            onPress={onPickFile}
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: defaultSpacing.xl,
              borderRadius: defaultRadii.lg,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: tc.border.strong,
              gap: defaultSpacing.sm,
            }}
            accessibilityRole="button"
            accessibilityLabel="Pick file"
          >
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary } as TextStyle}>
              Tap to select files
            </RNText>
            {(accept || maxSize) && (
              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
                {[accept, maxSize && `up to ${(maxSize / 1024 / 1024).toFixed(0)}MB`].filter(Boolean).join(' \u00B7 ')}
              </RNText>
            )}
          </Pressable>

          {/* Uploading files */}
          {uploadingFiles.length > 0 && (
            <>
              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
                {completedCount} of {totalCount} complete
              </RNText>
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: defaultSpacing.sm }}>
                  {uploadingFiles.map((file) => (
                    <View
                      key={file.id}
                      style={{
                        padding: defaultSpacing.sm,
                        borderRadius: defaultRadii.md,
                        borderWidth: 1,
                        borderColor: tc.border.subtle,
                        backgroundColor: tc.background.surface,
                        gap: defaultSpacing.xs,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <RNText numberOfLines={1} style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary, fontWeight: '500' } as TextStyle}>
                            {file.name}
                          </RNText>
                          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
                            {formatSize(file.size)} {'\u00B7'}{' '}
                            <RNText style={{ color: getStatusColor(file.status, tc) } as TextStyle}>
                              {getStatusLabel(file.status)}
                            </RNText>
                          </RNText>
                        </View>
                        <View style={{ flexDirection: 'row', gap: defaultSpacing.xs }}>
                          {file.status === 'uploading' && onCancelUpload && (
                            <Pressable onPress={() => onCancelUpload(file.id)} style={btnStyle}>
                              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary } as TextStyle}>Cancel</RNText>
                            </Pressable>
                          )}
                          {file.status === 'error' && onRetryUpload && (
                            <Pressable onPress={() => onRetryUpload(file.id)} style={btnStyle}>
                              <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.secondary } as TextStyle}>Retry</RNText>
                            </Pressable>
                          )}
                        </View>
                      </View>
                      {(file.status === 'uploading' || file.status === 'pending') && (
                        <View style={{ height: 4, borderRadius: 2, backgroundColor: tc.border.subtle, overflow: 'hidden' }}>
                          <View style={{ width: `${file.progress}%`, height: '100%', borderRadius: 2, backgroundColor: tc.accent.primary }} />
                        </View>
                      )}
                      {file.status === 'error' && file.error && (
                        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.status.error } as TextStyle}>
                          {file.error}
                        </RNText>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Pressable onPress={onClose} style={btnStyle}>
              <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary } as TextStyle}>
                Close
              </RNText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

FileUploadDialog.displayName = 'FileUploadDialog';
