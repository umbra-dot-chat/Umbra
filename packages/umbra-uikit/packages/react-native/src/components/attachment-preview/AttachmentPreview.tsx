/**
 * @module components/attachment-preview
 * @description React Native AttachmentPreview for the Wisp design system.
 *
 * Horizontal scrollable row of queued file preview cards displayed above
 * the message input area. Reuses color resolution from `@coexist/wisp-core`.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import type { Attachment, AttachmentFileType } from '@coexist/wisp-core/types/AttachmentPreview.types';
import { resolveAttachmentPreviewColors } from '@coexist/wisp-core/styles/AttachmentPreview.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Line, Path, Circle, Rect } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AttachmentPreviewProps extends ViewProps {
  /** List of queued attachments. */
  attachments: Attachment[];
  /** Called when the remove button is pressed on an attachment. */
  onRemove?: (id: string) => void;
  /** Called when an attachment card is pressed (e.g. to preview). */
  onPreview?: (attachment: Attachment) => void;
  /** Whether all attachments are disabled (e.g. while sending). @default false */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

function FileIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <Path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </Svg>
  );
}

function ImageFileIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width={18} height={18} x={3} y={3} rx={2} ry={2} />
      <Circle cx={9} cy={9} r={2} />
      <Path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </Svg>
  );
}

function VideoIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11" />
      <Rect width={14} height={12} x={2} y={6} rx={2} />
    </Svg>
  );
}

function AudioIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18V5l12-2v13" />
      <Circle cx={6} cy={18} r={3} />
      <Circle cx={18} cy={16} r={3} />
    </Svg>
  );
}

function ArchiveIcon({ size = 24, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Rect width={20} height={5} x={2} y={3} rx={1} />
      <Path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <Path d="M10 12h4" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

function getFileTypeIcon(fileType: AttachmentFileType, color: string) {
  switch (fileType) {
    case 'image':
      return <ImageFileIcon size={24} color={color} />;
    case 'video':
      return <VideoIcon size={24} color={color} />;
    case 'audio':
      return <AudioIcon size={24} color={color} />;
    case 'archive':
      return <ArchiveIcon size={24} color={color} />;
    case 'document':
    case 'other':
    default:
      return <FileIcon size={24} color={color} />;
  }
}

// ---------------------------------------------------------------------------
// AttachmentPreview
// ---------------------------------------------------------------------------

/**
 * AttachmentPreview -- Horizontal scrollable row of queued file preview cards.
 *
 * @remarks
 * Each card shows a thumbnail (for images with thumbnailUrl) or a file type
 * icon, the file name, formatted size, an optional progress bar, error state,
 * and a remove button. Cards are horizontally scrollable.
 *
 * @example
 * ```tsx
 * <AttachmentPreview
 *   attachments={queuedFiles}
 *   onRemove={(id) => removeAttachment(id)}
 *   onPreview={(attachment) => openPreview(attachment)}
 * />
 * ```
 */
export const AttachmentPreview = forwardRef<View, AttachmentPreviewProps>(
  function AttachmentPreview(
    {
      attachments,
      onRemove,
      onPreview,
      disabled = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    // -- Colors ---------------------------------------------------------------

    const colors = useMemo(
      () => resolveAttachmentPreviewColors(theme),
      [theme],
    );

    // -- Styles ---------------------------------------------------------------

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      gap: defaultSpacing.sm,
      paddingBottom: defaultSpacing.xs,
    };

    const cardBaseStyle: ViewStyle = {
      position: 'relative',
      flexDirection: 'column',
      width: 140,
      minWidth: 140,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      backgroundColor: colors.cardBg,
      overflow: 'hidden',
      flexShrink: 0,
    };

    const thumbnailStyle: ImageStyle = {
      width: '100%',
      height: 80,
      resizeMode: 'cover',
      flexShrink: 0,
    };

    const iconAreaStyle: ViewStyle = {
      width: '100%',
      height: 80,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.iconAreaBg,
      flexShrink: 0,
    };

    const fileInfoStyle: ViewStyle = {
      flexDirection: 'column',
      gap: 2,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
    };

    const fileNameStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.text,
      numberOfLines: 1,
    } as TextStyle;

    const fileSizeStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.textMuted,
    };

    const removeBtnStyle: ViewStyle = {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: defaultRadii.full,
      backgroundColor: colors.removeBg,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    };

    const progressContainerStyle: ViewStyle = {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: 'transparent',
      overflow: 'hidden',
    };

    const errorOverlayStyle: ViewStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.errorOverlay,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const disabledStyle: ViewStyle = disabled
      ? { opacity: 0.5 }
      : {};

    // -- Callbacks ------------------------------------------------------------

    const handleRemove = useCallback(
      (id: string) => {
        if (!disabled) onRemove?.(id);
      },
      [onRemove, disabled],
    );

    const handlePreview = useCallback(
      (attachment: Attachment) => {
        if (!disabled) onPreview?.(attachment);
      },
      [onPreview, disabled],
    );

    // -- Render ---------------------------------------------------------------

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel="Attachment previews"
        style={[disabledStyle, userStyle as ViewStyle]}
        {...rest}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={containerStyle}
        >
          {attachments.map((attachment) => {
            const hasError = attachment.error === true;
            const showProgress =
              attachment.progress !== undefined && attachment.progress < 100;

            const cardStyle: ViewStyle = {
              ...cardBaseStyle,
              borderColor: hasError ? colors.cardBorderError : colors.cardBorder,
            };

            const progressFillStyle: ViewStyle = showProgress
              ? {
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, attachment.progress!))}%` as unknown as number,
                  backgroundColor: colors.progressFill,
                }
              : {};

            return (
              <Pressable
                key={attachment.id}
                accessibilityRole="button"
                accessibilityLabel={`${attachment.fileName}, ${formatFileSize(attachment.fileSize)}`}
                disabled={disabled}
                onPress={() => handlePreview(attachment)}
                style={cardStyle}
              >
                {/* Thumbnail or file icon area */}
                {attachment.fileType === 'image' && attachment.thumbnailUrl ? (
                  <Image
                    source={{ uri: attachment.thumbnailUrl }}
                    style={thumbnailStyle}
                    accessibilityLabel={attachment.fileName}
                  />
                ) : (
                  <View style={iconAreaStyle}>
                    {getFileTypeIcon(attachment.fileType, colors.textSecondary)}
                  </View>
                )}

                {/* File info */}
                <View style={fileInfoStyle}>
                  <Text style={fileNameStyle} numberOfLines={1}>
                    {attachment.fileName}
                  </Text>
                  <Text style={fileSizeStyle}>
                    {formatFileSize(attachment.fileSize)}
                  </Text>
                </View>

                {/* Remove button */}
                {onRemove && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${attachment.fileName}`}
                    disabled={disabled}
                    onPress={() => handleRemove(attachment.id)}
                    style={removeBtnStyle}
                  >
                    <CloseIcon size={12} color={colors.removeText} />
                  </Pressable>
                )}

                {/* Progress bar */}
                {showProgress && (
                  <View style={progressContainerStyle}>
                    <View style={progressFillStyle} />
                  </View>
                )}

                {/* Error overlay */}
                {hasError && (
                  <View style={errorOverlayStyle} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  },
);

AttachmentPreview.displayName = 'AttachmentPreview';
