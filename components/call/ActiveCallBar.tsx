/**
 * ActiveCallBar — Compact bar shown during an active call.
 *
 * Displays caller info, call timer, mute/camera toggles, and end call button.
 * Shown between ChatHeader and chat area when a call is connected or connecting.
 */

import React from 'react';
import { View, Pressable } from 'react-native';
import { Avatar, Text, CallTimer, useTheme } from '@coexist/wisp-react-native';
import { useCall } from '@/hooks/useCall';
import {
  PhoneOffIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  PhoneIcon,
} from '@/components/icons';
import Svg, { Path } from 'react-native-svg';

function MicIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </Svg>
  );
}

export function ActiveCallBar() {
  const { activeCall, toggleMute, toggleCamera, endCall } = useCall();
  const { theme } = useTheme();
  const themeColors = theme.colors;

  if (!activeCall) return null;

  const showBar = activeCall.status === 'outgoing' ||
    activeCall.status === 'connecting' ||
    activeCall.status === 'connected' ||
    activeCall.status === 'reconnecting';

  if (!showBar) return null;

  const statusLabel = (() => {
    switch (activeCall.status) {
      case 'outgoing': return 'Calling...';
      case 'connecting': return 'Connecting...';
      case 'reconnecting': return 'Reconnecting...';
      default: return null;
    }
  })();

  const isVideo = activeCall.callType === 'video';
  const buttonSize = 32;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themeColors.status.success,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 12,
      }}
    >
      {/* Caller info */}
      <Avatar name={activeCall.remoteDisplayName} size="xs" />
      <View style={{ flex: 1, gap: 2 }}>
        <Text size="sm" weight="semibold" style={{ color: '#FFFFFF' }}>
          {activeCall.remoteDisplayName}
        </Text>
        {statusLabel ? (
          <Text size="xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {statusLabel}
          </Text>
        ) : activeCall.connectedAt ? (
          <CallTimer startedAt={activeCall.connectedAt} size="sm" color="rgba(255,255,255,0.8)" />
        ) : null}
      </View>

      {/* Controls */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {/* Mute toggle */}
        <Pressable
          onPress={toggleMute}
          accessibilityRole="button"
          accessibilityLabel={activeCall.isMuted ? 'Unmute' : 'Mute'}
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: activeCall.isMuted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activeCall.isMuted ? (
            <MicOffIcon size={16} color="#FFFFFF" />
          ) : (
            <MicIcon size={16} color="#FFFFFF" />
          )}
        </Pressable>

        {/* Camera toggle (video calls only) */}
        {isVideo && (
          <Pressable
            onPress={toggleCamera}
            accessibilityRole="button"
            accessibilityLabel={activeCall.isCameraOff ? 'Turn on camera' : 'Turn off camera'}
            style={{
              width: buttonSize,
              height: buttonSize,
              borderRadius: buttonSize / 2,
              backgroundColor: activeCall.isCameraOff ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {activeCall.isCameraOff ? (
              <VideoOffIcon size={16} color="#FFFFFF" />
            ) : (
              <VideoIcon size={16} color="#FFFFFF" />
            )}
          </Pressable>
        )}

        {/* End call */}
        <Pressable
          onPress={() => endCall()}
          accessibilityRole="button"
          accessibilityLabel="End call"
          style={{
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: themeColors.status.danger,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PhoneOffIcon size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
