/**
 * @module components/file-upload-zone
 * @description React Native FileUploadZone for the Wisp design system.
 *
 * On mobile, provides a button to pick files via document picker
 * and shows upload progress. No drag-and-drop on mobile.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography, defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props (RN-specific)
// ---------------------------------------------------------------------------

export interface FileUploadZoneProps extends ViewProps {
  /** Called when files are selected via document picker. */
  onFileSelect?: () => void;
  /** Whether a file is currently being uploaded. @default false */
  uploading?: boolean;
  /** Upload progress (0-100). */
  uploadProgress?: number;
  /** Name of the file currently being uploaded. */
  currentFileName?: string;
  /** Children wrapped by the upload zone. */
  children: React.ReactNode;
  /** Whether the upload zone is disabled. @default false */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// FileUploadZone
// ---------------------------------------------------------------------------

export const FileUploadZone = forwardRef<View, FileUploadZoneProps>(
  function FileUploadZone(
    {
      onFileSelect,
      uploading = false,
      uploadProgress,
      currentFileName,
      children,
      disabled = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const containerStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
    }), []);

    const progressContainerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
      backgroundColor: themeColors.background.surface,
      borderTopWidth: 1,
      borderTopColor: themeColors.border.subtle,
    }), [themeColors]);

    const progressTrackStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: themeColors.border.subtle,
      overflow: 'hidden',
    }), [themeColors]);

    const progressFillStyle = useMemo<ViewStyle>(() => ({
      height: '100%',
      borderRadius: 3,
      backgroundColor: themeColors.accent.primary,
      width: (`${uploadProgress ?? 0}%` as any),
    }), [themeColors, uploadProgress]);

    const fileNameStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
      maxWidth: 150,
    }), [themeColors]);

    const percentStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
    }), [themeColors]);

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        {children}

        {/* Upload progress bar */}
        {uploading && (
          <View style={progressContainerStyle}>
            {currentFileName && (
              <Text style={fileNameStyle} numberOfLines={1}>{currentFileName}</Text>
            )}
            <View style={progressTrackStyle}>
              <View style={progressFillStyle as any} />
            </View>
            <Text style={percentStyle}>
              {uploadProgress !== undefined ? Math.round(uploadProgress) + '%' : ''}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

FileUploadZone.displayName = 'FileUploadZone';
