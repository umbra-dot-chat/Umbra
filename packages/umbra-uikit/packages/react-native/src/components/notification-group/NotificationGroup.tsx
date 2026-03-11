/**
 * @module components/notification-group
 * @description React Native NotificationGroup for the Wisp design system.
 *
 * Groups notifications under a date header (e.g., "Today", "Yesterday").
 * Shows an optional count badge next to the label.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { resolveNotificationGroupColors } from '@coexist/wisp-core/styles/NotificationGroup.styles';
import type { NotificationGroupProps } from '@coexist/wisp-core/types/NotificationGroup.types';
import { useTheme } from '../../providers';

export const NotificationGroup = forwardRef<View, NotificationGroupProps>(
  function NotificationGroup({ label, count, children, style: userStyle }, ref) {
    const { theme } = useTheme();
    const colors = useMemo(
      () => resolveNotificationGroupColors(theme),
      [theme],
    );

    const labelStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.xs.fontSize,
        lineHeight: defaultTypography.sizes.xs.lineHeight,
        fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
        color: colors.labelText,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }),
      [colors.labelText],
    );

    const countBadgeStyle = useMemo<ViewStyle>(
      () => ({
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.countBg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
      }),
      [colors.countBg],
    );

    const countTextStyle = useMemo<TextStyle>(
      () => ({
        fontSize: 10,
        fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
        color: colors.countText,
      }),
      [colors.countText],
    );

    return (
      <View ref={ref} style={[{ gap: defaultSpacing.xs }, userStyle as ViewStyle]}>
        {/* Header row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: defaultSpacing.sm,
            paddingHorizontal: defaultSpacing.md,
            paddingTop: defaultSpacing.md,
            paddingBottom: defaultSpacing.xs,
          }}
        >
          <RNText style={labelStyle}>{label}</RNText>
          {count != null && count > 0 && (
            <View style={countBadgeStyle}>
              <RNText style={countTextStyle}>{count}</RNText>
            </View>
          )}
          <View style={{ flex: 1, height: 1, backgroundColor: colors.separator }} />
        </View>

        {/* Notification items */}
        {children}
      </View>
    );
  },
);

NotificationGroup.displayName = 'NotificationGroup';
