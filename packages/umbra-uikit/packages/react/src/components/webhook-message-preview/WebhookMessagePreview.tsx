/**
 * @module WebhookMessagePreview
 */
import React, { forwardRef, useMemo } from 'react';
import type { WebhookMessagePreviewProps } from '@coexist/wisp-core/types/WebhookMessagePreview.types';
import {
  buildMessageContainerStyle,
  buildMessageAvatarStyle,
  buildMessageBodyStyle,
  buildMessageHeaderStyle,
  buildMessageNameStyle,
  buildBotBadgeStyle,
  buildMessageTimestampStyle,
  buildMessageContentStyle,
  buildReactionsRowStyle,
  buildReactionChipStyle,
} from '@coexist/wisp-core/styles/WebhookMessagePreview.styles';
import { useTheme } from '../../providers';

/**
 * WebhookMessagePreview — Renders messages posted by webhooks with a
 * purple "BOT" badge next to the sender name.
 *
 * @remarks
 * Styled similarly to a chat message but with a distinctive BOT badge.
 * Supports media attachments and emoji reactions.
 *
 * @example
 * ```tsx
 * <WebhookMessagePreview
 *   webhookName="GitHub"
 *   content="New commit pushed to main branch."
 *   timestamp="Today at 3:45 PM"
 * />
 * ```
 */
export const WebhookMessagePreview = forwardRef<HTMLDivElement, WebhookMessagePreviewProps>(
  function WebhookMessagePreview(
    {
      webhookName,
      webhookAvatar,
      content,
      timestamp,
      media,
      reactions,
      onReactionClick,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const containerStyle = useMemo(() => buildMessageContainerStyle(theme), [theme]);
    const avatarStyle = useMemo(() => buildMessageAvatarStyle(theme), [theme]);
    const bodyStyle = useMemo(() => buildMessageBodyStyle(), []);
    const headerStyle = useMemo(() => buildMessageHeaderStyle(), []);
    const nameStyle = useMemo(() => buildMessageNameStyle(theme), [theme]);
    const badgeStyle = useMemo(() => buildBotBadgeStyle(), []);
    const timestampStyle = useMemo(() => buildMessageTimestampStyle(theme), [theme]);
    const contentStyle = useMemo(() => buildMessageContentStyle(theme), [theme]);
    const reactionsRowStyle = useMemo(() => buildReactionsRowStyle(), []);

    return (
      <div
        ref={ref}
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Avatar */}
        <div style={avatarStyle}>
          {webhookAvatar || (
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.colors.text.muted,
              }}
            >
              {webhookName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Body */}
        <div style={bodyStyle}>
          {/* Header row */}
          <div style={headerStyle}>
            <span style={nameStyle}>{webhookName}</span>
            <span style={badgeStyle}>BOT</span>
            {timestamp && <span style={timestampStyle}>{timestamp}</span>}
          </div>

          {/* Content */}
          <p style={contentStyle}>{content}</p>

          {/* Media */}
          {media && <div style={{ marginTop: 4 }}>{media}</div>}

          {/* Reactions */}
          {reactions && reactions.length > 0 && (
            <div style={reactionsRowStyle}>
              {reactions.map((reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() => onReactionClick?.(reaction.emoji)}
                  style={buildReactionChipStyle(theme, reaction.reacted ?? false)}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  },
);

WebhookMessagePreview.displayName = 'WebhookMessagePreview';
