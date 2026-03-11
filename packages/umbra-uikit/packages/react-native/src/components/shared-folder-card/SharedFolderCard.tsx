import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable, Image } from 'react-native';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SharedFolderMember {
  did: string;
  name: string;
  avatarUrl?: string;
}

export type FolderSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SharedFolderCardProps {
  name: string;
  sharedWith: SharedFolderMember[];
  fileCount: number;
  lastSyncAt?: string;
  syncProgress: number;
  syncStatus: FolderSyncStatus;
  onPress?: () => void;
  onSync?: () => void;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// SharedFolderCard
// ---------------------------------------------------------------------------

export const SharedFolderCard = forwardRef<View, SharedFolderCardProps>(
  function SharedFolderCard(
    {
      name,
      sharedWith,
      fileCount,
      lastSyncAt,
      syncProgress,
      syncStatus,
      onPress,
      onSync,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const cardStyle = useMemo<ViewStyle>(() => ({
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: tc.border.subtle,
      backgroundColor: tc.background.surface,
      padding: defaultSpacing.md,
      gap: defaultSpacing.sm,
    }), [tc]);

    if (skeleton) {
      return (
        <View ref={ref} style={[{ height: 120, borderRadius: defaultRadii.lg, backgroundColor: tc.border.subtle }, userStyle]} />
      );
    }

    const statusColors: Record<string, string> = {
      synced: tc.status.success,
      syncing: tc.accent.primary,
      offline: tc.text.muted,
      error: tc.status.danger,
    };

    return (
      <Pressable ref={ref} onPress={onPress} style={[cardStyle, userStyle]} accessibilityRole="button" accessibilityLabel={name}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
          <RNText style={{ fontSize: 20 }}>{'\uD83D\uDCC1'}</RNText>
          <RNText numberOfLines={1} style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: '600', color: tc.text.primary, flex: 1 } as TextStyle}>
            {name}
          </RNText>
          <View style={{ width: 10, height: 10, borderRadius: defaultRadii.full, backgroundColor: statusColors[syncStatus] ?? tc.text.muted }} />
        </View>

        {/* Meta */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </RNText>
          {lastSyncAt && (
            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
              {'\u00B7'} Synced {new Date(lastSyncAt).toLocaleDateString()}
            </RNText>
          )}
        </View>

        {/* Avatars */}
        {sharedWith.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {sharedWith.slice(0, 5).map((member, i) => (
              <View key={member.did} style={{
                width: 24, height: 24, borderRadius: defaultRadii.full,
                borderWidth: 2, borderColor: tc.background.surface,
                backgroundColor: tc.background.raised,
                marginLeft: i > 0 ? -8 : 0,
                alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
              }}>
                {member.avatarUrl ? (
                  <Image source={{ uri: member.avatarUrl }} style={{ width: '100%', height: '100%' } as ImageStyle} resizeMode="cover" />
                ) : (
                  <RNText style={{ fontSize: 10, color: tc.text.muted } as TextStyle}>{member.name.charAt(0).toUpperCase()}</RNText>
                )}
              </View>
            ))}
            {sharedWith.length > 5 && (
              <View style={{
                width: 24, height: 24, borderRadius: defaultRadii.full,
                borderWidth: 2, borderColor: tc.background.surface,
                backgroundColor: tc.background.raised,
                marginLeft: -8, alignItems: 'center', justifyContent: 'center',
              }}>
                <RNText style={{ fontSize: 10, color: tc.text.muted } as TextStyle}>+{sharedWith.length - 5}</RNText>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  },
);

SharedFolderCard.displayName = 'SharedFolderCard';
