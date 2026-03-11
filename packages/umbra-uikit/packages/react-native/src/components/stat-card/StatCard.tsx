/**
 * @module components/stat-card
 * @description React Native StatCard for the Wisp design system.
 *
 * A KPI / metric display card with optional icon, trend indicator,
 * and inline sparkline placeholder.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { StatCardVariant, StatCardSize } from '@coexist/wisp-core/types/StatCard.types';
import { statCardSizeMap } from '@coexist/wisp-core/types/StatCard.types';
import { resolveStatCardColors } from '@coexist/wisp-core/styles/StatCard.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface StatCardProps extends ViewProps {
  /** The metric value to display. */
  value: string | number;
  /** Metric label / title. */
  label: string;
  /** Optional subtitle or description text. */
  description?: string;
  /** Optional icon component. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
  /** Percentage change indicator. */
  trend?: number;
  /** Custom text beside the trend indicator. */
  trendLabel?: string;
  /** Color accent variant. @default 'default' */
  variant?: StatCardVariant;
  /** Size preset. @default 'md' */
  size?: StatCardSize;
  /** Show a loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StatCard = forwardRef<View, StatCardProps>(
  function StatCard(
    {
      value,
      label,
      description,
      icon: IconComponent,
      trend,
      trendLabel,
      variant = 'default',
      size = 'md',
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const sizeConfig = statCardSizeMap[size];
    const colors = useMemo(
      () => resolveStatCardColors(variant, theme),
      [variant, themeColors],
    );

    if (skeleton) {
      const skeletonStyle: ViewStyle = {
        width: '100%',
        height: sizeConfig.padding * 2 + sizeConfig.valueLineHeight + sizeConfig.labelFontSize * 1.4 + 4,
        borderRadius: defaultRadii.lg,
        backgroundColor: themeColors.border.subtle,
      };
      return <View style={[skeletonStyle, userStyle as ViewStyle]} />;
    }

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      padding: sizeConfig.padding,
      gap: sizeConfig.gap,
      borderRadius: defaultRadii.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      width: '100%',
      overflow: 'hidden',
    }), [sizeConfig, colors]);

    const contentStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: sizeConfig.gap,
      flex: 1,
    }), [sizeConfig]);

    const iconContainerStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'center',
      justifyContent: 'center',
      width: sizeConfig.iconSize + 8,
      height: sizeConfig.iconSize + 8,
      borderRadius: defaultRadii.md,
      backgroundColor: colors.accent + '14',
    }), [sizeConfig, colors]);

    const textStackStyle = useMemo<ViewStyle>(() => ({
      flex: 1,
      gap: defaultSpacing['2xs'],
    }), []);

    const labelTextStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.labelFontSize,
      fontWeight: defaultTypography.weights.medium,
      color: colors.label,
    }), [sizeConfig, colors]);

    const valueTextStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.valueFontSize,
      lineHeight: sizeConfig.valueLineHeight,
      fontWeight: defaultTypography.weights.bold,
      color: colors.value,
      letterSpacing: -0.5,
    }), [sizeConfig, colors]);

    const descTextStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.descriptionFontSize,
      fontWeight: defaultTypography.weights.regular,
      color: colors.description,
    }), [sizeConfig, colors]);

    const rightStyle = useMemo<ViewStyle>(() => ({
      alignItems: 'flex-end',
      gap: sizeConfig.gap,
      flexShrink: 0,
    }), [sizeConfig]);

    const trendColor = trend !== undefined && trend !== 0
      ? trend > 0
        ? colors.trendUp
        : colors.trendDown
      : colors.trendNeutral;

    const trendTextStyle = useMemo<TextStyle>(() => ({
      fontSize: sizeConfig.trendFontSize,
      fontWeight: defaultTypography.weights.semibold,
      color: trendColor,
    }), [sizeConfig, trendColor]);

    const trendArrow = trend !== undefined && trend > 0 ? '\u{2191}' : trend !== undefined && trend < 0 ? '\u{2193}' : '';
    const trendText = trend !== undefined
      ? `${trendArrow} ${Math.abs(trend).toFixed(1)}%`
      : '';

    return (
      <View ref={ref} style={[containerStyle, userStyle as ViewStyle]} {...rest}>
        <View style={contentStyle}>
          {IconComponent && (
            <View style={iconContainerStyle}>
              <IconComponent size={sizeConfig.iconSize} color={colors.accent} strokeWidth={2} />
            </View>
          )}
          <View style={textStackStyle}>
            <Text style={labelTextStyle}>{label}</Text>
            <Text style={valueTextStyle}>{String(value)}</Text>
            {description && <Text style={descTextStyle}>{description}</Text>}
          </View>
        </View>

        {(trend !== undefined || trendLabel) && (
          <View style={rightStyle}>
            {trend !== undefined && (
              <Text style={trendTextStyle}>{trendText}</Text>
            )}
            {trendLabel && (
              <Text style={descTextStyle}>{trendLabel}</Text>
            )}
          </View>
        )}
      </View>
    );
  },
);

StatCard.displayName = 'StatCard';
