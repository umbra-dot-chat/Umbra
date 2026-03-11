/**
 * RecordingIndicator -- Visual indicator that recording is active.
 *
 * @remarks
 * Provides two display variants:
 *
 * - `'badge'` (default): Compact indicator with pulsing red dot, "Recording" text,
 *   and an optional duration timer.
 * - `'controls'`: Badge variant plus start/stop buttons for controlling recording.
 *
 * @module components/recording-indicator
 *
 * @example
 * ```tsx
 * <RecordingIndicator isRecording={true} duration={125} />
 * <RecordingIndicator
 *   isRecording={false}
 *   variant="controls"
 *   canRecord={true}
 *   onStartRecording={() => startRecording()}
 *   onStopRecording={() => stopRecording()}
 * />
 * ```
 */

import React, { forwardRef, useMemo } from 'react';
import type { RecordingIndicatorProps } from '@coexist/wisp-core/types/RecordingIndicator.types';
import { recordingIndicatorSizeMap } from '@coexist/wisp-core/types/RecordingIndicator.types';
import {
  buildRecordingContainerStyle,
  buildRecordingDotStyle,
  buildRecordingTextStyle,
  buildDurationStyle,
  buildStopButtonStyle,
  buildStartButtonStyle,
  buildRecordingSkeletonStyle,
} from '@coexist/wisp-core/styles/RecordingIndicator.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Duration formatter
// ---------------------------------------------------------------------------

/**
 * Formats seconds into MM:SS string.
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RecordingIndicator = forwardRef<HTMLDivElement, RecordingIndicatorProps>(
  function RecordingIndicator(
    {
      isRecording,
      duration,
      onStartRecording,
      onStopRecording,
      canRecord = false,
      variant = 'badge',
      size = 'md',
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const sizeConfig = recordingIndicatorSizeMap[size];

    // -------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------
    const containerStyle = useMemo(
      () => buildRecordingContainerStyle(sizeConfig, theme) as React.CSSProperties,
      [sizeConfig, theme],
    );
    const dotStyle = useMemo(
      () => buildRecordingDotStyle(sizeConfig, isRecording) as React.CSSProperties,
      [sizeConfig, isRecording],
    );
    const textStyle = useMemo(
      () => buildRecordingTextStyle(sizeConfig, isRecording, theme) as React.CSSProperties,
      [sizeConfig, isRecording, theme],
    );
    const durationStyleObj = useMemo(
      () => buildDurationStyle(sizeConfig, theme) as React.CSSProperties,
      [sizeConfig, theme],
    );
    const stopBtnStyle = useMemo(
      () => buildStopButtonStyle(sizeConfig, theme) as React.CSSProperties,
      [sizeConfig, theme],
    );
    const startBtnStyle = useMemo(
      () => buildStartButtonStyle(sizeConfig, theme) as React.CSSProperties,
      [sizeConfig, theme],
    );

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle } as React.CSSProperties}
        data-testid="recording-indicator"
        role="status"
        aria-label={isRecording ? 'Recording in progress' : 'Not recording'}
        {...rest}
      >
        {/* Pulsing dot */}
        <span
          style={dotStyle}
          aria-hidden
          data-testid="recording-dot"
        />

        {/* Recording text */}
        <span style={textStyle}>
          {isRecording ? 'Recording' : 'Not Recording'}
        </span>

        {/* Duration timer */}
        {isRecording && duration !== undefined && (
          <span style={durationStyleObj} data-testid="recording-duration">
            {formatDuration(duration)}
          </span>
        )}

        {/* Controls variant: start/stop buttons */}
        {variant === 'controls' && (
          <>
            {isRecording && onStopRecording && (
              <button
                type="button"
                style={stopBtnStyle}
                onClick={onStopRecording}
                aria-label="Stop recording"
                data-testid="stop-recording-btn"
              >
                <svg width={sizeConfig.buttonSize * 0.4} height={sizeConfig.buttonSize * 0.4} viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </button>
            )}
            {!isRecording && canRecord && onStartRecording && (
              <button
                type="button"
                style={startBtnStyle}
                onClick={onStartRecording}
                aria-label="Start recording"
                data-testid="start-recording-btn"
              >
                <svg width={sizeConfig.buttonSize * 0.4} height={sizeConfig.buttonSize * 0.4} viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    );
  },
);

RecordingIndicator.displayName = 'RecordingIndicator';
