/**
 * @module styles/MediaPlayer
 * @description Pure style-builder functions for the MediaPlayer component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { MediaPlayerSizeConfig } from '../types/MediaPlayer.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface MediaPlayerColors {
  bg: string;
  controlBg: string;
  text: string;
  textSecondary: string;
  icon: string;
  iconHover: string;
  trackBg: string;
  trackFill: string;
  thumb: string;
  border: string;
}

export function resolveMediaPlayerColors(theme: WispTheme): MediaPlayerColors {
  const { colors: themeColors } = theme;
  return {
    bg: themeColors.background.sunken,
    controlBg: themeColors.background.surface,
    text: themeColors.text.primary,
    textSecondary: themeColors.text.secondary,
    icon: themeColors.text.secondary,
    iconHover: themeColors.text.primary,
    trackBg: themeColors.border.subtle,
    trackFill: themeColors.accent.primary,
    thumb: themeColors.text.primary,
    border: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildMediaPlayerContainerStyle(
  sizeConfig: MediaPlayerSizeConfig,
  colors: MediaPlayerColors,
  isVideo: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderRadius: radii[sizeConfig.borderRadius],
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    position: 'relative',
    ...(isVideo ? { aspectRatio: '16/9' } : {}),
  };
}

export function buildVideoContainerStyle(theme: WispTheme): CSSStyleObject {
  const { colors: themeColors } = theme;
  return {
    position: 'relative',
    width: '100%',
    flex: 1,
    backgroundColor: themeColors.background.canvas,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    overflow: 'hidden',
    minHeight: 0,
  };
}

export function buildVideoElementStyle(): CSSStyleObject {
  return {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  };
}

export function buildControlBarStyle(
  sizeConfig: MediaPlayerSizeConfig,
  colors: MediaPlayerColors,
  isVideo: boolean,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    padding: `0 ${sizeConfig.padding}px`,
    height: sizeConfig.controlBarHeight,
    backgroundColor: isVideo ? 'rgba(0,0,0,0.7)' : colors.controlBg,
    borderTop: isVideo ? 'none' : `1px solid ${colors.border}`,
    flexShrink: 0,
    ...(isVideo
      ? {
          position: 'absolute' as const,
          bottom: 0,
          left: 0,
          right: 0,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }
      : {}),
  };
}

export function buildControlButtonStyle(
  sizeConfig: MediaPlayerSizeConfig,
  colors: MediaPlayerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.iconSize + 8,
    height: sizeConfig.iconSize + 8,
    borderRadius: radii.sm,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.icon,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}, background-color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildSeekBarContainerStyle(
  sizeConfig: MediaPlayerSizeConfig,
): CSSStyleObject {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    height: sizeConfig.controlBarHeight,
    cursor: 'pointer',
    position: 'relative',
    minWidth: 0,
  };
}

export function buildSeekBarTrackStyle(
  sizeConfig: MediaPlayerSizeConfig,
  colors: MediaPlayerColors,
): CSSStyleObject {
  return {
    width: '100%',
    height: sizeConfig.trackHeight,
    borderRadius: sizeConfig.trackHeight / 2,
    backgroundColor: colors.trackBg,
    position: 'relative',
    overflow: 'hidden',
  };
}

export function buildSeekBarFillStyle(
  colors: MediaPlayerColors,
  progress: number,
): CSSStyleObject {
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${progress * 100}%`,
    backgroundColor: colors.trackFill,
    borderRadius: 'inherit',
    transition: `width ${durations.fast}ms ${easings.linear.css}`,
  };
}

export function buildTimeDisplayStyle(
  sizeConfig: MediaPlayerSizeConfig,
  colors: MediaPlayerColors,
): CSSStyleObject {
  return {
    fontSize: sizeConfig.fontSize,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    userSelect: 'none',
  };
}

export function buildVolumeContainerStyle(
  sizeConfig: MediaPlayerSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  };
}

export function buildVolumeSliderStyle(
  sizeConfig: MediaPlayerSizeConfig,
  colors: MediaPlayerColors,
): CSSStyleObject {
  return {
    width: sizeConfig.volumeWidth,
    height: sizeConfig.trackHeight,
    borderRadius: sizeConfig.trackHeight / 2,
    backgroundColor: colors.trackBg,
    position: 'relative',
    cursor: 'pointer',
    overflow: 'hidden',
  };
}

export function buildSpeedButtonStyle(
  sizeConfig: MediaPlayerSizeConfig,
  colors: MediaPlayerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii, spacing, typography } = theme;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: sizeConfig.iconSize + 4,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    borderRadius: radii.sm,
    border: 'none',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
    cursor: 'pointer',
    fontSize: sizeConfig.fontSize,
    fontWeight: typography.weights.semibold,
    fontFamily: 'monospace',
    flexShrink: 0,
    transition: `color ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildAudioInfoStyle(
  colors: MediaPlayerColors,
  theme: WispTheme,
): CSSStyleObject {
  const { spacing } = theme;
  return {
    display: 'flex',
    flexDirection: 'column',
    padding: `${spacing.md}px ${spacing.lg}px ${spacing.xs}px`,
    gap: spacing['2xs'],
  };
}

export function buildAudioSeekRowStyle(
  sizeConfig: MediaPlayerSizeConfig,
): CSSStyleObject {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    padding: `0 ${sizeConfig.padding}px`,
    height: 24,
  };
}

export function buildMediaPlayerSkeletonStyle(
  sizeConfig: MediaPlayerSizeConfig,
  theme: WispTheme,
  isVideo: boolean,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    height: isVideo ? 300 : sizeConfig.controlBarHeight + 60,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
