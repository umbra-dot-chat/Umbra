/**
 * SidebarCallPanel -- Fixed footer panel at the bottom of ChatSidebar.
 *
 * Shown when there is an active call and the user has navigated away from
 * the call conversation. Displays a video thumbnail (or avatar fallback),
 * caller info with a live timer, and compact call controls with no
 * button backgrounds (transparent) for a clean sidebar look.
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
        height: 148,
        backgroundColor: colors.background.raised,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
        padding: 8,
        justifyContent: 'space-between',
      }}
    >
      {/* Top section: Video thumbnail + info */}
      <View>
        {/* Video thumbnail / avatar fallback -- tappable to return to call */}
        <Pressable
          onPress={onReturnToCall}
          accessibilityRole="button"
          accessibilityLabel="Return to call"
          style={{ height: 40, borderRadius: 8, overflow: 'hidden' }}
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
      </View>

      {/* Spacer pushes controls to bottom */}
      <View style={{ flex: 1 }} />

      {/* Compact controls row — pinned to bottom */}
      <View nativeID="sidebar-call-controls">
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
