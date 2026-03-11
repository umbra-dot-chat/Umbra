/**
 * @module components/user-profile-card
 * @description React Native UserProfileCard for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text, Pressable, Image, Animated } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import {
  resolveUserProfileCardColors,
} from '@coexist/wisp-core/styles/UserProfileCard.styles';
import type { UserProfileCardColors } from '@coexist/wisp-core/styles/UserProfileCard.styles';
import type { UserProfileCardProps as CoreUserProfileCardProps, UserStatus } from '@coexist/wisp-core/types/UserProfileCard.types';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { withAlpha } from '@coexist/wisp-core/tokens/color-utils';
import { useTheme } from '../../providers';
import Svg, { Line, Path } from 'react-native-svg';

// ---------------------------------------------------------------------------
// RN-specific Props (replaces HTMLAttributes with ViewProps)
// ---------------------------------------------------------------------------

export interface UserProfileCardProps extends ViewProps {
  /** User's display name. */
  name: string;
  /** User's username or handle (e.g. "@johndoe"). */
  username?: string;
  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;
  /** User's online status. @default 'offline' */
  status?: UserStatus;
  /** Custom status text (e.g. "In a meeting", "Working from home"). */
  statusText?: string;
  /** User's bio or about text. */
  bio?: string;
  /** List of role badges to display. */
  roles?: CoreUserProfileCardProps['roles'];
  /** Action buttons (e.g. Message, Call). */
  actions?: CoreUserProfileCardProps['actions'];
  /** Optional banner image URL displayed at the top of the card. */
  bannerUrl?: string;
  /** Optional banner color (used if no bannerUrl). */
  bannerColor?: string;
  /** Whether the card is in a loading/skeleton state. @default false */
  skeleton?: boolean;
  /** Called when the close button is pressed. If omitted, no close button is shown. */
  onClose?: () => void;
}

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? '#999'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Line x1={18} y1={6} x2={6} y2={18} />
      <Line x1={6} y1={6} x2={18} y2={18} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name, bg }: { name: string; bg: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
        {initials}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton bar component (animated opacity pulse)
// ---------------------------------------------------------------------------

function SkeletonBar({ style }: { style: ViewStyle }) {
  const animatedValue = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.25,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.5,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  return <Animated.View style={[style, { opacity: animatedValue }]} />;
}

// ---------------------------------------------------------------------------
// UserProfileCard
// ---------------------------------------------------------------------------

/**
 * UserProfileCard -- A popover or panel showing user profile details.
 *
 * @remarks
 * Displays a user's profile with avatar, status, bio, role badges, and
 * action buttons. Supports banner colors, skeleton loading, and
 * an optional close button.
 *
 * @example
 * ```tsx
 * <UserProfileCard
 *   name="Jane Doe"
 *   username="@janedoe"
 *   status="online"
 *   bio="Full-stack developer"
 *   roles={[{ id: 'admin', label: 'Admin', color: '#e74c3c' }]}
 *   actions={[
 *     { id: 'msg', label: 'Message', onPress: () => {} },
 *     { id: 'call', label: 'Call', onPress: () => {} },
 *   ]}
 *   onClose={() => setOpen(false)}
 * />
 * ```
 */
export const UserProfileCard = forwardRef<View, UserProfileCardProps>(
  function UserProfileCard(
    {
      name,
      username,
      avatar,
      status = 'offline',
      statusText,
      bio,
      roles,
      actions,
      bannerUrl,
      bannerColor,
      skeleton = false,
      onClose,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveUserProfileCardColors(theme),
      [theme],
    );

    // -- Skeleton state ----------------------------------------------------

    if (skeleton) {
      const skeletonBarBase: ViewStyle = {
        borderRadius: 4,
        backgroundColor: colors.divider,
      };

      const skeletonContainerStyle: ViewStyle = {
        flexDirection: 'column',
        width: 340,
        borderRadius: defaultRadii.lg,
        backgroundColor: colors.bg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        gap: defaultSpacing.sm,
      };

      return (
        <View
          ref={ref}
          accessibilityElementsHidden
          style={[skeletonContainerStyle, userStyle as ViewStyle]}
          {...rest}
        >
          {/* Skeleton banner */}
          <SkeletonBar style={{ width: '100%', height: 60, ...skeletonBarBase }} />
          {/* Skeleton avatar area */}
          <View style={{ paddingHorizontal: 16, marginTop: -24, zIndex: 1 }}>
            <SkeletonBar style={{ width: 48, height: 48, borderRadius: 24, ...skeletonBarBase }} />
          </View>
          {/* Skeleton info */}
          <View style={{ flexDirection: 'column', gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
            <SkeletonBar style={{ width: '60%', height: 14, ...skeletonBarBase }} />
            <SkeletonBar style={{ width: '40%', height: 12, ...skeletonBarBase }} />
            <SkeletonBar style={{ width: '80%', height: 12, ...skeletonBarBase }} />
          </View>
          {/* Skeleton actions */}
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
            <SkeletonBar style={{ flex: 1, height: 32, ...skeletonBarBase }} />
            <SkeletonBar style={{ flex: 1, height: 32, ...skeletonBarBase }} />
          </View>
        </View>
      );
    }

    // -- Normal rendering --------------------------------------------------

    const containerStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'column',
      width: 340,
      borderRadius: defaultRadii.lg,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      position: 'relative',
    }), [colors]);

    const bannerStyle: ViewStyle & ImageStyle = useMemo(() => {
      const bgColor = bannerColor ?? colors.bannerDefault;
      return {
        width: '100%',
        height: 60,
        flexShrink: 0,
        backgroundColor: bgColor,
        position: 'relative',
      };
    }, [bannerColor, colors]);

    const avatarAreaStyle: ViewStyle = useMemo(() => ({
      position: 'relative',
      marginTop: -24,
      paddingLeft: defaultSpacing.md,
      paddingRight: defaultSpacing.md,
      flexDirection: 'row',
      alignItems: 'flex-end',
      zIndex: 1,
    }), []);

    const avatarWrapperStyle: ViewStyle = useMemo(() => ({
      position: 'relative',
      flexShrink: 0,
      borderRadius: 28,
      backgroundColor: colors.avatarRing,
      borderWidth: 4,
      borderColor: colors.avatarRing,
    }), [colors]);

    const statusDotStyle: ViewStyle = useMemo(() => {
      const statusColorMap: Record<UserStatus, string> = {
        online: colors.statusOnline,
        idle: colors.statusIdle,
        dnd: colors.statusDnd,
        offline: colors.statusOffline,
      };
      return {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: statusColorMap[status],
        borderWidth: 3,
        borderColor: colors.bg,
      };
    }, [status, colors]);

    const profileInfoStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'column',
      gap: defaultSpacing.xs,
      paddingTop: defaultSpacing.sm,
      paddingBottom: defaultSpacing.md,
      paddingHorizontal: defaultSpacing.md,
    }), []);

    const nameStyle: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.base.fontSize,
      lineHeight: defaultTypography.sizes.base.lineHeight,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.text,
    }), [colors]);

    const usernameStyleComputed: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.textSecondary,
    }), [colors]);

    const statusTextStyleComputed: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.textMuted,
    }), [colors]);

    const bioStyleComputed: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.regular) as TextStyle['fontWeight'],
      color: colors.textSecondary,
      paddingVertical: defaultSpacing.sm,
    }), [colors]);

    const rolesContainerStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: defaultSpacing.xs,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
    }), []);

    const dividerStyle: ViewStyle = useMemo(() => ({
      width: '100%',
      height: 1,
      backgroundColor: colors.divider,
      flexShrink: 0,
    }), [colors]);

    const actionsContainerStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.sm,
      paddingHorizontal: defaultSpacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    }), [colors]);

    const actionBtnStyle: ViewStyle = useMemo(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: defaultSpacing.xs,
      flex: 1,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: colors.actionBorder,
      backgroundColor: colors.actionBg,
    }), [colors]);

    const actionBtnTextStyle: TextStyle = useMemo(() => ({
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
      color: colors.actionText,
    }), [colors]);

    const closeBtnStyle: ViewStyle = useMemo(() => ({
      position: 'absolute',
      top: 8,
      right: 8,
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 28,
      borderRadius: defaultRadii.md,
      backgroundColor: 'transparent',
      zIndex: 2,
      flexShrink: 0,
    }), []);

    const statusLabel: Record<string, string> = {
      online: 'Online',
      idle: 'Idle',
      dnd: 'Do Not Disturb',
      offline: 'Offline',
    };

    return (
      <View
        ref={ref}
        accessibilityRole="summary"
        accessibilityLabel={`${name} profile card`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Close button */}
        {onClose && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close profile card"
            style={closeBtnStyle}
            onPress={onClose}
          >
            <CloseIcon size={16} color={colors.closeText} />
          </Pressable>
        )}

        {/* Banner */}
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            style={bannerStyle}
            resizeMode="cover"
            accessibilityElementsHidden
          />
        ) : (
          <View style={bannerStyle} />
        )}

        {/* Avatar area */}
        <View style={avatarAreaStyle}>
          <View style={avatarWrapperStyle}>
            {avatar || <DefaultAvatar name={name} bg={colors.avatarBg} />}
            <View
              style={statusDotStyle}
              accessibilityRole="image"
              accessibilityLabel={statusLabel[status] ?? 'Offline'}
            />
          </View>
        </View>

        {/* Profile info */}
        <View style={profileInfoStyle}>
          <Text style={nameStyle} numberOfLines={1}>{name}</Text>
          {username && (
            <Text style={usernameStyleComputed} numberOfLines={1}>{username}</Text>
          )}
          {statusText && (
            <Text style={statusTextStyleComputed} numberOfLines={1}>{statusText}</Text>
          )}
        </View>

        {/* Bio */}
        {bio && (
          <>
            <View style={dividerStyle} />
            <View style={{ paddingHorizontal: defaultSpacing.md }}>
              <Text style={bioStyleComputed} numberOfLines={3}>{bio}</Text>
            </View>
          </>
        )}

        {/* Roles */}
        {roles && roles.length > 0 && (
          <>
            <View style={dividerStyle} />
            <View style={rolesContainerStyle}>
              {roles.map((role) => {
                const badgeBg = role.color
                  ? withAlpha(role.color, 0.15)
                  : colors.roleBgDefault;
                const badgeText = role.color ?? colors.roleTextDefault;

                const roleBadgeStyle: ViewStyle = {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingVertical: 2,
                  paddingHorizontal: 8,
                  borderRadius: defaultRadii.full,
                  backgroundColor: badgeBg,
                };

                const roleBadgeTextStyle: TextStyle = {
                  fontSize: defaultTypography.sizes['2xs'].fontSize,
                  lineHeight: defaultTypography.sizes['2xs'].lineHeight,
                  fontWeight: String(defaultTypography.weights.medium) as TextStyle['fontWeight'],
                  color: badgeText,
                };

                return (
                  <View key={role.id} style={roleBadgeStyle}>
                    <Text style={roleBadgeTextStyle}>{role.label}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Actions */}
        {actions && actions.length > 0 && (
          <View style={actionsContainerStyle}>
            {actions.map((action) => (
              <Pressable
                key={action.id}
                accessibilityRole="button"
                accessibilityLabel={action.label}
                disabled={action.disabled}
                onPress={action.disabled ? undefined : action.onClick}
                style={[actionBtnStyle, { opacity: action.disabled ? 0.5 : 1 }]}
              >
                {action.icon}
                <Text style={actionBtnTextStyle}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  },
);

UserProfileCard.displayName = 'UserProfileCard';
