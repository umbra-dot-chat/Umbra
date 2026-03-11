import React, { forwardRef, useMemo, useEffect, useRef } from 'react';
import { View, Animated, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import type { ThemeColors } from '@coexist/wisp-core/theme/types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

type PingMeterSize = 'sm' | 'md' | 'lg';
type PingMeterVariant = 'dot' | 'bars' | 'full';
type PingQuality = 'excellent' | 'good' | 'fair' | 'poor';

const sizeMap: Record<PingMeterSize, { dotSize: number; barWidth: number; barHeight: number; barGap: number; fontSize: number; gap: number }> = {
  sm: { dotSize: 6, barWidth: 3, barHeight: 12, barGap: 2, fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.sm },
  md: { dotSize: 8, barWidth: 4, barHeight: 16, barGap: 2, fontSize: defaultTypography.sizes.xs.fontSize, gap: defaultSpacing.sm },
  lg: { dotSize: 10, barWidth: 5, barHeight: 20, barGap: 3, fontSize: defaultTypography.sizes.sm.fontSize, gap: defaultSpacing.md },
};

const TOTAL_BARS = 4;

function getQuality(latency: number): PingQuality {
  if (latency < 50) return 'excellent';
  if (latency < 100) return 'good';
  if (latency < 200) return 'fair';
  return 'poor';
}

function getActiveBars(quality: PingQuality): number {
  switch (quality) {
    case 'excellent': return 4;
    case 'good': return 3;
    case 'fair': return 2;
    default: return 1;
  }
}

function getLatencyColor(latency: number, themeColors: ThemeColors): string {
  if (latency < 50) return themeColors.status.success;
  if (latency < 100) return themeColors.status.warning;
  if (latency < 200) return themeColors.status.warning;
  return themeColors.status.danger;
}

export interface PingMeterProps {
  latency: number;
  size?: PingMeterSize;
  showLatency?: boolean;
  showBars?: boolean;
  showDot?: boolean;
  variant?: PingMeterVariant;
  style?: ViewStyle;
}

export const PingMeter = forwardRef<View, PingMeterProps>(function PingMeter(
  { latency, size = 'md', showLatency = true, showBars = true, showDot = true,
    variant = 'full', style: userStyle }, ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const cfg = sizeMap[size];
  const quality = getQuality(latency);
  const activeBars = getActiveBars(quality);
  const color = getLatencyColor(latency, tc);

  const isDot = variant === 'dot' || (variant === 'full' && showDot);
  const isBars = variant === 'bars' || (variant === 'full' && showBars);
  const isLatencyText = variant === 'full' && showLatency;

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row', alignItems: 'center', gap: cfg.gap,
  }), [cfg]);

  return (
    <View ref={ref} accessibilityLabel={`Latency: ${latency}ms`} style={[containerStyle, userStyle]}>
      {isDot && (
        <View style={{ width: cfg.dotSize * 2, height: cfg.dotSize * 2, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{
            position: 'absolute', width: cfg.dotSize, height: cfg.dotSize,
            borderRadius: cfg.dotSize / 2, backgroundColor: color,
            transform: [{ scale: pulseScale }], opacity: pulseOpacity,
          }} />
          <View style={{ width: cfg.dotSize, height: cfg.dotSize, borderRadius: cfg.dotSize / 2, backgroundColor: color }} />
        </View>
      )}
      {isBars && (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: cfg.barGap, height: cfg.barHeight }}>
          {Array.from({ length: TOTAL_BARS }, (_, i) => {
            const h = ((i + 1) / TOTAL_BARS) * cfg.barHeight;
            const active = i < activeBars;
            return (
              <View key={i} style={{
                width: cfg.barWidth, height: h, borderRadius: defaultRadii.sm,
                backgroundColor: active ? color : tc.border.subtle,
              }} />
            );
          })}
        </View>
      )}
      {isLatencyText && (
        <RNText style={{ fontSize: cfg.fontSize, color: tc.text.secondary, fontVariant: ['tabular-nums'] } as TextStyle}>
          {`${latency}ms`}
        </RNText>
      )}
    </View>
  );
});

PingMeter.displayName = 'PingMeter';
