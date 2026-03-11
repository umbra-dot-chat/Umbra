/**
 * @module components/active-timeouts-badge
 * @description React Native ActiveTimeoutsBadge for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import {
  resolveActiveTimeoutsBadgeColors,
} from '@coexist/wisp-core/styles/ActiveTimeoutsBadge.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Circle, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type TimeoutType = 'mute' | 'restrict';

export interface ActiveTimeoutsBadgeProps extends ViewProps {
  active: boolean;
  type?: TimeoutType;
  expiresAt?: string;
  reason?: string;
  size?: 'xs' | 'sm' | 'md';
  showTooltip?: boolean;
}

// ---------------------------------------------------------------------------
// Clock Icon
// ---------------------------------------------------------------------------

function ClockIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx={12} cy={12} r={10} />
      <Polyline points="12 6 12 12 16 14" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const sizeMap = {
  xs: { fontSize: 10, lineHeight: 14, paddingH: 4, paddingV: 1, iconSize: 10, gap: 2 },
  sm: { fontSize: 12, lineHeight: 16, paddingH: 6, paddingV: 2, iconSize: 12, gap: 4 },
  md: { fontSize: 14, lineHeight: 20, paddingH: 8, paddingV: 3, iconSize: 14, gap: 4 },
} as const;

// ---------------------------------------------------------------------------
// ActiveTimeoutsBadge
// ---------------------------------------------------------------------------

export const ActiveTimeoutsBadge = forwardRef<View, ActiveTimeoutsBadgeProps>(
  function ActiveTimeoutsBadge(
    {
      active,
      type = 'mute',
      expiresAt,
      reason,
      size = 'sm',
      showTooltip = true,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const tcColors = useMemo(
      () => resolveActiveTimeoutsBadgeColors(theme),
      [theme],
    );

    if (!active) return null;

    const isMute = type === 'mute';
    const label = isMute ? 'Muted' : 'Restricted';
    const s = sizeMap[size];

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: s.gap,
      paddingHorizontal: s.paddingH,
      paddingVertical: s.paddingV,
      borderRadius: defaultRadii.full,
      backgroundColor: isMute ? tcColors.muteBg : tcColors.restrictBg,
      borderWidth: 1,
      borderColor: isMute ? tcColors.muteBorder : tcColors.restrictBorder,
    };

    const textStyle: TextStyle = {
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: isMute ? tcColors.muteText : tcColors.restrictText,
    };

    return (
      <View
        ref={ref}
        accessibilityRole="text"
        accessibilityLabel={`${label}${expiresAt ? ` until ${expiresAt}` : ''}`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        <ClockIcon
          size={s.iconSize}
          color={isMute ? tcColors.muteText : tcColors.restrictText}
        />
        <Text style={textStyle}>{label}</Text>
      </View>
    );
  },
);

ActiveTimeoutsBadge.displayName = 'ActiveTimeoutsBadge';
