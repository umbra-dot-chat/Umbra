import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';
import type { RadarChartSize, RadarChartSeries as RadarChartSeriesType } from '@coexist/wisp-core/types/RadarChart.types';
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
} from '@coexist/wisp-core/styles/RadarChart.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface RadarChartProps {
  axes: string[];
  series: RadarChartSeriesType[];
  size?: RadarChartSize;
  max?: number;
  levels?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  fillOpacity?: number;
  style?: object;
}

/**
 * RadarChart — Multi-axis radar (spider) chart (React Native).
 */
export const RadarChart = forwardRef<View, RadarChartProps>(
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
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = radarChartSizeMap[size];

    const chartColors = useMemo(
      () => resolveRadarChartColors(theme),
      [themeColors],
    );

    const seriesColors = useMemo(
      () => series.map((s, i) => s.color || resolveSeriesColor(i, theme)),
      [series, themeColors],
    );

    const viewBoxSize = sizeConfig.size;
    const center = viewBoxSize / 2;
    const chartRadius = center - sizeConfig.labelMargin;
    const axisCount = axes.length;

    // Grid polygons
    const gridPolygons = useMemo(() => {
      return Array.from({ length: levels }, (_, level) => {
        const r = chartRadius * ((level + 1) / levels);
        const pts = regularPolygonPoints(axisCount, r, center, center);
        return pointsToString(pts);
      });
    }, [levels, chartRadius, axisCount, center]);

    // Axis lines
    const axisLines = useMemo(() => {
      return Array.from({ length: axisCount }, (_, i) => {
        const angle = axisAngle(i, axisCount);
        const end = polarToCartesian(center, center, chartRadius, angle);
        return { x1: center, y1: center, x2: end.x, y2: end.y };
      });
    }, [axisCount, chartRadius, center]);

    // Axis label positions
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

    return (
      <View
        ref={ref}
        accessibilityRole="image"
        accessibilityLabel={`Radar chart with ${axisCount} axes: ${axes.join(', ')}`}
        style={[
          { alignItems: 'center', gap: showLegend ? 16 : 0 },
          userStyle,
        ]}
      >
        <Svg
          width={sizeConfig.size}
          height={sizeConfig.size}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        >
          {/* Grid polygons */}
          {gridPolygons.map((pts, i) => (
            <Polygon
              key={`grid-${i}`}
              points={pts}
              fill="none"
              stroke={chartColors.grid}
              strokeWidth={1}
            />
          ))}

          {/* Axis lines */}
          {axisLines.map((line, i) => (
            <Line
              key={`axis-${i}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={chartColors.grid}
              strokeWidth={1}
            />
          ))}

          {/* Data fills */}
          {dataPolygons.map((dp, i) => (
            <Polygon
              key={`fill-${i}`}
              points={dp.pointsStr}
              fill={seriesColors[i]}
              fillOpacity={fillOpacity}
              stroke="none"
            />
          ))}

          {/* Data outlines */}
          {dataPolygons.map((dp, i) => (
            <Polygon
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
                <Circle
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
              const dx = pos.x - center;
              let textAnchor: 'start' | 'middle' | 'end' = 'middle';
              if (dx > 1) textAnchor = 'start';
              else if (dx < -1) textAnchor = 'end';

              const dy = pos.y - center;
              let alignmentBaseline: 'baseline' | 'middle' | 'hanging' = 'middle';
              if (dy < -1) alignmentBaseline = 'baseline';
              else if (dy > 1) alignmentBaseline = 'hanging';

              return (
                <SvgText
                  key={`label-${i}`}
                  x={pos.x}
                  y={pos.y}
                  textAnchor={textAnchor}
                  alignmentBaseline={alignmentBaseline}
                  fill={chartColors.labelText}
                  fontSize={sizeConfig.labelFontSize}
                  fontWeight="500"
                >
                  {axes[i]}
                </SvgText>
              );
            })}
        </Svg>

        {/* Legend */}
        {showLegend && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: defaultSpacing.lg }}>
            {series.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: defaultRadii.sm,
                    backgroundColor: seriesColors[i],
                  }}
                />
                <RNText
                  style={{
                    fontSize: sizeConfig.legendFontSize,
                    fontWeight: defaultTypography.weights.medium,
                    color: chartColors.legendText,
                  }}
                >
                  {s.label}
                </RNText>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  },
);

RadarChart.displayName = 'RadarChart';
