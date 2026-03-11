/**
 * @module layouts/center
 * @description React Native Center layout primitive for the Wisp design system.
 *
 * Centers its children both horizontally and vertically using flexbox.
 * Key differences from the React DOM version:
 *
 * - Always renders a `<View>` (no polymorphic `as` prop).
 * - No `inline` prop (no inline-flex concept in RN).
 * - No `className` prop (RN uses `style` arrays).
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CenterProps extends Omit<ViewProps, 'style'> {
  /** Content rendered inside the center container. */
  children?: React.ReactNode;
  /** Inline style overrides merged onto the root View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Center -- Layout primitive that centers its children both horizontally
 * and vertically using flexbox.
 *
 * @remarks
 * Uses `justifyContent: 'center'` and `alignItems: 'center'` to center
 * all children. Commonly used for hero sections, empty states, or icon
 * containers.
 */
export const Center = forwardRef<View, CenterProps>(function Center(
  {
    children,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const centerStyle = useMemo<ViewStyle>(() => ({
    justifyContent: 'center',
    alignItems: 'center',
  }), []);

  return (
    <View ref={ref} style={[centerStyle, userStyle]} {...rest}>
      {children}
    </View>
  );
});

Center.displayName = 'Center';
