/**
 * @module FileTransferProgress
 */
import React, { forwardRef, useMemo } from 'react';
import type { FileTransferProgressProps } from '@coexist/wisp-core/types/FileTransferProgress.types';
import {
  buildTransferProgressRootStyle,
  buildTransferProgressHeaderStyle,
  buildTransferProgressFileInfoStyle,
  buildTransferProgressFilenameStyle,
  buildTransferProgressDirectionStyle,
  buildTransferProgressBarTrackStyle,
  buildTransferProgressBarFillStyle,
  buildTransferProgressStatsStyle,
  buildTransferProgressStepsStyle,
  buildTransferProgressStepDotStyle,
  buildTransferProgressStepConnectorStyle,
  buildTransferProgressActionsStyle,
  buildTransferProgressSkeletonStyle,
} from '@coexist/wisp-core/styles/FileTransferProgress.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatSpeed(bps: number): string {
  if (bps < 1024) return `${bps} B/s`;
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
  return `${(bps / 1024 / 1024).toFixed(1)} MB/s`;
}

// ---------------------------------------------------------------------------
// FileTransferProgress
// ---------------------------------------------------------------------------

/**
 * FileTransferProgress — stepped progress indicator for file transfers.
 *
 * @example
 * ```tsx
 * <FileTransferProgress
 *   filename="report.pdf"
 *   direction="upload"
 *   state="transferring"
 *   steps={[
 *     { label: 'Requesting', status: 'complete' },
 *     { label: 'Transferring', status: 'active' },
 *     { label: 'Verifying', status: 'pending' },
 *   ]}
 *   progress={65}
 *   bytesTransferred={6500000}
 *   totalBytes={10000000}
 *   speedBps={1200000}
 * />
 * ```
 */
export const FileTransferProgress = forwardRef<HTMLDivElement, FileTransferProgressProps>(
  function FileTransferProgress(
    {
      filename,
      direction,
      state,
      steps,
      progress,
      bytesTransferred,
      totalBytes,
      speedBps,
      peerName,
      transportType,
      onPause,
      onResume,
      onCancel,
      onRetry,
      expanded = false,
      onExpandDetails,
      compact = false,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const rootStyle = useMemo(() => buildTransferProgressRootStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildTransferProgressHeaderStyle(theme), [theme]);
    const fileInfoStyle = useMemo(() => buildTransferProgressFileInfoStyle(theme), [theme]);
    const filenameStyle = useMemo(() => buildTransferProgressFilenameStyle(theme), [theme]);
    const directionStyle = useMemo(() => buildTransferProgressDirectionStyle(theme, direction), [theme, direction]);
    const trackStyle = useMemo(() => buildTransferProgressBarTrackStyle(theme), [theme]);
    const fillStyle = useMemo(() => buildTransferProgressBarFillStyle(theme, progress, state), [theme, progress, state]);
    const statsStyle = useMemo(() => buildTransferProgressStatsStyle(theme), [theme]);
    const stepsRowStyle = useMemo(() => buildTransferProgressStepsStyle(theme), [theme]);
    const actionsStyle = useMemo(() => buildTransferProgressActionsStyle(theme), [theme]);
    const skeletonStyle = useMemo(() => buildTransferProgressSkeletonStyle(theme), [theme]);

    if (skeleton) {
      return (
        <div ref={ref} className={className} style={{ ...skeletonStyle, ...userStyle }} data-testid="file-transfer-progress-skeleton" {...rest} />
      );
    }

    const directionIcon = direction === 'upload' ? '\u2191' : '\u2193';
    const isPaused = state === 'paused';
    const isError = state === 'error';
    const isComplete = state === 'complete';

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...rootStyle, ...userStyle }}
        data-testid="file-transfer-progress"
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={fileInfoStyle}>
            <span style={directionStyle}>{directionIcon}</span>
            <div style={filenameStyle} title={filename}>{filename}</div>
          </div>
          <div style={actionsStyle}>
            {isPaused && onResume && (
              <button type="button" onClick={onResume} aria-label="Resume transfer" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.accent.primary, fontSize: 12 }}>
                Resume
              </button>
            )}
            {!isPaused && !isComplete && !isError && onPause && (
              <button type="button" onClick={onPause} aria-label="Pause transfer" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.text.muted, fontSize: 12 }}>
                Pause
              </button>
            )}
            {isError && onRetry && (
              <button type="button" onClick={onRetry} aria-label="Retry transfer" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.accent.primary, fontSize: 12 }}>
                Retry
              </button>
            )}
            {!isComplete && onCancel && (
              <button type="button" onClick={onCancel} aria-label="Cancel transfer" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.status.danger, fontSize: 12 }}>
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Step indicator */}
        {!compact && steps.length > 0 && (
          <div style={stepsRowStyle}>
            {steps.map((step, i) => (
              <React.Fragment key={step.label}>
                {i > 0 && <div style={buildTransferProgressStepConnectorStyle(theme, step.status === 'complete' || step.status === 'active')} />}
                <div
                  style={buildTransferProgressStepDotStyle(theme, step.status)}
                  title={step.label}
                  aria-label={`${step.label}: ${step.status}`}
                />
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div style={trackStyle}>
          <div style={fillStyle} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
        </div>

        {/* Stats */}
        <div style={statsStyle}>
          <span>{formatSize(bytesTransferred)} / {formatSize(totalBytes)}</span>
          {speedBps != null && !isComplete && !isError && (
            <span>{formatSpeed(speedBps)}</span>
          )}
          {isComplete && <span>Complete</span>}
          {isError && <span style={{ color: theme.colors.status.danger }}>Failed</span>}
        </div>
      </div>
    );
  },
);

FileTransferProgress.displayName = 'FileTransferProgress';
