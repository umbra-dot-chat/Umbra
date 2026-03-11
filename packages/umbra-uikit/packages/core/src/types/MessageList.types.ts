/**
 * @module types/MessageList
 * @description Type definitions for the MessageList component —
 * scrollable message feed with infinite scroll and day separators.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Supporting types
// ---------------------------------------------------------------------------

/** A message item in the list. */
export interface MessageListItem {
  /** Unique message ID. */
  id: string;
  /** Sender display name. */
  sender: string;
  /** Sender avatar element. */
  avatar?: React.ReactNode;
  /** Message text content (string or React node for rich content). */
  content: string | React.ReactNode;
  /** Timestamp (ISO string or epoch ms for grouping). */
  timestamp: string;
  /** Whether this message is from the current user. */
  isOwn?: boolean;
  /** Sender's name color (for role colors). */
  senderColor?: string;
  /** Whether this message is a system message. */
  system?: boolean;
  /** Thread info for this message. */
  threadInfo?: {
    replyCount: number;
    lastReplyAt?: string;
    onClick?: () => void;
  };
  /** Reactions on this message. */
  reactions?: Array<{ emoji: string; count: number; reacted?: boolean }>;
  /** Reply-to metadata. */
  replyTo?: { sender: string; text: string; onClick?: () => void };
  /** Whether this message has been edited. */
  edited?: boolean;
  /** Media content slot. */
  media?: React.ReactNode;
}

/** A day separator entry. */
export interface DaySeparator {
  /** Type discriminator. */
  type: 'separator';
  /** Date label (e.g. "Today", "Yesterday", "January 15, 2025"). */
  label: string;
}

/** A new message divider entry. */
export interface NewMessageMarker {
  /** Type discriminator. */
  type: 'new-messages';
  /** Label text. @default 'New Messages' */
  label?: string;
}

/** Union of all list items. */
export type MessageListEntry =
  | ({ type: 'message' } & MessageListItem)
  | DaySeparator
  | NewMessageMarker;

// ---------------------------------------------------------------------------
// Display mode
// ---------------------------------------------------------------------------

/** Message display mode — bubble (chat bubbles, own-right alignment) or inline (left-aligned, no bubbles). */
export type MessageDisplayMode = 'bubble' | 'inline';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MessageListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Ordered list of entries (messages, separators, markers). */
  entries: MessageListEntry[];

  /** Message display mode. @default 'bubble' */
  displayMode?: MessageDisplayMode;

  /** Called when the user scrolls to the top (load older messages). */
  onLoadMore?: () => void;

  /** Whether older messages are being loaded. @default false */
  loadingMore?: boolean;

  /** Whether there are more messages to load. @default false */
  hasMore?: boolean;

  /** Called when a message's reaction is clicked. */
  onReactionClick?: (messageId: string, emoji: string) => void;

  /** Custom renderer for message items. Overrides default ChatBubble rendering. */
  renderMessage?: (message: MessageListItem) => React.ReactNode;

  /** Whether to auto-scroll to the bottom when new messages arrive. @default true */
  autoScrollToBottom?: boolean;

  /** Show a "scroll to bottom" button when scrolled up. @default true */
  showScrollToBottom?: boolean;

  /** Called when the scroll-to-bottom button is clicked. */
  onScrollToBottom?: () => void;

  /** Show loading skeleton for the entire list. @default false */
  skeleton?: boolean;

  /** Empty state content shown when entries is empty. */
  emptyContent?: React.ReactNode;
}
