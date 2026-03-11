/**
 * @module Toggle
 */
import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { ToggleProps } from '@coexist/wisp-core/types/Toggle.types';
import {
  resolveToggleColors,
  getDisabledToggleColors,
  resolveSizeConfig,
  buildTrackStyle,
  buildHandleStyle,
  buildTrackContentStyle,
  getToggleSkeletonStyle,
} from '@coexist/wisp-core/styles/Toggle.styles';
import { useTheme } from '../../providers';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

/**
 * Toggle -- Switch primitive for the Wisp design system.
 *
 * @remarks
 * Renders a monochrome track with a sliding circular handle. The component
 * supports both controlled (`checked` + `onChange`) and uncontrolled
 * (`defaultChecked`) usage patterns. Five size steps (`xs` through `xl`) are
 * available, each with an optional `slim` variant that produces a narrower
 * track and handle.
 *
 * Optional content can be placed on the track surface via `checkedContent`
 * and `uncheckedContent` (icons or short text that cross-fade based on
 * state). An icon can also be embedded inside the handle itself via
 * `handleIcon` (pass a Lucide component, not JSX).
 *
 * Custom track colors can be supplied through `checkedColor` and
 * `uncheckedColor`; the component automatically picks a contrasting handle
 * color based on relative luminance.
 *
 * The rendered element is a `<button role="switch">` with proper
 * `aria-checked` and `aria-label` attributes for accessibility.
 *
 * @example
 * ```tsx
 * import { Sun, Moon } from 'lucide-react';
 * import { Icon } from '../icon';
 *
 * // Basic uncontrolled
 * <Toggle />
 *
 * // With track content icons
 * <Toggle
 *   checkedContent={<Icon icon={Sun} size="xs" color="white" />}
 *   uncheckedContent={<Icon icon={Moon} size="xs" color="white" />}
 * />
 *
 * // With handle icon
 * <Toggle handleIcon={Sun} />
 *
 * // Controlled
 * <Toggle checked={isDark} onChange={setIsDark} />
 *
 * // Slim variant with custom color
 * <Toggle slim checkedColor="#22c55e" />
 *
 * // Skeleton placeholder
 * <Toggle skeleton />
 * ```
 */
export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  {
    checked: controlledChecked,
    defaultChecked = false,
    onChange,
    size = 'md',
    slim = false,
    disabled = false,
    checkedContent,
    uncheckedContent,
    handleIcon: HandleIconComponent,
    checkedColor,
    uncheckedColor,
    skeleton = false,
    label,
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
  // Hover state for track bg
  // ---------------------------------------------------------------------------
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled) setHovered(true);
      onMouseEnter?.(e);
    },
    [disabled, onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setHovered(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  // ---------------------------------------------------------------------------
  // Toggle handler
  // ---------------------------------------------------------------------------
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }
      const next = !isChecked;
      if (!isControlled) setInternalChecked(next);
      onChange?.(next);
      onClick?.(e);
    },
    [disabled, isChecked, isControlled, onChange, onClick],
  );

  // ---------------------------------------------------------------------------
  // Resolve dimensions + colors
  // ---------------------------------------------------------------------------
  const sizeConfig = useMemo(
    () => resolveSizeConfig(size, slim),
    [size, slim],
  );

  const colors = useMemo(() => {
    if (disabled) return getDisabledToggleColors(theme);
    return resolveToggleColors(isChecked, theme, checkedColor, uncheckedColor);
  }, [isChecked, disabled, theme, checkedColor, uncheckedColor]);

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getToggleSkeletonStyle(sizeConfig, theme);
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
  const hasContent = Boolean(checkedContent || uncheckedContent);

  const trackStyle = useMemo(
    () => buildTrackStyle({ sizeConfig, colors, disabled, hasContent }),
    [sizeConfig, colors, disabled, hasContent],
  );

  const handleStyle = useMemo(
    () => buildHandleStyle({ sizeConfig, colors, checked: isChecked, hasContent }, theme),
    [sizeConfig, colors, isChecked, hasContent, theme],
  );

  // Apply hover bg
  const interactiveTrackStyle: React.CSSProperties = {
    ...trackStyle,
    backgroundColor: hovered && !disabled ? colors.trackBgHover : colors.trackBg,
    ...userStyle,
  };

  // ---------------------------------------------------------------------------
  // Handle icon
  // ---------------------------------------------------------------------------
  const handleIconElement = HandleIconComponent ? (
    <HandleIconComponent
      size={sizeConfig.handleIconSize}
      color={colors.handleIconColor}
      strokeWidth={2}
    />
  ) : null;

  // ---------------------------------------------------------------------------
  // Track content (checked side / unchecked side)
  // ---------------------------------------------------------------------------
  const checkedContentStyle = useMemo(
    () => buildTrackContentStyle({ sizeConfig, side: 'checked', colors }, theme),
    [sizeConfig, colors, theme],
  );

  const uncheckedContentStyle = useMemo(
    () => buildTrackContentStyle({ sizeConfig, side: 'unchecked', colors }, theme),
    [sizeConfig, colors, theme],
  );

  // ---------------------------------------------------------------------------
  // Spacer — invisible elements that flow in flex layout to push track width
  // when content is present. The actual content is absolutely positioned for
  // visual placement, but these spacers ensure the track grows to fit.
  // ---------------------------------------------------------------------------
  const spacerItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: defaultSpacing['2xs'],
    // Reserve space: content padding + content + handle + handle padding
    paddingLeft: sizeConfig.padding + 6,
    paddingRight: sizeConfig.handleSize + sizeConfig.padding + 4,
    fontSize: sizeConfig.trackFontSize,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    gridArea: '1 / 1',
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={label}
      disabled={disabled}
      className={className}
      style={interactiveTrackStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {/* Invisible spacer — uses CSS grid overlap so the track grows
          to fit whichever content (checked or unchecked) is wider */}
      {hasContent && (
        <span aria-hidden style={{
          display: 'grid',
          visibility: 'hidden',
          pointerEvents: 'none',
        }}>
          {checkedContent && (
            <span style={spacerItemStyle}>{checkedContent}</span>
          )}
          {uncheckedContent && (
            <span style={spacerItemStyle}>{uncheckedContent}</span>
          )}
        </span>
      )}

      {/* Checked content (left side, visible when checked) */}
      {checkedContent && (
        <span
          style={{
            ...checkedContentStyle,
            opacity: isChecked ? 1 : 0,
            transition: 'opacity 150ms ease',
          }}
        >
          {checkedContent}
        </span>
      )}

      {/* Unchecked content (right side, visible when unchecked) */}
      {uncheckedContent && (
        <span
          style={{
            ...uncheckedContentStyle,
            opacity: isChecked ? 0 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          {uncheckedContent}
        </span>
      )}

      {/* Handle */}
      <span style={handleStyle}>
        {handleIconElement}
      </span>
    </button>
  );
});

Toggle.displayName = 'Toggle';
