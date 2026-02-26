/**
 * ActiveCallPanel — Wraps the Wisp ActiveCallPanel with call context data.
 *
 * Shown when the current conversation matches the active call.
 * Displays the full video + controls UI.
 */

import React from 'react';
import { View } from 'react-native';
import { ActiveCallPanel as WispActiveCallPanel } from '@coexist/wisp-react-native';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import type { ActiveCall, CallStats, VideoQuality, AudioQuality } from '@/types/call';

interface ActiveCallPanelProps {
  activeCall: ActiveCall;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  callStats: CallStats | null;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onEndCall: () => void;
  onSwitchCamera: () => void;
  onVideoQualityChange: (quality: VideoQuality) => void;
  onAudioQualityChange: (quality: AudioQuality) => void;
  onSettings?: () => void;
}

export function ActiveCallPanel({
  activeCall,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  onSwitchCamera,
  onSettings,
}: ActiveCallPanelProps) {
  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <SlotRenderer slot="voice-call-header" />
      <WispActiveCallPanel
        localStream={activeCall.localStream}
        remoteStream={activeCall.remoteStream}
        callerName={activeCall.remoteDisplayName}
        callType={activeCall.callType}
        isMuted={activeCall.isMuted}
        isCameraOff={activeCall.isCameraOff}
        connectedAt={activeCall.connectedAt}
        onToggleMute={onToggleMute}
        onToggleCamera={onToggleCamera}
        onEndCall={onEndCall}
        onSwitchCamera={onSwitchCamera}
        onSettings={onSettings}
      />
      <SlotRenderer
        slot="voice-call-overlay"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}
      />
    </View>
  );
}
