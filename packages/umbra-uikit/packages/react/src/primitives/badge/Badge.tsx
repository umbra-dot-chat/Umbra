import React, { forwardRef, useMemo } from 'react';
import type { BadgeProps } from '@coexist/wisp-core/types/Badge.types';
import { badgeSizeMap } from '@coexist/wisp-core/types/Badge.types';
import {
  buildBadgeStyle,
  buildDotStyle,
  resolveBadgeColors,
  getBadgeSkeletonStyle,
} from '@coexist/wisp-core/styles/Badge.styles';
import { useTheme } from '../../providers';

/**
 * Badge — Compact label primitive for the Wisp design system.
 *
 * @remarks
 * Displays short status text, tags, or labels with optional dot indicator
 * and leading/trailing icon slots. Key features:
 *
 * - Five semantic variants: `default`, `success`, `warning`, `danger`, `info`.
 * - Three sizes: `sm`, `md`, `lg`.
 * - Two shape options: `pill` (fully rounded) and `badge` (slight rounding).
 * - Optional leading/trailing icon slots via {@link BadgeProps.icon} and {@link BadgeProps.trailingIcon}.
 * - Dot indicator via {@link BadgeProps.dot}.
 * - Skeleton loading placeholder via {@link BadgeProps.skeleton}.
 *
 * @module primitives/badge
 *
 * @example
 * ```tsx
 * <Badge variant="success" dot>Active</Badge>
 * <Badge variant="danger" icon={AlertCircle} size="sm">Error</Badge>
 * <Badge skeleton />
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    children,
    size = 'md',
    variant = 'default',
    shape = 'pill',
    dot = false,
    icon: Icon,
    trailingIcon: TrailingIcon,
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = badgeSizeMap[size];

  // Resolve variant colors
  const colors = useMemo(
    () => resolveBadgeColors(variant, theme),
    [variant, theme],
  );

  // Skeleton early return
  if (skeleton) {
    const skeletonStyle = getBadgeSkeletonStyle(sizeConfig, theme);
    return (
      <span
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Build styles
  const badgeStyle = useMemo(
    () => buildBadgeStyle(sizeConfig, colors, shape, theme),
    [sizeConfig, colors, shape, theme],
  );

  const dotStyle = useMemo(
    () => (dot ? buildDotStyle(sizeConfig, colors, theme) : undefined),
    [dot, sizeConfig, colors, theme],
  );

  return (
    <span
      ref={ref}
      className={className}
      style={{ ...badgeStyle, ...userStyle }}
      {...rest}
    >
      {dot && <span style={dotStyle} />}
      {Icon && <Icon size={sizeConfig.iconSize} color={colors.text} strokeWidth={2} />}
      {children}
      {TrailingIcon && <TrailingIcon size={sizeConfig.iconSize} color={colors.text} strokeWidth={2} />}
    </span>
  );
});

Badge.displayName = 'Badge';
