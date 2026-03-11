/**
 * @module components/notification-item
 * @description React Native NotificationItem for the Wisp design system.
 *
 * Notification row with a type-based icon circle, title, description,
 * timestamp, unread dot, and dismiss button.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Pressable, Text as RNText } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import type {
  NotificationItemProps,
  NotificationType,
} from '@coexist/wisp-core/types/NotificationItem.types';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Lucide-style SVG icons (one per notification type)
// ---------------------------------------------------------------------------

function UserPlusIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Line x1={19} y1={8} x2={19} y2={14} />
      <Line x1={22} y1={11} x2={16} y2={11} />
    </Svg>
  );
}

function UserCheckIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Polyline points="16 11 18 13 22 9" />
    </Svg>
  );
}

function UserXIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Line x1={17} y1={8} x2={22} y2={13} />
      <Line x1={22} y1={8} x2={17} y2={13} />
    </Svg>
  );
}

function PhoneOffIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
      <Line x1={23} y1={1} x2={1} y2={23} />
    </Svg>
  );
}

function PhoneIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </Svg>
  );
}

function UsersIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function ServerIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" />
      <Path d="M2 18a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" />
      <Circle cx={7} cy={9} r={0.5} fill={color ?? 'currentColor'} />
      <Circle cx={7} cy={18} r={0.5} fill={color ?? 'currentColor'} />
    </Svg>
  );
}

function AtSignIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={4} />
      <Path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </Svg>
  );
}

function BellIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </Svg>
  );
}

function XIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Type → icon + color mapping
// ---------------------------------------------------------------------------

const ICON_SIZE = 36;

type IconFC = React.FC<{ size?: number; color?: string }>;

const TYPE_ICON_MAP: Record<NotificationType, { Icon: IconFC; bg: string; fg: string }> = {
  friend_request_received: { Icon: UserPlusIcon, bg: '#3B82F620', fg: '#3B82F6' },
  friend_request_accepted: { Icon: UserCheckIcon, bg: '#22C55E20', fg: '#22C55E' },
  friend_request_rejected: { Icon: UserXIcon, bg: '#EF444420', fg: '#EF4444' },
  call_missed: { Icon: PhoneOffIcon, bg: '#EF444420', fg: '#EF4444' },
  call_completed: { Icon: PhoneIcon, bg: '#22C55E20', fg: '#22C55E' },
  group_invite: { Icon: UsersIcon, bg: '#8B5CF620', fg: '#8B5CF6' },
  community_invite: { Icon: ServerIcon, bg: '#6366F120', fg: '#6366F1' },
  mention: { Icon: AtSignIcon, bg: '#F59E0B20', fg: '#F59E0B' },
  system: { Icon: BellIcon, bg: '#6B728020', fg: '#6B7280' },
};

// ---------------------------------------------------------------------------
// NotificationItem
// ---------------------------------------------------------------------------

export const NotificationItem = forwardRef<View, NotificationItemProps>(
  function NotificationItem(
    {
      id,
      type,
      title,
      description,
      timestamp,
      read,
      onPress,
      onDismiss,
      style: userStyle,
      // Accept but prefer the type-based icon
      avatar: _avatar,
      avatarFallback: _avatarFallback,
      icon: CustomIcon,
      iconColor: customIconColor,
      actions: _actions,
    },
    ref,
  ) {
    const { theme } = useTheme();

    const { Icon, bg, fg } = TYPE_ICON_MAP[type] ?? TYPE_ICON_MAP.system;

    const containerStyle = useMemo<ViewStyle>(
      () => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        gap: defaultSpacing.sm,
        borderRadius: defaultRadii.md,
      }),
      [],
    );

    const titleStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.sm.fontSize,
        lineHeight: defaultTypography.sizes.sm.lineHeight,
        fontWeight: read
          ? (String(defaultTypography.weights.regular) as TextStyle['fontWeight'])
          : (String(defaultTypography.weights.semibold) as TextStyle['fontWeight']),
        color: theme.colors.text.primary,
      }),
      [read, theme],
    );

    const descriptionStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes.xs.fontSize,
        lineHeight: defaultTypography.sizes.xs.lineHeight,
        color: theme.colors.text.muted,
      }),
      [theme],
    );

    const timestampStyle = useMemo<TextStyle>(
      () => ({
        fontSize: defaultTypography.sizes['2xs']?.fontSize ?? 10,
        lineHeight: defaultTypography.sizes['2xs']?.lineHeight ?? 14,
        color: theme.colors.text.muted,
        flexShrink: 0,
      }),
      [theme],
    );

    const ResolvedIcon = CustomIcon ?? Icon;
    const resolvedColor = customIconColor ?? fg;

    return (
      <Pressable
        ref={ref as any}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${read ? '' : 'Unread '}notification: ${title}`}
        style={({ pressed }) => [
          containerStyle,
          pressed && onPress ? { opacity: 0.7 } : undefined,
          userStyle as ViewStyle,
        ]}
      >
        {/* Icon circle */}
        <View
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            borderRadius: ICON_SIZE / 2,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ResolvedIcon size={18} color={resolvedColor} />
        </View>

        {/* Title + description */}
        <View style={{ flex: 1, gap: 2, paddingTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={titleStyle} numberOfLines={1}>
              {title}
            </RNText>
            {!read && (
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.colors.status.danger,
                  flexShrink: 0,
                }}
              />
            )}
          </View>
          {description ? (
            <RNText style={descriptionStyle} numberOfLines={2}>
              {description}
            </RNText>
          ) : null}
        </View>

        {/* Dismiss + timestamp */}
        <View style={{ alignItems: 'flex-end', gap: 4, paddingTop: 2, flexShrink: 0 }}>
          {onDismiss && (
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel="Dismiss notification"
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 0.4 })}
            >
              <XIcon size={14} color={theme.colors.text.muted} />
            </Pressable>
          )}
          <RNText style={timestampStyle}>{timestamp}</RNText>
        </View>
      </Pressable>
    );
  },
);

NotificationItem.displayName = 'NotificationItem';
