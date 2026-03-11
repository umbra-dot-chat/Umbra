/**
 * @module primitives/slider
 * @description React Native Slider primitive for the Wisp design system.
 *
 * Reuses color resolution and size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `PanResponder` for drag gestures instead of mouse/touch DOM events.
 * - Thumb positioned via absolute positioning instead of CSS `left` percentage.
 * - Track width measured via `onLayout` instead of `getBoundingClientRect`.
 * - No `className`, `skeleton`, or keyboard event props.
 * - Label and value rendered with the design-system `<Text>` component.
 */

import React, { forwardRef, useMemo, useCallback, useState, useRef } from 'react';
import { View, PanResponder } from 'react-native';
import type { ViewProps, ViewStyle, LayoutChangeEvent, GestureResponderEvent } from 'react-native';
import type { ComponentSize, Thickness } from '@coexist/wisp-core/tokens/shared';
import { sliderSizeMap } from '@coexist/wisp-core/types/Slider.types';
import { resolveSliderColors } from '@coexist/wisp-core/styles/Slider.styles';
import { thicknessValues } from '@coexist/wisp-core/tokens/shared';
import { Text } from '../text';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Clamp a value between `min` and `max`, then snap to the nearest step.
 *
 * @param value - Raw numeric value to constrain.
 * @param min - Lower bound.
 * @param max - Upper bound.
 * @param step - Step increment to snap to.
 * @returns The clamped and step-snapped value.
 */
function clampAndSnap(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(Math.max(value, min), max);
  const steps = Math.round((clamped - min) / step);
  const snapped = min + steps * step;
  return Math.min(Math.round(snapped * 1e10) / 1e10, max);
}

/**
 * Convert a numeric value to a percentage within the `[min, max]` range.
 *
 * @param value - Current value.
 * @param min - Range minimum.
 * @param max - Range maximum.
 * @returns A number between 0 and 100 representing the percentage.
 */
