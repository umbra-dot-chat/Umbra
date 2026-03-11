/**
 * @module PingMeter
 */
import React, { forwardRef, useMemo, useEffect } from 'react';
import type { PingMeterProps, PingQuality } from '@coexist/wisp-core/types/PingMeter.types';
import { pingMeterSizeMap } from '@coexist/wisp-core/types/PingMeter.types';
import {
  getLatencyColor,
  ensurePingPulseKeyframes,
  buildPingMeterContainerStyle,
  buildPingDotStyle,
  buildPingDotPulseStyle,
  buildPingBarStyle,
  buildPingLatencyStyle,
  getPingMeterSkeletonStyle,
} from '@coexist/wisp-core/styles/PingMeter.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total number of signal strength bars. */
const TOTAL_BARS = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Derives a {@link PingQuality} level from a latency value.
 *
 * @param latency - Network latency in milliseconds.
 * @returns The quality classification.
 */
function getQuality(latency: number): PingQuality {
  if (latency < 50) return 'excellent';
  if (latency < 100) return 'good';
  if (latency < 200) return 'fair';
  return 'poor';
}

/**
 * Returns the number of active signal bars for a given quality level.
 *
 * @param quality - The derived quality level.
 * @returns Number of bars to fill (1--4).
 */
function getActiveBars(quality: PingQuality): number {
  switch (quality) {
    case 'excellent':
      return 4;
    case 'good':
      return 3;
    case 'fair':
      return 2;
    case 'poor':
    default:
      return 1;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * PingMeter -- Visual network latency indicator for the Wisp design system.
 *
 * @remarks
 * Displays connection quality through a combination of an animated ping dot,
 * signal strength bars, and a numeric latency readout. Key features:
 *
 * - Three display variants: `dot`, `bars`, `full` (dot + bars + text).
 * - Three sizes: `sm`, `md`, `lg`.
 * - Latency-based color coding: green / yellow / orange / red.
 * - Animated pulse ring on the dot indicator.
 * - Skeleton loading placeholder via {@link PingMeterProps.skeleton}.
 *
 * @example
 * ```tsx
 * <PingMeter latency={42} />
 * <PingMeter latency={150} variant="bars" size="lg" />
 * <PingMeter latency={350} variant="dot" />
 * <PingMeter skeleton />
 * ```
 */
export const PingMeter = forwardRef<HTMLDivElement, PingMeterProps>(function PingMeter(
  {
    latency,
    size = 'md',
    showLatency = true,
    showBars = true,
    showDot = true,
    variant = 'full',
    maxLatency: _maxLatency = 500,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = pingMeterSizeMap[size];

  // Inject keyframes once
  useEffect(() => {
    ensurePingPulseKeyframes();
  }, []);

  // Skeleton early return
  if (skeleton) {
    const skeletonStyle = getPingMeterSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Derive quality and colors
  const quality = getQuality(latency);
  const activeBars = getActiveBars(quality);
  const color = getLatencyColor(latency, theme);

  // Resolve which elements to show based on variant + explicit flags
  const isDot = variant === 'dot' || (variant === 'full' && showDot);
  const isBars = variant === 'bars' || (variant === 'full' && showBars);
  const isLatencyText = variant === 'full' && showLatency;

  // Build styles
  const containerStyle = useMemo(
    () => buildPingMeterContainerStyle(sizeConfig),
    [sizeConfig],
  );

  const dotStyle = useMemo(
    () => buildPingDotStyle(sizeConfig, color, theme),
    [sizeConfig, color, theme],
  );

  const pulseStyle = useMemo(
    () => buildPingDotPulseStyle(sizeConfig, color, theme),
    [sizeConfig, color, theme],
  );

  const latencyStyle = useMemo(
    () => buildPingLatencyStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      aria-label={`Latency: ${latency}ms`}
      {...rest}
    >
      {/* Ping dot with pulse ring */}
      {isDot && (
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeConfig.dotSize,
            height: sizeConfig.dotSize,
            flexShrink: 0,
          }}
        >
          <span style={pulseStyle} />
          <span style={{ ...dotStyle, position: 'relative' }} />
        </span>
      )}

      {/* Signal strength bars */}
      {isBars && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'flex-end',
            gap: sizeConfig.barGap,
            height: sizeConfig.barHeight,
          }}
        >
          {Array.from({ length: TOTAL_BARS }, (_, i) => (
            <span
              key={i}
              style={buildPingBarStyle(
                sizeConfig,
                theme,
                i,
                TOTAL_BARS,
                i < activeBars,
                color,
              )}
            />
          ))}
        </span>
      )}

      {/* Latency text */}
      {isLatencyText && (
        <Text style={latencyStyle}>{latency}ms</Text>
      )}
    </div>
  );
});

PingMeter.displayName = 'PingMeter';
