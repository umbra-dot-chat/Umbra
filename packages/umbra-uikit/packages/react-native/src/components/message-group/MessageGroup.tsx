/**
 * @module components/message-group
 * @description React Native MessageGroup for the Wisp design system.
 *
 * Groups consecutive chat bubbles from the same sender with avatar beside
 * bubbles and sender name above. Renders timestamp/status once below the group.
 */

import React, { forwardRef, useMemo, Children, isValidElement, cloneElement } from 'react';
import { View, Text } from 'react-native';
import type { ViewProps, ViewStyle, TextStyle } from 'react-native';
import type { ChatBubbleAlignment, ChatBubbleStatus } from '@coexist/wisp-core/types/ChatBubble.types';
import { ChatBubble, StatusIcon } from '../chat-bubble/ChatBubble';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageGroupProps extends ViewProps {
  children: React.ReactNode;
  align?: ChatBubbleAlignment;
  sender?: string;
  avatar?: React.ReactNode;
  timestamp?: string;
  status?: ChatBubbleStatus;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MessageGroup = forwardRef<View, MessageGroupProps>(function MessageGroup(
  {
    children,
    align = 'incoming',
    sender,
    avatar,
    timestamp,
    status,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const isOutgoing = align === 'outgoing';

  const groupStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'column',
    alignItems: isOutgoing ? 'flex-end' : 'flex-start',
    gap: defaultSpacing['2xs'],
  }), [isOutgoing]);

  const senderNameStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.sm.fontSize,
    lineHeight: 18,
    fontWeight: defaultTypography.weights.semibold,
    color: themeColors.text.secondary,
    marginBottom: defaultSpacing.xs,
  }), [themeColors]);

  const contentRowStyle = useMemo<ViewStyle>(() => ({
    flexDirection: isOutgoing ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    gap: defaultSpacing.sm,
  }), [isOutgoing]);

  const bubblesStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'column',
    alignItems: isOutgoing ? 'flex-end' : 'flex-start',
    gap: defaultSpacing.xs,
  }), [isOutgoing]);

  const footerStyle = useMemo<ViewStyle>(() => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: defaultSpacing.xs,
    marginTop: defaultSpacing.xs,
    justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
  }), [isOutgoing]);

  const timestampStyle = useMemo<TextStyle>(() => ({
    fontSize: defaultTypography.sizes.xs.fontSize,
    lineHeight: 14,
    color: themeColors.text.muted,
  }), [themeColors]);

  const showFooter = timestamp || status;

  // Inject _inGroup={true} into ChatBubble children only.
  const injectedChildren = useMemo(
    () =>
      Children.map(children, (child) => {
        if (isValidElement(child) && child.type === ChatBubble) {
          return cloneElement(child as React.ReactElement<{ _inGroup?: boolean }>, {
            _inGroup: true,
          });
        }
        return child;
      }),
    [children],
  );

  return (
    <View ref={ref} style={[groupStyle, userStyle]} {...rest}>
      {/* Sender name above the content row */}
      {sender && <Text style={senderNameStyle}>{sender}</Text>}

      {/* Avatar + Bubbles side-by-side */}
      <View style={contentRowStyle}>
        {avatar}
        <View style={bubblesStyle}>
          {injectedChildren}
        </View>
      </View>

      {/* Group-level footer */}
      {showFooter && (
        <View style={footerStyle} testID="group-footer">
          {timestamp && <Text style={timestampStyle}>{timestamp}</Text>}
          {status && (
            <StatusIcon
              status={status}
              color={themeColors.text.muted}
              readColor="#0C0C0E"
            />
          )}
        </View>
      )}
    </View>
  );
});

MessageGroup.displayName = 'MessageGroup';
