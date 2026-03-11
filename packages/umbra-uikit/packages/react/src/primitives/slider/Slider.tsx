import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import type { SliderProps } from '@coexist/wisp-core/types/Slider.types';
import { sliderSizeMap } from '@coexist/wisp-core/types/Slider.types';
import {
  resolveSliderColors,
  buildTrackStyle,
  buildFilledTrackStyle,
  buildThumbStyle,
  buildLabelRowStyle,
  buildTrackWrapperStyle,
  getSliderSkeletonStyle,
} from '@coexist/wisp-core/styles/Slider.styles';
import { useTheme } from '../../providers';
import { fontFamilyStacks, thicknessValues } from '@coexist/wisp-core/tokens/shared';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';

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
  // Handle floating-point drift
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

/**
 * Slider -- Range selector primitive for the Wisp design system.
 *
 * @remarks
 * Key features:
 * - Controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) modes.
 * - Mouse drag, touch drag, and full keyboard navigation (arrow keys, Home/End).
 * - Five size tiers (`xs` through `xl`) with optional `thickness` override.
 * - Optional label row with a formatted current-value display.
 * - Skeleton loading placeholder.
 * - `onChangeEnd` callback fires only when drag or keyboard interaction completes.
 *
 * @module primitives/slider
 * @example
 * ```tsx
 * // Uncontrolled
 * <Slider defaultValue={50} />
 *
 * // Controlled
 * <Slider value={volume} onChange={setVolume} />
 *
 * // With label + value
 * <Slider label="Opacity" showValue formatValue={(v) => `${v}%`} />
 * ```
 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
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
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // ---------------------------------------------------------------------------
  // Controlled / uncontrolled state
  // ---------------------------------------------------------------------------
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    clampAndSnap(defaultValue, min, max, step),
  );
  const currentValue = isControlled ? controlledValue : internalValue;

  // ---------------------------------------------------------------------------
  // Dragging state
  // ---------------------------------------------------------------------------
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Compute value from a clientX position
  // ---------------------------------------------------------------------------
  const computeValueFromClientX = useCallback(
    (clientX: number): number => {
      const track = trackRef.current;
      if (!track) return currentValue;
      const rect = track.getBoundingClientRect();
      const ratio = (clientX - rect.left) / rect.width;
      const rawValue = min + ratio * (max - min);
      return clampAndSnap(rawValue, min, max, step);
    },
    [currentValue, min, max, step],
  );

  // ---------------------------------------------------------------------------
  // Update value
  // ---------------------------------------------------------------------------
  const updateValue = useCallback(
    (newValue: number) => {
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  // ---------------------------------------------------------------------------
  // Mouse drag handlers
  // ---------------------------------------------------------------------------
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(true);
      const newValue = computeValueFromClientX(e.clientX);
      updateValue(newValue);
    },
    [disabled, computeValueFromClientX, updateValue],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = computeValueFromClientX(e.clientX);
      updateValue(newValue);
    };

    const handleMouseUp = (e: MouseEvent) => {
      setDragging(false);
      const newValue = computeValueFromClientX(e.clientX);
      onChangeEnd?.(newValue);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, computeValueFromClientX, updateValue, onChangeEnd]);

  // ---------------------------------------------------------------------------
  // Touch drag handlers
  // ---------------------------------------------------------------------------
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      setDragging(true);
      const touch = e.touches[0];
      const newValue = computeValueFromClientX(touch.clientX);
      updateValue(newValue);
    },
    [disabled, computeValueFromClientX, updateValue],
  );

  useEffect(() => {
    if (!dragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newValue = computeValueFromClientX(touch.clientX);
      updateValue(newValue);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      setDragging(false);
      const touch = e.changedTouches[0];
      const newValue = computeValueFromClientX(touch.clientX);
      onChangeEnd?.(newValue);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [dragging, computeValueFromClientX, updateValue, onChangeEnd]);

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      let newValue: number | null = null;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          newValue = clampAndSnap(currentValue + step, min, max, step);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          newValue = clampAndSnap(currentValue - step, min, max, step);
          break;
        case 'Home':
          e.preventDefault();
          newValue = min;
          break;
        case 'End':
          e.preventDefault();
          newValue = max;
          break;
        default:
          return;
      }

      if (newValue !== null) {
        updateValue(newValue);
        onChangeEnd?.(newValue);
      }
    },
    [disabled, currentValue, step, min, max, updateValue, onChangeEnd],
  );

  // ---------------------------------------------------------------------------
  // Resolve sizes + colors
  // ---------------------------------------------------------------------------
  const baseSizeConfig = sliderSizeMap[size];
  const sizeConfig = useMemo(() => {
    if (!thickness) return baseSizeConfig;
    const h = thicknessValues[thickness];
    return { ...baseSizeConfig, trackHeight: h, trackRadius: Math.round(h / 2) };
  }, [baseSizeConfig, thickness]);

  const colors = useMemo(
    () => resolveSliderColors(disabled, theme),
    [disabled, theme],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getSliderSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Compute percentage
  // ---------------------------------------------------------------------------
  const percent = valueToPercent(currentValue, min, max);

  // ---------------------------------------------------------------------------
  // Format displayed value
  // ---------------------------------------------------------------------------
  const displayValue = formatValue ? formatValue(currentValue) : String(currentValue);

  // ---------------------------------------------------------------------------
  // Build styles
  // ---------------------------------------------------------------------------
  const trackWrapperStyle = buildTrackWrapperStyle(sizeConfig, disabled);
  const trackStyle = buildTrackStyle(sizeConfig, colors);
  const filledTrackStyle = buildFilledTrackStyle(sizeConfig, colors, percent);
  const thumbStyle = buildThumbStyle(sizeConfig, colors, percent, theme);
  const labelRowStyle = buildLabelRowStyle(theme);

  // ---------------------------------------------------------------------------
  // Wrapper style
  // ---------------------------------------------------------------------------
  const wrapperStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    opacity: disabled ? 0.5 : 1,
    fontFamily: fontFamilyStacks.sans,
    ...userStyle,
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      ref={ref}
      className={className}
      style={wrapperStyle}
      {...rest}
    >
      {/* Label row */}
      {(label || showValue) && (
        <div style={labelRowStyle}>
          {label && (
            <span
              style={{
                fontSize: sizeConfig.labelFontSize,
                fontWeight: defaultTypography.weights.medium,
                color: colors.label,
                lineHeight: 1.4,
              }}
            >
              {label}
            </span>
          )}
          {showValue && (
            <span
              data-testid="slider-value"
              style={{
                fontSize: sizeConfig.valueFontSize,
                color: colors.value,
                lineHeight: 1.4,
                marginLeft: label ? 8 : 0,
              }}
            >
              {displayValue}
            </span>
          )}
        </div>
      )}

      {/* Track wrapper — handles mouse/touch events */}
      <div
        ref={trackRef}
        style={trackWrapperStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Track background */}
        <div style={trackStyle}>
          {/* Filled portion */}
          <div style={filledTrackStyle} />
        </div>

        {/* Thumb */}
        <div
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
          aria-disabled={disabled || undefined}
          aria-label={label}
          style={thumbStyle}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
});

Slider.displayName = 'Slider';
