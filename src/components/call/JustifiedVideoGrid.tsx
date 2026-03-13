/**
 * JustifiedVideoGrid — Arranges video tiles using a justified packing algorithm
 * that maximizes tile area while fitting all participants in the container.
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Pressable, Platform } from 'react-native';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { Box, VideoTile, Text, useTheme } from '@coexist/wisp-react-native';
import type { CallParticipant } from '@/types/call';
import { useFullscreen } from '@/hooks/useFullscreen';
import { SpeakerBorder } from '@/components/call/SpeakerBorder';
import { VideoTileStatusIcons } from '@/components/call/VideoTileStatusIcons';
import { dbg } from '@/utils/debug';

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

export function computeLayout(
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

// ─── CSS injection (web only) ───────────────────────────────────────────────

const GRID_CSS_ID = 'video-grid-tile-css';

/**
 * Force border-radius and overflow clipping on video tiles in the grid.
 * The Wisp VideoTile uses borderRadius: 0 for size="full", and the <video>
 * element can escape overflow:hidden in some browsers. These CSS rules
 * ensure the video is properly clipped to rounded corners.
 */
function injectGridTileCSS() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(GRID_CSS_ID)) return;

  const style = document.createElement('style');
  style.id = GRID_CSS_ID;
  style.textContent = `
    /* Force video tiles in the grid to clip to rounded corners.
       Pressable renders as <button> which has browser quirks with
       overflow:hidden + border-radius. Use clip-path as a reliable
       alternative that always clips children to rounded corners. */
    #video-grid [role="button"] {
      border-radius: 12px !important;
      overflow: hidden !important;
      clip-path: inset(0 round 12px) !important;
    }
    #video-grid [role="button"] > div {
      border-radius: 12px !important;
      overflow: hidden !important;
    }
    #video-grid video {
      border-radius: 12px !important;
    }
  `;
  document.head.appendChild(style);
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
  if (__DEV__) dbg.trackRender('JustifiedVideoGrid');
  const { theme } = useTheme();
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const { fullscreenDid, enterFullscreen, exitFullscreen } = useFullscreen();

  // Inject CSS on mount
  useEffect(() => {
    injectGridTileCSS();
  }, []);

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

  // Outer padding: a bit more horizontal space, minimal extra vertical
  const padH = 16;
  const padV = 10;

  const layout = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || count === 0) {
      return null;
    }
    // Subtract extra outer padding from container before layout calc
    // (computeLayout already accounts for gap-sized padding on each side)
    const extraH = (padH - gap) * 2;
    const extraV = (padV - gap) * 2;
    return computeLayout(containerSize.w - extraH, containerSize.h - extraV, count, aspectRatio, gap);
  }, [containerSize.w, containerSize.h, count, aspectRatio, gap]);

  // Find the fullscreen participant (if set)
  const fullscreenParticipant = fullscreenDid
    ? tiles.find((t) => t.did === fullscreenDid)
    : null;

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
    paddingHorizontal: padH,
    paddingVertical: padV,
  };

  return (
    <Box style={containerStyle} onLayout={handleLayout}>
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
          <VideoTileStatusIcons
            isMuted={fullscreenParticipant.isMuted}
            isDeafened={fullscreenParticipant.isDeafened}
            isCameraOff={fullscreenParticipant.isCameraOff}
          />
          <VideoTile
            stream={fullscreenParticipant.stream}
            displayName={fullscreenParticipant.displayName}
            isMuted={false}
            isCameraOff={fullscreenParticipant.isCameraOff}
            isSpeaking={false}
            mirror={fullscreenParticipant.did === localDid}
            size="full"
            style={{ flex: 1 }}
          />
          <Box
            px={8}
            py={4}
            radius={4}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: theme.colors.background.overlay,
            }}
          >
            <Text size="xs" style={{ color: theme.colors.text.inverse }}>
              Press Esc to exit
            </Text>
          </Box>
        </Pressable>
      ) : (
        /* Normal grid mode */
        layout && containerSize.w > 0 && (
          <Box nativeID="video-grid" style={gridStyle}>
            {tiles.map((participant) => {
              const isLocal = participant.did === localDid;
              const isSpeaking = speakingDids.has(participant.did);

              // Equal widths for 1v1 calls
              let tileWidth = layout.tileW;
              let tileHeight = layout.tileH;
              if (isAdaptive1v1) {
                tileWidth = (containerSize.w - padH * 2 - gap) / 2;
                tileHeight = tileWidth / aspectRatio;
              }

              // Inner tile clips the video to rounded corners.
              // Uses className "video-grid-tile" for CSS-based clipping
              // since the Wisp VideoTile uses borderRadius:0 for size="full".
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
                    <VideoTileStatusIcons
                      isMuted={participant.isMuted}
                      isDeafened={participant.isDeafened}
                      isCameraOff={participant.isCameraOff}
                    />
                    <VideoTile
                      stream={participant.stream}
                      displayName={participant.displayName}
                      isMuted={false}
                      isCameraOff={participant.isCameraOff}
                      isSpeaking={false}
                      mirror={isLocal}
                      size="full"
                      style={{ flex: 1 }}
                    />
                  </Pressable>
                </SpeakerBorder>
              );
            })}
          </Box>
        )
      )}
    </Box>
  );
}
