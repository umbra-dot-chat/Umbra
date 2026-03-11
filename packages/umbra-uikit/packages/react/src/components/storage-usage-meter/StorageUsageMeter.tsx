/**
 * @module StorageUsageMeter
 */
import React, { forwardRef, useMemo } from 'react';
import type { StorageUsageMeterProps } from '@coexist/wisp-core/types/StorageUsageMeter.types';
import {
  buildStorageMeterRootStyle,
  buildStorageMeterHeaderStyle,
  buildStorageMeterTitleStyle,
  buildStorageMeterUsageTextStyle,
  buildStorageMeterBarStyle,
  buildStorageMeterSegmentStyle,
  buildStorageMeterLegendStyle,
  buildStorageMeterLegendItemStyle,
  buildStorageMeterLegendDotStyle,
  buildStorageMeterLegendLabelStyle,
  buildStorageMeterActionsStyle,
  buildStorageMeterSkeletonStyle,
} from '@coexist/wisp-core/styles/StorageUsageMeter.styles';
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

// ---------------------------------------------------------------------------
// StorageUsageMeter
// ---------------------------------------------------------------------------

/**
 * StorageUsageMeter — storage breakdown with segmented bar and cleanup actions.
 *
 * @example
 * ```tsx
 * <StorageUsageMeter
 *   totalUsed={1024 * 1024 * 500}
 *   totalAvailable={1024 * 1024 * 1024}
 *   breakdown={[
 *     { label: 'Images', bytes: 200 * 1024 * 1024, color: '#3B82F6' },
 *     { label: 'Documents', bytes: 150 * 1024 * 1024, color: '#10B981' },
 *   ]}
 * />
 * ```
 */
export const StorageUsageMeter = forwardRef<HTMLDivElement, StorageUsageMeterProps>(
  function StorageUsageMeter(
    {
      totalUsed,
      totalAvailable,
      breakdown,
      onCleanup,
      onManageStorage,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const rootStyle = useMemo(() => buildStorageMeterRootStyle(theme), [theme]);
    const headerStyle = useMemo(() => buildStorageMeterHeaderStyle(theme), [theme]);
    const titleStyle = useMemo(() => buildStorageMeterTitleStyle(theme), [theme]);
    const usageTextStyle = useMemo(() => buildStorageMeterUsageTextStyle(theme), [theme]);
    const barStyle = useMemo(() => buildStorageMeterBarStyle(theme), [theme]);
    const legendStyle = useMemo(() => buildStorageMeterLegendStyle(theme), [theme]);
    const legendItemStyle = useMemo(() => buildStorageMeterLegendItemStyle(theme), [theme]);
    const legendLabelStyle = useMemo(() => buildStorageMeterLegendLabelStyle(theme), [theme]);
    const actionsStyle = useMemo(() => buildStorageMeterActionsStyle(theme), [theme]);
    const skeletonStyle = useMemo(() => buildStorageMeterSkeletonStyle(theme), [theme]);

    if (skeleton) {
      return (
        <div ref={ref} className={className} style={{ ...skeletonStyle, ...userStyle }} data-testid="storage-usage-meter-skeleton" {...rest} />
      );
    }

    const total = totalAvailable ?? totalUsed;

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...rootStyle, ...userStyle }}
        data-testid="storage-usage-meter"
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={titleStyle}>Storage</div>
          <div style={usageTextStyle}>
            {formatSize(totalUsed)}{totalAvailable ? ` / ${formatSize(totalAvailable)}` : ''}
          </div>
        </div>

        {/* Segmented bar */}
        <div style={barStyle}>
          {breakdown.map(segment => {
            const pct = total > 0 ? (segment.bytes / total) * 100 : 0;
            return (
              <div key={segment.label} style={buildStorageMeterSegmentStyle(segment.color, pct)} title={`${segment.label}: ${formatSize(segment.bytes)}`} />
            );
          })}
        </div>

        {/* Legend */}
        <div style={legendStyle}>
          {breakdown.map(segment => (
            <div key={segment.label} style={legendItemStyle}>
              <div style={buildStorageMeterLegendDotStyle(segment.color, theme)} />
              <span style={legendLabelStyle}>{segment.label} ({formatSize(segment.bytes)})</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        {(onCleanup || onManageStorage) && (
          <div style={actionsStyle}>
            {onCleanup && (
              <button type="button" onClick={onCleanup} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.accent.primary, fontSize: 12 }}>
                Clean up
              </button>
            )}
            {onManageStorage && (
              <button type="button" onClick={onManageStorage} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: theme.colors.accent.primary, fontSize: 12 }}>
                Manage storage
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);

StorageUsageMeter.displayName = 'StorageUsageMeter';
