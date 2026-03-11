/**
 * @module Button
 */
import React, { forwardRef, useMemo, useCallback, useEffect, useRef } from 'react';
import type { ButtonProps } from '@coexist/wisp-core/types/Button.types';
import type { ComponentSize } from '@coexist/wisp-core/tokens/shared';
import type { TextSize } from '@coexist/wisp-core/tokens/shared';
import {
  buildButtonStyle,
  resolveVariantColors,
  getDisabledColors,
  getButtonSkeletonStyle,
  getSpinnerStyle,
} from '@coexist/wisp-core/styles/Button.styles';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * Maps {@link ComponentSize} to the {@link Text} primitive's {@link TextSize}
 * so button labels render through the Wisp typography system.
 *
 * @remarks
 * Smaller button sizes (`xs`, `sm`, `md`) use compact text sizes to keep labels
 * proportional, while larger buttons (`lg`, `xl`) step up accordingly.
 */
const buttonTextSizeMap: Record<ComponentSize, TextSize> = {
  xs: 'xs',
  sm: 'sm',
  md: 'sm',
  lg: 'md',
  xl: 'md',
};

/**
 * Injects the `wisp-button-spin` CSS keyframe animation into the document head.
 *
 * @remarks
 * This is a side-effect that runs at most once per page load, guarded by a
 * module-level flag. Safe to call in SSR environments (no-ops when `document`
 * is undefined).
 */
let spinnerInjected = false;
function injectSpinnerKeyframe() {
  if (spinnerInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-button-spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
  spinnerInjected = true;
}

/**
 * Injects the `wisp-pulse-cta` CSS keyframe animation into the document head.
 *
 * @remarks
 * Creates an outward-radiating pulse ring that fades from visible to invisible.
 * The animation uses `box-shadow` expansion for a smooth, GPU-accelerated effect.
 */
let pulseInjected = false;
function injectPulseKeyframe() {
  if (pulseInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `@keyframes wisp-pulse-cta { 0% { box-shadow: 0 0 0 0 var(--wisp-pulse-color, rgba(0,0,0,0.3)); } 70% { box-shadow: 0 0 0 8px transparent; } 100% { box-shadow: 0 0 0 0 transparent; } }`;
  document.head.appendChild(style);
  pulseInjected = true;
}

/**
 * Button -- Interactive button primitive for the Wisp design system.
 *
 * @remarks
 * Monochrome by default with status variants for semantic actions.
 * Supports 5 sizes (`xs` through `xl`), 3 shapes (`rounded`, `pill`, `square`),
 * left/right icon slots, a loading spinner state, and a skeleton shimmer
 * placeholder. Labels are rendered via the {@link Text} primitive so
 * typography tokens are applied consistently.
 *
 * When both `disabled` and `isLoading` are false the button responds to
 * hover and active mouse events with inline-style color transitions derived
 * from the active {@link ButtonVariant}.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Button variant="primary" size="md">Save</Button>
 *
 * // With left icon
 * <Button variant="secondary" iconLeft={<Icon icon={Plus} size="sm" />}>Add item</Button>
 *
 * // Loading state
 * <Button variant="destructive" isLoading>Deleting...</Button>
 *
 * // Skeleton placeholder
 * <Button variant="primary" skeleton />
 *
 * // Icon-only (no children)
 * <Button variant="tertiary" iconLeft={<Icon icon={Search} size="sm" />} />
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = 'primary',
    onSurface = false,
    size = 'md',
    shape = 'rounded',
    iconLeft,
    iconRight,
    isLoading = false,
    disabled = false,
    fullWidth = false,
    skeleton = false,
    pulse = false,
    style: userStyle,
    className,
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    onClick,
    type = 'button',
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const internalRef = useRef<HTMLButtonElement>(null);
  const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || internalRef;

  // Inject spinner animation
  useEffect(() => {
    if (isLoading) injectSpinnerKeyframe();
  }, [isLoading]);

  // Inject pulse animation
  useEffect(() => {
    if (pulse) injectPulseKeyframe();
  }, [pulse]);

  // Determine if icon-only
  const isIconOnly = !children && !!(iconLeft || iconRight);

  // Resolve colors
  const variantColors = useMemo(() => {
    if (disabled && !isLoading) return getDisabledColors(theme);
    return resolveVariantColors(variant, theme, onSurface);
  }, [variant, disabled, isLoading, theme, onSurface]);

  // Build style
  const computedStyle = useMemo(
    () =>
      buildButtonStyle({
        size,
        shape,
        variantColors,
        isIconOnly,
        fullWidth,
        disabled: disabled || isLoading,
        isLoading,
      }, theme),
    [size, shape, variantColors, isIconOnly, fullWidth, disabled, isLoading, theme],
  );

  // Hover/active handlers for inline style state
  const [hovered, setHovered] = React.useState(false);
  const [pressed, setPressed] = React.useState(false);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !isLoading) setHovered(true);
      onMouseEnter?.(e);
    },
    [disabled, isLoading, onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setHovered(false);
      setPressed(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!disabled && !isLoading) setPressed(true);
      onMouseDown?.(e);
    },
    [disabled, isLoading, onMouseDown],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setPressed(false);
      onMouseUp?.(e);
    },
    [onMouseUp],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    },
    [disabled, isLoading, onClick],
  );

  // Skeleton loading state
  if (skeleton) {
    const skeletonStyle = getButtonSkeletonStyle(size, shape, fullWidth, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Compute interactive background
  const interactiveBg = pressed
    ? variantColors.bgActive
    : hovered
      ? variantColors.bgHover
      : variantColors.bg;

  const interactiveBorder = hovered
    ? variantColors.borderHover
    : variantColors.border;

  // Pulse color: use the variant's bg color at 40% opacity for the outward ring
  const pulseColor = pulse && !disabled && !isLoading
    ? (variantColors.bg !== 'transparent' ? variantColors.bg + '66' : variantColors.border + '66')
    : undefined;

  const baseShadow = interactiveBorder !== 'transparent'
    ? `inset 0 0 0 1px ${interactiveBorder}`
    : 'none';

  const mergedStyle: React.CSSProperties = {
    ...computedStyle,
    backgroundColor: interactiveBg,
    boxShadow: baseShadow,
    ...(pulseColor ? {
      '--wisp-pulse-color': pulseColor,
      animation: 'wisp-pulse-cta 2s ease-in-out infinite',
    } as React.CSSProperties : {}),
    ...userStyle,
  };

  // Spinner
  const spinner = isLoading ? (
    <span style={getSpinnerStyle(size, variantColors.text, theme)} />
  ) : null;

  // Resolve text size for this button size
  const textSize = buttonTextSizeMap[size];

  // Content — uses Text primitive for the label
  const content = isLoading ? (
    <>
      {spinner}
      {children && (
        <Text size={textSize} weight="medium" color="currentColor" style={{ opacity: 0.7 }}>
          {children}
        </Text>
      )}
    </>
  ) : (
    <>
      {iconLeft}
      {children && (
        <Text size={textSize} weight="medium" color="currentColor">
          {children}
        </Text>
      )}
      {iconRight}
    </>
  );

  return (
    <button
      ref={buttonRef}
      type={type}
      className={className}
      style={mergedStyle}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading || undefined}
      aria-busy={isLoading || undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      {...rest}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';
