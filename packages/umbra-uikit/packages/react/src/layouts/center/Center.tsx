import React, { forwardRef, useMemo } from 'react';
import type { CenterProps } from '@coexist/wisp-core/types/Center.types';
import { buildCenterStyle } from '@coexist/wisp-core/styles/Center.styles';

/**
 * Center -- Layout primitive that centers its children both horizontally
 * and vertically using flexbox.
 *
 * @remarks
 * Key features:
 * - Uses `display: flex` with `align-items: center` and `justify-content: center`.
 * - Supports inline centering via the {@link CenterProps.inline | inline} prop.
 * - Polymorphic rendering via the {@link CenterProps.as | as} prop.
 * - User-supplied `style` is shallowly merged and takes precedence.
 *
 * @module primitives/center
 *
 * @example
 * ```tsx
 * <Center style={{ height: 200 }}>
 *   <Text>Centered content</Text>
 * </Center>
 *
 * <Center inline as="span">
 *   <Icon name="check" />
 * </Center>
 * ```
 */
export const Center = forwardRef<HTMLElement, CenterProps>(function Center(
  {
    children,
    inline = false,
    as: Component = 'div',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const centerStyle = useMemo(
    () => buildCenterStyle(inline),
    [inline],
  );

  const mergedStyle = useMemo(
    () => ({ ...centerStyle, ...userStyle }),
    [centerStyle, userStyle],
  );

  return (
    <Component ref={ref} style={mergedStyle} {...rest}>
      {children}
    </Component>
  );
});

Center.displayName = 'Center';
