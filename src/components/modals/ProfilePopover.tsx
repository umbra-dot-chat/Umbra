/**
 * ProfilePopover — User profile card popover using Wisp's UserProfileCard.
 *
 * Uses deep import for UserProfileCard since it's not in the root barrel export.
 */

import React from 'react';
import { Pressable, Dimensions, Platform } from 'react-native';
import type { ViewStyle } from 'react-native';
import { Avatar, Box, useTheme, UserProfileCard } from '@coexist/wisp-react-native';
import type { ProfileMember } from '@/hooks/useProfilePopover';
import { useTranslation } from 'react-i18next';
import { dbg } from '@/utils/debug';

export interface ProfilePopoverProps {
  selectedMember: ProfileMember | null;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
}

export function ProfilePopover({ selectedMember, anchor, onClose }: ProfilePopoverProps) {
  if (__DEV__) dbg.trackRender('ProfilePopover');
  const { theme } = useTheme();
  const tc = theme.colors;
  const { t } = useTranslation('common');

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
    ...(Platform.OS === 'web' ? { boxShadow: `0 8px 32px ${tc.background.overlay}` } as any : {
      shadowColor: tc.background.overlay,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 8,
    }),
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
        accessibilityLabel={t('closeProfile')}
      />

      {/* Profile card */}
      <Box style={wrapperStyle} testID="UserProfileCard">
        <UserProfileCard
          name={selectedMember.name}
          username={`@${selectedMember.name.toLowerCase().replace(/\s/g, '')}`}
          avatar={<Avatar name={selectedMember.name} src={selectedMember.avatar} size="lg" status={status === 'online' ? 'online' : status === 'idle' ? 'away' : undefined} />}
          status={status as any}
          // TODO: Pass statusText once ProfileMember carries custom status data
          // from the backend. Currently only the local user can set a custom status
          // via SettingsDialog; other members' custom statuses aren't synced yet.
          // statusText={selectedMember.statusText}
          bannerColor={tc.accent.primary}
          onClose={onClose}
          actions={[
            { id: 'message', label: t('friends:message') },
          ]}
        />
      </Box>
    </>
  );
}
