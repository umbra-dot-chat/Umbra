import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TransferState = 'requesting' | 'negotiating' | 'transferring' | 'verifying' | 'complete' | 'error' | 'paused' | 'cancelled';

export interface TransferStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export interface FileTransferProgressProps {
  filename: string;
  direction: 'upload' | 'download';
  state: TransferState;
  steps: TransferStep[];
  progress: number;
  bytesTransferred: number;
  totalBytes: number;
  speedBps?: number;
  peerName?: string;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  compact?: boolean;
  skeleton?: boolean;
  style?: ViewStyle;
}

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

export const FileTransferProgress = forwardRef<View, FileTransferProgressProps>(
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
      onPause,
      onResume,
      onCancel,
      onRetry,
      compact = false,
      skeleton = false,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const rootStyle = useMemo<ViewStyle>(() => ({
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: tc.border.subtle,
      backgroundColor: tc.background.surface,
      padding: defaultSpacing.md,
      gap: defaultSpacing.sm,
    }), [tc]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: defaultSpacing.sm,
    }), []);

    const trackStyle = useMemo<ViewStyle>(() => ({
      width: '100%',
      height: 6,
      borderRadius: defaultRadii.full,
      backgroundColor: tc.border.subtle,
      overflow: 'hidden',
    }), [tc]);

    const isError = state === 'error';
    const isPaused = state === 'paused';
    const isComplete = state === 'complete';

    const fillColor = isError ? tc.status.danger : isPaused ? tc.status.warning : tc.accent.primary;

    if (skeleton) {
      return (
        <View ref={ref} style={[{ height: 80, borderRadius: defaultRadii.lg, backgroundColor: tc.border.subtle }, userStyle]} />
      );
    }

    return (
      <View ref={ref} style={[rootStyle, userStyle]} accessibilityRole="progressbar" accessibilityLabel={`${direction} ${filename}`}>
        {/* Header */}
        <View style={headerStyle}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm, flex: 1, minWidth: 0 }}>
            <RNText style={{ color: direction === 'upload' ? tc.status.success : tc.accent.primary, fontSize: 14 } as TextStyle}>
              {direction === 'upload' ? '\u2191' : '\u2193'}
            </RNText>
            <RNText numberOfLines={1} style={{ fontSize: defaultTypography.sizes.sm.fontSize, fontWeight: '500', color: tc.text.primary, flex: 1 } as TextStyle}>
              {filename}
            </RNText>
          </View>
          <View style={{ flexDirection: 'row', gap: defaultSpacing.xs }}>
            {isPaused && onResume && (
              <Pressable onPress={onResume}><RNText style={{ color: tc.accent.primary, fontSize: 12 } as TextStyle}>Resume</RNText></Pressable>
            )}
            {!isPaused && !isComplete && !isError && onPause && (
              <Pressable onPress={onPause}><RNText style={{ color: tc.text.muted, fontSize: 12 } as TextStyle}>Pause</RNText></Pressable>
            )}
            {isError && onRetry && (
              <Pressable onPress={onRetry}><RNText style={{ color: tc.accent.primary, fontSize: 12 } as TextStyle}>Retry</RNText></Pressable>
            )}
            {!isComplete && onCancel && (
              <Pressable onPress={onCancel}><RNText style={{ color: tc.status.danger, fontSize: 12 } as TextStyle}>Cancel</RNText></Pressable>
            )}
          </View>
        </View>

        {/* Steps */}
        {!compact && steps.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.xs }}>
            {steps.map((step, i) => {
              const dotColor = step.status === 'complete' ? tc.status.success
                : step.status === 'active' ? tc.accent.primary
                : step.status === 'error' ? tc.status.danger
                : tc.border.strong;
              return (
                <React.Fragment key={step.label}>
                  {i > 0 && <View style={{ width: 16, height: 2, backgroundColor: step.status === 'complete' || step.status === 'active' ? tc.status.success : tc.border.subtle }} />}
                  <View style={{ width: 8, height: 8, borderRadius: defaultRadii.full, backgroundColor: dotColor }} />
                </React.Fragment>
              );
            })}
          </View>
        )}

        {/* Progress bar */}
        <View style={trackStyle}>
          <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, progress))}%`, borderRadius: defaultRadii.full, backgroundColor: fillColor } as ViewStyle} />
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
            {formatSize(bytesTransferred)} / {formatSize(totalBytes)}
          </RNText>
          {speedBps != null && !isComplete && !isError && (
            <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.text.muted } as TextStyle}>
              {formatSpeed(speedBps)}
            </RNText>
          )}
          {isComplete && <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.status.success } as TextStyle}>Complete</RNText>}
          {isError && <RNText style={{ fontSize: defaultTypography.sizes.xs.fontSize, color: tc.status.danger } as TextStyle}>Failed</RNText>}
        </View>
      </View>
    );
  },
);

FileTransferProgress.displayName = 'FileTransferProgress';
