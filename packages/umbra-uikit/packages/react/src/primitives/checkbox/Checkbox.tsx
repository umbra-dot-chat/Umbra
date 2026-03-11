import React, { forwardRef, useMemo, useCallback, useState, useRef } from 'react';
import type { CheckboxProps } from '@coexist/wisp-core/types/Checkbox.types';
import { checkboxSizeMap } from '@coexist/wisp-core/types/Checkbox.types';
import {
  resolveCheckboxColors,
  buildBoxStyle,
  buildIconStyle,
  getCheckboxSkeletonStyle,
} from '@coexist/wisp-core/styles/Checkbox.styles';
import { useTheme } from '../../providers';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

/**
 * Checkbox — Selection primitive for the Wisp design system.
 *
 * @remarks
 * Monochrome checkbox with optional label and description text.
 * Key features:
 *
 * - Controlled and uncontrolled modes via `checked` / `defaultChecked`.
 * - Indeterminate (dash) state for "select-all" patterns.
 * - Five sizes via the {@link CheckboxSize} scale (`xs` | `sm` | `md` | `lg` | `xl`).
 * - Error and warning border states.
 * - Disabled state with reduced opacity and `not-allowed` cursor.
 * - Skeleton loading placeholder with shimmer animation.
 * - Animated checkmark / dash stroke draw and spring-scale press feedback.
 * - Keyboard accessible (`Space` to toggle, focus-visible ring).
 * - Hidden native `<input type="checkbox">` for form submission.
 * - Forwards a ref to the root `<label>` element.
 *
 * @module primitives/checkbox
 *
 * @example
 * ```tsx
 * // Basic
 * <Checkbox />
 *
 * // With label
 * <Checkbox label="Accept terms" />
 *
 * // With label and description
 * <Checkbox label="Notifications" description="Receive email updates" />
 *
 * // Controlled
 * <Checkbox checked={agreed} onChange={setAgreed} />
 *
 * // Indeterminate
 * <Checkbox indeterminate />
 * ```
 */
