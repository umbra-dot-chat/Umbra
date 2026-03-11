import React, { forwardRef, useMemo } from 'react';
import type { IconProps } from '@coexist/wisp-core/types/Icon.types';
import { iconSizeMap } from '@coexist/wisp-core/types/Icon.types';
import { buildIconStyle, resolveIconColor, getIconSkeletonStyle } from '@coexist/wisp-core/styles/Icon.styles';
import { useTheme } from '../../providers';

/**
 * Icon — Icon primitive for the Wisp design system.
 *
 * @remarks
 * Wraps a Lucide React icon with semantic sizing, monochrome color variants,
 * skeleton loading, and accessibility support.
 *
 * Key features:
 * - Accepts any Lucide React icon component via the {@link IconProps.icon} prop.
 * - Five size presets (`xs` through `xl`) mapped to pixel values in {@link iconSizeMap}.
 * - Semantic and arbitrary color support resolved through the active theme.
 * - Built-in skeleton placeholder state for loading UIs.
 * - Automatic `aria-hidden` when no label is provided; `role="img"` with
 *   `aria-label` when a {@link IconProps.label} is set.
 *
 * @module primitives/icon
 *
 * @example
 * ```tsx
 * import { Search, AlertCircle } from 'lucide-react';
 *
 * <Icon icon={Search} />
 * <Icon icon={AlertCircle} size="lg" color="error" />
 * <Icon icon={Search} skeleton />
 * ```
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(function Icon(
  {
    icon: IconComponent,
    size = 'md',
    color = 'currentColor',
    strokeWidth = 2,
    skeleton = false,
    label,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // Resolve color
  const resolvedColor = useMemo(
    () => resolveIconColor(color, theme),
    [color, theme],
  );

  // Skeleton loading state
  if (skeleton) {
    const skeletonStyle = getIconSkeletonStyle(size, theme);
    return (
      <span
        ref={ref}
        className={className}
        aria-hidden
        style={{ ...skeletonStyle, ...userStyle }}
        {...rest}
      />
    );
  }

  // Build container style
  const containerStyle = useMemo(() => buildIconStyle(size), [size, theme]);
  const mergedStyle = userStyle ? { ...containerStyle, ...userStyle } : containerStyle;

  // Icon pixel size
  const px = iconSizeMap[size];

  // Accessibility: if label is provided, use aria-label. Otherwise, decorative.
  const a11yProps = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };

  return (
    <span
      ref={ref}
      className={className}
      style={mergedStyle}
      {...a11yProps}
      {...rest}
    >
      <IconComponent
        size={px}
        color={resolvedColor}
        strokeWidth={strokeWidth}
      />
    </span>
  );
});

Icon.displayName = 'Icon';
