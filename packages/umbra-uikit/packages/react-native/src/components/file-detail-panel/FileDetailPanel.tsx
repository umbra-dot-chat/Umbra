/**
 * @module components/file-detail-panel
 * @description React Native FileDetailPanel for the Wisp design system.
 *
 * Full-height panel showing file details: preview area, name, size,
 * MIME type, uploader, date, download count, version, and action buttons.
 */

import React, { forwardRef, useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, TextInput } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { FileEntry } from '@coexist/wisp-core/types/FileChannelView.types';
import { defaultSpacing, defaultTypography, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props (RN-specific)
// ---------------------------------------------------------------------------

export interface FileDetailPanelProps extends ViewProps {
  /** The file to display details for. */
  file: FileEntry;
  /** Called when the panel should close. */
  onClose: () => void;
  /** Called when Download is clicked. */
  onDownload?: () => void;
  /** Called when Rename is confirmed. */
  onRename?: (newName: string) => void;
  /** Called when Delete is clicked. */
  onDelete?: () => void;
  /** Whether the panel is visible. @default true */
  open?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function getFileTypeEmoji(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '\u{1F5BC}\uFE0F';
  if (mimeType.startsWith('video/')) return '\u{1F3AC}';
  if (mimeType.startsWith('audio/')) return '\u{1F3B5}';
  if (mimeType.includes('pdf')) return '\u{1F4C4}';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '\u{1F4E6}';
  if (mimeType.includes('text') || mimeType.includes('document')) return '\u{1F4DD}';
  return '\u{1F4CE}';
}

// ---------------------------------------------------------------------------
// FileDetailPanel
// ---------------------------------------------------------------------------

export const FileDetailPanel = forwardRef<View, FileDetailPanelProps>(
  function FileDetailPanel(
    {
      file,
      onClose,
      onDownload,
      onRename,
      onDelete,
      open = true,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(file.name);

    const handleRenameSubmit = useCallback(() => {
      if (editName.trim() && editName !== file.name) {
        onRename?.(editName.trim());
      }
      setEditing(false);
    }, [editName, file.name, onRename]);

    // ----- Styles -----

    const panelStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      backgroundColor: themeColors.background.surface,
      borderLeftWidth: 1,
      borderLeftColor: themeColors.border.subtle,
    }), [themeColors]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    }), [themeColors]);

    const headerTitleStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.semibold as TextStyle['fontWeight'],
      color: themeColors.text.primary,
    }), [themeColors]);

    const closeBtnStyle = useMemo<ViewStyle>(() => ({
      padding: 4,
    }), []);

    const closeBtnTextStyle = useMemo<TextStyle>(() => ({
      fontSize: 18,
      color: themeColors.text.muted,
    }), [themeColors]);

    const previewStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      height: 180,
      backgroundColor: themeColors.background.raised,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border.subtle,
    }), [themeColors]);

    const previewEmojiStyle = useMemo<TextStyle>(() => ({
      fontSize: 56,
    }), []);

    const bodyStyle = useMemo<ViewStyle>(() => ({
      padding: defaultSpacing.md,
      gap: defaultSpacing.md,
    }), []);

    const labelStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: defaultTypography.weights.semibold as TextStyle['fontWeight'],
      color: themeColors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }), [themeColors]);

    const valueStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: themeColors.text.primary,
      marginTop: 2,
    }), [themeColors]);

    const fileNameStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.base.fontSize,
      fontWeight: defaultTypography.weights.semibold as TextStyle['fontWeight'],
      color: themeColors.text.primary,
    }), [themeColors]);

    const editInputStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.base.fontSize,
      fontWeight: defaultTypography.weights.semibold as TextStyle['fontWeight'],
      color: themeColors.text.primary,
      backgroundColor: themeColors.background.raised,
      borderWidth: 1,
      borderColor: themeColors.accent.primary,
      borderRadius: defaultRadii.sm,
      paddingHorizontal: defaultSpacing.xs,
      paddingVertical: 2,
    }), [themeColors]);

    const actionsStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      gap: defaultSpacing.sm,
      padding: defaultSpacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border.subtle,
    }), [themeColors]);

    const downloadBtnStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: defaultSpacing.xs,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      backgroundColor: themeColors.accent.primary,
    }), [themeColors]);

    const downloadBtnTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.medium as TextStyle['fontWeight'],
      color: '#fff',
    }), []);

    const deleteBtnStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: defaultSpacing.xs,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: themeColors.status.danger,
    }), [themeColors]);

    const deleteBtnTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.medium as TextStyle['fontWeight'],
      color: themeColors.status.danger,
    }), [themeColors]);

    if (!open) return null;

    return (
      <View ref={ref} style={[panelStyle, userStyle as ViewStyle]} {...rest}>
        {/* Header */}
        <View style={headerStyle}>
          <Text style={headerTitleStyle}>File Details</Text>
          <Pressable style={closeBtnStyle} onPress={onClose} accessibilityLabel="Close">
            <Text style={closeBtnTextStyle}>{'\u2715'}</Text>
          </Pressable>
        </View>

        {/* Preview */}
        <View style={previewStyle}>
          <Text style={previewEmojiStyle}>{getFileTypeEmoji(file.mimeType)}</Text>
        </View>

        {/* Scrollable body */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={bodyStyle}>
          {/* File name */}
          <View>
            {editing ? (
              <TextInput
                style={editInputStyle}
                value={editName}
                onChangeText={setEditName}
                onBlur={handleRenameSubmit}
                onSubmitEditing={handleRenameSubmit}
                autoFocus
                selectTextOnFocus
              />
            ) : (
              <Pressable onPress={() => { if (onRename) { setEditName(file.name); setEditing(true); } }}>
                <Text style={fileNameStyle}>{file.name}</Text>
              </Pressable>
            )}
          </View>

          <View>
            <Text style={labelStyle}>Size</Text>
            <Text style={valueStyle}>{formatFileSize(file.size)}</Text>
          </View>

          <View>
            <Text style={labelStyle}>Type</Text>
            <Text style={valueStyle}>{file.mimeType}</Text>
          </View>

          <View>
            <Text style={labelStyle}>Uploaded by</Text>
            <Text style={valueStyle}>{file.uploadedBy}</Text>
          </View>

          <View>
            <Text style={labelStyle}>Uploaded</Text>
            <Text style={valueStyle}>{file.uploadedAt}</Text>
          </View>

          {file.downloadCount !== undefined && (
            <View>
              <Text style={labelStyle}>Downloads</Text>
              <Text style={valueStyle}>{file.downloadCount}</Text>
            </View>
          )}

          {file.version !== undefined && (
            <View>
              <Text style={labelStyle}>Version</Text>
              <Text style={valueStyle}>v{file.version}</Text>
            </View>
          )}
        </ScrollView>

        {/* Actions */}
        <View style={actionsStyle}>
          {onDownload && (
            <Pressable style={downloadBtnStyle} onPress={onDownload}>
              <Text style={downloadBtnTextStyle}>Download</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable style={deleteBtnStyle} onPress={onDelete}>
              <Text style={deleteBtnTextStyle}>Delete</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);

FileDetailPanel.displayName = 'FileDetailPanel';
