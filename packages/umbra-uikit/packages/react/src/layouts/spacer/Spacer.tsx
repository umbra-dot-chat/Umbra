import React, { forwardRef, useMemo } from 'react';
import type { SpacerProps } from '@coexist/wisp-core/types/Spacer.types';
import { buildSpacerStyle } from '@coexist/wisp-core/styles/Spacer.styles';
import { useTheme } from '../../providers';

/**
 * Spacer -- Creates deliberate whitespace in a layout.
 *
 * @remarks
 * Key features:
 * - Fixed spacing via {@link SpacerProps.size | size}, mapped to theme spacing tokens.
 * - Flexible spacing via {@link SpacerProps.flex | flex} to push siblings apart.
 * - Renders `aria-hidden="true"` so it is invisible to the accessibility tree.
 * - User-supplied `style` is shallowly merged and takes precedence.
 *
 * When both `size` and `flex` are provided, `flex` takes precedence.
 *
 * @module primitives/spacer
 *
 * @example
 * ```tsx
 * // Fixed spacer using a theme token
 * <HStack>
 *   <Text>Left</Text>
 *   <Spacer size="lg" />
 *   <Text>Right</Text>
 * </HStack>
 *
 * // Flexible spacer -- pushes items to opposite ends
 * <HStack>
 *   <Text>Left</Text>
 *   <Spacer flex />
 *   <Text>Right</Text>
 * </HStack>
 * ```
 */
export const Spacer = forwardRef<HTMLDivElement, SpacerProps>(function Spacer(
  { size, flex = false, style: userStyle, ...rest },
  ref,
) {
  const { theme } = useTheme();

  const spacerStyle = useMemo(
    () => buildSpacerStyle({ size, flex, spacing: theme.spacing }),
    [size, flex, theme.spacing],
  );

  const mergedStyle = useMemo(
    () => ({ ...spacerStyle, ...userStyle }),
    [spacerStyle, userStyle],
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={mergedStyle}
      {...rest}
    />
  );
});

Spacer.displayName = 'Spacer';
