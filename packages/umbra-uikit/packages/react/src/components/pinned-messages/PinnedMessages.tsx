/**
 * @module PinnedMessages
 * @description Panel listing all pinned messages in a channel or conversation.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { PinnedMessagesProps, PinnedMessage } from '@coexist/wisp-core/types/PinnedMessages.types';
import {
  resolvePinnedMessagesColors,
  buildPinnedMessagesContainerStyle,
  buildPinnedHeaderStyle,
  buildPinnedTitleStyle,
  buildPinnedCountStyle,
  buildPinnedCloseStyle,
  buildPinnedBodyStyle,
  buildPinnedCardStyle,
  buildPinnedCardHeaderStyle,
  buildPinnedCardSenderRowStyle,
  buildPinnedCardSenderStyle,
  buildPinnedCardTimestampStyle,
  buildPinnedCardContentStyle,
  buildPinnedCardFooterStyle,
  buildPinnedByStyle,
  buildUnpinButtonStyle,
  buildPinnedEmptyStyle,
  buildPinnedLoadingStyle,
} from '@coexist/wisp-core/styles/PinnedMessages.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function CloseIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PinIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Default Avatar
// ---------------------------------------------------------------------------

function DefaultAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#333',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 11,
      fontWeight: 600,
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PinnedMessages
// ---------------------------------------------------------------------------

/**
 * PinnedMessages — Panel listing all pinned messages in a channel.
 *
 * @remarks
 * Displays a scrollable list of pinned message cards with sender info,
 * content preview, timestamp, and unpin action. Supports empty and
 * loading states.
 *
 * @example
 * ```tsx
 * <PinnedMessages
 *   messages={pinnedMessages}
 *   onClose={() => setOpen(false)}
 *   onMessageClick={(msg) => scrollToMessage(msg.id)}
 *   onUnpin={(msg) => unpinMessage(msg.id)}
 * />
 * ```
 */
export const PinnedMessages = forwardRef<HTMLDivElement, PinnedMessagesProps>(
  function PinnedMessages(
    {
      messages,
      onClose,
      onMessageClick,
      onUnpin,
      title = 'Pinned Messages',
      loading = false,
      emptyText = 'No pinned messages',
      emptyIcon,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolvePinnedMessagesColors(theme),
      [theme],
    );

    const containerStyle = useMemo(
      () => buildPinnedMessagesContainerStyle(colors, theme),
      [colors, theme],
    );

    const headerStyle = useMemo(
      () => buildPinnedHeaderStyle(colors, theme),
      [colors, theme],
    );

    const titleStyle = useMemo(
      () => buildPinnedTitleStyle(colors, theme),
      [colors, theme],
    );

    const countStyle = useMemo(
      () => buildPinnedCountStyle(colors, theme),
      [colors, theme],
    );

    const closeStyle = useMemo(
      () => buildPinnedCloseStyle(colors, theme),
      [colors, theme],
    );

    const bodyStyle = useMemo(
      () => buildPinnedBodyStyle(theme),
      [theme],
    );

    const cardStyle = useMemo(
      () => buildPinnedCardStyle(colors, theme),
      [colors, theme],
    );

    const cardHeaderStyle = useMemo(
      () => buildPinnedCardHeaderStyle(),
      [],
    );

    const senderRowStyle = useMemo(
      () => buildPinnedCardSenderRowStyle(),
      [],
    );

    const senderStyle = useMemo(
      () => buildPinnedCardSenderStyle(colors, theme),
      [colors, theme],
    );

    const timestampStyle = useMemo(
      () => buildPinnedCardTimestampStyle(colors, theme),
      [colors, theme],
    );

    const contentStyle = useMemo(
      () => buildPinnedCardContentStyle(colors, theme),
      [colors, theme],
    );

    const footerStyle = useMemo(
      () => buildPinnedCardFooterStyle(),
      [],
    );

    const pinnedByStyle = useMemo(
      () => buildPinnedByStyle(colors, theme),
      [colors, theme],
    );

    const unpinBtnStyle = useMemo(
      () => buildUnpinButtonStyle(colors, theme),
      [colors, theme],
    );

    const emptyStyle = useMemo(
      () => buildPinnedEmptyStyle(colors, theme),
      [colors, theme],
    );

    const loadingMsgStyle = useMemo(
      () => buildPinnedLoadingStyle(colors, theme),
      [colors, theme],
    );

    const handleMessageClick = useCallback(
      (msg: PinnedMessage) => {
        onMessageClick?.(msg);
      },
      [onMessageClick],
    );

    const handleUnpin = useCallback(
      (e: React.MouseEvent, msg: PinnedMessage) => {
        e.stopPropagation();
        onUnpin?.(msg);
      },
      [onUnpin],
    );

    return (
      <div
        ref={ref}
        role="complementary"
        aria-label={title}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={titleStyle}>{title}</span>
            {messages.length > 0 && (
              <span style={countStyle}>({messages.length})</span>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              aria-label="Close pinned messages"
              style={closeStyle}
              onClick={onClose}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Loading */}
          {loading && (
            <div style={loadingMsgStyle}>Loading pinned messages…</div>
          )}

          {/* Empty */}
          {!loading && messages.length === 0 && (
            <div style={emptyStyle}>
              {emptyIcon || <PinIcon size={32} color={colors.emptyText} />}
              <span>{emptyText}</span>
            </div>
          )}

          {/* Cards */}
          {!loading && messages.map((msg) => (
            <div
              key={msg.id}
              role="button"
              tabIndex={0}
              style={cardStyle}
              onClick={() => handleMessageClick(msg)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleMessageClick(msg);
                }
              }}
            >
              {/* Card header */}
              <div style={cardHeaderStyle}>
                <div style={senderRowStyle}>
                  {msg.avatar || <DefaultAvatar name={msg.sender} />}
                  <span style={senderStyle}>{msg.sender}</span>
                </div>
                <span style={timestampStyle}>{msg.timestamp}</span>
              </div>

              {/* Content */}
              <p style={contentStyle}>{msg.content}</p>

              {/* Footer */}
              {(msg.pinnedBy || onUnpin) && (
                <div style={footerStyle}>
                  {msg.pinnedBy && (
                    <span style={pinnedByStyle}>
                      Pinned by {msg.pinnedBy}
                    </span>
                  )}
                  {onUnpin && (
                    <button
                      type="button"
                      style={unpinBtnStyle}
                      onClick={(e) => handleUnpin(e, msg)}
                    >
                      Unpin
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

PinnedMessages.displayName = 'PinnedMessages';
