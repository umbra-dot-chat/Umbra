import React, { forwardRef, useMemo } from 'react';
import type { ContainerProps } from '@coexist/wisp-core/types/Container.types';
import { buildContainerStyle } from '@coexist/wisp-core/styles/Container.styles';
import { useTheme } from '../../providers';

/**
 * Container -- Constrains content to a max-width and centers it horizontally.
 *
 * @remarks
 * Key features:
 * - Predefined size tiers aligned with breakpoint tokens (`sm` through `full`).
 * - Optional horizontal centering via auto margins ({@link ContainerProps.center | center}).
 * - Theme-aware horizontal padding via {@link ContainerProps.px | px}.
 * - Polymorphic rendering via the {@link ContainerProps.as | as} prop.
 * - User-supplied `style` is shallowly merged and takes precedence.
 *
 * @see {@link ContainerSize} for available size tiers.
 * @see {@link containerSizeMap} for the pixel values each size resolves to.
 *
 * @module primitives/container
 *
 * @example
 * ```tsx
 * <Container size="lg" px="lg">
 *   <h1>Page content</h1>
 *   <p>Constrained to 1024 px max-width with 16 px horizontal padding.</p>
 * </Container>
 *
 * <Container size="full" center={false}>
 *   Full-width, left-aligned container.
 * </Container>
 * ```
 */
export const Container = forwardRef<HTMLElement, ContainerProps>(function Container(
  {
    children,
    size = 'lg',
    center = true,
    px = 'lg',
    as: Component = 'div',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();

  const containerStyle = useMemo(
    () => buildContainerStyle({ size, center, px, spacing: theme.spacing }),
    [size, center, px, theme.spacing],
  );

  const mergedStyle = useMemo(
    () => ({ ...containerStyle, ...userStyle }),
    [containerStyle, userStyle],
  );

  return (
    <Component ref={ref} style={mergedStyle} {...rest}>
      {children}
    </Component>
  );
});

Container.displayName = 'Container';
