/**
 * @module primitives/progress
 * @description React Native Progress primitive for the Wisp design system.
 *
 * Reuses color resolution, size maps, and thickness tokens from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Track and fill rendered as `<View>` instead of `<div>`.
 * - Determinate fill uses percentage-based width via `flex` layout.
 * - Indeterminate mode uses `Animated.loop(Animated.timing(...))` with
 *   `translateX` instead of CSS `@keyframes`.
 * - Label and value text rendered via the `<Text>` primitive.
 * - No `className`, CSS transitions, or `<style>` injection.
 * - Skeleton state omitted (RN apps typically use a dedicated Skeleton).
 */

import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Animated, Platform } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { ComponentSize, Thickness } from '@coexist/wisp-core/tokens/shared';
import { thicknessValues } from '@coexist/wisp-core/tokens/shared';
import { progressSizeMap } from '@coexist/wisp-core/types/Progress.types';
import { resolveProgressColors } from '@coexist/wisp-core/styles/Progress.styles';
import type { ProgressColors } from '@coexist/wisp-core/styles/Progress.styles';
import { Text } from '../text';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// CSS keyframes for gradient shimmer sweep (web only)
let progressGradientInjected = false;
function injectProgressGradientKeyframes(): void {
  if (progressGradientInjected || typeof document === 'undefined') return;
  progressGradientInjected = true;
  const sheet = document.createElement('style');
  sheet.id = 'wisp-progress-gradient';
  sheet.textContent =
    '@keyframes wisp-progress-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }';
  document.head.appendChild(sheet);
}

// Native gradient: try to load expo-linear-gradient (optional peer dep)
let NativeLinearGradient: React.ComponentType<any> | null = null;
let NativeAnimatedGradient: React.ComponentType<any> | null = null;
try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LG = require('expo-linear-gradient').LinearGradient;
    if (LG) {
      NativeLinearGradient = LG;
      NativeAnimatedGradient = Animated.createAnimatedComponent(LG);
    }
  }
} catch {
  // expo-linear-gradient not available — native gradient will be skipped
}

