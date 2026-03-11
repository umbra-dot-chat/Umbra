/**
 * @module Text
 */
import React, { forwardRef, useMemo } from 'react';
import type { TextProps } from '@coexist/wisp-core/types/Text.types';
import { buildTextStyle, resolveTextColor, getSkeletonStyle, getIconStyle } from '@coexist/wisp-core/styles/Text.styles';
import { useTheme } from '../../providers';

/**
 * Text -- Typography primitive for the Wisp design system.
 *
 * @remarks
 * Renders text with semantic sizing (11 steps from `xs` to `display-2xl`),
 * five font weights, monochrome and status color variants, left/right icon
 * slots, single-line truncation, multi-line clamping, and a skeleton shimmer
 * loading state.
 *
 * The component is polymorphic: the rendered HTML element defaults to `<span>`
 * but can be changed via the `as` prop to any of the supported
 * {@link TextElement} tags (`p`, `h1`--`h6`, `label`, `div`, etc.).
 *
 * Color resolution is theme-aware -- passing a {@link SemanticColor} variant
 * (e.g. `'primary'`, `'error'`) maps to the current theme palette, while a
 * raw CSS color string is forwarded as-is.
 *
 * @example
 * ```tsx
 * // Basic body text
 * <Text size="md" weight="medium">Body text</Text>
 *
 * // Heading rendered as h2
 * <Text size="display-sm" weight="semibold" as="h2">Heading</Text>
 *
 * // Status color
 * <Text color="error" size="sm">Something went wrong</Text>
 *
 * // With icon slots
 * <Text size="md" iconLeft={<Icon icon={Info} size="sm" />}>Help text</Text>
 *
 * // Truncation
 * <Text size="md" truncate>Very long text that will be clipped...</Text>
 *
 * // Skeleton placeholder
 * <Text skeleton size="md" />
 * ```
 */
export const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    children,
    size = 'md',
    weight = 'regular',
    color = 'primary',
    align,
    family = 'sans',
    iconLeft,
    iconRight,
    truncate,
    maxLines,
    skeleton = false,
    as: Component = 'span',
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // Resolve semantic color variant to actual hex
  const resolvedColor = useMemo(
    () => resolveTextColor(color, theme),
    [color, theme],
  );

  // Skeleton loading state
  if (skeleton) {
    const skeletonStyle = getSkeletonStyle(size, theme);
    return React.createElement(Component, {
      ref,
      className,
      'aria-hidden': true,
      style: { ...skeletonStyle, ...userStyle },
      ...rest,
    });
  }

  const hasIcons = !!(iconLeft || iconRight);

  // Build computed style
  const computedStyle = useMemo(
    () =>
      buildTextStyle({
        size,
        weight,
        family,
        color: resolvedColor,
        align,
        truncate,
        maxLines,
        hasIcons,
      }),
    [size, weight, family, resolvedColor, align, truncate, maxLines, hasIcons],
  );

  // Merge: computed first, user style wins
  const mergedStyle = userStyle ? { ...computedStyle, ...userStyle } : computedStyle;

  // Build children with optional icon wrappers
  const iconLeftStyle = iconLeft ? getIconStyle(size) : undefined;
  const iconRightStyle = iconRight ? getIconStyle(size) : undefined;

  const content = hasIcons ? (
    <>
      {iconLeft && <span style={iconLeftStyle} aria-hidden="true">{iconLeft}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span style={iconRightStyle} aria-hidden="true">{iconRight}</span>}
    </>
  ) : (
    children
  );

  return React.createElement(
    Component,
    {
      ref,
      className,
      style: mergedStyle,
      ...rest,
    },
    content,
  );
});

Text.displayName = 'Text';
