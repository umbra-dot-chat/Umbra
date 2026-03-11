import React, { forwardRef, useMemo } from 'react';
import type { StorageUsageVizProps, StorageBar } from '@coexist/wisp-core/types/StorageUsageViz.types';
import {
  getDefaultBarColor,
  buildVizContainerStyle,
  buildChartAreaStyle,
  buildBarRowStyle,
  buildBarLabelStyle,
  buildBarTrackStyle,
  buildBarFillStyle,
  buildBarValueStyle,
  buildLegendStyle,
  buildLegendItemStyle,
  buildLegendDotStyle,
  buildLegendLabelStyle,
  buildVizSkeletonStyle,
} from '@coexist/wisp-core/styles/StorageUsageViz.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * StorageUsageViz -- Bar chart visualization of used vs available storage per node.
 *
 * @remarks
 * Renders horizontal bars with labels, percentages, and an optional legend.
 *
 * @module components/storage-usage-viz
 */
export const StorageUsageViz = forwardRef<HTMLDivElement, StorageUsageVizProps>(
  function StorageUsageViz(
    {
      bars,
      title = 'Storage Usage',
      showLegend = true,
      height = 200,
      skeleton = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle = useMemo(() => buildVizContainerStyle(theme), [theme]);
    const chartAreaStyle = useMemo(() => buildChartAreaStyle(height, theme), [height, theme]);
    const legendStyle = useMemo(() => buildLegendStyle(theme), [theme]);

    // Skeleton early return
    if (skeleton) {
      return (
        <div
          ref={ref}
          className={className}
          aria-hidden
          style={{ ...buildVizSkeletonStyle(height, theme), ...userStyle }}
          {...rest}
        />
      );
    }

    const resolvedBars = bars.map((bar, i) => ({
      ...bar,
      color: bar.color || getDefaultBarColor(i),
      percent: bar.totalBytes > 0 ? (bar.usedBytes / bar.totalBytes) * 100 : 0,
    }));

    return (
      <div ref={ref} className={className} style={{ ...containerStyle, ...userStyle }} {...rest}>
        {/* Title */}
        <span style={{ fontSize: 16, fontWeight: 600, color: theme.colors.text.primary }}>
          {title}
        </span>

        {/* Chart area */}
        <div style={chartAreaStyle}>
          {resolvedBars.map((bar, i) => (
            <BarRow key={bar.label + i} bar={bar} percent={bar.percent} color={bar.color} theme={theme} />
          ))}
        </div>

        {/* Legend */}
        {showLegend && resolvedBars.length > 0 && (
          <div style={legendStyle}>
            {resolvedBars.map((bar, i) => (
              <div key={bar.label + i} style={buildLegendItemStyle()}>
                <div style={buildLegendDotStyle(bar.color, theme)} />
                <span style={buildLegendLabelStyle(theme)}>{bar.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

StorageUsageViz.displayName = 'StorageUsageViz';

// ---------------------------------------------------------------------------
// BarRow (internal)
// ---------------------------------------------------------------------------

function BarRow({
  bar,
  percent,
  color,
  theme,
}: {
  bar: StorageBar;
  percent: number;
  color: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const rowStyle = useMemo(() => buildBarRowStyle(theme), [theme]);
  const labelStyle = useMemo(() => buildBarLabelStyle(theme), [theme]);
  const trackStyle = useMemo(() => buildBarTrackStyle(theme), [theme]);
  const fillStyle = useMemo(() => buildBarFillStyle(percent, color), [percent, color]);
  const valueStyle = useMemo(() => buildBarValueStyle(theme), [theme]);

  return (
    <div style={rowStyle}>
      <span style={labelStyle} title={bar.label}>{bar.label}</span>
      <div style={trackStyle}>
        <div style={fillStyle} />
      </div>
      <span style={valueStyle}>{percent.toFixed(0)}%</span>
    </div>
  );
}
