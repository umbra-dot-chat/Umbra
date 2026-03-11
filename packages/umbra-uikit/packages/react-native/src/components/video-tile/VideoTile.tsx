/**
 * VideoTile — Renders a video stream with avatar fallback, mute badge, and speaking border.
 */

import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Platform } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { Text } from '../../primitives';
import {
  videoTileSizeMap,
} from '@coexist/wisp-core/types/VideoTile.types';
import type { VideoTileSize, VideoTileFit } from '@coexist/wisp-core/types/VideoTile.types';
import {
  resolveVideoTileBackground,
  resolveSpeakingBorderColor,
  resolveMuteBadgeBackground,
} from '@coexist/wisp-core/styles/VideoTile.styles';
import { useTheme } from '../../providers';

export interface VideoTileProps {
  stream: MediaStream | null;
  displayName?: string;
  isMuted?: boolean;
  isCameraOff?: boolean;
  isSpeaking?: boolean;
  mirror?: boolean;
  fit?: VideoTileFit;
  showOverlay?: boolean;
  avatarUri?: string;
  size?: VideoTileSize;
  style?: ViewStyle;
}

export const VideoTile = forwardRef<View, VideoTileProps>(function VideoTile(
  {
    stream,
    displayName,
    isMuted = false,
    isCameraOff = false,
    isSpeaking = false,
    mirror = false,
    fit = 'cover',
    showOverlay = true,
    size = 'md',
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const sc = videoTileSizeMap[size];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const bgColor = resolveVideoTileBackground(theme);
  const speakingColor = resolveSpeakingBorderColor(theme);
  const muteBadgeBg = resolveMuteBadgeBackground(theme);

  // Attach stream to video element (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current && stream) {
      (videoRef.current as any).srcObject = stream;
    }
  }, [stream]);

  const containerStyle = useMemo<ViewStyle>(() => ({
    position: 'relative',
    minWidth: sc.minWidth || undefined,
    minHeight: sc.minHeight || undefined,
    backgroundColor: bgColor,
    borderRadius: sc.borderRadius,
    overflow: 'hidden',
    borderWidth: isSpeaking ? 2 : 0,
    borderColor: isSpeaking ? speakingColor : 'transparent',
    ...(size === 'full' ? { flex: 1 } : {}),
  }), [sc, bgColor, isSpeaking, speakingColor, size]);

  const videoStyle = useMemo(() => ({
    width: '100%',
    height: '100%',
    objectFit: fit,
    transform: mirror ? 'scaleX(-1)' : undefined,
  }), [fit, mirror]);

  const overlayStyle = useMemo<ViewStyle>(() => ({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 4,
  }), []);

  const nameStyle = useMemo<TextStyle>(() => ({
    fontSize: sc.nameFontSize,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }), [sc]);

  const muteBadgeStyle = useMemo<ViewStyle>(() => ({
    width: sc.badgeSize,
    height: sc.badgeSize,
    borderRadius: sc.badgeSize / 2,
    backgroundColor: muteBadgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  }), [sc, muteBadgeBg]);

  const avatarFallbackStyle = useMemo<ViewStyle>(() => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }), []);

  const avatarTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sc.avatarSize * 0.4,
    fontWeight: '600',
    color: tc.text.secondary,
  }), [sc, tc]);

  const showVideo = stream && !isCameraOff;

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      {showVideo && Platform.OS === 'web' ? (
        <video
          ref={videoRef as any}
          autoPlay
          playsInline
          muted
          style={videoStyle as any}
        />
      ) : (
        <View style={avatarFallbackStyle}>
          <Text style={avatarTextStyle}>
            {displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}

      {showOverlay && (
        <View style={overlayStyle}>
          {isMuted && (
            <View style={muteBadgeStyle}>
              <Text style={{ fontSize: sc.badgeSize * 0.6, color: '#fff' }}>M</Text>
            </View>
          )}
          {displayName && (
            <Text style={nameStyle} numberOfLines={1}>{displayName}</Text>
          )}
        </View>
      )}
    </View>
  );
});

VideoTile.displayName = 'VideoTile';
