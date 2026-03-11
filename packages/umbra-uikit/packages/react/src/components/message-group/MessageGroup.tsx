/**
 * @module MessageGroup
 */
import React, { forwardRef, useMemo, Children, isValidElement, cloneElement } from 'react';
import type { MessageGroupProps } from '@coexist/wisp-core/types/MessageGroup.types';
import type { ChatBubbleStatus } from '@coexist/wisp-core/types/ChatBubble.types';
import {
  buildMessageGroupStyle,
  buildSenderNameStyle,
  buildContentRowStyle,
  buildBubblesContainerStyle,
  buildGroupFooterStyle,
  buildGroupTimestampStyle,
  buildGroupStatusStyle,
} from '@coexist/wisp-core/styles/MessageGroup.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';
import { StatusIcon, ChatBubble } from '../chat-bubble/ChatBubble';

/**
 * MessageGroup — Groups consecutive chat bubbles from the same sender.
 *
 * @remarks
 * Key features:
 * - Displays avatar and sender name once at the top of the group.
 * - Stacks child `<ChatBubble>` elements with tight vertical spacing.
 * - Renders timestamp and delivery status once below the entire group.
 * - Automatically injects `_inGroup` into child ChatBubbles so they
 *   suppress their own footers.
 * - Supports `incoming` (left-aligned) and `outgoing` (right-aligned) layouts.
 *
 * @example
 * ```tsx
 * <MessageGroup
 *   align="incoming"
 *   sender="Alice"
 *   avatar={<Avatar name="Alice" size="sm" />}
 *   timestamp="2:30 PM"
 * >
 *   <ChatBubble align="incoming">Hey there!</ChatBubble>
 *   <ChatBubble align="incoming">How's the project going?</ChatBubble>
 * </MessageGroup>
 * ```
 */
export const MessageGroup = forwardRef<HTMLDivElement, MessageGroupProps>(
  function MessageGroup(
    {
      align = 'incoming',
      sender,
      avatar,
      timestamp,
      status,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
  const themeColors = theme.colors;

    const groupStyle = useMemo(
      () => buildMessageGroupStyle(align, theme),
      [align, theme],
    );

    const senderNameStyle = useMemo(
      () => buildSenderNameStyle(theme),
      [theme],
    );

    const contentRowStyle = useMemo(
      () => buildContentRowStyle(align, theme),
      [align, theme],
    );

    const bubblesStyle = useMemo(
      () => buildBubblesContainerStyle(align, theme),
      [align, theme],
    );

    const footerStyle = useMemo(
      () => buildGroupFooterStyle(align, theme),
      [align, theme],
    );

    const timestampStyle = useMemo(
      () => buildGroupTimestampStyle(theme),
      [theme],
    );

    const statusIconStyle = useMemo(
      () => buildGroupStatusStyle(theme),
      [theme],
    );

    const showFooter = timestamp || status;

    // Inject _inGroup={true} into each child ChatBubble so it suppresses
    // its own footer rendering. Only inject into ChatBubble elements to
    // avoid passing unknown props to native DOM elements.
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
      <div
        ref={ref}
        className={className}
        style={{ ...groupStyle, ...userStyle }}
        {...rest}
      >
        {/* Sender name above the content row */}
        {sender && <Text style={senderNameStyle}>{sender}</Text>}

        {/* Avatar + Bubbles side-by-side */}
        <div style={contentRowStyle}>
          {avatar}
          <div style={bubblesStyle}>
            {injectedChildren}
          </div>
        </div>

        {/* Group-level footer: timestamp + status */}
        {showFooter && (
          <div style={footerStyle} data-testid="group-footer">
            {timestamp && <Text style={timestampStyle}>{timestamp}</Text>}
            {status && (
              <span style={statusIconStyle}>
                <StatusIcon
                  status={status}
                  color={themeColors.text.muted}
                  readColor={'#0C0C0E'}
                />
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

MessageGroup.displayName = 'MessageGroup';
