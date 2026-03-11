/**
 * @module types/MessageContextMenu
 * @description Type definitions for the MessageContextMenu component —
 * right-click context menu for message actions.
 */

import type React from 'react';

export interface MessageContextMenuProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether this is the current user's message. */
  isOwn?: boolean;
  /** Whether the current user can pin messages. @default false */
  canPin?: boolean;
  /** Whether the current user can delete messages. @default false */
  canDelete?: boolean;
  /** Whether the message is already pinned. @default false */
  isPinned?: boolean;
  /** Children (the trigger element). */
  children: React.ReactElement;

  // Callbacks
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeleteForMe?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onCreateThread?: () => void;
  onCopyText?: () => void;
  onCopyLink?: () => void;
  onReact?: () => void;
  onForward?: () => void;
}
