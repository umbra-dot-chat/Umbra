/**
 * SidebarCallPanel -- Fixed footer panel (~120px) at the bottom of ChatSidebar.
 *
 * Shown when there is an active call and the user has navigated away from
 * the call conversation. Displays a video thumbnail (or avatar fallback),
 * caller info with a live timer, and compact call controls.
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, CallControls, CallTimer, Text, VideoTile, useTheme } from '@coexist/wisp-react-native';
import type { ActiveCall } from '@/types/call';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SidebarCallPanelProps {
  activeCall: ActiveCall;
  onReturnToCall: () => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

const noop = () => {};

// ─── Component ──────────────────────────────────────────────────────────────

export function SidebarCallPanel({
  activeCall,
  onReturnToCall,
  onToggleMute,
  onToggleCamera,
  onEndCall,
}: SidebarCallPanelProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const isVoiceOnly = activeCall.callType === 'voice' || activeCall.isCameraOff;
  const callType = activeCall.callType === 'voice' ? 'audio' : activeCall.callType;

  return (
    <View
      style={{
        height: 120,
        backgroundColor: colors.background.raised,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        padding: 8,
      }}
    >
      {/* Video thumbnail / avatar fallback -- tappable to return to call */}
      <Pressable
        onPress={onReturnToCall}
        accessibilityRole="button"
        accessibilityLabel="Return to call"
        style={{ height: 50, borderRadius: 8, overflow: 'hidden' }}
      >
        {isVoiceOnly ? (
          <View style={{
            flex: 1,
            backgroundColor: colors.background.sunken,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
          }}>
            <Avatar name={activeCall.remoteDisplayName} size="sm" />
          </View>
        ) : (
          <VideoTile
            stream={activeCall.remoteStream}
            displayName={activeCall.remoteDisplayName}
            isMuted={false}
            isCameraOff={false}
            size="sm"
            fit="cover"
            showOverlay={false}
            style={{ flex: 1 }}
          />
        )}
      </Pressable>

      {/* Info row: avatar + name + timer */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
        paddingHorizontal: 4,
        height: 24,
      }}>
        <Avatar name={activeCall.remoteDisplayName} size="xs" />
        <Text
          size="xs"
          weight="semibold"
          numberOfLines={1}
          style={{ flex: 1, color: colors.text.primary }}
        >
          {activeCall.remoteDisplayName}
        </Text>
        {activeCall.connectedAt && (
          <CallTimer startedAt={activeCall.connectedAt} size="sm" color={colors.text.secondary} />
        )}
      </View>

      {/* Compact controls row */}
      <CallControls
        isMuted={activeCall.isMuted}
        isVideoOff={activeCall.isCameraOff}
        isScreenSharing={false}
        isSpeakerOn={true}
        onToggleMute={onToggleMute}
        onToggleVideo={onToggleCamera}
        onToggleScreenShare={noop}
        onToggleSpeaker={noop}
        onEndCall={onEndCall}
        callType={callType as 'audio' | 'video'}
        layout="compact"
        style={{ paddingVertical: 0, paddingHorizontal: 0 }}
      />
    </View>
  );
}
