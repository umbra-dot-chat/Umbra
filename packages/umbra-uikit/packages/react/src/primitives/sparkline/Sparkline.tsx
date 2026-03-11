/**
 * @module Sparkline
 * @description Tiny inline SVG chart (line, area, bar) for embedding in
 * tables, cards, dashboards, and stat displays.
 */

import React, { forwardRef, useMemo, useEffect, useId } from 'react';
import { useTheme } from '../../providers';
import type { SparklineProps } from '@coexist/wisp-core/types/Sparkline.types';
import { sparklineSizeMap } from '@coexist/wisp-core/types/Sparkline.types';
import {
  resolveSparklineColors,
  buildSparklineWrapperStyle,
  buildSparklineSvgStyle,
  buildSparklineSkeletonStyle,
  ensureSparklineKeyframes,
} from '@coexist/wisp-core/styles/Sparkline.styles';

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Normalise data points into SVG coordinate space. */
function normalisePoints(
  data: number[],
  width: number,
  height: number,
  padding: number,
): Array<{ x: number; y: number }> {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // avoid division by zero for flat data

  const plotH = height - padding * 2;
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  return data.map((value, i) => ({
    x: padding + i * stepX,
    y: padding + plotH - ((value - min) / range) * plotH,
  }));
}

/** Build a straight-line SVG path string from points. */
function linearPath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
}

/** Build a smooth monotone cubic-bezier SVG path string. */
function smoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return linearPath(points);

  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // Catmull-Rom → cubic bezier control points (tension = 0.5)
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}

/** Close a path to create a filled area shape. */
function areaPath(
  pathD: string,
  points: Array<{ x: number; y: number }>,
  height: number,
  padding: number,
): string {
  if (points.length === 0) return pathD;
  const last = points[points.length - 1];
  const first = points[0];
  const bottom = height - padding;
  return `${pathD} L${last.x.toFixed(2)},${bottom.toFixed(2)} L${first.x.toFixed(2)},${bottom.toFixed(2)} Z`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Sparkline = forwardRef<HTMLDivElement, SparklineProps>(function Sparkline(
  {
    data,
    variant = 'line',
    size = 'md',
    color = 'default',
    curved = true,
    showEndDot = false,
    animated = false,
    fillOpacity = 0.15,
    responsive = false,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = sparklineSizeMap[size];
  const gradientId = useId();

  // Inject animation keyframes if needed
  useEffect(() => {
    if (animated) ensureSparklineKeyframes();
  }, [animated]);

  // Resolve colors
  const colors = useMemo(
    () => resolveSparklineColors(color, theme),
    [color, theme],
  );

  // Skeleton early return
  if (skeleton) {
    const skeletonStyle = buildSparklineSkeletonStyle(sizeConfig, responsive, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Bail if no data
  if (!data || data.length === 0) {
    return null;
  }

  // Styles
  const wrapperStyle = useMemo(
    () => buildSparklineWrapperStyle(sizeConfig, responsive),
    [sizeConfig, responsive],
  );

  const svgStyle = useMemo(
    () => buildSparklineSvgStyle(sizeConfig, responsive),
    [sizeConfig, responsive],
  );

  // SVG dimensions — padding must accommodate the largest visible element
  // (end-dot radius or half the stroke width) so nothing is clipped.
  const { width: svgW, height: svgH } = sizeConfig;
  const padding = Math.max(
    sizeConfig.strokeWidth,
    showEndDot ? sizeConfig.dotRadius + 1 : 0,
    2,
  );

  // Compute geometry
  const points = useMemo(
    () => normalisePoints(data, svgW, svgH, padding),
    [data, svgW, svgH, padding],
  );

  const pathD = useMemo(
    () => (curved ? smoothPath(points) : linearPath(points)),
    [points, curved],
  );

  const areaD = useMemo(
    () => areaPath(pathD, points, svgH, padding),
    [pathD, points, svgH],
  );

  // Path length for draw animation
  const pathLength = 1000; // approximate — CSS will handle via dasharray

  // Last point for end-dot
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  // Render bars
  if (variant === 'bar') {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const plotH = svgH - padding * 2;
    const barCount = data.length;
    const totalGap = (barCount - 1) * sizeConfig.barGap;
    const barWidth = Math.max(1, (svgW - padding * 2 - totalGap) / barCount);

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...wrapperStyle, ...userStyle }}
        role="img"
        aria-label="Sparkline bar chart"
        {...rest}
      >
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={svgStyle}
          preserveAspectRatio="none"
        >
          {data.map((value, i) => {
            const normalised = (value - min) / range;
            const barH = Math.max(1, normalised * plotH);
            const x = padding + i * (barWidth + sizeConfig.barGap);
            const y = svgH - padding - barH;

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={Math.min(barWidth / 2, 1.5)}
                fill={colors.stroke}
                opacity={0.7 + normalised * 0.3}
                style={
                  animated
                    ? {
                        transformOrigin: `${x + barWidth / 2}px ${svgH - padding}px`,
                        animation: `wisp-sparkline-bar-rise 0.5s ease-out ${i * 0.03}s both`,
                      }
                    : undefined
                }
              />
            );
          })}
        </svg>
      </div>
    );
  }

  // Render line / area
  return (
    <div
      ref={ref}
      className={className}
      style={{ ...wrapperStyle, ...userStyle }}
      role="img"
      aria-label={`Sparkline ${variant} chart`}
      {...rest}
    >
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={svgStyle}
        preserveAspectRatio="none"
      >
        {/* Gradient definition for area fill */}
        {variant === 'area' && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity={fillOpacity} />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}

        {/* Area fill */}
        {variant === 'area' && (
          <path
            d={areaD}
            fill={`url(#${gradientId})`}
            style={
              animated
                ? {
                    opacity: 0,
                    animation: 'wisp-sparkline-draw 0.8s ease-out 0.3s forwards',
                    animationName: 'none', // fill fades in via separate opacity
                  }
                : undefined
            }
          />
        )}

        {/* Line stroke */}
        <path
          d={pathD}
          stroke={colors.stroke}
          strokeWidth={sizeConfig.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          style={
            animated
              ? {
                  strokeDasharray: pathLength,
                  strokeDashoffset: pathLength,
                  animation: `wisp-sparkline-draw 0.8s ease-out forwards`,
                }
              : undefined
          }
          pathLength={pathLength}
        />

        {/* End dot */}
        {showEndDot && lastPoint && (
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={sizeConfig.dotRadius}
            fill={colors.stroke}
            style={
              animated
                ? { opacity: 0, animation: 'wisp-sparkline-draw 0.2s ease-out 0.7s forwards' }
                : undefined
            }
          />
        )}
      </svg>
    </div>
  );
});

Sparkline.displayName = 'Sparkline';
