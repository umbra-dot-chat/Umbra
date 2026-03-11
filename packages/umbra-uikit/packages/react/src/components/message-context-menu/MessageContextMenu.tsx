/**
 * @module MessageContextMenu
 * @description Right-click context menu for message actions.
 *
 * @remarks
 * Wraps the low-level ContextMenu primitives with a pre-configured set of
 * message actions (reply, edit, pin, copy, delete, etc.). The menu adapts
 * based on ownership, permissions, and pinned state.
 *
 * @example
 * ```tsx
 * <MessageContextMenu
 *   isOwn
 *   canPin
 *   canDelete
 *   onReply={() => {}}
 *   onEdit={() => {}}
 *   onDelete={() => {}}
 * >
 *   <ChatBubble>Hello world</ChatBubble>
 * </MessageContextMenu>
 * ```
 */
import React, { forwardRef, useMemo } from 'react';
import type { MessageContextMenuProps } from '@coexist/wisp-core/types/MessageContextMenu.types';
import { buildMessageContextMenuContainerStyle } from '@coexist/wisp-core/styles/MessageContextMenu.styles';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '../context-menu';
import { useTheme } from '../../providers';

export const MessageContextMenu = forwardRef<HTMLDivElement, MessageContextMenuProps>(
  function MessageContextMenu(
    {
      isOwn = false,
      canPin = false,
      canDelete = false,
      isPinned = false,
      children,
      onReply,
      onEdit,
      onDelete,
      onDeleteForMe,
      onPin,
      onUnpin,
      onCreateThread,
      onCopyText,
      onCopyLink,
      onReact,
      onForward,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();
    const themeColors = theme.colors;

    const containerStyle = useMemo(
      () => buildMessageContextMenuContainerStyle(),
      [],
    );

    const destructiveStyle = useMemo(
      () => ({ color: themeColors.status.danger }),
      [themeColors],
    );

    return (
      <div
        ref={ref}
        style={{ ...containerStyle, ...userStyle }}
        className={className}
        {...rest}
      >
        <ContextMenu>
          <ContextMenuTrigger>
            {children}
          </ContextMenuTrigger>

          <ContextMenuContent>
            {/* Reply */}
            {onReply && (
              <ContextMenuItem onSelect={onReply}>Reply</ContextMenuItem>
            )}

            {/* Edit (own messages only) */}
            {isOwn && onEdit && (
              <ContextMenuItem onSelect={onEdit}>Edit</ContextMenuItem>
            )}

            {/* React */}
            {onReact && (
              <ContextMenuItem onSelect={onReact}>React</ContextMenuItem>
            )}

            {/* Create Thread */}
            {onCreateThread && (
              <ContextMenuItem onSelect={onCreateThread}>Create Thread</ContextMenuItem>
            )}

            <ContextMenuSeparator />

            {/* Pin / Unpin */}
            {canPin && !isPinned && onPin && (
              <ContextMenuItem onSelect={onPin}>Pin Message</ContextMenuItem>
            )}
            {canPin && isPinned && onUnpin && (
              <ContextMenuItem onSelect={onUnpin}>Unpin Message</ContextMenuItem>
            )}

            {/* Copy Text */}
            {onCopyText && (
              <ContextMenuItem onSelect={onCopyText}>Copy Text</ContextMenuItem>
            )}

            {/* Copy Link */}
            {onCopyLink && (
              <ContextMenuItem onSelect={onCopyLink}>Copy Link</ContextMenuItem>
            )}

            {/* Forward */}
            {onForward && (
              <ContextMenuItem onSelect={onForward}>Forward</ContextMenuItem>
            )}

            <ContextMenuSeparator />

            {/* Delete For Me */}
            {onDeleteForMe && (
              <ContextMenuItem onSelect={onDeleteForMe}>Delete For Me</ContextMenuItem>
            )}

            {/* Delete (destructive) */}
            {canDelete && onDelete && (
              <ContextMenuItem onSelect={onDelete} destructive>
                Delete
              </ContextMenuItem>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>
    );
  },
);

MessageContextMenu.displayName = 'MessageContextMenu';
