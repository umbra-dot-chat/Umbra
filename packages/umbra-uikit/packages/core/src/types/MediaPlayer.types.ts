/**
 * @module types/MediaPlayer
 * @description Type definitions for the MediaPlayer component — audio and video
 * playback with seek bar, volume control, playback speed, and fullscreen.
 */

import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

export const mediaPlayerVariants = ['audio', 'video'] as const;
export type MediaPlayerVariant = (typeof mediaPlayerVariants)[number];

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const mediaPlayerSizes = ['sm', 'md', 'lg'] as const;
export type MediaPlayerSize = (typeof mediaPlayerSizes)[number];

export interface MediaPlayerSizeConfig {
  /** Control bar height (px). */
  controlBarHeight: number;
  /** Icon size for control buttons. */
  iconSize: number;
  /** Font size for time display. */
  fontSize: number;
  /** Seek bar track height. */
  trackHeight: number;
  /** Seek bar thumb size. */
  thumbSize: number;
  /** Padding around controls. */
  padding: number;
  /** Gap between control elements. */
  gap: number;
  /** Volume slider width. */
  volumeWidth: number;
  /** Border radius. */
  borderRadius: keyof ThemeRadii;
}

export const mediaPlayerSizeMap: Record<MediaPlayerSize, MediaPlayerSizeConfig> = {
  sm: {
    controlBarHeight: 36,
    iconSize: 14,
    fontSize: defaultTypography.sizes.xs.fontSize,
    trackHeight: 3,
    thumbSize: 10,
    padding: defaultSpacing.sm,
    gap: defaultSpacing.sm,
    volumeWidth: 60,
    borderRadius: 'md' },
  md: {
    controlBarHeight: 44,
    iconSize: 18,
    fontSize: defaultTypography.sizes.xs.fontSize,
    trackHeight: 4,
    thumbSize: 12,
    padding: defaultSpacing.md,
    gap: defaultSpacing.sm,
    volumeWidth: 80,
    borderRadius: 'lg' },
  lg: {
    controlBarHeight: 52,
    iconSize: 22,
    fontSize: defaultTypography.sizes.sm.fontSize,
    trackHeight: 5,
    thumbSize: 14,
    padding: defaultSpacing.lg,
    gap: defaultSpacing.md,
    volumeWidth: 100,
    borderRadius: 'xl' } };

// ---------------------------------------------------------------------------
// Playback speed
// ---------------------------------------------------------------------------

export const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type PlaybackSpeed = (typeof playbackSpeeds)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MediaPlayerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children' | 'onTimeUpdate'> {
  /** Media source URL. */
  src: string;

  /** Media type. @default 'audio' */
  variant?: MediaPlayerVariant;

  /** Optional poster image for video variant. */
  poster?: string;

  /** Size preset. @default 'md' */
  size?: MediaPlayerSize;

  /** Title / track name displayed in controls. */
  title?: string;

  /** Artist / subtitle text. */
  artist?: string;

  /** Auto-play on mount. @default false */
  autoPlay?: boolean;

  /** Loop playback. @default false */
  loop?: boolean;

  /** Muted by default. @default false */
  muted?: boolean;

  /** Show volume control. @default true */
  showVolume?: boolean;

  /** Show playback speed control. @default true */
  showSpeed?: boolean;

  /** Show fullscreen button (video only). @default true */
  showFullscreen?: boolean;

  /** Show time display. @default true */
  showTime?: boolean;

  /** Called when playback state changes. */
  onPlayStateChange?: (playing: boolean) => void;

  /** Called when time updates. */
  onTimeUpdate?: (currentTime: number, duration: number) => void;

  /** Called when media ends. */
  onEnded?: () => void;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
