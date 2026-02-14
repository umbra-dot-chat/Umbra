/**
 * IncomingCallOverlay — Full-screen overlay for incoming call notifications.
 *
 * Shows caller name, call type, and accept/decline buttons.
 * Uses Wisp Overlay for backdrop and custom call notification UI.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Avatar, Text, useTheme } from '@coexist/wisp-react-native';
import { useCall } from '@/hooks/useCall';
import { PhoneIcon, PhoneOffIcon, VideoIcon } from '@/components/icons';

export function IncomingCallOverlay() {
  const { activeCall, acceptCall, endCall } = useCall();
  const { theme } = useTheme();
  const themeColors = theme.colors;

  if (!activeCall || activeCall.status !== 'incoming') return null;

  const isVideo = activeCall.callType === 'video';

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: themeColors.surface.primary,
          borderRadius: 16,
          padding: 32,
          alignItems: 'center',
          gap: 16,
          minWidth: 300,
          maxWidth: 400,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 24,
          elevation: 10,
        }}
      >
        <Avatar name={activeCall.remoteDisplayName} size="xl" />

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text size="lg" weight="bold" style={{ color: themeColors.text.primary }}>
            {activeCall.remoteDisplayName}
          </Text>
          <Text size="sm" style={{ color: themeColors.text.secondary }}>
            Incoming {isVideo ? 'video' : 'voice'} call...
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 32, marginTop: 16 }}>
          {/* Decline */}
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => endCall('declined')}
              accessibilityRole="button"
              accessibilityLabel="Decline call"
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: themeColors.status.danger,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PhoneOffIcon size={24} color="#FFFFFF" />
            </Pressable>
            <Text size="xs" style={{ color: themeColors.text.secondary }}>Decline</Text>
          </View>

          {/* Accept */}
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => acceptCall()}
              accessibilityRole="button"
              accessibilityLabel="Accept call"
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: themeColors.status.success,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isVideo ? (
                <VideoIcon size={24} color="#FFFFFF" />
              ) : (
                <PhoneIcon size={24} color="#FFFFFF" />
              )}
            </Pressable>
            <Text size="xs" style={{ color: themeColors.text.secondary }}>Accept</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
