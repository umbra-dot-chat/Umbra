import React, { forwardRef, useMemo, useCallback, useState, useRef, useEffect, useLayoutEffect } from 'react';
import type { SegmentedControlProps } from '@coexist/wisp-core/types/SegmentedControl.types';
import type { CSSStyleObject } from '@coexist/wisp-core/types';
import { segmentedControlSizeMap } from '@coexist/wisp-core/types/SegmentedControl.types';
import { buildContainerStyle, buildSegmentStyle, buildIndicatorStyle } from '@coexist/wisp-core/styles/SegmentedControl.styles';
import { useTheme } from '../../providers';

/** Use `useLayoutEffect` on the client and `useEffect` during SSR. */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * SegmentedControl -- A radio-group styled as a pill bar with a sliding indicator.
 *
 * @remarks
 * - Renders a `div` with `role="radiogroup"` containing one button per option.
 * - Supports controlled and uncontrolled selection via `value`/`defaultValue`.
 * - Arrow-key navigation cycles through enabled segments.
 * - A sliding indicator animates behind the active segment.
 *
 * @module primitives/segmented-control
 * @example
 * ```tsx
 * <SegmentedControl
 *   size="md"
 *   options={[
 *     { value: 'list', label: 'List' },
 *     { value: 'grid', label: 'Grid' },
 *   ]}
 *   defaultValue="list"
 *   onChange={(v) => console.log(v)}
 * />
 * ```
 */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl(
    { options, value: controlledValue, defaultValue, onChange,
      size = 'md', fullWidth = false, disabled = false,
      className, style: userStyle, ...rest },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue);
    const selectedValue = isControlled ? controlledValue : internalValue;
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const segmentRefs = useRef<(HTMLButtonElement | null)[]>([]);

    // Indicator position state
    const [indicatorRect, setIndicatorRect] = useState<{ x: number; w: number } | null>(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const hasMountedRef = useRef(false);

    const handleSelect = useCallback((optionValue: string) => {
      if (!isControlled) setInternalValue(optionValue);
      onChange?.(optionValue);
    }, [isControlled, onChange]);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        const enabledIndices = options
          .map((opt, i) => ({ opt, i }))
          .filter(({ opt }) => !opt.disabled && !disabled)
          .map(({ i }) => i);
        if (enabledIndices.length === 0) return;
        let targetIndex: number | null = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const pos = enabledIndices.indexOf(currentIndex);
          const nextPos = pos === -1 ? 0 : (pos + 1) % enabledIndices.length;
          targetIndex = enabledIndices[nextPos];
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const pos = enabledIndices.indexOf(currentIndex);
          const prevPos = pos === -1 ? enabledIndices.length - 1 : (pos - 1 + enabledIndices.length) % enabledIndices.length;
          targetIndex = enabledIndices[prevPos];
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const opt = options[currentIndex];
          if (!opt.disabled && !disabled) { handleSelect(opt.value); }
          return;
        }
        if (targetIndex !== null) {
          segmentRefs.current[targetIndex]?.focus();
          handleSelect(options[targetIndex].value);
        }
      }, [options, disabled, handleSelect]);

    // Measure the active segment and update indicator position
    useIsomorphicLayoutEffect(() => {
      const activeIndex = options.findIndex((opt) => opt.value === selectedValue);
      if (activeIndex === -1) {
        setIndicatorRect(null);
        return;
      }
      const el = segmentRefs.current[activeIndex];
      if (!el) {
        setIndicatorRect(null);
        return;
      }
      setIndicatorRect({ x: el.offsetLeft, w: el.offsetWidth });
      // Enable animation after first render
      if (!hasMountedRef.current) {
        hasMountedRef.current = true;
      } else {
        setShouldAnimate(true);
      }
    }, [selectedValue, options, size, fullWidth]);

    const containerStyle = useMemo(
      () => buildContainerStyle({ fullWidth, theme, userStyle: userStyle as CSSStyleObject }),
      [fullWidth, theme, userStyle],
    );

    const sizeConfig = segmentedControlSizeMap[size];

    return (
      <div ref={ref} role="radiogroup" className={className} style={containerStyle} {...rest}>
        {/* Sliding indicator */}
        {indicatorRect !== null && (
          <div
            aria-hidden
            style={buildIndicatorStyle({
              offsetX: indicatorRect.x,
              width: indicatorRect.w,
              height: sizeConfig.height,
              animate: shouldAnimate,
              theme,
            })}
          />
        )}

        {options.map((option, index) => {
          const isActive = option.value === selectedValue;
          const isSegmentDisabled = disabled || Boolean(option.disabled);
          const isHovered = hoveredIndex === index;
          const segStyle = buildSegmentStyle({
            size, isActive, isDisabled: isSegmentDisabled, isHovered, fullWidth, theme,
          });
          return (
            <button
              key={option.value}
              ref={(el) => { segmentRefs.current[index] = el; }}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={isSegmentDisabled}
              tabIndex={isActive ? 0 : -1}
              style={segStyle}
              onClick={() => { if (!isSegmentDisabled) handleSelect(option.value); }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onMouseEnter={() => { if (!isSegmentDisabled) setHoveredIndex(index); }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {option.icon && (<span style={{ display: 'flex', alignItems: 'center' }}>{option.icon}</span>)}
              {option.label}
            </button>
          );
        })}
      </div>
    );
  },
);

SegmentedControl.displayName = 'SegmentedControl';
