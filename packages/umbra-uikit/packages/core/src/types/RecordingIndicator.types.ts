/**
 * @module components/recording-indicator
 * @description Type definitions for the RecordingIndicator component.
 *
 * A visual indicator that recording is active with optional start/stop controls.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

/** Available display variants for the recording indicator. */
export const recordingIndicatorVariants = ['badge', 'controls'] as const;

/** Union of recording indicator variant values. */
export type RecordingIndicatorVariant = (typeof recordingIndicatorVariants)[number];

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available sizes for the recording indicator. */
export const recordingIndicatorSizes = ['sm', 'md'] as const;

/** Union of recording indicator size values. */
export type RecordingIndicatorSize = (typeof recordingIndicatorSizes)[number];

// ---------------------------------------------------------------------------
// Size config
// ---------------------------------------------------------------------------

/** Dimensional configuration for a recording indicator size. */
export interface RecordingIndicatorSizeConfig {
  /** Font size in pixels. */
  fontSize: number;
  /** Dot diameter in pixels. */
  dotSize: number;
  /** Horizontal padding in pixels. */
  paddingX: number;
  /** Vertical padding in pixels. */
  paddingY: number;
  /** Gap between elements in pixels. */
  gap: number;
  /** Button size in pixels (for controls variant). */
  buttonSize: number;
}

/** Maps each size to its dimensional config. */
export const recordingIndicatorSizeMap: Record<RecordingIndicatorSize, RecordingIndicatorSizeConfig> = {
  sm: { fontSize: 11, dotSize: 6, paddingX: 8, paddingY: 4, gap: 6, buttonSize: 24 },
  md: { fontSize: 13, dotSize: 8, paddingX: 10, paddingY: 6, gap: 8, buttonSize: 28 },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link RecordingIndicator} component.
 *
 * @remarks
 * Extends the native `<div>` element attributes so any valid HTML div
 * prop (e.g. `aria-*`, `data-*`) can be forwarded.
 */
export interface RecordingIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether recording is currently active. */
  isRecording: boolean;

  /**
   * Duration of the recording in seconds.
   * Displayed as a formatted timer (e.g. "02:34").
   */
  duration?: number;

  /** Callback fired when the start recording button is clicked. */
  onStartRecording?: () => void;

  /** Callback fired when the stop recording button is clicked. */
  onStopRecording?: () => void;

  /**
   * Whether the current user has permission to record.
   * @default false
   */
  canRecord?: boolean;

  /**
   * Display variant.
   * - `'badge'`: Compact indicator with pulsing red dot, text, and timer.
   * - `'controls'`: Badge plus start/stop buttons.
   * @default 'badge'
   */
  variant?: RecordingIndicatorVariant;

  /**
   * Size of the indicator.
   * @default 'md'
   */
  size?: RecordingIndicatorSize;
}
