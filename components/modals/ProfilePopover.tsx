/**
 * ProfilePopover — User profile card popover using Wisp's UserProfileCard.
 *
 * Uses deep import for UserProfileCard since it's not in the root barrel export.
 */

import React from 'react';
import { Pressable, View, Dimensions, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Avatar, useTheme, UserProfileCard } from '@coexist/wisp-react-native';
import type { ProfileMember } from '@/hooks/useProfilePopover';

export interface ProfilePopoverProps {
  selectedMember: ProfileMember | null;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
}

export function ProfilePopover({ selectedMember, anchor, onClose }: ProfilePopoverProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  if (!selectedMember || !anchor) return null;

  // Clamp position so the card doesn't overflow the viewport
  const cardWidth = 340;
  const cardHeight = 340;
  const screen = Dimensions.get('window');
  const left = Math.min(anchor.x, screen.width - cardWidth - 16);
  const top = Math.min(anchor.y + 8, screen.height - cardHeight - 16);

  const status = selectedMember.status ?? 'offline';

  const wrapperStyle: ViewStyle = {
    position: 'absolute',
    top,
    left,
    zIndex: 9999,
    width: cardWidth,
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.25)' } as any : {}),
  };

  return (
    <>
      {/* Backdrop — press to dismiss */}
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9998,
        }}
        accessibilityRole="button"
        accessibilityLabel="Close profile"
      />

      {/* Profile card */}
      <View style={wrapperStyle} testID="UserProfileCard">
        <UserProfileCard
          name={selectedMember.name}
          username={`@${selectedMember.name.toLowerCase().replace(/\s/g, '')}`}
          avatar={<Avatar name={selectedMember.name} size="lg" />}
          status={status as any}
          bannerColor={tc.accent.primary}
          onClose={onClose}
          actions={[
            { id: 'message', label: 'Message' },
          ]}
        />
      </View>
    </>
  );
}
