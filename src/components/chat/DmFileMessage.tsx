/**
 * DmFileMessage — Renders a file attachment card within a chat message.
 *
 * Shows a compact file card with MIME icon, filename, file size,
 * and a download button. For image types, displays a thumbnail preview
 * above the file info bar. Used inside message bubbles when a message
 * has `content.type === 'file'` or a JSON file marker.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, View, Image, Pressable } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import Svg, { Circle } from 'react-native-svg';
import { getFileTypeIcon, formatFileSize } from '@/utils/fileIcons';
import { DownloadIcon, LockIcon } from '@/components/ui';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DmFileMessageProps {
  /** File identifier */
  fileId: string;
  /** Display filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Whether this is an outgoing (own) message */
  isOutgoing?: boolean;
  /**
   * Rendering context — determines how the card adapts its colours.
   * - `'bubble'`: card sits inside a ChatBubble (outgoing bubble has accent bg)
   * - `'inline'`: card sits directly on the page canvas (compact / inline view)
   */
  variant?: 'bubble' | 'inline';
  /** Optional thumbnail data URI for image/video previews */
  thumbnail?: string;
  /** Called when the download button is pressed */
  onDownload?: (fileId: string) => void;
  /** Whether a download is currently in progress (shows spinning ring) */
  isDownloading?: boolean;
  /** Whether this file is end-to-end encrypted */
  isEncrypted?: boolean;
  /** Whether a P2P upload is active for this file (recipient is downloading) */
  isUploading?: boolean;
  /** P2P upload progress 0→1 (sender sees while recipient downloads) */
  uploadProgress?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check if a MIME type is a previewable image type. */
function isImageMime(mimeType: string): boolean {
  return mimeType.startsWith('image/') && mimeType !== 'image/svg+xml';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DmFileMessage({
  fileId,
  filename,
  size,
  mimeType,
  isOutgoing = false,
  variant = 'inline',
  thumbnail,
  onDownload,
  isDownloading = false,
  isEncrypted = false,
  isUploading = false,
  uploadProgress = 0,
}: DmFileMessageProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const typeIcon = getFileTypeIcon(mimeType);
  const showImagePreview = isImageMime(mimeType) && thumbnail;

  // ── Spinning animation for download ring ──
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDownloading) {
      spinAnim.setValue(0);
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isDownloading, spinAnim]);

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Inverse colours are ONLY used when the card sits inside an outgoing
  // ChatBubble (variant === 'bubble' && isOutgoing). The outgoing bubble
  // uses accent.primary as its bg:
  //   Light mode → dark bubble (#0C0C0E), needs light text
  //   Dark mode  → light bubble (#B8B8C0), needs dark text
  //
  // In every other situation (inline / compact mode, or incoming messages)
  // the card renders on the page canvas or a light surface, so we use the
  // standard theme colours — dark text on light bg.
  const needsInverse = variant === 'bubble' && isOutgoing;
  const isLight = theme.mode === 'light';

  let cardBg: string;
  let cardBorder: string;
  let textPrimary: string;
  let textMuted: string;
  let iconBg: string;
  let accentColor: string;

  if (needsInverse) {
    // Inside an outgoing bubble — overlay on the accent-primary bg
    cardBg = isLight ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)';
    cardBorder = isLight ? 'rgba(255, 255, 255, 0.30)' : 'rgba(0, 0, 0, 0.20)';
    textPrimary = colors.text.inverse;
    textMuted = isLight ? 'rgba(255, 255, 255, 0.70)' : 'rgba(0, 0, 0, 0.55)';
    iconBg = isLight ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.10)';
    accentColor = colors.text.inverse;
  } else {
    // Inline mode OR incoming bubble — standard theme colours on canvas/surface
    cardBg = colors.background.surface;
    cardBorder = colors.border.subtle;
    textPrimary = colors.text.primary;
    textMuted = colors.text.muted;
    iconBg = typeIcon.color + '1A';
    accentColor = colors.accent.primary;
  }

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 10,
        overflow: 'hidden',
        maxWidth: 280,
        borderWidth: 1,
        borderColor: cardBorder,
      }}
    >
      {/* Image thumbnail preview */}
      {showImagePreview && (
        <Image
          source={{ uri: thumbnail }}
          style={{
            width: '100%',
            height: 160,
            borderTopLeftRadius: 9,
            borderTopRightRadius: 9,
          }}
          resizeMode="cover"
        />
      )}

      {/* File info bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 10,
          gap: 10,
        }}
      >
        {/* File type icon */}
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: iconBg,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text size="lg">{typeIcon.icon}</Text>
        </View>

        {/* File info */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            size="sm"
            weight="medium"
            numberOfLines={1}
            style={{ color: textPrimary }}
          >
            {filename}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
            <Text size="xs" style={{ color: textMuted }}>
              {formatFileSize(size)}
              {isUploading
                ? ` · Sending ${Math.round(uploadProgress * 100)}%`
                : ` · ${typeIcon.label}`}
            </Text>
            {isEncrypted && (
              <LockIcon size={10} color={accentColor} />
            )}
          </View>
        </View>

        {/* Download button / spinning progress ring */}
        {onDownload && !isUploading && (
          <Pressable
            onPress={() => { if (!isDownloading) onDownload(fileId); }}
            disabled={isDownloading}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isDownloading ? 'transparent' : accentColor + '1A',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isDownloading ? (
              <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                {/* Spinning arc ring */}
                <Animated.View
                  style={{
                    position: 'absolute',
                    width: 28,
                    height: 28,
                    transform: [{ rotate: spinInterpolation }],
                  }}
                >
                  <Svg width={28} height={28} viewBox="0 0 28 28">
                    {/* Background track */}
                    <Circle
                      cx={14}
                      cy={14}
                      r={12}
                      stroke={accentColor + '30'}
                      strokeWidth={2}
                      fill="none"
                    />
                    {/* Spinning arc (~30% of circle) */}
                    <Circle
                      cx={14}
                      cy={14}
                      r={12}
                      stroke={accentColor}
                      strokeWidth={2}
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 12 * 0.3} ${2 * Math.PI * 12 * 0.7}`}
                    />
                  </Svg>
                </Animated.View>
                {/* Center icon (dimmed) */}
                <DownloadIcon size={11} color={accentColor} />
              </View>
            ) : (
              <DownloadIcon size={14} color={accentColor} />
            )}
          </Pressable>
        )}
      </View>

      {/* P2P upload progress bar — visible when recipient is downloading */}
      {isUploading && (
        <View
          style={{
            height: 3,
            backgroundColor: needsInverse
              ? (isLight ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)')
              : cardBorder,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.round(uploadProgress * 100)}%`,
              height: '100%',
              backgroundColor: needsInverse ? colors.text.inverse : accentColor,
              borderRadius: 2,
            }}
          />
        </View>
      )}
    </View>
  );
}
