/**
 * ActiveCallBar — Compact bar shown during an active call.
 *
 * Displays caller info, call timer, and uses the Wisp CallControls component
 * for mute/camera/end-call controls in compact layout.
 * Shown between ChatHeader and chat area when a call is connected or connecting.
 */

import React from 'react';
import { View } from 'react-native';
import { Avatar, Text, useTheme, CallControls, CallTimer } from '@coexist/wisp-react-native';
import { useCall } from '@/hooks/useCall';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';

const noop = () => {};

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

  const callType = activeCall.callType === 'voice' ? 'audio' : activeCall.callType;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: themeColors.status.success,
        paddingHorizontal: 12,
        paddingVertical: 4,
        gap: 8,
      }}
    >
      {/* Caller info */}
      <Avatar name={activeCall.remoteDisplayName} size="xs" status="online" />
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

      {/* Plugin slot: voice-call-controls */}
      <SlotRenderer slot="voice-call-controls" style={{ flexDirection: 'row', alignItems: 'center' }} />

      {/* Controls — Wisp CallControls in compact layout */}
      <CallControls
        isMuted={activeCall.isMuted}
        isVideoOff={activeCall.isCameraOff}
        isScreenSharing={false}
        isSpeakerOn={true}
        onToggleMute={toggleMute}
        onToggleVideo={toggleCamera}
        onToggleScreenShare={noop}
        onToggleSpeaker={noop}
        onEndCall={() => endCall()}
        callType={callType as 'audio' | 'video'}
        layout="compact"
      />
    </View>
  );
}
