/**
 * @module layouts/card
 * @description React Native Card layout primitive for the Wisp design system.
 *
 * A surface container for grouping related content with visual variants.
 * Key differences from the React DOM version:
 *
 * - Uses `<Pressable>` for interactive cards, `<View>` for static cards.
 * - No `glass` variant (requires `backdrop-filter`, unavailable in RN).
 * - Shadow via iOS `shadow*` props + Android `elevation` instead of `box-shadow`.
 * - No `className`, `skeleton`, or polymorphic `as` prop.
 * - No CSS transitions -- pressed state is immediate via `Pressable` callback.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import type { ViewProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Available card visual variant options (no glass in RN). */
export type CardVariant = 'elevated' | 'outlined' | 'filled';

/** Available card padding presets. */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/** Available card border-radius presets. */
export type CardRadius = 'none' | 'sm' | 'md' | 'lg';

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------

/** Maps each CardPadding to its pixel value. */
const cardPaddingMap: Record<CardPadding, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 24,
};

/** Maps each CardRadius to its pixel value. */
const cardRadiusMap: Record<CardRadius, number> = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CardProps extends Omit<ViewProps, 'style'> {
  /** Content rendered inside the card. */
  children?: React.ReactNode;
  /** Visual style variant. @default 'elevated' */
  variant?: CardVariant;
  /** Inner padding preset. @default 'md' */
  padding?: CardPadding;
  /** Border-radius preset. @default 'md' */
  radius?: CardRadius;
  /** Press handler -- when provided the card renders as a Pressable. */
  onPress?: () => void;
  /** Reduces opacity and prevents press events. @default false */
  disabled?: boolean;
  /** Inline style overrides merged onto the root element. */
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Card -- A surface container for grouping related content.
 *
 * @remarks
 * Three visual variants:
 * - `elevated` -- subtle shadow and surface background.
 * - `outlined` -- transparent background with a visible border.
 * - `filled` -- solid surface background, no border.
 *
 * When an `onPress` handler is provided the card renders as a `Pressable`
 * with a subtle pressed-state background change.
 */
export const Card = forwardRef<View, CardProps>(function Card(
  {
    children,
    variant = 'elevated',
    padding = 'md',
    radius = 'md',
    onPress,
    disabled = false,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const isInteractive = !!onPress;

  const paddingValue = cardPaddingMap[padding];
  const radiusValue = cardRadiusMap[radius];

  const variantStyles = useMemo(() => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: themeColors.background.surface,
          borderWidth: 1,
          borderColor: themeColors.border.subtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: themeColors.border.strong,
        };
      case 'filled':
        return {
          backgroundColor: themeColors.background.surface,
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: themeColors.background.surface,
          borderWidth: 1,
          borderColor: themeColors.border.subtle,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        };
    }
  }, [variant, themeColors]);

  // overflow: 'hidden' ensures borderRadius clips content on React Native iOS.
  // Only applied to non-elevated variants since it would clip iOS shadows.
  const needsOverflowClip = variant !== 'elevated' && radiusValue > 0;

  const baseStyle = useMemo<ViewStyle>(() => ({
    padding: paddingValue,
    borderRadius: radiusValue,
    ...(needsOverflowClip ? { overflow: 'hidden' as const } : {}),
    opacity: disabled ? 0.5 : 1,
    ...variantStyles,
  }), [paddingValue, radiusValue, needsOverflowClip, disabled, variantStyles]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  if (isInteractive) {
    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          baseStyle,
          pressed && !disabled
            ? { backgroundColor: themeColors.background.raised }
            : undefined,
          userStyle,
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View ref={ref} style={[baseStyle, userStyle]} {...rest}>
      {children}
    </View>
  );
});

Card.displayName = 'Card';
