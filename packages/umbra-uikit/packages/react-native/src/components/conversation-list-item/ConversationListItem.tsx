/**
 * @module components/conversation-list-item
 * @description React Native ConversationListItem for the Wisp design system.
 *
 * Reuses color resolution from `@coexist/wisp-core`. Renders via `<View>` + `<Text>`.
 */

import React, { forwardRef, useMemo, useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import { resolveConversationListItemColors } from '@coexist/wisp-core/styles/ConversationListItem.styles';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { fontFamilyStacks } from '@coexist/wisp-core/tokens/shared';
import { useTheme } from '../../providers';
import Svg, { Path, Line, Polyline } from 'react-native-svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Message delivery status for read receipts. */
export type MessageStatus = 'sent' | 'delivered' | 'read';

// ---------------------------------------------------------------------------
// Props (mirror web but extend ViewProps)
// ---------------------------------------------------------------------------

export interface ConversationListItemProps extends ViewProps {
  /** Display name of the conversation (user or group name). */
  name: string;
  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;
  /** Last message preview text (truncated to one line). */
  lastMessage?: string;
  /** Timestamp string (e.g. "2m ago", "Yesterday", "3:42 PM"). */
  timestamp?: string;
  /** Number of unread messages. Shows a badge when > 0. */
  unreadCount?: number;
  /** Whether the user is currently online (shows a green dot). */
  online?: boolean;
  /** Whether this conversation is pinned. */
  pinned?: boolean;
  /** Whether this conversation is muted. */
  muted?: boolean;
  /** Whether this item is currently selected / active. */
  active?: boolean;
  /** Whether the item is disabled. @default false */
  disabled?: boolean;
  /** Called when the item is pressed. */
  onPress?: () => void;
  /** Show loading skeleton. @default false */
  skeleton?: boolean;
  /** Read receipt status for the last message. */
  status?: MessageStatus;
  /** Trigger a brief shimmer sweep (e.g. on new message). Increment to re-trigger. */
  shimmer?: number;
}

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function PinIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 17v5" />
      <Path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </Svg>
  );
}

function CheckIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="20 6 9 17 4 12" />
    </Svg>
  );
}

function DoubleCheckIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="18 6 7 17 2 12" />
      <Polyline points="22 6 11 17" />
    </Svg>
  );
}

function MuteIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
      <Path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
      <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <Line x1={2} y1={2} x2={22} y2={22} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Shimmer CSS (web only)
// ---------------------------------------------------------------------------

let shimmerInjected = false;
function injectShimmerCSS() {
  if (shimmerInjected || Platform.OS !== 'web') return;
  shimmerInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wisp-convo-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// ConversationListItem
// ---------------------------------------------------------------------------

export const ConversationListItem = forwardRef<View, ConversationListItemProps>(
  function ConversationListItem(
    {
      name,
      avatar,
      lastMessage,
      timestamp,
      unreadCount = 0,
      online = false,
      pinned = false,
      muted = false,
      active = false,
      disabled = false,
      skeleton = false,
      status,
      shimmer,
      onPress,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveConversationListItemColors(active, theme),
      [active, theme],
    );

    const hasUnread = unreadCount > 0;

    // Shimmer sweep on new message
    const [shimmerActive, setShimmerActive] = useState(false);
    useEffect(() => {
      if (shimmer && shimmer > 0 && Platform.OS === 'web') {
        injectShimmerCSS();
        setShimmerActive(true);
        const timer = setTimeout(() => setShimmerActive(false), 700);
        return () => clearTimeout(timer);
      }
    }, [shimmer]);

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainer: ViewStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        gap: defaultSpacing.md,
        paddingVertical: defaultSpacing.sm,
        paddingHorizontal: defaultSpacing.md,
        borderRadius: defaultRadii.md,
        minHeight: 56,
        width: '100%',
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
            <View style={skeletonLine('60%')} />
            <View style={skeletonLine('40%')} />
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
      borderRadius: defaultRadii.md,
      backgroundColor: colors.bg,
      opacity: disabled ? 0.5 : 1,
      minHeight: 56,
      width: '100%',
    };

    const avatarWrapperStyle: ViewStyle = {
      position: 'relative',
      flexShrink: 0,
    };

    const onlineDotStyle: ViewStyle = {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.onlineDot,
      borderWidth: 2,
      borderColor: theme.colors.background.canvas,
    };

    const nameTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.sm.fontSize,
      lineHeight: defaultTypography.sizes.sm.lineHeight,
      fontWeight: hasUnread ? (String(defaultTypography.weights.semibold) as TextStyle['fontWeight']) : (String(defaultTypography.weights.medium) as TextStyle['fontWeight']),
      color: colors.text,
      flex: 1,
    };

    const timestampTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      lineHeight: defaultTypography.sizes['2xs'].lineHeight,
      color: colors.textMuted,
      flexShrink: 0,
    };

    const lastMsgTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: hasUnread ? (String(defaultTypography.weights.medium) as TextStyle['fontWeight']) : (String(defaultTypography.weights.regular) as TextStyle['fontWeight']),
      color: hasUnread ? colors.textSecondary : colors.textMuted,
      flex: 1,
    };

    const unreadBadgeStyle: ViewStyle = {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      backgroundColor: colors.unreadBg,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    };

    const unreadBadgeTextStyle: TextStyle = {
      fontSize: defaultTypography.sizes['2xs'].fontSize,
      fontWeight: String(defaultTypography.weights.semibold) as TextStyle['fontWeight'],
      color: colors.unreadText,
    };

    const handlePress = useCallback(() => {
      if (!disabled) onPress?.();
    }, [disabled, onPress]);

    return (
      <Pressable
        ref={ref as any}
        disabled={disabled}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: active }}
        style={[containerStyle, { position: 'relative', overflow: 'hidden' } as ViewStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Shimmer sweep overlay */}
        {shimmerActive && Platform.OS === 'web' && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 10,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)',
              animation: 'wisp-convo-shimmer 0.6s ease-out forwards',
            } as any}
          />
        )}

        {/* Avatar */}
        <View style={avatarWrapperStyle}>
          {avatar}
          {online && <View style={onlineDotStyle} />}
        </View>

        {/* Content */}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          {/* Name + timestamp row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <Text numberOfLines={1} style={nameTextStyle}>{name}</Text>
            {timestamp ? <Text style={timestampTextStyle}>{timestamp}</Text> : null}
          </View>

          {/* Last message + indicators row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            {lastMessage ? <Text numberOfLines={1} style={lastMsgTextStyle}>{lastMessage}</Text> : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {status === 'sent' && <CheckIcon size={14} color={colors.textMuted} />}
              {status === 'delivered' && <DoubleCheckIcon size={14} color={colors.textMuted} />}
              {status === 'read' && <DoubleCheckIcon size={14} color={theme.colors.accent.primary} />}
              {pinned && <PinIcon size={12} color={colors.textMuted} />}
              {muted && <MuteIcon size={12} color={colors.textMuted} />}
              {hasUnread && (
                <View style={unreadBadgeStyle}>
                  <Text style={unreadBadgeTextStyle}>
                    {unreadCount > 99 ? '99+' : String(unreadCount)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

ConversationListItem.displayName = 'ConversationListItem';
