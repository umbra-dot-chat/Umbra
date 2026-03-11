/**
 * @module ConversationListItem
 * @description Rich conversation list item for messaging app sidebars.
 *
 * Shows avatar (with optional online dot), conversation name, last message
 * preview, timestamp, unread badge, and pinned/muted indicators.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { ConversationListItemProps } from '@coexist/wisp-core/types/ConversationListItem.types';
import {
  resolveConversationListItemColors,
  buildConversationListItemStyle,
  buildAvatarWrapperStyle,
  buildOnlineDotStyle,
  buildContentStyle,
  buildNameRowStyle,
  buildNameStyle,
  buildTimestampStyle,
  buildMessageRowStyle,
  buildLastMessageStyle,
  buildUnreadBadgeStyle,
  buildIndicatorStyle,
  buildConversationListItemSkeletonStyle,
  buildSkeletonCircleStyle,
  buildSkeletonLineStyle,
} from '@coexist/wisp-core/styles/ConversationListItem.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons for indicators
// ---------------------------------------------------------------------------

function PinIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}

function MuteIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" />
      <path d="M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ConversationListItem
// ---------------------------------------------------------------------------

/**
 * ConversationListItem — A rich list item for messaging app conversation sidebars.
 *
 * @remarks
 * Designed for sidebar conversation lists (Telegram, Discord, Slack, WhatsApp style).
 * Shows the conversation's avatar with optional online indicator, name, last message
 * preview, timestamp, unread count badge, and pinned/muted status indicators.
 *
 * @example
 * ```tsx
 * <ConversationListItem
 *   name="Alice"
 *   avatar={<Avatar src="..." size="md" />}
 *   lastMessage="Hey, want to grab lunch?"
 *   timestamp="2m ago"
 *   unreadCount={3}
 *   online
 * />
 * ```
 */
export const ConversationListItem = forwardRef<HTMLDivElement, ConversationListItemProps>(
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
      onClick,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveConversationListItemColors(active, theme),
      [active, theme],
    );

    // ------ Skeleton ------
    if (skeleton) {
      const skeletonContainerStyle = useMemo(
        () => buildConversationListItemSkeletonStyle(theme),
        [theme],
      );
      const skeletonCircle = useMemo(
        () => buildSkeletonCircleStyle(theme),
        [theme],
      );
      const skeletonLine1 = useMemo(
        () => buildSkeletonLineStyle('60%', theme),
        [theme],
      );
      const skeletonLine2 = useMemo(
        () => buildSkeletonLineStyle('40%', theme),
        [theme],
      );

      return (
        <div
          ref={ref}
          aria-hidden
          className={className}
          style={{ ...skeletonContainerStyle, ...userStyle }}
          {...rest}
        >
          <div style={skeletonCircle} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
            <div style={skeletonLine1} />
            <div style={skeletonLine2} />
          </div>
        </div>
      );
    }

    // ------ Normal render ------
    const containerStyle = useMemo(
      () => buildConversationListItemStyle(colors, disabled, theme),
      [colors, disabled, theme],
    );

    const avatarWrapperStyle = useMemo(() => buildAvatarWrapperStyle(), []);

    const onlineDotStyle = useMemo(
      () => (online ? buildOnlineDotStyle(colors, theme) : undefined),
      [online, colors, theme],
    );

    const contentStyle = useMemo(() => buildContentStyle(), []);
    const nameRowStyle = useMemo(() => buildNameRowStyle(), []);

    const hasUnread = unreadCount > 0;

    const nameStyle = useMemo(
      () => buildNameStyle(colors, hasUnread, theme),
      [colors, hasUnread, theme],
    );

    const tsStyle = useMemo(
      () => buildTimestampStyle(colors, theme),
      [colors, theme],
    );

    const messageRowStyle = useMemo(() => buildMessageRowStyle(), []);

    const lastMsgStyle = useMemo(
      () => buildLastMessageStyle(colors, hasUnread, theme),
      [colors, hasUnread, theme],
    );

    const unreadBadgeStyle = useMemo(
      () => (hasUnread ? buildUnreadBadgeStyle(colors, theme) : undefined),
      [hasUnread, colors, theme],
    );

    const indicatorStyle = useMemo(
      () => ((pinned || muted) ? buildIndicatorStyle(colors) : undefined),
      [pinned, muted, colors],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!disabled) onClick?.(e);
      },
      [disabled, onClick],
    );

    return (
      <div
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-selected={active || undefined}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as unknown as React.MouseEvent);
          }
        }}
        {...rest}
      >
        {/* Avatar */}
        <div style={avatarWrapperStyle}>
          {avatar}
          {online && <div style={onlineDotStyle} />}
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {/* Name + timestamp row */}
          <div style={nameRowStyle}>
            <span style={nameStyle}>{name}</span>
            {timestamp && <span style={tsStyle}>{timestamp}</span>}
          </div>

          {/* Last message + indicators row */}
          <div style={messageRowStyle}>
            {lastMessage && <span style={lastMsgStyle}>{lastMessage}</span>}

            {/* Right-side indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {/* Indicators (pinned / muted) */}
              {indicatorStyle && (
                <span style={indicatorStyle}>
                  {pinned && <PinIcon size={12} color={colors.textMuted} />}
                  {muted && <MuteIcon size={12} color={colors.textMuted} />}
                </span>
              )}

              {/* Unread badge */}
              {hasUnread && (
                <span style={unreadBadgeStyle}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ConversationListItem.displayName = 'ConversationListItem';
