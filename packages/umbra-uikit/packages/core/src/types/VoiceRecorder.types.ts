/**
 * @module types/VoiceRecorder
 * @description Type definitions for the VoiceRecorder component — record
 * button with live waveform preview and timer for chat voice messages.
 */

import type { ThemeRadii } from '../theme/types';
import type React from 'react';
import { defaultSpacing, defaultTypography } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export const voiceRecorderStates = ['idle', 'recording', 'paused', 'preview'] as const;
export type VoiceRecorderState = (typeof voiceRecorderStates)[number];

// ---------------------------------------------------------------------------
// Size
// ---------------------------------------------------------------------------

export const voiceRecorderSizes = ['sm', 'md', 'lg'] as const;
export type VoiceRecorderSize = (typeof voiceRecorderSizes)[number];

export interface VoiceRecorderSizeConfig {
  /** Overall height. */
  height: number;
  /** Button size. */
  buttonSize: number;
  /** Icon size. */
  iconSize: number;
  /** Font size for timer. */
  fontSize: number;
  /** Padding. */
  padding: number;
  /** Gap between elements. */
  gap: number;
  /** Border radius. */
  borderRadius: keyof ThemeRadii;
}

export const voiceRecorderSizeMap: Record<VoiceRecorderSize, VoiceRecorderSizeConfig> = {
  sm: { height: 40, buttonSize: 32, iconSize: 16, fontSize: defaultTypography.sizes.xs.fontSize, padding: defaultSpacing.sm, gap: defaultSpacing.sm, borderRadius: 'full' },
  md: { height: 48, buttonSize: 40, iconSize: 20, fontSize: defaultTypography.sizes.sm.fontSize, padding: defaultSpacing.md, gap: defaultSpacing.md, borderRadius: 'full' },
  lg: { height: 56, buttonSize: 48, iconSize: 24, fontSize: defaultTypography.sizes.sm.fontSize, padding: defaultSpacing.lg, gap: defaultSpacing.md, borderRadius: 'full' } };

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface VoiceRecorderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current recording state. @default 'idle' */
  state?: VoiceRecorderState;

  /** Size preset. @default 'md' */
  size?: VoiceRecorderSize;

  /** Duration in seconds of the current recording. */
  duration?: number;

  /** Maximum recording duration in seconds. @default 120 */
  maxDuration?: number;

  /** Waveform amplitude data for preview mode (0–1 values). */
  waveformData?: number[];

  /** Called when the record button is pressed. */
  onRecord?: () => void;

  /** Called when stop is pressed. */
  onStop?: () => void;

  /** Called when pause is pressed. */
  onPause?: () => void;

  /** Called when resume is pressed. */
  onResume?: () => void;

  /** Called when send/confirm is pressed. */
  onSend?: () => void;

  /** Called when cancel/delete is pressed. */
  onCancel?: () => void;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
