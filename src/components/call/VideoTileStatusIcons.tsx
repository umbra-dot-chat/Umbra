/**
 * VideoTileStatusIcons — Shows muted, deafened, and camera-off icons
 * in the top-right corner of a video tile.
 *
 * Replaces the Wisp VideoTile's built-in "M" badge with proper SVG icons.
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Line, Rect } from 'react-native-svg';

// ─── Props ──────────────────────────────────────────────────────────────────

export interface VideoTileStatusIconsProps {
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOff: boolean;
}

// ─── Icon Components ────────────────────────────────────────────────────────

function MicOffIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .67-.08 1.32-.22 1.94" />
      <Line x1={12} y1={19} x2={12} y2={23} />
      <Line x1={8} y1={23} x2={16} y2={23} />
    </Svg>
  );
}

function DeafenedIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" />
      <Line x1={23} y1={9} x2={17} y2={15} />
      <Line x1={17} y1={9} x2={23} y2={15} />
    </Svg>
  );
}

function CameraOffIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={1} y1={1} x2={23} y2={23} />
      <Path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" />
    </Svg>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export function VideoTileStatusIcons({ isMuted, isDeafened, isCameraOff }: VideoTileStatusIconsProps) {
  const hasAny = isMuted || isDeafened || isCameraOff;
  if (!hasAny) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 6,
        right: 6,
        flexDirection: 'row',
        gap: 4,
        zIndex: 5,
      }}
    >
      {isMuted && (
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <MicOffIcon size={14} />
        </View>
      )}
      {isDeafened && (
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <DeafenedIcon size={14} />
        </View>
      )}
      {isCameraOff && (
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <CameraOffIcon size={14} />
        </View>
      )}
    </View>
  );
}
