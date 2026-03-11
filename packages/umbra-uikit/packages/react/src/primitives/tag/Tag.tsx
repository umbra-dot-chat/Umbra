import React, { forwardRef, useMemo, useCallback, useState } from 'react';
import type { TagProps } from '@coexist/wisp-core/types/Tag.types';
import { tagSizeMap } from '@coexist/wisp-core/types/Tag.types';
import {
  resolveTagColors,
  buildTagStyle,
  buildCloseButtonStyle,
  getTagSkeletonStyle,
} from '@coexist/wisp-core/styles/Tag.styles';
import { useTheme } from '../../providers';
import { Text } from '../text';

/**
 * Tag — Interactive chip/label primitive for the Wisp design system.
 *
 * @remarks
 * Renders a pill/chip element with optional leading icon, close/remove button,
 * and selected state. Key features:
 *
 * - Three sizes: `sm`, `md`, `lg`.
 * - Optional leading icon via {@link TagProps.icon}.
 * - Removable with an `X` close button via {@link TagProps.onRemove}.
 * - Selected/active visual state via {@link TagProps.selected}.
 * - Disabled state with reduced opacity and no hover effects.
 * - Skeleton loading placeholder via {@link TagProps.skeleton}.
 * - Hover interactions with smooth background transitions.
 *
 * @module primitives/tag
 *
 * @example
 * ```tsx
 * import { Hash } from 'lucide-react';
 *
 * // Basic
 * <Tag>Label</Tag>
 *
 * // With icon
 * <Tag icon={Hash} size="sm">Channel</Tag>
 *
 * // Removable
 * <Tag onRemove={() => handleRemove(id)}>Removable</Tag>
 *
 * // Selected
 * <Tag selected>Active</Tag>
 * ```
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  {
    children,
    size = 'md',
    onRemove,
    selected = false,
    disabled = false,
    icon: IconComponent,
    skeleton = false,
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
  // Hover states
  // ---------------------------------------------------------------------------
  const [hovered, setHovered] = useState(false);
  const [closeHovered, setCloseHovered] = useState(false);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      if (!disabled) setHovered(true);
      onMouseEnter?.(e);
    },
    [disabled, onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      setHovered(false);
      onMouseLeave?.(e);
    },
    [onMouseLeave],
  );

  const handleCloseMouseEnter = useCallback(() => {
    setCloseHovered(true);
  }, []);

  const handleCloseMouseLeave = useCallback(() => {
    setCloseHovered(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Close / remove handler
  // ---------------------------------------------------------------------------
  const handleRemove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (!disabled) onRemove?.();
    },
    [disabled, onRemove],
  );

  // ---------------------------------------------------------------------------
  // Resolve dimensions + colors
  // ---------------------------------------------------------------------------
  const sizeConfig = tagSizeMap[size];

  const colors = useMemo(
    () => resolveTagColors(selected, disabled, theme),
    [selected, disabled, theme],
  );

  // ---------------------------------------------------------------------------
  // Skeleton
  // ---------------------------------------------------------------------------
  if (skeleton) {
    const skeletonStyle = getTagSkeletonStyle(sizeConfig, theme);
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
  const tagStyle = useMemo(
    () => buildTagStyle(sizeConfig, colors, disabled, theme),
    [sizeConfig, colors, disabled, theme],
  );

  const closeButtonStyle = useMemo(
    () => buildCloseButtonStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  // Apply hover backgrounds
  const interactiveTagStyle: React.CSSProperties = {
    ...tagStyle,
    backgroundColor: hovered && !disabled ? colors.bgHover : colors.bg,
    // Reduce right padding when close button is present for visual balance
    paddingRight: onRemove ? sizeConfig.paddingX - 2 : sizeConfig.paddingX,
    ...userStyle,
  };

  const interactiveCloseStyle: React.CSSProperties = {
    ...closeButtonStyle,
    backgroundColor: closeHovered ? colors.closeHover : colors.closeBg,
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <span
      ref={ref}
      role="option"
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      className={className}
      style={interactiveTagStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {/* Leading icon */}
      {IconComponent && (
        <IconComponent
          size={sizeConfig.fontSize}
          color={colors.text}
          strokeWidth={2}
        />
      )}

      {/* Tag label */}
      <Text color="inherit">{children}</Text>

      {/* Close / remove button */}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove"
          onClick={handleRemove}
          style={interactiveCloseStyle}
          onMouseEnter={handleCloseMouseEnter}
          onMouseLeave={handleCloseMouseLeave}
          disabled={disabled}
          tabIndex={-1}
        >
          <svg
            width={sizeConfig.closeIconSize}
            height={sizeConfig.closeIconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.closeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>
      )}
    </span>
  );
});

Tag.displayName = 'Tag';
