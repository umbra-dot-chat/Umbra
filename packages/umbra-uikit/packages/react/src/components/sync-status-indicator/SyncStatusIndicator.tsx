/**
 * @module SyncStatusIndicator
 */
import React, { forwardRef, useMemo } from 'react';
import type { SyncStatusIndicatorProps } from '@coexist/wisp-core/types/SyncStatusIndicator.types';
import {
  buildSyncStatusRootStyle,
  buildSyncStatusRingStyle,
  buildSyncStatusDotStyle,
  buildSyncStatusLabelStyle,
} from '@coexist/wisp-core/styles/SyncStatusIndicator.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// SyncStatusIndicator
// ---------------------------------------------------------------------------

/**
 * SyncStatusIndicator — small badge with optional progress ring.
 *
 * @example
 * ```tsx
 * <SyncStatusIndicator status="syncing" progress={60} showLabel />
 * ```
 */
export const SyncStatusIndicator = forwardRef<HTMLDivElement, SyncStatusIndicatorProps>(
  function SyncStatusIndicator(
    {
      status,
      progress,
      size = 'md',
      showLabel = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const rootStyle = useMemo(() => buildSyncStatusRootStyle(theme, size), [theme, size]);
    const ringStyle = useMemo(() => buildSyncStatusRingStyle(size), [size]);
    const dotStyle = useMemo(() => buildSyncStatusDotStyle(theme, status, size), [theme, status, size]);
    const labelStyle = useMemo(() => buildSyncStatusLabelStyle(theme, status, size), [theme, status, size]);

    const ringDim = { sm: 16, md: 20, lg: 28 }[size];
    const ringRadius = (ringDim / 2) - 2;
    const circumference = 2 * Math.PI * ringRadius;
    const offset = circumference - (progress / 100) * circumference;
    const isSyncing = status === 'syncing';

    const statusColorMap: Record<string, string> = {
      synced: theme.colors.status.success,
      syncing: theme.colors.accent.primary,
      offline: theme.colors.text.muted,
      error: theme.colors.status.danger,
    };

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...rootStyle, ...userStyle }}
        data-testid="sync-status-indicator"
        aria-label={`Sync status: ${status}`}
        {...rest}
      >
        <div style={ringStyle}>
          {isSyncing && (
            <svg width={ringDim} height={ringDim} viewBox={`0 0 ${ringDim} ${ringDim}`} style={{ position: 'absolute' }}>
              <circle
                cx={ringDim / 2}
                cy={ringDim / 2}
                r={ringRadius}
                fill="none"
                stroke={theme.colors.border.subtle}
                strokeWidth={2}
              />
              <circle
                cx={ringDim / 2}
                cy={ringDim / 2}
                r={ringRadius}
                fill="none"
                stroke={statusColorMap[status]}
                strokeWidth={2}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringDim / 2} ${ringDim / 2})`}
              />
            </svg>
          )}
          <div style={dotStyle} />
        </div>
        {showLabel && <span style={labelStyle}>{status}</span>}
      </div>
    );
  },
);

SyncStatusIndicator.displayName = 'SyncStatusIndicator';
