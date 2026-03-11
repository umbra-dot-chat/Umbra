import React, { forwardRef, useMemo } from 'react';
import type { RadarChartProps } from '@coexist/wisp-core/types/RadarChart.types';
import { radarChartSizeMap } from '@coexist/wisp-core/types/RadarChart.types';
import {
  computePolygonPoints,
  pointsToString,
  regularPolygonPoints,
  axisAngle,
  polarToCartesian,
} from '@coexist/wisp-core/styles/chart-utils';
import {
  resolveSeriesColor,
  resolveRadarChartColors,
  buildRadarChartWrapperStyle,
  buildRadarChartSvgContainerStyle,
  buildRadarChartLegendStyle,
  buildRadarChartLegendItemStyle,
  buildRadarChartLegendDotStyle,
  buildRadarChartLegendTextStyle,
} from '@coexist/wisp-core/styles/RadarChart.styles';
import { useTheme } from '../../providers';

/**
 * RadarChart — Multi-axis radar (spider) chart.
 *
 * @remarks
 * Renders a radar chart for comparing one or more data series across
 * named axes. Built with raw SVG — no external charting library.
 *
 * - Up to 5 data series, each with a distinct colour.
 * - Concentric polygon grid with configurable levels.
 * - Axis labels, data-point dots, and colour-coded legend.
 * - Semi-transparent area fill per series.
 *
 * @see {@link RadarChartProps} for the full prop API.
 *
 * @example
 * ```tsx
 * <RadarChart
 *   axes={['Speed', 'Power', 'Range', 'Durability', 'Precision']}
 *   series={[
 *     { label: 'Hero A', values: [90, 60, 80, 70, 95] },
 *     { label: 'Hero B', values: [70, 85, 60, 90, 50] },
 *   ]}
 * />
 * ```
 */
export const RadarChart = forwardRef<HTMLDivElement, RadarChartProps>(
  function RadarChart(
    {
      axes,
      series,
      size = 'md',
      max = 100,
      levels = 4,
      showLabels = true,
      showLegend = true,
      showDots = true,
      fillOpacity = 0.15,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const sizeConfig = radarChartSizeMap[size];

    // -----------------------------------------------------------------------
    // Colours
    // -----------------------------------------------------------------------
    const chartColors = useMemo(
      () => resolveRadarChartColors(theme),
      [theme],
    );

    const seriesColors = useMemo(
      () => series.map((s, i) => s.color || resolveSeriesColor(i, theme)),
      [series, theme],
    );

    // -----------------------------------------------------------------------
    // Geometry
    // -----------------------------------------------------------------------
    const viewBoxSize = sizeConfig.size;
    const center = viewBoxSize / 2;
    const chartRadius = center - sizeConfig.labelMargin;
    const axisCount = axes.length;

    // Grid polygons (concentric)
    const gridPolygons = useMemo(() => {
      return Array.from({ length: levels }, (_, level) => {
        const r = chartRadius * ((level + 1) / levels);
        const pts = regularPolygonPoints(axisCount, r, center, center);
        return pointsToString(pts);
      });
    }, [levels, chartRadius, axisCount, center]);

    // Axis lines (centre → outer vertex)
    const axisLines = useMemo(() => {
      return Array.from({ length: axisCount }, (_, i) => {
        const angle = axisAngle(i, axisCount);
        const end = polarToCartesian(center, center, chartRadius, angle);
        return { x1: center, y1: center, x2: end.x, y2: end.y };
      });
    }, [axisCount, chartRadius, center]);

    // Axis label positions (slightly beyond the outer polygon)
    const labelPositions = useMemo(() => {
      const labelRadius = chartRadius + sizeConfig.labelMargin * 0.5;
      return axes.map((_, i) => {
        const angle = axisAngle(i, axisCount);
        return polarToCartesian(center, center, labelRadius, angle);
      });
    }, [axes, axisCount, chartRadius, center, sizeConfig.labelMargin]);

    // Data polygons
    const dataPolygons = useMemo(() => {
      return series.map((s) => {
        const pts = computePolygonPoints(s.values, max, chartRadius, center, center);
        return { points: pts, pointsStr: pointsToString(pts) };
      });
    }, [series, max, chartRadius, center]);

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const wrapperStyle = useMemo(
      () => buildRadarChartWrapperStyle(showLegend),
      [showLegend],
    );

    const svgContainerStyle = useMemo(
      () => buildRadarChartSvgContainerStyle(sizeConfig),
      [sizeConfig],
    );

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div
        ref={ref}
        className={className}
        style={{ ...wrapperStyle, ...userStyle }}
        role="img"
        aria-label={`Radar chart with ${axisCount} axes: ${axes.join(', ')}`}
        {...rest}
      >
        <div style={svgContainerStyle}>
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: sizeConfig.size, height: sizeConfig.size, display: 'block' }}
          >
            {/* Grid polygons */}
            {gridPolygons.map((pts, i) => (
              <polygon
                key={`grid-${i}`}
                points={pts}
                fill="none"
                stroke={chartColors.grid}
                strokeWidth={1}
              />
            ))}

            {/* Axis lines */}
            {axisLines.map((line, i) => (
              <line
                key={`axis-${i}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke={chartColors.grid}
                strokeWidth={1}
              />
            ))}

            {/* Data area fills */}
            {dataPolygons.map((dp, i) => (
              <polygon
                key={`fill-${i}`}
                points={dp.pointsStr}
                fill={seriesColors[i]}
                fillOpacity={fillOpacity}
                stroke="none"
              />
            ))}

            {/* Data outlines */}
            {dataPolygons.map((dp, i) => (
              <polygon
                key={`outline-${i}`}
                points={dp.pointsStr}
                fill="none"
                stroke={seriesColors[i]}
                strokeWidth={2}
                strokeLinejoin="round"
              />
            ))}

            {/* Data dots */}
            {showDots &&
              dataPolygons.map((dp, seriesIdx) =>
                dp.points.map((pt, ptIdx) => (
                  <circle
                    key={`dot-${seriesIdx}-${ptIdx}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={sizeConfig.dotRadius}
                    fill={seriesColors[seriesIdx]}
                  />
                )),
              )}

            {/* Axis labels */}
            {showLabels &&
              labelPositions.map((pos, i) => {
                // Adjust text-anchor based on position relative to centre
                const dx = pos.x - center;
                let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                if (dx > 1) textAnchor = 'start';
                else if (dx < -1) textAnchor = 'end';

                // Adjust vertical alignment
                const dy = pos.y - center;
                let dominantBaseline: 'auto' | 'central' | 'hanging' = 'central';
                if (dy < -1) dominantBaseline = 'auto';
                else if (dy > 1) dominantBaseline = 'hanging';

                return (
                  <text
                    key={`label-${i}`}
                    x={pos.x}
                    y={pos.y}
                    textAnchor={textAnchor}
                    dominantBaseline={dominantBaseline}
                    fill={chartColors.labelText}
                    fontSize={sizeConfig.labelFontSize}
                    fontWeight={500}
                  >
                    {axes[i]}
                  </text>
                );
              })}
          </svg>
        </div>

        {/* Legend */}
        {showLegend && (
          <div style={buildRadarChartLegendStyle(theme)}>
            {series.map((s, i) => (
              <div key={i} style={buildRadarChartLegendItemStyle(theme)}>
                <div style={buildRadarChartLegendDotStyle(seriesColors[i], theme)} />
                <span style={buildRadarChartLegendTextStyle(sizeConfig, chartColors, theme)}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

RadarChart.displayName = 'RadarChart';
