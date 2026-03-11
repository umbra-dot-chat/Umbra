import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { ActivityCirclesSize, ActivityCirclesRing } from '@coexist/wisp-core/types/ActivityCircles.types';
import { activityCirclesSizeMap } from '@coexist/wisp-core/types/ActivityCircles.types';
import { thicknessValues, type Thickness } from '@coexist/wisp-core/tokens/shared';
import { computeRingGeometry } from '@coexist/wisp-core/styles/chart-utils';
import {
  resolveRingColor,
  resolveActivityCirclesColors,
} from '@coexist/wisp-core/styles/ActivityCircles.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface ActivityCirclesProps {
  rings: ActivityCirclesRing[];
  size?: ActivityCirclesSize;
  thickness?: Thickness;
  showLabels?: boolean;
  animated?: boolean;
  children?: React.ReactNode;
  style?: object;
}

/**
 * ActivityCircles — Apple-Watch-style concentric progress rings (React Native).
 */
export const ActivityCircles = forwardRef<View, ActivityCirclesProps>(
  function ActivityCircles(
    {
      rings,
      size = 'md',
      thickness,
      showLabels = false,
      animated = false,
      children,
      style: userStyle,
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;
    const baseSizeConfig = activityCirclesSizeMap[size];

    const sizeConfig = useMemo(() => {
      if (!thickness) return baseSizeConfig;
      return { ...baseSizeConfig, strokeWidth: thicknessValues[thickness] };
    }, [baseSizeConfig, thickness]);

    const colors = useMemo(
      () => resolveActivityCirclesColors(theme),
      [themeColors],
    );

    const ringColors = useMemo(
      () => rings.map((ring, i) => ring.color || resolveRingColor(i, theme)),
      [rings, themeColors],
    );

    const geometry = useMemo(
      () => computeRingGeometry(rings, sizeConfig.diameter, sizeConfig.strokeWidth, sizeConfig.gap),
      [rings, sizeConfig],
    );

    const viewBoxSize = sizeConfig.diameter;
    const center = viewBoxSize / 2;

    return (
      <View
        ref={ref}
        accessibilityRole="image"
        accessibilityLabel={
          rings
            .map((r, i) => {
              const pct = r.max > 0 ? Math.round((Math.min(Math.max(r.value, 0), r.max) / r.max) * 100) : 0;
              return `${r.label || `Ring ${i + 1}`}: ${pct}%`;
            })
            .join(', ')
        }
        style={[
          { alignItems: 'center', gap: showLabels ? 12 : 0 },
          userStyle,
        ]}
      >
        <View style={{ width: sizeConfig.diameter, height: sizeConfig.diameter, position: 'relative' }}>
          <Svg
            width={sizeConfig.diameter}
            height={sizeConfig.diameter}
            viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          >
            {geometry.map((geo, i) => (
              <React.Fragment key={i}>
                {/* Track */}
                <Circle
                  cx={center}
                  cy={center}
                  r={geo.radius}
                  stroke={colors.track}
                  strokeWidth={sizeConfig.strokeWidth}
                  fill="none"
                />
                {/* Progress */}
                <Circle
                  cx={center}
                  cy={center}
                  r={geo.radius}
                  stroke={ringColors[i]}
                  strokeWidth={sizeConfig.strokeWidth}
                  fill="none"
                  strokeDasharray={`${geo.circumference}`}
                  strokeDashoffset={geo.dashOffset}
                  strokeLinecap="round"
                  rotation={-90}
                  origin={`${center}, ${center}`}
                />
              </React.Fragment>
            ))}
          </Svg>

          {/* Centre content */}
          {children != null && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {children}
            </View>
          )}
        </View>

        {/* Legend */}
        {showLabels && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: defaultSpacing.md }}>
            {rings.map((ring, i) =>
              ring.label ? (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: defaultSpacing.sm }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: defaultRadii.sm,
                      backgroundColor: ringColors[i],
                    }}
                  />
                  <RNText
                    style={{
                      fontSize: sizeConfig.fontSize,
                      fontWeight: defaultTypography.weights.medium,
                      color: colors.labelText,
                    }}
                  >
                    {ring.label}
                  </RNText>
                </View>
              ) : null,
            )}
          </View>
        )}
      </View>
    );
  },
);

ActivityCircles.displayName = 'ActivityCircles';
