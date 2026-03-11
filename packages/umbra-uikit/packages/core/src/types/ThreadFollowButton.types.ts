/**
 * @module types/ThreadFollowButton
 * @description Type definitions for the ThreadFollowButton component —
 * toggle button to follow/unfollow a thread.
 */

import type React from 'react';

export interface ThreadFollowButtonProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Whether the user is currently following. */
  isFollowing: boolean;
  /** Called when the button is clicked. */
  onToggle?: () => void;
  /** Size variant. @default 'sm' */
  size?: 'sm' | 'md';
  /** Whether the button is disabled. @default false */
  disabled?: boolean;
  /** Label when following. @default 'Following' */
  followingLabel?: string;
  /** Label when not following. @default 'Follow' */
  followLabel?: string;
}
