/**
 * @module layouts/separator
 * @description React Native Separator layout primitive for the Wisp design system.
 *
 * Renders a horizontal or vertical dividing line to visually separate content.
 * Key differences from the React DOM version:
 *
 * - Uses `<View>` with `borderBottomWidth` / `borderRightWidth` instead of `<div>`.
 * - No `label` prop (centered-label dividers are complex in RN; omitted for v1).
 * - No `className` prop (RN uses `style` arrays).
 * - No `thickness` token import -- uses a simple numeric default.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Separator orientation. */
export type SeparatorOrientation = 'horizontal' | 'vertical';

/** Color variant. */
export type SeparatorVariant = 'subtle' | 'strong';

/** Spacing preset around the separator. */
export type SeparatorSpacing = 'none' | 'sm' | 'md' | 'lg';

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------

const spacingMap: Record<SeparatorSpacing, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SeparatorProps extends Omit<ViewProps, 'style'> {
  /** Line orientation. @default 'horizontal' */
  orientation?: SeparatorOrientation;
  /** Color variant. @default 'subtle' */
  variant?: SeparatorVariant;
  /** Spacing around the separator. @default 'md' */
  spacing?: SeparatorSpacing;
  /** Inline style overrides merged onto the root View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Separator -- Horizontal or vertical divider line.
 *
 * @remarks
 * Renders a thin `View` with a themed border color. Supports two
 * color variants (`subtle` and `strong`) and configurable spacing
 * around the line.
 */
export const Separator = forwardRef<View, SeparatorProps>(function Separator(
  {
    orientation = 'horizontal',
    variant = 'subtle',
    spacing = 'md',
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const lineColor = useMemo(
    () => (variant === 'strong' ? themeColors.border.strong : themeColors.border.subtle),
    [variant, themeColors],
  );

  const spacingValue = spacingMap[spacing];

  const separatorStyle = useMemo<ViewStyle>(() => {
    if (orientation === 'vertical') {
      return {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: lineColor,
        marginHorizontal: spacingValue,
      };
    }

    return {
      height: 1,
      alignSelf: 'stretch',
      backgroundColor: lineColor,
      marginVertical: spacingValue,
    };
  }, [orientation, lineColor, spacingValue]);

  return (
    <View
      ref={ref}
      accessibilityRole="none"
      style={[separatorStyle, userStyle]}
      {...rest}
    />
  );
});

Separator.displayName = 'Separator';
