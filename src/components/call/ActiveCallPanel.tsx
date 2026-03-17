/**
 * ActiveCallPanel -- Full-size call UI with video grid, controls overlay,
 * and stats. Replaces the old WispActiveCallPanel wrapper with a new
 * composition of JustifiedVideoGrid, CallControlsOverlay, and VoiceAvatarCard.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Box, Button, Text, SegmentedControl, VideoTile, useTheme } from '@coexist/wisp-react-native';
import { SlotRenderer } from '@/components/plugins/SlotRenderer';
import { CallStatsOverlay, type GhostMetadata } from '@/components/call/CallStatsOverlay';
import { JustifiedVideoGrid, computeLayout } from '@/components/call/JustifiedVideoGrid';
import { CallControlsOverlay } from '@/components/call/CallControlsOverlay';
import { VoiceAvatarCard } from '@/components/call/VoiceAvatarCard';
import { useSpeakerDetection } from '@/hooks/useSpeakerDetection';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDeveloperSettings } from '@/hooks/useDeveloperSettings';
import type { ActiveCall, CallStats, VideoQuality, AudioQuality } from '@/types/call';
import { dbg } from '@/utils/debug';

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
  if (__DEV__) dbg.trackRender('ActiveCallPanel');
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
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

  // Count visible tiles (matching JustifiedVideoGrid's logic)
  const tileCount = useMemo(() => {
    const remote = participantList.filter((p) => p.did !== localDid);
    const local = participantList.find((p) => p.did === localDid);
    let count = remote.length;
    if (activeCall.selfViewVisible && local) count += 1;
    return count;
  }, [participantList, localDid, activeCall.selfViewVisible]);

  // Height for the always-visible controls bar below the video area
  const CONTROLS_BAR_HEIGHT = 52;

  // Compute the panel height to fit video tiles + controls bar.
  // For video grid mode, we estimate content height using computeLayout
  // so the panel only takes the space the tiles need, capped at maxHeight.
  // For screen-share or voice-only modes, use the full maxHeight.
  const panelHeight = useMemo(() => {
    if (!showingVideoGrid || tileCount === 0) return maxHeight;

    const gap = 8; // Must match JustifiedVideoGrid default gap
    const ar = 16 / 9; // Must match JustifiedVideoGrid default aspectRatio
    const padH = 16; // Must match JustifiedVideoGrid padH
    const padV = 10; // Must match JustifiedVideoGrid padV
    const isAdaptive1v1 = tileCount === 2;

    const estimatedWidth = windowWidth;

    // Adjust for extra padding beyond gap (same logic as JustifiedVideoGrid)
    const extraH = (padH - gap) * 2;
    const extraV = (padV - gap) * 2;
    const maxVideoH = maxHeight - CONTROLS_BAR_HEIGHT;
    const layout = computeLayout(estimatedWidth - extraH, maxVideoH - extraV, tileCount, ar, gap);

    let tileH = layout.tileH;
    if (isAdaptive1v1) {
      const tileW = (estimatedWidth - padH * 2 - gap) / 2;
      tileH = tileW / ar;
    }

    // Content height = rows of tiles + inter-tile gaps + outer padding
    const contentH = layout.rows * tileH + gap * (layout.rows - 1) + padV * 2;
    return Math.round(Math.max(Math.min(contentH + CONTROLS_BAR_HEIGHT, maxHeight), 120));
  }, [showingVideoGrid, tileCount, windowWidth, maxHeight]);

  return (
    <Box
      height={panelHeight}
      style={{
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
        backgroundColor: '#000000',
      }}
    >
      <SlotRenderer slot="voice-call-header" />

      {/* Main call area */}
      <Box style={{ flex: 1, position: 'relative' }}>
        {/* Screen share tab bar */}
        {anyScreenSharing && hasVideo && (
          <Box px={12} pt={8} style={{ zIndex: 20 }} accessibilityRole="tablist" accessibilityLabel="Screen share view">
            <SegmentedControl
              options={screenTabOptions}
              value={screenTab}
              onChange={setScreenTab}
              size="sm"
            />
          </Box>
        )}

        {hasVideo ? (
          anyScreenSharing && screenTab === 'screen' && screenShareStream ? (
            /* Screen share view: full-width tile with the shared screen */
            <Box p={8} style={{ flex: 1 }}>
              <VideoTile
                stream={screenShareStream}
                displayName="Screen Share"
                isMuted={false}
                isCameraOff={false}
                isSpeaking={false}
                size="full"
                style={{ flex: 1, borderRadius: 12 }}
              />
            </Box>
          ) : (
            <JustifiedVideoGrid
              participants={participantList}
              selfViewVisible={activeCall.selfViewVisible}
              localDid={localDid}
              activeSpeakerDid={activeSpeakerDid}
              speakingDids={speakingDids}
            />
          )
        ) : (
          /* Voice-only: render avatar cards in a simple flex grid */
          <Box
            p={12}
            style={{
              flex: 1,
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              alignContent: 'center',
              gap: 12,
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
          </Box>
        )}

        {/* Stats overlay */}
        <CallStatsOverlay
          callStats={callStats}
          ghostMetadata={ghostMetadata}
          visible={showStats}
        />

        {/* Stats toggle button */}
        <Button
          variant="tertiary"
          size="xs"
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
            height: 'auto',
          } as any}
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
        </Button>
      </Box>

      {/* Controls bar — always visible, below the video area */}
      <Box style={{ position: 'relative', zIndex: 20 }}>
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
      </Box>

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
    </Box>
  );
}
