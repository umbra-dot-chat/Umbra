/**
 * SidebarCallPanel -- Minimal footer section at the bottom of ChatSidebar.
 *
 * Matches the sidebar's visual language: no card background, separated by
 * a full-width top border. Video preview preserves the stream's aspect ratio.
 *
 * Uses the shared CallControlsOverlay with variant="sidebar" for controls.
 */

import React from 'react';
import { Pressable } from 'react-native';
import { Avatar, Box, CallTimer, Text, VideoTile, useTheme } from '@coexist/wisp-react-native';
import { CallControlsOverlay } from '@/components/call/CallControlsOverlay';
import type { ActiveCall } from '@/types/call';
import { dbg } from '@/utils/debug';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface SidebarCallPanelProps {
  activeCall: ActiveCall;
  onReturnToCall: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  /** Whether the local user is currently screen sharing */
  isScreenSharing?: boolean;
  /** Toggle screen sharing on/off */
  onToggleScreenShare?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SidebarCallPanel({
  activeCall,
  onReturnToCall,
  onToggleMute,
  onToggleDeafen,
  onToggleCamera,
  onEndCall,
  isScreenSharing = false,
  onToggleScreenShare,
}: SidebarCallPanelProps) {
  if (__DEV__) dbg.trackRender('SidebarCallPanel');
  const { theme } = useTheme();
  const colors = theme.colors;

  const isVoiceOnly = activeCall.callType === 'voice';

  return (
    <Box
      px={12}
      pt={10}
      pb={8}
      style={{
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
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
          <Box height={48} style={{
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Avatar name={activeCall.remoteDisplayName} size="sm" />
          </Box>
        ) : (
          <Box maxHeight={120} style={{ aspectRatio: 16 / 9 }}>
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
          </Box>
        )}
      </Pressable>

      {/* Info row: avatar + name + timer */}
      <Box height={24} style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 8,
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
      </Box>

      {/* Shared call controls with sidebar variant */}
      <Box style={{ marginTop: 4 }}>
        <CallControlsOverlay
          isMuted={activeCall.isMuted}
          isDeafened={activeCall.isDeafened}
          isCameraOff={activeCall.isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleDeafen={onToggleDeafen}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare ?? (() => {})}
          onEndCall={onEndCall}
          variant="sidebar"
        />
      </Box>
    </Box>
  );
}
