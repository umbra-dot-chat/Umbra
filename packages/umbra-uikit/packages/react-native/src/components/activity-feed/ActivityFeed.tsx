import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Image } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

const sizeMap = {
  sm: { avatarSize: 28, primaryFontSize: 13, secondaryFontSize: 12, gap: defaultSpacing.md, lineWidth: 2 },
  md: { avatarSize: 36, primaryFontSize: 14, secondaryFontSize: 13, gap: defaultSpacing.md, lineWidth: 2 },
} as const;

type ActivityFeedSize = keyof typeof sizeMap;

export interface ActivityFeedItem {
  id: string;
  content: React.ReactNode;
  timestamp: string;
  avatarUrl?: string;
  avatarInitials?: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  iconColor?: string;
}

export interface ActivityFeedProps {
  items: ActivityFeedItem[];
  size?: ActivityFeedSize;
  showConnector?: boolean;
  style?: ViewStyle;
}

export const ActivityFeed = forwardRef<View, ActivityFeedProps>(function ActivityFeed(
  { items, size = 'md', showConnector = true, style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const cfg = sizeMap[size];

  return (
    <View ref={ref} accessibilityRole="none" style={userStyle}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const Icon = item.icon;

        const avatarStyle: ViewStyle = {
          width: cfg.avatarSize,
          height: cfg.avatarSize,
          borderRadius: cfg.avatarSize / 2,
          backgroundColor: themeColors.background.surface,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        };

        return (
          <View key={item.id} accessibilityRole="none" style={{ flexDirection: 'row', gap: cfg.gap }}>
            <View style={{ alignItems: 'center', position: 'relative' }}>
              <View style={avatarStyle}>
                {item.avatarUrl ? (
                  <Image source={{ uri: item.avatarUrl }} style={{ width: cfg.avatarSize, height: cfg.avatarSize, borderRadius: cfg.avatarSize / 2 }} />
                ) : Icon ? (
                  <Icon size={cfg.avatarSize * 0.5} color={item.iconColor ?? themeColors.text.secondary} strokeWidth={2} />
                ) : item.avatarInitials ? (
                  <RNText style={{ fontSize: cfg.avatarSize * 0.4, fontWeight: defaultTypography.weights.semibold, color: themeColors.text.primary } as TextStyle}>
                    {item.avatarInitials}
                  </RNText>
                ) : null}
              </View>
              {showConnector && !isLast && (
                <View
                  style={{
                    position: 'absolute',
                    top: cfg.avatarSize,
                    left: (cfg.avatarSize - cfg.lineWidth) / 2,
                    bottom: 0,
                    width: cfg.lineWidth,
                    backgroundColor: themeColors.border.subtle,
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : cfg.gap, gap: defaultSpacing['2xs'] }}>
              <RNText style={{ fontSize: cfg.primaryFontSize, color: themeColors.text.primary } as TextStyle}>
                {item.content}
              </RNText>
              <RNText style={{ fontSize: cfg.secondaryFontSize, color: themeColors.text.muted } as TextStyle}>
                {item.timestamp}
              </RNText>
            </View>
          </View>
        );
      })}
    </View>
  );
});

ActivityFeed.displayName = 'ActivityFeed';
