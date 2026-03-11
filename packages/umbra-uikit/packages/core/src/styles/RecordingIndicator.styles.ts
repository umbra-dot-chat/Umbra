/**
 * @module components/recording-indicator
 * @description Style builders for the RecordingIndicator component.
 */

import type { CSSStyleObject } from '../types';
import type { WispTheme } from '../theme/types';
import { fontFamilyStacks } from '../tokens/shared';
import type { RecordingIndicatorSizeConfig } from '../types/RecordingIndicator.types';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

/**
 * Builds the root container style.
 */
export function buildRecordingContainerStyle(
  sizeConfig: RecordingIndicatorSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: sizeConfig.gap,
    padding: `${sizeConfig.paddingY}px ${sizeConfig.paddingX}px`,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.raised,
    border: `1px solid ${theme.colors.border.subtle}`,
    fontFamily: fontFamilyStacks.sans,
    boxSizing: 'border-box',
  };
}

// ---------------------------------------------------------------------------
// Pulsing dot
// ---------------------------------------------------------------------------

/**
 * Builds the pulsing red dot style.
 */
export function buildRecordingDotStyle(
  sizeConfig: RecordingIndicatorSizeConfig,
  isRecording: boolean,
): CSSStyleObject {
  return {
    width: sizeConfig.dotSize,
    height: sizeConfig.dotSize,
    borderRadius: '50%',
    backgroundColor: isRecording ? '#ef4444' : '#6b7280',
    flexShrink: 0,
    animation: isRecording ? 'wisp-recording-pulse 1.5s ease-in-out infinite' : 'none',
  };
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/**
 * Builds the "Recording" text style.
 */
export function buildRecordingTextStyle(
  sizeConfig: RecordingIndicatorSizeConfig,
  isRecording: boolean,
  theme: WispTheme,
): CSSStyleObject {
  return {
    fontSize: sizeConfig.fontSize,
    fontWeight: theme.typography.weights.medium,
    color: isRecording ? theme.colors.text.primary : theme.colors.text.muted,
    lineHeight: 1,
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Duration timer
// ---------------------------------------------------------------------------

/**
 * Builds the duration timer style.
 */
export function buildDurationStyle(
  sizeConfig: RecordingIndicatorSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  return {
    fontSize: sizeConfig.fontSize,
    fontWeight: theme.typography.weights.regular,
    color: theme.colors.text.muted,
    lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
  };
}

// ---------------------------------------------------------------------------
// Control buttons
// ---------------------------------------------------------------------------

/**
 * Builds the stop button style.
 */
export function buildStopButtonStyle(
  sizeConfig: RecordingIndicatorSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  return {
    width: sizeConfig.buttonSize,
    height: sizeConfig.buttonSize,
    borderRadius: theme.radii.full,
    backgroundColor: '#ef4444',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease',
  };
}

/**
 * Builds the start button style.
 */
export function buildStartButtonStyle(
  sizeConfig: RecordingIndicatorSizeConfig,
  theme: WispTheme,
): CSSStyleObject {
  return {
    width: sizeConfig.buttonSize,
    height: sizeConfig.buttonSize,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.background.sunken,
    border: `1px solid ${theme.colors.border.subtle}`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.colors.text.secondary,
    padding: 0,
    flexShrink: 0,
    transition: 'background-color 150ms ease',
  };
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

/**
 * Builds the skeleton style for the recording indicator.
 */
export function buildRecordingSkeletonStyle(
  theme: WispTheme,
): CSSStyleObject {
  return {
    display: 'inline-block',
    width: 120,
    height: 28,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.border.subtle,
    animation: 'wisp-skeleton-pulse 1.5s ease-in-out infinite',
  };
}
