import React, { forwardRef, useMemo } from 'react';
import type { ActivityCirclesProps } from '@coexist/wisp-core/types/ActivityCircles.types';
import { activityCirclesSizeMap } from '@coexist/wisp-core/types/ActivityCircles.types';
import { thicknessValues } from '@coexist/wisp-core/tokens/shared';
import { computeRingGeometry } from '@coexist/wisp-core/styles/chart-utils';
import {
  resolveRingColor,
  resolveActivityCirclesColors,
  buildActivityCirclesWrapperStyle,
  buildActivityCirclesSvgContainerStyle,
  buildActivityCirclesCenterStyle,
  buildActivityCirclesLegendStyle,
  buildActivityCirclesLegendItemStyle,
  buildActivityCirclesLegendDotStyle,
  buildActivityCirclesLegendTextStyle,
} from '@coexist/wisp-core/styles/ActivityCircles.styles';
import { useTheme } from '../../providers';

/**
 * ActivityCircles — Apple-Watch-style concentric progress rings.
 *
 * @remarks
 * Renders one or more circular progress rings concentrically, each
 * representing a different metric. Built with raw SVG for zero
 * external dependencies — uses the same stroke-dasharray technique
 * as {@link CircularProgress}.
 *
 * - Up to 5 rings (outer → inner).
 * - Colours default to the `theme.data` palette.
 * - Optional legend with colour-coded labels.
 * - Optional custom centre content via `children`.
 * - Four size presets: `sm`, `md`, `lg`, `xl`.
 *
 * @see {@link ActivityCirclesProps} for the full prop API.
 *
 * @example
 * ```tsx
 * <ActivityCircles
 *   rings={[
 *     { value: 75, max: 100, label: 'Move' },
 *     { value: 50, max: 60,  label: 'Exercise' },
 *     { value: 10, max: 12,  label: 'Stand' },
 *   ]}
 *   showLabels
 * />
 * ```
 */
export const ActivityCircles = forwardRef<HTMLDivElement, ActivityCirclesProps>(
  function ActivityCircles(
    {
      rings,
      size = 'md',
      thickness,
      showLabels = false,
      animated = false,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const baseSizeConfig = activityCirclesSizeMap[size];

    // Apply thickness override
    const sizeConfig = useMemo(() => {
      if (!thickness) return baseSizeConfig;
      return { ...baseSizeConfig, strokeWidth: thicknessValues[thickness] };
    }, [baseSizeConfig, thickness]);

    // Resolve common colours
    const colors = useMemo(
      () => resolveActivityCirclesColors(theme),
      [theme],
    );

    // Resolve per-ring colours
    const ringColors = useMemo(
      () => rings.map((ring, i) => ring.color || resolveRingColor(i, theme)),
      [rings, theme],
    );

    // Compute SVG geometry for all rings
    const geometry = useMemo(
      () => computeRingGeometry(rings, sizeConfig.diameter, sizeConfig.strokeWidth, sizeConfig.gap),
      [rings, sizeConfig],
    );

    // -----------------------------------------------------------------------
    // SVG dimensions
    // -----------------------------------------------------------------------
    const viewBoxSize = sizeConfig.diameter;
    const center = viewBoxSize / 2;

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const wrapperStyle = useMemo(
      () => buildActivityCirclesWrapperStyle(showLabels),
      [showLabels],
    );

    const svgContainerStyle = useMemo(
      () => buildActivityCirclesSvgContainerStyle(sizeConfig),
      [sizeConfig],
    );

    const centerStyle = useMemo(
      () => buildActivityCirclesCenterStyle(sizeConfig),
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
        aria-label={
          rings
            .map((r, i) => {
              const pct = r.max > 0 ? Math.round((Math.min(Math.max(r.value, 0), r.max) / r.max) * 100) : 0;
              return `${r.label || `Ring ${i + 1}`}: ${pct}%`;
            })
            .join(', ')
        }
        {...rest}
      >
        <div style={svgContainerStyle}>
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: sizeConfig.diameter, height: sizeConfig.diameter, display: 'block' }}
          >
            {geometry.map((geo, i) => (
              <React.Fragment key={i}>
                {/* Track circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={geo.radius}
                  stroke={colors.track}
                  strokeWidth={sizeConfig.strokeWidth}
                  fill="none"
                />
                {/* Progress arc */}
                <circle
                  cx={center}
                  cy={center}
                  r={geo.radius}
                  stroke={ringColors[i]}
                  strokeWidth={sizeConfig.strokeWidth}
                  fill="none"
                  strokeDasharray={geo.circumference}
                  strokeDashoffset={geo.dashOffset}
                  strokeLinecap="round"
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: '50% 50%',
                    transition: animated ? 'stroke-dashoffset 800ms ease' : 'none',
                  }}
                />
              </React.Fragment>
            ))}
          </svg>

          {/* Centre content */}
          {children != null && (
            <div style={centerStyle}>
              {children}
            </div>
          )}
        </div>

        {/* Legend */}
        {showLabels && (
          <div style={buildActivityCirclesLegendStyle(theme)}>
            {rings.map((ring, i) =>
              ring.label ? (
                <div key={i} style={buildActivityCirclesLegendItemStyle(theme)}>
                  <div style={buildActivityCirclesLegendDotStyle(ringColors[i], theme)} />
                  <span style={buildActivityCirclesLegendTextStyle(sizeConfig, colors, theme)}>
                    {ring.label}
                  </span>
                </div>
              ) : null,
            )}
          </div>
        )}
      </div>
    );
  },
);

ActivityCircles.displayName = 'ActivityCircles';
