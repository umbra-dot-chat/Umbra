/**
 * @module components/achievement-unlock
 * @description React Native AchievementUnlock for the Wisp design system.
 *
 * Animated slide-in notification for achievement unlock events.
 * Auto-dismisses after a configurable duration.
 */

import React, { forwardRef, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { AchievementRarity } from '@coexist/wisp-core/types/AchievementCard.types';
import { achievementRarityMap } from '@coexist/wisp-core/types/AchievementCard.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { zIndex } from '@coexist/wisp-core/tokens/z-index';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AchievementUnlockProps {
  open: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  rarity?: AchievementRarity;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AchievementUnlock = forwardRef<View, AchievementUnlockProps>(
  function AchievementUnlock(
    {
      open,
      onClose,
      title,
      description,
      icon: IconComponent,
      rarity = 'common',
      duration = 5000,
      actionLabel,
      onAction,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const rarityConfig = achievementRarityMap[rarity];
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (open) {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 80,
            friction: 12,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        if (duration > 0) {
          const timer = setTimeout(() => onClose?.(), duration);
          return () => clearTimeout(timer);
        }
      } else {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [open, duration, onClose, slideAnim, opacityAnim]);

    const containerStyle = useMemo<ViewStyle>(() => ({
      position: 'absolute',
      top: 60,
      left: 16,
      right: 16,
      padding: defaultSpacing.lg,
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: rarityConfig.color + '40',
      backgroundColor: themeColors.background.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.md,
      zIndex: zIndex.toast,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    }), [rarityConfig, themeColors]);

    const iconContainerStyle = useMemo<ViewStyle>(() => ({
      width: 44,
      height: 44,
      borderRadius: defaultRadii.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: rarityConfig.color + '20',
    }), [rarityConfig]);

    const titleStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: themeColors.text.primary,
    }), [themeColors]);

    const descStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
      marginTop: defaultSpacing['2xs'],
    }), [themeColors]);

    const unlockLabel = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: defaultTypography.weights.bold,
      color: rarityConfig.color,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    }), [rarityConfig]);

    const actionStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: themeColors.accent.primary,
    }), [themeColors]);

    if (!open) return null;

    return (
      <Animated.View
        ref={ref as any}
        style={[
          containerStyle,
          {
            transform: [{ translateY: slideAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={iconContainerStyle}>
          {IconComponent ? (
            <IconComponent size={24} color={rarityConfig.color} strokeWidth={2} />
          ) : (
            <Text style={{ fontSize: defaultTypography.sizes.xl.fontSize }}>{'\u{1F3C6}'}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={unlockLabel}>Achievement Unlocked!</Text>
          <Text style={titleStyle}>{title}</Text>
          {description && <Text style={descStyle}>{description}</Text>}
        </View>

        {actionLabel && onAction ? (
          <Pressable onPress={onAction}>
            <Text style={actionStyle}>{actionLabel}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: defaultTypography.sizes.base.fontSize, color: themeColors.text.muted }}>{'\u{2715}'}</Text>
          </Pressable>
        )}
      </Animated.View>
    );
  },
);

AchievementUnlock.displayName = 'AchievementUnlock';
