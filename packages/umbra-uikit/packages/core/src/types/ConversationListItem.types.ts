/**
 * @module types/ConversationListItem
 * @description Type definitions for the ConversationListItem component —
 * a rich list item for messaging app conversation sidebars.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the ConversationListItem component.
 *
 * @remarks
 * Used inside a Sidebar to represent a chat conversation. Shows an avatar,
 * name, last message preview, timestamp, unread count, and status indicators
 * (online, pinned, muted).
 */
export interface ConversationListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Display name of the conversation (user or group name). */
  name: string;

  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;

  /** Last message preview text (truncated to one line). */
  lastMessage?: string;

  /** Timestamp string (e.g. "2m ago", "Yesterday", "3:42 PM"). */
  timestamp?: string;

  /** Number of unread messages. Shows a badge when > 0. */
  unreadCount?: number;

  /** Whether the user is currently online (shows a green dot). */
  online?: boolean;

  /** Whether this conversation is pinned. */
  pinned?: boolean;

  /** Whether this conversation is muted. */
  muted?: boolean;

  /** Whether this item is currently selected / active. */
  active?: boolean;

  /** Whether the item is disabled. @default false */
  disabled?: boolean;

  /** Called when the item is clicked. */
  onClick?: (e: React.MouseEvent) => void;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;
}
