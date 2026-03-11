/**
 * @module components/user-search-result
 * @description React Native UserSearchResult for the Wisp design system.
 *
 * Displays a user in search results with a contextual action button
 * reflecting the current relationship state.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveUserSearchResultColors } from '@coexist/wisp-core/styles/UserSearchResult.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserSearchRequestState = 'none' | 'pending' | 'friends';

export interface UserSearchResultProps extends ViewProps {
  /** Display name. */
  name: string;
  /** Username handle (e.g. "@alice"). */
  username?: string;
  /** Avatar element. */
  avatar?: React.ReactNode;
  /** Current request / relationship state. @default 'none' */
  requestState?: UserSearchRequestState;
  /** Number of mutual friends. */
  mutualFriends?: number;
  /** Called when "Send Request" is pressed (only active in 'none' state). */
  onSendRequest?: () => void;
  /** Whether the item is disabled. @default false */
  disabled?: boolean;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const REQUEST_LABELS: Record<UserSearchRequestState, string> = {
  none: 'Send Request',
  pending: 'Pending',
  friends: 'Friends',
};

export const UserSearchResult = forwardRef<View, UserSearchResultProps>(
  function UserSearchResult(
    {
      name,
      username,
      avatar,
      requestState = 'none',
      mutualFriends,
      onSendRequest,
      disabled = false,
      skeleton = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveUserSearchResultColors(theme),
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
        borderRadius: defaultRadii.md,
        minHeight: 60,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.subtle,
      };

      return (
        <View ref={ref} style={[skeletonContainer, userStyle as ViewStyle]} {...rest}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.border.subtle }} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ height: 12, width: '50%' as any, borderRadius: defaultRadii.sm, backgroundColor: theme.colors.border.subtle }} />
            <View style={{ height: 12, width: '30%' as any, borderRadius: defaultRadii.sm, backgroundColor: theme.colors.border.subtle }} />
          </View>
          <View style={{ width: 90, height: 32, borderRadius: defaultRadii.md, backgroundColor: theme.colors.border.subtle }} />
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
      borderRadius: defaultRadii.md,
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

    const btnBgMap: Record<UserSearchRequestState, string> = {
      none: colors.btnBgSend,
      pending: colors.btnBgPending,
      friends: colors.btnBgFriends,
    };
    const btnTextMap: Record<UserSearchRequestState, string> = {
      none: colors.btnTextSend,
      pending: colors.btnTextPending,
      friends: colors.btnTextFriends,
    };

    const btnStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      height: 32,
      borderRadius: defaultRadii.md,
      backgroundColor: btnBgMap[requestState],
      flexShrink: 0,
    };

    const btnTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: btnTextMap[requestState],
    };

    // Subtitle
    const subtitleText = mutualFriends != null && mutualFriends > 0
      ? `${mutualFriends} mutual friend${mutualFriends === 1 ? '' : 's'}`
      : username;

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Avatar */}
        <View style={{ flexShrink: 0 }}>{avatar}</View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text numberOfLines={1} style={nameStyle}>{name}</Text>
            {username && requestState === 'none' && (
              <Text numberOfLines={1} style={subtitleStyle}>{username}</Text>
            )}
          </View>
          {subtitleText && (
            <Text numberOfLines={1} style={subtitleStyle}>{subtitleText}</Text>
          )}
        </View>

        {/* Action button */}
        <Pressable
          onPress={requestState === 'none' ? onSendRequest : undefined}
          disabled={disabled || requestState !== 'none'}
          accessibilityLabel={REQUEST_LABELS[requestState]}
          style={btnStyle}
        >
          <Text style={btnTextStyle}>{REQUEST_LABELS[requestState]}</Text>
        </Pressable>
      </View>
    );
  },
);

UserSearchResult.displayName = 'UserSearchResult';
