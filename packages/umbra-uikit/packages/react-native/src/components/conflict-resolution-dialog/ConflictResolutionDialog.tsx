import React, { forwardRef, useMemo, useState } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConflictVersion {
  modifiedAt: string;
  modifiedBy: string;
  size: number;
}

export interface ConflictResolutionDialogProps {
  open: boolean;
  filename: string;
  localVersion: ConflictVersion;
  remoteVersion: ConflictVersion;
  onKeepLocal: () => void;
  onKeepRemote: () => void;
  onKeepBoth: () => void;
  onClose?: () => void;
  skeleton?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

// ---------------------------------------------------------------------------
// ConflictResolutionDialog
// ---------------------------------------------------------------------------

export const ConflictResolutionDialog = forwardRef<View, ConflictResolutionDialogProps>(
  function ConflictResolutionDialog(
    {
      open,
      filename,
      localVersion,
      remoteVersion,
      onKeepLocal,
      onKeepRemote,
      onKeepBoth,
      onClose,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;
    const [selected, setSelected] = useState<'local' | 'remote' | null>(null);

    if (!open) return null;

    const versionCard = (title: string, version: ConflictVersion, key: 'local' | 'remote') => (
      <Pressable
        onPress={() => setSelected(key)}
        style={{
          flex: 1,
          borderRadius: defaultRadii.md,
          borderWidth: 1,
          borderColor: selected === key ? tc.accent.primary : tc.border.subtle,
          backgroundColor: tc.background.surface,
          padding: defaultSpacing.md,
          gap: defaultSpacing.sm,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title} version`}
      >
        <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: '600', color: tc.text.primary } as TextStyle}>
          {title}
        </RNText>
        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
          Modified: {formatDate(version.modifiedAt)}
        </RNText>
        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
          By: {version.modifiedBy}
        </RNText>
        <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
          Size: {formatSize(version.size)}
        </RNText>
      </Pressable>
    );

    const buttonStyle = (primary: boolean): ViewStyle => ({
      borderRadius: defaultRadii.md,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      backgroundColor: primary ? tc.accent.primary : 'transparent',
      borderWidth: primary ? 0 : 1,
      borderColor: tc.border.subtle,
    });

    return (
      <View ref={ref} style={[{ gap: defaultSpacing.md }, userStyle]}>
        {/* Warning */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm,
          padding: defaultSpacing.sm, borderRadius: defaultRadii.md,
          borderWidth: 1, borderColor: tc.status.warning, backgroundColor: tc.status.warning + '1A',
        }}>
          <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.primary } as TextStyle}>
            {'\u26A0'} Conflict detected for {filename}
          </RNText>
        </View>

        {/* Comparison */}
        <View style={{ flexDirection: 'row', gap: defaultSpacing.md }}>
          {versionCard('Local', localVersion, 'local')}
          {versionCard('Remote', remoteVersion, 'remote')}
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: defaultSpacing.sm }}>
          <Pressable onPress={onKeepBoth} style={buttonStyle(false)}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.text.secondary } as TextStyle}>Keep Both</RNText>
          </Pressable>
          <Pressable onPress={onKeepLocal} style={buttonStyle(true)}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.brand.text } as TextStyle}>Keep Local</RNText>
          </Pressable>
          <Pressable onPress={onKeepRemote} style={buttonStyle(true)}>
            <RNText style={{ fontSize: defaultTypography.sizes.sm.fontSize, color: tc.brand.text } as TextStyle}>Keep Remote</RNText>
          </Pressable>
        </View>
      </View>
    );
  },
);

ConflictResolutionDialog.displayName = 'ConflictResolutionDialog';
