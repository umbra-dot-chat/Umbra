/**
 * @module primitives/icon
 * @description React Native Icon primitive for the Wisp design system.
 *
 * Reuses icon size maps and semantic color resolution from `@coexist/wisp-core`.
 * Key differences from the React DOM version:
 *
 * - Uses `<View>` instead of `<span>`.
 * - Accessibility via `accessibilityLabel` / `accessibilityRole` instead of
 *   `aria-label` / `role`.
 * - No `className`, `style` (CSSProperties), or skeleton animation
 *   (no CSS keyframes in RN).
 * - No `currentColor` — must resolve an explicit color from the theme.
 */

import React, { forwardRef, useMemo } from 'react';
import { View } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import type { ComponentSize, SemanticColor } from '@coexist/wisp-core/tokens/shared';
import { iconSizeMap } from '@coexist/wisp-core/types/Icon.types';
import { resolveIconColor } from '@coexist/wisp-core/styles/Icon.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IconProps extends Omit<ViewProps, 'children'> {
  /**
   * The icon component to render.
   * Pass the component itself — NOT a JSX element.
   *
   * @example
   * ```tsx
   * import { Search } from 'lucide-react-native';
   * <Icon icon={Search} />
   * ```
   */
  icon: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;

  /** Icon size preset. @default 'md' */
  size?: ComponentSize;

  /**
   * Semantic color variant or raw hex string.
   * Resolved through the active theme.
   * @default 'primary'
   */
  color?: SemanticColor | (string & {});

  /** Stroke width passed to the icon component. @default 2 */
  strokeWidth?: number;

  /** Accessible label. When set, the icon is announced by screen readers. */
  label?: string;

  /** Optional style override for the wrapper View. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Icon — Icon primitive for the Wisp design system (React Native).
 *
 * @remarks
 * Wraps an icon component with semantic sizing, monochrome color variants,
 * and accessibility support via `accessibilityLabel`.
 *
 * @example
 * ```tsx
 * import { Search, AlertCircle } from 'lucide-react-native';
 *
 * <Icon icon={Search} />
 * <Icon icon={AlertCircle} size="lg" color="error" />
 * ```
 */
export const Icon = forwardRef<View, IconProps>(function Icon(
  {
    icon: IconComponent,
    size = 'md',
    color = 'primary',
    strokeWidth = 2,
    label,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  // Resolve semantic or raw color through the theme
  const resolvedColor = useMemo(
    () => resolveIconColor(color, theme),
    [color, themeColors],
  );

  // Icon pixel size from the shared size map
  const px = iconSizeMap[size];

  // Build container style
  const containerStyle = useMemo<ViewStyle>(() => ({
    width: px,
    height: px,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }), [px]);

  // Accessibility: if label is provided, announce as image; otherwise decorative
  const a11yProps = label
    ? { accessibilityRole: 'image' as const, accessibilityLabel: label }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no' as const };

  return (
    <View
      ref={ref}
      style={[containerStyle, userStyle]}
      {...a11yProps}
      {...rest}
    >
      <IconComponent
        size={px}
        color={resolvedColor}
        strokeWidth={strokeWidth}
      />
    </View>
  );
});

Icon.displayName = 'Icon';
