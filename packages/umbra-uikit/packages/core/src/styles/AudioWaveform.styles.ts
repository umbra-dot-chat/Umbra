/**
 * @module styles/AudioWaveform
 * @description Pure style-builder functions for the AudioWaveform component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { AudioWaveformColor, AudioWaveformSizeConfig } from '../types/AudioWaveform.types';

// ---------------------------------------------------------------------------
// Keyframe injection (singleton)
// ---------------------------------------------------------------------------

let waveformInjected = false;

export function ensureAudioWaveformKeyframes(): void {
  if (waveformInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = [
    '@keyframes wisp-waveform-bar-rise { from { transform: scaleY(0); } to { transform: scaleY(1); } }',
    '@keyframes wisp-waveform-playing { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }',
  ].join('\n');
  document.head.appendChild(style);
  waveformInjected = true;
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface AudioWaveformColors {
  /** Bar / line fill for played portion. */
  active: string;
  /** Bar / line fill for unplayed portion. */
  inactive: string;
  /** Skeleton placeholder background. */
  skeletonBg: string;
}

export function resolveAudioWaveformColor(
  color: AudioWaveformColor,
  theme: WispTheme,
): string {
  const { colors: themeColors } = theme;
  switch (color) {
    case 'success': return themeColors.status.success;
    case 'warning': return themeColors.status.warning;
    case 'danger':  return themeColors.status.danger;
    case 'info':    return themeColors.status.info;
    case 'default':
    default:        return themeColors.accent.primary;
  }
}

export function resolveAudioWaveformColors(
  color: AudioWaveformColor,
  theme: WispTheme,
): AudioWaveformColors {
  const { colors: themeColors } = theme;
  return {
    active: resolveAudioWaveformColor(color, theme),
    inactive: themeColors.border.subtle,
    skeletonBg: themeColors.border.subtle,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildAudioWaveformWrapperStyle(
  sizeConfig: AudioWaveformSizeConfig,
  responsive: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: responsive ? '100%' : sizeConfig.width,
    height: sizeConfig.height,
    flexShrink: 0,
    overflow: 'visible',
    position: 'relative',
    cursor: 'pointer',
  };
}

export function buildAudioWaveformSvgStyle(
  sizeConfig: AudioWaveformSizeConfig,
  responsive: boolean,
): CSSStyleObject {
  return {
    display: 'block',
    width: responsive ? '100%' : sizeConfig.width,
    height: sizeConfig.height,
    overflow: 'visible',
  };
}

export function buildAudioWaveformSkeletonStyle(
  sizeConfig: AudioWaveformSizeConfig,
  responsive: boolean,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'inline-block',
    width: responsive ? '100%' : sizeConfig.width,
    height: sizeConfig.height,
    borderRadius: radii.sm,
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
