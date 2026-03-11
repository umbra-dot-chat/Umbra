/**
 * @module components/friend-list-item
 * @description React Native FriendListItem for the Wisp design system.
 *
 * Displays a friend row with avatar, name, username, status, and action buttons.
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveFriendListItemColors } from '@coexist/wisp-core/styles/FriendListItem.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FriendStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface FriendAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

export interface FriendListItemProps extends ViewProps {
  /** Display name. */
  name: string;
  /** Username handle (e.g. "@alice"). */
  username?: string;
  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;
  /** Online / presence status. @default 'offline' */
  status?: FriendStatus;
  /** Custom status text (e.g. "Playing Valorant"). */
  statusText?: string;
  /** Number of mutual friends. */
  mutualFriends?: number;
  /** Action buttons rendered at the trailing edge. */
  actions?: FriendAction[];
  /** Whether this item is disabled. @default false */
  disabled?: boolean;
  /** Called when the item is pressed. */
  onPress?: () => void;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Remove border radius for flat list contexts. @default false */
  flat?: boolean;
}

// ---------------------------------------------------------------------------
// Status color helper
// ---------------------------------------------------------------------------

function getStatusColor(status: FriendStatus, colors: ReturnType<typeof resolveFriendListItemColors>) {
  switch (status) {
    case 'online': return colors.statusOnline;
    case 'idle': return colors.statusIdle;
    case 'dnd': return colors.statusDnd;
    default: return colors.statusOffline;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FriendListItem = forwardRef<View, FriendListItemProps>(
  function FriendListItem(
    {
      name,
      username,
      avatar,
      status = 'offline',
      statusText,
      mutualFriends,
      actions,
      disabled = false,
      skeleton = false,
      flat = false,
      onPress,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveFriendListItemColors(theme),
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
            <View style={skeletonLine('30%')} />
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

    const avatarWrapperStyle: ViewStyle = {
      position: 'relative',
      flexShrink: 0,
    };

    const statusDotStyle: ViewStyle = {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: getStatusColor(status, colors),
      borderWidth: 2,
      borderColor: theme.colors.background.canvas,
    };

    const nameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.text,
    };

    const usernameStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.textMuted,
    };

    const statusTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.textSecondary,
    };

    const actionBtnStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.actionBg,
    };

    const handlePress = useCallback(() => {
      if (!disabled) onPress?.();
    }, [disabled, onPress]);

    // Build subtitle text
    const subtitle = statusText
      ?? (mutualFriends != null && mutualFriends > 0
        ? `${mutualFriends} mutual friend${mutualFriends === 1 ? '' : 's'}`
        : undefined);

    return (
      <Pressable
        ref={ref as any}
        disabled={disabled}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Avatar + status dot */}
        <View style={avatarWrapperStyle}>
          {avatar}
          {status !== 'offline' && <View style={statusDotStyle} />}
        </View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={nameStyle}>{name}</Text>
            {username && <Text numberOfLines={1} style={usernameStyle}>{username}</Text>}
          </View>
          {subtitle && (
            <Text numberOfLines={1} style={statusTextStyle}>{subtitle}</Text>
          )}
        </View>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, flexShrink: 0 }}>
            {actions.map((action) => (
              <Pressable
                key={action.id}
                onPress={action.onPress}
                accessibilityLabel={action.label}
                style={actionBtnStyle}
              >
                {action.icon}
              </Pressable>
            ))}
          </View>
        )}
      </Pressable>
    );
  },
);

FriendListItem.displayName = 'FriendListItem';
