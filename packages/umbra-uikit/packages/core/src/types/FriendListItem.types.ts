/**
 * @module types/FriendListItem
 * @description Type definitions for the FriendListItem component —
 * a list item displaying a friend's avatar, name, status, and quick actions.
 */

import type React from 'react';

// ---------------------------------------------------------------------------
// Friend status
// ---------------------------------------------------------------------------

export type FriendStatus = 'online' | 'idle' | 'dnd' | 'offline';

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------

/** An action shown on hover or at the trailing edge of the friend row. */
export interface FriendAction {
  /** Unique identifier. */
  id: string;
  /** Accessible label (e.g. "Message", "Remove"). */
  label: string;
  /** Icon element rendered inside the button. */
  icon: React.ReactNode;
  /** Callback when pressed. */
  onPress?: () => void;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props for the FriendListItem component.
 *
 * @remarks
 * Renders a single friend row inside a friend list. Shows the user's avatar,
 * display name, username, online status, optional status text, and trailing
 * action buttons (e.g. Message, More).
 */
export interface FriendListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Display name. */
  name: string;

  /** Username handle (e.g. "@alice"). */
  username?: string;

  /** Avatar element (typically an `<Avatar>` component). */
  avatar?: React.ReactNode;

  /** Online / presence status. @default 'offline' */
  status?: FriendStatus;

  /** Custom status text (e.g. "Playing Valorant"). */
  statusText?: string;

  /** Number of mutual friends. */
  mutualFriends?: number;

  /** Action buttons rendered at the trailing edge. */
  actions?: FriendAction[];

  /** Whether this item is disabled. @default false */
  disabled?: boolean;

  /** Called when the item is pressed. */
  onClick?: (e: React.MouseEvent) => void;

  /** Show loading skeleton. @default false */
  skeleton?: boolean;

  /** Remove border radius for flat list contexts. @default false */
  flat?: boolean;
}
