/**
 * @module components/call-notification
 * @description Incoming/outgoing/missed call notification for the Wisp design system.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type {
  CallNotificationSize,
  CallNotificationVariant,
  CallNotificationType,
} from '@coexist/wisp-core/types/CallNotification.types';
import { callNotificationSizeMap } from '@coexist/wisp-core/types/CallNotification.types';
import {
  resolveNotificationColor,
  resolveNotificationSubtitle,
} from '@coexist/wisp-core/styles/CallNotification.styles';
import { Avatar } from '../../primitives/avatar';
import { useTheme } from '../../providers';

export interface CallNotificationProps {
  variant: CallNotificationVariant;
  callerName: string;
  callerAvatar?: string;
  callType: CallNotificationType;
  duration?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  size?: CallNotificationSize;
  style?: ViewStyle;
}

export const CallNotification = forwardRef<View, CallNotificationProps>(function CallNotification(
  {
    variant,
    callerName,
    callerAvatar,
    callType,
    duration,
    onAccept,
    onDecline,
    size = 'md',
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const tc = theme.colors;
  const sc = callNotificationSizeMap[size];
  const accentColor = resolveNotificationColor(variant, theme);
  const subtitle = resolveNotificationSubtitle(variant, callType, duration);

  const containerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    padding: sc.padding,
    gap: sc.gap,
    backgroundColor: tc.background.raised,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: accentColor,
  }), [sc, tc, accentColor]);

  const titleStyle = useMemo<TextStyle>(() => ({
    fontSize: sc.titleSize,
    fontWeight: '600',
    color: tc.text.primary,
  }), [sc, tc]);

  const subtitleStyle = useMemo<TextStyle>(() => ({
    fontSize: sc.subtitleSize,
    color: tc.text.secondary,
    marginTop: 2,
  }), [sc, tc]);

  const avatarSize = sc.avatarSize <= 32 ? 'sm' : sc.avatarSize <= 40 ? 'md' : 'lg';

  return (
    <View ref={ref} style={[containerStyle, userStyle]}>
      <Avatar name={callerName} src={callerAvatar} size={avatarSize} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <RNText style={titleStyle} numberOfLines={1}>{callerName}</RNText>
        <RNText style={subtitleStyle} numberOfLines={1}>{subtitle}</RNText>
      </View>
      {variant === 'incoming' && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onDecline && (
            <Pressable
              onPress={onDecline}
              accessibilityLabel="Decline call"
              accessibilityRole="button"
              style={{
                width: sc.buttonSize,
                height: sc.buttonSize,
                borderRadius: sc.buttonSize / 2,
                backgroundColor: tc.status.danger,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={sc.buttonSize * 0.45} height={sc.buttonSize * 0.45} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Line x1="1" y1="1" x2="23" y2="23" />
                <Path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <Path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17" />
                <Line x1="12" y1="19" x2="12" y2="22" />
              </Svg>
            </Pressable>
          )}
          {onAccept && (
            <Pressable
              onPress={onAccept}
              accessibilityLabel="Accept call"
              accessibilityRole="button"
              style={{
                width: sc.buttonSize,
                height: sc.buttonSize,
                borderRadius: sc.buttonSize / 2,
                backgroundColor: tc.status.success,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={sc.buttonSize * 0.45} height={sc.buttonSize * 0.45} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </Svg>
            </Pressable>
          )}
        </View>
      )}
      {variant !== 'incoming' && onDecline && (
        <Pressable
          onPress={onDecline}
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={tc.text.secondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M18 6L6 18" />
            <Path d="M6 6l12 12" />
          </Svg>
        </Pressable>
      )}
    </View>
  );
});

CallNotification.displayName = 'CallNotification';
