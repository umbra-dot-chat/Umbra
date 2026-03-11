import React, { forwardRef, useMemo, useEffect } from 'react';
import type { SpinnerProps } from '@coexist/wisp-core/types/Spinner.types';
import { spinnerSizeMap } from '@coexist/wisp-core/types/Spinner.types';
import {
  ensureSpinnerKeyframes,
  buildSpinnerContainerStyle,
  buildSvgStyle,
  buildLabelStyle,
} from '@coexist/wisp-core/styles/Spinner.styles';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * Spinner -- Animated loading indicator for the Wisp design system.
 *
 * @remarks
 * SVG-based spinner with a muted track circle and an accent-colored
 * indicator arc that rotates continuously. Key features:
 *
 * - Five sizes controlled by the {@link SpinnerSize} token (`xs` through `xl`).
 * - Optional text label rendered beside the spinner.
 * - Customisable indicator and track colors via props.
 * - Injects its own `@keyframes` rule on first mount (SSR-safe).
 * - Renders `role="status"` with an `aria-label` for accessibility.
 *
 * @see {@link SpinnerProps} for the full prop API.
 *
 * @module primitives/spinner
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="Loading..." />
 * <Spinner size="sm" color="#3B82F6" />
 * ```
 */
export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(function Spinner(
  {
    size = 'md',
    label,
    color,
    trackColor,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = spinnerSizeMap[size];

  // Inject the spin keyframe animation once
  useEffect(() => {
    ensureSpinnerKeyframes();
  }, []);

  // SVG geometry
  const viewBoxSize = sizeConfig.size;
  const center = viewBoxSize / 2;
  const radius = (viewBoxSize - sizeConfig.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Show ~25% of the circle as the indicator arc
  const dashArray = circumference;
  const dashOffset = circumference * 0.75;

  // Resolve colors
  const resolvedTrackColor = trackColor || themeColors.border.subtle;
  const resolvedIndicatorColor = color || themeColors.accent.primary;

  // Compute styles
  const containerStyle = useMemo(
    () => buildSpinnerContainerStyle(sizeConfig, !!label),
    [sizeConfig, label],
  );

  const svgStyle = useMemo(
    () => buildSvgStyle(sizeConfig),
    [sizeConfig],
  );

  const labelStyle = useMemo(
    () => buildLabelStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  return (
    <div
      ref={ref}
      role="status"
      aria-label={label || 'Loading'}
      style={{ ...containerStyle, ...userStyle }}
      {...rest}
    >
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={svgStyle}
      >
        {/* Track circle — full ring, muted color */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={resolvedTrackColor}
          strokeWidth={sizeConfig.strokeWidth}
          fill="none"
        />
        {/* Indicator circle — partial arc, accent color, rotating */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={resolvedIndicatorColor}
          strokeWidth={sizeConfig.strokeWidth}
          fill="none"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      {label && <Text style={labelStyle}>{label}</Text>}
    </div>
  );
});

Spinner.displayName = 'Spinner';
