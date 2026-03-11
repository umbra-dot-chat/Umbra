/**
 * @module primitives/notification-badge
 * @description React Native NotificationBadge primitive for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`.
 * Renders via View + Text with Animated pulse instead of CSS keyframes.
 */

import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { NotificationBadgeColor } from '@coexist/wisp-core/types/NotificationBadge.types';
import { resolveNotificationBadgeColors } from '@coexist/wisp-core/styles/NotificationBadge.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface NotificationBadgeProps extends ViewProps {
  /** Numeric count displayed inside the badge. */
  count?: number;
  /** Maximum number to display before showing `{max}+`. @default 99 */
  max?: number;
  /** When `true`, renders a small dot instead of a count. @default false */
  dot?: boolean;
  /** Semantic color variant. @default 'danger' */
  color?: NotificationBadgeColor;
  /** When `true`, hides the badge completely. @default false */
  invisible?: boolean;
  /** When `true`, applies a pulsing animation to draw attention. @default false */
  pulse?: boolean;
  /** Size variant. `'sm'` renders a compact badge (14px), `'md'` is default (20px). @default 'md' */
  size?: 'sm' | 'md';
  /** The element the badge is anchored to (typically an icon or avatar). */
  children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Size constants
// ---------------------------------------------------------------------------

const BADGE_SIZES = {
  sm: { minWidth: 16, height: 16, paddingH: 4, dotSize: 6, fontSize: 9, lineHeight: 12, translateOffset: 5 },
  md: { minWidth: 20, height: 20, paddingH: defaultSpacing.sm, dotSize: 8, fontSize: defaultTypography.sizes.xs.fontSize, lineHeight: 14, translateOffset: 6 },
} as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const NotificationBadge = forwardRef<View, NotificationBadgeProps>(
  function NotificationBadge(
    {
      count,
      max = 99,
      dot = false,
      color = 'danger',
      invisible = false,
      pulse = false,
      size = 'md',
      children,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const colors = useMemo(
      () => resolveNotificationBadgeColors(color, theme),
      [color, themeColors],
    );

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const popAnim = useRef(new Animated.Value(1)).current;
    const prevCountRef = useRef(count);

    // Spring pop when count changes
    useEffect(() => {
      if (prevCountRef.current !== count && count !== undefined && count > 0) {
        popAnim.setValue(1.3);
        Animated.spring(popAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }).start();
      }
      prevCountRef.current = count;
    }, [count, popAnim]);

    useEffect(() => {
      if (pulse) {
        const animation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.15,
              duration: 750,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 750,
              useNativeDriver: true,
            }),
          ]),
        );
        animation.start();
        return () => animation.stop();
      } else {
        pulseAnim.setValue(1);
      }
    }, [pulse, pulseAnim]);

    const showBadge = !invisible && (dot || (count !== undefined && count > 0));
    const displayText = dot
      ? null
      : count !== undefined && count > max
        ? `${max}+`
        : count !== undefined
          ? String(count)
          : null;

    const sizeConfig = BADGE_SIZES[size];

    const wrapperStyle = useMemo<ViewStyle>(() => ({
      position: 'relative',
      alignSelf: 'center',
    }), []);

    const badgeStyle = useMemo<ViewStyle>(() => {
      const base: ViewStyle = {
        position: 'absolute',
        top: 0,
        right: 0,
        transform: [{ translateX: sizeConfig.translateOffset }, { translateY: -sizeConfig.translateOffset }],
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg,
        borderRadius: defaultRadii.full,
        overflow: 'hidden' as const,
        zIndex: 1,
      };

      if (dot) {
        return { ...base, width: sizeConfig.dotSize, height: sizeConfig.dotSize, minWidth: sizeConfig.dotSize };
      }

      return { ...base, minWidth: sizeConfig.minWidth, height: sizeConfig.height, paddingHorizontal: sizeConfig.paddingH };
    }, [colors, dot, sizeConfig]);

    const textStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: colors.text,
      lineHeight: sizeConfig.lineHeight,
      textAlign: 'center',
    }), [colors, sizeConfig]);

    const renderBadge = () => {
      if (!showBadge) return null;

      const badgeContent = displayText ? <Text style={textStyle}>{displayText}</Text> : null;

      if (pulse) {
        return (
          <Animated.View
            style={[badgeStyle, { transform: [{ scale: Animated.multiply(pulseAnim, popAnim) }] }]}
            pointerEvents="none"
          >
            {badgeContent}
          </Animated.View>
        );
      }

      return (
        <Animated.View style={[badgeStyle, { transform: [{ scale: popAnim }] }]} pointerEvents="none">
          {badgeContent}
        </Animated.View>
      );
    };

    return (
      <View ref={ref} style={[wrapperStyle, userStyle]} {...rest}>
        {children}
        {renderBadge()}
      </View>
    );
  },
);

NotificationBadge.displayName = 'NotificationBadge';
