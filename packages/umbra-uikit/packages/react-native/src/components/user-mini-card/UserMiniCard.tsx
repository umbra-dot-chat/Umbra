/**
 * @module components/user-mini-card
 * @description React Native UserMiniCard for the Wisp design system.
 *
 * A compact inline card for hover tooltips and mention popovers.
 * Shows avatar, name, username, status, and optional quick-action icons.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveUserMiniCardColors } from '@coexist/wisp-core/styles/UserMiniCard.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserMiniCardStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface UserMiniCardAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

export interface UserMiniCardProps extends ViewProps {
  /** User's display name. */
  name: string;
  /** Username handle (e.g. "@alice"). */
  username?: string;
  /** Avatar element. */
  avatar?: React.ReactNode;
  /** Online / presence status. @default 'offline' */
  status?: UserMiniCardStatus;
  /** Custom status text (e.g. "In a meeting"). */
  statusText?: string;
  /** Quick-action icon buttons. */
  actions?: UserMiniCardAction[];
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function getStatusColor(status: UserMiniCardStatus, colors: ReturnType<typeof resolveUserMiniCardColors>) {
  switch (status) {
    case 'online': return colors.statusOnline;
    case 'idle': return colors.statusIdle;
    case 'dnd': return colors.statusDnd;
    default: return colors.statusOffline;
  }
}

function getStatusLabel(status: UserMiniCardStatus): string {
  switch (status) {
    case 'online': return 'Online';
    case 'idle': return 'Idle';
    case 'dnd': return 'Do Not Disturb';
    default: return 'Offline';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const UserMiniCard = forwardRef<View, UserMiniCardProps>(
  function UserMiniCard(
    {
      name,
      username,
      avatar,
      status = 'offline',
      statusText,
      actions,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveUserMiniCardColors(theme),
      [theme],
    );

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainer: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.md,
        padding: defaultSpacing.md,
        borderRadius: defaultRadii.lg,
        backgroundColor: theme.colors.background.surface,
        borderWidth: 1,
        borderColor: theme.colors.border.subtle,
        minWidth: 240,
      };

      return (
        <View ref={ref} style={[skeletonContainer, userStyle as ViewStyle]} {...rest}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.border.subtle }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 12, width: '60%' as any, borderRadius: defaultRadii.sm, backgroundColor: theme.colors.border.subtle }} />
            <View style={{ height: 10, width: '40%' as any, borderRadius: defaultRadii.sm, backgroundColor: theme.colors.border.subtle }} />
          </View>
        </View>
      );
    }

    // ------ Styles ------
    const isLight = theme.mode === 'light';

    const containerStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.md,
      padding: defaultSpacing.md,
      borderRadius: defaultRadii.lg,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 240,
      maxWidth: 320,
      // Light mode: subtle shadow for visual lift
      ...(isLight && {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      }),
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
      borderColor: colors.bg,
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
      width: 28,
      height: 28,
      borderRadius: defaultRadii.md,
      backgroundColor: colors.actionBg,
    };

    const displayStatus = statusText ?? getStatusLabel(status);

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Avatar + status dot */}
        <View style={avatarWrapperStyle}>
          {avatar}
          <View style={statusDotStyle} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={nameStyle}>{name}</Text>
            {username && <Text numberOfLines={1} style={usernameStyle}>{username}</Text>}
          </View>
          <Text numberOfLines={1} style={statusTextStyle}>{displayStatus}</Text>
        </View>

        {/* Quick actions */}
        {actions && actions.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 4, flexShrink: 0 }}>
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
      </View>
    );
  },
);

UserMiniCard.displayName = 'UserMiniCard';
