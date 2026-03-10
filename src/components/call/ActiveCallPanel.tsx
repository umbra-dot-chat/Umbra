/**
 * ActiveCallPanel -- Full-size call UI with video grid, controls overlay,
 * and stats. Replaces the old WispActiveCallPanel wrapper with a new
 * composition of JustifiedVideoGrid, CallControlsOverlay, and VoiceAvatarCard.
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Text, useTheme } from '@coexist/wisp-react-native';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { CallStatsOverlay, type GhostMetadata } from '@/components/call/CallStatsOverlay';
import { JustifiedVideoGrid } from '@/components/call/JustifiedVideoGrid';
import { CallControlsOverlay } from '@/components/call/CallControlsOverlay';
import { VoiceAvatarCard } from '@/components/call/VoiceAvatarCard';
import { useSpeakerDetection } from '@/hooks/useSpeakerDetection';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDeveloperSettings } from '@/hooks/useDeveloperSettings';
import type { ActiveCall, CallStats, VideoQuality, AudioQuality } from '@/types/call';

// ── Props ────────────────────────────────────────────────────────────────────

interface ActiveCallPanelProps {
  activeCall: ActiveCall;
  localDid: string;
  videoQuality: VideoQuality;
  audioQuality: AudioQuality;
  callStats: CallStats | null;
  ghostMetadata: GhostMetadata | null;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  onSwitchCamera: () => void;
  onVideoQualityChange: (quality: VideoQuality) => void;
  onAudioQualityChange: (quality: AudioQuality) => void;
  onSettings?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ActiveCallPanel({
  activeCall,
  localDid,
  callStats,
  ghostMetadata,
  isScreenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
}: ActiveCallPanelProps) {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { height: windowHeight } = useWindowDimensions();
  const maxHeight = Math.round(windowHeight * (isMobile ? 0.30 : 0.55));

  const { statsOverlay } = useDeveloperSettings();
  const [showStats, setShowStats] = useState(statsOverlay || __DEV__);

  // Speaker detection from participant streams
  const { activeSpeakerDid, speakingDids } = useSpeakerDetection(activeCall.participants);

  // Build participant array from the Map
  const participantList = useMemo(
    () => Array.from(activeCall.participants.values()),
    [activeCall.participants],
  );

  const hasVideo = activeCall.callType === 'video';

  return (
    <View
      style={{
        maxHeight,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
        backgroundColor: theme.colors.background.sunken,
      }}
    >
      <SlotRenderer slot="voice-call-header" />

      {/* Main call area */}
      <View style={{ flex: 1, position: 'relative' }}>
        {hasVideo ? (
          <JustifiedVideoGrid
            participants={participantList}
            selfViewVisible={activeCall.selfViewVisible}
            localDid={localDid}
            activeSpeakerDid={activeSpeakerDid}
            speakingDids={speakingDids}
          />
        ) : (
          /* Voice-only: render avatar cards in a simple flex grid */
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              alignContent: 'center',
              gap: 12,
              padding: 12,
              backgroundColor: theme.colors.background.sunken,
            }}
          >
            {participantList.map((p) => (
              <VoiceAvatarCard
                key={p.did}
                participant={p}
                isSpeaking={speakingDids.has(p.did)}
                avatar={p.avatar}
              />
            ))}
          </View>
        )}

        {/* Controls overlay */}
        <CallControlsOverlay
          isMuted={activeCall.isMuted}
          isCameraOff={activeCall.isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleCamera={onToggleCamera}
          onToggleScreenShare={onToggleScreenShare}
          onEndCall={onEndCall}
        />

        {/* Stats overlay */}
        <CallStatsOverlay
          callStats={callStats}
          ghostMetadata={ghostMetadata}
          visible={showStats}
        />

        {/* Stats toggle button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle call stats"
          onPress={() => setShowStats((v) => !v)}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: theme.colors.background.overlay,
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            zIndex: 101,
          }}
        >
          <Text
            size="xs"
            weight="bold"
            style={{
              color: theme.colors.text.inverse,
              letterSpacing: 1,
              ...(Platform.OS === 'web' ? { fontFamily: 'monospace' } : {}),
            }}
          >
            STATS
          </Text>
        </Pressable>
      </View>

      {/* Plugin overlay slot */}
      <SlotRenderer
        slot="voice-call-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'box-none',
        }}
      />
    </View>
  );
}
