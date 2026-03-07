/**
 * GroupSettingsDialog — Modal dialog wrapper for group settings.
 *
 * Matches the pattern of SettingsDialog and CommunitySettingsDialog:
 * centered Overlay with backdrop, close button, scrollable content.
 */

import React, { useMemo } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Overlay, HStack, Text, useTheme } from '@coexist/wisp-react-native';
import { SettingsIcon, XIcon } from '@/components/ui';
import { GroupSettingsPanel } from './GroupSettingsPanel';
import { useIsMobile } from '@/hooks/useIsMobile';

export interface GroupSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  groupId?: string | null;
}

export function GroupSettingsDialog({ open, onClose, groupId }: GroupSettingsDialogProps) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const isDark = theme.name === 'dark';
  const isMobile = useIsMobile();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const modalStyle = useMemo<ViewStyle>(
    () => (isMobile ? {
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
    } : {
      width: 500,
      maxWidth: '95%',
      height: 560,
      maxHeight: '85%',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? tc.background.raised : tc.background.canvas,
      borderWidth: isDark ? 1 : 0,
      borderColor: tc.border.subtle,
    }),
    [isMobile, isDark, tc, screenWidth, screenHeight],
  );

  const headerStyle = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: tc.border.subtle,
    }),
    [tc],
  );

  if (!groupId) return null;

  return (
    <Overlay
      open={open}
      backdrop={isMobile ? undefined : 'dim'}
      center={!isMobile}
      onBackdropPress={isMobile ? undefined : onClose}
      animationType="fade"
      useModal={!isMobile}
    >
      <View style={modalStyle}>
        {/* Header */}
        <View style={headerStyle}>
          <HStack style={{ alignItems: 'center', gap: 8 }}>
            <SettingsIcon size={18} color={tc.text.primary} />
            <Text style={{ fontSize: 16, fontWeight: '600', color: tc.text.primary } as TextStyle}>
              Group Settings
            </Text>
          </HStack>
          <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close group settings">
            <XIcon size={18} color={tc.text.secondary} />
          </Pressable>
        </View>

        {/* Content — reuse existing panel */}
        <GroupSettingsPanel groupId={groupId} onClose={onClose} />
      </View>
    </Overlay>
  );
}
