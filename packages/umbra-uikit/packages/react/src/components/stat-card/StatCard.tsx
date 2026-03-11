/**
 * @module StatCard
 * @description KPI / metric display card with optional icon, trend indicator,
 * and inline sparkline chart. Composes Card, Text, and Sparkline primitives.
 */

import React, { forwardRef, useMemo } from 'react';
import { useTheme } from '../../providers';
import { Sparkline } from '../../primitives/sparkline';
import type { StatCardProps } from '@coexist/wisp-core/types/StatCard.types';
import { statCardSizeMap } from '@coexist/wisp-core/types/StatCard.types';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import {
  resolveStatCardColors,
  buildStatCardContainerStyle,
  buildStatCardContentStyle,
  buildStatCardTextStackStyle,
  buildStatCardIconStyle,
  buildStatCardValueStyle,
  buildStatCardLabelStyle,
  buildStatCardDescriptionStyle,
  buildStatCardRightStyle,
  buildStatCardTrendStyle,
  buildStatCardSkeletonStyle,
} from '@coexist/wisp-core/styles/StatCard.styles';

// ---------------------------------------------------------------------------
// Trend arrow SVG (inline, no external dependency)
// ---------------------------------------------------------------------------

function TrendArrow({ direction }: { direction: 'up' | 'down' }) {
  const d =
    direction === 'up'
      ? 'M6 10L6 2M6 2L2 6M6 2L10 6' // arrow pointing up
      : 'M6 2L6 10M6 10L2 6M6 10L10 6'; // arrow pointing down

  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  {
    value,
    label,
    description,
    icon: IconComponent,
    trend,
    trendLabel,
    sparklineData,
    variant = 'default',
    size = 'md',
    skeleton = false,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = statCardSizeMap[size];

  // Resolve colors
  const colors = useMemo(
    () => resolveStatCardColors(variant, theme),
    [variant, theme],
  );

  // Skeleton early return
  if (skeleton) {
    const skeletonStyle = buildStatCardSkeletonStyle(sizeConfig, theme);
    return (
      <div
        aria-hidden
        className={className}
        style={{ ...skeletonStyle, ...userStyle }}
      />
    );
  }

  // Styles
  const containerStyle = useMemo(
    () => buildStatCardContainerStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const contentStyle = useMemo(
    () => buildStatCardContentStyle(sizeConfig),
    [sizeConfig],
  );

  const textStackStyle = useMemo(
    () => buildStatCardTextStackStyle(theme),
    [theme],
  );

  const iconContainerStyle = useMemo(
    () => (IconComponent ? buildStatCardIconStyle(sizeConfig, colors.accent, theme) : undefined),
    [IconComponent, sizeConfig, colors.accent, theme],
  );

  const valueStyle = useMemo(
    () => buildStatCardValueStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const labelStyle = useMemo(
    () => buildStatCardLabelStyle(sizeConfig, colors, theme),
    [sizeConfig, colors, theme],
  );

  const descriptionStyle = useMemo(
    () => (description ? buildStatCardDescriptionStyle(sizeConfig, colors, theme) : undefined),
    [description, sizeConfig, colors, theme],
  );

  const rightStyle = useMemo(
    () => buildStatCardRightStyle(sizeConfig),
    [sizeConfig],
  );

  // Trend resolution
  const trendColor = useMemo(() => {
    if (trend === undefined || trend === null) return colors.trendNeutral;
    if (trend > 0) return colors.trendUp;
    if (trend < 0) return colors.trendDown;
    return colors.trendNeutral;
  }, [trend, colors]);

  const trendStyle = useMemo(
    () => (trend !== undefined && trend !== null ? buildStatCardTrendStyle(sizeConfig, trendColor, theme) : undefined),
    [trend, sizeConfig, trendColor, theme],
  );

  // Determine sparkline color based on variant
  const sparklineColor = variant === 'default' ? 'default' : variant;
  const hasRight = (trend !== undefined && trend !== null) || (sparklineData && sparklineData.length > 0);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      {...rest}
    >
      {/* Left: icon + text stack */}
      <div style={contentStyle}>
        {/* Icon */}
        {IconComponent && iconContainerStyle && (
          <div style={iconContainerStyle}>
            <IconComponent size={sizeConfig.iconSize} />
          </div>
        )}

        {/* Text stack */}
        <div style={textStackStyle}>
          <div style={labelStyle}>{label}</div>
          <div style={valueStyle}>{value}</div>
          {description && <div style={descriptionStyle}>{description}</div>}
        </div>
      </div>

      {/* Right: trend + sparkline */}
      {hasRight && (
        <div style={rightStyle}>
          {/* Trend indicator */}
          {trend !== undefined && trend !== null && trendStyle && (
            <div style={trendStyle}>
              <TrendArrow direction={trend >= 0 ? 'up' : 'down'} />
              <span>{Math.abs(trend).toFixed(1)}%</span>
              {trendLabel && (
                <span style={{ fontWeight: defaultTypography.weights.regular, color: colors.description, marginLeft: defaultSpacing['2xs'] }}>
                  {trendLabel}
                </span>
              )}
            </div>
          )}

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <Sparkline
              data={sparklineData}
              size={sizeConfig.sparklineSize}
              color={sparklineColor}
              variant="area"
              curved
              showEndDot
            />
          )}
        </div>
      )}
    </div>
  );
});

StatCard.displayName = 'StatCard';
