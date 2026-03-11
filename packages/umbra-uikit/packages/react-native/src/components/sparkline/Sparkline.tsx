/**
 * @module components/sparkline
 * @description React Native Sparkline for the Wisp design system.
 *
 * Tiny inline SVG charts (line, area, bar) using react-native-svg.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import type { SparklineVariant, SparklineSize, SparklineColor } from '@coexist/wisp-core/types/Sparkline.types';
import { sparklineSizeMap } from '@coexist/wisp-core/types/Sparkline.types';
import { defaultRadii } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SparklineProps extends ViewProps {
  /** Array of numeric values to plot. */
  data: number[];
  /** Chart type. @default 'line' */
  variant?: SparklineVariant;
  /** Preset dimensions. @default 'md' */
  size?: SparklineSize;
  /** Accent color. @default 'default' */
  color?: SparklineColor;
  /** Smooth curves. @default true */
  curved?: boolean;
  /** Show dot on last point. @default false */
  showEndDot?: boolean;
  /** Opacity of fill for area variant. @default 0.15 */
  fillOpacity?: number;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Sparkline = forwardRef<View, SparklineProps>(
  function Sparkline(
    {
      data,
      variant = 'line',
      size = 'md',
      color = 'default',
      curved = true,
      showEndDot = false,
      fillOpacity = 0.15,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = sparklineSizeMap[size];

    const accentColor = useMemo(() => {
      switch (color) {
        case 'success': return themeColors.status.success;
        case 'warning': return themeColors.status.warning;
        case 'danger': return themeColors.status.danger;
        case 'info': return themeColors.status.info;
        default: return themeColors.accent.primary;
      }
    }, [color, themeColors]);

    if (skeleton || !data || data.length < 2) {
      const skeletonStyle: ViewStyle = {
        width: sizeConfig.width,
        height: sizeConfig.height,
        borderRadius: defaultRadii.sm,
        backgroundColor: themeColors.border.subtle,
      };
      return <View ref={ref} style={[skeletonStyle, userStyle]} {...rest} />;
    }

    const { width, height, strokeWidth, dotRadius, barGap } = sizeConfig;
    const padding = strokeWidth + dotRadius;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((val, i) => ({
      x: padding + ((width - padding * 2) * i) / (data.length - 1),
      y: padding + ((height - padding * 2) * (1 - (val - min) / range)),
    }));

    // Build line path
    const linePath = useMemo(() => {
      if (points.length < 2) return '';
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        if (curved && i < points.length) {
          const cp1x = (points[i - 1].x + points[i].x) / 2;
          d += ` C ${cp1x} ${points[i - 1].y}, ${cp1x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
        } else {
          d += ` L ${points[i].x} ${points[i].y}`;
        }
      }
      return d;
    }, [points, curved]);

    // Area fill path
    const areaPath = useMemo(() => {
      if (variant !== 'area' || !linePath) return '';
      return `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    }, [variant, linePath, points, height]);

    const lastPoint = points[points.length - 1];

    if (variant === 'bar') {
      const barWidth = Math.max(1, (width - barGap * (data.length - 1)) / data.length);
      return (
        <View ref={ref} style={[{ width, height }, userStyle]} {...rest}>
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {data.map((val, i) => {
              const barHeight = Math.max(2, ((val - min) / range) * (height - 4));
              return (
                <Rect
                  key={i}
                  x={i * (barWidth + barGap)}
                  y={height - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={1}
                  fill={accentColor}
                  opacity={0.8}
                />
              );
            })}
          </Svg>
        </View>
      );
    }

    return (
      <View ref={ref} style={[{ width, height }, userStyle]} {...rest}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {variant === 'area' && areaPath && (
            <Path d={areaPath} fill={accentColor} opacity={fillOpacity} />
          )}
          <Path d={linePath} fill="none" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
          {showEndDot && lastPoint && (
            <Circle cx={lastPoint.x} cy={lastPoint.y} r={dotRadius} fill={accentColor} />
          )}
        </Svg>
      </View>
    );
  },
);

Sparkline.displayName = 'Sparkline';
