import React, { forwardRef, useMemo } from 'react';
import type { ProgressProps } from '@coexist/wisp-core/types/Progress.types';
import { progressSizeMap } from '@coexist/wisp-core/types/Progress.types';
import { thicknessValues } from '@coexist/wisp-core/tokens/shared';
import {
  resolveProgressColors,
  buildTrackStyle,
  buildFillStyle,
  buildIndeterminateFillStyle,
  buildLabelRowStyle,
  buildLabelTextStyle,
  buildValueTextStyle,
  getProgressSkeletonStyle,
} from '@coexist/wisp-core/styles/Progress.styles';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * Progress -- Horizontal bar progress indicator for the Wisp design system.
 *
 * @remarks
 * Displays a horizontal progress bar with an optional label and formatted
 * value text. Key features:
 *
 * - Five sizes controlled by the {@link ProgressSize} token (`xs` through `xl`).
 * - Determinate mode with smooth width transitions.
 * - Indeterminate mode with a sliding animation for unknown durations.
 * - Semantic color variants: `default`, `success`, `warning`, `danger`, `info`.
 * - Optional {@link ProgressProps.thickness | thickness} override via the
 *   shared {@link Thickness} token.
 * - Custom value formatting via `formatValue` callback.
 * - Skeleton placeholder state for loading layouts.
 * - Accessible `role="progressbar"` with appropriate ARIA attributes.
 *
 * @see {@link ProgressProps} for the full prop API.
 *
 * @module primitives/progress
 * @example
 * ```tsx
 * <Progress value={60} />
 * <Progress value={75} label="Upload" showValue />
 * <Progress indeterminate label="Loading..." />
 * <Progress value={90} color="success" />
 * ```
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  {
    value = 0,
    max = 100,
    size = 'md',
    label,
    showValue = false,
    formatValue,
    color = 'default',
    thickness,
    indeterminate = false,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const baseSizeConfig = progressSizeMap[size];

  // Apply thickness override if provided
  const sizeConfig = useMemo(() => {
    if (!thickness) return baseSizeConfig;
    const h = thicknessValues[thickness];
    return { ...baseSizeConfig, height: h, borderRadius: h <= 6 ? 'sm' as const : 'md' as const };
  }, [baseSizeConfig, thickness]);

  // ---------------------------------------------------------------------------
  // Clamp value and compute percentage
  // ---------------------------------------------------------------------------
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clampedValue / max) * 100 : 0;

  // ---------------------------------------------------------------------------
  // Default value formatter
  // ---------------------------------------------------------------------------
  const defaultFormatValue = (v: number, m: number): string =>
    `${Math.round((v / m) * 100)}%`;

  const displayValue = useMemo(() => {
    const formatter = formatValue || defaultFormatValue;
    return formatter(clampedValue, max);
  }, [clampedValue, max, formatValue]);

  // ---------------------------------------------------------------------------
  // Colors
  // ---------------------------------------------------------------------------
  const colors = useMemo(
    () => resolveProgressColors(color, theme),
    [color, theme],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getProgressSkeletonStyle(sizeConfig, theme);
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
  const trackStyle = useMemo(
    () => buildTrackStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const fillStyle = useMemo(
    () =>
      indeterminate
        ? buildIndeterminateFillStyle(sizeConfig, colors, theme)
        : buildFillStyle(sizeConfig, colors, percent, theme),
    [indeterminate, sizeConfig, colors, percent, theme],
  );

  const labelRowStyle = useMemo(() => buildLabelRowStyle(theme), [theme]);

  const labelTextStyle = useMemo(
    () => buildLabelTextStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const valueTextStyle = useMemo(
    () => buildValueTextStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  // ---------------------------------------------------------------------------
  // Aria attributes
  // ---------------------------------------------------------------------------
  const ariaProps: Record<string, unknown> = {
    role: 'progressbar',
    'aria-valuemin': 0,
  };

  if (indeterminate) {
    // Indeterminate: no aria-valuenow or aria-valuemax
  } else {
    ariaProps['aria-valuenow'] = clampedValue;
    ariaProps['aria-valuemax'] = max;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={ref}
      className={className}
      style={{ width: '100%', ...userStyle }}
      {...rest}
    >
      {/* Indeterminate keyframes */}
      {indeterminate && (
        <style>{`@keyframes wisp-progress-indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
      )}

      {/* Label row */}
      {(label || showValue) && (
        <div style={labelRowStyle}>
          {label && <Text style={labelTextStyle}>{label}</Text>}
          {showValue && !indeterminate && (
            <Text style={valueTextStyle}>{displayValue}</Text>
          )}
        </div>
      )}

      {/* Track */}
      <div {...ariaProps} style={trackStyle}>
        {/* Fill */}
        <div style={fillStyle} />
      </div>
    </div>
  );
});

Progress.displayName = 'Progress';
