/**
 * @module primitives/kbd
 * @description React Native Kbd primitive for the Wisp design system.
 *
 * Reuses size maps from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<View>` + `<Text>` instead of `<kbd>`.
 * - Keycap shadow via RN `shadowColor`/`shadowOffset` instead of CSS `boxShadow`.
 * - No `className` prop.
 * - No CSS `boxSizing`, `whiteSpace`, or `userSelect`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { KbdSize } from '@coexist/wisp-core/types/Kbd.types';
import { kbdSizeMap } from '@coexist/wisp-core/types/Kbd.types';
import { defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface KbdProps extends ViewProps {
  /** The key or key combination to display. */
  children: React.ReactNode;
  /** Size variant. @default 'md' */
  size?: KbdSize;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Kbd -- Keyboard shortcut display primitive for the Wisp design system (React Native).
 *
 * @remarks
 * Renders a styled `<View>` + `<Text>` that visually represents a keyboard key
 * or key combination. Supports three sizes (`sm`, `md`, `lg`) and adapts to
 * the active theme. A subtle keycap shadow gives the element a physical
 * key appearance.
 *
 * @example
 * ```tsx
 * <Kbd>Esc</Kbd>
 * <Kbd size="sm">Esc</Kbd>
 * ```
 */
export const Kbd = forwardRef<View, KbdProps>(function Kbd(
  {
    children,
    size = 'md',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = kbdSizeMap[size];

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    paddingHorizontal: sizeConfig.paddingX,
    paddingVertical: sizeConfig.paddingY,
    minWidth: sizeConfig.minWidth,
    borderRadius: sizeConfig.borderRadius,
    backgroundColor: themeColors.background.raised,
    borderWidth: 1,
    borderColor: themeColors.accent.dividerRaised,
    // Keycap shadow -- subtle 1px bottom shadow for depth
    shadowColor: themeColors.accent.dividerRaised,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  }), [sizeConfig, themeColors]);

  const textStyle = useMemo<TextStyle>(() => ({
    fontFamily: 'monospace',
    fontSize: sizeConfig.fontSize,
    lineHeight: sizeConfig.fontSize,
    fontWeight: defaultTypography.weights.medium,
    textAlign: 'center',
    color: themeColors.text.onRaisedSecondary,
  }), [sizeConfig, themeColors]);

  return (
    <View ref={ref} style={[containerStyle, userStyle]} {...rest}>
      <Text style={textStyle}>{children}</Text>
    </View>
  );
});

Kbd.displayName = 'Kbd';
