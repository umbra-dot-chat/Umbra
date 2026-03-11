/**
 * @module primitives/meter
 * @description React Native Meter primitive for the Wisp design system.
 *
 * Reuses color resolution, size maps, and segment logic from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<View>` for track and fill bar instead of `<div>`.
 * - No `role="meter"` (RN doesn't support the meter ARIA role).
 * - No `className`, `skeleton`, or CSS pointer-events props.
 * - Label and value rendered with the design-system `<Text>` component.
 * - Gradient variant uses a solid accent color (RN `<View>` doesn't support
 *   CSS `linear-gradient`; use `expo-linear-gradient` if needed).
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { MeterSize, MeterVariant } from '@coexist/wisp-core/types/Meter.types';
import { meterSizeMap } from '@coexist/wisp-core/types/Meter.types';
import { resolveSegmentColor } from '@coexist/wisp-core/styles/Meter.styles';
import { Text } from '../text';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MeterProps extends Omit<ViewProps, 'children'> {
  /** Current meter value (clamped between min and max). */
  value: number;
  /** Minimum value for the meter range. @default 0 */
  min?: number;
  /** Maximum value for the meter range. @default 100 */
  max?: number;
  /** Meter track and typography size. @default 'md' */
  size?: MeterSize;
  /** Label text rendered to the left of the value display. */
  label?: string;
  /** Whether to display the current percentage value. @default false */
  showValue?: boolean;
  /** Visual variant controlling the fill appearance. @default 'default' */
  variant?: MeterVariant;
  /** The optimal (ideal) value within the meter range. @default 50 */
  optimum?: number;
  /** Low threshold value for semantic colouring in the segments variant. @default 25 */
  low?: number;
  /** High threshold value for semantic colouring in the segments variant. @default 75 */
  high?: number;
  /** Whether the meter is visually dimmed to indicate a disabled state. @default false */
  disabled?: boolean;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Meter -- Semantic gauge indicator for the Wisp design system (React Native).
 *
 * @remarks
 * Displays a horizontal meter bar representing a scalar value within a known
 * range. Unlike Progress, which tracks task completion, Meter represents a
 * measurement (e.g. disk usage, battery level, relevance score).
 *
 * Key features:
 * - Three sizes: `sm`, `md`, `lg`.
 * - Three variants: `default` (solid accent), `gradient` (accent primary --
 *   falls back to solid in RN), and `segments` (semantic green/yellow/red).
 * - Optional label and value display.
 * - Disabled state with reduced opacity.
 *
 * @example
 * ```tsx
 * <Meter value={60} />
 * <Meter value={75} label="Disk usage" showValue />
 * <Meter value={90} variant="segments" low={25} high={75} optimum={50} />
 * ```
 */
export const Meter = forwardRef<View, MeterProps>(function Meter(
  {
    value,
    min = 0,
    max = 100,
    size = 'md',
    label,
    showValue = false,
    variant = 'default',
    optimum = 50,
    low = 25,
    high = 75,
    disabled = false,
    style: userStyle,
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
  // Resolve fill color based on variant
  // ---------------------------------------------------------------------------
  const fillColor = useMemo(() => {
    switch (variant) {
      case 'segments':
        return resolveSegmentColor(percent, lowPercent, highPercent, optimumPercent, theme);
      case 'gradient':
        // RN View does not support linear-gradient; fall back to accent primary.
        return themeColors.accent.primary;
      case 'default':
      default:
        return themeColors.accent.primary;
    }
  }, [variant, percent, lowPercent, highPercent, optimumPercent, themeColors]);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const containerStyle = useMemo<ViewStyle>(() => ({
    gap: sizeConfig.gap,
    width: '100%',
    opacity: disabled ? 0.5 : 1,
  }), [sizeConfig, disabled]);

  const labelRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  }), []);

  const labelTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.fontSize * 1.4,
    fontWeight: defaultTypography.weights.medium,
    color: themeColors.text.primary,
  }), [sizeConfig, themeColors]);

  const valueTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.fontSize * 1.4,
    fontWeight: defaultTypography.weights.medium,
    color: themeColors.text.secondary,
  }), [sizeConfig, themeColors]);

  const trackStyle = useMemo<ViewStyle>(() => ({
    position: 'relative',
    width: '100%',
    height: sizeConfig.height,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: themeColors.border.subtle,
    overflow: 'hidden',
  }), [sizeConfig, themeColors]);

  const fillStyle = useMemo<ViewStyle>(() => ({
    height: '100%',
    width: `${percent}%`,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: fillColor,
  }), [sizeConfig, percent, fillColor]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View
      ref={ref}
      accessibilityRole="none"
      accessibilityValue={{
        min,
        max,
        now: clampedValue,
      }}
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[containerStyle, userStyle]}
      {...rest}
    >
      {/* Label row */}
      {(label || showValue) && (
        <View style={labelRowStyle}>
          {label && <Text style={labelTextStyle}>{label}</Text>}
          {showValue && <Text style={valueTextStyle}>{displayValue}</Text>}
        </View>
      )}

      {/* Track */}
      <View style={trackStyle}>
        {/* Fill */}
        <View style={fillStyle} />
      </View>
    </View>
  );
});

Meter.displayName = 'Meter';
