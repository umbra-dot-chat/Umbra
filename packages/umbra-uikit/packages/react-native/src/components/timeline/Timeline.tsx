import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

const sizeMap = {
  sm: { dotSize: 10, lineWidth: 2, fontSize: defaultTypography.sizes.sm.fontSize, secondaryFontSize: 11, gap: defaultSpacing.md, contentGap: 4 },
  md: { dotSize: 12, lineWidth: 2, fontSize: defaultTypography.sizes.sm.fontSize, secondaryFontSize: 12, gap: defaultSpacing.lg, contentGap: 6 },
  lg: { dotSize: 16, lineWidth: 2, fontSize: defaultTypography.sizes.base.fontSize, secondaryFontSize: 13, gap: defaultSpacing.xl, contentGap: 8 },
} as const;

type TimelineSize = keyof typeof sizeMap;
type TimelineStatus = 'completed' | 'active' | 'pending';

export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  timestamp?: string;
  icon?: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  color?: string;
  status?: TimelineStatus;
}

export interface TimelineProps {
  items: TimelineItem[];
  size?: TimelineSize;
  style?: ViewStyle;
}

export const Timeline = forwardRef<View, TimelineProps>(function Timeline(
  { items, size = 'md', style: userStyle },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const cfg = sizeMap[size];

  return (
    <View ref={ref} style={userStyle}>
      {items.map((item, i) => {
        const status = item.status ?? 'completed';
        const isLast = i === items.length - 1;
        const dotColor = item.color ?? (
          status === 'completed' ? themeColors.accent.primary :
          status === 'active' ? themeColors.accent.primary :
          themeColors.text.muted
        );
        const Icon = item.icon;
        const showIcon = Icon && cfg.dotSize >= 16;

        const dotStyle: ViewStyle = {
          width: cfg.dotSize,
          height: cfg.dotSize,
          borderRadius: cfg.dotSize / 2,
          backgroundColor: dotColor,
          alignItems: 'center',
          justifyContent: 'center',
        };

        const lineStyle: ViewStyle = {
          position: 'absolute',
          top: cfg.dotSize,
          left: (cfg.dotSize - cfg.lineWidth) / 2,
          bottom: 0,
          width: cfg.lineWidth,
          backgroundColor: status === 'pending' ? themeColors.border.subtle : themeColors.accent.primary,
        };

        return (
          <View key={item.id} style={{ flexDirection: 'row', gap: cfg.gap, paddingBottom: isLast ? 0 : cfg.gap }}>
            <View style={{ alignItems: 'center', position: 'relative' }}>
              <View style={dotStyle}>
                {showIcon && (
                  <Icon
                    size={Math.round(cfg.dotSize * 0.6)}
                    color={status === 'pending' ? themeColors.text.muted : '#fff'}
                    strokeWidth={2}
                  />
                )}
              </View>
              {!isLast && <View style={lineStyle} />}
            </View>
            <View style={{ flex: 1, gap: cfg.contentGap, paddingTop: 0 }}>
              <RNText style={{ fontSize: cfg.fontSize, fontWeight: defaultTypography.weights.medium, color: themeColors.text.primary } as TextStyle}>
                {item.title}
              </RNText>
              {item.description && (
                <RNText style={{ fontSize: cfg.secondaryFontSize, color: themeColors.text.secondary } as TextStyle}>
                  {item.description}
                </RNText>
              )}
              {item.timestamp && (
                <RNText style={{ fontSize: cfg.secondaryFontSize, color: themeColors.text.muted } as TextStyle}>
                  {item.timestamp}
                </RNText>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

Timeline.displayName = 'Timeline';
