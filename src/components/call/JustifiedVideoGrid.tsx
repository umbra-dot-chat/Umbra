/**
 * JustifiedVideoGrid — Arranges video tiles using a justified packing algorithm
 * that maximizes tile area while fitting all participants in the container.
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Pressable } from 'react-native';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { VideoTile, Text, useTheme } from '@coexist/wisp-react-native';
import type { CallParticipant } from '@/types/call';
import { useFullscreen } from '@/hooks/useFullscreen';
import { SpeakerBorder } from '@/components/call/SpeakerBorder';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface JustifiedVideoGridProps {
  participants: CallParticipant[];
  selfViewVisible: boolean;
  localDid: string;
  activeSpeakerDid: string | null;
  speakingDids: Set<string>;
  gap?: number;
  aspectRatio?: number;
}

// ─── Layout Algorithm ───────────────────────────────────────────────────────

interface GridLayout {
  cols: number;
  rows: number;
  tileW: number;
  tileH: number;
}

function computeLayout(
  containerW: number,
  containerH: number,
  count: number,
  aspectRatio: number,
  gap: number,
): GridLayout {
  let best: GridLayout = { cols: 1, rows: count, tileW: 0, tileH: 0 };

  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);

    // Width-constrained
    const tileW = (containerW - gap * (cols + 1)) / cols;
    const tileH = tileW / aspectRatio;
    const totalH = tileH * rows + gap * (rows + 1);
    if (totalH <= containerH && tileW * tileH > best.tileW * best.tileH) {
      best = { cols, rows, tileW, tileH };
    }

    // Height-constrained
    const tileH2 = (containerH - gap * (rows + 1)) / rows;
    const tileW2 = tileH2 * aspectRatio;
    const totalW = tileW2 * cols + gap * (cols + 1);
    if (totalW <= containerW && tileW2 * tileH2 > best.tileW * best.tileH) {
      best = { cols, rows, tileW: tileW2, tileH: tileH2 };
    }
  }

  // Enforce minimum tile dimensions so tiles are never invisibly thin
  if (best.tileW < 120) best.tileW = 120;
  if (best.tileH < 80) best.tileH = 80;

  return best;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function JustifiedVideoGrid({
  participants,
  selfViewVisible,
  localDid,
  activeSpeakerDid,
  speakingDids,
  gap = 8,
  aspectRatio = 16 / 9,
}: JustifiedVideoGridProps) {
  const { theme } = useTheme();
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const { fullscreenDid, enterFullscreen, exitFullscreen } = useFullscreen();

  // Double-tap detection: track last press time per tile
  const lastPressRef = useRef<{ did: string; time: number } | null>(null);
  const DOUBLE_TAP_THRESHOLD = 300;

  const handleTilePress = useCallback((did: string) => {
    const now = Date.now();
    const last = lastPressRef.current;
    if (last && last.did === did && now - last.time < DOUBLE_TAP_THRESHOLD) {
      // Double-tap detected
      if (fullscreenDid === did) {
        exitFullscreen();
      } else {
        enterFullscreen(did);
      }
      lastPressRef.current = null;
    } else {
      lastPressRef.current = { did, time: now };
    }
  }, [fullscreenDid, enterFullscreen, exitFullscreen]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ w: width, h: height });
  }, []);

  // Build tile list: remote participants first, self-view last
  const tiles = useMemo(() => {
    const remote = participants.filter((p) => p.did !== localDid);
    const local = participants.find((p) => p.did === localDid);
    const result = [...remote];
    if (selfViewVisible && local) {
      result.push(local);
    }
    return result;
  }, [participants, localDid, selfViewVisible]);

  const count = tiles.length;

  // 1:1 layout: equal side-by-side for all 2-participant calls
  const isAdaptive1v1 = count === 2;

  const layout = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || count === 0) {
      return null;
    }
    return computeLayout(containerSize.w, containerSize.h, count, aspectRatio, gap);
  }, [containerSize.w, containerSize.h, count, aspectRatio, gap]);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: '#000000',
  };

  const gridStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap,
    padding: gap,
  };

  // Find the fullscreen participant (if set)
  const fullscreenParticipant = fullscreenDid
    ? tiles.find((t) => t.did === fullscreenDid)
    : null;

  return (
    <View style={containerStyle} onLayout={handleLayout}>
      {/* Fullscreen mode: single tile fills the container */}
      {fullscreenParticipant ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${fullscreenParticipant.displayName} video fullscreen, double-tap or press escape to exit`}
          onPress={() => handleTilePress(fullscreenParticipant.did)}
          onLongPress={exitFullscreen}
          delayLongPress={500}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          <VideoTile
            stream={fullscreenParticipant.stream}
            displayName={fullscreenParticipant.displayName}
            isMuted={fullscreenParticipant.isMuted}
            isCameraOff={fullscreenParticipant.isCameraOff}
            isSpeaking={speakingDids.has(fullscreenParticipant.did)}
            mirror={fullscreenParticipant.did === localDid}
            size="full"
            style={{ flex: 1 }}
          />
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: theme.colors.background.overlay,
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 4,
            }}
          >
            <Text size="xs" style={{ color: theme.colors.text.inverse }}>
              Press Esc to exit
            </Text>
          </View>
        </Pressable>
      ) : (
        /* Normal grid mode */
        layout && containerSize.w > 0 && (
          <View style={gridStyle}>
            {tiles.map((participant) => {
              const isLocal = participant.did === localDid;
              const isSpeaking = speakingDids.has(participant.did);

              // Equal widths for 1v1 calls
              let tileWidth = layout.tileW;
              let tileHeight = layout.tileH;
              if (isAdaptive1v1) {
                tileWidth = (containerSize.w - gap * 3) / 2;
                tileHeight = tileWidth / aspectRatio;
              }

              // Inner tile clips the video to rounded corners
              const innerStyle: ViewStyle = {
                flex: 1,
                borderRadius: 12,
                overflow: 'hidden',
              };

              return (
                <SpeakerBorder
                  key={participant.did}
                  active={isSpeaking}
                  borderRadius={12}
                  style={{ width: tileWidth, height: tileHeight }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${participant.displayName} video tile, double-tap for fullscreen`}
                    onPress={() => handleTilePress(participant.did)}
                    onLongPress={() => enterFullscreen(participant.did)}
                    delayLongPress={500}
                    style={innerStyle}
                  >
                    <VideoTile
                      stream={participant.stream}
                      displayName={participant.displayName}
                      isMuted={participant.isMuted}
                      isCameraOff={participant.isCameraOff}
                      isSpeaking={isSpeaking}
                      mirror={isLocal}
                      size="full"
                      style={{ flex: 1 }}
                    />
                  </Pressable>
                </SpeakerBorder>
              );
            })}
          </View>
        )
      )}
    </View>
  );
}
