/**
 * @module primitives/container
 *
 * Style-building utilities for the {@link Container} layout primitive.
 */

import type { CSSStyleObject } from '../types';
import type { ThemeSpacing } from '../theme/types';
import type { ContainerSize } from '../types/Container.types';
import { containerSizeMap } from '../types/Container.types';

// ---------------------------------------------------------------------------
// Main style builder
// ---------------------------------------------------------------------------

/**
 * Build the inline styles for a {@link Container} element.
 *
 * @remarks
 * Resolves the {@link ContainerSize} to a `max-width` value via
 * {@link containerSizeMap}, applies horizontal padding from the theme
 * spacing scale, and optionally centres the container with auto margins.
 *
 * @param opts - Configuration containing the container props and the resolved theme spacing scale.
 * @param opts.size - The {@link ContainerSize} tier determining `max-width`.
 * @param opts.center - When `true`, applies `margin-left: auto; margin-right: auto`.
 * @param opts.px - Theme spacing key for horizontal padding.
 * @param opts.spacing - The resolved {@link ThemeSpacing} scale from the current theme.
 * @returns A `CSSStyleObject` object ready for the root element.
 */
export function buildContainerStyle(opts: {
  size: ContainerSize;
  center: boolean;
  px: keyof ThemeSpacing;
  spacing: ThemeSpacing;
}): CSSStyleObject {
  const { size, center, px, spacing } = opts;

  const maxWidthValue = containerSizeMap[size];
  const horizontalPadding = spacing[px];

  return {
    width: '100%',
    maxWidth: typeof maxWidthValue === 'number' ? maxWidthValue : maxWidthValue,
    ...(center && {
      marginLeft: 'auto',
      marginRight: 'auto',
    }),
    paddingLeft: horizontalPadding,
    paddingRight: horizontalPadding,
    boxSizing: 'border-box',
  };
}
