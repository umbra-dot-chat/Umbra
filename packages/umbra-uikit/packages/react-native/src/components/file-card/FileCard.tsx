import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable, Image } from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileCardProps {
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  downloadCount?: number;
  uploadedBy?: string;
  uploadedAt?: string;
  version?: number;
  onPress?: () => void;
  onDownload?: () => void;
  selected?: boolean;
  skeleton?: boolean;
  syncStatus?: 'synced' | 'syncing' | 'downloading' | 'error';
  transferProgress?: number;
  encrypted?: boolean;
  peerCount?: number;
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
// FileCard
// ---------------------------------------------------------------------------

export const FileCard = forwardRef<View, FileCardProps>(function FileCard(
  {
    name,
    size,
    mimeType,
    thumbnail,
    downloadCount,
    uploadedBy,
    uploadedAt,
    version,
    onPress,
    onDownload,
    selected = false,
    skeleton = false,
    syncStatus,
    transferProgress,
    encrypted = false,
    peerCount,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const cardStyle = useMemo<ViewStyle>(() => ({
    borderRadius: defaultRadii.lg,
    borderWidth: 1,
    borderColor: selected ? tc.accent.primary : tc.border.subtle,
    backgroundColor: tc.background.surface,
    overflow: 'hidden',
  }), [tc, selected]);

  const thumbnailAreaStyle = useMemo<ViewStyle>(() => ({
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tc.background.raised,
  }), [tc]);

  const bodyStyle = useMemo<ViewStyle>(() => ({
    padding: defaultSpacing.sm,
    gap: 2,
  }), []);

  if (skeleton) {
    return (
      <View
        ref={ref}
        style={[{
          height: 160,
          borderRadius: defaultRadii.lg,
          backgroundColor: tc.border.subtle,
        }, userStyle]}
      />
    );
  }

  return (
    <Pressable ref={ref} onPress={onPress} style={[cardStyle, userStyle]} accessibilityRole="button" accessibilityLabel={name}>
      {/* Thumbnail area */}
      <View style={thumbnailAreaStyle}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={{ width: '100%', height: '100%' } as ImageStyle}
            resizeMode="cover"
          />
        ) : (
          <RNText style={{ fontSize: 28 }}>{getFileIcon(mimeType)}</RNText>
        )}
        {/* Transfer progress bar */}
        {transferProgress != null && transferProgress < 100 && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: tc.border.subtle }}>
            <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, transferProgress))}%`, backgroundColor: tc.accent.primary } as ViewStyle} />
          </View>
        )}
        {/* Encrypted lock indicator */}
        {encrypted && (
          <View style={{ position: 'absolute', top: 6, left: 6, width: 18, height: 18, borderRadius: defaultRadii.md, backgroundColor: tc.background.surface, alignItems: 'center', justifyContent: 'center' }}>
            <RNText style={{ fontSize: 10 }}>{'\uD83D\uDD12'}</RNText>
          </View>
        )}
        {/* Sync status dot */}
        {syncStatus && (
          <View style={{
            position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: defaultRadii.full,
            backgroundColor: syncStatus === 'synced' ? tc.status.success : syncStatus === 'error' ? tc.status.danger : tc.accent.primary,
          }} />
        )}
      </View>

      {/* Body */}
      <View style={bodyStyle}>
        <RNText numberOfLines={1} style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: '500', color: tc.text.primary } as TextStyle}>
          {name}
        </RNText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
            {formatSize(size)}
          </RNText>
          {downloadCount != null && (
            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
              {'\u00B7'} {downloadCount} {downloadCount === 1 ? 'download' : 'downloads'}
            </RNText>
          )}
          {version != null && (
            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
              {'\u00B7'} v{version}
            </RNText>
          )}
          {peerCount != null && (
            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
              {'\u00B7'} {peerCount} {peerCount === 1 ? 'peer' : 'peers'}
            </RNText>
          )}
        </View>
      </View>
    </Pressable>
  );
});

FileCard.displayName = 'FileCard';
