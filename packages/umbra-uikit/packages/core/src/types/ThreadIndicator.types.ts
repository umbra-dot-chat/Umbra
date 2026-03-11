/**
 * @module types/ThreadIndicator
 * @description Type definitions for the ThreadIndicator component —
 * inline indicator on messages showing thread reply count and participants.
 */

import type React from 'react';

export interface ThreadIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of replies in the thread. */
  replyCount: number;
  /** Participant avatar elements (show up to 3). */
  participantAvatars?: React.ReactNode[];
  /** Last reply timestamp text. */
  lastReplyAt?: string;
  /** Called when the indicator is clicked (open thread). */
  onClick?: () => void;
  /** Whether this thread has unread replies. @default false */
  hasUnread?: boolean;
}
