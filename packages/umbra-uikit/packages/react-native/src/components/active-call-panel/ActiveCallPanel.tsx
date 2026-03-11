/**
 * ActiveCallPanel — Main in-call UI with remote video, local PiP, controls, and timer.
 *
 * Composes with `<CallControls>` for the control bar instead of building custom buttons.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text } from '../../primitives';
import { CallTimer } from '../../primitives/call-timer';
import { VideoTile } from '../video-tile';
import { CallControls } from '../call-controls';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// SVG Icons (only SettingsIcon — controls icons live in CallControls)
// ---------------------------------------------------------------------------

function SettingsIcon({ size = 20, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <Circle cx={12} cy={12} r={3} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Noop helper
// ---------------------------------------------------------------------------
const noop = () => {};

// ---------------------------------------------------------------------------
// ActiveCallPanel
// ---------------------------------------------------------------------------

export interface ActiveCallPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callerName: string;
  callerAvatar?: string;
  callType: 'voice' | 'video';
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing?: boolean;
  isSpeakerOn?: boolean;
  connectedAt: number | null;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onToggleScreenShare?: () => void;
  onToggleSpeaker?: () => void;
  onSwitchCamera?: () => void;
  onMinimize?: () => void;
  onSettings?: () => void;
  style?: ViewStyle;
}

export const ActiveCallPanel = forwardRef<View, ActiveCallPanelProps>(function ActiveCallPanel(
  {
    localStream,
    remoteStream,
    callerName,
    callType,
    isMuted,
    isCameraOff,
    isScreenSharing = false,
    isSpeakerOn = true,
    connectedAt,
    onToggleMute,
    onToggleCamera,
    onEndCall,
    onToggleScreenShare,
    onToggleSpeaker,
    onSwitchCamera,
    onMinimize,
    onSettings,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;

  const isVideo = callType === 'video';

  // Map 'voice' → 'audio' for CallControls
  const controlsCallType = callType === 'voice' ? 'audio' : callType;

  const containerStyle = useMemo<ViewStyle>(() => ({
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  }), []);

  const videoAreaStyle = useMemo<ViewStyle>(() => ({
    position: 'relative',
    aspectRatio: isVideo ? 16 / 9 : undefined,
    height: isVideo ? undefined : 120,
    backgroundColor: '#000',
    ...(isVideo ? {
      margin: 16,
      borderRadius: 14,
      overflow: 'hidden' as const,
    } : {}),
  }), [isVideo]);

  const pipStyle = useMemo<ViewStyle>(() => ({
    position: 'absolute',
    top: 10,
    right: 10,
    width: 120,
    height: 90,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  }), []);

  const voiceFallbackStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }), []);

  const voiceNameStyle = useMemo<TextStyle>(() => ({
    fontSize: 18,
    fontWeight: '600',
    color: tc.text.primary,
  }), [tc]);

  const timerBarStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  }), []);

  const timerLabelStyle = useMemo<TextStyle>(() => ({
    fontSize: 12,
    color: tc.text.secondary,
  }), [tc]);

  const controlsRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
  }), []);

  const settingsCogStyle = useMemo<ViewStyle>(() => ({
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
  }), []);

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      {/* Video area */}
      <View style={videoAreaStyle}>
        {isVideo ? (
          <>
            {/* Remote video (main) */}
            <VideoTile
              stream={remoteStream}
              displayName={callerName}
              isMuted={false}
              isCameraOff={!remoteStream}
              size="full"
              showOverlay={false}
            />
            {/* Local video (PiP) */}
            <View style={pipStyle}>
              <VideoTile
                stream={localStream}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                mirror
                size="sm"
                showOverlay={false}
              />
            </View>
          </>
        ) : (
          <View style={voiceFallbackStyle}>
            <Text style={voiceNameStyle}>{callerName}</Text>
            {connectedAt ? (
              <CallTimer startedAt={connectedAt} size="md" />
            ) : (
              <Text style={timerLabelStyle}>Connecting...</Text>
            )}
          </View>
        )}

      </View>

      {/* Controls row — invisible spacer on left balances settings cog on right */}
      <View style={controlsRowStyle}>
        {/* Invisible spacer — matches settings cog width so controls stay centered */}
        {onSettings && (
          <View style={{ width: 36, height: 36, marginLeft: 12, opacity: 0 }} pointerEvents="none" />
        )}
        <CallControls
          isMuted={isMuted}
          isVideoOff={isCameraOff}
          isScreenSharing={isScreenSharing}
          isSpeakerOn={isSpeakerOn}
          onToggleMute={onToggleMute}
          onToggleVideo={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare ?? noop}
          onToggleSpeaker={onToggleSpeaker ?? noop}
          onEndCall={onEndCall}
          callType={controlsCallType}
          layout="compact"
          style={{ flex: 1 }}
        />
        {onSettings && (
          <Pressable
            style={settingsCogStyle}
            onPress={onSettings}
            accessibilityLabel="Call settings"
          >
            <SettingsIcon size={18} color="rgba(255,255,255,0.85)" />
          </Pressable>
        )}
      </View>

      {/* Timer bar (video calls only, when connected) */}
      {isVideo && connectedAt && (
        <View style={timerBarStyle}>
          <Text style={timerLabelStyle}>{callerName}</Text>
          <CallTimer startedAt={connectedAt} size="sm" />
        </View>
      )}

    </View>
  );
});

ActiveCallPanel.displayName = 'ActiveCallPanel';
