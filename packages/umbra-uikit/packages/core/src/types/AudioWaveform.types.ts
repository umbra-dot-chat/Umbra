/**
 * @module types/AudioWaveform
 * @description Type definitions for the AudioWaveform component — visual
 * representation of audio data as a waveform, commonly used in chat apps
 * and audio players.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Variant
// ---------------------------------------------------------------------------

export const audioWaveformVariants = ['bars', 'line', 'mirror'] as const;
export type AudioWaveformVariant = (typeof audioWaveformVariants)[number];

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const audioWaveformSizes = ['sm', 'md', 'lg', 'xl'] as const;
export type AudioWaveformSize = (typeof audioWaveformSizes)[number];

export interface AudioWaveformSizeConfig {
  /** Default width (px) unless responsive. */
  width: number;
  /** Height (px). */
  height: number;
  /** Width of each bar (px). */
  barWidth: number;
  /** Gap between bars (px). */
  barGap: number;
  /** Minimum bar height (px). */
  barMinHeight: number;
  /** Border radius for bars (px). */
  barRadius: number;
  /** Stroke width for line variant. */
  strokeWidth: number;
}

export const audioWaveformSizeMap: Record<AudioWaveformSize, AudioWaveformSizeConfig> = {
  sm: { width: 120, height: 24, barWidth: 2, barGap: 1, barMinHeight: 2, barRadius: 1, strokeWidth: 1.5 },
  md: { width: 200, height: 36, barWidth: 3, barGap: 1.5, barMinHeight: 3, barRadius: 1.5, strokeWidth: 1.5 },
  lg: { width: 300, height: 48, barWidth: 3, barGap: 2, barMinHeight: 3, barRadius: 1.5, strokeWidth: 2 },
  xl: { width: 400, height: 64, barWidth: 4, barGap: 2, barMinHeight: 4, barRadius: 2, strokeWidth: 2 },
};

// ---------------------------------------------------------------------------
// Color
// ---------------------------------------------------------------------------

export const audioWaveformColors = ['default', 'success', 'warning', 'danger', 'info'] as const;
export type AudioWaveformColor = (typeof audioWaveformColors)[number];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AudioWaveformProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Array of amplitude values (0–1 range). */
  data: number[];

  /** Waveform display variant. @default 'bars' */
  variant?: AudioWaveformVariant;

  /** Preset dimensions. @default 'md' */
  size?: AudioWaveformSize;

  /** Accent color. @default 'default' */
  color?: AudioWaveformColor;

  /** Progress fraction (0–1) for playback position indicator. @default 0 */
  progress?: number;

  /** Whether the waveform is actively playing (animates bars). @default false */
  playing?: boolean;

  /** Stretch width to 100% of parent container. @default false */
  responsive?: boolean;

  /** Show a loading skeleton placeholder. @default false */
  skeleton?: boolean;

  /** Animate bars on entry. @default false */
  animated?: boolean;

  /** Called when user clicks on the waveform (for seek). */
  onSeek?: (fraction: number) => void;
}
