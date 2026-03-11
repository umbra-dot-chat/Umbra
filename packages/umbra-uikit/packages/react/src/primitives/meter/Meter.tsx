import React, { forwardRef, useMemo } from 'react';
import type { MeterProps } from '@coexist/wisp-core/types/Meter.types';
import { meterSizeMap } from '@coexist/wisp-core/types/Meter.types';
import {
  buildMeterContainerStyle,
  buildMeterTrackStyle,
  buildMeterFillStyle,
  buildMeterLabelStyle,
  buildMeterValueStyle,
  getMeterSkeletonStyle,
} from '@coexist/wisp-core/styles/Meter.styles';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * Meter -- Semantic gauge indicator for the Wisp design system.
 *
 * @remarks
 * Displays a horizontal meter bar representing a scalar value within a known
 * range. Unlike {@link Progress}, which tracks task completion, Meter
 * represents a measurement (e.g. disk usage, battery level, relevance score).
 * Key features:
 *
 * - Three sizes: `sm`, `md`, `lg`.
 * - Three variants: `default` (solid accent), `gradient` (left-to-right
 *   gradient), and `segments` (semantic green/yellow/red based on thresholds).
 * - Optional label and value display.
 * - Semantic `role="meter"` with full ARIA attributes.
 * - Skeleton placeholder state for loading layouts.
 * - Disabled state with reduced opacity.
 *
 * @see {@link MeterProps} for the full prop API.
 *
 * @module primitives/meter
 * @example
 * ```tsx
 * <Meter value={60} />
 * <Meter value={75} label="Disk usage" showValue />
 * <Meter value={90} variant="segments" low={25} high={75} optimum={50} />
 * <Meter value={45} variant="gradient" />
 * ```
 */
export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
  {
    value,
    min = 0,
    max = 100,
    size = 'md',
    label,
    showValue = false,
    variant = 'default',
    segments = 3,
    optimum = 50,
    low = 25,
    high = 75,
    skeleton = false,
    disabled = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = meterSizeMap[size];

  // ---------------------------------------------------------------------------
  // Clamp value and compute percentage
  // ---------------------------------------------------------------------------
  const range = max - min;
  const clampedValue = Math.min(Math.max(value, min), max);
  const percent = range > 0 ? ((clampedValue - min) / range) * 100 : 0;

  // Convert threshold props to percentages relative to the range
  const lowPercent = range > 0 ? ((low - min) / range) * 100 : 25;
  const highPercent = range > 0 ? ((high - min) / range) * 100 : 75;
  const optimumPercent = range > 0 ? ((optimum - min) / range) * 100 : 50;

  // ---------------------------------------------------------------------------
  // Display value
  // ---------------------------------------------------------------------------
  const displayValue = useMemo(() => {
    return `${Math.round(percent)}%`;
  }, [percent]);

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getMeterSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Build styles
  // ---------------------------------------------------------------------------
  const containerStyle = useMemo(
    () => buildMeterContainerStyle(sizeConfig),
    [sizeConfig],
  );

  const trackStyle = useMemo(
    () => buildMeterTrackStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  const fillStyle = useMemo(
    () => buildMeterFillStyle(sizeConfig, theme, percent, variant, lowPercent, highPercent, optimumPercent),
    [sizeConfig, theme, percent, variant, lowPercent, highPercent, optimumPercent],
  );

  const labelRowStyle = useMemo(
    () => buildMeterLabelStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  const valueTextStyle = useMemo(
    () => buildMeterValueStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  // ---------------------------------------------------------------------------
  // Disabled style
  // ---------------------------------------------------------------------------
  const disabledStyle: React.CSSProperties = disabled
    ? { opacity: 0.5, pointerEvents: 'none' }
    : {};

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={ref}
      className={className}
      aria-disabled={disabled || undefined}
      style={{ ...containerStyle, ...disabledStyle, ...userStyle }}
      {...rest}
    >
      {/* Label row */}
      {(label || showValue) && (
        <div style={labelRowStyle}>
          {label && <Text>{label}</Text>}
          {showValue && <Text style={valueTextStyle}>{displayValue}</Text>}
        </div>
      )}

      {/* Track */}
      <div
        role="meter"
        aria-valuenow={clampedValue}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label || undefined}
        style={trackStyle}
      >
        {/* Fill */}
        <div style={fillStyle} />
      </div>
    </div>
  );
});

Meter.displayName = 'Meter';
