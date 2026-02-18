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
import { View, Pressable } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { useVoiceChannel } from '@/contexts/VoiceChannelContext';
import { RadioIcon, MicIcon, MicOffIcon, VolumeIcon, VolumeMuteIcon, PhoneOffIcon } from '@/components/icons';

export function VoiceChannelBar() {
  const {
    activeChannelId,
    activeChannelName,
    isMuted,
    isDeafened,
    isConnecting,
    toggleMute,
    toggleDeafen,
    leaveVoiceChannel,
  } = useVoiceChannel();
  const { theme } = useTheme();
  const c = theme.colors;

  if (!activeChannelId) return null;

  return (
    <View
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <RadioIcon size={12} color={isConnecting ? c.text.muted : c.status.success} />
        <Text size="xs" weight="semibold" style={{ color: isConnecting ? c.text.muted : c.status.success }}>
          {isConnecting ? 'Connecting…' : 'Voice Connected'}
        </Text>
      </View>

      {/* Row 2 — Channel name + controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text
          size="xs"
          numberOfLines={1}
          style={{ color: c.text.muted, flex: 1, marginRight: 8 }}
        >
          {activeChannelName ?? activeChannelId}
        </Text>

        {/* Mute */}
        <Pressable
          onPress={toggleMute}
          accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
          accessibilityRole="button"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isMuted ? 'rgba(231,76,60,0.15)' : 'transparent',
          }}
        >
          {isMuted ? (
            <MicOffIcon size={15} color={c.status.danger} />
          ) : (
            <MicIcon size={15} color={c.text.secondary} />
          )}
        </Pressable>

        {/* Deafen */}
        <Pressable
          onPress={toggleDeafen}
          accessibilityLabel={isDeafened ? 'Undeafen' : 'Deafen'}
          accessibilityRole="button"
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDeafened ? 'rgba(231,76,60,0.15)' : 'transparent',
          }}
        >
          {isDeafened ? (
            <VolumeMuteIcon size={15} color={c.status.danger} />
          ) : (
            <VolumeIcon size={15} color={c.text.secondary} />
          )}
        </Pressable>

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
      </View>
    </View>
  );
}
