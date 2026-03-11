/**
 * ActiveCallPanel -- Full-size call UI with video grid, controls overlay,
 * and stats. Replaces the old WispActiveCallPanel wrapper with a new
 * composition of JustifiedVideoGrid, CallControlsOverlay, and VoiceAvatarCard.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { View, Pressable, Platform, useWindowDimensions } from 'react-native';
import { Text, SegmentedControl, VideoTile, useTheme } from '@coexist/wisp-react-native';
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
  screenShareStream: MediaStream | null;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
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
  screenShareStream,
  onToggleMute,
  onToggleDeafen,
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

  // Screen share tab state
  const anyScreenSharing = isScreenSharing ||
    participantList.some((p) => p.isScreenSharing);
  const [screenTab, setScreenTab] = useState<string>('screen');

  // Are we showing the self-sizing video grid (vs screen-share or voice-only)?
  const showingScreenShare = anyScreenSharing && screenTab === 'screen' && !!screenShareStream;
  const showingVideoGrid = hasVideo && !showingScreenShare;

  // Default to "screen" tab when screen sharing starts
  useEffect(() => {
    if (anyScreenSharing) setScreenTab('screen');
  }, [anyScreenSharing]);

  const screenTabOptions = useMemo(() => [
    { value: 'screen', label: 'Screen' },
    { value: 'participants', label: 'Participants' },
  ], []);

  return (
    <View
      style={{
        maxHeight,
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
        backgroundColor: '#000000',
      }}
    >
      <SlotRenderer slot="voice-call-header" />

      {/* Main call area — position:relative anchors the absolute overlays.
           When showing the video grid, let the grid's computed height drive
           the wrapper size (no flex:1). For screen-share and voice-only modes,
           use flex:1 so content can expand into the maxHeight. */}
      <View style={{
        ...(showingVideoGrid ? { flexShrink: 1 } : { flex: 1 }),
        position: 'relative',
      }}>
        {/* Screen share tab bar */}
        {anyScreenSharing && hasVideo && (
          <View style={{ paddingHorizontal: 12, paddingTop: 8, zIndex: 20 }} accessibilityRole="tablist" accessibilityLabel="Screen share view">
            <SegmentedControl
              options={screenTabOptions}
              value={screenTab}
              onChange={setScreenTab}
              size="sm"
            />
          </View>
        )}

        {hasVideo ? (
          anyScreenSharing && screenTab === 'screen' && screenShareStream ? (
            /* Screen share view: full-width tile with the shared screen */
            <View style={{ flex: 1, padding: 8 }}>
              <VideoTile
                stream={screenShareStream}
                displayName="Screen Share"
                isMuted={false}
                isCameraOff={false}
                isSpeaking={false}
                size="full"
                style={{ flex: 1, borderRadius: 12 }}
              />
            </View>
          ) : (
            <JustifiedVideoGrid
              participants={participantList}
              selfViewVisible={activeCall.selfViewVisible}
              localDid={localDid}
              activeSpeakerDid={activeSpeakerDid}
              speakingDids={speakingDids}
              maxHeight={maxHeight}
            />
          )
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
              backgroundColor: '#000000',
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
          isDeafened={activeCall.isDeafened}
          isCameraOff={activeCall.isCameraOff}
          isScreenSharing={isScreenSharing}
          onToggleMute={onToggleMute}
          onToggleDeafen={onToggleDeafen}
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
