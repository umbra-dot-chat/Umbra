import React, { forwardRef, useMemo, useEffect } from 'react';
import type { CircularProgressProps } from '@coexist/wisp-core/types/CircularProgress.types';
import { circularProgressSizeMap } from '@coexist/wisp-core/types/CircularProgress.types';
import { thicknessValues } from '@coexist/wisp-core/tokens/shared';
import {
  resolveCircularProgressColors,
  ensureCircularProgressKeyframes,
  buildWrapperStyle,
  buildSvgContainerStyle,
  buildHalfSvgContainerStyle,
  buildSvgStyle,
  buildCenterContentStyle,
  buildHalfCenterContentStyle,
  buildValueTextStyle,
  buildLabelTextStyle,
} from '@coexist/wisp-core/styles/CircularProgress.styles';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * CircularProgress -- Circular progress indicator for the Wisp design system.
 *
 * @remarks
 * Displays a circular (donut) or half-circle (gauge) progress ring with
 * optional center value, custom children, and bottom label. Key features:
 *
 * - Four sizes controlled by {@link CircularProgressSize} (`sm` through `xl`).
 * - Two ring variants: `full` (donut) and `half` (speedometer gauge).
 * - Determinate mode with smooth stroke-dashoffset transitions.
 * - Indeterminate spinning mode for unknown durations (full variant only).
 * - Semantic color variants: `default`, `success`, `warning`, `danger`, `info`.
 * - Optional {@link CircularProgressProps.thickness | thickness} override via
 *   the shared {@link Thickness} token.
 * - Custom center content via `children` (overrides `showValue`).
 * - Accessible `role="progressbar"` with `aria-valuenow` / `aria-valuemax`.
 *
 * @see {@link CircularProgressProps} for the full prop API.
 *
 * @module primitives/circular-progress
 * @example
 * ```tsx
 * <CircularProgress value={75} />
 * <CircularProgress value={60} variant="half" showValue />
 * <CircularProgress indeterminate />
 * <CircularProgress value={90} color="success" label="Upload" showValue />
 * ```
 */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  function CircularProgress(
    {
      value = 0,
      max = 100,
      size = 'md',
      variant = 'full',
      showValue = false,
      formatValue,
      color = 'default',
      thickness,
      indeterminate = false,
      label,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const baseSizeConfig = circularProgressSizeMap[size];

    // Apply thickness override if provided
    const sizeConfig = useMemo(() => {
      if (!thickness) return baseSizeConfig;
      return { ...baseSizeConfig, strokeWidth: thicknessValues[thickness] };
    }, [baseSizeConfig, thickness]);

    // Inject spin keyframes once
    useEffect(() => {
      if (indeterminate) {
        ensureCircularProgressKeyframes();
      }
    }, [indeterminate]);

    // -----------------------------------------------------------------------
    // Clamp value and compute percentage
    // -----------------------------------------------------------------------
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percent = max > 0 ? clampedValue / max : 0;

    // -----------------------------------------------------------------------
    // Value formatter
    // -----------------------------------------------------------------------
    const defaultFormatValue = (v: number, m: number): string =>
      `${Math.round((v / m) * 100)}%`;

    const displayValue = useMemo(() => {
      const formatter = formatValue || defaultFormatValue;
      return formatter(clampedValue, max);
    }, [clampedValue, max, formatValue]);

    // -----------------------------------------------------------------------
    // Colors
    // -----------------------------------------------------------------------
    const colors = useMemo(
      () => resolveCircularProgressColors(color, theme),
      [color, theme],
    );

    // -----------------------------------------------------------------------
    // SVG geometry
    // -----------------------------------------------------------------------
    const viewBoxSize = sizeConfig.size;
    const center = viewBoxSize / 2;
    const radius = (viewBoxSize - sizeConfig.strokeWidth) / 2;

    // -----------------------------------------------------------------------
    // Full circle
    // -----------------------------------------------------------------------
    const fullCircumference = 2 * Math.PI * radius;

    // -----------------------------------------------------------------------
    // Half circle — arc from left (9 o'clock) over the top to right (3 o'clock)
    // rotated so it goes from bottom-left to bottom-right like a speedometer.
    // We use a semicircle: half the circumference.
    // -----------------------------------------------------------------------
    const halfCircumference = Math.PI * radius;

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------
    const wrapperStyle = useMemo(
      () => buildWrapperStyle(!!label),
      [label],
    );

    const svgContainerStyle = useMemo(
      () =>
        variant === 'half'
          ? buildHalfSvgContainerStyle(sizeConfig)
          : buildSvgContainerStyle(sizeConfig),
      [variant, sizeConfig],
    );

    const svgStyle = useMemo(
      () => buildSvgStyle(sizeConfig, indeterminate && variant === 'full'),
      [sizeConfig, indeterminate, variant],
    );

    const centerContentStyle = useMemo(
      () =>
        variant === 'half'
          ? buildHalfCenterContentStyle(sizeConfig, colors)
          : buildCenterContentStyle(sizeConfig, colors),
      [variant, sizeConfig, colors],
    );

    const valueTextStyle = useMemo(
      () => buildValueTextStyle(sizeConfig, colors, theme),
      [sizeConfig, colors, theme],
    );

    const labelTextStyle = useMemo(
      () => buildLabelTextStyle(sizeConfig, colors, theme),
      [sizeConfig, colors, theme],
    );

    // -----------------------------------------------------------------------
    // Aria attributes
    // -----------------------------------------------------------------------
    const ariaProps: Record<string, unknown> = {
      role: 'progressbar',
      'aria-valuemin': 0,
    };

    if (!indeterminate) {
      ariaProps['aria-valuenow'] = clampedValue;
      ariaProps['aria-valuemax'] = max;
    }

    if (label) {
      ariaProps['aria-label'] = label;
    }

    // -----------------------------------------------------------------------
    // Determine if we render center content
    // -----------------------------------------------------------------------
    const hasCenterContent = children != null || (showValue && !indeterminate);

    // -----------------------------------------------------------------------
    // Render: Full circle variant
    // -----------------------------------------------------------------------
    if (variant === 'full') {
      const dashOffset = indeterminate
        ? fullCircumference * 0.75 // show 25% arc for indeterminate
        : fullCircumference * (1 - percent);

      return (
        <div
          ref={ref}
          className={className}
          style={{ ...wrapperStyle, ...userStyle }}
          {...ariaProps}
          {...rest}
        >
          <div style={svgContainerStyle}>
            <svg
              viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={svgStyle}
            >
              {/* Track circle */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.track}
                strokeWidth={sizeConfig.strokeWidth}
                fill="none"
              />
              {/* Progress arc — rotate -90deg so it starts from top */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke={colors.indicator}
                strokeWidth={sizeConfig.strokeWidth}
                fill="none"
                strokeDasharray={fullCircumference}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: indeterminate ? 'none' : 'stroke-dashoffset 300ms ease',
                }}
              />
            </svg>

            {/* Center content */}
            {hasCenterContent && (
              <div style={centerContentStyle}>
                {children != null ? children : (
                  <Text style={valueTextStyle}>{displayValue}</Text>
                )}
              </div>
            )}
          </div>

          {/* Label below */}
          {label && <Text style={labelTextStyle}>{label}</Text>}
        </div>
      );
    }

    // -----------------------------------------------------------------------
    // Render: Half circle (gauge) variant
    //
    // The semicircle arc spans from the left (9 o'clock) over the top
    // to the right (3 o'clock). We rotate the SVG so the arc goes from
    // bottom-left up over the top and down to bottom-right, like a
    // speedometer gauge.
    //
    // SVG circle starts at 3 o'clock. We use:
    //   dasharray  = halfCircumference (the visible arc) + fullCircumference (gap)
    //   dashoffset = halfCircumference * (1 - percent) to reveal progress
    //   rotate 180deg so it starts at bottom-left (9 o'clock becomes bottom-left)
    // -----------------------------------------------------------------------
    const halfDashOffset = indeterminate ? 0 : halfCircumference * (1 - percent);

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...wrapperStyle, ...userStyle }}
        {...ariaProps}
        {...rest}
      >
        <div style={svgContainerStyle}>
          <svg
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: sizeConfig.size,
              height: sizeConfig.size,
              display: 'block',
            }}
          >
            {/* Track semicircle — bottom-left to bottom-right over top */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.track}
              strokeWidth={sizeConfig.strokeWidth}
              fill="none"
              strokeDasharray={`${halfCircumference} ${fullCircumference}`}
              strokeLinecap="round"
              style={{
                transform: 'rotate(180deg)',
                transformOrigin: '50% 50%',
              }}
            />
            {/* Progress semicircle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              stroke={colors.indicator}
              strokeWidth={sizeConfig.strokeWidth}
              fill="none"
              strokeDasharray={`${halfCircumference} ${fullCircumference}`}
              strokeDashoffset={halfDashOffset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(180deg)',
                transformOrigin: '50% 50%',
                transition: indeterminate ? 'none' : 'stroke-dashoffset 300ms ease',
              }}
            />
          </svg>

          {/* Center content — positioned in the center of the full circle */}
          {hasCenterContent && (
            <div style={centerContentStyle}>
              {children != null ? children : (
                <Text style={valueTextStyle}>{displayValue}</Text>
              )}
            </div>
          )}
        </div>

        {/* Label below */}
        {label && <Text style={labelTextStyle}>{label}</Text>}
      </div>
    );
  },
);

CircularProgress.displayName = 'CircularProgress';
