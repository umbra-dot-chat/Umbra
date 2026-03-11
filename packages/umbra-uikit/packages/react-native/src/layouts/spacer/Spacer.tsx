/**
 * @module layouts/spacer
 * @description React Native Spacer layout primitive for the Wisp design system.
 *
 * Creates deliberate whitespace in a layout using an empty `View`.
 * Key differences from the React DOM version:
 *
 * - Always renders a `<View>` (no `<div>`).
 * - No `className` prop (RN uses `style` arrays).
 * - Spacing tokens resolved locally rather than from `defaultSpacing`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Spacing token key for the Spacer size prop. */
export type SpacerSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

// ---------------------------------------------------------------------------
// Spacing map
// ---------------------------------------------------------------------------

const spacingMap: Record<SpacerSize, number> = {
  '2xs': 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpacerProps extends Omit<ViewProps, 'style' | 'children'> {
  /** Fixed spacing size using a token key. */
  size?: SpacerSize;
  /** Flexible spacing -- `true` sets `flex: 1`, or pass a number. */
  flex?: boolean | number;
  /** Inline style overrides merged onto the root View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Spacer -- Creates deliberate whitespace in a layout.
 *
 * @remarks
 * - Fixed spacing via `size`, mapped to theme spacing tokens.
 * - Flexible spacing via `flex` to push siblings apart.
 * - When both `size` and `flex` are provided, `flex` takes precedence.
 * - Renders with no accessible content (purely decorative).
 */
export const Spacer = forwardRef<View, SpacerProps>(function Spacer(
  { size, flex = false, style: userStyle, ...rest },
  ref,
) {
  const spacerStyle = useMemo<ViewStyle>(() => {
    // Flex takes precedence over fixed size
    if (flex) {
      const flexValue = typeof flex === 'number' ? flex : 1;
      return { flex: flexValue };
    }

    if (size) {
      const pixels = spacingMap[size];
      return {
        width: pixels,
        height: pixels,
      };
    }

    // Default: no size, no flex -- renders as a zero-size view
    return {};
  }, [size, flex]);

  return (
    <View
      ref={ref}
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[spacerStyle, userStyle]}
      {...rest}
    />
  );
});

Spacer.displayName = 'Spacer';
