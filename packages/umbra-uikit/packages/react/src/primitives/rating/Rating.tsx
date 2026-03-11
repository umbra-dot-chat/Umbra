import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { RatingProps } from '@coexist/wisp-core/types/Rating.types';
import { ratingSizeMap } from '@coexist/wisp-core/types/Rating.types';
import {
  buildRatingContainerStyle,
  buildRatingStarStyle,
  buildRatingValueStyle,
  getRatingSkeletonStyle,
} from '@coexist/wisp-core/styles/Rating.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * SVG path data for a 5-pointed star in a 24x24 viewBox.
 */
const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

// ---------------------------------------------------------------------------
// StarIcon — renders a single star SVG with optional half-fill support
// ---------------------------------------------------------------------------

interface StarIconProps {
  size: number;
  fillPercent: number;
  activeColor: string;
  inactiveColor: string;
}

/**
 * Renders an inline SVG star with configurable fill percentage.
 *
 * @remarks
 * Uses an SVG `<clipPath>` to render partial (half) fills. When `fillPercent`
 * is 0 the star is fully inactive; when 1 it is fully active; at 0.5 the left
 * half is filled with the active color and the right half with the inactive color.
 */
function StarIcon({ size, fillPercent, activeColor, inactiveColor }: StarIconProps) {
  // Unique ID for the clip path (avoid collisions with multiple instances)
  const clipId = useMemo(() => `wisp-star-clip-${Math.random().toString(36).slice(2, 9)}`, []);

  if (fillPercent <= 0) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={inactiveColor}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <path d={STAR_PATH} />
      </svg>
    );
  }

  if (fillPercent >= 1) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={activeColor}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <path d={STAR_PATH} />
      </svg>
    );
  }

  // Partial fill — clip the active layer to `fillPercent` width
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={24 * fillPercent} height="24" />
        </clipPath>
      </defs>
      {/* Inactive (full) background */}
      <path d={STAR_PATH} fill={inactiveColor} />
      {/* Active (clipped) foreground */}
      <path d={STAR_PATH} fill={activeColor} clipPath={`url(#${clipId})`} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Rating component
// ---------------------------------------------------------------------------

/**
 * Rating -- Star-based rating primitive for the Wisp design system.
 *
 * @remarks
 * Key features:
 * - Controlled (`value` + `onChange`) and uncontrolled (`defaultValue`) modes.
 * - Hover preview showing what rating would be applied on click.
 * - Half-star precision via `allowHalf`.
 * - Read-only and disabled display modes.
 * - Optional numeric value label beside stars.
 * - Skeleton loading placeholder.
 * - Inline SVG stars with no external dependencies.
 * - Three size tiers (`sm`, `md`, `lg`).
 *
 * @module primitives/rating
 * @example
 * ```tsx
 * // Uncontrolled
 * <Rating defaultValue={3} />
 *
 * // Controlled
 * <Rating value={rating} onChange={setRating} />
 *
 * // Read-only with value label
 * <Rating value={4.5} allowHalf readOnly showValue />
 * ```
 */
export const Rating = forwardRef<HTMLDivElement, RatingProps>(function Rating(
  {
    value: controlledValue,
    defaultValue = 0,
    max = 5,
    allowHalf = false,
    onChange,
    size = 'md',
    readOnly = false,
    disabled = false,
    showValue = false,
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
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? controlledValue : internalValue;

  // ---------------------------------------------------------------------------
  // Hover preview state
  // ---------------------------------------------------------------------------
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Resolve size config
  // ---------------------------------------------------------------------------
  const sizeConfig = ratingSizeMap[size];

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getRatingSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Interaction helpers
  // ---------------------------------------------------------------------------
  const isInteractive = !disabled && !readOnly;

  const handleStarClick = useCallback(
    (starIndex: number, isLeftHalf: boolean) => {
      if (!isInteractive) return;
      const newValue = allowHalf && isLeftHalf ? starIndex + 0.5 : starIndex + 1;
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [isInteractive, allowHalf, isControlled, onChange],
  );

  const handleStarHover = useCallback(
    (starIndex: number, isLeftHalf: boolean) => {
      if (!isInteractive) return;
      const previewValue = allowHalf && isLeftHalf ? starIndex + 0.5 : starIndex + 1;
      setHoveredValue(previewValue);
    },
    [isInteractive, allowHalf],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredValue(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Determine which value drives the visual fill
  // ---------------------------------------------------------------------------
  const displayValue = hoveredValue !== null ? hoveredValue : currentValue;

  // ---------------------------------------------------------------------------
  // Build container style
  // ---------------------------------------------------------------------------
  const containerStyle = useMemo<React.CSSProperties>(() => ({
    ...buildRatingContainerStyle(sizeConfig),
    opacity: disabled ? 0.5 : 1,
  }), [sizeConfig, disabled, theme]);

  // ---------------------------------------------------------------------------
  // Build value label style
  // ---------------------------------------------------------------------------
  const valueLabelStyle = useMemo(
    () => buildRatingValueStyle(sizeConfig, theme),
    [sizeConfig, theme],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const stars: React.ReactElement[] = [];

  for (let i = 0; i < max; i++) {
    // Calculate the fill percentage for this star (0, 0.5, or 1)
    let fillPercent: number;
    if (displayValue >= i + 1) {
      fillPercent = 1;
    } else if (displayValue > i) {
      fillPercent = displayValue - i;
    } else {
      fillPercent = 0;
    }

    const isActive = fillPercent > 0;
    const isHovered = hoveredValue !== null && (
      hoveredValue >= i + 1 || (hoveredValue > i && hoveredValue < i + 1)
    );

    const starStyle = buildRatingStarStyle(
      sizeConfig,
      isActive,
      isHovered,
      disabled,
      readOnly,
      theme,
    );

    stars.push(
      <span
        key={i}
        role={isInteractive ? 'radio' : undefined}
        aria-checked={isInteractive ? isActive : undefined}
        aria-label={isInteractive ? `${i + 1} star${i + 1 !== 1 ? 's' : ''}` : undefined}
        style={starStyle}
        onClick={
          isInteractive
            ? (e: React.MouseEvent<HTMLSpanElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                handleStarClick(i, isLeftHalf);
              }
            : undefined
        }
        onMouseMove={
          isInteractive
            ? (e: React.MouseEvent<HTMLSpanElement>) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                handleStarHover(i, isLeftHalf);
              }
            : undefined
        }
      >
        <StarIcon
          size={sizeConfig.starSize}
          fillPercent={fillPercent}
          activeColor={themeColors.accent.primary}
          inactiveColor={themeColors.border.subtle}
        />
      </span>,
    );
  }

  return (
    <div
      ref={ref}
      role={isInteractive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${currentValue} out of ${max}`}
      aria-disabled={disabled || undefined}
      aria-readonly={readOnly || undefined}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      onMouseLeave={isInteractive ? handleMouseLeave : undefined}
      {...rest}
    >
      {stars}
      {showValue && (
        <span data-testid="rating-value" style={valueLabelStyle}>
          {currentValue}
        </span>
      )}
    </div>
  );
});

Rating.displayName = 'Rating';
