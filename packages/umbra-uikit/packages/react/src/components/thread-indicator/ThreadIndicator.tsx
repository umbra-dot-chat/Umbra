/**
 * @module ThreadIndicator
 * @description A compact indicator on messages that have threads,
 * showing reply count and participant avatars.
 */

import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { ThreadIndicatorProps } from '@coexist/wisp-core/types/ThreadIndicator.types';
import {
  buildThreadIndicatorContainerStyle,
  buildAvatarStackStyle,
  buildAvatarItemStyle,
  buildReplyCountStyle,
  buildTimestampStyle,
  buildIconStyle,
} from '@coexist/wisp-core/styles/ThreadIndicator.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icon — MessageSquare
// ---------------------------------------------------------------------------

function MessageSquareIcon({ size = 14, color }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ThreadIndicator
// ---------------------------------------------------------------------------

/**
 * ThreadIndicator — A compact inline indicator on messages that have threads.
 *
 * @remarks
 * Displays overlapping participant avatars (max 3), a reply count, and
 * an optional last-reply timestamp. Clicking the indicator opens the thread.
 * When `hasUnread` is true, the reply count text uses the accent color.
 *
 * @example
 * ```tsx
 * <ThreadIndicator
 *   replyCount={5}
 *   participantAvatars={[<Avatar size="xs" name="Alice" />, <Avatar size="xs" name="Bob" />]}
 *   lastReplyAt="2 min ago"
 *   hasUnread
 *   onClick={() => openThread(threadId)}
 * />
 * ```
 */
export const ThreadIndicator = forwardRef<HTMLDivElement, ThreadIndicatorProps>(
  function ThreadIndicator(
    {
      replyCount,
      participantAvatars,
      lastReplyAt,
      onClick,
      hasUnread = false,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const [hovered, setHovered] = useState(false);

    const containerStyle = useMemo(
      () => buildThreadIndicatorContainerStyle(theme, hovered),
      [theme, hovered],
    );

    const avatarStackStyle = useMemo(() => buildAvatarStackStyle(), []);

    const replyCountStyle = useMemo(
      () => buildReplyCountStyle(hasUnread, theme),
      [hasUnread, theme],
    );

    const timestampStyle = useMemo(
      () => buildTimestampStyle(theme),
      [theme],
    );

    const iconStyle = useMemo(
      () => buildIconStyle(hasUnread, theme),
      [hasUnread, theme],
    );

    const handleMouseEnter = useCallback(() => setHovered(true), []);
    const handleMouseLeave = useCallback(() => setHovered(false), []);

    const visibleAvatars = participantAvatars?.slice(0, 3);
    const replyText = replyCount === 1 ? '1 reply' : `${replyCount} replies`;

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        role="button"
        tabIndex={0}
        aria-label={`Thread: ${replyText}`}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.();
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...rest}
      >
        {/* Icon */}
        <span style={iconStyle}>
          <MessageSquareIcon size={14} color="currentColor" />
        </span>

        {/* Avatar stack */}
        {visibleAvatars && visibleAvatars.length > 0 && (
          <span style={avatarStackStyle}>
            {visibleAvatars.map((avatar, i) => (
              <span key={i} style={buildAvatarItemStyle(i, theme)}>
                {avatar}
              </span>
            ))}
          </span>
        )}

        {/* Reply count */}
        <span style={replyCountStyle} data-testid="thread-reply-count">
          {replyText}
        </span>

        {/* Timestamp */}
        {lastReplyAt && (
          <span style={timestampStyle} data-testid="thread-timestamp">
            {lastReplyAt}
          </span>
        )}
      </div>
    );
  },
);

ThreadIndicator.displayName = 'ThreadIndicator';
