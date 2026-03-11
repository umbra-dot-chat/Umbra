/**
 * @module components/achievement-card
 * @description React Native AchievementCard for the Wisp design system.
 *
 * Card showing achievement with locked/in-progress/unlocked states and rarity tier.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { AchievementStatus, AchievementRarity } from '@coexist/wisp-core/types/AchievementCard.types';
import { achievementRarityMap } from '@coexist/wisp-core/types/AchievementCard.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AchievementCardProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  status?: AchievementStatus;
  progress?: number;
  rarity?: AchievementRarity;
  unlockedAt?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const AchievementCard = forwardRef<View, AchievementCardProps>(
  function AchievementCard(
    {
      title,
      description,
      icon: IconComponent,
      status = 'locked',
      progress = 0,
      rarity = 'common',
      unlockedAt,
      onPress,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const rarityConfig = achievementRarityMap[rarity];
    const isLocked = status === 'locked';
    const isUnlocked = status === 'unlocked';

    const containerStyle = useMemo<ViewStyle>(() => ({
      padding: defaultSpacing.lg,
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: isUnlocked ? rarityConfig.color + '40' : themeColors.border.subtle,
      backgroundColor: themeColors.background.surface,
      opacity: isLocked ? 0.6 : 1,
      width: '100%',
    }), [isLocked, isUnlocked, rarityConfig, themeColors]);

    const headerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.md,
    }), []);

    const iconContainerStyle = useMemo<ViewStyle>(() => ({
      width: 44,
      height: 44,
      borderRadius: defaultRadii.xl,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isUnlocked ? rarityConfig.color + '20' : themeColors.border.subtle,
    }), [isUnlocked, rarityConfig, themeColors]);

    const titleStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.base.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: themeColors.text.primary,
    }), [themeColors]);

    const descStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      color: themeColors.text.muted,
      marginTop: defaultSpacing['2xs'],
    }), [themeColors]);

    const rarityStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: rarityConfig.color,
      marginTop: defaultSpacing.xs,
    }), [rarityConfig]);

    const progressBarBg = useMemo<ViewStyle>(() => ({
      height: 4,
      borderRadius: defaultRadii.sm,
      backgroundColor: themeColors.border.subtle,
      marginTop: defaultSpacing.md,
      overflow: 'hidden',
    }), [themeColors]);

    const progressBarFill = useMemo<ViewStyle>(() => ({
      height: 4,
      borderRadius: defaultRadii.sm,
      backgroundColor: rarityConfig.color,
      width: `${Math.min(100, Math.max(0, progress))}%`,
    }), [progress, rarityConfig]);

    const unlockedAtStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      color: themeColors.text.muted,
      marginTop: defaultSpacing.sm,
    }), [themeColors]);

    const iconColor = isUnlocked ? rarityConfig.color : themeColors.text.muted;

    const content = (
      <>
        <View style={headerStyle}>
          <View style={iconContainerStyle}>
            {IconComponent ? (
              <IconComponent size={24} color={iconColor} strokeWidth={2} />
            ) : (
              <Text style={{ fontSize: defaultTypography.sizes.xl.fontSize }}>{isLocked ? '\u{1F512}' : '\u{1F3C6}'}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={titleStyle}>{title}</Text>
            {description && <Text style={descStyle}>{description}</Text>}
            <Text style={rarityStyle}>{rarityConfig.label}</Text>
          </View>
        </View>

        {status === 'in-progress' && (
          <View style={progressBarBg}>
            <View style={progressBarFill} />
          </View>
        )}

        {isUnlocked && unlockedAt && (
          <Text style={unlockedAtStyle}>Unlocked {unlockedAt}</Text>
        )}
      </>
    );

    if (onPress) {
      return (
        <Pressable ref={ref as any} onPress={onPress} style={[containerStyle, userStyle]}>
          {content}
        </Pressable>
      );
    }

    return (
      <View ref={ref} style={[containerStyle, userStyle]}>
        {content}
      </View>
    );
  },
);

AchievementCard.displayName = 'AchievementCard';
