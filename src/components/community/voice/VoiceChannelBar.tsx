/**
 * VoiceChannelBar — Compact bar shown at the bottom of the sidebar when
 * connected to a community voice channel.
 *
 * Two-row layout:
 * ┌──────────────────────────────────────┐
 * │ ● Voice Connected                    │
 * │   channel-name  [🎤] [🔇] [📞]     │
 * └──────────────────────────────────────┘
 */

import React from 'react';
import { Pressable } from 'react-native';
import { Box, Text, useTheme } from '@coexist/wisp-react-native';
import { useVoiceChannel } from '@/contexts/VoiceChannelContext';
import { RadioIcon, PhoneOffIcon } from '@/components/ui';
import { dbg } from '@/utils/debug';

export function VoiceChannelBar() {
  if (__DEV__) dbg.trackRender('VoiceChannelBar');
  const {
    activeChannelId,
    activeChannelName,
    isConnecting,
    leaveVoiceChannel,
  } = useVoiceChannel();
  const { theme } = useTheme();
  const c = theme.colors;

  if (!activeChannelId) return null;

  return (
    <Box
      style={{
        borderTopWidth: 1,
        borderTopColor: c.border.subtle,
        backgroundColor: c.background.sunken,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 4,
      }}
    >
      {/* Row 1 — Status */}
      <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <RadioIcon size={12} color={isConnecting ? c.text.muted : c.status.success} />
        <Text size="xs" weight="semibold" style={{ color: isConnecting ? c.text.muted : c.status.success }}>
          {isConnecting ? 'Connecting…' : 'Voice Connected'}
        </Text>
      </Box>

      {/* Row 2 — Channel name + controls */}
      <Box style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          size="xs"
          numberOfLines={1}
          style={{ color: c.text.muted, flex: 1, marginRight: 8 }}
        >
          {activeChannelName ?? activeChannelId}
        </Text>

        {/* Leave */}
        <Pressable
          onPress={leaveVoiceChannel}
          accessibilityLabel="Leave voice channel"
          accessibilityRole="button"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneOffIcon size={15} color={c.status.danger} />
        </Pressable>
      </Box>
    </Box>
  );
}
