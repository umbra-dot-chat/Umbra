/**
 * SidebarCallPanel -- Minimal footer section at the bottom of ChatSidebar.
 *
 * Matches the sidebar's visual language: no card background, separated by
 * a full-width top border. Video preview preserves the stream's aspect ratio.
 *
 * Uses the shared CallControlsOverlay with variant="sidebar" for controls.
 */

import React from 'react';
import { Pressable, View } from 'react-native';
import { Avatar, CallTimer, Text, VideoTile, useTheme } from '@coexist/wisp-react-native';
import { CallControlsOverlay } from '@/components/call/CallControlsOverlay';
import type { ActiveCall } from '@/types/call';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SidebarCallPanelProps {
  activeCall: ActiveCall;
  onReturnToCall: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SidebarCallPanel({
  activeCall,
  onReturnToCall,
  onToggleMute,
  onToggleDeafen,
  onToggleCamera,
  onEndCall,
}: SidebarCallPanelProps) {
  const { theme } = useTheme();
  const colors = theme.colors;

  const isVoiceOnly = activeCall.callType === 'voice';

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        paddingTop: 10,
        paddingBottom: 8,
        paddingHorizontal: 12,
      }}
    >
      {/* Video preview — tappable to return to call */}
      <Pressable
        onPress={onReturnToCall}
        accessibilityRole="button"
        accessibilityLabel="Return to call"
        style={{
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: colors.background.sunken,
        }}
      >
        {isVoiceOnly ? (
          <View style={{
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Avatar name={activeCall.remoteDisplayName} size="sm" />
          </View>
        ) : (
          <View style={{ aspectRatio: 16 / 9, maxHeight: 120 }}>
            <VideoTile
              stream={activeCall.remoteStream}
              displayName={activeCall.remoteDisplayName}
              isMuted={false}
              isCameraOff={false}
              isSpeaking={false}
              size="full"
              fit="cover"
              showOverlay={false}
              style={{ flex: 1 }}
            />
          </View>
        )}
      </Pressable>

      {/* Info row: avatar + name + timer */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
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

      {/* Shared call controls with sidebar variant */}
      <View style={{ marginTop: 4 }}>
        <CallControlsOverlay
          isMuted={activeCall.isMuted}
          isDeafened={activeCall.isDeafened}
          isCameraOff={activeCall.isCameraOff}
          isScreenSharing={false}
          onToggleMute={onToggleMute}
          onToggleDeafen={onToggleDeafen}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={() => {}}
          onEndCall={onEndCall}
          variant="sidebar"
        />
      </View>
    </View>
  );
}
