/**
 * @module primitives/text
 * @description React Native Text primitive for the Wisp design system.
 *
 * Reuses color resolution and size maps from `@coexist/wisp-core` while rendering
 * through RN's `<Text>` component. Key differences from the React DOM version:
 *
 * - `numberOfLines` replaces CSS `text-overflow` / `-webkit-line-clamp`.
 * - No polymorphic `as` prop (RN has a single `<Text>` element).
 * - No `className` prop (RN uses `style` arrays).
 * - Icon slots use `<View>` wrappers instead of `<span>`.
 */

import React, { forwardRef, useMemo } from 'react';
import { Text as RNText, View } from 'react-native';
import type { TextProps as RNTextProps, TextStyle, ViewStyle } from 'react-native';
import type {
  TextSize,
  SemanticColor,
  FontWeightKey,
  FontFamilyKey,
} from '@coexist/wisp-core/tokens/shared';
import type { TextAlign } from '@coexist/wisp-core/types/Text.types';
import { resolveTextColor } from '@coexist/wisp-core/styles/Text.styles';
import { sizeMap } from '@coexist/wisp-core/styles/Text.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TextProps extends Omit<RNTextProps, 'children'> {
  children?: React.ReactNode;
  size?: TextSize;
  weight?: FontWeightKey;
  color?: SemanticColor | (string & {});
  align?: TextAlign;
  family?: FontFamilyKey;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  truncate?: boolean;
  maxLines?: number;
}

// ---------------------------------------------------------------------------
// Font weight mapping
// ---------------------------------------------------------------------------

const RN_FONT_WEIGHTS: Record<FontWeightKey, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Text = forwardRef<RNText, TextProps>(function Text(
  {
    children,
    size = 'md',
    weight = 'regular',
    color = 'primary',
    align,
    family = 'sans',
    iconLeft,
    iconRight,
    truncate,
    maxLines,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;

  const resolvedColor = useMemo(
    () => resolveTextColor(color, theme),
    [color, themeColors],
  );

  const config = sizeMap[size];
  const hasIcons = !!(iconLeft || iconRight);

  const textStyle = useMemo<TextStyle>(() => {
    const s: TextStyle = {
      fontSize: config.fontSize,
      lineHeight: config.lineHeight,
      fontWeight: RN_FONT_WEIGHTS[weight],
      color: resolvedColor,
    };

    if (align) {
      s.textAlign = align as TextStyle['textAlign'];
    }

    return s;
  }, [config, weight, resolvedColor, align]);

  // Compute numberOfLines from truncate / maxLines
  const numberOfLines = truncate ? 1 : maxLines || undefined;

  if (hasIcons) {
    const iconStyle: ViewStyle = {
      width: config.iconSize,
      height: config.iconSize,
      justifyContent: 'center',
      alignItems: 'center',
    };

    const rowStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: config.iconGap,
    };

    return (
      <View style={rowStyle}>
        {iconLeft && (
          <View style={iconStyle} accessibilityElementsHidden>
            {iconLeft}
          </View>
        )}
        <RNText
          ref={ref}
          style={[textStyle, userStyle]}
          numberOfLines={numberOfLines}
          {...rest}
        >
          {children}
        </RNText>
        {iconRight && (
          <View style={iconStyle} accessibilityElementsHidden>
            {iconRight}
          </View>
        )}
      </View>
    );
  }

  return (
    <RNText
      ref={ref}
      style={[textStyle, userStyle]}
      numberOfLines={numberOfLines}
      {...rest}
    >
      {children}
    </RNText>
  );
});

Text.displayName = 'Text';
