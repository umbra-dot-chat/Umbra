import React, { forwardRef, useMemo } from 'react';
import type { BoxProps } from '@coexist/wisp-core/types/Box.types';
import { buildBoxStyle } from '@coexist/wisp-core/styles/Box.styles';
import { useTheme } from '../../providers';

/**
 * Box -- The foundational layout primitive for the Wisp design system.
 *
 * @remarks
 * A polymorphic container that provides theme-aware spacing (padding),
 * border-radius, display, position, and sizing through dedicated props
 * instead of inline styles.
 *
 * Key features:
 * - Polymorphic rendering via the {@link BoxProps.as | as} prop.
 * - Theme-aware padding using spacing tokens (`p`, `px`, `py`, `pt`, `pr`, `pb`, `pl`).
 * - CSS display, position, and sizing props for common layout tasks.
 * - Border radius mapped to theme radii tokens.
 * - User-supplied `style` is shallowly merged and takes precedence.
 *
 * **Padding resolution order:** specific \> axis \> shorthand
 * (`pt` overrides `py` which overrides `p`).
 *
 * @module primitives/box
 *
 * @example
 * ```tsx
 * <Box p="lg" radius="md">
 *   Content with 16 px padding and 8 px border-radius
 * </Box>
 *
 * <Box px="xl" py="md" display="flex" as="section">
 *   Flex section with asymmetric padding
 * </Box>
 * ```
 */
export const Box = forwardRef<HTMLElement, BoxProps>(function Box(
  {
    children,
    as: Component = 'div',
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    display,
    position,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    radius,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();

  const computedStyle = useMemo(
    () =>
      buildBoxStyle({
        spacing: theme.spacing,
        radii: theme.radii,
        p,
        px,
        py,
        pt,
        pr,
        pb,
        pl,
        display,
        position,
        width,
        height,
        minWidth,
        maxWidth,
        minHeight,
        maxHeight,
        radius,
      }),
    [
      theme.spacing,
      theme.radii,
      p,
      px,
      py,
      pt,
      pr,
      pb,
      pl,
      display,
      position,
      width,
      height,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      radius,
    ],
  );

  // Merge: computed first, user style wins
  const mergedStyle = userStyle ? { ...computedStyle, ...userStyle } : computedStyle;

  return React.createElement(
    Component,
    {
      ref,
      style: mergedStyle,
      ...rest,
    },
    children,
  );
});

Box.displayName = 'Box';