const GRADIENT_COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#8B5CF6'];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProgressProps extends Omit<ViewProps, 'children'> {
  /**
   * Current progress value (clamped between `0` and `max`).
   *
   * @default 0
   */
  value?: number;

  /**
   * Maximum value that represents 100% completion.
   *
   * @default 100
   */
  max?: number;

  /**
   * Progress bar size.
   *
   * @default 'md'
   */
  size?: ComponentSize;

  /** Label text rendered above the bar on the left side. */
  label?: string;

  /**
   * Whether to display the formatted percentage value above the bar.
   *
   * @default false
   */
  showValue?: boolean;

  /**
   * Custom value formatter used when `showValue` is `true`.
   *
   * @param value - The clamped current value.
   * @param max - The maximum value.
   * @returns A formatted string to display (e.g. `"75%"`).
   */
  formatValue?: (value: number, max: number) => string;

  /**
   * Semantic color variant for the filled portion of the bar.
   *
   * @default 'default'
   */
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';

  /**
   * When `true`, renders a continuously sliding animation instead of a
   * fixed-width fill. Useful when the total duration is unknown.
   *
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Override the bar thickness (height) using the shared `Thickness`
   * token. When provided this takes precedence over the size-based default.
   */
  thickness?: Thickness;

  /**
   * Use a gradient fill with shimmer sweep animation.
   * @default false
   */
  gradient?: boolean;

  /**
   * Show a subtle glow shadow at the leading edge of the progress fill.
   * @default false
   */
  glowEdge?: boolean;

  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Progress = forwardRef<View, ProgressProps>(function Progress(
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
    gradient = false,
    glowEdge = false,
    style: userStyle,
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
    return { ...baseSizeConfig, height: h, borderRadius: Math.round(h / 2) };
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
    [color, themeColors],
  );

  // ---------------------------------------------------------------------------
  // Gradient shimmer setup
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (gradient && Platform.OS === 'web') injectProgressGradientKeyframes();
  }, [gradient]);

  // Native gradient shimmer animation
  const nativeGradientAnim = useRef(new Animated.Value(0)).current;
  const useNativeGradient = gradient && Platform.OS !== 'web' && !!NativeAnimatedGradient;

  useEffect(() => {
    if (!useNativeGradient) return;
    const loop = Animated.loop(
      Animated.timing(nativeGradientAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [useNativeGradient, nativeGradientAnim]);

  // ---------------------------------------------------------------------------
  // Indeterminate animation
  // ---------------------------------------------------------------------------
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!indeterminate) return;
    const loop = Animated.loop(
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [indeterminate, slideAnim]);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const labelRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: defaultSpacing.sm,
  }), []);

  const labelTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.labelFontSize,
    lineHeight: Math.round(sizeConfig.labelFontSize * 1.4),
    fontWeight: defaultTypography.weights.medium,
    color: colors.label,
  }), [sizeConfig, colors]);

  const valueTextStyle = useMemo<TextStyle>(() => ({
    fontSize: sizeConfig.valueFontSize,
    lineHeight: Math.round(sizeConfig.valueFontSize * 1.4),
    fontWeight: defaultTypography.weights.medium,
    color: colors.value,
  }), [sizeConfig, colors]);

  const trackStyle = useMemo<ViewStyle>(() => ({
    width: '100%',
    height: sizeConfig.height,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: colors.track,
    overflow: 'hidden',
  }), [sizeConfig, colors]);

  const gradientFillWebStyle: any = gradient && Platform.OS === 'web'
    ? {
        background: 'linear-gradient(90deg, #8B5CF6, #EC4899, #3B82F6, #8B5CF6)',
        backgroundSize: '200% 100%',
        animation: 'wisp-progress-shimmer 2s linear infinite',
      }
    : {};

  const determinateFillStyle = useMemo<ViewStyle>(() => ({
    height: '100%',
    width: `${percent}%`,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: (gradient && (Platform.OS === 'web' || useNativeGradient)) ? undefined : colors.fill,
    overflow: 'hidden' as const,
  }), [sizeConfig, colors, percent, gradient, useNativeGradient]);

  const indeterminateFillStyle = useMemo<ViewStyle>(() => ({
    height: '100%',
    width: '40%',
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: colors.fill,
  }), [sizeConfig, colors]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View
      ref={ref}
      accessibilityRole="progressbar"
      accessibilityState={indeterminate ? { busy: true } : undefined}
      accessibilityValue={
        indeterminate
          ? undefined
          : { min: 0, max, now: clampedValue }
      }
      style={[{ width: '100%' }, userStyle]}
      {...rest}
    >
      {/* Label row */}
      {(label || showValue) && (
        <View style={labelRowStyle}>
          {label && <Text style={labelTextStyle}>{label}</Text>}
          {showValue && !indeterminate && (
            <Text style={valueTextStyle}>{displayValue}</Text>
          )}
        </View>
      )}

      {/* Track */}
      <View style={trackStyle}>
        {/* Fill */}
        {indeterminate ? (
          <Animated.View
            style={[
              indeterminateFillStyle,
              gradientFillWebStyle,
              {
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 350],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : (
          <View style={[determinateFillStyle, gradientFillWebStyle]}>
            {/* Native gradient fill */}
            {useNativeGradient && NativeAnimatedGradient && (
              <NativeAnimatedGradient
                colors={GRADIENT_COLORS}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '200%',
                  height: '100%',
                  transform: [{
                    translateX: nativeGradientAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-200, 200],
                    }),
                  }],
                } as any}
              />
            )}
            {glowEdge && percent > 0 && percent < 100 && (
              <View
                style={{
                  position: 'absolute',
                  right: -2,
                  top: -2,
                  bottom: -2,
                  width: 8,
                  borderRadius: 4,
                  backgroundColor: gradient ? '#EC4899' : colors.fill,
                  opacity: 0.6,
                  shadowColor: gradient ? '#EC4899' : colors.fill,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                }}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
});

Progress.displayName = 'Progress';
