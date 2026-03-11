/**
 * @module MessageActionBar
 * @description Floating action bar shown on message hover/long-press.
 */
import React, { forwardRef, useMemo, useCallback } from 'react';
import type { MessageActionBarProps, MessageAction } from '@coexist/wisp-core/types/MessageActionBar.types';
import {
  resolveMessageActionBarColors,
  buildMessageActionBarContainerStyle,
  buildMessageActionButtonStyle,
  buildMessageActionSeparatorStyle,
} from '@coexist/wisp-core/styles/MessageActionBar.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Inline SVG icons
// ---------------------------------------------------------------------------

function SmileIcon({ size = 16, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// MessageActionBar
// ---------------------------------------------------------------------------

/**
 * MessageActionBar — A compact, floating bar of icon buttons for message actions.
 *
 * @remarks
 * Shown on hover (desktop) or long-press (mobile) above a chat message.
 * Provides quick actions like reply, react, forward, pin, and delete.
 * Similar to Discord's message action bar and Slack's message shortcuts.
 *
 * @example
 * ```tsx
 * <MessageActionBar
 *   actions={[
 *     { key: 'reply', label: 'Reply', icon: <ReplyIcon />, onClick: handleReply },
 *     { key: 'forward', label: 'Forward', icon: <ForwardIcon />, onClick: handleForward },
 *     { key: 'pin', label: 'Pin', icon: <PinIcon />, onClick: handlePin },
 *     { key: 'delete', label: 'Delete', icon: <TrashIcon />, onClick: handleDelete, destructive: true },
 *   ]}
 *   showEmojiReact
 *   onEmojiReactClick={openEmojiPicker}
 * />
 * ```
 */
export const MessageActionBar = forwardRef<HTMLDivElement, MessageActionBarProps>(
  function MessageActionBar(
    {
      actions,
      position = 'top-right',
      showEmojiReact = false,
      onEmojiReactClick,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const colors = useMemo(
      () => resolveMessageActionBarColors(theme),
      [theme],
    );

    const containerStyle = useMemo(
      () => buildMessageActionBarContainerStyle(colors, position, theme),
      [colors, position, theme],
    );

    const separatorStyle = useMemo(
      () => buildMessageActionSeparatorStyle(colors),
      [colors],
    );

    return (
      <div
        ref={ref}
        role="toolbar"
        aria-label="Message actions"
        className={className}
        style={{ ...containerStyle, ...userStyle }}
        {...rest}
      >
        {/* Emoji react button */}
        {showEmojiReact && (
          <>
            <ActionButton
              action={{
                key: '__emoji_react',
                label: 'Add reaction',
                icon: <SmileIcon size={16} />,
                onClick: () => onEmojiReactClick?.(),
              }}
              colors={colors}
              theme={theme}
            />
            {actions.length > 0 && <div style={separatorStyle} />}
          </>
        )}

        {/* Action buttons */}
        {actions.map((action) => (
          <ActionButton
            key={action.key}
            action={action}
            colors={colors}
            theme={theme}
          />
        ))}
      </div>
    );
  },
);

MessageActionBar.displayName = 'MessageActionBar';

// ---------------------------------------------------------------------------
// ActionButton (internal)
// ---------------------------------------------------------------------------

function ActionButton({
  action,
  colors,
  theme,
}: {
  action: MessageAction;
  colors: ReturnType<typeof resolveMessageActionBarColors>;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const style = useMemo(
    () => buildMessageActionButtonStyle(
      colors,
      action.destructive ?? false,
      action.disabled ?? false,
      theme,
    ),
    [colors, action.destructive, action.disabled, theme],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!action.disabled) action.onClick();
    },
    [action],
  );

  return (
    <button
      type="button"
      aria-label={action.label}
      title={action.label}
      disabled={action.disabled}
      onClick={handleClick}
      style={style}
    >
      {action.icon}
    </button>
  );
}
