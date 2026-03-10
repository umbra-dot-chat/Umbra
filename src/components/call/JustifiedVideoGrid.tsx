/**
 * JustifiedVideoGrid — Arranges video tiles using a justified packing algorithm
 * that maximizes tile area while fitting all participants in the container.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { VideoTile, useTheme } from '@coexist/wisp-react-native';
import type { CallParticipant } from '@/types/call';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface JustifiedVideoGridProps {
  participants: CallParticipant[];
  selfViewVisible: boolean;
  localDid: string;
  activeSpeakerDid: string | null;
  speakingDids: Set<string>;
  onTileDoubleClick?: (did: string) => void;
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

  return best;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function JustifiedVideoGrid({
  participants,
  selfViewVisible,
  localDid,
  activeSpeakerDid,
  speakingDids,
  onTileDoubleClick,
  gap = 8,
  aspectRatio = 16 / 9,
}: JustifiedVideoGridProps) {
  const { theme } = useTheme();
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

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

  // Adaptive 1:1 layout: when exactly 2 participants and both cameras on,
  // use equal side-by-side; when one camera off, remote gets 75% width
  const isAdaptive1v1 = count === 2 && tiles.every((t) => !t.isCameraOff);
  const is1v1Asymmetric = count === 2 && tiles.some((t) => t.isCameraOff);

  const layout = useMemo(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || count === 0) {
      return null;
    }
    return computeLayout(containerSize.w, containerSize.h, count, aspectRatio, gap);
  }, [containerSize.w, containerSize.h, count, aspectRatio, gap]);

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.background.sunken,
    borderRadius: 12,
    overflow: 'hidden',
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

  return (
    <View style={containerStyle} onLayout={handleLayout}>
      {layout && containerSize.w > 0 && (
        <View style={gridStyle}>
          {tiles.map((participant, idx) => {
            const isLocal = participant.did === localDid;
            const isSpeaking = speakingDids.has(participant.did);

            // Adaptive widths for 1v1
            let tileWidth = layout.tileW;
            let tileHeight = layout.tileH;
            if (isAdaptive1v1) {
              tileWidth = (containerSize.w - gap * 3) / 2;
              tileHeight = tileWidth / aspectRatio;
            } else if (is1v1Asymmetric) {
              const isOff = participant.isCameraOff;
              tileWidth = isOff
                ? (containerSize.w - gap * 3) * 0.25
                : (containerSize.w - gap * 3) * 0.75;
              tileHeight = tileWidth / aspectRatio;
            }

            const tileStyle: ViewStyle = {
              width: tileWidth,
              height: tileHeight,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: isSpeaking ? 2 : 0,
              borderColor: isSpeaking
                ? theme.colors.accent.primary
                : 'transparent',
            };

            return (
              <Pressable
                key={participant.did}
                onPress={() => {
                  // Double-press handled via onLongPress as a simpler
                  // cross-platform substitute; actual double-tap via
                  // onTileDoubleClick is wired below
                }}
                onLongPress={() => onTileDoubleClick?.(participant.did)}
                delayLongPress={300}
                style={tileStyle}
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
            );
          })}
        </View>
      )}
    </View>
  );
}
