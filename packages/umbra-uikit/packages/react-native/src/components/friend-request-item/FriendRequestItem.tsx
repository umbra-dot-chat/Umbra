/**
 * @module components/friend-request-item
 * @description React Native FriendRequestItem for the Wisp design system.
 *
 * Displays an incoming or outgoing friend request with contextual actions.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveFriendRequestItemColors } from '@coexist/wisp-core/styles/FriendRequestItem.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';
import Svg, { Path, Line, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FriendRequestType = 'incoming' | 'outgoing';

export interface FriendRequestItemProps extends ViewProps {
  /** Display name. */
  name: string;
  /** Username handle (e.g. "@alice"). */
  username?: string;
  /** Avatar element. */
  avatar?: React.ReactNode;
  /** Whether this is an incoming or outgoing request. */
  type: FriendRequestType;
  /** When the request was sent (e.g. "2 days ago"). */
  timestamp?: string;
  /** Number of mutual friends. */
  mutualFriends?: number;
  /** Called when accept is pressed (incoming only). */
  onAccept?: () => void;
  /** Called when decline is pressed (incoming only). */
  onDecline?: () => void;
  /** Called when cancel is pressed (outgoing only). */
  onCancel?: () => void;
  /** Whether the item is disabled. @default false */
  disabled?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Remove border radius for flat list contexts. @default false */
  flat?: boolean;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function XIcon({ size = 18, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FriendRequestItem = forwardRef<View, FriendRequestItemProps>(
  function FriendRequestItem(
    {
      name,
      username,
      avatar,
      type,
      timestamp,
      mutualFriends,
      onAccept,
      onDecline,
      onCancel,
      disabled = false,
      skeleton = false,
      flat = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveFriendRequestItemColors(theme),
      [theme],
    );

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainer: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.md,
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        borderRadius: flat ? 0 : defaultRadii.md,
        minHeight: 60,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
      };

      const skeletonCircle: ViewStyle = {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.border.subtle,
      };

      const skeletonLine = (width: number | string): ViewStyle => ({
        height: 12,
        width: width as any,
        borderRadius: defaultRadii.sm,
        backgroundColor: theme.colors.border.subtle,
      });

      return (
        <View ref={ref} style={[skeletonContainer, userStyle as ViewStyle]} {...rest}>
          <View style={skeletonCircle} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={skeletonLine('50%')} />
            <View style={skeletonLine('35%')} />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border.subtle }} />
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border.subtle }} />
          </View>
        </View>
      );
    }

    // ------ Styles ------
    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.md,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderRadius: flat ? 0 : defaultRadii.md,
      backgroundColor: colors.bg,
      opacity: disabled ? 0.5 : 1,
      minHeight: 60,
      width: '100%',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    };

    const nameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.text,
    };

    const subtitleStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.textMuted,
    };

    const acceptBtnStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.acceptBg,
    };

    const declineBtnStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.declineBg,
    };

    // Build subtitle
    const parts: string[] = [];
    if (type === 'incoming') parts.push('Incoming Friend Request');
    if (type === 'outgoing') parts.push('Outgoing Friend Request');
    if (timestamp) parts.push(`· ${timestamp}`);
    if (mutualFriends != null && mutualFriends > 0) {
      parts.push(`· ${mutualFriends} mutual`);
    }
    const subtitle = parts.join(' ');

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Avatar */}
        <View style={{ flexShrink: 0 }}>
          {avatar}
        </View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={nameStyle}>{name}</Text>
            {username && <Text numberOfLines={1} style={subtitleStyle}>{username}</Text>}
          </View>
          <Text numberOfLines={1} style={subtitleStyle}>{subtitle}</Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
          {type === 'incoming' && (
            <>
              <Pressable
                onPress={onAccept}
                disabled={disabled}
                accessibilityLabel="Accept"
                style={acceptBtnStyle}
              >
                <CheckIcon size={18} color={colors.acceptText} />
              </Pressable>
              <Pressable
                onPress={onDecline}
                disabled={disabled}
                accessibilityLabel="Decline"
                style={declineBtnStyle}
              >
                <XIcon size={18} color={colors.declineText} />
              </Pressable>
            </>
          )}
          {type === 'outgoing' && (
            <Pressable
              onPress={onCancel}
              disabled={disabled}
              accessibilityLabel="Cancel request"
              style={declineBtnStyle}
            >
              <XIcon size={18} color={colors.cancelText} />
            </Pressable>
          )}
        </View>
      </View>
    );
  },
);

FriendRequestItem.displayName = 'FriendRequestItem';
