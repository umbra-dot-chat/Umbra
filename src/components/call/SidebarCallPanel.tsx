/**
 * SidebarCallPanel -- Minimal footer section at the bottom of ChatSidebar.
 *
 * Matches the sidebar's visual language: no card background, separated by
 * a full-width top border. Video preview preserves the stream's aspect ratio.
 */

import React, { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
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

// ─── CSS injection (web only) ───────────────────────────────────────────────

const CSS_ID = 'sidebar-call-controls-css';

function injectSidebarControlsCSS() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(CSS_ID)) return;

  const style = document.createElement('style');
  style.id = CSS_ID;
  style.textContent = `
    /* Sidebar call controls: transparent button backgrounds */
    #sidebar-call-controls [role="button"]:not([aria-label="End call"]) {
      background-color: transparent !important;
    }
    #sidebar-call-controls [role="button"] svg {
      stroke: currentColor !important;
    }
  `;
  document.head.appendChild(style);
}

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

  // Inject CSS overrides on mount (web only)
  useEffect(() => {
    injectSidebarControlsCSS();
  }, []);

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

      {/* Compact controls */}
      <View nativeID="sidebar-call-controls" style={{ marginTop: 4 }}>
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
    </View>
  );
}
