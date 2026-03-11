/**
 * @module types/ThreadListView
 * @description Type definitions for the ThreadListView component —
 * list of active threads in a channel.
 */

import type React from 'react';

export interface ThreadListItem {
  /** Thread ID. */
  id: string;
  /** Thread name (if named). */
  name?: string;
  /** Parent message preview text. */
  parentPreview: string;
  /** Parent message sender. */
  parentSender: string;
  /** Parent sender avatar. */
  parentAvatar?: React.ReactNode;
  /** Number of replies. */
  replyCount: number;
  /** Last activity timestamp. */
  lastActivityAt: string;
  /** Whether the current user is following this thread. */
  isFollowing?: boolean;
  /** Whether there are unread messages. */
  hasUnread?: boolean;
}

export interface ThreadListViewProps extends React.HTMLAttributes<HTMLDivElement> {
  /** List of threads to display. */
  threads: ThreadListItem[];
  /** Called when a thread is clicked (open thread). */
  onThreadClick?: (threadId: string) => void;
  /** Called when follow/unfollow is toggled on a thread. */
  onFollowToggle?: (threadId: string) => void;
  /** Title. @default 'Threads' */
  title?: string;
  /** Called when close is clicked. */
  onClose?: () => void;
  /** Empty state text. @default 'No threads yet' */
  emptyText?: string;
  /** Loading state. @default false */
  loading?: boolean;
  /** Skeleton state. @default false */
  skeleton?: boolean;
}