function valueToPercent(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return ((value - min) / (max - min)) * 100;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SliderProps extends Omit<ViewProps, 'children'> {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: ComponentSize;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  disabled?: boolean;
  thickness?: Thickness;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Slider = forwardRef<View, SliderProps>(function Slider(
  {
    value: controlledValue,
    defaultValue = 0,
    onChange,
    onChangeEnd,
    min = 0,
    max = 100,
    step = 1,
    size = 'md',
    label,
    showValue = false,
    formatValue,
    disabled = false,
    thickness,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // Controlled / uncontrolled
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    clampAndSnap(defaultValue, min, max, step),
  );
  const currentValue = isControlled ? controlledValue : internalValue;

  // Track width measurement
  const trackWidthRef = useRef(0);
  const trackPageXRef = useRef(0);

  const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
    const target = (e as any).target ?? (e.nativeEvent as any)?.target;
    if (target && typeof (target as any).measureInWindow === 'function') {
      (target as any).measureInWindow((x: number) => {
        trackPageXRef.current = x;
      });
    } else if (target && typeof (target as any).getBoundingClientRect === 'function') {
      // Web fallback: use getBoundingClientRect
      const rect = (target as any).getBoundingClientRect();
      trackPageXRef.current = rect.left;
    }
  }, []);

  // Update value
  const updateValue = useCallback(
    (newValue: number) => {
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  // Compute value from a page X position
  const computeValueFromPageX = useCallback(
    (pageX: number): number => {
      const trackWidth = trackWidthRef.current;
      if (trackWidth === 0) return currentValue;
      const ratio = (pageX - trackPageXRef.current) / trackWidth;
      const rawValue = min + ratio * (max - min);
      return clampAndSnap(rawValue, min, max, step);
    },
    [currentValue, min, max, step],
  );

  // PanResponder for drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        if (disabled) return;
        const newValue = computeValueFromPageX(e.nativeEvent.pageX);
        updateValue(newValue);
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        if (disabled) return;
        const newValue = computeValueFromPageX(e.nativeEvent.pageX);
        updateValue(newValue);
      },
      onPanResponderRelease: (e: GestureResponderEvent) => {
        if (disabled) return;
        const newValue = computeValueFromPageX(e.nativeEvent.pageX);
        onChangeEnd?.(newValue);
      },
    }),
  ).current;

  // Resolve sizes + colors
  const baseSizeConfig = sliderSizeMap[size];
  const sizeConfig = useMemo(() => {
    if (!thickness) return baseSizeConfig;
    const h = thicknessValues[thickness];
    return { ...baseSizeConfig, trackHeight: h, trackRadius: Math.round(h / 2) };
  }, [baseSizeConfig, thickness]);

  const colors = useMemo(
    () => resolveSliderColors(disabled, theme),
    [disabled, themeColors],
  );

  const percent = valueToPercent(currentValue, min, max);
  const displayValue = formatValue ? formatValue(currentValue) : String(currentValue);

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------

  const wrapperStyle = useMemo<ViewStyle>(() => ({
    width: '100%',
    opacity: disabled ? 0.5 : 1,
  }), [disabled]);

  const labelRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: defaultSpacing.sm,
  }), []);

  const trackWrapperStyle = useMemo<ViewStyle>(() => {
    const minHeight = Math.max(sizeConfig.thumbSize, sizeConfig.trackHeight);
    return {
      position: 'relative',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      height: minHeight,
    };
  }, [sizeConfig]);

  const trackStyle = useMemo<ViewStyle>(() => ({
    position: 'relative',
    width: '100%',
    height: sizeConfig.trackHeight,
    borderRadius: sizeConfig.trackRadius,
    backgroundColor: colors.track,
    overflow: 'hidden' as const,
  }), [sizeConfig, colors]);

  const filledTrackStyle = useMemo<ViewStyle>(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    height: sizeConfig.trackHeight,
    width: `${percent}%`,
    borderRadius: sizeConfig.trackRadius,
    backgroundColor: colors.trackFilled,
  }), [sizeConfig, colors, percent]);

  const thumbStyle = useMemo<ViewStyle>(() => {
    const thumbOffset = sizeConfig.thumbSize / 2;
    return {
      position: 'absolute',
      top: '50%',
      left: `${percent}%`,
      width: sizeConfig.thumbSize,
      height: sizeConfig.thumbSize,
      borderRadius: sizeConfig.thumbSize / 2,
      backgroundColor: colors.thumb,
      borderWidth: 2,
      borderColor: colors.thumbBorder,
      marginTop: -thumbOffset,
      marginLeft: -thumbOffset,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 1.5,
      elevation: 3,
      zIndex: 1,
    };
  }, [sizeConfig, colors, percent]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <View
      ref={ref}
      style={[wrapperStyle, userStyle]}
      {...rest}
    >
      {(label || showValue) && (
        <View style={labelRowStyle}>
          {label && (
            <Text
              size="sm"
              weight="medium"
              color={colors.label}
              style={{ fontSize: sizeConfig.labelFontSize, lineHeight: sizeConfig.labelFontSize * 1.4 }}
            >
              {label}
            </Text>
          )}
          {showValue && (
            <Text
              size="sm"
              color={colors.value}
              style={{
                fontSize: sizeConfig.valueFontSize,
                lineHeight: sizeConfig.valueFontSize * 1.4,
                marginLeft: label ? 8 : 0,
              }}
            >
              {displayValue}
            </Text>
          )}
        </View>
      )}

      <View
        style={trackWrapperStyle}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}
        accessibilityRole="adjustable"
        accessibilityValue={{
          min,
          max,
          now: currentValue,
        }}
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
      >
        <View style={trackStyle}>
          <View style={filledTrackStyle} />
        </View>

        <View style={thumbStyle} />
      </View>
    </View>
  );
});

Slider.displayName = 'Slider';
