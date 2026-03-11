/**
 * @module styles/VoiceRecorder
 * @description Pure style-builder functions for the VoiceRecorder component.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeColors, WispTheme } from '../theme/types';
import type { VoiceRecorderState, VoiceRecorderSizeConfig } from '../types/VoiceRecorder.types';
import { durations, easings } from '../tokens/motion';

// ---------------------------------------------------------------------------
// Keyframe injection
// ---------------------------------------------------------------------------

let voiceRecorderInjected = false;

export function ensureVoiceRecorderKeyframes(): void {
  if (voiceRecorderInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.textContent = '@keyframes wisp-voice-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; } }';
  document.head.appendChild(style);
  voiceRecorderInjected = true;
}

// ---------------------------------------------------------------------------
// Color resolution
// ---------------------------------------------------------------------------

export interface VoiceRecorderColors {
  bg: string;
  border: string;
  recordButton: string;
  recordButtonActive: string;
  icon: string;
  iconOnRecord: string;
  timer: string;
  waveform: string;
  cancelButton: string;
  sendButton: string;
  sendIcon: string;
}

export function resolveVoiceRecorderColors(
  state: VoiceRecorderState,
  theme: WispTheme,
): VoiceRecorderColors {
  const { colors: themeColors } = theme;
  return {
    bg: themeColors.background.surface,
    border: themeColors.border.subtle,
    recordButton: themeColors.status.danger,
    recordButtonActive: themeColors.status.danger,
    icon: themeColors.text.secondary,
    iconOnRecord: themeColors.text.inverse,
    timer: state === 'recording' ? themeColors.status.danger : themeColors.text.secondary,
    waveform: themeColors.accent.primary,
    cancelButton: themeColors.text.muted,
    sendButton: themeColors.accent.primary,
    sendIcon: themeColors.background.surface,
  };
}

// ---------------------------------------------------------------------------
// Style builders
// ---------------------------------------------------------------------------

export function buildVoiceRecorderContainerStyle(
  sizeConfig: VoiceRecorderSizeConfig,
  colors: VoiceRecorderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { radii } = theme;
  // Vertical padding centers buttons; horizontal padding is half the
  // difference between container height and button size so buttons
  // sit flush against the visual edge of the pill.
  const hPad = (sizeConfig.height - sizeConfig.buttonSize) / 2;
  return {
    display: 'flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    padding: `0 ${hPad}px`,
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    border: `1px solid ${colors.border}`,
    backgroundColor: colors.bg,
    width: '100%',
    boxSizing: 'border-box',
  };
}

export function buildRecordButtonStyle(
  sizeConfig: VoiceRecorderSizeConfig,
  colors: VoiceRecorderColors,
  isRecording: boolean,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.buttonSize,
    height: sizeConfig.buttonSize,
    borderRadius: sizeConfig.buttonSize / 2,
    border: 'none',
    backgroundColor: colors.recordButton,
    color: colors.iconOnRecord,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
    ...(isRecording ? { animation: 'wisp-voice-pulse 1.5s ease-in-out infinite' } : {}),
  };
}

export function buildTimerStyle(
  sizeConfig: VoiceRecorderSizeConfig,
  colors: VoiceRecorderColors,
  theme: WispTheme,
): CSSStyleObject {
  const { typography } = theme;
  return {
    fontSize: sizeConfig.fontSize,
    fontFamily: 'monospace',
    fontWeight: typography.weights.semibold,
    color: colors.timer,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    minWidth: 40,
    flexShrink: 0,
  };
}

export function buildActionButtonStyle(
  sizeConfig: VoiceRecorderSizeConfig,
  bgColor: string,
  fgColor: string,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeConfig.buttonSize - 4,
    height: sizeConfig.buttonSize - 4,
    borderRadius: (sizeConfig.buttonSize - 4) / 2,
    border: 'none',
    backgroundColor: bgColor,
    color: fgColor,
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
    transition: `all ${durations.fast}ms ${easings.easeOut.css}`,
  };
}

export function buildVoiceRecorderSkeletonStyle(
  sizeConfig: VoiceRecorderSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  const { colors: themeColors, radii } = theme;
  return {
    display: 'block',
    width: '100%',
    height: sizeConfig.height,
    borderRadius: radii[sizeConfig.borderRadius],
    backgroundColor: themeColors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