export const Checkbox = forwardRef<HTMLLabelElement, CheckboxProps>(function Checkbox(
  {
    checked: controlledChecked,
    defaultChecked = false,
    indeterminate = false,
    onChange,
    size = 'md',
    disabled = false,
    label,
    description,
    error = false,
    warning = false,
    skeleton = false,
    name,
    value,
    style: userStyle,
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // ---------------------------------------------------------------------------
  // Controlled / uncontrolled state
  // ---------------------------------------------------------------------------
  const isControlled = controlledChecked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = isControlled ? controlledChecked : internalChecked;

  // ---------------------------------------------------------------------------
  // Hover state for border color
  // ---------------------------------------------------------------------------
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLLabelElement>) => {
      if (!disabled) setHovered(true);
      onMouseEnter?.(e);
    },
    [disabled, onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLLabelElement>) => {
      setHovered(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  // ---------------------------------------------------------------------------
  // Focus-visible ring (keyboard detection)
  // ---------------------------------------------------------------------------
  const [focusVisible, setFocusVisible] = useState(false);
  const isKeyboardRef = useRef(false);

  const handleKeyDown = useCallback(() => {
    isKeyboardRef.current = true;
  }, []);

  const handleFocus = useCallback(() => {
    if (isKeyboardRef.current) {
      setFocusVisible(true);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setFocusVisible(false);
    isKeyboardRef.current = false;
  }, []);

  // ---------------------------------------------------------------------------
  // Press scale animation
  // ---------------------------------------------------------------------------
  const [pressed, setPressed] = useState(false);

  const handleMouseDown = useCallback(() => {
    if (!disabled) setPressed(true);
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    setPressed(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Toggle handler
  // ---------------------------------------------------------------------------
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLLabelElement>) => {
      // Prevent the native label→input click passthrough which would double-toggle
      e.preventDefault();
      if (disabled) return;
      const next = !isChecked;
      if (!isControlled) setInternalChecked(next);
      onChange?.(next);
      onClick?.(e);
    },
    [disabled, isChecked, isControlled, onChange, onClick],
  );

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLLabelElement>) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (disabled) return;
        const next = !isChecked;
        if (!isControlled) setInternalChecked(next);
        onChange?.(next);
      }
    },
    [disabled, isChecked, isControlled, onChange],
  );

  // ---------------------------------------------------------------------------
  // Resolve dimensions + colors
  // ---------------------------------------------------------------------------
  const sizeConfig = checkboxSizeMap[size];

  const colors = useMemo(
    () => resolveCheckboxColors(isChecked, indeterminate, error, warning, disabled, theme),
    [isChecked, indeterminate, error, warning, disabled, theme],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getCheckboxSkeletonStyle(sizeConfig, theme);
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
  const boxStyle = useMemo(
    () => buildBoxStyle(sizeConfig, colors, disabled, theme),
    [sizeConfig, colors, disabled, theme],
  );

  const iconStyle = useMemo(
    () => buildIconStyle(sizeConfig, isChecked, indeterminate),
    [sizeConfig, isChecked, indeterminate],
  );

  // Apply hover, press, and focus-visible overrides to box
  const interactiveBoxStyle: React.CSSProperties = {
    ...boxStyle,
    ...(hovered && !disabled
      ? { backgroundColor: colors.boxBgHover, borderColor: colors.boxBorderHover }
      : {}),
    ...(pressed && !disabled
      ? { transform: 'scale(0.9)' }
      : {}),
    ...(focusVisible
      ? { boxShadow: `0 0 0 2px ${themeColors.background.canvas}, 0 0 0 4px ${themeColors.accent.primary}` }
      : {}),
  };

  // Root label style
  const rootStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'flex-start',
    gap: sizeConfig.gap,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    userSelect: 'none',
    ...userStyle,
  };

  // ---------------------------------------------------------------------------
  // Checkmark SVG — animated stroke draw
  // ---------------------------------------------------------------------------
  // Total path length for the checkmark polyline (approximate for viewBox 0 0 24 24)
  const checkPathLength = 28;
  const dashPathLength = 12;

  const isActive = isChecked || indeterminate;

  const checkmarkSvg = (
    <svg
      width={sizeConfig.iconSize}
      height={sizeConfig.iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={iconStyle}
    >
      {indeterminate ? (
        // Horizontal dash for indeterminate — stroke draw animation
        <line
          x1="6"
          y1="12"
          x2="18"
          y2="12"
          stroke={colors.iconColor}
          strokeWidth={sizeConfig.iconStrokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashPathLength}
          strokeDashoffset={isActive ? 0 : dashPathLength}
          style={{
            transition: isActive
              ? 'stroke-dashoffset 250ms cubic-bezier(0.65, 0, 0.35, 1) 60ms'
              : 'stroke-dashoffset 120ms ease-in',
          }}
        />
      ) : (
        // Checkmark polyline — stroke draw animation
        <polyline
          points="4 12 10 18 20 6"
          stroke={colors.iconColor}
          strokeWidth={sizeConfig.iconStrokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={checkPathLength}
          strokeDashoffset={isActive ? 0 : checkPathLength}
          style={{
            transition: isActive
              ? 'stroke-dashoffset 300ms cubic-bezier(0.65, 0, 0.35, 1) 60ms'
              : 'stroke-dashoffset 120ms ease-in',
          }}
        />
      )}
    </svg>
  );

  // ---------------------------------------------------------------------------
  // Text container
  // ---------------------------------------------------------------------------
  const hasText = Boolean(label || description);

  const textContainer = hasText ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: defaultSpacing['2xs'], minWidth: 0 }}>
      {label && (
        <span
          style={{
            fontSize: sizeConfig.labelFontSize,
            lineHeight: sizeConfig.labelLineHeight,
            color: colors.labelColor,
          }}
        >
          {label}
        </span>
      )}
      {description && (
        <span
          style={{
            fontSize: Math.max(sizeConfig.labelFontSize - 2, 11),
            lineHeight: sizeConfig.labelLineHeight,
            color: colors.descriptionColor,
          }}
        >
          {description}
        </span>
      )}
    </div>
  ) : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <label
      ref={ref}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : isChecked}
      aria-invalid={error || warning || undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : 0}
      className={className}
      style={rootStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    >
      {/* Hidden native input for form submission */}
      <input
        type="checkbox"
        checked={isChecked}
        disabled={disabled}
        name={name}
        value={value}
        aria-hidden
        tabIndex={-1}
        readOnly
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      {/* Visual checkbox box */}
      <span style={interactiveBoxStyle}>
        {checkmarkSvg}
      </span>

      {/* Label + description text */}
      {textContainer}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';
