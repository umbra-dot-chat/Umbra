/**
 * ActiveCallPanel — Wraps the Wisp ActiveCallPanel with call context data.
 *
 * Shown when the current conversation matches the active call.
 * Displays the full video + controls UI.
 */

import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { ActiveCallPanel as WispActiveCallPanel } from '@coexist/wisp-react-native';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { CallStatsOverlay, type GhostMetadata } from '@/components/call/CallStatsOverlay';
import { useDeveloperSettings } from '@/hooks/useDeveloperSettings';
import type { ActiveCall, CallStats, VideoQuality, AudioQuality } from '@/types/call';

interface ActiveCallPanelProps {
  activeCall: ActiveCall;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  callStats: CallStats | null;
  ghostMetadata: GhostMetadata | null;
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
  callStats,
  ghostMetadata,
  onToggleMute,
  onToggleCamera,
  onEndCall,
  onSwitchCamera,
  onSettings,
}: ActiveCallPanelProps) {
  const { statsOverlay } = useDeveloperSettings();
  const [showStats, setShowStats] = useState(statsOverlay || __DEV__);

  return (
    <View style={{ flex: 2, position: 'relative', overflow: 'hidden', zIndex: 10 }}>
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
      <CallStatsOverlay
        callStats={callStats}
        ghostMetadata={ghostMetadata}
        visible={showStats}
      />
      <TouchableOpacity
        style={statsStyles.toggle}
        onPress={() => setShowStats(v => !v)}
        activeOpacity={0.7}
      >
        <Text style={statsStyles.toggleText}>{showStats ? 'STATS' : 'STATS'}</Text>
      </TouchableOpacity>
      <SlotRenderer
        slot="voice-call-overlay"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'box-none' }}
      />
    </View>
  );
}

const statsStyles = StyleSheet.create({
  toggle: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 101,
  },
  toggleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    ...(Platform.OS === 'web' ? { fontFamily: 'monospace' } : {}),
  },
});
