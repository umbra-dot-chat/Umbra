/**
 * VideoTileStatusIcons — Shows muted, deafened, and camera-off icons
 * in the top-right corner of a video tile.
 *
 * Replaces the Wisp VideoTile's built-in "M" badge with proper SVG icons.
 * Uses black circle backgrounds and the headphones-off icon for deafen
 * (matching the Discord-style deafen indicator).
 */

import React from 'react';
import type { ViewStyle } from 'react-native';
import { Box, useTheme } from '@coexist/wisp-react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { dbg } from '@/utils/debug';

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

function HeadphonesOffIcon({ size = 14 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      <Path d="M21 18v-6a9 9 0 0 0-9-9 8.98 8.98 0 0 0-6.36 2.64" />
      <Line x1={1} y1={1} x2={23} y2={23} />
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
  if (__DEV__) dbg.trackRender('VideoTileStatusIcons');
  const { theme } = useTheme();
  const hasAny = isMuted || isDeafened || isCameraOff;
  if (!hasAny) return null;

  const iconBadge: ViewStyle = {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.background.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <Box
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
        <Box style={iconBadge}>
          <MicOffIcon size={14} />
        </Box>
      )}
      {isDeafened && (
        <Box style={iconBadge}>
          <HeadphonesOffIcon size={14} />
        </Box>
      )}
      {isCameraOff && (
        <Box style={iconBadge}>
          <CameraOffIcon size={14} />
        </Box>
      )}
    </Box>
  );
}
