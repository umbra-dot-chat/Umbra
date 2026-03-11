/**
 * @module components/thread-indicator
 * @description React Native ThreadIndicator for the Wisp design system.
 *
 * Compact indicator on messages showing thread reply count and participants.
 */

import React, { forwardRef, useMemo } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { defaultSpacing, defaultRadii, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ThreadIndicatorProps extends ViewProps {
  /** Number of replies in the thread. */
  replyCount: number;
  /** Participant avatar elements (show up to 3). */
  participantAvatars?: React.ReactNode[];
  /** Last reply timestamp text. */
  lastReplyAt?: string;
  /** Called when the indicator is pressed (open thread). */
  onPress?: () => void;
  /** Whether this thread has unread replies. @default false */
  hasUnread?: boolean;
}

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

function MessageSquareIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// ThreadIndicator
// ---------------------------------------------------------------------------

export const ThreadIndicator = forwardRef<View, ThreadIndicatorProps>(
  function ThreadIndicator(
    {
      replyCount,
      participantAvatars,
      lastReplyAt,
      onPress,
      hasUnread = false,
      style: userStyle,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const tc = theme.colors;

    const containerStyle = useMemo<ViewStyle>(() => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: defaultSpacing.sm,
      paddingVertical: defaultSpacing.xs,
      paddingHorizontal: defaultSpacing.sm,
      borderRadius: defaultRadii.md,
      borderWidth: 1,
      borderColor: tc.border.subtle,
    }), [tc]);

    const visibleAvatars = participantAvatars?.slice(0, 3);
    const replyText = replyCount === 1 ? '1 reply' : `${replyCount} replies`;

    const replyCountTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      fontWeight: hasUnread ? '600' : '500',
      color: hasUnread ? tc.accent.primary : tc.text.link,
    }), [hasUnread, tc]);

    const timestampTextStyle = useMemo<TextStyle>(() => ({
      fontSize: defaultTypography.sizes.xs.fontSize,
      lineHeight: defaultTypography.sizes.xs.lineHeight,
      color: tc.text.muted,
    }), [tc]);

    const iconColor = hasUnread ? tc.accent.primary : tc.text.link;

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Thread: ${replyText}`}
        style={[containerStyle, userStyle as ViewStyle]}
        {...rest}
      >
        {/* Icon */}
        <MessageSquareIcon size={14} color={iconColor} />

        {/* Avatar stack */}
        {visibleAvatars && visibleAvatars.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {visibleAvatars.map((avatar, i) => (
              <View
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: tc.background.surface,
                  marginLeft: i > 0 ? -8 : 0,
                  zIndex: 3 - i,
                }}
              >
                {avatar}
              </View>
            ))}
          </View>
        )}

        {/* Reply count */}
        <RNText style={replyCountTextStyle}>{replyText}</RNText>

        {/* Timestamp */}
        {lastReplyAt ? <RNText style={timestampTextStyle}>{lastReplyAt}</RNText> : null}
      </Pressable>
    );
  },
);

ThreadIndicator.displayName = 'ThreadIndicator';
