/**
 * @module ChatBubble
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type {
  ChatBubbleProps,
  ChatBubbleStatus,
  ChatBubbleReaction,
} from '@coexist/wisp-core/types/ChatBubble.types';
import {
  resolveChatBubbleColors,
  buildChatBubbleStyle,
  buildFooterStyle,
  buildTimestampStyle,
  buildStatusStyle,
  buildReactionsContainerStyle,
  buildReactionChipStyle,
  buildReplyToStyle,
  buildForwardedStyle,
  buildMediaSlotStyle,
  buildHighlightStyle,
} from '@coexist/wisp-core/styles/ChatBubble.styles';
import { useTheme } from '../../providers';
import { Text } from '../../primitives';

// ---------------------------------------------------------------------------
// Inline SVG status icons
// ---------------------------------------------------------------------------

function CheckIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CheckCheckIcon({ size = 12, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-9.5 9.5L10 17" />
    </svg>
  );
}

/** @internal Status icon used by ChatBubble and MessageGroup. */
export function StatusIcon({ status, color, readColor }: { status: ChatBubbleStatus; color: string; readColor: string }) {
  switch (status) {
    case 'sent':
      return <CheckIcon color={color} />;
    case 'delivered':
      return <CheckCheckIcon color={color} />;
    case 'read':
      return <CheckCheckIcon color={readColor} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// ChatBubble
// ---------------------------------------------------------------------------

/**
 * ChatBubble — A styled message bubble for chat interfaces.
 *
 * @remarks
 * Key features:
 * - iMessage / WhatsApp style with one sharp corner indicating direction.
 * - `incoming` messages have a sharp bottom-left corner (left-aligned).
 * - `outgoing` messages have a sharp bottom-right corner (right-aligned).
 * - Optional timestamp, delivery status, and emoji reactions.
 * - Two variants: `default` (theme surface) and `accent` (brand color).
 *
 * @example
 * ```tsx
 * <ChatBubble align="outgoing" variant="accent" timestamp="2:34 PM" status="read">
 *   Hey! How's it going?
 * </ChatBubble>
 *
 * <ChatBubble
 *   align="incoming"
 *   timestamp="2:35 PM"
 *   reactions={[{ emoji: '👍', count: 2, reacted: true }]}
 * >
 *   Pretty good, thanks!
 * </ChatBubble>
 * ```
 */
export const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(
  function ChatBubble(
    {
      align = 'incoming',
      variant = 'default',
      timestamp,
      status,
      reactions,
      onReactionClick,
      replyTo,
      forwarded,
      edited = false,
      highlighted = false,
      media,
      senderColor,
      _inGroup = false,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveChatBubbleColors(align, variant, theme),
      [align, variant, theme],
    );

    const bubbleStyle = useMemo(
      () => buildChatBubbleStyle(align, colors, theme),
      [align, colors, theme],
    );

    const footerStyle = useMemo(
      () => buildFooterStyle(align, theme),
      [align, theme],
    );

    const timestampStyle = useMemo(
      () => buildTimestampStyle(colors, theme),
      [colors, theme],
    );

    const statusIconStyle = useMemo(
      () => buildStatusStyle(colors),
      [colors],
    );

    const reactionsContainerStyle = useMemo(
      () => buildReactionsContainerStyle(theme),
      [theme],
    );

    const replyToStyles = useMemo(
      () => (replyTo ? buildReplyToStyle(colors, theme, senderColor) : undefined),
      [replyTo, colors, theme, senderColor],
    );

    const forwardedLabelStyle = useMemo(
      () => (forwarded ? buildForwardedStyle(colors, theme) : undefined),
      [forwarded, colors, theme],
    );

    // Media is "first" when there's nothing above it (no forwarded label, no reply preview)
    const mediaIsFirst = !forwarded && !replyTo;

    const mediaSlotStyle = useMemo(
      () => (media ? buildMediaSlotStyle(theme, mediaIsFirst) : undefined),
      [media, theme, mediaIsFirst],
    );

    const highlightStyle = useMemo(
      () => (highlighted ? buildHighlightStyle(theme) : undefined),
      [highlighted, theme],
    );

    const handleReactionClick = useCallback(
      (emoji: string) => {
        onReactionClick?.(emoji);
      },
      [onReactionClick],
    );

    // When in a group, the parent MessageGroup renders the footer instead.
    const showFooter = !_inGroup && (timestamp || status || edited);
    const hasReactions = reactions && reactions.length > 0;

    // Build the forwarded label text
    const forwardedLabel = forwarded
      ? typeof forwarded === 'object' && forwarded.from
        ? `Forwarded from ${forwarded.from}`
        : 'Forwarded'
      : null;

    const wrapperStyle: React.CSSProperties = {
      display: 'inline-flex',
      flexDirection: 'column',
      ...(highlighted ? highlightStyle : undefined),
    };

    return (
      <div ref={ref} className={className} style={wrapperStyle} {...rest}>
        {/* Bubble */}
        <div style={{ ...bubbleStyle, ...userStyle }}>
          {/* Forwarded label */}
          {forwardedLabel && (
            <div style={forwardedLabelStyle}>{forwardedLabel}</div>
          )}

          {/* Reply-to preview */}
          {replyTo && replyToStyles && (
            <div
              style={replyToStyles.container}
              onClick={replyTo.onClick}
              role={replyTo.onClick ? 'button' : undefined}
              tabIndex={replyTo.onClick ? 0 : undefined}
            >
              <span style={replyToStyles.sender}>{replyTo.sender}</span>
              <span style={replyToStyles.text}>{replyTo.text}</span>
            </div>
          )}

          {/* Media slot */}
          {media && <div style={mediaSlotStyle}>{media}</div>}

          {/* Text content */}
          <div style={{ color: colors.text }}>{children}</div>

          {/* Reactions live inside the bubble */}
          {hasReactions && (
            <div style={reactionsContainerStyle}>
              {reactions!.map((reaction) => (
                <ReactionChip
                  key={reaction.emoji}
                  reaction={reaction}
                  onClick={handleReactionClick}
                />
              ))}
            </div>
          )}
        </div>

        {/* Timestamp + Status footer rendered BELOW the bubble */}
        {showFooter && (
          <div style={footerStyle}>
            {timestamp && (
              <Text style={timestampStyle}>
                {timestamp}{edited ? ' (edited)' : ''}
              </Text>
            )}
            {!timestamp && edited && (
              <Text style={timestampStyle}>(edited)</Text>
            )}
            {status && (
              <span style={statusIconStyle}>
                <StatusIcon
                  status={status}
                  color={colors.timestamp}
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

ChatBubble.displayName = 'ChatBubble';

// ---------------------------------------------------------------------------
// ReactionChip (internal)
// ---------------------------------------------------------------------------

function ReactionChip({
  reaction,
  onClick,
}: {
  reaction: ChatBubbleReaction;
  onClick: (emoji: string) => void;
}) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const chipStyle = useMemo(
    () => buildReactionChipStyle(reaction.reacted ?? false, theme),
    [reaction.reacted, theme],
  );

  return (
    <button
      type="button"
      onClick={() => onClick(reaction.emoji)}
      style={chipStyle}
      aria-label={`${reaction.emoji} ${reaction.count}`}
    >
      <span>{reaction.emoji}</span>
      <span>{reaction.count}</span>
    </button>
  );
}
